/**
 * i18n Configuration Check
 *
 * Verifies that i18n configuration is in sync with WordPress Polylang.
 */

import { execSync } from "node:child_process";
import { join } from "node:path";
import { type CheckResult, printCheck } from "./types";

const ROOT_DIR = join(import.meta.dir, "../..");

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
		// Combine stdout and stderr to capture all output
		const output = [err.stdout, err.stderr].filter(Boolean).join("\n");
		return {
			passed: false,
			output: output || "i18n config out of sync. Run `bun sync` to update.",
		};
	}
}

export function runI18nCheck(): CheckResult {
	const result = checkI18nConfig();
	printCheck("i18n configuration", result.passed);

	if (!result.passed) {
		// Parse output to provide specific error messages
		const output = result.output;

		// Check for orphaned translations
		const orphanedMatch = output.match(
			/Orphaned translations found: ([a-z, ]+)/
		);
		if (orphanedMatch) {
			const locales = orphanedMatch[1];
			return {
				passed: false,
				errors: [
					`Orphaned translations: ${locales}`,
					`Fix: Run \`bun i18n:archive ${locales.replace(/, /g, " ")}\``,
				],
			};
		}

		// Default: config out of sync
		return {
			passed: false,
			errors: ["i18n config out of sync", "Fix: Run `bun sync`"],
		};
	}
	return { passed: true, errors: [] };
}
