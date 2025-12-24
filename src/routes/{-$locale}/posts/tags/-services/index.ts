import { createServerFn } from "@tanstack/react-start";
import { QUERY_LIMITS } from "@/graphql/constants";
import {
	PostsByTagDocument,
	TagBySlugDocument,
	TagsListDocument,
} from "@/graphql/taxonomies/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvFirstFetch } from "@/lib/kv-first";

type GetTagsInput = {
	locale?: string;
};

async function fetchTags(locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(TagsListDocument, {
		first: QUERY_LIMITS.list.tags,
		language,
	});
	return data.tags;
}

/**
 * Get all post tags
 */
export const getTags = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetTagsInput) => input)
	.handler(async ({ data }) => {
		const { locale } = data;
		const cacheKey = cacheKeys.tagsList(locale);

		const result = await kvFirstFetch(cacheKey, () => fetchTags(locale));

		return {
			...result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});

type GetTagBySlugInput = {
	slug: string;
	locale?: string;
};

async function fetchTagBySlug(slug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(TagBySlugDocument, {
		slug,
		language,
	});
	return data.tag?.translation;
}

/**
 * Get single tag by slug
 */
export const getTagBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetTagBySlugInput) => input)
	.handler(async ({ data }) => {
		const { slug, locale } = data;
		const cacheKey = cacheKeys.tagBySlug(slug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchTagBySlug(slug, locale)
		);

		if (!result.data) {
			return null;
		}

		return {
			...result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});

type GetPostsByTagInput = {
	tagSlug: string;
	locale?: string;
};

async function fetchPostsByTag(tagSlug: string, locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(PostsByTagDocument, {
		tagSlug,
		first: QUERY_LIMITS.taxonomy.postsPerTag,
		language,
	});
	return data.posts;
}

/**
 * Get posts filtered by tag
 */
export const getPostsByTag = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetPostsByTagInput) => input)
	.handler(async ({ data }) => {
		const { tagSlug, locale } = data;
		const cacheKey = cacheKeys.postsByTag(tagSlug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchPostsByTag(tagSlug, locale)
		);

		return {
			...result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});
