/**
 * Step 5: Download GraphQL Schema
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { IntrospectionQuery } from "graphql";
import { buildClientSchema, printSchema } from "graphql";
import { SCHEMA_FILE, TOTAL_STEPS, WP_GRAPHQL_ENDPOINT } from "../config";
import { graphqlResponseSchema } from "../types";
import { log, step } from "../utils";

const INTROSPECTION_QUERY = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types { ...FullType }
        directives { name description locations args { ...InputValue } }
      }
    }
    fragment FullType on __Type {
      kind name description
      fields(includeDeprecated: true) { name description args { ...InputValue } type { ...TypeRef } isDeprecated deprecationReason }
      inputFields { ...InputValue }
      interfaces { ...TypeRef }
      enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason }
      possibleTypes { ...TypeRef }
    }
    fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue }
    fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } } }
`;

export async function downloadSchema(): Promise<boolean> {
	step(5, TOTAL_STEPS, "下载 GraphQL Schema...");

	try {
		const response = await fetch(WP_GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: INTROSPECTION_QUERY }),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const json: unknown = await response.json();
		const result = graphqlResponseSchema.parse(json);

		const schema = buildClientSchema(result.data as IntrospectionQuery);
		const sdl = printSchema(schema);

		await mkdir(dirname(SCHEMA_FILE), { recursive: true });
		await writeFile(SCHEMA_FILE, sdl);

		log(`  ✓ Schema 已保存到 ${SCHEMA_FILE}`, "green");
		return true;
	} catch (error) {
		log(`  ✗ 无法下载 Schema: ${error}`, "red");
		if (existsSync(SCHEMA_FILE)) {
			log("  ⚠ 使用现有的本地 Schema", "yellow");
			return true;
		}
		return false;
	}
}
