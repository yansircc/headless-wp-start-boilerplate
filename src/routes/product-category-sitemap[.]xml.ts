/**
 * Product Category Sitemap Proxy Route
 * GET /product-category-sitemap.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { proxySitemap } from "@/lib/sitemap/proxy";

export const Route = createFileRoute("/product-category-sitemap.xml")({
	server: {
		handlers: {
			GET: () => proxySitemap("product-category-sitemap.xml"),
		},
	},
});
