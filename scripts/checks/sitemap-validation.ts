/**
 * Sitemap Validation Check
 *
 * Verifies that URLs in WordPress sitemaps can be resolved
 * by the frontend after URL transformation.
 *
 * Checks all sitemaps: post, page, category, product, product-category
 */

import { readFile } from "node:fs/promises";
import {
	type CheckResult,
	printCheck,
	printSkipped,
	printWarning,
} from "./types";

// ============================================
// Types
// ============================================

type SitemapUrl = {
	loc: string;
	transformedLoc: string;
	valid: boolean;
	reason?: string;
};

type SitemapValidationResult = {
	sitemapType: string;
	urls: SitemapUrl[];
	errors: string[];
	warnings: string[];
};

// ============================================
// Configuration (derived from GraphQL LanguageCodeEnum - SSOT)
// ============================================

const GRAPHQL_FILE = "src/graphql/_generated/graphql.ts";
const LANGUAGE_ENUM_PATTERN = /export enum LanguageCodeEnum \{([^}]+)\}/;

/**
 * Extract language codes from GraphQL LanguageCodeEnum (SSOT)
 */
async function getLocaleCodes(): Promise<Set<string>> {
	try {
		const content = await readFile(GRAPHQL_FILE, "utf-8");
		const enumMatch = content.match(LANGUAGE_ENUM_PATTERN);
		if (!enumMatch) {
			// Fallback to common locales if GraphQL file not found
			return new Set(["en", "ja", "zh", "es", "pt"]);
		}
		const languages = [...enumMatch[1].matchAll(/(\w+)\s*=/g)].map((m) =>
			m[1].toLowerCase()
		);
		return new Set(languages);
	} catch {
		// Fallback to common locales if file read fails
		return new Set(["en", "ja", "zh", "es", "pt"]);
	}
}

// Will be populated at runtime
const LOCALE_CODES: Set<string> = new Set();

const STATIC_PAGES = new Set([
	"blog",
	"about",
	"contact",
	"privacy",
	"terms",
	"home",
]);

// Top-level regex patterns for performance
const RE_LOCALIZED_HOME = /^\/([a-z]{2})\/home\/?$/;
const RE_CATEGORY = /^\/category\/([a-z0-9-]+)\/?$/;
const RE_LOCALIZED_CATEGORY = /^\/([a-z]{2})\/category\/([a-z0-9-]+)\/?$/;
const RE_TAG = /^\/tag\/([a-z0-9-]+)\/?$/;
const RE_LOCALIZED_TAG = /^\/([a-z]{2})\/tag\/([a-z0-9-]+)\/?$/;
const RE_PRODUCT = /^\/product\/([a-z0-9-]+)\/?$/;
const RE_LOCALIZED_PRODUCT = /^\/([a-z]{2})\/product\/([a-z0-9-]+)\/?$/;
const RE_PRODUCT_CATEGORY = /^\/product-category\/([a-z0-9-]+)\/?$/;
const RE_LOCALIZED_PRODUCT_CATEGORY =
	/^\/([a-z]{2})\/product-category\/([a-z0-9-]+)\/?$/;
const RE_BLOG = /^\/blog\/?$/;
const RE_LOCALIZED_BLOG = /^\/([a-z]{2})\/blog\/?$/;
const RE_LOCALIZED_SLUG = /^\/([a-z]{2})\/([a-z0-9-]+)\/?$/;
const RE_SLUG = /^\/([a-z0-9-]+)\/?$/;
const RE_LOC = /<loc>([^<]+)<\/loc>/g;

const SKIP_PATTERNS = [
	/^\/products\//,
	/^\/author\//,
	/^\/page\//,
	/^\/wp-/,
	/^\/[a-z]{2}\/products\//,
];

// ============================================
// Frontend Route Patterns
// ============================================

const FRONTEND_ROUTE_PATTERNS: Array<{
	pattern: RegExp;
	description: string;
}> = [
	// Homepage
	{ pattern: /^\/$/, description: "Homepage" },
	{ pattern: /^\/[a-z]{2}\/$/, description: "Localized homepage" },
	// Posts
	{ pattern: /^\/posts\/?$/, description: "Posts list" },
	{ pattern: /^\/posts\/[a-z0-9-]+\/?$/, description: "Post single" },
	{ pattern: /^\/posts\/categories\/?$/, description: "Categories list" },
	{
		pattern: /^\/posts\/categories\/[a-z0-9-]+\/?$/,
		description: "Category archive",
	},
	{ pattern: /^\/posts\/tags\/?$/, description: "Tags list" },
	{ pattern: /^\/posts\/tags\/[a-z0-9-]+\/?$/, description: "Tag archive" },
	// Products
	{ pattern: /^\/products\/?$/, description: "Products list" },
	{ pattern: /^\/products\/[a-z0-9-]+\/?$/, description: "Product single" },
	{
		pattern: /^\/products\/categories\/?$/,
		description: "Product categories list",
	},
	{
		pattern: /^\/products\/categories\/[a-z0-9-]+\/?$/,
		description: "Product category archive",
	},
	// Localized posts
	{ pattern: /^\/[a-z]{2}\/posts\/?$/, description: "Posts list (localized)" },
	{
		pattern: /^\/[a-z]{2}\/posts\/[a-z0-9-]+\/?$/,
		description: "Post single (localized)",
	},
	{
		pattern: /^\/[a-z]{2}\/posts\/categories\/?$/,
		description: "Categories list (localized)",
	},
	{
		pattern: /^\/[a-z]{2}\/posts\/categories\/[a-z0-9-]+\/?$/,
		description: "Category archive (localized)",
	},
	{
		pattern: /^\/[a-z]{2}\/posts\/tags\/?$/,
		description: "Tags list (localized)",
	},
	{
		pattern: /^\/[a-z]{2}\/posts\/tags\/[a-z0-9-]+\/?$/,
		description: "Tag archive (localized)",
	},
	// Localized products
	{
		pattern: /^\/[a-z]{2}\/products\/?$/,
		description: "Products list (localized)",
	},
	{
		pattern: /^\/[a-z]{2}\/products\/[a-z0-9-]+\/?$/,
		description: "Product single (localized)",
	},
	{
		pattern: /^\/[a-z]{2}\/products\/categories\/?$/,
		description: "Product categories list (localized)",
	},
	{
		pattern: /^\/[a-z]{2}\/products\/categories\/[a-z0-9-]+\/?$/,
		description: "Product category archive (localized)",
	},
];

// ============================================
// URL Transformation Helpers (mirrors proxy.ts)
// ============================================

function transformLocalizedHome(path: string): string | undefined {
	const match = path.match(RE_LOCALIZED_HOME);
	if (match && LOCALE_CODES.has(match[1])) {
		return `/${match[1]}/`;
	}
}

function transformCategory(path: string): string | undefined {
	const match = path.match(RE_CATEGORY);
	if (match) {
		return `/posts/categories/${match[1]}/`;
	}
	const locMatch = path.match(RE_LOCALIZED_CATEGORY);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `/${locMatch[1]}/posts/categories/${locMatch[2]}/`;
	}
}

function transformTag(path: string): string | undefined {
	const match = path.match(RE_TAG);
	if (match) {
		return `/posts/tags/${match[1]}/`;
	}
	const locMatch = path.match(RE_LOCALIZED_TAG);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `/${locMatch[1]}/posts/tags/${locMatch[2]}/`;
	}
}

function transformProduct(path: string): string | undefined {
	const match = path.match(RE_PRODUCT);
	if (match) {
		return `/products/${match[1]}/`;
	}
	const locMatch = path.match(RE_LOCALIZED_PRODUCT);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `/${locMatch[1]}/products/${locMatch[2]}/`;
	}
}

function transformProductCategory(path: string): string | undefined {
	const match = path.match(RE_PRODUCT_CATEGORY);
	if (match) {
		return `/products/categories/${match[1]}/`;
	}
	const locMatch = path.match(RE_LOCALIZED_PRODUCT_CATEGORY);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `/${locMatch[1]}/products/categories/${locMatch[2]}/`;
	}
}

function transformBlog(path: string): string | undefined {
	if (RE_BLOG.test(path)) {
		return "/posts/";
	}
	const match = path.match(RE_LOCALIZED_BLOG);
	if (match && LOCALE_CODES.has(match[1])) {
		return `/${match[1]}/posts/`;
	}
}

function ensureTrailingSlash(path: string): string {
	return path.endsWith("/") ? path : `${path}/`;
}

function transformLocalizedPost(path: string): string | undefined {
	const locMatch = path.match(RE_LOCALIZED_SLUG);
	if (!(locMatch && LOCALE_CODES.has(locMatch[1]))) {
		return;
	}
	if (STATIC_PAGES.has(locMatch[2])) {
		return ensureTrailingSlash(path);
	}
	return `/${locMatch[1]}/posts/${locMatch[2]}/`;
}

function transformSimplePost(path: string): string | undefined {
	const match = path.match(RE_SLUG);
	if (!match) {
		return;
	}
	const slug = match[1];
	if (slug.length === 2 && LOCALE_CODES.has(slug)) {
		return ensureTrailingSlash(path);
	}
	if (STATIC_PAGES.has(slug)) {
		return ensureTrailingSlash(path);
	}
	return `/posts/${slug}/`;
}

function transformPost(path: string): string | undefined {
	if (path.includes("/posts/")) {
		return ensureTrailingSlash(path);
	}
	return transformLocalizedPost(path) ?? transformSimplePost(path);
}

function shouldSkipPath(path: string): boolean {
	return SKIP_PATTERNS.some((pattern) => pattern.test(path));
}

function normalizeTrailingSlash(path: string): string {
	if (path.endsWith("/") || path.includes(".")) {
		return path;
	}
	return `${path}/`;
}

/**
 * Transform WordPress URL to frontend URL (mirrors proxy.ts)
 */
function transformWpUrlToFrontend(wpUrl: string, wpBaseUrl: string): string {
	const path = wpUrl.replace(wpBaseUrl, "");

	const result =
		transformLocalizedHome(path) ??
		transformCategory(path) ??
		transformTag(path) ??
		transformProduct(path) ??
		transformProductCategory(path) ??
		(shouldSkipPath(path) ? normalizeTrailingSlash(path) : undefined) ??
		transformBlog(path) ??
		transformPost(path);

	return result ?? normalizeTrailingSlash(path);
}

/**
 * Check if a frontend URL matches any known route pattern
 */
function validateFrontendUrl(path: string): { valid: boolean; match?: string } {
	for (const route of FRONTEND_ROUTE_PATTERNS) {
		if (route.pattern.test(path)) {
			return { valid: true, match: route.description };
		}
	}
	return { valid: false };
}

// ============================================
// Sitemap Fetching
// ============================================

function getWpBaseUrl(): string {
	const endpoint = process.env.GRAPHQL_ENDPOINT;
	if (!endpoint) {
		return "";
	}
	const url = new URL(endpoint);
	return `${url.protocol}//${url.host}`;
}

async function fetchSitemapContent(
	sitemapPath: string
): Promise<string | null> {
	const wpUrl = getWpBaseUrl();
	if (!wpUrl) {
		return null;
	}

	try {
		const response = await fetch(`${wpUrl}/${sitemapPath}`, {
			headers: { "User-Agent": "Headless-WP-Sitemap-Check" },
		});

		if (!response.ok) {
			return null;
		}

		return await response.text();
	} catch {
		return null;
	}
}

function extractUrlsFromSitemap(content: string): string[] {
	const urls: string[] = [];
	const matches = content.matchAll(RE_LOC);
	for (const match of matches) {
		urls.push(match[1]);
	}
	return urls;
}

// ============================================
// Validation
// ============================================

async function validateSitemap(
	sitemapPath: string
): Promise<SitemapValidationResult> {
	const result: SitemapValidationResult = {
		sitemapType: sitemapPath,
		urls: [],
		errors: [],
		warnings: [],
	};

	const content = await fetchSitemapContent(sitemapPath);
	if (!content) {
		result.warnings.push(`Could not fetch ${sitemapPath}`);
		return result;
	}

	const wpBaseUrl = getWpBaseUrl();
	const rawUrls = extractUrlsFromSitemap(content);

	for (const rawUrl of rawUrls) {
		if (rawUrl.includes("-sitemap") || rawUrl.includes("sitemap_index")) {
			continue;
		}

		const transformedPath = transformWpUrlToFrontend(rawUrl, wpBaseUrl);
		const validation = validateFrontendUrl(transformedPath);

		result.urls.push({
			loc: rawUrl,
			transformedLoc: transformedPath,
			valid: validation.valid,
			reason: validation.valid
				? validation.match
				: "No matching frontend route",
		});
	}

	const invalidUrls = result.urls.filter((u) => !u.valid);
	if (invalidUrls.length > 0) {
		result.errors.push(
			`${invalidUrls.length} URL(s) will 404 after transformation:`
		);
		for (const url of invalidUrls.slice(0, 5)) {
			result.errors.push(`  WP: ${url.loc}`);
			result.errors.push(`  → Frontend: ${url.transformedLoc} (no route)`);
		}
		if (invalidUrls.length > 5) {
			result.errors.push(`  ... and ${invalidUrls.length - 5} more`);
		}
	}

	return result;
}

// ============================================
// Main Check
// ============================================

const SITEMAPS_TO_CHECK = [
	"post-sitemap.xml",
	"page-sitemap.xml",
	"category-sitemap.xml",
	"product-sitemap.xml",
	"product-category-sitemap.xml",
];

export async function runSitemapValidationCheck(): Promise<CheckResult> {
	if (process.env.SKIP_SITEMAP_CHECK === "1") {
		printSkipped("Sitemap validation", "SKIP_SITEMAP_CHECK=1");
		return { passed: true, errors: [], warnings: [] };
	}

	if (!process.env.GRAPHQL_ENDPOINT) {
		printSkipped("Sitemap validation", "no GRAPHQL_ENDPOINT");
		return { passed: true, errors: [], warnings: [] };
	}

	// Initialize locale codes from GraphQL LanguageCodeEnum (SSOT)
	const localeCodes = await getLocaleCodes();
	// Update the module-level LOCALE_CODES for use in transform functions
	LOCALE_CODES.clear();
	for (const code of localeCodes) {
		LOCALE_CODES.add(code);
	}

	const results = await Promise.all(
		SITEMAPS_TO_CHECK.map((sitemap) => validateSitemap(sitemap))
	);

	const allErrors: string[] = [];
	const allWarnings: string[] = [];
	let totalUrls = 0;
	let validUrls = 0;

	for (const result of results) {
		if (result.errors.length > 0) {
			allErrors.push(`${result.sitemapType}:`, ...result.errors);
		}
		allWarnings.push(...result.warnings);
		totalUrls += result.urls.length;
		validUrls += result.urls.filter((u) => u.valid).length;
	}

	const hasErrors = allErrors.length > 0;

	if (hasErrors) {
		printCheck(
			"Sitemap: URL transformation",
			false,
			`${validUrls}/${totalUrls} valid`
		);
	} else if (totalUrls > 0) {
		printCheck(
			"Sitemap: URL transformation",
			true,
			`${totalUrls} URLs validated`
		);
	} else if (allWarnings.length > 0) {
		printWarning("Sitemap: URL transformation", allWarnings.length);
	} else {
		printCheck("Sitemap: URL transformation", true);
	}

	return {
		passed: !hasErrors,
		errors: allErrors,
		warnings: allWarnings,
	};
}
