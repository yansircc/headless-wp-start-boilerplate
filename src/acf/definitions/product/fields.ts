/**
 * Product Field Definitions
 * 使用 Zod schema 定义产品字段
 */

import {
	galleryField,
	numberField,
	repeaterField,
	textareaField,
	textField,
	trueFalseField,
} from "../../schemas/fields";

// ============================================
// 基础字段
// ============================================

/**
 * 价格字段
 */
export const priceField = textField({
	key: "field_price",
	name: "price",
	label: "价格",
	required: true,
	instructions: "请输入产品价格（仅数字）",
	placeholder: "199.99",
	prepend: "¥",
});

/**
 * 促销价字段
 */
export const salePriceField = textField({
	key: "field_sale_price",
	name: "sale_price",
	label: "促销价",
	instructions: "可选，促销期间的特价",
	placeholder: "99.99",
	prepend: "¥",
});

/**
 * SKU 编码字段
 */
export const skuField = textField({
	key: "field_sku",
	name: "sku",
	label: "SKU编码",
	maxlength: 50,
	instructions: "产品唯一标识码",
	placeholder: "PRD-001",
});

/**
 * 库存数量字段
 */
export const stockField = numberField({
	key: "field_stock",
	name: "stock",
	label: "库存数量",
	min: 0,
	step: 1,
	defaultValue: 0,
	instructions: "当前库存数量",
	placeholder: "100",
});

/**
 * 简短描述字段
 */
export const shortDescriptionField = textareaField({
	key: "field_short_description",
	name: "short_description",
	label: "简短描述",
	maxlength: 200,
	rows: 3,
	instructions: "产品简短描述，显示在列表页",
});

/**
 * 是否推荐字段
 */
export const isFeaturedField = trueFalseField({
	key: "field_is_featured",
	name: "is_featured",
	label: "是否推荐",
	instructions: "将此产品标记为推荐产品",
	uiOnText: "是",
	uiOffText: "否",
});

// ============================================
// 媒体字段
// ============================================

/**
 * 产品画廊字段
 */
export const productGalleryField = galleryField({
	key: "field_gallery",
	name: "gallery",
	label: "产品画廊",
	instructions: "上传产品多张图片",
	insertButtonLabel: "添加图片",
});

// ============================================
// 复杂字段
// ============================================

/**
 * 产品属性（重复器）
 */
export const attributesField = repeaterField({
	key: "field_attributes",
	name: "attributes",
	label: "产品属性",
	max: 10,
	layout: "table",
	instructions: "添加产品属性（如颜色、尺寸等）",
	buttonLabel: "添加属性",
	subFields: {
		attribute_name: textField({
			key: "field_attribute_name",
			name: "attribute_name",
			label: "属性名称",
			required: true,
			placeholder: "颜色",
		}),
		attribute_value: textField({
			key: "field_attribute_value",
			name: "attribute_value",
			label: "属性值",
			required: true,
			placeholder: "红色",
		}),
	},
});
