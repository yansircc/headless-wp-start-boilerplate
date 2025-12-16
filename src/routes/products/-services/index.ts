import { createServerFn } from "@tanstack/react-start";
import {
	ProductBySlugDocument,
	ProductsListDocument,
} from "@/graphql/products/queries.generated";
import { graphqlRequest } from "@/lib/graphql";

/**
 * 获取产品列表
 */
export const getProducts = createServerFn({
	method: "GET",
}).handler(async () => {
	const data = await graphqlRequest(ProductsListDocument, { first: 20 });
	return data.products;
});

/**
 * 根据 slug 获取单个产品
 */
export const getProductBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const data = await graphqlRequest(ProductBySlugDocument, { slug });
		return data.product;
	});
