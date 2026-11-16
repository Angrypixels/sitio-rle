// Genera los datos de ejemplo con la misma estructura de la hoja de seguimiento.
// Los actores y sus tipos salen de la matriz de actores del proyecto (subactividad 1.3).
// Los roles por indicador son un borrador: cada mesa técnica los define.
// Los estados, plazos, hitos y cifras de personas son ficticios.
// Uso: npm run ejemplo
import { writeFileSync, mkdirSync } from 'node:fs';

let s = 20260714;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const dir = new URL('../datos/ejemplo/', import.meta.url);
mkdirSync(dir, { recursive: true });

// --- Actores identificados: [sigla, nombre, tipo] -------------------------------------------
const ACTORES = [
  ['Minambiente · DBBSE', 'Ministerio de Ambiente y Desarrollo Sostenible, Dirección de Bosques, Biodiversidad y Servicios Ecosistémicos', 'gobierno'],
  ['Minambiente · DAMCRA', 'Ministerio de Ambiente y Desarrollo Sostenible, Dirección de Asuntos Marinos, Costeros y Recursos Acuáticos', 'gobierno'],
  ['Minambiente · ABC', 'Ministerio de Ambiente y Desarrollo Sostenible, Grupo implementador del ABC', 'gobierno'],
  ['DNP', 'Departamento Nacional de Planeación', 'gobierno'],
  ['Minagricultura', 'Ministerio de Agricultura y Desarrollo Rural', 'gobierno'],
  ['DANE', 'Departamento Administrativo Nacional de Estadística', 'gobierno'],
  ['IGAC', 'Instituto Geográfico Agustín Codazzi', 'gobierno'],
  ['PNN', 'Parques Nacionales Naturales de Colombia', 'autoridad'],
  ['ANLA', 'Autoridad Nacional de Licencias Ambientales', 'autoridad'],
  ['AUNAP', 'Autoridad Nacional de Acuicultura y Pesca', 'autoridad'],
  ['Instituto Humboldt', 'Instituto de Investigación de Recursos Biológicos Alexander von Humboldt', 'instituto'],
  ['IDEAM', 'Instituto de Hidrología, Meteorología y Estudios Ambientales', 'instituto'],
  ['INVEMAR', 'Instituto de Investigaciones Marinas y Costeras José Benito Vives de Andréis', 'instituto'],
  ['SINCHI', 'Instituto Amazónico de Investigaciones Científicas', 'instituto'],
  ['IIAP', 'Instituto de Investigaciones Ambientales del Pacífico John von Neumann', 'instituto'],
  ['AGROSAVIA', 'Corporación Colombiana de Investigación Agropecuaria', 'instituto'],
  ['SiB Colombia', 'Sistema de Información sobre Biodiversidad de Colombia', 'plataforma'],
  ['Javeriana', 'Pontificia Universidad Javeriana', 'academia'],
  ['TNC', 'The Nature Conservancy', 'sociedad_civil'],
  ['CI', 'Conservación Internacional', 'sociedad_civil'],
  ['FCDS', 'Fundación para la Conservación y el Desarrollo Sostenible', 'sociedad_civil'],
  ['UICN', 'Unión Internacional para la Conservación de la Naturaleza', 'cooperacion'],
  ['PNUD', 'Programa de las Naciones Unidas para el Desarrollo', 'cooperacion'],
];

// --- Borrador de roles: indicador -> rol -> siglas -------------------------------------------
const ROLES = {
  1: { aporta: ['IDEAM', 'SINCHI', 'IGAC', 'Javeriana'], prepara: ['IDEAM'], calcula: ['Instituto Humboldt'], valida: ['Javeriana', 'UICN'], reporta: ['Minambiente · DBBSE'] },
  2: { aporta: ['IDEAM', 'INVEMAR', 'IIAP'], prepara: ['Instituto Humboldt'], calcula: ['Instituto Humboldt'], valida: ['INVEMAR', 'CI'], reporta: ['Minambiente · DAMCRA'] },
  3: { aporta: ['PNN', 'IDEAM', 'TNC'], prepara: ['Instituto Humboldt'], calcula: ['Instituto Humboldt'], valida: ['UICN'], reporta: ['Minambiente · DBBSE'] },
  4: { aporta: ['IDEAM', 'ANLA'], prepara: ['IDEAM'], calcula: ['IDEAM'], valida: ['DANE'], reporta: ['Minambiente · DBBSE'] },
  5: { aporta: ['AUNAP', 'SiB Colombia', 'INVEMAR'], prepara: ['SiB Colombia'], calcula: ['Instituto Humboldt'], valida: ['UICN'], reporta: ['Minambiente · DBBSE'] },
  6: { aporta: ['SiB Colombia', 'CI', 'SINCHI'], prepara: ['Instituto Humboldt'], calcula: ['Instituto Humboldt'], valida: ['UICN', 'Javeriana'], reporta: ['Minambiente · ABC'] },
  7: { aporta: ['AGROSAVIA', 'Minagricultura', 'Javeriana'], prepara: ['Instituto Humboldt'], calcula: ['Instituto Humboldt'], valida: ['DANE'], reporta: ['Minambiente · ABC'] },
  8: { aporta: ['IDEAM', 'Instituto Humboldt'], prepara: ['Instituto Humboldt'], calcula: ['Instituto Humboldt'], valida: ['IDEAM', 'FCDS'], reporta: ['Minambiente · ABC'] },
};

// --- Supuestos ficticios para mostrar el sitio con avance -----------------------------------
// Actores que en el ejemplo ya respondieron; los demás quedan sin vincular.
const VINCULADOS = new Set(['Minambiente · DBBSE', 'Minambiente · DAMCRA', 'Minambiente · ABC', 'Instituto Humboldt', 'IDEAM', 'INVEMAR', 'SINCHI', 'SiB Colombia', 'PNN', 'Javeriana', 'UICN', 'CI']);
// Qué tan avanzado va cada indicador (0 a 1).
const AVANCE = { 1: 0.45, 2: 0.6, 3: 0.35, 4: 0.1, 5: 0.4, 6: 0.5, 7: 0, 8: 0.8 };

// Logos disponibles en public/img/aliados/, por sigla.
const LOGOS = {
  'Minambiente · DBBSE': 'ambiente.svg', 'Minambiente · DAMCRA': 'ambiente.svg', 'Minambiente · ABC': 'ambiente.svg',
  PNN: 'pnn.png', 'Instituto Humboldt': 'humboldt.svg', IDEAM: 'ideam.svg', INVEMAR: 'invemar.svg', SINCHI: 'sinchi.svg',
  'SiB Colombia': 'sib-colombia.svg', Javeriana: 'javeriana.svg', CI: 'ci.svg', UICN: 'uicn.svg',
};

const aliados = ACTORES.map(([sigla, nombre, tipo], i) => {
  const n = 4 + Math.floor(rnd() * 14);
  const muj = Math.round(n * (0.4 + rnd() * 0.25));
  const e1 = Math.round(n * 0.2), e3 = Math.round(n * 0.1);
  const ind = rnd() < 0.2 ? 1 : 0, afro = rnd() < 0.4 ? 1 : 0, nr = Math.round(n * 0.1);
  return {
    id: `A${String(i + 1).padStart(2, '0')}`, nombre, sigla, tipo, logo: LOGOS[sigla] ?? '', publicar: 'si',
    personas: n, mujeres: muj, hombres: n - muj, sexo_otro_nr: 0,
    edad_18_29: e1, edad_30_59: n - e1 - e3, edad_60_mas: e3,
    indigena: ind, afrodescendiente: afro, etnico_ninguno: n - ind - afro - nr, etnico_nr: nr,
  };
});
const idDe = Object.fromEntries(aliados.map((a) => [a.sigla, a.id]));

const compromisos = [], hitos = [];
let c = 0;
for (const [ind, porRol] of Object.entries(ROLES)) {
  Object.entries(porRol).forEach(([rol, siglas], r) => {
    for (const sigla of siglas) {
      if (!idDe[sigla]) throw new Error(`Actor desconocido: ${sigla}`);
      const umbral = AVANCE[ind] * 1.6 - r * 0.22 + rnd() * 0.2;
      const estado = !VINCULADOS.has(sigla) ? 'sin_vincular' : umbral > 0.55 ? 'cumplido' : umbral > 0.3 ? 'trabajando' : 'vinculado';
      const mes = 3 + r * 3 + Math.floor(rnd() * 3);
      const plazo = `${2027 + Math.floor(mes / 12)}-${String((mes % 12) + 1).padStart(2, '0')}-28`;
      compromisos.push({ id: `C${String(++c).padStart(3, '0')}`, aliado_id: idDe[sigla], indicador_id: Number(ind), rol, estado, plazo });
      if (estado === 'cumplido') {
        const f = `2027-${String(1 + Math.floor(rnd() * 9)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}`;
        hitos.push({ fecha: f, indicador_id: Number(ind), rol, aliado_id: idDe[sigla], estado: 'cumplido', texto_es: '', texto_en: '', publicar: 'si' });
      }
    }
  });
}

const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const csv = (rows) => [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).map(esc).join(','))].join('\n') + '\n';
writeFileSync(new URL('aliados.csv', dir), csv(aliados));
writeFileSync(new URL('compromisos.csv', dir), csv(compromisos));
writeFileSync(new URL('hitos.csv', dir), csv(hitos.sort((a, b) => b.fecha.localeCompare(a.fecha))));
console.log(`Ejemplo: ${aliados.length} actores, ${compromisos.length} compromisos, ${hitos.length} hitos`);
