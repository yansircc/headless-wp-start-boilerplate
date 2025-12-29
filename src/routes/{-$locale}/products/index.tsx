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
			<Section className="mb-16 border-border border-b pt-16 pb-24">
				<Container className="text-center" size="md">
					<div className="mb-6">
						<span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 font-bold text-[10px] text-primary uppercase tracking-widest">
							{sections.products.badge}
						</span>
					</div>
					<h1 className="gradient-text font-bold text-5xl text-foreground tracking-tight">
						{sections.products.title}
					</h1>
					<p className="mt-4 text-lg text-muted-foreground">
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
						<div className="rounded-3xl border border-border border-dashed py-24 text-center font-normal text-muted-foreground">
							{sections.products.empty}
						</div>
					)}
				</Container>
			</Section>
		</div>
	);
}
