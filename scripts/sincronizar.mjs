// Descarga las tres pestañas de la hoja de seguimiento y las deja en datos/actual/.
// Solo conserva las columnas de la lista blanca: los datos de contacto nunca llegan al sitio.
//
// Variables de entorno (una URL CSV por pestaña):
//   HOJA_ALIADOS, HOJA_COMPROMISOS, HOJA_HITOS
// Con una hoja compartida por enlace sirve:
//   https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=aliados
// Si no están definidas, el sitio se construye con datos/ejemplo/.
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseCSV, toCSV } from '../src/lib/csv.js';

const PUBLICAS = {
  aliados: ['id', 'nombre', 'sigla', 'tipo', 'logo', 'publicar', 'personas', 'mujeres', 'hombres', 'sexo_otro_nr',
    'edad_18_29', 'edad_30_59', 'edad_60_mas', 'indigena', 'afrodescendiente', 'etnico_ninguno', 'etnico_nr'],
  compromisos: ['id', 'aliado_id', 'indicador_id', 'rol', 'estado', 'plazo'],
  hitos: ['fecha', 'indicador_id', 'rol', 'aliado_id', 'estado', 'texto_es', 'texto_en', 'publicar'],
};

const fuentes = {
  aliados: process.env.HOJA_ALIADOS,
  compromisos: process.env.HOJA_COMPROMISOS,
  hitos: process.env.HOJA_HITOS,
};

if (!Object.values(fuentes).every(Boolean)) {
  console.log('Sin URLs de la hoja: se usan los datos de ejemplo.');
  process.exit(0);
}

const dir = new URL('../datos/actual/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [nombre, url] of Object.entries(fuentes)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo leer la pestaña ${nombre}: ${res.status}`);
  const filas = parseCSV(await res.text());
  const faltan = PUBLICAS[nombre].filter((c) => filas.length && !(c in filas[0]));
  if (faltan.length) throw new Error(`A la pestaña ${nombre} le faltan columnas: ${faltan.join(', ')}`);
  const limpias = filas.map((f) => Object.fromEntries(PUBLICAS[nombre].map((c) => [c, f[c] ?? ''])));
  writeFileSync(new URL(`${nombre}.csv`, dir), toCSV(limpias, PUBLICAS[nombre]));
  console.log(`${nombre}: ${limpias.length} filas`);
}
