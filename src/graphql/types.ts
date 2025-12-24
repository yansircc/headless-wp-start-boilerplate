/**
 * GraphQL Type Exports
 *
 * Re-exports commonly used fragment types for use in components.
 * This provides a single import point for all GraphQL types.
 */

// Homepage (composite query)
export type { HomepageDataQuery } from "./homepage/queries.generated";
// Posts
export type {
	PostDetailFieldsFragment,
	PostFieldsFragment,
} from "./posts/queries.generated";
// Products
export type {
	ProductDetailFieldsFragment,
	ProductFieldsFragment,
} from "./products/queries.generated";

// Taxonomies
export type {
	CategoryFieldsFragment,
	ProductCategoryFieldsFragment,
	TagFieldsFragment,
} from "./taxonomies/queries.generated";

// Helper types for nested structures
import type { PostDetailFieldsFragment } from "./posts/queries.generated";
import type { ProductFieldsFragment } from "./products/queries.generated";

export type PostCategory = NonNullable<
	NonNullable<PostDetailFieldsFragment["categories"]>["nodes"]
>[number];

export type PostTag = NonNullable<
	NonNullable<PostDetailFieldsFragment["tags"]>["nodes"]
>[number];

export type ProductCategory = NonNullable<
	NonNullable<ProductFieldsFragment["productCategories"]>["nodes"]
>[number];
