import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "./-components/post-card";
import { getPosts } from "./-services";

export const Route = createFileRoute("/posts/")({
	component: RouteComponent,
	loader: async () => await getPosts(),
});

function RouteComponent() {
	const posts = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 px-6 py-12">
			<div className="mx-auto max-w-4xl">
				<h1 className="mb-8 font-bold text-3xl text-white">Posts</h1>
				<div className="grid gap-6">
					{posts?.nodes?.map((post) => (
						<PostCard key={post.id} {...post} />
					))}
				</div>
			</div>
		</div>
	);
}
