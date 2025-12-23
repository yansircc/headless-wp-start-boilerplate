import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useIntlayer } from "react-intlayer";
import { LocaleSwitcher } from "./locale-switcher";
import { LocalizedLink } from "./localized-link";

export default function Header() {
	const { navigation } = useIntlayer("common");
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
					<LocalizedLink className="group flex items-center gap-2" to="/">
						<span className="gradient-text font-bold text-2xl tracking-tighter">
							TanStack
						</span>
						<span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black transition-transform group-hover:scale-150" />
					</LocalizedLink>

					{/* Desktop Navigation */}
					<nav className="hidden items-center gap-1 md:flex">
						<NavItem to="/">{navigation.home}</NavItem>
						<NavItem to="/posts">{navigation.posts}</NavItem>
						<NavItem to="/products">{navigation.products}</NavItem>
						<LocaleSwitcher />
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
							{navigation.home}
						</MobileNavItem>
						<MobileNavItem onClick={() => setIsOpen(false)} to="/posts">
							{navigation.posts}
						</MobileNavItem>
						<MobileNavItem onClick={() => setIsOpen(false)} to="/products">
							{navigation.products}
						</MobileNavItem>
						<div className="mt-2 border-gray-200 border-t pt-2">
							<LocaleSwitcher />
						</div>
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
		<LocalizedLink
			className="relative px-4 py-2 font-normal text-gray-500 text-sm transition-all hover:text-black"
			to={to}
		>
			{children}
		</LocalizedLink>
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
		<LocalizedLink
			className="rounded-xl px-4 py-3 font-normal text-gray-600 transition-all hover:bg-gray-50"
			onClick={onClick}
			to={to}
		>
			{children}
		</LocalizedLink>
	);
}
