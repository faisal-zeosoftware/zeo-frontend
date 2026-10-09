import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CeoSeries { name: string; color: string; values: number[]; }

/**
 * Small SVG chart for the executive dashboard (no chart library):
 * - 'bar'   : one or two series side by side (thin bars, 4px rounded tops, 2px gap)
 * - 'stack' : stacked bars (segments separated by a 2px surface gap)
 * - 'line'  : one series, 2px line with 8px markers and a light area
 * One y-axis, recessive grid, hover = per-column tooltip, click a column = drill.
 */
@Component({
  selector: 'ceo-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="cc" (mouseleave)="hover = -1">
    <ul class="cc-legend" *ngIf="series.length > 1">
      <li *ngFor="let s of series"><i [style.background]="s.color"></i>{{ s.name }}</li>
    </ul>
    <div class="plot">
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel" [style.height.px]="height">
      <g class="grid">
        <ng-container *ngFor="let t of ticks">
          <line [attr.x1]="padL" [attr.x2]="W - padR" [attr.y1]="y(t)" [attr.y2]="y(t)"></line>
        </ng-container>
      </g>
      <!-- line -->
      <ng-container *ngIf="type === 'line' && series[0] as s">
        <path [attr.d]="areaPath" [attr.fill]="s.color" fill-opacity="0.08"></path>
        <path [attr.d]="linePath" [attr.stroke]="s.color" stroke-width="2" fill="none" vector-effect="non-scaling-stroke"></path>
      </ng-container>
      <!-- bars -->
      <ng-container *ngIf="type !== 'line'">
        <ng-container *ngFor="let col of cols; let i = index">
          <rect *ngFor="let r of col" [attr.x]="r.x" [attr.y]="r.y" [attr.width]="r.w" [attr.height]="r.h" [attr.fill]="r.color"
                [attr.rx]="r.round ? 3 : 0" [class.dim]="hover >= 0 && hover !== i"></rect>
        </ng-container>
      </ng-container>
      <!-- hit areas -->
      <rect *ngFor="let l of labels; let i = index" class="hit" [attr.x]="padL + i * step" y="0" [attr.width]="step" [attr.height]="H - padB"
            (mouseenter)="hover = i" (click)="pick.emit(i)"></rect>
    </svg>
    <!-- markers drawn in HTML so they stay round when the svg stretches -->
    <ng-container *ngIf="type === 'line' && series[0] as s">
      <span class="dot" *ngFor="let v of s.values; let i = index" [style.left.%]="xPct(i)" [style.top.px]="yPx(v)" [style.borderColor]="s.color"
            [class.on]="hover === i"></span>
    </ng-container>
    <div class="cc-x">
      <span *ngFor="let l of labels; let i = index" [style.left.%]="xPct(i)" [class.hide]="labels.length > 8 && i % 2 === 1 && i !== labels.length - 1">{{ l }}</span>
    </div>
    <div class="tip" *ngIf="hover >= 0" [style.left.%]="xPct(hover)" [class.right]="xPct(hover) > 65">
      <b>{{ labels[hover] }}</b>
      <div *ngFor="let s of series"><i [style.background]="s.color"></i>{{ s.name }} <b>{{ fmt(s.values[hover], true) }}{{ suffix }}</b></div>
      <div *ngIf="extra && extra[hover]" class="tx">{{ extra[hover] }}</div>
      <div class="tx">Select to open the report</div>
    </div>
    <div class="cc-y"><span *ngFor="let t of ticks" [style.top.px]="yPx(t)">{{ fmt(t) }}</span></div>
    </div>
  </div>`,
  styles: [`
    :host { display: block; }
    .cc { position: relative; padding-left: 44px; }
    .plot { position: relative; }
    .cc-legend { list-style: none; display: flex; gap: 14px; margin: 0 0 6px; padding: 0; font-size: 12px; color: #4A4F63; flex-wrap: wrap; }
    .cc-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
    svg { width: 100%; display: block; overflow: visible; }
    .grid line { stroke: #E9EBF2; stroke-width: 1; vector-effect: non-scaling-stroke; }
    rect.dim { opacity: .45; }
    rect.hit { fill: transparent; cursor: pointer; }
    .dot { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: #fff; border: 2px solid; pointer-events: none; }
    .dot.on { width: 10px; height: 10px; margin: -5px 0 0 -5px; }
    .cc-x { position: relative; height: 18px; margin-top: 4px; }
    .cc-x span { position: absolute; transform: translateX(-50%); font-size: 11px; color: #6B7185; white-space: nowrap; }
    .cc-x span.hide { visibility: hidden; }
    .cc-y { position: absolute; left: -44px; top: 0; width: 40px; }
    .cc-y span { position: absolute; right: 0; transform: translateY(-50%); font-size: 10.5px; color: #8A8FA3; }
    .tip { position: absolute; top: 0; transform: translateX(-30%); background: #1B1640; color: #fff; border-radius: 8px; padding: 8px 10px;
           font-size: 12px; pointer-events: none; z-index: 3; min-width: 150px; box-shadow: 0 6px 18px rgba(27,22,64,.25); }
    .tip.right { transform: translateX(-85%); }
    .tip i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; }
    .tip .tx { color: #C9C6F5; font-size: 11px; margin-top: 2px; }
    .tip b { font-weight: 600; }
    @media (prefers-reduced-motion: no-preference) { rect { transition: opacity .12s; } }
  `],
})
export class CeoChartComponent implements OnChanges {
  @Input() type: 'bar' | 'stack' | 'line' = 'bar';
  @Input() labels: string[] = [];
  @Input() series: CeoSeries[] = [];
  @Input() height = 180;
  @Input() suffix = '';
  @Input() money = false;
  @Input() extra: string[] | null = null;
  @Input() ariaLabel = 'chart';
  @Output() pick = new EventEmitter<number>();

  readonly W = 600;
  readonly padL = 0; readonly padR = 0; readonly padB = 2;
  get H(): number { return this.height; }
  hover = -1;
  max = 1;
  ticks: number[] = [];
  cols: { x: number; y: number; w: number; h: number; color: string; round: boolean }[][] = [];
  linePath = ''; areaPath = '';

  get step(): number { return (this.W - this.padL - this.padR) / Math.max(1, this.labels.length); }

  ngOnChanges(): void { this.layout(); }

  private niceMax(v: number): number {
    if (v <= 0) { return 1; }
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  y(v: number): number { return this.H - this.padB - (v / this.max) * (this.H - this.padB - 6); }
  yPx(v: number): number { return this.y(v) * (this.height / this.H); }
  xPct(i: number): number { return ((this.padL + (i + 0.5) * this.step) / this.W) * 100; }

  fmt(v: number, full = false): string {
    if (v === null || v === undefined || isNaN(v)) { return '–'; }
    if (!full && Math.abs(v) >= 1e6) { return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; }
    if (!full && Math.abs(v) >= 1e3) { return (v / 1e3).toFixed(0) + 'k'; }
    return v.toLocaleString('en-US', { maximumFractionDigits: full && this.money ? 0 : 1 });
  }

  private layout(): void {
    const n = this.labels.length;
    const sums = this.labels.map((_, i) => this.type === 'stack'
      ? this.series.reduce((a, s) => a + Math.max(0, s.values[i] || 0), 0)
      : Math.max(0, ...this.series.map(s => s.values[i] || 0)));
    this.max = this.niceMax(Math.max(0, ...sums));
    this.ticks = [0, this.max / 2, this.max];
    const step = this.step;
    this.cols = [];
    if (this.type === 'line') {
      const s = this.series[0];
      if (!s) { return; }
      const pts = s.values.map((v, i) => [this.padL + (i + 0.5) * step, this.y(v || 0)]);
      this.linePath = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      this.areaPath = pts.length ? this.linePath + ` L${pts[pts.length - 1][0].toFixed(1)} ${this.y(0)} L${pts[0][0].toFixed(1)} ${this.y(0)} Z` : '';
      return;
    }
    const k = this.type === 'stack' ? 1 : this.series.length;
    const bw = Math.min(26, (step * 0.62) / k);
    for (let i = 0; i < n; i++) {
      const col: any[] = [];
      const x0 = this.padL + i * step + (step - bw * k - (k - 1) * 2) / 2;
      if (this.type === 'stack') {
        let acc = 0;
        const last = this.series.map((s, j) => (s.values[i] || 0) > 0 ? j : -1).reduce((a, b) => Math.max(a, b), -1);
        this.series.forEach((s, j) => {
          const v = Math.max(0, s.values[i] || 0);
          if (!v) { return; }
          const top = this.y(acc + v), bottom = this.y(acc);
          col.push({ x: x0, y: top + (acc ? 0 : 0), w: bw, h: Math.max(0, bottom - top - (acc ? 2 : 0)), color: s.color, round: j === last });
          acc += v;
        });
      } else {
        this.series.forEach((s, j) => {
          const v = Math.max(0, s.values[i] || 0);
          const top = this.y(v);
          col.push({ x: x0 + j * (bw + 2), y: top, w: bw, h: Math.max(v ? 1 : 0, this.y(0) - top), color: s.color, round: true });
        });
      }
      this.cols.push(col);
    }
  }
}
