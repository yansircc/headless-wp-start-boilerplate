import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock intlayer to avoid esbuild issues in test environment
vi.mock("intlayer", () => ({
	configuration: {
		internationalization: {
			locales: ["en", "ja", "zh"],
			defaultLocale: "en",
		},
	},
	Locales: {
		ENGLISH: "en",
		JAPANESE: "ja",
		CHINESE: "zh",
	},
	getLocalizedUrl: (url: string) => url,
}));

// Mock @tanstack/react-router for components using useParams/Link
vi.mock("@tanstack/react-router", () => {
	const React = require("react");
	return {
		useParams: () => ({ locale: undefined }),
		Link: (props: {
			children: React.ReactNode;
			to: string;
			className?: string;
		}) =>
			React.createElement(
				"a",
				{ href: props.to, className: props.className },
				props.children
			),
		createFileRoute: () => () => ({}),
	};
});

// Mock react-intlayer
vi.mock("react-intlayer", () => ({
	useIntlayer: () => ({
		navigation: { home: "Home", posts: "Posts", products: "Products" },
		actions: {
			viewAll: "View All",
			readMore: "Read More",
			readPosts: "Read Posts",
			viewProducts: "View Products",
		},
		homepage: {
			badge: "New Experience",
			title: "Modern Headless CMS.",
			subtitle: "Explore the latest insights...",
		},
		sections: {
			articles: {
				title: "Articles",
				subtitle: "Latest news",
				badge: "Insights",
				pageSubtitle: "Discover ideas...",
				empty: "No articles found",
			},
			products: {
				title: "Products",
				subtitle: "Quality items",
				badge: "Store",
				pageSubtitle: "Curated selection...",
				empty: "No products found",
			},
		},
		errors: {
			loadFailed: "Load Failed",
			tryAgain: "Please refresh the page",
			notFound: {
				title: "Page not found",
				message: "The page you're looking for doesn't exist or has been moved.",
				backToHome: "Back to Home",
				browseArticles: "Browse Articles",
			},
		},
		language: { switchLanguage: "Language" },
	}),
	IntlayerProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {
			// Deprecated API - intentionally empty
		},
		removeListener: () => {
			// Deprecated API - intentionally empty
		},
		addEventListener: () => {
			// Mock implementation - intentionally empty
		},
		removeEventListener: () => {
			// Mock implementation - intentionally empty
		},
		dispatchEvent: () => false,
	}),
});

// Mock scrollTo
Object.defineProperty(window, "scrollTo", {
	writable: true,
	value: () => {
		// Mock implementation - intentionally empty
	},
});

// Set React testing environment
// @ts-expect-error - global type
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
