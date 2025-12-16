import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	schema: process.env.GRAPHQL_ENDPOINT,
	documents: ["src/**/*.{ts,tsx,js,jsx,astro,graphql,gql}"],
	generates: {
		"src/graphql/_generated/graphql.ts": {
			plugins: ["typescript"],
			config: {
				scalars: {
					ID: "string",
				},
			},
		},
		"src/": {
			preset: "near-operation-file",
			presetConfig: {
				baseTypesPath: "graphql/_generated/graphql",
				extension: ".generated.ts",
			},
			plugins: [
				{
					add: {
						content: "/* eslint-disable */\n// @ts-nocheck",
					},
				},
				"typescript-operations",
				"typed-document-node",
			],
		},
	},
};

export default config;
