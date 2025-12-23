import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalError, RouteError } from "./error-boundary";

// Regex patterns (top-level for performance)
const UNEXPECTED_ERROR_PATTERN = /An unexpected error occurred/i;
const TRY_AGAIN_PATTERN = /try again/i;
const RETRY_PATTERN = /retry/i;
const ERROR_LOADING_PATTERN = /An error occurred while loading this content/i;
const TEST_ERROR_PATTERN = /Test error message/;

// Mock useRouter
const mockInvalidate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({
		invalidate: mockInvalidate,
	}),
}));

describe("GlobalError", () => {
	const mockReset = vi.fn();
	const testError = new Error("Test error message");

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render error message", () => {
		render(<GlobalError error={testError} reset={mockReset} />);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("should render helpful description", () => {
		render(<GlobalError error={testError} reset={mockReset} />);
		expect(screen.getByText(UNEXPECTED_ERROR_PATTERN)).toBeInTheDocument();
	});

	it("should render try again button", () => {
		render(<GlobalError error={testError} reset={mockReset} />);
		expect(
			screen.getByRole("button", { name: TRY_AGAIN_PATTERN })
		).toBeInTheDocument();
	});

	it("should call reset and invalidate on retry", async () => {
		const user = userEvent.setup();
		render(<GlobalError error={testError} reset={mockReset} />);

		await user.click(screen.getByRole("button", { name: TRY_AGAIN_PATTERN }));

		expect(mockReset).toHaveBeenCalledTimes(1);
		expect(mockInvalidate).toHaveBeenCalledTimes(1);
	});

	it("should show error details in development", () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		render(<GlobalError error={testError} reset={mockReset} />);

		// Should have details element
		expect(screen.getByText("Error details")).toBeInTheDocument();
		expect(screen.getByText(TEST_ERROR_PATTERN)).toBeInTheDocument();

		process.env.NODE_ENV = originalEnv;
	});
});

describe("RouteError", () => {
	const mockReset = vi.fn();
	const testError = new Error("Route specific error");

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render error heading", () => {
		render(<RouteError error={testError} reset={mockReset} />);
		expect(screen.getByText("Failed to load content")).toBeInTheDocument();
	});

	it("should render error message", () => {
		render(<RouteError error={testError} reset={mockReset} />);
		expect(screen.getByText("Route specific error")).toBeInTheDocument();
	});

	it("should render retry button", () => {
		render(<RouteError error={testError} reset={mockReset} />);
		expect(
			screen.getByRole("button", { name: RETRY_PATTERN })
		).toBeInTheDocument();
	});

	it("should call reset on retry click", async () => {
		const user = userEvent.setup();
		render(<RouteError error={testError} reset={mockReset} />);

		await user.click(screen.getByRole("button", { name: RETRY_PATTERN }));

		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("should show fallback message when error is undefined", () => {
		render(
			<RouteError error={undefined as unknown as Error} reset={mockReset} />
		);
		expect(screen.getByText(ERROR_LOADING_PATTERN)).toBeInTheDocument();
	});

	it("should show fallback message when error has no message", () => {
		const emptyError = {} as Error;
		render(<RouteError error={emptyError} reset={mockReset} />);
		expect(screen.getByText(ERROR_LOADING_PATTERN)).toBeInTheDocument();
	});
});
