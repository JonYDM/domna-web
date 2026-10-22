# Domna — Estado de la integración real (bitácora)

> Última actualización: 2026-10-11. Resumen de dónde vamos, qué se corrigió y qué sigue.
> Repos: **domna-web** (front, Netlify) y **domna-api** (backend .NET, Railway).

## Arquitectura actual (en producción)

- **Backend**: .NET 8 Clean Architecture en **Railway** → `https://domna-api-production.up.railway.app`
  (Swagger en `/swagger`). Proyecto Railway: `resourceful-manifestation`.
- **Base de datos**: **PostgreSQL en Railway**, PERSISTENTE y verificado. EF Core aplica migraciones
  al arrancar (`Migrate()`), seed idempotente. Versión Postgres fijada (auto-updates OFF).
- **Front**: React + Vite + Tailwind en **Netlify** (`appdomna.netlify.app`).
  Interruptor `VITE_API_URL`: si apunta a Railway usa la API real; si vacío, usa el mock.
- **Imágenes**: **Cloudflare R2** (bucket `domna-fotos`), subida vía presigned URL firmada por el
  backend; la URL pública de R2 vive en variables de entorno (ver SECRETOS-LOCALES.md, fuera de git).

## Qué funciona hoy (integrado con la API real)

- **Auth unificada** (una pantalla `/` que rutea por rol):
  - Clientas: registro (sign up), login teléfono+PIN, recuperación por correo (SMTP Gmail real).
  - Staff: dueña y cajera sembradas por variables de entorno (ver SECRETOS-LOCALES.md, fuera de git).
  - Login inteligente: si el teléfono no existe no avanza (invita a registrarse); si ya entró en el
    dispositivo saluda por su nombre (guardado local, sin exponer datos). Endpoint `existe` solo bool.
  - PIN con BCrypt, JWT con rol; keypad glass; prefijo +52 fijo.
- **Catálogo CRUD real**: categorías (con tallas), colores (catálogo), productos.
- **Productos con galería tipo Zara**:
  - Varias fotos POR COLOR (máx 5), optimizadas a WebP, con recorte de fondo opcional (IA local
    @imgly, lazy), encuadradas en lienzo 3:4 UNIFORME sobre el fondo del tono.
  - La galería de la tienda cambia al seleccionar color; lightbox (zoom, teclado, swipe).
  - Editar producto: campos simples; **agregar color** (crea variantes nuevas); **editar galería**
    (quitar foto; si queda 1 → reemplazar o quitar-con-confirmación que borra el color+variantes;
    no deja quitar si tiene apartados [preparado] ni el único color).
- **Cards de catálogo y ficha de producto** rediseñadas estilo boutique editorial (menos "AI slop").
- **Códigos QR por variante (autogenerados)**: al crear producto (o agregar color), el SERVIDOR
  genera SIEMPRE un código único por variante (`DMN-xxxxxxxx`). Ya no se teclea/escanea en el alta.
  - Ficha de dueña → botón "Códigos" → vista imprimible de QR por variante (cantidad por variante,
    nombre+color+talla, `@media print` con guía de recorte, `window.print()`). Lib `qrcode`.
  - El POS escanea el QR (`/api/productos/codigo/{codigo}`) → identifica la variante exacta y vende
    sin teclear (estilo Zara). Verificado e2e en producción.
  - Feedback premium al publicar: overlay "Generando los códigos de tu producto".

## Credenciales / cuentas sembradas (seed)
Los teléfonos y PINs reales ya **no viven en el repo** (es público). Se inyectan por variables de
entorno (`Seed__DuenaPin`, `Seed__CajeraPin`, etc.) y están documentados en `SECRETOS-LOCALES.md`
(ignorado por git, solo en la máquina local). Sin `Seed__DuenaPin` el seed no crea cuentas de staff.

## Lo que se corrigió hoy (importante)

1. **Pérdida de datos en cada deploy (RESUELTO).** Causa raíz: la variable `DATABASE_URL` en el
   servicio `domna-api` estaba como **referencia** `${{Postgres.DATABASE_URL}}` que Railway NO
   inyectaba al contenedor → el backend caía a **InMemory** → datos efímeros. **Solución**: poner
   `DATABASE_URL` con el **valor directo** (`postgresql://...@postgres.railway.internal:5432/railway`).
   Verificado: tras redeploy las tablas se crean y los productos PERSISTEN.
   - De paso se agregó log de arranque: "Base de datos: PostgreSQL/InMemory" y, si falla la conexión,
     el deploy falla visible (antes caía silencioso a InMemory).
   - El volumen de Postgres (`/var/lib/postgresql/data`) está bien y la versión quedó fija (sin auto-update).
2. **El front creaba productos en el mock**: cuando `VITE_API_URL` no estaba activa, los productos
   iban al localStorage del navegador (se "perdían"). Con la variable apuntando a Railway, van a Postgres.
3. **Login**: bug de "dueña entraba como clienta fantasma" → login unificado que respeta el rol real.
4. **Fotos no se veían**: eran bugs de visualización (vistas que ignoraban `imagenes[]`); corregidas en
   lista de inventario, ficha de dueña y catálogo.

## Pendientes de seguridad (hacer pronto)
- **Rotar la contraseña del Postgres** de Railway (se compartió en chat durante el debug) y actualizar
  `DATABASE_URL`. 
- Confirmar/mantener `VITE_API_URL` en Netlify apuntando a Railway.
- (Menor) DataProtection keys: hoy en disco efímero del contenedor; mover a volumen/BD si molesta.

## Verificación
- Backend: `dotnet test` → 86/86 en verde.
- Front: `npm run typecheck && npm run lint && npm run build` en verde; detector de diseño limpio.

## Próximos pasos (acordados) — "la interacción real"

1. **Carrito de la clienta (integración real)**: hoy el carrito del front vive en el mock/localStorage.
   Llevarlo al backend: contrato de carrito/pedido, endpoints, y que al confirmar cree el apartado/compra.
   (Depende de construir el módulo de **apartados/pedidos** en el backend, que aún no existe en .NET.)
2. **La dueña ve a sus clientas registradas (integración real)**: hoy el módulo Clientas de la dueña usa
   el mock. Conectarlo a la API real:
   - Backend: endpoints para listar clientas (con filtros: todas/activas/nuevas/cargo), resumen
     (total, nuevas de la semana, con apartado activo, con cargo), y ficha de clienta con sus pedidos.
   - Front: `features/panel` Clientas/ClientaPage apuntar al selector real (como se hizo con catálogo).
   - Las clientas que se registran desde `/` ya se guardan en Postgres (tabla Clientas), así que la
     dueña podrá verlas realmente.

### Orden sugerido
Primero **Clientas de la dueña** (más directo: la tabla Clientas ya existe y se llena con los registros
reales; solo faltan endpoints de listado/resumen/ficha y conectar el front). Luego el **carrito**, que
es más grande porque arrastra el módulo de apartados/pedidos en el backend.

## Notas de módulos aún en MOCK (no integrados al backend todavía)
- Apartados / pedidos, métricas del dashboard, corte de caja, POS, avisos, carrito, módulo Clientas.
- El backend .NET hoy cubre: auth (clientas+staff), categorías, colores, productos (con galería/variantes),
  imágenes R2. El resto sigue en `src/mock/server.ts` del front.
