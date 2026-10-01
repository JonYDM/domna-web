import { cloneElement, isValidElement, type ComponentProps, type ReactElement } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Breadcrumb con la misma API que el de shadcn/ui, sin dependencias extra.
 * `BreadcrumbLink` acepta `render` para usar el <Link> de React Router (navegación SPA):
 *   <BreadcrumbLink render={<Link to="/tienda" />}>Catálogo</BreadcrumbLink>
 */
export function Breadcrumb(props: ComponentProps<"nav">) {
  return <nav aria-label="Ruta de navegación" {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      className={cn("flex min-w-0 flex-wrap items-center gap-1 break-words text-body-sm text-on-surface-variant", className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("inline-flex min-w-0 items-center gap-1", className)} {...props} />;
}

const claseLink =
  "inline-flex min-h-[44px] items-center rounded-md transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

export function BreadcrumbLink({
  render,
  className,
  children,
  ...props
}: ComponentProps<"a"> & { render?: ReactElement<{ className?: string; children?: unknown }> }) {
  if (render && isValidElement(render)) {
    return cloneElement(render, { className: cn(claseLink, render.props.className, className), children });
  }
  return (
    <a className={cn(claseLink, className)} {...props}>
      {children}
    </a>
  );
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("truncate font-semibold text-on-surface", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<"li">) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("text-outline [&>svg]:h-3.5 [&>svg]:w-3.5", className)} {...props}>
      {children ?? <ChevronRight />}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span role="presentation" aria-hidden="true" className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Más</span>
    </span>
  );
}
