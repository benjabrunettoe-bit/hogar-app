import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hogar - Finanzas familiares",
  description: "Registrá ingresos y gastos del hogar en segundos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hogar",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B6D11",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-neutral-900 antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
