/**
 * Cloudflare KV Client for Fallback Data
 *
 * Provides type-safe access to KV storage for WordPress backup data.
 * Uses the same cache key pattern as memory cache.
 *
 * @see https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
 */

import { env } from "cloudflare:workers";

/**
 * Get the current KV namespace
 * Uses cloudflare:workers module to access bindings
 */
export function getKVNamespace(): KVNamespace | null {
	return env.FALLBACK_KV ?? null;
}

/**
 * Check if KV is available
 * Returns false in local dev (vite dev) and true in wrangler dev / production
 */
export function isKVAvailable(): boolean {
	return getKVNamespace() !== null;
}

/**
 * Get data from KV
 */
export async function kvGet<T>(key: string): Promise<T | null> {
	const kv = getKVNamespace();
	if (!kv) {
		return null;
	}

	try {
		const data = await kv.get(key, "json");
		return data as T | null;
	} catch (error) {
		console.error(`[KV] Failed to get key ${key}:`, error);
		return null;
	}
}

/**
 * Store data in KV
 * @param ttl - Optional TTL in seconds (default: no expiration for backup data)
 */
export async function kvPut<T>(
	key: string,
	value: T,
	ttl?: number
): Promise<boolean> {
	const kv = getKVNamespace();
	if (!kv) {
		return false;
	}

	try {
		const options = ttl ? { expirationTtl: ttl } : undefined;
		await kv.put(key, JSON.stringify(value), options);
		return true;
	} catch (error) {
		console.error(`[KV] Failed to put key ${key}:`, error);
		return false;
	}
}

/**
 * Delete data from KV
 */
export async function kvDelete(key: string): Promise<boolean> {
	const kv = getKVNamespace();
	if (!kv) {
		return false;
	}

	try {
		await kv.delete(key);
		return true;
	} catch (error) {
		console.error(`[KV] Failed to delete key ${key}:`, error);
		return false;
	}
}

/**
 * Metadata stored with each KV entry
 */
export type KVMetadata = {
	updatedAt: number;
	source: "build" | "webhook" | "revalidate";
};

/**
 * Wrapper type for KV entries with metadata
 */
export type KVEntry<T> = {
	data: T;
	meta: KVMetadata;
};

/**
 * Store data with metadata
 */
export function kvPutWithMetadata<T>(
	key: string,
	value: T,
	source: KVMetadata["source"]
): Promise<boolean> {
	const wrapper: KVEntry<T> = {
		data: value,
		meta: {
			updatedAt: Date.now(),
			source,
		},
	};
	return kvPut(key, wrapper);
}

/**
 * Get data with metadata
 */
export function kvGetWithMetadata<T>(key: string): Promise<KVEntry<T> | null> {
	return kvGet<KVEntry<T>>(key);
}

/**
 * Get multiple keys at once (for bulk operations)
 * Note: KV doesn't have native batch get, so we parallelize
 */
export async function kvGetMany<T>(
	keys: string[]
): Promise<Map<string, KVEntry<T> | null>> {
	const results = await Promise.all(
		keys.map(async (key) => {
			const value = await kvGetWithMetadata<T>(key);
			return [key, value] as const;
		})
	);
	return new Map(results);
}

/**
 * List all keys with a given prefix
 */
export async function kvListKeys(prefix: string): Promise<string[]> {
	const kv = getKVNamespace();
	if (!kv) {
		return [];
	}

	try {
		const list = await kv.list({ prefix });
		return list.keys.map((k) => k.name);
	} catch (error) {
		console.error(`[KV] Failed to list keys with prefix ${prefix}:`, error);
		return [];
	}
}
