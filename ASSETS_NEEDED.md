# Assets pendientes

La mayoría de la fotografía editorial del rediseño se curó a partir de los catálogos oficiales Amway 2026 (`public/images/editorial/`) y de la fototeca de producto oficial (`public/images/products/`). Esto es lo que sigue pendiente y no debe rellenarse con una imagen incorrecta mientras tanto:

## 1. Foto real de la distribuidora — sección "Sobre la vendedora"

- **Dónde se usa:** `src/components/home/AboutSeller.tsx` (home) y `src/app/sobre-nosotros/page.tsx`.
- **Archivo esperado:** `public/images/editorial/sobre-nosotros.webp`
- **Dimensiones:** vertical, mínimo 1200×1500px (ratio ~4:5).
- **Contenido recomendado:** retrato real, cercano y natural (no de estudio corporativo) de la persona que atiende Amway Barakaldo — luz natural, sin texto superpuesto.
- **Estado actual:** se usa un marco de placeholder claramente identificado como tal (borde discontinuo + etiqueta "Añade tu fotografía aquí"), nunca una foto de stock haciéndose pasar por la persona real.

## 2. Vídeo de hero / "XS Energy Moment"

- **Dónde se usaría:** `src/components/home/Hero.tsx` y/o `src/components/home/XsEnergyMoment.tsx`, como capa de vídeo opcional detrás de la fotografía actual.
- **Archivo esperado:** `public/videos/hero-bienestar.mp4` (+ `.webm` opcional) y/o `public/videos/xs-energy.mp4`.
- **Specs:** 8–15 s, 1920×1080 o superior, sin audio (se reproduce `muted loop autoplay playsInline`), tamaño optimizado (<8 MB ideal), con una imagen de `poster` igual al frame inicial.
- **Contenido recomendado:** hero — lifestyle/bienestar cotidiano (luz natural, ritmo pausado). XS Energy — movimiento/deporte, ritmo más intenso.
- **Estado actual:** no existe ningún vídeo de marca aprovechable en los materiales disponibles (solo clips personales ajenos al proyecto). Ambas secciones están construidas para funcionar perfectamente solo con fotografía, y aceptan un vídeo de fondo sin cambios estructurales el día que exista.

## 3. Latas XS™ Energy Drink en alta resolución — microsite de Bebidas Energéticas

- **Dónde se usa:** `src/components/xs-energy/EnergyHero.tsx`, `EnergyScrollStory.tsx`, `EnergyFlavorSwipe.tsx` y `EnergyFlavorGrid.tsx` (todo el nuevo apartado de bebidas energéticas en `/xs-energy`).
- **Estado actual:** se usan los 8 recortes reales ya existentes en `public/images/catalog/p089_*.webp` (fondo transparente confirmado). Funcionan, pero su resolución nativa es baja para el uso que reciben ahora — como máximo ~320×607 px — y en el hero (donde la lata ocupa hasta el 68% de la altura de pantalla) y en la escena de scroll se nota cierta suavidad/pixelado al ampliarlas.
- **Archivos ideales (mismos 8 sabores, mismo encuadre de estudio):**
  - `xs-watermelon-lemonade.webp`, `xs-tropical.webp`, `xs-cranberry-grape.webp`, `xs-naranja.webp`, `xs-energy-burn-blue-razz.webp`, `xs-energy-burn-kiwi-fresa.webp`, `xs-jugos-mango-pina-guayaba.webp`, `xs-classic.webp`
  - **Resolución recomendada:** 1200×1800 px o superior, fondo 100% transparente, vista frontal centrada, iluminación de estudio (igual que las actuales, solo que a mayor resolución).
- **Nota sobre 2 de las 8 latas:** en `src/data/energy-drinks.ts`, las variantes `naranja` y `classic` llevan `verified: false` porque el texto de sabor impreso en esas dos fotos concretas es ilegible al tamaño actual — no se ha inventado el nombre del sabor. Si se sustituyen por fotos de mayor resolución, se puede confirmar el sabor exacto impreso y actualizar `name`/`verified` en ese archivo.

## 4. Elementos flotantes opcionales para el hero/escena de scroll de Bebidas Energéticas

- **Dónde se usaría:** capas decorativas detrás/delante de la lata en `EnergyHero.tsx` y `EnergyScrollStory.tsx`.
- **Archivos sugeridos:** gotas de condensación, hielo o splash, en PNG/WebP con fondo transparente, recorte limpio, ~800×800 px.
- **Estado actual:** no existe ningún asset de este tipo en el proyecto; la experiencia actual funciona solo con las latas y gradientes de color (sin placeholders), y estas capas son una mejora opcional, no un bloqueante.

## 5. Número de WhatsApp de producción

No es un asset visual, pero queda anotado aquí porque bloquea el lanzamiento real: `SITE.whatsapp` en `src/data/site-config.ts` sigue siendo el número de pruebas indicado por el propietario del sitio. Sustituir por el número definitivo del negocio antes de publicar.
