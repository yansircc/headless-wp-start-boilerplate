/**
 * robots.txt Proxy Route
 *
 * Proxies robots.txt from WordPress Yoast SEO.
 * Transforms sitemap URLs to point to frontend instead of WordPress.
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

function getSiteUrl(): string {
	return env.VITE_SITE_URL ?? "http://localhost:3000";
}

/**
 * Transform robots.txt content:
 * 1. Replace WordPress sitemap URLs with frontend sitemap URL
 * 2. Remove Yoast comment blocks
 */
function transformRobotsContent(content: string, siteUrl: string): string {
	return (
		content
			// Remove comment lines (# START YOAST BLOCK, # ---, etc.)
			.replace(/^#.*$/gm, "")
			// Replace sitemap URL
			.replace(
				/^Sitemap:\s*https?:\/\/[^\s]+$/gim,
				`Sitemap: ${siteUrl}/sitemap.xml`
			)
			// Clean up multiple blank lines
			.replace(/\n{3,}/g, "\n\n")
			.trim()
			.concat("\n")
	);
}

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: async () => {
				const wpUrl = getWpBaseUrl();
				const siteUrl = getSiteUrl();
				const robotsUrl = `${wpUrl}/robots.txt`;

				try {
					const response = await fetch(robotsUrl, {
						headers: { "User-Agent": "Headless-WP-Proxy" },
					});

					if (!response.ok) {
						return new Response(
							`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
							{
								status: 200,
								headers: { "Content-Type": "text/plain" },
							}
						);
					}

					const content = await response.text();
					const transformedContent = transformRobotsContent(content, siteUrl);

					return new Response(transformedContent, {
						status: 200,
						headers: {
							"Content-Type": "text/plain",
							"Cache-Control": "public, max-age=86400, s-maxage=86400",
						},
					});
				} catch (error) {
					console.error("[robots.txt] Proxy error:", error);
					return new Response(
						`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
						{
							status: 200,
							headers: { "Content-Type": "text/plain" },
						}
					);
				}
			},
		},
	},
});
