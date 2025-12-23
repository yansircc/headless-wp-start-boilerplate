import { configuration } from "intlayer";
import type { MetaTag, PageSeoConfig } from "./types";

// ============================================
// Re-exports
// ============================================

export {
	buildTitle,
	getDynamicRouteSeo,
	getRouteSeo,
	seoConfig,
} from "./seo.config";

// ============================================
// i18n Configuration
// ============================================

const { internationalization } = configuration;
const { locales, defaultLocale } = internationalization;

export type {
	DynamicRouteConfig,
	MetaTag,
	PageSeoConfig,
	RouteConfig,
	SeoConfigSchema,
	SiteConfig,
} from "./types";

// ============================================
// Meta Tag Builders
// ============================================

function buildRobotsMeta(config: PageSeoConfig): MetaTag | null {
	const robots: string[] = [];
	if (config.noindex) {
		robots.push("noindex");
	}
	if (config.nofollow) {
		robots.push("nofollow");
	}
	if (robots.length > 0) {
		return { name: "robots", content: robots.join(", ") };
	}
	return null;
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
		meta.push({
			property: "og:url",
			content: `${siteUrl}${config.canonical}`,
		});
	}
	if (config.image) {
		meta.push({ property: "og:image", content: config.image });
		if (config.imageAlt) {
			meta.push({ property: "og:image:alt", content: config.imageAlt });
		}
	}

	return meta;
}

function buildArticleMeta(config: PageSeoConfig): MetaTag[] {
	if (config.type !== "article") {
		return [];
	}

	const meta: MetaTag[] = [];
	if (config.publishedTime) {
		meta.push({
			property: "article:published_time",
			content: config.publishedTime,
		});
	}
	if (config.modifiedTime) {
		meta.push({
			property: "article:modified_time",
			content: config.modifiedTime,
		});
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
 * Build SEO meta tags array from config
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
	meta.push(...buildArticleMeta(config));
	meta.push(...buildTwitterMeta(config));

	return meta;
}

// ============================================
// Schema.org JSON-LD
// ============================================

type SchemaConfig = PageSeoConfig & {
	siteName: string;
	siteUrl: string;
};

/**
 * Build Schema.org JSON-LD script tag
 */
export function buildSchemaScript(
	config: SchemaConfig
): { type: string; children: string } | null {
	let schema: Record<string, unknown>;

	if (config.type === "article") {
		schema = {
			"@context": "https://schema.org",
			"@type": "Article",
			headline: config.title,
			description: config.description,
			image: config.image,
			datePublished: config.publishedTime,
			dateModified: config.modifiedTime,
			author: config.author
				? { "@type": "Person", name: config.author }
				: undefined,
			publisher: {
				"@type": "Organization",
				name: config.siteName,
				url: config.siteUrl,
			},
		};
	} else if (config.type === "product") {
		schema = {
			"@context": "https://schema.org",
			"@type": "Product",
			name: config.title,
			description: config.description,
			image: config.image,
		};
	} else {
		return null;
	}

	return {
		type: "application/ld+json",
		children: JSON.stringify(schema),
	};
}

// ============================================
// Content Utilities
// ============================================

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, max = 160): string {
	if (text.length <= max) {
		return text;
	}
	return `${text.substring(0, max - 3)}...`;
}

/**
 * Generate description from content or excerpt
 */
export function generateDescription(
	content?: string | null,
	excerpt?: string | null
): string {
	if (excerpt) {
		return truncate(stripHtml(excerpt));
	}
	if (content) {
		return truncate(stripHtml(content));
	}
	return "";
}

// ============================================
// Hreflang Link Tags (i18n SEO)
// ============================================

type HreflangLink = {
	rel: "alternate";
	hrefLang: string;
	href: string;
};

/**
 * Build hreflang link tags for all supported locales
 * Used for SEO to indicate alternate language versions of a page
 *
 * @param currentPath - The current page path (without locale prefix, e.g., "/posts")
 * @param siteUrl - The site base URL
 * @returns Array of link objects for use in route head()
 */
export function buildHreflangLinks(
	currentPath: string,
	siteUrl: string
): HreflangLink[] {
	const links: HreflangLink[] = [];

	for (const locale of locales) {
		const localeStr = locale.toString();
		// For default locale, use path without prefix
		// For other locales, add locale prefix
		const localizedPath =
			locale === defaultLocale ? currentPath : `/${localeStr}${currentPath}`;

		links.push({
			rel: "alternate",
			hrefLang: localeStr,
			href: `${siteUrl}${localizedPath}`,
		});
	}

	// Add x-default pointing to the default locale version
	links.push({
		rel: "alternate",
		hrefLang: "x-default",
		href: `${siteUrl}${currentPath}`,
	});

	return links;
}

/**
 * Get all supported locales
 */
export function getSupportedLocales(): readonly string[] {
	return locales.map((l) => l.toString());
}

/**
 * Get the default locale
 */
export function getDefaultLocale(): string {
	return defaultLocale.toString();
}
