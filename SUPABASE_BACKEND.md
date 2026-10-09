# Backend de la landing — Supabase (Auth + RLS)

La landing es 100% estática (GitHub Pages, sin backend propio).
El "backend" es el proyecto Supabase del POS, con 3 tablas propias
(prefijo `landing_`) + Auth por correo/contraseña.

> **Seguridad:** en el cliente solo vive la **anon key (publishable)**,
> que es pública por diseño (`js/sb-config.js`). Todo lo sensible lo
> protegen las políticas RLS en `supabase/landing_schema.sql`.
> La `service_role` JAMÁS sale de `.env` local.

## Tablas

| Tabla | Para qué | Lectura pública |
|-------|----------|-----------------|
| `landing_users` | Cuentas (id = auth.users.id, email, negocio, rol, activa) | Ninguna (cada uno solo su fila) |
| `landing_releases` | Versiones del programa (semver, url directa, sha256, changelog ≤300, published) | Solo la última con `published=true` (a nivel BD; la página `descargas.html` además exige cuenta activa) |
| `landing_licenses` | Claves `YDNX-XXXX-XXXX` (negocio, activa, notas) | Ninguna (solo vía RPC `validate_license`) |

Funciones: `is_landing_owner()`, `latest_published_release_id()`,
`validate_license(p_key)` (devuelve true/false, sin exponer la tabla),
trigger `landing_users_guard_trg` (un customer no puede auto-ascenderse
ni auto-activarse editando su fila).

## Puesta en marcha (una sola vez)

1. **Migración:** ya aplicada con `scripts/apply_supabase_schema.py`
   (aplica `schema.sql` + `landing_schema.sql`, 227 sentencias OK).
   Re-ejecutar es seguro (idempotente).
2. **Auth → desactiva confirmación de correo:** en el dashboard Supabase:
   Authentication → Providers → Email → **OFF** en "Confirm email".
   (Igual hay que aprobar manual cada cuenta; el correo solo estorba.)
3. **Crea tu cuenta owner:** abre `cuenta.html` → Crear cuenta
   (negocio + correo + clave) → luego en Supabase hazte owner:
   ```sql
   UPDATE public.landing_users
   SET role = 'owner', active = TRUE
   WHERE email = 'TU_CORREO';
   ```
   (SQL Editor del dashboard. Solo esta vez: aún no hay owner que lo haga.)
4. Entra a `consola.html` y verifica que ves las 3 pestañas.

## Publicar una versión (flujo normal)

1. En `consola.html` → Versiones → escribe la versión (semver) y qué
   cambió (≤300) → elige el `.exe` → **Subir y guardar versión**.
   El archivo se guarda en la propia web (bucket `installers` de
   Supabase, lectura pública, escritura solo owner), el SHA-256 se
   calcula solo y la URL queda directa para el actualizador.
   Con "Publicar" marcado se retira la anterior sola.
2. Botón **Descargar version.json** → súbelo al repo web en
   `versiones/version.json` → commit + push → espera 1–2 min a Pages.
3. El POS (versión instalada < publicada) avisará solo; verifica el
   SHA antes de instalar y nunca hace downgrade.
4. Al eliminar una versión se borra también su archivo guardado.
   Ojo al espacio: cada instalador pesa ~40 MB (límite 100 MB c/u).

## Puertas del front (defensa en profundidad)

El blindaje real son Auth + RLS (probado). Encima, las páginas
privadas rebotan al inicio si no hay permiso:

- `consola.html` → `requireOwner()` en cada carga y antes de cada
  escritura; si falla → `index.html?denied=owner`.
- `descargas.html` → sin sesión → `?denied=login`; pendiente →
  `?denied=pending`. Solo cuentas activas ven el instalador.
- `index.html` muestra el motivo en un toast y limpia la URL.
- `cuenta.html` es la puerta pública (no se protege).
- Si el CDN de Supabase falla, los módulos no corren y el contenido
  sensible queda oculto (denegado por defecto).

## Licencias por solicitud (customer pide, owner aprueba)

- Cada cuenta nueva genera sola su solicitud en pendiente (trigger;
  también hay backfill una sola vez). El formato de clave se exige
  a nivel de tabla (`YDNX-XXXX-XXXX`).
- El customer la ve en `novedades.html` → **Mi licencia** (pendiente,
  activa con clave, o rechazada con opción de pedir de nuevo).
- El owner la ve en `consola.html` → **Solicitudes pendientes** con
  negocio/correo y la **Acepta** (activa) o **Rechaza**.
- La fila nace `pending` + inactiva (no valida). El owner la ve en
  `consola.html` → **Solicitudes pendientes** con negocio/correo y la
  **Acepta** (activa) o **Rechaza**. También puede emitir directas.
- RLS: el customer solo inserta la suya (`requested_by` propio, formato
  de clave, sin activarse) y solo lee las suyas; jamás se auto-aprueba
  (sin policy de UPDATE). El owner lo ve y edita todo.

## Chat (Mactrio Bot + humano, Supabase)

Tablas `landing_chats` (visitante anónimo por `visitor_key`, nombre,
contacto, estado bot/human/closed) y `landing_chat_messages`
(bot/visitor/owner). Los visitantes operan SOLO por RPC
(`chat_start/send/bot_say/history/status`): acceso directo denegado
(verificado). El owner lee/escribe todo por policy.
El widget (`js/widget.js` + `js/chatbot.js`) hace polling cada 2.5 s:
sin recargar se ven los mensajes nuevos en ambos lados. El panel
responde con su nombre de negocio. Sin realtime directo porque anon
no puede suscribirse bajo RLS.

## Probar la validación de licencias

`consola.html` → Licencias → genera una clave → usa **Probar validación**.
El POS usará lo mismo después: `POST /rest/v1/rpc/validate_license`
con `{"p_key": "YDNX-XXXX-XXXX"}` y anon key → `true`/`false`.
(La implementación dentro del POS la hace el otro asistente.)

## Criterios de aceptación

- [ ] Me registro como customer → quedo pendiente (active=false).
- [ ] El owner me activa desde el panel → puedo entrar.
- [ ] Publico la 0.2.1 de prueba → `descargas.html` la muestra (entrando con cuenta activa; sin sesión pide login, sin activación muestra pendiente).
- [ ] `versiones/version.json` abre por HTTPS con el formato del contrato.
- [ ] El .exe del release descarga directo (sin login de GitHub).
- [ ] Un customer no puede verse la fila de otro ni hacerse owner
      (verificado con `scripts/verify_landing_rls.py`).
