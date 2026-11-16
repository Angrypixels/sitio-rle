import { defineConfig } from 'astro/config';

// BASE permite publicar en una subcarpeta (p. ej. /colombia/rle/ dentro del sitio de WCMC).
// En Cloudflare Pages o en un subdominio propio se deja en "/".
export default defineConfig({
  // SITE_URL es el dominio público; se usa en los enlaces absolutos (vista previa al compartir, hreflang).
  site: process.env.SITE_URL || 'https://sitio-rle.monitoreo-biodiversidad.workers.dev',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
