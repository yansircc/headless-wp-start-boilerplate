#!/usr/bin/env bun

/**
 * Sync Script
 * 一键同步 ACF 定义到 WordPress 并生成类型
 *
 * Usage: bun sync
 *
 * 流程：
 *   1. 自动发现 ACF 定义（Field Groups, Post Types, Taxonomies）
 *   2. 生成 GraphQL Fragment + Zod Schema
 *   3. 编译 ACF TypeScript → JSON
 *   4. 推送到 WordPress
 *   5. 下载最新 GraphQL Schema
 *   6. 运行 codegen 生成类型
 *   7. 同步 i18n 配置 (从 GraphQL LanguageCodeEnum → intlayer.config.ts)
 *   8. 输出智能提示（检测缺失的前端实现）
 */

import {
	c,
	compileAcf,
	discoverDefinitions,
	downloadSchema,
	generateCode,
	log,
	outputSmartHints,
	pushToWordPress,
	runCodegen,
	syncI18n,
} from "./sync/index";

async function main() {
	console.log(`\n${c.cyan}🔄 开始同步...${c.reset}`);
	const startTime = Date.now();

	// Step 1: Discover definitions
	const definitions = await discoverDefinitions();

	if (
		definitions.fieldGroups.length === 0 &&
		definitions.postTypes.length === 0 &&
		definitions.taxonomies.length === 0
	) {
		log("\n⚠️ 未发现任何 ACF 定义", "yellow");
		process.exit(0);
	}

	// Step 2: Generate code
	if (!(await generateCode(definitions))) {
		log("\n❌ 代码生成失败", "red");
		log("", "reset");
		log("Why: GraphQL Fragment 或 Zod Schema 生成过程中出错", "dim");
		log("", "reset");
		log("How: 检查以下常见问题:", "yellow");
		log("  1. ACF 字段定义语法是否正确 (src/acf/definitions/)", "dim");
		log("  2. 字段类型是否支持 (参考已有定义)", "dim");
		log("  3. 运行 `bun sync --verbose` 查看详细错误", "cyan");
		process.exit(1);
	}

	// Step 3: Compile ACF
	if (!(await compileAcf(definitions))) {
		log("\n❌ ACF 编译失败", "red");
		log("", "reset");
		log("Why: TypeScript ACF 定义无法编译为 JSON", "dim");
		log("", "reset");
		log("How: 检查以下常见问题:", "yellow");
		log("  1. TypeScript 语法错误 (运行 `bun lint`)", "dim");
		log("  2. 导入路径是否正确", "dim");
		log("  3. index.ts 是否正确导出 fieldGroup/postType/taxonomy", "dim");
		process.exit(1);
	}

	// Step 4: Push to WordPress
	if (!(await pushToWordPress())) {
		log("\n⚠️  推送失败，继续...", "yellow");
	}

	// Step 5: Download Schema
	if (!(await downloadSchema())) {
		log("\n❌ GraphQL Schema 下载失败", "red");
		log("", "reset");
		log("Why: 无法从 WordPress 获取最新的 GraphQL Schema", "dim");
		log("", "reset");
		log("How: 检查以下常见问题:", "yellow");
		log("  1. WordPress 是否运行中 (检查 GRAPHQL_ENDPOINT)", "dim");
		log("  2. WPGraphQL 插件是否激活", "dim");
		log("  3. 网络连接是否正常", "dim");
		log("  4. .env.local 中的 GRAPHQL_ENDPOINT 是否正确", "cyan");
		process.exit(1);
	}

	// Step 6: Run codegen
	if (!(await runCodegen())) {
		log("\n❌ GraphQL Codegen 失败", "red");
		log("", "reset");
		log("Why: 无法从 Schema 生成 TypeScript 类型", "dim");
		log("", "reset");
		log("How: 检查以下常见问题:", "yellow");
		log("  1. .graphql 文件语法是否正确", "dim");
		log("  2. 查询中引用的类型是否存在于 Schema", "dim");
		log("  3. Fragment 名称是否与查询匹配", "dim");
		log("  4. 运行 `bunx graphql-codegen --verbose` 查看详情", "cyan");
		process.exit(1);
	}

	// Step 7: Sync i18n
	if (!(await syncI18n())) {
		log("\n❌ i18n 同步失败", "red");
		log("", "reset");
		log("Why: 无法将 WordPress 语言配置同步到 intlayer.config.ts", "dim");
		log("", "reset");
		log("How: 检查以下常见问题:", "yellow");
		log("  1. GraphQL Schema 中是否有 LanguageCodeEnum", "dim");
		log("  2. WordPress Polylang 插件是否配置了语言", "dim");
		log("  3. 如果有孤立翻译，运行 `bun i18n:archive <locale>`", "cyan");
		log(
			"  4. 如果有存档翻译需要恢复，运行 `bun i18n:restore <locale>`",
			"cyan"
		);
		process.exit(1);
	}

	// Step 8: Output smart hints
	await outputSmartHints(definitions);

	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	console.log(
		`\n${c.green}✅ 同步完成！${c.reset} ${c.dim}(${elapsed}s)${c.reset}\n`
	);
}

main().catch((error) => {
	log(`\n❌ 意外错误: ${error}`, "red");
	log("", "reset");
	log("How: 如果问题持续，请尝试:", "yellow");
	log(
		"  1. 删除 node_modules 并重新安装: `rm -rf node_modules && bun install`",
		"dim"
	);
	log("  2. 检查 .env.local 配置是否完整", "dim");
	log("  3. 确保 WordPress 服务正在运行", "dim");
	process.exit(1);
});
