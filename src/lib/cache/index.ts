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
 * Cache key generators
 */
export const cacheKeys = {
	// Products
	productsList: () => "products:list",
	productBySlug: (slug: string) => `products:slug:${slug}`,
	productById: (id: number) => `products:id:${id}`,

	// Posts
	postsList: () => "posts:list",
	postBySlug: (slug: string) => `posts:slug:${slug}`,
	postById: (id: number) => `posts:id:${id}`,

	// Homepage
	homepage: () => "homepage:data",
};

/**
 * Invalidate cache based on webhook payload
 */
export function invalidateByWebhook(payload: {
	action: string;
	post_type: string;
	post_id: number;
	slug: string;
}): { invalidated: string[]; count: number } {
	const { post_type, post_id, slug } = payload;
	const invalidated: string[] = [];

	// Collect keys to invalidate based on post_type
	if (post_type === "product") {
		if (slug) {
			invalidated.push(cacheKeys.productBySlug(slug));
		}
		if (post_id) {
			invalidated.push(cacheKeys.productById(post_id));
		}
		invalidated.push(cacheKeys.productsList());
	}

	if (post_type === "post") {
		if (slug) {
			invalidated.push(cacheKeys.postBySlug(slug));
		}
		if (post_id) {
			invalidated.push(cacheKeys.postById(post_id));
		}
		invalidated.push(cacheKeys.postsList());
	}

	// Homepage might show latest posts/products
	invalidated.push(cacheKeys.homepage());

	// Delete all targeted keys
	for (const key of invalidated) {
		cache.delete(key);
	}

	return { invalidated, count: invalidated.length };
}
