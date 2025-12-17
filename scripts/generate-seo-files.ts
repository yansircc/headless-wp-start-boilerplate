/**
 * SEO Validation & File Generation Script
 *
 * This script:
 * 1. Validates that seo.config.ts has all required fields filled
 * 2. Checks that all static routes have SEO configuration
 * 3. Generates robots.txt from config
 * 4. Generates sitemap.xml from routes + CMS data
 *
 * Run: bun scripts/generate-seo-files.ts
 * Or: bun run seo
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { seoConfig } from "../src/lib/seo/seo.config";

// ============================================
// Configuration
// ============================================

const ROOT_DIR = join(import.meta.dir, "..");
const PUBLIC_DIR = join(ROOT_DIR, "public");
const ROUTE_TREE_PATH = join(ROOT_DIR, "src/routeTree.gen.ts");

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT ?? "";

// Regex patterns
const FULL_PATHS_REGEX = /fullPaths:\s*\n?\s*((?:\s*\|\s*'[^']+'\s*)+)/;
const PATH_EXTRACT_REGEX = /'([^']+)'/g;

// ============================================
// Types
// ============================================

type ContentNode = {
	slug: string;
	modified: string;
};

type SitemapData = Record<string, { nodes: ContentNode[] } | undefined>;

type ContentType = {
	graphqlName: string;
	basePath: string;
	dynamicPath: string;
};

type ValidationResult = {
	configErrors: string[];
	missingRoutes: string[];
	missingDynamicRoutes: string[];
	incompleteRoutes: string[];
};

// ============================================
// SEO Config Validation
// ============================================

function validateSeoConfig(
	staticPages: string[],
	dynamicRoutes: string[]
): ValidationResult {
	const result: ValidationResult = {
		configErrors: [],
		missingRoutes: [],
		missingDynamicRoutes: [],
		incompleteRoutes: [],
	};

	// Site config validation
	if (!seoConfig.site.url) {
		result.configErrors.push(
			"site.url is required (set SITE_URL env or fill in config)"
		);
	}
	if (!seoConfig.site.name) {
		result.configErrors.push(
			"site.name is required (set SITE_NAME env or fill in config)"
		);
	}

	// Defaults validation
	if (!seoConfig.defaults.description) {
		result.configErrors.push("defaults.description is required");
	}

	// Check static routes coverage
	for (const path of staticPages) {
		const routeConfig = seoConfig.routes[path];
		if (!routeConfig) {
			result.missingRoutes.push(path);
		} else if (!routeConfig.description) {
			result.incompleteRoutes.push(path);
		}
	}

	// Check dynamic routes (optional, just warn)
	for (const path of dynamicRoutes) {
		if (!seoConfig.dynamicRoutes[path]) {
			result.missingDynamicRoutes.push(path);
		}
	}

	return result;
}

// ============================================
// Route Discovery
// ============================================

function discoverRoutes(): {
	staticPages: string[];
	dynamicRoutes: string[];
	contentTypes: ContentType[];
} {
	try {
		const routeTreeContent = readFileSync(ROUTE_TREE_PATH, "utf-8");

		const fullPathsMatch = routeTreeContent.match(FULL_PATHS_REGEX);
		if (!fullPathsMatch) {
			console.warn("⚠️  Could not parse fullPaths from routeTree.gen.ts");
			return { staticPages: ["/"], dynamicRoutes: [], contentTypes: [] };
		}

		const pathMatches = fullPathsMatch[1].matchAll(PATH_EXTRACT_REGEX);
		const allPaths = Array.from(pathMatches, (m) => m[1]);

		const staticPages: string[] = [];
		const dynamicRoutes: string[] = [];
		const contentTypes: ContentType[] = [];
		const seenContentTypes = new Set<string>();

		for (const path of allPaths) {
			if (path.includes("$")) {
				// Dynamic route: /posts/$postId
				dynamicRoutes.push(path);

				const basePath = path.split("/$")[0];
				const graphqlName = basePath.slice(1); // Remove leading "/"

				if (graphqlName && !seenContentTypes.has(graphqlName)) {
					seenContentTypes.add(graphqlName);
					contentTypes.push({ graphqlName, basePath, dynamicPath: path });
				}
			} else {
				// Static route
				staticPages.push(path);
			}
		}

		return { staticPages, dynamicRoutes, contentTypes };
	} catch (error) {
		console.warn("⚠️  Could not read routeTree.gen.ts:", error);
		return { staticPages: ["/"], dynamicRoutes: [], contentTypes: [] };
	}
}

// ============================================
// Code Generation Helpers
// ============================================

function generateRouteConfigCode(path: string): string {
	const isHomepage = path === "/";
	const pathName = path.slice(1) || "home"; // "/posts" → "posts", "/" → "home"
	const titleHint = isHomepage ? "" : capitalize(pathName);

	return `    "${path}": {
      title: "${titleHint}", // ${isHomepage ? "Empty = use site.name + tagline" : "TODO: 填写页面标题"}
      description: "", // TODO: 填写页面描述
    },`;
}

function generateDynamicRouteConfigCode(path: string): string {
	const basePath = path.split("/$")[0];
	const contentType = basePath.slice(1); // "/posts" → "posts"
	const suggestedType = contentType === "posts" ? "article" : "product";

	return `    "${path}": {
      fallbackTitle: "${capitalize(contentType)}", // CMS 没数据时的 fallback
      type: "${suggestedType}", // "article" 或 "product"
    },`;
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// Error Output
// ============================================

function printConfigErrors(errors: string[]): void {
	if (errors.length === 0) {
		return;
	}

	console.error("┌─ Config Errors");
	for (const error of errors) {
		console.error(`│  • ${error}`);
	}
	console.error("└─\n");
}

function printMissingRoutes(routes: string[]): void {
	if (routes.length === 0) {
		return;
	}

	console.error("┌─ Missing Route Configs");
	console.error("│");
	console.error(
		"│  The following routes exist in routeTree.gen.ts but are missing from seo.config.ts"
	);
	console.error("│");

	for (const path of routes) {
		console.error(`│  • ${path}`);
	}

	console.error("│");
	console.error("│  👉 Add this to seo.config.ts → routes: {");
	console.error("│");

	for (const path of routes) {
		const code = generateRouteConfigCode(path);
		for (const line of code.split("\n")) {
			console.error(`│  ${line}`);
		}
	}

	console.error("│");
	console.error("└─\n");
}

function printIncompleteRoutes(routes: string[]): void {
	if (routes.length === 0) {
		return;
	}

	console.error("┌─ Incomplete Route Configs");
	console.error("│");
	for (const path of routes) {
		console.error(
			`│  • routes["${path}"].description is empty - fill in the description`
		);
	}
	console.error("│");
	console.error("└─\n");
}

function printMissingDynamicRoutes(routes: string[]): void {
	if (routes.length === 0) {
		return;
	}

	console.warn("┌─ Missing Dynamic Route Configs (Optional)");
	console.warn("│");
	console.warn(
		"│  These dynamic routes have no fallback config. SEO will still work using CMS data."
	);
	console.warn("│");

	for (const path of routes) {
		console.warn(`│  • ${path}`);
	}

	console.warn("│");
	console.warn("│  👉 Optionally add to seo.config.ts → dynamicRoutes: {");
	console.warn("│");

	for (const path of routes) {
		const code = generateDynamicRouteConfigCode(path);
		for (const line of code.split("\n")) {
			console.warn(`│  ${line}`);
		}
	}

	console.warn("│");
	console.warn("└─\n");
}

function printValidationErrors(result: ValidationResult): void {
	const hasErrors =
		result.configErrors.length > 0 ||
		result.missingRoutes.length > 0 ||
		result.incompleteRoutes.length > 0;

	if (!hasErrors && result.missingDynamicRoutes.length === 0) {
		return;
	}

	console.error("❌ SEO configuration validation failed:\n");

	printConfigErrors(result.configErrors);
	printMissingRoutes(result.missingRoutes);
	printIncompleteRoutes(result.incompleteRoutes);
	printMissingDynamicRoutes(result.missingDynamicRoutes);

	if (hasErrors) {
		console.error(
			"Please fix the errors above in src/lib/seo/seo.config.ts before building.\n"
		);
	}
}

// ============================================
// GraphQL
// ============================================

function buildSitemapQuery(types: ContentType[]): string {
	const fragments = types
		.map(
			(type) => `
    ${type.graphqlName}(first: 1000) {
      nodes {
        slug
        modified
      }
    }`
		)
		.join("");

	return `query SitemapData {${fragments}}`;
}

async function fetchSitemapData(
	contentTypes: ContentType[]
): Promise<SitemapData> {
	if (!GRAPHQL_ENDPOINT || contentTypes.length === 0) {
		return {};
	}

	const query = buildSitemapQuery(contentTypes);

	try {
		const response = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query }),
		});

		const json = (await response.json()) as { data: SitemapData };
		return json.data;
	} catch (error) {
		console.error("❌ Failed to fetch sitemap data:", error);
		return {};
	}
}

// ============================================
// File Generators
// ============================================

function generateRobotsTxt(): string {
	const lines: string[] = ["# https://www.robotstxt.org/robotstxt.html"];

	for (const rule of seoConfig.robots.rules) {
		lines.push("");
		lines.push(`User-agent: ${rule.userAgent}`);

		if (rule.allow) {
			for (const path of rule.allow) {
				lines.push(`Allow: ${path}`);
			}
		}

		if (rule.disallow) {
			for (const path of rule.disallow) {
				lines.push(`Disallow: ${path}`);
			}
		}

		if (rule.crawlDelay) {
			lines.push(`Crawl-delay: ${rule.crawlDelay}`);
		}
	}

	lines.push("");
	lines.push(`Sitemap: ${seoConfig.site.url}/sitemap.xml`);
	lines.push("");

	return lines.join("\n");
}

function getChangefreq(
	path: string,
	contentTypes: ContentType[],
	isContent: boolean
): string {
	if (isContent) {
		return seoConfig.sitemap.changefreq.content;
	}
	if (path === "/") {
		return seoConfig.sitemap.changefreq.homepage;
	}
	const isListPage = contentTypes.some((type) => type.basePath === path);
	if (isListPage) {
		return seoConfig.sitemap.changefreq.listing;
	}
	return seoConfig.sitemap.changefreq.content;
}

function getPriority(
	path: string,
	contentTypes: ContentType[],
	isContent: boolean
): string {
	if (isContent) {
		return seoConfig.sitemap.priority.content.toFixed(1);
	}
	if (path === "/") {
		return seoConfig.sitemap.priority.homepage.toFixed(1);
	}
	const isListPage = contentTypes.some((type) => type.basePath === path);
	if (isListPage) {
		return seoConfig.sitemap.priority.listing.toFixed(1);
	}
	return seoConfig.sitemap.priority.content.toFixed(1);
}

function generateSitemapXml(
	data: SitemapData,
	staticPages: string[],
	contentTypes: ContentType[]
): string {
	const urls: string[] = [];
	const siteUrl = seoConfig.site.url;

	// Static pages
	for (const path of staticPages) {
		urls.push(`
  <url>
    <loc>${siteUrl}${path}</loc>
    <changefreq>${getChangefreq(path, contentTypes, false)}</changefreq>
    <priority>${getPriority(path, contentTypes, false)}</priority>
  </url>`);
	}

	// Dynamic content
	for (const type of contentTypes) {
		const nodes = data[type.graphqlName]?.nodes ?? [];
		for (const node of nodes) {
			urls.push(`
  <url>
    <loc>${siteUrl}${type.basePath}/${node.slug}</loc>
    <lastmod>${node.modified}</lastmod>
    <changefreq>${getChangefreq("", contentTypes, true)}</changefreq>
    <priority>${getPriority("", contentTypes, true)}</priority>
  </url>`);
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;
}

// ============================================
// Main
// ============================================

async function main() {
	console.log("🔍 Validating SEO configuration...\n");

	// Step 1: Discover routes
	const { staticPages, dynamicRoutes, contentTypes } = discoverRoutes();

	// Step 2: Validate config
	const validationResult = validateSeoConfig(staticPages, dynamicRoutes);

	// Step 3: Print errors with helpful output
	printValidationErrors(validationResult);

	// Check if we have blocking errors
	const hasBlockingErrors =
		validationResult.configErrors.length > 0 ||
		validationResult.missingRoutes.length > 0 ||
		validationResult.incompleteRoutes.length > 0;

	if (hasBlockingErrors) {
		process.exit(1);
	}

	console.log("✅ SEO configuration is valid\n");

	// Step 4: Generate files
	console.log("🔄 Generating SEO files...");
	console.log(`   SITE_URL: ${seoConfig.site.url}`);
	console.log(`   GRAPHQL_ENDPOINT: ${GRAPHQL_ENDPOINT || "(not set)"}`);
	console.log(`   Static pages: ${staticPages.join(", ")}`);
	console.log(
		`   Content types: ${contentTypes.map((t) => t.graphqlName).join(", ") || "(none)"}`
	);

	// Generate robots.txt
	const robotsTxt = generateRobotsTxt();
	writeFileSync(join(PUBLIC_DIR, "robots.txt"), robotsTxt);
	console.log("✅ Generated robots.txt");

	// Fetch data and generate sitemap.xml
	const data = await fetchSitemapData(contentTypes);
	const sitemapXml = generateSitemapXml(data, staticPages, contentTypes);
	writeFileSync(join(PUBLIC_DIR, "sitemap.xml"), sitemapXml);

	// Log stats
	const dynamicStats = contentTypes
		.map((type) => {
			const count = data[type.graphqlName]?.nodes?.length ?? 0;
			return `${count} ${type.graphqlName}`;
		})
		.join(", ");
	const statsMsg = dynamicStats
		? `${staticPages.length} static, ${dynamicStats}`
		: `${staticPages.length} static pages`;
	console.log(`✅ Generated sitemap.xml (${statsMsg})`);

	console.log("\n🎉 SEO files generated successfully!");
}

main().catch(console.error);
