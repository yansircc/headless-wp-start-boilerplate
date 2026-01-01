#!/usr/bin/env bun

/**
 * i18n Sync Script
 *
 * Synchronizes language configuration from WordPress Polylang (via GraphQL schema)
 * to intlayer.config.ts, ensuring Single Source of Truth (SSOT).
 *
 * SSOT Chain:
 *   WordPress Polylang → GraphQL Schema → LanguageCodeEnum → intlayer.config.ts
 *                                                              ↑
 *                                               Intlayer Locales (dynamic lookup)
 *
 * Usage: bun scripts/sync-i18n.ts
 */

import { readFile, writeFile } from "node:fs/promises";
import { Glob } from "bun";
import { Locales } from "intlayer";

// Colors for terminal output
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

// Regex patterns (top-level for performance)
const LANGUAGE_ENUM_PATTERN = /export enum LanguageCodeEnum \{([^}]+)\}/;
const LANGUAGE_KEY_PATTERN = /(\w+)\s*=/g;
const CONFIG_LOCALES_PATTERN = /Locales\.(\w+)/g;
const CONTENT_LOCALE_PATTERN = /\b([a-z]{2}):\s*["'`]/g;
const ARCHIVED_LOCALE_PATTERN = /\/\/\s*@archived\s+([a-z]{2}):/g;

const GRAPHQL_FILE = "src/graphql/_generated/graphql.ts";
const INTLAYER_CONFIG_FILE = "intlayer.config.ts";
const CONTENT_DIR = "src/content";

/**
 * Build a reverse lookup map from Intlayer Locales
 * Locales = { ENGLISH: "en", JAPANESE: "ja", ... }
 * We need: { "en": "ENGLISH", "ja": "JAPANESE", ... }
 */
const CODE_TO_LOCALE_KEY: Record<string, string> = {};
const LOCALE_KEY_TO_CODE: Record<string, string> = {};
for (const [key, value] of Object.entries(Locales)) {
	if (typeof value === "string") {
		CODE_TO_LOCALE_KEY[value.toLowerCase()] = key;
		LOCALE_KEY_TO_CODE[key] = value.toLowerCase();
	}
}

/**
 * Get Intlayer locale string from language code (dynamic lookup)
 */
function getIntlayerLocale(langCode: string): string | undefined {
	const code = langCode.toLowerCase();
	const localeKey = CODE_TO_LOCALE_KEY[code];
	return localeKey ? `Locales.${localeKey}` : undefined;
}

/**
 * Extract LanguageCodeEnum values from generated GraphQL types
 */
async function extractLanguagesFromSchema(): Promise<string[]> {
	const content = await readFile(GRAPHQL_FILE, "utf-8");
	const enumMatch = content.match(LANGUAGE_ENUM_PATTERN);

	if (!enumMatch) {
		throw new Error("Could not find LanguageCodeEnum in GraphQL types");
	}

	const enumBody = enumMatch[1];
	return [...enumBody.matchAll(LANGUAGE_KEY_PATTERN)].map((match) => match[1]);
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
 * Extract all active (non-archived) locales used in content files
 */
async function extractContentLocales(): Promise<Set<string>> {
	const locales = new Set<string>();
	const glob = new Glob("**/*.content.ts");

	for await (const file of glob.scan({ cwd: CONTENT_DIR })) {
		const content = await readFile(`${CONTENT_DIR}/${file}`, "utf-8");
		const lines = content.split("\n");

		for (const line of lines) {
			// Skip archived lines
			if (line.includes("// @archived")) {
				continue;
			}
			for (const match of line.matchAll(CONTENT_LOCALE_PATTERN)) {
				locales.add(match[1]);
			}
		}
	}

	return locales;
}

/**
 * Extract all archived locales from content files
 */
async function extractArchivedLocales(): Promise<Set<string>> {
	const locales = new Set<string>();
	const glob = new Glob("**/*.content.ts");

	for await (const file of glob.scan({ cwd: CONTENT_DIR })) {
		const content = await readFile(`${CONTENT_DIR}/${file}`, "utf-8");
		for (const match of content.matchAll(ARCHIVED_LOCALE_PATTERN)) {
			locales.add(match[1]);
		}
	}

	return locales;
}

/**
 * Generate intlayer.config.ts content
 */
function generateIntlayerConfig(languages: string[]): {
	content: string;
	codes: string[];
	unmapped: string[];
} {
	const intlayerLocales: string[] = [];
	const codes: string[] = [];
	const unmapped: string[] = [];

	for (const lang of languages) {
		const intlayerLocale = getIntlayerLocale(lang);
		if (intlayerLocale) {
			intlayerLocales.push(intlayerLocale);
			codes.push(lang.toLowerCase());
		} else {
			unmapped.push(lang);
		}
	}

	const defaultLocale = intlayerLocales[0] || "Locales.ENGLISH";
	const localesFormatted = intlayerLocales
		.map((locale) => `\t\t\t${locale},`)
		.join("\n");

	const content = `/**
 * Intlayer Configuration
 *
 * AUTO-GENERATED from WordPress Polylang via GraphQL schema.
 * DO NOT EDIT MANUALLY - run \`bun sync\` to update.
 *
 * SSOT: WordPress Polylang → GraphQL LanguageCodeEnum → This file
 */

import { type IntlayerConfig, Locales } from "intlayer";

const config: IntlayerConfig = {
	internationalization: {
		locales: [
${localesFormatted}
		],
		defaultLocale: ${defaultLocale},
	},
	content: {
		contentDir: ["./src/content"],
	},
};

export default config;
`;

	return { content, codes, unmapped };
}

/**
 * Check if the current config matches what would be generated
 */
async function checkConfigUpToDate(newContent: string): Promise<boolean> {
	try {
		const currentContent = await readFile(INTLAYER_CONFIG_FILE, "utf-8");
		const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
		return normalize(currentContent) === normalize(newContent);
	} catch {
		return false;
	}
}

type SyncResult = {
	languages: string[];
	newLocales: string[];
	added: string[];
	removed: string[];
	restorable: string[];
	newWithoutArchive: string[];
	orphaned: string[];
};

/**
 * Output sync results in quiet mode
 */
function outputQuiet(result: SyncResult): void {
	const {
		added,
		removed,
		restorable,
		newWithoutArchive,
		orphaned,
		newLocales,
	} = result;

	if (added.length > 0) {
		log(`  + Added: ${added.join(", ")}`, "green");
	}
	if (removed.length > 0) {
		log(`  - Removed: ${removed.join(", ")}`, "yellow");
	}
	if (restorable.length > 0) {
		log(
			`  ✓ Found archived translations for: ${restorable.join(", ")}`,
			"green"
		);
		log(`\n  Run: bun i18n:restore ${restorable.join(" ")}`, "cyan");
	}
	if (newWithoutArchive.length > 0) {
		log(
			`  ⚠ No translations found for: ${newWithoutArchive.join(", ")}`,
			"yellow"
		);
		log("    Add [TODO] placeholders to content files, then translate.", "dim");
	}
	if (orphaned.length > 0) {
		log(`  ⚠ Orphaned translations: ${orphaned.join(", ")}`, "yellow");
		log(`\n  Run: bun i18n:archive ${orphaned.join(" ")}`, "cyan");
	}
	if (added.length === 0 && removed.length === 0) {
		log(`  ✓ intlayer.config.ts (${newLocales.length} locales)`, "green");
	} else {
		log(
			`  ✓ intlayer.config.ts updated (${newLocales.length} locales)`,
			"green"
		);
	}
}

/**
 * Output sync results in verbose mode
 */
function outputVerbose(result: SyncResult): void {
	const { languages, added, removed, restorable, newWithoutArchive, orphaned } =
		result;

	log(`  ✓ Found languages: ${languages.join(", ")}`, "green");
	if (added.length > 0) {
		log(`  + Added: ${added.join(", ")}`, "green");
	}
	if (removed.length > 0) {
		log(`  - Removed: ${removed.join(", ")}`, "yellow");
	}
	if (restorable.length > 0) {
		log(
			`  ✓ Found archived translations for: ${restorable.join(", ")}`,
			"green"
		);
		log("", "reset");
		log(`  Run: bun i18n:restore ${restorable.join(" ")}`, "cyan");
		log("  (This will restore previously archived translations)", "dim");
	}
	if (newWithoutArchive.length > 0) {
		log(
			`  ⚠ No translations found for: ${newWithoutArchive.join(", ")}`,
			"yellow"
		);
		log("    Add [TODO] placeholders to content files, then translate.", "dim");
	}
	if (orphaned.length > 0) {
		log(`  ⚠ Orphaned translations found: ${orphaned.join(", ")}`, "yellow");
		log("", "reset");
		log(`  Run: bun i18n:archive ${orphaned.join(" ")}`, "cyan");
		log("  (This will comment out translations with @archived marker)", "dim");
	}
	log(`  ✓ Updated ${INTLAYER_CONFIG_FILE}`, "green");
	log(`\n${c.green}✅ i18n sync complete!${c.reset}\n`);
}

async function main() {
	const isCheck = process.argv.includes("--check");
	const isQuiet = process.argv.includes("--quiet");

	if (!isQuiet) {
		log(`\n${c.cyan}🌐 Syncing i18n configuration...${c.reset}`);
	}

	try {
		// Step 1: Extract languages from GraphQL schema
		if (!isQuiet) {
			log("  Reading LanguageCodeEnum from GraphQL schema...", "dim");
		}
		const languages = await extractLanguagesFromSchema();

		// Step 2: Get current locales for diff
		const currentLocales = await extractCurrentLocales();

		// Step 3: Generate new config
		const {
			content: newConfig,
			codes: newLocales,
			unmapped,
		} = generateIntlayerConfig(languages);

		// Step 4: Calculate diff
		const added = newLocales.filter((l) => !currentLocales.includes(l));
		const removed = currentLocales.filter((l) => !newLocales.includes(l));

		// Step 5: Check for orphaned and archived translations in content files
		const contentLocales = await extractContentLocales();
		const archivedLocales = await extractArchivedLocales();
		const orphaned = [...contentLocales].filter((l) => !newLocales.includes(l));

		// Step 5b: Check for restorable locales (archived translations for added locales)
		const restorable = added.filter((l) => archivedLocales.has(l));
		const newWithoutArchive = added.filter((l) => !archivedLocales.has(l));

		// Step 6: Show unmapped languages warning
		if (unmapped.length > 0) {
			log(
				`  ⚠ Unmapped languages: ${unmapped.join(", ")}. Not supported by Intlayer.`,
				"yellow"
			);
		}

		// Step 7: Check mode
		if (isCheck) {
			const isUpToDate = await checkConfigUpToDate(newConfig);

			if (orphaned.length > 0) {
				log(`  ✗ Orphaned translations found: ${orphaned.join(", ")}`, "red");
				log(`\n  Run: bun i18n:archive ${orphaned.join(" ")}`, "cyan");
				process.exit(1);
			}

			if (isUpToDate) {
				if (!isQuiet) {
					log("  ✓ intlayer.config.ts is up to date", "green");
				}
				return;
			}

			log(
				"  ✗ intlayer.config.ts is out of sync. Run `bun sync` to update.",
				"red"
			);
			process.exit(1);
		}

		// Step 8: Write the config
		await writeFile(INTLAYER_CONFIG_FILE, newConfig);

		// Step 9: Output results
		const result: SyncResult = {
			languages,
			newLocales,
			added,
			removed,
			restorable,
			newWithoutArchive,
			orphaned,
		};

		if (isQuiet) {
			outputQuiet(result);
		} else {
			outputVerbose(result);
		}
	} catch (error) {
		log(`\n❌ Error: ${error}`, "red");
		process.exit(1);
	}
}

main();
