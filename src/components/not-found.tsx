import { Home, Search } from "lucide-react";
import { useIntlayer } from "react-intlayer";
import { LocalizedLink } from "./localized-link";
import { Container, Section } from "./shared";

/**
 * Global 404 page component
 */
export function NotFoundPage() {
	const { errors } = useIntlayer("common");

	return (
		<div className="min-h-screen">
			<Section className="pt-16">
				<Container size="md">
					<div className="py-16 text-center">
						<div className="relative mx-auto mb-8 h-32 w-32">
							<div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-blue-100 to-purple-100" />
							<div className="absolute inset-2 flex items-center justify-center rounded-full bg-white shadow-lg">
								<span className="font-bold text-5xl text-gray-300">404</span>
							</div>
						</div>
						<h1 className="font-bold text-4xl text-gray-900 tracking-tight">
							{errors.notFound.title}
						</h1>
						<p className="mx-auto mt-4 max-w-md text-gray-600">
							{errors.notFound.message}
						</p>
						<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
							<LocalizedLink
								className="inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
								to="/"
							>
								<Home className="h-4 w-4" />
								{errors.notFound.backToHome}
							</LocalizedLink>
							<LocalizedLink
								className="glass inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
								to="/posts"
							>
								<Search className="h-4 w-4" />
								{errors.notFound.browseArticles}
							</LocalizedLink>
						</div>
					</div>
				</Container>
			</Section>
		</div>
	);
}

type ResourceNotFoundProps = {
	title?: string;
	message?: string;
	backTo?: string;
	backLabel?: string;
};

/**
 * Reusable not found component for specific resources (posts, products, etc.)
 */
export function ResourceNotFound({
	title = "Not Found",
	message = "The resource you're looking for doesn't exist or has been removed.",
	backTo = "/",
	backLabel = "Go back",
}: ResourceNotFoundProps) {
	return (
		<div className="rounded-3xl border border-gray-200 border-dashed py-16 text-center">
			<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
				<Search className="h-5 w-5 text-gray-400" />
			</div>
			<h2 className="font-bold text-2xl text-gray-900 tracking-tight">
				{title}
			</h2>
			<p className="mx-auto mt-3 max-w-sm text-gray-500">{message}</p>
			<LocalizedLink
				className="mt-6 inline-flex items-center gap-2 font-bold text-black hover:underline"
				to={backTo}
			>
				{backLabel}
			</LocalizedLink>
		</div>
	);
}
