import { createFileRoute } from "@tanstack/react-router";
import { Container, Section } from "@/components/shared";
import { buildSeoMeta, getRouteSeo, seoConfig } from "@/lib/seo";
import { PostCard } from "./-components/post-card";
import { getPosts } from "./-services";

export const Route = createFileRoute("/posts/")({
	component: RouteComponent,
	loader: async () => await getPosts(),
	head: () => {
		const { title, description } = getRouteSeo("/posts");
		return {
			meta: buildSeoMeta(
				{
					title,
					description,
					canonical: "/posts",
				},
				seoConfig.site.url
			),
		};
	},
});

function RouteComponent() {
	const posts = Route.useLoaderData();

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-gray-100 border-b pt-16 pb-24">
				<Container className="text-center" size="md">
					<div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1">
						<span className="font-bold text-[10px] text-blue-500 uppercase tracking-widest">
							Insights
						</span>
					</div>
					<h1 className="gradient-text font-bold text-5xl text-black tracking-tight">
						Articles
					</h1>
					<p className="mt-4 text-gray-500 text-lg">
						Discover ideas and insights, explore our latest published articles.
					</p>
				</Container>
			</Section>

			<Section className="pb-32">
				<Container size="md">
					{(posts?.nodes?.length ?? 0) > 0 ? (
						<div className="grid gap-12">
							{posts?.nodes?.map((post) => (
								<PostCard key={post.id} {...post} />
							))}
						</div>
					) : (
						<div className="rounded-3xl border border-gray-200 border-dashed py-24 text-center font-normal text-gray-400">
							No articles found
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
