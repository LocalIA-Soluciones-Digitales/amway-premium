# Assets pendientes

La mayoría de la fotografía editorial del rediseño se curó a partir de los catálogos oficiales Amway 2026 (`public/images/editorial/`) y de la fototeca de producto oficial (`public/images/products/`). Esto es lo que sigue pendiente y no debe rellenarse con una imagen incorrecta mientras tanto:

## 1. Foto real de la distribuidora — sección "Sobre la vendedora"

- **Dónde se usa:** `src/components/home/AboutSeller.tsx` (home) y `src/app/sobre-nosotros/page.tsx`.
- **Archivo esperado:** `public/images/editorial/sobre-nosotros.webp`
- **Dimensiones:** vertical, mínimo 1200×1500px (ratio ~4:5).
- **Contenido recomendado:** retrato real, cercano y natural (no de estudio corporativo) de la persona que atiende Amway Barakaldo — luz natural, sin texto superpuesto.
- **Estado actual:** se usa un marco de placeholder claramente identificado como tal (borde discontinuo + etiqueta "Añade tu fotografía aquí"), nunca una foto de stock haciéndose pasar por la persona real.

## 2. Vídeo de hero — `src/components/home/Hero.tsx`

- **Dónde se usaría:** capa de vídeo opcional detrás de la fotografía actual del hero de la home.
- **Archivo esperado:** `public/videos/hero-bienestar.mp4` (+ `.webm` opcional).
- **Specs:** 8–15 s, 1920×1080 o superior, sin audio (se reproduce `muted loop autoplay playsInline`), tamaño optimizado (<8 MB ideal), con una imagen de `poster` igual al frame inicial.
- **Contenido recomendado:** lifestyle/bienestar cotidiano (luz natural, ritmo pausado).
- **Estado actual:** sigue sin existir un vídeo de marca aprovechable para esta sección concreta. La sección funciona perfectamente solo con fotografía y acepta un vídeo de fondo sin cambios estructurales el día que exista.

## 3. [RESUELTO] Latas y fotografía XS™ Power Drink / Power Water+ — apartado de Bebidas Energéticas

El propietario del sitio proporcionó material oficial de Amway (fotografía de producto en alta resolución, el vídeo de lanzamiento y el dossier de lanzamiento en PDF/PPTX de `XS™ Power Water+` y `XS™ Power Drink`, mercado UE, `250 ml`). A partir de ahí:

- **Latas reales (6 sabores, cutouts con transparencia real, recortadas de la fotografía oficial):** `public/images/xs-energy/cans/*.webp` — Lemon Peach (Power Water+), Ginger Passion Fruit (Power Drink+), Orange Kumquat Blast, Pink Grapefruit Blast, Wild Berry Blast, Tropical Blast. Nombres, sabores y beneficios verificados contra el dossier oficial en `src/data/energy-drinks.ts` — nada inventado.
- **Fotografía lifestyle real (9 fotos, mercado UE):** `public/images/xs-energy/lifestyle/*.webp`, usada como fondo del hero y de cada capítulo de la historia de scroll.
- **Vídeo de lanzamiento oficial con subtítulos en español:** `public/videos/xs-energy-launch.mp4` (comprimido a ~6 MB para web) + `public/images/xs-energy/video-poster.webp`, usado en `EnergyVideoMoment.tsx` como momento reproducible bajo demanda (no autoplay, por rendimiento).
- **Insignia de aniversario:** `public/images/xs-energy/badge-20-years.webp` (recorte transparente del propio dossier).

Esto sustituye por completo a las 8 latas de baja resolución de `public/images/catalog/p089_*.webp` que se usaban antes en esta sección (esas imágenes pertenecen a otra línea de producto — la gama estadounidense — y ya no se referencian desde `/xs-energy`; el catálogo de nutrición deportiva más abajo en la misma página no se ha tocado y sigue usándolas donde corresponde).

## 4. Número de WhatsApp de producción

No es un asset visual, pero queda anotado aquí porque bloquea el lanzamiento real: `SITE.whatsapp` en `src/data/site-config.ts` sigue siendo el número de pruebas indicado por el propietario del sitio. Sustituir por el número definitivo del negocio antes de publicar.
