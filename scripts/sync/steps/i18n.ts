/**
 * Step 7: Sync i18n configuration
 *
 * Syncs intlayer.config.ts from GraphQL LanguageCodeEnum.
 * Content files are validated by checkall (must have all locales, no [TODO:xx] placeholders).
 */

import { TOTAL_STEPS } from "../config";
import { run, step } from "../utils";

export async function syncI18n(): Promise<boolean> {
	step(7, TOTAL_STEPS, "同步 i18n 配置...");

	// Sync intlayer.config.ts (quiet + silent for clean output)
	return await run("bun", ["scripts/sync-i18n.ts", "--quiet"], {
		silent: true,
	});
}
