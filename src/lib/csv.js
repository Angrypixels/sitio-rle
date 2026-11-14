// Lector de CSV mínimo (comillas, comas y saltos de línea dentro de celdas).
export function parseCSV(texto) {
  const filas = [];
  let fila = [], celda = '', enComillas = false;
  const t = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (enComillas) {
      if (ch === '"' && t[i + 1] === '"') { celda += '"'; i++; }
      else if (ch === '"') enComillas = false;
      else celda += ch;
    } else if (ch === '"') enComillas = true;
    else if (ch === ',') { fila.push(celda); celda = ''; }
    else if (ch === '\n') { fila.push(celda); filas.push(fila); fila = []; celda = ''; }
    else celda += ch;
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila); }
  const [cab, ...resto] = filas.filter((f) => f.some((c) => c.trim() !== ''));
  if (!cab) return [];
  const claves = cab.map((c) => c.trim().toLowerCase());
  return resto.map((f) => Object.fromEntries(claves.map((k, i) => [k, (f[i] ?? '').trim()])));
}

export function toCSV(filas, columnas) {
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [columnas.join(','), ...filas.map((f) => columnas.map((c) => esc(f[c] ?? '')).join(','))].join('\n') + '\n';
}
