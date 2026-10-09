/* Navbar: botón de sesión + link Panel solo para el owner activo.
   Sin sesión o sin rol: el link Panel no existe en el DOM. */
import { sb } from "./sb.js";

const NAV_TXT = {
  es: { in: "Iniciar sesión", out: "Cerrar sesión" },
  en: { in: "Log in", out: "Log out" },
};

let NAV_SESSION = null;
let NAV_OWNER = false;

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
  const nav = document.getElementById("navLinks");
  if (nav) {
    let panelLi = nav.querySelector("[data-nav-panel]");
    if (NAV_OWNER && !panelLi) {
      panelLi = document.createElement("li");
      const a = document.createElement("a");
      a.setAttribute("data-nav-panel", "");
      a.href = "consola.html";
      a.textContent = "Panel";
      if (location.pathname.includes("consola")) a.classList.add("active");
      panelLi.appendChild(a);
      nav.appendChild(panelLi);
    } else if (!NAV_OWNER && panelLi) {
      panelLi.remove();
    }
  }
  let item = document.querySelector("[data-nav-m]");
  if (!item) {
    const nav2 = document.getElementById("navLinks");
    if (!nav2) return;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.setAttribute("data-nav-m", "");
    li.appendChild(a);
    nav2.appendChild(li);
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
    NAV_OWNER = false;
    if (NAV_SESSION) {
      const { data: p } = await sb
        .from("landing_users")
        .select("role,active")
        .eq("id", NAV_SESSION.user.id)
        .maybeSingle();
      NAV_OWNER = !!(p && p.role === "owner" && p.active);
    }
  } catch (_) {
    NAV_SESSION = null;
    NAV_OWNER = false;
  }
  paintNav();
}

window.addEventListener("langchange", paintNav);
navSession();
