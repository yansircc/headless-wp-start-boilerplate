/**
 * sitemap.xml Proxy Route
 *
 * Proxies sitemap index from WordPress Yoast SEO.
 * Yoast creates a sitemap index at /sitemap_index.xml
 * GET /sitemap.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { emptySitemapIndex, proxySitemap } from "@/lib/sitemap/proxy";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const response = await proxySitemap("sitemap_index.xml");

				// If proxy fails, return empty sitemap instead of error
				if (!response.ok && response.status >= 500) {
					return emptySitemapIndex();
				}

				return response;
			},
		},
	},
});
