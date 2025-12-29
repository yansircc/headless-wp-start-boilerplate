/**
 * Sitemap Proxy Utilities
 *
 * Shared logic for proxying sitemaps from WordPress Yoast SEO.
 * Handles URL transformation from WordPress paths to frontend paths.
 *
 * URL Mapping Rules:
 * - Posts: /$slug → /posts/$slug, /ja/$slug → /ja/posts/$slug
 * - Categories: /category/$slug → /posts/categories/$slug
 * - Tags: /tag/$slug → /posts/tags/$slug
 * - Localized homepage: /ja/home/ → /ja/, /zh/home/ → /zh/
 * - Products: unchanged (already /products/$slug)
 */

import { env } from "@/env";

function getWpBaseUrl(): string {
	if (env.WP_URL) {
		return env.WP_URL;
	}
	const url = new URL(env.GRAPHQL_ENDPOINT);
	return `${url.protocol}//${url.host}`;
}

// ============================================
// URL Pattern Constants
// ============================================

const LOCALE_CODES = new Set([
	"en",
	"ja",
	"zh",
	"ko",
	"fr",
	"de",
	"es",
	"pt",
	"it",
	"ru",
]);

const STATIC_PAGES = new Set([
	"blog",
	"about",
	"contact",
	"privacy",
	"terms",
	"home",
]);

// Regex patterns at top level for performance
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

const SKIP_PATTERNS = [
	/^\/products\//,
	/^\/author\//,
	/^\/page\//,
	/^\/wp-/,
	/^\/[a-z]{2}\/products\//,
];

// ============================================
// URL Transformation Helpers
// ============================================

function transformLocalizedHome(
	path: string,
	baseUrl: string
): string | undefined {
	const match = path.match(RE_LOCALIZED_HOME);
	if (match && LOCALE_CODES.has(match[1])) {
		return `${baseUrl}/${match[1]}/`;
	}
}

function transformCategory(path: string, baseUrl: string): string | undefined {
	const match = path.match(RE_CATEGORY);
	if (match) {
		return `${baseUrl}/posts/categories/${match[1]}/`;
	}

	const locMatch = path.match(RE_LOCALIZED_CATEGORY);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `${baseUrl}/${locMatch[1]}/posts/categories/${locMatch[2]}/`;
	}
}

function transformTag(path: string, baseUrl: string): string | undefined {
	const match = path.match(RE_TAG);
	if (match) {
		return `${baseUrl}/posts/tags/${match[1]}/`;
	}

	const locMatch = path.match(RE_LOCALIZED_TAG);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `${baseUrl}/${locMatch[1]}/posts/tags/${locMatch[2]}/`;
	}
}

function transformProduct(path: string, baseUrl: string): string | undefined {
	const match = path.match(RE_PRODUCT);
	if (match) {
		return `${baseUrl}/products/${match[1]}/`;
	}

	const locMatch = path.match(RE_LOCALIZED_PRODUCT);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `${baseUrl}/${locMatch[1]}/products/${locMatch[2]}/`;
	}
}

function transformProductCategory(
	path: string,
	baseUrl: string
): string | undefined {
	const match = path.match(RE_PRODUCT_CATEGORY);
	if (match) {
		return `${baseUrl}/products/categories/${match[1]}/`;
	}

	const locMatch = path.match(RE_LOCALIZED_PRODUCT_CATEGORY);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		return `${baseUrl}/${locMatch[1]}/products/categories/${locMatch[2]}/`;
	}
}

function transformBlog(path: string, baseUrl: string): string | undefined {
	if (RE_BLOG.test(path)) {
		return `${baseUrl}/posts/`;
	}

	const match = path.match(RE_LOCALIZED_BLOG);
	if (match && LOCALE_CODES.has(match[1])) {
		return `${baseUrl}/${match[1]}/posts/`;
	}
}

function transformPost(
	path: string,
	baseUrl: string,
	originalUrl: string
): string | undefined {
	// Skip if already has /posts/
	if (path.includes("/posts/")) {
		return originalUrl;
	}

	// Localized post: /ja/$slug → /ja/posts/$slug
	const locMatch = path.match(RE_LOCALIZED_SLUG);
	if (locMatch && LOCALE_CODES.has(locMatch[1])) {
		if (STATIC_PAGES.has(locMatch[2])) {
			return originalUrl;
		}
		return `${baseUrl}/${locMatch[1]}/posts/${locMatch[2]}/`;
	}

	// Non-localized post: /$slug → /posts/$slug
	const match = path.match(RE_SLUG);
	if (match) {
		const slug = match[1];
		if (slug.length === 2 && LOCALE_CODES.has(slug)) {
			return originalUrl;
		}
		if (STATIC_PAGES.has(slug)) {
			return originalUrl;
		}
		return `${baseUrl}/posts/${slug}/`;
	}
}

function shouldSkipPath(path: string): boolean {
	return SKIP_PATTERNS.some((pattern) => pattern.test(path));
}

// ============================================
// Main Transform Function
// ============================================

/**
 * Transform a WordPress URL path to frontend URL path
 */
export function transformUrl(url: string, frontendBaseUrl: string): string {
	const urlObj = new URL(url);
	const path = urlObj.pathname;

	// Try each transformation in order
	const result =
		transformLocalizedHome(path, frontendBaseUrl) ??
		transformCategory(path, frontendBaseUrl) ??
		transformTag(path, frontendBaseUrl) ??
		transformProduct(path, frontendBaseUrl) ??
		transformProductCategory(path, frontendBaseUrl) ??
		(shouldSkipPath(path) ? url : undefined) ??
		transformBlog(path, frontendBaseUrl) ??
		transformPost(path, frontendBaseUrl, url);

	return result ?? url;
}

// Keep backward compatibility
export const transformPostUrl = transformUrl;

/**
 * Transform all <loc> URLs in sitemap content
 */
function transformSitemapUrls(content: string, frontendUrl: string): string {
	return content.replace(/<loc>([^<]+)<\/loc>/g, (_match, url: string) => {
		const transformedUrl = transformUrl(url, frontendUrl);
		return `<loc>${transformedUrl}</loc>`;
	});
}

/**
 * Proxy a sitemap from WordPress
 * @param sitemapPath - The sitemap path (e.g., "sitemap_index.xml", "post-sitemap.xml")
 */
export async function proxySitemap(sitemapPath: string): Promise<Response> {
	const wpUrl = getWpBaseUrl();
	const sitemapUrl = `${wpUrl}/${sitemapPath}`;

	try {
		const response = await fetch(sitemapUrl, {
			headers: { "User-Agent": "Headless-WP-Proxy" },
		});

		if (!response.ok) {
			return new Response("Not Found", { status: 404 });
		}

		let content = await response.text();

		// Replace WordPress XSL with our local stylesheet to avoid CORS errors
		content = content.replace(
			/<\?xml-stylesheet[^?]*\?>\s*/g,
			'<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n'
		);

		// Replace WordPress base URL with frontend URL
		const frontendUrl =
			import.meta.env.VITE_SITE_URL || "http://localhost:3000";
		content = content.replaceAll(wpUrl, frontendUrl);

		// Transform all URLs in the sitemap (posts, categories, tags, pages, etc.)
		// Skip sitemap index as it only contains links to other sitemaps
		if (!sitemapPath.includes("sitemap_index")) {
			content = transformSitemapUrls(content, frontendUrl);
		}

		return new Response(content, {
			status: 200,
			headers: {
				"Content-Type": "application/xml",
				"Cache-Control": "public, max-age=3600, s-maxage=3600",
			},
		});
	} catch (error) {
		console.error(`[sitemap] Proxy error for ${sitemapPath}:`, error);
		return new Response("Internal Server Error", { status: 500 });
	}
}

/**
 * Return an empty sitemap index (for error fallback)
 */
export function emptySitemapIndex(): Response {
	return new Response(
		'<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>',
		{
			status: 200,
			headers: { "Content-Type": "application/xml" },
		}
	);
}
