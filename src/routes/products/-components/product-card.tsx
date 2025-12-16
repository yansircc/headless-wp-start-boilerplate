import { Link } from "@tanstack/react-router";
import { CheckCircle, DollarSign, XCircle } from "lucide-react";
import type { ProductCardProps } from "../-types";

export function ProductCard({
	slug,
	title,
	productAcfGroup,
	featuredImage,
}: ProductCardProps) {
	return (
		<Link
			className="group block overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-lg"
			params={{ productId: slug || "" }}
			to="/products/$productId"
		>
			{!!featuredImage?.node && (
				<div className="aspect-video overflow-hidden bg-slate-700">
					<img
						alt={featuredImage.node.altText || title || ""}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						height="400"
						src={featuredImage.node.sourceUrl || ""}
						width="600"
					/>
				</div>
			)}
			<div className="p-5">
				<h3 className="mb-3 line-clamp-2 font-semibold text-white text-xl transition-colors group-hover:text-cyan-400">
					{title}
				</h3>
				<div className="space-y-3">
					{!!productAcfGroup?.price && (
						<div className="flex items-center gap-2 text-gray-300">
							<DollarSign className="h-4 w-4" />
							<span className="font-medium">
								¥{Number(productAcfGroup.price).toFixed(2)}
							</span>
						</div>
					)}
					{typeof productAcfGroup?.stock === "number" && (
						<div className="flex items-center gap-2">
							{productAcfGroup.stock > 0 ? (
								<>
									<CheckCircle className="h-4 w-4 text-green-500" />
									<span className="font-medium text-green-500 text-sm">
										有库存
									</span>
								</>
							) : (
								<>
									<XCircle className="h-4 w-4 text-red-500" />
									<span className="font-medium text-red-500 text-sm">缺货</span>
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}
