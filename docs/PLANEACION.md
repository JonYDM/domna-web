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
| I6 | Comprar o apartar | Compra de contado (pago completo, descuenta stock al momento) además de apartar; por prenda la dueña decide si se puede apartar (ofertas solo de contado); "Mis pedidos" con En curso / Historial; filtro "Por entregar" | ✅ |
| I7 | Novedades | Carruseles "Recién llegados" (alta < 7 días) y "De vuelta en stock" (una talla agotada volvió a tener piezas hace < 7 días) con "Ver todo" (`?seccion=`). Se derivan de fechas: caducan solas | ✅ |
| I8 | Avisos in-app | Campana con contador y centro de avisos de la clienta: vence en ≤ 3 días (urgente, banda en el catálogo), venció + cargo, abono recibido, va en camino, lista para recoger. Sin WhatsApp automático ni costo por mensaje | ✅ |
| I9 | Clientas y acceso | `/entrar`: "Continuar con Google" (selector simulado) o teléfono; a la nueva se le pide su WhatsApp una vez y, si ya estaba registrada en mostrador con ese número, se enlaza. Módulo Clientas de la dueña (total, nuevas, activas, cargo, cómo llegaron, ficha con pedidos, alta en mostrador). Nav de la dueña con Inicio al centro. Interruptor "Catálogo visible sin cuenta" en Demo | ✅ |

## Pendiente de decidir con la dueña (antes del backend)
- ¿Catálogo y precios **públicos** (link de Instagram) o **solo con cuenta**? En la demo se cambia en Demo.
- ¿Login con Google, con teléfono + código SMS, o ambos? (El SMS tiene costo por mensaje.)
- Aviso de privacidad (LFPDPPP) al guardar nombre, correo y teléfono.

## Avisos: cómo crece en el backend
1. **In-app (hecho en la demo):** los avisos se derivan del estado de los pedidos; solo se guarda cuáles leyó
   la clienta (`AvisoLeido`). Endpoint `GET /api/tienda/avisos` + `POST /api/tienda/avisos/leidos`.
2. **Web Push (siguiente paso, gratis):** para que el aviso llegue **con la app cerrada**. La PWA pide permiso, se
   guarda la suscripción (`PushSubscription`) y un `BackgroundService` diario envía "vence en 3 días / mañana"
   con el paquete `WebPush` (llaves VAPID, sin costo por mensaje). Android y escritorio: sí. iPhone: solo si
   instaló la app en la pantalla de inicio (iOS 16.4+). Por eso el aviso in-app sigue siendo la base.
3. **WhatsApp manual:** se queda el botón opcional de la dueña (`wa.me`, gratis). Sin API de Meta.

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

## Features anotadas (backlog)
- **Registro controlado de clientas:** la clienta pide su alta (nombre + WhatsApp) y la dueña la **aprueba** desde
  Clientas; al aprobarla se le genera un **PIN** (o un código de acceso) para entrar. Así solo las clientas
  aprobadas ven la tienda. Encaja con "catálogo privado" (`catalogoPublico = false`). Requiere: estado de la
  clienta (`pendiente | aprobada | bloqueada`), PIN hasheado con BCrypt y bloqueo tras N intentos (playbook §4.8).

## Imágenes del catálogo (Cloudflare R2)
Estimado para ~400 productos (≈ 4 fotos c/u, algunas por color ≈ 1,600 fotos):
- Se guardan solo **WebP optimizados** en 3 tamaños (400 / 800 / 1600 px ≈ 30 + 90 + 250 KB) ≈ **0.6 GB**.
  Aunque se duplicaran las fotos (más colores), queda **muy por debajo de los 10 GB gratis**.
- **No** guardar los originales del celular (3–5 MB c/u ≈ 6 GB): el backend los redimensiona y los descarta.
- Lecturas (Class B): 10 M gratis al mes. Con ~1,000 visitas/día × 30 imágenes ≈ 0.9 M/mes, y con la caché de
  Cloudflare delante (dominio propio) la mayoría ni siquiera llega a R2. Subidas (Class A): ~5,000, de 1 M gratis.
- Salida de datos (egress): gratis en R2.
- Usar **dominio propio** conectado a Cloudflare (p. ej. `img.domna.mx`), no `r2.dev` (tiene límite de
  velocidad y no es para producción). URLs inmutables por versión → `Cache-Control: max-age=31536000, immutable`.
- Fotos repetidas por color: una imagen se liga a un `colorId`; si dos colores comparten foto, se reutiliza la URL.
