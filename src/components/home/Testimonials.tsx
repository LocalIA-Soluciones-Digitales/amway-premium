"use client";

import { motion } from "framer-motion";

const QUOTES = [
  {
    quote:
      "Comencé a tomar Enfoque y energía XS cuando se lanzó por primera vez y nunca lo dejé. Siento que tengo al menos 3 horas más de productividad en mi día.",
    author: "Kristin G.",
    role: "IBO",
  },
  {
    quote:
      "He probado muchos suplementos de aminoácidos a lo largo de los años; XS Muscle Multiplier es ahora mi favorito. Gracias por un producto increíble.",
    author: "Mike N.",
    role: "Cliente",
  },
  {
    quote:
      "Realmente es el mejor batido de proteína que he probado. Tan suave y sabroso, ¡y bien nutritivo! Los compraré todo el tiempo.",
    author: "Notnels",
    role: "Cliente",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-sm font-medium uppercase tracking-[0.2em] text-tech"
      >
        Lo que dicen los clientes
      </motion.p>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {QUOTES.map((q, i) => (
          <motion.blockquote
            key={q.author}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="rounded-2xl border border-white/8 bg-graphite/30 p-7"
          >
            <p className="font-display text-lg leading-snug text-paper">&ldquo;{q.quote}&rdquo;</p>
            <footer className="mt-5 text-sm text-mist">
              {q.author} · {q.role}
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
