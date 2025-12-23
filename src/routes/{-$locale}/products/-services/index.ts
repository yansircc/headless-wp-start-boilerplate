import { createServerFn } from "@tanstack/react-start";
import {
	ProductBySlugDocument,
	ProductsListDocument,
} from "@/graphql/products/queries.generated";
import { cache, cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";

/**
 * 获取产品列表
 */
export const getProducts = createServerFn({
	method: "GET",
}).handler(async () => {
	const cacheKey = cacheKeys.productsList();

	// Check cache first
	const cached = cache.get<Awaited<ReturnType<typeof fetchProducts>>>(cacheKey);
	if (cached) {
		return cached;
	}

	// Fetch from WordPress
	const data = await fetchProducts();

	// Store in cache
	cache.set(cacheKey, data);

	return data;
});

async function fetchProducts() {
	const data = await graphqlRequest(ProductsListDocument, { first: 20 });
	return data.products;
}

/**
 * 根据 slug 获取单个产品
 */
export const getProductBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const cacheKey = cacheKeys.productBySlug(slug);

		// Check cache first
		const cached =
			cache.get<Awaited<ReturnType<typeof fetchProductBySlug>>>(cacheKey);
		if (cached) {
			return cached;
		}

		// Fetch from WordPress
		const data = await fetchProductBySlug(slug);

		// Store in cache (only if found)
		if (data) {
			cache.set(cacheKey, data);
		}

		return data;
	});

async function fetchProductBySlug(slug: string) {
	const data = await graphqlRequest(ProductBySlugDocument, { slug });
	return data.product;
}
