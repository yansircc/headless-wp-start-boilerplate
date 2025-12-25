/**
 * Sitemap Proxy Utilities
 *
 * Shared logic for proxying sitemaps from WordPress Yoast SEO.
 */

import { env } from "@/env";

function getWpBaseUrl(): string {
	if (env.WP_URL) {
		return env.WP_URL;
	}
	const url = new URL(env.GRAPHQL_ENDPOINT);
	return `${url.protocol}//${url.host}`;
}

/**
 * Proxy a sitemap from WordPress
 * @param sitemapPath - The sitemap path (e.g., "sitemap_index.xml", "post-sitemap.xml")
 */
export async function proxySitemap(sitemapPath: string): Promise<Response> {
	const wpUrl = getWpBaseUrl();
	const sitemapUrl = `${wpUrl}/${sitemapPath}`;

	try {
		const response = await fetch(sitemapUrl, {
			headers: { "User-Agent": "Headless-WP-Proxy" },
		});

		if (!response.ok) {
			return new Response("Not Found", { status: 404 });
		}

		let content = await response.text();

		// Remove XSL stylesheet reference to avoid CORS errors
		// The XSL is only for browser display; search engines don't need it
		content = content.replace(/<\?xml-stylesheet[^?]*\?>\s*/g, "");

		// Replace WordPress URLs with frontend URLs
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
		console.error(`[sitemap] Proxy error for ${sitemapPath}:`, error);
		return new Response("Internal Server Error", { status: 500 });
	}
}

/**
 * Return an empty sitemap index (for error fallback)
 */
export function emptySitemapIndex(): Response {
	return new Response(
		'<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>',
		{
			status: 200,
			headers: { "Content-Type": "application/xml" },
		}
	);
}
