/**
 * Category Sitemap Proxy Route
 * GET /category-sitemap.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { proxySitemap } from "@/lib/sitemap/proxy";

export const Route = createFileRoute("/category-sitemap.xml")({
	server: {
		handlers: {
			GET: () => proxySitemap("category-sitemap.xml"),
		},
	},
});
