/**
 * Taxonomy Sync Handlers
 *
 * Handles syncing taxonomies (category, tag, product-category) to KV.
 */

import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvDelete, kvPut } from "@/lib/kv/client";
import type { SyncResult, TaxonomySyncConfig } from "../types";
import { execGraphQL } from "./post-type";

/**
 * Handle taxonomy delete - remove from KV and update lists
 */
export async function handleTaxonomyDelete(
	config: TaxonomySyncConfig,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<SyncResult> {
	// Delete single taxonomy term
	const singleKey = config.getCacheKey(slug, locale);
	if (await kvDelete(singleKey)) {
		result.keysDeleted.push(singleKey);
	}

	// Update taxonomy list
	await updateTaxonomyList(config, locale, result);

	result.success = result.errors.length === 0;
	return result;
}

/**
 * Handle taxonomy create/update
 */
export async function handleTaxonomyUpdate(
	config: TaxonomySyncConfig,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<SyncResult> {
	// Update single taxonomy term
	await updateTaxonomyTerm(config, slug, locale, result);

	// Update taxonomy list
	await updateTaxonomyList(config, locale, result);

	// Update content by this taxonomy (posts/products in this category/tag)
	if (config.contentByTaxonomyDocument) {
		await updateContentByTaxonomy(config, slug, locale, result);
	}

	result.success = result.errors.length === 0;
	return result;
}

/**
 * Fetch and update single taxonomy term using config
 */
async function updateTaxonomyTerm(
	config: TaxonomySyncConfig,
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
		const term = config.extractSingle(data);

		if (term) {
			const key = config.getCacheKey(slug, locale);
			if (await kvPut(key, term)) {
				result.keysUpdated.push(key);
			} else {
				result.errors.push(`Failed to write ${key}`);
			}
		}
	} catch (error) {
		result.errors.push(`Failed to fetch taxonomy term:${slug}: ${error}`);
	}
}

/**
 * Fetch and update taxonomy list using config
 */
async function updateTaxonomyList(
	config: TaxonomySyncConfig,
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
		result.errors.push(`Failed to fetch taxonomy list: ${error}`);
	}
}

/**
 * Fetch and update content filtered by taxonomy using config
 */
async function updateContentByTaxonomy(
	config: TaxonomySyncConfig,
	slug: string,
	locale: string,
	result: SyncResult
): Promise<void> {
	if (
		!(
			config.contentByTaxonomyDocument &&
			config.buildContentByTaxonomyVars &&
			config.extractContentByTaxonomy &&
			config.getContentCacheKey
		)
	) {
		return;
	}

	// Some queries use LanguageFilter, some use LanguageCode
	// We pass LanguageFilter by default, the config can use either
	const language = toLanguageFilter(locale);

	try {
		const data = await execGraphQL(
			config.contentByTaxonomyDocument,
			config.buildContentByTaxonomyVars(slug, language)
		);
		const content = config.extractContentByTaxonomy(data);

		if (content) {
			const key = config.getContentCacheKey(slug, locale);
			if (await kvPut(key, content)) {
				result.keysUpdated.push(key);
			} else {
				result.errors.push(`Failed to write ${key}`);
			}
		}
	} catch (error) {
		result.errors.push(`Failed to fetch content by taxonomy:${slug}: ${error}`);
	}
}
