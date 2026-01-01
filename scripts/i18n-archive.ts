#!/usr/bin/env bun

/**
 * i18n Archive Script
 *
 * Archives translations for specified locale(s) by commenting them out with @archived marker.
 * This preserves translation work when a language is temporarily removed from WordPress.
 *
 * Usage: bun i18n:archive <locale> [locale2...]
 * Example: bun i18n:archive af
 *          bun i18n:archive af ko
 */

import { readFile, writeFile } from "node:fs/promises";
import { Glob } from "bun";

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
const LOCALE_FORMAT_PATTERN = /^[a-z]{2}$/;

/**
 * Archive a single translation line
 * Converts: `af: "text",` to `// @archived af: "text",`
 */
function archiveTranslationLine(
	line: string,
	locale: string
): { changed: boolean; line: string } {
	// Pattern to match active translation line for specific locale
	// Handles: `  af: "text",` or `  af: 'text',` or `  af: \`text\`,`
	// Uses greedy match to handle apostrophes in text (e.g., "'n voorpunt")
	const pattern = new RegExp(`^(\\s*)(${locale}):\\s*(["'\`])(.*?)\\3,?\\s*$`);

	const match = line.match(pattern);
	if (match) {
		const [, indent, loc, quote, text] = match;
		// Preserve trailing comma
		const hasComma = line.trimEnd().endsWith(",");
		return {
			changed: true,
			line: `${indent}// @archived ${loc}: ${quote}${text}${quote}${hasComma ? "," : ""}`,
		};
	}

	return { changed: false, line };
}

/**
 * Archive translations in a file for specified locales
 */
async function archiveInFile(
	filePath: string,
	locales: string[]
): Promise<number> {
	const content = await readFile(filePath, "utf-8");
	const lines = content.split("\n");
	let totalArchived = 0;

	const newLines = lines.map((line) => {
		// Skip already archived lines
		if (line.includes("// @archived")) {
			return line;
		}

		for (const locale of locales) {
			const result = archiveTranslationLine(line, locale);
			if (result.changed) {
				totalArchived += 1;
				return result.line;
			}
		}
		return line;
	});

	if (totalArchived > 0) {
		await writeFile(filePath, newLines.join("\n"));
	}

	return totalArchived;
}

/**
 * Archive translations for specified locales in all content files
 */
async function archiveTranslations(locales: string[]): Promise<{
	total: number;
	files: { path: string; count: number }[];
}> {
	const glob = new Glob("**/*.content.ts");
	const files: { path: string; count: number }[] = [];
	let total = 0;

	for await (const file of glob.scan({ cwd: CONTENT_DIR })) {
		const filePath = `${CONTENT_DIR}/${file}`;
		const count = await archiveInFile(filePath, locales);
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
		log("\n❌ Error: Please specify at least one locale to archive", "red");
		log("\nUsage: bun i18n:archive <locale> [locale2...]", "dim");
		log("Example: bun i18n:archive af", "dim");
		log("         bun i18n:archive af ko", "dim");
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

	log(
		`\n${c.cyan}📦 Archiving translations for: ${locales.join(", ")}${c.reset}`
	);

	try {
		const { total, files } = await archiveTranslations(locales);

		if (total === 0) {
			log(`\n⚠ No translations found for: ${locales.join(", ")}`, "yellow");
			log("  (They may already be archived or don't exist)", "dim");
			return;
		}

		log(
			`\n✓ Archived ${total} translations in ${files.length} files:`,
			"green"
		);
		for (const file of files) {
			log(`  - ${file.path}: ${file.count} translations`, "dim");
		}

		log(
			"\n  Translations preserved as comments, can be restored later with:",
			"dim"
		);
		log(`  bun i18n:restore ${locales.join(" ")}`, "cyan");
		log("");
	} catch (error) {
		log(`\n❌ Error: ${error}`, "red");
		process.exit(1);
	}
}

main();
