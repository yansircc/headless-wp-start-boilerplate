/**
 * KV Sync Registry
 *
 * Registry pattern for extensibility - new content types can register
 * their own sync handlers without modifying core files.
 */

import type { PostTypeSyncConfig, TaxonomySyncConfig } from "./types";

// ============================================
// Registries
// ============================================

export const postTypeSyncRegistry = new Map<string, PostTypeSyncConfig>();
export const taxonomySyncRegistry = new Map<string, TaxonomySyncConfig>();

// ============================================
// Register Functions
// ============================================

/**
 * Register a post type for KV sync
 * @example
 * registerPostTypeSync("event", {
 *   bySlugDocument: EventBySlugDocument,
 *   listDocument: EventsListDocument,
 *   // ...
 * });
 */
export function registerPostTypeSync(
	postType: string,
	config: PostTypeSyncConfig
): void {
	postTypeSyncRegistry.set(postType, config);
}

/**
 * Register a taxonomy for KV sync
 * @example
 * registerTaxonomySync("event-category", {
 *   bySlugDocument: EventCategoryBySlugDocument,
 *   listDocument: EventCategoriesListDocument,
 *   // ...
 * });
 */
export function registerTaxonomySync(
	taxonomyType: string,
	config: TaxonomySyncConfig
): void {
	taxonomySyncRegistry.set(taxonomyType, config);
}

/**
 * Check if post_type is a registered taxonomy
 */
export function isTaxonomy(postType: string): boolean {
	return taxonomySyncRegistry.has(postType);
}
