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
- **Acceso** (`/entrar`): cuenta propia de Domna. **Registro** con nombre, apellidos, teléfono (+52) y **PIN de
  6 dígitos**; **inicio de sesión** con teléfono + PIN; **recuperación** del PIN por correo (en la demo el enlace
  se muestra en pantalla). Clientas de ejemplo: `777 123 4567` / PIN `123456` (María).
- **Clienta** (`/tienda`): catálogo con búsqueda y filtros en la URL, detalle con galería, color, talla y stock
  por sucursal. En cada prenda elige **comprar de contado** (paga el total, se descuenta el stock al momento) o
  **apartar** (50% → 15 días, o sin anticipo → 2 días); las prendas marcadas "solo de contado" (las ofertas) no se
  apartan. Traslado entre sucursales, pantalla de éxito con folio, "Mis pedidos" (en curso / historial), avisos
  in-app y cargo de $30 por apartado vencido.
- **Dueña** (`/app`): dashboard con **selector de sucursal** (Todas / Temixco / La Azteca), métricas (activos, por
  vencer, ventas del mes, por cobrar, por entregar, stock bajo, top) y **ganancia del mes** (precio − costo
  congelados); apartados con chips y búsqueda, registrar abono / liquidar / cancelar / entrega, recordatorio por
  WhatsApp, inventario con ajuste de stock y **alta de producto** (nombre, categoría, colores y tallas, **stock
  independiente por sucursal**, precio, **costo** y **código de barras** por variante). Clientas y catálogo de
  atributos (categorías con sus tallas, colores).
- **Cajera** (`/caja`): rol de mostrador. Ve su **corte del día** (venta y ganancia **del día** de su sucursal),
  puede registrar productos y usar el **POS**. No ve métricas del mes ni la ganancia global.
- **POS / Vender** (`/caja/vender`): venta en físico. Carrito de varias prendas (buscar o **escanear** el código
  de barras con la cámara —`html5-qrcode`, también en iOS—, con modo manual de respaldo), venta a **Público
  general** o a una clienta registrada, cobro de contado que descuenta stock y aparece en el corte y las métricas.
- **Tamaños**: ropa (CH/M/G/XG), numérica, calzado y **genéricos** (Chica / Mediana / Grande) para bolsas y
  accesorios.
- **Controles de demo** (`/app/demo`): adelantar el reloj (vencimientos), poner la tienda en pausa (kill switch del
  SaaS) y reiniciar datos.

Los datos viven en `localStorage` (sobreviven al refresh). "Reiniciar datos" vuelve al estado inicial.

## Arquitectura
```
src/
├── app/          router (lazy por rol), layouts, providers
├── components/   ui (átomos) · molecules · organisms · ilustraciones (Domi, prendas) · feedback
├── features/     auth · catalogo · apartados · panel · pos · avisos · presentacion
│                 (hooks.ts · components/ · pages/)
├── lib/          cn, format, reloj (hora de México + reloj de demo), queryKeys, enums
├── mock/         dominio.ts (reglas puras) · seed.ts · server.ts (API simulada) · *.test.ts
└── types/api.ts  contratos de la API
```
- Las páginas usan **hooks de TanStack Query**; los hooks llaman a `mock/server.ts`, que tiene el mismo contrato
  que tendrá el backend .NET. Para conectarlo: reimplementar `server.ts` con `fetch`.
- `mock/dominio.ts` son las invariantes (reservar stock, vencer, penalizar, liquidar, precio congelado) que se
  portarán a las entidades del backend.

Docs: [`docs/PLANEACION.md`](docs/PLANEACION.md) (iteraciones y guion de la demo) ·
[`docs/NUEVAS-FEATURES.md`](docs/NUEVAS-FEATURES.md) (segunda tanda: auth propia, roles, ganancia por
sucursal, POS con escáner) · [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

## Notas
- Auth simulada: el registro/login con PIN y la recuperación por correo viven en el mock (`localStorage`), con el
  mismo contrato que tendrá el backend (hash del PIN, token de recuperación). La bienvenida permite entrar como
  clienta, dueña o cajera. **No usar en producción sin backend y autenticación reales.**
- Las prendas se dibujan en SVG en el color elegido hasta tener las fotos reales (`imagenes[]` del producto).
