import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	ArticleSkeleton,
	CardSkeleton,
	GlobalLoading,
	GridSkeleton,
	LoadingSpinner,
	ProductSkeleton,
} from "./loading";

describe("LoadingSpinner", () => {
	it("should render with default md size", () => {
		const { container } = render(<LoadingSpinner />);
		expect(container.firstChild).toHaveClass("h-8");
		expect(container.firstChild).toHaveClass("w-8");
	});

	it("should render with sm size", () => {
		const { container } = render(<LoadingSpinner size="sm" />);
		expect(container.firstChild).toHaveClass("h-5");
		expect(container.firstChild).toHaveClass("w-5");
	});

	it("should render with lg size", () => {
		const { container } = render(<LoadingSpinner size="lg" />);
		expect(container.firstChild).toHaveClass("h-12");
		expect(container.firstChild).toHaveClass("w-12");
	});

	it("should have animation class", () => {
		const { container } = render(<LoadingSpinner />);
		expect(container.firstChild).toHaveClass("animate-spin");
	});

	it("should apply custom className", () => {
		const { container } = render(<LoadingSpinner className="custom-class" />);
		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("should have rounded-full class", () => {
		const { container } = render(<LoadingSpinner />);
		expect(container.firstChild).toHaveClass("rounded-full");
	});
});

describe("GlobalLoading", () => {
	it("should render loading text", () => {
		render(<GlobalLoading />);
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("should render spinner", () => {
		const { container } = render(<GlobalLoading />);
		expect(container.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("should have min-h-screen class", () => {
		const { container } = render(<GlobalLoading />);
		expect(container.firstChild).toHaveClass("min-h-screen");
	});
});

describe("CardSkeleton", () => {
	it("should render with animation", () => {
		const { container } = render(<CardSkeleton />);
		expect(container.firstChild).toHaveClass("animate-pulse");
	});

	it("should have rounded border", () => {
		const { container } = render(<CardSkeleton />);
		expect(container.firstChild).toHaveClass("rounded-3xl");
	});

	it("should have skeleton elements for image and text", () => {
		const { container } = render(<CardSkeleton />);
		const skeletonElements = container.querySelectorAll(".bg-gray-100");
		expect(skeletonElements.length).toBeGreaterThan(0);
	});
});

describe("GridSkeleton", () => {
	it("should render default 6 skeleton cards", () => {
		const { container } = render(<GridSkeleton />);
		const cards = container.querySelectorAll(".animate-pulse");
		expect(cards.length).toBe(6);
	});

	it("should render custom count of skeleton cards", () => {
		const { container } = render(<GridSkeleton count={3} />);
		const cards = container.querySelectorAll(".animate-pulse");
		expect(cards.length).toBe(3);
	});

	it("should have grid layout", () => {
		const { container } = render(<GridSkeleton />);
		expect(container.firstChild).toHaveClass("grid");
	});

	it("should have responsive grid columns", () => {
		const { container } = render(<GridSkeleton />);
		expect(container.firstChild).toHaveClass("grid-cols-1");
		expect(container.firstChild).toHaveClass("md:grid-cols-2");
		expect(container.firstChild).toHaveClass("lg:grid-cols-3");
	});
});

describe("ArticleSkeleton", () => {
	it("should render with animation", () => {
		const { container } = render(<ArticleSkeleton />);
		expect(container.firstChild).toHaveClass("animate-pulse");
	});

	it("should have min-h-screen", () => {
		const { container } = render(<ArticleSkeleton />);
		expect(container.firstChild).toHaveClass("min-h-screen");
	});

	it("should render section elements", () => {
		const { container } = render(<ArticleSkeleton />);
		const sections = container.querySelectorAll("section");
		expect(sections.length).toBeGreaterThan(0);
	});

	it("should render skeleton elements", () => {
		const { container } = render(<ArticleSkeleton />);
		const skeletonElements = container.querySelectorAll(".bg-gray-100");
		expect(skeletonElements.length).toBeGreaterThan(0);
	});
});

describe("ProductSkeleton", () => {
	it("should render with animation", () => {
		const { container } = render(<ProductSkeleton />);
		expect(container.firstChild).toHaveClass("animate-pulse");
	});

	it("should have min-h-screen", () => {
		const { container } = render(<ProductSkeleton />);
		expect(container.firstChild).toHaveClass("min-h-screen");
	});

	it("should render grid layout for product details", () => {
		const { container } = render(<ProductSkeleton />);
		const grid = container.querySelector(".grid");
		expect(grid).toBeInTheDocument();
	});

	it("should render skeleton elements", () => {
		const { container } = render(<ProductSkeleton />);
		const skeletonElements = container.querySelectorAll(".bg-gray-100");
		expect(skeletonElements.length).toBeGreaterThan(0);
	});

	it("should have responsive grid columns", () => {
		const { container } = render(<ProductSkeleton />);
		const grid = container.querySelector(".grid.grid-cols-1");
		expect(grid).toHaveClass("lg:grid-cols-2");
	});
});
