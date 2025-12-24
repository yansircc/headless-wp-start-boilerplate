import { LocalizedLink } from "@/components/localized-link";

type CategoryCardProps = {
	slug?: string | null;
	name?: string | null;
	description?: string | null;
	count?: number | null;
};

export function CategoryCard({
	slug,
	name,
	description,
	count,
}: CategoryCardProps) {
	if (!(slug && name)) {
		return null;
	}

	return (
		<LocalizedLink
			className="group block transition-all"
			to={`/posts/categories/${slug}`}
		>
			<article className="hover:-translate-y-1 rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:shadow-xl">
				<h3 className="font-bold text-black text-xl transition-colors group-hover:text-blue-600">
					{name}
				</h3>
				{!!description && (
					<p className="mt-2 line-clamp-2 text-gray-500 text-sm">
						{description}
					</p>
				)}
				<div className="mt-4 flex items-center justify-between border-gray-50 border-t pt-4">
					<span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-[10px] text-blue-600 uppercase tracking-widest">
						{count ?? 0} articles
					</span>
					<span className="font-medium text-gray-400 text-xs group-hover:text-blue-500">
						View All &rarr;
					</span>
				</div>
			</article>
		</LocalizedLink>
	);
}
