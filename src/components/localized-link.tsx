import { Link, useParams } from "@tanstack/react-router";
import { configuration, getLocalizedUrl } from "intlayer";
import type { ComponentProps } from "react";

const { internationalization } = configuration;
const { locales, defaultLocale } = internationalization;

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, "to"> & {
	/**
	 * The path to navigate to (without locale prefix).
	 * Examples: "/", "/posts", "/products"
	 */
	to: string;
};

/**
 * A locale-aware Link component that automatically adds the correct
 * locale prefix to URLs based on the current route locale.
 */
export function LocalizedLink({ to, ...props }: LocalizedLinkProps) {
	const params = useParams({ strict: false });
	const currentLocale = (params as { locale?: string }).locale;

	// Generate localized URL
	const localizedPath = getLocalizedUrl(to, currentLocale || defaultLocale, {
		locales,
		defaultLocale,
		mode: "prefix-no-default",
	});

	return <Link to={localizedPath as "."} {...props} />;
}
