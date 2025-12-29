/**
 * Font Validation Check
 *
 * Validates that:
 * 1. All configured fonts exist in public/fonts/
 * 2. Generated fonts.css exists and matches configuration
 * 3. Environment variable SKIP_FONTS_CHECK=1 can skip this check
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fontConfig, getFontFilename } from "../../src/lib/fonts/config";
import { type CheckResult, printCheck, printSkipped } from "./types";

const ROOT_DIR = join(import.meta.dir, "../..");

/**
 * Check if all font files exist
 */
function checkFontFilesExist(): {
	passed: boolean;
	missing: string[];
} {
	const missing: string[] = [];

	for (const font of fontConfig.fonts) {
		const filename = getFontFilename(font);
		const fontPath = join(ROOT_DIR, fontConfig.outputDir, filename);

		if (!existsSync(fontPath)) {
			missing.push(`${fontConfig.outputDir}/${filename}`);
		}
	}

	return {
		passed: missing.length === 0,
		missing,
	};
}

/**
 * Check if generated CSS exists
 */
function checkGeneratedCssExists(): {
	passed: boolean;
	path: string;
} {
	const cssPath = join(ROOT_DIR, fontConfig.cssOutput);

	return {
		passed: existsSync(cssPath),
		path: fontConfig.cssOutput,
	};
}

/**
 * Check if generated CSS contains all fonts
 */
function checkGeneratedCssContent(): {
	passed: boolean;
	missing: string[];
} {
	const cssPath = join(ROOT_DIR, fontConfig.cssOutput);
	const missing: string[] = [];

	if (!existsSync(cssPath)) {
		return {
			passed: false,
			missing: fontConfig.fonts.map((f) => f.family),
		};
	}

	const cssContent = readFileSync(cssPath, "utf-8");

	for (const font of fontConfig.fonts) {
		// Check if font-family declaration exists (supports both single and double quotes)
		const hasFontFamily =
			cssContent.includes(`font-family: '${font.family}'`) ||
			cssContent.includes(`font-family: "${font.family}"`);
		if (!hasFontFamily) {
			missing.push(font.family);
		}

		// Check if CSS variable is defined
		if (!cssContent.includes(font.variable)) {
			missing.push(`${font.variable} (CSS variable)`);
		}
	}

	return {
		passed: missing.length === 0,
		missing,
	};
}

/**
 * Run all font validation checks
 */
export function runFontsValidationCheck(): CheckResult {
	// Check if fonts validation is skipped
	if (process.env.SKIP_FONTS_CHECK === "1") {
		printSkipped("Font files validation", "SKIP_FONTS_CHECK=1");
		return { passed: true, errors: [] };
	}

	const errors: string[] = [];
	const warnings: string[] = [];

	// Check 1: Font files exist
	const filesResult = checkFontFilesExist();
	if (!filesResult.passed) {
		errors.push(
			"Missing font files:",
			...filesResult.missing.map((f) => `  • ${f}`)
		);
	}

	// Check 2: Generated CSS exists
	const cssExistsResult = checkGeneratedCssExists();
	if (!cssExistsResult.passed) {
		errors.push(`Missing generated CSS: ${cssExistsResult.path}`);
	}

	// Check 3: Generated CSS content is valid
	if (cssExistsResult.passed) {
		const cssContentResult = checkGeneratedCssContent();
		if (!cssContentResult.passed) {
			errors.push(
				"Missing in generated CSS:",
				...cssContentResult.missing.map((f) => `  • ${f}`)
			);
		}
	}

	const passed = errors.length === 0;
	printCheck("Font files validation", passed);

	if (!passed) {
		errors.push("Fix: Run `bun fonts:sync`");
	}

	return { passed, errors, warnings };
}
