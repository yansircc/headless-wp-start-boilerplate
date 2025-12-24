/**
 * Cloudflare KV Client
 *
 * Uses cloudflare:workers binding for both read and write operations.
 * No API token needed - uses the Worker's native KV binding.
 */

import { env } from "cloudflare:workers";

// ============================================================================
// KV Namespace
// ============================================================================

export function getKVNamespace(): KVNamespace | null {
	return env.FALLBACK_KV ?? null;
}

export function isKVAvailable(): boolean {
	return getKVNamespace() !== null;
}

// ============================================================================
// Types
// ============================================================================

export type KVMetadata = {
	updatedAt: number;
};

export type KVEntry<T> = {
	data: T;
	meta: KVMetadata;
};

// ============================================================================
// Read Operations
// ============================================================================

export async function kvGet<T>(key: string): Promise<T | null> {
	const kv = getKVNamespace();
	if (!kv) {
		return null;
	}

	try {
		return await kv.get(key, "json");
	} catch (error) {
		console.error(`[KV] Failed to get ${key}:`, error);
		return null;
	}
}

export function kvGetWithMetadata<T>(key: string): Promise<KVEntry<T> | null> {
	return kvGet<KVEntry<T>>(key);
}

// ============================================================================
// Write Operations (via Worker Binding)
// ============================================================================

/**
 * Write a value to KV
 */
export async function kvPut<T>(key: string, value: T): Promise<boolean> {
	const kv = getKVNamespace();
	if (!kv) {
		console.error("[KV] KV not available");
		return false;
	}

	const entry: KVEntry<T> = {
		data: value,
		meta: {
			updatedAt: Date.now(),
		},
	};

	try {
		await kv.put(key, JSON.stringify(entry));
		return true;
	} catch (error) {
		console.error(`[KV] Failed to put ${key}:`, error);
		return false;
	}
}

/**
 * Delete a key from KV
 */
export async function kvDelete(key: string): Promise<boolean> {
	const kv = getKVNamespace();
	if (!kv) {
		console.error("[KV] KV not available");
		return false;
	}

	try {
		await kv.delete(key);
		return true;
	} catch (error) {
		console.error(`[KV] Failed to delete ${key}:`, error);
		return false;
	}
}
