import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { GlobalError } from "../components/error-boundary";
import Header from "../components/header";
import { NotFoundPage } from "../components/not-found";
import { seoConfig } from "../lib/seo";
import appCss from "../styles.css?url";

type MyRouterContext = {
	queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: seoConfig.site.name,
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),

	// Root-level error boundary (catches errors from all child routes)
	errorComponent: GlobalError,
	// Root-level 404 page
	notFoundComponent: NotFoundPage,
	// Main app component
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	return <Outlet />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang={seoConfig.site.language}>
			<head>
				<HeadContent />
			</head>
			<body>
				<Header />
				{children}
				<Scripts />
			</body>
		</html>
	);
}
