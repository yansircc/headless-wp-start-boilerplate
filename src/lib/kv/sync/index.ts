/**
 * KV Sync Module
 *
 * Handles syncing data from WordPress to Cloudflare KV.
 * Uses registry pattern for extensibility - new content types can register
 * their own sync handlers without modifying this file.
 */

import {
	handleDelete,
	handleTaxonomyDelete,
	handleTaxonomyUpdate,
	handleUpdate,
	updateHomepage,
} from "./handlers";
import {
	isTaxonomy,
	postTypeSyncRegistry,
	taxonomySyncRegistry,
} from "./registry";
// Import registrations to auto-register built-in types
import "./registrations";
import type { SyncResult } from "./types";

// ============================================
// Re-exports
// ============================================

export { registerPostTypeSync, registerTaxonomySync } from "./registry";
export type {
	PostTypeSyncConfig,
	SyncResult,
	TaxonomySyncConfig,
} from "./types";

// ============================================
// Main Sync Function
// ============================================

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

	// Handle taxonomy types
	if (isTaxonomy(post_type)) {
		const config = taxonomySyncRegistry.get(post_type);
		if (!config) {
			result.errors.push(`Unknown taxonomy type: ${post_type}`);
			result.success = false;
			return result;
		}

		if (action === "delete" || action === "trash") {
			return await handleTaxonomyDelete(config, slug, locale, result);
		}
		return await handleTaxonomyUpdate(config, slug, locale, result);
	}

	// Handle post types
	const config = postTypeSyncRegistry.get(post_type);
	if (!config) {
		// Unknown post type - log warning but don't fail
		console.warn(`[KV Sync] Unknown post_type: ${post_type}. Skipping sync.`);
		result.errors.push(`Unknown post_type: ${post_type}`);
		// Still update homepage as it may contain mixed content
		await updateHomepage(locale, result);
		result.success = result.errors.length === 0;
		return result;
	}

	if (action === "delete" || action === "trash" || action === "unpublish") {
		return await handleDelete(config, slug, locale, result);
	}

	return await handleUpdate(config, slug, locale, result);
}
