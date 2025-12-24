/**
 * Post Type Sync Handlers
 *
 * Handles syncing post types (post, product, etc.) to KV.
 */

import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvDelete, kvPut } from "@/lib/kv/client";
import type { AnyDocument, PostTypeSyncConfig, SyncResult } from "../types";
import { updateHomepage } from "./homepage";

/**
 * Type-unsafe graphql request for registry pattern
 * The types are validated at registration time, so this is safe
 */
export function execGraphQL(
	document: AnyDocument,
	variables: Record<string, unknown>
): Promise<unknown> {
	// biome-ignore lint/suspicious/noExplicitAny: Registry pattern requires dynamic types
	return graphqlRequest(document as any, variables as any);
}

/**
 * Handle delete/trash/unpublish - remove from KV and update lists
 */
export async function handleDelete(
	config: PostTypeSyncConfig,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<SyncResult> {
	// Delete single item
	const singleKey = config.getCacheKey(slug, locale);
	if (await kvDelete(singleKey)) {
		result.keysDeleted.push(singleKey);
	} else {
		result.errors.push(`Failed to delete ${singleKey}`);
	}

	// Update list (without the deleted item)
	await updateList(config, locale, result);

	// Update homepage
	await updateHomepage(locale, result);

	result.success = result.errors.length === 0;
	return result;
}

/**
 * Handle create/update - fetch fresh data and write to KV
 */
export async function handleUpdate(
	config: PostTypeSyncConfig,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<SyncResult> {
	// Update single item
	await updateSingle(config, slug, locale, result);

	// Update list
	await updateList(config, locale, result);

	// Update homepage
	await updateHomepage(locale, result);

	result.success = result.errors.length === 0;
	return result;
}

/**
 * Fetch and update single post/product using config
 */
async function updateSingle(
	config: PostTypeSyncConfig,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<void> {
	const language = toLanguageCode(locale);

	try {
		const data = await execGraphQL(
			config.bySlugDocument,
			config.buildBySlugVars(slug, language)
		);
		const item = config.extractSingle(data);

		if (item) {
			const key = config.getCacheKey(slug, locale);
			if (await kvPut(key, item)) {
				result.keysUpdated.push(key);
			} else {
				result.errors.push(`Failed to write ${key}`);
			}
		}
	} catch (error) {
		result.errors.push(`Failed to fetch item:${slug}: ${error}`);
	}
}

/**
 * Fetch and update list using config
 */
async function updateList(
	config: PostTypeSyncConfig,
	locale: string,
	result: SyncResult
): Promise<void> {
	const language = toLanguageFilter(locale);

	try {
		const data = await execGraphQL(
			config.listDocument,
			config.buildListVars(language)
		);
		const list = config.extractList(data);

		const key = config.getListCacheKey(locale);
		if (await kvPut(key, list)) {
			result.keysUpdated.push(key);
		} else {
			result.errors.push(`Failed to write ${key}`);
		}
	} catch (error) {
		result.errors.push(`Failed to fetch list: ${error}`);
	}
}
