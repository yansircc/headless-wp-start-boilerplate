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
 * Cache key generators
 * All keys include locale for multi-language support
 * When locale is undefined, uses DEFAULT_LOCALE to ensure key consistency
 */
export const cacheKeys = {
	// Products
	productsList: (locale?: string) =>
		`products:list:${locale ?? DEFAULT_LOCALE}`,
	productBySlug: (slug: string, locale?: string) =>
		`products:slug:${slug}:${locale ?? DEFAULT_LOCALE}`,
	productById: (id: number, locale?: string) =>
		`products:id:${id}:${locale ?? DEFAULT_LOCALE}`,

	// Posts
	postsList: (locale?: string) => `posts:list:${locale ?? DEFAULT_LOCALE}`,
	postBySlug: (slug: string, locale?: string) =>
		`posts:slug:${slug}:${locale ?? DEFAULT_LOCALE}`,
	postById: (id: number, locale?: string) =>
		`posts:id:${id}:${locale ?? DEFAULT_LOCALE}`,

	// Homepage
	homepage: (locale?: string) => `homepage:data:${locale ?? DEFAULT_LOCALE}`,
};

/**
 * Invalidate cache based on webhook payload
 * Clears cache for all language versions since webhook doesn't include locale
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

	// Collect keys to invalidate based on post_type
	if (post_type === "product") {
		// Invalidate all product keys matching slug/id pattern across all locales
		if (slug) {
			const pattern = `products:slug:${slug}`;
			invalidated.push(...allKeys.filter((k) => k.startsWith(pattern)));
		}
		if (post_id) {
			const pattern = `products:id:${post_id}`;
			invalidated.push(...allKeys.filter((k) => k.startsWith(pattern)));
		}
		// Invalidate all product list caches
		invalidated.push(...allKeys.filter((k) => k.startsWith("products:list")));
	}

	if (post_type === "post") {
		// Invalidate all post keys matching slug/id pattern across all locales
		if (slug) {
			const pattern = `posts:slug:${slug}`;
			invalidated.push(...allKeys.filter((k) => k.startsWith(pattern)));
		}
		if (post_id) {
			const pattern = `posts:id:${post_id}`;
			invalidated.push(...allKeys.filter((k) => k.startsWith(pattern)));
		}
		// Invalidate all post list caches
		invalidated.push(...allKeys.filter((k) => k.startsWith("posts:list")));
	}

	// Homepage caches for all locales
	invalidated.push(...allKeys.filter((k) => k.startsWith("homepage:data")));

	// Delete all targeted keys (deduplicated)
	const uniqueKeys = [...new Set(invalidated)];
	for (const key of uniqueKeys) {
		cache.delete(key);
	}

	return { invalidated: uniqueKeys, count: uniqueKeys.length };
}
