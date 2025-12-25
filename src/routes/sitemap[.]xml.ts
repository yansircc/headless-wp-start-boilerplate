/**
 * sitemap.xml Proxy Route
 *
 * Proxies sitemap from WordPress Yoast SEO.
 * Yoast creates a sitemap index at /sitemap_index.xml
 * GET /sitemap.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";

function getWpBaseUrl(): string {
	if (env.WP_URL) {
		return env.WP_URL;
	}
	const url = new URL(env.GRAPHQL_ENDPOINT);
	return `${url.protocol}//${url.host}`;
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const wpUrl = getWpBaseUrl();
				// Yoast SEO creates sitemap at /sitemap_index.xml
				const sitemapUrl = `${wpUrl}/sitemap_index.xml`;

				try {
					const response = await fetch(sitemapUrl, {
						headers: { "User-Agent": "Headless-WP-Proxy" },
					});

					if (!response.ok) {
						return new Response(
							'<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>',
							{
								status: 200,
								headers: { "Content-Type": "application/xml" },
							}
						);
					}

					let content = await response.text();

					// Replace WordPress URLs with frontend URLs in the sitemap
					const frontendUrl =
						import.meta.env.VITE_SITE_URL || "http://localhost:3000";
					content = content.replaceAll(wpUrl, frontendUrl);

					return new Response(content, {
						status: 200,
						headers: {
							"Content-Type": "application/xml",
							"Cache-Control": "public, max-age=3600, s-maxage=3600",
						},
					});
				} catch (error) {
					console.error("[sitemap.xml] Proxy error:", error);
					return new Response(
						'<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>',
						{
							status: 200,
							headers: { "Content-Type": "application/xml" },
						}
					);
				}
			},
		},
	},
});
