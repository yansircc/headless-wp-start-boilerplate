import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { GlobalError } from "./components/error-boundary";
import { GlobalLoading } from "./components/loading";
import { NotFoundPage } from "./components/not-found";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();

	const router = createRouter({
		routeTree,
		context: { ...rqContext },
		defaultPreload: "intent",
		// Global error handling
		defaultErrorComponent: GlobalError,
		// Global loading state for route transitions
		defaultPendingComponent: GlobalLoading,
		// Global 404 page
		defaultNotFoundComponent: NotFoundPage,
		// Show pending component after 200ms to avoid flash
		defaultPendingMs: 200,
		// Keep pending visible for at least 300ms to avoid jarring transitions
		defaultPendingMinMs: 300,
		Wrap: (props: { children: React.ReactNode }) => (
			<TanstackQuery.Provider {...rqContext}>
				{props.children}
			</TanstackQuery.Provider>
		),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	return router;
};
