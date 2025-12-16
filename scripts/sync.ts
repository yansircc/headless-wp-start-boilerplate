#!/usr/bin/env bun

/**
 * Sync Script
 * 一键同步 ACF 定义到 WordPress 并生成类型
 *
 * Usage: bun sync
 *
 * 流程：
 *   1. 生成 GraphQL Fragment + Zod Schema
 *   2. 编译 ACF TypeScript → JSON
 *   3. 推送到 WordPress
 *   4. 下载最新 GraphQL Schema
 *   5. 运行 codegen 生成类型
 */

import { existsSync } from "node:fs";
import { spawn } from "bun";

// Configuration
const WP_URL = process.env.WP_URL || "http://headless.local";
const WP_GRAPHQL_ENDPOINT = `${WP_URL}/graphql`;
const ACF_SYNC_KEY = process.env.ACF_SYNC_KEY || "dev-key-123";
const SCHEMA_FILE = "src/graphql/_generated/schema.graphql";

// Colors
const c = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
};

function log(msg: string, color: keyof typeof c = "reset") {
	console.log(`${c[color]}${msg}${c.reset}`);
}

function step(num: number, total: number, msg: string) {
	console.log(`\n${c.cyan}[${num}/${total}]${c.reset} ${msg}`);
}

async function run(cmd: string, args: string[]): Promise<boolean> {
	log(`  ${c.dim}$ ${cmd} ${args.join(" ")}${c.reset}`, "dim");
	const proc = spawn([cmd, ...args], { stdout: "inherit", stderr: "inherit" });
	return (await proc.exited) === 0;
}

// Step 1: Generate GraphQL Fragment + Zod Schema
async function generateCode(): Promise<boolean> {
	step(1, 5, "生成 GraphQL Fragment + Zod Schema...");

	const { productFieldGroup, toGraphQLFragment, toZodSchemaCode } =
		await import("../src/acf/definitions/index.ts");
	const { writeFile, mkdir } = await import("node:fs/promises");

	// Generate GraphQL Fragment
	const fragmentDir = "./src/graphql/_generated";
	await mkdir(fragmentDir, { recursive: true });
	const fragment = toGraphQLFragment(productFieldGroup);
	await writeFile(`${fragmentDir}/product-acf.fragment.graphql`, fragment);
	log("  ✓ product-acf.fragment.graphql", "green");

	// Generate Zod Schema
	const schemaDir = "./src/acf/definitions/product/_generated";
	await mkdir(schemaDir, { recursive: true });
	const schema = toZodSchemaCode(productFieldGroup);
	await writeFile(`${schemaDir}/schema.ts`, schema);
	log("  ✓ schema.ts", "green");

	return true;
}

// Step 2: Compile ACF definitions
async function compileAcf(): Promise<boolean> {
	step(2, 5, "编译 ACF 定义...");

	const { toAcfJson, productFieldGroup } = await import(
		"../src/acf/definitions/index.ts"
	);
	const { productPostType } = await import("../src/acf/post-types/index.ts");
	const { productCategoryTaxonomy } = await import(
		"../src/acf/taxonomies/index.ts"
	);
	const { writeFile, mkdir } = await import("node:fs/promises");
	const { join } = await import("node:path");

	const OUTPUT_DIR = "./src/acf/compiled";
	await mkdir(OUTPUT_DIR, { recursive: true });

	const groupJson = toAcfJson(productFieldGroup);
	await writeFile(
		join(OUTPUT_DIR, `${productFieldGroup.key}.json`),
		JSON.stringify(groupJson, null, 2)
	);
	log(`  ✓ ${productFieldGroup.key}.json`, "green");

	await writeFile(
		join(OUTPUT_DIR, `post-type_${productPostType.post_type}.json`),
		JSON.stringify(productPostType, null, 2)
	);
	log(`  ✓ post-type_${productPostType.post_type}.json`, "green");

	await writeFile(
		join(OUTPUT_DIR, `taxonomy_${productCategoryTaxonomy.taxonomy}.json`),
		JSON.stringify(productCategoryTaxonomy, null, 2)
	);
	log(`  ✓ taxonomy_${productCategoryTaxonomy.taxonomy}.json`, "green");

	return true;
}

// Step 3: Push to WordPress
async function pushToWordPress(): Promise<boolean> {
	step(3, 5, "推送到 WordPress...");

	const { readdir, readFile } = await import("node:fs/promises");
	const { join } = await import("node:path");

	const COMPILED_DIR = "./src/acf/compiled";
	const files: Array<{
		filename: string;
		type: string;
		content: Record<string, unknown>;
	}> = [];

	const entries = await readdir(COMPILED_DIR);
	for (const entry of entries) {
		if (!entry.endsWith(".json")) {
			continue;
		}
		const content = await readFile(join(COMPILED_DIR, entry), "utf-8");
		let type = "unknown";
		if (entry.startsWith("group_")) {
			type = "field_group";
		} else if (entry.startsWith("post-type_")) {
			type = "post_type";
		} else if (entry.startsWith("taxonomy_")) {
			type = "taxonomy";
		}
		files.push({ filename: entry, type, content: JSON.parse(content) });
	}

	try {
		const response = await fetch(`${WP_URL}/wp-json/acf-sync/v1/push`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-ACF-Sync-Key": ACF_SYNC_KEY,
			},
			body: JSON.stringify({ files }),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const result = await response.json();
		if (result.success) {
			log(`  ✓ 已推送 ${files.length} 个文件`, "green");
			return true;
		}
		log(`  ✗ 推送失败: ${result.errors?.join(", ")}`, "red");
		return false;
	} catch (error) {
		log(`  ✗ 无法连接 WordPress: ${error}`, "red");
		return false;
	}
}

// Step 4: Download GraphQL Schema
async function downloadSchema(): Promise<boolean> {
	step(4, 5, "下载 GraphQL Schema...");

	const introspectionQuery = `
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

	try {
		const response = await fetch(WP_GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: introspectionQuery }),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const { data } = await response.json();

		const { buildClientSchema, printSchema } = await import("graphql");
		const schema = buildClientSchema(data);
		const sdl = printSchema(schema);

		const { writeFile, mkdir } = await import("node:fs/promises");
		const { dirname } = await import("node:path");
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

// Step 5: Run codegen
async function runCodegen(): Promise<boolean> {
	step(5, 5, "生成 TypeScript 类型...");
	const success = await run("bun", [
		"graphql-codegen",
		"--config",
		"codegen.ts",
	]);

	if (!success) {
		console.log(`
${c.yellow}提示：Codegen 失败通常是因为 .graphql 文件与 Schema 不同步${c.reset}

检查 src/graphql/**/*.graphql 文件，修复后重新运行 ${c.cyan}bun sync${c.reset}
`);
	}
	return success;
}

// Main
async function main() {
	console.log(`\n${c.cyan}🔄 开始同步...${c.reset}`);
	const startTime = Date.now();

	if (!(await generateCode())) {
		log("\n❌ 生成失败", "red");
		process.exit(1);
	}
	if (!(await compileAcf())) {
		log("\n❌ 编译失败", "red");
		process.exit(1);
	}
	if (!(await pushToWordPress())) {
		log("\n⚠️  推送失败，继续...", "yellow");
	}
	if (!(await downloadSchema())) {
		log("\n❌ Schema 下载失败", "red");
		process.exit(1);
	}
	if (!(await runCodegen())) {
		log("\n❌ Codegen 失败", "red");
		process.exit(1);
	}

	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	console.log(
		`\n${c.green}✅ 同步完成！${c.reset} ${c.dim}(${elapsed}s)${c.reset}\n`
	);
}

main().catch((error) => {
	log(`\n❌ 错误: ${error}`, "red");
	process.exit(1);
});
