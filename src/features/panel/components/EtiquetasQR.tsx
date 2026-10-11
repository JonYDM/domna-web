import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Minus, Plus, Printer, X } from "lucide-react";
import type { ProductoDetalle } from "@/types/api";
import { Button } from "@/components/ui";

/**
 * Vista imprimible de etiquetas QR por variante (talla × color). La dueña elige cuántas de cada una,
 * imprime (o guarda PDF) y recorta para pegar en sus etiquetas en blanco. El QR codifica el código
 * único de la variante (DMN-...), que el POS escanea para vender sin teclear.
 *
 * Se monta como overlay a pantalla completa; en impresión (@media print) solo salen las etiquetas.
 */
export function EtiquetasQR({ producto, onClose }: { producto: ProductoDetalle; onClose: () => void }) {
  // Variantes con código (todas lo tienen: el backend lo autogenera).
  const variantes = useMemo(
    () => producto.variantes.filter((v) => v.codigoBarras),
    [producto.variantes],
  );
  const colorNombre = (colorId: string) => producto.colores.find((c) => c.id === colorId)?.nombre ?? "";

  // Cantidad de etiquetas por variante (default 1).
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    () => Object.fromEntries(variantes.map((v) => [v.id, 1])),
  );
  // QR (dataURL) por código.
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    let activo = true;
    Promise.all(
      variantes.map(async (v) => {
        const url = await QRCode.toDataURL(v.codigoBarras!, { margin: 1, width: 240 });
        return [v.codigoBarras!, url] as const;
      }),
    ).then((pares) => {
      if (activo) setQrs(Object.fromEntries(pares));
    });
    return () => {
      activo = false;
    };
  }, [variantes]);

  function cambiar(id: string, delta: number) {
    setCantidades((c) => ({ ...c, [id]: Math.max(0, Math.min(50, (c[id] ?? 1) + delta)) }));
  }

  // Lista expandida: una etiqueta por cada unidad pedida.
  const etiquetas = variantes.flatMap((v) =>
    Array.from({ length: cantidades[v.id] ?? 0 }, (_, i) => ({ key: `${v.id}-${i}`, v })),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface">
      {/* Barra superior (no se imprime). */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-marca text-headline-sm">Códigos de {producto.nombre}</p>
          <p className="text-body-sm text-on-surface-variant">Elige cuántas etiquetas de cada talla y color, imprime y recorta.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Selector de cantidades (no se imprime). */}
      <div className="no-print mx-auto max-w-2xl px-4 py-4">
        <div className="flex flex-col gap-2">
          {variantes.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant px-3 py-2">
              <span className="flex items-center gap-2 text-body-sm">
                <span className="h-4 w-4 rounded-full border border-on-surface/10" style={{ backgroundColor: producto.colores.find((c) => c.id === v.colorId)?.hex }} aria-hidden />
                {colorNombre(v.colorId)} · {v.talla}
              </span>
              <div className="flex items-center rounded-xl border border-outline-variant">
                <button type="button" onClick={() => cambiar(v.id, -1)} className="grid h-9 w-9 place-items-center text-on-surface-variant" aria-label="Menos">
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span className="tabular w-8 text-center text-label-lg">{cantidades[v.id] ?? 0}</span>
                <button type="button" onClick={() => cambiar(v.id, 1)} className="grid h-9 w-9 place-items-center text-on-surface-variant" aria-label="Más">
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hoja de etiquetas (lo único que se imprime). */}
      <div className="zona-impresion mx-auto grid max-w-2xl grid-cols-3 gap-3 px-4 pb-10 sm:grid-cols-4">
        {etiquetas.map(({ key, v }) => (
          <div key={key} className="etiqueta flex flex-col items-center gap-1 rounded-lg border border-outline-variant p-2 text-center">
            {qrs[v.codigoBarras!] ? (
              <img src={qrs[v.codigoBarras!]} alt={v.codigoBarras!} className="h-20 w-20" />
            ) : (
              <div className="h-20 w-20 animate-pulse rounded bg-surface-container" />
            )}
            <span className="text-[10px] font-semibold leading-tight">{producto.nombre}</span>
            <span className="text-[10px] leading-tight text-on-surface-variant">{colorNombre(v.colorId)} · {v.talla}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
