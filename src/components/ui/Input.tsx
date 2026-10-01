import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CampoProps {
  label?: string;
  hint?: string;
  error?: string;
  /** "outline" para formularios, "soft" para buscadores. */
  tono?: "outline" | "soft";
  icono?: ReactNode;
  sufijo?: ReactNode;
}

const base =
  "w-full rounded-xl text-body-lg text-on-surface placeholder:text-outline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60";
const tonos = {
  outline: "border border-outline-variant bg-surface-container-lowest focus:border-primary",
  soft: "border border-transparent bg-surface-container focus:bg-surface-container-lowest focus:border-outline-variant",
};

function Envoltura({
  id,
  label,
  hint,
  error,
  children,
}: CampoProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-label-md text-on-surface-variant">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-body-sm text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & CampoProps>(
  ({ label, hint, error, tono = "outline", icono, sufijo, className, id, ...props }, ref) => {
    const autoId = useId();
    const iid = id ?? autoId;
    return (
      <Envoltura id={iid} label={label} hint={hint} error={error}>
        <div className="relative">
          {icono && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" aria-hidden>
              {icono}
            </span>
          )}
          <input
            ref={ref}
            id={iid}
            aria-invalid={!!error}
            aria-describedby={error ? `${iid}-error` : hint ? `${iid}-hint` : undefined}
            className={cn(base, tonos[tono], "h-12 px-4", icono && "pl-11", sufijo && "pr-12", className)}
            {...props}
          />
          {sufijo && <span className="absolute right-2 top-1/2 -translate-y-1/2">{sufijo}</span>}
        </div>
      </Envoltura>
    );
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & Omit<CampoProps, "icono" | "sufijo">
>(({ label, hint, error, tono = "outline", className, id, ...props }, ref) => {
  const autoId = useId();
  const iid = id ?? autoId;
  return (
    <Envoltura id={iid} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={iid}
        aria-invalid={!!error}
        className={cn(base, tonos[tono], "min-h-[96px] px-4 py-3", className)}
        {...props}
      />
    </Envoltura>
  );
});
Textarea.displayName = "Textarea";
