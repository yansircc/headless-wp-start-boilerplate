/**
 * Post type registration for KV sync
 */

import { QUERY_LIMITS } from "@/graphql/constants";
import {
	GetPostBySlugDocument,
	PostsListDocument,
} from "@/graphql/posts/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { registerPostTypeSync } from "../registry";

registerPostTypeSync("post", {
	bySlugDocument: GetPostBySlugDocument,
	listDocument: PostsListDocument,
	buildBySlugVars: (slug, language) => ({ id: slug, language }),
	buildListVars: (language) => ({ first: QUERY_LIMITS.list.posts, language }),
	extractSingle: (data) =>
		(data as { post?: { translation?: unknown } }).post?.translation ?? null,
	extractList: (data) => (data as { posts?: unknown }).posts,
	getCacheKey: (slug, locale) => cacheKeys.postBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.postsList(locale),
});
