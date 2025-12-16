import { Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
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
				month: "long",
				day: "numeric",
			})
		: "";

	const truncatedExcerpt =
		excerpt && excerpt.length > 100 ? `${excerpt.slice(0, 100)}...` : excerpt;

	return (
		<Link
			className="group block overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-lg"
			params={{ postId: slug || "" }}
			to="/posts/$postId"
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
				{!!truncatedExcerpt && (
					<p className="mb-4 line-clamp-3 text-gray-400 leading-relaxed">
						{truncatedExcerpt}
					</p>
				)}
				{!!date && (
					<div className="flex items-center gap-2 text-gray-500 text-sm">
						<Calendar className="h-4 w-4" />
						<time dateTime={date}>{formattedDate}</time>
					</div>
				)}
			</div>
		</Link>
	);
}
