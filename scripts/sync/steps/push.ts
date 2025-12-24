/**
 * Step 4: Push to WordPress
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ACF_SYNC_KEY, COMPILED_DIR, TOTAL_STEPS, WP_URL } from "../config";
import { pushResponseSchema } from "../types";
import { log, step } from "../utils";

export async function pushToWordPress(): Promise<boolean> {
	step(4, TOTAL_STEPS, "推送到 WordPress...");

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
		const response = await fetch(`${WP_URL}/wp-json/headless-bridge/v1/push`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Headless-Bridge-Key": ACF_SYNC_KEY,
			},
			body: JSON.stringify({ files }),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const json: unknown = await response.json();
		const result = pushResponseSchema.parse(json);

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
