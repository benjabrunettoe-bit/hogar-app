"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Categoria = { id: string; name: string; type: "ingreso" | "egreso" };
type Fijo = {
  id: string;
  name: string;
  estimated_amount: number;
  day_of_month: number;
  type: "ingreso" | "egreso";
  active: boolean;
  category_id: string;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fijos, setFijos] = useState<Fijo[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<"ingreso" | "egreso">("egreso");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: cats } = await supabase.from("categories").select("id, name, type").order("sort_order");
    setCategorias(cats ?? []);
    const { data: fj } = await supabase.from("fixed_items").select("*").order("day_of_month");
    setFijos(fj ?? []);
  }

  async function agregarCategoria() {
    if (!nuevoNombre.trim()) return;
    await supabase.from("categories").insert({ name: nuevoNombre.trim(), type: nuevoTipo });
    setNuevoNombre("");
    load();
  }

  async function toggleFijo(id: string, active: boolean) {
    await supabase.from("fixed_items").update({ active: !active }).eq("id", id);
    load();
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-medium mb-4">Categorías</h1>

      <div className="flex flex-col gap-2 mb-6">
        {categorias.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-4 py-3"
          >
            <span className="text-sm">{c.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                c.type === "ingreso" ? "bg-brand-50 text-brand-800" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {c.type}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-8">
        <select
          value={nuevoTipo}
          onChange={(e) => setNuevoTipo(e.target.value as any)}
          className="border rounded-lg px-2 text-sm"
        >
          <option value="egreso">Egreso</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nueva categoría"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={agregarCategoria}
          className="bg-brand-600 text-white rounded-lg px-4 text-sm font-medium"
        >
          Agregar
        </button>
      </div>

      <h2 className="text-lg font-medium mb-1">Fijos recurrentes</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Se generan solos cada mes en la fecha indicada. Vos solo confirmás el monto real.
      </p>

      <div className="flex flex-col gap-2">
        {fijos.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{f.name}</p>
              <p className="text-xs text-neutral-500">
                Día {f.day_of_month} · {f.estimated_amount.toLocaleString("es-AR")}
              </p>
            </div>
            <button
              onClick={() => toggleFijo(f.id, f.active)}
              className={`text-xs px-3 py-1 rounded-full ${
                f.active ? "bg-brand-50 text-brand-800" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {f.active ? "Activo" : "Pausado"}
            </button>
          </div>
        ))}
        {fijos.length === 0 && (
          <p className="text-sm text-neutral-400">
            Todavía no cargaste fijos. Se agregan directo en Supabase por ahora (ver README) —
            en una próxima vuelta le sumamos el formulario acá.
          </p>
        )}
      </div>
    </div>
  );
}
