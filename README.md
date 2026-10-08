# Landing Page — Yisus D Nexus

Página oficial estática del producto. Sin dependencias, sin build:
se abre con doble clic en `index.html` o se sirve como archivos estáticos.

## Estructura

```text
Landing Page/
├── index.html       → página principal (SEO + a11y incluidos)
├── legal.html       → términos y política de privacidad (v0.2.0)
├── styles.css       → sistema visual propio
├── app.js           → loader, navbar, reveal, FAQ, demo, contacto
├── site.config.js   → ★ DATOS EDITABLES (versión, demo, contacto, capturas)
├── robots.txt       → (sitemap pendiente de dominio propio)
├── assets/          → copiados de app/assets (logo, title_bar, taskbar, favicon)
├── captures/        → capturas reales del programa (login, dashboard, …)
└── downloads/       → aquí va el instalador demo cuando se publique
```

## Estado de los pendientes

| Qué | Estado |
|-----|--------|
| Instalador demo | ✅ activo vía Release público `DEMO` en `Yisus-D-Nexus-Web` (usuario `demo` / clave `Demo1234`, SHA-256 verificado) |
| Capturas | ✅ reales: login, dashboard, productos, clientes |
| Backend nube | ✅ Supabase Auth + 3 tablas `landing_*` con RLS (ver `SUPABASE_BACKEND.md`) |
| Cuentas | ✅ `cuenta.html` (registro/login, activación por owner) |
| Panel owner | ✅ `panel.html` (usuarios, versiones con subida de .exe a la web, licencias; puerta owner, customers van a novedades) |
| Descargas | ✅ `descargas.html` + `versiones/version.json` (solo cuentas activas) |
| Novedades | ✅ `novedades.html` (historial para customers activos) |
| Video demo | ⬜ pendiente (`captures/demo.mp4`) |
| Captura de Ventas/POS para el hero | ⬜ pendiente (el hero usa el mock hasta entonces) |
| Contacto | ✅ WhatsApp + correo reales |
| Redes sociales | ➖ ocultas a pedido del dueño |
| Legal | ✅ `legal.html` publicado y enlazado en el footer |
| Dominio | ➖ sin dominio: no hay canonical, OG con URL ni sitemap |

## Cómo cambiar el instalador demo

1. Sube el `.exe` nuevo a un Release en `MactrioCO/Yisus-D-Nexus`.
2. Actualiza la URL en `site.config.js → demo.file`.
3. Listo: los 4 botones lo descargan sin más cambios.
   (El `.exe` local en `downloads/` es solo tu copia de trabajo: está
   ignorado por git y no se sube a ningún repo.)

## Despliegue

Cualquier hosting estático sirve (GitHub Pages, Netlify, Cloudflare Pages,
Nginx…): sube el contenido de esta carpeta a la raíz. Cuando haya dominio
propio: agregar canonical + `og:url` en `index.html`, generar `sitemap.xml`
y descomentar la línea `Sitemap:` en `robots.txt`.

## Notas fieles al producto

Todo lo afirmado en la página existe en el repo: POS offline-first
(Flet + SQLite + Supabase), ~20 módulos en `app/modules/`, ticket ESC/POS,
FEFO/vencimientos, fiado con promesa, 16 reportes, 14 gráficos, import/export
Excel, backups cifrados, instalador Windows v0.2.0. Lo que aún no existe
(demo descargable, DIAN, app móvil) se presenta como pendiente, no como listo.
