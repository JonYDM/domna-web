# Archivo: presentación de ventas de Domna (para la futura landing)

Este material se **sacó de la app** (la app de la boutique ya es marca blanca y no lleva
mascota ni lunares), pero se conserva aquí para reutilizarlo cuando se construya la landing
de Domna. Nada de esta carpeta se compila ni se despliega: está fuera de `src/` y ESLint
la ignora (`docs` en `ignorePatterns`).

## Qué contiene

| Ruta dentro de `archivo-presentacion/` | Qué es |
|---|---|
| `src/features/presentacion/pages/PresentacionPage.tsx` | Visor del deck: autoplay con duración por diapositiva y barra de progreso; teclado (← → navegan, Espacio pausa, Esc sale), deslizar en el celular y puntos de navegación. |
| `src/features/presentacion/Diapositivas.tsx` | Las diapositivas (contenido, textos y maquetas): propuesta, cómo funciona el apartado, comparativa contra "Libreta + WhatsApp" y "Tienda en línea genérica", y cifras de ahorro. |
| `src/features/presentacion/BotonPresentacion.tsx` | Botón que antes vivía en el login y llevaba a `/presentacion`. |
| `src/components/ilustraciones/Domi.tsx` | Domi, la catarina, en SVG: 7 expresiones (feliz, enamorada, guiño, curiosa, sorprendida, triste, dormida) y animaciones (respira, vuela, parpadea). |
| `src/components/ilustraciones/DomiImagen.tsx` | Domi como imagen WebP (usa `public/domi-512.webp`). |
| `src/components/ilustraciones/Logo.tsx` | Logotipo "Domna." en texto. |
| `src/components/feedback/ConfetiLunares.tsx` | Confeti de lunares para celebraciones. |
| `public/domi-128.webp`, `public/domi-512.webp` | Ilustración oficial de Domi. |
| `public/favicon.svg` | Favicon original (carita de Domi). |
| `estilos-presentacion.css` | Todo el CSS que usaban el deck y Domi: `rev`, `progreso-activo`, `entra-diapo`, `domi-*`, `lunar-confeti`, etc. |

## Dependencias externas del código archivado

Estos archivos importaban cosas que **siguen existiendo en la app**; al reutilizarlos en otro
proyecto hay que llevarlas o reemplazarlas:

- `@/lib/marca` (`MARCA`: paleta para SVG de Domi) — sigue en `src/lib/marca.ts`.
- `@/lib/cn`, `@/components/ui` (botones), `lucide-react`.
- Tokens de color y tipografía de `tailwind.config.js` (crema editorial, Fraunces + DM Sans).
- La clase `.lunares` (fondo de lunares) sigue definida en `src/styles/index.css`.

## Cómo reutilizarlo

1. Copiar la carpeta que se necesite a la landing (por ejemplo `src/features/presentacion/`).
2. Pegar `estilos-presentacion.css` en el CSS global de la landing.
3. Copiar `public/domi-*.webp` al `public/` de la landing.
4. **Actualizar las cifras de `Diapositivas.tsx` antes de publicar.** Están escritas a mano y ya
   no coinciden con la configuración real del backend:

   | En el deck | Configuración real hoy |
   |---|---|
   | Apartar con 50 % de anticipo | 30 % (`AnticipoPct`) |
   | Se guarda 15 días | 7 días con anticipo (`VigenciaConAnticipoDias`) |
   | Sin anticipo, 2 días | 2 días (coincide) |
   | Cargo de $30 por apartado vencido | $100 (`Penalizacion`) |

   También menciona "Jesly Boutique" (diapositiva inicial y cierre) y el cierre invita a
   "ver la demo" (`onVerDemo`), que habrá que apuntar al destino que tenga la landing. Los
   montos de ahorro ($6,000/mes, apartados de $600) son supuestos del discurso, no datos medidos.

## Nota de marca

La decisión vigente es **marca blanca** en la app: nombre, logo e icono salen de la boutique
(hoy Jesly Boutique). Domna y Domi solo deben aparecer en la landing y en este deck.
