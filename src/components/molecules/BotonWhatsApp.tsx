import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { urlWhatsApp } from "@/lib/whatsapp";

interface BotonWhatsAppProps {
  /** El teléfono de la persona, tal como se guarda ("777 123 4567"). */
  telefono: string | null | undefined;
  /** Mensaje que ya sale escrito en el chat (sin codificar). */
  mensaje?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Botón "Escribirle por WhatsApp". Recibe solo el teléfono (y el mensaje): no pide nada al servidor, así que
 * donde ya se tiene el pedido o la clienta no hace falta otra consulta. Si el teléfono no sirve, no se dibuja.
 */
export function BotonWhatsApp({ telefono, mensaje, children = "Escribirle por WhatsApp", className }: BotonWhatsAppProps) {
  const href = urlWhatsApp(telefono, mensaje);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-success-container px-3.5 text-label-lg text-success hover:brightness-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      {children}
    </a>
  );
}