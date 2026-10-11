# Domna — Enfoque: SaaS multi-tenant white-label + integración real

> Decisión de producto (acordada 2026-10-10): Domna es un **SaaS multi-tenant con marca blanca
> (white-label)**. Una sola API y un solo front por debajo; cada boutique (tenant) se siente como
> su **propia app**: su nombre, su logo, su dominio y su PWA. La dueña nunca ve "Domna".
>
> Motivo: a las dueñas no les convence sentir que usan una herramienta de terceros ("la marquita");
> quieren algo que se sienta personalizado y profesional. White-label lo resuelve sin multiplicar
> el código: **un código, N apariencias**.

## Principios

1. **Una API multi-tenant.** Un backend, una base de datos (shared) con `TenantId` en cada tabla.
   Aislamiento por **query filter global** de EF Core (no se puede "olvidar" filtrar). El `tenant`
   viaja en el **JWT** (ya anotado en PLANEACION: "tenant del token").
2. **Un front que se alimenta del tenant.** El front no trae nada "de Domna" hardcodeado. Al cargar,
   **resuelve el tenant** (por dominio o por el token) y pide su **branding** a la API: nombre, logo,
   colores, nombre de la PWA, textos. Con eso se "pinta" solo.
3. **White-label de verdad.** Cada boutique puede tener:
   - su **dominio propio** (`tienda.jesly.mx`) o un subdominio (`jesly.domna.app`),
   - su **logo** y **nombre**,
   - su **PWA** con su nombre e ícono (manifest generado por tenant),
   - su **paleta** (al menos color primario) y textos clave.
4. **Branding compartido, no código por cliente.** Nada de forks por boutique: la personalización
   son **datos del tenant**, no ramas de código.

## Decisión de base de datos
- **Elegido: shared DB + `TenantId` + query filters** (recomendado para esta etapa).
  - Más barato y simple de operar (una base en Railway).
  - Aislamiento garantizado en código.
  - Migrar a base-por-tenant después es posible si algún cliente grande lo exige.
- Descartado por ahora: una base por boutique (aislamiento físico pero multiplica costo/operación).

## Dos pantallas de acceso (decisión UX)

Las clientas y el staff NO comparten pantalla de login. Son públicos distintos, con necesidades
distintas; mezclarlos confunde y se ve menos profesional.

### 1) Acceso de **clientas** (de cara al público)
- Tono cálido, de marca de la boutique. Teléfono + PIN, registro, recuperación.
- Mantiene "Solo quiero ver el catálogo" (si el catálogo es público).
- Es la cara bonita de la tienda; usa el branding del tenant (logo/nombre/color de la boutique).

### 2) Acceso de **staff** (dueña, cajera) — y en el futuro, personalizado por boutique
- Pantalla **sobria y profesional**, sin ilustración ni gancho de marketing. Entrada de "trabajo".
- Login directo (teléfono/usuario + PIN). Sin registro abierto: a la dueña y a las cajeras **las da
  de alta** quien corresponde (SuperAdmin crea a la dueña; la dueña crea a sus cajeras).
- Ruta separada (p. ej. `/acceso` o `/staff`) distinta de la de clientas (`/entrar`).

## Cambio inmediato pedido por la clienta (seguro, para ya)
- **Quitar "la marquita" (logo/ilustración Domi + wordmark) del login** para que se vea más limpio y
  profesional. El acceso queda sobrio. (El branding real por tenant llega en la fase white-label.)

## Fases (orden para no romper lo que ya funciona)

| Fase | Qué | Estado |
|---|---|---|
| F0 | **Demo actual**: login funcionando + crear catálogo (categorías/colores/productos). No se toca. | ✅ listo |
| F0.1 | **Login más limpio**: quitar la marca del acceso; dejar dos pantallas (clientas / staff). | 🔲 |
| F1 | **Fundamento multi-tenant**: entidad `Boutique` (tenant); `TenantId` en clientas, productos, categorías, colores, sucursales; query filter global; tenant en el JWT. Sucursales dejan de ser enum fijo → datos del tenant. | 🔲 |
| F2 | **Panel SuperAdmin** (tú): crear boutique + su dueña + sucursales + branding (nombre, logo, colores, slug/dominio). Rol `superadmin`. Crear staff (dueña/cajera), no solo clientas. | 🔲 |
| F3 | **White-label en el front**: resolver tenant por dominio, cargar branding del tenant, **PWA dinámica** (manifest con nombre/ícono del tenant), paleta por tenant. | 🔲 |
| F4 | **Dominios propios + suscripciones**: conectar dominio del cliente; estado de suscripción (kill switch ya existe como `suspendida`). | 🔲 |

## Contrato / backend (notas para F1–F2)
- Nueva entidad `Boutique` (tenant): `id`, `nombre`, `slug`, `dominio?`, branding (`logoUrl`,
  `colorPrimario`, …), config (penalización, días, `suspendida`, `catalogoPublico`), y sus `sucursales`.
- `Sucursal` pasa a ser entidad con `tenantId` (hoy es enum `temixco|azteca`).
- Todas las entidades de negocio ganan `tenantId` + query filter.
- JWT incluye `tenant` (claim). Middleware resuelve el tenant por dominio/host o por el claim.
- Roles: `superadmin` (tú) · `duena` · `cajera` · `clienta`.
- `AuthService` debe poder crear **staff** (dueña/cajera), no solo clientas (hoy `registrar` crea clientas).

## Qué NO hacer todavía
- No construir tenancy la noche antes de una demo. F0 se muestra tal cual.
- No forks de código por boutique. Toda personalización = datos del tenant.
