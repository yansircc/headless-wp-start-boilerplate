/**
 * Product Post Type Definition
 * 使用 Zod schema 定义
 */

import { definePostType } from "../schemas/post-type";

export type { PostTypeDefinition } from "../schemas/post-type";

export const productPostType = definePostType({
	key: "post_type_product",
	title: "Products",
	postType: "product",

	labels: {
		name: "Products",
		singular_name: "Product",
		menu_name: "Products",
		all_items: "All Products",
		edit_item: "Edit Product",
		view_item: "View Product",
		view_items: "View Products",
		add_new_item: "Add New Product",
		add_new: "Add New Product",
		new_item: "New Product",
		parent_item_colon: "Parent Product:",
		search_items: "Search Products",
		not_found: "No products found",
		not_found_in_trash: "No products found in Trash",
		archives: "Product Archives",
		attributes: "Product Attributes",
		featured_image: "",
		set_featured_image: "",
		remove_featured_image: "",
		use_featured_image: "",
		insert_into_item: "Insert into product",
		uploaded_to_this_item: "Uploaded to this product",
		filter_items_list: "Filter products list",
		filter_by_date: "Filter products by date",
		items_list_navigation: "Products list navigation",
		items_list: "Products list",
		item_published: "Product published.",
		item_published_privately: "Product published privately.",
		item_reverted_to_draft: "Product reverted to draft.",
		item_scheduled: "Product scheduled.",
		item_updated: "Product updated.",
		item_link: "Product Link",
		item_link_description: "A link to a product.",
	},

	// 功能支持
	supports: ["title", "editor", "thumbnail", "custom-fields"],

	// 关联分类法
	taxonomies: ["product-category"],

	// 菜单图标
	menuIcon: {
		type: "dashicons",
		value: "dashicons-cart",
	},

	// 显示设置
	showInRest: true,
	hasArchive: true,

	// WPGraphQL 设置
	showInGraphql: true,
	graphqlSingleName: "Product",
	graphqlPluralName: "Products",
});
