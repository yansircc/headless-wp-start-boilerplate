import { useLocation, useNavigate } from "@tanstack/react-router";
import {
	configuration,
	getLocaleName,
	getLocalizedUrl,
	type LocalesValues,
} from "intlayer";
import { ChevronDown, Globe } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { useLocale } from "react-intlayer";

const { internationalization } = configuration;
const { locales, defaultLocale } = internationalization;

export const LocaleSwitcher: FC = () => {
	const { locale } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);

	const handleLocaleChange = (newLocale: LocalesValues) => {
		// Get localized URL for the new locale
		const newPath = getLocalizedUrl(location.pathname, newLocale, {
			locales,
			defaultLocale,
			mode: "prefix-no-default",
		});

		navigate({ to: newPath });
		setIsOpen(false);
	};

	return (
		<div className="relative">
			{/* Trigger Button */}
			<button
				className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-gray-600 text-sm transition-all hover:bg-gray-100 hover:text-gray-900"
				onClick={() => setIsOpen(!isOpen)}
				type="button"
			>
				<Globe className="h-4 w-4" />
				<span className="font-medium">{getLocaleName(locale)}</span>
				<ChevronDown
					className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{/* Dropdown */}
			{isOpen ? (
				<>
					{/* Backdrop to close on outside click */}
					<button
						aria-label="Close language menu"
						className="fixed inset-0 z-40 cursor-default"
						onClick={() => setIsOpen(false)}
						type="button"
					/>
					<div className="absolute top-full right-0 z-50 mt-1 min-w-[140px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
						{locales.map((loc) => (
							<button
								className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
									loc === locale
										? "font-medium text-black"
										: "font-normal text-gray-600"
								}`}
								key={loc}
								onClick={() => handleLocaleChange(loc)}
								type="button"
							>
								{getLocaleName(loc)}
							</button>
						))}
					</div>
				</>
			) : null}
		</div>
	);
};
