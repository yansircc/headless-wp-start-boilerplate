/**
 * Post Sitemap Proxy Route
 * GET /post-sitemap.xml
 */

import { createFileRoute } from "@tanstack/react-router";
import { proxySitemap } from "@/lib/sitemap/proxy";

export const Route = createFileRoute("/post-sitemap.xml")({
	server: {
		handlers: {
			GET: () => proxySitemap("post-sitemap.xml"),
		},
	},
});
