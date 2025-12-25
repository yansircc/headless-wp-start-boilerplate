/**
 * GraphQL Fragments Check
 *
 * Verifies that GraphQL queries use auto-generated fragments
 * instead of manually listing ACF fields.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";
import { type CheckResult, printCheck } from "./types";

const ROOT_DIR = join(import.meta.dir, "../..");

function checkFragmentUsage(): {
	passed: boolean;
	warnings: string[];
} {
	const warnings: string[] = [];
	const graphqlDir = join(ROOT_DIR, "src/graphql");
	const glob = new Glob("**/*.graphql");

	for (const file of glob.scanSync({ cwd: graphqlDir })) {
		if (file.includes("_generated")) {
			continue;
		}

		const content = readFileSync(join(graphqlDir, file), "utf-8");
		const acfGroupPattern = /(\w+AcfGroup)\s*\{[^}]*\}/g;

		for (const match of content.matchAll(acfGroupPattern)) {
			const block = match[0];
			if (!block.includes("...")) {
				warnings.push(
					`${file}: Consider using auto-generated fragment instead of inline fields in ${match[1]}`
				);
			}
		}
	}

	return {
		passed: true,
		warnings,
	};
}

export function runFragmentUsageCheck(): CheckResult {
	const result = checkFragmentUsage();
	printCheck(
		"GraphQL fragments",
		true,
		result.warnings.length > 0
			? `${result.warnings.length} warnings`
			: undefined
	);
	return { passed: true, errors: [], warnings: result.warnings };
}
