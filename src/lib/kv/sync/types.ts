/**
 * KV Sync Types
 *
 * Type definitions for KV sync operations.
 */

import type { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";

// ============================================
// Result Types
// ============================================

export type SyncResult = {
	success: boolean;
	keysUpdated: string[];
	keysDeleted: string[];
	errors: string[];
};

// ============================================
// Language Types
// ============================================

export type LanguageCode = ReturnType<typeof toLanguageCode>;
export type LanguageFilter = ReturnType<typeof toLanguageFilter>;

// ============================================
// Document Types
// ============================================

export type AnyDocument = unknown;

// ============================================
// Post Type Config
// ============================================

/**
 * Configuration for syncing a post type
 */
export type PostTypeSyncConfig = {
	/** GraphQL document for fetching single item by slug */
	bySlugDocument: AnyDocument;
	/** GraphQL document for fetching list */
	listDocument: AnyDocument;
	/** Build variables for bySlug query */
	buildBySlugVars: (
		slug: string,
		language: LanguageCode
	) => Record<string, unknown>;
	/** Build variables for list query */
	buildListVars: (language: LanguageFilter) => Record<string, unknown>;
	/** Extract single item from response */
	extractSingle: (data: unknown) => unknown | null;
	/** Extract list from response */
	extractList: (data: unknown) => unknown;
	/** Get cache key for single item */
	getCacheKey: (slug: string, locale: string) => string;
	/** Get cache key for list */
	getListCacheKey: (locale: string) => string;
};

// ============================================
// Taxonomy Config
// ============================================

/**
 * Configuration for syncing a taxonomy
 */
export type TaxonomySyncConfig = {
	/** GraphQL document for fetching single term by slug */
	bySlugDocument: AnyDocument;
	/** GraphQL document for fetching list */
	listDocument: AnyDocument;
	/** GraphQL document for fetching content by this taxonomy */
	contentByTaxonomyDocument?: AnyDocument;
	/** Build variables for bySlug query */
	buildBySlugVars: (
		slug: string,
		language: LanguageCode
	) => Record<string, unknown>;
	/** Build variables for list query */
	buildListVars: (language: LanguageFilter) => Record<string, unknown>;
	/** Build variables for content by taxonomy query */
	buildContentByTaxonomyVars?: (
		slug: string,
		language: LanguageFilter | LanguageCode
	) => Record<string, unknown>;
	/** Extract single term from response */
	extractSingle: (data: unknown) => unknown | null;
	/** Extract list from response */
	extractList: (data: unknown) => unknown;
	/** Extract content by taxonomy from response */
	extractContentByTaxonomy?: (data: unknown) => unknown | null;
	/** Get cache key for single term */
	getCacheKey: (slug: string, locale: string) => string;
	/** Get cache key for list */
	getListCacheKey: (locale: string) => string;
	/** Get cache key for content by taxonomy */
	getContentCacheKey?: (slug: string, locale: string) => string;
};
