/**
 * v1.47.0 – guided tours: a short walkthrough of a main page the first time the user opens it (a highlight ring around
 * each part and a card that explains it). Nothing on the page is blocked while the tour runs. Done tours are remembered
 * per user (chatter/api/flags 'tour:<id>'); Help → "Take the tour of this page" starts it again; the user can switch the
 * first-visit tours off (flag 'tours').
 */
import { ChangeDetectorRef, Component, HostListener, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, filter } from 'rxjs';
import { I18N_UI, i18nT } from './i18n.service';
import { ZCommandService } from './z-command.service';

export interface TourStep { sel: string; title: string; text: string; }
export interface Tour { id: string; title: string; match: RegExp; steps: TourStep[]; }

const R = /^\/main-sidebar\//;
export const TOURS: Tour[] = [
  { id: 'home', title: 'Welcome to ZEO', match: /^\/main-sidebar\/home(\?|$)/, steps: [
    { sel: 'z-app-launcher .zal-btn', title: 'Your apps', text: 'Switch between HRMS, CRM, Property, Projects and the other apps of your company. The launcher also lists your starred and recent records.' },
    { sel: '[data-cmd=search]', title: 'Search everything', text: 'Find an employee, a record of any app, a page or a report. Press Ctrl+K from anywhere.' },
    { sel: '[data-cmd=quick]', title: 'Create from anywhere', text: 'Add a to-do, request leave or start a new record of any app without leaving the page. Shortcut: N.' },
    { sel: '[routerLink="/main-sidebar/inbox"], button[aria-label="Inbox"]', title: 'Your inbox', text: 'Messages on the records you follow, @mentions, e-mail replies and approvals waiting for you.' },
    { sel: '[data-strip]', title: 'Needs your action', text: 'Only what you must act on today. Each tile opens the rows behind it.' },
    { sel: '[data-cmd=help]', title: 'Help is here', text: "Keyboard shortcuts, what's new in this version and this tour again." },
  ] },
  { id: 'list', title: 'Working with lists', match: /^\/main-sidebar\/zeo-[a-z]+\/r\/[\w-]+(\?|$)/, steps: [
    { sel: '.zl-search', title: 'Search and filter', text: 'Type to search. Pick a suggestion to filter by a field; filters show as chips you can remove.' },
    { sel: '[data-menu=views]', title: 'Saved views', text: 'Save the search, filters, grouping and columns as a view – for you, everyone or a team.' },
    { sel: '[data-menu=columns]', title: 'Columns, totals and colours', text: 'Choose the columns, add a totals row, colour rows by a rule and switch on editing cells with a double-click.' },
    { sel: '.ex-actions .ex-btn.primary', title: 'New record', text: 'Create a record here, or from anywhere with the + button.' },
  ] },
  { id: 'record', title: 'A record', match: /^\/main-sidebar\/zeo-[a-z]+\/r\/[\w-]+\/\d+/, steps: [
    { sel: '.zr-star', title: 'Star it', text: 'Starred records are on your home page and in the app launcher.' },
    { sel: '.zr-fol', title: 'Followers', text: 'Followers get the messages and changes of this record. You follow what you create or are assigned to.' },
    { sel: '.zr-bar', title: 'Notes, messages and activities', text: 'Log a note (with voice or a photo), send a message, plan an activity or set a reminder for yourself. @mention a colleague to tell them.' },
  ] },
  { id: 'employees', title: 'Employees', match: /^\/main-sidebar\/sub-sidebar\/employee-master(\?|$)/, steps: [
    { sel: '.zl-search', title: 'Find people', text: 'Search by name, code, department or any column. Save the result as a view.' },
    { sel: '[data-menu=columns]', title: 'Your columns', text: 'Pick the columns you need and export the list.' },
  ] },
  { id: 'my-team', title: 'My team', match: /^\/main-sidebar\/my-team/, steps: [
    { sel: '.zmt-counts', title: 'Today', text: 'Who is in, late, on leave or not in yet – select a figure to see those people.' },
    { sel: '.zmt-members', title: 'Your people', text: 'Each card shows today, the next leave, expiring documents, goals and the last 1:1. Open 1:1 to plan or write notes.' },
    { sel: '.zmt-side', title: 'Waiting for you', text: 'Approvals, documents to renew, birthdays and anniversaries and the leave coming up.' },
  ] },
  { id: 'setup-guide', title: 'Setup guide', match: /^\/main-sidebar\/settings\/setup-guide/, steps: [   // v1.56.0
    { sel: '.zsg-rail', title: 'Fifteen steps', text: 'From the company to the first payroll. A number in red is what still blocks that step; you can open any step at any time.' },
    { sel: '[data-checks]', title: 'Checked before Next', text: 'Red items stop Next, orange ones are warnings. Each has a link to the screen that fixes it.' },
    { sel: '[data-next]', title: 'Save and continue', text: 'Saves the step and goes on. Close the browser and continue later from the same step.' },
  ] },
  { id: 'pay-calendars', title: 'Pay calendars', match: /^\/main-sidebar\/salary-options\/pay-calendars/, steps: [   // v1.55.0
    { sel: '[data-cal-add]', title: 'A calendar', text: 'Pay some employees weekly, bi-weekly or semi-monthly – the frequencies switched on in Payroll controls.' },
    { sel: '[data-cal]', title: 'Run a period', text: 'Each period is a normal payroll run: approval, payslips, WPS file and accounting.' },
  ] },
  { id: 'hub', title: 'Document expiry hub', match: /^\/main-sidebar\/zeo-hr\/hub/, steps: [   // v1.48.0
    { sel: '.zh-buckets', title: 'What expires when', text: 'Expired, in 30, 60 and 90 days, already in renewal – select a group to see those documents.' },
    { sel: '.zh-filters', title: 'Find and select', text: 'Search an employee or a document, tick the rows and start their renewals in one go. The PRO and the employees are told.' },
  ] },
  { id: 'wall', title: 'Company wall', match: /^\/main-sidebar\/wall/, steps: [
    { sel: '.zw-item', title: 'Celebrate together', text: 'Birthdays, work anniversaries, new joiners and announcements. React or write a wish – the colleague is told.' },
  ] },
];

@Component({
  selector: 'z-tour',
  standalone: true,
  imports: [CommonModule, MatIconModule, ...I18N_UI],
  encapsulation: ViewEncapsulation.None,
  template: `
  <ng-container *ngIf="tour && step">
    <div class="zto-ring" [style.top.px]="box.top" [style.left.px]="box.left" [style.width.px]="box.width" [style.height.px]="box.height" aria-hidden="true"></div>
    <div class="zto-card" role="dialog" aria-live="polite" [attr.aria-label]="tour.title | t" [style.top.px]="card.top" [style.left.px]="card.left" data-tour-card>
      <div class="zto-top"><span class="zto-n">{{ i + 1 }} / {{ steps.length }}</span><span class="zto-tt">{{ tour.title | t }}</span>
        <button type="button" class="zto-x" (click)="finish()" [attr.aria-label]="'Close the tour' | t"><mat-icon>close</mat-icon></button></div>
      <h3>{{ step.title | t }}</h3>
      <p>{{ step.text | t }}</p>
      <div class="zto-acts">
        <button type="button" class="zto-skip" (click)="off()">{{ 'Don\\'t show tours' | t }}</button>
        <span class="zto-grow"></span>
        <button type="button" class="zr-btn sm" *ngIf="i > 0" (click)="go(i - 1)">{{ 'Back' | t }}</button>
        <button type="button" class="zr-btn sm primary" data-tour-next (click)="i + 1 < steps.length ? go(i + 1) : finish()">{{ (i + 1 < steps.length ? 'Next' : 'Done') | t }}</button>
      </div>
    </div>
  </ng-container>
  <div class="zto-none" *ngIf="none" role="status">{{ 'There is no tour for this page yet.' | t }}</div>`,
  styles: [`
  .zto-ring { position: fixed; border-radius: 10px; box-shadow: 0 0 0 3px #5B4FE0, 0 0 0 9px rgba(91, 79, 224, .22); pointer-events: none; z-index: 1290;
              transition: top .25s, left .25s, width .25s, height .25s; }
  .zto-card { position: fixed; width: 320px; max-width: calc(100vw - 24px); background: #1B1640; color: #fff; border-radius: 12px; padding: 12px 14px 12px;
              box-shadow: 0 16px 40px rgba(20, 18, 48, .35); z-index: 1291; font-size: 13.5px; }
  .zto-top { display: flex; align-items: center; gap: 8px; color: #C9C5F5; font-size: 12px; }
  .zto-n { background: rgba(255, 255, 255, .14); border-radius: 10px; padding: 0 7px; }
  .zto-tt { flex: 1; }
  .zto-x { border: 0; background: none; color: #C9C5F5; cursor: pointer; display: flex; padding: 2px; border-radius: 6px; }
  .zto-x mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .zto-card h3 { margin: 6px 0 4px; font-size: 15px; font-weight: 600; }
  .zto-card p { margin: 0 0 10px; line-height: 1.45; color: #E7E5FB; }
  .zto-acts { display: flex; align-items: center; gap: 6px; }
  .zto-grow { flex: 1; }
  .zto-skip { border: 0; background: none; color: #C9C5F5; font: inherit; font-size: 12px; cursor: pointer; padding: 0; text-decoration: underline; }
  .zto-card .zr-btn { background: rgba(255, 255, 255, .12); color: #fff; border-color: transparent; }
  .zto-card .zr-btn.primary { background: #fff; color: #1B1640; }
  .zto-none { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1B1640; color: #fff; padding: 10px 16px; border-radius: 10px; z-index: 1302; }
  `],
})
export class ZTourComponent implements OnInit, OnDestroy {
  tour: Tour | null = null; steps: TourStep[] = []; step: TourStep | null = null; i = 0; none = false;
  box = { top: 0, left: 0, width: 0, height: 0 }; card = { top: 0, left: 0 };
  private subs: Subscription[] = [];
  private timer: any; private el: HTMLElement | null = null;
  private watch: any;   // v1.62.0 – while a tour runs: ends it (not marked done) when a pop-up opens over the page

  constructor(private router: Router, private cmd: ZCommandService, private cd: ChangeDetectorRef, private zone: NgZone) {}

  ngOnInit(): void {
    this.subs.push(this.cmd.cmd$.subscribe(c => { if (c.cmd === 'tour') { this.start(true); } }));
    this.subs.push(this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { this.stop(); this.later(); }));
    this.later();
  }
  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); clearTimeout(this.timer); clearInterval(this.watch); }

  // v1.62.0 release checklist §7 "Close the pop-up any way": the tour card is about the page. When a New / Add or any other pop-up
  // opens over the page, the tour steps aside (it starts again on the next visit – not marked done), so Escape closes that pop-up
  // and no tour card is left over it.
  static readonly MODAL = 'mat-dialog-container, [aria-modal="true"], .ex-modal, .zp-dialog, .zk-dialog, .z-dialog, .modal.show, .hr-modal';
  static modalOpen(): boolean {
    return Array.from(document.querySelectorAll<HTMLElement>(ZTourComponent.MODAL))
      .some(e => !e.closest('[data-tour-card]') && (e.offsetParent !== null || getComputedStyle(e).position === 'fixed') && getComputedStyle(e).display !== 'none');
  }

  private later(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.start(false), 3200); }

  private forUrl(): Tour | null {
    const u = this.router.url;
    if (!R.test(u)) { return null; }
    return TOURS.find(t => t.match.test(u)) || null;
  }

  async start(forced: boolean): Promise<void> {
    const t = this.forUrl();
    if (!t) { if (forced) { this.none = true; this.cd.markForCheck(); setTimeout(() => { this.none = false; this.cd.markForCheck(); }, 3000); } return; }
    if (!forced) {
      const f = await this.cmd.flags();
      if ((f['tours'] && f['tours'].off) || f['tour:' + t.id]) { return; }
      if (document.querySelector('[aria-modal="true"]')) { this.later(); return; }   // e.g. "What's new" is open – try again
    }
    const steps = t.steps.filter(s => this.find(s.sel));
    if (!steps.length) { return; }
    this.tour = t; this.steps = steps; this.go(0);
    clearInterval(this.watch);   // v1.62.0
    this.zone.runOutsideAngular(() => { this.watch = setInterval(() => { if (this.tour && ZTourComponent.modalOpen()) { this.zone.run(() => this.stop()); } }, 400); });
  }

  private find(sel: string): HTMLElement | null {
    for (const s of sel.split(/,\s*(?![^\[]*\])/)) {
      const els = Array.from(document.querySelectorAll(s)) as HTMLElement[];
      const el = els.find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      if (el) { return el; }
    }
    return null;
  }

  go(i: number): void {
    this.i = i; this.step = this.steps[i];
    this.el = this.find(this.step.sel);
    if (this.el) { this.el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    setTimeout(() => this.place(), 60);
    this.cd.markForCheck();
  }

  @HostListener('window:resize') @HostListener('window:scroll')
  place(): void {
    if (!this.step) { return; }
    const el = this.el && document.contains(this.el) ? this.el : this.find(this.step.sel);
    if (!el) { return; }
    const r = el.getBoundingClientRect(), pad = 4, vw = window.innerWidth, vh = window.innerHeight, cw = Math.min(320, vw - 24), ch = 170;
    this.box = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
    let top = r.bottom + 14;
    if (top + ch > vh) { top = Math.max(12, r.top - ch - 14); }
    let left = r.left + r.width / 2 - cw / 2;
    left = Math.max(12, Math.min(left, vw - cw - 12));
    this.card = { top, left };
    this.cd.markForCheck();
  }

  // v1.62.0: a pop-up open over the page gets the Escape (main-sidebar escCloseDialog); the tour just steps aside
  @HostListener('document:keydown.escape') esc(): void { if (this.tour) { if (ZTourComponent.modalOpen()) { this.stop(); } else { this.finish(); } } }

  finish(): void { if (this.tour) { this.cmd.setFlag('tour:' + this.tour.id, { done: new Date().toISOString() }); } this.stop(); }
  off(): void { this.cmd.setFlag('tours', { off: true }); this.finish(); }
  private stop(): void { clearInterval(this.watch); /* v1.62.0 */ this.tour = null; this.step = null; this.steps = []; this.cd.markForCheck(); }
}

