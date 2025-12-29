import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useParams,
} from "@tanstack/react-router";
import { configuration, type LocalesValues } from "intlayer";
import { IntlayerProvider } from "react-intlayer";
import { GlobalError } from "../components/error-boundary";
import Header from "../components/header";
import { NotFoundPage } from "../components/not-found";
import { StaleBanner } from "../components/stale-banner";
import { getFontPreloadLinks } from "../lib/fonts";
import { getResourceHints } from "../lib/performance";
import { seoConfig } from "../lib/seo";
import { StaleIndicatorProvider } from "../lib/stale-indicator/context";
import appCss from "../styles.css?url";

type MyRouterContext = {
	queryClient: QueryClient;
};

const { internationalization } = configuration;
const { locales, defaultLocale } = internationalization;

/**
 * Check if a string is a valid locale
 */
function isValidLocale(locale: string | undefined): locale is LocalesValues {
	if (!locale) {
		return false;
	}
	return locales.some((l) => l.toString() === locale);
}

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
			// Resource hints for external origins (preconnect)
			...getResourceHints(),
			// Preload fonts before stylesheet for better LCP
			...getFontPreloadLinks(),
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
	// Get locale from URL params (will be undefined for default locale routes)
	const params = useParams({ strict: false });
	const urlLocale = (params as { locale?: string }).locale;
	const currentLocale = isValidLocale(urlLocale) ? urlLocale : defaultLocale;

	return (
		<IntlayerProvider locale={currentLocale}>
			<StaleIndicatorProvider>
				<StaleBanner />
				<Header />
				<Outlet />
			</StaleIndicatorProvider>
		</IntlayerProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	// Get locale from URL params for html lang attribute
	const params = useParams({ strict: false });
	const urlLocale = (params as { locale?: string }).locale;
	const currentLocale = isValidLocale(urlLocale)
		? urlLocale
		: defaultLocale.toString();

	return (
		<html lang={currentLocale}>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
