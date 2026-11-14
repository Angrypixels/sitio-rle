# Sitio de seguimiento del RLe

Sitio público, en español e inglés, que muestra cómo avanza el trabajo para calcular el Índice de Lista Roja de Ecosistemas de Colombia (anexo A del Annex 6.2). Se alimenta de una hoja de Google con tres pestañas: `aliados`, `compromisos` e `hitos`.

## Cómo funciona

```
Hoja de Google  ──(npm run sync)──▶  datos/actual/*.csv  ──(npm run build)──▶  dist/ (HTML estático)
```

- **Astro** genera HTML y CSS estáticos, casi sin JavaScript. La carpeta `dist/` se puede alojar en cualquier parte: Cloudflare Pages, una subcarpeta del servidor de WCMC o un subdominio.
- **La hoja es la fuente.** `scripts/sincronizar.mjs` descarga las tres pestañas y solo conserva las columnas públicas. Los datos de contacto de los puntos focales nunca llegan al sitio.
- **Los cálculos** (rol, indicador, RLe, estado de cada aliado) están en `src/lib/datos.js` y siguen las reglas del anexo A.
- **Los actores sin vincular** cuentan en el total pero su nombre no se publica. Tampoco los aliados con `publicar` distinto de `si`.
- Sin URLs de la hoja, el sitio se construye con `datos/ejemplo/` y muestra el aviso «Prototipo con datos de ejemplo».

## Uso

```bash
npm install
npm run dev        # vista local en http://localhost:4321
npm run ejemplo    # regenera los datos ficticios
npm run publicar   # sincroniza la hoja y construye dist/
```

Variables de entorno:

| Variable | Para qué |
|---|---|
| `HOJA_ALIADOS`, `HOJA_COMPROMISOS`, `HOJA_HITOS` | URL CSV de cada pestaña |
| `BASE` | Subcarpeta donde se publica, por ejemplo `/colombia/rle/`. Por defecto `/` |
| `SITE_URL` | Dominio final |

## Estructura de la hoja

**aliados**: `id, nombre, sigla, tipo, logo, publicar, personas, mujeres, hombres, sexo_otro_nr, edad_18_29, edad_30_59, edad_60_mas, indigena, afrodescendiente, etnico_ninguno, etnico_nr`. Puede tener más columnas (punto focal, correo, nivel de relación, nivel de compromiso): el sitio las ignora.
`tipo`: `gobierno`, `instituto`, `plataforma`, `academia`, `sociedad_civil`.

**compromisos**: `id, aliado_id, indicador_id, rol, estado, plazo`.
`rol`: `aporta`, `prepara`, `calcula`, `valida`, `reporta`. `estado`: `sin_vincular`, `vinculado`, `trabajando`, `cumplido`.

**hitos**: `fecha, indicador_id, rol, aliado_id, estado, texto_es, texto_en, publicar`. Si los textos van vacíos, el sitio arma la frase («Aliado X cumplió: …»).

Los ocho indicadores, sus criterios y los nombres en los dos idiomas están en `datos/indicadores.json`.

## Publicación

1. Repositorio en GitHub (organización del Humboldt).
2. Cloudflare Pages conectado al repositorio: comando `npm run publicar`, carpeta `dist`.
3. Deploy hook de Cloudflare pegado en la hoja (`apps-script/Codigo.gs`): el menú **Sitio RLe > Publicar cambios** reconstruye el sitio.

Para pasarlo a WCMC: apuntar un subdominio de `monitoring-support.org` a Cloudflare Pages (un registro DNS), o subir `dist/` a su servidor, o transferirles el repositorio y el proyecto de Cloudflare.

## Pendiente

- Ilustración de la portada: guardar como `public/img/ilustracion-portada.png` (PNG con transparencia) y aparece sola.
- Suscripción por correo en Novedades (el formulario está inactivo).
- Íconos definitivos de los cinco roles (`src/components/Icono.astro`).
- Íconos de los indicadores en SVG y logos de los aliados.
- Tipografías alojadas en el sitio en vez de Google Fonts.
