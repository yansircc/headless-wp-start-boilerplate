/**
 * Resource Hints Configuration
 *
 * Centralized configuration for preconnect and dns-prefetch hints.
 * Add new external origins here to automatically include them in the document head.
 */

import { env } from "@/env";

export type ResourceHintLink = {
	rel: "preconnect" | "dns-prefetch";
	href: string;
	crossOrigin?: "anonymous" | "use-credentials";
};

/**
 * Get resource hints for external origins
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * import { getResourceHints } from "@/lib/performance/preconnect";
 *
 * head: () => ({
 *   links: [
 *     ...getResourceHints(),
 *     ...getFontPreloadLinks(),
 *     { rel: "stylesheet", href: appCss },
 *   ],
 * })
 * ```
 */
export function getResourceHints(): ResourceHintLink[] {
	const links: ResourceHintLink[] = [];

	// WordPress GraphQL backend
	try {
		const graphqlUrl = new URL(env.GRAPHQL_ENDPOINT);
		links.push({
			rel: "preconnect",
			href: graphqlUrl.origin,
			crossOrigin: "anonymous",
		});
	} catch {
		// Skip if URL is invalid
	}

	return links;
}
