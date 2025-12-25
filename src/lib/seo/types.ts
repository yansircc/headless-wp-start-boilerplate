/**
 * SEO Types
 */

export type SiteConfig = {
	url: string;
	name: string;
	tagline: string;
	language: string;
	separator: string;
};

export type DefaultsConfig = {
	description: string;
	image: string;
};

export type RouteConfig = {
	title: string;
	description: string;
};

export type SeoConfigSchema = {
	site: SiteConfig;
	defaults: DefaultsConfig;
	routes: Record<string, RouteConfig>;
};

export type PageSeoConfig = {
	title: string;
	description?: string;
	canonical?: string;
	image?: string;
	imageAlt?: string;
	type?: "website" | "article" | "product";
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
