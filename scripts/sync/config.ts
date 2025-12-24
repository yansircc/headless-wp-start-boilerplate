/**
 * Sync Script Configuration
 */

// WordPress & GraphQL
export const WP_URL = process.env.WP_URL;
export const WP_GRAPHQL_ENDPOINT = `${WP_URL}/graphql`;
export const ACF_SYNC_KEY = process.env.ACF_SYNC_KEY ?? "";
export const SCHEMA_FILE = "src/graphql/_generated/schema.graphql";

// Paths
export const DEFINITIONS_DIR = "./src/acf/definitions";
export const POST_TYPES_DIR = "./src/acf/post-types";
export const TAXONOMIES_DIR = "./src/acf/taxonomies";
export const COMPILED_DIR = "./src/acf/compiled";

// Step count for progress display
export const TOTAL_STEPS = 8;
