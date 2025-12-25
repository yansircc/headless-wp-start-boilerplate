/**
 * Static Pages SEO Sync Handler
 *
 * Handles syncing static pages SEO (from Yoast Archive Settings) to KV.
 * This is language-independent and synced once for all locales.
 */

import { StaticPagesSeoDocument } from "@/graphql/seo/static-pages.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { kvPut } from "@/lib/kv/client";
import type { SyncResult } from "../types";

/**
 * Fetch and update static pages SEO
 */
export async function updateStaticPagesSeo(result: SyncResult): Promise<void> {
	try {
		const data = await graphqlRequest(StaticPagesSeoDocument);

		const key = cacheKeys.staticSeo();
		if (await kvPut(key, data.seo)) {
			result.keysUpdated.push(key);
		} else {
			result.errors.push(`Failed to write ${key}`);
		}
	} catch (error) {
		result.errors.push(`Failed to fetch static SEO: ${error}`);
	}
}
