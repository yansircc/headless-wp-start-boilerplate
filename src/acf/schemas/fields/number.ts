/**
 * ACF Number Field Schema Builder
 */

import { z } from "zod";
import type { AcfFieldMeta, ConditionalLogic } from "./base";

export type NumberFieldConfig = {
	// 必需
	key: string;
	name: string;
	label: string;

	// 数据验证
	required?: boolean;
	min?: number;
	max?: number;
	step?: number;
	defaultValue?: number;

	// ACF 配置
	instructions?: string;
	conditionalLogic?: ConditionalLogic[][];

	// UI 配置
	placeholder?: string;
	prepend?: string;
	append?: string;
	wrapper?: {
		width?: string;
		class?: string;
		id?: string;
	};
};

/**
 * 创建数字字段 schema
 *
 * @example
 * const stockField = numberField({
 *   key: "field_stock",
 *   name: "stock",
 *   label: "库存",
 *   min: 0,
 *   step: 1,
 *   defaultValue: 0,
 * });
 */
export function numberField(config: NumberFieldConfig) {
	let schema = z.number();

	if (config.min !== undefined) {
		schema = schema.min(config.min);
	}
	if (config.max !== undefined) {
		schema = schema.max(config.max);
	}

	// 处理可选性 - 如果不是必填，允许 null/undefined
	const finalSchema = config.required ? schema : schema.nullable().optional();

	const meta: AcfFieldMeta = {
		key: config.key,
		name: config.name,
		label: config.label,
		acfType: "number",
		required: config.required,
		instructions: config.instructions,
		conditionalLogic: config.conditionalLogic,
		// ACF 特定配置
		default_value: config.defaultValue ?? "",
		min: config.min ?? "",
		max: config.max ?? "",
		step: config.step ?? "",
		// UI 配置
		placeholder: config.placeholder,
		prepend: config.prepend,
		append: config.append,
		wrapper: config.wrapper,
	};

	return finalSchema.meta(meta);
}

export type NumberFieldSchema = ReturnType<typeof numberField>;
