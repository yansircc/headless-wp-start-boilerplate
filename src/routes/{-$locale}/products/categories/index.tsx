import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Product category list page (/products/categories) - Redirect to /products
 *
 * This page has no corresponding WordPress entity for SEO management.
 * Instead of maintaining SEO in frontend code, we redirect to /products
 * which has proper Yoast Archive SEO settings.
 *
 * Individual category pages (/products/categories/{slug}) still work and
 * get their SEO from Yoast via the product category term settings.
 */
export const Route = createFileRoute("/{-$locale}/products/categories/")({
	beforeLoad: ({ params }) => {
		const locale = params.locale;
		const to = locale ? `/${locale}/products` : "/products";
		throw redirect({ to });
	},
});
