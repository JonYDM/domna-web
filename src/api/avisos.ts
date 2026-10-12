import type { Aviso } from "@/types/api";
import { http } from "./http";

interface AvisoDto {
  id: string;
  tipo: string;
  titulo: string;
  texto: string;
  fecha: string;
  leido: boolean;
  urgente: boolean;
  apartadoId: string;
}

function aAviso(dto: AvisoDto): Aviso {
  return { ...dto, tipo: dto.tipo as Aviso["tipo"] };
}

export async function misAvisos(clientaId: string): Promise<Aviso[]> {
  const lista = await http.get<AvisoDto[]>(`/api/avisos/${clientaId}`);
  return lista.map(aAviso);
}

export async function marcarAvisosLeidos(clientaId: string, ids: string[]): Promise<void> {
  await http.post<void>(`/api/avisos/${clientaId}/leidos`, ids);
}
