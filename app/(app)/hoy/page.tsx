"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Mov = {
  id: string;
  amount: number;
  type: "ingreso" | "egreso";
  description: string;
  profile_name: string;
  categories: { name: string; icon: string } | null;
};

export default function HoyPage() {
  const [movs, setMovs] = useState<Mov[]>([]);
  const [loading, setLoading] = useState(true);
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, type, description, profile_name, categories(name, icon)")
      .eq("occurred_on", hoy)
      .order("created_at", { ascending: false });
    setMovs((data as any) ?? []);
    setLoading(false);
  }

  const totalDia = movs.reduce(
    (acc, m) => acc + (m.type === "ingreso" ? m.amount : -m.amount),
    0
  );

  return (
    <div className="px-5 pt-6">
      <p className="text-sm text-neutral-500">Hoy</p>
      <h1 className="text-xl font-medium mb-4">
        {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
      </h1>

      <div className="bg-neutral-50 rounded-xl p-4 mb-5">
        <p className="text-xs text-neutral-500 mb-1">Balance del día</p>
        <p className={`text-2xl font-medium ${totalDia >= 0 ? "text-brand-600" : "text-neutral-900"}`}>
          {totalDia >= 0 ? "+" : ""}
          {totalDia.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
        </p>
      </div>

      {loading && <p className="text-sm text-neutral-400">Cargando...</p>}

      {!loading && movs.length === 0 && (
        <p className="text-sm text-neutral-400">
          Todavía no cargaste nada hoy. Tocá el + para empezar.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {movs.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{m.description || m.categories?.name}</p>
              <p className="text-xs text-neutral-500">
                {m.categories?.name} · {m.profile_name}
              </p>
            </div>
            <span className={`text-sm font-medium ${m.type === "ingreso" ? "text-brand-600" : ""}`}>
              {m.type === "ingreso" ? "+" : "-"}
              {m.amount.toLocaleString("es-AR")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
