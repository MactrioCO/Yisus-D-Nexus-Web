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
4. Entra a `panel.html` y verifica que ves las 3 pestañas.

## Publicar una versión (flujo normal)

1. Compila el instalador y súelo como asset a un **GitHub Release**
   del repo (el asset debe descargar DIRECTO, sin página intermedia).
2. En tu PC calcula el hash: `certutil -hashfile instalador.exe SHA256`
   (minúsculas, 64 caracteres).
3. En `panel.html` → Versiones → completa versión (semver), URL, SHA,
   changelog (≤300) → **Guardar** con "Publicar" marcado
   (retira la anterior sola).
4. Botón **Descargar version.json** → súbelo al repo web en
   `versiones/version.json` → commit + push → espera 1–2 min a Pages.
5. El POS (versión instalada < publicada) avisará solo; verifica el
   SHA antes de instalar y nunca hace downgrade.

## Puertas del front (defensa en profundidad)

El blindaje real son Auth + RLS (probado). Encima, las páginas
privadas rebotan al inicio si no hay permiso:

- `panel.html` → `requireOwner()` en cada carga y antes de cada
  escritura; si falla → `index.html?denied=owner`.
- `descargas.html` → sin sesión → `?denied=login`; pendiente →
  `?denied=pending`. Solo cuentas activas ven el instalador.
- `index.html` muestra el motivo en un toast y limpia la URL.
- `cuenta.html` es la puerta pública (no se protege).
- Si el CDN de Supabase falla, los módulos no corren y el contenido
  sensible queda oculto (denegado por defecto).

## Probar la validación de licencias

`panel.html` → Licencias → genera una clave → usa **Probar validación**.
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
