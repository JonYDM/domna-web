import type { Aviso } from "@/types/api";
import { apiActiva } from "./http";
import * as real from "./avisos";
import * as mock from "@/mock/server";

export function misAvisos(clientaId: string): Promise<Aviso[]> {
  return apiActiva ? real.misAvisos(clientaId) : mock.misAvisos(clientaId);
}

export function marcarAvisosLeidos(clientaId: string, ids: string[]): Promise<void> {
  return apiActiva ? real.marcarAvisosLeidos(clientaId, ids) : mock.marcarAvisosLeidos(clientaId, ids);
}
