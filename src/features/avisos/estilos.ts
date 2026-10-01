import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock, PackageCheck, Truck, Wallet } from "lucide-react";
import type { TipoAviso } from "@/types/api";

/** Ícono y tono por tipo de aviso (clases de tokens). */
export const ESTILO_AVISO: Record<TipoAviso, { icono: LucideIcon; clase: string }> = {
  por_vencer: { icono: Clock, clase: "bg-warning-container text-warning" },
  vencido: { icono: AlertTriangle, clase: "bg-error-container text-error" },
  abono: { icono: Wallet, clase: "bg-success-container text-success" },
  traslado: { icono: Truck, clase: "bg-info-container text-info" },
  lista: { icono: PackageCheck, clase: "bg-primary-soft text-primary-on-soft" },
};
