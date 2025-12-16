/**
 * ACF Post Type Schema
 * 使用 Zod 定义 Post Type 配置
 */

import { z } from "zod";

// ============================================
// Labels Schema
// ============================================

export const postTypeLabelsSchema = z.object({
	name: z.string(),
	singular_name: z.string(),
	menu_name: z.string().optional(),
	all_items: z.string().optional(),
	edit_item: z.string().optional(),
	view_item: z.string().optional(),
	view_items: z.string().optional(),
	add_new_item: z.string().optional(),
	add_new: z.string().optional(),
	new_item: z.string().optional(),
	parent_item_colon: z.string().optional(),
	search_items: z.string().optional(),
	not_found: z.string().optional(),
	not_found_in_trash: z.string().optional(),
	archives: z.string().optional(),
	attributes: z.string().optional(),
	featured_image: z.string().optional(),
	set_featured_image: z.string().optional(),
	remove_featured_image: z.string().optional(),
	use_featured_image: z.string().optional(),
	insert_into_item: z.string().optional(),
	uploaded_to_this_item: z.string().optional(),
	filter_items_list: z.string().optional(),
	filter_by_date: z.string().optional(),
	items_list_navigation: z.string().optional(),
	items_list: z.string().optional(),
	item_published: z.string().optional(),
	item_published_privately: z.string().optional(),
	item_reverted_to_draft: z.string().optional(),
	item_scheduled: z.string().optional(),
	item_updated: z.string().optional(),
	item_link: z.string().optional(),
	item_link_description: z.string().optional(),
});

export type PostTypeLabels = z.infer<typeof postTypeLabelsSchema>;

// ============================================
// Post Type Config
// ============================================

export type PostTypeConfig = {
	// 必需
	key: string;
	title: string;
	postType: string;
	labels: PostTypeLabels;

	// 可选配置
	description?: string;
	public?: boolean;
	hierarchical?: boolean;
	excludeFromSearch?: boolean;
	publiclyQueryable?: boolean;
	showUi?: boolean;
	showInMenu?: boolean;
	adminMenuParent?: string;
	showInAdminBar?: boolean;
	showInNavMenus?: boolean;
	showInRest?: boolean;
	restBase?: string;
	restNamespace?: string;
	restControllerClass?: string;
	menuPosition?: number;
	menuIcon?: {
		type: "dashicons" | "custom";
		value: string;
	};
	renameCapabilities?: boolean;
	singularCapabilityName?: string;
	pluralCapabilityName?: string;
	supports?: string[];
	taxonomies?: string[];
	hasArchive?: boolean;
	hasArchiveSlug?: string;
	rewrite?: {
		permalinkRewrite: "post_type_key" | "custom";
		withFront: boolean;
		feeds: boolean;
		pages: boolean;
	};
	queryVar?: "post_type_key" | "custom";
	queryVarName?: string;
	canExport?: boolean;
	deleteWithUser?: boolean;
	registerMetaBoxCb?: string;
	enterTitleHere?: string;

	// WPGraphQL
	showInGraphql?: boolean;
	graphqlSingleName?: string;
	graphqlPluralName?: string;
};

// ============================================
// Post Type Builder
// ============================================

const postTypeDefaults = {
	description: "",
	public: true,
	hierarchical: false,
	excludeFromSearch: false,
	publiclyQueryable: true,
	showUi: true,
	showInMenu: true,
	adminMenuParent: "",
	showInAdminBar: true,
	showInNavMenus: true,
	showInRest: true,
	restBase: "",
	restNamespace: "wp/v2",
	restControllerClass: "WP_REST_Posts_Controller",
	menuPosition: "",
	menuIcon: { type: "dashicons" as const, value: "dashicons-admin-post" },
	renameCapabilities: false,
	singularCapabilityName: "post",
	pluralCapabilityName: "posts",
	supports: ["title", "editor", "thumbnail"],
	taxonomies: [] as string[],
	hasArchive: true,
	hasArchiveSlug: "",
	queryVar: "post_type_key" as const,
	queryVarName: "",
	canExport: true,
	deleteWithUser: false,
	registerMetaBoxCb: "",
	enterTitleHere: "",
};

const defaultRewrite = {
	permalink_rewrite: "post_type_key",
	with_front: 1,
	feeds: 0,
	pages: 1,
} as const;

function buildRewrite(rewrite: PostTypeConfig["rewrite"]) {
	if (!rewrite) {
		return defaultRewrite;
	}
	return {
		permalink_rewrite: rewrite.permalinkRewrite,
		with_front: rewrite.withFront ? 1 : 0,
		feeds: rewrite.feeds ? 1 : 0,
		pages: rewrite.pages ? 1 : 0,
	};
}

function buildVisibilitySettings(config: PostTypeConfig) {
	const d = postTypeDefaults;
	return {
		public: config.public ?? d.public,
		hierarchical: config.hierarchical ?? d.hierarchical,
		exclude_from_search: config.excludeFromSearch ?? d.excludeFromSearch,
		publicly_queryable: config.publiclyQueryable ?? d.publiclyQueryable,
		show_ui: config.showUi ?? d.showUi,
		show_in_menu: config.showInMenu ?? d.showInMenu,
		admin_menu_parent: config.adminMenuParent ?? d.adminMenuParent,
		show_in_admin_bar: config.showInAdminBar ?? d.showInAdminBar,
		show_in_nav_menus: config.showInNavMenus ?? d.showInNavMenus,
	};
}

function buildRestSettings(config: PostTypeConfig) {
	const d = postTypeDefaults;
	return {
		show_in_rest: config.showInRest ?? d.showInRest,
		rest_base: config.restBase ?? d.restBase,
		rest_namespace: config.restNamespace ?? d.restNamespace,
		rest_controller_class: config.restControllerClass ?? d.restControllerClass,
	};
}

function buildCapabilitySettings(config: PostTypeConfig) {
	const d = postTypeDefaults;
	return {
		rename_capabilities: config.renameCapabilities ?? d.renameCapabilities,
		singular_capability_name:
			config.singularCapabilityName ?? d.singularCapabilityName,
		plural_capability_name:
			config.pluralCapabilityName ?? d.pluralCapabilityName,
	};
}

function buildArchiveSettings(config: PostTypeConfig) {
	const d = postTypeDefaults;
	return {
		has_archive: config.hasArchive ?? d.hasArchive,
		has_archive_slug: config.hasArchiveSlug ?? d.hasArchiveSlug,
		rewrite: buildRewrite(config.rewrite),
		query_var: config.queryVar ?? d.queryVar,
		query_var_name: config.queryVarName ?? d.queryVarName,
	};
}

/**
 * 创建 Post Type 定义
 */
export function definePostType(config: PostTypeConfig) {
	const d = postTypeDefaults;
	return {
		key: config.key,
		title: config.title,
		post_type: config.postType,
		menu_order: 0,
		active: true,
		advanced_configuration: true,
		import_source: "",
		import_date: "",
		labels: config.labels,
		description: config.description ?? d.description,
		...buildVisibilitySettings(config),
		...buildRestSettings(config),
		menu_position: config.menuPosition ?? d.menuPosition,
		menu_icon: config.menuIcon ?? d.menuIcon,
		...buildCapabilitySettings(config),
		supports: config.supports ?? d.supports,
		taxonomies: config.taxonomies ?? d.taxonomies,
		...buildArchiveSettings(config),
		can_export: config.canExport ?? d.canExport,
		delete_with_user: config.deleteWithUser ?? d.deleteWithUser,
		register_meta_box_cb: config.registerMetaBoxCb ?? d.registerMetaBoxCb,
		enter_title_here: config.enterTitleHere ?? d.enterTitleHere,
		show_in_graphql: config.showInGraphql,
		graphql_single_name: config.graphqlSingleName,
		graphql_plural_name: config.graphqlPluralName,
	};
}

export type PostTypeDefinition = ReturnType<typeof definePostType>;
