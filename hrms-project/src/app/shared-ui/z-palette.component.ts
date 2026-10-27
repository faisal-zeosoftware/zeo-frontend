/**
 * v1.47.0 – the command palette of the shell (one instance in the main layout):
 *  - Ctrl+K / "/" : global search – pages and reports of the menu, employees and the records of every active app
 *    (server: chatter/api/search, with the user's rights), plus commands (go to the inbox, My team, the wall …);
 *  - "+" / N      : quick create – a to-do or a leave request right here, or a new record of any app (its form opens);
 *  - "?"          : the keyboard shortcuts;  G then H / I / T / M / W / S : go to Home, Inbox, To-do, My team, Wall, Settings.
 */
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { MAIN_GROUPS, menuPicked } from './menu-config';
import { appLanding, suiteForUrl, suiteOfApp, visibleSections } from './z-module-menu.component';
import { ZListService } from './z-list.service';
import { CountryPackService } from './country-pack.service';
import { I18N_UI, i18nT } from './i18n.service';
import { ZSuiteService } from './z-suite.service';
import { ZRecordService } from './z-record.service';
import { ZCommandService, typingIn } from './z-command.service';

interface Hit { group: string; title: string; sub?: string; icon: string; link?: string; run?: () => void; photo?: string | null; kind: string; }

const MS = '/main-sidebar/';
export const SHORTCUTS: { keys: string[]; what: string }[] = [
  { keys: ['Ctrl', 'K'], what: 'Search everything' },
  { keys: ['/'], what: 'Search everything' },
  { keys: ['N'], what: 'Create something (quick create)' },
  { keys: ['?'], what: 'Show these shortcuts' },
  { keys: ['G', 'H'], what: 'Go to Home' },
  { keys: ['G', 'I'], what: 'Go to the Inbox' },
  { keys: ['G', 'T'], what: 'Go to My To-do' },
  { keys: ['G', 'M'], what: 'Go to My team' },
  { keys: ['G', 'W'], what: 'Go to the company wall' },
  { keys: ['G', 'S'], what: 'Go to Settings' },
  { keys: ['Esc'], what: 'Close a window or panel' },
  { keys: ['↑', '↓', 'Enter'], what: 'Move in the search results and open one' },
];

@Component({
  selector: 'z-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ...I18N_UI],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zp-back" *ngIf="mode" (click)="close()"></div>
  <!-- search -->
  <div class="zp-box" *ngIf="mode === 'search'" role="dialog" aria-modal="true" [attr.aria-label]="'Search everything' | t" (click)="$event.stopPropagation()">
    <div class="zp-in">
      <mat-icon aria-hidden="true">search</mat-icon>
      <input #q type="search" [(ngModel)]="query" (ngModelChange)="typed()" (keydown)="nav($event)" autocomplete="off"
             [placeholder]="'Search employees, records, pages and reports…' | t" [attr.aria-label]="'Search' | t" aria-controls="zp-list"
             [attr.aria-activedescendant]="hits.length ? 'zp-h' + sel : null">
      <span class="zp-busy" *ngIf="busy" aria-hidden="true"></span>
      <kbd>Esc</kbd>
    </div>
    <div class="zp-list" id="zp-list" role="listbox" #list>
      <ng-container *ngFor="let h of hits; let i = index">
        <div class="zp-g" *ngIf="i === 0 || hits[i - 1].group !== h.group">{{ h.group | t }}</div>
        <button type="button" role="option" class="zp-h" [id]="'zp-h' + i" [class.on]="i === sel" [attr.aria-selected]="i === sel"
                [attr.data-kind]="h.kind" (mouseenter)="sel = i" (click)="pick(h)">
          <img *ngIf="h.photo" [src]="h.photo" alt="" class="zp-ph">
          <mat-icon *ngIf="!h.photo" aria-hidden="true">{{ h.icon }}</mat-icon>
          <span class="zp-t"><b>{{ h.title }}</b><small *ngIf="h.sub">{{ h.sub }}</small></span>
          <mat-icon class="zp-go" aria-hidden="true">{{ h.run ? 'bolt' : 'subdirectory_arrow_left' }}</mat-icon>
        </button>
      </ng-container>
      <p class="zp-none" *ngIf="!hits.length && !busy && query.trim().length >= 2">{{ 'Nothing found for "{0}".' | t:query.trim() }}</p>
    </div>
    <div class="zp-foot"><span><kbd>↑</kbd><kbd>↓</kbd> {{ 'to move' | t }}</span><span><kbd>Enter</kbd> {{ 'to open' | t }}</span>
      <button type="button" class="zp-link" (click)="show('keys')">{{ 'All shortcuts' | t }} <kbd>?</kbd></button></div>
  </div>

  <!-- quick create -->
  <div class="zp-box zp-qc" *ngIf="mode === 'quick'" role="dialog" aria-modal="true" [attr.aria-label]="'Create' | t" (click)="$event.stopPropagation()">
    <header class="zp-hd"><mat-icon aria-hidden="true">add_circle</mat-icon><h2>{{ form ? (formTitle | t) : ('Create' | t) }}</h2><span class="zp-grow"></span>
      <button type="button" class="zp-x" (click)="form ? (form = null) : close()" [attr.aria-label]="(form ? 'Back' : 'Close') | t">
        <mat-icon>{{ form ? 'arrow_back' : 'close' }}</mat-icon></button></header>
    <ng-container *ngIf="!form">
      <div class="zp-quick">
        <button type="button" class="zp-qi" data-quick="todo" (click)="openForm('todo')"><mat-icon>task_alt</mat-icon><b>{{ 'To-do' | t }}</b><small>{{ 'For you or a colleague' | t }}</small></button>
        <button type="button" class="zp-qi" data-quick="leave" *ngIf="quick?.employee_id" (click)="openForm('leave')"><mat-icon>beach_access</mat-icon><b>{{ 'Leave request' | t }}</b><small>{{ 'Sent to your manager' | t }}</small></button>
        <button type="button" class="zp-qi" data-quick="claim" *ngIf="quick?.employee_id" (click)="go(ms + 'self-service/claims')"><mat-icon>request_quote</mat-icon><b>{{ 'Claim or request' | t }}</b><small>{{ 'Expense, letter, document…' | t }}</small></button>
      </div>
      <div class="zp-in sm" *ngIf="quick?.records?.length">
        <mat-icon aria-hidden="true">filter_list</mat-icon>
        <input type="search" [(ngModel)]="qf" (ngModelChange)="regroup()" [placeholder]="'New record of an app – type to filter' | t" [attr.aria-label]="'Filter' | t" (keydown.enter)="firstRec()">
      </div>
      <div class="zp-recs">
        <ng-container *ngFor="let a of recGroups">
          <div class="zp-g">{{ a.app }}</div>
          <button type="button" class="zp-rec" *ngFor="let r of a.rows" [attr.data-new]="r.kind" (click)="go(r.page + '?new=1')"><mat-icon aria-hidden="true">add</mat-icon>{{ r.label }}</button>
        </ng-container>
      </div>
    </ng-container>
    <!-- to-do -->
    <form class="zp-form" *ngIf="form === 'todo'" (ngSubmit)="saveTodo()">
      <label>{{ 'What is to be done' | t }}<input name="s" [(ngModel)]="f.summary" required maxlength="255" #first></label>
      <div class="zp-row">
        <label>{{ 'Due' | t }}<input type="date" name="d" [(ngModel)]="f.due_date"></label>
        <label>{{ 'For' | t }}<select name="a" [(ngModel)]="f.assigned_to"><option value="">{{ 'Me' | t }}</option>
          <option *ngFor="let u of users" [value]="u.id">{{ u.name }}</option></select></label>
      </div>
      <label>{{ 'Note' | t }}<textarea name="n" rows="3" [(ngModel)]="f.note"></textarea></label>
      <p class="zp-err" *ngIf="err" role="alert">{{ err }}</p>
      <div class="zp-acts"><button type="button" class="zr-btn" (click)="form = null">{{ 'Cancel' | t }}</button>
        <button type="submit" class="zr-btn primary" [disabled]="saving">{{ 'Add to-do' | t }}</button></div>
    </form>
    <!-- leave -->
    <form class="zp-form" *ngIf="form === 'leave'" (ngSubmit)="saveLeave()">
      <label>{{ 'Leave type' | t }}<select name="t" [(ngModel)]="f.leave_type" required #first>
        <option [ngValue]="null">{{ 'Choose…' | t }}</option>
        <option *ngFor="let t of leaveTypes" [ngValue]="t.id">{{ t.name }}{{ bal(t.id) }}</option></select></label>
      <div class="zp-row">
        <label>{{ 'First day' | t }}<input type="date" name="a" [(ngModel)]="f.start_date" required></label>
        <label>{{ 'Last day' | t }}<input type="date" name="b" [(ngModel)]="f.end_date" required></label>
      </div>
      <label class="zp-chk"><input type="checkbox" name="h" [(ngModel)]="f.dis_half_day"> {{ 'Half day' | t }}</label>
      <label>{{ 'Reason' | t }}<textarea name="r" rows="2" [(ngModel)]="f.reason"></textarea></label>
      <p class="zp-err" *ngIf="err" role="alert">{{ err }}</p>
      <div class="zp-acts"><button type="button" class="zr-btn" (click)="form = null">{{ 'Cancel' | t }}</button>
        <button type="submit" class="zr-btn primary" [disabled]="saving">{{ 'Send for approval' | t }}</button></div>
    </form>
  </div>

  <!-- shortcuts -->
  <div class="zp-box zp-keys" *ngIf="mode === 'keys'" role="dialog" aria-modal="true" [attr.aria-label]="'Keyboard shortcuts' | t" (click)="$event.stopPropagation()">
    <header class="zp-hd"><mat-icon aria-hidden="true">keyboard</mat-icon><h2>{{ 'Keyboard shortcuts' | t }}</h2><span class="zp-grow"></span>
      <button type="button" class="zp-x" (click)="close()" [attr.aria-label]="'Close' | t"><mat-icon>close</mat-icon></button></header>
    <table><tr *ngFor="let s of shortcuts"><td><ng-container *ngFor="let k of s.keys; let last = last"><kbd>{{ k }}</kbd><span *ngIf="!last && s.keys[0] === 'G'"> {{ 'then' | t }} </span><span *ngIf="!last && s.keys[0] !== 'G'"> </span></ng-container></td><td>{{ s.what | t }}</td></tr></table>
    <p class="zp-hint">{{ 'Shortcuts with one letter work when the cursor is not in a field.' | t }}</p>
  </div>
  <div class="zp-toast" *ngIf="toast" role="status">{{ toast }}</div>`,
  styles: [`
  .zp-back { position: fixed; inset: 0; background: rgba(20, 18, 48, .38); z-index: 1300; }
  .zp-box { position: fixed; top: 9vh; left: 50%; transform: translateX(-50%); width: min(680px, calc(100vw - 32px)); max-height: 78vh; display: flex; flex-direction: column;
            background: #fff; border-radius: 14px; box-shadow: 0 24px 64px rgba(20, 18, 48, .28); z-index: 1301; overflow: hidden; color: #262A3D; font-size: 14px; }
  .zp-in { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #E3E5EE; }
  .zp-in.sm { padding: 8px 16px; border-top: 1px solid #E3E5EE; }
  .zp-in mat-icon { color: #6B7185; }
  .zp-in input { flex: 1; border: 0; outline: 0; font: inherit; font-size: 16px; min-width: 0; background: transparent; }
  .zp-in.sm input { font-size: 14px; }
  .zp-box kbd { display: inline-block; min-width: 18px; padding: 1px 6px; border: 1px solid #D5D8E3; border-bottom-width: 2px; border-radius: 5px; background: #F7F8FB;
                font: 500 11.5px/1.5 inherit; color: #3B4057; text-align: center; }
  .zp-busy { width: 14px; height: 14px; border: 2px solid #D5D8E3; border-top-color: #5B4FE0; border-radius: 50%; animation: zpspin .7s linear infinite; }
  @keyframes zpspin { to { transform: rotate(360deg); } }
  .zp-list { overflow-y: auto; padding: 6px 0 8px; }
  .zp-g { padding: 8px 16px 4px; font-size: 12px; font-weight: 600; color: #6B7185; }
  .zp-h { display: flex; align-items: center; gap: 12px; width: 100%; padding: 7px 16px; border: 0; background: transparent; font: inherit; color: inherit; text-align: start; cursor: pointer; }
  .zp-h.on { background: #EEEDFD; }
  .zp-h mat-icon { color: #5B4FE0; font-size: 20px; width: 20px; height: 20px; flex: none; }
  .zp-ph { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex: none; }
  .zp-t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .zp-t b { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .zp-t small { color: #6B7185; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .zp-h .zp-go { color: #B4B8C8; font-size: 16px; width: 16px; height: 16px; visibility: hidden; }
  .zp-h.on .zp-go { visibility: visible; }
  .zp-none { padding: 18px 16px; color: #6B7185; margin: 0; }
  .zp-foot { display: flex; gap: 16px; align-items: center; padding: 8px 16px; border-top: 1px solid #E3E5EE; color: #6B7185; font-size: 12px; background: #FAFAFE; }
  .zp-link { margin-inline-start: auto; border: 0; background: none; color: #5B4FE0; font: inherit; cursor: pointer; }
  .zp-hd { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #E3E5EE; }
  .zp-hd h2 { margin: 0; font-size: 16px; font-weight: 600; color: #1B1640; } .zp-hd > mat-icon { color: #5B4FE0; }
  .zp-grow { flex: 1; }
  .zp-x { border: 0; background: none; cursor: pointer; color: #6B7185; display: flex; padding: 4px; border-radius: 6px; } .zp-x:hover { background: #F4F5FA; }
  .zp-quick { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; padding: 12px 16px; }
  .zp-qi { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 10px; align-items: center; text-align: start; padding: 10px 12px;
           border: 1px solid #E3E5EE; border-radius: 10px; background: #FAFAFE; cursor: pointer; font: inherit; color: inherit; }
  .zp-qi:hover, .zp-qi:focus-visible { border-color: #5B4FE0; background: #fff; }
  .zp-qi mat-icon { grid-row: span 2; color: #5B4FE0; } .zp-qi b { font-weight: 600; } .zp-qi small { color: #6B7185; font-size: 12px; }
  .zp-recs { overflow-y: auto; padding: 0 12px 12px; display: flex; flex-wrap: wrap; gap: 6px; align-content: flex-start; }
  .zp-recs .zp-g { flex: 0 0 100%; padding: 10px 4px 2px; }
  .zp-rec { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #E3E5EE; background: #fff; border-radius: 8px; padding: 5px 10px 5px 6px; cursor: pointer; font: inherit; font-size: 13px; color: #262A3D; }
  .zp-rec mat-icon { font-size: 16px; width: 16px; height: 16px; color: #5B4FE0; } .zp-rec:hover { background: #EEEDFD; }
  .zp-form { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
  .zp-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: #3B4057; font-weight: 500; }
  .zp-form input:not([type=checkbox]), .zp-form select, .zp-form textarea { font: inherit; font-size: 14px; padding: 8px 10px; border: 1px solid #D5D8E3; border-radius: 8px; background: #fff; color: #262A3D; }
  .zp-form input:focus, .zp-form select:focus, .zp-form textarea:focus { outline: 2px solid #5B4FE0; outline-offset: -1px; border-color: #5B4FE0; }
  .zp-form .zp-chk { flex-direction: row; align-items: center; gap: 8px; }
  .zp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .zp-acts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
  .zp-err { color: #A32626; background: #FBE7E7; padding: 8px 10px; border-radius: 8px; margin: 0; }
  .zp-keys table { margin: 8px 16px; border-collapse: collapse; }
  .zp-keys td { padding: 6px 10px 6px 0; border-bottom: 1px solid #F0F1F6; vertical-align: middle; }
  .zp-keys td:first-child { white-space: nowrap; color: #6B7185; font-size: 12px; }
  .zp-hint { margin: 4px 16px 14px; color: #6B7185; font-size: 12.5px; }
  .zp-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1B1640; color: #fff; padding: 10px 16px; border-radius: 10px; z-index: 1302; font-size: 13.5px; }
  @media (max-width: 600px) { .zp-box { top: 64px; max-height: calc(100vh - 80px); } .zp-row { grid-template-columns: 1fr; } .zp-foot span { display: none; } }
  `],
})
export class ZPaletteComponent implements OnInit, OnDestroy {
  mode: '' | 'search' | 'quick' | 'keys' = '';
  query = ''; hits: Hit[] = []; sel = 0; busy = false;
  quick: any = null; qf = ''; recGroups: { app: string; rows: any[] }[] = []; form: '' | 'todo' | 'leave' | null = null; f: any = {}; err = ''; saving = false;
  users: any[] = []; leaveTypes: any[] = []; balances: any[] = []; toast = '';
  readonly ms = MS; readonly shortcuts = SHORTCUTS;
  @ViewChild('q') qEl?: ElementRef<HTMLInputElement>;
  @ViewChild('first') firstEl?: ElementRef<HTMLElement>;
  private access: { admin: boolean; codes: Set<string> } | null = null;
  private reports: any[] | null = null;
  private stars: { starred: any[]; recent: any[] } = { starred: [], recent: [] };
  private subs: Subscription[] = [];
  private timer: any; private seq = 0; private gAt = 0;

  constructor(private router: Router, private zl: ZListService, private cp: CountryPackService, private ss: ZSuiteService,
              private zrec: ZRecordService, private cmd: ZCommandService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subs.push(this.zl.permissions().subscribe({ next: a => { this.access = a; }, error: () => {} }));
    this.subs.push(this.zrec.stars$.subscribe(x => { this.stars = { starred: x.starred || [], recent: x.recent || [] }; }));
    this.subs.push(this.cmd.cmd$.subscribe(c => { if (c.cmd === 'search' || c.cmd === 'quick' || c.cmd === 'keys') { this.show(c.cmd, c.arg); } }));
  }
  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); clearTimeout(this.timer); }

  get formTitle(): string { return this.form === 'leave' ? 'Leave request' : 'To-do'; }

  // ------------------------------------------------------------------ keyboard
  @HostListener('document:keydown', ['$event'])
  key(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === 'k' || ev.key === 'K')) { ev.preventDefault(); this.mode === 'search' ? this.close() : this.show('search'); return; }
    if (ev.key === 'Escape' && this.mode) { ev.preventDefault(); this.close(); return; }
    if (this.mode || ev.ctrlKey || ev.metaKey || ev.altKey || typingIn(ev) || !this.loggedIn()) { return; }
    if (document.querySelector('.cdk-overlay-pane, .zr-modal, [aria-modal="true"]')) { return; }   // another window is open
    const k = ev.key;
    if (Date.now() - this.gAt < 1200) {
      this.gAt = 0;
      const to: Record<string, string> = { h: 'home', i: 'inbox', t: 'todo', m: 'my-team', w: 'wall', s: 'settings/home' };
      if (to[k.toLowerCase()]) { ev.preventDefault(); this.go(MS + to[k.toLowerCase()]); }
      return;
    }
    if (k === '/') { ev.preventDefault(); this.show('search'); }
    else if (k === '?') { ev.preventDefault(); this.show('keys'); }
    else if (k === 'n' || k === 'N') { ev.preventDefault(); this.show('quick'); }
    else if (k === 'g' || k === 'G') { this.gAt = Date.now(); }
  }
  private loggedIn(): boolean { return this.router.url.startsWith(MS); }

  show(mode: 'search' | 'quick' | 'keys', arg?: any): void {
    this.mode = mode; this.err = ''; this.form = null;
    if (mode === 'search') {
      this.query = typeof arg === 'string' ? arg : ''; this.zrec.refreshStars(); this.typed();
      setTimeout(() => this.qEl?.nativeElement.focus(), 20);
      if (this.reports === null) { this.reports = []; this.cmd.raw<any>('/dashboard/api/reports/').then(r => { this.reports = r?.reports || []; }).catch(() => {}); }
    }
    if (mode === 'quick') {
      this.qf = '';
      this.cmd.get('quick/').then(q => { this.quick = q; this.regroup(); this.cd.markForCheck(); if (arg === 'todo' || arg === 'leave') { this.openForm(arg); } }).catch(() => { this.quick = { records: [] }; });
    }
    this.cd.markForCheck();
  }
  close(): void { this.mode = ''; this.form = null; this.cd.markForCheck(); }

  // ------------------------------------------------------------------ search
  typed(): void {
    clearTimeout(this.timer);
    const q = this.query.trim();
    this.hits = this.local(q); this.sel = 0;
    if (q.length < 2) { this.busy = false; return; }
    const n = ++this.seq; this.busy = true;
    this.timer = setTimeout(async () => {
      try {
        const r: any = await this.cmd.get('search/', { q });
        if (n !== this.seq) { return; }
        const remote: Hit[] = (r.results || []).map((x: any) => ({ group: x.group, title: x.number && x.number !== x.title ? `${x.title} (${x.number})` : x.title,
          sub: x.subtitle, icon: x.icon, link: x.page, photo: x.photo, kind: x.type }));
        const loc = this.local(q);
        const pages = loc.filter(h => h.kind !== 'command');
        this.hits = [...loc.filter(h => h.kind === 'command'), ...remote.filter(h => h.kind === 'employee'), ...pages, ...remote.filter(h => h.kind !== 'employee')];
      } catch { /* the local hits stay */ }
      if (n === this.seq) { this.busy = false; this.cd.markForCheck(); }
    }, 220);
  }

  private commands(): Hit[] {
    const c = (title: string, icon: string, run: () => void, sub = ''): Hit => ({ group: 'Commands', title: i18nT(title), sub: i18nT(sub), icon, run, kind: 'command' });
    return [
      c('Create something', 'add_circle', () => this.show('quick'), 'To-do, leave request, a record of any app'),
      c('New to-do', 'task_alt', () => this.show('quick', 'todo')),
      c('Request leave', 'beach_access', () => this.show('quick', 'leave')),
      c('Open my inbox', 'inbox', () => this.go(MS + 'inbox')),
      c('Open My team', 'groups', () => this.go(MS + 'my-team'), 'Who is in, approvals, documents, 1:1s'),
      c('Open the company wall', 'celebration', () => this.go(MS + 'wall'), 'Birthdays, anniversaries, announcements'),
      c("What's new", 'new_releases', () => { this.close(); this.cmd.open('whatsnew'); }, 'Release notes of this version'),
      c('Take the tour of this page', 'tour', () => { this.close(); this.cmd.open('tour', 'force'); }),
      c('Keyboard shortcuts', 'keyboard', () => this.show('keys')),
    ];
  }

  private local(q: string): Hit[] {
    const ql = q.toLowerCase();
    if (!ql) {
      const recs: Hit[] = [
        ...this.stars.starred.slice(0, 5).map(r => ({ group: 'Starred', title: r.label || r.object_id, sub: r.app, icon: 'star', link: r.page, kind: 'star' })),
        ...this.stars.recent.filter(r => r.page !== this.router.url).slice(0, 6).map(r => ({ group: 'Recently viewed', title: r.label || r.object_id, sub: r.app, icon: 'history', link: r.page, kind: 'recent' })),
      ];
      return [...recs, ...this.commands().slice(0, 6)];
    }
    const words = ql.split(/\s+/);
    const match = (s: string) => { const t = (s || '').toLowerCase(); return words.every(w => t.includes(w)); };
    const out: Hit[] = this.commands().filter(h => match(h.title)).slice(0, 4);
    const seen = new Set<string>();
    for (const g of MAIN_GROUPS) {
      for (const app of g.apps) {
        const suite = suiteOfApp(app.key);
        if (suite && !this.ss.isActive(suite)) { continue; }
        const appLabel = i18nT(this.cp.text(app.label));
        const land = appLanding(app, this.access);
        if (land && match(appLabel) && !seen.has(land)) { seen.add(land); out.push({ group: 'Pages', title: appLabel, sub: i18nT('App'), icon: app.icon, link: land, kind: 'page' }); }
        for (const s of (app.sections ? visibleSections(app, this.access, this.cp) : [])) {
          for (const it of s.items) {
            if (seen.has(it.link) || it.link.includes('/report-options/r/')) { continue; }
            if (match(it.label + ' ' + (it.hint || '') + ' ' + appLabel)) { seen.add(it.link); out.push({ group: 'Pages', title: it.label, sub: `${appLabel} · ${s.title}`, icon: it.icon || app.icon, link: it.link, kind: 'page' }); }
          }
        }
      }
    }
    const pages = out.filter(h => h.kind === 'page').slice(0, 8);
    const reps = (this.reports || []).filter(r => match(`${r.title} ${r.section} ${r.description || ''}`)).slice(0, 6)
      .map(r => ({ group: 'Reports', title: r.title, sub: r.section, icon: 'query_stats', link: `${MS}report-options/r/${r.key}`, kind: 'report' }));
    return [...out.filter(h => h.kind === 'command'), ...pages, ...reps];
  }

  nav(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); this.sel = Math.min(this.sel + 1, this.hits.length - 1); this.scroll(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); this.sel = Math.max(this.sel - 1, 0); this.scroll(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); const h = this.hits[this.sel]; if (h) { this.pick(h); } }
  }
  private scroll(): void { setTimeout(() => document.getElementById('zp-h' + this.sel)?.scrollIntoView({ block: 'nearest' })); }

  pick(h: Hit): void { if (h.run) { h.run(); } else if (h.link) { this.go(h.link); } }

  go(link: string): void {
    this.close(); menuPicked();
    const [path, qs] = link.split('?');
    const suite = suiteForUrl(path);   // a page of another app opens that app (its menu), like the launcher
    if (suite && this.ss.isActive(suite)) { this.ss.set(suite); }
    const params: Record<string, string> = {};
    new URLSearchParams(qs || '').forEach((v, k) => { params[k] = v; });
    this.router.navigate([path], { queryParams: params });
  }

  // ------------------------------------------------------------------ quick create
  regroup(): void { this.recGroups = this.recApps(); }
  recApps(): { app: string; rows: any[] }[] {
    const q = this.qf.trim().toLowerCase();
    const rows = (this.quick?.records || []).filter((r: any) => !q || `${r.label} ${r.app} ${r.group}`.toLowerCase().includes(q));
    const by = new Map<string, any[]>();
    rows.forEach((r: any) => { if (!by.has(r.app)) { by.set(r.app, []); } by.get(r.app)!.push(r); });
    return [...by.entries()].map(([app, rs]) => ({ app, rows: rs }));
  }
  firstRec(): void { const a = this.recGroups[0]; if (a) { this.go(a.rows[0].page + '?new=1'); } }

  async openForm(kind: 'todo' | 'leave'): Promise<void> {
    this.form = kind; this.err = '';
    const today = new Date(); const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (kind === 'todo') {
      this.f = { summary: '', due_date: iso, assigned_to: '', note: '' };
      if (!this.users.length) { this.zrec.users().subscribe({ next: u => { this.users = (u || []).map((x: any) => ({ id: x.id, name: x.name || x.username })); this.cd.markForCheck(); }, error: () => {} }); }
    } else {
      this.f = { leave_type: null, start_date: iso, end_date: iso, dis_half_day: false, reason: '' };
      try {
        const b: any = await this.cmd.raw(`/employee/api/Employee/${this.quick.employee_id}/leave_balance/`);
        const ok: number[] | undefined = b.applicable_type_ids;
        this.leaveTypes = (b.available_leave_types || []).filter((t: any) => !ok || ok.includes(t.id));
        this.balances = b.leave_balance || [];
      } catch { this.leaveTypes = []; }
    }
    this.cd.markForCheck();
    setTimeout(() => this.firstEl?.nativeElement.focus(), 30);
  }
  bal(typeId: number): string {
    const b = this.balances.find((x: any) => x.leave_type === typeId || x.leave_type_id === typeId);
    const n = b ? (b.balance ?? b.remaining ?? b.available) : null;
    return n === null || n === undefined ? '' : ` – ${n} ${i18nT('days left')}`;
  }

  async saveTodo(): Promise<void> {
    if (!(this.f.summary || '').trim()) { this.err = i18nT('Write what is to be done.'); return; }
    this.saving = true; this.err = '';
    try {
      await this.cmd.post('todo/', { ...this.f, assigned_to: this.f.assigned_to || undefined });
      this.done(i18nT('To-do added.'));
    } catch (e: any) { this.err = e?.error?.detail || i18nT('The to-do could not be saved.'); }
    this.saving = false; this.cd.markForCheck();
  }

  async saveLeave(): Promise<void> {
    const f = this.f;
    if (!f.leave_type) { this.err = i18nT('Choose the leave type.'); return; }
    if (!f.start_date || !f.end_date) { this.err = i18nT('Choose the first and last day of the leave.'); return; }
    if (f.end_date < f.start_date) { this.err = i18nT('The last day cannot be before the first day.'); return; }
    this.saving = true; this.err = '';
    const body: any = { employee: this.quick.employee_id, leave_type: f.leave_type, start_date: f.start_date, end_date: f.end_date, reason: f.reason || '', dis_half_day: !!f.dis_half_day };
    if (f.dis_half_day) { body.half_day_period = 'first_half'; }
    try {
      await this.cmd.rawPost('/calendars/api/emp-leave-request/', body);
      this.done(i18nT('Your leave request was sent for approval.'));
    } catch (e: any) {
      const d = e?.error;
      this.err = (typeof d === 'string' ? d : d?.detail || d?.error || d?.non_field_errors?.[0] || (d && Object.values(d)[0])) || i18nT('The leave request could not be saved.');
      if (Array.isArray(this.err)) { this.err = this.err[0]; }
    }
    this.saving = false; this.cd.markForCheck();
  }

  private done(msg: string): void {
    this.close(); this.toast = msg; this.zrec.refreshTodo?.();
    setTimeout(() => { this.toast = ''; this.cd.markForCheck(); }, 3500);
  }
}
