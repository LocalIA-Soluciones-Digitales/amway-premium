import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/data/site-config";
import { EnlacesLegales, LegalPage } from "@/components/legal/LegalPage";
import { FormularioDesistimiento } from "@/components/legal/FormularioDesistimiento";

export const metadata: Metadata = {
  title: "Desistir de un pedido",
  description: "Comunica aquí que desistes de tu compra en los 14 días siguientes a la recogida.",
};

export default async function DesistimientoPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido } = await searchParams;
  return (
    <LegalPage
      eyebrow="Desistimiento"
      title="Desistir del contrato aquí"
      intro={
        <p>
          Tienes 14 días naturales desde que recoges tu pedido para desistir sin dar explicaciones. Rellena el
          formulario y te mostraremos al momento la referencia y la fecha de tu solicitud.
        </p>
      }
    >
      <FormularioDesistimiento numeroInicial={pedido?.replace(/\D/g, "").slice(0, 10) ?? ""} />
      <p>
        También puedes comunicarlo por email a <strong>{LEGAL.email}</strong>. Los productos cosméticos,
        complementos, bebidas o de higiene que se hayan desprecintado no admiten desistimiento. Todos los detalles,
        el plazo de reembolso y el formulario modelo están en las{" "}
        <Link href="/condiciones#desistimiento">condiciones de compra</Link>.
      </p>
      <EnlacesLegales />
    </LegalPage>
  );
}
