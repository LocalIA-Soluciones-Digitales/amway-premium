import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL, PENDIENTE } from "@/data/site-config";

// Plantilla de las páginas legales: cabecera sobria y texto largo legible.
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="pt-32">
      <section className="border-b border-carbon/10 bg-linen">
        <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8 sm:py-16">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] text-carbon sm:text-5xl">{title}</h1>
          {intro && <div className="mt-5 max-w-2xl text-base leading-relaxed text-stone">{intro}</div>}
          <p className="mt-5 text-xs text-stone">Última actualización: {LEGAL.actualizado}</p>
        </div>
      </section>

      <article
        className="mx-auto max-w-3xl px-6 py-14 text-[15px] leading-relaxed text-carbon/85 sm:px-8 sm:py-16
          [&_a]:font-medium [&_a]:text-forest [&_a]:underline [&_a]:underline-offset-2
          [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-carbon first:[&_h2]:mt-0
          [&_h3]:mt-7 [&_h3]:font-medium [&_h3]:text-carbon
          [&_li]:mt-1.5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_strong]:font-medium [&_strong]:text-carbon
          [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:border-carbon/10 [&_td]:px-2 [&_td]:py-2 [&_td]:align-top
          [&_th]:border-b [&_th]:border-carbon/20 [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-carbon
          [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
      >
        {children}
      </article>
    </div>
  );
}

// Un dato del titular, o el aviso de que falta por completar.
export function Dato({ valor }: { valor: string | null }) {
  if (valor) return <>{valor}</>;
  return <span className="rounded bg-[#b4532a]/10 px-1 text-[#b4532a]">{PENDIENTE}</span>;
}

// Tabla de identificación que repiten aviso legal, privacidad y condiciones.
export function DatosTitular() {
  return (
    <ul>
      <li>
        <strong>Titular:</strong> <Dato valor={LEGAL.titular} />
      </li>
      <li>
        <strong>NIF:</strong> <Dato valor={LEGAL.nif} />
      </li>
      <li>
        <strong>Domicilio y local de recogida:</strong> <Dato valor={LEGAL.domicilio} />
      </li>
      {LEGAL.registro && (
        <li>
          <strong>Datos registrales:</strong> {LEGAL.registro}
        </li>
      )}
      <li>
        <strong>Email:</strong> {LEGAL.email}
      </li>
      <li>
        <strong>Teléfono y WhatsApp:</strong> <Dato valor={LEGAL.telefono} />
      </li>
      <li>
        <strong>Actividad:</strong> venta al por menor de productos Amway como distribuidora independiente.
      </li>
    </ul>
  );
}

export function EnlacesLegales() {
  return (
    <p className="mt-12 border-t border-carbon/10 pt-6 text-sm text-stone">
      Ver también: <Link href="/aviso-legal">Aviso legal</Link> · <Link href="/privacidad">Privacidad</Link> ·{" "}
      <Link href="/cookies">Cookies</Link> · <Link href="/condiciones">Condiciones de compra</Link> ·{" "}
      <Link href="/desistimiento">Desistir de un pedido</Link>
    </p>
  );
}
