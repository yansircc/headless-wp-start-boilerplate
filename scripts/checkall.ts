/**
 * Pre-build Check Script
 *
 * Runs all checks before building. Reports issues clearly for developers.
 *
 * Run: bun checkall
 *
 * Options:
 *   --check          Check-only mode, don't generate files (for git hooks)
 *
 * Environment:
 *   SKIP_SEO_CHECK=1   Skip SEO validation (for CI without WordPress)
 */

import {
	type CheckResult,
	runFragmentUsageCheck,
	runGeneratedFilesExistCheck,
	runGeneratedFilesNotModifiedCheck,
	runI18nCheck,
	runSeoValidationChecks,
} from "./checks";

// ============================================
// Main
// ============================================

async function main() {
	console.log("\n\x1b[1mChecking...\x1b[0m\n");

	const results: CheckResult[] = [];
	const allWarnings: string[] = [];

	// Run core checks
	results.push(await runGeneratedFilesNotModifiedCheck());
	results.push(runGeneratedFilesExistCheck());
	results.push(runFragmentUsageCheck());
	results.push(runI18nCheck());

	// Run SEO validation checks
	const seoResult = await runSeoValidationChecks();
	results.push(seoResult);

	// Collect all errors and warnings
	const allErrors = results.flatMap((r) => r.errors);
	const hasErrors = results.some((r) => !r.passed);

	// Collect warnings from all results
	for (const result of results) {
		if (result.warnings && result.warnings.length > 0) {
			allWarnings.push(...result.warnings);
		}
	}

	console.log("");

	if (hasErrors) {
		console.log("\x1b[31m\u2717 Failed\x1b[0m\n");
		for (const error of allErrors) {
			console.log(`  ${error}`);
		}
		console.log("");
		process.exit(1);
	}

	console.log("\x1b[32m\u2713 All checks passed\x1b[0m");

	// Print warnings if any
	if (allWarnings.length > 0) {
		console.log("\n\x1b[33mWarnings:\x1b[0m");
		for (const warning of allWarnings) {
			console.log(`  ${warning}`);
		}
	}

	console.log("");
}

main().catch((error) => {
	console.error("Check script error:", error);
	process.exit(1);
});
