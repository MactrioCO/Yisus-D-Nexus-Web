/* Mactrio Bot — cerebro de respuestas (contenido honesto, sin inventar).
   Usado por el widget de la web. Los links [texto](url) solo permiten
   destinos internos, WhatsApp y correo. */
export const WA_LINK =
  "https://api.whatsapp.com/send/?phone=573232851942&text&type=phone_number&app_absent=0";

export const QUICK = [
  { id: "precios", label: "💰 Precios", ask: "cuanto vale el programa" },
  { id: "demo", label: "⬇ Probar demo", ask: "como pruebo la demo" },
  { id: "requisitos", label: "📋 Requisitos", ask: "que necesito para usarlo" },
  { id: "licencia", label: "🔑 Licencia", ask: "como consigo licencia" },
  { id: "humano", label: "🙋 Hablar con humano", ask: "" },
];

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/[^a-z0-9@. ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const has = (t, words) => words.some((w) => t.includes(w));

export function botReply(raw) {
  const t = norm(raw);
  if (!t) return { text: "Escríbeme tu pregunta o elige una opción de abajo. 👇" };

  if (has(t, ["humano", "humana", "asesor", "persona", "alguien real", "hablar con", "atiendan", "whatsapp", "wssp", "contacto", "telefono", "correo", "email", "llamar"])) {
    if (has(t, ["precio", "vale", "cuesta", "plan", "comprar", "pago", "cuanto"])) {
      return { text: "Los planes y precios los confirmamos por WhatsApp según tu negocio, para darte la mejor opción. Escríbenos aquí: [WhatsApp](WA). Si prefieres, pulsa Hablar con humano y te atiendo por este chat." };
    }
    if (has(t, ["whatsapp", "wssp", "telefono", "llamar"])) {
      return { text: "Claro: WhatsApp [323 285 1942](WA) y correo jesusdramirez26@gmail.com. Te respondemos lo antes posible. ¿Quieres que te atienda un humano por aquí? Pulsa Hablar con humano." };
    }
    return { action: "humano" };
  }
  if (has(t, ["precio", "vale", "cuesta", "costo", "cuanto", "plan", "pago", "comprar", "vende"])) {
    return { text: "Los planes y precios los confirmamos por WhatsApp según tu negocio, para darte la mejor opción. Escríbenos aquí: [WhatsApp](WA). También puedes pulsar Hablar con humano." };
  }
  if (has(t, ["demo", "probar", "prueba", "ensayar", "descargar demo"])) {
    return { text: "Puedes descargar la demo gratis en la sección [Demo](index.html#demo). Se instala en Windows y entras con usuario demo y contraseña Demo1234, con datos de ejemplo." };
  }
  if (has(t, ["requisito", "necesito", "necesita", "pc", "computador", "windows", "internet", "impresora", "equipo"])) {
    return { text: "Solo necesitas un PC con Windows 10 u 11 de 64 bits. Funciona sin internet. La impresora térmica y el lector de códigos son opcionales pero recomendados para caja." };
  }
  if (has(t, ["licencia", "clave", "activar", "activacion", "permiso"])) {
    return { text: "Cada negocio usa una clave de licencia. Crea tu cuenta en [Cuenta](cuenta.html), pídela en Novedades y la activamos. Sin clave activa el programa no abre." };
  }
  if (has(t, ["cuenta", "registro", "registrar", "crear cuenta", "sesion", "entrar", "login"])) {
    return { text: "Crea tu cuenta en [Cuenta](cuenta.html) con tu correo. Queda pendiente hasta que la activemos y te avisamos. Luego entras y ves tus descargas y novedades." };
  }
  if (has(t, ["actualiz", "version", "nueva version", "descargar el programa", "instalador"])) {
    return { text: "Las versiones oficiales están en [Descargas](descargas.html) para cuentas activas. El programa también avisa solo cuando hay actualización." };
  }
  if (has(t, ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "saludos", "que tal"])) {
    return { text: "¡Hola! Soy Mactrio Bot. Puedo contarte de precios, demo, requisitos y licencias, o pasarte con un humano. ¿Qué necesitas?" };
  }
  if (has(t, ["gracias", "genial", "perfecto", "listo", "vale", "ok"])) {
    return { text: "¡Con gusto! Si necesitas algo más, aquí estoy. 👋" };
  }
  if (has(t, ["adios", "chao", "hasta luego", "nos vemos"])) {
    return { text: "¡Hasta luego! Que vendas mucho hoy. 👋" };
  }
  if (has(t, ["quien eres", "tu nombre", "bot", "robot", "mactrio"])) {
    return { text: "Soy Mactrio Bot, el asistente de Yisus D Nexus. Respondo lo básico y te paso con un humano cuando lo pides." };
  }
  return { text: "Mmm, no te entendí bien. Prueba con los botones de abajo o pulsa Hablar con humano y te atiende una persona. 🤔" };
}

/* Render seguro: escapa HTML y solo enlaza destinos permitidos. */
const ALLOW = [WA_LINK, "index.html#demo", "cuenta.html", "descargas.html", "novedades.html", "mailto:jesusdramirez26@gmail.com"];
export function renderRich(text) {
  const esc = String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  return esc.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
    let u = url === "WA" ? WA_LINK : url;
    const ok = ALLOW.some((a) => u === a || (a === WA_LINK && u === WA_LINK));
    if (!ok) return label;
    const ext = u.startsWith("http");
    return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
  });
}
