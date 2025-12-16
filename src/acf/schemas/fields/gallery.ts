/**
 * ACF Gallery Field Schema Builder
 */

import { z } from "zod";
import type { AcfFieldMeta, ConditionalLogic } from "./base";

// Gallery 返回的图片数据结构
export const galleryImageSchema = z.object({
	id: z.number(),
	url: z.string().url().optional(),
	alt: z.string().optional(),
	title: z.string().optional(),
	caption: z.string().optional(),
	description: z.string().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	sizes: z
		.record(
			z.string(),
			z.object({
				url: z.string(),
				width: z.number(),
				height: z.number(),
			})
		)
		.optional(),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

export type GalleryFieldConfig = {
	// 必需
	key: string;
	name: string;
	label: string;

	// 数据验证
	required?: boolean;
	min?: number;
	max?: number;

	// ACF 配置
	instructions?: string;
	conditionalLogic?: ConditionalLogic[][];
	returnFormat?: "array" | "url" | "id";
	previewSize?: string;
	library?: "all" | "uploadedTo";
	insert?: "append" | "prepend";

	// 图片尺寸限制
	minWidth?: number;
	minHeight?: number;
	minSize?: string;
	maxWidth?: number;
	maxHeight?: number;
	maxSize?: string;
	mimeTypes?: string;

	// UI 配置
	insertButtonLabel?: string;
	wrapper?: {
		width?: string;
		class?: string;
		id?: string;
	};
};

const itemSchemaMap = {
	id: () => z.number(),
	url: () => z.string().url(),
	array: () => galleryImageSchema,
} as const;

function getItemSchema(
	returnFormat: GalleryFieldConfig["returnFormat"]
): z.ZodType {
	const format = returnFormat ?? "array";
	return itemSchemaMap[format]();
}

function buildGalleryMeta(config: GalleryFieldConfig): AcfFieldMeta {
	return {
		key: config.key,
		name: config.name,
		label: config.label,
		acfType: "gallery",
		required: config.required,
		instructions: config.instructions,
		conditionalLogic: config.conditionalLogic,
		return_format: config.returnFormat ?? "array",
		preview_size: config.previewSize ?? "medium",
		library: config.library ?? "all",
		insert: config.insert ?? "append",
		min: config.min ?? "",
		max: config.max ?? "",
		min_width: config.minWidth ?? "",
		min_height: config.minHeight ?? "",
		min_size: config.minSize ?? "",
		max_width: config.maxWidth ?? "",
		max_height: config.maxHeight ?? "",
		max_size: config.maxSize ?? "",
		mime_types: config.mimeTypes ?? "",
		insert_button_label: config.insertButtonLabel,
		wrapper: config.wrapper,
	};
}

/**
 * 创建图库字段 schema
 *
 * @example
 * const productGalleryField = galleryField({
 *   key: "field_gallery",
 *   name: "gallery",
 *   label: "产品画廊",
 *   max: 10,
 *   insertButtonLabel: "添加图片",
 * });
 */
export function galleryField(config: GalleryFieldConfig) {
	const itemSchema = getItemSchema(config.returnFormat);
	let schema = z.array(itemSchema);

	if (config.min !== undefined) {
		schema = schema.min(config.min);
	}
	if (config.max !== undefined) {
		schema = schema.max(config.max);
	}

	const finalSchema = config.required ? schema : schema.nullable().optional();

	return finalSchema.meta(buildGalleryMeta(config));
}

export type GalleryFieldSchema = ReturnType<typeof galleryField>;
