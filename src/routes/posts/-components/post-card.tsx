import { Link } from "@tanstack/react-router";
import type { PostCardProps } from "../-types";

export function PostCard({
	slug,
	title,
	excerpt,
	date,
	featuredImage,
}: PostCardProps) {
	const formattedDate = date
		? new Date(date).toLocaleDateString("zh-CN", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			})
		: "";

	return (
		<Link
			className="group block border-gray-200 border-b pb-8 transition-opacity last:border-0 hover:opacity-60"
			params={{ postId: slug || "" }}
			to="/posts/$postId"
		>
			<article>
				{!!featuredImage?.node && (
					<div className="mb-4 aspect-[16/9] overflow-hidden bg-gray-100">
						<img
							alt={featuredImage.node.altText || title || ""}
							className="h-full w-full object-cover"
							height="400"
							src={featuredImage.node.sourceUrl || ""}
							width="600"
						/>
					</div>
				)}
				<div className="space-y-2">
					{!!date && (
						<time className="block font-light text-gray-500 text-xs uppercase tracking-wider">
							{formattedDate}
						</time>
					)}
					<h3 className="font-light text-black text-xl leading-tight">
						{title}
					</h3>
					{!!excerpt && excerpt.length > 0 && (
						<p className="line-clamp-2 font-light text-gray-600 text-sm leading-relaxed">
							{excerpt}
						</p>
					)}
				</div>
			</article>
		</Link>
	);
}
