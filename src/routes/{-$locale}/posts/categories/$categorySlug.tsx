import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LocalizedLink } from "@/components/localized-link";
import { Container, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
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
			<Section className="mb-16 border-border border-b pt-16 pb-24">
				<Container size="md">
					<Button asChild className="mb-8 gap-2" size="sm" variant="ghost">
						<LocalizedLink to="/posts">
							<ArrowLeft className="h-4 w-4" />
							All Posts
						</LocalizedLink>
					</Button>
					<h1 className="gradient-text font-bold text-5xl text-foreground tracking-tight">
						{category.name}
					</h1>
					{!!category.description && (
						<p className="mt-4 text-lg text-muted-foreground">
							{category.description}
						</p>
					)}
					<p className="mt-2 text-muted-foreground text-sm">
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
						<div className="rounded-3xl border border-border border-dashed py-24 text-center font-normal text-muted-foreground">
							No articles in this category
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
