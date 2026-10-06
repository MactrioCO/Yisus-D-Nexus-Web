/* ============================================================
   YISUS D NEXUS — Landing Page · app.js
   Sin dependencias. Respeta prefers-reduced-motion.
   ========================================================== */
(function () {
  "use strict";
  var CFG = window.NEXUS_SITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Loading screen ---------- */
  var loader = $("#loader"), loaderMsg = $("#loaderMsg");
  var msgs = ["Conectando módulos…", "Cargando inventario…", "Cuadrando caja…", "Listo para vender ✓"];
  var mi = 0;
  var msgTimer = setInterval(function () {
    mi = (mi + 1) % msgs.length;
    if (loaderMsg) loaderMsg.textContent = msgs[mi];
  }, 450);
  function hideLoader() {
    clearInterval(msgTimer);
    if (!loader || loader.classList.contains("done")) return;
    if (loaderMsg) loaderMsg.textContent = "Listo para vender ✓";
    setTimeout(function () { loader.classList.add("done"); }, reduceMotion ? 0 : 350);
  }
  window.addEventListener("load", hideLoader);
  setTimeout(hideLoader, 3500); // seguridad: nunca atrapar al usuario

  /* ---------- Navbar: blur + link activo ---------- */
  var nav = $("#navbar");
  var sections = ["inicio", "que-es", "modulos", "funciones", "como-funciona", "demo", "faq", "contacto"];
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
    var current = "inicio";
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 120) current = id;
    });
    $$(".nav-links a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  var burger = $("#burger");
  burger.addEventListener("click", function () {
    var open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });
  $$(".nav-links a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.body.classList.remove("menu-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.body.classList.remove("menu-open");
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Contadores del hero ---------- */
  function counters() {
    $$("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = /%$/.test(el.textContent) ? "%" : (/\+$/.test(el.textContent) ? "+" : "");
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var t0 = null;
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      new IntersectionObserver(function (en, obs) {
        if (en[0].isIntersecting) { requestAnimationFrame(tick); obs.disconnect(); }
      }, { threshold: 0.5 }).observe(el);
    });
  }
  counters();

  /* ---------- Toast ---------- */
  var toast = $("#toast"), toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 4200);
  }

  /* ---------- Botón demo (gobernado por site.config.js) ---------- */
  var demo = CFG.demo || {};
  var demoNote = $("[data-demo-note]");
  if (demo.available && demo.file) {
    $$("[data-demo-link]").forEach(function (a) { a.setAttribute("href", demo.file); });
    if (demoNote) demoNote.textContent = "Instalador para Windows (.exe) · " + demo.file.split("/").pop();
  } else {
    $$("[data-demo-link]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        showToast("La demo aún no está publicada. Coloca el instalador en " + (demo.file || "downloads/") + " y actívala en site.config.js.");
        document.getElementById("demo").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }
  if (CFG.product && CFG.product.version) {
    $$("[data-version]").forEach(function (el) {
      el.textContent = "v" + CFG.product.version + " · Windows · Instalador .exe";
    });
  }

  /* ---------- Contacto (gobernado por site.config.js) ---------- */
  var contact = CFG.contact || {};
  var labels = { whatsapp: "WhatsApp", email: "Correo", facebook: "Facebook", instagram: "Instagram / TikTok" };
  Object.keys(labels).forEach(function (key) {
    var url = contact[key];
    if (!url) return;
    $$('[data-contact="' + key + '"]').forEach(function (a) {
      a.setAttribute("href", key === "email" ? "mailto:" + url : url);
      a.classList.remove("pending");
      a.setAttribute("target", key === "email" ? "_self" : "_blank");
      if (key !== "email") a.setAttribute("rel", "noopener");
    });
    $$('[data-contact-label="' + key + '"]').forEach(function (el) {
      // Muestra etiqueta legible (ej: "+57 323 285 1942"), nunca la URL larga.
      el.textContent = contact[key + "Label"] || url;
    });
  });

  /* ---------- Capturas reales (gobernadas por site.config.js) ---------- */
  var shots = (CFG.screenshots) || {};
  if (shots.hero) {
    var heroImg = $("#heroShot");
    heroImg.setAttribute("src", shots.hero);
    $("#heroMock").classList.add("has-shot");
  }
  /* Galería: las fotos reales ya están en el HTML; aquí no se toca nada. */

  /* ---------- FAQ acordeón ---------- */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item), a = $(".faq-a", item);
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      $$(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        $(".faq-a", o).style.maxHeight = null;
        $(".faq-q", o).setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Año ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
