"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/supabase/session";
import BottomNav from "@/components/BottomNav";
import QuickAddModal from "@/components/QuickAddModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    isLoggedIn().then((logged) => {
      if (!logged) router.replace("/login");
      else setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div key={refreshKey}>{children}</div>

      <button
        onClick={() => setAddOpen(true)}
        aria-label="Cargar movimiento"
        className="fixed right-5 bottom-20 w-14 h-14 rounded-full bg-brand-600 text-white text-2xl shadow-lg flex items-center justify-center"
      >
        +
      </button>

      <QuickAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      <BottomNav />
    </div>
  );
}
