import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tono } from "@/lib/enums";

const tonos: Record<Tono, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary-soft text-primary-on-soft",
  success: "bg-success-container text-success",
  warning: "bg-warning-container text-warning",
  danger: "bg-error-container text-error",
  info: "bg-info-container text-info",
};

export function Badge({
  tono = "neutral",
  children,
  className,
  icono,
}: {
  tono?: Tono;
  children: ReactNode;
  className?: string;
  icono?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-label-md",
        tonos[tono],
        className,
      )}
    >
      {icono}
      {children}
    </span>
  );
}
