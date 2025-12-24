/**
 * Step 8: Output Smart Hints
 */

import { existsSync } from "node:fs";
import { TOTAL_STEPS } from "../config";
import type { DiscoveredDefinitions } from "../types";
import { c, log, step } from "../utils";

export function outputSmartHints(definitions: DiscoveredDefinitions): void {
	step(8, TOTAL_STEPS, "检测前端实现状态...");

	const missing: string[] = [];

	// Check for missing GraphQL queries
	for (const { config } of definitions.postTypes) {
		const postType = config.post_type;
		// Skip built-in post type
		if (postType === "post") {
			continue;
		}

		const queryPath = `./src/graphql/${postType}s/queries.graphql`;
		if (!existsSync(queryPath)) {
			missing.push(`Post Type "${postType}": 缺少 GraphQL 查询 (${queryPath})`);
		}
	}

	// Check for missing taxonomy routes
	for (const { config } of definitions.taxonomies) {
		const taxonomy = config.taxonomy;
		const parentPostType = config.object_type[0];

		// Check for routes (simplified check)
		const routePath = `./src/routes/{-$locale}/${parentPostType}s/categories`;
		if (!existsSync(routePath)) {
			missing.push(`Taxonomy "${taxonomy}": 缺少路由 (${routePath}/)`);
		}
	}

	if (missing.length === 0) {
		log("  ✓ 所有定义都有对应的前端实现", "green");
	} else {
		console.log(`\n${c.yellow}📋 检测到以下内容需要前端实现：${c.reset}\n`);
		for (const item of missing) {
			console.log(`  ${c.yellow}⚠${c.reset} ${item}`);
		}
		console.log(`
${c.blue}💡 下一步：${c.reset}
   告诉 AI: "${c.cyan}帮我实现 [content-type] 的前端路由${c.reset}"
   参考: ${c.dim}.claude/CLAUDE.md → "Creating a New Content Type"${c.reset}
`);
	}
}
