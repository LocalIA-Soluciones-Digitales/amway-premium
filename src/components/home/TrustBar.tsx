const BRANDS = ["Nutrilite", "Artistry", "XS", "Amway Home", "eSpring", "Atmosphere"];

export function TrustBar() {
  const loop = [...BRANDS, ...BRANDS];
  return (
    <section className="border-y border-carbon/10 bg-cream-soft py-8">
      <div className="no-scrollbar overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-16">
          {loop.map((brand, i) => (
            <span
              key={`${brand}-${i}`}
              className="font-display text-2xl tracking-tight text-carbon/35 sm:text-3xl"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
