import { createFileRoute } from "@tanstack/react-router";
import { useIntlayer } from "react-intlayer";
import { Container, Section } from "@/components/shared";
import type { PostFieldsFragment } from "@/graphql/types";
import {
	buildHreflangLinks,
	buildYoastArchiveMeta,
	getArchiveSeo,
	getDefaultOgImage,
	getStaticPagesSeo,
	seoConfig,
} from "@/lib/seo";
import { PostCard } from "./-components/post-card";
import { getPosts } from "./-services";

export const Route = createFileRoute("/{-$locale}/posts/")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const locale = params.locale;
		const [posts, seoData] = await Promise.all([
			getPosts({ data: { locale } }),
			getStaticPagesSeo({ data: {} }),
		]);
		return { posts, seo: seoData.data };
	},
	head: ({ loaderData }) => {
		const archive = getArchiveSeo(loaderData?.seo, "post");
		const defaultImage = getDefaultOgImage(loaderData?.seo);
		return {
			meta: buildYoastArchiveMeta(archive, {
				defaultImage,
				siteUrl: seoConfig.site.url,
				canonical: "/posts",
			}),
			links: buildHreflangLinks("/posts", seoConfig.site.url),
		};
	},
});

function RouteComponent() {
	const { posts } = Route.useLoaderData();
	const { sections } = useIntlayer("common");

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-border border-b pt-16 pb-24">
				<Container className="text-center" size="md">
					<div className="mb-6">
						<span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 font-bold text-[10px] text-primary uppercase tracking-widest">
							{sections.articles.badge}
						</span>
					</div>
					<h1 className="gradient-text font-bold text-5xl text-foreground tracking-tight">
						{sections.articles.title}
					</h1>
					<p className="mt-4 text-lg text-muted-foreground">
						{sections.articles.pageSubtitle}
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
							{sections.articles.empty}
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
