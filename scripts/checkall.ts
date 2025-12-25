/**
 * Pre-build Check Script
 *
 * Runs all checks before building. Reports issues clearly for developers.
 *
 * Run: bun checkall
 *
 * Options:
 *   --check          Check-only mode, don't generate files (for git hooks)
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

const ROOT_DIR = join(import.meta.dir, "..");

// ============================================
// Configuration
// ============================================

// Files that should only be modified by `bun sync`, not manually
// Note: routeTree.gen.ts is NOT included because it's auto-generated
// by TanStack Router when routes are added/modified (legitimate changes)
const GENERATED_PATTERNS = [
	"src/graphql/_generated/**/*",
	"src/acf/definitions/*/_generated/**/*",
	"src/acf/compiled/**/*",
	"intlayer.config.ts",
];

const CRITICAL_GENERATED_FILES = [
	"src/graphql/_generated/graphql.ts",
	"src/routeTree.gen.ts",
];

// ============================================
// Validation Functions
// ============================================

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

function checkI18nConfig(): {
	passed: boolean;
	output: string;
} {
	try {
		const output = execSync("bun run sync:i18n:check", {
			cwd: ROOT_DIR,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		return { passed: true, output };
	} catch (error) {
		const err = error as { stderr?: string; stdout?: string };
		return {
			passed: false,
			output:
				err.stderr ||
				err.stdout ||
				"i18n config out of sync. Run `bun sync` to update.",
		};
	}
}

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

// ============================================
// Output Helpers
// ============================================

function printCheck(name: string, passed: boolean, detail?: string): void {
	const icon = passed ? "✓" : "✗";
	const color = passed ? "\x1b[32m" : "\x1b[31m";
	const reset = "\x1b[0m";
	const suffix = detail ? ` ${"\x1b[2m"}${detail}${reset}` : "";
	console.log(`  ${color}${icon}${reset} ${name}${suffix}`);
}

// ============================================
// Check Runners (return { passed, errors })
// ============================================

type CheckResult = { passed: boolean; errors: string[] };

async function runGeneratedFilesCheck(): Promise<CheckResult> {
	const result = await checkGeneratedFilesNotModified();
	printCheck("Generated files not modified", result.passed);

	if (!result.passed) {
		return {
			passed: false,
			errors: [
				"Modified generated files:",
				...result.modified.map((f) => `  • ${f}`),
				"Fix: Revert changes and run `bun sync` instead",
			],
		};
	}
	return { passed: true, errors: [] };
}

function runFilesExistCheck(): CheckResult {
	const result = checkGeneratedFilesExist();
	printCheck("Generated files exist", result.passed);

	if (!result.passed) {
		return {
			passed: false,
			errors: [
				"Missing files:",
				...result.missing.map((f) => `  • ${f}`),
				"Fix: Run `bun sync`",
			],
		};
	}
	return { passed: true, errors: [] };
}

function runFragmentUsageCheck(): CheckResult {
	const result = checkFragmentUsage();
	printCheck(
		"GraphQL fragments",
		true,
		result.warnings.length > 0
			? `${result.warnings.length} warnings`
			: undefined
	);
	return { passed: true, errors: [] };
}

function runI18nCheck(): CheckResult {
	const result = checkI18nConfig();
	printCheck("i18n configuration", result.passed);

	if (!result.passed) {
		return {
			passed: false,
			errors: ["i18n out of sync", "Fix: Run `bun sync`"],
		};
	}
	return { passed: true, errors: [] };
}

// ============================================
// Main
// ============================================

async function main() {
	console.log("\n\x1b[1mChecking...\x1b[0m\n");

	const results: CheckResult[] = [];

	results.push(await runGeneratedFilesCheck());
	results.push(runFilesExistCheck());
	results.push(runFragmentUsageCheck());
	results.push(runI18nCheck());

	// Collect all errors
	const allErrors = results.flatMap((r) => r.errors);
	const hasErrors = results.some((r) => !r.passed);

	console.log("");

	if (hasErrors) {
		console.log("\x1b[31m✗ Failed\x1b[0m\n");
		for (const error of allErrors) {
			console.log(`  ${error}`);
		}
		console.log("");
		process.exit(1);
	}

	console.log("\x1b[32m✓ All checks passed\x1b[0m\n");
}

main().catch((error) => {
	console.error("Check script error:", error);
	process.exit(1);
});
