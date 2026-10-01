import { Search, X } from "lucide-react";
import { Input } from "@/components/ui";

interface BarraBusquedaProps {
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

/** Buscador estándar de toda lista (variante soft, con limpiar). Debounce en quien lo usa. */
export function BarraBusqueda({ valor, onChange, placeholder = "Buscar", className }: BarraBusquedaProps) {
  return (
    <div className={className}>
      <Input
        type="search"
        tono="soft"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        icono={<Search className="h-5 w-5" />}
        enterKeyHint="search"
        sufijo={
          valor ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : undefined
        }
        className="[&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}
