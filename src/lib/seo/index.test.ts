import { describe, expect, it } from "vitest";
import {
	buildSchemaScript,
	buildSeoMeta,
	generateDescription,
	stripHtml,
	truncate,
} from "./index";
import type { PageSeoConfig } from "./types";

describe("stripHtml", () => {
	it("should remove simple HTML tags", () => {
		expect(stripHtml("<p>Hello World</p>")).toBe("Hello World");
	});

	it("should remove multiple tags", () => {
		expect(stripHtml("<div><p>Hello</p><span>World</span></div>")).toBe(
			"HelloWorld"
		);
	});

	it("should handle tags with attributes", () => {
		expect(stripHtml('<a href="https://example.com">Link</a>')).toBe("Link");
	});

	it("should handle self-closing tags", () => {
		expect(stripHtml("Hello<br/>World")).toBe("HelloWorld");
	});

	it("should trim whitespace", () => {
		expect(stripHtml("  <p>Hello</p>  ")).toBe("Hello");
	});

	it("should handle empty string", () => {
		expect(stripHtml("")).toBe("");
	});

	it("should handle string without tags", () => {
		expect(stripHtml("No tags here")).toBe("No tags here");
	});

	it("should handle nested tags", () => {
		expect(stripHtml("<div><p><strong>Bold</strong> text</p></div>")).toBe(
			"Bold text"
		);
	});
});

describe("truncate", () => {
	it("should not truncate short text", () => {
		expect(truncate("Hello", 160)).toBe("Hello");
	});

	it("should truncate long text with ellipsis", () => {
		const longText = "A".repeat(200);
		const result = truncate(longText, 160);
		expect(result.length).toBe(160);
		expect(result.endsWith("...")).toBe(true);
	});

	it("should handle exact length", () => {
		const exactText = "A".repeat(160);
		expect(truncate(exactText, 160)).toBe(exactText);
	});

	it("should use default max of 160", () => {
		const longText = "A".repeat(200);
		const result = truncate(longText);
		expect(result.length).toBe(160);
	});

	it("should handle empty string", () => {
		expect(truncate("")).toBe("");
	});

	it("should handle custom max length", () => {
		const result = truncate("Hello World", 5);
		expect(result).toBe("He...");
		expect(result.length).toBe(5);
	});
});

describe("generateDescription", () => {
	it("should prefer excerpt over content", () => {
		const result = generateDescription(
			"<p>Full content here</p>",
			"<p>Short excerpt</p>"
		);
		expect(result).toBe("Short excerpt");
	});

	it("should use content when excerpt is not provided", () => {
		const result = generateDescription("<p>Content text</p>", null);
		expect(result).toBe("Content text");
	});

	it("should strip HTML from excerpt", () => {
		const result = generateDescription(null, "<strong>Bold excerpt</strong>");
		expect(result).toBe("Bold excerpt");
	});

	it("should strip HTML from content", () => {
		const result = generateDescription("<div><p>Paragraph</p></div>", null);
		expect(result).toBe("Paragraph");
	});

	it("should truncate long content", () => {
		const longContent = `<p>${"A".repeat(200)}</p>`;
		const result = generateDescription(longContent, null);
		expect(result.length).toBe(160);
		expect(result.endsWith("...")).toBe(true);
	});

	it("should return empty string when both are null", () => {
		expect(generateDescription(null, null)).toBe("");
	});

	it("should return empty string when both are undefined", () => {
		expect(generateDescription(undefined, undefined)).toBe("");
	});

	it("should handle empty strings", () => {
		expect(generateDescription("", "")).toBe("");
	});
});

describe("buildSeoMeta", () => {
	const siteUrl = "https://example.com";

	it("should build basic meta tags", () => {
		const config: PageSeoConfig = {
			title: "Test Page",
			description: "Test description",
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({ title: "Test Page" });
		expect(meta).toContainEqual({
			name: "description",
			content: "Test description",
		});
	});

	it("should build Open Graph tags", () => {
		const config: PageSeoConfig = {
			title: "OG Test",
			description: "OG description",
			type: "article",
			canonical: "/test-page",
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({ property: "og:type", content: "article" });
		expect(meta).toContainEqual({ property: "og:title", content: "OG Test" });
		expect(meta).toContainEqual({
			property: "og:description",
			content: "OG description",
		});
		expect(meta).toContainEqual({
			property: "og:url",
			content: "https://example.com/test-page",
		});
	});

	it("should build Twitter card tags", () => {
		const config: PageSeoConfig = {
			title: "Twitter Test",
			description: "Twitter description",
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({ name: "twitter:card", content: "summary" });
		expect(meta).toContainEqual({
			name: "twitter:title",
			content: "Twitter Test",
		});
		expect(meta).toContainEqual({
			name: "twitter:description",
			content: "Twitter description",
		});
	});

	it("should use summary_large_image for Twitter when image present", () => {
		const config: PageSeoConfig = {
			title: "With Image",
			image: "https://example.com/image.jpg",
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({
			name: "twitter:card",
			content: "summary_large_image",
		});
		expect(meta).toContainEqual({
			name: "twitter:image",
			content: "https://example.com/image.jpg",
		});
	});

	it("should build OG image tags with alt", () => {
		const config: PageSeoConfig = {
			title: "Image Test",
			image: "https://example.com/og.jpg",
			imageAlt: "Open Graph image description",
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({
			property: "og:image",
			content: "https://example.com/og.jpg",
		});
		expect(meta).toContainEqual({
			property: "og:image:alt",
			content: "Open Graph image description",
		});
	});

	it("should build robots meta with noindex", () => {
		const config: PageSeoConfig = {
			title: "No Index",
			noindex: true,
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({ name: "robots", content: "noindex" });
	});

	it("should build robots meta with nofollow", () => {
		const config: PageSeoConfig = {
			title: "No Follow",
			nofollow: true,
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({ name: "robots", content: "nofollow" });
	});

	it("should build robots meta with both noindex and nofollow", () => {
		const config: PageSeoConfig = {
			title: "Both",
			noindex: true,
			nofollow: true,
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({
			name: "robots",
			content: "noindex, nofollow",
		});
	});

	it("should build article meta tags", () => {
		const config: PageSeoConfig = {
			title: "Article",
			type: "article",
			publishedTime: "2024-01-01T00:00:00Z",
			modifiedTime: "2024-01-02T00:00:00Z",
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({
			property: "article:published_time",
			content: "2024-01-01T00:00:00Z",
		});
		expect(meta).toContainEqual({
			property: "article:modified_time",
			content: "2024-01-02T00:00:00Z",
		});
	});

	it("should not include article meta for non-article type", () => {
		const config: PageSeoConfig = {
			title: "Product",
			type: "product",
			publishedTime: "2024-01-01T00:00:00Z",
		};

		const meta = buildSeoMeta(config, siteUrl);

		const hasArticleMeta = meta.some(
			(m) => m.property === "article:published_time"
		);
		expect(hasArticleMeta).toBe(false);
	});

	it("should default og:type to website", () => {
		const config: PageSeoConfig = {
			title: "Default Type",
		};

		const meta = buildSeoMeta(config, siteUrl);

		expect(meta).toContainEqual({ property: "og:type", content: "website" });
	});
});

describe("buildSchemaScript", () => {
	const baseConfig = {
		siteName: "Test Site",
		siteUrl: "https://example.com",
	};

	it("should build Article schema", () => {
		const config = {
			...baseConfig,
			title: "Test Article",
			description: "Article description",
			type: "article" as const,
			image: "https://example.com/image.jpg",
			publishedTime: "2024-01-01T00:00:00Z",
			author: "John Doe",
		};

		const result = buildSchemaScript(config);

		expect(result).not.toBeNull();
		expect(result?.type).toBe("application/ld+json");

		const schema = JSON.parse(result?.children);
		expect(schema["@context"]).toBe("https://schema.org");
		expect(schema["@type"]).toBe("Article");
		expect(schema.headline).toBe("Test Article");
		expect(schema.description).toBe("Article description");
		expect(schema.image).toBe("https://example.com/image.jpg");
		expect(schema.datePublished).toBe("2024-01-01T00:00:00Z");
		expect(schema.author["@type"]).toBe("Person");
		expect(schema.author.name).toBe("John Doe");
		expect(schema.publisher.name).toBe("Test Site");
	});

	it("should build Product schema", () => {
		const config = {
			...baseConfig,
			title: "Test Product",
			description: "Product description",
			type: "product" as const,
			image: "https://example.com/product.jpg",
		};

		const result = buildSchemaScript(config);

		expect(result).not.toBeNull();

		const schema = JSON.parse(result?.children);
		expect(schema["@type"]).toBe("Product");
		expect(schema.name).toBe("Test Product");
		expect(schema.description).toBe("Product description");
		expect(schema.image).toBe("https://example.com/product.jpg");
	});

	it("should return null for website type", () => {
		const config = {
			...baseConfig,
			title: "Homepage",
			type: "website" as const,
		};

		const result = buildSchemaScript(config);

		expect(result).toBeNull();
	});

	it("should return null when no type specified", () => {
		const config = {
			...baseConfig,
			title: "No Type",
		};

		const result = buildSchemaScript(config);

		expect(result).toBeNull();
	});

	it("should handle missing optional fields", () => {
		const config = {
			...baseConfig,
			title: "Minimal Article",
			type: "article" as const,
		};

		const result = buildSchemaScript(config);

		expect(result).not.toBeNull();

		const schema = JSON.parse(result?.children);
		expect(schema.headline).toBe("Minimal Article");
		expect(schema.author).toBeUndefined();
		expect(schema.image).toBeUndefined();
	});
});
