/**
 * SEO Types
 */

export type MetaTag = {
	title?: string;
	charSet?: string;
	name?: string;
	property?: string;
	content?: string;
};

// Re-export from seo.config for backward compatibility
export type { DefaultsConfig, SeoConfig, SiteConfig } from "./seo.config";
