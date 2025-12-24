/**
 * Step 1: Auto-discover ACF Definitions
 */

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
	DEFINITIONS_DIR,
	POST_TYPES_DIR,
	TAXONOMIES_DIR,
	TOTAL_STEPS,
} from "../config";
import type {
	DiscoveredDefinitions,
	FieldGroupConfig,
	PostTypeDefinition,
	TaxonomyDefinition,
} from "../types";
import { log, step } from "../utils";

type FieldGroupEntry = {
	name: string;
	config: FieldGroupConfig;
	path: string;
};

type PostTypeEntry = {
	name: string;
	config: PostTypeDefinition;
	path: string;
};

type TaxonomyEntry = {
	name: string;
	config: TaxonomyDefinition;
	path: string;
};

/**
 * Check if a value is a valid FieldGroup export
 */
function isFieldGroupExport(
	name: string,
	value: unknown
): value is FieldGroupConfig {
	return (
		name.endsWith("FieldGroup") &&
		typeof value === "object" &&
		value !== null &&
		"key" in value
	);
}

/**
 * Check if a value is a valid PostType export
 */
function isPostTypeExport(
	name: string,
	value: unknown
): value is PostTypeDefinition {
	return (
		name.endsWith("PostType") &&
		typeof value === "object" &&
		value !== null &&
		"post_type" in value
	);
}

/**
 * Check if a value is a valid Taxonomy export
 */
function isTaxonomyExport(
	name: string,
	value: unknown
): value is TaxonomyDefinition {
	return (
		name.endsWith("Taxonomy") &&
		typeof value === "object" &&
		value !== null &&
		"taxonomy" in value
	);
}

/**
 * Discover Field Groups from src/acf/definitions/
 */
async function discoverFieldGroups(): Promise<FieldGroupEntry[]> {
	const results: FieldGroupEntry[] = [];

	if (!existsSync(DEFINITIONS_DIR)) {
		return results;
	}

	const entries = await readdir(DEFINITIONS_DIR, { withFileTypes: true });
	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name === "_shared") {
			continue;
		}

		const indexPath = join(DEFINITIONS_DIR, entry.name, "index.ts");
		if (!existsSync(indexPath)) {
			continue;
		}

		try {
			const importPath = `../../../src/acf/definitions/${entry.name}/index.ts`;
			const module = await import(importPath);

			for (const [exportName, exportValue] of Object.entries(module)) {
				if (isFieldGroupExport(exportName, exportValue)) {
					results.push({
						name: exportName,
						config: exportValue,
						path: indexPath,
					});
					log(`  ✓ Field Group: ${exportName}`, "green");
				}
			}
		} catch (error) {
			log(`  ⚠ 无法加载 ${indexPath}: ${error}`, "yellow");
		}
	}

	return results;
}

/**
 * Discover Post Types from src/acf/post-types/
 */
async function discoverPostTypes(): Promise<PostTypeEntry[]> {
	const results: PostTypeEntry[] = [];

	if (!existsSync(POST_TYPES_DIR)) {
		return results;
	}

	const entries = await readdir(POST_TYPES_DIR);
	for (const entry of entries) {
		if (!entry.endsWith(".ts") || entry === "index.ts") {
			continue;
		}

		const filePath = join(POST_TYPES_DIR, entry);
		try {
			const importPath = `../../../src/acf/post-types/${entry}`;
			const module = await import(importPath);

			for (const [exportName, exportValue] of Object.entries(module)) {
				if (isPostTypeExport(exportName, exportValue)) {
					results.push({
						name: exportName,
						config: exportValue,
						path: filePath,
					});
					log(`  ✓ Post Type: ${exportName}`, "green");
				}
			}
		} catch (error) {
			log(`  ⚠ 无法加载 ${filePath}: ${error}`, "yellow");
		}
	}

	return results;
}

/**
 * Discover Taxonomies from src/acf/taxonomies/
 */
async function discoverTaxonomies(): Promise<TaxonomyEntry[]> {
	const results: TaxonomyEntry[] = [];

	if (!existsSync(TAXONOMIES_DIR)) {
		return results;
	}

	const entries = await readdir(TAXONOMIES_DIR);
	for (const entry of entries) {
		if (!entry.endsWith(".ts") || entry === "index.ts") {
			continue;
		}

		const filePath = join(TAXONOMIES_DIR, entry);
		try {
			const importPath = `../../../src/acf/taxonomies/${entry}`;
			const module = await import(importPath);

			for (const [exportName, exportValue] of Object.entries(module)) {
				if (isTaxonomyExport(exportName, exportValue)) {
					results.push({
						name: exportName,
						config: exportValue,
						path: filePath,
					});
					log(`  ✓ Taxonomy: ${exportName}`, "green");
				}
			}
		} catch (error) {
			log(`  ⚠ 无法加载 ${filePath}: ${error}`, "yellow");
		}
	}

	return results;
}

/**
 * Main discovery function
 */
export async function discoverDefinitions(): Promise<DiscoveredDefinitions> {
	step(1, TOTAL_STEPS, "自动发现 ACF 定义...");

	const fieldGroups = await discoverFieldGroups();
	const postTypes = await discoverPostTypes();
	const taxonomies = await discoverTaxonomies();

	log(
		`\n  发现: ${fieldGroups.length} Field Groups, ${postTypes.length} Post Types, ${taxonomies.length} Taxonomies`,
		"cyan"
	);

	return { fieldGroups, postTypes, taxonomies };
}
