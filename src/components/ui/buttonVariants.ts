import { cva } from "class-variance-authority";

/**
 * Variantes semánticas del botón (compartidas por Button y ButtonLink):
 * - primary (rojo Domna): apartar, guardar, la acción principal de la pantalla.
 * - tinta (negro): acción fuerte secundaria, elegante.
 * - soft / ghost / outline: acciones neutras.
 * - warning: desactivar. danger: cancelar apartado o eliminar.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold",
    "transition-all duration-150 ease-out-expo select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary-strong text-on-primary shadow-xs hover:bg-primary-hover hover:shadow-primary-glow",
        tinta: "bg-tinta text-on-primary shadow-xs hover:bg-tinta-hover",
        soft: "bg-surface-container text-on-surface hover:bg-surface-container-high",
        ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
        outline:
          "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
        danger: "bg-error text-on-primary shadow-xs hover:opacity-90",
        warning: "bg-warning-container text-warning hover:brightness-95",
      },
      size: {
        sm: "h-10 px-3.5 text-body-md",
        md: "h-12 px-5 text-body-md",
        lg: "h-14 px-6 text-body-lg",
        icon: "h-11 w-11",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
