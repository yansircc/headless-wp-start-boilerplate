/**
 * Webhook Endpoint for Cache Invalidation
 *
 * Receives webhook notifications from WordPress (Headless Bridge plugin)
 * and invalidates the corresponding cache entries.
 *
 * POST /api/webhook/revalidate
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import { cache, invalidateByWebhook } from "@/lib/cache";

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
 * Allows requests within MAX_AGE_SECONDS of current time
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

				// Handle test webhook (skip timestamp check for test)
				if (payload.action === "test") {
					console.log("[Webhook] Test webhook received");
					return Response.json({
						success: true,
						message: "Test webhook received",
						cache_stats: cache.stats(),
					});
				}

				// Verify timestamp to prevent replay attacks
				if (!isTimestampValid(payload.timestamp)) {
					console.warn("[Webhook] Request expired or invalid timestamp");
					return Response.json(
						{ success: false, error: "Request expired" },
						{ status: 400 }
					);
				}

				// Validate required fields
				if (!payload.post_type) {
					return Response.json(
						{ success: false, error: "Missing post_type" },
						{ status: 400 }
					);
				}

				// Invalidate cache
				const result = invalidateByWebhook(payload);

				return Response.json({
					success: true,
					action: payload.action,
					post_type: payload.post_type,
					post_id: payload.post_id,
					invalidated: result.count,
				});
			},

			// GET for health check
			GET: async () =>
				Response.json({
					status: "ok",
					cache_stats: cache.stats(),
				}),
		},
	},
});
