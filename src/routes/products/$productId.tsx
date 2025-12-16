import { createFileRoute, Link } from "@tanstack/react-router";
import { getProductBySlug } from "./-services";

export const Route = createFileRoute("/products/$productId")({
	component: RouteComponent,
	loader: async ({ params }) =>
		await getProductBySlug({ data: params.productId }),
});

function RouteComponent() {
	const product = Route.useLoaderData();

	// 如果产品不存在
	if (!product) {
		return (
			<div className="container mx-auto px-4 py-8">
				<button
					className="inline-flexcyan-600 hover mb-6 items-center text-:text-cyan-800"
					onClick={() => window.history.back()}
					type="button"
				>
					← 返回
				</button>
				<div className="py-12 text-center">
					<h2 className="font-semibold text-2xl text-gray-600">产品不存在</h2>
					<p className="mt-2 text-gray-500">请检查 URL 是否正确</p>
				</div>
			</div>
		);
	}

	return (
		<article className="container mx-auto max-w-6xl px-4 py-8">
			{/* 返回按钮 */}
			{/* <button
				onClick={() => window.history.back()}
				className="mb-6 inline-flex items-center text-cyan-600 hover:text-cyan-800"
			>
				← 返回
			</button> */}
			<Link to="/products">← 返回</Link>

			<div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
				{/* 产品图片 */}
				<div>
					{product.featuredImage?.node?.sourceUrl ? (
						<img
							alt={
								product.featuredImage.node.altText ||
								product.title ||
								"产品图片"
							}
							className="w-full rounded-lg shadow-lg"
							height="600"
							src={product.featuredImage.node.sourceUrl || undefined}
							width="800"
						/>
					) : (
						<div className="flex h-96 w-full items-center justify-center rounded-lg bg-gray-200">
							<span className="text-gray-400">暂无图片</span>
						</div>
					)}
				</div>

				{/* 产品信息 */}
				<div>
					<h1 className="mb-4 font-bold text-4xl">
						{product.title || "无标题"}
					</h1>

					<time className="mb-4 block text-gray-500 text-sm">
						{product.date
							? new Date(product.date).toLocaleDateString("zh-CN", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})
							: "未知日期"}
					</time>

					{/* 产品价格 */}
					{!!product.productAcfGroup?.price && (
						<div className="mb-4 font-bold text-3xl text-cyan-600">
							¥{product.productAcfGroup.price}
						</div>
					)}

					{/* SKU 和库存状态 */}
					<div className="mb-6 flex flex-wrap gap-4">
						{!!product.productAcfGroup?.sku && (
							<div className="text-gray-600">
								<span className="font-medium">SKU:</span>{" "}
								{product.productAcfGroup.sku}
							</div>
						)}
						{typeof product.productAcfGroup?.stock === "number" && (
							<div className="font-medium">
								{product.productAcfGroup.stock > 0 ? (
									<span className="text-green-600">
										✓ 库存: {product.productAcfGroup.stock}
									</span>
								) : (
									<span className="text-red-600">✗ 缺货</span>
								)}
							</div>
						)}
					</div>

					{/* 产品描述 */}
					{!!product.content && (
						<div
							className="prose prose-lg mb-8 max-w-none"
							dangerouslySetInnerHTML={{
								__html: product.content,
							}}
						/>
					)}

					{/* 操作按钮 */}
					<div className="mt-8 flex gap-4">
						<button
							className="flex-1 rounded-lg bg-cyan-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-cyan-600"
							type="button"
						>
							加入购物车
						</button>
						<button
							className="rounded-lg border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
							type="button"
						>
							收藏
						</button>
					</div>
				</div>
			</div>
		</article>
	);
}
