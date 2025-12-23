import { createServerFn } from "@tanstack/react-start";
import {
	GetPostBySlugDocument,
	PostsListDocument,
} from "@/graphql/posts/queries.generated";
import { cache, cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";

type GetPostsInput = {
	locale?: string;
};

/**
 * 获取文章列表（支持多语言）
 */
export const getPosts = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetPostsInput) => input)
	.handler(async ({ data }) => {
		const { locale } = data;
		const cacheKey = cacheKeys.postsList(locale);

		// Check cache first
		const cached = cache.get<Awaited<ReturnType<typeof fetchPosts>>>(cacheKey);
		if (cached) {
			return cached;
		}

		// Fetch from WordPress
		const result = await fetchPosts(locale);

		// Store in cache
		cache.set(cacheKey, result);

		return result;
	});

async function fetchPosts(locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(PostsListDocument, {
		first: 20,
		language,
	});
	return data.posts;
}

type GetPostBySlugInput = {
	slug: string;
	locale?: string;
};

/**
 * 根据 slug 获取单篇文章（指定语言版本）
 */
export const getPostBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetPostBySlugInput) => input)
	.handler(async ({ data }) => {
		const { slug, locale } = data;
		const cacheKey = cacheKeys.postBySlug(slug, locale);

		// Check cache first
		const cached =
			cache.get<Awaited<ReturnType<typeof fetchPostBySlug>>>(cacheKey);
		if (cached) {
			return cached;
		}

		// Fetch from WordPress
		const result = await fetchPostBySlug(slug, locale);

		// Store in cache (only if found)
		if (result) {
			cache.set(cacheKey, result);
		}

		return result;
	});

async function fetchPostBySlug(slug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(GetPostBySlugDocument, {
		id: slug,
		language,
	});
	// Return the translation for the specified language
	return data.post?.translation;
}
