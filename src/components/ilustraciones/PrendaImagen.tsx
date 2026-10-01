import { useId } from "react";
import type { Silueta } from "@/types/api";
import { cn } from "@/lib/cn";
import { esClaro, tintar } from "@/lib/color";
import { MARCA } from "@/lib/marca";

export type VistaPrenda = "frente" | "espalda" | "detalle";

/** Silueta + líneas de detalle por tipo de prenda (viewBox 300×400, proporción 3:4). */
const FORMAS: Record<Silueta, { cuerpo: string[]; sombras?: string[]; lineas: string[]; puntos?: [number, number, number][] }> = {
  vestido: {
    cuerpo: [
      "M118 46 C130 58 170 58 182 46 L196 54 C192 80 190 104 194 128 C197 146 196 160 192 172 C214 230 236 290 252 352 C200 368 100 368 48 352 C64 290 86 230 108 172 C104 160 103 146 106 128 C110 104 108 80 104 54 Z",
    ],
    lineas: ["M108 54 L114 20", "M192 54 L186 20", "M108 172 C135 181 165 181 192 172", "M150 184 L150 360", "M124 186 L98 356", "M176 186 L202 356"],
  },
  blusa: {
    cuerpo: [
      "M112 52 C128 70 172 70 188 52 L238 74 C252 104 264 140 272 176 L240 186 C232 166 226 150 220 138 L222 300 C180 312 120 312 78 300 L80 138 C74 150 68 166 60 186 L28 176 C36 140 48 104 62 74 Z",
    ],
    lineas: ["M112 52 C128 72 172 72 188 52", "M150 66 L150 304", "M80 138 C78 120 74 96 62 74", "M220 138 C222 120 226 96 238 74"],
    puntos: [[150, 104, 3.5], [150, 148, 3.5], [150, 192, 3.5], [150, 236, 3.5]],
  },
  pantalon: {
    cuerpo: [
      "M86 48 L214 48 L220 96 C230 180 240 280 250 372 L170 374 C164 300 158 220 150 150 C142 220 136 300 130 374 L50 372 C60 280 70 180 80 96 Z",
    ],
    sombras: ["M86 48 L214 48 L216 68 L84 68 Z"],
    lineas: ["M150 68 L150 140", "M92 72 C100 96 112 104 126 104", "M208 72 C200 96 188 104 174 104", "M104 120 L92 370", "M196 120 L208 370"],
  },
  falda: {
    cuerpo: ["M94 64 L206 64 L208 90 C226 170 246 260 258 336 C200 352 100 352 42 336 C56 260 76 170 92 90 Z"],
    sombras: ["M94 64 L206 64 L208 90 L92 90 Z"],
    lineas: ["M112 92 L84 340", "M131 92 L118 344", "M150 92 L150 346", "M169 92 L182 344", "M188 92 L216 340"],
  },
  chamarra: {
    cuerpo: [
      "M110 44 L150 62 L190 44 L240 64 C254 120 268 220 276 300 L242 306 C236 250 232 200 228 166 L230 344 L70 344 L72 166 C68 200 64 250 58 306 L24 300 C32 220 46 120 60 64 Z",
    ],
    sombras: ["M110 44 L150 62 L134 156 L116 94 Z", "M190 44 L150 62 L166 156 L184 94 Z"],
    lineas: ["M150 156 L150 344", "M94 252 L128 252", "M172 252 L206 252", "M72 166 C70 130 66 96 60 64", "M228 166 C230 130 234 96 240 64"],
    puntos: [[150, 204, 5], [150, 236, 5]],
  },
  bolsa: {
    cuerpo: ["M56 160 L244 160 C250 220 250 280 240 336 C180 348 120 348 60 336 C50 280 50 220 56 160 Z"],
    sombras: ["M56 160 L244 160 L238 214 C180 232 120 232 62 214 Z"],
    lineas: [],
    puntos: [[150, 222, 8]],
  },
  conjunto: {
    cuerpo: [
      "M114 34 C130 50 170 50 186 34 L232 52 C242 80 250 104 256 128 L228 136 C222 122 218 112 214 104 L214 186 L86 186 L86 104 C82 112 78 122 72 136 L44 128 C50 104 58 80 68 52 Z",
      "M92 196 L208 196 L212 230 C220 290 228 340 234 386 L170 388 C164 340 158 300 150 256 C142 300 136 340 130 388 L66 386 C72 340 80 290 88 230 Z",
    ],
    sombras: ["M92 196 L208 196 L210 212 L90 212 Z"],
    lineas: ["M114 34 C130 52 170 52 186 34", "M150 212 L150 250", "M108 230 L96 384", "M192 230 L204 384"],
  },
};

const ENCUADRE: Record<VistaPrenda, string | undefined> = {
  frente: undefined,
  espalda: "translate(300 0) scale(-1 1)",
  detalle: "translate(-150 -60) scale(2)",
};

interface PrendaImagenProps {
  silueta: Silueta;
  hex: string;
  vista?: VistaPrenda;
  /** Si hay foto real, se usa en lugar de la ilustración. */
  url?: string;
  alt: string;
  className?: string;
  /** La primera imagen visible no se difiere (LCP). */
  prioridad?: boolean;
}

/**
 * "Foto" de la prenda. Mientras llegan las fotos reales, dibuja la silueta en el color
 * elegido, así el selector de color cambia la imagen. Contenedor con aspect-ratio fijo (sin CLS).
 */
export function PrendaImagen({ silueta, hex, vista = "frente", url, alt, className, prioridad }: PrendaImagenProps) {
  const id = useId().replace(/:/g, "");
  const forma = FORMAS[silueta];
  const claro = esClaro(hex);
  const linea = claro ? "rgba(31,27,36,0.14)" : "rgba(255,255,255,0.16)";
  const fondo = tintar(hex, claro ? 0.55 : 0.84);

  if (url) {
    return (
      <div className={cn("aspect-[3/4] overflow-hidden bg-surface-container", className)}>
        <img
          src={url}
          alt={alt}
          loading={prioridad ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-[3/4] overflow-hidden", className)} style={{ backgroundColor: fondo }}>
      <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" role="img" aria-label={alt}>
        <defs>
          <linearGradient id={`luz-${id}`} x1="0" x2="1" y1="0" y2="0.3">
            <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.16} />
          </linearGradient>
        </defs>
        <ellipse cx={150} cy={384} rx={110} ry={9} fill="#000" opacity={0.06} />
        <g transform={ENCUADRE[vista]}>
          {silueta === "bolsa" && (
            <path d="M100 162 C100 86 200 86 200 162" stroke={hex} strokeWidth={14} fill="none" strokeLinecap="round" />
          )}
          {forma.cuerpo.map((d) => (
            <g key={d}>
              <path d={d} fill={hex} stroke={claro ? "rgba(31,27,36,0.10)" : "none"} strokeWidth={1.5} />
              <path d={d} fill={`url(#luz-${id})`} />
            </g>
          ))}
          {forma.sombras?.map((d) => <path key={d} d={d} fill="#000" opacity={0.1} />)}
          {vista !== "espalda" &&
            forma.lineas.map((d) => (
              <path key={d} d={d} stroke={linea} strokeWidth={2.5} fill="none" strokeLinecap="round" />
            ))}
          {vista !== "espalda" &&
            forma.puntos?.map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={silueta === "bolsa" ? MARCA.dorado : linea} />
            ))}
        </g>
      </svg>
    </div>
  );
}
