import { cn } from "@/lib/cn";
import { MARCA as M } from "@/lib/marca";

export type ExpresionDomi =
  | "feliz"
  | "enamorada"
  | "guino"
  | "curiosa"
  | "sorprendida"
  | "triste"
  | "dormida";

interface DomiProps {
  expresion?: ExpresionDomi;
  /** Ancho en px (alto proporcional). */
  size?: number;
  animar?: "respira" | "vuela" | "ninguna";
  className?: string;
  /** Texto para lectores de pantalla. Si se omite, es decorativa. */
  titulo?: string;
}

function corazon(cx: number, cy: number, s: number) {
  return `M${cx} ${cy + 6 * s} C${cx - 12 * s} ${cy - 2 * s} ${cx - 8 * s} ${cy - 12 * s} ${cx} ${cy - 5 * s} C${cx + 8 * s} ${cy - 12 * s} ${cx + 12 * s} ${cy - 2 * s} ${cx} ${cy + 6 * s} Z`;
}

/**
 * Domi, la catarina de Domna. Flat, sin contornos, cuerpo de frijolito, 6 lunares,
 * antenas expresivas con moño, ojos grandes con brillo y mejillas rubor.
 */
export function Domi({ expresion = "feliz", size = 120, animar = "respira", className, titulo }: DomiProps) {
  const triste = expresion === "triste";
  const dormida = expresion === "dormida";
  // Desplazamiento de pupilas según la emoción.
  const px = expresion === "curiosa" ? 3 : 0;
  const py = expresion === "curiosa" ? -3 : triste ? 3 : 0;
  const rPupila = expresion === "sorprendida" ? 7 : 10;

  const antenaIzq = triste ? "M86 72 Q68 52 50 58" : "M86 70 Q76 40 60 18";
  const antenaDer = triste ? "M114 72 Q132 52 150 58" : "M114 70 Q124 40 140 18";
  const bolaIzq = triste ? [48, 60] : [58, 16];
  const bolaDer = triste ? [152, 60] : [142, 16];
  const mono = triste ? [134, 60] : [127, 34];

  const ojo = (cx: number, cerrado: boolean) =>
    cerrado ? (
      <path
        d={dormida ? `M${cx - 12} ${116} Q${cx} ${124} ${cx + 12} ${116}` : `M${cx - 12} ${118} Q${cx} ${108} ${cx + 12} ${118}`}
        stroke={M.blanco}
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
      />
    ) : expresion === "enamorada" ? (
      <path d={corazon(cx, 114, 1.25)} fill={M.rojo} />
    ) : (
      <g className="domi-ojo">
        <ellipse cx={cx} cy={115} rx={14} ry={15} fill={M.blanco} />
        <circle cx={cx + 2 + px} cy={117 + py} r={rPupila} fill={M.tinta} />
        <circle cx={cx + 6 + px} cy={111 + py} r={4} fill={M.blanco} />
        <circle cx={cx - 2 + px} cy={122 + py} r={1.8} fill={M.blanco} />
      </g>
    );

  const boca = {
    feliz: <path d="M92 137 Q100 145 108 137" stroke={M.rubor} strokeWidth={3.5} strokeLinecap="round" fill="none" />,
    enamorada: <path d="M90 136 Q100 148 110 136 Z" fill={M.rubor} />,
    guino: <path d="M92 137 Q101 146 110 136" stroke={M.rubor} strokeWidth={3.5} strokeLinecap="round" fill="none" />,
    curiosa: <circle cx={102} cy={140} r={3.5} fill={M.rubor} />,
    sorprendida: <ellipse cx={100} cy={141} rx={5} ry={6.5} fill={M.rubor} />,
    triste: <path d="M92 143 Q100 135 108 143" stroke={M.rubor} strokeWidth={3.5} strokeLinecap="round" fill="none" />,
    dormida: <ellipse cx={100} cy={140} rx={3.5} ry={2.5} fill={M.rubor} />,
  }[expresion];

  return (
    <svg
      viewBox="0 0 200 190"
      width={size}
      height={(size * 190) / 200}
      className={cn("overflow-visible", className)}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <ellipse cx={100} cy={180} rx={62} ry={7} fill={M.rubor} opacity={0.5} />
      <g className={animar === "respira" ? "domi-respira" : animar === "vuela" ? "domi-vuela" : undefined}>
      <g transform={expresion === "curiosa" ? "rotate(-5 100 110)" : undefined}>
        {animar === "vuela" && (
          <g opacity={0.85}>
            <ellipse cx={30} cy={70} rx={26} ry={16} fill={M.blanco} transform="rotate(-25 30 70)" />
            <ellipse cx={170} cy={70} rx={26} ry={16} fill={M.blanco} transform="rotate(25 170 70)" />
          </g>
        )}
        {/* Patitas */}
        <ellipse cx={70} cy={168} rx={10} ry={7} fill={M.tinta} />
        <ellipse cx={100} cy={171} rx={10} ry={7} fill={M.tinta} />
        <ellipse cx={130} cy={168} rx={10} ry={7} fill={M.tinta} />
        {/* Caparazón con 6 lunares simétricos */}
        <ellipse cx={100} cy={108} rx={78} ry={66} fill={M.rojo} />
        <circle cx={36} cy={96} r={10} fill={M.tinta} />
        <circle cx={164} cy={96} r={10} fill={M.tinta} />
        <circle cx={44} cy={142} r={9} fill={M.tinta} />
        <circle cx={156} cy={142} r={9} fill={M.tinta} />
        <circle cx={62} cy={58} r={9} fill={M.tinta} />
        <circle cx={138} cy={58} r={9} fill={M.tinta} />
        {/* Cara */}
        <ellipse cx={100} cy={120} rx={58} ry={52} fill={M.tinta} />
        {/* Antenas */}
        <path d={antenaIzq} stroke={M.tinta} strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d={antenaDer} stroke={M.tinta} strokeWidth={5} strokeLinecap="round" fill="none" />
        <circle cx={bolaIzq[0]} cy={bolaIzq[1]} r={7} fill={M.tinta} />
        <circle cx={bolaDer[0]} cy={bolaDer[1]} r={7} fill={M.tinta} />
        {/* Moño */}
        <g transform={`translate(${mono[0]} ${mono[1]}) rotate(-15)`}>
          <path d="M0 0 L-13 -9 Q-16 0 -13 9 Z" fill={M.rojo} />
          <path d="M0 0 L13 -9 Q16 0 13 9 Z" fill={M.rojo} />
          <circle r={4} fill={M.rojoOscuro} />
        </g>
        {/* Ojos, mejillas y boca */}
        {ojo(80, dormida)}
        {ojo(120, dormida || expresion === "guino")}
        <ellipse cx={62} cy={137} rx={9} ry={5.5} fill={M.rubor} />
        <ellipse cx={138} cy={137} rx={9} ry={5.5} fill={M.rubor} />
        {boca}
      </g>
      </g>
      {dormida && (
        <text x={162} y={36} fill={M.tinta} fontSize={22} fontWeight={700} fontFamily="DM Sans, sans-serif">
          z<tspan fontSize={28} dy={-10}>Z</tspan>
        </text>
      )}
    </svg>
  );
}
