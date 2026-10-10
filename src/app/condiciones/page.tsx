import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, SITE } from "@/data/site-config";
import { Dato, DatosTitular, EnlacesLegales, LegalPage } from "@/components/legal/LegalPage";
import { conRuta } from "@/lib/seo";

export const metadata: Metadata = conRuta("/condiciones", {
  title: "Condiciones de compra",
  description: `Cómo comprar en ${SITE.name}: precios, pago, recogida, desistimiento, devoluciones y garantía.`,
});

export default function CondicionesPage() {
  return (
    <LegalPage
      eyebrow="Condiciones de compra"
      title="Cómo funciona tu compra"
      intro={
        <p>
          Estas condiciones se aplican a los pedidos hechos en esta web. Te las enseñamos antes de pedir y puedes
          guardarlas o imprimirlas desde el navegador.
        </p>
      }
    >
      <h2>Quién te vende</h2>
      <DatosTitular />
      <p>
        Somos una distribuidora independiente de productos Amway, no una tienda oficial de Amway. Vendemos a
        personas mayores de 18 años.
      </p>

      <h2>Productos y precios</h2>
      <ul>
        <li>Cada ficha indica el producto, su formato y su precio final en euros, con IVA incluido.</li>
        <li>No hay gastos de envío ni otros cargos: todos los pedidos se recogen en nuestro local.</li>
        <li>
          La información de etiquetado (ingredientes, alérgenos, modo de uso y advertencias) es la del envase. Si
          necesitas consultarla antes de comprar y no aparece en la ficha, pídenosla y te enviamos la foto de la
          etiqueta.
        </li>
        <li>
          Los complementos alimenticios no deben usarse como sustituto de una dieta equilibrada y un estilo de vida
          saludable. No superes la dosis diaria recomendada y mantenlos fuera del alcance de los niños.
        </li>
      </ul>

      <h2>Cómo se hace el pedido</h2>
      <ol>
        <li>Añade productos a la cesta.</li>
        <li>Elige el día y la hora de recogida, la forma de pago y escribe tu nombre y teléfono.</li>
        <li>
          Revisa el resumen y pulsa{" "}
          {SITE.pagoOnline && (
            <>
              <strong>«Pagar … con tarjeta»</strong> o{" "}
            </>
          )}
          <strong>«Hacer pedido · pago al recoger»</strong>. Ese botón confirma la compra y supone la obligación de pagarla.
        </li>
        <li>
          Te mostramos el número de pedido en pantalla.
          {SITE.pagoOnline && " Con tarjeta, Stripe te envía también el justificante del pago."} Si quieres, puedes enviarnos el resumen por WhatsApp, pero no es necesario para que el pedido sea
          válido.
        </li>
      </ol>
      <p>
        Si te equivocas al introducir un dato, puedes corregirlo antes de confirmar volviendo a la cesta. Los
        pedidos se guardan en nuestro sistema y puedes consultarlos con tu número de pedido y teléfono, o en tu
        cuenta si te registras. El contrato se celebra en castellano.
      </p>

      <h2>Pago</h2>
      <ul>
        {SITE.pagoOnline && (
          <li>
            <strong>Tarjeta</strong> (y otros métodos que ofrezca la pasarela, como Apple Pay o Google Pay): pago en
            el momento a través de Stripe. No vemos ni guardamos los datos de tu tarjeta.
          </li>
        )}
        <li>
          <strong>Efectivo</strong>: pagas al recoger. El pedido queda reservado para el día y la hora elegidos.
        </li>
      </ul>

      <h2>Recogida</h2>
      <p>
        Recoges el pedido en nuestro local: <Dato valor={LEGAL.domicilio} />, {SITE.horario.texto}, el día y la
        hora que elijas (hasta 60 días después). Si no puedes ir, avísanos y lo cambiamos. Si algún
        producto se agota después de tu pedido, te avisamos y puedes esperar, cambiarlo o anularlo con el
        reembolso de lo pagado.
      </p>

      <h2 id="desistimiento">Derecho de desistimiento (14 días)</h2>
      <p>
        Como compras a distancia, tienes derecho a desistir del contrato en un plazo de <strong>14 días naturales
        desde el día en que recoges los productos</strong>, sin dar explicaciones (arts. 102 a 108 del Texto
        Refundido de la Ley General para la Defensa de los Consumidores y Usuarios).
      </p>
      <h3>Cómo hacerlo</h3>
      <ul>
        <li>
          Desde la página <Link href="/desistimiento">Desistir de un pedido</Link>, con tu número de pedido y tu
          teléfono. Te mostramos al momento la referencia y la fecha de tu solicitud.
        </li>
        <li>
          O enviándonos una declaración clara a <strong>{LEGAL.email}</strong>, por ejemplo con el formulario de
          abajo (no es obligatorio usarlo).
        </li>
      </ul>
      <h3>Devolución de los productos y reembolso</h3>
      <ul>
        <li>
          Trae los productos al local en un plazo máximo de 14 días desde que nos comuniques tu decisión. Como la
          entrega fue en el local, no tienes coste de devolución salvo el de tu desplazamiento.
        </li>
        <li>
          Te devolvemos todo lo pagado en un plazo máximo de 14 días desde que nos comunicas el desistimiento,
          por el mismo medio de pago (tarjeta al mismo método; efectivo en efectivo o por transferencia), sin
          ningún coste. Podemos esperar a recibir los productos antes de reembolsar.
        </li>
        <li>
          Solo respondes de la pérdida de valor de los productos por una manipulación distinta a la necesaria para
          comprobar su naturaleza y características.
        </li>
      </ul>
      <h3>Excepciones</h3>
      <p>
        No se puede desistir de los productos precintados que no sean aptos para ser devueltos por razones de
        protección de la salud o de higiene <strong>una vez desprecintados</strong> (por ejemplo cosméticos,
        complementos alimenticios, bebidas o productos de higiene personal que se hayan abierto), ni de productos
        que por su naturaleza se deterioren con rapidez (art. 103 TRLGDCU). Mientras sigan cerrados, sí puedes
        desistir.
      </p>
      <h3>Formulario de desistimiento</h3>
      <div className="mt-3 rounded-2xl border border-carbon/10 bg-white/70 p-5 text-sm">
        <p className="!mt-0">
          A la atención de <Dato valor={LEGAL.titular} />, <Dato valor={LEGAL.domicilio} />, {LEGAL.email}:
        </p>
        <p>
          Por la presente le comunico que desisto de mi contrato de venta del siguiente bien: [producto y nº de
          pedido]
        </p>
        <p>Pedido el / recibido el: [fechas]</p>
        <p>Nombre del consumidor: [nombre]</p>
        <p>Domicilio del consumidor: [domicilio]</p>
        <p>Firma (solo si se envía en papel) y fecha: [fecha]</p>
      </div>

      <h2>Garantía</h2>
      <p>
        Todos los productos tienen la <strong>garantía legal de conformidad</strong>: si un producto no es
        conforme con lo comprado (defectuoso, no corresponde con la descripción o le falta algo), respondemos
        nosotros durante <strong>3 años desde la entrega</strong> (arts. 114 y siguientes del TRLGDCU). Puedes
        elegir que lo reparemos o te lo cambiemos y, si no es posible, una rebaja del precio o la devolución del
        dinero. Para productos con fecha de consumo preferente, la conformidad se valora dentro de esa fecha.
      </p>
      <p>
        Además, el fabricante puede ofrecer sus propias garantías comerciales en las condiciones que publica; no
        sustituyen ni limitan la garantía legal. Para cualquier problema con un producto, escríbenos y lo
        gestionamos nosotros.
      </p>

      <h2>Atención al cliente y reclamaciones</h2>
      <p>
        Escríbenos a {LEGAL.email} o por WhatsApp, {SITE.horario.texto}. Respondemos lo antes posible y como
        máximo en un mes. Si no quedas satisfecho/a, puedes acudir a los servicios de consumo (en Euskadi,
        Kontsumobide) o a los tribunales de tu domicilio.
      </p>

      <EnlacesLegales />
    </LegalPage>
  );
}
