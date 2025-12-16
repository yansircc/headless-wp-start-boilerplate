/**
 * Product Field Group Definition
 * 组合字段定义成完整的字段组
 */

import { z } from "zod";
import type { AcfFieldMeta } from "../../schemas/fields";
import * as fields from "./fields";

// ============================================
// 导出字段（供外部使用）
// ============================================

export {
	attributesField,
	isFeaturedField,
	priceField,
	productGalleryField,
	salePriceField,
	shortDescriptionField,
	skuField,
	stockField,
} from "./fields";

// ============================================
// 导出数据 Schema（用于运行时验证）
// ============================================

export {
	type Product,
	type ProductAcfGroup,
	type ProductAttribute,
	type ProductGalleryImage,
	type ProductsList,
	productAcfGroupSchema,
	productAttributeSchema,
	productGalleryImageSchema,
	productSchema,
	productsListSchema,
} from "./schema";

// ============================================
// Field Group 配置
// ============================================

export type FieldGroupConfig = {
	key: string;
	title: string;
	description?: string;
	showInGraphql: boolean;
	graphqlFieldName: string;
	location: LocationRule[][];
	ui: FieldGroupUi;
	fields: z.ZodType[];
};

export type LocationRule = {
	param: string;
	operator: "==" | "!=";
	value: string;
};

export type FieldGroupUi = {
	menuOrder: number;
	position: "acf_after_title" | "normal" | "side";
	style: "default" | "seamless";
	labelPlacement: "top" | "left";
	instructionPlacement: "label" | "field";
	hideOnScreen: string[];
};

// ============================================
// 产品字段组定义
// ============================================

export const productFieldGroup: FieldGroupConfig = {
	key: "group_product_fields",
	title: "产品字段",
	description: "产品自定义字段组",

	// WPGraphQL 设置
	showInGraphql: true,
	graphqlFieldName: "productAcfGroup",

	// 字段列表
	fields: [
		fields.priceField,
		fields.salePriceField,
		fields.stockField,
		fields.skuField,
		fields.shortDescriptionField,
		fields.productGalleryField,
		fields.attributesField,
		fields.isFeaturedField,
	],

	// 位置规则
	location: [
		[
			{
				param: "post_type",
				operator: "==",
				value: "product",
			},
		],
	],

	// UI 配置
	ui: {
		menuOrder: 0,
		position: "normal",
		style: "default",
		labelPlacement: "top",
		instructionPlacement: "label",
		hideOnScreen: [],
	},
};

// ============================================
// 获取字段组的 ACF JSON 格式
// ============================================

/**
 * 从字段 schema 获取 ACF 配置
 */
function getFieldAcfConfig(fieldSchema: z.ZodType): Record<string, unknown> {
	const meta = z.globalRegistry.get(fieldSchema) as AcfFieldMeta | undefined;
	if (!meta) {
		throw new Error("字段缺少 meta 信息");
	}

	const {
		key,
		name,
		label,
		acfType,
		required,
		instructions,
		conditionalLogic,
		wrapper,
		...rest
	} = meta;

	// 处理子字段
	let subFieldsJson: Record<string, unknown>[] | undefined;
	if (rest.sub_fields && Array.isArray(rest.sub_fields)) {
		subFieldsJson = rest.sub_fields.map((subMeta: AcfFieldMeta) => ({
			key: subMeta.key,
			name: subMeta.name,
			label: subMeta.label,
			type: subMeta.acfType,
			required: subMeta.required ? 1 : 0,
			instructions: subMeta.instructions ?? "",
			conditional_logic: subMeta.conditionalLogic ?? 0,
			wrapper: subMeta.wrapper ?? { width: "", class: "", id: "" },
			// 展开其他配置
			...Object.fromEntries(
				Object.entries(subMeta).filter(
					([k]) =>
						![
							"key",
							"name",
							"label",
							"acfType",
							"required",
							"instructions",
							"conditionalLogic",
							"wrapper",
						].includes(k)
				)
			),
		}));
	}

	return {
		key,
		name,
		label,
		type: acfType,
		required: required ? 1 : 0,
		instructions: instructions ?? "",
		conditional_logic: conditionalLogic ?? 0,
		wrapper: wrapper ?? { width: "", class: "", id: "" },
		// 展开其他配置（排除已处理的字段）
		...Object.fromEntries(
			Object.entries(rest).filter(([k]) => k !== "sub_fields")
		),
		// 添加处理后的子字段
		...(subFieldsJson ? { sub_fields: subFieldsJson } : {}),
	};
}

/**
 * 将字段组配置转换为 ACF JSON 格式
 */
export function toAcfJson(config: FieldGroupConfig): Record<string, unknown> {
	return {
		key: config.key,
		title: config.title,
		description: config.description ?? "",
		fields: config.fields.map(getFieldAcfConfig),
		location: config.location,
		active: true,
		// WPGraphQL
		show_in_graphql: config.showInGraphql,
		graphql_field_name: config.graphqlFieldName,
		// UI 配置
		menu_order: config.ui.menuOrder,
		position: config.ui.position,
		style: config.ui.style,
		label_placement: config.ui.labelPlacement,
		instruction_placement: config.ui.instructionPlacement,
		hide_on_screen: config.ui.hideOnScreen,
	};
}

// ============================================
// 自动生成函数
// ============================================

/**
 * snake_case 转 camelCase
 */
function toCamelCase(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 生成 GraphQL Fragment
 */
export function toGraphQLFragment(config: FieldGroupConfig): string {
	const lines: string[] = [];
	const fragmentName = "ProductAcfFields";
	const typeName = "ProductAcfGroup";

	lines.push("# 自动生成 - 请勿手动修改");
	lines.push(`fragment ${fragmentName} on ${typeName} {`);

	for (const fieldSchema of config.fields) {
		const meta = z.globalRegistry.get(fieldSchema) as AcfFieldMeta | undefined;
		if (!meta) {
			continue;
		}

		const graphqlName = toCamelCase(meta.name);

		if (meta.acfType === "repeater" && meta.sub_fields) {
			// 处理 repeater 子字段
			const subFields = (meta.sub_fields as AcfFieldMeta[])
				.map((sub) => toCamelCase(sub.name))
				.join(" ");
			lines.push(`\t${graphqlName} { ${subFields} }`);
		} else if (meta.acfType === "gallery") {
			// 处理 gallery 字段 - ACF gallery 返回 connection 类型
			lines.push(`\t${graphqlName} { nodes { id sourceUrl altText } }`);
		} else {
			lines.push(`\t${graphqlName}`);
		}
	}

	lines.push("}");
	return lines.join("\n");
}

/**
 * 生成 Zod Schema 代码
 */
export function toZodSchemaCode(config: FieldGroupConfig): string {
	const lines: string[] = [];

	lines.push("// 自动生成 - 请勿手动修改");
	lines.push(`import { z } from "zod";`);
	lines.push("");

	// 生成图片 schema
	lines.push("export const productGalleryImageSchema = z.object({");
	lines.push("\tid: z.string(),");
	lines.push("\tsourceUrl: z.string().nullable().optional(),");
	lines.push("\taltText: z.string().nullable().optional(),");
	lines.push("});");
	lines.push("");

	// 生成属性 schema（如果有 repeater）
	for (const fieldSchema of config.fields) {
		const meta = z.globalRegistry.get(fieldSchema) as AcfFieldMeta | undefined;
		if (!meta || meta.acfType !== "repeater") {
			continue;
		}

		const schemaName = `product${meta.name.charAt(0).toUpperCase() + toCamelCase(meta.name).slice(1)}Schema`;
		lines.push(
			`export const ${schemaName.replace("Schema", "ItemSchema")} = z.object({`
		);
		for (const sub of meta.sub_fields as AcfFieldMeta[]) {
			lines.push(
				`\t${toCamelCase(sub.name)}: z.string().nullable().optional(),`
			);
		}
		lines.push("});");
		lines.push("");
	}

	// 生成主 schema
	lines.push("export const productAcfGroupSchema = z.object({");

	for (const fieldSchema of config.fields) {
		const meta = z.globalRegistry.get(fieldSchema) as AcfFieldMeta | undefined;
		if (!meta) {
			continue;
		}

		const fieldName = toCamelCase(meta.name);
		let zodType: string;

		switch (meta.acfType) {
			case "text":
			case "textarea":
				zodType = "z.string().nullable().optional()";
				break;
			case "number":
				zodType = "z.number().nullable().optional()";
				break;
			case "true_false":
				zodType = "z.boolean().nullable().optional()";
				break;
			case "gallery":
				zodType = "z.array(productGalleryImageSchema).nullable().optional()";
				break;
			case "repeater": {
				const itemSchemaName =
					`product${meta.name.charAt(0).toUpperCase() + toCamelCase(meta.name).slice(1)}Schema`.replace(
						"Schema",
						"ItemSchema"
					);
				zodType = `z.array(${itemSchemaName}).nullable().optional()`;
				break;
			}
			default:
				zodType = "z.unknown()";
		}

		lines.push(`\t${fieldName}: ${zodType},`);
	}

	lines.push("});");
	lines.push("");
	lines.push(
		"export type ProductAcfGroup = z.infer<typeof productAcfGroupSchema>;"
	);

	return lines.join("\n");
}
