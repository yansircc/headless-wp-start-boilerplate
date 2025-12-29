import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
	children: ReactNode;
	className?: string;
};

export function Section({ children, className }: SectionProps) {
	return <section className={cn("py-12", className)}>{children}</section>;
}
