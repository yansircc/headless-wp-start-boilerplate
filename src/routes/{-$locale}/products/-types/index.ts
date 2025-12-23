import type {
	ProductBySlugQuery,
	ProductsListQuery,
} from "@/graphql/products/queries.generated";
import type { ExtractNode } from "@/routes/-shared/-types";

// ============================================
// Single Source of Truth: 从 GraphQL 生成类型派生
// ============================================

/**
 * 产品列表项类型
 * 从 ProductsList 查询结果派生
 */
export type Product = ExtractNode<ProductsListQuery["products"]>;

/**
 * 产品详情类型
 * 从 ProductBySlug 查询结果派生
 */
export type ProductDetail = NonNullable<ProductBySlugQuery["product"]>;

/**
 * ProductCard 组件 Props
 * 从 Product 类型中选取需要的字段
 */
export type ProductCardProps = Pick<
	Product,
	"slug" | "title" | "productAcfGroup" | "featuredImage"
>;
