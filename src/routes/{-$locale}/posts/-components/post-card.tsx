import { LocalizedLink } from "@/components/localized-link";
import { OptimizedImage } from "@/components/optimized-image";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { PostCardProps } from "../-types";

export function PostCard({
	slug,
	title,
	excerpt,
	date,
	featuredImage,
}: PostCardProps) {
	const formattedDate = date
		? new Date(date).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: "";

	return (
		<LocalizedLink to={`/posts/${slug}`}>
			<Card className="group flex flex-col gap-0 overflow-hidden transition-shadow hover:shadow-lg md:flex-row">
				{featuredImage?.node ? (
					<div className="h-48 shrink-0 overflow-hidden md:h-auto md:w-48">
						<OptimizedImage
							alt={featuredImage.node.altText || title || ""}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							height={192}
							sizes="(max-width: 768px) 100vw, 192px"
							src={featuredImage.node.sourceUrl}
							width={192}
						/>
					</div>
				) : null}
				<div className="flex flex-1 flex-col">
					<CardHeader>
						{date ? (
							<time className="text-muted-foreground text-xs">
								{formattedDate}
							</time>
						) : null}
						<CardTitle className="transition-colors group-hover:text-primary">
							{title}
						</CardTitle>
					</CardHeader>
					{!!excerpt && excerpt.length > 0 ? (
						<CardContent>
							<CardDescription
								className="line-clamp-2"
								dangerouslySetInnerHTML={{ __html: excerpt }}
							/>
						</CardContent>
					) : null}
				</div>
			</Card>
		</LocalizedLink>
	);
}
