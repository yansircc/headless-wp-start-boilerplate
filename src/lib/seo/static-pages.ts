/**
 * Static Pages SEO Service
 *
 * Fetches SEO data for static pages (homepage, /posts, /products) from Yoast Settings.
 * This data comes from WordPress Yoast SEO → Settings → Content Types → Archive.
 */

import { createServerFn } from "@tanstack/react-start";
import {
	StaticPagesSeoDocument,
	type StaticPagesSeoQuery,
} from "@/graphql/seo/static-pages.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { kvFirstFetch } from "@/lib/kv";

export type StaticPagesSeo = NonNullable<StaticPagesSeoQuery["seo"]>;
export type ArchiveSeoData = {
	title?: string | null;
	metaDesc?: string | null;
	metaRobotsNoindex?: boolean | null;
	breadcrumbTitle?: string | null;
	archiveLink?: string | null;
	hasArchive?: boolean | null;
} | null;

/**
 * Fetch static pages SEO data from Yoast Settings
 */
async function fetchStaticPagesSeo(): Promise<StaticPagesSeo | null> {
	const result = await graphqlRequest(StaticPagesSeoDocument);
	return result.seo ?? null;
}

/**
 * Get static pages SEO with KV-first caching
 * Returns SEO data for homepage, /posts, /products from Yoast Archive Settings
 */
export const getStaticPagesSeo = createServerFn({
	method: "GET",
})
	.inputValidator((input: Record<string, never>) => input)
	.handler(async () => {
		const cacheKey = cacheKeys.staticSeo();

		const result = await kvFirstFetch(cacheKey, fetchStaticPagesSeo);

		return {
			data: result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});

/**
 * Helper to get archive SEO for a specific content type
 */
export function getArchiveSeo(
	staticSeo: StaticPagesSeo | null | undefined,
	contentType: "post" | "product" | "page"
): ArchiveSeoData | null {
	if (!staticSeo?.contentTypes) {
		return null;
	}
	return staticSeo.contentTypes[contentType]?.archive ?? null;
}

/**
 * Helper to get default OG image from Yoast settings
 */
export function getDefaultOgImage(
	staticSeo: StaticPagesSeo | null | undefined
): string | null {
	return staticSeo?.openGraph?.defaultImage?.sourceUrl ?? null;
}
