import type { MetaTag, SeoConfig, SiteConfig } from "./types";

function buildRobotsMeta(config: SeoConfig): MetaTag | null {
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

function buildOpenGraphMeta(config: SeoConfig, siteUrl: string): MetaTag[] {
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

function buildArticleMeta(config: SeoConfig): MetaTag[] {
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

function buildTwitterMeta(config: SeoConfig): MetaTag[] {
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
export function buildSeoMeta(config: SeoConfig, siteUrl: string): MetaTag[] {
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

/**
 * Build Schema.org JSON-LD script tag
 */
export function buildSchemaScript(
	config: SeoConfig & SiteConfig
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

export { seoConfig } from "./config";
export type { MetaTag, SeoConfig, SiteConfig } from "./types";
