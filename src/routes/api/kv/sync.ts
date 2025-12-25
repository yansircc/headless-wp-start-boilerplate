/**
 * Full KV Sync Endpoint
 *
 * Syncs all content to Cloudflare KV.
 * Protected by WEBHOOK_SECRET for security.
 *
 * POST /api/kv/sync
 * Header: Authorization: Bearer <WEBHOOK_SECRET>
 */

import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import { QUERY_LIMITS } from "@/graphql/constants";
import { HomepageDataDocument } from "@/graphql/homepage/queries.generated";
import { PostsListDocument } from "@/graphql/posts/queries.generated";
import { ProductsListDocument } from "@/graphql/products/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { supportedLocales, toLanguageFilter } from "@/lib/i18n/language";
import { isKVAvailable, kvPut } from "@/lib/kv";

type SyncResult = {
	success: boolean;
	synced: string[];
	errors: string[];
};

export const Route = createFileRoute("/api/kv/sync")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Verify authorization
				const auth = request.headers.get("Authorization");
				if (auth !== `Bearer ${env.WEBHOOK_SECRET}`) {
					return Response.json(
						{ success: false, error: "Unauthorized" },
						{ status: 401 }
					);
				}

				if (!isKVAvailable()) {
					return Response.json(
						{ success: false, error: "KV not available" },
						{ status: 503 }
					);
				}

				const result: SyncResult = {
					success: true,
					synced: [],
					errors: [],
				};

				// Sync static pages SEO (language-independent, sync once)
				await syncStaticPagesSeo(result);

				// Sync for each locale
				for (const locale of supportedLocales) {
					await syncLocale(locale, result);
				}

				result.success = result.errors.length === 0;

				return Response.json({
					...result,
					total: result.synced.length,
					locales: supportedLocales,
				});
			},

			GET: () =>
				Response.json({
					status: "ok",
					kv_available: isKVAvailable(),
					locales: supportedLocales,
					hint: "POST with Authorization: Bearer <WEBHOOK_SECRET> to sync",
				}),
		},
	},
});

async function syncLocale(locale: string, result: SyncResult): Promise<void> {
	const language = toLanguageFilter(locale);

	// 1. Sync homepage
	try {
		const data = await graphqlRequest(HomepageDataDocument, {
			language,
			postsFirst: QUERY_LIMITS.homepage.posts,
			productsFirst: QUERY_LIMITS.homepage.products,
		});

		const homepage = {
			posts: data.posts?.nodes || [],
			products: data.products?.nodes || [],
			postsHasMore: data.posts?.pageInfo?.hasNextPage,
			productsHasMore: data.products?.pageInfo?.hasNextPage,
		};

		const key = cacheKeys.homepage(locale);
		if (await kvPut(key, homepage)) {
			result.synced.push(key);
		} else {
			result.errors.push(`Failed: ${key}`);
		}
	} catch (e) {
		result.errors.push(`homepage:${locale}: ${e}`);
	}

	// 2. Sync posts list
	try {
		const data = await graphqlRequest(PostsListDocument, {
			first: QUERY_LIMITS.list.posts,
			language,
		});

		const key = cacheKeys.postsList(locale);
		if (await kvPut(key, data.posts)) {
			result.synced.push(key);
		} else {
			result.errors.push(`Failed: ${key}`);
		}
	} catch (e) {
		result.errors.push(`posts:list:${locale}: ${e}`);
	}

	// 3. Sync products list
	try {
		const data = await graphqlRequest(ProductsListDocument, {
			first: QUERY_LIMITS.list.products,
			language,
		});

		const key = cacheKeys.productsList(locale);
		if (await kvPut(key, data.products)) {
			result.synced.push(key);
		} else {
			result.errors.push(`Failed: ${key}`);
		}
	} catch (e) {
		result.errors.push(`products:list:${locale}: ${e}`);
	}
}

/**
 * Sync static pages SEO (language-independent)
 * This data comes from Yoast Archive Settings and is shared across all locales
 */
async function syncStaticPagesSeo(result: SyncResult): Promise<void> {
	const { StaticPagesSeoDocument } = await import(
		"@/graphql/seo/static-pages.generated"
	);

	try {
		const data = await graphqlRequest(StaticPagesSeoDocument);

		const key = cacheKeys.staticSeo();
		if (await kvPut(key, data.seo)) {
			result.synced.push(key);
		} else {
			result.errors.push(`Failed: ${key}`);
		}
	} catch (e) {
		result.errors.push(`seo:static-pages: ${e}`);
	}
}
