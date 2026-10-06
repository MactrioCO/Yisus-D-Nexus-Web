/* ============================================================
 * YISUS D NEXUS — Landing Page · Configuración central
 * ------------------------------------------------------------
 * Edita AQUÍ los datos que cambian con el tiempo y el resto
 * de la página se actualiza solo (vía app.js).
 *
 *  · DEMO_EXE: todavía no hay instalador demo publicado.
 *    Cuando lo tengas, cópialo a "Landing Page/downloads/" y
 *    pon available:true. (Hay un instalador completo en la
 *    carpeta que NO está activado como demo: confirmar antes.)
 *  · CONTACTO: datos reales del proveedor.
 *  · CAPTURAS: fotos reales del programa, ya configuradas.
 * ========================================================== */
window.NEXUS_SITE = {
  product: {
    name: "Yisus D Nexus",
    tagline: "El centro de control para tu negocio de barrio",
    version: "0.2.0",
    platform: "Windows · PC",
  },

  /* ----- Descarga demo ------------------------------------
   * Demo ACTIVA vía GitHub Release. Si publicas una versión
   * nueva, sube el .exe al Release y cambia la URL aquí. */
  demo: {
    file: "https://github.com/MactrioCO/Yisus-D-Nexus/releases/download/v0.2.0-demo/NexusDemo_Setup_0.2.0_win64.exe",
    available: true,
  },

  /* ----- Contacto real del proveedor ---------------------- */
  contact: {
    whatsapp: "https://api.whatsapp.com/send/?phone=573232851942&text&type=phone_number&app_absent=0",
    whatsappLabel: "+57 323 285 1942",
    email: "jesusdramirez26@gmail.com",
    facebook: "",
    instagram: "",
    tiktok: "",
  },

  domain: "", // sin dominio por ahora

  /* ----- Capturas reales del programa --------------------- */
  screenshots: {
    hero: "", // aún no hay captura de Ventas/POS: se usa el mock
    gallery: [
      "captures/login.png",
      "captures/dashboard.png",
      "captures/productos.png",
      "captures/clientes.png",
    ],
  },
};
