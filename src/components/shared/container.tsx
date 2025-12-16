import type { ReactNode } from "react";

type ContainerProps = {
	children: ReactNode;
	className?: string;
	size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap = {
	sm: "max-w-3xl",
	md: "max-w-4xl",
	lg: "max-w-6xl",
	xl: "max-w-7xl",
};

export function Container({
	children,
	className = "",
	size = "lg",
}: ContainerProps) {
	return (
		<div className={`mx-auto px-6 ${sizeMap[size]} ${className}`}>
			{children}
		</div>
	);
}
