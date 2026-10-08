import { Badge } from "@/components/ui";
import type { OrigenClienta } from "@/types/api";

const ORIGEN: Record<OrigenClienta, string> = { registro: "Se registró", mostrador: "Mostrador" };

/** Cómo se registró la clienta: ella misma (sign-in) o alta en mostrador. */
export function OrigenBadge({ origen }: { origen: OrigenClienta }) {
  return <Badge>{ORIGEN[origen]}</Badge>;
}
