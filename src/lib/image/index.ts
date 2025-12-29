/**
 * Image Optimization Module
 *
 * Provides utilities for image URL optimization using Cloudflare Image Resizing.
 * Images are transformed on-the-fly at the edge for optimal performance.
 *
 * @example
 * ```tsx
 * import { buildOptimizedImageUrl, isAllowedImageSource } from "@/lib/image";
 *
 * const optimizedUrl = buildOptimizedImageUrl(imageUrl, { width: 500, format: "auto" });
 * ```
 */

import { env } from "@/env";

/**
 * Image transformation options
 */
export type ImageTransformOptions = {
	/** Target width in pixels */
	width?: number;
	/** Target height in pixels */
	height?: number;
	/** Resize behavior */
	fit?: "cover" | "contain" | "scale-down" | "crop" | "pad";
	/** Image quality (1-100) */
	quality?: number;
	/** Output format */
	format?: "auto" | "avif" | "webp" | "jpeg" | "png";
};

/**
 * Get WordPress base URL for image validation
 */
export function getWpBaseUrl(): string {
	if (env.WP_URL) {
		return env.WP_URL;
	}
	try {
		const url = new URL(env.GRAPHQL_ENDPOINT);
		return `${url.protocol}//${url.host}`;
	} catch {
		return "";
	}
}

/**
 * Check if an image URL is from an allowed WordPress domain
 *
 * @param imageUrl - The URL to validate
 * @returns true if the URL is from the WordPress domain
 */
export function isAllowedImageSource(imageUrl: string): boolean {
	if (!imageUrl) {
		return false;
	}

	try {
		const url = new URL(imageUrl);
		const wpBaseUrl = getWpBaseUrl();
		if (!wpBaseUrl) {
			return false;
		}

		const wpUrl = new URL(wpBaseUrl);
		return url.hostname === wpUrl.hostname;
	} catch {
		return false;
	}
}

/**
 * Build optimized image URL using our image API
 *
 * In production, this creates a URL to our /api/image endpoint which
 * uses Cloudflare Image Resizing for on-the-fly optimization.
 *
 * In development, returns the original URL (no CF image resizing available).
 *
 * @param src - Original image URL
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function buildOptimizedImageUrl(
	src: string,
	options: ImageTransformOptions = {}
): string {
	// In development, return original URL (no CF image resizing)
	if (import.meta.env.DEV) {
		return src;
	}

	// Validate URL
	if (!src?.startsWith("http")) {
		return src;
	}

	// Build query params
	const params = new URLSearchParams();
	params.set("src", src);

	if (options.width) {
		params.set("w", String(options.width));
	}
	if (options.height) {
		params.set("h", String(options.height));
	}
	if (options.fit) {
		params.set("fit", options.fit);
	}
	if (options.quality) {
		params.set("q", String(options.quality));
	}
	if (options.format) {
		params.set("f", options.format);
	}

	return `/api/image?${params.toString()}`;
}

/**
 * Generate srcSet for responsive images
 *
 * @param src - Original image URL
 * @param baseWidth - Base display width
 * @param options - Additional transformation options
 * @returns srcSet string for responsive images
 */
export function buildSrcSet(
	src: string,
	baseWidth: number,
	options: Omit<ImageTransformOptions, "width"> = {}
): string {
	// In development, return simple srcSet with original URL
	if (import.meta.env.DEV) {
		return `${src} ${baseWidth}w`;
	}

	const scales = [0.5, 1, 1.5, 2];

	return scales
		.map((scale) => {
			const width = Math.round(baseWidth * scale);
			const url = buildOptimizedImageUrl(src, { ...options, width });
			return `${url} ${width}w`;
		})
		.join(", ");
}

/**
 * Default sizes attribute for common layouts
 */
export const defaultSizes = {
	/** Full-width on mobile, contained on desktop */
	fullWidth: "(max-width: 768px) 100vw, 1200px",
	/** Half-width on mobile, quarter on desktop */
	card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
	/** Thumbnail size */
	thumbnail: "150px",
} as const;
