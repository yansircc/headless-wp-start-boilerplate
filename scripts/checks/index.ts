/**
 * Check Registry
 *
 * Exports all available checks for checkall.ts
 */

// Content locales check
export { runContentLocalesCheck } from "./content-locales";
// Fonts validation check
export { runFontsValidationCheck } from "./fonts-validation";
// Generated files checks
export {
	runGeneratedFilesExistCheck,
	runGeneratedFilesNotModifiedCheck,
} from "./generated-files";
// GraphQL fragments check
export { runFragmentUsageCheck } from "./graphql-fragments";
// i18n check
export { runI18nCheck } from "./i18n";
// SEO validation checks
export { runSeoValidationChecks } from "./seo-validation";
// Sitemap validation check
export { runSitemapValidationCheck } from "./sitemap-validation";
export type { Check, CheckResult } from "./types";
export { printCheck, printSkipped, printWarning } from "./types";
