import type { ConfigBoutique } from "@/types/api";
import { http } from "./http";

export async function obtenerConfig(): Promise<ConfigBoutique> {
  return http.get<ConfigBoutique>("/api/config", { conAuth: false, cache: "no-cache" });
}

