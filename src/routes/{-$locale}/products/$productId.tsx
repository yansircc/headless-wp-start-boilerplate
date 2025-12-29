import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProductSkeleton } from "@/components/loading";
import { LocalizedLink } from "@/components/localized-link";
import { ResourceNotFound } from "@/components/not-found";
import { OptimizedImage } from "@/components/optimized-image";
import { Container, Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { buildHreflangLinks, seoConfig } from "@/lib/seo";
import { buildYoastMeta, buildYoastSchema } from "@/lib/seo/yoast";
import { getProductBySlug } from "./-services";

export const Route = createFileRoute("/{-$locale}/products/$productId")({
	component: RouteComponent,
	pendingComponent: ProductSkeleton,
	notFoundComponent: () => (
		<Section className="pt-16">
			<Container size="md">
				<ResourceNotFound
					backLabel="Back to Products"
					backTo="/products"
					message="This product might have been removed or is no longer available."
					title="Product Not Found"
				/>
			</Container>
		</Section>
	),
	loader: async ({ params }) => {
		const product = await getProductBySlug({
			data: { slug: params.productId, locale: params.locale },
		});
		if (!product) {
			throw notFound();
		}
		return product;
	},
	head: ({ loaderData: product, params }) => {
		const canonical = `/products/${params.productId}`;
		const seo = product?.seo;
		const schema = buildYoastSchema(seo);

		return {
			meta: buildYoastMeta(seo),
			links: buildHreflangLinks(canonical, seoConfig.site.url),
			scripts: schema ? [schema] : [],
		};
	},
});

function RouteComponent() {
	const product = Route.useLoaderData();

	return (
		<article className="min-h-screen">
			{/* Back Button */}
			<Section className="pt-16 pb-8">
				<Container size="lg">
					<Button asChild className="gap-2" size="sm" variant="ghost">
						<LocalizedLink to="/products">
							<ArrowLeft className="h-4 w-4" />
							Back to Products
						</LocalizedLink>
					</Button>
				</Container>
			</Section>

			{/* Product Content */}
			<Section className="pb-32">
				<Container size="lg">
					<div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
						{/* Product Image */}
						<div className="sticky top-32">
							{product.featuredImage?.node?.sourceUrl ? (
								<div className="aspect-square overflow-hidden rounded-3xl border border-border bg-card shadow-xl transition-all hover:shadow-2xl">
									<OptimizedImage
										alt={
											product.featuredImage.node.altText ||
											product.title ||
											"Product image"
										}
										className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
										height={600}
										priority
										sizes="(max-width: 1024px) 100vw, 50vw"
										src={product.featuredImage.node.sourceUrl}
										width={600}
									/>
								</div>
							) : (
								<div className="flex aspect-square items-center justify-center rounded-3xl border border-border border-dashed bg-muted">
									<span className="font-medium text-muted-foreground text-sm">
										No Image Available
									</span>
								</div>
							)}
						</div>

						{/* Product Info */}
						<div className="space-y-10 lg:pl-8">
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<span className="glass rounded-full px-3 py-1 font-bold text-[10px] text-primary uppercase tracking-widest">
										Product Details
									</span>
									{typeof product.productAcfGroup?.stock === "number" && (
										<Badge
											variant={
												product.productAcfGroup.stock > 0
													? "secondary"
													: "destructive"
											}
										>
											{product.productAcfGroup.stock > 0
												? "In Stock"
												: "Out of Stock"}
										</Badge>
									)}
								</div>
								<h1 className="gradient-text font-bold text-5xl text-foreground leading-tight tracking-tight">
									{product.title || "Untitled"}
								</h1>

								{!!product.date && (
									<time className="block font-medium text-muted-foreground text-xs uppercase tracking-widest">
										Published on{" "}
										{new Date(product.date).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</time>
								)}
							</div>

							{/* Price */}
							{!!product.productAcfGroup?.price && (
								<div className="flex items-baseline gap-2">
									<span className="font-bold text-4xl text-foreground">
										${Number(product.productAcfGroup.price).toLocaleString()}
									</span>
									<span className="font-medium text-muted-foreground">USD</span>
								</div>
							)}

							<Separator className="opacity-50" />

							{/* Description */}
							{!!product.content && (
								<div className="space-y-4">
									<h2 className="font-bold text-foreground text-sm uppercase tracking-widest">
										Description
									</h2>
									<div
										className="prose prose-base max-w-none prose-headings:font-bold prose-a:text-primary text-muted-foreground leading-relaxed prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline"
										dangerouslySetInnerHTML={{
											__html: product.content,
										}}
									/>
								</div>
							)}

							{/* Product Metadata */}
							<div className="grid grid-cols-2 gap-8 border-border border-t border-b py-8">
								{!!product.productAcfGroup?.sku && (
									<div>
										<span className="mb-1 block font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
											SKU
										</span>
										<span className="font-medium text-foreground">
											{product.productAcfGroup.sku}
										</span>
									</div>
								)}
								{typeof product.productAcfGroup?.stock === "number" && (
									<div>
										<span className="mb-1 block font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
											Availability
										</span>
										<span className="font-medium text-foreground">
											{product.productAcfGroup.stock > 0
												? `${product.productAcfGroup.stock} units left`
												: "Currently unavailable"}
										</span>
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col gap-4 sm:flex-row">
								<Button
									className="flex-1"
									disabled={product.productAcfGroup?.stock === 0}
									size="lg"
								>
									Add to Cart
								</Button>
								<Button size="lg" variant="outline">
									Wishlist
								</Button>
							</div>
						</div>
					</div>
				</Container>
			</Section>
		</article>
	);
}
