import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {
			// Deprecated API - intentionally empty
		},
		removeListener: () => {
			// Deprecated API - intentionally empty
		},
		addEventListener: () => {
			// Mock implementation - intentionally empty
		},
		removeEventListener: () => {
			// Mock implementation - intentionally empty
		},
		dispatchEvent: () => false,
	}),
});

// Mock scrollTo
Object.defineProperty(window, "scrollTo", {
	writable: true,
	value: () => {
		// Mock implementation - intentionally empty
	},
});

// Set React testing environment
// @ts-expect-error - global type
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
