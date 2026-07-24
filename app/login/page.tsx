"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinHousehold } from "@/lib/supabase/session";

const PERFILES_SUGERIDOS = ["Papá", "Mamá", "Vos", "Hermano/a"];

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code || !pin || !profileName) {
      setError("Completá los tres campos.");
      return;
    }
    setLoading(true);
    try {
      await joinHousehold(code, pin, profileName);
      router.push("/hoy");
    } catch (err: any) {
      setError(err.message ?? "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
            <span className="text-brand-800 text-sm font-medium">H</span>
          </div>
          <span className="text-lg font-medium">Hogar</span>
        </div>

        <h1 className="text-xl font-medium mb-1">Entrar al hogar</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Pedile el código y el PIN a quien creó el hogar en la app.
        </p>

        <label className="block text-sm mb-1 text-neutral-600">Código de hogar</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="FAMILIA-MOLINA"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        <label className="block text-sm mb-1 text-neutral-600">PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          type="password"
          inputMode="numeric"
          placeholder="••••"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        <label className="block text-sm mb-1 text-neutral-600">¿Quién sos?</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PERFILES_SUGERIDOS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setProfileName(p)}
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                profileName === p
                  ? "bg-brand-50 border-brand-400 text-brand-800"
                  : "border-neutral-200 text-neutral-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="O escribí tu nombre"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
