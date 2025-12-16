/**
 * Product Category Taxonomy Definition
 * 使用 Zod schema 定义
 */

import { defineTaxonomy } from "../schemas/taxonomy";

export const productCategoryTaxonomy = defineTaxonomy({
	key: "taxonomy_product_category",
	title: "Product Categories",
	taxonomy: "product-category",
	objectType: ["product"],

	labels: {
		name: "Product Categories",
		singular_name: "Product Category",
		menu_name: "Product Categories",
		all_items: "All Product Categories",
		edit_item: "Edit Product Category",
		view_item: "View Product Category",
		update_item: "Update Product Category",
		add_new_item: "Add New Product Category",
		new_item_name: "New Product Category Name",
		parent_item: "Parent Product Category",
		parent_item_colon: "Parent Product Category:",
		search_items: "Search Product Categories",
		most_used: "",
		not_found: "No product categories found",
		no_terms: "No product categories",
		name_field_description: "",
		slug_field_description: "",
		parent_field_description: "",
		desc_field_description: "",
		filter_by_item: "Filter by product category",
		items_list_navigation: "Product Categories list navigation",
		items_list: "Product Categories list",
		back_to_items: "← Go to product categories",
		item_link: "Product Category Link",
		item_link_description: "A link to a product category",
	},

	// 层级分类
	hierarchical: true,
	showAdminColumn: true,

	// WPGraphQL 设置
	showInGraphql: true,
	graphqlSingleName: "ProductCategory",
	graphqlPluralName: "ProductCategories",
});
