/**
 * Fonts Module
 *
 * Centralized font management with SSOT configuration.
 *
 * @example
 * ```tsx
 * // In __root.tsx - add preload links
 * import { getFontPreloadLinks } from "@/lib/fonts";
 *
 * // In styles.css - import generated CSS
 * // @import "../lib/fonts/_generated/fonts.css";
 *
 * // To sync fonts from Google Fonts
 * // bun fonts:sync
 * ```
 */

// Configuration
export {
	buildFontFamily,
	type FontConfig,
	type FontDefinition,
	fontConfig,
	getFontFilename,
	getFontUrl,
} from "./config";

// Preload links
export { getFontPreloadLinks, type PreloadLink } from "./preload";
