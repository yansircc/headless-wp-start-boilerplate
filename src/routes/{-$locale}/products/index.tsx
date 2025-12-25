import { createFileRoute } from "@tanstack/react-router";
import { useIntlayer } from "react-intlayer";
import { Container, Section } from "@/components/shared";
import type { ProductFieldsFragment } from "@/graphql/types";
import {
	buildHreflangLinks,
	buildYoastArchiveMeta,
	getArchiveSeo,
	getDefaultOgImage,
	getStaticPagesSeo,
	seoConfig,
} from "@/lib/seo";
import { ProductCard } from "./-components/product-card";
import { getProducts } from "./-services";

export const Route = createFileRoute("/{-$locale}/products/")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const locale = params.locale;
		const [products, seoData] = await Promise.all([
			getProducts({ data: { locale } }),
			getStaticPagesSeo({ data: {} }),
		]);
		return { products, seo: seoData.data };
	},
	head: ({ loaderData }) => {
		const archive = getArchiveSeo(loaderData?.seo, "product");
		const defaultImage = getDefaultOgImage(loaderData?.seo);
		return {
			meta: buildYoastArchiveMeta(archive, {
				defaultImage,
				siteUrl: seoConfig.site.url,
				canonical: "/products",
			}),
			links: buildHreflangLinks("/products", seoConfig.site.url),
		};
	},
});

function RouteComponent() {
	const { products } = Route.useLoaderData();
	const { sections } = useIntlayer("common");

	return (
		<div className="min-h-screen">
			<Section className="mb-16 border-gray-100 border-b pt-16 pb-24">
				<Container className="text-center" size="md">
					<div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1">
						<span className="font-bold text-[10px] text-orange-500 uppercase tracking-widest">
							{sections.products.badge}
						</span>
					</div>
					<h1 className="gradient-text font-bold text-5xl text-black tracking-tight">
						{sections.products.title}
					</h1>
					<p className="mt-4 text-gray-500 text-lg">
						{sections.products.pageSubtitle}
					</p>
				</Container>
			</Section>

			<Section className="pb-32">
				<Container size="lg">
					{(products?.nodes?.length ?? 0) > 0 ? (
						<div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
							{products?.nodes?.map((product: ProductFieldsFragment) => (
								<ProductCard key={product.id} {...product} />
							))}
						</div>
					) : (
						<div className="rounded-3xl border border-gray-200 border-dashed py-24 text-center font-normal text-gray-400">
							{sections.products.empty}
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
