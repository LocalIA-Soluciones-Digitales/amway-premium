import Link from "next/link";
import { LEGAL, SITE } from "@/data/site-config";
import { cn } from "@/lib/utils";

// Primera capa de información (art. 13 RGPD) junto a cada formulario que
// recoge datos personales. El detalle está en /privacidad.
export function AvisoPrivacidad({ finalidad, extra, className }: { finalidad: string; extra?: string; className?: string }) {
  return (
    <p className={cn("text-[11px] leading-relaxed text-stone", className)}>
      Responsable: {LEGAL.titular ?? SITE.name}. Usamos tus datos para {finalidad}.{extra ? ` ${extra}` : ""} No los
      cedemos a terceros salvo a los proveedores que nos prestan el servicio. Puedes acceder, rectificar o
      suprimirlos y ejercer otros derechos.{" "}
      <Link href="/privacidad" className="underline underline-offset-2 hover:text-carbon">
        Más información
      </Link>
      .
    </p>
  );
}
