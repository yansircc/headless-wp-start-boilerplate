import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/shared";
import { buildSeoMeta, seoConfig } from "@/lib/seo";
import { getHomepageData } from "./-services";
import { PostCard } from "./posts/-components/post-card";
import { ProductCard } from "./products/-components/product-card";

export const Route = createFileRoute("/")({
	component: Homepage,
	loader: async () => await getHomepageData(),
	head: () => ({
		meta: buildSeoMeta(
			{
				title: seoConfig.siteName,
				description: seoConfig.defaultDescription,
				canonical: "/",
				image: seoConfig.defaultImage,
			},
			seoConfig.siteUrl
		),
	}),
});

function Homepage() {
	const data = Route.useLoaderData();

	if (!data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white">
				<div className="text-center">
					<h2 className="mb-2 font-medium text-2xl text-black">加载失败</h2>
					<p className="text-gray-500">请刷新页面重试</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			{/* Header Section */}
			<Section className="border-gray-200 border-b py-24">
				<Container className="text-center" size="md">
					<h1 className="mb-4 font-light text-5xl text-black tracking-tight">
						Welcome
					</h1>
					<p className="font-light text-gray-600 text-lg">
						探索最新的文章和产品
					</p>
				</Container>
			</Section>

			{/* Main Content */}
			<main>
				<Container>
					<div className="grid grid-cols-1 gap-24 lg:grid-cols-2">
						{/* Articles Section */}
						<section>
							<div className="mb-8 flex items-baseline justify-between border-gray-200 border-b pb-4">
								<h2 className="font-light text-2xl text-black tracking-tight">
									文章
								</h2>
								{!!data?.postsHasMore && (
									<Link
										className="flex items-center gap-1 font-light text-black text-sm transition-opacity hover:opacity-60"
										to="/posts"
									>
										全部
										<ArrowRight className="h-3 w-3" />
									</Link>
								)}
							</div>

							{(data?.posts?.length ?? 0) > 0 ? (
								<div className="space-y-8">
									{data.posts.map((post) => (
										<PostCard key={post.id} {...post} />
									))}
								</div>
							) : (
								<div className="py-16 text-center font-light text-gray-400">
									暂无文章
								</div>
							)}
						</section>

						{/* Products Section */}
						<section>
							<div className="mb-8 flex items-baseline justify-between border-gray-200 border-b pb-4">
								<h2 className="font-light text-2xl text-black tracking-tight">
									产品
								</h2>
								{!!data?.productsHasMore && (
									<Link
										className="flex items-center gap-1 font-light text-black text-sm transition-opacity hover:opacity-60"
										to="/products"
									>
										全部
										<ArrowRight className="h-3 w-3" />
									</Link>
								)}
							</div>

							{(data?.products?.length ?? 0) > 0 ? (
								<div className="space-y-8">
									{data.products.map((product) => (
										<ProductCard key={product.id} {...product} />
									))}
								</div>
							) : (
								<div className="py-16 text-center font-light text-gray-400">
									暂无产品
								</div>
							)}
						</section>
					</div>
				</Container>
			</main>
		</div>
	);
}
