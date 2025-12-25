import { createServerFn } from "@tanstack/react-start";
import { QUERY_LIMITS } from "@/graphql/constants";
import {
	ProductCategoryBySlugDocument,
	ProductsByCategoryDocument,
} from "@/graphql/taxonomies/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode } from "@/lib/i18n/language";
import { kvFirstFetch } from "@/lib/kv";

type GetProductCategoryBySlugInput = {
	slug: string;
	locale?: string;
};

async function fetchProductCategoryBySlug(slug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(ProductCategoryBySlugDocument, {
		slug,
		language,
	});
	return data.productCategory?.translation;
}

/**
 * Get single product category by slug
 */
export const getProductCategoryBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetProductCategoryBySlugInput) => input)
	.handler(async ({ data }) => {
		const { slug, locale } = data;
		const cacheKey = cacheKeys.productCategoryBySlug(slug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchProductCategoryBySlug(slug, locale)
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

type GetProductsByCategoryInput = {
	categorySlug: string;
	locale?: string;
};

async function fetchProductsByCategory(categorySlug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(ProductsByCategoryDocument, {
		categorySlug,
		first: QUERY_LIMITS.taxonomy.productsPerCategory,
		language,
	});
	// Extract products from the nested structure
	return data.productCategory?.translation?.products;
}

/**
 * Get products filtered by category
 */
export const getProductsByCategory = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetProductsByCategoryInput) => input)
	.handler(async ({ data }) => {
		const { categorySlug, locale } = data;
		const cacheKey = cacheKeys.productsByCategory(categorySlug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchProductsByCategory(categorySlug, locale)
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
