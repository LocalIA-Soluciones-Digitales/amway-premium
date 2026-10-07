import type { Metadata } from "next";
import { SITE } from "@/data/site-config";
import { EnlacesLegales, LegalPage } from "@/components/legal/LegalPage";
import { ConfigurarCookies } from "@/components/legal/ConfigurarCookies";
import { conRuta } from "@/lib/seo";

export const metadata: Metadata = conRuta("/cookies", {
  title: "Política de cookies",
  description: `Qué guarda ${SITE.name} en tu navegador y cómo cambiar tu elección.`,
});

const TECNICAS: [string, string, string][] = [
  ["amway_premium_cesta_v1", "Los productos de tu cesta", "Hasta que vacíes la cesta o borres los datos del navegador"],
  ["amway_premium_cookies", "Tu elección sobre las cookies y su fecha", "24 meses; después te volvemos a preguntar"],
  ["amway_premium_contacto_v1", "Nombre y teléfono del último pedido, para no tener que escribirlos otra vez", "Hasta que lo borres (en la cesta o en el navegador)"],
  ["amway_asistente", "La conversación con el asistente mientras navegas", "Se borra al cerrar la pestaña"],
  ["amway-premium-cliente-auth", "Tu sesión si entras en tu cuenta", "Hasta que cierres sesión"],
];

const ANALITICA: [string, string, string][] = [
  ["amway_premium_visitor", "Saber si ya nos habías visitado (identificador aleatorio)", "Hasta que rechaces las cookies o borres el navegador"],
  ["amway_premium_session", "Agrupar las páginas de una misma visita", "Se borra al cerrar la pestaña"],
  ["amway_premium_source", "De dónde llegaste (buscador, red social, campaña)", "Se borra al cerrar la pestaña"],
  ["amway_premium_returning", "Recordar durante la visita si eres visitante recurrente", "Se borra al cerrar la pestaña"],
];

function Tabla({ filas }: { filas: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Para qué</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([n, f, d]) => (
            <tr key={n}>
              <td className="font-mono text-xs">{n}</td>
              <td>{f}</td>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Qué guardamos en tu navegador"
      intro={
        <p>
          No usamos cookies de publicidad ni de terceros (ni Google Analytics ni píxeles de redes sociales). Solo
          guardamos en tu navegador lo necesario para que la tienda funcione y, si lo aceptas, unas estadísticas
          propias de uso.
        </p>
      }
    >
      <p>
        Técnicamente no son cookies sino almacenamiento local del navegador (localStorage y sessionStorage), pero
        la ley las trata igual (art. 22.2 de la LSSI), así que te pedimos permiso para las que no son
        imprescindibles.
      </p>

      <h2>Imprescindibles (no necesitan tu permiso)</h2>
      <p>Son propias y sirven para darte lo que pides: la cesta, tu sesión y recordar tu elección.</p>
      <Tabla filas={TECNICAS} />

      <h2>Estadísticas (solo si aceptas)</h2>
      <p>
        Son propias. Nos dicen qué páginas y productos interesan más para mejorar la tienda. Los datos se guardan
        en nuestra base de datos, alojada por Supabase en la Unión Europea, y solo los ve quien mantiene la web. No
        incluyen tu nombre, email ni teléfono.
      </p>
      <Tabla filas={ANALITICA} />

      <h2>Cambiar o retirar tu elección</h2>
      <p>
        Puedes cambiar de opinión cuando quieras. Si rechazas, borramos los identificadores de estadísticas de tu
        navegador y dejamos de contar tus visitas.
      </p>
      <p>
        <ConfigurarCookies className="mt-2 inline-flex rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft" />
      </p>
      <p>
        También puedes borrar estos datos desde la configuración de tu navegador (en «Privacidad» o «Datos de
        sitios»).
      </p>

      <EnlacesLegales />
    </LegalPage>
  );
}
