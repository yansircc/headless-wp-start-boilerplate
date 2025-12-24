/**
 * KV Sync Module
 *
 * Handles syncing data from WordPress to Cloudflare KV.
 * Uses the same GraphQL queries as the frontend services.
 */

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
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvDelete, kvPut } from "@/lib/kv";

type SyncResult = {
	success: boolean;
	keysUpdated: string[];
	keysDeleted: string[];
	errors: string[];
};

/**
 * Sync data to KV based on webhook payload
 */
export async function syncToKV(payload: {
	action: string;
	post_type: string;
	post_id: number;
	slug: string;
	locale: string;
}): Promise<SyncResult> {
	const { action, post_type, slug, locale } = payload;
	const result: SyncResult = {
		success: true,
		keysUpdated: [],
		keysDeleted: [],
		errors: [],
	};

	// Handle delete actions
	if (action === "delete" || action === "trash" || action === "unpublish") {
		return await handleDelete(post_type, slug, locale, result);
	}

	// Handle create/update actions
	return await handleUpdate(post_type, slug, locale, result);
}

/**
 * Handle delete/trash/unpublish - remove from KV and update lists
 */
async function handleDelete(
	post_type: string,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<SyncResult> {
	// Delete single item
	const singleKey =
		post_type === "product"
			? cacheKeys.productBySlug(slug, locale)
			: cacheKeys.postBySlug(slug, locale);

	if (await kvDelete(singleKey)) {
		result.keysDeleted.push(singleKey);
	} else {
		result.errors.push(`Failed to delete ${singleKey}`);
	}

	// Update list (without the deleted item)
	await updateList(post_type, locale, result);

	// Update homepage
	await updateHomepage(locale, result);

	result.success = result.errors.length === 0;
	return result;
}

/**
 * Handle create/update - fetch fresh data and write to KV
 */
async function handleUpdate(
	post_type: string,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<SyncResult> {
	// Update single item
	await updateSingle(post_type, slug, locale, result);

	// Update list
	await updateList(post_type, locale, result);

	// Update homepage
	await updateHomepage(locale, result);

	result.success = result.errors.length === 0;
	return result;
}

/**
 * Fetch and update single post/product
 */
async function updateSingle(
	post_type: string,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<void> {
	const language = toLanguageCode(locale);

	try {
		if (post_type === "product") {
			const data = await graphqlRequest(ProductBySlugDocument, {
				slug,
				language,
			});
			const product = data.product?.translation;

			if (product) {
				const key = cacheKeys.productBySlug(slug, locale);
				if (await kvPut(key, product)) {
					result.keysUpdated.push(key);
				} else {
					result.errors.push(`Failed to write ${key}`);
				}
			}
		} else {
			const data = await graphqlRequest(GetPostBySlugDocument, {
				id: slug,
				language,
			});
			const post = data.post?.translation;

			if (post) {
				const key = cacheKeys.postBySlug(slug, locale);
				if (await kvPut(key, post)) {
					result.keysUpdated.push(key);
				} else {
					result.errors.push(`Failed to write ${key}`);
				}
			}
		}
	} catch (error) {
		result.errors.push(`Failed to fetch ${post_type}:${slug}: ${error}`);
	}
}

/**
 * Fetch and update list
 */
async function updateList(
	post_type: string,
	locale: string,
	result: SyncResult
): Promise<void> {
	const language = toLanguageFilter(locale);

	try {
		if (post_type === "product") {
			const data = await graphqlRequest(ProductsListDocument, {
				first: QUERY_LIMITS.list.products,
				language,
			});

			const key = cacheKeys.productsList(locale);
			if (await kvPut(key, data.products)) {
				result.keysUpdated.push(key);
			} else {
				result.errors.push(`Failed to write ${key}`);
			}
		} else {
			const data = await graphqlRequest(PostsListDocument, {
				first: QUERY_LIMITS.list.posts,
				language,
			});

			const key = cacheKeys.postsList(locale);
			if (await kvPut(key, data.posts)) {
				result.keysUpdated.push(key);
			} else {
				result.errors.push(`Failed to write ${key}`);
			}
		}
	} catch (error) {
		result.errors.push(`Failed to fetch ${post_type} list: ${error}`);
	}
}

/**
 * Fetch and update homepage
 */
async function updateHomepage(
	locale: string,
	result: SyncResult
): Promise<void> {
	const language = toLanguageFilter(locale);

	try {
		const data = await graphqlRequest(HomepageDataDocument, {
			language,
			postsFirst: QUERY_LIMITS.homepage.posts,
			productsFirst: QUERY_LIMITS.homepage.products,
		});

		// Transform to expected format
		const homepage = {
			posts: data.posts?.nodes || [],
			products: data.products?.nodes || [],
			postsHasMore: data.posts?.pageInfo?.hasNextPage,
			productsHasMore: data.products?.pageInfo?.hasNextPage,
		};

		const key = cacheKeys.homepage(locale);
		if (await kvPut(key, homepage)) {
			result.keysUpdated.push(key);
		} else {
			result.errors.push(`Failed to write ${key}`);
		}
	} catch (error) {
		result.errors.push(`Failed to fetch homepage: ${error}`);
	}
}
