/**
 * Step 3: Compile ACF definitions to JSON
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { COMPILED_DIR, TOTAL_STEPS } from "../config";
import type { DiscoveredDefinitions } from "../types";
import { log, step } from "../utils";

export async function compileAcf(
	definitions: DiscoveredDefinitions
): Promise<boolean> {
	step(3, TOTAL_STEPS, "编译 ACF 定义...");

	const { toAcfJson } = await import(
		"../../../src/acf/definitions/product/index.ts"
	);

	await mkdir(COMPILED_DIR, { recursive: true });

	// Compile Field Groups
	for (const { config } of definitions.fieldGroups) {
		const groupJson = toAcfJson(config);
		await writeFile(
			join(COMPILED_DIR, `${config.key}.json`),
			JSON.stringify(groupJson, null, 2)
		);
		log(`  ✓ ${config.key}.json`, "green");
	}

	// Compile Post Types
	for (const { config } of definitions.postTypes) {
		await writeFile(
			join(COMPILED_DIR, `post-type_${config.post_type}.json`),
			JSON.stringify(config, null, 2)
		);
		log(`  ✓ post-type_${config.post_type}.json`, "green");
	}

	// Compile Taxonomies
	for (const { config } of definitions.taxonomies) {
		await writeFile(
			join(COMPILED_DIR, `taxonomy_${config.taxonomy}.json`),
			JSON.stringify(config, null, 2)
		);
		log(`  ✓ taxonomy_${config.taxonomy}.json`, "green");
	}

	return true;
}
