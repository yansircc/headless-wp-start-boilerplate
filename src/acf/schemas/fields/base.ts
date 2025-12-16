/**
 * ACF Field Schema Base
 * 基础类型定义和工具函数
 */

import { z } from "zod";

// ============================================
// ACF 字段类型枚举
// ============================================

export type AcfFieldType =
	| "text"
	| "textarea"
	| "number"
	| "range"
	| "email"
	| "url"
	| "password"
	| "image"
	| "file"
	| "wysiwyg"
	| "oembed"
	| "gallery"
	| "select"
	| "checkbox"
	| "radio"
	| "button_group"
	| "true_false"
	| "link"
	| "post_object"
	| "page_link"
	| "relationship"
	| "taxonomy"
	| "user"
	| "google_map"
	| "date_picker"
	| "date_time_picker"
	| "time_picker"
	| "color_picker"
	| "message"
	| "accordion"
	| "tab"
	| "group"
	| "repeater"
	| "flexible_content"
	| "clone";

// ============================================
// ACF 字段 Meta 类型
// ============================================

export type AcfFieldMeta = {
	// 必需字段
	key: string;
	name: string;
	label: string;
	acfType: AcfFieldType;

	// 通用可选字段
	instructions?: string;
	required?: boolean;
	conditionalLogic?: ConditionalLogic[][];

	// UI 配置
	wrapper?: {
		width?: string;
		class?: string;
		id?: string;
	};

	// 扩展配置（类型特定）
	[key: string]: unknown;
};

export type ConditionalLogic = {
	field: string;
	operator: "==" | "!=" | ">" | "<" | "pattern" | "contains";
	value: string | number;
};

// ============================================
// 工具函数
// ============================================

/**
 * 从 Zod schema 获取 ACF meta 信息
 */
export function getFieldMeta(schema: z.ZodType): AcfFieldMeta | undefined {
	return z.globalRegistry.get(schema) as AcfFieldMeta | undefined;
}

/**
 * 创建带有 ACF meta 的 schema
 */
export function withMeta<T extends z.ZodType>(
	schema: T,
	meta: AcfFieldMeta
): T {
	return schema.meta(meta) as T;
}

// ============================================
// 通用 Wrapper 默认值
// ============================================

export const defaultWrapper = {
	width: "",
	class: "",
	id: "",
};
