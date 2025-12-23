#!/usr/bin/env bun

/**
 * i18n Sync Script
 *
 * Synchronizes language configuration from WordPress Polylang (via GraphQL schema)
 * to intlayer.config.ts, ensuring Single Source of Truth (SSOT).
 *
 * SSOT Chain:
 *   WordPress Polylang → GraphQL Schema → LanguageCodeEnum → intlayer.config.ts
 *
 * Usage: bun scripts/sync-i18n.ts
 */

import { readFile, writeFile } from "node:fs/promises";

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
 * Mapping from GraphQL LanguageCodeEnum keys to Intlayer Locales
 * This is the only place where this mapping needs to be maintained.
 *
 * When WordPress adds a new language:
 * 1. `bun sync` downloads the new schema with updated LanguageCodeEnum
 * 2. This script reads the enum and maps to Intlayer Locales
 * 3. If the language isn't in this map, a warning is shown
 */
const LANGUAGE_TO_INTLAYER: Record<string, string> = {
	En: "Locales.ENGLISH",
	Ja: "Locales.JAPANESE",
	Zh: "Locales.CHINESE",
	Ko: "Locales.KOREAN",
	Fr: "Locales.FRENCH",
	De: "Locales.GERMAN",
	Es: "Locales.SPANISH",
	Pt: "Locales.PORTUGUESE",
	It: "Locales.ITALIAN",
	Ru: "Locales.RUSSIAN",
	Ar: "Locales.ARABIC",
	Hi: "Locales.HINDI",
	Th: "Locales.THAI",
	Vi: "Locales.VIETNAMESE",
	Id: "Locales.INDONESIAN",
	Ms: "Locales.MALAY",
	Nl: "Locales.DUTCH",
	Pl: "Locales.POLISH",
	Tr: "Locales.TURKISH",
	Uk: "Locales.UKRAINIAN",
	Cs: "Locales.CZECH",
	El: "Locales.GREEK",
	He: "Locales.HEBREW",
	Hu: "Locales.HUNGARIAN",
	Ro: "Locales.ROMANIAN",
	Sv: "Locales.SWEDISH",
	Da: "Locales.DANISH",
	Fi: "Locales.FINNISH",
	No: "Locales.NORWEGIAN",
	Nb: "Locales.NORWEGIAN",
};

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
		const intlayerLocale = LANGUAGE_TO_INTLAYER[lang];
		if (intlayerLocale) {
			intlayerLocales.push(intlayerLocale);
		} else {
			unmapped.push(lang);
		}
	}

	if (unmapped.length > 0) {
		log(
			`  ⚠ Unmapped languages: ${unmapped.join(", ")}. Add them to LANGUAGE_TO_INTLAYER in scripts/sync-i18n.ts`,
			"yellow"
		);
	}

	// Default locale is the first one (usually English)
	const defaultLocale = intlayerLocales[0] || "Locales.ENGLISH";

	// Format to match biome output (single line for short arrays)
	const localesStr = intlayerLocales.join(", ");

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
		locales: [${localesStr}],
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

	log(`\n${c.cyan}🌐 Syncing i18n configuration...${c.reset}`);

	try {
		// Step 1: Extract languages from GraphQL schema
		log("  Reading LanguageCodeEnum from GraphQL schema...", "dim");
		const languages = await extractLanguagesFromSchema();
		log(`  ✓ Found languages: ${languages.join(", ")}`, "green");

		// Step 2: Generate new config
		const newConfig = generateIntlayerConfig(languages);

		// Step 3: Check or write
		if (isCheck) {
			const isUpToDate = await checkConfigUpToDate(newConfig);
			if (isUpToDate) {
				log("  ✓ intlayer.config.ts is up to date", "green");
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
		log(`  ✓ Updated ${INTLAYER_CONFIG_FILE}`, "green");

		log(`\n${c.green}✅ i18n sync complete!${c.reset}\n`);
	} catch (error) {
		log(`\n❌ Error: ${error}`, "red");
		process.exit(1);
	}
}

main();
