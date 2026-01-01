import { type Dictionary, t } from "intlayer";

const navigationContent = {
	key: "navigation",
	content: {
		home: t({
			en: "Home",
			zh: "首页",
			ja: "ホーム",
			es: "Inicio",
			pt: "Início",
			af: "Tuis",
		}),
		posts: t({
			en: "Posts",
			zh: "文章",
			ja: "記事",
			es: "Publicaciones",
			pt: "Publicações",
			af: "Artikels",
		}),
		products: t({
			en: "Products",
			zh: "产品",
			ja: "製品",
			es: "Productos",
			pt: "Produtos",
			af: "Produkte",
		}),
		language: t({
			en: "Language",
			zh: "语言",
			ja: "言語",
			es: "Idioma",
			pt: "Idioma",
			af: "Taal",
		}),
	},
} satisfies Dictionary;

export default navigationContent;
