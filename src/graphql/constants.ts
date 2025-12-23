/**
 * GraphQL Query Constants (SSOT)
 *
 * Centralized configuration for query parameters.
 * Update these values to change limits across all queries.
 */

export const QUERY_LIMITS = {
	/** Homepage preview limits */
	homepage: {
		posts: 6,
		products: 6,
	},
	/** List page defaults */
	list: {
		posts: 20,
		products: 20,
	},
} as const;

export type QueryLimits = typeof QUERY_LIMITS;
