import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<>
			{/* Header */}
			<header
				className={`-translate-x-1/2 fixed top-4 left-1/2 z-50 w-[95%] max-w-7xl rounded-2xl transition-all duration-300 ${
					scrolled ? "glass py-3 shadow-lg" : "bg-transparent py-5"
				}`}
			>
				<div className="mx-auto flex items-center justify-between px-8">
					{/* Logo */}
					<Link className="group flex items-center gap-2" to="/">
						<span className="gradient-text font-bold text-2xl tracking-tighter">
							TanStack
						</span>
						<span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black transition-transform group-hover:scale-150" />
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden items-center gap-1 md:flex">
						<NavItem to="/">Home</NavItem>
						<NavItem to="/posts">Posts</NavItem>
						<NavItem to="/products">Products</NavItem>
					</nav>

					{/* Mobile Menu Button */}
					<button
						aria-label="Toggle menu"
						className="rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden"
						onClick={() => setIsOpen(!isOpen)}
						type="button"
					>
						{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				{/* Mobile Navigation */}
				<div
					className={`absolute top-full right-0 left-0 mt-2 overflow-hidden transition-all duration-300 md:hidden ${
						isOpen
							? "max-h-64 opacity-100"
							: "pointer-events-none max-h-0 opacity-0"
					}`}
				>
					<nav className="glass mx-4 flex flex-col rounded-2xl p-4 shadow-xl">
						<MobileNavItem onClick={() => setIsOpen(false)} to="/">
							Home
						</MobileNavItem>
						<MobileNavItem onClick={() => setIsOpen(false)} to="/posts">
							Posts
						</MobileNavItem>
						<MobileNavItem onClick={() => setIsOpen(false)} to="/products">
							Products
						</MobileNavItem>
					</nav>
				</div>
			</header>

			{/* Spacer for fixed header */}
			<div className="h-28" />
		</>
	);
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
	return (
		<Link
			activeProps={{
				className:
					"relative px-4 py-2 font-medium text-black text-sm transition-all",
			}}
			className="relative px-4 py-2 font-normal text-gray-500 text-sm transition-all hover:text-black"
			to={to}
		>
			{({ isActive }) => (
				<>
					{children}
					{!!isActive && (
						<span className="absolute right-4 bottom-0 left-4 h-0.5 rounded-full bg-black" />
					)}
				</>
			)}
		</Link>
	);
}

function MobileNavItem({
	to,
	children,
	onClick,
}: {
	to: string;
	children: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<Link
			activeProps={{
				className: "px-4 py-3 font-medium text-black bg-gray-50 rounded-xl",
			}}
			className="rounded-xl px-4 py-3 font-normal text-gray-600 transition-all hover:bg-gray-50"
			onClick={onClick}
			to={to}
		>
			{children}
		</Link>
	);
}
