import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { SITE, waLink, WA_PRESETS } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con Amway Barakaldo por WhatsApp o formulario. Atención personalizada en Barakaldo, Bizkaia, y envíos a toda España.",
};

export default function ContactoPage() {
  return (
    <div className="pt-32">
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-wellness">Contacto</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl text-paper sm:text-5xl">
          Hablemos de tu bienestar.
        </h1>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-white/8 bg-graphite/30 p-6 transition hover:border-wellness/40"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wellness/15 text-wellness">
                <MessageCircle size={22} />
              </span>
              <div>
                <p className="font-display text-lg text-paper">WhatsApp</p>
                <p className="text-sm text-mist">+{SITE.whatsapp}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-graphite/30 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tech/15 text-tech">
                <Mail size={22} />
              </span>
              <div>
                <p className="font-display text-lg text-paper">Email</p>
                <p className="text-sm text-mist">{SITE.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-graphite/30 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <MapPin size={22} />
              </span>
              <div>
                <p className="font-display text-lg text-paper">Ubicación</p>
                <p className="text-sm text-mist">
                  {SITE.city}, {SITE.region}, {SITE.country}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-graphite/30 p-7 sm:p-9">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
