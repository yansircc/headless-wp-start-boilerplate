/**
 * SEO Configuration for Static Pages
 *
 * This file configures SEO for static pages (homepage, listing pages).
 * Dynamic content pages (posts, products, taxonomies) use Yoast SEO from WordPress.
 *
 * NOTE: Uses import.meta.env (not env from @/env) because this config
 * is imported by route components which run on both server and client.
 */

import type { SeoConfigSchema } from "./types";

export const seoConfig: SeoConfigSchema = {
	site: {
		url: import.meta.env.VITE_SITE_URL ?? "http://localhost:3000",
		name: import.meta.env.VITE_SITE_NAME ?? "Site Name",
		tagline: "Headless WordPress Starter",
		language: "en-US",
		separator: "-",
	},

	defaults: {
		description:
			"A modern headless WordPress starter with React and TanStack Router",
		image: "/og-default.png",
	},

	routes: {
		"/": {
			title: "",
			description:
				"Explore the latest insights and products, discover more exciting content",
		},
		"/posts": {
			title: "Articles",
			description: "Browse all blog posts, get the latest news and tutorials",
		},
		"/posts/categories": {
			title: "Categories",
			description:
				"Browse all article categories and discover content organized by topic",
		},
		"/products": {
			title: "Products",
			description:
				"Explore our product collection and find the best choice for you",
		},
		"/products/categories": {
			title: "Product Categories",
			description: "Explore our products organized by category",
		},
	},
};

/**
 * Build full title with separator and site name
 */
export function buildTitle(pageTitle: string, isHomepage = false): string {
	const { name, tagline, separator } = seoConfig.site;

	if (isHomepage) {
		return tagline ? `${name} ${separator} ${tagline}` : name;
	}

	return pageTitle ? `${pageTitle} ${separator} ${name}` : name;
}

/**
 * Get SEO config for a static route
 */
export function getRouteSeo(path: string): {
	title: string;
	description: string;
} {
	const routeConfig = seoConfig.routes[path];
	const isHomepage = path === "/";

	if (!routeConfig) {
		return {
			title: buildTitle("", false),
			description: seoConfig.defaults.description,
		};
	}

	return {
		title: buildTitle(routeConfig.title, isHomepage),
		description: routeConfig.description || seoConfig.defaults.description,
	};
}
