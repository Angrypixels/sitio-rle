/**
 * Menú "Sitio RLe" dentro de la hoja de seguimiento.
 * Extensiones > Apps Script > pegar este archivo.
 * En Configuración del proyecto > Propiedades de la secuencia de comandos, crear
 * DEPLOY_HOOK con la URL del deploy hook de Cloudflare Pages (o del workflow de GitHub).
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
  const hook = PropertiesService.getScriptProperties().getProperty('DEPLOY_HOOK');
  if (!hook) { ui.alert('Falta configurar DEPLOY_HOOK.'); return; }
  const r = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
  ui.alert(r.getResponseCode() < 300
    ? 'Listo. El sitio se actualiza en uno o dos minutos.'
    : 'No se pudo publicar (código ' + r.getResponseCode() + ').');
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
