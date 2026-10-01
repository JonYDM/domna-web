import { Badge } from "@/components/ui";
import { STOCK_BAJO } from "@/lib/enums";

/** "Agotado", "¡Última pieza!", "Quedan 2" o "Disponible". */
export function StockBadge({ disponible, className }: { disponible: number; className?: string }) {
  if (disponible <= 0) return <Badge className={className}>Agotado</Badge>;
  if (disponible === 1)
    return (
      <Badge tono="primary" className={className}>
        ¡Última pieza!
      </Badge>
    );
  if (disponible <= STOCK_BAJO)
    return (
      <Badge tono="warning" className={className}>
        Quedan {disponible}
      </Badge>
    );
  return (
    <Badge tono="success" className={className}>
      Disponible
    </Badge>
  );
}
