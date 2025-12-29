import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useIntlayer } from "react-intlayer";
import { LocalizedLink } from "@/components/localized-link";
import { Container, Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
	PostFieldsFragment,
	ProductFieldsFragment,
} from "@/graphql/types";
import {
	buildHreflangLinks,
	buildYoastArchiveMeta,
	getArchiveSeo,
	getDefaultOgImage,
	getStaticPagesSeo,
	seoConfig,
} from "@/lib/seo";
import { getHomepageData } from "../-services";
import { PostCard } from "./posts/-components/post-card";
import { ProductCard } from "./products/-components/product-card";

export const Route = createFileRoute("/{-$locale}/")({
	component: Homepage,
	loader: async ({ params }) => {
		const locale = params.locale;
		const [homepageData, seoData] = await Promise.all([
			getHomepageData({ data: { locale } }),
			getStaticPagesSeo({ data: {} }),
		]);
		return { ...homepageData, seo: seoData.data };
	},
	head: ({ loaderData }) => {
		const archive = getArchiveSeo(loaderData?.seo, "page");
		const defaultImage = getDefaultOgImage(loaderData?.seo);
		return {
			meta: buildYoastArchiveMeta(archive, {
				defaultImage,
				siteUrl: seoConfig.site.url,
				canonical: "/",
			}),
			links: buildHreflangLinks("/", seoConfig.site.url),
		};
	},
});

function Homepage() {
	const data = Route.useLoaderData();
	const { homepage, sections, actions, errors } = useIntlayer("common");

	if (!data) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-2xl">{errors.loadFailed}</h2>
					<p className="text-muted-foreground">{errors.tryAgain}</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Hero Section */}
			<Section className="text-center">
				<Container size="md">
					<Badge className="mb-4" variant="secondary">
						{homepage.badge}
					</Badge>
					<h1 className="mb-4 font-bold text-4xl tracking-tight md:text-6xl">
						{homepage.title}
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						{homepage.subtitle}
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Button asChild size="lg">
							<LocalizedLink to="/posts">{actions.readPosts}</LocalizedLink>
						</Button>
						<Button asChild size="lg" variant="outline">
							<LocalizedLink to="/products">
								{actions.viewProducts}
							</LocalizedLink>
						</Button>
					</div>
				</Container>
			</Section>

			{/* Main Content */}
			<Section>
				<Container>
					<div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
						{/* Articles Section */}
						<section>
							<div className="mb-6 flex items-end justify-between">
								<div>
									<h2 className="font-bold text-2xl tracking-tight">
										{sections.articles.title}
									</h2>
									<p className="text-muted-foreground text-sm">
										{sections.articles.subtitle}
									</p>
								</div>
								{data?.postsHasMore ? (
									<Button asChild size="sm" variant="ghost">
										<LocalizedLink to="/posts">
											{actions.viewAll}
											<ArrowRight className="size-4" />
										</LocalizedLink>
									</Button>
								) : null}
							</div>

							{(data?.posts?.length ?? 0) > 0 ? (
								<div className="space-y-4">
									{data.posts.map((post: PostFieldsFragment) => (
										<PostCard key={post.id} {...post} />
									))}
								</div>
							) : (
								<div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
									{sections.articles.empty}
								</div>
							)}
						</section>

						{/* Products Section */}
						<section>
							<div className="mb-6 flex items-end justify-between">
								<div>
									<h2 className="font-bold text-2xl tracking-tight">
										{sections.products.title}
									</h2>
									<p className="text-muted-foreground text-sm">
										{sections.products.subtitle}
									</p>
								</div>
								{data?.productsHasMore ? (
									<Button asChild size="sm" variant="ghost">
										<LocalizedLink to="/products">
											{actions.viewAll}
											<ArrowRight className="size-4" />
										</LocalizedLink>
									</Button>
								) : null}
							</div>

							{(data?.products?.length ?? 0) > 0 ? (
								<div className="space-y-4">
									{data.products.map((product: ProductFieldsFragment) => (
										<ProductCard key={product.id} {...product} />
									))}
								</div>
							) : (
								<div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
									{sections.products.empty}
								</div>
							)}
						</section>
					</div>
				</Container>
			</Section>
		</div>
	);
}
