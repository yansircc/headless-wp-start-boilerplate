import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cache, cacheKeys, invalidateByWebhook } from "./index";

describe("MemoryCache", () => {
	beforeEach(() => {
		cache.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("get/set", () => {
		it("should store and retrieve values", () => {
			cache.set("test-key", { foo: "bar" });
			expect(cache.get("test-key")).toEqual({ foo: "bar" });
		});

		it("should return null for non-existent keys", () => {
			expect(cache.get("non-existent")).toBeNull();
		});

		it("should handle different data types", () => {
			cache.set("string", "hello");
			cache.set("number", 42);
			cache.set("array", [1, 2, 3]);
			cache.set("object", { nested: { value: true } });

			expect(cache.get("string")).toBe("hello");
			expect(cache.get("number")).toBe(42);
			expect(cache.get("array")).toEqual([1, 2, 3]);
			expect(cache.get("object")).toEqual({ nested: { value: true } });
		});

		it("should overwrite existing values", () => {
			cache.set("key", "first");
			cache.set("key", "second");
			expect(cache.get("key")).toBe("second");
		});
	});

	describe("TTL expiration", () => {
		it("should expire entries after TTL", () => {
			vi.useFakeTimers();
			cache.set("expiring", "value", 1000); // 1 second TTL

			expect(cache.get("expiring")).toBe("value");

			vi.advanceTimersByTime(1001);
			expect(cache.get("expiring")).toBeNull();
		});

		it("should use default TTL when not specified", () => {
			vi.useFakeTimers();
			cache.set("default-ttl", "value");

			// Should still exist after 59 minutes
			vi.advanceTimersByTime(59 * 60 * 1000);
			expect(cache.get("default-ttl")).toBe("value");

			// Should expire after 1 hour
			vi.advanceTimersByTime(2 * 60 * 1000);
			expect(cache.get("default-ttl")).toBeNull();
		});

		it("should delete expired entry on access", () => {
			vi.useFakeTimers();
			cache.set("auto-delete", "value", 100);

			vi.advanceTimersByTime(101);
			cache.get("auto-delete");

			expect(cache.has("auto-delete")).toBe(false);
		});
	});

	describe("delete", () => {
		it("should delete existing key and return true", () => {
			cache.set("to-delete", "value");
			expect(cache.delete("to-delete")).toBe(true);
			expect(cache.get("to-delete")).toBeNull();
		});

		it("should return false for non-existent key", () => {
			expect(cache.delete("non-existent")).toBe(false);
		});
	});

	describe("has", () => {
		it("should return true for existing key", () => {
			cache.set("exists", "value");
			expect(cache.has("exists")).toBe(true);
		});

		it("should return false for non-existent key", () => {
			expect(cache.has("non-existent")).toBe(false);
		});
	});

	describe("clear", () => {
		it("should remove all entries", () => {
			cache.set("key1", "value1");
			cache.set("key2", "value2");
			cache.set("key3", "value3");

			cache.clear();

			expect(cache.get("key1")).toBeNull();
			expect(cache.get("key2")).toBeNull();
			expect(cache.get("key3")).toBeNull();
			expect(cache.stats().size).toBe(0);
		});
	});

	describe("stats", () => {
		it("should return correct size and keys", () => {
			cache.set("a", 1);
			cache.set("b", 2);
			cache.set("c", 3);

			const stats = cache.stats();
			expect(stats.size).toBe(3);
			expect(stats.keys).toContain("a");
			expect(stats.keys).toContain("b");
			expect(stats.keys).toContain("c");
		});

		it("should return empty stats when cache is empty", () => {
			const stats = cache.stats();
			expect(stats.size).toBe(0);
			expect(stats.keys).toEqual([]);
		});
	});
});

describe("cacheKeys", () => {
	describe("products", () => {
		it("should generate products list key with default locale", () => {
			expect(cacheKeys.productsList()).toBe("products:list:en");
		});

		it("should generate products list key with specified locale", () => {
			expect(cacheKeys.productsList("zh")).toBe("products:list:zh");
		});

		it("should generate product by slug key with default locale", () => {
			expect(cacheKeys.productBySlug("my-product")).toBe(
				"products:slug:my-product:en"
			);
		});

		it("should generate product by id key with default locale", () => {
			expect(cacheKeys.productById(123)).toBe("products:id:123:en");
		});
	});

	describe("posts", () => {
		it("should generate posts list key with default locale", () => {
			expect(cacheKeys.postsList()).toBe("posts:list:en");
		});

		it("should generate post by slug key with default locale", () => {
			expect(cacheKeys.postBySlug("my-post")).toBe("posts:slug:my-post:en");
		});

		it("should generate post by id key with default locale", () => {
			expect(cacheKeys.postById(456)).toBe("posts:id:456:en");
		});
	});

	describe("homepage", () => {
		it("should generate homepage key with default locale", () => {
			expect(cacheKeys.homepage()).toBe("homepage:data:en");
		});

		it("should generate homepage key with specified locale", () => {
			expect(cacheKeys.homepage("ja")).toBe("homepage:data:ja");
		});
	});
});

describe("invalidateByWebhook", () => {
	beforeEach(() => {
		cache.clear();
		// Pre-populate cache with test data (keys now include locale)
		cache.set(cacheKeys.productsList(), []);
		cache.set(cacheKeys.productBySlug("test-product"), {});
		cache.set(cacheKeys.productById(1), {});
		cache.set(cacheKeys.postsList(), []);
		cache.set(cacheKeys.postBySlug("test-post"), {});
		cache.set(cacheKeys.postById(2), {});
		cache.set(cacheKeys.homepage(), {});
	});

	it("should invalidate product-related caches", () => {
		const result = invalidateByWebhook({
			action: "update",
			post_type: "product",
			post_id: 1,
			slug: "test-product",
		});

		expect(result.invalidated).toContain("products:slug:test-product:en");
		expect(result.invalidated).toContain("products:id:1:en");
		expect(result.invalidated).toContain("products:list:en");
		expect(result.invalidated).toContain("homepage:data:en");
		expect(result.count).toBe(4);

		// Verify cache entries are deleted
		expect(cache.get(cacheKeys.productBySlug("test-product"))).toBeNull();
		expect(cache.get(cacheKeys.productById(1))).toBeNull();
		expect(cache.get(cacheKeys.productsList())).toBeNull();
	});

	it("should invalidate post-related caches", () => {
		const result = invalidateByWebhook({
			action: "update",
			post_type: "post",
			post_id: 2,
			slug: "test-post",
		});

		expect(result.invalidated).toContain("posts:slug:test-post:en");
		expect(result.invalidated).toContain("posts:id:2:en");
		expect(result.invalidated).toContain("posts:list:en");
		expect(result.invalidated).toContain("homepage:data:en");
		expect(result.count).toBe(4);
	});

	it("should always invalidate homepage", () => {
		const result = invalidateByWebhook({
			action: "create",
			post_type: "page", // Unknown type
			post_id: 99,
			slug: "some-page",
		});

		expect(result.invalidated).toContain("homepage:data:en");
		expect(cache.get(cacheKeys.homepage())).toBeNull();
	});

	it("should handle missing slug gracefully", () => {
		const result = invalidateByWebhook({
			action: "delete",
			post_type: "product",
			post_id: 1,
			slug: "",
		});

		// Should still invalidate by id and list
		expect(result.invalidated).toContain("products:id:1:en");
		expect(result.invalidated).toContain("products:list:en");
	});
});
