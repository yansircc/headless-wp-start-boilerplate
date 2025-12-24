/**
 * Product type registration for KV sync
 */

import { QUERY_LIMITS } from "@/graphql/constants";
import {
	ProductBySlugDocument,
	ProductsListDocument,
} from "@/graphql/products/queries.generated";
import { cacheKeys } from "@/lib/cache";
import { registerPostTypeSync } from "../registry";

registerPostTypeSync("product", {
	bySlugDocument: ProductBySlugDocument,
	listDocument: ProductsListDocument,
	buildBySlugVars: (slug, language) => ({ slug, language }),
	buildListVars: (language) => ({
		first: QUERY_LIMITS.list.products,
		language,
	}),
	extractSingle: (data) =>
		(data as { product?: { translation?: unknown } }).product?.translation ??
		null,
	extractList: (data) => (data as { products?: unknown }).products,
	getCacheKey: (slug, locale) => cacheKeys.productBySlug(slug, locale),
	getListCacheKey: (locale) => cacheKeys.productsList(locale),
});
