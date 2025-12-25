/**
 * Static Routes Configuration
 *
 * Maps frontend routes to WordPress content types for SEO validation.
 * Used by `bun checkall` to verify SEO configuration completeness.
 */

/**
 * Frontend static routes and their WordPress content type mappings
 */
export const STATIC_ROUTES = {
	/**
	 * Archive routes → WordPress Content Type
	 * These routes should have corresponding Yoast Archive SEO configured
	 */
	archives: {
		"/posts": "post",
		"/products": "product",
	},

	/**
	 * Taxonomy detail routes → WordPress Taxonomy
	 * These routes get SEO from individual taxonomy term settings
	 */
	taxonomies: {
		"/posts/categories/$slug": "category",
		"/posts/tags/$slug": "tag",
		"/products/categories/$slug": "productCategory",
	},

	/**
	 * Homepage route
	 */
	homepage: "/",
} as const;

/**
 * Content type display names for error messages
 */
export const CONTENT_TYPE_NAMES: Record<string, string> = {
	post: "Posts",
	product: "Products",
	page: "Pages",
	category: "Categories",
	tag: "Tags",
	productCategory: "Product Categories",
};

/**
 * WordPress admin paths for Yoast SEO settings
 */
export const WP_ADMIN_PATHS = {
	contentTypes: "/wp-admin/admin.php?page=wpseo_page_settings#/content-types",
	siteBasics: "/wp-admin/admin.php?page=wpseo_page_settings#/site-basics",
	taxonomies: "/wp-admin/admin.php?page=wpseo_page_settings#/taxonomies",
} as const;
