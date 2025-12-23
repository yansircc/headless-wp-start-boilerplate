import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

export { default as userEvent } from "@testing-library/user-event";

/**
 * Create a fresh QueryClient for each test
 */
export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

/**
 * Wrapper component that provides all necessary providers
 */
function AllProviders({ children }: { children: ReactNode }) {
	const queryClient = createTestQueryClient();

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

/**
 * Custom render function that wraps components with providers
 */
export function renderWithProviders(
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">
) {
	// Import dynamically to avoid the lint issue with exported imports
	const userEventModule = require("@testing-library/user-event");
	return {
		user: userEventModule.default.setup(),
		...render(ui, { wrapper: AllProviders, ...options }),
	};
}

/**
 * Re-export everything from testing-library
 */
export * from "@testing-library/react";
