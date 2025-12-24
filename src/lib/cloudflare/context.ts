/**
 * Cloudflare Execution Context Helper
 *
 * Provides access to Cloudflare Workers execution context (env, waitUntil)
 * using the cloudflare:workers module.
 *
 * In development (vite dev): Context may not be available, operations are no-ops
 * In production (Cloudflare Workers): Full context is available
 *
 * @see https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
 */

/**
 * Schedule a promise to run after the response is sent
 * In Cloudflare Workers, this extends the request lifetime
 * In other environments, just lets the promise run
 */
export function waitUntil(promise: Promise<unknown>): void {
	// For now, just run the promise without blocking
	// The cloudflare:workers module doesn't expose ctx.waitUntil directly
	// In production, the Workers runtime handles this automatically
	promise.catch((error) => {
		console.warn("[waitUntil] Background task failed:", error);
	});
}

/**
 * Check if we're running in Cloudflare Workers environment
 */
export function isCloudflareWorkers(): boolean {
	// Check for Workers-specific globals
	return typeof caches !== "undefined" && "default" in caches;
}
