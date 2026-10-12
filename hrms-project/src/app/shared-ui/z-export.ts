import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fill, i18nT, packDir } from './i18n-core';

/** File exports used by every list toolbar. */

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function safeName(title: string): string {
  return (title || 'list').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_').slice(0, 60) || 'list';
}

function download(blob: Blob, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function exportExcel(title: string, headers: string[], rows: string[][], extraSheets: { name: string; rows: any[][] }[] = []): void {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map(r => r.map(numberish))]);
  ws['!cols'] = headers.map((h, i) => ({ wch: Math.min(48, Math.max(10, h.length + 2, ...rows.slice(0, 200).map(r => String(r[i] ?? '').length + 1))) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeName(title).slice(0, 30) || 'List');
  for (const s of extraSheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows), s.name.slice(0, 30));
  }
  XLSX.writeFile(wb, `${safeName(title)}_${stamp()}.xlsx`);
}

/** CSV text (no BOM) – also sent by the report centre's "E-mail me" (v1.16.0). */
export function csvText(headers: string[], rows: string[][]): string {
  const esc = (v: any) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
}

export function exportCsv(title: string, headers: string[], rows: string[][]): void {
  const text = csvText(headers, rows);
  // BOM so Excel opens Arabic / accented text correctly
  download(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), `${safeName(title)}_${stamp()}.csv`);
}

// v1.15.0 language packs: PDFs with Arabic text (or exported in a right-to-left language) embed Noto Naskh Arabic
// (SIL Open Font License, assets/fonts/pdf/OFL.txt) – jsPDF shapes the Arabic letters; the columns run right to left.
// English exports do not load the font and are built exactly as before.
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
export const PDF_ARABIC_FONT_URL = 'assets/fonts/pdf/NotoNaskhArabic-Regular.ttf';
let arabicFont: Promise<string> | null = null;

function loadArabicFont(): Promise<string> {
  if (!arabicFont) {
    arabicFont = fetch(PDF_ARABIC_FONT_URL)
      .then(r => { if (!r.ok) { throw new Error('font ' + r.status); } return r.arrayBuffer(); })
      .then(buf => {
        const bytes = new Uint8Array(buf);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) { bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000))); }
        return btoa(bin);
      })
      .catch(e => { arabicFont = null; throw e; });
  }
  return arabicFont;
}

/** True when the PDF needs the Arabic font (any Arabic text, or the page is right to left). */
export function pdfNeedsArabic(title: string, headers: string[], rows: string[][], subtitle = ''): boolean {
  if (packDir() === 'rtl') { return true; }
  const has = (v: any) => ARABIC_RE.test(String(v ?? ''));
  return has(title) || has(subtitle) || headers.some(has) || rows.some(r => r.some(has));
}

export function exportPdf(title: string, headers: string[], rows: string[][], subtitle = ''): Promise<void> {
  if (!pdfNeedsArabic(title, headers, rows, subtitle)) {
    buildPdf(title, headers, rows, subtitle, null, false).save(`${safeName(title)}_${stamp()}.pdf`);
    return Promise.resolve();
  }
  const rtl = packDir() === 'rtl';
  return loadArabicFont()
    .then(font => buildPdf(title, headers, rows, subtitle, font, rtl))
    .catch(() => buildPdf(title, headers, rows, subtitle, null, rtl))   // font missing: still export (Latin only)
    .then(doc => { doc.save(`${safeName(title)}_${stamp()}.pdf`); });
}

/** The PDF document (exported for tests); `font` = base64 TTF of the Arabic font or null for the standard font. */
export function buildPdf(title: string, headers: string[], rows: string[][], subtitle: string, font: string | null, rtl: boolean, items?: XItem[]): jsPDF {
  const landscape = headers.length > 5;
  // v1.16.0: wide lists get a larger page so the columns stay readable (A3 from 15 columns, A2 from 25)
  const format = headers.length >= 25 ? 'a2' : headers.length >= 15 ? 'a3' : 'a4';
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format });
  const w = doc.internal.pageSize.getWidth();
  const FF = font ? 'ZeoNaskh' : 'helvetica';
  if (font) {
    doc.addFileToVFS('ZeoNaskh.ttf', font);
    doc.addFont('ZeoNaskh.ttf', 'ZeoNaskh', 'normal');
    doc.addFont('ZeoNaskh.ttf', 'ZeoNaskh', 'bold');
  }
  const english = !font && !rtl;
  const T = (s: string, p?: any[]) => (english ? fill(s, p) : i18nT(s, p));
  const x0 = rtl ? w - 36 : 36;
  const opt: any = rtl ? { align: 'right' } : undefined;
  doc.setFont(FF, 'bold'); doc.setFontSize(14); doc.setTextColor(27, 22, 64);
  doc.text(english ? title : T(title), x0, 40, opt);
  doc.setFont(FF, 'normal'); doc.setFontSize(9); doc.setTextColor(107, 113, 133);
  if (rtl) {  // right: the row count (translated); left: filters and time (mixed scripts kept apart so they read correctly)
    doc.text(T('{0} rows', [rows.length]), x0, 56, opt);
    doc.text(`${subtitle}${subtitle ? '  ·  ' : ''}${new Date().toLocaleString()}`, 36, 56);
  } else {
    doc.text(`${subtitle}${subtitle ? '  ·  ' : ''}${T('{0} rows', [rows.length])}  ·  ${new Date().toLocaleString()}`, x0, 56, opt);
  }
  const heads = english ? headers : headers.map(h => T(h));
  const head = rtl ? [...heads].reverse() : heads;
  // v1.16.0: grouped lists – a bold header row per group (name, value, count) with the subtotals under their columns
  const body: any[][] = items ? items.map(it => it.group ? pdfGroupRow(it.group, headers.length, rtl) : (rtl ? [...it.cells!].reverse() : it.cells!))
    : rtl ? rows.map(r => [...r].reverse()) : rows;
  const styles: any = { fontSize: headers.length > 9 ? 7 : 8.5, cellPadding: headers.length > 20 ? 3 : 4, overflow: 'linebreak', textColor: [38, 42, 61] };
  if (font) { styles.font = FF; }
  if (rtl) { styles.halign = 'right'; }
  autoTable(doc, {
    head: [head], body, startY: 68, margin: { left: 36, right: 36 },
    styles,
    headStyles: { fillColor: [91, 79, 224], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 245, 255] },
    didDrawPage: () => {
      const n = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8); doc.setTextColor(150);
      if (rtl) { doc.text(T('Page {0}', [n]), 36, doc.internal.pageSize.getHeight() - 18); } else { doc.text(T('Page {0}', [n]), w - 70, doc.internal.pageSize.getHeight() - 18); }
    },
  });
  return doc;
}

// ---------------------------------------------------------------- v1.16.0 exports that follow the screen
/**
 * What a list shows, ready to export: the visible columns in their order, the filtered and sorted rows and – when
 * the list is grouped – a header item per group (level, name, value, number of rows, subtotals of number columns)
 * followed by its rows. Collapsed groups are exported in full.
 */
export interface XGroup { level: number; field: string; value: string; count: number; sums: (number | null)[]; }
export interface XItem { group?: XGroup; cells?: string[]; path?: string[]; }
export interface XModel { title: string; subtitle?: string; headers: string[]; levels: string[]; items: XItem[]; }

/** "Department: Sales (12)" – the text of a group header row in every format. */
export function groupLabel(g: XGroup): string { return `${g.field}: ${g.value} (${g.count})`; }

export function modelRows(m: XModel): string[][] { return m.items.filter(i => i.cells).map(i => i.cells!); }

function fmtSum(n: number): string { return n.toLocaleString('en-US', { maximumFractionDigits: 2 }); }

function pdfGroupRow(g: XGroup, n: number, rtl: boolean): any[] {
  const fill = g.level ? [243, 242, 253] : [230, 228, 252];
  const st = { fontStyle: 'bold', fillColor: fill, textColor: [27, 22, 64] };
  const firstSum = g.sums.findIndex((x, i) => i > 0 && x !== null && x !== undefined);
  const span = firstSum > 0 ? firstSum : n;
  const label = { content: (g.level ? '   '.repeat(g.level) : '') + groupLabel(g), colSpan: span, styles: st };
  const rest: any[] = [];
  for (let i = span; i < n; i++) { const v = g.sums[i]; rest.push({ content: v === null || v === undefined ? '' : fmtSum(v), styles: st }); }
  return rtl ? [...rest.reverse(), label] : [label, ...rest];
}

/** Excel: grouped lists get bold group rows with subtotals and Excel outline levels (the +/- buttons). */
export async function exportModelExcel(m: XModel): Promise<void> {
  if (!m.levels.length) { exportExcel(m.title, m.headers, modelRows(m)); return; }
  const wb = await buildGroupedWorkbook(m);
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${safeName(m.title)}_${stamp()}.xlsx`);
}

export async function buildGroupedWorkbook(m: XModel): Promise<any> {
  const mod: any = await import('exceljs');
  const Workbook = mod.Workbook || mod.default?.Workbook;
  const wb = new Workbook();
  const depth = m.levels.length;
  const ws = wb.addWorksheet(safeName(m.title).slice(0, 30) || 'List', {
    views: [{ state: 'frozen', ySplit: 1, rightToLeft: packDir() === 'rtl' }],
    properties: { outlineLevelRow: depth, outlineProperties: { summaryBelow: false, summaryRight: false } },
  });
  const n = m.headers.length;
  const paint = (r: any, argb: string, font: any) => { for (let i = 1; i <= n; i++) { const c = r.getCell(i); c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }; c.font = font; } };
  const head = ws.addRow(m.headers);
  paint(head, 'FF5B4FE0', { bold: true, color: { argb: 'FFFFFFFF' } });
  for (const it of m.items) {
    if (it.group) {
      const g = it.group;
      const r = ws.addRow(m.headers.map((_, i) => i === 0 ? groupLabel(g) : (g.sums[i] ?? null)));
      paint(r, g.level ? 'FFF3F2FD' : 'FFE6E4FC', { bold: true, color: { argb: 'FF1B1640' } });
      if (g.level) { r.outlineLevel = g.level; }
    } else {
      const r = ws.addRow((it.cells || []).map(numberish));
      r.outlineLevel = depth;
    }
  }
  const rows = m.items.slice(0, 300);
  ws.columns.forEach((col: any, i: number) => {
    const lens = rows.map(it => String(it.group ? (i === 0 ? groupLabel(it.group) : it.group.sums[i] ?? '') : it.cells?.[i] ?? '').length + 1);
    col.width = Math.min(48, Math.max(10, (m.headers[i] || '').length + 2, ...lens));
  });
  return wb;
}

/** CSV: no header rows – one column per group level in front of the columns, filled on every row. */
export function modelCsv(m: XModel): { headers: string[]; rows: string[][] } {
  if (!m.levels.length) { return { headers: m.headers, rows: modelRows(m) }; }
  return { headers: [...m.levels, ...m.headers], rows: m.items.filter(i => i.cells).map(i => [...(i.path || []), ...i.cells!]) };
}

export function exportModelCsv(m: XModel): void {
  const c = modelCsv(m);
  exportCsv(m.title, c.headers, c.rows);
}

/** PDF: group header rows (bold, with subtotals) between the rows; Arabic / right-to-left handled as before. */
export function exportModelPdf(m: XModel): Promise<void> {
  if (!m.levels.length) { return exportPdf(m.title, m.headers, modelRows(m), m.subtitle || ''); }
  const rows = modelRows(m);
  const all = [...rows, ...m.items.filter(i => i.group).map(i => [groupLabel(i.group!)])];
  const name = `${safeName(m.title)}_${stamp()}.pdf`;
  if (!pdfNeedsArabic(m.title, m.headers, all, m.subtitle || '')) {
    buildPdf(m.title, m.headers, rows, m.subtitle || '', null, false, m.items).save(name);
    return Promise.resolve();
  }
  const rtl = packDir() === 'rtl';
  return loadArabicFont()
    .then(font => buildPdf(m.title, m.headers, rows, m.subtitle || '', font, rtl, m.items))
    .catch(() => buildPdf(m.title, m.headers, rows, m.subtitle || '', null, rtl, m.items))
    .then(doc => { doc.save(name); });
}

function numberish(v: string): any {
  const s = String(v ?? '').trim();
  if (/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s) || /^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s.replace(/,/g, ''));
    if (!isNaN(n) && s.length < 16 && !/^0\d/.test(s)) { return n; }
  }
  return s;
}

/** Reads the first sheet of an .xlsx / .xls / .csv file as rows of {header: value}. */
export function readSheet(file: File): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Could not read the file.'));
    fr.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(fr.result as ArrayBuffer), { type: 'array', cellDates: false, raw: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
        const headers = (aoa[0] || []).map((h: any) => String(h).trim());
        const rows = aoa.slice(1).filter(r => r.some((c: any) => String(c).trim() !== ''))
          .map(r => { const o: any = {}; headers.forEach((h, i) => { o[h] = r[i]; }); return o; });
        resolve({ headers, rows });
      } catch (e) { reject(e); }
    };
    fr.readAsArrayBuffer(file);
  });
}
