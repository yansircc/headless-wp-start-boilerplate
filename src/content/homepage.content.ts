import { type Dictionary, t } from "intlayer";

const homepageContent = {
	key: "homepage",
	content: {
		badge: t({
			en: "New Experience",
			zh: "全新体验",
			ja: "新体験",
			es: "Nueva experiencia",
			pt: "Nova experiência",
			af: "Nuwe Ervaring",
		}),
		title: t({
			en: "Modern Headless CMS.",
			zh: "现代无头 CMS。",
			ja: "モダンヘッドレスCMS。",
			es: "CMS Headless Moderno.",
			pt: "CMS Headless Moderno.",
			af: "Moderne Koplose CMS.",
		}),
		subtitle: t({
			en: "Explore the latest insights and products delivered through a cutting-edge headless WordPress architecture.",
			zh: "探索通过前沿无头 WordPress 架构提供的最新见解和产品。",
			ja: "最先端のヘッドレスWordPressアーキテクチャで提供される最新の情報と製品をご覧ください。",
			es: "Explore las últimas perspectivas y productos entregados a través de una arquitectura WordPress headless de vanguardia.",
			pt: "Explore as últimas perspectivas e produtos entregues através de uma arquitetura WordPress headless de ponta.",
			af: "Verken die nuutste insigte en produkte wat deur 'n voorpunt-koplose WordPress-argitektuur gelewer word.",
		}),
	},
} satisfies Dictionary;

export default homepageContent;
