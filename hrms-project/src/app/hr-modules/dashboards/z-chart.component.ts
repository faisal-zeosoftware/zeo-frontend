import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * Small single-series chart (bar or line) in the dashboard style:
 * thin bars (<=24px) with 4px rounded ends, hairline solid grid, values on hover, click = drill.
 */
@Component({
  selector: 'z-chart',
  standalone: true,
  template: `<div class="zc" [style.height.px]="height"><canvas #cv [attr.aria-label]="ariaLabel" role="img"></canvas></div>`,
  styles: [`.zc { position: relative; width: 100%; } canvas { cursor: pointer; }`],
})
export class ZChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('cv') cv!: ElementRef<HTMLCanvasElement>;
  @Input() type: 'bar' | 'line' = 'bar';
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() colors: string[] | null = null;      // per-bar colour (status / emphasis); default = primary
  @Input() color = '#5B4FE0';
  @Input() horizontal = false;
  @Input() height = 220;
  @Input() max: number | null = null;
  @Input() suffix = '';
  @Input() tooltipExtra: string[] | null = null; // extra line per point
  @Input() ariaLabel = 'chart';
  @Output() pick = new EventEmitter<number>();
  private chart?: Chart;
  private sig = '';

  ngAfterViewInit(): void { this.draw(); }
  // parents pass getter arrays (new instances every change detection) – redraw only when the data really changed
  ngOnChanges(): void { if (this.cv) { this.draw(); } }
  ngOnDestroy(): void { this.chart?.destroy(); }

  private draw(): void {
    const sig = JSON.stringify([this.type, this.labels, this.values, this.colors, this.horizontal, this.max, this.tooltipExtra]);
    if (this.chart && sig === this.sig) { return; }
    this.sig = sig;
    this.chart?.destroy();
    const ink = '#6B7185', grid = '#E9EBF2';
    const isBar = this.type === 'bar';
    const suffix = this.suffix;
    const extra = this.tooltipExtra;
    this.chart = new Chart(this.cv.nativeElement, {
      type: this.type,
      data: {
        labels: this.labels,
        datasets: [{
          data: this.values,
          backgroundColor: isBar ? (this.colors || this.color) : this.color + '1A',
          borderColor: this.color,
          borderWidth: isBar ? 0 : 2,
          borderRadius: isBar ? 4 : 0,
          borderSkipped: 'start',
          maxBarThickness: 24,
          barPercentage: 0.7,
          pointRadius: isBar ? 0 : 4,
          pointHoverRadius: 6,
          pointBackgroundColor: this.color,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          fill: !isBar,
          tension: 0.25,
        } as any],
      },
      options: {
        indexAxis: this.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        interaction: { mode: 'index', intersect: false },
        onHover: (e: any, els: any[]) => { (e.native?.target as HTMLElement).style.cursor = els.length ? 'pointer' : 'default'; },
        onClick: (_e: any, els: any[]) => { if (els.length) { this.pick.emit(els[0].index); } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1B1640', padding: 10, displayColors: false,
            titleFont: { weight: 'normal', size: 11 }, bodyFont: { weight: 'bold', size: 13 },
            callbacks: {
              label: (c: any) => `${c.formattedValue}${suffix}`,
              afterLabel: (c: any) => (extra && extra[c.dataIndex]) || '',
            },
          },
        },
        scales: {
          x: { grid: { display: this.horizontal, color: grid, drawTicks: false }, border: { color: this.horizontal ? grid : '#C9CCD8' },
               ticks: { color: ink, font: { size: 11 }, maxRotation: 0, autoSkip: true, padding: 6, precision: 0 }, max: this.horizontal ? (this.max ?? undefined) : undefined, beginAtZero: true },
          y: { grid: { display: !this.horizontal, color: grid, drawTicks: false }, border: { display: false },
               ticks: { color: ink, font: { size: 11 }, padding: 6, precision: 0 }, max: this.horizontal ? undefined : (this.max ?? undefined), beginAtZero: true },
        },
      } as any,
    });
  }
}
