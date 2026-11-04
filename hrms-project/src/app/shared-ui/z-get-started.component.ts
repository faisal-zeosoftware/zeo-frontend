import { ChangeDetectorRef, Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TPipe } from './i18n.service';

export const GUIDE_LINK = '/main-sidebar/settings/setup-guide';

/** a step counts for the setup when it is Completed, or Skipped where the step can be skipped (v1.62.1, same rule as setup_gate.py) */
export function stepOk(s: any): boolean { return s?.status === 'done' || (!!s?.can_skip && s?.status === 'skipped'); }

/** the next step to work on: the first one not completed and not skipped (else the first one not completed) */
export function nextOpen(steps: any[], after = -1): any {
  const list = steps || [];
  return list.find((s: any, i: number) => i > after && !s.status) || (after < 0 ? list.find((s: any) => s.status !== 'done') : null) || null;
}

/**
 * v1.62.1 (user request 2 Nov: "a wizard like Zoho Books") – the "Get started with ZEO" checklist: a purple header band with
 * the progress and the number of pending steps, then one row per step in the 4 stages with a round check, the step name, a
 * Required / Can skip tag, the first item that blocks the step and COMPLETED / SKIPPED / Complete Now on the right.
 * Used by Settings › Setup guide (landing, no ?step) and, while the setup is not finished, at the top of Home.
 * Input: ov = GET /zeo-admin/api/setup-guide/?full=1 (steps with status, open, first), gate = GET …/setup-gate/.
 */
@Component({
  selector: 'z-get-started',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TPipe],
  encapsulation: ViewEncapsulation.None,
  styles: [`
  .zgs-card { --gs-p: #5b4fe0; --gs-p2: #4b3fc4; --gs-ink: #1f2433; --gs-mute: #5d6670; --gs-line: #eceef3; --gs-ok: #1f8a5a;
    background: #fff; border: 1px solid #e4e6ee; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 2px rgba(20, 22, 40, .04); }
  .zgs-band { background: linear-gradient(120deg, #5b4fe0 0%, #6a5cf0 100%); color: #fff; padding: 22px 28px 20px;
    display: flex; gap: 20px 32px; align-items: center; flex-wrap: wrap; }
  .zgs-band-t { flex: 1 1 340px; min-width: 0; }
  .zgs-band h1, .zgs-band h2.zgs-title { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #fff; letter-spacing: -.005em; }
  .zgs-band p { margin: 0; font-size: 13.5px; line-height: 1.45; color: rgba(255, 255, 255, .86); }
  .zgs-gate-line { display: inline-flex; gap: 6px; align-items: center; margin-top: 10px !important; padding: 4px 10px 4px 8px;
    border-radius: 999px; background: rgba(255, 255, 255, .16); color: #fff !important; font-size: 12.5px !important; font-weight: 500; }
  .zgs-gate-line mat-icon { color: #fff !important; font-size: 16px; width: 16px; height: 16px; }
  .zgs-copied { margin-inline-end: 8px; }
  .zgs-prog { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; min-width: 220px; }
  .zgs-prog-row { display: flex; align-items: center; gap: 14px; }
  .zgs-meter { width: 170px; height: 7px; border-radius: 999px; background: rgba(255, 255, 255, .28); overflow: hidden; }
  .zgs-meter i { display: block; height: 100%; border-radius: 999px; background: #fff; min-width: 7px; transition: width .3s ease; }
  .zgs-count { font-size: 15px; font-weight: 600; white-space: nowrap; }
  .zgs-pend { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: #fff; white-space: nowrap;
    background: rgba(255, 255, 255, .16); border-radius: 999px; padding: 3px 10px 3px 8px; }
  .zgs-pend::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #ffc857; }
  .zgs-pend.none::before { background: #7ee2b0; }
  .zgs-go { display: inline-flex; align-items: center; gap: 4px; background: #fff; color: var(--gs-p2) !important; border-radius: 8px; padding: 7px 14px;
    font-size: 13px; font-weight: 600; text-decoration: none; }
  .zgs-go:hover { background: #f1efff; } .zgs-go mat-icon { color: #4b3fc4 !important; }
  .zgs-tools { display: flex; align-items: center; gap: 12px; padding: 14px 28px 0; flex-wrap: wrap; }
  .zgs-tools .grow { flex: 1; }
  .zgs-next { font-size: 13px; color: var(--gs-mute); }
  .zgs-next b { color: var(--gs-ink); font-weight: 600; }
  .zgs-seg { display: inline-flex; border: 1px solid #dfe2ea; border-radius: 9px; padding: 2px; background: #f6f7fa; }
  .zgs-seg button { border: 0; background: none; font: inherit; font-size: 12.5px; color: var(--gs-mute); padding: 5px 12px; border-radius: 7px; cursor: pointer; }
  .zgs-seg button[aria-pressed=true] { background: #fff; color: var(--gs-ink); font-weight: 600; box-shadow: 0 1px 2px rgba(20, 22, 40, .1); }
  .zgs-grp { display: flex; align-items: baseline; gap: 8px; margin: 0; padding: 20px 28px 6px; font-size: 11.5px; font-weight: 600;
    letter-spacing: .07em; text-transform: uppercase; color: #6b7185; }
  .zgs-grp span { font-weight: 500; letter-spacing: 0; color: #9aa1ad; }
  .zgs-rows { list-style: none; margin: 0; padding: 0 28px; }
  .zgs-row { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 0; min-height: 40px;
    border-top: 1px solid var(--gs-line); cursor: pointer; }
  .zgs-rows .zgs-row:first-child { border-top: 0; }
  .zgs-row:hover .zgs-name b { color: var(--gs-p2); }
  .zgs-chk { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
    background: #f3f4f7; border: 1.5px solid #d9dde5; color: #9ea6b3 !important; box-sizing: border-box; }
  .zgs-chk mat-icon { color: inherit !important; }
  .zgs-chk mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .zgs-row.done .zgs-chk { background: #2e9d6a; border-color: #2e9d6a; color: #fff !important; }
  .zgs-row.skipped .zgs-chk { background: #f3f4f7; border-style: dashed; color: #7d8590 !important; }
  .zgs-body { min-width: 0; }
  .zgs-name { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 2px 8px; color: var(--gs-ink); text-decoration: none; font-size: 15px; line-height: 1.35; border-radius: 4px; }
  .zgs-name b { font-weight: 600; transition: color .12s; }
  .zgs-name .zgs-sub { color: var(--gs-mute); }
  .zgs-name mat-icon.zgs-chev { font-size: 18px; width: 18px; height: 18px; color: #9aa1ad !important; margin-inline-start: -4px; }
  .zgs-row.done .zgs-name b { color: #3c4450; font-weight: 500; } .zgs-row.done .zgs-name .zgs-sub { color: #7d8590; }
  .zgs-tag { font-size: 10.5px; font-weight: 600; letter-spacing: .03em; border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
  .zgs-tag.req { background: #f0eefe; color: #4b3fc4; } .zgs-tag.skip { background: #f1f3f5; color: #5d6670; }
  .zgs-row.done .zgs-tag { opacity: .7; }
  .zgs-miss { display: flex; align-items: flex-start; gap: 5px; margin: 5px 0 0; font-size: 12.5px; line-height: 1.4; color: #b42318; }
  .zgs-miss mat-icon { color: #b42318 !important; font-size: 15px; width: 15px; height: 15px; margin-top: 1px; flex: none; }
  .zgs-miss em { font-style: normal; color: #8a5a55; white-space: nowrap; }
  .zgs-act { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
  .zgs-done { font-size: 12px; font-weight: 600; letter-spacing: .08em; color: var(--gs-ok); }
  .zgs-skipped { font-size: 12px; font-weight: 600; letter-spacing: .08em; color: #7d8590; }
  .zgs-link { font-size: 12.5px; color: var(--gs-p2); text-decoration: none; font-weight: 500; border-radius: 4px; }
  .zgs-link:hover { text-decoration: underline; }
  .zgs-btn { display: inline-flex; align-items: center; justify-content: center; background: #efedfd; color: var(--gs-p2); border: 1px solid transparent;
    border-radius: 8px; padding: 8px 16px; font-size: 13.5px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background .12s; }
  .zgs-btn:hover { background: #e2defc; }
  .zgs-card a:focus-visible, .zgs-card button:focus-visible { outline: 2px solid var(--gs-p); outline-offset: 2px; }
  .zgs-band a:focus-visible, .zgs-band button:focus-visible { outline-color: #fff; }
  .zgs-empty { padding: 28px; text-align: center; color: var(--gs-mute); font-size: 13.5px; }
  .zgs-empty mat-icon { color: #2e9d6a; vertical-align: middle; margin-inline-end: 6px; }
  .zgs-foot { height: 12px; }
  @media (max-width: 640px) {
    .zgs-band { padding: 18px 16px; } .zgs-band h1, .zgs-band h2.zgs-title { font-size: 18px; }
    .zgs-prog { align-items: flex-start; min-width: 0; width: 100%; } .zgs-meter { flex: 1; width: auto; } .zgs-prog-row { width: 100%; }
    .zgs-tools, .zgs-grp { padding-inline: 16px; } .zgs-rows { padding: 0 16px; }
    .zgs-row { grid-template-columns: 28px minmax(0, 1fr); gap: 8px 12px; align-items: start; padding: 14px 0; }
    .zgs-chk { width: 28px; height: 28px; }
    .zgs-name { font-size: 14.5px; }
    .zgs-act { grid-column: 2; justify-content: flex-start; }
  }`],
  template: `
<section class="zgs-card" *ngIf="ov" data-get-started [attr.data-home]="home ? '' : null">
  <header class="zgs-band" data-gs-band>
    <div class="zgs-band-t">
      <h1 *ngIf="!home">{{ 'Get started with ZEO' | t }}</h1>
      <h2 *ngIf="home" class="zgs-title">{{ 'Get started with ZEO' | t }}</h2>
      <p>{{ 'Complete these steps once – then your team can start leave, attendance and payroll' | t }}</p>
      <p class="zgs-gate-line" *ngIf="gate?.enforced && gate?.blocked" data-gs-gate-line data-setup-gate-banner>
        <mat-icon>lock_clock</mat-icon>{{ (gate.count === 1 ? '1 step left before HR transactions open' : '{0} steps left before HR transactions open') | t:[gate.count] }}</p>
      <!-- v1.62.1 (user request 2 Nov): the company started with the setup of a branch of another company -->
      <p class="zgs-gate-line zgs-copied" *ngIf="ov?.copied_from?.source" data-gs-copied>
        <mat-icon>content_copy</mat-icon>{{ 'Setup copied from {0} – {1}' | t:[ov.copied_from.source, ov.copied_from.branch] }}</p>
    </div>
    <div class="zgs-prog">
      <div class="zgs-prog-row">
        <div class="zgs-meter" role="progressbar" [attr.aria-valuenow]="done()" aria-valuemin="0" [attr.aria-valuemax]="total()"
             [attr.aria-label]="'Setup progress' | t"><i [style.width.%]="done() / total() * 100"></i></div>
        <span class="zgs-count" data-gs-count>{{ '{0}/{1} completed' | t:[done(), total()] }}</span>
      </div>
      <span class="zgs-pend" [class.none]="!pending()" data-gs-pending>{{ (pending() === 1 ? '1 step pending' : pending() ? '{0} steps pending' : 'Nothing pending') | t:[pending()] }}</span>
      <a class="zgs-go" *ngIf="home && nxt" [routerLink]="link" [queryParams]="{ step: nxt.key }" data-gs-continue data-setup-gate-continue>
        {{ 'Continue' | t }}<mat-icon class="zgs-chev" style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon></a>
    </div>
  </header>

  <div class="zgs-tools">
    <span class="zgs-next" *ngIf="nxt" data-gs-next>{{ 'Next' | t }}: <b>{{ nxt.name }} – {{ nxt.title }}</b></span>
    <span class="grow"></span>
    <div class="zgs-seg" role="group" [attr.aria-label]="'Show' | t">
      <button type="button" [attr.aria-pressed]="!only" (click)="only = false" data-gs-filter="all">{{ 'All ({0})' | t:[total()] }}</button>
      <button type="button" [attr.aria-pressed]="only" (click)="only = true" data-gs-filter="pending">{{ 'Pending ({0})' | t:[pending()] }}</button>
    </div>
  </div>

  <ng-container *ngFor="let g of groups(); trackBy: byStage">
    <h3 class="zgs-grp" data-gs-group>{{ g.stage }} <span>{{ g.done }}/{{ g.steps.length }}</span></h3>
    <ul class="zgs-rows">
      <li class="zgs-row" *ngFor="let s of g.shown; trackBy: byKey" [class.done]="s.status === 'done'" [class.skipped]="s.status === 'skipped'"
          [attr.data-row]="s.key" [attr.data-status]="s.status || 'open'" (click)="rowClick($event)">
        <span class="zgs-chk" aria-hidden="true"><mat-icon>{{ s.status === 'skipped' ? 'redo' : 'check' }}</mat-icon></span>
        <div class="zgs-body">
          <a class="zgs-name" [routerLink]="link" [queryParams]="{ step: s.key }" (click)="$event.stopPropagation()" data-row-open>
            <b>{{ s.name }}</b><span class="zgs-sub">– {{ s.title }}</span><mat-icon class="zgs-chev">chevron_right</mat-icon>
            <span class="zgs-tag" [class.req]="!s.can_skip" [class.skip]="s.can_skip" data-gs-tag>{{ (s.can_skip ? 'Can skip' : 'Required') | t }}</span></a>
          <p class="zgs-miss" *ngIf="s.status !== 'done' && s.first" data-gs-miss><mat-icon>error_outline</mat-icon>
            <span>{{ s.first }}<em *ngIf="(s.open || 0) > 1"> · {{ '+{0} more' | t:[s.open - 1] }}</em></span></p>
        </div>
        <div class="zgs-act">
          <span class="zgs-done" *ngIf="s.status === 'done'" data-gs-state="done">{{ 'COMPLETED' | t }}</span>
          <ng-container *ngIf="s.status === 'skipped'"><span class="zgs-skipped" data-gs-state="skipped">{{ 'SKIPPED' | t }}</span>
            <a class="zgs-link" [routerLink]="link" [queryParams]="{ step: s.key }" (click)="$event.stopPropagation()" data-gs-complete>{{ 'Complete now' | t }}</a></ng-container>
          <a class="zgs-btn" *ngIf="!s.status" [routerLink]="link" [queryParams]="{ step: s.key }" (click)="$event.stopPropagation()"
             data-gs-state="open" data-gs-complete>{{ 'Complete Now' | t }}</a>
        </div>
      </li>
    </ul>
  </ng-container>
  <p class="zgs-empty" *ngIf="only && !pending()" data-gs-empty><mat-icon>task_alt</mat-icon>{{ 'Every step is completed.' | t }}</p>
  <div class="zgs-foot"></div>
</section>`,
})
export class ZGetStartedComponent {
  @Input() ov: any = null;
  @Input() gate: any = null;
  @Input() home = false;
  only = false;
  readonly link = GUIDE_LINK;
  constructor(private cd: ChangeDetectorRef) {}

  get nxt(): any { return nextOpen(this.ov?.steps || []); }
  total(): number { return this.ov?.total || (this.ov?.steps || []).length || 15; }
  done(): number { return (this.ov?.steps || []).filter((s: any) => s.status === 'done').length; }
  /** every row that is not COMPLETED (skipped rows too – they stay on the list) */
  pending(): number { return (this.ov?.steps || []).filter((s: any) => s.status !== 'done').length; }

  byStage = (_i: number, g: any) => g.stage;
  byKey = (_i: number, s: any) => s.key;
  private memo: { ov: any; only: boolean; out: any[] } | null = null;

  /** the 4 stages with their rows; the same arrays while the data and the filter stay the same, so the rows are not rebuilt
   *  between the mouse-down and the click of a row */
  groups(): { stage: string; steps: any[]; shown: any[]; done: number }[] {
    if (this.memo && this.memo.ov === this.ov && this.memo.only === this.only) { return this.memo.out; }
    const out: { stage: string; steps: any[]; shown: any[]; done: number }[] = [];
    for (const s of this.ov?.steps || []) {
      let g = out.find(x => x.stage === s.stage);
      if (!g) { g = { stage: s.stage, steps: [], shown: [], done: 0 }; out.push(g); }
      g.steps.push(s);
      if (s.status === 'done') { g.done++; }
      if (!this.only || s.status !== 'done') { g.shown.push(s); }
    }
    const res = out.filter(g => g.shown.length);
    this.memo = { ov: this.ov, only: this.only, out: res };
    return res;
  }

  /** a click anywhere on the row opens the step through the row's own link (same as clicking the name) */
  rowClick(ev: Event): void {
    const t = ev.target as HTMLElement | null;
    if (t?.closest('a, button')) { return; }   // the name, Complete Now and Complete now open the step themselves
    const a = t?.closest('[data-row]')?.querySelector<HTMLAnchorElement>('a[data-row-open]');
    // after this click has finished: a navigation started inside it is replaced by the layout's own handling of the same click
    if (a) { setTimeout(() => a.click(), 0); }
  }
}
