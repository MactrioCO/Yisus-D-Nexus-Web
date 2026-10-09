/* Widget flotante: WhatsApp + Mactrio Bot (tiempo casi real por polling).
   Se inyecta solo en el DOM; cada página lo carga con dos <script>. */
import { sb } from "./sb.js";
import { QUICK, WA_LINK, botReply, renderRich } from "./chatbot.js";

const LS = "mactrio_vid";
const POLL_MS = 2500;

let chatId = null;
let vStatus = "bot";
let seen = new Set();
let open = false;
let pollTimer = null;
let profileDone = false;

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function vid() {
  try {
    let v = localStorage.getItem(LS);
    if (!v) {
      if (crypto.randomUUID) v = crypto.randomUUID();
      else {
        const b = crypto.getRandomValues(new Uint8Array(16));
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const h = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
        v = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
      }
      localStorage.setItem(LS, v);
    }
    return v;
  } catch (_) {
    return "web-" + Date.now();
  }
}

function build() {
  const stack = document.createElement("div");
  stack.className = "float-stack";
  stack.innerHTML = `
    <a class="wa-btn" href="${WA_LINK}" target="_blank" rel="noopener" aria-label="Hablar por WhatsApp">☎</a>
    <button class="chat-btn" id="cbotOpen" aria-label="Abrir chat con Mactrio Bot"><img src="assets/mactrio-bot.png" alt="Mactrio Bot" width="56" height="56" /><i></i></button>`;
  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.id = "cbotPanel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="chat-head"><span class="chat-ava"><img src="assets/mactrio-bot.png" alt="Mactrio Bot" width="36" height="36" /></span>
      <span><strong>Mactrio Bot</strong><small>● en línea</small></span>
      <button id="cbotClose" aria-label="Cerrar chat">×</button>
    </div>
    <div class="chat-msgs" id="cbotMsgs" aria-live="polite"></div>
    <div class="chat-quick" id="cbotQuick"></div>
    <form class="chat-human" id="cbotHuman" hidden>
      <p>Déjame tus datos y te atiende una persona aquí mismo.</p>
      <input id="cbotName" maxlength="80" placeholder="Tu nombre *" autocomplete="name" />
      <input id="cbotContact" maxlength="80" placeholder="Tu WhatsApp *" autocomplete="tel" />
      <div class="row-actions">
        <button class="btn btn-primary btn-sm" type="submit">Conectar</button>
        <button class="btn btn-ghost btn-sm" type="button" id="cbotHumanBack">Seguir con el bot</button>
      </div>
    </form>
    <form class="chat-input" id="cbotForm">
      <input id="cbotText" maxlength="1000" placeholder="Escríbeme…" autocomplete="off" />
      <button aria-label="Enviar">➤</button>
    </form>`;
  document.body.append(stack, panel);

  document.getElementById("cbotOpen").addEventListener("click", toggle);
  document.getElementById("cbotClose").addEventListener("click", toggle);
  document.getElementById("cbotForm").addEventListener("submit", onSend);
  document.getElementById("cbotHuman").addEventListener("submit", onHandoff);
  document.getElementById("cbotHumanBack").addEventListener("click", () => {
    document.getElementById("cbotHuman").hidden = true;
    document.getElementById("cbotQuick").style.display = "";
  });
  const q = document.getElementById("cbotQuick");
  QUICK.forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = b.label;
    btn.addEventListener("click", () => onQuick(b));
    q.appendChild(btn);
  });
  greet();
}

function toggle(force) {
  open = typeof force === "boolean" ? force : !open;
  document.getElementById("cbotPanel").hidden = !open;
  if (open) {
    if (chatId) pull();
    startPoll();
  } else stopPoll();
}

function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => { if (open && chatId) pull(); }, POLL_MS);
}
function stopPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

function nearBottom(box) {
  return box.scrollHeight - box.scrollTop - box.clientHeight < 90;
}
function toBottom(box) {
  box.scrollTop = box.scrollHeight;
}

function bubble(m) {
  const box = document.getElementById("cbotMsgs");
  const stick = nearBottom(box);
  const d = document.createElement("div");
  if (m.sender === "visitor") {
    d.className = "cm cm-me";
    d.textContent = m.body;
  } else if (m.sender === "owner") {
    d.className = "cm cm-owner";
    d.innerHTML = `<small>${esc(m.author_name || "Soporte")}</small><span></span>`;
    d.querySelector("span").textContent = m.body;
  } else {
    d.className = "cm cm-bot";
    d.innerHTML = `<small>Mactrio Bot</small><span>${renderRich(m.body)}</span>`;
  }
  box.appendChild(d);
  if (stick) toBottom(box);
}

function greet() {
  const box = document.getElementById("cbotMsgs");
  if (box.children.length) return;
  const d = document.createElement("div");
  d.className = "cm cm-bot";
  d.innerHTML = `<small>Mactrio Bot</small><span>¡Hola! Soy Mactrio Bot. Pregúntame de precios, demo, requisitos o licencias… o habla con un humano. 👇</span>`;
  box.appendChild(d);
}

async function ensureChat(human, name, contact) {
  const { data, error } = await sb.rpc("chat_start", {
    p_visitor_key: vid(),
    p_name: name || "",
    p_contact: contact || "",
    p_human: !!human,
  });
  if (error) throw error;
  chatId = data;
  return data;
}

async function pull() {
  try {
    const { data: st } = await sb.rpc("chat_status", { p_visitor_key: vid(), p_chat_id: chatId });
    vStatus = st || "closed";
    if (vStatus === "closed") return closedView();
    const { data, error } = await sb.rpc("chat_history", { p_visitor_key: vid(), p_chat_id: chatId });
    if (error) throw error;
    (data || []).forEach((m) => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        bubble(m);
      }
    });
    document.getElementById("cbotQuick").style.display = vStatus === "human" ? "none" : "";
  } catch (_) {
    /* reintenta en el próximo ciclo */
  }
}

function closedView() {
  const box = document.getElementById("cbotMsgs");
  if (!document.getElementById("cbotClosed")) {
    const d = document.createElement("div");
    d.className = "cm cm-bot";
    d.id = "cbotClosed";
    d.innerHTML = `<small>Mactrio Bot</small><span>Esta conversación se cerró. Si necesitas más, abre una nueva. 👇</span>`;
    box.appendChild(d);
    toBottom(box);
    const btn = document.createElement("button");
    btn.className = "btn btn-ghost btn-sm";
    btn.textContent = "Nueva conversación";
    btn.style.margin = "8px auto";
    btn.addEventListener("click", () => {
      chatId = null;
      seen = new Set();
      vStatus = "bot";
      box.innerHTML = "";
      document.getElementById("cbotClosed")?.remove();
      document.getElementById("cbotQuick").style.display = "";
      btn.remove();
      greet();
    });
    box.appendChild(btn);
  }
}

async function sendUser(text) {
  text = String(text || "").trim().slice(0, 1000);
  if (!text) return;
  if (vStatus === "closed" || !chatId) {
    chatId = null;
    seen = new Set();
    document.getElementById("cbotMsgs").innerHTML = "";
    vStatus = "bot";
  }
  await ensureChat(false);
  const { error } = await sb.rpc("chat_send", { p_visitor_key: vid(), p_chat_id: chatId, p_body: text });
  if (error) throw error;
  await pull();
}

async function botSay(text) {
  const { error } = await sb.rpc("chat_bot_say", { p_visitor_key: vid(), p_chat_id: chatId, p_body: text });
  if (error) throw error;
  await pull();
}

async function onSend(e) {
  e.preventDefault();
  const inp = document.getElementById("cbotText");
  const text = inp.value;
  inp.value = "";
  try {
    await sendUser(text);
    if (vStatus !== "human") {
      const r = botReply(text);
      if (r.action === "humano") openHandoff();
      else await botSay(r.text);
    }
  } catch (_) {
    inp.value = text;
  }
}

async function onQuick(b) {
  try {
    if (b.id === "humano") {
      openHandoff();
      return;
    }
    await sendUser(b.ask);
    if (vStatus !== "human") {
      const r = botReply(b.ask);
      await botSay(r.text);
    }
  } catch (_) {
    /* reintenta luego */
  }
}

function openHandoff() {
  document.getElementById("cbotHuman").hidden = false;
  document.getElementById("cbotQuick").style.display = "none";
  document.getElementById("cbotName")?.focus();
}

async function onHandoff(e) {
  e.preventDefault();
  const name = document.getElementById("cbotName").value.trim().slice(0, 80);
  const contact = document.getElementById("cbotContact").value.trim().slice(0, 80);
  if (name.length < 2 || contact.length < 3) return;
  try {
    await ensureChat(true, name, contact);
    vStatus = "human";
    document.getElementById("cbotHuman").hidden = true;
    document.getElementById("cbotQuick").style.display = "none";
    await botSay(`Listo ${name}, ya avisé a un asesor. Te responderá aquí mismo. ¿Algo más mientras tanto?`);
  } catch (_) {
    /* reintenta luego */
  }
}

try {
  build();
} catch (_) {
  /* sin widget si el DOM falla */
}
