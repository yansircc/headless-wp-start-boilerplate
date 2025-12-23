import { LocalizedLink } from "@/components/localized-link";
import type { ProductCardProps } from "../-types";

export function ProductCard({
	slug,
	title,
	productAcfGroup,
	featuredImage,
}: ProductCardProps) {
	return (
		<LocalizedLink
			className="group block transition-all"
			to={`/products/${slug}`}
		>
			<article className="hover:-translate-y-2 h-full overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all hover:shadow-2xl">
				{!!featuredImage?.node && (
					<div className="aspect-square overflow-hidden bg-gray-50">
						<img
							alt={featuredImage.node.altText || title || ""}
							className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
							height="600"
							src={featuredImage.node.sourceUrl || ""}
							width="800"
						/>
					</div>
				)}
				<div className="space-y-4 p-6">
					<div className="flex items-start justify-between gap-4">
						<h3 className="font-bold text-black text-xl leading-tight transition-colors group-hover:text-blue-600">
							{title}
						</h3>
						{!!productAcfGroup?.price && (
							<span className="shrink-0 font-bold text-black text-xl">
								${Number(productAcfGroup.price).toLocaleString()}
							</span>
						)}
					</div>

					<div className="flex items-center justify-between border-gray-50 border-t pt-2">
						{typeof productAcfGroup?.stock === "number" && (
							<span
								className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest ${
									productAcfGroup.stock > 0
										? "bg-green-50 text-green-600"
										: "bg-red-50 text-red-600"
								}`}
							>
								{productAcfGroup.stock > 0 ? "In Stock" : "Out of Stock"}
							</span>
						)}
						<span className="font-medium text-gray-400 text-xs">
							View Details →
						</span>
					</div>
				</div>
			</article>
		</LocalizedLink>
	);
}
