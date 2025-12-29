import { LocalizedLink } from "@/components/localized-link";
import { OptimizedImage } from "@/components/optimized-image";
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
				month: "long",
				day: "numeric",
			})
		: "";

	return (
		<LocalizedLink className="group block transition-all" to={`/posts/${slug}`}>
			<article className="hover:-translate-y-1 flex flex-col gap-6 rounded-3xl p-4 transition-all hover:bg-white hover:shadow-xl md:flex-row">
				{!!featuredImage?.node && (
					<div className="h-32 shrink-0 overflow-hidden rounded-2xl bg-gray-100 md:w-48">
						<OptimizedImage
							alt={featuredImage.node.altText || title || ""}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
							height={128}
							sizes="(max-width: 768px) 100vw, 192px"
							src={featuredImage.node.sourceUrl}
							width={192}
						/>
					</div>
				)}
				<div className="flex flex-col justify-center space-y-3">
					{!!date && (
						<time className="block font-medium text-blue-500 text-xs uppercase tracking-widest">
							{formattedDate}
						</time>
					)}
					<h3 className="font-bold text-black text-xl leading-snug transition-colors group-hover:text-blue-600">
						{title}
					</h3>
					{!!excerpt && excerpt.length > 0 && (
						<div
							className="line-clamp-2 font-normal text-gray-500 text-sm leading-relaxed"
							dangerouslySetInnerHTML={{ __html: excerpt }}
						/>
					)}
				</div>
			</article>
		</LocalizedLink>
	);
}
