"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getActiveProfile } from "@/lib/supabase/session";

type Categoria = { id: string; name: string; type: "ingreso" | "egreso"; icon: string };

export default function QuickAddModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipo, setTipo] = useState<"egreso" | "ingreso">("egreso");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("categories")
      .select("id, name, type, icon")
      .eq("type", tipo)
      .order("sort_order")
      .then(({ data }) => setCategorias(data ?? []));
  }, [open, tipo]);

  async function handleSave() {
    if (!monto || !categoriaId) return;
    setSaving(true);
    // household_id se completa solo en la base (trigger set_household_id)
    await supabase.from("transactions").insert({
      profile_name: getActiveProfile() ?? "Familia",
      category_id: categoriaId,
      type: tipo,
      amount: Number(monto),
      description: nota,
      occurred_on: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    setMonto("");
    setNota("");
    setCategoriaId("");
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-t-2xl p-5 pb-8">
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />

        <div className="flex gap-2 mb-4 bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setTipo("egreso")}
            className={`flex-1 py-2 rounded-md text-sm ${
              tipo === "egreso" ? "bg-white font-medium shadow-sm" : "text-neutral-500"
            }`}
          >
            Gasto
          </button>
          <button
            onClick={() => setTipo("ingreso")}
            className={`flex-1 py-2 rounded-md text-sm ${
              tipo === "ingreso" ? "bg-white font-medium shadow-sm" : "text-neutral-500"
            }`}
          >
            Ingreso
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                categoriaId === c.id
                  ? "bg-brand-50 border-brand-400 text-brand-800"
                  : "border-neutral-200 text-neutral-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <input
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          type="number"
          inputMode="decimal"
          placeholder="Monto"
          className="w-full border rounded-lg px-3 py-3 mb-3 text-lg font-medium"
          autoFocus
        />

        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota (opcional)"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg py-2.5 text-sm text-neutral-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !monto || !categoriaId}
            className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
