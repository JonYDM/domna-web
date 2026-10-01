# Domna — Design System

> Fuente de verdad: los tokens de `tailwind.config.js`. Este documento explica **cómo se usan**.
> Si algo aquí contradice al código, manda el código; actualiza este archivo.

## Principios
- **La foto manda.** UI neutra (crema, negro tinta, blanco), mucho aire y la prenda como protagonista.
- **El rojo es un acento, no un fondo.** Rojo Domna para la acción principal (Apartar), "Nuevo",
  ofertas y estados activos. Un toque por pantalla.
- **Elegante y cercana.** Serif para la marca y títulos; sans legible para la UI. Domi acompaña, no compite.
- **Mobile-first real.** 360 px, pulgar, safe areas, inputs de 16 px, touch ≥ 44 px.
- **Emojis mínimos**, íconos de lucide.

## Marca
- **Domna** ("la dama" en occitano). Wordmark `Logo` en Playfair Display 700 con el punto en rojo.
  Lema: *Tu estilo, apartado para ti*.
- **Domi**, la catarina (nunca "mariquita"). Componente `Domi` en SVG con expresiones
  `feliz · enamorada · guino · curiosa · sorprendida · triste · dormida` y animaciones
  `respira · vuela`. Reglas: 6 lunares simétricos, moño en la antena derecha, sin contornos.
- **Motivo:** lunares (`.lunares` de fondo, confeti de "¡Apartado listo!", íconos PWA).

## Color
| Rol | Token | Hex | Uso |
|---|---|---|---|
| Fondo | `surface` | `#FBF7F4` | Crema de la app |
| Cards / drawers / inputs | `surface-container-lowest` | `#FFFFFF` | |
| Contenedores neutros | `surface-container(-low/-high)` | `#F7F1EE` `#F2EAE6` `#EADFDA` | Chips, skeleton, buscador |
| Texto | `on-surface` | `#1F1B24` | Negro tinta |
| Texto secundario | `on-surface-variant` | `#5E5560` | Nunca `outline` para texto |
| Bordes | `outline-variant` | `#DCD2D4` | |
| Marca (acento) | `primary` | `#E0344B` | Íconos, puntos, barras, swatches activos |
| Botón principal | `primary-strong` | `#CC2D44` | Fondo con texto blanco (AA 4.9:1). `#E0344B` con blanco da 4.4:1 |
| Rosa claro / rubor | `primary-soft` / `primary-rubor` | `#FFE8EC` / `#FFB8C2` | Héroes, badges suaves, barras de gráfica |
| Tinta (secundario fuerte) | `tinta` | `#1F1B24` | Botón negro, chip activo, talla elegida |
| Semánticos | `success` `warning` `error` `info` (+ `-container`) | | Estados de apartado, stock, avisos |

**Jerarquía:** principal (rojo) = la acción de la pantalla · tinta = selección activa y acción fuerte
secundaria · neutro = datos y filtros. **Prohibido** escribir hex sueltos en componentes de UI; las
ilustraciones usan `lib/marca.ts`.

## Tipografía
- `font-marca` (Playfair Display): wordmark, títulos de pantalla (`headline-lg`), nombres de producto.
- `font-sans` (DM Sans): todo lo demás.
- Escala: `headline-lg/md/sm`, `body-lg/md/sm`, `label-lg/md/sm`, `metric`. Cifras con `.tabular`.
- `cn()` conoce esta escala (tailwind-merge extendido): **no** quites esa config, o `text-body-md`
  borra el color del texto.

## Forma y profundidad
- Radios: cards `rounded-2xl`, héroes y galería `rounded-3xl`, botones e inputs `rounded-xl`, chips `rounded-full`.
- Sombras: `shadow-soft` (cards), `shadow-lift` (hover), `shadow-float` (diálogo), `shadow-primary-glow` (hover del CTA).
- Imágenes de producto siempre `aspect-[3/4]` (sin saltos de layout).

## Componentes
**Átomos (`components/ui`)** — no conocen el dominio:
- `Button` / `ButtonLink`: `primary`, `tinta`, `soft`, `ghost`, `outline`, `warning` (desactivar), `danger` (cancelar).
  Tamaños `sm` 40 px, `md` 48 px, `lg` 56 px. Navegación con `ButtonLink` (nunca `<button>` dentro de `<a>`).
- `Input` / `Textarea` (`outline` en formularios, `soft` en buscadores; `label`, `hint`, `error`), `Select`.
- `Badge` (tonos `neutral primary success warning danger info`), `Chip` (filtro; activo en tinta), `Skeleton`.
- `Drawer`: diálogo en escritorio, bottom-sheet (Vaul) en móvil, con `pie` fijo para el botón principal.
- `Pasos`: wizard de 1–3 campos por paso; `libre` para edición.

**Moléculas (`components/molecules`)**: `BarraBusqueda`, `PrecioTag` (oferta tachada), `StockBadge`
("Agotado", "¡Última pieza!", "Quedan 2"), `SelectorColor` (swatches con nombre, radio group) + `Swatches`,
`SelectorTalla` (agotadas tachadas), `EmptyState` (con Domi).

**Ilustraciones**: `Domi`, `Logo`, `PrendaImagen` (silueta de la prenda en el color elegido mientras no hay
foto; si hay `url` usa la foto real con `loading="lazy"`).

**Organismos**: `BottomNav` / `TopNav`, `PaginaError` (404 y error), `PantallaCarga`, `ProductoCard`,
`GaleriaProducto`, `FiltrosDrawer`, `ApartadoCard`, `DetalleApartado`.

## Patrones
- **Listas**: siempre buscador (debounce 300 ms) + chips. Si no hay resultados por búsqueda: "Sin resultados"
  (no el vacío inicial). Skeleton con la misma forma que la card. Sin animación de entrada.
- **Filtros en la URL** (`?categoria=vestidos&talla=M`, `?estado=por_vencer`): compartibles y enlazables
  desde el dashboard.
- **Formularios** en `Drawer`; altas largas con `Pasos`.
- **Éxito**: pantalla "¡Apartado listo!" con confeti de lunares, Domi volando y el folio grande.
- **Destructivo**: confirmación en línea; cancelar cambia el estado, no borra.
- **Estados**: vacío, cargando y error en toda vista con datos.

## Layout
- Header sólido (sin `backdrop-blur`) y `sticky`. Nav inferior fija en móvil con `pb-safe`; nav superior en escritorio.
- `min-h-dvh`, `scrollbar-gutter: stable`. En grids con carruseles usa `grid-cols-1` / `min-w-0`
  (si no, el carrusel ensancha la página).
- CTA de producto fijo sobre la nav inferior en móvil.

## Animación
CSS plano en `src/styles/index.css`: `domi-respira`, `domi-vuela`, `domi-ojo` (parpadeo), `lunar-confeti`,
`anim-pop`, `anim-sube`, `shimmer`. Respeta `prefers-reduced-motion`.

## Accesibilidad
- `aria-label` en botones de ícono; `role="alert"` en errores; íconos decorativos `aria-hidden`.
- Swatches y tallas como `radiogroup` con nombre ("Talla CH, agotada").
- Contraste AA: texto blanco solo sobre `primary-strong`, `tinta`, `error`.
