import type { SiteConfig } from "./types";

export const seoConfig: SiteConfig = {
	siteName: process.env.SITE_NAME ?? "My Site",
	siteUrl: process.env.SITE_URL ?? "https://example.com",
	defaultDescription: "网站默认描述",
	defaultImage: "/og-default.png",
};
