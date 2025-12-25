/**
 * Product Sitemap Proxy Route
 * GET /product-sitemap.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { proxySitemap } from "@/lib/sitemap/proxy";

export const Route = createFileRoute("/product-sitemap.xml")({
	server: {
		handlers: {
			GET: () => proxySitemap("product-sitemap.xml"),
		},
	},
});
