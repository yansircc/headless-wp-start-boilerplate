import { type Dictionary, t } from "intlayer";

const errorsContent = {
	key: "errors",
	content: {
		loadFailed: t({
			en: "Load Failed",
			zh: "加载失败",
			ja: "読み込み失敗",
			es: "Error al cargar",
			pt: "Falha ao carregar",
			af: "Laai Misluk",
		}),
		tryAgain: t({
			en: "Please refresh the page to try again",
			zh: "请刷新页面重试",
			ja: "ページを更新して再試行してください",
			es: "Por favor actualice la página para intentar de nuevo",
			pt: "Por favor atualize a página para tentar novamente",
			af: "Herlaai asseblief die bladsy om weer te probeer",
		}),
		notFound: {
			title: t({
				en: "Page not found",
				zh: "页面未找到",
				ja: "ページが見つかりません",
				es: "Página no encontrada",
				pt: "Página não encontrada",
				af: "Bladsy nie gevind nie",
			}),
			message: t({
				en: "The page you're looking for doesn't exist or has been moved.",
				zh: "您正在查找的页面不存在或已被移动。",
				ja: "お探しのページは存在しないか、移動されました。",
				es: "La página que busca no existe o ha sido movida.",
				pt: "A página que você procura não existe ou foi movida.",
				af: "Die bladsy waarna u soek, bestaan nie of is verskuif.",
			}),
			backToHome: t({
				en: "Back to Home",
				zh: "返回首页",
				ja: "ホームに戻る",
				es: "Volver al inicio",
				pt: "Voltar ao início",
				af: "Terug na Tuis",
			}),
			browseArticles: t({
				en: "Browse Articles",
				zh: "浏览文章",
				ja: "記事を見る",
				es: "Explorar artículos",
				pt: "Explorar artigos",
				af: "Blaai deur Artikels",
			}),
		},
	},
} satisfies Dictionary;

export default errorsContent;
