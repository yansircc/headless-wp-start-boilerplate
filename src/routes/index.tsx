import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Newspaper, ShoppingBag } from "lucide-react";
import { getHomepageData } from "./-services";
import { PostCard } from "./posts/-components/post-card";
import { ProductCard } from "./products/-components/product-card";

export const Route = createFileRoute("/")({
	component: Homepage,
	loader: async () => await getHomepageData(),
});

function Homepage() {
	const data = Route.useLoaderData();

	if (!data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
				<div className="text-center">
					<h2 className="mb-2 font-bold text-2xl text-white">加载失败</h2>
					<p className="text-gray-400">请刷新页面重试或联系管理员。</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Header Section */}
			<section className="relative overflow-hidden px-6 py-16 text-center">
				<div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
				<div className="relative mx-auto max-w-4xl">
					<h1 className="mb-4 font-black text-4xl text-white tracking-[-0.08em] md:text-5xl">
						欢迎来到我们的
						<span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
							{" "}
							首页
						</span>
					</h1>
					<p className="text-gray-300 text-lg md:text-xl">
						探索最新的文章和产品
					</p>
				</div>
			</section>

			{/* Main Content */}
			<main className="px-6 pb-16">
				<div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
					{/* Articles Section */}
					<section>
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Newspaper className="h-6 w-6 text-cyan-400" />
								<h2 className="font-bold text-2xl text-white">最新文章</h2>
								<span className="text-gray-400 text-sm">
									({data?.posts.length || 0} 篇文章)
								</span>
							</div>
							{!!data?.postsHasMore && (
								<Link
									className="flex items-center gap-2 font-medium text-cyan-400 text-sm transition-colors hover:text-cyan-300"
									to="/posts"
								>
									查看全部
									<ArrowRight className="h-4 w-4" />
								</Link>
							)}
						</div>

						{(data?.posts?.length ?? 0) > 0 ? (
							<div className="space-y-4">
								{data.posts.map((post) => (
									<PostCard key={post.id} {...post} />
								))}
							</div>
						) : (
							<div className="py-12 text-center text-gray-400">暂无文章</div>
						)}
					</section>

					{/* Products Section */}
					<section>
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<ShoppingBag className="h-6 w-6 text-cyan-400" />
								<h2 className="font-bold text-2xl text-white">热门产品</h2>
								<span className="text-gray-400 text-sm">
									({data?.products.length || 0} 个产品)
								</span>
							</div>
							{!!data?.productsHasMore && (
								<Link
									className="flex items-center gap-2 font-medium text-cyan-400 text-sm transition-colors hover:text-cyan-300"
									to="/products"
								>
									查看全部
									<ArrowRight className="h-4 w-4" />
								</Link>
							)}
						</div>

						{(data?.products?.length ?? 0) > 0 ? (
							<div className="space-y-4">
								{data.products.map((product) => (
									<ProductCard key={product.id} {...product} />
								))}
							</div>
						) : (
							<div className="py-12 text-center text-gray-400">暂无产品</div>
						)}
					</section>
				</div>
			</main>
		</div>
	);
}
