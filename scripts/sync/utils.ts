/**
 * Sync Script Utilities
 */

import { spawn } from "bun";

// ============================================
// Console Colors
// ============================================

export const c = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
} as const;

export type ColorKey = keyof typeof c;

// ============================================
// Logging Functions
// ============================================

export function log(msg: string, color: ColorKey = "reset"): void {
	console.log(`${c[color]}${msg}${c.reset}`);
}

export function step(num: number, total: number, msg: string): void {
	console.log(`\n${c.cyan}[${num}/${total}]${c.reset} ${msg}`);
}

// ============================================
// Process Runner
// ============================================

export async function run(
	cmd: string,
	args: string[],
	options?: { silent?: boolean }
): Promise<boolean> {
	if (!options?.silent) {
		log(`  ${c.dim}$ ${cmd} ${args.join(" ")}${c.reset}`, "dim");
	}
	const proc = spawn([cmd, ...args], { stdout: "inherit", stderr: "inherit" });
	return (await proc.exited) === 0;
}
