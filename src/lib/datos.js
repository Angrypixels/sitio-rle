// Lee la hoja (datos/actual o datos/ejemplo) y calcula todo lo que muestra el sitio.
// Reglas del anexo A: rol = cumplidos / asignados; indicador = promedio de sus 5 roles;
// RLe = promedio de los 8 indicadores. Los actores sin vincular cuentan pero no se nombran.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseCSV } from './csv.js';
import config from '../../datos/indicadores.json';

const raiz = join(process.cwd(), 'datos');
const esEjemplo = !existsSync(join(raiz, 'actual', 'compromisos.csv'));
// El aviso de prototipo también se puede forzar mientras la hoja tenga datos ficticios.
const conAviso = esEjemplo || process.env.AVISO_PROTOTIPO === 'si';
const leer = (n) => parseCSV(readFileSync(join(raiz, esEjemplo ? 'ejemplo' : 'actual', `${n}.csv`), 'utf8'));

const ORDEN = { cumplido: 0, trabajando: 1, vinculado: 2, sin_vincular: 3 };
const num = (v) => Number(v) || 0;
const pct = (x) => Math.round(x * 100);

export function cargar() {
  const aliadosRaw = leer('aliados');
  const compromisos = leer('compromisos').map((c) => ({ ...c, indicador_id: num(c.indicador_id) }));
  const hitosRaw = leer('hitos').map((h) => ({ ...h, indicador_id: num(h.indicador_id) }));

  // Aliados: estado según sus compromisos
  const aliados = aliadosRaw.map((a) => {
    const suyos = compromisos.filter((c) => c.aliado_id === a.id);
    const activos = suyos.filter((c) => c.estado !== 'sin_vincular');
    const cumplidos = suyos.filter((c) => c.estado === 'cumplido').length;
    const estado = !activos.length ? 'sin_vincular'
      : cumplidos === suyos.length ? 'cumplido'
      : suyos.some((c) => c.estado === 'trabajando' || c.estado === 'cumplido') ? 'trabajando' : 'vinculado';
    const visible = estado !== 'sin_vincular' && a.publicar.toLowerCase() === 'si';
    return {
      id: a.id, tipo: a.tipo, estado, visible,
      // el nombre solo sale si el aliado está vinculado y autorizó publicarlo
      nombre: visible ? a.nombre : null, sigla: visible ? a.sigla : null, logo: visible ? a.logo : null,
      // nombre corto para listas y novedades: la sigla si existe
      corto: visible ? a.sigla || a.nombre : null,
      compromisos: suyos.length, cumplidos,
      indicadores: [...new Set(suyos.map((c) => c.indicador_id))].sort(),
      roles: config.roles.map((r) => r.id).filter((r) => suyos.some((c) => c.rol === r)),
      // qué rol tiene en cada indicador, con el estado de ese compromiso
      detalle: config.indicadores.filter((i) => suyos.some((c) => c.indicador_id === i.id)).map((i) => ({
        indicador: i,
        roles: config.roles.filter((r) => suyos.some((c) => c.indicador_id === i.id && c.rol === r.id))
          .map((r) => ({ ...r, estado: suyos.find((c) => c.indicador_id === i.id && c.rol === r.id).estado })),
      })),
      personas: visible ? a : null,
    };
  }).sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || a.id.localeCompare(b.id));
  const porId = Object.fromEntries(aliados.map((a) => [a.id, a]));

  const indicadores = config.indicadores.map((ind) => {
    const roles = config.roles.map((rol) => {
      const asignados = compromisos.filter((c) => c.indicador_id === ind.id && c.rol === rol.id);
      const cumplidos = asignados.filter((c) => c.estado === 'cumplido').length;
      return {
        ...rol, asignados: asignados.length, cumplidos,
        avance: asignados.length ? cumplidos / asignados.length : 0,
        estado: !asignados.length ? 'sin_vincular'
          : cumplidos === asignados.length ? 'cumplido'
          : asignados.some((c) => c.estado === 'trabajando' || c.estado === 'cumplido') ? 'trabajando'
          : asignados.some((c) => c.estado === 'vinculado') ? 'vinculado' : 'sin_vincular',
        compromisos: asignados.map((c) => ({ estado: c.estado, plazo: c.plazo, aliado: porId[c.aliado_id]?.corto ?? null }))
          .sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]),
      };
    });
    const avance = roles.reduce((s, r) => s + r.avance, 0) / roles.length;
    // aliados del indicador según el estado de su parte en él
    const delInd = compromisos.filter((c) => c.indicador_id === ind.id);
    const porEstado = { cumplido: 0, trabajando: 0, vinculado: 0, sin_vincular: 0 };
    [...new Set(delInd.map((c) => c.aliado_id))].forEach((id) => {
      const cs = delInd.filter((c) => c.aliado_id === id).map((c) => c.estado);
      porEstado[cs.every((e) => e === 'cumplido') ? 'cumplido' : cs.some((e) => e === 'trabajando' || e === 'cumplido') ? 'trabajando' : cs.some((e) => e === 'vinculado') ? 'vinculado' : 'sin_vincular']++;
    });
    // próximos pasos: el último plazo pendiente de cada rol que aún no termina
    const previstos = roles.filter((r) => r.asignados && r.cumplidos < r.asignados)
      .map((r) => ({ rol: r, fecha: r.compromisos.filter((c) => c.estado !== 'cumplido' && c.plazo).map((c) => c.plazo).sort().pop() }))
      .filter((x) => x.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return { ...ind, roles, avance, pct: pct(avance), porEstado, nAliados: Object.values(porEstado).reduce((a, b) => a + b, 0), previstos };
  });

  const hitos = hitosRaw
    .filter((h) => h.publicar.toLowerCase() === 'si' && porId[h.aliado_id]?.visible)
    .map((h) => ({ ...h, aliado: porId[h.aliado_id].corto, indicador: config.indicadores.find((i) => i.id === h.indicador_id) }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  indicadores.forEach((ind) => { ind.hitos = hitos.filter((h) => h.indicador_id === ind.id); });

  // Composición por tipo de aliado y personas que participan (solo aliados visibles, cifras agregadas)
  const CAMPOS = ['personas', 'mujeres', 'hombres', 'sexo_otro_nr', 'edad_18_29', 'edad_30_59', 'edad_60_mas', 'indigena', 'afrodescendiente', 'etnico_ninguno', 'etnico_nr'];
  const sumar = (lista) => Object.fromEntries(CAMPOS.map((c) => [c, lista.reduce((s, a) => s + num(a.personas?.[c]), 0)]));
  const vinculados = aliados.filter((a) => a.estado !== 'sin_vincular');
  const tipos = ['gobierno', 'autoridad', 'instituto', 'plataforma', 'academia', 'sociedad_civil', 'cooperacion'].map((id) => {
    const lista = vinculados.filter((a) => a.tipo === id);
    return { id, aliados: lista, n: lista.length, roles: config.roles.filter((r) => lista.some((a) => a.roles.includes(r.id))), personas: sumar(lista.filter((a) => a.visible)) };
  }).filter((t) => t.n);
  const personas = { n: vinculados.filter((a) => a.visible).length, ...sumar(vinculados.filter((a) => a.visible)) };

  const rle = indicadores.reduce((s, i) => s + i.avance, 0) / indicadores.length;
  const cuenta = (e) => aliados.filter((a) => a.estado === e).length;

  return {
    esEjemplo: conAviso, config, indicadores, aliados, hitos, tipos, personas,
    rle: { pct: pct(rle), completos: indicadores.filter((i) => i.pct === 100).length, total: indicadores.length },
    actores: {
      total: aliados.length, aliados: aliados.length - cuenta('sin_vincular'),
      cumplido: cuenta('cumplido'), trabajando: cuenta('trabajando'), vinculado: cuenta('vinculado'), sin_vincular: cuenta('sin_vincular'),
    },
  };
}
