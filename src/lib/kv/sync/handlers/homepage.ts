/**
 * Homepage Sync Handler
 *
 * Handles syncing homepage data to KV.
 */

import { QUERY_LIMITS } from "@/graphql/constants";
import { HomepageDataDocument } from "@/graphql/homepage/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageFilter } from "@/lib/i18n/language";
import { kvPut } from "@/lib/kv/client";
import type { SyncResult } from "../types";

/**
 * Fetch and update homepage
 */
export async function updateHomepage(
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
