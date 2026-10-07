import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function exportCsv(title: string, headers: string[], rows: string[][]): void {
  const esc = (v: any) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
  // BOM so Excel opens Arabic / accented text correctly
  download(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), `${safeName(title)}_${stamp()}.csv`);
}

export function exportPdf(title: string, headers: string[], rows: string[][], subtitle = ''): void {
  const landscape = headers.length > 5;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(27, 22, 64);
  doc.text(title, 36, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 113, 133);
  doc.text(`${subtitle}${subtitle ? '  ·  ' : ''}${rows.length} rows  ·  ${new Date().toLocaleString()}`, 36, 56);
  autoTable(doc, {
    head: [headers], body: rows, startY: 68, margin: { left: 36, right: 36 },
    styles: { fontSize: headers.length > 9 ? 7 : 8.5, cellPadding: 4, overflow: 'linebreak', textColor: [38, 42, 61] },
    headStyles: { fillColor: [91, 79, 224], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 245, 255] },
    didDrawPage: () => {
      const n = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`Page ${n}`, w - 70, doc.internal.pageSize.getHeight() - 18);
    },
  });
  doc.save(`${safeName(title)}_${stamp()}.pdf`);
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
