import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ArticleSkeleton } from "@/components/loading";
import { LocalizedLink } from "@/components/localized-link";
import { ResourceNotFound } from "@/components/not-found";
import { Container, Section } from "@/components/shared";
import type { PostCategory, PostTag } from "@/graphql/types";
import {
	buildHreflangLinks,
	buildSchemaScript,
	buildSeoMeta,
	generateDescription,
	getDynamicRouteSeo,
	seoConfig,
} from "@/lib/seo";
import { getPostBySlug } from "./-services";

export const Route = createFileRoute("/{-$locale}/posts/$postId")({
	component: RouteComponent,
	pendingComponent: ArticleSkeleton,
	notFoundComponent: () => (
		<Section className="pt-16">
			<Container size="md">
				<ResourceNotFound
					backLabel="Back to Articles"
					backTo="/posts"
					message="This article might have been moved or deleted."
					title="Post Not Found"
				/>
			</Container>
		</Section>
	),
	loader: async ({ params }) => {
		const post = await getPostBySlug({
			data: { slug: params.postId, locale: params.locale },
		});
		if (!post) {
			throw notFound();
		}
		return post;
	},
	head: ({ loaderData: post, params }) => {
		const { title, type } = getDynamicRouteSeo("/posts/$postId", post?.title);
		const canonical = `/posts/${params.postId}`;
		const config = {
			title,
			description: generateDescription(post?.content, post?.excerpt),
			canonical,
			image: post?.featuredImage?.node?.sourceUrl ?? undefined,
			imageAlt: post?.featuredImage?.node?.altText ?? post?.title ?? undefined,
			type,
			publishedTime: post?.date ?? undefined,
			author: post?.author?.node?.name ?? undefined,
		};

		const schema = buildSchemaScript({
			...config,
			siteName: seoConfig.site.name,
			siteUrl: seoConfig.site.url,
		});

		return {
			meta: buildSeoMeta(config, seoConfig.site.url),
			links: buildHreflangLinks(canonical, seoConfig.site.url),
			scripts: schema ? [schema] : [],
		};
	},
});

function RouteComponent() {
	const post = Route.useLoaderData();

	return (
		<article className="min-h-screen">
			{/* Header */}
			<Section className="border-gray-50 border-b pt-16 pb-24">
				<Container size="md">
					<div className="space-y-10">
						<LocalizedLink
							className="group inline-flex items-center gap-2 font-medium text-gray-500 text-sm transition-all hover:text-black"
							to="/posts"
						>
							<ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
							Back to Articles
						</LocalizedLink>

						<div className="space-y-6">
							<div className="flex flex-wrap items-center gap-3">
								{post.categories?.nodes?.map((category: PostCategory) => (
									<span
										className="rounded-full bg-blue-50 px-3 py-1 font-bold text-[10px] text-blue-600 uppercase tracking-widest"
										key={category.id}
									>
										{category.name}
									</span>
								))}
							</div>

							<h1 className="gradient-text font-bold text-5xl text-black leading-[1.1] tracking-tight md:text-6xl">
								{post.title}
							</h1>

							<div className="flex flex-wrap items-center gap-6 pt-4">
								{!!post.author?.node && (
									<div className="flex items-center gap-3">
										{!!post.author.node.avatar?.url && (
											<div className="h-10 w-10 overflow-hidden rounded-full border border-gray-100 shadow-sm">
												<img
													alt={post.author.node.name || "Author"}
													className="h-full w-full object-cover"
													height="40"
													src={post.author.node.avatar.url || undefined}
													width="40"
												/>
											</div>
										)}
										<div>
											<span className="block font-bold text-[10px] text-gray-400 uppercase tracking-widest">
												Written by
											</span>
											<span className="font-medium text-black text-sm">
												{post.author.node.name}
											</span>
										</div>
									</div>
								)}

								{!!post.date && (
									<div className="flex flex-col">
										<span className="block font-bold text-[10px] text-gray-400 uppercase tracking-widest">
											Published on
										</span>
										<time className="font-medium text-black text-sm">
											{new Date(post.date).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</time>
									</div>
								)}
							</div>
						</div>
					</div>
				</Container>
			</Section>

			{/* Featured Image */}
			{!!post.featuredImage?.node && (
				<Section className="-mt-12 relative z-10 mb-12 py-0">
					<Container size="lg">
						<div className="aspect-video overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
							<img
								alt={
									post.featuredImage.node.altText ||
									post.title ||
									"Featured image"
								}
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
			<Section className="pb-32">
				<Container size="md">
					<div
						className="prose prose-lg md:prose-xl max-w-none prose-img:rounded-3xl prose-headings:font-bold prose-a:text-blue-600 prose-headings:text-black text-gray-700 leading-relaxed prose-headings:tracking-tight prose-a:no-underline prose-img:shadow-lg hover:prose-a:underline"
						dangerouslySetInnerHTML={{
							__html: post.content ?? "",
						}}
					/>
				</Container>
			</Section>

			{/* Tags */}
			{!!post.tags?.nodes && post.tags.nodes.length > 0 && (
				<Section className="border-gray-50 border-t pb-32">
					<Container size="md">
						<div className="flex flex-wrap gap-3">
							{post.tags.nodes.map((tag: PostTag) => (
								<span
									className="cursor-default rounded-2xl bg-gray-50 px-4 py-2 font-medium text-gray-500 text-sm transition-colors hover:bg-gray-100"
									key={tag.id}
								>
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
