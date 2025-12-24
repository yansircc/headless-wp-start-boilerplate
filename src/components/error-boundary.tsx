import type { ErrorComponentProps } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Container, Section } from "./shared";

/**
 * Global error component for uncaught errors
 */
export function GlobalError({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	const handleRetry = () => {
		reset();
		router.invalidate();
	};

	// Only show error details in development mode
	const showErrorDetails = import.meta.env.DEV && error;

	return (
		<div className="min-h-screen">
			<Section className="pt-16">
				<Container size="md">
					<div className="rounded-3xl border border-red-100 bg-red-50/50 py-16 text-center">
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
							<AlertCircle className="h-8 w-8 text-red-600" />
						</div>
						<h1 className="font-bold text-3xl text-gray-900 tracking-tight">
							Something went wrong
						</h1>
						<p className="mx-auto mt-4 max-w-md text-gray-600">
							An unexpected error occurred. Please try again or contact support
							if the problem persists.
						</p>
						{showErrorDetails ? (
							<details className="mx-auto mt-6 max-w-2xl text-left">
								<summary className="cursor-pointer font-medium text-red-600 text-sm">
									Error details
								</summary>
								<pre className="mt-2 overflow-auto rounded-xl bg-gray-900 p-4 font-mono text-red-400 text-xs">
									{error.message}
									{error.stack ? `\n\n${error.stack}` : null}
								</pre>
							</details>
						) : null}
						<button
							className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
							onClick={handleRetry}
							type="button"
						>
							<RefreshCw className="h-4 w-4" />
							Try again
						</button>
					</div>
				</Container>
			</Section>
		</div>
	);
}

/**
 * Route-level error component (can be used for specific routes)
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
	return (
		<div className="rounded-3xl border border-red-100 bg-red-50/50 py-12 text-center">
			<AlertCircle className="mx-auto h-10 w-10 text-red-500" />
			<h2 className="mt-4 font-bold text-gray-900 text-xl">
				Failed to load content
			</h2>
			<p className="mt-2 text-gray-600 text-sm">
				{error?.message || "An error occurred while loading this content."}
			</p>
			<button
				className="mt-6 rounded-xl bg-black px-5 py-2.5 font-medium text-sm text-white transition-all hover:bg-gray-800"
				onClick={reset}
				type="button"
			>
				Retry
			</button>
		</div>
	);
}
