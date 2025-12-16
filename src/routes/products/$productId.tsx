import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Container, Divider, Section } from "@/components/shared";
import { getProductBySlug } from "./-services";

export const Route = createFileRoute("/products/$productId")({
	component: RouteComponent,
	loader: async ({ params }) =>
		await getProductBySlug({ data: params.productId }),
});

function RouteComponent() {
	const product = Route.useLoaderData();

	if (!product) {
		return (
			<div className="min-h-screen bg-white">
				<Section>
					<Container size="md">
						<Link
							className="mb-8 inline-flex items-center gap-2 font-light text-gray-500 text-sm transition-opacity hover:opacity-60"
							to="/products"
						>
							<ArrowLeft className="h-4 w-4" />
							返回
						</Link>
						<div className="py-16 text-center">
							<h2 className="font-light text-2xl text-black">产品不存在</h2>
							<p className="mt-2 font-light text-gray-500 text-sm">
								请检查 URL 是否正确
							</p>
						</div>
					</Container>
				</Section>
			</div>
		);
	}

	return (
		<article className="min-h-screen bg-white">
			{/* Back Button */}
			<Section className="border-gray-200 border-b py-8">
				<Container size="lg">
					<Link
						className="inline-flex items-center gap-2 font-light text-gray-500 text-sm transition-opacity hover:opacity-60"
						to="/products"
					>
						<ArrowLeft className="h-4 w-4" />
						返回
					</Link>
				</Container>
			</Section>

			{/* Product Content */}
			<Section>
				<Container size="lg">
					<div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
						{/* Product Image */}
						<div>
							{product.featuredImage?.node?.sourceUrl ? (
								<div className="aspect-square overflow-hidden bg-gray-100">
									<img
										alt={
											product.featuredImage.node.altText ||
											product.title ||
											"产品图片"
										}
										className="h-full w-full object-cover"
										height="800"
										src={product.featuredImage.node.sourceUrl || undefined}
										width="800"
									/>
								</div>
							) : (
								<div className="flex aspect-square items-center justify-center bg-gray-100">
									<span className="font-light text-gray-400 text-sm">
										暂无图片
									</span>
								</div>
							)}
						</div>

						{/* Product Info */}
						<div className="space-y-8">
							<div className="space-y-4">
								<h1 className="font-light text-4xl text-black leading-tight tracking-tight">
									{product.title || "无标题"}
								</h1>

								{!!product.date && (
									<time className="block font-light text-gray-500 text-xs uppercase tracking-wider">
										{new Date(product.date).toLocaleDateString("zh-CN", {
											year: "numeric",
											month: "2-digit",
											day: "2-digit",
										})}
									</time>
								)}
							</div>

							<Divider />

							{/* Price */}
							{!!product.productAcfGroup?.price && (
								<div className="font-light text-3xl text-black">
									¥{Number(product.productAcfGroup.price).toFixed(2)}
								</div>
							)}

							{/* SKU and Stock */}
							<div className="space-y-2 font-light text-gray-600 text-sm">
								{!!product.productAcfGroup?.sku && (
									<div className="flex gap-2">
										<span className="text-gray-400">SKU:</span>
										<span>{product.productAcfGroup.sku}</span>
									</div>
								)}
								{typeof product.productAcfGroup?.stock === "number" && (
									<div className="flex gap-2">
										<span className="text-gray-400">库存:</span>
										<span
											className={
												product.productAcfGroup.stock > 0
													? "text-black"
													: "text-gray-400"
											}
										>
											{product.productAcfGroup.stock > 0
												? `${product.productAcfGroup.stock} 件`
												: "缺货"}
										</span>
									</div>
								)}
							</div>

							<Divider />

							{/* Description */}
							{!!product.content && (
								<div
									className="prose prose-sm max-w-none font-light prose-headings:font-light prose-a:text-black prose-headings:tracking-tight prose-a:underline prose-a:transition-opacity hover:prose-a:opacity-60"
									dangerouslySetInnerHTML={{
										__html: product.content,
									}}
								/>
							)}

							{/* Action Buttons */}
							<div className="flex gap-4 pt-8">
								<button
									className="flex-1 border border-black bg-black px-8 py-4 font-light text-sm text-white uppercase tracking-wider transition-opacity hover:opacity-80"
									type="button"
								>
									加入购物车
								</button>
								<button
									className="border border-gray-200 px-8 py-4 font-light text-gray-600 text-sm uppercase tracking-wider transition-opacity hover:opacity-60"
									type="button"
								>
									收藏
								</button>
							</div>
						</div>
					</div>
				</Container>
			</Section>
		</article>
	);
}
