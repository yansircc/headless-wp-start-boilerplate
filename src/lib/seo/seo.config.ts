/**
 * SEO Configuration
 *
 * Site-level SEO configuration. Static page SEO (/, /posts, /products)
 * is now managed via WordPress Yoast SEO Archive Settings.
 *
 * NOTE: Uses import.meta.env (not env from @/env) because this config
 * is imported by route components which run on both server and client.
 */

export type SiteConfig = {
	url: string;
	name: string;
	language: string;
	separator: string;
};

export type DefaultsConfig = {
	description: string;
	image: string;
};

export type SeoConfig = {
	site: SiteConfig;
	defaults: DefaultsConfig;
};

export const seoConfig: SeoConfig = {
	site: {
		url: import.meta.env.VITE_SITE_URL ?? "http://localhost:3000",
		name: import.meta.env.VITE_SITE_NAME ?? "Site Name",
		language: "en-US",
		separator: "-",
	},

	defaults: {
		description:
			"A modern headless WordPress starter with React and TanStack Router",
		image: "/og-default.png",
	},
};

/**
 * Build full title with separator and site name
 */
export function buildTitle(pageTitle: string, isHomepage = false): string {
	const { name, separator } = seoConfig.site;

	if (isHomepage || !pageTitle) {
		return name;
	}

	return `${pageTitle} ${separator} ${name}`;
}
