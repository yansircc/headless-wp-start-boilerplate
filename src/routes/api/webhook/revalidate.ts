/**
 * Webhook Endpoint for Cache Invalidation + KV Refresh
 *
 * Receives webhook notifications from WordPress (Headless Bridge plugin)
 * and invalidates the corresponding cache entries.
 * Also refreshes KV backup data for resilience.
 *
 * POST /api/webhook/revalidate
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import { QUERY_LIMITS } from "@/graphql/constants";
import { HomepageDataDocument } from "@/graphql/homepage/queries.generated";
import {
	GetPostBySlugDocument,
	PostsListDocument,
} from "@/graphql/posts/queries.generated";
import {
	ProductBySlugDocument,
	ProductsListDocument,
} from "@/graphql/products/queries.generated";
import { cache, cacheKeys, invalidateByWebhook } from "@/lib/cache";
import { waitUntil } from "@/lib/cloudflare/context";
import { graphqlRequest } from "@/lib/graphql";
import {
	supportedLocales,
	toLanguageCode,
	toLanguageFilter,
} from "@/lib/i18n/language";
import { isKVAvailable, kvPutWithMetadata } from "@/lib/kv";

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

/**
 * Refresh product data in KV for a specific locale
 */
async function refreshProductsKV(
	locale: string,
	slug: string | undefined
): Promise<void> {
	const language = toLanguageFilter(locale);
	const languageCode = toLanguageCode(locale);

	const products = await graphqlRequest(ProductsListDocument, {
		first: QUERY_LIMITS.list.products,
		language,
	});
	await kvPutWithMetadata(
		cacheKeys.productsList(locale),
		products.products,
		"webhook"
	);

	if (slug) {
		const product = await graphqlRequest(ProductBySlugDocument, {
			slug,
			language: languageCode,
		});
		await kvPutWithMetadata(
			cacheKeys.productBySlug(slug, locale),
			product.product?.translation,
			"webhook"
		);
	}
}

/**
 * Refresh post data in KV for a specific locale
 */
async function refreshPostsKV(
	locale: string,
	slug: string | undefined
): Promise<void> {
	const language = toLanguageFilter(locale);
	const languageCode = toLanguageCode(locale);

	const posts = await graphqlRequest(PostsListDocument, {
		first: QUERY_LIMITS.list.posts,
		language,
	});
	await kvPutWithMetadata(cacheKeys.postsList(locale), posts.posts, "webhook");

	if (slug) {
		const post = await graphqlRequest(GetPostBySlugDocument, {
			id: slug,
			language: languageCode,
		});
		await kvPutWithMetadata(
			cacheKeys.postBySlug(slug, locale),
			post.post?.translation,
			"webhook"
		);
	}
}

/**
 * Refresh homepage data in KV for a specific locale
 */
async function refreshHomepageKV(locale: string): Promise<void> {
	const language = toLanguageFilter(locale);

	const homepage = await graphqlRequest(HomepageDataDocument, {
		language,
		postsFirst: QUERY_LIMITS.homepage.posts,
		productsFirst: QUERY_LIMITS.homepage.products,
	});
	await kvPutWithMetadata(
		cacheKeys.homepage(locale),
		{
			posts: homepage.posts?.nodes || [],
			products: homepage.products?.nodes || [],
			postsHasMore: homepage.posts?.pageInfo?.hasNextPage,
			productsHasMore: homepage.products?.pageInfo?.hasNextPage,
		},
		"webhook"
	);
}

/**
 * Refresh KV backup data for a specific content change
 * Runs in background using waitUntil
 */
async function refreshKVBackup(payload: WebhookPayload): Promise<void> {
	if (!isKVAvailable()) {
		console.log("[Webhook] KV not available, skipping backup refresh");
		return;
	}

	const { post_type, slug } = payload;

	for (const locale of supportedLocales) {
		try {
			if (post_type === "product") {
				await refreshProductsKV(locale, slug);
			}
			if (post_type === "post") {
				await refreshPostsKV(locale, slug);
			}
			await refreshHomepageKV(locale);
		} catch (error) {
			console.error(
				`[Webhook] Failed to refresh KV for locale ${locale}:`,
				error
			);
		}
	}

	console.log("[Webhook] KV backup refresh completed");
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
						kv_available: isKVAvailable(),
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

				// Invalidate memory cache
				const result = invalidateByWebhook(payload);

				// Refresh KV backup in background (non-blocking)
				waitUntil(
					refreshKVBackup(payload).catch((error) => {
						console.error("[Webhook] KV refresh failed:", error);
					})
				);

				return Response.json({
					success: true,
					action: payload.action,
					post_type: payload.post_type,
					post_id: payload.post_id,
					invalidated: result.count,
					kv_refresh: "started",
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
