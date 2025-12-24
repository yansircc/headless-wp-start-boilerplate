/**
 * KV Module
 *
 * Unified entry point for all KV-related functionality:
 * - client: Low-level KV operations (get, put, delete)
 * - fetch: KV-first fetch pattern with stale-while-revalidate
 * - sync: Webhook-triggered sync from WordPress to KV
 */

// ============================================
// Client (low-level KV operations)
// ============================================

export type { KVEntry, KVMetadata } from "./client";
export {
	getKVNamespace,
	isKVAvailable,
	kvDelete,
	kvGet,
	kvGetWithMetadata,
	kvPut,
} from "./client";

// ============================================
// Fetch (KV-first read pattern)
// ============================================

export type { KVFirstOptions, KVFirstResult } from "./fetch";
export { kvFirstFetch } from "./fetch";

// ============================================
// Sync (webhook-triggered writes)
// ============================================

export type {
	PostTypeSyncConfig,
	SyncResult,
	TaxonomySyncConfig,
} from "./sync";
export { registerPostTypeSync, registerTaxonomySync, syncToKV } from "./sync";
