/**
 * KV Sync Module
 *
 * Handles syncing data from WordPress to Cloudflare KV.
 * Uses registry pattern for extensibility - new content types can register
 * their own sync handlers without modifying this file.
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
import {
	CategoriesListDocument,
	CategoryBySlugDocument,
	PostsByCategoryDocument,
	PostsByTagDocument,
	ProductCategoriesListDocument,
	ProductCategoryBySlugDocument,
	ProductsByCategoryDocument,
	TagBySlugDocument,
	TagsListDocument,
} from "@/graphql/taxonomies/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvDelete, kvPut } from "@/lib/kv";

// ============================================
// Types
// ============================================

type SyncResult = {
	success: boolean;
	keysUpdated: string[];
	keysDeleted: string[];
	errors: string[];
};

type LanguageCode = ReturnType<typeof toLanguageCode>;
type LanguageFilter = ReturnType<typeof toLanguageFilter>;

type AnyDocument = unknown;

/**
 * Type-unsafe graphql request for registry pattern
 * The types are validated at registration time, so this is safe
 */
function execGraphQL(
	document: AnyDocument,
	variables: Record<string, unknown>
): Promise<unknown> {
	// biome-ignore lint/suspicious/noExplicitAny: Registry pattern requires dynamic types
	return graphqlRequest(document as any, variables as any);
}

/**
 * Configuration for syncing a post type
 */
type PostTypeSyncConfig = {
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

/**
 * Configuration for syncing a taxonomy
 */
type TaxonomySyncConfig = {
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

// ============================================
// Registries
// ============================================

const postTypeSyncRegistry = new Map<string, PostTypeSyncConfig>();
const taxonomySyncRegistry = new Map<string, TaxonomySyncConfig>();

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
function isTaxonomy(postType: string): boolean {
	return taxonomySyncRegistry.has(postType);
}

// ============================================
// Register Built-in Types
// ============================================

// Posts
registerPostTypeSync("post", {
	bySlugDocument: GetPostBySlugDocument,
	listDocument: PostsListDocument,
	buildBySlugVars: (slug, language) => ({ id: slug, language }),
	buildListVars: (language) => ({ first: QUERY_LIMITS.list.posts, language }),
	extractSingle: (data) =>
		(data as { post?: { translation?: unknown } }).post?.translation ?? null,
	extractList: (data) => (data as { posts?: unknown }).posts,
	getCacheKey: (slug, locale) => cacheKeys.postBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.postsList(locale),
});

// Products
registerPostTypeSync("product", {
	bySlugDocument: ProductBySlugDocument,
	listDocument: ProductsListDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({
		first: QUERY_LIMITS.list.products,
		language,
	}),
	extractSingle: (data) =>
		(data as { product?: { translation?: unknown } }).product?.translation ??
		null,
	extractList: (data) => (data as { products?: unknown }).products,
	getCacheKey: (slug, locale) => cacheKeys.productBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.productsList(locale),
});

// Categories (Post Categories)
registerTaxonomySync("category", {
	bySlugDocument: CategoryBySlugDocument,
	listDocument: CategoriesListDocument,
	contentByTaxonomyDocument: PostsByCategoryDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({
		first: QUERY_LIMITS.list.categories,
		language,
	}),
	buildContentByTaxonomyVars: (slug, language) => ({
		categorySlug: slug,
		first: QUERY_LIMITS.taxonomy.postsPerCategory,
		language,
	}),
	extractSingle: (data) =>
		(data as { category?: { translation?: unknown } }).category?.translation ??
		null,
	extractList: (data) => (data as { categories?: unknown }).categories,
	extractContentByTaxonomy: (data) =>
		(data as { posts?: unknown }).posts ?? null,
	getCacheKey: (slug, locale) => cacheKeys.categoryBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.categoriesList(locale),
	getContentCacheKey: (slug, locale) => cacheKeys.postsByCategory(slug, locale),
});

// Tags (Post Tags)
registerTaxonomySync("post_tag", {
	bySlugDocument: TagBySlugDocument,
	listDocument: TagsListDocument,
	contentByTaxonomyDocument: PostsByTagDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({ first: QUERY_LIMITS.list.tags, language }),
	buildContentByTaxonomyVars: (slug, language) => ({
		tagSlug: slug,
		first: QUERY_LIMITS.taxonomy.postsPerTag,
		language,
	}),
	extractSingle: (data) =>
		(data as { tag?: { translation?: unknown } }).tag?.translation ?? null,
	extractList: (data) => (data as { tags?: unknown }).tags,
	extractContentByTaxonomy: (data) =>
		(data as { posts?: unknown }).posts ?? null,
	getCacheKey: (slug, locale) => cacheKeys.tagBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.tagsList(locale),
	getContentCacheKey: (slug, locale) => cacheKeys.postsByTag(slug, locale),
});

// Product Categories
registerTaxonomySync("product-category", {
	bySlugDocument: ProductCategoryBySlugDocument,
	listDocument: ProductCategoriesListDocument,
	contentByTaxonomyDocument: ProductsByCategoryDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({
		first: QUERY_LIMITS.list.productCategories,
		language,
	}),
	buildContentByTaxonomyVars: (slug, language) => ({
		categorySlug: slug,
		first: QUERY_LIMITS.taxonomy.productsPerCategory,
		language, // Uses LanguageCode for this query
	}),
	extractSingle: (data) =>
		(data as { productCategory?: { translation?: unknown } }).productCategory
			?.translation ?? null,
	extractList: (data) =>
		(data as { productCategories?: unknown }).productCategories,
	extractContentByTaxonomy: (data) =>
		(data as { productCategory?: { translation?: { products?: unknown } } })
			.productCategory?.translation?.products ?? null,
	getCacheKey: (slug, locale) => cacheKeys.productCategoryBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.productCategoriesList(locale),
	getContentCacheKey: (slug, locale) =>
		cacheKeys.productsByCategory(slug, locale),
});

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

// ============================================
// Post Type Sync Handlers
// ============================================

/**
 * Handle delete/trash/unpublish - remove from KV and update lists
 */
async function handleDelete(
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
async function handleUpdate(
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

// ============================================
// Taxonomy Sync Handlers
// ============================================

/**
 * Handle taxonomy delete - remove from KV and update lists
 */
async function handleTaxonomyDelete(
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
async function handleTaxonomyUpdate(
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
