/**
 * Type-safe fetch utilities with Zod validation
 */

import type { z } from "zod";

/**
 * Fetch JSON with Zod schema validation
 * Returns typed data or throws on validation failure
 */
export async function fetchJson<T extends z.ZodType>(
	url: string,
	schema: T,
	options?: RequestInit
): Promise<z.infer<T>> {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	const json: unknown = await response.json();
	return schema.parse(json);
}

/**
 * Fetch JSON with Zod schema validation (safe version)
 * Returns { success, data } or { success, error }
 */
export async function safeFetchJson<T extends z.ZodType>(
	url: string,
	schema: T,
	options?: RequestInit
): Promise<
	| { success: true; data: z.infer<T> }
	| { success: false; error: Error | z.ZodError }
> {
	try {
		const data = await fetchJson(url, schema, options);
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}
