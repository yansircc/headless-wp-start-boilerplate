import type { HomepageDataQuery } from "@/graphql/homepage/queries.generated";
import type { ExtractNode } from "@/routes/-shared/-types";

// ============================================
// Single Source of Truth: 从 GraphQL 生成类型派生
// ============================================

/**
 * 首页文章类型
 */
export type HomepagePost = ExtractNode<HomepageDataQuery["posts"]>;

/**
 * 首页产品类型
 */
export type HomepageProduct = ExtractNode<HomepageDataQuery["products"]>;

/**
 * 首页数据类型
 */
export type HomepageData = {
	posts: HomepagePost[];
	products: HomepageProduct[];
	postsHasMore: boolean;
	productsHasMore: boolean;
};
