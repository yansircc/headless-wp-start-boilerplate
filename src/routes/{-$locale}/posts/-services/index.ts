import { createServerFn } from "@tanstack/react-start";
import { QUERY_LIMITS } from "@/graphql/constants";
import {
	GetPostBySlugDocument,
	PostsListDocument,
} from "@/graphql/posts/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvFirstFetch } from "@/lib/kv-first";

type GetPostsInput = {
	locale?: string;
};

async function fetchPosts(locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(PostsListDocument, {
		first: QUERY_LIMITS.list.posts,
		language,
	});
	return data.posts;
}

/**
 * 获取文章列表（支持多语言）
 * 使用 KV-First 模式：优先从 KV 返回数据，后台异步更新
 */
export const getPosts = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetPostsInput) => input)
	.handler(async ({ data }) => {
		const { locale } = data;
		const cacheKey = cacheKeys.postsList(locale);

		const result = await kvFirstFetch(cacheKey, () => fetchPosts(locale));

		return {
			...result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});

type GetPostBySlugInput = {
	slug: string;
	locale?: string;
};

async function fetchPostBySlug(slug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(GetPostBySlugDocument, {
		id: slug,
		language,
	});
	// Return the translation for the specified language
	return data.post?.translation;
}

/**
 * 根据 slug 获取单篇文章（指定语言版本）
 * 使用 KV-First 模式：优先从 KV 返回数据，后台异步更新
 */
export const getPostBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetPostBySlugInput) => input)
	.handler(async ({ data }) => {
		const { slug, locale } = data;
		const cacheKey = cacheKeys.postBySlug(slug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchPostBySlug(slug, locale)
		);

		// Return null if post not found (for 404 handling)
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
