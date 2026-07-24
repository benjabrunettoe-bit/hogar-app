import { supabase } from "./client";

const PROFILE_KEY = "hogar_active_profile";

/**
 * Flujo de login sin mail:
 * 1. El usuario ingresa el código de hogar + PIN compartido (una sola vez por dispositivo).
 * 2. Se valida contra la función join_household (RPC) sin exponer el PIN real al cliente.
 * 3. Se crea una sesión anónima de Supabase y se vincula ese usuario anónimo al hogar.
 * 4. La sesión queda guardada (persistSession) -> no hay que loguearse de nuevo en ese dispositivo.
 * 5. Cada persona elige su "perfil" (nombre) al cargar un movimiento, para saber quién cargó qué.
 */
export async function joinHousehold(code: string, pin: string, profileName: string) {
  const { data: householdId, error: rpcError } = await supabase.rpc("join_household", {
    p_code: code.trim().toUpperCase(),
    p_pin: pin.trim(),
  });

  if (rpcError || !householdId) {
    throw new Error("Código o PIN incorrecto");
  }

  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError || !authData.user) {
    throw new Error("No se pudo iniciar sesión. Probá de nuevo.");
  }

  const { error: memberError } = await supabase.from("household_members").insert({
    household_id: householdId,
    user_id: authData.user.id,
    profile_name: profileName,
    avatar_initials: initials(profileName),
  });

  if (memberError) {
    throw new Error("No se pudo vincular tu perfil al hogar.");
  }

  setActiveProfile(profileName);
  return householdId;
}

export function setActiveProfile(name: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, name);
  }
}

export function getActiveProfile(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PROFILE_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
