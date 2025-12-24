/**
 * Step 2: Generate GraphQL Fragment + Zod Schema
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { TOTAL_STEPS } from "../config";
import type { DiscoveredDefinitions } from "../types";
import { log, step } from "../utils";

const CAMEL_TO_KEBAB_REGEX = /([A-Z])/g;
const LEADING_DASH_REGEX = /^-/;

export async function generateCode(
	definitions: DiscoveredDefinitions
): Promise<boolean> {
	step(2, TOTAL_STEPS, "生成 GraphQL Fragment + Zod Schema...");

	const { toGraphQLFragment, toZodSchemaCode } = await import(
		"../../../src/acf/definitions/product/index.ts"
	);

	for (const { name, config } of definitions.fieldGroups) {
		// Generate GraphQL Fragment
		const fragmentDir = "./src/graphql/_generated";
		await mkdir(fragmentDir, { recursive: true });
		const fragment = toGraphQLFragment(config);
		const fragmentFileName = `${config.graphqlFieldName
			.replace(CAMEL_TO_KEBAB_REGEX, "-$1")
			.toLowerCase()
			.replace(LEADING_DASH_REGEX, "")}.fragment.graphql`;
		await writeFile(join(fragmentDir, fragmentFileName), fragment);
		log(`  ✓ ${fragmentFileName}`, "green");

		// Generate Zod Schema
		const schemaDir = `./src/acf/definitions/${name.replace("FieldGroup", "").toLowerCase()}/_generated`;
		await mkdir(schemaDir, { recursive: true });
		const schema = toZodSchemaCode(config);
		await writeFile(join(schemaDir, "schema.ts"), schema);
		log(`  ✓ ${name} → schema.ts`, "green");
	}

	return true;
}
