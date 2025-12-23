import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Container } from "./container";
import { Divider } from "./divider";
import { Section } from "./section";

describe("Container", () => {
	it("should render children", () => {
		render(<Container>Test Content</Container>);
		expect(screen.getByText("Test Content")).toBeInTheDocument();
	});

	it("should apply default lg size", () => {
		const { container } = render(<Container>Content</Container>);
		expect(container.firstChild).toHaveClass("max-w-6xl");
	});

	it("should apply sm size", () => {
		const { container } = render(<Container size="sm">Content</Container>);
		expect(container.firstChild).toHaveClass("max-w-3xl");
	});

	it("should apply md size", () => {
		const { container } = render(<Container size="md">Content</Container>);
		expect(container.firstChild).toHaveClass("max-w-4xl");
	});

	it("should apply lg size", () => {
		const { container } = render(<Container size="lg">Content</Container>);
		expect(container.firstChild).toHaveClass("max-w-6xl");
	});

	it("should apply xl size", () => {
		const { container } = render(<Container size="xl">Content</Container>);
		expect(container.firstChild).toHaveClass("max-w-7xl");
	});

	it("should apply custom className", () => {
		const { container } = render(
			<Container className="custom-class">Content</Container>
		);
		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("should have base padding class", () => {
		const { container } = render(<Container>Content</Container>);
		expect(container.firstChild).toHaveClass("px-6");
		expect(container.firstChild).toHaveClass("mx-auto");
	});
});

describe("Section", () => {
	it("should render children", () => {
		render(<Section>Section Content</Section>);
		expect(screen.getByText("Section Content")).toBeInTheDocument();
	});

	it("should render as section element", () => {
		const { container } = render(<Section>Content</Section>);
		expect(container.querySelector("section")).toBeInTheDocument();
	});

	it("should have default padding", () => {
		const { container } = render(<Section>Content</Section>);
		expect(container.firstChild).toHaveClass("py-16");
	});

	it("should apply custom className", () => {
		const { container } = render(
			<Section className="custom-section">Content</Section>
		);
		expect(container.firstChild).toHaveClass("custom-section");
	});

	it("should combine default and custom classes", () => {
		const { container } = render(<Section className="mt-8">Content</Section>);
		expect(container.firstChild).toHaveClass("py-16");
		expect(container.firstChild).toHaveClass("mt-8");
	});
});

describe("Divider", () => {
	it("should render horizontal divider by default", () => {
		const { container } = render(<Divider />);
		expect(container.firstChild).toHaveClass("h-px");
		expect(container.firstChild).toHaveClass("w-full");
	});

	it("should render vertical divider", () => {
		const { container } = render(<Divider orientation="vertical" />);
		expect(container.firstChild).toHaveClass("h-full");
		expect(container.firstChild).toHaveClass("w-px");
	});

	it("should have background color", () => {
		const { container } = render(<Divider />);
		expect(container.firstChild).toHaveClass("bg-gray-200");
	});

	it("should apply custom className", () => {
		const { container } = render(<Divider className="my-custom-class" />);
		expect(container.firstChild).toHaveClass("my-custom-class");
	});
});
