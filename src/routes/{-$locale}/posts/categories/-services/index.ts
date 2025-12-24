import { createServerFn } from "@tanstack/react-start";
import { QUERY_LIMITS } from "@/graphql/constants";
import {
	CategoriesListDocument,
	CategoryBySlugDocument,
	PostsByCategoryDocument,
} from "@/graphql/taxonomies/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvFirstFetch } from "@/lib/kv";

type GetCategoriesInput = {
	locale?: string;
};

async function fetchCategories(locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(CategoriesListDocument, {
		first: QUERY_LIMITS.list.categories,
		language,
	});
	return data.categories;
}

/**
 * Get all post categories
 */
export const getCategories = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetCategoriesInput) => input)
	.handler(async ({ data }) => {
		const { locale } = data;
		const cacheKey = cacheKeys.categoriesList(locale);

		const result = await kvFirstFetch(cacheKey, () => fetchCategories(locale));

		return {
			...result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});

type GetCategoryBySlugInput = {
	slug: string;
	locale?: string;
};

async function fetchCategoryBySlug(slug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(CategoryBySlugDocument, {
		slug,
		language,
	});
	return data.category?.translation;
}

/**
 * Get single category by slug
 */
export const getCategoryBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetCategoryBySlugInput) => input)
	.handler(async ({ data }) => {
		const { slug, locale } = data;
		const cacheKey = cacheKeys.categoryBySlug(slug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchCategoryBySlug(slug, locale)
		);

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

type GetPostsByCategoryInput = {
	categorySlug: string;
	locale?: string;
};

async function fetchPostsByCategory(categorySlug: string, locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(PostsByCategoryDocument, {
		categorySlug,
		first: QUERY_LIMITS.taxonomy.postsPerCategory,
		language,
	});
	return data.posts;
}

/**
 * Get posts filtered by category
 */
export const getPostsByCategory = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetPostsByCategoryInput) => input)
	.handler(async ({ data }) => {
		const { categorySlug, locale } = data;
		const cacheKey = cacheKeys.postsByCategory(categorySlug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchPostsByCategory(categorySlug, locale)
		);

		return {
			...result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});
