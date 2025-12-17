/**
 * Generate SEO files (robots.txt and sitemap.xml) at build time
 * Run: bun scripts/generate-seo-files.ts
 *
 * Single Source of Truth: src/routeTree.gen.ts
 * - Static pages: routes without $ (e.g., "/", "/about")
 * - Dynamic content: routes with $ (e.g., "/posts/$postId" → graphqlName: "posts")
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Configuration
const SITE_URL = process.env.SITE_URL ?? "https://example.com";
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT ?? "";

const ROOT_DIR = join(import.meta.dir, "..");
const PUBLIC_DIR = join(ROOT_DIR, "public");
const ROUTE_TREE_PATH = join(ROOT_DIR, "src/routeTree.gen.ts");

// Regex patterns (defined at top level for performance)
const FULL_PATHS_REGEX = /fullPaths:\s*\n?\s*((?:\s*\|\s*'[^']+'\s*)+)/;
const PATH_EXTRACT_REGEX = /'([^']+)'/g;

type ContentNode = {
	slug: string;
	modified: string;
};

type SitemapData = Record<string, { nodes: ContentNode[] } | undefined>;

type ContentType = {
	graphqlName: string;
	basePath: string;
};

// ============================================
// Auto-discover routes from routeTree.gen.ts
// ============================================

function discoverRoutes(): {
	staticPages: string[];
	contentTypes: ContentType[];
} {
	try {
		const routeTreeContent = readFileSync(ROUTE_TREE_PATH, "utf-8");

		const fullPathsMatch = routeTreeContent.match(FULL_PATHS_REGEX);
		if (!fullPathsMatch) {
			console.warn("⚠️  Could not parse fullPaths from routeTree.gen.ts");
			return { staticPages: ["/"], contentTypes: [] };
		}

		const pathMatches = fullPathsMatch[1].matchAll(PATH_EXTRACT_REGEX);
		const allPaths = Array.from(pathMatches, (m) => m[1]);

		const staticPages: string[] = [];
		const contentTypes: ContentType[] = [];
		const seenContentTypes = new Set<string>();

		for (const path of allPaths) {
			if (path.includes("$")) {
				// Dynamic route: /posts/$postId → { graphqlName: "posts", basePath: "/posts" }
				const basePath = path.split("/$")[0];
				const graphqlName = basePath.slice(1); // Remove leading "/"

				if (graphqlName && !seenContentTypes.has(graphqlName)) {
					seenContentTypes.add(graphqlName);
					contentTypes.push({ graphqlName, basePath });
				}
			} else {
				// Static route
				staticPages.push(path);
			}
		}

		return { staticPages, contentTypes };
	} catch (error) {
		console.warn("⚠️  Could not read routeTree.gen.ts:", error);
		return { staticPages: ["/"], contentTypes: [] };
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
// File generators
// ============================================

function generateRobotsTxt(): string {
	return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function getPriority(path: string, contentTypes: ContentType[]): string {
	if (path === "/") {
		return "1.0";
	}
	const isListPage = contentTypes.some((type) => type.basePath === path);
	if (isListPage) {
		return "0.8";
	}
	return "0.5";
}

function getChangefreq(path: string, contentTypes: ContentType[]): string {
	if (path === "/") {
		return "daily";
	}
	const isListPage = contentTypes.some((type) => type.basePath === path);
	if (isListPage) {
		return "daily";
	}
	return "monthly";
}

function generateSitemapXml(
	data: SitemapData,
	staticPages: string[],
	contentTypes: ContentType[]
): string {
	const urls: string[] = [];

	// Static pages
	for (const path of staticPages) {
		urls.push(`
  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${getChangefreq(path, contentTypes)}</changefreq>
    <priority>${getPriority(path, contentTypes)}</priority>
  </url>`);
	}

	// Dynamic content
	for (const type of contentTypes) {
		const nodes = data[type.graphqlName]?.nodes ?? [];
		for (const node of nodes) {
			urls.push(`
  <url>
    <loc>${SITE_URL}${type.basePath}/${node.slug}</loc>
    <lastmod>${node.modified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
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
	console.log("🔄 Generating SEO files...");
	console.log(`   SITE_URL: ${SITE_URL}`);
	console.log(`   GRAPHQL_ENDPOINT: ${GRAPHQL_ENDPOINT || "(not set)"}`);

	// Auto-discover from routeTree.gen.ts
	const { staticPages, contentTypes } = discoverRoutes();
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

	console.log("🎉 SEO files generated successfully!");
}

main().catch(console.error);
