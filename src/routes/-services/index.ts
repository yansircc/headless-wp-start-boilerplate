import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { productSchema } from "@/acf/definitions";
import { HomepageDataDocument } from "@/graphql/homepage/queries.generated";
import { graphqlRequest } from "@/lib/graphql";

// Homepage 产品列表 schema
const homepageProductsSchema = z.array(productSchema);

/**
 * 获取首页数据
 * 包含文章和产品列表，使用 Zod 验证产品数据
 */
export const getHomepageData = createServerFn({
	method: "GET",
}).handler(async () => {
	const data = await graphqlRequest(HomepageDataDocument);

	const products = data.products?.nodes || [];

	// 运行时验证产品数据
	const validated = homepageProductsSchema.safeParse(products);
	if (!validated.success) {
		console.warn(
			"Homepage products validation warning:",
			validated.error.issues
		);
	}

	return {
		posts: data.posts?.nodes || [],
		products,
		postsHasMore: data.posts?.pageInfo?.hasNextPage,
		productsHasMore: data.products?.pageInfo?.hasNextPage,
	};
});
