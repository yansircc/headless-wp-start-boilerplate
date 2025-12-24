#!/usr/bin/env bun

/**
 * KV Snapshot Script
 * 在构建时从 WordPress 获取所有内容并存储到 Cloudflare KV
 *
 * Usage: bun snapshot
 *
 * 流程：
 *   1. 从 wrangler.jsonc 读取 KV 配置
 *   2. 连接 WordPress GraphQL
 *   3. 为每个语言获取所有内容
 *   4. 使用 wrangler 写入 KV
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/**
 * Read KV namespace ID from wrangler.jsonc
 */
function getKVNamespaceId(): string | undefined {
	const configPath = "wrangler.jsonc";

	if (!existsSync(configPath)) {
		return;
	}

	try {
		const content = readFileSync(configPath, "utf-8");
		// Remove comments from JSONC (simple approach: remove // comments)
		const jsonContent = content
			.split("\n")
			.map((line) => {
				const commentIndex = line.indexOf("//");
				return commentIndex >= 0 ? line.slice(0, commentIndex) : line;
			})
			.join("\n");

		const config = JSON.parse(jsonContent);
		const kvNamespaces = config.kv_namespaces as
			| Array<{ binding: string; id: string }>
			| undefined;

		if (!kvNamespaces) {
			return;
		}

		const fallbackKv = kvNamespaces.find((ns) => ns.binding === "FALLBACK_KV");
		return fallbackKv?.id;
	} catch (error) {
		console.error("Failed to parse wrangler.jsonc:", error);
		return;
	}
}

// Colors
const c = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	dim: "\x1b[2m",
};

function log(msg: string, color: keyof typeof c = "reset") {
	console.log(`${c[color]}${msg}${c.reset}`);
}

function logStep(step: number, total: number, msg: string) {
	console.log(`${c.cyan}[${step}/${total}]${c.reset} ${msg}`);
}

type KVEntry = {
	key: string;
	value: unknown;
};

type SnapshotContext = {
	entries: KVEntry[];
	errors: string[];
	currentStep: number;
	totalSteps: number;
};

/**
 * Fetch homepage data for a locale
 */
async function fetchHomepage(
	ctx: SnapshotContext,
	locale: string,
	deps: SnapshotDeps
): Promise<void> {
	ctx.currentStep += 1;
	logStep(
		ctx.currentStep,
		ctx.totalSteps,
		`Fetching homepage data (${locale})`
	);

	const language = deps.toLanguageFilter(locale);

	try {
		const homepage = await deps.graphqlRequest(deps.HomepageDataDocument, {
			language,
			postsFirst: deps.QUERY_LIMITS.homepage.posts,
			productsFirst: deps.QUERY_LIMITS.homepage.products,
		});
		ctx.entries.push({
			key: deps.cacheKeys.homepage(locale),
			value: {
				data: {
					posts: homepage.posts?.nodes || [],
					products: homepage.products?.nodes || [],
					postsHasMore: homepage.posts?.pageInfo?.hasNextPage,
					productsHasMore: homepage.products?.pageInfo?.hasNextPage,
				},
				meta: { updatedAt: Date.now(), source: "build" },
			},
		});
		log(
			`  ✓ Homepage: ${homepage.posts?.nodes?.length ?? 0} posts, ${homepage.products?.nodes?.length ?? 0} products`,
			"green"
		);
	} catch (error) {
		const msg = `Homepage (${locale}): ${error}`;
		ctx.errors.push(msg);
		log(`  ✗ ${msg}`, "red");
	}
}

/**
 * Fetch products for a locale
 */
async function fetchProducts(
	ctx: SnapshotContext,
	locale: string,
	deps: SnapshotDeps
): Promise<void> {
	ctx.currentStep += 1;
	logStep(ctx.currentStep, ctx.totalSteps, `Fetching products (${locale})`);

	const language = deps.toLanguageFilter(locale);
	const languageCode = deps.toLanguageCode(locale);

	try {
		const products = await deps.graphqlRequest(deps.ProductsListDocument, {
			first: deps.QUERY_LIMITS.list.products,
			language,
		});
		ctx.entries.push({
			key: deps.cacheKeys.productsList(locale),
			value: {
				data: products.products,
				meta: { updatedAt: Date.now(), source: "build" },
			},
		});
		log(
			`  ✓ Products list: ${products.products?.nodes?.length ?? 0} items`,
			"green"
		);

		// Individual products
		for (const product of products.products?.nodes ?? []) {
			if (product.slug) {
				try {
					const detail = await deps.graphqlRequest(deps.ProductBySlugDocument, {
						slug: product.slug,
						language: languageCode,
					});
					ctx.entries.push({
						key: deps.cacheKeys.productBySlug(product.slug, locale),
						value: {
							data: detail.product?.translation,
							meta: { updatedAt: Date.now(), source: "build" },
						},
					});
				} catch (error) {
					log(`  ⚠ Product ${product.slug}: ${error}`, "yellow");
				}
			}
		}
	} catch (error) {
		const msg = `Products (${locale}): ${error}`;
		ctx.errors.push(msg);
		log(`  ✗ ${msg}`, "red");
	}
}

/**
 * Fetch posts for a locale
 */
async function fetchPosts(
	ctx: SnapshotContext,
	locale: string,
	deps: SnapshotDeps
): Promise<void> {
	ctx.currentStep += 1;
	logStep(ctx.currentStep, ctx.totalSteps, `Fetching posts (${locale})`);

	const language = deps.toLanguageFilter(locale);
	const languageCode = deps.toLanguageCode(locale);

	try {
		const posts = await deps.graphqlRequest(deps.PostsListDocument, {
			first: deps.QUERY_LIMITS.list.posts,
			language,
		});
		ctx.entries.push({
			key: deps.cacheKeys.postsList(locale),
			value: {
				data: posts.posts,
				meta: { updatedAt: Date.now(), source: "build" },
			},
		});
		log(`  ✓ Posts list: ${posts.posts?.nodes?.length ?? 0} items`, "green");

		// Individual posts
		for (const post of posts.posts?.nodes ?? []) {
			if (post.slug) {
				try {
					const detail = await deps.graphqlRequest(deps.GetPostBySlugDocument, {
						id: post.slug,
						language: languageCode,
					});
					ctx.entries.push({
						key: deps.cacheKeys.postBySlug(post.slug, locale),
						value: {
							data: detail.post?.translation,
							meta: { updatedAt: Date.now(), source: "build" },
						},
					});
				} catch (error) {
					log(`  ⚠ Post ${post.slug}: ${error}`, "yellow");
				}
			}
		}
	} catch (error) {
		const msg = `Posts (${locale}): ${error}`;
		ctx.errors.push(msg);
		log(`  ✗ ${msg}`, "red");
	}
}

/**
 * Write entries to KV using wrangler
 */
function writeToKV(
	entries: KVEntry[],
	kvNamespaceId: string
): { written: number; failed: number } {
	log("\nWriting to KV...", "cyan");
	let written = 0;
	let failed = 0;

	for (const entry of entries) {
		const jsonValue = JSON.stringify(entry.value);

		const result = spawnSync(
			"wrangler",
			[
				"kv",
				"key",
				"put",
				"--namespace-id",
				kvNamespaceId,
				entry.key,
				jsonValue,
			],
			{ stdio: "pipe" }
		);

		if (result.status === 0) {
			written += 1;
		} else {
			failed += 1;
			const stderr = result.stderr?.toString() || "Unknown error";
			log(`  ✗ Failed to write ${entry.key}: ${stderr}`, "red");
		}
	}

	return { written, failed };
}

// Type for dependencies (to keep main function cleaner)
type SnapshotDeps = {
	graphqlRequest: typeof import("../src/lib/graphql").graphqlRequest;
	HomepageDataDocument: typeof import("../src/graphql/homepage/queries.generated").HomepageDataDocument;
	ProductsListDocument: typeof import("../src/graphql/products/queries.generated").ProductsListDocument;
	ProductBySlugDocument: typeof import("../src/graphql/products/queries.generated").ProductBySlugDocument;
	PostsListDocument: typeof import("../src/graphql/posts/queries.generated").PostsListDocument;
	GetPostBySlugDocument: typeof import("../src/graphql/posts/queries.generated").GetPostBySlugDocument;
	supportedLocales: readonly string[];
	toLanguageFilter: typeof import("../src/lib/i18n/language").toLanguageFilter;
	toLanguageCode: typeof import("../src/lib/i18n/language").toLanguageCode;
	cacheKeys: typeof import("../src/lib/cache").cacheKeys;
	QUERY_LIMITS: typeof import("../src/graphql/constants").QUERY_LIMITS;
};

async function main() {
	const kvNamespaceId = getKVNamespaceId();
	const isDryRun = process.argv.includes("--dry-run");
	const isCheck = process.argv.includes("--check");

	log("\n📸 KV Snapshot Script\n", "cyan");

	if (!kvNamespaceId) {
		log("Warning: FALLBACK_KV not configured in wrangler.jsonc", "yellow");
		log("  1. Run: wrangler kv:namespace create FALLBACK_KV", "dim");
		log("  2. Add the namespace ID to wrangler.jsonc kv_namespaces", "dim");

		if (isCheck) {
			log(
				"\n⚠️  Snapshot check skipped (no KV namespace configured)\n",
				"yellow"
			);
			process.exit(0);
		}
		log("\nSkipping snapshot (no KV namespace configured)\n", "yellow");
		process.exit(0);
	}

	// Import project modules
	const { graphqlRequest } = await import("../src/lib/graphql");
	const { HomepageDataDocument } = await import(
		"../src/graphql/homepage/queries.generated"
	);
	const { ProductsListDocument, ProductBySlugDocument } = await import(
		"../src/graphql/products/queries.generated"
	);
	const { PostsListDocument, GetPostBySlugDocument } = await import(
		"../src/graphql/posts/queries.generated"
	);
	const { supportedLocales, toLanguageFilter, toLanguageCode } = await import(
		"../src/lib/i18n/language"
	);
	const { cacheKeys } = await import("../src/lib/cache");
	const { QUERY_LIMITS } = await import("../src/graphql/constants");

	const deps: SnapshotDeps = {
		graphqlRequest,
		HomepageDataDocument,
		ProductsListDocument,
		ProductBySlugDocument,
		PostsListDocument,
		GetPostBySlugDocument,
		supportedLocales,
		toLanguageFilter,
		toLanguageCode,
		cacheKeys,
		QUERY_LIMITS,
	};

	const locales = supportedLocales;
	const ctx: SnapshotContext = {
		entries: [],
		errors: [],
		currentStep: 0,
		totalSteps: locales.length * 3, // homepage, products, posts per locale
	};

	log(`Locales: ${locales.join(", ")}`, "dim");
	log(`KV Namespace: ${kvNamespaceId}`, "dim");
	if (isDryRun) {
		log("Mode: Dry run (no writes)", "yellow");
	}
	console.log("");

	// Fetch data for each locale
	for (const locale of locales) {
		await fetchHomepage(ctx, locale, deps);
		await fetchProducts(ctx, locale, deps);
		await fetchPosts(ctx, locale, deps);
	}

	// Summary
	console.log("");
	log(`Total entries: ${ctx.entries.length}`, "cyan");

	if (ctx.errors.length > 0) {
		log(`Errors: ${ctx.errors.length}`, "red");
	}

	if (isDryRun) {
		log("\nDry run complete. No data written.", "yellow");
		console.log("Entries that would be written:");
		for (const entry of ctx.entries) {
			console.log(`  - ${entry.key}`);
		}
		process.exit(0);
	}

	if (isCheck) {
		if (ctx.errors.length > 0) {
			log("\n✗ Snapshot check failed with errors\n", "red");
			process.exit(1);
		}
		log("\n✓ Snapshot check passed\n", "green");
		process.exit(0);
	}

	// Write to KV
	const { written, failed } = writeToKV(ctx.entries, kvNamespaceId);

	console.log("");
	if (failed > 0) {
		log(`Written: ${written}, Failed: ${failed}`, "yellow");
	} else {
		log(`✓ All ${written} entries written to KV`, "green");
	}
	console.log("");

	process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
	log(`\nFatal error: ${error}`, "red");
	process.exit(1);
});
