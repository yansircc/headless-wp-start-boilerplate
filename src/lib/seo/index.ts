/**
 * SEO Module
 *
 * - Static pages (/, /posts, /products): use Yoast Archive SEO via getStaticPagesSeo
 * - Dynamic content: use buildYoastMeta from yoast.ts
 * - All pages: use buildHreflangLinks for i18n
 */

import { configuration } from "intlayer";

export type { DefaultsConfig, SeoConfig, SiteConfig } from "./seo.config";
// Site configuration
export { buildTitle, seoConfig } from "./seo.config";
// Static pages SEO (from Yoast Archive Settings)
export {
	type ArchiveSeoData,
	getArchiveSeo,
	getDefaultOgImage,
	getHomepageSeo,
	getStaticPagesSeo,
	type HomepageSeoData,
	type StaticPagesSeo,
} from "./static-pages";
// Types
export type { MetaTag } from "./types";
// Yoast SEO utilities
export {
	type ArchiveSeo,
	buildHomepageMeta,
	buildYoastArchiveMeta,
	buildYoastCanonical,
	buildYoastMeta,
	buildYoastSchema,
} from "./yoast";

const { internationalization } = configuration;
const { locales, defaultLocale } = internationalization;

// ============================================
// Hreflang Links (i18n SEO)
// ============================================

type HreflangLink = {
	rel: "alternate";
	hrefLang: string;
	href: string;
};

/**
 * Build hreflang link tags for all supported locales
 */
export function buildHreflangLinks(
	currentPath: string,
	siteUrl: string
): HreflangLink[] {
	const links: HreflangLink[] = [];

	for (const locale of locales) {
		const localeStr = locale.toString();
		const localizedPath =
			locale === defaultLocale ? currentPath : `/${localeStr}${currentPath}`;
		links.push({
			rel: "alternate",
			hrefLang: localeStr,
			href: `${siteUrl}${localizedPath}`,
		});
	}

	links.push({
		rel: "alternate",
		hrefLang: "x-default",
		href: `${siteUrl}${currentPath}`,
	});
	return links;
}
