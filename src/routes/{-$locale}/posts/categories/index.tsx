import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Category list page (/posts/categories) - Redirect to /posts
 *
 * This page has no corresponding WordPress entity for SEO management.
 * Instead of maintaining SEO in frontend code, we redirect to /posts
 * which has proper Yoast Archive SEO settings.
 *
 * Individual category pages (/posts/categories/{slug}) still work and
 * get their SEO from Yoast via the category term settings.
 */
export const Route = createFileRoute("/{-$locale}/posts/categories/")({
	beforeLoad: ({ params }) => {
		const locale = params.locale;
		const to = locale ? `/${locale}/posts` : "/posts";
		throw redirect({ to });
	},
});
