/**
 * SEO Module
 *
 * - Static pages: use buildSeoMeta + getRouteSeo from seo.config.ts
 * - Dynamic content: use buildYoastMeta from yoast.ts
 * - All pages: use buildHreflangLinks for i18n
 */

import { configuration } from "intlayer";
import type { MetaTag, PageSeoConfig } from "./types";

export { buildTitle, getRouteSeo, seoConfig } from "./seo.config";
export type {
	MetaTag,
	PageSeoConfig,
	RouteConfig,
	SeoConfigSchema,
	SiteConfig,
} from "./types";

const { internationalization } = configuration;
const { locales, defaultLocale } = internationalization;

// ============================================
// Meta Tag Builders (for static pages)
// ============================================

function buildRobotsMeta(config: PageSeoConfig): MetaTag | null {
	const robots: string[] = [];
	if (config.noindex) {
		robots.push("noindex");
	}
	if (config.nofollow) {
		robots.push("nofollow");
	}
	return robots.length > 0
		? { name: "robots", content: robots.join(", ") }
		: null;
}

function buildOpenGraphMeta(config: PageSeoConfig, siteUrl: string): MetaTag[] {
	const meta: MetaTag[] = [
		{ property: "og:type", content: config.type ?? "website" },
		{ property: "og:title", content: config.title },
	];
	if (config.description) {
		meta.push({ property: "og:description", content: config.description });
	}
	if (config.canonical) {
		meta.push({ property: "og:url", content: `${siteUrl}${config.canonical}` });
	}
	if (config.image) {
		meta.push({ property: "og:image", content: config.image });
		if (config.imageAlt) {
			meta.push({ property: "og:image:alt", content: config.imageAlt });
		}
	}
	return meta;
}

function buildTwitterMeta(config: PageSeoConfig): MetaTag[] {
	const meta: MetaTag[] = [
		{
			name: "twitter:card",
			content: config.image ? "summary_large_image" : "summary",
		},
		{ name: "twitter:title", content: config.title },
	];
	if (config.description) {
		meta.push({ name: "twitter:description", content: config.description });
	}
	if (config.image) {
		meta.push({ name: "twitter:image", content: config.image });
	}
	return meta;
}

/**
 * Build SEO meta tags for static pages
 * For dynamic content pages, use buildYoastMeta from ./yoast.ts
 */
export function buildSeoMeta(
	config: PageSeoConfig,
	siteUrl: string
): MetaTag[] {
	const meta: MetaTag[] = [{ title: config.title }];
	if (config.description) {
		meta.push({ name: "description", content: config.description });
	}
	const robotsMeta = buildRobotsMeta(config);
	if (robotsMeta) {
		meta.push(robotsMeta);
	}
	meta.push(...buildOpenGraphMeta(config, siteUrl));
	meta.push(...buildTwitterMeta(config));
	return meta;
}

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
