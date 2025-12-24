import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LocalizedLink } from "@/components/localized-link";
import { Container, Section } from "@/components/shared";
import type { ProductFieldsFragment } from "@/graphql/types";
import { buildHreflangLinks, buildSeoMeta, seoConfig } from "@/lib/seo";
import { ProductCard } from "../-components/product-card";
import { getProductCategoryBySlug, getProductsByCategory } from "./-services";

export const Route = createFileRoute(
	"/{-$locale}/products/categories/$categorySlug"
)({
	component: RouteComponent,
	loader: async ({ params }) => {
		const { categorySlug, locale } = params;
		const [category, products] = await Promise.all([
			getProductCategoryBySlug({ data: { slug: categorySlug, locale } }),
			getProductsByCategory({ data: { categorySlug, locale } }),
		]);

		if (!category) {
			throw notFound();
		}

		return { category, products };
	},
	head: ({ loaderData, params }) => {
		const title = loaderData?.category?.name ?? "Category";
		const description =
			loaderData?.category?.description ??
			`Browse products in ${title} category`;
		const canonical = `/products/categories/${params.categorySlug}`;

		return {
			meta: buildSeoMeta(
				{
					title: `${title} - Products`,
					description,
					canonical,
				},
				seoConfig.site.url
			),
			links: buildHreflangLinks(canonical, seoConfig.site.url),
		};
	},
});

function RouteComponent() {
	const { category, products } = Route.useLoaderData();

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-gray-100 border-b pt-16 pb-24">
				<Container size="md">
					<LocalizedLink
						className="group mb-8 inline-flex items-center gap-2 font-medium text-gray-500 text-sm hover:text-black"
						to="/products/categories"
					>
						<ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
						All Categories
					</LocalizedLink>
					<h1 className="gradient-text font-bold text-5xl text-black tracking-tight">
						{category.name}
					</h1>
					{!!category.description && (
						<p className="mt-4 text-gray-500 text-lg">{category.description}</p>
					)}
					<p className="mt-2 text-gray-400 text-sm">
						{category.count ?? 0} products
					</p>
				</Container>
			</Section>

			<Section className="pb-32">
				<Container size="lg">
					{(products?.nodes?.length ?? 0) > 0 ? (
						<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
							{products?.nodes?.map((product: ProductFieldsFragment) => (
								<ProductCard key={product.id} {...product} />
							))}
						</div>
					) : (
						<div className="rounded-3xl border border-gray-200 border-dashed py-24 text-center font-normal text-gray-400">
							No products in this category
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
