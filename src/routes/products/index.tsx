import { createFileRoute } from "@tanstack/react-router";
import { Container, Section } from "@/components/shared";
import { buildSeoMeta, getRouteSeo, seoConfig } from "@/lib/seo";
import { ProductCard } from "./-components/product-card";
import { getProducts } from "./-services";

export const Route = createFileRoute("/products/")({
	component: RouteComponent,
	loader: async () => await getProducts(),
	head: () => {
		const { title, description } = getRouteSeo("/products");
		return {
			meta: buildSeoMeta(
				{
					title,
					description,
					canonical: "/products",
				},
				seoConfig.site.url
			),
		};
	},
});

function RouteComponent() {
	const products = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-white">
			<Section className="border-gray-200 border-b py-24">
				<Container size="md">
					<h1 className="font-light text-4xl text-black tracking-tight">
						产品
					</h1>
				</Container>
			</Section>

			<Section>
				<Container size="lg">
					{(products?.nodes?.length ?? 0) > 0 ? (
						<div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
							{products?.nodes?.map((product) => (
								<ProductCard key={product.id} {...product} />
							))}
						</div>
					) : (
						<div className="py-16 text-center font-light text-gray-400">
							暂无产品
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
