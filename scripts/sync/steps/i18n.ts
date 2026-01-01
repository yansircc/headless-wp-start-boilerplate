/**
 * Step 7: Sync i18n configuration
 */

import { TOTAL_STEPS } from "../config";
import { run, step } from "../utils";

export async function syncI18n(): Promise<boolean> {
	step(7, TOTAL_STEPS, "同步 i18n 配置...");
	return await run("bun", ["scripts/sync-i18n.ts"]);
}
