import { createServerFn } from "@tanstack/react-start";
import { QUERY_LIMITS } from "@/graphql/constants";
import {
	ProductBySlugDocument,
	ProductsListDocument,
} from "@/graphql/products/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageCode, toLanguageFilter } from "@/lib/i18n/language";
import { kvFirstFetch } from "@/lib/kv";

type GetProductsInput = {
	locale?: string;
};

async function fetchProducts(locale?: string) {
	const language = toLanguageFilter(locale);
	const data = await graphqlRequest(ProductsListDocument, {
		first: QUERY_LIMITS.list.products,
		language,
	});
	return data.products;
}

/**
 * 获取产品列表（支持多语言）
 * 使用 KV-First 模式：优先从 KV 返回数据，后台异步更新
 */
export const getProducts = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetProductsInput) => input)
	.handler(async ({ data }) => {
		const { locale } = data;
		const cacheKey = cacheKeys.productsList(locale);

		const result = await kvFirstFetch(cacheKey, () => fetchProducts(locale));

		return {
			...result.data,
			_meta: {
				isStale: result.isStale,
				age: result.age,
				source: result.source,
			},
		};
	});

type GetProductBySlugInput = {
	slug: string;
	locale?: string;
};

async function fetchProductBySlug(slug: string, locale?: string) {
	const language = toLanguageCode(locale);
	const data = await graphqlRequest(ProductBySlugDocument, {
		slug,
		language,
	});
	// Return the translation for the specified language
	return data.product?.translation;
}

/**
 * 根据 slug 获取单个产品（指定语言版本）
 * 使用 KV-First 模式：优先从 KV 返回数据，后台异步更新
 */
export const getProductBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetProductBySlugInput) => input)
	.handler(async ({ data }) => {
		const { slug, locale } = data;
		const cacheKey = cacheKeys.productBySlug(slug, locale);

		const result = await kvFirstFetch(cacheKey, () =>
			fetchProductBySlug(slug, locale)
		);

		// Return null if product not found (for 404 handling)
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
