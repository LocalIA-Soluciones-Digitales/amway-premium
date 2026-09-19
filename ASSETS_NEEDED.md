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

## 3. Número de WhatsApp de producción

No es un asset visual, pero queda anotado aquí porque bloquea el lanzamiento real: `SITE.whatsapp` en `src/data/site-config.ts` sigue siendo el número de pruebas indicado por el propietario del sitio. Sustituir por el número definitivo del negocio antes de publicar.
