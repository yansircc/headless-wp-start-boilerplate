/**
 * Image Optimization API Endpoint
 *
 * Proxies and optimizes images using Cloudflare Image Resizing.
 *
 * GET /api/image?src=<url>&w=<width>&h=<height>&fit=<fit>&q=<quality>&f=<format>
 *
 * Query Parameters:
 * - src: Original image URL (required)
 * - w: Target width in pixels
 * - h: Target height in pixels
 * - fit: Resize behavior (cover, contain, scale-down, crop, pad)
 * - q: Quality (1-100, default 80)
 * - f: Format (auto, avif, webp, jpeg, png)
 *
 * Cloudflare Image Resizing is used for transformation when available.
 * Falls back to proxying the original image in development.
 */

import { createFileRoute } from "@tanstack/react-router";
import { isAllowedImageSource } from "@/lib/image";

// Cache headers for optimized images (1 year, immutable)
const CACHE_HEADERS = {
	"Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
};

// Regex patterns for format detection (top-level for performance)
const AVIF_REGEX = /image\/avif/;
const WEBP_REGEX = /image\/webp/;

// Type for Cloudflare image options
type CloudflareImageOptions = {
	width?: number;
	height?: number;
	fit?: "cover" | "contain" | "scale-down" | "crop" | "pad";
	quality?: number;
	format?: "auto" | "avif" | "webp" | "jpeg" | "png";
};

/**
 * Detect best image format from Accept header
 */
function detectBestFormat(accept: string): CloudflareImageOptions["format"] {
	if (AVIF_REGEX.test(accept)) {
		return "avif";
	}
	if (WEBP_REGEX.test(accept)) {
		return "webp";
	}
	return;
}

/**
 * Create a cached image response
 */
function createImageResponse(
	body: ReadableStream<Uint8Array> | null,
	contentType: string | null
): Response {
	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": contentType || "image/jpeg",
			...CACHE_HEADERS,
		},
	});
}

/**
 * Build Cloudflare Image options from URL parameters
 */
function buildCfImageOptions(
	params: URLSearchParams,
	acceptHeader: string
): CloudflareImageOptions {
	const width = params.get("w");
	const height = params.get("h");
	const fit = params.get("fit") || "cover";
	const quality = params.get("q") || "80";
	const format = params.get("f") || "auto";

	const options: CloudflareImageOptions = {
		fit: fit as CloudflareImageOptions["fit"],
		quality: Number.parseInt(quality, 10),
	};

	if (width) {
		options.width = Number.parseInt(width, 10);
	}
	if (height) {
		options.height = Number.parseInt(height, 10);
	}

	// Handle format negotiation
	if (format !== "auto") {
		options.format = format as CloudflareImageOptions["format"];
	} else {
		const detectedFormat = detectBestFormat(acceptHeader);
		if (detectedFormat) {
			options.format = detectedFormat;
		}
	}

	return options;
}

/**
 * Fetch image with fallback
 */
async function fetchImageWithFallback(
	src: string,
	cfImageOptions: CloudflareImageOptions,
	acceptHeader: string
): Promise<Response> {
	const response = await fetch(src, {
		headers: {
			Accept: acceptHeader || "image/*",
			"User-Agent": "Headless-WP-Image-Proxy",
		},
		// @ts-expect-error - cf.image is Cloudflare-specific
		cf: { image: cfImageOptions },
	});

	if (response.ok) {
		return createImageResponse(
			response.body,
			response.headers.get("Content-Type")
		);
	}

	// Fallback to direct fetch
	console.warn(
		`[Image API] CF Image Resizing failed for ${src}: ${response.status}`
	);
	const fallbackResponse = await fetch(src);
	if (!fallbackResponse.ok) {
		return new Response("Image not found", { status: 404 });
	}
	return createImageResponse(
		fallbackResponse.body,
		fallbackResponse.headers.get("Content-Type")
	);
}

export const Route = createFileRoute("/api/image")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const src = url.searchParams.get("src");

				if (!src) {
					return new Response("Missing src parameter", { status: 400 });
				}
				if (!isAllowedImageSource(src)) {
					return new Response("Image source not allowed", { status: 403 });
				}

				const acceptHeader = request.headers.get("Accept") || "";
				const cfImageOptions = buildCfImageOptions(
					url.searchParams,
					acceptHeader
				);

				try {
					return await fetchImageWithFallback(
						src,
						cfImageOptions,
						acceptHeader
					);
				} catch (error) {
					console.error(`[Image API] Error processing ${src}:`, error);
					return new Response("Image processing error", { status: 500 });
				}
			},
		},
	},
});
