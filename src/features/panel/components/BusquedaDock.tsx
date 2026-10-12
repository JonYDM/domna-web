import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { PrendaImagen } from "@/components/ilustraciones/PrendaImagen";
import { BarraBusqueda } from "@/components/molecules/BarraBusqueda";
import { useProductos } from "@/features/catalogo/hooks";
import { formatMXN } from "@/lib/format";

/** Lupa del dock: abre un buscador rápido de productos en popover (sin navegar a otra pantalla). */
export function BusquedaDock({ base }: { base: string }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const navigate = useNavigate();
  const productos = useProductos({ texto: texto.trim() || undefined, incluirInactivos: true });
  const lista = texto.trim() ? (productos.data ?? []).slice(0, 6) : [];

  function ir(id: string) {
    setAbierto(false);
    setTexto("");
    navigate(`${base}/inventario/${id}`);
  }

  return (
    <Popover.Root
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) setTexto("");
      }}
    >
      <Popover.Trigger
        aria-label="Buscar"
        className="grid h-12 w-12 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high data-[state=open]:bg-surface-container-high data-[state=open]:text-on-surface"
      >
        <Search className="h-5 w-5" aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={12}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="popover-anim z-50 w-[min(calc(100vw-24px),420px)] overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-lift outline-none"
        >
          <div className="p-2.5">
            <BarraBusqueda valor={texto} onChange={setTexto} placeholder="Buscar prenda o color" />
          </div>
          {texto.trim() && (
            <ul className="max-h-80 overflow-y-auto border-t border-outline-variant/60 p-1.5">
              {lista.length === 0 ? (
                <li className="px-3 py-6 text-center text-body-sm text-on-surface-variant">Sin resultados.</li>
              ) : (
                lista.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => ir(p.id)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-surface-container"
                    >
                      <PrendaImagen
                        silueta={p.silueta}
                        hex={p.colores[0].hex}
                        url={p.imagenes.find((i) => i.colorId === p.colores[0].id)?.url ?? p.imagenes[0]?.url}
                        alt=""
                        className="w-10 shrink-0 rounded-lg"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-label-lg">{p.nombre}</span>
                        <span className="tabular block text-body-sm text-on-surface-variant">{formatMXN(p.precio)}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
