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
      <section className="border-b border-carbon/10 bg-linen">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">Contacto</p>
          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] text-carbon sm:text-6xl">
            Hablemos de tu bienestar.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col divide-y divide-carbon/10 border-t border-carbon/10">
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 py-6 transition hover:opacity-70"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest">
                <MessageCircle size={22} />
              </span>
              <div>
                <p className="font-display text-lg text-carbon">WhatsApp</p>
                <p className="text-sm text-stone">+{SITE.whatsapp}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 py-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tech/10 text-tech">
                <Mail size={22} />
              </span>
              <div>
                <p className="font-display text-lg text-carbon">Email</p>
                <p className="text-sm text-stone">{SITE.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                <MapPin size={22} />
              </span>
              <div>
                <p className="font-display text-lg text-carbon">Ubicación</p>
                <p className="text-sm text-stone">
                  {SITE.city}, {SITE.region}, {SITE.country}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-linen p-7 sm:p-9">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
