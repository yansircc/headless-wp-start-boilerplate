/**
 * Product ACF Data Schema
 * 纯数据 schema，用于运行时验证 WordPress/GraphQL 返回的数据
 */

import { z } from "zod";

// ============================================
// 产品属性项
// ============================================

export const productAttributeSchema = z.object({
	attributeName: z.string().nullable().optional(),
	attributeValue: z.string().nullable().optional(),
});

export type ProductAttribute = z.infer<typeof productAttributeSchema>;

// ============================================
// 图库图片（GraphQL 返回格式）
// ============================================

export const productGalleryImageSchema = z.object({
	id: z.string(),
	sourceUrl: z.string().nullable().optional(),
	altText: z.string().nullable().optional(),
	title: z.string().nullable().optional(),
});

export type ProductGalleryImage = z.infer<typeof productGalleryImageSchema>;

// ============================================
// 产品 ACF 字段组 Schema
// ============================================

export const productAcfGroupSchema = z.object({
	price: z.string().nullable().optional(),
	sku: z.string().nullable().optional(),
	stock: z.number().nullable().optional(),
	shortDescription: z.string().nullable().optional(),
	isFeatured: z.boolean().nullable().optional(),
	gallery: z.array(productGalleryImageSchema).nullable().optional(),
	attributes: z.array(productAttributeSchema).nullable().optional(),
});

export type ProductAcfGroup = z.infer<typeof productAcfGroupSchema>;

// ============================================
// 完整产品 Schema（包含 WordPress 字段）
// ============================================

export const productSchema = z.object({
	id: z.string(),
	databaseId: z.number(),
	title: z.string().nullable().optional(),
	slug: z.string().nullable().optional(),
	content: z.string().nullable().optional(),
	date: z.string().nullable().optional(),
	featuredImage: z
		.object({
			node: z.object({
				sourceUrl: z.string().nullable().optional(),
				altText: z.string().nullable().optional(),
			}),
		})
		.nullable()
		.optional(),
	productAcfGroup: productAcfGroupSchema.nullable().optional(),
});

export type Product = z.infer<typeof productSchema>;

// ============================================
// 产品列表 Schema
// ============================================

export const productsListSchema = z.object({
	nodes: z.array(productSchema),
	pageInfo: z
		.object({
			hasNextPage: z.boolean(),
			endCursor: z.string().nullable().optional(),
		})
		.optional(),
});

export type ProductsList = z.infer<typeof productsListSchema>;
