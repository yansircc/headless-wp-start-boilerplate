/**
 * KV-First Fetch
 *
 * Simple read-through cache pattern:
 * 1. Memory cache → return immediately if hit
 * 2. KV → return if hit (store in memory for next request)
 * 3. WordPress → return (store in memory cache only)
 *
 * KV is populated by the webhook handler when WordPress content changes.
 */

import { cache } from "@/lib/cache";
import { isKVAvailable, kvGetWithMetadata } from "@/lib/kv";

/**
 * Options for kvFirstFetch
 */
export type KVFirstOptions = {
	/**
	 * Timeout for WordPress fetch in milliseconds
	 * Default: 5000 (5 seconds)
	 */
	fetchTimeout?: number;
};

/**
 * Result of kvFirstFetch
 */
export type KVFirstResult<T> = {
	/** The fetched data */
	data: T;
	/** Whether the data is from cache (KV/memory) vs fresh from WordPress */
	isStale: boolean;
	/** Age of the data in milliseconds (0 if fresh from WordPress) */
	age: number;
	/** Data source: 'memory', 'kv', or 'origin' (WordPress) */
	source: "memory" | "kv" | "origin";
};

const DEFAULT_FETCH_TIMEOUT = 5000; // 5 seconds

/**
 * Fetch with KV-first pattern
 *
 * @param cacheKey - The cache key for memory and KV lookup
 * @param fetchFn - Function to fetch fresh data from WordPress (fallback)
 * @param options - Optional configuration
 * @returns Data with source metadata
 */
export async function kvFirstFetch<T>(
	cacheKey: string,
	fetchFn: () => Promise<T>,
	options: KVFirstOptions = {}
): Promise<KVFirstResult<T>> {
	const { fetchTimeout = DEFAULT_FETCH_TIMEOUT } = options;

	// 1. Check memory cache first (fastest, ~1ms)
	const memoryData = cache.get<T>(cacheKey);
	if (memoryData !== null) {
		return {
			data: memoryData,
			isStale: false,
			age: 0,
			source: "memory",
		};
	}

	// 2. Check KV (fast, ~50ms)
	if (isKVAvailable()) {
		const kvEntry = await kvGetWithMetadata<T>(cacheKey);

		if (kvEntry) {
			const age = Date.now() - kvEntry.meta.updatedAt;

			// Store in memory cache for subsequent requests
			cache.set(cacheKey, kvEntry.data);

			return {
				data: kvEntry.data,
				isStale: true,
				age,
				source: "kv",
			};
		}
	}

	// 3. Fallback: Fetch from WordPress (blocking)
	const freshData = await fetchWithTimeout(fetchFn, fetchTimeout);

	// Store in memory cache only (KV is updated via webhook)
	cache.set(cacheKey, freshData);

	return {
		data: freshData,
		isStale: false,
		age: 0,
		source: "origin",
	};
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout<T>(
	fetchFn: () => Promise<T>,
	timeout: number
): Promise<T> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const result = await Promise.race([
			fetchFn(),
			new Promise<never>((_, reject) => {
				controller.signal.addEventListener("abort", () => {
					reject(new Error(`Fetch timeout after ${timeout}ms`));
				});
			}),
		]);
		return result;
	} finally {
		clearTimeout(timeoutId);
	}
}
