/**
 * Sync Script Types
 */

import { z } from "zod";

// ============================================
// Response Schemas (for type-safe API calls)
// ============================================

export const pushResponseSchema = z.object({
	success: z.boolean(),
	synced: z.array(z.record(z.string(), z.unknown())).optional(),
	errors: z.array(z.string()).optional(),
});

export const graphqlResponseSchema = z.object({
	data: z.unknown(),
	errors: z.array(z.record(z.string(), z.unknown())).optional(),
});

// ============================================
// ACF Definition Types
// ============================================

export type FieldGroupConfig = {
	key: string;
	title: string;
	graphqlFieldName: string;
	showInGraphql: boolean;
	location: Array<
		Array<{ param: string; operator: "==" | "!="; value: string }>
	>;
	ui: {
		menuOrder: number;
		position: "acf_after_title" | "normal" | "side";
		style: "default" | "seamless";
		labelPlacement: "top" | "left";
		instructionPlacement: "label" | "field";
		hideOnScreen: string[];
	};
	fields: z.ZodType[];
};

export type PostTypeDefinition = {
	key: string;
	post_type: string;
	title: string;
	graphql_single_name?: string;
};

export type TaxonomyDefinition = {
	key: string;
	taxonomy: string;
	title: string;
	object_type: string[];
	graphql_single_name?: string;
};

export type DiscoveredDefinitions = {
	fieldGroups: Array<{ name: string; config: FieldGroupConfig; path: string }>;
	postTypes: Array<{ name: string; config: PostTypeDefinition; path: string }>;
	taxonomies: Array<{
		name: string;
		config: TaxonomyDefinition;
		path: string;
	}>;
};
