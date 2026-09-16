import Link from "next/link";
import { waLink, WA_PRESETS } from "@/data/site-config";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 pt-24 text-center sm:px-8">
      <p className="font-display text-8xl text-gold sm:text-9xl">404</p>
      <h1 className="mt-6 font-display text-2xl text-paper sm:text-3xl">
        Esta página se ha quedado sin stock.
      </h1>
      <p className="mt-4 max-w-md text-mist">
        No encontramos lo que buscabas, pero seguro que tenemos algo que te va a encantar en
        nuestro catálogo.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <Link
          href="/catalogo"
          className="rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-obsidian transition hover:bg-white"
        >
          Ver catálogo
        </Link>
        <a
          href={waLink(WA_PRESETS.general)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-paper transition hover:border-wellness/50 hover:bg-wellness/10"
        >
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
