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

/**
 * Generate errors for files with TODO placeholders
 */
function generateTodoErrors(issues: Map<string, FileIssue>): {
	errors: string[];
	localesNeeded: Set<string>;
} {
	const errors: string[] = [];
	const filesWithTodos = [...issues.entries()].filter(
		([, issue]) => issue.todoPlaceholders.length > 0
	);

	if (filesWithTodos.length === 0) {
		return { errors, localesNeeded: new Set() };
	}

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
	const firstLocale = [...localesNeeded][0];

	errors.push(
		`${filesWithTodos.length} 个文件包含未翻译的 [TODO:${firstLocale}] 占位符`
	);
	errors.push(`  文件: ${fileNames}`);
	errors.push("");
	errors.push("Why: checkall 会阻止构建，直到所有 [TODO:xx] 占位符被翻译");
	errors.push("     这确保生产环境不会出现未翻译的内容");
	errors.push("");
	errors.push("How: 在以下文件中搜索并翻译:");
	errors.push(`  1. 在 IDE 中搜索: [TODO:${firstLocale}]`);
	errors.push("  2. 将占位符替换为对应语言的翻译");
	errors.push(
		`  3. 如果语言已移除，运行: bun i18n:archive ${localesList.replace(/, /g, " ")}`
	);

	return { errors, localesNeeded };
}

/**
 * Generate errors for files with missing locales
 */
function generateMissingLocaleErrors(issues: Map<string, FileIssue>): string[] {
	const errors: string[] = [];
	const filesWithMissing = [...issues.entries()].filter(
		([, issue]) => issue.missingLocales.length > 0
	);

	if (filesWithMissing.length === 0) {
		return errors;
	}

	const missingLocales = new Set<string>();
	for (const [, issue] of filesWithMissing) {
		for (const locale of issue.missingLocales) {
			missingLocales.add(locale);
		}
	}

	const localesList = [...missingLocales].join(", ");
	const firstLocale = [...missingLocales][0];
	errors.push(`缺少以下语言的翻译键: ${localesList}`);
	errors.push("");
	errors.push("Why: 部分 t() 调用没有包含所有配置的语言");
	errors.push("     这会导致运行时使用 fallback 语言，影响用户体验");
	errors.push("");
	errors.push("How: 为每个 t() 调用添加缺失的语言:");
	errors.push(`  1. 搜索不包含 "${firstLocale}:" 的 t() 调用`);
	errors.push(
		`  2. 添加: ${firstLocale}: "[TODO:${firstLocale}] English text"`
	);
	errors.push("  3. 翻译所有 [TODO:xx] 占位符");

	return errors;
}

export async function runContentLocalesCheck(): Promise<CheckResult> {
	const result = await checkContentLocales();
	printCheck("Content locales", result.passed);

	if (!result.passed) {
		const todoResult = generateTodoErrors(result.issues);
		const missingErrors = generateMissingLocaleErrors(result.issues);

		const errors = [...todoResult.errors];
		if (errors.length > 0 && missingErrors.length > 0) {
			errors.push("");
		}
		errors.push(...missingErrors);

		return { passed: false, errors };
	}

	return { passed: true, errors: [] };
}
