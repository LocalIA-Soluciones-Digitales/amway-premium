"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCliente } from "./ClienteProvider";

export function CuentaButton({ dark }: { dark: boolean }) {
  const { session, perfil } = useCliente();
  const inicial = (perfil?.nombre || session?.user.email || "").trim().charAt(0).toUpperCase();
  const label = session ? "Mi cuenta" : "Entrar o crear cuenta";

  return (
    <Link
      href="/cuenta"
      aria-label={label}
      title={label}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition",
        session
          ? dark
            ? "border-cream bg-cream text-carbon"
            : "border-carbon bg-carbon text-cream"
          : dark
            ? "border-cream/30 text-cream hover:bg-cream/10"
            : "border-carbon/15 text-carbon hover:bg-carbon/5"
      )}
    >
      {session && inicial ? inicial : <UserRound size={18} />}
    </Link>
  );
}
