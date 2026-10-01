import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  opciones: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, opciones, className, id, ...props }, ref) => {
    const autoId = useId();
    const sid = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={sid} className="text-label-md text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={sid}
            className={cn(
              "h-12 w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest pl-4 pr-10 text-body-lg text-on-surface focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              className,
            )}
            {...props}
          >
            {opciones.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            aria-hidden
          />
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";
