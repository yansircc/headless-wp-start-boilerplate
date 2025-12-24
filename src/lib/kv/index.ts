/**
 * Cloudflare KV Client (Read-Only)
 *
 * Provides type-safe read access to KV storage for WordPress data.
 * KV is populated directly by WordPress via Cloudflare API.
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
 * Metadata stored with each KV entry (set by WordPress)
 */
export type KVMetadata = {
	updatedAt: number;
	source: "wordpress";
};

/**
 * Wrapper type for KV entries with metadata
 */
export type KVEntry<T> = {
	data: T;
	meta: KVMetadata;
};

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
 * Get data with metadata
 */
export function kvGetWithMetadata<T>(key: string): Promise<KVEntry<T> | null> {
	return kvGet<KVEntry<T>>(key);
}
