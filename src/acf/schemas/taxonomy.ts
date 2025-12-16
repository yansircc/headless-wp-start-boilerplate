/**
 * ACF Taxonomy Schema
 * 使用 Zod 定义 Taxonomy 配置
 */

import { z } from "zod";

// ============================================
// Labels Schema
// ============================================

export const taxonomyLabelsSchema = z.object({
	name: z.string(),
	singular_name: z.string(),
	menu_name: z.string().optional(),
	all_items: z.string().optional(),
	edit_item: z.string().optional(),
	view_item: z.string().optional(),
	update_item: z.string().optional(),
	add_new_item: z.string().optional(),
	new_item_name: z.string().optional(),
	parent_item: z.string().optional(),
	parent_item_colon: z.string().optional(),
	search_items: z.string().optional(),
	most_used: z.string().optional(),
	not_found: z.string().optional(),
	no_terms: z.string().optional(),
	name_field_description: z.string().optional(),
	slug_field_description: z.string().optional(),
	parent_field_description: z.string().optional(),
	desc_field_description: z.string().optional(),
	filter_by_item: z.string().optional(),
	items_list_navigation: z.string().optional(),
	items_list: z.string().optional(),
	back_to_items: z.string().optional(),
	item_link: z.string().optional(),
	item_link_description: z.string().optional(),
});

export type TaxonomyLabels = z.infer<typeof taxonomyLabelsSchema>;

// ============================================
// Taxonomy Config
// ============================================

export type TaxonomyConfig = {
	// 必需
	key: string;
	title: string;
	taxonomy: string;
	objectType: string[];
	labels: TaxonomyLabels;

	// 可选配置
	description?: string;
	public?: boolean;
	publiclyQueryable?: boolean;
	hierarchical?: boolean;
	showUi?: boolean;
	showInMenu?: boolean;
	showInNavMenus?: boolean;
	showInRest?: boolean;
	restBase?: string;
	restNamespace?: string;
	restControllerClass?: string;
	showTagcloud?: boolean;
	showInQuickEdit?: boolean;
	showAdminColumn?: boolean;
	rewrite?: {
		permalinkRewrite: "taxonomy_key" | "custom";
		withFront: boolean;
		rewriteHierarchical: boolean;
	};
	queryVar?: "post_type_key" | "custom";
	queryVarName?: string;
	defaultTerm?: {
		enabled: boolean;
		name?: string;
		slug?: string;
		description?: string;
	};
	sort?: boolean;
	metaBox?: "default" | "custom" | "null";
	metaBoxCb?: string;
	metaBoxSanitizeCb?: string;
	capabilities?: {
		manageTerms?: string;
		editTerms?: string;
		deleteTerms?: string;
		assignTerms?: string;
	};

	// WPGraphQL
	showInGraphql?: boolean;
	graphqlSingleName?: string;
	graphqlPluralName?: string;
};

// ============================================
// Taxonomy Builder
// ============================================

function boolToInt(value: boolean | undefined, defaultTrue = true): 0 | 1 {
	if (defaultTrue) {
		return value !== false ? 1 : 0;
	}
	return value ? 1 : 0;
}

const defaultCapabilities = {
	manage_terms: "manage_categories",
	edit_terms: "manage_categories",
	delete_terms: "manage_categories",
	assign_terms: "edit_posts",
};

const defaultTaxonomyRewrite = {
	permalink_rewrite: "taxonomy_key",
	with_front: 1,
	rewrite_hierarchical: 0,
} as const;

function buildTaxonomyRewrite(rewrite: TaxonomyConfig["rewrite"]) {
	if (!rewrite) {
		return defaultTaxonomyRewrite;
	}
	return {
		permalink_rewrite: rewrite.permalinkRewrite,
		with_front: boolToInt(rewrite.withFront, false),
		rewrite_hierarchical: boolToInt(rewrite.rewriteHierarchical, false),
	};
}

const defaultTermDisabled = { default_term_enabled: 0 } as const;

function buildDefaultTerm(defaultTerm: TaxonomyConfig["defaultTerm"]) {
	if (!defaultTerm) {
		return defaultTermDisabled;
	}
	return {
		default_term_enabled: boolToInt(defaultTerm.enabled, false),
		default_term_name: defaultTerm.name ?? "",
		default_term_slug: defaultTerm.slug ?? "",
		default_term_description: defaultTerm.description ?? "",
	};
}

/**
 * 创建 Taxonomy 定义
 */
export function defineTaxonomy(config: TaxonomyConfig) {
	return {
		key: config.key,
		title: config.title,
		taxonomy: config.taxonomy,
		object_type: config.objectType,
		menu_order: 0,
		active: true,
		advanced_configuration: 0,
		import_source: "",
		import_date: "",
		labels: config.labels,
		description: config.description ?? "",
		capabilities: config.capabilities ?? defaultCapabilities,
		public: boolToInt(config.public),
		publicly_queryable: boolToInt(config.publiclyQueryable),
		hierarchical: boolToInt(config.hierarchical),
		show_ui: boolToInt(config.showUi),
		show_in_menu: boolToInt(config.showInMenu),
		show_in_nav_menus: boolToInt(config.showInNavMenus),
		show_in_rest: boolToInt(config.showInRest),
		rest_base: config.restBase ?? "",
		rest_namespace: config.restNamespace ?? "wp/v2",
		rest_controller_class:
			config.restControllerClass ?? "WP_REST_Terms_Controller",
		show_tagcloud: boolToInt(config.showTagcloud),
		show_in_quick_edit: boolToInt(config.showInQuickEdit),
		show_admin_column: boolToInt(config.showAdminColumn, false),
		rewrite: buildTaxonomyRewrite(config.rewrite),
		query_var: config.queryVar ?? "post_type_key",
		query_var_name: config.queryVarName ?? "",
		default_term: buildDefaultTerm(config.defaultTerm),
		sort: boolToInt(config.sort, false),
		meta_box: config.metaBox ?? "default",
		meta_box_cb: config.metaBoxCb ?? "",
		meta_box_sanitize_cb: config.metaBoxSanitizeCb ?? "",
		show_in_graphql: config.showInGraphql,
		graphql_single_name: config.graphqlSingleName,
		graphql_plural_name: config.graphqlPluralName,
	};
}

export type TaxonomyDefinition = ReturnType<typeof defineTaxonomy>;
