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
				"Modified generated files:",
				...result.modified.map((f) => `  \u2022 ${f}`),
				"Fix: Revert changes and run `bun sync` instead",
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
				"Missing files:",
				...result.missing.map((f) => `  \u2022 ${f}`),
				"Fix: Run `bun sync`",
			],
		};
	}
	return { passed: true, errors: [] };
}
