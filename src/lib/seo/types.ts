// ============================================
// SEO Config Types (Single Source of Truth)
// ============================================

/**
 * Site-level configuration
 */
export type SiteConfig = {
	/** Site URL (e.g., "https://example.com") */
	url: string;
	/** Site name */
	name: string;
	/** Site tagline (used for homepage title) */
	tagline: string;
	/** HTML lang attribute (e.g., "zh-CN") */
	language: string;
	/** Title separator (e.g., "-", "|") */
	separator: string;
};

/**
 * Default SEO values for fallback
 */
export type DefaultsConfig = {
	/** Default meta description */
	description: string;
	/** Default og:image path */
	image: string;
};

/**
 * Static route SEO configuration
 */
export type RouteConfig = {
	/** Page title (will be combined with site name) */
	title: string;
	/** Meta description */
	description: string;
};

/**
 * Dynamic route SEO configuration (for CMS-driven pages)
 */
export type DynamicRouteConfig = {
	/** Fallback title when CMS doesn't provide one */
	fallbackTitle: string;
	/** Content type for og:type and schema */
	type: "article" | "product";
};

/**
 * Robots.txt rule
 */
export type RobotsRule = {
	userAgent: string;
	allow?: string[];
	disallow?: string[];
	crawlDelay?: number;
};

/**
 * Robots.txt configuration
 */
export type RobotsConfig = {
	rules: RobotsRule[];
};

/**
 * Sitemap configuration
 */
export type SitemapConfig = {
	changefreq: {
		homepage: string;
		listing: string;
		content: string;
	};
	priority: {
		homepage: number;
		listing: number;
		content: number;
	};
};

/**
 * Complete SEO configuration
 */
export type SeoConfigSchema = {
	site: SiteConfig;
	defaults: DefaultsConfig;
	routes: Record<string, RouteConfig>;
	dynamicRoutes: Record<string, DynamicRouteConfig>;
	robots: RobotsConfig;
	sitemap: SitemapConfig;
};

// ============================================
// Meta Tag Types (for buildSeoMeta)
// ============================================

export type PageSeoConfig = {
	title: string;
	description?: string;
	canonical?: string;
	image?: string;
	imageAlt?: string;
	type?: "website" | "article" | "product";
	publishedTime?: string;
	modifiedTime?: string;
	author?: string;
	noindex?: boolean;
	nofollow?: boolean;
};

export type MetaTag = {
	title?: string;
	charSet?: string;
	name?: string;
	property?: string;
	content?: string;
};
