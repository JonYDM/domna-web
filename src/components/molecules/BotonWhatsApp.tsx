import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { urlWhatsApp } from "@/lib/whatsapp";

interface BotonWhatsAppProps {
  /** El teléfono de la persona, tal como se guarda ("777 123 4567"). */
  telefono: string | null | undefined;
  /** Mensaje que ya sale escrito en el chat (sin codificar). */
  mensaje?: string;
  /** `relleno`: botón verde suave. `enlace`: texto con icono, para ir junto a otros datos. */
  variante?: "relleno" | "enlace";
  children?: ReactNode;
  className?: string;
}

/**
 * Abre un chat de WhatsApp con la persona. Recibe solo el teléfono (y el mensaje): no pide nada al servidor, así
 * que donde ya se tiene el pedido o la clienta no hace falta otra consulta. Si el teléfono no sirve, no se dibuja.
 */
export function BotonWhatsApp({ telefono, mensaje, variante = "enlace", children = "WhatsApp", className }: BotonWhatsAppProps) {
  const href = urlWhatsApp(telefono, mensaje);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex items-center gap-2 text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        variante === "relleno"
          ? "h-11 w-fit rounded-xl bg-success-container px-3.5 text-label-lg hover:brightness-95"
          : "h-11 gap-1.5 text-body-sm hover:underline",
        className,
      )}
    >
      <MessageCircle className={variante === "relleno" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
      {children}
    </a>
  );
}