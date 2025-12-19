import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Container, Divider, Section } from "@/components/shared";
import {
	buildSchemaScript,
	buildSeoMeta,
	generateDescription,
	getDynamicRouteSeo,
	seoConfig,
} from "@/lib/seo";
import { getProductBySlug } from "./-services";

export const Route = createFileRoute("/products/$productId")({
	component: RouteComponent,
	loader: async ({ params }) =>
		await getProductBySlug({ data: params.productId }),
	head: ({ loaderData: product, params }) => {
		const { title, type } = getDynamicRouteSeo(
			"/products/$productId",
			product?.title
		);
		const config = {
			title,
			description: generateDescription(product?.content),
			canonical: `/products/${params.productId}`,
			image: product?.featuredImage?.node?.sourceUrl ?? undefined,
			imageAlt:
				product?.featuredImage?.node?.altText ?? product?.title ?? undefined,
			type,
		};

		const schema = buildSchemaScript({
			...config,
			siteName: seoConfig.site.name,
			siteUrl: seoConfig.site.url,
		});

		return {
			meta: buildSeoMeta(config, seoConfig.site.url),
			scripts: schema ? [schema] : [],
		};
	},
});

function RouteComponent() {
	const product = Route.useLoaderData();

	if (!product) {
		return (
			<div className="min-h-screen">
				<Section className="pt-16">
					<Container size="md">
						<Link
							className="group mb-8 inline-flex items-center gap-2 font-medium text-gray-500 text-sm transition-all hover:text-black"
							to="/products"
						>
							<ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
							Back to Products
						</Link>
						<div className="rounded-3xl border border-gray-200 border-dashed py-24 text-center">
							<h2 className="font-bold text-3xl text-black tracking-tight">
								Product Not Found
							</h2>
							<p className="mt-4 text-gray-500">
								Please check if the URL is correct or try searching again.
							</p>
						</div>
					</Container>
				</Section>
			</div>
		);
	}

	return (
		<article className="min-h-screen">
			{/* Back Button */}
			<Section className="pt-16 pb-8">
				<Container size="lg">
					<Link
						className="group inline-flex items-center gap-2 font-medium text-gray-500 text-sm transition-all hover:text-black"
						to="/products"
					>
						<ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
						Back to Products
					</Link>
				</Container>
			</Section>

			{/* Product Content */}
			<Section className="pb-32">
				<Container size="lg">
					<div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
						{/* Product Image */}
						<div className="sticky top-32">
							{product.featuredImage?.node?.sourceUrl ? (
								<div className="aspect-square overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl transition-all hover:shadow-2xl">
									<img
										alt={
											product.featuredImage.node.altText ||
											product.title ||
											"Product image"
										}
										className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
										height="800"
										src={product.featuredImage.node.sourceUrl || undefined}
										width="800"
									/>
								</div>
							) : (
								<div className="flex aspect-square items-center justify-center rounded-3xl border border-gray-200 border-dashed bg-gray-50">
									<span className="font-medium text-gray-400 text-sm">
										No Image Available
									</span>
								</div>
							)}
						</div>

						{/* Product Info */}
						<div className="space-y-10 lg:pl-8">
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<span className="glass rounded-full px-3 py-1 font-bold text-[10px] text-orange-500 uppercase tracking-widest">
										Product Details
									</span>
									{typeof product.productAcfGroup?.stock === "number" && (
										<span
											className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest ${
												product.productAcfGroup.stock > 0
													? "bg-green-50 text-green-600"
													: "bg-red-50 text-red-600"
											}`}
										>
											{product.productAcfGroup.stock > 0
												? "In Stock"
												: "Out of Stock"}
										</span>
									)}
								</div>
								<h1 className="gradient-text font-bold text-5xl text-black leading-tight tracking-tight">
									{product.title || "Untitled"}
								</h1>

								{!!product.date && (
									<time className="block font-medium text-gray-400 text-xs uppercase tracking-widest">
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
									<span className="font-bold text-4xl text-black">
										${Number(product.productAcfGroup.price).toLocaleString()}
									</span>
									<span className="font-medium text-gray-400">USD</span>
								</div>
							)}

							<Divider className="opacity-50" />

							{/* Description */}
							{!!product.content && (
								<div className="space-y-4">
									<h2 className="font-bold text-gray-900 text-sm uppercase tracking-widest">
										Description
									</h2>
									<div
										className="prose prose-base max-w-none prose-headings:font-bold prose-a:text-blue-600 text-gray-600 leading-relaxed prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline"
										dangerouslySetInnerHTML={{
											__html: product.content,
										}}
									/>
								</div>
							)}

							{/* Product Metadata */}
							<div className="grid grid-cols-2 gap-8 border-gray-100 border-t border-b py-8">
								{!!product.productAcfGroup?.sku && (
									<div>
										<span className="mb-1 block font-bold text-[10px] text-gray-400 uppercase tracking-widest">
											SKU
										</span>
										<span className="font-medium text-black">
											{product.productAcfGroup.sku}
										</span>
									</div>
								)}
								{typeof product.productAcfGroup?.stock === "number" && (
									<div>
										<span className="mb-1 block font-bold text-[10px] text-gray-400 uppercase tracking-widest">
											Availability
										</span>
										<span className="font-medium text-black">
											{product.productAcfGroup.stock > 0
												? `${product.productAcfGroup.stock} units left`
												: "Currently unavailable"}
										</span>
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col gap-4 sm:flex-row">
								<button
									className="flex-1 rounded-2xl bg-black px-8 py-5 font-bold text-base text-white transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
									disabled={product.productAcfGroup?.stock === 0}
									type="button"
								>
									Add to Cart
								</button>
								<button
									className="glass rounded-2xl px-8 py-5 font-bold text-base transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
									type="button"
								>
									Wishlist
								</button>
							</div>
						</div>
					</div>
				</Container>
			</Section>
		</article>
	);
}
