/**
 * Menú "Sitio RLe" dentro de la hoja de seguimiento.
 * Extensiones > Apps Script > pegar este archivo.
 * En Configuración del proyecto > Propiedades de la secuencia de comandos, crear
 * DEPLOY_HOOK con la URL del deploy hook de Cloudflare.
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Sitio RLe')
    .addItem('Publicar cambios en el sitio', 'publicarSitio')
    .addToUi();
}

function publicarSitio() {
  const ui = SpreadsheetApp.getUi();
  const errores = validar_();
  if (errores.length) {
    ui.alert('Hay filas por corregir antes de publicar', errores.slice(0, 15).join('\n'), ui.ButtonSet.OK);
    return;
  }
  // Se quitan espacios y saltos de línea que suelen colarse al pegar la dirección.
  const hook = (PropertiesService.getScriptProperties().getProperty('DEPLOY_HOOK') || '').replace(/\s/g, '');
  if (!hook) { ui.alert('Falta configurar DEPLOY_HOOK.'); return; }
  const r = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
  ui.alert(r.getResponseCode() < 300
    ? 'Listo. El sitio se actualiza en uno o dos minutos.'
    : 'No se pudo publicar (código ' + r.getResponseCode() + ').');
}

/**
 * Hito automático: al cambiar a "cumplido" el estado de un compromiso, agrega la fila
 * correspondiente en la pestaña hitos con la fecha del día y publicar = si.
 * Si ese hito ya existe (mismo indicador, rol y aliado), no lo repite.
 * Si el compromiso deja de estar cumplido (por ejemplo, se marcó por error), el hito
 * queda con publicar = no: sale del sitio en la siguiente publicación, pero no se borra.
 * Si luego vuelve a cumplido, el mismo hito se reactiva con la fecha de ese día.
 * La fecha y los textos se pueden corregir después a mano en la pestaña hitos.
 */
function onEdit(e) {
  const hoja = e.range.getSheet();
  if (hoja.getName() !== 'compromisos') return;
  const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map((c) => String(c).trim().toLowerCase());
  const col = (n) => cab.indexOf(n) + 1;
  const cEstado = col('estado');
  if (!cEstado || e.range.getColumn() > cEstado || e.range.getLastColumn() < cEstado) return;

  const hitos = e.source.getSheetByName('hitos');
  const cabH = hitos.getRange(1, 1, 1, hitos.getLastColumn()).getValues()[0].map((c) => String(c).trim().toLowerCase());
  const colH = (n) => cabH.indexOf(n) + 1;
  const hoy = Utilities.formatDate(new Date(), e.source.getSpreadsheetTimeZone(), 'yyyy-MM-dd');

  // Recorre las filas editadas: sirve igual para una celda que para un bloque pegado.
  for (let f = Math.max(e.range.getRow(), 2); f <= e.range.getLastRow(); f++) {
    const fila = hoja.getRange(f, 1, 1, cab.length).getValues()[0];
    const cumplido = String(fila[cEstado - 1]).trim() === 'cumplido';
    const nuevo = { fecha: hoy, indicador_id: fila[col('indicador_id') - 1], rol: fila[col('rol') - 1], aliado_id: fila[col('aliado_id') - 1], estado: 'cumplido', publicar: 'si' };

    const datos = hitos.getRange(1, 1, Math.max(hitos.getLastRow(), 1), cabH.length).getValues();
    const igual = (h, n) => String(h[colH(n) - 1]).trim() === String(nuevo[n]).trim();
    const previo = datos.findIndex((h, i) => i > 0 && igual(h, 'indicador_id') && igual(h, 'rol') && igual(h, 'aliado_id')) + 1;
    const fecha_ = (r) => { hitos.getRange(r, colH('fecha')).setValue(hoy).setNumberFormat('yyyy-mm-dd'); };

    if (!cumplido) {
      // Dejó de estar cumplido: el hito se oculta del sitio, sin borrar la fila.
      if (previo && colH('publicar')) hitos.getRange(previo, colH('publicar')).setValue('no');
      continue;
    }
    if (previo) {
      // Ya existía: si estaba oculto por una corrección, se vuelve a publicar con la fecha de hoy.
      const pub = colH('publicar') ? hitos.getRange(previo, colH('publicar')) : null;
      if (pub && String(pub.getValue()).trim().toLowerCase() !== 'si') { pub.setValue('si'); fecha_(previo); }
      continue;
    }

    // Primera fila sin fecha: así no importa si las columnas de ayuda tienen fórmulas más abajo.
    let destino = datos.findIndex((h, i) => i > 0 && String(h[colH('fecha') - 1]).trim() === '') + 1;
    if (!destino) destino = datos.length + 1;
    Object.keys(nuevo).forEach((n) => { if (colH(n)) hitos.getRange(destino, colH(n)).setValue(nuevo[n]); });
    // La hoja convierte el texto en fecha; este formato evita que se muestre como 17/11/2026, que el sitio no sabe leer.
    fecha_(destino);
  }
}

// Revisa que estados, roles e identificadores sean válidos.
function validar_() {
  const ss = SpreadsheetApp.getActive();
  const filas = (n) => {
    const v = ss.getSheetByName(n).getDataRange().getValues();
    const cab = v.shift().map((c) => String(c).trim().toLowerCase());
    return v.filter((f) => f.join('') !== '').map((f, i) => Object.assign({ _fila: i + 2 }, ...cab.map((c, j) => ({ [c]: f[j] }))));
  };
  const ESTADOS = ['sin_vincular', 'vinculado', 'trabajando', 'cumplido'];
  const ROLES = ['aporta', 'prepara', 'calcula', 'valida', 'reporta'];
  const ids = new Set(filas('aliados').map((a) => String(a.id)));
  const e = [];
  filas('compromisos').forEach((c) => {
    if (!ids.has(String(c.aliado_id))) e.push('compromisos, fila ' + c._fila + ': aliado_id no existe');
    if (!ESTADOS.includes(String(c.estado))) e.push('compromisos, fila ' + c._fila + ': estado no válido');
    if (!ROLES.includes(String(c.rol))) e.push('compromisos, fila ' + c._fila + ': rol no válido');
    if (!(c.indicador_id >= 1 && c.indicador_id <= 8)) e.push('compromisos, fila ' + c._fila + ': indicador_id debe ir de 1 a 8');
  });
  filas('hitos').forEach((h) => {
    if (!ids.has(String(h.aliado_id))) e.push('hitos, fila ' + h._fila + ': aliado_id no existe');
  });
  return e;
}
