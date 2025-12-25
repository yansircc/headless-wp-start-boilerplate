/**
 * robots.txt Proxy Route
 *
 * Proxies robots.txt from WordPress Yoast SEO.
 * GET /robots.txt
 */

import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";

function getWpBaseUrl(): string {
	if (env.WP_URL) {
		return env.WP_URL;
	}
	// Derive from GraphQL endpoint (e.g., https://wp.example.com/graphql → https://wp.example.com)
	const url = new URL(env.GRAPHQL_ENDPOINT);
	return `${url.protocol}//${url.host}`;
}

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: async () => {
				const wpUrl = getWpBaseUrl();
				const robotsUrl = `${wpUrl}/robots.txt`;

				try {
					const response = await fetch(robotsUrl, {
						headers: { "User-Agent": "Headless-WP-Proxy" },
					});

					if (!response.ok) {
						return new Response("User-agent: *\nAllow: /\n", {
							status: 200,
							headers: { "Content-Type": "text/plain" },
						});
					}

					const content = await response.text();
					return new Response(content, {
						status: 200,
						headers: {
							"Content-Type": "text/plain",
							"Cache-Control": "public, max-age=86400, s-maxage=86400",
						},
					});
				} catch (error) {
					console.error("[robots.txt] Proxy error:", error);
					return new Response("User-agent: *\nAllow: /\n", {
						status: 200,
						headers: { "Content-Type": "text/plain" },
					});
				}
			},
		},
	},
});
