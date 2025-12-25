import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LocalizedLink } from "@/components/localized-link";
import { Container, Section } from "@/components/shared";
import type { PostFieldsFragment } from "@/graphql/types";
import { buildHreflangLinks, seoConfig } from "@/lib/seo";
import { buildYoastMeta } from "@/lib/seo/yoast";
import { PostCard } from "../-components/post-card";
import { getCategoryBySlug, getPostsByCategory } from "./-services";

export const Route = createFileRoute(
	"/{-$locale}/posts/categories/$categorySlug"
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		const { categorySlug, locale } = params;
		const [category, posts] = await Promise.all([
			getCategoryBySlug({ data: { slug: categorySlug, locale } }),
			getPostsByCategory({ data: { categorySlug, locale } }),
		]);

		if (!category) {
			throw notFound();
		}

		return { category, posts };
	},
	head: ({ loaderData, params }) => {
		const canonical = `/posts/categories/${params.categorySlug}`;
		const seo = loaderData?.category?.seo;

		return {
			meta: buildYoastMeta(seo),
			links: buildHreflangLinks(canonical, seoConfig.site.url),
		};
	},
});

function RouteComponent() {
	const { category, posts } = Route.useLoaderData();

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-gray-100 border-b pt-16 pb-24">
				<Container size="md">
					<LocalizedLink
						className="group mb-8 inline-flex items-center gap-2 font-medium text-gray-500 text-sm hover:text-black"
						to="/posts/categories"
					>
						<ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
						All Categories
					</LocalizedLink>
					<h1 className="gradient-text font-bold text-5xl text-black tracking-tight">
						{category.name}
					</h1>
					{!!category.description && (
						<p className="mt-4 text-gray-500 text-lg">{category.description}</p>
					)}
					<p className="mt-2 text-gray-400 text-sm">
						{category.count ?? 0} articles
					</p>
				</Container>
			</Section>

			<Section className="pb-32">
				<Container size="md">
					{(posts?.nodes?.length ?? 0) > 0 ? (
						<div className="grid gap-12">
							{posts?.nodes?.map((post: PostFieldsFragment) => (
								<PostCard key={post.id} {...post} />
							))}
						</div>
					) : (
						<div className="rounded-3xl border border-gray-200 border-dashed py-24 text-center font-normal text-gray-400">
							No articles in this category
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
