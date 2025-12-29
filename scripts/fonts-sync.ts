/**
 * Font Sync Script
 *
 * Downloads fonts from Google Fonts and generates CSS.
 *
 * Run: bun fonts:sync
 *
 * This script:
 * 1. Reads font configuration from src/lib/fonts/config.ts
 * 2. Downloads variable fonts from Google Fonts API
 * 3. Saves them to public/fonts/
 * 4. Generates src/lib/fonts/_generated/fonts.css
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
	buildFontFamily,
	type FontDefinition,
	fontConfig,
	getFontFilename,
} from "../src/lib/fonts/config";

const ROOT_DIR = join(import.meta.dir, "..");

// Google Fonts API URL for variable fonts
const GOOGLE_FONTS_API = "https://fonts.googleapis.com/css2";

// User agent to request woff2 format
const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Regex patterns (top-level for performance)
const FONT_URL_REGEX = /src:\s*url\(([^)]+)\)/;
const QUOTE_REGEX = /['"]/g;

/**
 * Build Google Fonts URL for a font
 */
function buildGoogleFontsUrl(font: FontDefinition): string {
	const weights = font.isVariable
		? `wght@${Math.min(...font.weights)}..${Math.max(...font.weights)}`
		: font.weights.join(";");
	return `${GOOGLE_FONTS_API}?family=${encodeURIComponent(font.family)}:${weights}&display=${font.display}`;
}

/**
 * Extract font file URL from Google Fonts CSS response
 */
function extractFontUrl(css: string): string | null {
	const match = css.match(FONT_URL_REGEX);
	if (match?.[1]) {
		return match[1].replace(QUOTE_REGEX, "");
	}
	return null;
}

/**
 * Download a font file
 */
async function downloadFont(url: string, outputPath: string): Promise<boolean> {
	try {
		console.log(`  Downloading: ${url.substring(0, 60)}...`);
		const response = await fetch(url);
		if (!response.ok) {
			console.error(`  Failed to download: ${response.status}`);
			return false;
		}
		const buffer = await response.arrayBuffer();
		writeFileSync(outputPath, Buffer.from(buffer));
		console.log(`  Saved: ${outputPath}`);
		return true;
	} catch (error) {
		console.error("  Download error:", error);
		return false;
	}
}

/**
 * Fetch Google Fonts CSS and extract font URL
 */
async function fetchGoogleFontsCss(font: FontDefinition): Promise<string> {
	const url = buildGoogleFontsUrl(font);
	console.log(`  Fetching CSS: ${font.family}`);

	const response = await fetch(url, {
		headers: {
			"User-Agent": USER_AGENT, // Request woff2 format
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch Google Fonts CSS: ${response.status} ${response.statusText}`
		);
	}

	return response.text();
}

/**
 * Generate @font-face CSS for a font
 */
function generateFontFace(font: FontDefinition): string {
	const filename = getFontFilename(font);
	const fontFamily = buildFontFamily(font);

	if (font.isVariable) {
		return `@font-face {
  font-family: '${font.family}';
  font-style: normal;
  font-weight: ${Math.min(...font.weights)} ${Math.max(...font.weights)};
  font-display: ${font.display};
  src: url('/fonts/${filename}') format('woff2-variations');
}

:root {
  ${font.variable}: ${fontFamily};
}`;
	}

	// Non-variable fonts: generate one @font-face per weight
	return font.weights
		.map(
			(weight) => `@font-face {
  font-family: '${font.family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: ${font.display};
  src: url('/fonts/${font.family}-${weight}.woff2') format('woff2');
}`
		)
		.join("\n\n");
}

/**
 * Main sync function
 */
async function syncFonts(): Promise<void> {
	console.log("\n\x1b[1mSyncing fonts...\x1b[0m\n");

	const outputDir = join(ROOT_DIR, fontConfig.outputDir);
	const cssOutputPath = join(ROOT_DIR, fontConfig.cssOutput);
	const cssOutputDir = dirname(cssOutputPath);

	// Ensure output directories exist
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
		console.log(`Created directory: ${fontConfig.outputDir}`);
	}
	if (!existsSync(cssOutputDir)) {
		mkdirSync(cssOutputDir, { recursive: true });
		console.log(`Created directory: ${dirname(fontConfig.cssOutput)}`);
	}

	const cssBlocks: string[] = [
		"/**",
		" * Auto-generated font CSS",
		" * DO NOT EDIT - Run `bun fonts:sync` to regenerate",
		" */",
		"",
	];

	let hasErrors = false;

	for (const font of fontConfig.fonts) {
		console.log(`\nProcessing: ${font.family}`);

		try {
			// Fetch Google Fonts CSS
			const googleCss = await fetchGoogleFontsCss(font);

			// Extract font URL
			const fontUrl = extractFontUrl(googleCss);
			if (!fontUrl) {
				console.error(`  Could not extract font URL for ${font.family}`);
				hasErrors = true;
				continue;
			}

			// Download font file
			const filename = getFontFilename(font);
			const fontPath = join(outputDir, filename);

			const downloaded = await downloadFont(fontUrl, fontPath);
			if (!downloaded) {
				hasErrors = true;
				continue;
			}

			// Generate @font-face CSS
			const fontFaceCss = generateFontFace(font);
			cssBlocks.push(fontFaceCss);
			cssBlocks.push("");

			console.log(`  \x1b[32m✓\x1b[0m ${font.family} synced`);
		} catch (error) {
			console.error(`  \x1b[31m✗\x1b[0m Error syncing ${font.family}:`, error);
			hasErrors = true;
		}
	}

	// Write CSS file
	writeFileSync(cssOutputPath, cssBlocks.join("\n"));
	console.log(`\nGenerated: ${fontConfig.cssOutput}`);

	if (hasErrors) {
		console.log("\n\x1b[33m⚠ Some fonts failed to sync\x1b[0m\n");
		process.exit(1);
	}

	console.log("\n\x1b[32m✓ All fonts synced successfully\x1b[0m\n");
}

// Run
syncFonts().catch((error) => {
	console.error("Font sync error:", error);
	process.exit(1);
});
