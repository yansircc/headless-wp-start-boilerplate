/**
 * Webhook Endpoint for Cache Revalidation
 *
 * Receives webhook from WordPress (Headless Bridge plugin) when content changes.
 * 1. Invalidates memory cache
 * 2. Fetches fresh data from WordPress
 * 3. Writes to Cloudflare KV
 *
 * POST /api/webhook/revalidate
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import { cache, invalidateByWebhook } from "@/lib/cache";
import { isKVAvailable, syncToKV } from "@/lib/kv";

type WebhookPayload = {
	action:
		| "create"
		| "update"
		| "delete"
		| "trash"
		| "restore"
		| "unpublish"
		| "test";
	post_type: string;
	post_id: number;
	slug: string;
	locale: string;
	timestamp: number;
};

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifySignature(
	payload: string,
	signature: string,
	secret: string
): boolean {
	if (!(secret && signature)) {
		return false;
	}

	const expected = createHmac("sha256", secret).update(payload).digest("hex");

	try {
		return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
	} catch {
		return false;
	}
}

/**
 * Verify timestamp to prevent replay attacks
 */
const MAX_AGE_SECONDS = 60;

function isTimestampValid(timestamp: number): boolean {
	const now = Math.floor(Date.now() / 1000);
	return Math.abs(now - timestamp) <= MAX_AGE_SECONDS;
}

export const Route = createFileRoute("/api/webhook/revalidate")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const secret = env.WEBHOOK_SECRET;

				// Get signature from header
				const signature =
					request.headers.get("X-Headless-Bridge-Signature") ?? "";

				// Read body as text for signature verification
				const bodyText = await request.text();

				// Verify signature
				if (!verifySignature(bodyText, signature, secret)) {
					console.warn("[Webhook] Invalid signature");
					return Response.json(
						{ success: false, error: "Invalid signature" },
						{ status: 401 }
					);
				}

				// Parse payload
				let payload: WebhookPayload;
				try {
					payload = JSON.parse(bodyText);
				} catch {
					return Response.json(
						{ success: false, error: "Invalid JSON" },
						{ status: 400 }
					);
				}

				// Handle test webhook (skip timestamp check)
				if (payload.action === "test") {
					console.log("[Webhook] Test webhook received");
					return Response.json({
						success: true,
						message: "Test webhook received",
						cache_stats: cache.stats(),
						kv_available: isKVAvailable(),
					});
				}

				// Verify timestamp
				if (!isTimestampValid(payload.timestamp)) {
					console.warn("[Webhook] Request expired or invalid timestamp");
					return Response.json(
						{ success: false, error: "Request expired" },
						{ status: 400 }
					);
				}

				// Validate required fields
				if (!(payload.post_type && payload.slug)) {
					return Response.json(
						{ success: false, error: "Missing required fields" },
						{ status: 400 }
					);
				}

				console.log(
					`[Webhook] ${payload.action} ${payload.post_type}:${payload.slug} [${payload.locale}]`
				);

				// 1. Invalidate memory cache
				const memoryResult = invalidateByWebhook(payload);

				// 2. Sync to KV (fetch fresh data and write)
				const kvResult = await syncToKV(payload);

				return Response.json({
					success: kvResult.success,
					action: payload.action,
					post_type: payload.post_type,
					slug: payload.slug,
					locale: payload.locale,
					memory_invalidated: memoryResult.count,
					kv_updated: kvResult.keysUpdated.length,
					kv_deleted: kvResult.keysDeleted.length,
					errors: kvResult.errors.length > 0 ? kvResult.errors : undefined,
				});
			},

			// GET for health check
			GET: () =>
				Response.json({
					status: "ok",
					cache_stats: cache.stats(),
					kv_available: isKVAvailable(),
				}),
		},
	},
});
