/* YISUS D NEXUS — cliente Supabase compartido (landing).
   Se importa desde las páginas como módulo ES. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.NEXUS_SB || {};
if (!cfg.url || !cfg.anonKey) {
  throw new Error("Falta configuración Supabase (js/sb-config.js).");
}

export const sb = createClient(cfg.url, cfg.anonKey);

export async function session() {
  const { data } = await sb.auth.getSession();
  return data.session || null;
}

export async function myProfile() {
  const s = await session();
  if (!s) return { user: null, profile: null };
  const { data, error } = await sb
    .from("landing_users")
    .select("*")
    .eq("id", s.user.id)
    .maybeSingle();
  if (error) throw error;
  return { user: s.user, profile: data || null };
}

/* Crea la fila del usuario si no existe (rol customer, inactiva).
   La RLS solo permite: id propio + role customer + active false. */
export async function ensureProfile(businessName) {
  const s = await session();
  if (!s) return null;
  const { data: existing, error: selErr } = await sb
    .from("landing_users")
    .select("*")
    .eq("id", s.user.id)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing;
  const meta = (s.user.user_metadata || {}).business_name || "";
  const name = (businessName || meta || s.user.email.split("@")[0]).slice(0, 120);
  const { data, error } = await sb
    .from("landing_users")
    .insert({ id: s.user.id, email: s.user.email, business_name: name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* Puerta del panel: sesión + fila propia + role owner + activa.
   Se llama en cada carga Y antes de cada acción de escritura. */
export async function requireOwner() {
  const { user, profile } = await myProfile();
  if (!user) throw new Error("NO_SESSION");
  if (!profile) throw new Error("NO_PROFILE");
  if (profile.role !== "owner" || !profile.active) throw new Error("FORBIDDEN");
  return { user, profile };
}

export async function signOut() {
  await sb.auth.signOut();
}

/* Rebota al inicio cuando no hay permiso (puerta de páginas privadas).
   Por defecto todo es denegado: solo el código que pasa requireOwner/
   la sesión muestra contenido. */
export function deny(reason) {
  location.replace("index.html?denied=" + encodeURIComponent(reason || "owner"));
}

export function niceErr(e) {
  const m = String((e && e.message) || e || "");
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/User already registered/i.test(m)) return "Ese correo ya está registrado. Inicia sesión.";
  if (/Password.*at least|contraseña/i.test(m)) return "La contraseña debe tener mínimo 8 caracteres.";
  if (/row-level security|policy/i.test(m)) return "Sin permiso (RLS). Si acabas de registrarte, tu cuenta está pendiente de activación.";
  return m || "Error inesperado.";
}
