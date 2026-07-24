"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/supabase/session";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    isLoggedIn().then((logged) => {
      router.replace(logged ? "/hoy" : "/login");
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-neutral-400">Cargando...</p>
    </div>
  );
}
