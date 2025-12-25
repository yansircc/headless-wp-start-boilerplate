/**
 * SEO Validation Check
 *
 * Verifies that SEO configuration in WordPress matches frontend routes
 * and that all required SEO fields are properly configured.
 */

import {
	type CheckResult,
	printCheck,
	printSkipped,
	printWarning,
} from "./types";

// ============================================
// Types
// ============================================

type ArchiveSeo = {
	title?: string | null;
	metaDesc?: string | null;
	metaRobotsNoindex?: boolean | null;
	hasArchive?: boolean | null;
	archiveLink?: string | null;
};

type ContentTypeSeo = {
	archive?: ArchiveSeo | null;
};

type HomepageSeo = {
	title?: string | null;
	description?: string | null;
};

type SeoValidationData = {
	seo?: {
		meta?: {
			homepage?: HomepageSeo | null;
		} | null;
		contentTypes?: {
			post?: ContentTypeSeo | null;
			product?: ContentTypeSeo | null;
			page?: ContentTypeSeo | null;
		} | null;
		openGraph?: {
			defaultImage?: {
				sourceUrl?: string | null;
			} | null;
		} | null;
		schema?: {
			siteName?: string | null;
			siteUrl?: string | null;
		} | null;
	} | null;
};

type SeoCheckResults = {
	contentTypeErrors: string[];
	archiveWarnings: Map<string, string[]>; // route -> warnings
	globalWarnings: string[];
};

// ============================================
// Configuration
// ============================================

const STATIC_ROUTES = {
	archives: {
		"/posts": "post",
		"/products": "product",
	} as Record<string, string>,
};

const CONTENT_TYPE_NAMES: Record<string, string> = {
	post: "Posts",
	product: "Products",
	page: "Pages",
};

// ============================================
// Fetch SEO Data
// ============================================

async function fetchSeoValidationData(): Promise<SeoValidationData | null> {
	const endpoint = process.env.GRAPHQL_ENDPOINT;
	if (!endpoint) {
		return null;
	}

	const query = `
		query SeoValidation {
			seo {
				meta {
					homepage {
						title
						description
					}
				}
				contentTypes {
					post {
						archive {
							title
							metaDesc
							metaRobotsNoindex
							hasArchive
							archiveLink
						}
					}
					product {
						archive {
							title
							metaDesc
							metaRobotsNoindex
							hasArchive
							archiveLink
						}
					}
				}
				openGraph {
					defaultImage {
						sourceUrl
					}
				}
				schema {
					siteName
					siteUrl
				}
			}
		}
	`;

	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query }),
		});

		if (!response.ok) {
			return null;
		}

		const result = (await response.json()) as { data?: SeoValidationData };
		return result.data ?? null;
	} catch {
		return null;
	}
}

// ============================================
// Validation Functions
// ============================================

function checkContentTypeRoutes(
	data: SeoValidationData,
	results: SeoCheckResults
): void {
	const contentTypes = data.seo?.contentTypes;
	if (!contentTypes) {
		results.contentTypeErrors.push(
			"Cannot read content types from WordPress SEO settings"
		);
		return;
	}

	// Check each frontend route has a corresponding WordPress archive
	for (const [route, contentType] of Object.entries(STATIC_ROUTES.archives)) {
		const typeSeo = contentTypes[contentType as keyof typeof contentTypes];
		const archive = typeSeo?.archive;

		if (!archive) {
			results.contentTypeErrors.push(
				`Frontend has ${route} route but WordPress "${contentType}" has no archive settings`
			);
			results.contentTypeErrors.push(
				`  \u2192 Configure: Yoast SEO \u2192 Content types \u2192 ${CONTENT_TYPE_NAMES[contentType] || contentType}`
			);
			continue;
		}

		// Check if archive is enabled (skip for built-in 'post' type which handles archives differently)
		// WordPress's built-in post type doesn't use hasArchive - it uses the blog page instead
		if (archive.hasArchive === false && contentType !== "post") {
			const key = `${route} (${CONTENT_TYPE_NAMES[contentType] || contentType} Archive):`;
			const existing = results.archiveWarnings.get(key) || [];
			existing.push("  \u26A0 Archive is disabled in WordPress");
			existing.push(
				`  \u2192 Enable: Yoast SEO \u2192 Content types \u2192 ${CONTENT_TYPE_NAMES[contentType] || contentType} \u2192 Show in search`
			);
			results.archiveWarnings.set(key, existing);
		}
	}
}

/**
 * Check if an archive has missing SEO fields and return warnings
 */
function getArchiveWarnings(archive: ArchiveSeo | null | undefined): string[] {
	const warnings: string[] = [];
	if (!archive) {
		return warnings;
	}

	if (!archive.title?.trim()) {
		warnings.push("  \u26A0 title: empty - page will use default title");
	}

	if (!archive.metaDesc?.trim()) {
		warnings.push(
			"  \u26A0 metaDesc: empty - visitors won't see description in search results"
		);
	}

	return warnings;
}

/**
 * Add archive warnings to results with proper formatting
 */
function addArchiveWarnings(
	results: SeoCheckResults,
	label: string,
	warnings: string[],
	configPath: string
): void {
	if (warnings.length === 0) {
		return;
	}
	const existing = results.archiveWarnings.get(label) || [];
	existing.push(...warnings);
	existing.push(`  \u2192 Configure: ${configPath}`);
	results.archiveWarnings.set(label, existing);
}

function checkArchiveSeoCompleteness(
	data: SeoValidationData,
	results: SeoCheckResults
): void {
	const contentTypes = data.seo?.contentTypes;

	// Check archive pages (only custom post types, not built-in 'post')
	// WordPress handles the blog page differently - it uses the Posts page or homepage settings
	if (contentTypes) {
		for (const [route, contentType] of Object.entries(STATIC_ROUTES.archives)) {
			// Skip 'post' type - WordPress handles blog page SEO via seo.meta.homepage or Posts page
			if (contentType === "post") {
				continue;
			}

			const typeSeo = contentTypes[contentType as keyof typeof contentTypes];
			const warnings = getArchiveWarnings(typeSeo?.archive);
			const typeName = CONTENT_TYPE_NAMES[contentType] || contentType;

			addArchiveWarnings(
				results,
				`${route} (${typeName} Archive):`,
				warnings,
				`Yoast SEO \u2192 Content types \u2192 ${typeName} \u2192 Archive`
			);
		}
	}

	// Check homepage using seo.meta.homepage (the correct field)
	const homepage = data.seo?.meta?.homepage;
	if (homepage) {
		const warnings: string[] = [];

		if (!homepage.title?.trim()) {
			warnings.push("  \u26A0 title: empty - homepage will use site name only");
		}

		if (!homepage.description?.trim()) {
			warnings.push(
				"  \u26A0 metaDesc: empty - homepage won't have description in search results"
			);
		}

		addArchiveWarnings(
			results,
			"/ (Homepage):",
			warnings,
			"Yoast SEO \u2192 Settings \u2192 Site basics \u2192 Homepage"
		);
	}
}

function checkGlobalSeoConfig(
	data: SeoValidationData,
	results: SeoCheckResults
): void {
	const seo = data.seo;
	if (!seo) {
		return;
	}

	// Check default OG image
	if (!seo.openGraph?.defaultImage?.sourceUrl) {
		results.globalWarnings.push(
			"Default OG image not set - social shares will have no image"
		);
		results.globalWarnings.push(
			"  \u2192 Configure: Yoast SEO \u2192 Site basics \u2192 Site image"
		);
	}

	// Check schema settings
	if (!seo.schema?.siteName?.trim()) {
		results.globalWarnings.push(
			"Schema site name not set - structured data may be incomplete"
		);
		results.globalWarnings.push(
			"  \u2192 Configure: Yoast SEO \u2192 Site basics \u2192 Site name"
		);
	}
}

// ============================================
// Result Formatting Helpers
// ============================================

function printSeoCheckResults(results: SeoCheckResults): void {
	const hasErrors = results.contentTypeErrors.length > 0;
	const hasArchiveWarnings = results.archiveWarnings.size > 0;

	printCheck("SEO: Content type routes", !hasErrors);

	if (hasArchiveWarnings) {
		let warningCount = 0;
		for (const warnings of results.archiveWarnings.values()) {
			warningCount += warnings.filter((w) => w.includes("\u26A0")).length;
		}
		printWarning("SEO: Archive configuration", warningCount);
	} else {
		printCheck("SEO: Archive configuration", true);
	}

	if (results.globalWarnings.length > 0) {
		const warningCount = results.globalWarnings.filter(
			(w) => !w.startsWith("  ")
		).length;
		printWarning("SEO: Global settings", warningCount);
	} else {
		printCheck("SEO: Global settings", true);
	}
}

function collectWarnings(results: SeoCheckResults): string[] {
	const allWarnings: string[] = [];

	if (results.archiveWarnings.size > 0) {
		allWarnings.push("", "SEO: Archive configuration", "");
		for (const [route, warnings] of results.archiveWarnings) {
			allWarnings.push(route);
			allWarnings.push(...warnings);
		}
	}

	if (results.globalWarnings.length > 0) {
		allWarnings.push("", "SEO: Global settings", "");
		allWarnings.push(...results.globalWarnings);
	}

	return allWarnings;
}

// ============================================
// Main Check Runner
// ============================================

export async function runSeoValidationChecks(): Promise<CheckResult> {
	// Skip if SKIP_SEO_CHECK is set
	if (process.env.SKIP_SEO_CHECK === "1") {
		printSkipped("SEO validation", "SKIP_SEO_CHECK=1");
		return { passed: true, errors: [], warnings: [] };
	}

	// Skip if no GraphQL endpoint
	if (!process.env.GRAPHQL_ENDPOINT) {
		printSkipped("SEO validation", "no GRAPHQL_ENDPOINT");
		return { passed: true, errors: [], warnings: [] };
	}

	// Fetch SEO data from WordPress
	const data = await fetchSeoValidationData();
	if (!data) {
		printSkipped("SEO validation", "WordPress unreachable");
		return { passed: true, errors: [], warnings: [] };
	}

	const results: SeoCheckResults = {
		contentTypeErrors: [],
		archiveWarnings: new Map(),
		globalWarnings: [],
	};

	// Run all checks
	checkContentTypeRoutes(data, results);
	checkArchiveSeoCompleteness(data, results);
	checkGlobalSeoConfig(data, results);

	// Print results
	printSeoCheckResults(results);

	// Build return value
	const hasErrors = results.contentTypeErrors.length > 0;
	return {
		passed: !hasErrors,
		errors: hasErrors
			? ["SEO: Content type routes", "", ...results.contentTypeErrors]
			: [],
		warnings: collectWarnings(results),
	};
}
