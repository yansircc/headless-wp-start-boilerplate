import { createServerFn } from "@tanstack/react-start";
import {
	GetPostBySlugDocument,
	PostsListDocument,
} from "@/graphql/posts/queries.generated";
import { graphqlRequest } from "@/lib/graphql";

/**
 * 获取文章列表
 */
export const getPosts = createServerFn({
	method: "GET",
}).handler(async () => {
	const data = await graphqlRequest(PostsListDocument, { first: 20 });
	return data.posts;
});

/**
 * 根据 slug 获取单篇文章
 */
export const getPostBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const data = await graphqlRequest(GetPostBySlugDocument, { id: slug });
		return data.post;
	});
