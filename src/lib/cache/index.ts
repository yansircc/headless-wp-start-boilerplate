/**
 * Server-side Memory Cache
 *
 * Simple in-memory cache for GraphQL responses.
 * Cache is invalidated via webhook when WordPress content changes.
 */

type CacheEntry<T> = {
	data: T;
	timestamp: number;
	ttl: number;
};

class MemoryCache {
	private readonly cache = new Map<string, CacheEntry<unknown>>();
	private readonly defaultTTL = 1000 * 60 * 60; // 1 hour default

	/**
	 * Get cached value
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;

		if (!entry) {
			return null;
		}

		// Check if expired
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Set cache value
	 */
	set<T>(key: string, data: T, ttl?: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttl ?? this.defaultTTL,
		});
	}

	/**
	 * Delete specific key
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Check if key exists
	 */
	has(key: string): boolean {
		return this.cache.has(key);
	}

	/**
	 * Clear all cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache stats
	 */
	stats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: [...this.cache.keys()],
		};
	}
}

// Singleton instance
export const cache = new MemoryCache();

/**
 * Default locale for cache keys
 * When locale is not provided, use default to ensure consistent keys
 */
const DEFAULT_LOCALE = "en";

/**
 * Generic cache key generators
 * Use these for any content type without hardcoding
 */
export const cacheKeys = {
	// ============================================
	// Generic methods (use for any content type)
	// ============================================

	/**
	 * Generic list key: `{contentType}:list:{locale}`
	 * @example cacheKeys.list("products", "en") → "products:list:en"
	 * @example cacheKeys.list("events", "zh") → "events:list:zh"
	 */
	list: (contentType: string, locale?: string) =>
		`${contentType}:list:${locale ?? DEFAULT_LOCALE}`,

	/**
	 * Generic bySlug key: `{contentType}:slug:{slug}:{locale}`
	 * @example cacheKeys.bySlug("products", "my-product", "en") → "products:slug:my-product:en"
	 */
	bySlug: (contentType: string, slug: string, locale?: string) =>
		`${contentType}:slug:${slug}:${locale ?? DEFAULT_LOCALE}`,

	/**
	 * Generic byId key: `{contentType}:id:{id}:{locale}`
	 * @example cacheKeys.byId("products", 123, "en") → "products:id:123:en"
	 */
	byId: (contentType: string, id: number, locale?: string) =>
		`${contentType}:id:${id}:${locale ?? DEFAULT_LOCALE}`,

	/**
	 * Generic taxonomy relation key: `{contentType}:{taxonomyType}:{taxonomySlug}:{locale}`
	 * @example cacheKeys.byTaxonomy("posts", "category", "news", "en") → "posts:category:news:en"
	 * @example cacheKeys.byTaxonomy("products", "category", "electronics", "zh") → "products:category:electronics:zh"
	 */
	byTaxonomy: (
		contentType: string,
		taxonomyType: string,
		taxonomySlug: string,
		locale?: string
	) =>
		`${contentType}:${taxonomyType}:${taxonomySlug}:${locale ?? DEFAULT_LOCALE}`,

	/**
	 * Generic page/singleton key: `{name}:data:{locale}`
	 * @example cacheKeys.page("homepage", "en") → "homepage:data:en"
	 */
	page: (name: string, locale?: string) =>
		`${name}:data:${locale ?? DEFAULT_LOCALE}`,

	// ============================================
	// Backward-compatible shortcuts
	// ============================================

	// Products
	productsList: (locale?: string) => cacheKeys.list("products", locale),
	productBySlug: (slug: string, locale?: string) =>
		cacheKeys.bySlug("products", slug, locale),
	productById: (id: number, locale?: string) =>
		cacheKeys.byId("products", id, locale),

	// Posts
	postsList: (locale?: string) => cacheKeys.list("posts", locale),
	postBySlug: (slug: string, locale?: string) =>
		cacheKeys.bySlug("posts", slug, locale),
	postById: (id: number, locale?: string) =>
		cacheKeys.byId("posts", id, locale),

	// Homepage
	homepage: (locale?: string) => cacheKeys.page("homepage", locale),

	// Static Pages SEO (from Yoast Archive Settings, language-independent)
	staticSeo: () => "seo:static-pages",

	// Post Categories
	categoriesList: (locale?: string) => cacheKeys.list("categories", locale),
	categoryBySlug: (slug: string, locale?: string) =>
		cacheKeys.bySlug("categories", slug, locale),
	postsByCategory: (categorySlug: string, locale?: string) =>
		cacheKeys.byTaxonomy("posts", "category", categorySlug, locale),

	// Post Tags
	tagsList: (locale?: string) => cacheKeys.list("tags", locale),
	tagBySlug: (slug: string, locale?: string) =>
		cacheKeys.bySlug("tags", slug, locale),
	postsByTag: (tagSlug: string, locale?: string) =>
		cacheKeys.byTaxonomy("posts", "tag", tagSlug, locale),

	// Product Categories
	productCategoriesList: (locale?: string) =>
		cacheKeys.list("product-categories", locale),
	productCategoryBySlug: (slug: string, locale?: string) =>
		cacheKeys.bySlug("product-categories", slug, locale),
	productsByCategory: (categorySlug: string, locale?: string) =>
		cacheKeys.byTaxonomy("products", "category", categorySlug, locale),
};

/**
 * Map WordPress post_type to cache key prefix
 * Handles singular → plural and special naming conventions
 */
const postTypeToCachePrefix: Record<string, string> = {
	// Post types (singular → plural)
	product: "products",
	post: "posts",
	page: "pages",
	// WordPress built-in taxonomies
	category: "categories",
	post_tag: "tags",
	// Custom taxonomies (keep as-is if already hyphenated)
	"product-category": "product-categories",
};

/**
 * Map taxonomy post_type to the content type it affects
 * When a taxonomy changes, we need to invalidate related content
 */
const taxonomyToContentType: Record<
	string,
	{ contentType: string; taxonomyKey: string }
> = {
	category: { contentType: "posts", taxonomyKey: "category" },
	post_tag: { contentType: "posts", taxonomyKey: "tag" },
	"product-category": { contentType: "products", taxonomyKey: "category" },
};

/**
 * Get cache prefix for a post_type
 * Falls back to pluralizing by adding 's' if not in mapping
 */
function getCachePrefix(postType: string): string {
	if (postTypeToCachePrefix[postType]) {
		return postTypeToCachePrefix[postType];
	}
	// Default: add 's' for pluralization (e.g., "event" → "events")
	return `${postType}s`;
}

/**
 * Invalidate cache based on webhook payload
 * Supports any post_type dynamically without hardcoding
 */
export function invalidateByWebhook(payload: {
	action: string;
	post_type: string;
	post_id: number;
	slug: string;
}): { invalidated: string[]; count: number } {
	const { post_type, post_id, slug } = payload;
	const invalidated: string[] = [];

	// Get all current cache keys to find matching patterns
	const { keys: allKeys } = cache.stats();

	const cachePrefix = getCachePrefix(post_type);

	// Check if this is a taxonomy
	const taxonomyInfo = taxonomyToContentType[post_type];

	if (taxonomyInfo) {
		// Handle taxonomy invalidation
		const { contentType, taxonomyKey } = taxonomyInfo;

		// Invalidate taxonomy item by slug
		if (slug) {
			invalidated.push(
				...allKeys.filter((k) => k.startsWith(`${cachePrefix}:slug:${slug}`))
			);
		}

		// Invalidate taxonomy list
		invalidated.push(
			...allKeys.filter((k) => k.startsWith(`${cachePrefix}:list`))
		);

		// Invalidate related content (e.g., posts by category)
		invalidated.push(
			...allKeys.filter((k) => k.startsWith(`${contentType}:${taxonomyKey}`))
		);
	} else {
		// Handle regular post type invalidation
		if (slug) {
			invalidated.push(
				...allKeys.filter((k) => k.startsWith(`${cachePrefix}:slug:${slug}`))
			);
		}
		if (post_id) {
			invalidated.push(
				...allKeys.filter((k) => k.startsWith(`${cachePrefix}:id:${post_id}`))
			);
		}
		// Invalidate list cache
		invalidated.push(
			...allKeys.filter((k) => k.startsWith(`${cachePrefix}:list`))
		);
	}

	// Always invalidate homepage (contains mixed content)
	invalidated.push(...allKeys.filter((k) => k.startsWith("homepage:data")));

	// Delete all targeted keys (deduplicated)
	const uniqueKeys = [...new Set(invalidated)];
	for (const key of uniqueKeys) {
		cache.delete(key);
	}

	return { invalidated: uniqueKeys, count: uniqueKeys.length };
}

/**
 * Register a new post type for cache invalidation
 * Use this when adding a new custom post type
 * @example registerPostType("event", "events")
 */
export function registerPostType(postType: string, cachePrefix: string): void {
	postTypeToCachePrefix[postType] = cachePrefix;
}

/**
 * Register a new taxonomy for cache invalidation
 * Use this when adding a new custom taxonomy
 * @example registerTaxonomy("event-category", { contentType: "events", taxonomyKey: "category" })
 */
export function registerTaxonomy(
	taxonomyPostType: string,
	config: { contentType: string; taxonomyKey: string; cachePrefix?: string }
): void {
	taxonomyToContentType[taxonomyPostType] = {
		contentType: config.contentType,
		taxonomyKey: config.taxonomyKey,
	};
	// Also register the cache prefix
	if (config.cachePrefix) {
		postTypeToCachePrefix[taxonomyPostType] = config.cachePrefix;
	}
}
