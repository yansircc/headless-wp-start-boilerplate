/**
 * ACF Text Field Schema Builder
 */

import { z } from "zod";
import type { AcfFieldMeta, ConditionalLogic } from "./base";

export type TextFieldConfig = {
	// 必需
	key: string;
	name: string;
	label: string;

	// 数据验证
	required?: boolean;
	maxlength?: number;
	defaultValue?: string;

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
 * 创建文本字段 schema
 *
 * @example
 * const priceField = textField({
 *   key: "field_price",
 *   name: "price",
 *   label: "价格",
 *   required: true,
 *   placeholder: "199.99",
 *   prepend: "¥",
 * });
 *
 * type Price = z.infer<typeof priceField>; // string
 */
export function textField(config: TextFieldConfig) {
	let schema = z.string();

	// 添加验证规则
	if (config.maxlength) {
		schema = schema.max(config.maxlength);
	}
	if (config.required) {
		schema = schema.min(1, `${config.label}是必填项`);
	}

	// 添加 meta 信息
	const meta: AcfFieldMeta = {
		key: config.key,
		name: config.name,
		label: config.label,
		acfType: "text",
		required: config.required,
		instructions: config.instructions,
		conditionalLogic: config.conditionalLogic,
		// ACF 特定配置
		defaultValue: config.defaultValue ?? "",
		maxlength: config.maxlength ?? "",
		// UI 配置
		placeholder: config.placeholder,
		prepend: config.prepend,
		append: config.append,
		wrapper: config.wrapper,
	};

	return schema.meta(meta);
}

export type TextFieldSchema = ReturnType<typeof textField>;
