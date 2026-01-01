import { Home, Search } from "lucide-react";
import { useIntlayer } from "react-intlayer";
import { LocalizedLink } from "./localized-link";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function NotFoundPage() {
	const errors = useIntlayer("errors");

	return (
		<div className="flex min-h-[50vh] items-center justify-center p-4">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<div className="mx-auto mb-4 font-bold text-6xl text-muted-foreground/30">
						404
					</div>
					<CardTitle>{errors.notFound.title}</CardTitle>
					<CardDescription>{errors.notFound.message}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
					<Button asChild>
						<LocalizedLink to="/">
							<Home className="size-4" />
							{errors.notFound.backToHome}
						</LocalizedLink>
					</Button>
					<Button asChild variant="outline">
						<LocalizedLink to="/posts">
							<Search className="size-4" />
							{errors.notFound.browseArticles}
						</LocalizedLink>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

type ResourceNotFoundProps = {
	title?: string;
	message?: string;
	backTo?: string;
	backLabel?: string;
};

export function ResourceNotFound({
	title = "Not Found",
	message = "The resource you're looking for doesn't exist or has been removed.",
	backTo = "/",
	backLabel = "Go back",
}: ResourceNotFoundProps) {
	return (
		<Card className="text-center">
			<CardHeader>
				<div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
					<Search className="size-5 text-muted-foreground" />
				</div>
				<CardTitle className="text-lg">{title}</CardTitle>
				<CardDescription>{message}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button asChild variant="link">
					<LocalizedLink to={backTo}>{backLabel}</LocalizedLink>
				</Button>
			</CardContent>
		</Card>
	);
}
