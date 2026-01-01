import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Regex patterns (top-level for biome performance rule)
const LANGUAGE_ENUM_PATTERN = /export enum LanguageCodeEnum \{([^}]+)\}/;
const LANGUAGE_KEY_PATTERN = /(\w+)\s*=/g;

// Extract locales from GraphQL LanguageCodeEnum (SSOT)
function getLocalesFromGraphQL(): string[] {
	try {
		const content = readFileSync("src/graphql/_generated/graphql.ts", "utf-8");
		const match = content.match(LANGUAGE_ENUM_PATTERN);
		if (match) {
			return [...match[1].matchAll(LANGUAGE_KEY_PATTERN)].map((m) =>
				m[1].toLowerCase()
			);
		}
	} catch {
		// Fallback if file not found
	}
	return ["en"];
}

const testLocales = getLocalesFromGraphQL();
const defaultTestLocale = testLocales.includes("en") ? "en" : testLocales[0];

// Build Locales object dynamically
const localesObject: Record<string, string> = {};
for (const locale of testLocales) {
	// Map common locale codes to Intlayer-style names
	const localeNames: Record<string, string> = {
		en: "ENGLISH",
		ja: "JAPANESE",
		zh: "CHINESE",
		es: "SPANISH",
		pt: "PORTUGUESE",
		af: "AFRIKAANS",
		ko: "KOREAN",
		fr: "FRENCH",
		de: "GERMAN",
		it: "ITALIAN",
		ru: "RUSSIAN",
	};
	const name = localeNames[locale] || locale.toUpperCase();
	localesObject[name] = locale;
}

// Mock intlayer to avoid esbuild issues in test environment
vi.mock("intlayer", () => ({
	configuration: {
		internationalization: {
			locales: testLocales,
			defaultLocale: defaultTestLocale,
		},
	},
	Locales: localesObject,
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

// Mock react-intlayer with separate content per key
const mockContent: Record<string, unknown> = {
	navigation: {
		home: "Home",
		posts: "Posts",
		products: "Products",
		language: "Language",
	},
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
	posts: {
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
};

vi.mock("react-intlayer", () => ({
	useIntlayer: (key: string) => mockContent[key] ?? {},
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
