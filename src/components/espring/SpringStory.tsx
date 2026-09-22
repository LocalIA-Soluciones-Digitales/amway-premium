"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SPRING_STORY, SPRING_STORY_SOURCES } from "@/data/espring-content";

export function SpringStory() {
  return (
    <section className="bg-cream-soft py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-tech">
            Por qué importa
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
            Lo último en lo que deberías preocuparte es si tu agua es segura.
          </h2>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {SPRING_STORY.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(28,26,22,0.06)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl text-carbon">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone">{item.copy}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-xs text-stone-soft">{SPRING_STORY_SOURCES}</p>
      </div>
    </section>
  );
}
