import { Loader2 } from "lucide-react";
import { Container, Section } from "./shared";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function GlobalLoading() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<div className="flex flex-col items-center gap-2">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground text-sm">Loading...</p>
			</div>
		</div>
	);
}

export function LoadingSpinner({ className }: { className?: string }) {
	return <Loader2 className={`animate-spin ${className ?? "size-6"}`} />;
}

export function CardSkeleton() {
	return (
		<Card>
			<Skeleton className="aspect-video w-full" />
			<CardHeader className="space-y-2">
				<Skeleton className="h-4 w-1/4" />
				<Skeleton className="h-5 w-3/4" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-4 w-full" />
			</CardContent>
		</Card>
	);
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items
				<CardSkeleton key={i} />
			))}
		</div>
	);
}

export function ArticleSkeleton() {
	return (
		<div className="space-y-8">
			<Section>
				<Container className="space-y-4" size="md">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-3/4" />
					<div className="flex items-center gap-3">
						<Skeleton className="size-10 rounded-full" />
						<div className="space-y-1">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-32" />
						</div>
					</div>
				</Container>
			</Section>
			<Container size="lg">
				<Skeleton className="aspect-video w-full" />
			</Container>
			<Section>
				<Container className="space-y-3" size="md">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</Container>
			</Section>
		</div>
	);
}

export function ProductSkeleton() {
	return (
		<Section>
			<Container size="lg">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
					<Skeleton className="aspect-square w-full" />
					<div className="space-y-6">
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-8 w-3/4" />
						</div>
						<Skeleton className="h-6 w-32" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					</div>
				</div>
			</Container>
		</Section>
	);
}
