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
		log("\n❌ 生成失败", "red");
		process.exit(1);
	}

	// Step 3: Compile ACF
	if (!(await compileAcf(definitions))) {
		log("\n❌ 编译失败", "red");
		process.exit(1);
	}

	// Step 4: Push to WordPress
	if (!(await pushToWordPress())) {
		log("\n⚠️  推送失败，继续...", "yellow");
	}

	// Step 5: Download Schema
	if (!(await downloadSchema())) {
		log("\n❌ Schema 下载失败", "red");
		process.exit(1);
	}

	// Step 6: Run codegen
	if (!(await runCodegen())) {
		log("\n❌ Codegen 失败", "red");
		process.exit(1);
	}

	// Step 7: Sync i18n
	if (!(await syncI18n())) {
		log("\n❌ i18n 同步失败", "red");
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
	log(`\n❌ 错误: ${error}`, "red");
	process.exit(1);
});
