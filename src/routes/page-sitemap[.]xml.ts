/**
 * Page Sitemap Proxy Route
 * GET /page-sitemap.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { proxySitemap } from "@/lib/sitemap/proxy";

export const Route = createFileRoute("/page-sitemap.xml")({
	server: {
		handlers: {
			GET: () => proxySitemap("page-sitemap.xml"),
		},
	},
});
