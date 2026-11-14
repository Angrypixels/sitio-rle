import { defineConfig } from 'astro/config';

// BASE permite publicar en una subcarpeta (p. ej. /colombia/rle/ dentro del sitio de WCMC).
// En Cloudflare Pages o en un subdominio propio se deja en "/".
export default defineConfig({
  site: process.env.SITE_URL || 'https://example.org',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
