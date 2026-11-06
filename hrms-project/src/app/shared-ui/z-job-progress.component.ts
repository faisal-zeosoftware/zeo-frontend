import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18N_UI } from './i18n.service';
import { i18nT } from './i18n-core';

/**
 * v1.62.1 – progress of a long company job (create a company, duplicate a company, ZEO Cloud company) in words and in %:
 * what is being done now, a progress bar with the percentage, the steps (done ✓ with seconds / now / waiting), the time it
 * has taken and the time left. [job] is the status the API returns: {state, percent, step, detail, stages, elapsed,
 * remaining, error}. Done and failed states show their own message and buttons.
 */
@Component({
  selector: 'z-job-progress',
  standalone: true,
  imports: [CommonModule, ...I18N_UI],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
<div class="jp" [class.ok]="job?.state === 'done'" [class.bad]="isBad()" [class.compact]="compact" role="status" aria-live="polite">
  <div class="jp-top">
    <div class="jp-ic" aria-hidden="true">
      <span *ngIf="job?.state === 'done'">✓</span><span *ngIf="isBad()">!</span>
      <span *ngIf="job?.state !== 'done' && !isBad()" class="jp-spin"></span>
    </div>
    <div class="jp-head">
      <h3 class="jp-title">{{ heading() }}</h3>
      <p class="jp-now" *ngIf="job?.state !== 'done' && !isBad()">{{ stepText() }}<span *ngIf="job?.detail"> – {{ detailText() }}</span></p>
      <p class="jp-now" *ngIf="job?.state === 'done'">{{ doneText | t }}</p>
      <p class="jp-err" *ngIf="job?.state === 'failed'">{{ job?.error || ('Unknown error.' | t) }}</p>
      <!-- v1.67.2 (signup) the job's process stopped (no beat for 90 s) -->
      <p class="jp-err" *ngIf="job?.state !== 'failed' && job?.stalled">{{ 'The job has stopped responding (the server may have been restarted). It is not moving any more.' | t }}</p>
    </div>
    <div class="jp-pct" *ngIf="job?.state !== 'failed'">{{ pct() }}%</div>
  </div>

  <div class="jp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="pct()" [attr.aria-label]="heading()">
    <div class="jp-fill" [style.width.%]="pct()"></div>
  </div>
  <div class="jp-times">
    <span *ngIf="job?.elapsed !== undefined && job?.elapsed !== null">{{ 'Time taken' | t }}: {{ dur(job.elapsed) }}</span>
    <span *ngIf="job?.state === 'running' && job?.remaining && !job?.stalled">{{ 'About {0} left' | t: [dur(job.remaining)] }}</span>
    <span *ngIf="job?.state === 'running' && !job?.remaining && !job?.stalled && (job?.slow || job?.overdue)">{{ 'Still working – no estimate of the time left' | t }}</span>
  </div>

  <ol class="jp-steps" *ngIf="job?.stages?.length">
    <li *ngFor="let s of job.stages" [class]="'st-' + s.state">
      <span class="jp-dot" aria-hidden="true">{{ s.state === 'done' ? '✓' : (s.state === 'failed' ? '!' : '') }}</span>
      <span class="jp-l">{{ stageLabel(s) }}</span>
      <span class="jp-s" *ngIf="s.state === 'done' && s.seconds !== null">{{ dur(s.seconds) }}</span>
      <span class="jp-s" *ngIf="s.state === 'running' && !job?.stalled">{{ 'In progress' | t }}</span>
      <span class="jp-s" *ngIf="s.state === 'running' && job?.stalled">{{ 'Stopped' | t }}</span>
    </li>
  </ol>

  <p class="jp-note" *ngIf="job?.state !== 'done' && !isBad() && noteText()">{{ noteText() }}</p>
  <div class="jp-foot" *ngIf="job?.state === 'done' || isBad()">
    <ng-content></ng-content>
  </div>
</div>`,
  styles: [`
    :host { display: block; }
    .jp { padding: 20px 22px; border: 1px solid #E3E5EE; border-radius: 12px; background: #fff; color: #1D2033; }
    .jp-top { display: flex; align-items: flex-start; gap: 14px; }
    .jp-ic { flex: 0 0 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: #EEEDFD; color: #5B4FE0; font-weight: 700; font-size: 18px; }
    .jp.ok .jp-ic { background: #E5F4E4; color: #1E7B34; }
    .jp.bad .jp-ic { background: #FCEBEC; color: #C2303C; }
    .jp-spin { width: 20px; height: 20px; border-radius: 50%; border: 3px solid #CFCBF7; border-top-color: #5B4FE0; animation: jp-r .9s linear infinite; }
    @keyframes jp-r { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .jp-spin { animation-duration: 3s; } .jp-fill { transition: none; } }
    .jp-head { flex: 1; min-width: 0; }
    .jp-title { margin: 0; font-size: 17px; font-weight: 650; }
    .jp-now { margin: 4px 0 0; font-size: 13.5px; color: #4A4F66; overflow-wrap: anywhere; }
    .jp-err { margin: 4px 0 0; font-size: 13.5px; color: #C2303C; overflow-wrap: anywhere; }
    .jp-pct { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; color: #5B4FE0; line-height: 40px; }
    .jp.ok .jp-pct { color: #1E7B34; }
    .jp-bar { height: 10px; margin-top: 16px; border-radius: 6px; background: #EEF0F5; overflow: hidden; }
    .jp-fill { height: 100%; border-radius: 6px; background: #5B4FE0; transition: width .6s ease; }
    .jp.ok .jp-fill { background: #2E9B47; }
    .jp.bad .jp-fill { background: #D64550; }
    .jp-times { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; font-size: 12px; color: #6B7085; min-height: 16px; }
    .jp-steps { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 8px; }
    .jp-steps li { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #8A8FA3; }
    .jp-dot { flex: 0 0 20px; height: 20px; border-radius: 50%; border: 2px solid #D5D8E3; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
    .st-done { color: #1D2033; }
    .st-done .jp-dot { background: #2E9B47; border-color: #2E9B47; color: #fff; }
    .st-running { color: #1D2033; font-weight: 600; }
    .st-running .jp-dot { border-color: #5B4FE0; box-shadow: inset 0 0 0 4px #fff; background: #5B4FE0; }
    .st-failed .jp-dot { background: #D64550; border-color: #D64550; color: #fff; }
    .jp-l { flex: 1; min-width: 0; }
    .jp-s { font-size: 12px; color: #6B7085; font-weight: 400; font-variant-numeric: tabular-nums; }
    .jp-note { margin: 14px 0 0; font-size: 12.5px; color: #6B7085; }
    .jp-foot { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 18px; }   /* v1.62.1 wrap: a note line (copied setup) on its own row */
    :host-context([dir=rtl]) .jp-fill { margin-inline-start: auto; }
    .jp.compact { padding: 14px 16px; }
    .jp.compact .jp-ic { flex-basis: 32px; height: 32px; font-size: 15px; }
    .jp.compact .jp-title { font-size: 15px; }
    .jp.compact .jp-pct { font-size: 20px; line-height: 32px; }
    .jp.compact .jp-bar { margin-top: 10px; height: 8px; }
    .jp.compact .jp-steps { margin-top: 10px; gap: 5px; }
    .jp.compact .jp-steps li { font-size: 12.5px; }
    .jp.compact .jp-foot { margin-top: 10px; }
  `]
})
export class ZJobProgressComponent {
  @Input() job: any = null;
  /** e.g. "Creating Golden Dune LLC" */
  @Input() title = '';
  @Input() doneText = 'The company is ready.';
  @Input() note = 'You can leave this window open. Large companies take longer.';
  /** v1.62.1 a smaller card (one per moving company) */
  @Input() compact = false;
  @Output() closed = new EventEmitter<void>();

  /** step_t / step_p (v1.62.1 database jobs: "Copying {0}") – the template is translated, the values too */
  stepText(): string {
    const j = this.job || {};
    if (j.step_t) { return i18nT(j.step_t, (j.step_p || []).map((x: any) => i18nT(String(x)))); }
    return i18nT(j.step || 'Starting');
  }
  stageLabel(s: any): string {
    if (s?.label_t) { return i18nT(s.label_t, (s.label_p || []).map((x: any) => i18nT(String(x)))); }
    return i18nT(s?.label || '');
  }

  /** v1.67.2 (signup) the highest % shown for this job – the bar never goes back (a new job, e.g. a retry, starts again) */
  private hi = 0; private hiKey: any = null;
  pct(): number {
    const p = Number(this.job?.percent);
    if (this.job?.state === 'done') { return 100; }
    const key = this.job?.started ?? this.job?.schema ?? null;
    if (key !== this.hiKey) { this.hiKey = key; this.hi = 0; }
    const v = isFinite(p) ? Math.max(0, Math.min(100, Math.round(p))) : 0;
    this.hi = Math.max(this.hi, v);
    return this.hi;
  }
  /** v1.67.2 (signup) failed, or stopped responding */
  isBad(): boolean { return this.job?.state === 'failed' || !!this.job?.stalled; }
  /** v1.67.2 (signup) the note under the steps: the usual time measured on this server (no fixed "about a minute"),
   *  "taking longer than usual" once that time has clearly passed, else the caller's note. */
  noteText(): string {
    const j = this.job || {};
    const exp = Number(j.expected) || 0;
    const el = Number(j.elapsed) || 0;
    if (exp > 0 && el > Math.max(exp * 1.5, exp + 20)) {
      return i18nT('This is taking longer than usual. You can leave this window open – the work goes on.');
    }
    if (exp > 0) { return i18nT('This usually takes about {0} on this server.', [this.about(exp)]); }
    return this.note ? i18nT(this.note) : '';
  }
  /** a rounded duration for the note: "10 s", "1 min", "3 min" */
  about(sec: number): string {
    const s = Math.max(1, Math.round(sec));
    if (s < 60) { return i18nT('{0} s', [Math.max(5, Math.ceil(s / 5) * 5)]); }
    return i18nT('{0} min', [Math.ceil(s / 60)]);
  }
  /** detail_t / detail_p from the server: the template and its values, both translated here */
  detailText(): string {
    const j = this.job || {};
    if (j.detail_t) { return i18nT(j.detail_t, (j.detail_p || []).map((x: any) => i18nT(String(x)))); }
    return i18nT(j.detail || '');
  }
  heading(): string {
    if (this.job?.state === 'failed') { return i18nT('It could not be completed'); }
    if (this.job?.stalled) { return i18nT('It has stopped'); }   // v1.67.2 (signup)
    return this.title || i18nT('Working…');
  }
  dur(sec: any): string {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    if (s < 60) { return i18nT('{0} s', [s]); }
    return i18nT('{0} min {1} s', [Math.floor(s / 60), s % 60]);
  }
}
