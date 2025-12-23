/**
 * Pre-build Validation Script
 *
 * Runs all validation checks before building:
 * 1. Check for manual modifications to auto-generated files
 * 2. Validate SEO configuration
 * 3. Fragment usage check
 * 4. i18n configuration sync check
 *
 * Run: bun scripts/validate.ts
 * Or: bun validate
 *
 * Options:
 *   --check  Only validate, don't generate files (for git hooks)
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

const ROOT_DIR = join(import.meta.dir, "..");

// ============================================
// Configuration
// ============================================

const GENERATED_PATTERNS = [
	"src/graphql/_generated/**/*",
	"src/acf/definitions/*/_generated/**/*",
	"src/acf/compiled/**/*",
	"src/routeTree.gen.ts",
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

function checkSeoConfig(checkOnly: boolean): {
	passed: boolean;
	output: string;
} {
	try {
		const command = checkOnly ? "bun run seo --check" : "bun run seo";
		const output = execSync(command, {
			cwd: ROOT_DIR,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		return { passed: true, output };
	} catch (error) {
		const err = error as { stderr?: string; stdout?: string };
		return {
			passed: false,
			output: err.stderr || err.stdout || "SEO validation failed",
		};
	}
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

const SEPARATOR = "─".repeat(60);

function printHeader(title: string): void {
	console.log(`\n${SEPARATOR}`);
	console.log(`  ${title}`);
	console.log(`${SEPARATOR}\n`);
}

function printSuccess(message: string): void {
	console.log(`  ✅ ${message}`);
}

function printError(message: string): void {
	console.error(`  ❌ ${message}`);
}

function printWarning(message: string): void {
	console.warn(`  ⚠️  ${message}`);
}

// ============================================
// Check Runners
// ============================================

async function runGeneratedFilesCheck(): Promise<boolean> {
	printHeader("Check 1: Auto-generated files");
	const result = await checkGeneratedFilesNotModified();

	if (result.passed) {
		printSuccess("No manual modifications to generated files");
		return true;
	}

	printError("The following generated files were manually modified:");
	for (const file of result.modified) {
		console.error(`     • ${file}`);
	}
	console.error("\n  To fix: Revert changes and run `bun sync` instead\n");
	return false;
}

function runFilesExistCheck(): boolean {
	printHeader("Check 2: Generated files exist");
	const result = checkGeneratedFilesExist();

	if (result.passed) {
		printSuccess("All critical generated files exist");
		return true;
	}

	printError("The following generated files are missing:");
	for (const file of result.missing) {
		console.error(`     • ${file}`);
	}
	console.error("\n  To fix: Run `bun sync` to generate files\n");
	return false;
}

function runFragmentUsageCheck(): void {
	printHeader("Check 3: Fragment usage");
	const result = checkFragmentUsage();

	if (result.warnings.length === 0) {
		printSuccess("All GraphQL queries use auto-generated fragments correctly");
		return;
	}

	for (const warning of result.warnings) {
		printWarning(warning);
	}
}

function runSeoCheck(checkOnly: boolean): boolean {
	printHeader("Check 4: SEO configuration");
	const result = checkSeoConfig(checkOnly);

	if (result.passed) {
		printSuccess("SEO configuration is valid");
		return true;
	}

	printError("SEO validation failed");
	console.error(`\n${result.output}`);
	return false;
}

function runI18nCheck(): boolean {
	printHeader("Check 5: i18n configuration");
	const result = checkI18nConfig();

	if (result.passed) {
		printSuccess("i18n configuration is in sync with WordPress Polylang");
		return true;
	}

	printError("i18n configuration out of sync");
	console.error(`\n${result.output}`);
	console.error("\n  To fix: Run `bun sync` to update intlayer.config.ts\n");
	return false;
}

// ============================================
// Main
// ============================================

async function main() {
	const isCheckOnly = process.argv.includes("--check");

	console.log("🔍 Running pre-build validations...\n");

	const check1 = await runGeneratedFilesCheck();
	const check2 = runFilesExistCheck();
	runFragmentUsageCheck();
	const check4 = runSeoCheck(isCheckOnly);
	const check5 = runI18nCheck();

	const hasErrors = !(check1 && check2 && check4 && check5);

	printHeader("Summary");
	if (hasErrors) {
		printError("Validation failed. Please fix the errors above.\n");
		process.exit(1);
	}
	printSuccess("All validations passed!\n");
}

main().catch((error) => {
	console.error("Validation script error:", error);
	process.exit(1);
});
