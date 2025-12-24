/**
 * Step 6: Run codegen
 */

import { TOTAL_STEPS } from "../config";
import { c, run, step } from "../utils";

export async function runCodegen(): Promise<boolean> {
	step(6, TOTAL_STEPS, "生成 TypeScript 类型...");
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
