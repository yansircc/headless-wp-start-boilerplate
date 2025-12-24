/**
 * KV-First Fetch with Stale-While-Revalidate
 *
 * Implements a "KV-First" pattern where Cloudflare KV is the primary read source
 * and WordPress GraphQL is the sync source. This ensures:
 * - Zero latency impact when WordPress is down
 * - Fast responses (~50ms from KV vs ~200ms+ from WordPress)
 * - Background revalidation keeps data fresh
 *
 * Data Flow:
 * 1. Memory cache → return immediately if hit
 * 2. KV → return immediately + trigger background WordPress check
 * 3. WordPress (cold start only) → store in KV + memory cache → return
 */

import { cache } from "@/lib/cache";
import { waitUntil } from "@/lib/cloudflare/context";
import {
	isKVAvailable,
	type KVEntry,
	kvGetWithMetadata,
	kvPutWithMetadata,
} from "@/lib/kv";

/**
 * Options for kvFirstFetch
 */
export type KVFirstOptions = {
	/**
	 * Maximum age in milliseconds before triggering revalidation
	 * Default: 0 (always revalidate in background)
	 */
	maxAge?: number;

	/**
	 * Timeout for WordPress fetch in milliseconds
	 * Default: 5000 (5 seconds)
	 */
	fetchTimeout?: number;

	/**
	 * Skip revalidation entirely (useful for testing or high-traffic scenarios)
	 */
	skipRevalidation?: boolean;
};

/**
 * Result of kvFirstFetch
 */
export type KVFirstResult<T> = {
	/** The fetched data */
	data: T;
	/** Whether the data is from KV (potentially stale) vs fresh from WordPress */
	isStale: boolean;
	/** Age of the data in milliseconds (0 if fresh from WordPress) */
	age: number;
	/** Data source: 'memory', 'kv', or 'origin' (WordPress) */
	source: "memory" | "kv" | "origin";
};

const DEFAULT_FETCH_TIMEOUT = 5000; // 5 seconds

/**
 * Fetch with KV-first pattern and stale-while-revalidate
 *
 * @param cacheKey - The cache key for memory and KV storage
 * @param fetchFn - Function to fetch fresh data from WordPress
 * @param options - Optional configuration
 * @returns Data with staleness metadata
 */
export async function kvFirstFetch<T>(
	cacheKey: string,
	fetchFn: () => Promise<T>,
	options: KVFirstOptions = {}
): Promise<KVFirstResult<T>> {
	const { maxAge = 0, fetchTimeout = DEFAULT_FETCH_TIMEOUT } = options;

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

			// Trigger background revalidation if data is older than maxAge
			if (!options.skipRevalidation && (maxAge === 0 || age > maxAge)) {
				triggerBackgroundRevalidation(cacheKey, fetchFn, kvEntry);
			}

			return {
				data: kvEntry.data,
				isStale: true,
				age,
				source: "kv",
			};
		}
	}

	// 3. Cold start: Fetch from WordPress (blocking)
	const freshData = await fetchWithTimeout(fetchFn, fetchTimeout);

	// Store in memory cache
	cache.set(cacheKey, freshData);

	// Store in KV (async, don't block response)
	if (isKVAvailable()) {
		waitUntil(
			kvPutWithMetadata(cacheKey, freshData, "revalidate").catch((error) => {
				console.warn(`[KV-First] Failed to store in KV: ${cacheKey}`, error);
			})
		);
	}

	return {
		data: freshData,
		isStale: false,
		age: 0,
		source: "origin",
	};
}

/**
 * Trigger background revalidation
 * Runs after response is sent using waitUntil
 */
function triggerBackgroundRevalidation<T>(
	cacheKey: string,
	fetchFn: () => Promise<T>,
	cached: KVEntry<T>
): void {
	waitUntil(
		(async () => {
			try {
				const fresh = await fetchFn();

				// Check if data has changed (simple JSON comparison)
				const cachedJson = JSON.stringify(cached.data);
				const freshJson = JSON.stringify(fresh);

				if (cachedJson !== freshJson) {
					// Update both KV and memory cache
					await kvPutWithMetadata(cacheKey, fresh, "revalidate");
					cache.set(cacheKey, fresh);
					console.log(
						`[KV-First] Background revalidation updated: ${cacheKey}`
					);
				}
			} catch (error) {
				// WordPress might be down - keep serving stale data
				console.warn(
					`[KV-First] Background revalidation failed for ${cacheKey}:`,
					error
				);
			}
		})()
	);
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
		// Note: The fetchFn doesn't have access to AbortController signal
		// This timeout just prevents hanging indefinitely
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

/**
 * Prefetch data into KV (useful for warming cache)
 * Does not affect memory cache or return data
 */
export async function kvPrefetch<T>(
	cacheKey: string,
	fetchFn: () => Promise<T>
): Promise<boolean> {
	if (!isKVAvailable()) {
		return false;
	}

	try {
		const data = await fetchFn();
		await kvPutWithMetadata(cacheKey, data, "revalidate");
		return true;
	} catch (error) {
		console.warn(`[KV-First] Prefetch failed for ${cacheKey}:`, error);
		return false;
	}
}

/**
 * Force refresh data in both memory and KV cache
 * Useful after webhook notifications
 */
export async function kvForceRefresh<T>(
	cacheKey: string,
	fetchFn: () => Promise<T>
): Promise<T> {
	const data = await fetchFn();

	// Update memory cache
	cache.set(cacheKey, data);

	// Update KV
	if (isKVAvailable()) {
		await kvPutWithMetadata(cacheKey, data, "webhook");
	}

	return data;
}
