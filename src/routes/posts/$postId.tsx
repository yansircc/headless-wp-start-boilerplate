import { createFileRoute } from "@tanstack/react-router";
import { getPostBySlug } from "./-services";

export const Route = createFileRoute("/posts/$postId")({
	component: RouteComponent,
	loader: async ({ params }) => await getPostBySlug({ data: params.postId }),
});

function RouteComponent() {
	const post = Route.useLoaderData();

	return (
		<article className="container mx-auto max-w-4xl px-4 py-8">
			<header className="mb-8">
				<h1 className="mb-4 font-bold text-4xl">{post?.title}</h1>
				<div className="flex items-center gap-4 text-gray-600">
					{!!post?.author?.node && (
						<div className="flex items-center gap-2">
							{!!post.author.node.avatar?.url && (
								<img
									alt={post.author.node.name || undefined}
									className="h-8 w-8 rounded-full"
									height="32"
									src={post.author.node.avatar.url || undefined}
									width="32"
								/>
							)}
							<span>{post.author.node.name}</span>
						</div>
					)}
					<time>{new Date(post?.date || "").toLocaleDateString()}</time>
				</div>
				{!!post?.categories?.nodes && post.categories.nodes.length > 0 && (
					<div className="mt-4 flex gap-2">
						{post.categories.nodes.map((category) => (
							<span
								className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 text-sm"
								key={category.id}
							>
								{category.name}
							</span>
						))}
					</div>
				)}
			</header>

			{!!post?.featuredImage?.node && (
				<img
					alt={post.featuredImage.node.altText || post.title || undefined}
					className="mb-8 h-64 w-full rounded-lg object-cover"
					height="256"
					src={post.featuredImage.node.sourceUrl || undefined}
					width="1024"
				/>
			)}

			<div
				className="prose prose-lg max-w-none"
				dangerouslySetInnerHTML={{
					__html: post?.content ?? "",
				}}
			/>

			{!!post?.tags?.nodes && post.tags.nodes.length > 0 && (
				<footer className="mt-8 border-t pt-8">
					<div className="flex gap-2">
						{post.tags.nodes.map((tag) => (
							<span
								className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-sm"
								key={tag.id}
							>
								#{tag.name}
							</span>
						))}
					</div>
				</footer>
			)}
		</article>
	);
}
