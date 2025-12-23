import { describe, expect, it } from "vitest";
import {
	buildTitle,
	getDynamicRouteSeo,
	getRouteSeo,
	seoConfig,
} from "./seo.config";

describe("buildTitle", () => {
	it("should build homepage title with tagline", () => {
		const result = buildTitle("", true);
		expect(result).toContain(seoConfig.site.name);
		expect(result).toContain(seoConfig.site.tagline);
		expect(result).toContain(seoConfig.site.separator);
	});

	it("should build page title with site name", () => {
		const result = buildTitle("My Page", false);
		expect(result).toBe(
			`My Page ${seoConfig.site.separator} ${seoConfig.site.name}`
		);
	});

	it("should return site name when page title is empty", () => {
		const result = buildTitle("", false);
		expect(result).toBe(seoConfig.site.name);
	});

	it("should handle special characters in title", () => {
		const result = buildTitle("Test & Demo", false);
		expect(result).toContain("Test & Demo");
	});
});

describe("getRouteSeo", () => {
	it("should return homepage SEO config", () => {
		const result = getRouteSeo("/");
		expect(result.title).toContain(seoConfig.site.name);
		expect(result.description).toBe(seoConfig.routes["/"].description);
	});

	it("should return posts page SEO config", () => {
		const result = getRouteSeo("/posts");
		expect(result.title).toContain("Articles");
		expect(result.description).toBe(seoConfig.routes["/posts"].description);
	});

	it("should return products page SEO config", () => {
		const result = getRouteSeo("/products");
		expect(result.title).toContain("Products");
		expect(result.description).toBe(seoConfig.routes["/products"].description);
	});

	it("should return defaults for unknown route", () => {
		const result = getRouteSeo("/unknown-route");
		expect(result.title).toBe(seoConfig.site.name);
		expect(result.description).toBe(seoConfig.defaults.description);
	});
});

describe("getDynamicRouteSeo", () => {
	it("should return post SEO with CMS title", () => {
		const result = getDynamicRouteSeo("/posts/$postId", "My Blog Post");
		expect(result.title).toContain("My Blog Post");
		expect(result.type).toBe("article");
	});

	it("should return post SEO with fallback title", () => {
		const result = getDynamicRouteSeo("/posts/$postId", null);
		expect(result.title).toContain("Article");
		expect(result.type).toBe("article");
	});

	it("should return product SEO with CMS title", () => {
		const result = getDynamicRouteSeo("/products/$productId", "Cool Product");
		expect(result.title).toContain("Cool Product");
		expect(result.type).toBe("product");
	});

	it("should return product SEO with fallback title", () => {
		const result = getDynamicRouteSeo("/products/$productId", null);
		expect(result.title).toContain("Product");
		expect(result.type).toBe("product");
	});

	it("should return defaults for unknown dynamic route", () => {
		const result = getDynamicRouteSeo("/unknown/$id", "Test");
		expect(result.title).toContain("Test");
		expect(result.type).toBe("article"); // Default type
	});

	it("should handle undefined CMS title", () => {
		const result = getDynamicRouteSeo("/posts/$postId", undefined);
		expect(result.title).toContain("Article");
	});
});

describe("seoConfig structure", () => {
	it("should have valid site configuration", () => {
		expect(seoConfig.site).toBeDefined();
		expect(typeof seoConfig.site.name).toBe("string");
		expect(typeof seoConfig.site.tagline).toBe("string");
		expect(typeof seoConfig.site.separator).toBe("string");
		expect(typeof seoConfig.site.language).toBe("string");
	});

	it("should have valid defaults configuration", () => {
		expect(seoConfig.defaults).toBeDefined();
		expect(typeof seoConfig.defaults.description).toBe("string");
		expect(typeof seoConfig.defaults.image).toBe("string");
	});

	it("should have required static routes", () => {
		expect(seoConfig.routes["/"]).toBeDefined();
		expect(seoConfig.routes["/posts"]).toBeDefined();
		expect(seoConfig.routes["/products"]).toBeDefined();
	});

	it("should have required dynamic routes", () => {
		expect(seoConfig.dynamicRoutes["/posts/$postId"]).toBeDefined();
		expect(seoConfig.dynamicRoutes["/products/$productId"]).toBeDefined();
	});

	it("should have valid robots configuration", () => {
		expect(seoConfig.robots.rules).toBeDefined();
		expect(Array.isArray(seoConfig.robots.rules)).toBe(true);
		expect(seoConfig.robots.rules.length).toBeGreaterThan(0);
	});

	it("should have valid sitemap configuration", () => {
		expect(seoConfig.sitemap.changefreq).toBeDefined();
		expect(seoConfig.sitemap.priority).toBeDefined();
		expect(seoConfig.sitemap.priority.homepage).toBeLessThanOrEqual(1);
		expect(seoConfig.sitemap.priority.homepage).toBeGreaterThan(0);
	});
});
