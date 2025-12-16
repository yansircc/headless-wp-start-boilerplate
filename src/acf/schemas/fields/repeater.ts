/**
 * ACF Repeater Field Schema Builder
 */

import { z } from "zod";
import type { AcfFieldMeta, ConditionalLogic } from "./base";

export type RepeaterFieldConfig<T extends z.ZodRawShape> = {
	// 必需
	key: string;
	name: string;
	label: string;

	// 子字段定义
	subFields: T;

	// 数据验证
	required?: boolean;
	min?: number;
	max?: number;

	// ACF 配置
	instructions?: string;
	conditionalLogic?: ConditionalLogic[][];
	layout?: "table" | "block" | "row";
	collapsed?: string; // 折叠时显示的子字段 key

	// UI 配置
	buttonLabel?: string;
	wrapper?: {
		width?: string;
		class?: string;
		id?: string;
	};
};

/**
 * 创建重复器字段 schema
 *
 * @example
 * const attributesField = repeaterField({
 *   key: "field_attributes",
 *   name: "attributes",
 *   label: "产品属性",
 *   max: 10,
 *   layout: "table",
 *   buttonLabel: "添加属性",
 *   subFields: {
 *     attributeName: textField({
 *       key: "field_attribute_name",
 *       name: "attribute_name",
 *       label: "属性名称",
 *       required: true,
 *     }),
 *     attributeValue: textField({
 *       key: "field_attribute_value",
 *       name: "attribute_value",
 *       label: "属性值",
 *       required: true,
 *     }),
 *   },
 * });
 */
export function repeaterField<T extends z.ZodRawShape>(
	config: RepeaterFieldConfig<T>
) {
	// 从子字段 schema 构建行 schema
	const rowSchema = z.object(config.subFields);
	let schema = z.array(rowSchema);

	if (config.min !== undefined) {
		schema = schema.min(config.min);
	}
	if (config.max !== undefined) {
		schema = schema.max(config.max);
	}

	// 如果不是必填，允许 null/空数组
	const finalSchema = config.required ? schema : schema.nullable().optional();

	// 从子字段提取 ACF 配置
	const subFieldsAcf = Object.values(config.subFields).map((fieldSchema) => {
		const fieldMeta = z.globalRegistry.get(fieldSchema as z.ZodType) as
			| AcfFieldMeta
			| undefined;
		if (!fieldMeta) {
			throw new Error(
				"子字段缺少 meta 信息，请确保使用 field builder 函数创建子字段"
			);
		}
		return fieldMeta;
	});

	const meta: AcfFieldMeta = {
		key: config.key,
		name: config.name,
		label: config.label,
		acfType: "repeater",
		required: config.required,
		instructions: config.instructions,
		conditionalLogic: config.conditionalLogic,
		// ACF 特定配置
		min: config.min ?? 0,
		max: config.max ?? 0,
		layout: config.layout ?? "table",
		collapsed: config.collapsed ?? "",
		// 子字段配置
		sub_fields: subFieldsAcf,
		// UI 配置
		button_label: config.buttonLabel,
		wrapper: config.wrapper,
	};

	return finalSchema.meta(meta);
}

export type RepeaterFieldSchema<T extends z.ZodRawShape> = ReturnType<
	typeof repeaterField<T>
>;
