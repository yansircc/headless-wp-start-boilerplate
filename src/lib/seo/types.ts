export type SeoConfig = {
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

export type SiteConfig = {
	siteName: string;
	siteUrl: string;
	defaultDescription: string;
	defaultImage: string;
};
