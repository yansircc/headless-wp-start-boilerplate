import { describe, expect, it } from "vitest";
import {
	productAcfGroupSchema,
	productAttributeSchema,
	productGalleryImageSchema,
	productSchema,
	productsListSchema,
} from "./schema";

describe("productAttributeSchema", () => {
	it("should validate valid attribute", () => {
		const result = productAttributeSchema.safeParse({
			attributeName: "Color",
			attributeValue: "Red",
		});
		expect(result.success).toBe(true);
	});

	it("should allow null values", () => {
		const result = productAttributeSchema.safeParse({
			attributeName: null,
			attributeValue: null,
		});
		expect(result.success).toBe(true);
	});

	it("should allow missing optional fields", () => {
		const result = productAttributeSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("should reject invalid types", () => {
		const result = productAttributeSchema.safeParse({
			attributeName: 123,
		});
		expect(result.success).toBe(false);
	});
});

describe("productGalleryImageSchema", () => {
	it("should validate valid image", () => {
		const result = productGalleryImageSchema.safeParse({
			id: "image-123",
			sourceUrl: "https://example.com/image.jpg",
			altText: "Product image",
			title: "Image title",
		});
		expect(result.success).toBe(true);
	});

	it("should require id field", () => {
		const result = productGalleryImageSchema.safeParse({
			sourceUrl: "https://example.com/image.jpg",
		});
		expect(result.success).toBe(false);
	});

	it("should allow null optional fields", () => {
		const result = productGalleryImageSchema.safeParse({
			id: "img-1",
			sourceUrl: null,
			altText: null,
			title: null,
		});
		expect(result.success).toBe(true);
	});
});

describe("productAcfGroupSchema", () => {
	it("should validate complete ACF group", () => {
		const result = productAcfGroupSchema.safeParse({
			price: "99.99",
			sku: "SKU-001",
			stock: 10,
			shortDescription: "Short desc",
			isFeatured: true,
			gallery: { nodes: [{ id: "img-1" }] }, // GraphQL returns { nodes: [...] }
			attributes: [{ attributeName: "Size", attributeValue: "Large" }],
		});
		expect(result.success).toBe(true);
	});

	it("should validate empty ACF group", () => {
		const result = productAcfGroupSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("should allow null values for all fields", () => {
		const result = productAcfGroupSchema.safeParse({
			price: null,
			sku: null,
			stock: null,
			shortDescription: null,
			isFeatured: null,
			gallery: null,
			attributes: null,
		});
		expect(result.success).toBe(true);
	});

	it("should validate nested gallery with nodes structure", () => {
		const result = productAcfGroupSchema.safeParse({
			gallery: {
				nodes: [
					{ id: "img-1", sourceUrl: "https://example.com/1.jpg" },
					{ id: "img-2", sourceUrl: "https://example.com/2.jpg" },
				],
			},
		});
		expect(result.success).toBe(true);
	});

	it("should reject invalid stock type", () => {
		const result = productAcfGroupSchema.safeParse({
			stock: "ten", // Should be number
		});
		expect(result.success).toBe(false);
	});

	it("should reject invalid isFeatured type", () => {
		const result = productAcfGroupSchema.safeParse({
			isFeatured: "yes", // Should be boolean
		});
		expect(result.success).toBe(false);
	});
});

describe("productSchema", () => {
	it("should validate complete product", () => {
		const result = productSchema.safeParse({
			id: "product-1",
			databaseId: 123,
			title: "Test Product",
			slug: "test-product",
			content: "<p>Product description</p>",
			date: "2024-01-01T00:00:00Z",
			featuredImage: {
				node: {
					sourceUrl: "https://example.com/image.jpg",
					altText: "Product image",
				},
			},
			productAcfGroup: {
				price: "49.99",
				sku: "TP-001",
			},
		});
		expect(result.success).toBe(true);
	});

	it("should require id field", () => {
		const result = productSchema.safeParse({
			title: "No ID Product",
		});
		expect(result.success).toBe(false);
	});

	it("should allow minimal product", () => {
		const result = productSchema.safeParse({
			id: "minimal-product",
		});
		expect(result.success).toBe(true);
	});

	it("should validate nested featuredImage", () => {
		const result = productSchema.safeParse({
			id: "prod-1",
			featuredImage: {
				node: {
					sourceUrl: null,
					altText: null,
				},
			},
		});
		expect(result.success).toBe(true);
	});

	it("should allow null featuredImage", () => {
		const result = productSchema.safeParse({
			id: "prod-1",
			featuredImage: null,
		});
		expect(result.success).toBe(true);
	});
});

describe("productsListSchema", () => {
	it("should validate products list with pagination", () => {
		const result = productsListSchema.safeParse({
			nodes: [
				{ id: "prod-1", title: "Product 1" },
				{ id: "prod-2", title: "Product 2" },
			],
			pageInfo: {
				hasNextPage: true,
				endCursor: "cursor-abc",
			},
		});
		expect(result.success).toBe(true);
	});

	it("should validate empty products list", () => {
		const result = productsListSchema.safeParse({
			nodes: [],
		});
		expect(result.success).toBe(true);
	});

	it("should require nodes array", () => {
		const result = productsListSchema.safeParse({
			pageInfo: { hasNextPage: false },
		});
		expect(result.success).toBe(false);
	});

	it("should allow missing pageInfo", () => {
		const result = productsListSchema.safeParse({
			nodes: [{ id: "prod-1" }],
		});
		expect(result.success).toBe(true);
	});

	it("should validate pageInfo with null endCursor", () => {
		const result = productsListSchema.safeParse({
			nodes: [],
			pageInfo: {
				hasNextPage: false,
				endCursor: null,
			},
		});
		expect(result.success).toBe(true);
	});

	it("should reject invalid product in nodes", () => {
		const result = productsListSchema.safeParse({
			nodes: [{ title: "Missing ID" }], // id is required
		});
		expect(result.success).toBe(false);
	});
});
