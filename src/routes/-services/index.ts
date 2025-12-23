import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { productSchema } from "@/acf/definitions";
import { QUERY_LIMITS } from "@/graphql/constants";
import { HomepageDataDocument } from "@/graphql/homepage/queries.generated";
import { cache, cacheKeys } from "@/lib/cache";
import { graphqlRequest } from "@/lib/graphql";
import { toLanguageFilter } from "@/lib/i18n/language";

// Homepage 产品列表 schema
const homepageProductsSchema = z.array(productSchema);

type GetHomepageDataInput = {
	locale?: string;
};

async function fetchHomepageData(locale?: string) {
	const language = toLanguageFilter(locale);
	const result = await graphqlRequest(HomepageDataDocument, {
		language,
		postsFirst: QUERY_LIMITS.homepage.posts,
		productsFirst: QUERY_LIMITS.homepage.products,
	});

	const products = result.products?.nodes || [];

	// 运行时验证产品数据
	const validated = homepageProductsSchema.safeParse(products);
	if (!validated.success) {
		console.warn(
			"Homepage products validation warning:",
			validated.error.issues
		);
	}

	return {
		posts: result.posts?.nodes || [],
		products,
		postsHasMore: result.posts?.pageInfo?.hasNextPage,
		productsHasMore: result.products?.pageInfo?.hasNextPage,
	};
}

/**
 * 获取首页数据（支持多语言）
 * 包含文章和产品列表，使用 Zod 验证产品数据
 */
export const getHomepageData = createServerFn({
	method: "GET",
})
	.inputValidator((input: GetHomepageDataInput) => input)
	.handler(async ({ data }) => {
		const { locale } = data;
		const cacheKey = cacheKeys.homepage(locale);

		// Check cache first
		const cached =
			cache.get<Awaited<ReturnType<typeof fetchHomepageData>>>(cacheKey);
		if (cached) {
			return cached;
		}

		const result = await fetchHomepageData(locale);

		// Store in cache
		cache.set(cacheKey, result);

		return result;
	});
