/**
 * Font Configuration - Single Source of Truth (SSOT)
 *
 * This file defines all fonts used in the project.
 * Run `bun fonts:sync` after making changes to download fonts and generate CSS.
 */

export type FontDefinition = {
	/** Font family name (e.g., "Outfit", "Inter") */
	family: string;
	/** CSS variable name (e.g., "--font-primary") */
	variable: string;
	/** Font weights to include */
	weights: number[];
	/** Font display strategy */
	display: "swap" | "block" | "fallback" | "optional" | "auto";
	/** Whether to preload this font (add <link rel="preload">) */
	preload: boolean;
	/** Whether this is a variable font (single file for all weights) */
	isVariable?: boolean;
	/** Fallback font stack */
	fallback: string[];
};

export type FontConfig = {
	fonts: FontDefinition[];
	/** Directory for downloaded font files (relative to project root) */
	outputDir: string;
	/** Output path for generated CSS (relative to project root) */
	cssOutput: string;
};

export const fontConfig: FontConfig = {
	fonts: [
		{
			family: "Outfit",
			variable: "--font-primary",
			weights: [400, 500, 600, 700],
			display: "swap",
			preload: true,
			isVariable: true,
			fallback: [
				"-apple-system",
				"BlinkMacSystemFont",
				'"Segoe UI"',
				"Roboto",
				"sans-serif",
			],
		},
		{
			family: "Inter",
			variable: "--font-secondary",
			weights: [400, 500, 600, 700],
			display: "swap",
			preload: true,
			isVariable: true,
			fallback: [
				"-apple-system",
				"BlinkMacSystemFont",
				'"Segoe UI"',
				"Roboto",
				"sans-serif",
			],
		},
	],
	outputDir: "public/fonts",
	cssOutput: "src/lib/fonts/_generated/fonts.css",
} as const;

/**
 * Get font filename based on configuration
 */
export function getFontFilename(font: FontDefinition): string {
	if (font.isVariable) {
		return `${font.family}-Variable.woff2`;
	}
	// For non-variable fonts, we'd have multiple files per weight
	// This is handled in the sync script
	return `${font.family}.woff2`;
}

/**
 * Get the public URL path for a font file
 */
export function getFontUrl(font: FontDefinition): string {
	return `/fonts/${getFontFilename(font)}`;
}

/**
 * Build the font-family CSS value with fallbacks
 */
export function buildFontFamily(font: FontDefinition): string {
	return [`'${font.family}'`, ...font.fallback].join(", ");
}
