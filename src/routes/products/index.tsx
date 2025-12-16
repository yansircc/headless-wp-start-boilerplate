import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "./-components/product-card";
import { getProducts } from "./-services";

export const Route = createFileRoute("/products/")({
	component: RouteComponent,
	loader: async () => await getProducts(),
});

function RouteComponent() {
	const products = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 px-6 py-12">
			<div className="mx-auto max-w-6xl">
				<h1 className="mb-8 font-bold text-3xl text-white">产品列表</h1>

				{!products?.nodes || products.nodes.length === 0 ? (
					<div className="py-12 text-center">
						<h2 className="font-semibold text-2xl text-gray-400">暂无产品</h2>
						<p className="mt-2 text-gray-500">请稍后再来查看</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{products.nodes.map((product) => (
							<ProductCard key={product.id} {...product} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
