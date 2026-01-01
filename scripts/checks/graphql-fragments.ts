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

// Regex patterns (top-level for performance)
const ACF_GROUP_SUFFIX_PATTERN = /AcfGroup$/;

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
				const groupName = match[1];
				const fragmentName = groupName.replace(
					ACF_GROUP_SUFFIX_PATTERN,
					"AcfFields"
				);
				warnings.push(
					`${file}: 检测到 ${groupName} 使用内联字段`,
					"",
					"Why: 内联字段不会随 ACF 定义变更自动更新，容易导致数据缺失或类型不匹配",
					"",
					"How: 将内联字段替换为自动生成的 Fragment:",
					`     ${groupName} {`,
					`       ...${fragmentName}  ← 使用这个`,
					"     }",
					"",
					"     Fragment 位置: src/graphql/_generated/ 或 src/acf/definitions/*/_generated/",
					""
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
