import { Link } from "@tanstack/react-router";
import { useState } from "react";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{/* Header */}
			<header className="fixed top-0 z-40 w-full border-gray-200 border-b bg-white">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
					{/* Logo */}
					<Link
						className="font-light text-2xl text-black tracking-tight transition-opacity hover:opacity-60"
						to="/"
					>
						TanStack
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden items-center gap-8 md:flex">
						<Link
							activeProps={{
								className:
									"font-normal text-black text-sm uppercase tracking-wider transition-opacity hover:opacity-60",
							}}
							className="font-light text-gray-600 text-sm uppercase tracking-wider transition-opacity hover:opacity-60"
							to="/"
						>
							Home
						</Link>
						<Link
							activeProps={{
								className:
									"font-normal text-black text-sm uppercase tracking-wider transition-opacity hover:opacity-60",
							}}
							className="font-light text-gray-600 text-sm uppercase tracking-wider transition-opacity hover:opacity-60"
							to="/posts"
						>
							Posts
						</Link>
						<Link
							activeProps={{
								className:
									"font-normal text-black text-sm uppercase tracking-wider transition-opacity hover:opacity-60",
							}}
							className="font-light text-gray-600 text-sm uppercase tracking-wider transition-opacity hover:opacity-60"
							to="/products"
						>
							Products
						</Link>
					</nav>

					{/* Mobile Menu Button */}
					<button
						aria-label="Toggle menu"
						className="font-light text-black text-sm uppercase tracking-wider transition-opacity hover:opacity-60 md:hidden"
						onClick={() => setIsOpen(!isOpen)}
						type="button"
					>
						{isOpen ? "Close" : "Menu"}
					</button>
				</div>

				{/* Mobile Navigation */}
				{isOpen ? (
					<nav className="border-gray-200 border-t bg-white md:hidden">
						<div className="mx-auto max-w-7xl space-y-1 px-6 py-4">
							<Link
								activeProps={{
									className:
										"block border-b border-gray-200 py-3 font-normal text-black text-sm uppercase tracking-wider transition-opacity hover:opacity-60",
								}}
								className="block border-gray-200 border-b py-3 font-light text-gray-600 text-sm uppercase tracking-wider transition-opacity hover:opacity-60"
								onClick={() => setIsOpen(false)}
								to="/"
							>
								Home
							</Link>
							<Link
								activeProps={{
									className:
										"block border-b border-gray-200 py-3 font-normal text-black text-sm uppercase tracking-wider transition-opacity hover:opacity-60",
								}}
								className="block border-gray-200 border-b py-3 font-light text-gray-600 text-sm uppercase tracking-wider transition-opacity hover:opacity-60"
								onClick={() => setIsOpen(false)}
								to="/posts"
							>
								Posts
							</Link>
							<Link
								activeProps={{
									className:
										"block py-3 font-normal text-black text-sm uppercase tracking-wider transition-opacity hover:opacity-60",
								}}
								className="block py-3 font-light text-gray-600 text-sm uppercase tracking-wider transition-opacity hover:opacity-60"
								onClick={() => setIsOpen(false)}
								to="/products"
							>
								Products
							</Link>
						</div>
					</nav>
				) : null}
			</header>

			{/* Spacer for fixed header */}
			<div className="h-20" />
		</>
	);
}
