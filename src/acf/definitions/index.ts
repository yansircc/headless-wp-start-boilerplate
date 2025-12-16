/**
 * ACF Definitions
 * 统一导出所有字段组定义
 */

// Product
export {
	attributesField,
	type FieldGroupConfig,
	type FieldGroupUi,
	isFeaturedField,
	type LocationRule,
	// Types
	type Product,
	type ProductAcfGroup,
	type ProductAttribute,
	type ProductGalleryImage,
	type ProductsList,
	// 字段
	priceField,
	productAcfGroupSchema,
	productAttributeSchema,
	productFieldGroup,
	productGalleryField,
	productGalleryImageSchema,
	// Schema
	productSchema,
	productsListSchema,
	salePriceField,
	shortDescriptionField,
	skuField,
	stockField,
	toAcfJson,
	toGraphQLFragment,
	toZodSchemaCode,
} from "./product";
