/**
 * ACF Textarea Field Schema Builder
 */

import { z } from "zod";
import type { AcfFieldMeta, ConditionalLogic } from "./base";

export type TextareaFieldConfig = {
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
	rows?: number;
	newLines?: "" | "wpautop" | "br";

	// UI 配置
	placeholder?: string;
	wrapper?: {
		width?: string;
		class?: string;
		id?: string;
	};
};

/**
 * 创建文本区域字段 schema
 *
 * @example
 * const descriptionField = textareaField({
 *   key: "field_description",
 *   name: "description",
 *   label: "描述",
 *   rows: 4,
 *   maxlength: 500,
 * });
 */
export function textareaField(config: TextareaFieldConfig) {
	let schema = z.string();

	if (config.maxlength) {
		schema = schema.max(config.maxlength);
	}
	if (config.required) {
		schema = schema.min(1, `${config.label}是必填项`);
	}

	const meta: AcfFieldMeta = {
		key: config.key,
		name: config.name,
		label: config.label,
		acfType: "textarea",
		required: config.required,
		instructions: config.instructions,
		conditionalLogic: config.conditionalLogic,
		// ACF 特定配置
		defaultValue: config.defaultValue ?? "",
		maxlength: config.maxlength ?? "",
		rows: config.rows ?? 4,
		new_lines: config.newLines ?? "",
		// UI 配置
		placeholder: config.placeholder,
		wrapper: config.wrapper,
	};

	return schema.meta(meta);
}

export type TextareaFieldSchema = ReturnType<typeof textareaField>;
