import type { ConfigBoutique, MetodoPago } from "@/types/api";
import { apiActiva } from "@/api/http";

/**
 * Qué pasa después de elegir cómo pagar. El pago en línea nunca se cobra aquí: la tienda lo
 * confirma al recibirlo, y mientras tanto el pedido queda reservado. (La demo sin servidor cobra
 * al instante, así que no muestra este aviso.)
 */
export function AvisoPago({ metodo, config, sucursal }: { metodo: MetodoPago; config?: ConfigBoutique; sucursal?: string }) {
  if (!apiActiva) return null;
  const dias = config?.vigenciaSinAnticipoDias ?? 2;
  const donde = sucursal ?? "la sucursal que elegiste";
  return (
    <p className="mt-2 text-body-sm text-on-surface-variant">
      {metodo === "transferencia"
        ? `Al terminar verás los datos de la cuenta y podrás adjuntar tu comprobante. Tu pedido queda reservado ${dias} días mientras tanto.`
        : `Pagas en ${donde} mencionando tu folio y la cajera confirma tu pago. Tu pedido queda reservado ${dias} días mientras tanto.`}
    </p>
  );
}
