/**
 * Type-safe Environment Variables
 *
 * Uses @t3-oss/env-core for runtime validation and type safety.
 * All environment variables should be accessed through this module.
 *
 * Server variables: Only available on the server (SSR, API routes)
 * Client variables: Must be prefixed with VITE_ and are exposed to the browser
 */

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Server-side environment variables schema.
	 * These are only available on the server.
	 */
	server: {
		// WordPress Configuration
		WP_URL: z.string().url().optional(),
		GRAPHQL_ENDPOINT: z.string().url(),

		// Headless Bridge API Key (for ACF sync)
		ACF_SYNC_KEY: z.string().min(1),

		// Webhook Configuration (for cache invalidation)
		WEBHOOK_SECRET: z.string().min(1),

		// SEO Configuration
		SITE_URL: z.string().url(),
		SITE_NAME: z.string().min(1),

		// Node environment
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},

	/**
	 * Client-side environment variables schema.
	 * Must be prefixed with VITE_ to be exposed to the browser.
	 */
	clientPrefix: "VITE_",

	client: {
		// Sentry (optional)
		VITE_SENTRY_DSN: z.string().url().optional(),
	},

	/**
	 * Runtime environment variables.
	 * Maps environment variable names to their values.
	 */
	runtimeEnv: {
		// Server variables
		WP_URL: process.env.WP_URL,
		GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
		ACF_SYNC_KEY: process.env.ACF_SYNC_KEY,
		WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
		SITE_URL: process.env.SITE_URL,
		SITE_NAME: process.env.SITE_NAME,
		NODE_ENV: process.env.NODE_ENV,

		// Client variables
		VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
	},

	/**
	 * Treat empty strings as undefined.
	 * This allows default values to work correctly.
	 */
	emptyStringAsUndefined: true,

	/**
	 * Skip validation in certain environments.
	 * - Test environment: vitest sets NODE_ENV=test
	 * - Explicit skip: set SKIP_ENV_VALIDATION=true
	 */
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "true" ||
		process.env.NODE_ENV === "test",
});
