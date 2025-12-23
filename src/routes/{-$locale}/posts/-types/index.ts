import type {
	GetPostBySlugQuery,
	PostsListQuery,
} from "@/graphql/posts/queries.generated";
import type { ExtractNode } from "@/routes/-shared/-types";

// ============================================
// Single Source of Truth: 从 GraphQL 生成类型派生
// ============================================

/**
 * 文章列表项类型
 * 从 PostsList 查询结果派生
 */
export type Post = ExtractNode<PostsListQuery["posts"]>;

/**
 * 文章详情类型
 * 从 GetPostBySlug 查询结果派生
 */
export type PostDetail = NonNullable<GetPostBySlugQuery["post"]>;

/**
 * PostCard 组件 Props
 * 从 Post 类型中选取需要的字段
 */
export type PostCardProps = Pick<
	Post,
	"slug" | "title" | "excerpt" | "date" | "featuredImage"
>;
