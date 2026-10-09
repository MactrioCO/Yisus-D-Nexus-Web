/* YISUS D NEXUS — motor ES<->EN + traductor del chat.
   Clásico (sin imports): leer js/i18n_dict.js ANTES que este archivo.
   - Estático y panel dinámico: diccionario exacto (ida y vuelta).
   - Datos (nombres, claves, correos) nunca coinciden: intactos.
   - Mensajes del chat (bot/dueño) en modo EN: vía MyMemory con caché. */
(function () {
  "use strict";

  var LS = "mactrio_lang";
  var REV = null;
  var META_REV = null;
  var SKIP_SEL = "script,style,code,pre,textarea,.mock-window,.mock-float,.cm";
  var timer = null;

  function revMap() {
    if (!REV) {
      REV = {};
      Object.keys(I18N_ES_EN).forEach(function (k) {
        var v = I18N_ES_EN[k];
        if (v && v !== k && !(v in REV)) REV[v] = k;
      });
    }
    return REV;
  }

  function metaRevMap() {
    if (!META_REV) {
      META_REV = {};
      Object.keys(I18N_META).forEach(function (k) {
        var v = I18N_META[k];
        if (v && v !== k && !(v in META_REV)) META_REV[v] = k;
      });
    }
    return META_REV;
  }

  function lang() {
    try {
      var l = localStorage.getItem(LS);
      if (l === "en" || l === "es") return l;
    } catch (_) {}
    return "es";
  }

  function skipped(el) {
    return !!(el && el.closest && el.closest(SKIP_SEL));
  }

  function swapText(root, map) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (n.parentElement && skipped(n.parentElement)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var raw = n.nodeValue;
      var t = raw.trim();
      if (map[t] && map[t] !== t) {
        var i = raw.indexOf(t);
        n.nodeValue = raw.slice(0, i) + map[t] + raw.slice(i + t.length);
      }
    });
  }

  function swapAttrs(map) {
    Array.prototype.forEach.call(
      document.querySelectorAll("[placeholder],[aria-label],[alt],[title]"),
      function (el) {
        if (skipped(el)) return;
        ["placeholder", "aria-label", "alt", "title"].forEach(function (a) {
          var v = el.getAttribute(a);
          if (v && map[v] && map[v] !== v) el.setAttribute(a, map[v]);
        });
      }
    );
  }

  function applyTo(toEN) {
    var map = toEN ? I18N_ES_EN : revMap();
    var mmap = toEN ? I18N_META : metaRevMap();
    swapText(document, map);
    swapAttrs(map);
    if (map[document.title]) document.title = map[document.title];
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      var c = meta.getAttribute("content");
      if (c && mmap[c]) meta.setAttribute("content", mmap[c]);
    }
  }

  function loaderEl() {
    return document.getElementById("loader");
  }
  function hideLoader() {
    var l = loaderEl();
    if (l) l.classList.add("done");
  }
  function setLang(l, silent) {
    var toEN = l === "en";
    try {
      localStorage.setItem(LS, l);
    } catch (_) {}
    document.documentElement.lang = toEN ? "en" : "es";
    if (!silent) {
      var ldr = loaderEl();
      if (ldr) {
        ldr.classList.remove("done");
        var msg = document.getElementById("loaderMsg");
        if (msg) msg.textContent = toEN ? "Switching language…" : "Cambiando idioma…";
      }
    }
    applyTo(toEN);
    if (!silent) {
      try {
        window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
      } catch (_) {}
      setTimeout(hideLoader, 700);
    }
  }

  function observe() {
    if (!("MutationObserver" in window) || !document.body) return;
    var io = new MutationObserver(function (muts) {
      var onlyChat = muts.every(function (m) {
        var t = m.target;
        if (t.nodeType === 3) t = t.parentElement;
        return t && t.closest && t.closest(".chat-msgs");
      });
      if (onlyChat) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        applyTo(lang() === "en");
      }, 350);
    });
    io.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* Traduce ES->EN para mensajes guardados (bot/dueño). Con caché. */
  var TCACHE = {};
  function toEN(text) {
    var t = String(text || "");
    if (!t.trim()) return Promise.resolve(t);
    if (TCACHE[t]) return Promise.resolve(TCACHE[t]);
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(t.slice(0, 900)) + "&langpair=es|en";
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var s = (j && j.responseData && j.responseData.translatedText) || t;
        if (/QUERY LENGTH LIMIT|MYMEMORY WARNING|INVALID EMAIL|NO QUERY SPECIFIED/i.test(s)) s = t;
        var ta = document.createElement("textarea");
        ta.innerHTML = s;
        s = ta.value;
        TCACHE[t] = s;
        return s;
      })
      .catch(function () { return t; });
  }

  observe();
  setLang(lang(), true);
  window.addEventListener("load", function () {
    setTimeout(hideLoader, 250);
  });
  setTimeout(hideLoader, 3500);

  window.NexusI18n = {
    lang: lang,
    set: setLang,
    apply: function () { applyTo(lang() === "en"); },
    toEN: toEN,
  };
})();
