/**
 * Language Utilities - Derived from WordPress Polylang (SSOT)
 *
 * This module provides language conversion functions that are automatically
 * synchronized with WordPress Polylang configuration via GraphQL schema.
 *
 * SSOT Chain:
 *   WordPress Polylang → GraphQL Schema → LanguageCodeEnum → This module
 *
 * DO NOT hardcode language mappings elsewhere. Always import from this module.
 */

import {
	LanguageCodeEnum,
	LanguageCodeFilterEnum,
} from "@/graphql/_generated/graphql";

/**
 * Supported locales derived from GraphQL LanguageCodeEnum
 * This is automatically in sync with WordPress Polylang
 */
export const supportedLocales = Object.keys(LanguageCodeEnum).map((k) =>
	k.toLowerCase()
) as SupportedLocale[];

/**
 * Type for supported locale strings
 */
export type SupportedLocale = Lowercase<keyof typeof LanguageCodeEnum>;

/**
 * Default locale (English)
 */
export const defaultLocale: SupportedLocale = "en";

/**
 * Check if a locale string is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
	return supportedLocales.includes(locale.toLowerCase() as SupportedLocale);
}

/**
 * Convert frontend locale to GraphQL LanguageCodeFilterEnum
 * Used for list queries (posts, products, etc.)
 *
 * @param locale - Frontend locale string (e.g., "en", "zh", "ja")
 * @returns GraphQL LanguageCodeFilterEnum value
 */
export function toLanguageFilter(locale?: string): LanguageCodeFilterEnum {
	if (!locale) {
		return LanguageCodeFilterEnum.En;
	}

	// Convert "en" → "En" to match enum key format
	const key = capitalize(locale.toLowerCase());

	if (key in LanguageCodeFilterEnum) {
		return LanguageCodeFilterEnum[key as keyof typeof LanguageCodeFilterEnum];
	}

	return LanguageCodeFilterEnum.En;
}

/**
 * Convert frontend locale to GraphQL LanguageCodeEnum
 * Used for translation() queries to get specific language versions
 *
 * @param locale - Frontend locale string (e.g., "en", "zh", "ja")
 * @returns GraphQL LanguageCodeEnum value
 */
export function toLanguageCode(locale?: string): LanguageCodeEnum {
	if (!locale) {
		return LanguageCodeEnum.En;
	}

	// Convert "en" → "En" to match enum key format
	const key = capitalize(locale.toLowerCase());

	if (key in LanguageCodeEnum) {
		return LanguageCodeEnum[key as keyof typeof LanguageCodeEnum];
	}

	return LanguageCodeEnum.En;
}

/**
 * Capitalize first letter: "en" → "En"
 */
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
