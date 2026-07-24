"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORES = ["#3B6D11", "#639922", "#97C459", "#C0DD97", "#0F6E56", "#5DCAA5", "#994", "#888"];

type Row = { amount: number; type: string; categories: { name: string } | null };

export default function ResumenPage() {
  const [escala, setEscala] = useState<"mes" | "anio">("mes");
  const [rows, setRows] = useState<Row[]>([]);
  const [ingresos, setIngresos] = useState(0);
  const [egresos, setEgresos] = useState(0);

  useEffect(() => {
    load();
  }, [escala]);

  async function load() {
    const now = new Date();
    const desde =
      escala === "mes"
        ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
        : new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

    const { data } = await supabase
      .from("transactions")
      .select("amount, type, categories(name)")
      .gte("occurred_on", desde);

    const list = (data as any as Row[]) ?? [];
    setRows(list);
    setIngresos(list.filter((r) => r.type === "ingreso").reduce((a, r) => a + r.amount, 0));
    setEgresos(list.filter((r) => r.type === "egreso").reduce((a, r) => a + r.amount, 0));
  }

  const porCategoria: Record<string, number> = {};
  rows
    .filter((r) => r.type === "egreso")
    .forEach((r) => {
      const nombre = r.categories?.name ?? "Otros";
      porCategoria[nombre] = (porCategoria[nombre] ?? 0) + r.amount;
    });
  const dataPie = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

  return (
    <div className="px-5 pt-6">
      <div className="flex bg-neutral-100 rounded-lg p-1 mb-5 w-fit">
        {(["mes", "anio"] as const).map((e) => (
          <button
            key={e}
            onClick={() => setEscala(e)}
            className={`px-4 py-1.5 rounded-md text-sm capitalize ${
              escala === e ? "bg-white font-medium shadow-sm" : "text-neutral-500"
            }`}
          >
            {e === "mes" ? "Mes" : "Año"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-neutral-50 rounded-xl p-3">
          <p className="text-xs text-neutral-500 mb-1">Ingresos</p>
          <p className="text-lg font-medium text-brand-600">
            {ingresos.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
          </p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-3">
          <p className="text-xs text-neutral-500 mb-1">Egresos</p>
          <p className="text-lg font-medium">
            {egresos.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
          </p>
        </div>
      </div>

      {dataPie.length > 0 ? (
        <div style={{ width: "100%", height: 240 }} className="mb-4">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dataPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {dataPie.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString("es-AR")} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-neutral-400 mb-4">Todavía no hay datos para este período.</p>
      )}

      <div className="flex flex-col gap-2">
        {dataPie
          .sort((a, b) => b.value - a.value)
          .map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORES[i % COLORES.length] }}
                />
                <span>{c.name}</span>
              </div>
              <span className="text-neutral-500">{c.value.toLocaleString("es-AR")}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
