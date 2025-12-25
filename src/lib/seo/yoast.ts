/**
 * Yoast SEO Utilities
 *
 * Converts Yoast SEO data from WPGraphQL to meta tags and schema scripts.
 */

import type {
	YoastSeoFieldsFragment,
	YoastTaxonomySeoFieldsFragment,
} from "@/graphql/seo/fragments.generated";
import type { MetaTag } from "./types";

type YoastSeo =
	| YoastSeoFieldsFragment
	| YoastTaxonomySeoFieldsFragment
	| null
	| undefined;

function buildBasicMeta(seo: NonNullable<YoastSeo>): MetaTag[] {
	const meta: MetaTag[] = [];
	if (seo.title) {
		meta.push({ title: seo.title });
	}
	if (seo.metaDesc) {
		meta.push({ name: "description", content: seo.metaDesc });
	}
	return meta;
}

function buildRobotsMeta(seo: NonNullable<YoastSeo>): MetaTag[] {
	const robots: string[] = [];
	if (seo.metaRobotsNoindex === "noindex") {
		robots.push("noindex");
	}
	if (seo.metaRobotsNofollow === "nofollow") {
		robots.push("nofollow");
	}
	return robots.length > 0
		? [{ name: "robots", content: robots.join(", ") }]
		: [];
}

function buildOpenGraphMeta(seo: NonNullable<YoastSeo>): MetaTag[] {
	const meta: MetaTag[] = [];
	if (seo.opengraphTitle) {
		meta.push({ property: "og:title", content: seo.opengraphTitle });
	}
	if (seo.opengraphDescription) {
		meta.push({
			property: "og:description",
			content: seo.opengraphDescription,
		});
	}
	if (seo.opengraphType) {
		meta.push({ property: "og:type", content: seo.opengraphType });
	}
	if (seo.opengraphUrl) {
		meta.push({ property: "og:url", content: seo.opengraphUrl });
	}
	if (seo.opengraphImage?.sourceUrl) {
		meta.push({ property: "og:image", content: seo.opengraphImage.sourceUrl });
		if (seo.opengraphImage.altText) {
			meta.push({
				property: "og:image:alt",
				content: seo.opengraphImage.altText,
			});
		}
	}
	if ("opengraphSiteName" in seo && seo.opengraphSiteName) {
		meta.push({ property: "og:site_name", content: seo.opengraphSiteName });
	}
	if ("opengraphPublishedTime" in seo && seo.opengraphPublishedTime) {
		meta.push({
			property: "article:published_time",
			content: seo.opengraphPublishedTime,
		});
	}
	if ("opengraphModifiedTime" in seo && seo.opengraphModifiedTime) {
		meta.push({
			property: "article:modified_time",
			content: seo.opengraphModifiedTime,
		});
	}
	return meta;
}

function buildTwitterMeta(seo: NonNullable<YoastSeo>): MetaTag[] {
	const meta: MetaTag[] = [
		{
			name: "twitter:card",
			content: seo.opengraphImage?.sourceUrl
				? "summary_large_image"
				: "summary",
		},
	];
	if (seo.twitterTitle) {
		meta.push({ name: "twitter:title", content: seo.twitterTitle });
	}
	if (seo.twitterDescription) {
		meta.push({ name: "twitter:description", content: seo.twitterDescription });
	}
	if (seo.twitterImage?.sourceUrl) {
		meta.push({ name: "twitter:image", content: seo.twitterImage.sourceUrl });
	}
	return meta;
}

/**
 * Convert Yoast SEO data to meta tags array for route head()
 */
export function buildYoastMeta(seo: YoastSeo): MetaTag[] {
	if (!seo) {
		return [];
	}
	return [
		...buildBasicMeta(seo),
		...buildRobotsMeta(seo),
		...buildOpenGraphMeta(seo),
		...buildTwitterMeta(seo),
	];
}

/**
 * Build Schema.org JSON-LD script from Yoast SEO data
 */
export function buildYoastSchema(
	seo: YoastSeoFieldsFragment | null | undefined
): { type: string; children: string } | null {
	if (!seo?.schema?.raw) {
		return null;
	}
	return { type: "application/ld+json", children: seo.schema.raw };
}

/**
 * Build canonical link tag from Yoast SEO data
 */
export function buildYoastCanonical(
	seo: YoastSeo
): { rel: string; href: string } | null {
	if (!seo?.canonical) {
		return null;
	}
	return { rel: "canonical", href: seo.canonical };
}

// ============================================
// Archive SEO (for static pages like /posts, /products)
// ============================================

/**
 * Archive SEO type from Yoast Content Types settings
 */
export type ArchiveSeo = {
	title?: string | null;
	metaDesc?: string | null;
	metaRobotsNoindex?: boolean | null;
	breadcrumbTitle?: string | null;
	archiveLink?: string | null;
	hasArchive?: boolean | null;
} | null;

/**
 * Convert Yoast Archive SEO data to meta tags array
 * Used for static pages like /posts, /products that use Yoast Content Type Archive settings
 */
export function buildYoastArchiveMeta(
	archive: ArchiveSeo,
	options?: {
		defaultImage?: string | null;
		siteUrl?: string;
		canonical?: string;
	}
): MetaTag[] {
	if (!archive) {
		return [];
	}

	const meta: MetaTag[] = [];

	// Title
	if (archive.title) {
		meta.push({ title: archive.title });
	}

	// Description
	if (archive.metaDesc) {
		meta.push({ name: "description", content: archive.metaDesc });
	}

	// Robots
	if (archive.metaRobotsNoindex) {
		meta.push({ name: "robots", content: "noindex" });
	}

	// Open Graph
	meta.push({ property: "og:type", content: "website" });
	if (archive.title) {
		meta.push({ property: "og:title", content: archive.title });
	}
	if (archive.metaDesc) {
		meta.push({ property: "og:description", content: archive.metaDesc });
	}
	if (options?.canonical && options?.siteUrl) {
		meta.push({
			property: "og:url",
			content: `${options.siteUrl}${options.canonical}`,
		});
	}
	if (options?.defaultImage) {
		meta.push({ property: "og:image", content: options.defaultImage });
	}

	// Twitter
	meta.push({
		name: "twitter:card",
		content: options?.defaultImage ? "summary_large_image" : "summary",
	});
	if (archive.title) {
		meta.push({ name: "twitter:title", content: archive.title });
	}
	if (archive.metaDesc) {
		meta.push({ name: "twitter:description", content: archive.metaDesc });
	}
	if (options?.defaultImage) {
		meta.push({ name: "twitter:image", content: options.defaultImage });
	}

	return meta;
}
