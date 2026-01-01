/**
 * Step 7: Sync i18n configuration
 */

import { rmSync } from "node:fs";
import { TOTAL_STEPS } from "../config";
import { run, step } from "../utils";

export async function syncI18n(): Promise<boolean> {
	step(7, TOTAL_STEPS, "同步 i18n 配置...");
	const result = await run("bun", ["scripts/sync-i18n.ts"]);

	// Clear Intlayer cache to regenerate types with updated requiredLocales
	try {
		rmSync(".intlayer", { recursive: true, force: true });
	} catch {
		// Ignore if directory doesn't exist
	}

	return result;
}
