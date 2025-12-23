import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFoundPage, ResourceNotFound } from "./not-found";

// Regex patterns (top-level for performance)
// Note: These now match the mocked translation values from test/setup.ts
const PAGE_NOT_FOUND_PATTERN = /doesn't exist or has been moved/i;
const RESOURCE_NOT_FOUND_PATTERN =
	/The resource you're looking for doesn't exist or has been removed/i;
const BACK_TO_HOME_PATTERN = /back to home/i;
const BROWSE_ARTICLES_PATTERN = /browse articles/i;
const GO_BACK_PATTERN = /go back/i;
const BACK_TO_PRODUCTS_PATTERN = /back to products/i;
const VIEW_ALL_POSTS_PATTERN = /view all posts/i;

// Note: @tanstack/react-router is mocked globally in test/setup.ts

describe("NotFoundPage", () => {
	it("should render 404 heading", () => {
		render(<NotFoundPage />);
		expect(screen.getByText("404")).toBeInTheDocument();
	});

	it("should render page not found message", () => {
		render(<NotFoundPage />);
		// Uses translated text from mock
		expect(screen.getByText("Page not found")).toBeInTheDocument();
	});

	it("should render helpful description", () => {
		render(<NotFoundPage />);
		expect(screen.getByText(PAGE_NOT_FOUND_PATTERN)).toBeInTheDocument();
	});

	it("should render home link", () => {
		render(<NotFoundPage />);
		// Uses translated text "Back to Home" from mock
		const homeLink = screen.getByRole("link", { name: BACK_TO_HOME_PATTERN });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/");
	});

	it("should render browse articles link", () => {
		render(<NotFoundPage />);
		// Uses translated text "Browse Articles" from mock
		const browseLink = screen.getByRole("link", {
			name: BROWSE_ARTICLES_PATTERN,
		});
		expect(browseLink).toBeInTheDocument();
		expect(browseLink).toHaveAttribute("href", "/posts");
	});
});

describe("ResourceNotFound", () => {
	it("should render default title", () => {
		render(<ResourceNotFound />);
		expect(screen.getByText("Not Found")).toBeInTheDocument();
	});

	it("should render custom title", () => {
		render(<ResourceNotFound title="Product Not Found" />);
		expect(screen.getByText("Product Not Found")).toBeInTheDocument();
	});

	it("should render default message", () => {
		render(<ResourceNotFound />);
		expect(screen.getByText(RESOURCE_NOT_FOUND_PATTERN)).toBeInTheDocument();
	});

	it("should render custom message", () => {
		render(<ResourceNotFound message="Custom not found message" />);
		expect(screen.getByText("Custom not found message")).toBeInTheDocument();
	});

	it("should render default back link", () => {
		render(<ResourceNotFound />);
		const backLink = screen.getByRole("link", { name: GO_BACK_PATTERN });
		expect(backLink).toBeInTheDocument();
		expect(backLink).toHaveAttribute("href", "/");
	});

	it("should render custom back link", () => {
		render(
			<ResourceNotFound backLabel="Back to Products" backTo="/products" />
		);
		const backLink = screen.getByRole("link", {
			name: BACK_TO_PRODUCTS_PATTERN,
		});
		expect(backLink).toBeInTheDocument();
		expect(backLink).toHaveAttribute("href", "/products");
	});

	it("should render with all custom props", () => {
		render(
			<ResourceNotFound
				backLabel="View all posts"
				backTo="/posts"
				message="This article has been removed"
				title="Post Not Found"
			/>
		);

		expect(screen.getByText("Post Not Found")).toBeInTheDocument();
		expect(
			screen.getByText("This article has been removed")
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: VIEW_ALL_POSTS_PATTERN })
		).toHaveAttribute("href", "/posts");
	});
});
