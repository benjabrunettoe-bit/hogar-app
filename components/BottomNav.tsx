"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/hoy", label: "Hoy", icon: "🏠" },
  { href: "/calendario", label: "Calendario", icon: "📅" },
  { href: "/resumen", label: "Resumen", icon: "📊" },
  { href: "/categorias", label: "Categorías", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 ${
              active ? "text-brand-600" : "text-neutral-400"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
