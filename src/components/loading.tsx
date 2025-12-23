import { Container, Section } from "./shared";

/**
 * Global loading spinner for route transitions
 */
export function GlobalLoading() {
	return (
		<div className="min-h-screen">
			<Section className="pt-16">
				<Container size="md">
					<div className="flex flex-col items-center justify-center py-24">
						<LoadingSpinner size="lg" />
						<p className="mt-4 font-medium text-gray-500 text-sm">Loading...</p>
					</div>
				</Container>
			</Section>
		</div>
	);
}

type LoadingSpinnerProps = {
	size?: "sm" | "md" | "lg";
	className?: string;
};

const sizeMap = {
	sm: "h-5 w-5 border-2",
	md: "h-8 w-8 border-2",
	lg: "h-12 w-12 border-3",
};

/**
 * Reusable loading spinner
 */
export function LoadingSpinner({
	size = "md",
	className = "",
}: LoadingSpinnerProps) {
	return (
		<div
			className={`animate-spin rounded-full border-gray-200 border-t-black ${sizeMap[size]} ${className}`}
		/>
	);
}

/**
 * Skeleton loader for content cards
 */
export function CardSkeleton() {
	return (
		<div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-6">
			<div className="aspect-video rounded-2xl bg-gray-100" />
			<div className="mt-6 space-y-3">
				<div className="h-4 w-1/4 rounded bg-gray-100" />
				<div className="h-6 w-3/4 rounded bg-gray-100" />
				<div className="h-4 w-full rounded bg-gray-100" />
			</div>
		</div>
	);
}

/**
 * Grid skeleton for list pages
 */
export function GridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items never reorder
				<CardSkeleton key={i} />
			))}
		</div>
	);
}

/**
 * Article detail skeleton
 */
export function ArticleSkeleton() {
	return (
		<div className="min-h-screen animate-pulse">
			<Section className="pt-16 pb-24">
				<Container size="md">
					<div className="space-y-6">
						<div className="h-4 w-24 rounded bg-gray-100" />
						<div className="h-12 w-3/4 rounded bg-gray-100" />
						<div className="flex gap-4">
							<div className="h-10 w-10 rounded-full bg-gray-100" />
							<div className="space-y-2">
								<div className="h-3 w-20 rounded bg-gray-100" />
								<div className="h-4 w-32 rounded bg-gray-100" />
							</div>
						</div>
					</div>
				</Container>
			</Section>
			<Section className="py-0">
				<Container size="lg">
					<div className="aspect-video rounded-3xl bg-gray-100" />
				</Container>
			</Section>
			<Section>
				<Container size="md">
					<div className="space-y-4">
						<div className="h-4 w-full rounded bg-gray-100" />
						<div className="h-4 w-full rounded bg-gray-100" />
						<div className="h-4 w-2/3 rounded bg-gray-100" />
					</div>
				</Container>
			</Section>
		</div>
	);
}

/**
 * Product detail skeleton
 */
export function ProductSkeleton() {
	return (
		<div className="min-h-screen animate-pulse">
			<Section className="pt-16 pb-8">
				<Container size="lg">
					<div className="h-4 w-32 rounded bg-gray-100" />
				</Container>
			</Section>
			<Section className="pb-32">
				<Container size="lg">
					<div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
						<div className="aspect-square rounded-3xl bg-gray-100" />
						<div className="space-y-8">
							<div className="space-y-4">
								<div className="h-4 w-24 rounded bg-gray-100" />
								<div className="h-10 w-3/4 rounded bg-gray-100" />
							</div>
							<div className="h-8 w-32 rounded bg-gray-100" />
							<div className="space-y-3">
								<div className="h-4 w-full rounded bg-gray-100" />
								<div className="h-4 w-full rounded bg-gray-100" />
								<div className="h-4 w-2/3 rounded bg-gray-100" />
							</div>
						</div>
					</div>
				</Container>
			</Section>
		</div>
	);
}
