import { createServerFn } from "@tanstack/react-start";
import {
	GetPostBySlugDocument,
	PostsListDocument,
} from "@/graphql/posts/queries.generated";
import { cache, cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";

/**
 * 获取文章列表
 */
export const getPosts = createServerFn({
	method: "GET",
}).handler(async () => {
	const cacheKey = cacheKeys.postsList();

	// Check cache first
	const cached = cache.get<Awaited<ReturnType<typeof fetchPosts>>>(cacheKey);
	if (cached) {
		return cached;
	}

	// Fetch from WordPress
	const data = await fetchPosts();

	// Store in cache
	cache.set(cacheKey, data);

	return data;
});

async function fetchPosts() {
	const data = await graphqlRequest(PostsListDocument, { first: 20 });
	return data.posts;
}

/**
 * 根据 slug 获取单篇文章
 */
export const getPostBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const cacheKey = cacheKeys.postBySlug(slug);

		// Check cache first
		const cached =
			cache.get<Awaited<ReturnType<typeof fetchPostBySlug>>>(cacheKey);
		if (cached) {
			return cached;
		}

		// Fetch from WordPress
		const data = await fetchPostBySlug(slug);

		// Store in cache (only if found)
		if (data) {
			cache.set(cacheKey, data);
		}

		return data;
	});

async function fetchPostBySlug(slug: string) {
	const data = await graphqlRequest(GetPostBySlugDocument, { id: slug });
	return data.post;
}
