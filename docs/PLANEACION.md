# Domna — Planeación iterativa de la demo

> Objetivo: una demo que **se vea y se sienta real** para Jesly Boutique (Temixco / La Azteca),
> con datos mock en el front y la misma arquitectura que tendrá producción.
> Regla: cada iteración termina con `npm run typecheck && npm run lint && npm run build` en verde
> y algo **demostrable**. Si una iteración se atora, se recorta alcance, no calidad.

## Cómo trabajamos rápido
- **Mock service layer** (`src/mock/`): simula el API .NET (latencia 250–600 ms, errores 409 de
  stock, vencimientos). Persiste en `localStorage` para que la demo sobreviva un refresh.
  Cambiar a backend real = reemplazar `src/mock/server.ts` por llamadas `http` con el mismo
  contrato (`src/types/api.ts`).
- **Hooks por feature** (`features/*/hooks.ts`): las páginas nunca llaman al mock directo.
- **Design system primero**: tokens en `tailwind.config.js`, átomos en `components/ui`.
  Nada de hex sueltos en componentes.
- **Fotos**: mientras llegan las fotos reales, `PrendaImagen` dibuja la silueta de la prenda en
  el color elegido (el swatch cambia la "foto"). Con fotos reales basta llenar `imagenes[]`.

## Iteraciones

| # | Iteración | Entregable demostrable | Estado |
|---|---|---|---|
| I0 | Fundación | Vite + TS + Tailwind (tokens Domna) + Router + Query + PWA; Domi en SVG; bienvenida con selector de rol | ✅ |
| I1 | Catálogo clienta (el "wow") | Grid 2 columnas, búsqueda, filtros en URL (categoría, talla, color, precio, orden), detalle con galería, color, talla y stock en vivo | ✅ |
| I2 | Apartar | Drawer: modalidad (sin anticipo 2 días / 50% 15 días), sucursal de entrega (traslado +2 días hábiles), penalización $30 pendiente; folio y pantalla "¡Apartado listo!"; Mis apartados con saldo y vigencia | ✅ |
| I3 | Panel de la dueña | Dashboard (activos, por vencer, ventas del mes, stock bajo), apartados con chips y búsqueda, registrar abono / liquidar / cancelar / entrega, inventario y alta de producto en pasos | ✅ |
| I4 | Controles de demo | Avanzar el reloj (+1 día) para mostrar vencimientos y penalización, suspender boutique (kill switch), reiniciar datos | ✅ |
| I5 | Pulido | Vacío / cargando / error con Domi, 360 px, manifest PWA, docs | ✅ |

## Guion sugerido de la demo (10 min)
1. Bienvenida → **Soy clienta**. Navegar el catálogo, filtrar "Vestidos" talla M.
2. Abrir un vestido, cambiar el color (cambia la imagen), ver tallas agotadas tachadas y "Quedan 2".
3. **Apartar** con 50% → elegir La Azteca → folio y "¡Apartado listo!".
4. Mis apartados: saldo, vence en 15 días.
5. Cambiar a **Soy la dueña**: el dashboard ya muestra el apartado; registrar un abono y liquidar.
6. Controles de demo: avanzar 3 días → un apartado sin anticipo vence, el stock regresa y la
   clienta queda con $30 pendientes que aparecen en su siguiente apartado.
7. Suspender la boutique → la tienda muestra "Tienda en pausa" (modelo SaaS).

## Después de la demo (backlog)
- Backend .NET 8 (Clean Architecture, modo memoria → PostgreSQL), JWT, tenant del token.
- Fotos reales (R2 + WebP 400/800/1600), alta de fotos en el wizard.
- Job de vencimientos, SuperAdmin y suscripciones, despliegue Netlify + Railway.
- Pruebas de dominio (apartar sin stock, vencer libera, liquidar descuenta, precio congelado).
