import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Tag } from "lucide-react";
import { LocalizedLink } from "@/components/localized-link";
import { Container, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { PostFieldsFragment } from "@/graphql/types";
import { buildHreflangLinks, seoConfig } from "@/lib/seo";
import { buildYoastMeta } from "@/lib/seo/yoast";
import { PostCard } from "../-components/post-card";
import { getPostsByTag, getTagBySlug } from "./-services";

export const Route = createFileRoute("/{-$locale}/posts/tags/$tagSlug")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const { tagSlug, locale } = params;
		const [tag, posts] = await Promise.all([
			getTagBySlug({ data: { slug: tagSlug, locale } }),
			getPostsByTag({ data: { tagSlug, locale } }),
		]);

		if (!tag) {
			throw notFound();
		}

		return { tag, posts };
	},
	head: ({ loaderData, params }) => {
		const canonical = `/posts/tags/${params.tagSlug}`;
		const seo = loaderData?.tag?.seo;

		return {
			meta: buildYoastMeta(seo),
			links: buildHreflangLinks(canonical, seoConfig.site.url),
		};
	},
});

function RouteComponent() {
	const { tag, posts } = Route.useLoaderData();

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-border border-b pt-16 pb-24">
				<Container size="md">
					<Button asChild className="mb-8 gap-2" size="sm" variant="ghost">
						<LocalizedLink to="/posts">
							<ArrowLeft className="h-4 w-4" />
							All Articles
						</LocalizedLink>
					</Button>
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
							<Tag className="h-6 w-6 text-muted-foreground" />
						</div>
						<h1 className="gradient-text font-bold text-5xl text-foreground tracking-tight">
							#{tag.name}
						</h1>
					</div>
					{!!tag.description && (
						<p className="mt-4 text-lg text-muted-foreground">
							{tag.description}
						</p>
					)}
					<p className="mt-2 text-muted-foreground text-sm">
						{tag.count ?? 0} articles
					</p>
				</Container>
			</Section>

			<Section className="pb-32">
				<Container size="md">
					{(posts?.nodes?.length ?? 0) > 0 ? (
						<div className="grid gap-12">
							{posts?.nodes?.map((post: PostFieldsFragment, index: number) => (
								<PostCard index={index} key={post.id} {...post} />
							))}
						</div>
					) : (
						<div className="rounded-3xl border border-border border-dashed py-24 text-center font-normal text-muted-foreground">
							No articles with this tag
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
