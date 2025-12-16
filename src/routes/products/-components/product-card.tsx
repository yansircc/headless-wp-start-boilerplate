import { Link } from "@tanstack/react-router";
import type { ProductCardProps } from "../-types";

export function ProductCard({
	slug,
	title,
	productAcfGroup,
	featuredImage,
}: ProductCardProps) {
	return (
		<Link
			className="group block border-gray-200 border-b pb-8 transition-opacity last:border-0 hover:opacity-60"
			params={{ productId: slug || "" }}
			to="/products/$productId"
		>
			<article>
				{!!featuredImage?.node && (
					<div className="mb-4 aspect-4/3 overflow-hidden bg-gray-100">
						<img
							alt={featuredImage.node.altText || title || ""}
							className="h-full w-full object-cover"
							height="600"
							src={featuredImage.node.sourceUrl || ""}
							width="800"
						/>
					</div>
				)}
				<div className="space-y-2">
					<h3 className="font-light text-black text-xl leading-tight">
						{title}
					</h3>
					<div className="flex items-baseline gap-4">
						{!!productAcfGroup?.price && (
							<span className="font-light text-black text-lg">
								¥{Number(productAcfGroup.price).toFixed(2)}
							</span>
						)}
						{typeof productAcfGroup?.stock === "number" && (
							<span
								className={`font-light text-xs uppercase tracking-wider ${
									productAcfGroup.stock > 0 ? "text-gray-500" : "text-gray-400"
								}`}
							>
								{productAcfGroup.stock > 0 ? "In Stock" : "Out of Stock"}
							</span>
						)}
					</div>
				</div>
			</article>
		</Link>
	);
}
