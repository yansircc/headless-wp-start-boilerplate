/**
 * Content Locales Check
 *
 * Verifies that all content files have translations for all configured locales.
 * Reports missing locales with guidance on how to fix.
 */

import { readFile } from "node:fs/promises";
import { Glob } from "bun";
import { type CheckResult, printCheck } from "./types";

const CONTENT_DIR = "src/content";
const GRAPHQL_FILE = "src/graphql/_generated/graphql.ts";

/**
 * Extract language codes from GraphQL LanguageCodeEnum
 */
async function getConfiguredLocales(): Promise<string[]> {
	const content = await readFile(GRAPHQL_FILE, "utf-8");
	const enumMatch = content.match(/export enum LanguageCodeEnum \{([^}]+)\}/);
	if (!enumMatch) {
		return [];
	}

	const languages = [...enumMatch[1].matchAll(/(\w+)\s*=/g)].map((m) =>
		m[1].toLowerCase()
	);
	return languages;
}

/**
 * Find locales present in a content file
 */
async function getFileLocales(filePath: string): Promise<Set<string>> {
	const content = await readFile(filePath, "utf-8");
	const locales = new Set<string>();

	// Find all locale keys in t() calls: en:, zh:, ja:, etc.
	const localePattern = /\b([a-z]{2}):\s*["'`]/g;
	let match;
	while ((match = localePattern.exec(content)) !== null) {
		locales.add(match[1]);
	}

	return locales;
}

/**
 * Check all content files for missing locales
 */
async function checkContentLocales(): Promise<{
	passed: boolean;
	missingByFile: Map<string, string[]>;
	configuredLocales: string[];
}> {
	const configuredLocales = await getConfiguredLocales();
	const missingByFile = new Map<string, string[]>();

	// Find all content files
	const glob = new Glob("**/*.content.ts");
	for await (const file of glob.scan({ cwd: CONTENT_DIR })) {
		const filePath = `${CONTENT_DIR}/${file}`;
		const fileLocales = await getFileLocales(filePath);

		// Find missing locales
		const missing = configuredLocales.filter((l) => !fileLocales.has(l));
		if (missing.length > 0) {
			missingByFile.set(filePath, missing);
		}
	}

	return {
		passed: missingByFile.size === 0,
		missingByFile,
		configuredLocales,
	};
}

export async function runContentLocalesCheck(): Promise<CheckResult> {
	const result = await checkContentLocales();
	printCheck("Content locales", result.passed);

	if (!result.passed) {
		const errors: string[] = [];
		errors.push("Missing translations in content files:");

		for (const [file, missing] of result.missingByFile) {
			errors.push(`  • ${file}: missing ${missing.join(", ")}`);
		}

		errors.push("");
		errors.push("Fix: Add translations for missing locales in each t() call:");
		errors.push('  t({ en: "Hello", zh: "你好", pt: "Olá" })');
		errors.push("");
		errors.push("Or run: bun scripts/sync-content-locales.ts");
		errors.push("  (auto-adds missing locales using English as placeholder)");

		return { passed: false, errors };
	}

	return { passed: true, errors: [] };
}
