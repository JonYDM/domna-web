import { Badge } from "@/components/ui";
import type { OrigenClienta } from "@/types/api";
import { GoogleLogo } from "@/components/ilustraciones/GoogleLogo";

const ORIGEN: Record<OrigenClienta, string> = { google: "Google", telefono: "Teléfono", mostrador: "Mostrador" };

/** Cómo se registró la clienta. */
export function OrigenBadge({ origen }: { origen: OrigenClienta }) {
  return (
    <Badge icono={origen === "google" ? <GoogleLogo className="h-3 w-3" /> : undefined}>{ORIGEN[origen]}</Badge>
  );
}
