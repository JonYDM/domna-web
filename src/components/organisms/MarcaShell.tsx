/**
 * Marca de la boutique en el app shell: un halo rosa difuminado al fondo (detrás del
 * encabezado transparente) y el nombre en blanco encima, con la tipografía del ícono de la app.
 */

/** Ancho aproximado de una letra en mayúsculas bold de 19 px con tracking de 0.14em. */
const PX_POR_LETRA = 16;
/** Alto del encabezado (h-16) y margen lateral del contenido (px-4). */
const ALTO_ENCABEZADO = 64;
const MARGEN_LATERAL = 16;
/** Holgura horizontal y alto de la cápsula del halo respecto al texto. */
const HOLGURA_X = 28;
const ALTO_HALO = 48;

/**
 * Capa de cristal del encabezado: desenfoque que se desvanece hacia abajo (sin costura contra la
 * esfera ni contra el contenido). Va aparte del contenido para no difuminar el nombre ni los
 * botones; el contenido del encabezado debe ser `relative` para quedar por encima de esta capa.
 */
export function CristalEncabezado() {
  const mascara = "linear-gradient(to bottom, #000 50%, transparent)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1.25rem)] backdrop-blur-xl"
      style={{ maskImage: mascara, WebkitMaskImage: mascara }}
    />
  );
}

/** Primera palabra del nombre: es lo que se muestra, igual que el ícono de la PWA ("JESLY"). */
function primeraPalabra(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

/**
 * Halo de marca al fondo del shell: un resplandor rosa compacto y difuso, del tamaño del nombre
 * (no una esfera). Va dentro del
 * `<header>` sticky, justo después de `CristalEncabezado` (encima del cristal, para que su desenfoque no lo lave) y antes del contenido (debajo del texto). La cápsula sobresale del texto lo bastante para que las letras queden sobre
 * rosa casi pleno (~90 %) y el desenfoque solo se note en los bordes.
 */
export function FondoShell({ nombre }: { nombre: string }) {
  const texto = primeraPalabra(nombre).length * PX_POR_LETRA;
  const ancho = texto + HOLGURA_X * 2;
  return (
    <div
      aria-hidden
      className="halo-marca pointer-events-none absolute rounded-full"
      style={{
        width: ancho,
        height: ALTO_HALO,
        top: ALTO_ENCABEZADO / 2 - ALTO_HALO / 2,
        // El contenido se centra en 72 rem; en pantallas angostas el margen es el px-4 del encabezado.
        left: `calc(max(0px, (100vw - 72rem) / 2) + ${MARGEN_LATERAL - HOLGURA_X}px)`,
      }}
    />
  );
}
/**
 * Nombre de la boutique sobre la esfera. En bold de 19 px: el blanco sobre el rosa de marca da
 * 3.6:1, que cumple AA solo para texto grande (≥ 18.66 px en bold); no bajar de ese tamaño.
 * El nombre completo queda disponible para lectores de pantalla.
 */
export function MarcaNombre({ nombre }: { nombre: string }) {
  return (
    <>
      <span aria-hidden className="font-sans text-[19px] font-bold uppercase leading-none tracking-[0.14em] text-white">
        {primeraPalabra(nombre)}
      </span>
      <span className="sr-only">{nombre}</span>
    </>
  );
}
