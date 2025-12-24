import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useIntlayer } from "react-intlayer";
import { LocalizedLink } from "@/components/localized-link";
import { Container, Section } from "@/components/shared";
import type {
	PostFieldsFragment,
	ProductFieldsFragment,
} from "@/graphql/types";
import {
	buildHreflangLinks,
	buildSeoMeta,
	getRouteSeo,
	seoConfig,
} from "@/lib/seo";
import { getHomepageData } from "../-services";
import { PostCard } from "./posts/-components/post-card";
import { ProductCard } from "./products/-components/product-card";

export const Route = createFileRoute("/{-$locale}/")({
	component: Homepage,
	loader: ({ params }) => {
		const locale = params.locale;
		return getHomepageData({ data: { locale } });
	},
	head: () => {
		const { title, description } = getRouteSeo("/");
		return {
			meta: buildSeoMeta(
				{
					title,
					description,
					canonical: "/",
					image: seoConfig.defaults.image,
				},
				seoConfig.site.url
			),
			links: buildHreflangLinks("/", seoConfig.site.url),
		};
	},
});

function Homepage() {
	const data = Route.useLoaderData();
	const { homepage, sections, actions, errors } = useIntlayer("common");

	if (!data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-2xl text-black">
						{errors.loadFailed}
					</h2>
					<p className="text-gray-500">{errors.tryAgain}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<Section className="relative overflow-hidden pt-16 pb-32">
				<div className="-translate-x-1/2 -z-10 pointer-events-none absolute top-0 left-1/2 h-[500px] w-full max-w-7xl opacity-20 blur-[120px]">
					<div className="absolute top-0 left-1/4 h-full w-1/2 rounded-full bg-linear-to-r from-blue-400 to-purple-500" />
					<div className="absolute right-1/4 bottom-0 h-full w-1/2 rounded-full bg-linear-to-r from-orange-400 to-pink-500" />
				</div>

				<Container className="text-center">
					<div className="glass mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full px-3 py-1">
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
						</span>
						<span className="font-medium text-gray-600 text-xs uppercase tracking-widest">
							{homepage.badge}
						</span>
					</div>
					<h1 className="gradient-text mb-6 font-bold text-6xl text-black leading-[1.1] tracking-tight md:text-8xl">
						{homepage.title}
					</h1>
					<p className="mx-auto max-w-2xl font-normal text-gray-500 text-lg leading-relaxed md:text-xl">
						{homepage.subtitle}
					</p>
					<div className="mt-10 flex flex-wrap justify-center gap-4">
						<LocalizedLink
							className="rounded-2xl bg-black px-8 py-4 font-medium text-white transition-all hover:scale-105 hover:shadow-xl active:scale-95"
							to="/posts"
						>
							{actions.readPosts}
						</LocalizedLink>
						<LocalizedLink
							className="glass rounded-2xl px-8 py-4 font-medium transition-all hover:scale-105 hover:shadow-xl active:scale-95"
							to="/products"
						>
							{actions.viewProducts}
						</LocalizedLink>
					</div>
				</Container>
			</Section>

			{/* Main Content */}
			<main className="pb-32">
				<Container>
					<div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-32">
						{/* Articles Section */}
						<section>
							<div className="mb-12 flex items-end justify-between">
								<div>
									<h2 className="mb-2 font-bold text-3xl text-black tracking-tight">
										{sections.articles.title}
									</h2>
									<p className="text-gray-500 text-sm">
										{sections.articles.subtitle}
									</p>
								</div>
								{!!data?.postsHasMore && (
									<LocalizedLink
										className="group flex items-center gap-2 font-medium text-black text-sm transition-all hover:gap-3"
										to="/posts"
									>
										{actions.viewAll}
										<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
									</LocalizedLink>
								)}
							</div>

							{(data?.posts?.length ?? 0) > 0 ? (
								<div className="grid gap-12">
									{data.posts.map((post: PostFieldsFragment) => (
										<PostCard key={post.id} {...post} />
									))}
								</div>
							) : (
								<div className="rounded-3xl border border-gray-200 border-dashed py-16 text-center font-normal text-gray-400">
									{sections.articles.empty}
								</div>
							)}
						</section>

						{/* Products Section */}
						<section>
							<div className="mb-12 flex items-end justify-between">
								<div>
									<h2 className="mb-2 font-bold text-3xl text-black tracking-tight">
										{sections.products.title}
									</h2>
									<p className="text-gray-500 text-sm">
										{sections.products.subtitle}
									</p>
								</div>
								{!!data?.productsHasMore && (
									<LocalizedLink
										className="group flex items-center gap-2 font-medium text-black text-sm transition-all hover:gap-3"
										to="/products"
									>
										{actions.viewAll}
										<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
									</LocalizedLink>
								)}
							</div>

							{(data?.products?.length ?? 0) > 0 ? (
								<div className="grid gap-12">
									{data.products.map((product: ProductFieldsFragment) => (
										<ProductCard key={product.id} {...product} />
									))}
								</div>
							) : (
								<div className="rounded-3xl border border-gray-200 border-dashed py-16 text-center font-normal text-gray-400">
									{sections.products.empty}
								</div>
							)}
						</section>
					</div>
				</Container>
			</main>
		</div>
	);
}
