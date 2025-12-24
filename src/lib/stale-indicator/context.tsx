/**
 * Stale Indicator Context
 *
 * Tracks whether the app is serving stale (cached) data
 * due to WordPress being unavailable or data being old.
 *
 * Only shows warning in development mode.
 */

import { createContext, type ReactNode, useContext, useState } from "react";

type StaleState = {
	isStale: boolean;
	age: number; // milliseconds since data was last updated
	source: "memory" | "kv" | "origin";
};

type StaleIndicatorContextValue = {
	state: StaleState;
	setStale: (state: Partial<StaleState>) => void;
	clearStale: () => void;
};

const StaleIndicatorContext = createContext<StaleIndicatorContextValue | null>(
	null
);

const initialState: StaleState = {
	isStale: false,
	age: 0,
	source: "origin",
};

export function StaleIndicatorProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<StaleState>(initialState);

	const setStale = (newState: Partial<StaleState>) => {
		setState((prev) => ({ ...prev, ...newState }));
	};

	const clearStale = () => {
		setState(initialState);
	};

	return (
		<StaleIndicatorContext.Provider value={{ state, setStale, clearStale }}>
			{children}
		</StaleIndicatorContext.Provider>
	);
}

export function useStaleIndicator() {
	const context = useContext(StaleIndicatorContext);
	if (!context) {
		throw new Error(
			"useStaleIndicator must be used within StaleIndicatorProvider"
		);
	}
	return context;
}

/**
 * Format age in human-readable format
 */
export function formatAge(ageMs: number): string {
	const seconds = Math.floor(ageMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return `${days} day${days > 1 ? "s" : ""} ago`;
	}
	if (hours > 0) {
		return `${hours} hour${hours > 1 ? "s" : ""} ago`;
	}
	if (minutes > 0) {
		return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
	}
	return "just now";
}
