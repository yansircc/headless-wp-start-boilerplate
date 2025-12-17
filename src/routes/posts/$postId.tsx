import { createFileRoute } from "@tanstack/react-router";
import { Container, Divider, Section } from "@/components/shared";
import {
	buildSchemaScript,
	buildSeoMeta,
	generateDescription,
	seoConfig,
} from "@/lib/seo";
import { getPostBySlug } from "./-services";

export const Route = createFileRoute("/posts/$postId")({
	component: RouteComponent,
	loader: async ({ params }) => await getPostBySlug({ data: params.postId }),
	head: ({ loaderData: post, params }) => {
		const config = {
			title: `${post?.title ?? "Post"} | ${seoConfig.siteName}`,
			description: generateDescription(post?.content, post?.excerpt),
			canonical: `/posts/${params.postId}`,
			image: post?.featuredImage?.node?.sourceUrl ?? undefined,
			imageAlt: post?.featuredImage?.node?.altText ?? post?.title ?? undefined,
			type: "article" as const,
			publishedTime: post?.date ?? undefined,
			author: post?.author?.node?.name ?? undefined,
		};

		const schema = buildSchemaScript({ ...config, ...seoConfig });

		return {
			meta: buildSeoMeta(config, seoConfig.siteUrl),
			scripts: schema ? [schema] : [],
		};
	},
});

function RouteComponent() {
	const post = Route.useLoaderData();

	return (
		<article className="min-h-screen bg-white">
			{/* Header */}
			<Section className="border-gray-200 border-b py-24">
				<Container size="md">
					<div className="space-y-6">
						<h1 className="font-light text-4xl text-black leading-tight tracking-tight md:text-5xl">
							{post?.title}
						</h1>

						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-light text-gray-500 text-sm">
							{!!post?.author?.node && (
								<div className="flex items-center gap-2">
									{!!post.author.node.avatar?.url && (
										<img
											alt={post.author.node.name || undefined}
											className="h-6 w-6 rounded-full"
											height="24"
											src={post.author.node.avatar.url || undefined}
											width="24"
										/>
									)}
									<span>{post.author.node.name}</span>
								</div>
							)}
							{!!post?.author?.node && !!post?.date && (
								<Divider className="h-4" orientation="vertical" />
							)}
							{!!post?.date && (
								<time>
									{new Date(post.date).toLocaleDateString("zh-CN", {
										year: "numeric",
										month: "2-digit",
										day: "2-digit",
									})}
								</time>
							)}
						</div>

						{!!post?.categories?.nodes && post.categories.nodes.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{post.categories.nodes.map((category) => (
									<span
										className="border border-gray-200 px-3 py-1 font-light text-gray-600 text-xs uppercase tracking-wider"
										key={category.id}
									>
										{category.name}
									</span>
								))}
							</div>
						)}
					</div>
				</Container>
			</Section>

			{/* Featured Image */}
			{!!post?.featuredImage?.node && (
				<Section className="border-gray-200 border-b py-0">
					<Container size="lg">
						<div className="aspect-video overflow-hidden bg-gray-100">
							<img
								alt={post.featuredImage.node.altText || post.title || undefined}
								className="h-full w-full object-cover"
								height="720"
								src={post.featuredImage.node.sourceUrl || undefined}
								width="1280"
							/>
						</div>
					</Container>
				</Section>
			)}

			{/* Content */}
			<Section>
				<Container size="md">
					<div
						className="prose prose-lg max-w-none font-light prose-headings:font-light prose-a:text-black prose-headings:tracking-tight prose-a:underline prose-a:transition-opacity hover:prose-a:opacity-60"
						dangerouslySetInnerHTML={{
							__html: post?.content ?? "",
						}}
					/>
				</Container>
			</Section>

			{/* Tags */}
			{!!post?.tags?.nodes && post.tags.nodes.length > 0 && (
				<Section className="border-gray-200 border-t">
					<Container size="md">
						<div className="flex flex-wrap gap-2">
							{post.tags.nodes.map((tag) => (
								<span className="font-light text-gray-500 text-sm" key={tag.id}>
									#{tag.name}
								</span>
							))}
						</div>
					</Container>
				</Section>
			)}
		</article>
	);
}
