import { type IntlayerConfig, Locales } from "intlayer";

const config: IntlayerConfig = {
	internationalization: {
		locales: [
			Locales.ENGLISH, // 默认语言
			Locales.CHINESE,
			Locales.JAPANESE,
			Locales.KOREAN,
			Locales.FRENCH,
			Locales.GERMAN,
			Locales.SPANISH,
			// 可按需添加更多语言
		],
		defaultLocale: Locales.ENGLISH,
	},
	content: {
		// 翻译内容目录
		contentDir: ["./src/content"],
	},
};

export default config;
