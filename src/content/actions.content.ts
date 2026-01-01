import { type Dictionary, t } from "intlayer";

const actionsContent = {
	key: "actions",
	content: {
		viewAll: t({
			en: "View All",
			zh: "查看全部",
			ja: "すべて見る",
			es: "Ver todo",
			pt: "Ver tudo",
			af: "Sien Alles",
		}),
		readMore: t({
			en: "Read More",
			zh: "阅读更多",
			ja: "続きを読む",
			es: "Leer más",
			pt: "Ler mais",
			af: "Lees Meer",
		}),
		readPosts: t({
			en: "Read Posts",
			zh: "阅读文章",
			ja: "記事を読む",
			es: "Leer publicaciones",
			pt: "Ler publicações",
			af: "Lees Artikels",
		}),
		viewProducts: t({
			en: "View Products",
			zh: "查看产品",
			ja: "製品を見る",
			es: "Ver productos",
			pt: "Ver produtos",
			af: "Sien Produkte",
		}),
	},
} satisfies Dictionary;

export default actionsContent;
