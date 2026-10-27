import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';

/** v1.62.0 reports – the chart above the table of trend / distribution reports (meta `chart` of the report).
 *  spec: { type: 'bar' | 'hbar' | 'funnel', x, series: [col keys], stack?, stackby?: col (one series per value), facet?: col, agg?: 'sum' }
 *  Drawn from the rows the table shows (filters apply). One axis, thin marks, legend for 2+ series, a tooltip on every mark. */
const CAT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const SEQ5 = ['#b7d3f6', '#86b6ef', '#5598e7', '#256abf', '#104281'];

interface Bar { label: string; values: number[]; }
interface Panel { title: string; bars: Bar[]; max: number; }

@Component({
  selector: 'z-report-chart',
  standalone: true,
  imports: [CommonModule, ...I18N_UI],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="zrc" *ngIf="panels.length" data-report-chart>
    <div class="zrc-legend" *ngIf="series.length > 1">
      <span *ngFor="let s of series; let i = index"><i [style.background]="color(i)"></i>{{ s.label }}</span>
    </div>
    <div class="zrc-panels" [class.multi]="panels.length > 1">
      <div class="zrc-panel" *ngFor="let p of panels">
        <div class="zrc-ptitle" *ngIf="panels.length > 1">{{ p.title }}</div>
        <!-- horizontal bars (and the funnel) -->
        <div *ngIf="type !== 'bar'" class="zrc-h">
          <div class="zrc-hrow" *ngFor="let b of p.bars" [title]="tip(b)">
            <span class="zrc-hl">{{ b.label }}</span>
            <span class="zrc-ht">
              <span class="zrc-hstack" [class.stacked]="stack">
                <span *ngFor="let v of b.values; let i = index" class="zrc-hb" [style.width.%]="pct(v, p.max, b)" [style.background]="color(i)"></span>
              </span>
              <b class="zrc-hv">{{ total(b) | number:'1.0-2' }}</b>
            </span>
          </div>
        </div>
        <!-- vertical bars -->
        <div *ngIf="type === 'bar'" class="zrc-v" [style.--n]="p.bars.length">
          <div class="zrc-grid"><span *ngFor="let g of grid(p.max)" [style.bottom.%]="g.at"><em>{{ g.v | number:'1.0-0' }}</em></span></div>
          <div class="zrc-col" *ngFor="let b of p.bars" [title]="tip(b)">
            <span class="zrc-vstack" [class.stacked]="stack">
              <span *ngFor="let v of b.values; let i = index" class="zrc-vb" [style.height.%]="vpct(v, p.max, b)" [style.background]="color(i)"></span>
            </span>
            <span class="zrc-xl">{{ b.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styles: [`
  .zrc { border: 1px solid #eceef4; border-radius: 10px; padding: 12px 16px 10px; margin: 0 0 14px; background: #fcfcfb; }
  .zrc-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: #52514e; margin-bottom: 8px; }
  .zrc-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-inline-end: 6px; vertical-align: -1px; }
  .zrc-panels.multi { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px 28px; }
  .zrc-ptitle { font-size: 12px; font-weight: 600; color: #1d2033; margin-bottom: 6px; }
  .zrc-h { display: grid; gap: 5px; max-height: 260px; overflow-y: auto; }
  .zrc-hrow { display: grid; grid-template-columns: minmax(90px, 200px) 1fr; align-items: center; gap: 10px; font-size: 12px; }
  .zrc-hl { color: #52514e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: end; }
  .zrc-ht { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .zrc-hstack { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .zrc-hstack.stacked { flex-direction: row; gap: 2px; }
  .zrc-hb { display: block; height: 10px; border-radius: 0 4px 4px 0; min-width: 2px; }
  :host-context([dir=rtl]) .zrc-hb { border-radius: 4px 0 0 4px; }
  .zrc-hstack:not(.stacked) .zrc-hb + .zrc-hb { margin-top: 0; }
  .zrc-hv { font-weight: 600; color: #1d2033; font-variant-numeric: tabular-nums; min-width: 44px; }
  .zrc-v { position: relative; display: flex; align-items: flex-end; gap: 6px; height: 190px; padding-block: 0 34px; padding-inline: 34px 0; }
  .zrc-grid { position: absolute; top: 0; bottom: 34px; inset-inline-start: 34px; inset-inline-end: 0; pointer-events: none; }
  .zrc-grid span { position: absolute; inset-inline: 0; border-top: 1px solid #eceef4; }
  .zrc-grid em { position: absolute; inset-inline-start: -34px; top: -8px; width: 30px; text-align: end; font-style: normal; font-size: 10.5px; color: #8a8fa3; }
  .zrc-col { position: relative; flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; min-width: 0; }
  .zrc-vstack { display: flex; align-items: flex-end; justify-content: center; gap: 2px; height: 100%; }
  .zrc-vstack.stacked { flex-direction: column-reverse; align-items: center; justify-content: flex-start; }
  .zrc-vb { display: block; width: 100%; max-width: 22px; border-radius: 4px 4px 0 0; min-height: 0; }
  .zrc-vstack.stacked .zrc-vb { max-width: 34px; border-radius: 0; }
  .zrc-vstack.stacked .zrc-vb:last-child { border-radius: 4px 4px 0 0; }
  .zrc-xl { position: absolute; bottom: -30px; left: 0; right: 0; text-align: center; font-size: 10.5px; color: #6b7185; line-height: 1.2;
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .zrc-col:hover .zrc-vb, .zrc-hrow:hover .zrc-hb { filter: brightness(.9); }`],
})
export class ZReportChartComponent implements OnChanges {
  @Input() spec: any = null;
  @Input() rows: any[] = [];
  @Input() columns: { key: string; label: string; type: string }[] = [];
  panels: Panel[] = [];
  series: { key: string; label: string }[] = [];
  type = 'bar';
  stack = false;
  private seq = false;

  ngOnChanges(): void {
    const s = this.spec;
    this.panels = []; this.series = [];
    if (!s || !this.rows?.length) { return; }
    this.type = s.type || 'bar';
    this.stack = !!s.stack || !!s.stackby;
    const lab = (k: string) => this.columns.find(c => c.key === k)?.label || k;
    const num = (v: any) => (typeof v === 'number' && isFinite(v) ? v : 0);
    if (this.type === 'funnel') {
      this.series = [{ key: 'v', label: '' }];
      const bars = (s.series as string[]).map(k => ({ label: lab(k), values: [this.rows.reduce((a, r) => a + num(r[k]), 0)] }));
      this.panels = [{ title: '', bars, max: Math.max(1, ...bars.map(b => b.values[0])) }];
      return;
    }
    let seriesKeys: string[] = s.series || [];
    let value = (r: any, i: number) => num(r[seriesKeys[i]]);
    if (s.stackby) {   // one series per value of a column (leave type …), measure = series[0]
      const m = seriesKeys[0];
      const vals = Array.from(new Set(this.rows.map(r => String(r[s.stackby] ?? '')).filter(v => v)));
      const tot = new Map<string, number>(); this.rows.forEach(r => tot.set(String(r[s.stackby]), (tot.get(String(r[s.stackby])) || 0) + num(r[m])));
      vals.sort((a, b) => (tot.get(b) || 0) - (tot.get(a) || 0));
      const top = vals.slice(0, 7); const other = vals.length > 7;
      this.series = [...top.map(v => ({ key: v, label: v })), ...(other ? [{ key: '__other', label: i18nT('Other') }] : [])];
      value = (r: any, i: number) => {
        const sv = String(r[s.stackby] ?? '');
        const k = this.series[i].key;
        return (k === '__other' ? !top.includes(sv) : sv === k) ? num(r[m]) : 0;
      };
      seriesKeys = this.series.map(x => x.key);
    } else {
      this.series = seriesKeys.map(k => ({ key: k, label: lab(k) }));
    }
    this.seq = /^r\d$/.test(seriesKeys[0] || '');   // ratings 1–5: one hue, light → dark
    const facets = s.facet ? Array.from(new Set(this.rows.map(r => String(r[s.facet] ?? '')))) : [''];
    this.panels = facets.map(f => {
      const rs = s.facet ? this.rows.filter(r => String(r[s.facet] ?? '') === f) : this.rows;
      const by = new Map<string, number[]>();
      rs.forEach(r => {
        const x = String(r[s.x] ?? '') || '-';
        const cur = by.get(x) || seriesKeys.map(() => 0);
        seriesKeys.forEach((_, i) => cur[i] += value(r, i));
        by.set(x, cur);
      });
      let bars: Bar[] = Array.from(by.entries()).map(([label, values]) => ({ label, values: values.map(v => Math.round(v * 100) / 100) }));
      if (this.type === 'hbar' && !s.facet) { bars.sort((a, b) => this.total(b) - this.total(a)); bars = bars.slice(0, 14); }
      const max = Math.max(1, ...bars.map(b => this.stack ? this.total(b) : Math.max(...b.values)));
      return { title: f, bars, max };
    });
  }

  color(i: number): string { return this.seq ? SEQ5[i % 5] : (this.type === 'funnel' ? CAT[0] : CAT[i % CAT.length]); }
  total(b: Bar): number { return this.stack || b.values.length === 1 ? b.values.reduce((a, v) => a + v, 0) : Math.max(...b.values); }
  pct(v: number, max: number, _b: Bar): number { return max ? Math.max(0, v) / max * 100 : 0; }
  vpct(v: number, max: number, _b: Bar): number { return max ? Math.max(0, v) / max * 100 : 0; }
  tip(b: Bar): string {
    const f = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return this.series.length > 1 ? `${b.label}\n` + this.series.map((s, i) => `${s.label}: ${f(b.values[i])}`).join('\n') : `${b.label}: ${f(b.values[0])}`;
  }
  grid(max: number): { v: number; at: number }[] {
    const step = max >= 2 ? Math.max(1, niceStep(max / 4)) : niceStep(max / 4);   // whole numbers on count axes
    const out = [];
    for (let v = 0; v <= max + 1e-9; v += step) { out.push({ v, at: v / max * 100 }); }
    return out;
  }
}

function niceStep(x: number): number {
  if (x <= 0) { return 1; }
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
