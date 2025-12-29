import { LocalizedLink } from "@/components/localized-link";
import { OptimizedImage } from "@/components/optimized-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductCardProps } from "../-types";

export function ProductCard({
	slug,
	title,
	productAcfGroup,
	featuredImage,
}: ProductCardProps) {
	const inStock =
		typeof productAcfGroup?.stock === "number" && productAcfGroup.stock > 0;

	return (
		<LocalizedLink to={`/products/${slug}`}>
			<Card className="group h-full gap-0 overflow-hidden transition-shadow hover:shadow-lg">
				{featuredImage?.node ? (
					<div className="aspect-square overflow-hidden bg-muted">
						<OptimizedImage
							alt={featuredImage.node.altText || title || ""}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							height={400}
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
							src={featuredImage.node.sourceUrl}
							width={400}
						/>
					</div>
				) : null}
				<CardHeader>
					<div className="flex items-start justify-between gap-2">
						<CardTitle className="transition-colors group-hover:text-primary">
							{title}
						</CardTitle>
						{productAcfGroup?.price ? (
							<span className="shrink-0 font-bold">
								${Number(productAcfGroup.price).toLocaleString()}
							</span>
						) : null}
					</div>
				</CardHeader>
				<CardContent>
					{typeof productAcfGroup?.stock === "number" ? (
						<Badge variant={inStock ? "secondary" : "destructive"}>
							{inStock ? "In Stock" : "Out of Stock"}
						</Badge>
					) : null}
				</CardContent>
			</Card>
		</LocalizedLink>
	);
}
