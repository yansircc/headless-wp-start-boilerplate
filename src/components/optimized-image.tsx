/**
 * OptimizedImage Component
 *
 * A drop-in replacement for <img> that automatically optimizes images
 * using Cloudflare Image Resizing.
 *
 * Features:
 * - Auto-generates srcSet for responsive images
 * - Format negotiation (AVIF > WebP > original)
 * - loading="lazy" by default, fetchpriority="high" when priority={true}
 * - Development fallback (direct URLs when not on Cloudflare)
 * - Long-term caching (1 year, immutable)
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src={post.featuredImage.node.sourceUrl}
 *   alt={post.featuredImage.node.altText}
 *   width={600}
 *   height={400}
 *   priority // For above-the-fold hero images
 * />
 * ```
 */

import {
	buildOptimizedImageUrl,
	buildSrcSet,
	type ImageTransformOptions,
} from "@/lib/image";

export interface OptimizedImageProps
	extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
	/** Original image URL from WordPress */
	src: string | undefined | null;
	/** Alt text (required for accessibility) */
	alt: string;
	/** Display width in pixels */
	width: number;
	/** Display height in pixels */
	height: number;
	/** Resize behavior */
	fit?: ImageTransformOptions["fit"];
	/** Image quality (1-100, default 80) */
	quality?: number;
	/** If true, use fetchpriority="high" for LCP optimization */
	priority?: boolean;
	/** Responsive sizes attribute */
	sizes?: string;
	/** Enable responsive srcSet generation (default: true) */
	responsive?: boolean;
}

export function OptimizedImage({
	src,
	alt,
	width,
	height,
	fit = "cover",
	quality = 80,
	priority = false,
	sizes,
	responsive = true,
	className,
	...props
}: OptimizedImageProps) {
	// Handle missing src
	if (!src) {
		return null;
	}

	// Skip optimization for non-http URLs (data:, blob:, etc.)
	const shouldOptimize = src.startsWith("http");

	// Build optimized URL
	const optimizedSrc = shouldOptimize
		? buildOptimizedImageUrl(src, { width, height, fit, quality })
		: src;

	// Build srcSet for responsive images
	const srcSet =
		responsive && shouldOptimize
			? buildSrcSet(src, width, { fit, quality })
			: undefined;

	// Default sizes based on width if not provided
	const defaultSizes = sizes || `(max-width: ${width}px) 100vw, ${width}px`;

	// Build props conditionally to avoid undefined values
	const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = {
		alt,
		className,
		decoding: "async",
		height,
		loading: priority ? "eager" : "lazy",
		src: optimizedSrc,
		width,
		...props,
	};

	// Only add these props when they have values
	if (priority) {
		imgProps.fetchPriority = "high";
	}
	if (srcSet) {
		imgProps.srcSet = srcSet;
		imgProps.sizes = defaultSizes;
	}

	// biome-ignore lint/a11y/useAltText: alt is always provided via imgProps
	// biome-ignore lint/correctness/useImageSize: width/height are always provided via imgProps
	return <img {...imgProps} />;
}
