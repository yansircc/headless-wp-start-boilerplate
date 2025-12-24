/**
 * Taxonomy registrations for KV sync
 */

import { QUERY_LIMITS } from "@/graphql/constants";
import {
	CategoriesListDocument,
	CategoryBySlugDocument,
	PostsByCategoryDocument,
	PostsByTagDocument,
	ProductCategoriesListDocument,
	ProductCategoryBySlugDocument,
	ProductsByCategoryDocument,
	TagBySlugDocument,
	TagsListDocument,
} from "@/graphql/taxonomies/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { registerTaxonomySync } from "../registry";

// ============================================
// Categories (Post Categories)
// ============================================

registerTaxonomySync("category", {
	bySlugDocument: CategoryBySlugDocument,
	listDocument: CategoriesListDocument,
	contentByTaxonomyDocument: PostsByCategoryDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({
		first: QUERY_LIMITS.list.categories,
		language,
	}),
	buildContentByTaxonomyVars: (slug, language) => ({
		categorySlug: slug,
		first: QUERY_LIMITS.taxonomy.postsPerCategory,
		language,
	}),
	extractSingle: (data) =>
		(data as { category?: { translation?: unknown } }).category?.translation ??
		null,
	extractList: (data) => (data as { categories?: unknown }).categories,
	extractContentByTaxonomy: (data) =>
		(data as { posts?: unknown }).posts ?? null,
	getCacheKey: (slug, locale) => cacheKeys.categoryBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.categoriesList(locale),
	getContentCacheKey: (slug, locale) => cacheKeys.postsByCategory(slug, locale),
});

// ============================================
// Tags (Post Tags)
// ============================================

registerTaxonomySync("post_tag", {
	bySlugDocument: TagBySlugDocument,
	listDocument: TagsListDocument,
	contentByTaxonomyDocument: PostsByTagDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({ first: QUERY_LIMITS.list.tags, language }),
	buildContentByTaxonomyVars: (slug, language) => ({
		tagSlug: slug,
		first: QUERY_LIMITS.taxonomy.postsPerTag,
		language,
	}),
	extractSingle: (data) =>
		(data as { tag?: { translation?: unknown } }).tag?.translation ?? null,
	extractList: (data) => (data as { tags?: unknown }).tags,
	extractContentByTaxonomy: (data) =>
		(data as { posts?: unknown }).posts ?? null,
	getCacheKey: (slug, locale) => cacheKeys.tagBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.tagsList(locale),
	getContentCacheKey: (slug, locale) => cacheKeys.postsByTag(slug, locale),
});

// ============================================
// Product Categories
// ============================================

registerTaxonomySync("product-category", {
	bySlugDocument: ProductCategoryBySlugDocument,
	listDocument: ProductCategoriesListDocument,
	contentByTaxonomyDocument: ProductsByCategoryDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({
		first: QUERY_LIMITS.list.productCategories,
		language,
	}),
	buildContentByTaxonomyVars: (slug, language) => ({
		categorySlug: slug,
		first: QUERY_LIMITS.taxonomy.productsPerCategory,
		language, // Uses LanguageCode for this query
	}),
	extractSingle: (data) =>
		(data as { productCategory?: { translation?: unknown } }).productCategory
			?.translation ?? null,
	extractList: (data) =>
		(data as { productCategories?: unknown }).productCategories,
	extractContentByTaxonomy: (data) =>
		(data as { productCategory?: { translation?: { products?: unknown } } })
			.productCategory?.translation?.products ?? null,
	getCacheKey: (slug, locale) => cacheKeys.productCategoryBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.productCategoriesList(locale),
	getContentCacheKey: (slug, locale) =>
		cacheKeys.productsByCategory(slug, locale),
});
