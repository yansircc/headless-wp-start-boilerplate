import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ArticleSkeleton } from "@/components/loading";
import { LocalizedLink } from "@/components/localized-link";
import { ResourceNotFound } from "@/components/not-found";
import { OptimizedImage } from "@/components/optimized-image";
import { Container, Section } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PostCategory, PostTag } from "@/graphql/types";
import { buildHreflangLinks, seoConfig } from "@/lib/seo";
import { buildYoastMeta, buildYoastSchema } from "@/lib/seo/yoast";
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
		const canonical = `/posts/${params.postId}`;
		const seo = post?.seo;
		const schema = buildYoastSchema(seo);

		return {
			meta: buildYoastMeta(seo),
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
			<Section className="border-border border-b pt-16 pb-24">
				<Container size="md">
					<div className="space-y-10">
						<Button asChild className="gap-2" size="sm" variant="ghost">
							<LocalizedLink to="/posts">
								<ArrowLeft className="h-4 w-4" />
								Back to Articles
							</LocalizedLink>
						</Button>

						<div className="space-y-6">
							<div className="flex flex-wrap items-center gap-3">
								{post.categories?.nodes?.map((category: PostCategory) => (
									<Badge key={category.id} variant="secondary">
										{category.name}
									</Badge>
								))}
							</div>

							<h1 className="gradient-text font-bold text-5xl text-foreground leading-[1.1] tracking-tight md:text-6xl">
								{post.title}
							</h1>

							<div className="flex flex-wrap items-center gap-6 pt-4">
								{!!post.author?.node && (
									<div className="flex items-center gap-3">
										<Avatar>
											{!!post.author.node.avatar?.url && (
												<AvatarImage
													alt={post.author.node.name || "Author"}
													src={post.author.node.avatar.url}
												/>
											)}
											<AvatarFallback>
												{post.author.node.name?.charAt(0) || "A"}
											</AvatarFallback>
										</Avatar>
										<div>
											<span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
												Written by
											</span>
											<span className="font-medium text-foreground text-sm">
												{post.author.node.name}
											</span>
										</div>
									</div>
								)}

								{!!post.date && (
									<div className="flex flex-col">
										<span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
											Published on
										</span>
										<time className="font-medium text-foreground text-sm">
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
						<div className="aspect-video overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
							<OptimizedImage
								alt={
									post.featuredImage.node.altText ||
									post.title ||
									"Featured image"
								}
								className="h-full w-full object-cover"
								height={720}
								priority
								sizes="(max-width: 1024px) 100vw, 1024px"
								src={post.featuredImage.node.sourceUrl}
								width={1280}
							/>
						</div>
					</Container>
				</Section>
			)}

			{/* Content */}
			<Section className="pb-32">
				<Container size="md">
					<div
						className="prose prose-lg md:prose-xl max-w-none prose-img:rounded-3xl prose-headings:font-bold prose-a:text-primary prose-headings:text-foreground text-muted-foreground leading-relaxed prose-headings:tracking-tight prose-a:no-underline prose-img:shadow-lg hover:prose-a:underline"
						dangerouslySetInnerHTML={{
							__html: post.content ?? "",
						}}
					/>
				</Container>
			</Section>

			{/* Tags */}
			{!!post.tags?.nodes && post.tags.nodes.length > 0 && (
				<Section className="border-border border-t pb-32">
					<Container size="md">
						<div className="flex flex-wrap gap-3">
							{post.tags.nodes.map((tag: PostTag) => (
								<Badge
									className="cursor-default px-4 py-2 text-sm"
									key={tag.id}
									variant="outline"
								>
									#{tag.name}
								</Badge>
							))}
						</div>
					</Container>
				</Section>
			)}
		</article>
	);
}
