import { LocalizedLink } from "@/components/localized-link";

type ProductCategoryCardProps = {
	slug?: string | null;
	name?: string | null;
	description?: string | null;
	count?: number | null;
};

export function ProductCategoryCard({
	slug,
	name,
	description,
	count,
}: ProductCategoryCardProps) {
	if (!(slug && name)) {
		return null;
	}

	return (
		<LocalizedLink
			className="group block transition-all"
			to={`/products/categories/${slug}`}
		>
			<article className="hover:-translate-y-1 rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:shadow-xl">
				<h3 className="font-bold text-black text-xl transition-colors group-hover:text-orange-600">
					{name}
				</h3>
				{!!description && (
					<p className="mt-2 line-clamp-2 text-gray-500 text-sm">
						{description}
					</p>
				)}
				<div className="mt-4 flex items-center justify-between border-gray-50 border-t pt-4">
					<span className="rounded-full bg-orange-50 px-3 py-1 font-bold text-[10px] text-orange-600 uppercase tracking-widest">
						{count ?? 0} products
					</span>
					<span className="font-medium text-gray-400 text-xs group-hover:text-orange-500">
						View All &rarr;
					</span>
				</div>
			</article>
		</LocalizedLink>
	);
}
