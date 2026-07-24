"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Mov = {
  id: string;
  amount: number;
  type: "ingreso" | "egreso";
  description: string;
  occurred_on: string;
  categories: { name: string } | null;
};

export default function CalendarioPage() {
  const [fecha, setFecha] = useState(new Date());
  const [movs, setMovs] = useState<Mov[]>([]);
  const [diaSel, setDiaSel] = useState<string | null>(null);

  const year = fecha.getFullYear();
  const month = fecha.getMonth();

  useEffect(() => {
    load();
  }, [year, month]);

  async function load() {
    const desde = new Date(year, month, 1).toISOString().slice(0, 10);
    const hasta = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, type, description, occurred_on, categories(name)")
      .gte("occurred_on", desde)
      .lte("occurred_on", hasta);
    setMovs((data as any) ?? []);
  }

  const totalesPorDia: Record<string, number> = {};
  movs.forEach((m) => {
    const key = m.occurred_on;
    totalesPorDia[key] = (totalesPorDia[key] ?? 0) + (m.type === "egreso" ? m.amount : 0);
  });

  const primerDiaSemana = (new Date(year, month, 1).getDay() + 6) % 7; // lunes=0
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const celdas = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const movsDelDia = diaSel ? movs.filter((m) => m.occurred_on === diaSel) : [];

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setFecha(new Date(year, month - 1, 1))}
          className="text-neutral-400 px-2"
        >
          ‹
        </button>
        <h1 className="text-lg font-medium">
          {fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </h1>
        <button
          onClick={() => setFecha(new Date(year, month + 1, 1))}
          className="text-neutral-400 px-2"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400 mb-1">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {celdas.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = new Date(year, month, d).toISOString().slice(0, 10);
          const tieneGasto = !!totalesPorDia[key];
          const isSel = diaSel === key;
          return (
            <button
              key={i}
              onClick={() => setDiaSel(key)}
              className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center ${
                isSel ? "border border-brand-400 bg-brand-50" : "bg-neutral-50"
              }`}
            >
              <span className="font-medium">{d}</span>
              {tieneGasto && <span className="w-1 h-1 rounded-full bg-neutral-400 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {diaSel && (
        <div>
          <p className="text-sm font-medium mb-2">
            {new Date(diaSel).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
          </p>
          {movsDelDia.length === 0 && (
            <p className="text-sm text-neutral-400">Sin movimientos ese día.</p>
          )}
          <div className="flex flex-col gap-2">
            {movsDelDia.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{m.description || m.categories?.name}</p>
                  <p className="text-xs text-neutral-500">{m.categories?.name}</p>
                </div>
                <span className={`text-sm font-medium ${m.type === "ingreso" ? "text-brand-600" : ""}`}>
                  {m.type === "ingreso" ? "+" : "-"}
                  {m.amount.toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
