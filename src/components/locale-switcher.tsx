import { useLocation, useNavigate } from "@tanstack/react-router";
import {
	configuration,
	getLocaleName,
	getLocalizedUrl,
	type LocalesValues,
} from "intlayer";
import { Globe } from "lucide-react";
import type { FC } from "react";
import { useLocale } from "react-intlayer";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const { internationalization } = configuration;
const { locales, defaultLocale } = internationalization;

export const LocaleSwitcher: FC = () => {
	const { locale } = useLocale();
	const location = useLocation();
	const navigate = useNavigate();

	const handleLocaleChange = (newLocale: LocalesValues) => {
		const newPath = getLocalizedUrl(location.pathname, newLocale, {
			locales,
			defaultLocale,
			mode: "prefix-no-default",
		});
		navigate({ to: newPath });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="sm" variant="ghost">
					<Globe className="size-4" />
					<span>{getLocaleName(locale)}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((loc) => (
					<DropdownMenuItem
						className={loc === locale ? "font-medium" : ""}
						key={loc}
						onClick={() => handleLocaleChange(loc)}
					>
						{getLocaleName(loc)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
