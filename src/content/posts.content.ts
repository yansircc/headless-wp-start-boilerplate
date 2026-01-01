import { type Dictionary, t } from "intlayer";

const postsContent = {
	key: "posts",
	content: {
		title: t({
			en: "Articles",
			zh: "文章",
			ja: "記事",
			es: "Artículos",
			pt: "Artigos",
			af: "Artikels",
		}),
		subtitle: t({
			en: "Latest news and deep insights",
			zh: "最新新闻和深度见解",
			ja: "最新ニュースと深い洞察",
			es: "Últimas noticias y perspectivas profundas",
			pt: "Últimas notícias e perspectivas profundas",
			af: "Jongste nuus en diep insigte",
		}),
		badge: t({
			en: "Insights",
			zh: "洞察",
			ja: "インサイト",
			es: "Perspectivas",
			pt: "Perspectivas",
			af: "Insigte",
		}),
		pageSubtitle: t({
			en: "Discover ideas and insights, explore our latest published articles.",
			zh: "发现想法和见解，探索我们最新发布的文章。",
			ja: "アイデアと洞察を発見し、最新の公開記事をご覧ください。",
			es: "Descubre ideas y perspectivas, explora nuestros últimos artículos publicados.",
			pt: "Descubra ideias e perspectivas, explore nossos últimos artigos publicados.",
			af: "Ontdek idees en insigte, verken ons nuutste gepubliseerde artikels.",
		}),
		empty: t({
			en: "No articles found",
			zh: "未找到文章",
			ja: "記事が見つかりません",
			es: "No se encontraron artículos",
			pt: "Nenhum artigo encontrado",
			af: "Geen artikels gevind nie",
		}),
	},
} satisfies Dictionary;

export default postsContent;
