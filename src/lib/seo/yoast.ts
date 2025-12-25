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
