import { createFileRoute } from "@tanstack/react-router";
import { Container, Section } from "@/components/shared";
import { PostCard } from "./-components/post-card";
import { getPosts } from "./-services";

export const Route = createFileRoute("/posts/")({
	component: RouteComponent,
	loader: async () => await getPosts(),
});

function RouteComponent() {
	const posts = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-white">
			<Section className="border-gray-200 border-b py-24">
				<Container size="md">
					<h1 className="font-light text-4xl text-black tracking-tight">
						文章
					</h1>
				</Container>
			</Section>

			<Section>
				<Container size="md">
					{(posts?.nodes?.length ?? 0) > 0 ? (
						<div className="space-y-8">
							{posts?.nodes?.map((post) => (
								<PostCard key={post.id} {...post} />
							))}
						</div>
					) : (
						<div className="py-16 text-center font-light text-gray-400">
							暂无文章
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
