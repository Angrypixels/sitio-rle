// Genera datos de ejemplo (ficticios) con la misma estructura de la hoja de seguimiento.
// Uso: npm run ejemplo
import { writeFileSync, mkdirSync } from 'node:fs';

let s = 20260714;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const dir = new URL('../datos/ejemplo/', import.meta.url);
mkdirSync(dir, { recursive: true });

const tipos = ['gobierno', 'instituto', 'instituto', 'instituto', 'plataforma', 'academia', 'academia', 'sociedad_civil'];
const aliados = [];
for (let i = 1; i <= 22; i++) {
  const n = 4 + Math.floor(rnd() * 14);
  const muj = Math.round(n * (0.4 + rnd() * 0.25));
  const e1 = Math.round(n * 0.2), e3 = Math.round(n * 0.1);
  const ind = rnd() < 0.2 ? 1 : 0, afro = rnd() < 0.4 ? 1 : 0, nr = Math.round(n * 0.1);
  aliados.push({
    id: `A${String(i).padStart(2, '0')}`, nombre: `Aliado ${String(i).padStart(2, '0')}`, sigla: '',
    tipo: tipos[(i - 1) % tipos.length], logo: '', publicar: 'si',
    punto_focal: 'Nombre Apellido', correo: 'privado@ejemplo.org',
    personas: n, mujeres: muj, hombres: n - muj, sexo_otro_nr: 0,
    edad_18_29: e1, edad_30_59: n - e1 - e3, edad_60_mas: e3,
    indigena: ind, afrodescendiente: afro, etnico_ninguno: n - ind - afro - nr, etnico_nr: nr,
  });
}

const roles = ['aporta', 'prepara', 'calcula', 'valida', 'reporta'];
// qué tan avanzado va cada indicador (0 a 1) en los datos de ejemplo
const avance = { 1: 0.45, 2: 0.6, 3: 0.35, 4: 0.1, 5: 0.4, 6: 0.5, 7: 0, 8: 0.8 };
const compromisos = [], hitos = [];
let c = 0;
for (let ind = 1; ind <= 8; ind++) {
  roles.forEach((rol, r) => {
    const n = rol === 'aporta' ? 2 + Math.floor(rnd() * 2) : rol === 'reporta' ? 1 : 1 + Math.floor(rnd() * 2);
    const usados = new Set();
    for (let k = 0; k < n; k++) {
      let a; do { a = rol === 'reporta' ? aliados[0] : pick(aliados); } while (usados.has(a.id));
      usados.add(a.id);
      const umbral = avance[ind] * 1.6 - r * 0.22 + rnd() * 0.2;
      const estado = Number(a.id.slice(1)) > 13 ? 'sin_vincular' : umbral > 0.55 ? 'cumplido' : umbral > 0.3 ? 'trabajando' : 'vinculado';
      const mes = 3 + r * 3 + Math.floor(rnd() * 3);
      const plazo = `${2027 + Math.floor(mes / 12)}-${String((mes % 12) + 1).padStart(2, '0')}-28`;
      compromisos.push({ id: `C${String(++c).padStart(3, '0')}`, aliado_id: a.id, indicador_id: ind, rol, estado, plazo });
      if (estado === 'cumplido') {
        const f = `2027-${String(1 + Math.floor(rnd() * 9)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}`;
        hitos.push({ fecha: f, indicador_id: ind, rol, aliado_id: a.id, estado: 'cumplido', texto_es: '', texto_en: '', publicar: 'si' });
      }
    }
  });
}

const csv = (rows) => [Object.keys(rows[0]).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n') + '\n';
writeFileSync(new URL('aliados.csv', dir), csv(aliados));
writeFileSync(new URL('compromisos.csv', dir), csv(compromisos));
writeFileSync(new URL('hitos.csv', dir), csv(hitos.sort((a, b) => b.fecha.localeCompare(a.fecha))));
console.log(`Ejemplo: ${aliados.length} actores, ${compromisos.length} compromisos, ${hitos.length} hitos`);
