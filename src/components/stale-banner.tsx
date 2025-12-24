/**
 * Stale Data Warning Banner
 *
 * Displays a warning when serving cached data.
 * Only visible in development mode.
 */

import { formatAge, useStaleIndicator } from "@/lib/stale-indicator/context";

export function StaleBanner() {
	const { state } = useStaleIndicator();

	// Only show in development
	if (import.meta.env.PROD || !state.isStale) {
		return null;
	}

	return (
		<div className="fixed top-0 right-0 left-0 z-50 bg-yellow-400 px-4 py-2 text-center font-medium text-sm text-yellow-900">
			<span className="mr-2">Warning:</span>
			Showing cached data from {formatAge(state.age)}
			<span className="ml-2 text-yellow-700">
				(source: {state.source}, WordPress may be unavailable)
			</span>
		</div>
	);
}
