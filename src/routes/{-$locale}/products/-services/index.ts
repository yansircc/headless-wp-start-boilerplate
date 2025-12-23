import { createServerFn } from "@tanstack/react-start";
import {
	ProductBySlugDocument,
	ProductsListDocument,
} from "@/graphql/products/queries.generated";
import { cache, cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";

type GetProductsInput = {
	locale?: string;
};

/**
 * 获取产品列表（支持多语言）
 */
export const getProducts = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetProductsInput) => input)
	.handler(async ({ data }) => {
		const { locale } = data;
		const cacheKey = cacheKeys.productsList(locale);

		// Check cache first
		const cached =
			cache.get<Awaited<ReturnType<typeof fetchProducts>>>(cacheKey);
		if (cached) {
			return cached;
		}

		// Fetch from WordPress
		const result = await fetchProducts(locale);

		// Store in cache
		cache.set(cacheKey, result);

		return result;
	});

async function fetchProducts(locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(ProductsListDocument, {
		first: 20,
		language,
	});
	return data.products;
}

type GetProductBySlugInput = {
	slug: string;
	locale?: string;
};

/**
 * 根据 slug 获取单个产品（指定语言版本）
 */
export const getProductBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetProductBySlugInput) => input)
	.handler(async ({ data }) => {
		const { slug, locale } = data;
		const cacheKey = cacheKeys.productBySlug(slug, locale);

		// Check cache first
		const cached =
			cache.get<Awaited<ReturnType<typeof fetchProductBySlug>>>(cacheKey);
		if (cached) {
			return cached;
		}

		// Fetch from WordPress
		const result = await fetchProductBySlug(slug, locale);

		// Store in cache (only if found)
		if (result) {
			cache.set(cacheKey, result);
		}

		return result;
	});

async function fetchProductBySlug(slug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(ProductBySlugDocument, {
		slug,
		language,
	});
	// Return the translation for the specified language
	return data.product?.translation;
}
