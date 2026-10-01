# domna-web

PWA de **Domna** — *Tu estilo, apartado para ti*. Catálogo de boutique con apartados (anticipo, abonos,
vencimientos) y panel para la dueña. Esta versión es la **demo para Jesly Boutique** (Temixco / La Azteca)
con datos de ejemplo: no necesita backend.

## Arrancar
```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | typecheck + lint (0 avisos) + pruebas + build. Correr antes de cada commit |
| `npm test` | Pruebas de las reglas de apartados (Vitest) |
| `npm run build` / `preview` | Build de producción y vista previa |
| `node scripts/generar-iconos-pwa.mjs` | Regenera los íconos de la PWA |

## Qué incluye la demo
- **Clienta** (`/tienda`): catálogo con búsqueda y filtros en la URL, detalle con galería, color, talla y stock
  por sucursal. En cada prenda elige **comprar de contado** (paga el total, se descuenta el stock al momento) o
  **apartar** (50% → 15 días, o sin anticipo → 2 días); las prendas que la dueña marca "solo de contado" (las
  ofertas, en la demo) no se apartan. Traslado entre sucursales, pantalla de éxito con folio, "Mis pedidos" (en
  curso / historial) y cargo de $30 por apartado vencido.
- **Dueña** (`/app`): dashboard (activos, por vencer, ventas del mes, por cobrar, stock bajo, top), apartados con
  chips y búsqueda, registrar abono / liquidar / cancelar / entrega, recordatorio por WhatsApp, inventario con
  ajuste de stock y alta de producto en 4 pasos.
- **Controles de demo** (`/app/demo`): adelantar el reloj (vencimientos), poner la tienda en pausa (kill switch del
  SaaS) y reiniciar datos.

Los datos viven en `localStorage` (sobreviven al refresh). "Reiniciar datos" vuelve al estado inicial.

## Arquitectura
```
src/
├── app/          router (lazy por rol), layouts, providers
├── components/   ui (átomos) · molecules · organisms · ilustraciones (Domi, prendas) · feedback
├── features/     auth · catalogo · apartados · panel   (hooks.ts · components/ · pages/)
├── lib/          cn, format, reloj (hora de México + reloj de demo), queryKeys, enums
├── mock/         dominio.ts (reglas puras) · seed.ts · server.ts (API simulada) · *.test.ts
└── types/api.ts  contratos de la API
```
- Las páginas usan **hooks de TanStack Query**; los hooks llaman a `mock/server.ts`, que tiene el mismo contrato
  que tendrá el backend .NET. Para conectarlo: reimplementar `server.ts` con `fetch`.
- `mock/dominio.ts` son las invariantes (reservar stock, vencer, penalizar, liquidar, precio congelado) que se
  portarán a las entidades del backend.

Docs: [`docs/PLANEACION.md`](docs/PLANEACION.md) (iteraciones y guion de la demo) ·
[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

## Notas
- Sin login real: la bienvenida elige el rol. **No usar en producción sin backend y autenticación.**
- Las prendas se dibujan en SVG en el color elegido hasta tener las fotos reales (`imagenes[]` del producto).
