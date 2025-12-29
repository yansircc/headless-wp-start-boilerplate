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
	it("should have animation class", () => {
		const { container } = render(<LoadingSpinner />);
		expect(container.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("should apply custom className", () => {
		const { container } = render(<LoadingSpinner className="size-10" />);
		expect(container.querySelector(".size-10")).toBeInTheDocument();
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
});

describe("CardSkeleton", () => {
	it("should render card structure", () => {
		const { container } = render(<CardSkeleton />);
		expect(container.querySelector("[data-slot='card']")).toBeInTheDocument();
	});
});

describe("GridSkeleton", () => {
	it("should render default 6 skeleton cards", () => {
		const { container } = render(<GridSkeleton />);
		const cards = container.querySelectorAll("[data-slot='card']");
		expect(cards.length).toBe(6);
	});

	it("should render custom count of skeleton cards", () => {
		const { container } = render(<GridSkeleton count={3} />);
		const cards = container.querySelectorAll("[data-slot='card']");
		expect(cards.length).toBe(3);
	});

	it("should have grid layout", () => {
		const { container } = render(<GridSkeleton />);
		expect(container.firstChild).toHaveClass("grid");
	});
});

describe("ArticleSkeleton", () => {
	it("should render section elements", () => {
		const { container } = render(<ArticleSkeleton />);
		const sections = container.querySelectorAll("section");
		expect(sections.length).toBeGreaterThan(0);
	});
});

describe("ProductSkeleton", () => {
	it("should render grid layout for product details", () => {
		const { container } = render(<ProductSkeleton />);
		const grid = container.querySelector(".grid");
		expect(grid).toBeInTheDocument();
	});

	it("should have responsive grid columns", () => {
		const { container } = render(<ProductSkeleton />);
		const grid = container.querySelector(".grid.grid-cols-1");
		expect(grid).toHaveClass("lg:grid-cols-2");
	});
});
