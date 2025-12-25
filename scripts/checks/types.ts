/**
 * Shared types for checkall checks
 */

export type CheckResult = {
	passed: boolean;
	errors: string[];
	warnings?: string[];
};

export type CheckFunction = () => CheckResult | Promise<CheckResult>;

export type Check = {
	name: string;
	run: CheckFunction;
	/** If true, skip this check when condition is not met (e.g., no WordPress) */
	optional?: boolean;
};

/**
 * Print a check result line
 */
export function printCheck(
	name: string,
	passed: boolean,
	detail?: string
): void {
	const icon = passed ? "\u2713" : "\u2717";
	const color = passed ? "\x1b[32m" : "\x1b[31m";
	const reset = "\x1b[0m";
	const suffix = detail ? ` ${"\x1b[2m"}${detail}${reset}` : "";
	console.log(`  ${color}${icon}${reset} ${name}${suffix}`);
}

/**
 * Print a skipped check
 */
export function printSkipped(name: string, reason: string): void {
	const reset = "\x1b[0m";
	const dim = "\x1b[2m";
	console.log(`  ${dim}\u2298 ${name} (skipped: ${reason})${reset}`);
}

/**
 * Print a warning check (passed but with warnings)
 */
export function printWarning(name: string, count: number): void {
	const reset = "\x1b[0m";
	const yellow = "\x1b[33m";
	console.log(
		`  ${yellow}\u26A0${reset} ${name} ${"\x1b[2m"}(${count} warning${count > 1 ? "s" : ""})${reset}`
	);
}
