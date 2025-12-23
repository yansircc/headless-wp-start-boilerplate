import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const isProduction = process.env.NODE_ENV === "production";

const config = defineConfig({
	plugins: [
		// Cloudflare Workers deployment support (only in production build)
		// Dev mode uses Node.js runtime for better compatibility
		...(isProduction
			? [
					(await import("@cloudflare/vite-plugin")).cloudflare({
						viteEnvironment: { name: "ssr" },
					}),
				]
			: []),
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
