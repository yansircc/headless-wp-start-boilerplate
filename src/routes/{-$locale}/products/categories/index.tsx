import { createFileRoute } from "@tanstack/react-router";
import { useIntlayer } from "react-intlayer";
import { Container, Section } from "@/components/shared";
import type { ProductCategoryFieldsFragment } from "@/graphql/types";
import {
	buildHreflangLinks,
	buildSeoMeta,
	getRouteSeo,
	seoConfig,
} from "@/lib/seo";
import { ProductCategoryCard } from "./-components/product-category-card";
import { getProductCategories } from "./-services";

export const Route = createFileRoute("/{-$locale}/products/categories/")({
	component: RouteComponent,
	loader: ({ params }) => {
		const locale = params.locale;
		return getProductCategories({ data: { locale } });
	},
	head: () => {
		const { title, description } = getRouteSeo("/products/categories");
		return {
			meta: buildSeoMeta(
				{
					title,
					description,
					canonical: "/products/categories",
				},
				seoConfig.site.url
			),
			links: buildHreflangLinks("/products/categories", seoConfig.site.url),
		};
	},
});

function RouteComponent() {
	const categories = Route.useLoaderData();
	const { sections } = useIntlayer("common");

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-gray-100 border-b pt-16 pb-24">
				<Container className="text-center" size="md">
					<div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1">
						<span className="font-bold text-[10px] text-orange-500 uppercase tracking-widest">
							{sections.productCategories?.badge ?? "Browse"}
						</span>
					</div>
					<h1 className="gradient-text font-bold text-5xl text-black tracking-tight">
						{sections.productCategories?.title ?? "Product Categories"}
					</h1>
					<p className="mt-4 text-gray-500 text-lg">
						{sections.productCategories?.subtitle ??
							"Explore our products by category"}
					</p>
				</Container>
			</Section>

			<Section className="pb-32">
				<Container size="lg">
					{(categories?.nodes?.length ?? 0) > 0 ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{categories?.nodes?.map(
								(category: ProductCategoryFieldsFragment) => (
									<ProductCategoryCard key={category.id} {...category} />
								)
							)}
						</div>
					) : (
						<div className="rounded-3xl border border-gray-200 border-dashed py-24 text-center font-normal text-gray-400">
							{sections.productCategories?.empty ?? "No categories found"}
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
