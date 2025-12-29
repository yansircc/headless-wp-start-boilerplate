import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useIntlayer } from "react-intlayer";
import { LocaleSwitcher } from "./locale-switcher";
import { LocalizedLink } from "./localized-link";
import { Button } from "./ui/button";

export default function Header() {
	const { navigation } = useIntlayer("common");
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="fixed top-0 right-0 left-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
					{/* Logo */}
					<LocalizedLink className="font-bold text-xl tracking-tight" to="/">
						TanStack
					</LocalizedLink>

					{/* Desktop Navigation */}
					<nav className="hidden items-center gap-1 md:flex">
						<Button asChild size="sm" variant="ghost">
							<LocalizedLink to="/">{navigation.home}</LocalizedLink>
						</Button>
						<Button asChild size="sm" variant="ghost">
							<LocalizedLink to="/posts">{navigation.posts}</LocalizedLink>
						</Button>
						<Button asChild size="sm" variant="ghost">
							<LocalizedLink to="/products">
								{navigation.products}
							</LocalizedLink>
						</Button>
						<LocaleSwitcher />
					</nav>

					{/* Mobile Menu Button */}
					<Button
						aria-label="Toggle menu"
						className="md:hidden"
						onClick={() => setIsOpen(!isOpen)}
						size="icon"
						variant="ghost"
					>
						{isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
					</Button>
				</div>

				{/* Mobile Navigation */}
				{isOpen ? (
					<nav className="border-t bg-background p-4 md:hidden">
						<div className="flex flex-col gap-1">
							<Button asChild className="justify-start" variant="ghost">
								<LocalizedLink onClick={() => setIsOpen(false)} to="/">
									{navigation.home}
								</LocalizedLink>
							</Button>
							<Button asChild className="justify-start" variant="ghost">
								<LocalizedLink onClick={() => setIsOpen(false)} to="/posts">
									{navigation.posts}
								</LocalizedLink>
							</Button>
							<Button asChild className="justify-start" variant="ghost">
								<LocalizedLink onClick={() => setIsOpen(false)} to="/products">
									{navigation.products}
								</LocalizedLink>
							</Button>
							<div className="mt-2 border-t pt-2">
								<LocaleSwitcher />
							</div>
						</div>
					</nav>
				) : null}
			</header>

			{/* Spacer for fixed header */}
			<div className="h-14" />
		</>
	);
}
