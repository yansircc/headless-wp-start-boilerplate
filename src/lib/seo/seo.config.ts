/**
 * SEO Configuration - Single Source of Truth (SSOT)
 *
 * This file is the central configuration for all SEO-related settings.
 * It is validated at build time - missing required fields will block the build.
 *
 * Instructions:
 * 1. Fill in all required fields before building
 * 2. Run `bun run seo` to validate and generate robots.txt/sitemap.xml
 * 3. Add new routes to the `routes` object when creating new pages
 */

import type { SeoConfigSchema } from "./types";

export const seoConfig: SeoConfigSchema = {
	// ============================================
	// Site Configuration (Required)
	// ============================================
	site: {
		url: process.env.SITE_URL ?? "",
		name: process.env.SITE_NAME ?? "",
		tagline: "Headless WordPress Starter", // TODO: Fill in your site tagline
		language: "zh-CN",
		separator: "-",
	},

	// ============================================
	// Default SEO Values (Required)
	// Used as fallback when page-specific values are missing
	// ============================================
	defaults: {
		description:
			"A modern headless WordPress starter with React and TanStack Router", // TODO: Customize
		image: "/og-default.png", // TODO: Add default og:image to public/
	},

	// ============================================
	// Static Routes SEO (Required)
	// Add all static pages here. Dynamic pages (with $param) are handled separately.
	// Title format: "{title} {separator} {site.name}"
	// ============================================
	routes: {
		"/": {
			title: "", // Empty = use site.name + tagline for homepage
			description: "探索最新的文章和产品，发现更多精彩内容", // TODO: Customize
		},
		"/posts": {
			title: "博客", // → "博客 - Site Name"
			description: "浏览所有博客文章，获取最新资讯和教程", // TODO: Customize
		},
		"/products": {
			title: "产品", // → "产品 - Site Name"
			description: "探索我们的产品系列，找到适合您的选择", // TODO: Customize
		},
	},

	// ============================================
	// Dynamic Routes SEO (Optional)
	// These pages get their SEO from CMS data.
	// Configure fallback titles and content types here.
	// ============================================
	dynamicRoutes: {
		"/posts/$postId": {
			fallbackTitle: "文章",
			type: "article",
		},
		"/products/$productId": {
			fallbackTitle: "产品",
			type: "product",
		},
	},

	// ============================================
	// Robots.txt Configuration
	// ============================================
	robots: {
		rules: [
			{
				userAgent: "*",
				allow: ["/"],
				disallow: ["/api", "/admin"],
			},
		],
	},

	// ============================================
	// Sitemap Configuration
	// ============================================
	sitemap: {
		changefreq: {
			homepage: "daily",
			listing: "daily",
			content: "weekly",
		},
		priority: {
			homepage: 1.0,
			listing: 0.8,
			content: 0.6,
		},
	},
};

// ============================================
// Helper Functions
// ============================================

/**
 * Build full title with separator and site name
 * Homepage: "Site Name - Tagline" or just "Site Name"
 * Other pages: "Page Title - Site Name"
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

/**
 * Get SEO config for a dynamic route
 */
export function getDynamicRouteSeo(
	routePattern: string,
	cmsTitle?: string | null
): {
	title: string;
	type: "article" | "product";
} {
	const dynamicConfig = seoConfig.dynamicRoutes[routePattern];

	if (!dynamicConfig) {
		return {
			title: buildTitle(cmsTitle ?? ""),
			type: "article",
		};
	}

	return {
		title: buildTitle(cmsTitle ?? dynamicConfig.fallbackTitle),
		type: dynamicConfig.type,
	};
}
