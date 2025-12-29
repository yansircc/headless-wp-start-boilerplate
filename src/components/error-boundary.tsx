import type { ErrorComponentProps } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function GlobalError({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	const handleRetry = () => {
		reset();
		router.invalidate();
	};

	const showErrorDetails = import.meta.env.DEV && error;

	return (
		<div className="flex min-h-[50vh] items-center justify-center p-4">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircle className="size-6 text-destructive" />
					</div>
					<CardTitle>Something went wrong</CardTitle>
					<CardDescription>
						An unexpected error occurred. Please try again.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{showErrorDetails ? (
						<details className="text-left">
							<summary className="cursor-pointer text-destructive text-sm">
								Error details
							</summary>
							<pre className="mt-2 overflow-auto rounded bg-muted p-2 font-mono text-xs">
								{error.message}
								{error.stack ? `\n\n${error.stack}` : null}
							</pre>
						</details>
					) : null}
					<Button onClick={handleRetry}>
						<RefreshCw className="size-4" />
						Try again
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

export function RouteError({ error, reset }: ErrorComponentProps) {
	return (
		<Card className="text-center">
			<CardHeader>
				<div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10">
					<AlertCircle className="size-5 text-destructive" />
				</div>
				<CardTitle className="text-lg">Failed to load content</CardTitle>
				<CardDescription>
					{error?.message || "An error occurred while loading this content."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button onClick={reset} size="sm">
					Retry
				</Button>
			</CardContent>
		</Card>
	);
}
