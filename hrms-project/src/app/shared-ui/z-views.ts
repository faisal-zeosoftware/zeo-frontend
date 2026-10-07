/**
 * Kanban, Calendar, Graph and Pivot views for any list (the table stays the List view).
 * They use the rows and columns the list bar already read from the table, after search and filters,
 * so every view shows the same records. Clicking a card / event opens the record the way the screen does.
 */
export type ViewKind = 'list' | 'kanban' | 'calendar' | 'graph' | 'pivot';
export interface VCol { idx: number; label: string; kind: 'text' | 'number' | 'date'; skip: boolean; facet: boolean; }
export interface VRow { key: number; cells: string[]; status?: string; }
export interface ViewState {
  kanbanBy?: number; calBy?: number; calMonth?: string; graphBy?: number; graphMeasure?: number; graphType?: 'bar' | 'line';
  pivotRows?: number; pivotCols?: number; pivotMeasure?: number;
}

export const VIEW_LABEL: Record<ViewKind, string> = { list: 'List', kanban: 'Kanban', calendar: 'Calendar', graph: 'Graph', pivot: 'Pivot' };

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
function num(s: string): number | null {
  const t = String(s || '').replace(/[, ]|AED|aed|%/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) { return null; }
  return Number(t);
}
const fmt = (n: number) => Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : (Math.round(n * 100) / 100).toLocaleString();

/** Which views make sense for these columns. */
export function availableViews(cols: VCol[]): ViewKind[] {
  const facet = cols.some(c => c.facet && !c.skip);
  const date = cols.some(c => c.kind === 'date' && !c.skip);
  const v: ViewKind[] = ['list'];
  if (facet) { v.push('kanban'); }
  if (date) { v.push('calendar'); }
  if (facet || date) { v.push('graph', 'pivot'); }
  return v;
}

const STATUS_RE = /(status|state|stage|approval|result|priority|type|level)/i;
export function defaults(cols: VCol[], st: ViewState): ViewState {
  const facets = cols.filter(c => c.facet && !c.skip);
  const dates = cols.filter(c => c.kind === 'date' && !c.skip);
  const nums = cols.filter(c => c.kind === 'number' && !c.skip && !/^(no|id|#|sl|s\.?no)/i.test(c.label));
  const status = facets.find(c => STATUS_RE.test(c.label)) || facets[0];
  return {
    kanbanBy: st.kanbanBy ?? status?.idx,
    calBy: st.calBy ?? dates[0]?.idx,
    calMonth: st.calMonth,
    graphBy: st.graphBy ?? (status || facets[0])?.idx ?? dates[0]?.idx,
    graphMeasure: st.graphMeasure ?? -1,
    graphType: st.graphType ?? 'bar',
    pivotRows: st.pivotRows ?? (facets[0] || dates[0])?.idx,
    pivotCols: st.pivotCols ?? (facets[1]?.idx ?? -1),
    pivotMeasure: st.pivotMeasure ?? (nums[0]?.idx ?? -1),
  };
}

function colOptions(cols: VCol[], sel: number | undefined, filter: (c: VCol) => boolean, none?: string): string {
  return (none ? `<option value="-1"${sel === -1 || sel === undefined ? ' selected' : ''}>${esc(none)}</option>` : '') +
    cols.filter(filter).map(c => `<option value="${c.idx}"${c.idx === sel ? ' selected' : ''}>${esc(c.label)}${c.kind === 'date' ? ' (month)' : ''}</option>`).join('');
}

function keyOf(r: VRow, c: VCol | undefined): string {
  if (!c) { return '(all)'; }
  const v = (r.cells[c.idx] || '').trim();
  if (c.kind === 'date') { const d = parseD(v); return d ? d.toISOString().slice(0, 7) : '(no date)'; }
  return v || '(none)';
}
function parseD(s: string): Date | null {
  const t = String(s || '').trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t); if (m) { return new Date(+m[1], +m[2] - 1, +m[3]); }
  m = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})/.exec(t); if (m) { return new Date(+m[3], +m[2] - 1, +m[1]); }
  const MON: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  m = /^(\d{1,2})[ -]([A-Za-z]{3})[a-z]*[ -,]*(\d{4})/.exec(t); if (m && MON[m[2].toLowerCase()] !== undefined) { return new Date(+m[3], MON[m[2].toLowerCase()], +m[1]); }
  m = /^([A-Za-z]{3})[a-z]* (\d{1,2}),? (\d{4})/.exec(t); if (m && MON[m[1].toLowerCase()] !== undefined) { return new Date(+m[3], MON[m[1].toLowerCase()], +m[2]); }
  return null;
}
const monthName = (ym: string) => { const [y, m] = ym.split('-').map(Number); return isNaN(y) ? ym : new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); };

/** Text columns shown on a card (title first). */
function cardCols(cols: VCol[], except: number[]): VCol[] {
  return cols.filter(c => !c.skip && !except.includes(c.idx)).slice(0, 5);
}

// ------------------------------------------------------------------ Kanban
export function kanbanHtml(cols: VCol[], rows: VRow[], st: ViewState): string {
  const by = cols.find(c => c.idx === st.kanbanBy);
  const groups = new Map<string, VRow[]>();
  for (const r of rows) { const k = keyOf(r, by); if (!groups.has(k)) { groups.set(k, []); } groups.get(k)!.push(r); }
  const show = cardCols(cols, by ? [by.idx] : []);
  const title = show[0];
  const lanes = [...groups.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 30);
  const tone = (k: string) => /approv|active|complete|paid|done|closed|yes/i.test(k) ? 'good' : /reject|cancel|inactive|fail|no$/i.test(k) ? 'bad' : /pend|wait|review|draft|progress|open/i.test(k) ? 'warn' : '';
  return `<div class="zv-opts"><label>Columns by <select data-v="kanbanBy">${colOptions(cols, st.kanbanBy, c => c.facet && !c.skip)}</select></label>
    <span class="zv-muted">${rows.length} records · open a card to see or change the record</span></div>
  <div class="zv-kanban">${lanes.map(([k, list]) => `
    <section class="zv-lane"><header><span class="zv-dot ${tone(k)}"></span><b>${esc(k)}</b><span class="zv-n">${list.length}</span></header>
      <div class="zv-cards">${list.slice(0, 200).map(r => `
        <button type="button" class="zv-card" data-row="${r.key}">
          <b>${esc(title ? r.cells[title.idx] : '')}</b>
          ${show.slice(1, 5).map(c => r.cells[c.idx] ? `<span><i>${esc(c.label)}</i> ${esc(r.cells[c.idx])}</span>` : '').join('')}
        </button>`).join('')}${list.length > 200 ? `<p class="zv-muted">${list.length - 200} more – use filters to narrow</p>` : ''}</div>
    </section>`).join('')}</div>`;
}

// ------------------------------------------------------------------ Calendar
export function calendarHtml(cols: VCol[], rows: VRow[], st: ViewState): string {
  const by = cols.find(c => c.idx === st.calBy);
  const dated = rows.map(r => ({ r, d: by ? parseD(r.cells[by.idx]) : null })).filter(x => x.d) as { r: VRow; d: Date }[];
  let ym = st.calMonth;
  if (!ym) {
    const now = new Date(); const cur = now.toISOString().slice(0, 7);
    ym = dated.some(x => x.d.toISOString().slice(0, 7) === cur) || !dated.length ? cur : dated.map(x => x.d).sort((a, b) => b.getTime() - a.getTime())[0].toISOString().slice(0, 7);
  }
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(y, m, 0).getDate();
  const tcols = cardCols(cols, by ? [by.idx] : []).filter(c => c.kind !== 'date').slice(0, 2);
  const title = tcols[0];
  const evText = (r: VRow) => tcols.map(c => r.cells[c.idx]).filter(Boolean).join(' · ') || 'Record';
  const byDay = new Map<number, VRow[]>();
  for (const x of dated) { if (x.d.getFullYear() === y && x.d.getMonth() === m - 1) { const k = x.d.getDate(); if (!byDay.has(k)) { byDay.set(k, []); } byDay.get(k)!.push(x.r); } }
  const cells: string[] = [];
  for (let i = 0; i < startDay; i++) { cells.push('<div class="zv-day off"></div>'); }
  const today = new Date();
  for (let d = 1; d <= days; d++) {
    const list = byDay.get(d) || [];
    const isToday = today.getFullYear() === y && today.getMonth() === m - 1 && today.getDate() === d;
    cells.push(`<div class="zv-day${isToday ? ' today' : ''}"><span class="zv-dn">${d}</span>${list.slice(0, 4).map(r =>
      `<button type="button" class="zv-ev" data-row="${r.key}" title="${esc(evText(r))}">${esc(evText(r))}</button>`).join('')}${list.length > 4 ? `<span class="zv-more">+${list.length - 4} more</span>` : ''}</div>`);
  }
  const prev = new Date(y, m - 2, 1).toISOString().slice(0, 7), next = new Date(y, m, 1).toISOString().slice(0, 7);
  const inMonth = [...byDay.values()].reduce((a, l) => a + l.length, 0);
  return `<div class="zv-opts"><label>Date <select data-v="calBy">${colOptions(cols, st.calBy, c => c.kind === 'date' && !c.skip)}</select></label>
    <span class="zv-month"><button type="button" class="zl-btn" data-cal="${prev}" aria-label="Previous month">‹</button><b>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b><button type="button" class="zl-btn" data-cal="${next}" aria-label="Next month">›</button>
    <button type="button" class="zl-btn" data-cal="${new Date().toISOString().slice(0, 7)}">Today</button></span>
    <span class="zv-muted">${inMonth} in this month · ${rows.length - dated.length} without a date</span></div>
  <div class="zv-cal"><div class="zv-wd">Mon</div><div class="zv-wd">Tue</div><div class="zv-wd">Wed</div><div class="zv-wd">Thu</div><div class="zv-wd">Fri</div><div class="zv-wd">Sat</div><div class="zv-wd">Sun</div>${cells.join('')}</div>`;
}

// ------------------------------------------------------------------ aggregation
function aggregate(rows: VRow[], by: VCol | undefined, measure: VCol | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    const k = keyOf(r, by);
    const v = measure ? (num(r.cells[measure.idx]) ?? 0) : 1;
    out.set(k, (out.get(k) || 0) + v);
  }
  return out;
}

// ------------------------------------------------------------------ Graph (single hue bars / line, value labels)
export function graphHtml(cols: VCol[], rows: VRow[], st: ViewState): string {
  const by = cols.find(c => c.idx === st.graphBy);
  const measure = cols.find(c => c.idx === st.graphMeasure);
  const agg = aggregate(rows, by, measure);
  let data = [...agg.entries()];
  if (by?.kind === 'date') { data.sort((a, b) => a[0].localeCompare(b[0])); } else { data.sort((a, b) => b[1] - a[1]); }
  const other = data.length > 16 && by?.kind !== 'date' ? data.slice(15).reduce((s, x) => s + x[1], 0) : 0;
  if (other) { data = [...data.slice(0, 15), ['Other', other]]; }
  const raw = Math.max(1, ...data.map(d => d[1]));
  // round axis: whole steps for counts
  const step0 = raw / 4, mag = Math.pow(10, Math.floor(Math.log10(step0)));
  let step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(x => x >= step0) || step0;
  if (!measure) { step = Math.max(1, Math.ceil(step)); }
  const max = step * Math.ceil(raw / step);
  const W = 760, H = 300, L = 48, B = 64, T = 16, R = 12;
  const bw = (W - L - R) / Math.max(1, data.length);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks: number[] = []; for (let t = 0; t <= max + 1e-9; t += step) { ticks.push(t); }
  const label = (k: string) => by?.kind === 'date' ? monthName(k) : k;
  const what = measure ? `Total ${measure.label}` : 'Number of records';
  let marks = '';
  if (st.graphType === 'line' && data.length > 1) {
    const pts = data.map((d, i) => `${L + bw * i + bw / 2},${y(d[1])}`).join(' ');
    marks = `<polyline points="${pts}" fill="none" stroke="var(--zl-primary)" stroke-width="2"/>` +
      data.map((d, i) => `<circle cx="${L + bw * i + bw / 2}" cy="${y(d[1])}" r="4" fill="var(--zl-primary)" stroke="#fff" stroke-width="2"><title>${esc(label(d[0]))}: ${fmt(d[1])}</title></circle>`).join('');
  } else {
    marks = data.map((d, i) => {
      const w = Math.min(56, Math.max(4, bw * .64)), x = L + bw * i + (bw - w) / 2, top = y(d[1]);
      const h = Math.max(0, H - B - top);
      return `<path d="M${x},${H - B} V${top + Math.min(4, h)} q0,-4 4,-4 h${w - 8} q4,0 4,4 V${H - B} Z" fill="var(--zl-primary)"><title>${esc(label(d[0]))}: ${fmt(d[1])}</title></path>` +
        (data.length <= 16 ? `<text x="${x + w / 2}" y="${top - 6}" text-anchor="middle" class="zv-val">${fmt(d[1])}</text>` : '');
    }).join('');
  }
  const xl = data.map((d, i) => `<text x="${L + bw * i + bw / 2}" y="${H - B + 14}" text-anchor="end" transform="rotate(-30 ${L + bw * i + bw / 2} ${H - B + 14})" class="zv-ax">${esc(label(d[0]).slice(0, 18))}</text>`).join('');
  const grid = ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" class="zv-grid"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end" class="zv-ax">${fmt(t)}</text>`).join('');
  return `<div class="zv-opts">
    <label>Group by <select data-v="graphBy">${colOptions(cols, st.graphBy, c => (c.facet || c.kind === 'date') && !c.skip)}</select></label>
    <label>Measure <select data-v="graphMeasure">${colOptions(cols, st.graphMeasure, c => c.kind === 'number' && !c.skip, 'Number of records')}</select></label>
    <span class="zv-seg" role="radiogroup" aria-label="Chart type"><button type="button" data-gt="bar" class="${st.graphType !== 'line' ? 'on' : ''}">Bars</button><button type="button" data-gt="line" class="${st.graphType === 'line' ? 'on' : ''}">Line</button></span>
  </div>
  <figure class="zv-graph"><figcaption>${esc(what)} by ${esc(by?.label || '')}</figcaption>
    ${data.length ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(what)} by ${esc(by?.label || '')}">${grid}${marks}${xl}</svg>` : '<p class="zv-muted">No records to chart.</p>'}
  </figure>
  <table class="zv-pivot zv-small" zPlain><thead><tr><th>${esc(by?.label || '')}</th><th class="n">${esc(what)}</th></tr></thead>
    <tbody>${data.map(d => `<tr><td>${esc(label(d[0]))}</td><td class="n">${fmt(d[1])}</td></tr>`).join('')}</tbody></table>`;
}

// ------------------------------------------------------------------ Pivot
export function pivotData(cols: VCol[], rows: VRow[], st: ViewState): { head: string[]; body: string[][] } {
  const rc = cols.find(c => c.idx === st.pivotRows);
  const cc = cols.find(c => c.idx === st.pivotCols);
  const mc = cols.find(c => c.idx === st.pivotMeasure);
  const rk = new Set<string>(), ck = new Set<string>();
  const cell = new Map<string, number>();
  for (const r of rows) {
    const a = keyOf(r, rc), b = cc ? keyOf(r, cc) : 'Total';
    rk.add(a); ck.add(b);
    const v = mc ? (num(r.cells[mc.idx]) ?? 0) : 1;
    cell.set(a + '\u0001' + b, (cell.get(a + '\u0001' + b) || 0) + v);
  }
  const sortK = (c: VCol | undefined, s: Set<string>) => [...s].sort((x, y) => c?.kind === 'date' ? x.localeCompare(y) : x.localeCompare(y, undefined, { numeric: true }));
  const R = sortK(rc, rk), C = sortK(cc, ck);
  const lab = (c: VCol | undefined, k: string) => c?.kind === 'date' ? monthName(k) : k;
  const head = [rc?.label || '', ...C.map(c => lab(cc, c)), ...(cc ? ['Total'] : [])];
  const body = R.map(a => {
    const vals = C.map(b => cell.get(a + '\u0001' + b) || 0);
    return [lab(rc, a), ...vals.map(fmt), ...(cc ? [fmt(vals.reduce((s, v) => s + v, 0))] : [])];
  });
  const totals = C.map(b => R.reduce((s, a) => s + (cell.get(a + '\u0001' + b) || 0), 0));
  body.push(['Total', ...totals.map(fmt), ...(cc ? [fmt(totals.reduce((s, v) => s + v, 0))] : [])]);
  return { head, body };
}

export function pivotHtml(cols: VCol[], rows: VRow[], st: ViewState): string {
  const { head, body } = pivotData(cols, rows, st);
  const mc = cols.find(c => c.idx === st.pivotMeasure);
  return `<div class="zv-opts">
    <label>Rows <select data-v="pivotRows">${colOptions(cols, st.pivotRows, c => (c.facet || c.kind === 'date') && !c.skip)}</select></label>
    <label>Columns <select data-v="pivotCols">${colOptions(cols, st.pivotCols, c => (c.facet || c.kind === 'date') && !c.skip, 'None')}</select></label>
    <label>Measure <select data-v="pivotMeasure">${colOptions(cols, st.pivotMeasure, c => c.kind === 'number' && !c.skip, 'Number of records')}</select></label>
    <span class="zl-grow"></span><button type="button" class="zl-btn" data-pivot-export>Export pivot</button></div>
  <div class="zv-pwrap"><table class="zv-pivot" zPlain aria-label="${esc(mc ? 'Total ' + mc.label : 'Number of records')}">
    <thead><tr>${head.map((h, i) => `<th class="${i ? 'n' : ''}">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${body.map((r, k) => `<tr class="${k === body.length - 1 ? 'tot' : ''}">${r.map((c, i) => `<td class="${i ? 'n' : ''}${i === r.length - 1 && head[head.length - 1] === 'Total' && i ? ' tot' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}
