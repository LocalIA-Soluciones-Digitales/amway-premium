import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, SITE } from "@/data/site-config";
import { Dato, EnlacesLegales, LegalPage } from "@/components/legal/LegalPage";
import { conRuta } from "@/lib/seo";

export const metadata: Metadata = conRuta("/privacidad", {
  title: "Política de privacidad",
  description: `Qué datos tratamos en ${SITE.name}, para qué, con quién los compartimos y cómo ejercer tus derechos.`,
});

export default function PrivacidadPage() {
  return (
    <LegalPage
      eyebrow="Privacidad"
      title="Cómo tratamos tus datos"
      intro={
        <p>
          Pedimos los datos justos para atender tu pedido. Aquí tienes qué datos tratamos, para qué, con quién los
          compartimos, cuánto tiempo los guardamos y cómo ejercer tus derechos, según el Reglamento General de
          Protección de Datos (RGPD) y la Ley Orgánica 3/2018.
        </p>
      }
    >
      <h2>Responsable</h2>
      <p>
        <Dato valor={LEGAL.titular} /> (NIF <Dato valor={LEGAL.nif} />), con domicilio en{" "}
        <Dato valor={LEGAL.domicilio} />. Contacto para privacidad: <strong>{LEGAL.emailPrivacidad}</strong>.
      </p>

      <h2>Qué datos tratamos y para qué</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Para qué</th>
              <th>Datos</th>
              <th>Base legal</th>
              <th>Cuánto tiempo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gestionar tu pedido, la recogida y el cobro, y avisarte de cualquier cambio</td>
              <td>Nombre, teléfono, comentarios, productos, día y hora de recogida, importe; email si pagas con tarjeta o tienes cuenta</td>
              <td>Ejecución del contrato (art. 6.1.b RGPD)</td>
              <td>Mientras dure el pedido y después el tiempo de conservación obligatorio</td>
            </tr>
            <tr>
              <td>Contabilidad, facturación y obligaciones fiscales</td>
              <td>Datos del pedido e importe</td>
              <td>Obligación legal (art. 6.1.c RGPD)</td>
              <td>6 años (art. 30 del Código de Comercio)</td>
            </tr>
            <tr>
              <td>Tu cuenta de cliente (opcional): historial, repetir pedidos, avisos de reposición dentro de la cuenta</td>
              <td>Email, contraseña (cifrada), nombre, teléfono, pedidos vinculados</td>
              <td>Ejecución del contrato de cuenta que solicitas (art. 6.1.b RGPD)</td>
              <td>Hasta que la borres desde tu perfil o nos lo pidas</td>
            </tr>
            <tr>
              <td>Enviarte ofertas y novedades, solo si marcas la casilla</td>
              <td>Nombre, email o teléfono</td>
              <td>Consentimiento (art. 6.1.a RGPD y art. 21 LSSI)</td>
              <td>Hasta que lo retires (desde tu perfil o escribiéndonos)</td>
            </tr>
            <tr>
              <td>Responder a solicitudes de producto («avísame», encargos)</td>
              <td>Nombre, teléfono o email, mensaje</td>
              <td>Medidas precontractuales que pides (art. 6.1.b RGPD)</td>
              <td>12 meses desde que se atiende</td>
            </tr>
            <tr>
              <td>Publicar tu opinión</td>
              <td>Nombre que escribas, valoración y comentario</td>
              <td>Consentimiento al enviarla (art. 6.1.a RGPD)</td>
              <td>Mientras esté publicada; puedes pedir que la retiremos</td>
            </tr>
            <tr>
              <td>Atender un desistimiento o una reclamación</td>
              <td>Nº de pedido, nombre, teléfono, email, motivo</td>
              <td>Obligación legal (normativa de consumo)</td>
              <td>Mientras puedan exigirse responsabilidades (hasta 5 años)</td>
            </tr>
            <tr>
              <td>Estadísticas de uso de la web, solo si aceptas las cookies</td>
              <td>Identificador aleatorio, páginas vistas, origen de la visita, tipo de dispositivo</td>
              <td>Consentimiento (art. 22.2 LSSI)</td>
              <td>25 meses</td>
            </tr>
            <tr>
              <td>Seguridad y funcionamiento: detectar errores y frenar abusos</td>
              <td>Mensaje de error, página, navegador; IP cifrada de forma irreversible (hash) para limitar envíos repetidos</td>
              <td>Interés legítimo en mantener la web segura (art. 6.1.f RGPD)</td>
              <td>Errores 90 días; registros de límite 1 día</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        No tomamos decisiones automatizadas sobre ti ni elaboramos perfiles con efectos jurídicos. La web está
        dirigida a personas mayores de 18 años.
      </p>

      <h2>WhatsApp</h2>
      <p>
        Si eliges hablar con nosotros o enviarnos el resumen del pedido por WhatsApp, la web solo abre la
        aplicación con el mensaje escrito; eres tú quien decide enviarlo. Ese mensaje (con tu nombre, teléfono y
        productos) y la conversación pasan por WhatsApp, servicio de Meta Platforms, sujeto a su propia política
        de privacidad. Guardamos las conversaciones solo mientras sean necesarias para atender tu pedido o consulta.
        Si prefieres no usar WhatsApp, escríbenos al email.
      </p>

      <h2>Con quién compartimos datos</h2>
      <p>No vendemos ni cedemos tus datos. Los tratan, por nuestra cuenta y con contrato, estos proveedores:</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> (alojamiento de la web). Puede tratar datos en Estados Unidos; está adherida al
          Marco de Privacidad de Datos UE-EE. UU. y aplica cláusulas contractuales tipo.
        </li>
        <li>
          <strong>Supabase Inc.</strong> (base de datos y cuentas de cliente), servidores en la Unión Europea
          (Irlanda). Empresa estadounidense con cláusulas contractuales tipo.
        </li>
        <li>
          <strong>Stripe Payments Europe Ltd.</strong> (pago con tarjeta). Recibe el importe, tu email, nombre,
          teléfono y comentarios del pedido. Nosotros no vemos ni guardamos los datos de tu tarjeta.
        </li>
        <li>
          <strong>Quien nos presta el servicio de desarrollo y mantenimiento de la web</strong>, con acceso
          limitado para resolver incidencias.
        </li>
      </ul>
      <p>También podemos comunicar datos a la Administración Tributaria o a jueces y tribunales cuando la ley lo exija.</p>

      <h2>Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus
        datos, y retirar en cualquier momento el consentimiento que hayas dado, escribiendo a{" "}
        <strong>{LEGAL.emailPrivacidad}</strong> e indicando qué quieres. Te responderemos en un mes como máximo.
        Si tienes cuenta, desde tu perfil puedes cambiar tus datos, darte de baja de novedades y borrar tu cuenta.
        Los datos de pedidos que debemos conservar por ley se bloquean y solo se usan para cumplir esas
        obligaciones.
      </p>
      <p>
        Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de
        Datos (aepd.es).
      </p>

      <h2>Seguridad</h2>
      <p>
        La web usa conexión cifrada (HTTPS), los pedidos solo los ve la persona que gestiona la tienda con acceso
        protegido, y el acceso a la base de datos está restringido por permisos. Más información sobre el
        almacenamiento en tu navegador en la <Link href="/cookies">política de cookies</Link>.
      </p>

      <EnlacesLegales />
    </LegalPage>
  );
}
