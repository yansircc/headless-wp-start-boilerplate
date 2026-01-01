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

/**
 * Build a reverse lookup map from Intlayer Locales
 * Locales = { ENGLISH: "en", JAPANESE: "ja", ... }
 * We need: { "en": "ENGLISH", "ja": "JAPANESE", ... }
 */
const CODE_TO_LOCALE_KEY: Record<string, string> = {};
for (const [key, value] of Object.entries(Locales)) {
	if (typeof value === "string") {
		CODE_TO_LOCALE_KEY[value.toLowerCase()] = key;
	}
}

/**
 * Get Intlayer locale string from language code (dynamic lookup)
 * @param langCode - GraphQL language code like "En", "Ja", "Zh"
 * @returns Intlayer locale string like "Locales.ENGLISH" or undefined
 */
function getIntlayerLocale(langCode: string): string | undefined {
	const code = langCode.toLowerCase();
	const localeKey = CODE_TO_LOCALE_KEY[code];
	return localeKey ? `Locales.${localeKey}` : undefined;
}

const GRAPHQL_FILE = "src/graphql/_generated/graphql.ts";
const INTLAYER_CONFIG_FILE = "intlayer.config.ts";

// Regex patterns (at top level for performance)
const LANGUAGE_ENUM_PATTERN = /export enum LanguageCodeEnum \{([^}]+)\}/;
const LANGUAGE_KEY_PATTERN = /(\w+)\s*=/g;

/**
 * Extract LanguageCodeEnum values from generated GraphQL types
 */
async function extractLanguagesFromSchema(): Promise<string[]> {
	const content = await readFile(GRAPHQL_FILE, "utf-8");

	// Match: export enum LanguageCodeEnum { En = 'EN', Ja = 'JA', Zh = 'ZH' }
	const enumMatch = content.match(LANGUAGE_ENUM_PATTERN);

	if (!enumMatch) {
		throw new Error("Could not find LanguageCodeEnum in GraphQL types");
	}

	const enumBody = enumMatch[1];
	// Extract keys: En, Ja, Zh
	const languages = [...enumBody.matchAll(LANGUAGE_KEY_PATTERN)].map(
		(match) => match[1]
	);

	return languages;
}

/**
 * Generate intlayer.config.ts content
 */
function generateIntlayerConfig(languages: string[]): string {
	const intlayerLocales: string[] = [];
	const unmapped: string[] = [];

	for (const lang of languages) {
		const intlayerLocale = getIntlayerLocale(lang);
		if (intlayerLocale) {
			intlayerLocales.push(intlayerLocale);
		} else {
			unmapped.push(lang);
		}
	}

	if (unmapped.length > 0) {
		log(
			`  ⚠ Unmapped languages: ${unmapped.join(", ")}. These are not supported by Intlayer.`,
			"yellow"
		);
	}

	// Default locale is the first one (usually English)
	const defaultLocale = intlayerLocales[0] || "Locales.ENGLISH";

	// Format to match biome output (multi-line for arrays)
	const localesFormatted = intlayerLocales
		.map((locale) => `\t\t\t${locale},`)
		.join("\n");

	return `/**
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
}

/**
 * Check if the current config matches what would be generated
 */
async function checkConfigUpToDate(newContent: string): Promise<boolean> {
	try {
		const currentContent = await readFile(INTLAYER_CONFIG_FILE, "utf-8");
		// Normalize whitespace for comparison
		const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
		return normalize(currentContent) === normalize(newContent);
	} catch {
		return false;
	}
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
		if (!isQuiet) {
			log(`  ✓ Found languages: ${languages.join(", ")}`, "green");
		}

		// Step 2: Generate new config
		const newConfig = generateIntlayerConfig(languages);

		// Step 3: Check or write
		if (isCheck) {
			const isUpToDate = await checkConfigUpToDate(newConfig);
			if (isUpToDate) {
				if (isQuiet) {
					log("  ✓ intlayer.config.ts up to date", "green");
				} else {
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

		// Write the config
		await writeFile(INTLAYER_CONFIG_FILE, newConfig);

		if (isQuiet) {
			// One-line summary for integrated mode
			log(`  ✓ intlayer.config.ts (${languages.length} locales)`, "green");
		} else {
			log(`  ✓ Updated ${INTLAYER_CONFIG_FILE}`, "green");
			log(`\n${c.green}✅ i18n sync complete!${c.reset}\n`);
		}
	} catch (error) {
		log(`\n❌ Error: ${error}`, "red");
		process.exit(1);
	}
}

main();
