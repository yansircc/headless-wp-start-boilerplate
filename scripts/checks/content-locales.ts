/**
 * Content Locales Check
 *
 * Verifies that:
 * 1. All content files have translations for all configured locales
 * 2. No [TODO:xx] placeholders remain (untranslated entries)
 *
 * Returns ERROR if any issues found (blocks build).
 */

import { readFile } from "node:fs/promises";
import { Glob } from "bun";
import { type CheckResult, printCheck } from "./types";

const CONTENT_DIR = "src/content";
const GRAPHQL_FILE = "src/graphql/_generated/graphql.ts";

// Regex patterns (top-level for performance)
const LANGUAGE_ENUM_PATTERN = /export enum LanguageCodeEnum \{([^}]+)\}/;
const LOCALE_PATTERN = /\b([a-z]{2}):\s*["'`]/g;
const TODO_PATTERN = /\[TODO:([a-z]{2})\]\s*([^"'`]*)/g;

/**
 * Extract language codes from GraphQL LanguageCodeEnum
 */
async function getConfiguredLocales(): Promise<string[]> {
	const content = await readFile(GRAPHQL_FILE, "utf-8");
	const enumMatch = content.match(LANGUAGE_ENUM_PATTERN);
	if (!enumMatch) {
		return [];
	}

	const languages = [...enumMatch[1].matchAll(/(\w+)\s*=/g)].map((m) =>
		m[1].toLowerCase()
	);
	return languages;
}

type FileIssue = {
	missingLocales: string[];
	todoPlaceholders: Array<{ locale: string; line: number; text: string }>;
};

/**
 * Analyze a content file for missing locales and TODO placeholders
 */
async function analyzeFile(
	filePath: string,
	configuredLocales: string[]
): Promise<FileIssue> {
	const content = await readFile(filePath, "utf-8");
	const lines = content.split("\n");

	// Find locales present in the file
	const presentLocales = new Set<string>();
	const localeRegex = new RegExp(LOCALE_PATTERN.source, "g");
	for (const match of content.matchAll(localeRegex)) {
		presentLocales.add(match[1]);
	}

	// Find missing locales
	const missingLocales = configuredLocales.filter(
		(l) => !presentLocales.has(l)
	);

	// Find [TODO:xx] placeholders with line numbers
	const todoPlaceholders: FileIssue["todoPlaceholders"] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const todoRegex = new RegExp(TODO_PATTERN.source, "g");
		for (const todoMatch of line.matchAll(todoRegex)) {
			const text = todoMatch[2].trim();
			todoPlaceholders.push({
				locale: todoMatch[1],
				line: i + 1,
				text: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
			});
		}
	}

	return { missingLocales, todoPlaceholders };
}

/**
 * Check all content files
 */
async function checkContentLocales(): Promise<{
	passed: boolean;
	issues: Map<string, FileIssue>;
	configuredLocales: string[];
}> {
	const configuredLocales = await getConfiguredLocales();
	const issues = new Map<string, FileIssue>();

	// Find all content files
	const glob = new Glob("**/*.content.ts");
	for await (const file of glob.scan({ cwd: CONTENT_DIR })) {
		const filePath = `${CONTENT_DIR}/${file}`;
		const fileIssue = await analyzeFile(filePath, configuredLocales);

		if (
			fileIssue.missingLocales.length > 0 ||
			fileIssue.todoPlaceholders.length > 0
		) {
			issues.set(filePath, fileIssue);
		}
	}

	return {
		passed: issues.size === 0,
		issues,
		configuredLocales,
	};
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Linear flow with nested loops
export async function runContentLocalesCheck(): Promise<CheckResult> {
	const result = await checkContentLocales();
	printCheck("Content locales", result.passed);

	if (!result.passed) {
		const errors: string[] = [];

		// Check for TODO placeholders
		const filesWithTodos = [...result.issues.entries()].filter(
			([, issue]) => issue.todoPlaceholders.length > 0
		);

		if (filesWithTodos.length > 0) {
			// Collect unique locales that need translation
			const localesNeeded = new Set<string>();
			for (const [, issue] of filesWithTodos) {
				for (const todo of issue.todoPlaceholders) {
					localesNeeded.add(todo.locale);
				}
			}

			const fileNames = filesWithTodos
				.map(([file]) => file.replace("src/content/", ""))
				.join(", ");
			const localesList = [...localesNeeded].join(", ");

			errors.push(
				`${filesWithTodos.length} file(s) need translation for: ${localesList}`
			);
			errors.push(`  ${fileNames}`);
			errors.push("");
			errors.push(`Search: [TODO:${[...localesNeeded][0]}]`);
		}

		// Check for missing locales
		const filesWithMissing = [...result.issues.entries()].filter(
			([, issue]) => issue.missingLocales.length > 0
		);

		if (filesWithMissing.length > 0) {
			if (errors.length > 0) {
				errors.push("");
			}
			const missingLocales = new Set<string>();
			for (const [, issue] of filesWithMissing) {
				for (const locale of issue.missingLocales) {
					missingLocales.add(locale);
				}
			}

			errors.push(`Missing locales: ${[...missingLocales].join(", ")}`);
			errors.push(
				"Add translations manually with [TODO:xx] placeholder, then translate."
			);
		}

		return { passed: false, errors };
	}

	return { passed: true, errors: [] };
}
