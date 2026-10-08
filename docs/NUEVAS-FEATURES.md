# Domna — Nuevas features y modificaciones

> Planeación de la segunda tanda de cambios, acordada con la dueña (Jesly Boutique) antes de
> arrancar el backend. Mismo método que [`PLANEACION.md`](PLANEACION.md): cada iteración termina
> con `npm run check` en verde y algo **demostrable**. El contrato (`src/types/api.ts`) y el dominio
> (`src/mock/dominio.ts`) se tocan primero porque son lo que se portará a .NET.
>
> **Estado global:** 🔲 pendiente · 🟡 en curso · ✅ hecho

## Contexto / por qué

La dueña probó la demo y pidió seis cambios. Resumen de sus palabras:

1. **Login más simple.** Registrar/dar de alta clientas una por una es tedioso. Mejor un
   **sign-in / log-in propio** con formulario. Quitar Google y el flujo actual de "solo teléfono".
2. **Métricas por sucursal + ganancia real.** Poder filtrar las métricas por sucursal y ver la
   **ganancia** (no solo la venta). Para eso el producto necesita **costo** además de **precio de venta**.
3. **Rol cajera.** Un tercer rol que **no ve métricas ni ganancias del mes/software**, pero sí
   **lo que vendió en el día** (venta y ganancia del día) y **puede registrar productos**.
4. **Tallas / tamaños por tipo.** Enum de tamaños genéricos (p. ej. una bolsa: **chica / mediana / grande**),
   además de las tallas de ropa que ya existen.
5. **POS con escáner de código de barras (PWA, también iOS).** Vender en físico escaneando el
   código de barras con la cámara del teléfono. Incluye **carrito** (varios productos) y una **venta
   a público general** cuando la clienta no está registrada / no se quiere registrar.
6. **Código de barras en el producto.** Al dar de alta un producto, además de las fotos, capturar su
   **código de barras** (escanear en el momento o escribirlo).

Y transversal: **documentación viva** — actualizar README y planeación conforme se construye.

---

## Decisiones de diseño (para fijar antes de codear)

### Autenticación
- **Formulario de registro (sign-in):** nombre, apellidos, teléfono (10 dígitos, lada **+52** fija por
  defecto), **correo** y **PIN de 6 dígitos**. El teléfono es el identificador de acceso; el correo es
  **obligatorio** (hoy era opcional) porque es el canal de recuperación.
- **Login:** teléfono + **PIN de 6 dígitos** (único método, nada de contraseña alfanumérica). Más rápido
  en móvil con teclado numérico. En el backend el PIN se guarda como hash (BCrypt).
- **Olvidé mi PIN:** se recupera por **correo** (no por SMS, para evitar el costo por mensaje). La clienta
  escribe su correo registrado y le llega un **enlace/código** para fijar un PIN nuevo. En la demo el
  correo se **simula** (se muestra el enlace/código en pantalla / toast); en producción es un proveedor
  de correo transaccional (gratis o muy barato comparado con SMS).
- **Qué se quita:** "Continuar con Google" (`SelectorCuentaGoogle`, `GoogleLogo`, `entrarConGoogle`,
  `CuentaGoogle`, `OrigenClienta = "google"`) y el flujo "solo teléfono sin contraseña".
- **Separación nombre/apellidos:** `Clienta` pasa a tener `nombre` y `apellidos`. Donde hoy se usa
  `nombre` completo, se deriva `${nombre} ${apellidos}`.

### Roles
- Hoy: `clienta | duena`. Nuevo: **`clienta | duena | cajera`**.
- **Cajera** puede: POS/venta en físico, registrar productos, ver inventario, ver **su corte del día**
  (venta y ganancia **del día**, de su sucursal).
- **Cajera NO** puede: dashboard de métricas del mes, ganancia total, controles de demo/SaaS,
  configuración, ni ver costos históricos fuera de su corte.
- Guardia de rutas: hoy existe `SoloDuena`. Añadir `SoloStaff` (dueña **o** cajera) para POS/alta de
  producto, y mantener `SoloDuena` para métricas y configuración.

### Métricas por sucursal y ganancia
- `Producto` gana `costo: number` (lo que le costó a la boutique) junto al `precio` (venta).
- **Ganancia** de una línea vendida = `precio_congelado − costo_al_momento`. Para que la ganancia
  histórica no se distorsione si cambia el costo, se **congela el costo** en la línea de venta
  (igual que ya se congela el precio). → `LineaApartado` gana `costo`.
- `Metricas` acepta filtro **por sucursal** (`sucursal?: SucursalId | "todas"`) y expone
  `gananciaMes` y `gananciaDia`. El cálculo agrupa ventas por `sucursal` de la línea.
- **Corte de cajera:** nuevo endpoint `obtenerCorteDia(sucursal, fecha?)` → `{ ventasDia, gananciaDia,
  piezasDia, ticketsDia }`. Es lo único de dinero que ve la cajera.

### Tallas / tamaños
- Hoy en `enums.ts`: `TALLAS_ROPA`, `TALLAS_NUMERICAS`, `TALLA_UNICA`.
- Añadir `TAMANOS_GENERICOS = ["Chica", "Mediana", "Grande"]` para siluetas tipo `bolsa` / accesorio.
- El wizard de alta propone el juego de tallas según la **categoría** (ya existe `Categoria.tallas`);
  solo hay que agregar el preset genérico y ligarlo a la silueta `bolsa`.

### POS / venta en físico con escáner
- **Flujo acordado:**
  1. Llega una clienta presencial (sin apartado/compra previa en Domna).
  2. Staff inicia una **venta en físico**.
  3. ¿Registrar a la clienta? Si **no**, la venta va a **"Público general"** (clienta genérica del sistema).
  4. Se **escanea el código de barras** de cada prenda → se agrega al **carrito**.
  5. Se cobra; descuenta stock al momento (como la compra de contado actual).
- **Carrito:** hoy el apartado/compra es de **una** variante. Nuevo: carrito con **varias líneas**.
  El contrato de `CrearApartadoInput` pasa a aceptar `lineas: { varianteId; cantidad }[]`
  (manteniendo compatibilidad con el flujo de la clienta, que agrega de a uno).
- **Identificador de venta en físico:** `Apartado` gana `canal: "online" | "fisico"` (default `online`),
  además de la `sucursal` que ya se registra. Así las métricas separan físico vs. online.
- **Escáner — recomendación técnica (importante para iOS):**
  - iOS Safari **no** soporta la `BarcodeDetector` API nativa, así que el decodificador corre en JS.
  - Librería elegida: **`html5-qrcode`**. Verificado: funciona en **iOS Safari** (usa `getUserMedia`,
    iOS 11+), decodifica los formatos de retail (**EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39**) y
    maneja bien las rarezas de iOS Safari (permisos, orientación). Un solo bundle (~230 KB), más chico
    que ZXing. Donde exista `BarcodeDetector` nativa (Android/Chrome) se puede usar como atajo opcional.
  - Requisitos PWA: la cámara exige **HTTPS** (ya se cumple en Netlify) y permiso del usuario. En
    multicámara (Android), enumerar cámaras y elegir la trasera por etiqueta, no solo `facingMode`.
  - En la demo (sin cámara garantizada / sin backend) el escáner tiene **modo manual**: capturar el
    código a mano o botón "simular escaneo" que elige una variante del seed. La cámara se activa cuando
    hay `getUserMedia`.

### Código de barras en el producto
- `Producto` y `Variante` ganan `codigoBarras?: string`. En retail el código suele ser **por variante**
  (talla+color = SKU físico distinto), así que el campo vive en `Variante`; el producto puede llevar uno
  "principal" opcional para búsqueda rápida.
- En el wizard de alta: campo de código de barras con botón **escanear** (misma utilidad del POS) o
  escribir. El POS busca la variante por `codigoBarras`.

---

## Iteraciones

| # | Iteración | Entregable demostrable | Estado |
|---|---|---|---|
| N0 | Contrato + dominio | Tipos nuevos en `api.ts` (roles, costo, ganancia, canal, código de barras, carrito, nombre/apellidos), reglas de ganancia y corte en `dominio.ts`, pruebas en verde | ✅ |
| N1 | Auth propia | Quitar Google; formulario de registro (nombre, apellidos, tel +52, **correo**, **PIN 6 dígitos**) y login tel+PIN; "olvidé mi PIN" por **correo** simulado; `Rol` con `cajera`; guardias `SoloStaff`/`SoloDuena` | ✅ |
| N2 | Costo y ganancia | Campo costo en alta de producto; `Metricas` con filtro por sucursal + `gananciaMes`; dashboard de la dueña con selector de sucursal y tarjeta de ganancia | ✅ |
| N3 | Rol cajera + corte del día | Layout/nav de cajera, ruta protegida; "Corte del día" (venta y ganancia del día); POS "Vender" destacado; sin acceso a métricas del mes | ✅ |
| N4 | Tallas/tamaños genéricos | `TAMANOS_GENERICOS` en enums; preset por silueta `bolsa`; wizard propone chica/mediana/grande | ✅ |
| N5 | Carrito + venta en físico | Carrito multi-línea real en dominio; POS `VenderPage` (público general o clienta), `canal: "fisico"`; descuenta stock al cobrar; refresca corte/inventario/métricas | ✅ |
| N6 | Escáner de código de barras | Utilidad de escaneo (`html5-qrcode`, modo manual en demo); escanear en el POS (buscar variante) y en el alta de producto (capturar código) | ✅ |
| N6.1 | Fix: stock por sucursal en alta | `NuevoProductoInput.stock` pasa a `Record<SucursalId, …>`; el wizard captura stock **independiente** por sucursal (antes el badge mostraba una copia); POS mobile-first (barra inferior fija + carrito en drawer, categorías) | ✅ |
| N7 | Pulido + docs vivas | Enlaces de vuelta del detalle respetan `/caja`; tab Clienta del POS corregido; README, PLANEACION y DESIGN-SYSTEM actualizados a las features nuevas | ✅ |
| N8 | Carrito de la clienta | Store de carrito (localStorage por clienta) + `CarritoProvider`; botón "Agregar al carrito" en el producto; ícono de carrito con contador en el header; página `/tienda/carrito` (una modalidad/método/sucursal para todo el pedido, ofertas fuerzan comprar) que confirma vía `crearApartado` multi-línea; conserva Comprar/Apartar directos | ✅ |

> Orden pensado para que cada paso compile solo. N0 primero (todo lo demás depende del contrato).
> N5 depende de N0 (carrito) y N4 (tamaños ayudan a probar bolsas). N6 cierra el POS.

---

## Cambios de contrato (resumen para el backend .NET)

```ts
// Roles
type Rol = "clienta" | "duena" | "cajera";

// Clienta: nombre separado + auth propia
interface Clienta {
  nombre: string;        // nombres de pila
  apellidos: string;     // NUEVO
  telefono: string;      // 10 dígitos, lada +52 implícita (identificador de acceso)
  email: string;         // AHORA obligatorio (canal de recuperación del PIN)
  // PIN (6 dígitos) NO viaja al front; en backend es hash BCrypt
  origen: "registro" | "mostrador";  // se quita "google"/"telefono"
  // ...
}

// Producto / Variante: costo y código de barras
interface Producto { precio: number; costo: number; /* NUEVO */ codigoBarras?: string; /* ... */ }
interface Variante { codigoBarras?: string; /* NUEVO, por SKU físico */ /* ... */ }

// Venta: carrito, canal y costo congelado
interface LineaApartado { precio: number; costo: number; /* NUEVO: congelado */ /* ... */ }
interface Apartado { canal: "online" | "fisico"; /* NUEVO */ /* ... */ }
interface CrearApartadoInput {
  lineas: { varianteId: string; cantidad: number }[];  // NUEVO: multi-línea
  modalidad: ModalidadApartado;
  entrega: SucursalId;
  canal?: "online" | "fisico";
  clientaId?: string;   // ausente => "público general" en físico
  metodoAnticipo?: MetodoPago;
}

// Métricas por sucursal + ganancia
interface Metricas {
  // ...lo existente
  gananciaMes: number;      // NUEVO: Σ (precio - costo) de líneas vendidas
}
interface FiltroMetricas { sucursal?: SucursalId | "todas"; }   // NUEVO
interface CorteDia {        // NUEVO (lo que ve la cajera)
  sucursal: SucursalId;
  ventasDia: number;
  gananciaDia: number;
  piezasDia: number;
  tickets: number;
}
```

### Invariantes nuevas en `dominio.ts` (se portan al backend)
- **Ganancia = Σ(precioCongelado − costoCongelado)** de las líneas de ventas liquidadas/compradas.
  El costo se congela al crear la línea; cambiar el costo del producto no altera ventas pasadas.
- **Corte del día:** ventas con `cerradoEl` dentro del día local (México) y `sucursal` dada.
- **Venta en físico:** `canal = "fisico"`, descuenta stock al cobrar; si no hay `clientaId`, usa la
  clienta sistema **"Público general"** (no cuenta como clienta nueva en el resumen).
- **Acceso cajera:** no puede leer métricas con `sucursal` distinta a la suya ni la ganancia del mes.

---

## Librerías a añadir
- **`html5-qrcode`**: escaneo de código de barras 1D/2D en navegador. Verificado con soporte **iOS
  Safari** (vía `getUserMedia`) y Android; decodifica EAN-13/8, UPC-A/E, Code 128/39. Un solo bundle
  (~230 KB), Apache-2.0, activamente mantenido.
- Nada más por ahora. BCrypt y el correo transaccional son del backend, no del front.

## Riesgos / notas
- **iOS + cámara:** solo funciona en HTTPS y con permiso; dentro de la PWA instalada el acceso a
  `getUserMedia` es estable en iOS. Probar el camino "permiso denegado" con una UI que explique cómo
  reactivarlo en Ajustes. Mantener modo manual como respaldo.
- **Seguridad auth:** el PIN nunca en `localStorage` en claro; en la demo la "sesión" sigue siendo
  mock, pero el formulario y las validaciones quedan listas para el backend (hash BCrypt, rate-limit,
  bloqueo tras N intentos, token de recuperación de un solo uso con expiración — ver playbook §4.8).
- **Compatibilidad del contrato:** `CrearApartadoInput` pasa a multi-línea; hay que migrar el flujo
  actual de la clienta (una variante) a `lineas: [{...}]` sin romper apartados/compras existentes.
- **Público general:** definir una `clientaId` reservada en el seed para no ensuciar el módulo Clientas.

## Guion de demo (añadidos)
1. **Registro:** una clienta nueva se da de alta (nombre, apellidos, tel +52, correo, PIN de 6 dígitos) y entra.
2. **Olvidé mi PIN:** escribir el correo → mostrar el enlace/código de recuperación simulado → fijar PIN nuevo.
3. **Dueña:** dashboard, cambiar selector de sucursal → métricas y **ganancia** por sucursal.
4. **Cajera:** entrar como cajera → solo ve **Corte del día**; registra un producto con **costo** y
   **código de barras** (escaneado).
5. **POS:** iniciar venta en físico → "Público general" → escanear 2 prendas al **carrito** → cobrar;
   el stock baja y la venta aparece como **físico** en las métricas de la dueña.
