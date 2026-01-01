/**
 * Intlayer Configuration
 *
 * AUTO-GENERATED from WordPress Polylang via GraphQL schema.
 * DO NOT EDIT MANUALLY - run `bun sync` to update.
 *
 * SSOT: WordPress Polylang → GraphQL LanguageCodeEnum → This file
 */

import { type IntlayerConfig, Locales } from "intlayer";

const config: IntlayerConfig = {
	internationalization: {
		locales: [
			Locales.AFRIKAANS,
			Locales.ENGLISH,
			Locales.SPANISH,
			Locales.JAPANESE,
			Locales.PORTUGUESE,
			Locales.CHINESE,
		],
		defaultLocale: Locales.AFRIKAANS,
	},
	content: {
		contentDir: ["./src/content"],
	},
};

export default config;
