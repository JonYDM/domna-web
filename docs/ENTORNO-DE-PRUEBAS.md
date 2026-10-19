# Entorno de pruebas (staging) de Domna

Estado: **pendiente de hacer**. Este documento es el plan para retomarlo cuando haya tiempo.

## Para qué sirve

Probar versiones nuevas sin tocar a Jessica ni sus datos, y pasarlas a producción solo cuando estén bien.

Hoy cada `git push` a `main` publica directo a producción (Netlify y Railway). La cuenta de la dueña es de una sola sesión: si entras a probar, la sacas a ella, y los datos de prueba se mezclan con los reales.

## Cómo va a funcionar

```
  tu máquina ──push──▶ rama `staging` ──▶ entorno de PRUEBAS (datos de mentira)
                              │
                       (revisas y apruebas)
                              │
                              └──merge──▶ rama `main` ──▶ PRODUCCIÓN (Jessica)
```

- Todo cambio nuevo se sube **primero a `staging`**.
- Cuando se ve bien en pruebas: `git checkout main && git merge staging && git push`.
- Backend primero y front después cuando hay contrato nuevo (igual que ahora).

## Qué se necesita (todo separado de producción)

| Pieza | Producción hoy | Pruebas |
| --- | --- | --- |
| Front | Netlify `appdomna` (rama `main`) | Netlify **sitio nuevo** `appdomna-pruebas` (rama `staging`) |
| API | Railway, servicio actual | Railway **proyecto nuevo** `domna-pruebas` (rama `staging`) |
| Base de datos | Postgres de producción | Postgres **propio** de pruebas (vacía) |
| Fotos | bucket R2 `domna-fotos` | mismo bucket, carpeta `pruebas/` (o un bucket aparte) |
| Sesiones / JWT | `Jwt__Secret` de producción | **otro** `Jwt__Secret`, para que una sesión de pruebas nunca valga en producción |

Por qué un **sitio** de Netlify aparte y no solo una rama: tu cuenta no permite variables de entorno por rama (`env_var_scopes` no incluido), y el front nuevo terminaría apuntando a la API de producción. Un sitio aparte tiene su propia `VITE_API_URL`.

## Pasos

### 1. Código (lo hago yo)

- [ ] Quitar el PIN de la dueña de `Seed.cs` y leerlo de una variable (`Seed__DuenaPin`). Sin esa variable, la carga inicial no crea cuentas de equipo. En producción no cambia nada: la carga inicial solo corre con la base vacía.
- [ ] Agregar `R2__PrefijoClaves` (por ejemplo `pruebas/`) para que las fotos y comprobantes de pruebas queden en su carpeta.
- [ ] Crear la rama `staging` en `domna-api` y `domna-web`.
- [ ] README: flujo de trabajo (pruebas → producción).

### 2. Railway (lo haces tú; yo no tengo acceso)

1. Proyecto nuevo `domna-pruebas`.
2. Agregar **Postgres** (plantilla de Railway).
3. Agregar un servicio desde GitHub: repo `JonYDM/domna-api`, **rama `staging`**.
4. Variables del servicio (los valores secretos los generas tú y no se suben al repositorio):

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | la referencia al Postgres del proyecto (Railway la ofrece) |
| `Jwt__Secret` | un texto largo y aleatorio **distinto al de producción** (mínimo 32 caracteres) |
| `Cors__Origenes` | la URL del sitio de pruebas, por ejemplo `https://appdomna-pruebas.netlify.app` |
| `Seed__DuenaPin` | un PIN de pruebas de 6 dígitos |
| `R2__AccountId`, `R2__Bucket`, `R2__UrlPublica`, `R2__AccessKey`, `R2__SecretKey` | iguales a producción si usas el mismo bucket |
| `R2__PrefijoClaves` | `pruebas/` |
| `Correo__*` | vacío (en pruebas no se mandan correos) |

5. Al arrancar, el servicio aplica las migraciones solo y crea los datos de ejemplo.
6. Copiar la URL pública del servicio (la necesita el front de pruebas).

> Railway cobra por uso: un segundo servicio y una segunda base suman a tu cuenta. Revisa tu plan antes de crearlo.

### 3. Netlify (lo puedo hacer yo con tu sesión)

1. Sitio nuevo `appdomna-pruebas`, conectado a `JonYDM/domna-web`, **rama de producción = `staging`**.
2. Variable `VITE_API_URL` = la URL del paso 2.6.
3. Dar de alta esa URL en `Cors__Origenes` de Railway (paso 2.4).

### 4. Comprobar el entorno de pruebas

- [ ] La app de pruebas carga y entra con la dueña de pruebas.
- [ ] Crear un producto con foto: la foto queda en `pruebas/` de R2, no en la carpeta de producción.
- [ ] Una compra de prueba y un pago por confirmar de punta a punta.
- [ ] Producción sigue igual: mismo número de productos, y la sesión de Jessica no se cerró.

## Seguridad (revisar de todos modos)

- Los repositorios `domna-api` y `domna-web` son **públicos**. Cualquier valor escrito en el código lo puede leer cualquiera.
- `Seed.cs` tiene el PIN de la dueña escrito. Si el PIN real de producción es el mismo, **Jessica debe cambiarlo**. Quitarlo del código no lo borra del historial de GitHub.
- `appsettings.json` trae un `Jwt:Secret` de relleno. Comprobar que en Railway (producción) exista la variable `Jwt__Secret` con un valor propio. Si no existe, producción usa ese texto público y cualquiera podría fabricar sesiones.

## Decisiones que faltan

1. Railway: ¿lo creas tú (recomendado) o me pasas un token de proyecto?
2. Fotos de pruebas: ¿carpeta `pruebas/` en el mismo bucket (recomendado) o bucket aparte?
3. ¿Se puede crear el sitio `appdomna-pruebas` en tu cuenta de Netlify (gratis)?
4. ¿Existe `Jwt__Secret` en Railway de producción?
