import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Tag } from "lucide-react";
import { LocalizedLink } from "@/components/localized-link";
import { Container, Section } from "@/components/shared";
import type { PostFieldsFragment } from "@/graphql/types";
import { buildHreflangLinks, buildSeoMeta, seoConfig } from "@/lib/seo";
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
		const title = loaderData?.tag?.name ?? "Tag";
		const description =
			loaderData?.tag?.description ?? `Browse articles tagged with ${title}`;
		const canonical = `/posts/tags/${params.tagSlug}`;

		return {
			meta: buildSeoMeta(
				{
					title: `#${title} - Articles`,
					description,
					canonical,
				},
				seoConfig.site.url
			),
			links: buildHreflangLinks(canonical, seoConfig.site.url),
		};
	},
});

function RouteComponent() {
	const { tag, posts } = Route.useLoaderData();

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-gray-100 border-b pt-16 pb-24">
				<Container size="md">
					<LocalizedLink
						className="group mb-8 inline-flex items-center gap-2 font-medium text-gray-500 text-sm hover:text-black"
						to="/posts"
					>
						<ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
						All Articles
					</LocalizedLink>
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
							<Tag className="h-6 w-6 text-gray-600" />
						</div>
						<h1 className="gradient-text font-bold text-5xl text-black tracking-tight">
							#{tag.name}
						</h1>
					</div>
					{!!tag.description && (
						<p className="mt-4 text-gray-500 text-lg">{tag.description}</p>
					)}
					<p className="mt-2 text-gray-400 text-sm">
						{tag.count ?? 0} articles
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
							No articles with this tag
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
