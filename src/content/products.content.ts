import { type Dictionary, t } from "intlayer";

const productsContent = {
	key: "products",
	content: {
		title: t({
			en: "Products",
			zh: "产品",
			ja: "製品",
			es: "Productos",
			pt: "Produtos",
			af: "Produkte",
		}),
		subtitle: t({
			en: "Curated selection of quality items",
			zh: "精选优质商品",
			ja: "厳選された高品質アイテム",
			es: "Selección curada de artículos de calidad",
			pt: "Seleção curada de itens de qualidade",
			af: "Gekeurde seleksie van gehalte-items",
		}),
		badge: t({
			en: "Store",
			zh: "商店",
			ja: "ストア",
			es: "Tienda",
			pt: "Loja",
			af: "Winkel",
		}),
		pageSubtitle: t({
			en: "Curated selection of high-quality items to meet your diverse needs.",
			zh: "精选优质商品，满足您的多样化需求。",
			ja: "お客様の多様なニーズに応える厳選された高品質アイテム。",
			es: "Selección curada de artículos de alta calidad para satisfacer sus diversas necesidades.",
			pt: "Seleção curada de itens de alta qualidade para atender às suas diversas necessidades.",
			af: "Gekeurde seleksie van hoëgehalte-items om aan u diverse behoeftes te voldoen.",
		}),
		empty: t({
			en: "No products found",
			zh: "未找到产品",
			ja: "製品が見つかりません",
			es: "No se encontraron productos",
			pt: "Nenhum produto encontrado",
			af: "Geen produkte gevind nie",
		}),
	},
} satisfies Dictionary;

export default productsContent;
