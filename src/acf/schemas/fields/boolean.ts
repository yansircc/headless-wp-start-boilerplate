/**
 * ACF True/False Field Schema Builder
 */

import { z } from "zod";
import type { AcfFieldMeta, ConditionalLogic } from "./base";

export type TrueFalseFieldConfig = {
	// 必需
	key: string;
	name: string;
	label: string;

	// 数据配置
	defaultValue?: boolean;

	// ACF 配置
	instructions?: string;
	conditionalLogic?: ConditionalLogic[][];
	message?: string;

	// UI 配置
	ui?: boolean;
	uiOnText?: string;
	uiOffText?: string;
	wrapper?: {
		width?: string;
		class?: string;
		id?: string;
	};
};

/**
 * 创建布尔字段 schema
 *
 * @example
 * const isFeaturedField = trueFalseField({
 *   key: "field_is_featured",
 *   name: "is_featured",
 *   label: "是否推荐",
 *   uiOnText: "是",
 *   uiOffText: "否",
 * });
 */
export function trueFalseField(config: TrueFalseFieldConfig) {
	const schema = z.boolean();

	const meta: AcfFieldMeta = {
		key: config.key,
		name: config.name,
		label: config.label,
		acfType: "true_false",
		required: false, // true_false 字段总是有值
		instructions: config.instructions,
		conditionalLogic: config.conditionalLogic,
		// ACF 特定配置
		default_value: config.defaultValue ? 1 : 0,
		message: config.message,
		// UI 配置
		ui: config.ui !== false ? 1 : 0,
		ui_on_text: config.uiOnText ?? "",
		ui_off_text: config.uiOffText ?? "",
		wrapper: config.wrapper,
	};

	return schema.meta(meta);
}

export type TrueFalseFieldSchema = ReturnType<typeof trueFalseField>;
