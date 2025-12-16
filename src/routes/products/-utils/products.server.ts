import { createServerFn } from "@tanstack/react-start";
import request from "graphql-request";
import {
	ProductBySlugDocument,
	type ProductBySlugQuery,
	ProductsListDocument,
	type ProductsListQuery,
} from "@/graphql/products/queries.generated";

const GRAPHQL_ENDPOINT = "http://headless.local/graphql";

export const getProducts = createServerFn({
	method: "GET",
}).handler(async () => {
	const data = await request<ProductsListQuery>(
		GRAPHQL_ENDPOINT,
		ProductsListDocument,
		{
			first: 20,
		}
	);
	return data.products;
});

export const getProductBySlug = createServerFn({
	method: "GET",
})
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const data = await request<ProductBySlugQuery>(
			GRAPHQL_ENDPOINT,
			ProductBySlugDocument,
			{ slug }
		);
		return data.product;
	});
