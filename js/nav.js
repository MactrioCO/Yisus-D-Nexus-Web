/* Botón de sesión del navbar (todas las páginas).
   Con sesión → "Cerrar sesión" (sale y vuelve al inicio).
   Sin sesión → "Iniciar sesión". En móvil aparece como item del menú. */
import { sb } from "./sb.js";

async function navSession() {
  let session = null;
  try {
    const { data } = await sb.auth.getSession();
    session = (data && data.session) || null;
  } catch (_) {
    session = null;
  }

  async function doOut() {
    try {
      await sb.auth.signOut();
    } catch (_) {
      /* sigue al inicio igual */
    }
    location.href = "index.html";
  }

  const place = document.querySelector("[data-nav-cta]");
  if (place && session) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = place.className;
    btn.setAttribute("data-nav-cta", "");
    btn.textContent = "Cerrar sesión";
    btn.addEventListener("click", doOut);
    place.replaceWith(btn);
  }

  const nav = document.getElementById("navLinks");
  if (nav && !nav.querySelector("[data-nav-m]")) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.setAttribute("data-nav-m", "");
    if (session) {
      a.textContent = "Cerrar sesión";
      a.href = "index.html";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        doOut();
      });
    } else {
      a.textContent = "Iniciar sesión";
      a.href = "cuenta.html";
    }
    li.appendChild(a);
    nav.appendChild(li);
  }
}

navSession();
