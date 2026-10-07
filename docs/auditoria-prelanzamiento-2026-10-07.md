# Auditoría 360° pre-lanzamiento — amway-premium.vercel.app

**Fecha:** 7 de octubre de 2026 · **Commit auditado:** `8db41f5` (despliegue `dpl_DwYKmZTFp6ntFFdaRmMs1WKzVrer`)
**Alcance:** repositorio completo, web en producción, base de datos Supabase real (solo lecturas), Vercel (proyecto, despliegues, logs).
**Fase:** 1 — diagnóstico. **No se ha modificado código, BBDD, variables ni DNS.**

Leyenda de estado: **CONFIRMADO** = probado y reproducido · **PROBABLE** = evidencia fuerte sin reproducción completa · **POSIBLE** = riesgo a vigilar.

---

## 0. Arquitectura real (verificada)

| Pieza | Tecnología real |
|---|---|
| Framework | Next.js 15.5.25 (App Router), React 19.2.8, TypeScript 5.9 (strict), Tailwind 4 |
| Render | 348 páginas estáticas (SSG/ISR `revalidate 60`), 315 fichas de producto pregeneradas, 6 rutas API dinámicas |
| Catálogo | **En código** (`src/data/products/*.ts`). La BBDD solo guarda ajustes: precio de venta, coste, agotado, oculto |
| Backend | 6 Route Handlers (`src/app/api/**`), sin Server Actions, sin middleware, sin cron |
| BBDD | Supabase Postgres 17 (eu-west-1), **proyecto compartido** con otras webs; todo lo de esta tienda lleva prefijo `amway_` |
| Acceso a BBDD desde el servidor | Clave publicable + RPC `SECURITY DEFINER` protegidas con un token de servidor (se guarda solo su SHA-256). **No se usa service_role** |
| Auth | Supabase Auth (compartido): admins por email en `amway_admins` (roles gestor/desarrollador) + cuentas de cliente opcionales |
| Pagos | Stripe Checkout (tarjeta, Bizum…) + "efectivo al recoger" |
| Notificaciones | Web Push (VAPID) al móvil de la gestora; WhatsApp mediante enlaces `wa.me` (no API) |
| Email transaccional | **Ninguno propio** (solo los de Supabase Auth) |
| Analítica | Propia (`amway_visitas`) con consentimiento; errores JS a `amway_errores` |
| Stock | **No hay control de stock** (decisión de negocio: "todo está en tienda"); solo "agotado" manual |
| Entrega | Solo **recogida en el local** (día + hora), sin envíos |
| Hosting | Vercel, funciones en **iad1 (Washington)** |

```
CLIENTE (navegador, España)
   ↓ HTML estático/ISR desde CDN Vercel (cdg1)
NEXT.JS en Vercel ── funciones en iad1 (EE. UU.)
   ├─ /api/checkout ──► valida + recalcula precios ──► Stripe Checkout (modo TEST hoy)
   │                     └─ /checkout/exito ──► registra pedido (RPC con token) ──► push
   ├─ /api/stripe/webhook ──► (503: NO configurado)
   ├─ /api/pedido (efectivo) ──► RPC amway_registrar_pedido_recogida ──► push
   └─ /api/admin/*, /api/push ──► verifican JWT + amway_es_admin()
NAVEGADOR (panel /admin y /cuenta) ──► Supabase REST/Realtime directo, protegido por RLS
SUPABASE (eu-west-1, Irlanda) ── tablas amway_* con RLS + RPC SECURITY DEFINER
```

```
CLIENTE → CATÁLOGO/FICHA → CESTA (localStorage) → DÍA+HORA RECOGIDA → DATOS (nombre, teléfono)
   ├─ Tarjeta: /api/checkout → Stripe → /checkout/exito → amway_pedidos (estado "pagado") → push
   └─ Efectivo: /api/pedido → amway_pedidos (estado "pendiente") → push + WhatsApp del cliente
→ PANEL ADMIN (Realtime + push) → PREPARADO (preparado_at) → ENTREGADO → (CANCELADO)
```

---

## 1. Resumen ejecutivo

La aplicación está **bien construida en lo técnico**: los precios se recalculan en el servidor, las entradas se validan, la base de datos está correctamente blindada con RLS (probado como atacante: nada se puede leer ni escribir con la clave pública), el registro de pedidos con tarjeta es idempotente, typecheck/lint/build pasan limpios y no hay secretos en el JavaScript público.

Lo que **no está listo es la configuración de producción y lo legal/comercial**: Stripe está en modo test, el webhook de Stripe no está configurado, no existe ninguna página legal, el dominio que usa todo el SEO no existe todavía y el email de contacto tampoco. Además el rendimiento en móvil es mediocre (Lighthouse 49–73) y no hay forma de enterarse si algo falla.

**Puntuación global: 66/100**

| Área | Nota | Justificación breve |
|---|---|---|
| Funcionalidad | 82 | Todo lo probado funciona; festivos no contemplados; error de hidratación en home |
| Flujo de pedido | 55 | Lógica sólida, pero Stripe en test y sin webhook → hoy no se puede cobrar de verdad y un pago puede quedar sin registrar |
| Frontend | 75 | Limpio y coherente; sin `dynamic()`, dos librerías de animación, catálogo con 8.843 nodos |
| Backend | 78 | Validación y trust boundaries correctos; sin rate limit por IP; región lejos de la BBDD |
| Base de datos | 82 | RLS impecable, constraints e índices correctos; deriva repo↔BBDD (stock) y sin índice en `numero` |
| Seguridad | 72 | BBDD y APIs bien; faltan cabeceras (CSP, anti-clickjacking) y freno anti-spam por IP |
| Rendimiento frontend | 58 | Móvil: home 55, catálogo 49 (LCP 4,6–5,9 s, TBT hasta 2,3 s). Escritorio 90–98 |
| Rendimiento backend | 65 | 0,65–1,25 s por petición de pedido por la ida y vuelta EE. UU.↔Irlanda |
| Rendimiento BBDD | 92 | Consultas en 1–5 ms; volumen mínimo |
| UX/UI | 80 | Flujo de compra claro en 2 pasos; dirección del local oculta; contraste bajo en textos secundarios |
| Móvil | 78 | Sin scroll horizontal en 375/390/412/768; botones cesta OK; rendimiento bajo |
| SEO técnico | 68 | Títulos/descripciones/H1/robots/sitemap bien; canonical ausente en 8 tipos de página y apuntando a dominio inexistente |
| SEO local | 40 | Sin dirección, sin mapa, sin horario en schema, sin Google Business Profile vinculado |
| Accesibilidad | 82 | Lighthouse 95–97; skip-link, labels y aria correctos; fallos de contraste |
| Código | 82 | TS estricto, 0 errores lint en `src`, buena separación; 0 tests automáticos |
| Preparación producción | 38 | Stripe test, webhook, legal, dominio, email, monitorización |

---

## 2. ¿Publicaría esta web hoy?

**NO — pero está cerca.** Sí, una vez corregidos los 5 bloqueadores de la sección 3. Ninguno exige reescribir código: son sobre todo configuración (claves Stripe, webhook, dominio, variables) y contenido legal. Con 1–2 días de trabajo más la revisión legal, la publicaría.

---

## 3. Bloqueadores del lanzamiento

| ID | Bloqueador | Estado | Esfuerzo |
|---|---|---|---|
| **C-01** | **Stripe está en modo TEST en producción.** Un cliente real no puede pagar con tarjeta. | CONFIRMADO | XS |
| **C-02** | **Webhook de Stripe sin configurar** (`/api/stripe/webhook` → 503). Si el cliente paga y cierra la pestaña, o paga con un método asíncrono, el pedido **no se registra** en el panel. | CONFIRMADO | XS–S |
| **C-03** | **No existe ninguna página legal**: aviso legal (LSSI), privacidad (RGPD), cookies, condiciones de venta / desistimiento. Se recogen nombre, teléfono y cuentas. | CONFIRMADO | M + asesoría |
| **C-04** | **Dominio y email inexistentes**: `SITE.url = https://amwaybarakaldo.es` y `hola@amwaybarakaldo.es` → NXDOMAIN. Canonical, sitemap, robots, Open Graph y JSON-LD apuntan a un dominio que no resuelve. | CONFIRMADO | XS (tras elegir dominio) |
| **C-05** | **Verificar normas Amway antes de comprar el dominio**: los distribuidores independientes suelen tener restricciones para usar la marca en nombres de dominio y para vender online en web propia. Si aplica, el dominio `amway…` podría tener que cambiarse después (coste SEO alto). | REQUIERE CONSULTA | — |

Pendiente de confirmar por ti (no lo considero bloqueador sin saberlo): el número de WhatsApp `34628409781` figura en el código como *"Testing number… replace with the definitive business line before going to production"* (`src/data/site-config.ts:9-11`).

---

## 4. Top 10 mejoras (impacto / esfuerzo)

| # | Mejora | Impacto | Esfuerzo | Quick win |
|---|---|---|---|---|
| 1 | Claves Stripe live + webhook (C-01, C-02) | 10 | XS | ✅ |
| 2 | Región de funciones Vercel → `dub1` (Dublín, junto a Supabase) (A-03) | 6 | XS | ✅ |
| 3 | Publicar la dirección del local + horario + mapa (A-08) | 8 | XS | ✅ |
| 4 | Festivos/vacaciones en el calendario de recogida (A-07) | 6 | S | ✅ |
| 5 | Rate limit por IP en `/api/pedido` y `/api/checkout` (Vercel Firewall) (A-01) | 7 | S | ✅ |
| 6 | Cabeceras de seguridad en `next.config.ts` (A-02) | 6 | S | ✅ |
| 7 | Capturar errores desde el primer instante + alertas (UptimeRobot + aviso de pedidos fallidos) (A-05) | 7 | S | |
| 8 | Canonical por página + og:url correcto (M-01) | 5 | XS | ✅ |
| 9 | Rendimiento móvil: hero sin animar el texto LCP, carga diferida de GSAP/framer, catálogo paginado (A-04) | 7 | M | |
| 10 | Test E2E del flujo de pedido con Playwright contra un entorno de prueba (M-09) | 6 | M | |

---

## 5. Hallazgos completos

### 🔴 CRÍTICO

#### C-01 · Stripe en modo test en producción
- **Área:** Pagos · **Tipo:** BUG/OTRO · **Estado:** CONFIRMADO · **Impacto:** 10 · **Esfuerzo:** XS
- **Evidencia:** `POST /api/checkout` en producción devuelve sesión `cs_test_…`; la pasarela muestra "Entorno de prueba de Amway Barakaldo". Los 3 pedidos con tarjeta de la BBDD son de modo test.
- **Reproducir:** añadir producto → Recogida y pago → Tarjeta → "Pagar" → la cabecera de Stripe dice "Entorno de prueba".
- **Impacto:** ningún cliente puede pagar con tarjeta real.
- **Solución:** en Vercel (Production) poner `STRIPE_SECRET_KEY=sk_live_…`; activar en el Dashboard live los métodos (tarjeta, Bizum…); revisar nombre comercial y descriptor del extracto.
- **Verificar:** crear sesión y comprobar `cs_live_` y ausencia del rótulo "Entorno de prueba"; pago real de 1 € y reembolso.

#### C-02 · Webhook de Stripe no configurado
- **Área:** Pedidos · **Tipo:** BUG · **Estado:** CONFIRMADO · **Impacto:** 9 · **Esfuerzo:** XS–S
- **Evidencia:** `POST /api/stripe/webhook` → `503 {"error":"Webhook no configurado."}` (falta `STRIPE_WEBHOOK_SECRET`). Hoy el pedido con tarjeta solo se registra cuando el navegador llega a `/checkout/exito` (`src/app/checkout/exito/page.tsx:23`).
- **Casos de pérdida:** cliente que cierra la pestaña tras pagar; móvil que pierde conexión en la redirección; métodos con `payment_status` distinto de `paid` al volver (los asíncronos solo los recoge `checkout.session.async_payment_succeeded`, que llega por webhook).
- **Impacto:** cobro hecho y pedido invisible para la gestora. Existe un respaldo manual (panel de desarrollo → "cobros sin registrar"), pero depende de que alguien lo mire.
- **Solución:** crear el endpoint en Stripe live (`https://<dominio>/api/stripe/webhook`, eventos `checkout.session.completed` y `checkout.session.async_payment_succeeded`), guardar `STRIPE_WEBHOOK_SECRET` en Vercel. El código ya está preparado e idempotente.
- **Verificar:** `stripe trigger checkout.session.completed` o pago real cerrando la pestaña antes de volver → el pedido aparece en el panel.

#### C-03 · Sin páginas legales
- **Área:** Legal · **Tipo:** LEGAL/REVISIÓN · **Estado:** CONFIRMADO · **Impacto:** 9 · **Esfuerzo:** M + asesoría
- **Evidencia:** no existe ninguna ruta de aviso legal, privacidad, cookies ni condiciones (`src/app/` completo revisado); el pie solo enlaza categorías y "Empresa". El checkout y el registro de cuenta no enlazan ninguna política.
- **Faltan (a redactar por un profesional, no automáticamente):** identificación del titular (nombre/razón social, NIF, domicilio, email) — LSSI art. 10; política de privacidad (datos: nombre, teléfono, email de cuenta, notas, analítica; base legal, conservación, derechos; encargados: Supabase, Vercel, Stripe, WhatsApp/Meta); política de cookies (hay banner, falta la política y el enlace); condiciones de compra (precio con IVA, pago, recogida, cancelación, derecho de desistimiento de 14 días en venta a distancia y sus excepciones para productos precintados de higiene/salud); garantías.
- **Verificar:** enlaces en pie, en el paso de datos de la cesta y en el registro de cuenta.

#### C-04 · Dominio y email inexistentes
- **Área:** SEO/Producción · **Tipo:** SEO · **Estado:** CONFIRMADO · **Impacto:** 8 · **Esfuerzo:** XS
- **Evidencia:** `nslookup amwaybarakaldo.es` → *Non-existent domain*. `src/data/site-config.ts` (`url`, `email`) alimenta: `metadataBase`, canonical de fichas, `og:url`, `robots.txt` (`Sitemap: https://amwaybarakaldo.es/sitemap.xml`), 327 URLs del sitemap, JSON-LD (`url`, `image`), remitente VAPID (`mailto:hola@amwaybarakaldo.es`) y el panel de estado del webhook.
- **Impacto:** hoy Google ve en `amway-premium.vercel.app` canonicals hacia un dominio muerto; el email publicado rebota.
- **Solución:** ver sección 26. Elegido el dominio, cambiar `SITE.url` y `SITE.email` (o mejor, leerlos de una variable de entorno) y crear el buzón.

### 🟠 ALTO

#### A-01 · Spam de pedidos en efectivo puede bloquear la tienda
- **Área:** Seguridad/Backend · **Tipo:** SEGURIDAD · **Estado:** CONFIRMADO por código y función viva (no explotado) · **Impacto:** 7 · **Esfuerzo:** S
- **Evidencia:** `/api/pedido` no tiene límite por IP ni captcha (`src/app/api/pedido/route.ts`). El único freno es global en SQL: `count(*) … where origen='web' and stripe_session_id is null and created_at > now()-1h >= 30` (verificado en la función desplegada).
- **Escenario:** 30 peticiones válidas automatizadas → 30 pedidos falsos en el panel, 30 avisos push al móvil de la gestora y **todos los pedidos en efectivo reales bloqueados durante una hora** ("Estamos recibiendo muchos pedidos").
- **Solución (simple):** regla de rate limit en Vercel Firewall para `/api/pedido` y `/api/checkout` (p. ej. 5/min por IP); en SQL, límite adicional por teléfono (p. ej. 3/hora por los 9 últimos dígitos). Opcional: Turnstile.
- **Verificar:** 6 peticiones seguidas desde una IP → la 6.ª recibe 429.

#### A-02 · Faltan cabeceras de seguridad
- **Área:** Seguridad · **Tipo:** SEGURIDAD · **Estado:** CONFIRMADO · **Impacto:** 6 · **Esfuerzo:** S
- **Evidencia:** `curl -I /` solo devuelve `Strict-Transport-Security`. No hay `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Impacto:** `/admin` puede incrustarse en un iframe ajeno (clickjacking); sin CSP, cualquier XSS futuro no tendría segunda barrera.
- **Solución:** en `next.config.ts → headers()` añadir para `/:path*`: `X-Frame-Options: DENY` (o CSP `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. CSP primero en modo `Report-Only` (Next usa scripts inline; requiere `connect-src` a Supabase y Stripe).
- **Verificar:** securityheaders.com ≥ A; la web y el panel siguen funcionando.

#### A-03 · Funciones en EE. UU., base de datos en Irlanda
- **Área:** Rendimiento backend · **Tipo:** RENDIMIENTO · **Estado:** CONFIRMADO · **Impacto:** 6 · **Esfuerzo:** XS
- **Evidencia:** cabecera `X-Vercel-Id: cdg1::iad1::…` (función en iad1). Supabase en eu-west-1. Medido: RPC de catálogo directo a Supabase 0,14–0,20 s; la misma validación vía `/api/pedido` 0,66–1,25 s; `/api/checkout` 0,81–1,25 s. En la prueba por interfaz, de "Pagar" a Stripe: 7,0 s en móvil.
- **Solución:** Vercel → Project Settings → Functions → Region: `dub1` (o `"regions": ["dub1"]`).
- **Verificar:** `X-Vercel-Id` contiene `dub1`; `/api/checkout` < 0,6 s.

#### A-04 · Rendimiento en móvil
- **Área:** Rendimiento frontend · **Tipo:** RENDIMIENTO · **Estado:** CONFIRMADO · **Impacto:** 7 · **Esfuerzo:** M
- **Evidencia (Lighthouse 12, móvil simulado 4G lento + CPU ×4):**

| Página | Perf | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Home | 55 | 1,4 s | **5,9 s** | **1.020 ms** | 0 |
| Catálogo | 49 | 2,1 s | 4,9 s | **2.300 ms** | 0 |
| Nutrición | 69 | 1,5 s | 4,6 s | 570 ms | 0 |
| Ficha Omega-3 | 70 | 1,3 s | 4,9 s | 440 ms | 0 |
| Nosotros | 73 | 1,2 s | 4,2 s | 230 ms | **0,191** |
| Home (escritorio) | 90 | 0,4 s | 1,6 s | 150 ms | 0 |
| Catálogo (escritorio) | 98 | 0,6 s | 1,0 s | 80 ms | 0 |

- **Causas:**
  - Home: el elemento LCP es el párrafo del hero animado con framer-motion (`opacity` inicial 0); *render delay* 2,9 s esperando a que el JS hidrate y anime. Chunk GSAP+ScrollTrigger: 2,0 s de CPU; framer-motion (130 KB) también se carga; 37 archivos usan framer-motion y **ningún `next/dynamic`** en todo el proyecto.
  - Catálogo: 322 tarjetas renderizadas a la vez → 8.843 nodos DOM, HTML de 1,8 MB (90 KB comprimido), 3,2 s de CPU en el chunk común.
  - Nosotros: CLS 0,19 provocado por el `<h1>` (cambio de fuente/animación).
- **Solución:** hero con el texto visible sin animación de opacidad (animar solo `transform` o tras el primer pintado); cargar GSAP/Three.js/animaciones con `dynamic(…, { ssr:false })` solo donde se usan; catálogo con paginación o "cargar más" (p. ej. 24 por bloque) manteniendo URLs indexables por categoría; `size-adjust`/altura reservada para el h1 de Nosotros.
- **Verificar:** Lighthouse móvil ≥ 75 en home y catálogo; LCP < 2,5 s en datos reales de CrUX (Search Console) tras el lanzamiento.

#### A-05 · No te enterarías de que algo falla
- **Área:** Observabilidad · **Tipo:** OTRO · **Estado:** CONFIRMADO · **Impacto:** 7 · **Esfuerzo:** S
- **Evidencia:** la home lanza un error de React en cada visita (A-06) y `amway_errores` tiene **0 filas** desde el inicio. Causa: los listeners `error`/`unhandledrejection` se registran en un `useEffect` de `Analytics.tsx:24-42`, que corre después de la hidratación; lo que falla durante la carga no se captura (verificado: no hay llamada a `amway_registrar_error`). Errores de servidor (pedido no registrado, Stripe) solo quedan en logs de Vercel, sin alertas. No hay monitor de disponibilidad.
- **Solución (gratuita):** registrar el capturador con un `<script>` inline temprano o en `instrumentation-client.ts`; si un registro de pedido falla en servidor, mandar un push/aviso a la gestora; UptimeRobot/Better Stack (gratis) sobre `/` y sobre un endpoint de salud que haga un `select 1` al catálogo; opcional Sentry (plan gratuito).
- **Verificar:** forzar un error en preview → aparece en el panel "Errores" y llega aviso.

#### A-06 · Error de hidratación en la home (React #418)
- **Área:** Frontend · **Tipo:** BUG · **Estado:** CONFIRMADO (causa no aislada) · **Impacto:** 5 · **Esfuerzo:** S–M
- **Evidencia:** 4/4 cargas de `/` en producción (375 px y 1366 px) → `Minified React error #418 (args: HTML)`. No aparece en ninguna otra página ni en `next dev` local (render fresco).
- **Interpretación:** el HTML estático servido no coincide con el primer render del cliente; como no se reproduce con render fresco, apunta a contenido que depende del momento de generación del HTML (ISR) o del entorno.
- **Impacto:** React descarta el HTML y re-renderiza la home en cliente → más trabajo en móvil (contribuye al TBT) y posible parpadeo.
- **Solución:** reproducir con `next build && next start` y `react-dom` de desarrollo para ver el nodo exacto; revisar componentes de la home que lean hora/fecha o estado del navegador durante el render.
- **Verificar:** consola limpia en 10 cargas consecutivas.

#### A-07 · El calendario ofrece días festivos
- **Área:** Flujo de pedido · **Tipo:** BUG · **Estado:** CONFIRMADO · **Impacto:** 6 · **Esfuerzo:** S
- **Evidencia:** el selector ofrece el **lunes 12 de octubre** (festivo nacional). `src/lib/recogida.ts` solo excluye domingos (`cerrado: [0]`); no hay festivos, vacaciones ni cierres puntuales. También ofrece las 19:00, la hora exacta de cierre.
- **Impacto:** clientes que van a recoger con el local cerrado.
- **Solución:** lista de fechas cerradas editable desde el panel (tabla `amway_cierres` o ajuste en `amway_config`) aplicada en cliente y servidor (`recogidaValida`); última franja 18:30.
- **Verificar:** marcar 12-oct cerrado → no aparece y la API lo rechaza.

#### A-08 · La dirección del local no se publica
- **Área:** CRO/SEO local · **Tipo:** CONVERSIÓN · **Estado:** CONFIRMADO · **Impacto:** 7 · **Esfuerzo:** XS (decisión de negocio)
- **Evidencia:** ninguna dirección en el sitio; el asistente y la página de éxito dicen *"Al confirmar el pedido te enviamos por WhatsApp la dirección exacta"* (`src/data/asistente.ts:230-231`, `checkout/exito/page.tsx:59`). El schema `LocalBusiness` no tiene `streetAddress`.
- **Impacto:** un comprador nuevo no sabe adónde va a ir antes de pagar (freno de confianza importante) y Google no puede asociar la web a una ubicación (SEO local casi nulo).
- **Solución:** publicar dirección, mapa y horario en Nosotros, pie, cesta y JSON-LD. Si por privacidad no se quiere publicar el portal exacto, al menos barrio/calle y un punto de referencia, y explicarlo.

### 🟡 MEDIO

| ID | Hallazgo | Estado | Imp. | Esf. | Evidencia / solución |
|---|---|---|---|---|---|
| M-01 | **Canonical ausente** en home, catálogo, 5 categorías, FAQ, opiniones, ofertas; **og:url = home** en todas las páginas que no son ficha | CONFIRMADO | 5 | XS | Extraído del HTML en producción. Añadir `alternates.canonical` y `openGraph.url` en cada `metadata` |
| M-02 | JSON-LD de producto con **precio base del código** y `InStock` fijo; ignora precio del panel y "agotado" | CONFIRMADO (sin desajuste hoy: 0 precios modificados, 0 agotados) | 5 | S | `src/app/producto/[id]/page.tsx:61-80`. Riesgo de "precio en Google ≠ precio en web" (Merchant/Rich Results). Usar `precioVenta` y `OutOfStock` desde el catálogo del servidor; añadir `BreadcrumbList` (la ruta ya se muestra) |
| M-03 | `LocalBusiness` incompleto: sin dirección, CP, `geo`, `openingHoursSpecification`; `priceRange "$$-$$$"` | CONFIRMADO | 5 | XS | `src/app/page.tsx:15-31` |
| M-04 | **Deriva repo ↔ BBDD**: en producción siguen vivos el trigger `amway_pedidos_stock`, las funciones `amway_mover_stock`, `amway_pedido_stock`, `amway_stock_insuficiente` (esta ejecutable por `anon`) y la columna `stock`, que `supabase/amway_schema.sql:1251-1258` dice eliminar | CONFIRMADO; inofensivo hoy (las 466 filas tienen `stock = NULL`) | 4 | XS | Si alguien rellena `stock`, se reactiva lógica olvidada que cambia "agotado" sola. Aplicar el bloque final del SQL como migración |
| M-05 | **Datos de prueba en producción**: 8 pedidos, todos "entregado" (3 con tarjeta en modo test). Contaminarán contabilidad e informes | CONFIRMADO (recuento); PROBABLE que sean pruebas | 5 | XS | Decide tú si se borran/archivan antes de lanzar (no lo he hecho) |
| M-06 | Consultas del panel con límites que truncan **en silencio**: contabilidad/clientes/informes `.limit(10000)`, visitas `.limit(100000)`; la API de Supabase suele limitar a 1.000 filas por petición | PROBABLE | 6 | S | `ContabilidadPanel.tsx:248`, `ClientesPanel.tsx:69`, `VentasInformePanel.tsx:55-57`. `amway_visitas` ya tiene 627 filas: los informes de visitas se quedarán cortos en semanas. Agregar en SQL (RPC/vistas) en vez de traer filas |
| M-07 | Reintento tras timeout en efectivo **duplica el pedido** (sin clave de idempotencia) | POSIBLE | 5 | S | El doble clic está cubierto (probado: 1 sola petición). Pero si la respuesta se pierde y el cliente reintenta, se crea otro. Generar un `idempotency_key` en la cesta y hacerlo `unique` |
| M-08 | Contradicciones de contenido: "importados de Estados Unidos" vs FAQ "precios según la lista oficial de Amway España"; "reposición según el catálogo Amway US"; "con la garantía Amway" | CONFIRMADO | 5 | XS | `FaqAccordion.tsx:11,23,27`, `sobre-nosotros/page.tsx:53`. Ver legal (sección 27) |
| M-09 | **0 tests automáticos**; el flujo crítico no tiene E2E | CONFIRMADO | 6 | M | Ver sección 29 |
| M-10 | `npm run lint` **falla** (96 errores) porque ESLint analiza `CiaoEnergy/` (material de referencia no versionado). `src/` está limpio | CONFIRMADO | 2 | XS | Añadir `CiaoEnergy/**`, `XS Energy/**`, `eSpring/**` a `ignores` en `eslint.config.mjs` |
| M-11 | Dependencias: `sharp` (<0.35.5) y `source-map-js` con vulnerabilidad **high**; `next` 15.5.27 (parche) disponible | CONFIRMADO (`npm audit`) | 4 | XS | `npm audit fix` (sin cambios mayores); impacto práctico bajo (no se procesan SVG de usuarios) |
| M-12 | Contraste insuficiente: 8 (home), 5 (catálogo), 14 (ficha) elementos — `text-stone` en textos pequeños, marquesina `text-carbon/35`, migas de pan | CONFIRMADO (Lighthouse) | 4 | S | Oscurecer el token `stone` para texto < 18 px |
| M-13 | Auth compartido con otras webs: plantillas de email, remitente SMTP, Site URL y lista de redirecciones son comunes | NO VERIFICABLE (sin acceso al panel Auth) | 5 | XS | Comprobar que los emails de alta/recuperación dicen "Amway Barakaldo", que hay SMTP propio (el de Supabase limita a pocos emails/hora) y añadir el dominio nuevo a *Redirect URLs* |
| M-14 | Sin índice en `amway_pedidos.numero` (búsqueda por nº de pedido, vincular, cancelar → *seq scan*) | CONFIRMADO (`EXPLAIN`) | 3 | XS | `create unique index … (numero)`. Irrelevante hoy (8 filas), útil desde miles |

### 🟢 BAJO / 🔵 MEJORA

| ID | Hallazgo | Estado |
|---|---|---|
| L-01 | La página 404 hereda el título de la home | CONFIRMADO |
| L-02 | `sitemap.xml` pone `lastModified = ahora` en todas las URLs (señal inútil para Google) | CONFIRMADO |
| L-03 | Botón "Añadir" con `aria-label` distinto del texto visible (WCAG 2.5.3) y salto de encabezados en tarjetas del catálogo | CONFIRMADO |
| L-04 | `amway_estado_pedido`: tras 300 fallos/hora globales se bloquea para todos ("¿cómo va mi pedido?") | CONFIRMADO por código |
| L-05 | La misma referencia en varias líneas de cesta no se agrupa (máx. 20 uds./línea × 50 líneas) | CONFIRMADO |
| L-06 | `/checkout/exito?session_id=<cualquiera>` consulta Stripe y deja error en logs | CONFIRMADO |
| L-07 | Protección de contraseñas filtradas (HaveIBeenPwned) desactivada en Supabase Auth (nivel proyecto) | CONFIRMADO (advisor) |
| L-08 | 151 filas huérfanas en `amway_productos` (IDs que ya no existen en el código) | CONFIRMADO |
| L-09 | Tres librerías de animación (GSAP, framer-motion, Lenis) + Three.js | MEJORA |
| L-10 | Pedidos del panel: la pestaña Pedidos carga solo los últimos 500 | RIESGO FUTURO |

---

## 6. Funcionalidad

| Prueba (producción) | Resultado |
|---|---|
| 16 rutas públicas responden (200) | PASS |
| Ruta inexistente y producto inexistente → 404 real | PASS |
| `/contacto` → 308 a `/sobre-nosotros#contacto` | PASS |
| Sin scroll horizontal en 375 / 390 / 412 / 768 / 1366 px (16 páginas a 375 y 1366) | PASS |
| Errores JS en consola | **FAIL en home** (React #418); resto PASS |
| Peticiones de red fallidas en navegación | PASS (ninguna) |
| Cesta persiste al recargar | PASS |
| Volver atrás desde Stripe conserva la cesta | PASS |
| Banner de cookies: "Rechazar" no envía analítica | PASS (código: `track` exige consentimiento) |
| Calendario: domingos y horas pasadas excluidos | PASS |
| Calendario: festivos | **FAIL** (12-oct ofrecido) |
| Opiniones: solo reseñas reales de BBDD (hoy 0) | PASS (no hay testimonios inventados) |

## 7. Flujo de pedidos

```
CLIENTE      → PASS
PRODUCTO     → PASS (ficha, precio, añadir)
CESTA        → PASS (sumar/restar, subtotal 2 × 27,98 = 55,96 €, persistencia)
CHECKOUT     → PASS validación · FAIL producción (Stripe test)
PEDIDO       → PASS efectivo (lógica) · RIESGO tarjeta sin webhook
BBDD         → PASS (idempotencia por session id, trigger de costes, RLS)
ADMIN        → PASS por código + Realtime + push (no probado con sesión: ver §30)
PREPARACIÓN  → no probado en vivo (sin credenciales)
ENTREGA      → no probado en vivo
FINALIZADO   → no probado en vivo
```

**Cálculos:** el total = Σ(precio servidor × cantidad), sin envío ni descuentos (no existen); IVA incluido en precio. Comprobado en BBDD: **0 pedidos con total descuadrado** respecto a sus líneas.

**Precios manipulables:** NO. Prueba: enviar `price: 0.01`, `eurPrice: 0.01`, cantidades `-5` y `999999` → Stripe mostró **587,58 € = 21 × 27,98 €** (cantidades acotadas a 1 y 20, precios ignorados).

**Stock:** no hay control de stock por diseño; "agotado" y "oculto" se comprueban en servidor (`pedido-web.ts:74`). No puede venderse algo marcado agotado; sí puede venderse algo que físicamente no haya si no se marca.

**Pedidos duplicados:** tarjeta — imposible (unique `stripe_session_id` + `on conflict`). Efectivo — doble clic cubierto; reintento tras timeout posible (M-07).

## 8. Panel admin

- **Protección:** la UI de `/admin` es pública (normal), pero **todos los datos** pasan por RLS `amway_es_admin()`; las APIs `/api/admin/*` y `/api/push` verifican el JWT en servidor (probado: sin token 401, token falso 403). Insertar un admin con la clave pública → *violates row-level security*. Registro de usuarios exige confirmación de email y los 3 correos admin ya tienen usuario confirmado (no se puede "suplantar" registrándose).
- **Operativa (revisión de código):** Realtime + push para pedidos nuevos, pestaña "Hoy" con recogidas, marcar preparado, notas internas separadas de las del cliente, contabilidad con costes congelados por línea. Bien pensado para una persona.
- **Mejoras operativas:** gestión de festivos/cierres (A-07); avisar si un pedido con tarjeta no se registró (hoy hay que abrir el panel de desarrollo); búsqueda en pedidos limitada a los últimos 500 (L-10); agregaciones en SQL para que contabilidad no se trunque (M-06).

## 9. Frontend
Componentes bien separados (servidor para páginas/metadata, cliente para cesta/cuenta/panel). Puntos débiles: ningún `dynamic()`; GSAP + framer-motion + Lenis + Three.js; catálogo renderiza 322 tarjetas; error de hidratación en home. First Load JS: 218 KB home, 279–283 KB catálogo/fichas, 337 KB XS Energy, 497 KB admin.

## 10. Backend

| Ruta | Método | Auth | Validación | Rate limit | BBDD | Riesgo |
|---|---|---|---|---|---|---|
| `/api/checkout` | POST | Opcional (cliente) | Completa, precios en servidor | ❌ | lee catálogo | Spam de sesiones Stripe (bajo) |
| `/api/pedido` | POST | Opcional (cliente) | Completa | Solo global 30/h en SQL | escribe pedido | **A-01** |
| `/api/stripe/webhook` | POST | Firma Stripe | Firma | — | escribe pedido | **No configurado (C-02)** |
| `/api/admin/estado` | GET | JWT + desarrollador | — | — | lee | OK |
| `/api/admin/revalidar` | POST | JWT + admin | — | — | — | OK |
| `/api/push` | GET/POST | GET público (clave pública VAPID) / POST admin | — | — | lee subs | OK |

13 casos de entrada inválida probados en `/api/pedido` (vacío, JSON roto, `null`, sin recogida, domingo, fecha pasada, 23:00, teléfono inválido, nombre vacío, producto inexistente, variante 99, `productId` como objeto, GET): **todos rechazados con mensaje claro y sin detalles internos**.

## 11. Base de datos
- **Seguridad:** RLS activada en las 14 tablas `amway_*`; sin policies para `anon` salvo lecturas públicas legítimas (reseñas aprobadas, anuncios vigentes). 12 tablas probadas con la clave pública → `[]` o *permission denied*. Funciones sensibles protegidas por token o por `auth.uid()`. `amway_catalogo_publico` no expone costes (verificado).
- **Integridad:** PK, `CHECK` en estados, métodos, importes ≥ 0, cantidades, horas; FK a `auth.users` con `on delete set null`; líneas de pedido congeladas en JSON (borrar un producto no rompe históricos). Falta: unique en `numero` (M-14); `items` sin `CHECK` de no vacío a nivel tabla (lo validan las RPC).
- **Rendimiento:** catálogo público 4,9 ms; búsqueda por nº 1,5 ms (seq scan). Índices existentes se usan (`idx_scan` > 0) salvo el de clientes (aún sin datos).
- **Escalabilidad:** 100–1.000 pedidos sin cambios; 10.000 → truncados en panel (M-06) e índice en `numero`; 100.000 → mover contabilidad e informes a agregaciones SQL. No hace falta Redis, colas ni nada similar.

## 12. Seguridad
✅ Sin secretos en el JS público (34 chunks de producción analizados; solo aparece la clave *publicable*, que es pública por diseño). ✅ `.env*` ignorado en git. ✅ No se usa service_role. ✅ Webhook con verificación de firma. ✅ HSTS con preload. ✅ Errores sin stack traces al cliente. ❌ Cabeceras (A-02). ❌ Rate limit por IP (A-01). ⚠️ Protección de contraseñas filtradas desactivada (L-07).

## 13. Rendimiento frontend
Ver tabla A-04. Metodología: Lighthouse 12.x CLI, Microsoft Edge headless, móvil por defecto (Moto G Power simulado, 4G lento, CPU ×4) y preset escritorio; una ejecución por página desde este equipo (España) contra producción (CDN caliente). Cifras de laboratorio: confirmar con datos reales (CrUX) tras lanzar.

## 14. Rendimiento backend
| Endpoint | Tiempo (5 muestras, producción) |
|---|---|
| `/api/checkout` (validación + Supabase + Stripe) | 0,81 – 1,25 s |
| `/api/pedido` hasta validación de catálogo | 0,66 – 1,25 s |
| RPC catálogo directo a Supabase | 0,14 – 0,20 s |
| TTFB páginas estáticas | 0,13 – 0,35 s |
Causa principal: región (A-03).

## 15. Rendimiento BBDD
`amway_catalogo_publico()` 4,9 ms · búsqueda por `numero` 1,5 ms (seq scan, 8 filas) · tamaño total `amway_*` < 1 MB. Sin problema actual.

## 16. UX/UI
Fuerte: estética cuidada, cesta en 2 pasos, selector de día/hora claro, datos recordados, opción sin cuenta, WhatsApp siempre visible, mensajes de error útiles.
Mejorar: dirección del local antes de comprar (A-08); qué pasa tras el pedido (aclarar "te confirmamos por WhatsApp" y en cuánto tiempo); contraste de textos secundarios (M-12); 7 s de espera hasta Stripe en móvil sin indicación más allá del spinner (A-03).

## 17. Móvil
Sin desbordamiento horizontal en ningún ancho probado. Inputs con `type="tel"`, `inputmode`, `autocomplete="name"/"tel"`, `text-base` (sin zoom en iOS). Botones principales de 48 px. Rendimiento: ver A-04.

## 18. CRO / conversión
Dudas que hoy no resuelve la web a un desconocido: **¿dónde está el local?**, **¿quién es el titular?** (sin aviso legal), **¿puedo devolverlo?** (sin condiciones), **¿por qué importados de EE. UU. si el precio es el de Amway España?** (M-08). Bien resuelto: precio con IVA, sin gastos de envío, recogida y horario, pago con tarjeta o efectivo, contacto por WhatsApp.

## 19. SEO
✅ `lang="es"`, títulos y descripciones únicos, 1 H1 por página, `alt` en todas las imágenes (0 sin alt), robots con `noindex` en admin/cuenta/checkout, sitemap con 327 URLs, 404 reales, slugs legibles, contenido renderizado en servidor, imágenes AVIF/WebP con `srcset`. ❌ canonical (M-01), dominio (C-04), JSON-LD de producto (M-02), `BreadcrumbList` ausente aunque las migas se muestran.

## 20. SEO local
- **SEO local** (Amway Barakaldo / Bizkaia): necesita dirección pública, Google Business Profile verificado con la misma NAP (nombre, dirección, teléfono) que la web, `LocalBusiness` completo con `geo` y horario, mapa embebido en Nosotros. **Nota:** comprobar si las normas de Amway permiten usar "Amway" en el nombre del perfil de Google.
- **SEO de categoría** (Nutrilite Barakaldo, Artistry Barakaldo): las páginas de categoría ya existen con texto propio; añadir un párrafo local natural ("recógelo en nuestro local de Barakaldo") y canonical.
- **SEO de producto:** fichas con descripción oficial larga (posible contenido duplicado con amway.es/otros distribuidores): añadir 2–3 líneas propias en los productos estrella.
- **SEO informacional:** FAQ existe; artículos útiles a medio plazo (p. ej. "cómo elegir un filtro de agua", "omega-3: qué mirar en la etiqueta") sin keyword stuffing.

## 21. Accesibilidad
Lighthouse 95–97. Bien: skip-link, landmarks, labels, `aria-label` en botones de icono, diálogo de cesta con `role="dialog"`/`aria-modal`/Escape. Mejorar: contraste (M-12), L-03, foco dentro de la cesta (comprobar *focus trap* con teclado — no probado a fondo).

## 22. Calidad del código
TypeScript estricto: 0 errores. ESLint en `src`: 0 errores, 0 avisos. Build de producción OK (348 páginas, sin warnings). Componentes grandes pero cohesionados (`ContabilidadPanel` 1.367 líneas, `ProductosPanel` 1.213, `PanelCliente` 1.018): refactorizar solo si se van a tocar. Comentarios útiles y en castellano. `README.md` es el de plantilla de create-next-app (documentar arranque, variables y despliegue).

## 23. Analítica
Ya existe embudo propio con consentimiento: `pageview`, `add_to_cart`, `cart_open`, `checkout_start`, `whatsapp_click`, `solicitud`, `resena`, `asistente`, `anuncio_*`. Faltan para medir abandono: `view_item` (hoy se deduce del path), `remove_from_cart`, `begin_checkout` separado de "abrir paso 2", `purchase` (pedido confirmado, con importe, sin datos personales) y el método elegido. Recomendación: seguir con lo propio (cumple RGPD y no añade dependencias) y, si se quiere comparar con Google, añadir solo Search Console.

## 24. Observabilidad
Hoy: logs de Vercel (retención corta, sin alertas), tabla de errores que no captura errores de carga (A-05), panel de desarrollo con conciliación Stripe↔pedidos (bueno, pero manual). Propuesta mínima y gratuita: UptimeRobot (web + endpoint de salud), captura de errores temprana, push a la gestora si `registrarPedidoStripe` o `/api/pedido` fallan, revisar semanalmente el panel de errores.

## 25. Vercel / producción
- Región de funciones: iad1 → **cambiar a dub1** (A-03).
- Protección SSO activa en despliegues de preview (`all_except_custom_domains`): correcto.
- Variables: no he podido listarlas (403 desde la integración). Por el comportamiento: `AMWAY_PEDIDOS_TOKEN` ✅, VAPID ✅ (`configurado: true`), `STRIPE_SECRET_KEY` = test ❌, `STRIPE_WEBHOOK_SECRET` ❌.
- Despliegues directos a `main` = producción; hay *rollback candidates* disponibles.

## 26. Dominio definitivo — checklist
1. **Antes de comprar:** confirmar con las normas de Amway (C-05) qué nombres de dominio están permitidos.
2. Comprar dominio; añadirlo en Vercel → Domains. Elegir canónico: **sin www** (`dominio.es`) y redirigir `www` → raíz con 308 (o al revés, pero solo uno).
3. DNS: `A @ → 76.76.21.21` y `CNAME www → cname.vercel-dns.com` (o nameservers de Vercel). HTTPS automático.
4. Cambiar `SITE.url` y `SITE.email` (mejor desde `NEXT_PUBLIC_SITE_URL`) → redeploy. Revisa que canonical, sitemap, robots, OG y JSON-LD muestran el dominio nuevo.
5. **Evitar duplicado con `amway-premium.vercel.app`:** redirección 308 de todo el host `*.vercel.app` al dominio (regla `redirects` con `has: [{ type: "host", value: "amway-premium.vercel.app" }]`) — los canonicals ya ayudan, la redirección lo resuelve del todo.
6. Email: crear buzón (`hola@…`) con MX + SPF + DKIM + DMARC.
7. Stripe: webhook live a `https://dominio/api/stripe/webhook`; dominio en Apple Pay si se usa.
8. Supabase Auth: añadir `https://dominio/**` a Redirect URLs; revisar Site URL y plantillas (proyecto compartido).
9. VAPID subject al email nuevo (`AMWAY_VAPID_SUBJECT`).
10. Google Search Console (propiedad de dominio por DNS) → enviar sitemap; Bing Webmaster Tools (importar desde GSC).
11. Google Business Profile con la misma NAP.
12. Monitor de disponibilidad sobre el dominio nuevo.
13. Probar: `curl -I http://dominio`, `https://www.dominio`, `https://amway-premium.vercel.app/catalogo` → todos acaban en `https://dominio/...` con un solo salto.

## 27. Legal / elementos a revisar
| Elemento | Estado |
|---|---|
| Aviso legal (titular, NIF, domicilio, email) | 🔴 Revisar antes de lanzamiento |
| Política de privacidad + información en formularios (cesta, cuenta, solicitudes, reseñas) | 🔴 Revisar antes de lanzamiento |
| Política de cookies (banner existe; política no) | 🔴 Revisar antes de lanzamiento |
| Condiciones de compra, desistimiento y sus excepciones, cancelación de recogidas | 🔴 Revisar antes de lanzamiento |
| Uso de la marca Amway en dominio, nombre comercial, perfil de Google y venta en web propia | ⚪ Requiere consulta (normas del distribuidor) |
| Complementos alimenticios importados de EE. UU.: etiquetado en castellano y notificación a AESAN para su comercialización en España | ⚪ Requiere consulta profesional |
| "Garantía Amway" en reventa por un tercero; precios "lista oficial de Amway España" vs importación | 🟠 Recomendable revisar |
| Declaraciones de salud: Nutrilite usa fórmulas autorizadas UE ("contribuye a…") | 🟢 Correcto en lo revisado |
| Declaraciones cosméticas/eSpring ("número 1 del mundo", "99,9999 %", "demostrado clínicamente") | 🟠 Recomendable revisar que se pueda acreditar la fuente |
| Aviso de marcas y distribuidor independiente (pie) | 🟢 Correcto |
| Fotos de producto oficiales | ⚪ Confirmar permiso de uso para distribuidores |
| WhatsApp como canal de pedido (datos a Meta) | 🟠 Mencionar en privacidad |

*Este cuadro no sustituye asesoramiento jurídico.*

## 28. Costes y escalabilidad
Sin riesgos de coste relevantes: páginas estáticas en CDN, imágenes con caché de 31 días (`minimumCacheTTL`), vídeos con caché de 7 días. A vigilar: 315 fichas × variantes de imagen consumen cuota de optimización de imágenes de Vercel (hobby: 1.000 imágenes origen/mes en planes antiguos, revisar el plan actual); vídeos MP4 en `public/` cuentan como ancho de banda de Vercel. `ISR revalidate 60` en todas las páginas regenera solo cuando hay visitas: aceptable.

## 29. Tests ejecutados

| Test | Objetivo | Resultado |
|---|---|---|
| `tsc --noEmit` | Tipos | **PASS** (0 errores) |
| `eslint src` | Calidad | **PASS** (0/0) |
| `npm run lint` | Script del proyecto | **FAIL** (analiza carpetas de referencia, M-10) |
| `next build` | Build producción | **PASS** (348 páginas, sin warnings) |
| Tests unitarios/E2E del proyecto | — | **No existen** |
| API-001…013 entradas inválidas `/api/pedido` | Validación servidor | **PASS** (13/13) |
| API-014 manipulación de precio y cantidad `/api/checkout` | Trust boundary | **PASS** (587,58 € = 21 × 27,98) |
| API-015 APIs admin sin token / token falso | Autorización | **PASS** (401/403) |
| API-016 webhook sin firma | Firma | 503 (no configurado) → **FAIL de configuración** |
| DB-001 lectura/escritura de 12 tablas con clave pública | RLS | **PASS** |
| DB-002 crear admin con clave pública | Escalada | **PASS** (bloqueado) |
| DB-003 RPC protegidas con token falso | Token servidor | **PASS** |
| DB-004 coherencia totales vs líneas | Integridad | **PASS** (0 descuadres) |
| SEC-001 secretos en 34 chunks JS | Fuga | **PASS** |
| SEC-002 cabeceras HTTP | Endurecimiento | **FAIL** (A-02) |
| E2E-001 (móvil 390 px) ficha → añadir → +1 → recargar → recogida → datos → doble clic "Pagar" → Stripe → atrás | Flujo cliente | **PASS** hasta Stripe (1 sola petición con doble clic; cesta conservada). No se completó el pago (ver §30) |
| UI-001 overflow horizontal 5 anchos | Móvil | **PASS** |
| UI-002 consola en 16 páginas | Errores JS | **FAIL** home (#418) |
| PERF-001 Lighthouse 5 páginas móvil + 2 escritorio | Rendimiento | Ver A-04 |
| OBS-001 ¿se registra el error de la home? | Monitorización | **FAIL** (A-05) |

## 30. Lo que NO he podido comprobar (y por qué)

- **Completar un pago y un pedido en efectivo en producción:** habría escrito en la BBDD real y enviado avisos push al móvil de la gestora. Me detuve en la pasarela de Stripe. Con tu permiso puedo hacerlo (pedido marcado "PRUEBA QA", cancelándolo después) o montarlo en un entorno de pruebas.
- **Panel admin con sesión** (cambiar estados, preparado, entregado, cancelar, productos, contabilidad): no tengo credenciales. Lo revisé por código y por RLS.
- **Cuentas de cliente** (registro, email de confirmación, recuperación): crearía usuarios reales en el Auth compartido.
- **Variables de entorno de Vercel:** la integración devuelve 403; deducidas por comportamiento.
- **Configuración de Supabase Auth** (SMTP, plantillas, Site URL, redirect URLs) y **límite de filas de la API** (M-06): no accesibles con mis herramientas.
- **Safari / iPhone / Firefox reales:** solo Chromium (Playwright) y Edge (Lighthouse). Recomendado probar la cesta y el pago en un iPhone real.
- **Causa exacta del error de hidratación** (A-06): requiere un build de depuración.
- **Avisos push reales** y Realtime del panel en un móvil.
- **Datos reales de usuarios (CrUX)**: la web aún no tiene tráfico suficiente.
- **Revisión jurídica** de textos y normas de Amway.

---

## 38. Plan de acción

### 🚨 Hacer antes de lanzar
1. Claves Stripe **live** + webhook live con `STRIPE_WEBHOOK_SECRET` (C-01, C-02).
2. Confirmar normas de Amway sobre dominio/venta online (C-05) → comprar dominio → checklist §26 completo (C-04).
3. Páginas legales redactadas/revisadas por un profesional + enlaces en pie, cesta y registro (C-03).
4. Confirmar el número de WhatsApp definitivo.
5. Publicar dirección y horario del local (A-08) y gestión de festivos (A-07).
6. Rate limit por IP en `/api/pedido` y `/api/checkout` (A-01).
7. Región de funciones `dub1` (A-03).
8. Decidir qué hacer con los 8 pedidos de prueba (M-05).
9. Una compra real de punta a punta (tarjeta y efectivo) en el dominio definitivo, con reembolso.

### ⚡ Primera semana
- Cabeceras de seguridad (A-02).
- Captura temprana de errores + monitor de disponibilidad + aviso de pedido fallido (A-05).
- Arreglar el error de hidratación de la home (A-06).
- Canonical/og:url por página, JSON-LD de producto con precio/estado reales y `BreadcrumbList`, `LocalBusiness` completo (M-01–M-03).
- Search Console + Bing + Google Business Profile.
- `npm audit fix` y Next 15.5.27 (M-11); ignorar carpetas de referencia en ESLint (M-10).
- Aplicar a la BBDD la limpieza de stock pendiente (M-04).

### 📈 Próximos 1–3 meses
- Rendimiento móvil: hero, carga diferida de animaciones, catálogo paginado, CLS de Nosotros (A-04).
- Test E2E del flujo de pedido con Playwright en CI (M-09).
- Agregaciones SQL para contabilidad/informes (M-06) e índice en `numero` (M-14).
- Idempotencia de pedidos en efectivo (M-07).
- Contraste y detalles de accesibilidad (M-12, L-03).
- Eventos de embudo que faltan (§23) y contenido local/informacional (§20).

### 💡 Opcional / futuro
- Unificar librerías de animación (L-09).
- Refactor de paneles grandes solo cuando se modifiquen.
- Limpieza de filas huérfanas (L-08), `lastModified` real en sitemap (L-02), título de 404 (L-01).
- Turnstile en formularios públicos si aparece spam.
