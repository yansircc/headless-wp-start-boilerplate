#!/usr/bin/env bun

/**
 * Sync Content Locales Script
 *
 * Ensures all content files have entries for all configured locales.
 * Missing locales are automatically added with English (default) values.
 *
 * This maintains SSOT: WordPress Polylang → intlayer.config.ts → content files
 */

import { readFile, writeFile } from "node:fs/promises";
import { Glob } from "bun";

const CONTENT_DIR = "src/content";
const GRAPHQL_FILE = "src/graphql/_generated/graphql.ts";

// Colors for terminal output
const c = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
};

function log(msg: string, color: keyof typeof c = "reset") {
	console.log(`${c[color]}${msg}${c.reset}`);
}

/**
 * Extract language codes from GraphQL LanguageCodeEnum
 */
async function getConfiguredLocales(): Promise<string[]> {
	const content = await readFile(GRAPHQL_FILE, "utf-8");
	const enumMatch = content.match(/export enum LanguageCodeEnum \{([^}]+)\}/);
	if (!enumMatch) {
		throw new Error("Could not find LanguageCodeEnum");
	}

	const languages = [...enumMatch[1].matchAll(/(\w+)\s*=/g)].map((m) =>
		m[1].toLowerCase()
	);
	return languages;
}

/**
 * Process a content file and add missing locales
 */
async function processContentFile(
	filePath: string,
	configuredLocales: string[]
): Promise<{ updated: boolean; addedLocales: string[] }> {
	let content = await readFile(filePath, "utf-8");
	const addedLocales = new Set<string>();

	// Find all t({...}) calls - handle multiline by matching balanced braces
	// Pattern: t({ ... }) where ... can contain nested objects
	const tCallRegex = /t\(\{([\s\S]*?)\}\)/g;

	content = content.replace(tCallRegex, (match, tContent: string) => {
		// Skip if this contains nested t() calls (nested objects)
		if (tContent.includes("t({")) {
			return match;
		}

		// Find which locales are present in this t() call
		const presentLocales = new Set<string>();
		const localePattern = /\b([a-z]{2}):\s*["'`]/g;
		let localeMatch;
		while ((localeMatch = localePattern.exec(tContent)) !== null) {
			presentLocales.add(localeMatch[1]);
		}

		// Find missing locales (only from configured locales)
		const missing = configuredLocales.filter((l) => !presentLocales.has(l));

		if (missing.length === 0) {
			return match;
		}

		// Find the English value to use as placeholder
		const enMatch = tContent.match(/en:\s*["'`]([^"'`]+)["'`]/);
		if (!enMatch) {
			return match; // Can't find English value, skip
		}
		const enValue = enMatch[1];

		// Add missing locales
		for (const locale of missing) {
			addedLocales.add(locale);
		}

		// Find the last locale entry and add after it
		const lines = tContent.split("\n");
		const newLines: string[] = [];
		let lastLocaleLineIndex = -1;

		for (let i = 0; i < lines.length; i++) {
			if (/^\s*[a-z]{2}:\s*["'`]/.test(lines[i])) {
				lastLocaleLineIndex = i;
			}
			newLines.push(lines[i]);
		}

		if (lastLocaleLineIndex === -1) {
			return match; // No locale lines found
		}

		// Get indentation from the last locale line
		const indentMatch = lines[lastLocaleLineIndex].match(/^(\s*)/);
		const indent = indentMatch ? indentMatch[1] : "\t\t\t\t";

		// Ensure the last locale line has a trailing comma
		if (!newLines[lastLocaleLineIndex].trim().endsWith(",")) {
			newLines[lastLocaleLineIndex] = newLines[lastLocaleLineIndex].replace(
				/(\s*)$/,
				",$1"
			);
		}

		// Insert new locales after the last locale line
		const newEntries = missing.map(
			(locale) => `${indent}${locale}: "${enValue}",`
		);
		newLines.splice(lastLocaleLineIndex + 1, 0, ...newEntries);

		return `t({${newLines.join("\n")}})`;
	});

	if (addedLocales.size > 0) {
		await writeFile(filePath, content);
		return { updated: true, addedLocales: [...addedLocales] };
	}

	return { updated: false, addedLocales: [] };
}

async function main() {
	log(`\n${c.cyan}🌐 Syncing content locales...${c.reset}`);

	try {
		// Get configured locales from GraphQL
		const configuredLocales = await getConfiguredLocales();
		log(`  Configured locales: ${configuredLocales.join(", ")}`, "dim");

		// Find all content files
		const glob = new Glob("**/*.content.ts");
		const contentFiles: string[] = [];
		for await (const file of glob.scan({ cwd: CONTENT_DIR })) {
			contentFiles.push(`${CONTENT_DIR}/${file}`);
		}

		if (contentFiles.length === 0) {
			log("  No content files found", "yellow");
			return;
		}

		let totalUpdated = 0;
		const allAddedLocales = new Set<string>();

		for (const file of contentFiles) {
			const result = await processContentFile(file, configuredLocales);
			if (result.updated) {
				totalUpdated++;
				for (const locale of result.addedLocales) {
					allAddedLocales.add(locale);
				}
				log(`  ✓ Updated ${file}`, "green");
			}
		}

		if (totalUpdated === 0) {
			log("  ✓ All content files up to date", "green");
		} else {
			log(
				`  Added locales: ${[...allAddedLocales].join(", ")} (using English as placeholder)`,
				"yellow"
			);
		}
	} catch (error) {
		log(`\n❌ Error: ${error}`, "yellow");
		process.exit(1);
	}
}

main();
