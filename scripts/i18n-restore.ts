#!/usr/bin/env bun

/**
 * i18n Restore Script
 *
 * Restores archived translations for specified locale(s) by uncommenting @archived markers.
 * Use this when a language is re-added to WordPress Polylang.
 *
 * Usage: bun i18n:restore <locale> [locale2...]
 * Example: bun i18n:restore af
 *          bun i18n:restore af ko
 */

import { readFile, writeFile } from "node:fs/promises";
import { Glob } from "bun";
import { Locales } from "intlayer";

const c = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
};

function log(msg: string, color: keyof typeof c = "reset") {
	console.log(`${c[color]}${msg}${c.reset}`);
}

const CONTENT_DIR = "src/content";
const INTLAYER_CONFIG_FILE = "intlayer.config.ts";
const CONFIG_LOCALES_PATTERN = /Locales\.(\w+)/g;
const LOCALE_FORMAT_PATTERN = /^[a-z]{2}$/;

// Build reverse lookup from Intlayer Locales
const LOCALE_KEY_TO_CODE: Record<string, string> = {};
for (const [key, value] of Object.entries(Locales)) {
	if (typeof value === "string") {
		LOCALE_KEY_TO_CODE[key] = value.toLowerCase();
	}
}

/**
 * Extract current locales from intlayer.config.ts
 */
async function extractCurrentLocales(): Promise<string[]> {
	try {
		const content = await readFile(INTLAYER_CONFIG_FILE, "utf-8");
		const matches = [...content.matchAll(CONFIG_LOCALES_PATTERN)];
		return matches.map((m) => LOCALE_KEY_TO_CODE[m[1]] || m[1].toLowerCase());
	} catch {
		return [];
	}
}

/**
 * Restore a single archived translation line
 * Converts: `// @archived af: "text",` to `af: "text",`
 */
function restoreTranslationLine(
	line: string,
	locale: string
): { changed: boolean; line: string } {
	// Pattern to match archived translation line for specific locale
	// Uses greedy match to handle apostrophes in text (e.g., "'n voorpunt")
	const pattern = new RegExp(
		`^(\\s*)//\\s*@archived\\s+(${locale}):\\s*(["'\`])(.*?)\\3,?\\s*$`
	);

	const match = line.match(pattern);
	if (match) {
		const [, indent, loc, quote, text] = match;
		// Preserve trailing comma
		const hasComma = line.trimEnd().endsWith(",");
		return {
			changed: true,
			line: `${indent}${loc}: ${quote}${text}${quote}${hasComma ? "," : ""}`,
		};
	}

	return { changed: false, line };
}

/**
 * Restore translations in a file for specified locales
 */
async function restoreInFile(
	filePath: string,
	locales: string[]
): Promise<number> {
	const content = await readFile(filePath, "utf-8");
	const lines = content.split("\n");
	let totalRestored = 0;

	const newLines = lines.map((line) => {
		for (const locale of locales) {
			const result = restoreTranslationLine(line, locale);
			if (result.changed) {
				totalRestored += 1;
				return result.line;
			}
		}
		return line;
	});

	if (totalRestored > 0) {
		await writeFile(filePath, newLines.join("\n"));
	}

	return totalRestored;
}

/**
 * Restore translations for specified locales in all content files
 */
async function restoreTranslations(locales: string[]): Promise<{
	total: number;
	files: { path: string; count: number }[];
}> {
	const glob = new Glob("**/*.content.ts");
	const files: { path: string; count: number }[] = [];
	let total = 0;

	for await (const file of glob.scan({ cwd: CONTENT_DIR })) {
		const filePath = `${CONTENT_DIR}/${file}`;
		const count = await restoreInFile(filePath, locales);
		if (count > 0) {
			files.push({ path: file, count });
			total += count;
		}
	}

	return { total, files };
}

async function main() {
	const locales = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));

	if (locales.length === 0) {
		log("\n❌ Error: Please specify at least one locale to restore", "red");
		log("\nUsage: bun i18n:restore <locale> [locale2...]", "dim");
		log("Example: bun i18n:restore af", "dim");
		log("         bun i18n:restore af ko", "dim");
		process.exit(1);
	}

	// Validate locale format
	for (const locale of locales) {
		if (!LOCALE_FORMAT_PATTERN.test(locale)) {
			log(`\n❌ Error: Invalid locale format: ${locale}`, "red");
			log("Locales should be 2-letter lowercase codes (e.g., af, ko)", "dim");
			process.exit(1);
		}
	}

	// Check if locale is in current config
	const currentLocales = await extractCurrentLocales();
	const invalidLocales = locales.filter((l) => !currentLocales.includes(l));

	if (invalidLocales.length > 0) {
		log(
			`\n❌ Error: Locale(s) not in current config: ${invalidLocales.join(", ")}`,
			"red"
		);
		log(`  Current locales: ${currentLocales.join(", ")}`, "dim");
		log("\n  First add the language to WordPress Polylang, then run:", "dim");
		log("  bun sync", "cyan");
		process.exit(1);
	}

	log(
		`\n${c.cyan}📦 Restoring translations for: ${locales.join(", ")}${c.reset}`
	);

	try {
		const { total, files } = await restoreTranslations(locales);

		if (total === 0) {
			log(
				`\n⚠ No archived translations found for: ${locales.join(", ")}`,
				"yellow"
			);
			log("  (They may already be restored or never existed)", "dim");
			return;
		}

		log(
			`\n✓ Restored ${total} translations in ${files.length} files:`,
			"green"
		);
		for (const file of files) {
			log(`  - ${file.path}: ${file.count} translations`, "dim");
		}

		log("\n  No [TODO] placeholders needed - translations recovered!", "green");
		log("");
	} catch (error) {
		log(`\n❌ Error: ${error}`, "red");
		process.exit(1);
	}
}

main();
