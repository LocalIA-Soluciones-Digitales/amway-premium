import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/data/site-config";
import { DatosTitular, EnlacesLegales, LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: `Quién está detrás de ${SITE.name}, cómo contactar y condiciones de uso de la web.`,
};

export default function AvisoLegalPage() {
  return (
    <LegalPage
      eyebrow="Aviso legal"
      title="Quién está detrás de esta tienda"
      intro={
        <p>
          Información que exige el artículo 10 de la Ley 34/2002 de servicios de la sociedad de la información y de
          comercio electrónico (LSSI).
        </p>
      }
    >
      <h2>Titular de la web</h2>
      <DatosTitular />

      <h2>Distribución independiente</h2>
      <p>
        {SITE.name} es un negocio de distribución independiente de productos Amway. <strong>No es una tienda
        oficial de Amway</strong> ni actúa en su nombre. Amway™, Nutrilite™, Artistry™, XS™, eSpring™,
        Atmosphere™, iCook™, Satinique™, Glister™, BodyKey™ y el resto de marcas citadas pertenecen a sus
        titulares y se usan solo para identificar los productos que vendemos.
      </p>

      <h2>Qué ofrece la web</h2>
      <p>
        Catálogo de productos con precio, pedido online con recogida en nuestro local y pago con tarjeta (a través
        de Stripe) o en efectivo al recoger. No hacemos envíos a domicilio. Las condiciones de cada compra están en{" "}
        <Link href="/condiciones">Condiciones de compra</Link>.
      </p>

      <h2>Uso de la web</h2>
      <p>
        Puedes navegar sin registrarte. Al usar la web te comprometes a no introducir datos de otras personas sin
        su permiso, ni pedidos u opiniones falsos, ni a intentar acceder a zonas restringidas como el panel de
        gestión. Podemos retirar opiniones o anular pedidos que incumplan estas normas.
      </p>

      <h2>Contenidos y propiedad intelectual</h2>
      <p>
        Los textos propios, el diseño y las fotos del local son de {SITE.name}. Las fotografías de producto, los
        nombres y las descripciones técnicas proceden del fabricante y pertenecen a sus titulares. No está
        permitido copiarlos para otros fines.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        Revisamos que precios y disponibilidad estén al día. Si detectas un error, escríbenos y lo corregimos; si
        afecta a un pedido ya hecho te avisaremos antes de cobrarlo o entregarlo. La información de los productos
        no sustituye el consejo de un profesional sanitario. Los enlaces a otras webs (WhatsApp, Stripe, Google
        Calendar) llevan a servicios de terceros con sus propias condiciones.
      </p>

      <h2>Reclamaciones</h2>
      <p>
        Puedes escribirnos al email indicado arriba o por WhatsApp; respondemos en el plazo más breve posible y
        como máximo en un mes. Si no quedas satisfecho/a, puedes acudir a los servicios de consumo de tu
        localidad (en Euskadi, Kontsumobide).
      </p>

      <h2>Ley aplicable</h2>
      <p>
        Esta web se rige por la legislación española. Si eres consumidor/a, puedes reclamar ante los tribunales
        de tu domicilio.
      </p>

      <EnlacesLegales />
    </LegalPage>
  );
}
