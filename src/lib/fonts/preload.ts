/**
 * Font Preload Link Generator
 *
 * Generates <link rel="preload"> objects for fonts that have preload: true.
 * Used in __root.tsx to add preload hints to the document head.
 */

import { fontConfig, getFontUrl } from "./config";

export type PreloadLink = {
	rel: "preload";
	href: string;
	as: "font";
	type: "font/woff2";
	crossOrigin: "anonymous";
};

/**
 * Get preload links for all fonts that have preload: true
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * import { getFontPreloadLinks } from "@/lib/fonts";
 *
 * head: () => ({
 *   links: [
 *     ...getFontPreloadLinks(),
 *     { rel: "stylesheet", href: appCss },
 *   ],
 * })
 * ```
 */
export function getFontPreloadLinks(): PreloadLink[] {
	return fontConfig.fonts
		.filter((font) => font.preload)
		.map((font) => ({
			rel: "preload" as const,
			href: getFontUrl(font),
			as: "font" as const,
			type: "font/woff2" as const,
			crossOrigin: "anonymous" as const,
		}));
}
