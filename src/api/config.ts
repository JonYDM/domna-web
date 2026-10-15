import type { ConfigBoutique } from "@/types/api";
import { http } from "./http";

export async function obtenerConfig(): Promise<ConfigBoutique> {
  return http.get<ConfigBoutique>("/api/config", { conAuth: false, cache: "no-cache" });
}

export async function demoSuspender(suspendida: boolean): Promise<void> {
  await http.post<void>("/api/config/suspendida", suspendida);
}

export async function demoCatalogoPublico(publico: boolean): Promise<void> {
  await http.post<void>("/api/config/catalogo-publico", publico);
}
