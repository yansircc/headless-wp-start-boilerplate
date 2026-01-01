/**
 * Generated Files Check
 *
 * Verifies that auto-generated files haven't been manually modified
 * and that critical generated files exist.
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";
import { type CheckResult, printCheck } from "./types";

const ROOT_DIR = join(import.meta.dir, "../..");

// Files that should only be modified by `bun sync`, not manually
// Note: intlayer.config.ts is validated by runI18nCheck() instead,
// which dynamically verifies it matches the GraphQL schema
const GENERATED_PATTERNS = [
	"src/graphql/_generated/**/*",
	"src/acf/definitions/*/_generated/**/*",
	"src/acf/compiled/**/*",
];

const CRITICAL_GENERATED_FILES = [
	"src/graphql/_generated/graphql.ts",
	"src/routeTree.gen.ts",
];

async function checkGeneratedFilesNotModified(): Promise<{
	passed: boolean;
	modified: string[];
}> {
	const modified: string[] = [];

	// Check if we're in a git repository
	try {
		execSync("git rev-parse --git-dir", { cwd: ROOT_DIR, stdio: "pipe" });
	} catch {
		return { passed: true, modified: [] };
	}

	// Get list of modified files from git
	let gitOutput: string;
	try {
		gitOutput = execSync("git diff --name-only HEAD", {
			cwd: ROOT_DIR,
			encoding: "utf-8",
		}).trim();
	} catch {
		return { passed: true, modified: [] };
	}

	if (!gitOutput) {
		return { passed: true, modified: [] };
	}

	const modifiedFiles = new Set(gitOutput.split("\n").filter(Boolean));

	for (const pattern of GENERATED_PATTERNS) {
		const glob = new Glob(pattern);
		for await (const file of glob.scan({ cwd: ROOT_DIR })) {
			if (modifiedFiles.has(file)) {
				modified.push(file);
			}
		}
	}

	return {
		passed: modified.length === 0,
		modified,
	};
}

function checkGeneratedFilesExist(): {
	passed: boolean;
	missing: string[];
} {
	const missing: string[] = [];

	for (const file of CRITICAL_GENERATED_FILES) {
		const fullPath = join(ROOT_DIR, file);
		if (!existsSync(fullPath)) {
			missing.push(file);
		}
	}

	return {
		passed: missing.length === 0,
		missing,
	};
}

export async function runGeneratedFilesNotModifiedCheck(): Promise<CheckResult> {
	const result = await checkGeneratedFilesNotModified();
	printCheck("Generated files not modified", result.passed);

	if (!result.passed) {
		return {
			passed: false,
			errors: [
				"检测到自动生成的文件被手动修改:",
				...result.modified.map((f) => `  • ${f}`),
				"",
				"Why: 这些文件由 `bun sync` 自动生成，手动修改会在下次同步时被覆盖",
				"     正确做法是修改源文件（src/acf/definitions/），然后运行同步",
				"",
				"How: 执行以下步骤修复:",
				"  1. 撤销对生成文件的修改: git checkout -- <file>",
				"  2. 如需修改字段，编辑 src/acf/definitions/ 下的源文件",
				"  3. 运行 `bun sync` 重新生成",
			],
		};
	}
	return { passed: true, errors: [] };
}

export function runGeneratedFilesExistCheck(): CheckResult {
	const result = checkGeneratedFilesExist();
	printCheck("Generated files exist", result.passed);

	if (!result.passed) {
		return {
			passed: false,
			errors: [
				"缺少必需的生成文件:",
				...result.missing.map((f) => `  • ${f}`),
				"",
				"Why: 这些文件是构建所必需的，通常在首次设置或 git clone 后缺失",
				"",
				"How: 运行 `bun sync` 生成所有必需文件",
			],
		};
	}
	return { passed: true, errors: [] };
}
