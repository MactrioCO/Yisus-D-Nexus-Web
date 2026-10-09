/* Botón de sesión del navbar (todas las páginas) + re-pintado en cambio de idioma. */
import { sb } from "./sb.js";

const NAV_TXT = {
  es: { in: "Iniciar sesión", out: "Cerrar sesión" },
  en: { in: "Log in", out: "Log out" },
};

let NAV_SESSION = null;

function navLang() {
  return (document.documentElement.lang || "es").startsWith("en") ? "en" : "es";
}

async function doOut() {
  try {
    await sb.auth.signOut();
  } catch (_) {
    /* sigue al inicio igual */
  }
  location.href = "index.html";
}

function paintNav() {
  const T = NAV_TXT[navLang()];
  document.querySelectorAll("[data-nav-cta]").forEach((el) => {
    if (NAV_SESSION && el.tagName !== "BUTTON") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = el.className;
      btn.setAttribute("data-nav-cta", "");
      btn.textContent = T.out;
      btn.addEventListener("click", doOut);
      el.replaceWith(btn);
    } else if (!NAV_SESSION && el.tagName === "BUTTON") {
      const a = document.createElement("a");
      a.className = el.className;
      a.setAttribute("data-nav-cta", "");
      a.href = "cuenta.html";
      a.textContent = T.in;
      el.replaceWith(a);
    } else {
      el.textContent = NAV_SESSION ? T.out : T.in;
    }
  });
  let item = document.querySelector("[data-nav-m]");
  if (!item) {
    const nav = document.getElementById("navLinks");
    if (!nav) return;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.setAttribute("data-nav-m", "");
    li.appendChild(a);
    nav.appendChild(li);
    item = a;
  }
  if (NAV_SESSION) {
    item.textContent = T.out;
    item.href = "index.html";
    item.onclick = (e) => {
      e.preventDefault();
      doOut();
    };
  } else {
    item.textContent = T.in;
    item.href = "cuenta.html";
    item.onclick = null;
  }
}

async function navSession() {
  try {
    const { data } = await sb.auth.getSession();
    NAV_SESSION = (data && data.session) || null;
  } catch (_) {
    NAV_SESSION = null;
  }
  paintNav();
}

window.addEventListener("langchange", paintNav);
navSession();
