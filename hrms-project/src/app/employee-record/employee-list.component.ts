/**
 * v1.19.0 – Employees list in the new design: a table by default (cards as an option), search on name / code / Emirates ID /
 * mobile / e-mail, filter chips, saved views, four counters that are also filters, sort on every column, 25 / 50 / 100 rows,
 * row menu (Open, Edit, Transfer, Deactivate, Delete) and bulk actions (Export selected, Change department / manager, Send ESS
 * invite, Deactivate). API: employee-profile/api/directory/.
 */
import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { VCol, VRow, ViewState, defaults as viewDefaults, graphHtml, pivotData, pivotHtml } from '../shared-ui/z-views';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ErService, avatarColour, badgeClass, dmy, erPage } from './er.service';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';
import { CreateEmployeeComponent } from '../create-employee/create-employee.component';
import { ZEmployeeImportComponent } from '../shared-ui/z-employee-import.component';   // v1.26.0

type Col = { key: string; label: string; on: boolean; sort?: (r: any) => any };

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./er.css'],
  template: `
<div class="er-page">
  <div class="er-toolbar">
    <h1 class="er-title">Employees <span class="er-count">· {{ shown.length }}</span></h1>
    <div class="er-search">
      <span class="er-search-ic" aria-hidden="true">⌕</span>
      <input [(ngModel)]="q" (ngModelChange)="onSearch()" [placeholder]="t('Search name, code, Emirates ID, mobile or e-mail')" aria-label="Search employees">
    </div>
    <div class="er-spacer"></div>
    <div class="er-seg" role="group" aria-label="View">
      <!-- v1.19.2: named views – List view (table) and Detailed view (cards) -->
      <button type="button" class="er-seg-t" [class.on]="mode === 'table'" (click)="setMode('table')" [attr.aria-pressed]="mode === 'table'" title="List view"><span aria-hidden="true">☰</span> List view</button>
      <button type="button" class="er-seg-t" [class.on]="mode === 'cards'" (click)="setMode('cards')" [attr.aria-pressed]="mode === 'cards'" title="Detailed view"><span aria-hidden="true">▦</span> Detailed view</button>
      <!-- v1.19.3: Kanban, Graph and Pivot views of the same filtered employees -->
      <button type="button" class="er-seg-t" [class.on]="mode === 'kanban'" (click)="setMode('kanban')" [attr.aria-pressed]="mode === 'kanban'" title="Kanban"><span aria-hidden="true">▥</span> Kanban</button>
      <button type="button" class="er-seg-t" [class.on]="mode === 'graph'" (click)="setMode('graph')" [attr.aria-pressed]="mode === 'graph'" title="Graph"><svg class="er-seg-ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="9" width="3" height="5" rx="1"/><rect x="6.5" y="5" width="3" height="9" rx="1"/><rect x="11" y="2" width="3" height="12" rx="1"/></svg> Graph</button>
      <button type="button" class="er-seg-t" [class.on]="mode === 'pivot'" (click)="setMode('pivot')" [attr.aria-pressed]="mode === 'pivot'" title="Pivot"><span aria-hidden="true">⊞</span> Pivot</button>
    </div>
    <button type="button" class="er-btn primary" *ngIf="canAdd" (click)="create()">New employee</button>
    <div class="er-menu-wrap">
      <button type="button" class="er-btn icon" (click)="menu = menu === 'more' ? '' : 'more'; $event.stopPropagation()" aria-label="More actions">⋯</button>
      <div class="er-menu" *ngIf="menu === 'more'" (click)="$event.stopPropagation()">
        <button type="button" (click)="openImport()">Import employees</button>
        <button type="button" (click)="exportCsv(shown)">Export Excel (CSV)</button>
        <button type="button" (click)="printList()">Export PDF</button>
        <button type="button" (click)="menu = 'cols'">Column chooser</button>
      </div>
      <div class="er-menu cols" *ngIf="menu === 'cols'" (click)="$event.stopPropagation()">
        <label *ngFor="let c of cols" class="er-check"><input type="checkbox" [(ngModel)]="c.on" (ngModelChange)="saveCols()"> {{ c.label }}</label>
      </div>
    </div>
  </div>

  <div class="er-counters">
    <button type="button" *ngFor="let k of counterKeys" [class.on]="view === k.view" (click)="pickView(view === k.view ? 'all' : k.view)">
      <b>{{ counters[k.key] ?? '–' }}</b><span>{{ k.label }}</span></button>
  </div>

  <div class="er-filters">
    <select [(ngModel)]="view" (ngModelChange)="pickView($event)" aria-label="Saved view" class="er-view">
      <option value="all">All employees</option><option value="active">Active</option><option value="probation">On probation</option>
      <option value="expiring">Expiring in 30 days</option><option value="incomplete">Incomplete files</option>
      <option *ngFor="let v of myViews" [value]="'my:' + v.name">{{ v.name }}</option>
    </select>
    <select [(ngModel)]="f.branch" (ngModelChange)="load()" aria-label="Branch" [class.set]="f.branch"><option value="">Branch</option><option *ngFor="let o of look?.branches" [value]="o.value">{{ o.label }}</option></select>
    <select [(ngModel)]="f.department" (ngModelChange)="load()" aria-label="Department" [class.set]="f.department"><option value="">Department</option><option *ngFor="let o of look?.departments" [value]="o.value">{{ o.label }}</option></select>
    <select [(ngModel)]="f.designation" (ngModelChange)="load()" aria-label="Designation" [class.set]="f.designation"><option value="">Designation</option><option *ngFor="let o of look?.designations" [value]="o.value">{{ o.label }}</option></select>
    <select [(ngModel)]="f.category" (ngModelChange)="load()" aria-label="Category" [class.set]="f.category"><option value="">Category</option><option *ngFor="let o of look?.categories" [value]="o.value">{{ o.label }}</option></select>
    <select [(ngModel)]="f.status" (ngModelChange)="load()" aria-label="Status" [class.set]="f.status"><option value="">Status</option><option value="active">Active</option><option value="probation">On probation</option><option value="on_notice">Notice period</option><option value="left">Left</option></select>
    <select [(ngModel)]="f.nationality" (ngModelChange)="load()" aria-label="Nationality" [class.set]="f.nationality"><option value="">Nationality</option><option *ngFor="let o of look?.nationalities" [value]="o.value">{{ o.label }}</option></select>
    <label class="er-date">Joined from <input type="date" [(ngModel)]="f.joined_from" (change)="load()"></label>
    <select [(ngModel)]="f.expiring" (ngModelChange)="load()" aria-label="Documents expiring" [class.set]="f.expiring"><option value="">Documents expiring</option><option value="30">In 30 days</option><option value="60">In 60 days</option><option value="90">In 90 days</option></select>
    <button type="button" class="er-link" *ngIf="anyFilter()" (click)="clear()">Clear</button>
    <button type="button" class="er-link" *ngIf="anyFilter()" (click)="saveView()">Save view</button>
  </div>

  <div class="er-bulk" *ngIf="sel.size">
    <b>{{ t('{0} selected', [sel.size]) }}</b>
    <button type="button" class="er-btn" (click)="exportCsv(selRows())">Export selected</button>
    <select [(ngModel)]="bulkDept" aria-label="Change department"><option value="">Change department…</option><option *ngFor="let o of look?.departments" [value]="o.value">{{ o.label }}</option></select>
    <button type="button" class="er-btn" [disabled]="!bulkDept || busy" (click)="bulk('emp_dept_id', bulkDept)">Apply</button>
    <select [(ngModel)]="bulkMgr" aria-label="Change manager"><option value="">Change manager…</option><option *ngFor="let o of look?.managers" [value]="o.value">{{ o.label }}</option></select>
    <button type="button" class="er-btn" [disabled]="!bulkMgr || busy" (click)="bulk('emp_reporting_manager', bulkMgr)">Apply</button>
    <button type="button" class="er-btn" [disabled]="busy" (click)="bulk('is_ess', true)">Send ESS invite</button>
    <button type="button" class="er-btn danger" [disabled]="busy" (click)="deactivate(selRows())">Deactivate</button>
    <button type="button" class="er-link" (click)="sel.clear()">Clear selection</button>
  </div>

  <div class="er-card er-table-wrap" *ngIf="mode === 'table'">
    <table class="er-table">
      <thead><tr>
        <th class="ck"><input type="checkbox" [checked]="allOnPage()" (change)="toggleAll($event)" aria-label="Select all on this page"></th>
        <ng-container *ngFor="let c of cols"><th *ngIf="c.on" (click)="sortBy(c.key)" [class.sorted]="sort === c.key" [attr.aria-sort]="sort === c.key ? (dir > 0 ? 'ascending' : 'descending') : null">
          {{ c.label }} <span class="er-sort" *ngIf="sort === c.key">{{ dir > 0 ? '▲' : '▼' }}</span></th></ng-container>
        <th class="act"></th>
      </tr></thead>
      <tbody>
        <ng-container *ngIf="loading"><tr *ngFor="let x of [1,2,3,4,5,6]"><td colspan="11"><span class="z-skel"></span></td></tr></ng-container>
        <tr *ngFor="let r of page()" (click)="open(r)" class="er-row" [class.dim]="!r.is_active">
          <td class="ck" (click)="$event.stopPropagation()"><input type="checkbox" [checked]="sel.has(r.id)" (change)="toggle(r.id)" [attr.aria-label]="'Select ' + r.name"></td>
          <ng-container *ngFor="let c of cols">
            <td *ngIf="c.on" [ngSwitch]="c.key">
              <div *ngSwitchCase="'name'" class="er-who">
                <span class="er-av sm" [style.background]="r.photo ? 'transparent' : colour(r.code)"><img *ngIf="r.photo" [src]="r.photo" alt=""><ng-container *ngIf="!r.photo">{{ r.initials }}</ng-container></span>
                <span><b>{{ r.name }}</b><small>{{ r.code }}</small></span>
              </div>
              <ng-container *ngSwitchCase="'joined'">{{ dmy(r.joined) }}</ng-container>
              <ng-container *ngSwitchCase="'status'"><span class="z-chip" [ngClass]="statusClass(r)">{{ statusText(r) }}</span></ng-container>
              <ng-container *ngSwitchCase="'doc'"><span class="z-chip" *ngIf="r.doc" [ngClass]="badgeClass(r.doc)">{{ r.doc.level === 'valid' ? t('All valid') : t(shortDoc(r.doc.document)) + ' · ' + docDays(r.doc) }}</span><span *ngIf="!r.doc" class="er-muted">–</span></ng-container>
              <ng-container *ngSwitchCase="'completeness'"><span class="er-ring-sm" [title]="r.missing.join(', ')"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="bg"/><circle cx="18" cy="18" r="15" class="fg" [attr.stroke-dasharray]="(r.completeness * 0.9425).toFixed(1) + ' 94.25'" [class.full]="r.completeness === 100"/></svg>{{ r.completeness }}%</span></ng-container>
              <ng-container *ngSwitchDefault>{{ r[c.key] || '–' }}</ng-container>
            </td>
          </ng-container>
          <td class="act" (click)="$event.stopPropagation()">
            <div class="er-menu-wrap">
              <button type="button" class="er-icon" (click)="rowMenu = rowMenu === r.id ? 0 : r.id" [attr.aria-label]="'Actions for ' + r.name">⋯</button>
              <div class="er-menu right" *ngIf="rowMenu === r.id">
                <button type="button" (click)="open(r)">Open</button>
                <button type="button" (click)="open(r, true)">Edit</button>
                <button type="button" (click)="transfer(r)">Transfer</button>
                <button type="button" *ngIf="r.is_active" (click)="deactivate([r])">Deactivate</button>
                <button type="button" class="danger" *ngIf="canDelete" (click)="remove(r)">Delete</button>
              </div>
            </div>
          </td>
        </tr>
        <tr *ngIf="!loading && !shown.length"><td colspan="11" class="z-empty">No employees match · <button type="button" (click)="clear()">Clear filters</button></td></tr>
      </tbody>
    </table>
  </div>

  <div class="er-cards" *ngIf="mode === 'cards'">
    <!-- v1.19.1: the card look of the classic list – colour band, photo circle, name, code, department chip · branch -->
    <div class="er-card er-emp" *ngFor="let r of page()" (click)="open(r)" (keydown.enter)="open(r)" tabindex="0" role="link" [class.dim]="!r.is_active" [attr.aria-label]="r.name + ', ' + r.code">
      <span class="er-emp-band"></span>
      <input type="checkbox" class="er-emp-ck" [checked]="sel.has(r.id)" (click)="$event.stopPropagation()" (change)="toggle(r.id)" [attr.aria-label]="'Select ' + r.name">
      <div class="er-menu-wrap er-emp-more" (click)="$event.stopPropagation()">
        <button type="button" class="er-icon" (click)="rowMenu = rowMenu === r.id ? 0 : r.id" [attr.aria-label]="'Actions for ' + r.name">⋯</button>
        <div class="er-menu right" *ngIf="rowMenu === r.id">
          <button type="button" (click)="open(r)">Open</button>
          <button type="button" (click)="open(r, true)">Edit</button>
          <button type="button" (click)="transfer(r)">Transfer</button>
          <button type="button" *ngIf="r.is_active" (click)="deactivate([r])">Deactivate</button>
          <button type="button" class="danger" *ngIf="canDelete" (click)="remove(r)">Delete</button>
        </div>
      </div>
      <span class="er-emp-photo"><img *ngIf="r.photo" [src]="r.photo" alt="">
        <svg *ngIf="!r.photo" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7z"/></svg></span>
      <b class="er-emp-name">{{ r.name }}</b>
      <small class="er-emp-code">{{ r.code }}</small>
      <span class="er-emp-meta"><span class="er-emp-dept" *ngIf="r.department">{{ r.department }}</span><span class="er-emp-br" *ngIf="r.branch"><i *ngIf="r.department" aria-hidden="true"></i>{{ r.branch }}</span></span>
      <span class="er-chips" *ngIf="r.status !== 'active' || r.probation_days_left !== null || (r.doc && r.doc.level !== 'valid')">
        <span class="z-chip" *ngIf="r.status !== 'active' || r.probation_days_left !== null" [ngClass]="statusClass(r)">{{ statusText(r) }}</span>
        <span class="z-chip" *ngIf="r.doc && r.doc.level !== 'valid'" [ngClass]="badgeClass(r.doc)">{{ t(shortDoc(r.doc.document)) }} · {{ docDays(r.doc) }}</span></span>
    </div>
  </div>

  <!-- v1.19.3 Kanban: one column per value of the chosen field, employee cards in it -->
  <div class="er-card er-kb-wrap" *ngIf="mode === 'kanban'">
    <div class="zv-opts"><label>Columns by <select [(ngModel)]="kbBy" (ngModelChange)="saveVs()">
      <option *ngFor="let k of kbFields" [value]="k.key">{{ k.label }}</option></select></label>
      <span class="zv-muted">{{ t('{0} employees', [shown.length]) }} · {{ t('open a card to see the employee') }}</span></div>
    <div class="er-kb">
      <section class="er-kb-lane" *ngFor="let g of lanes()">
        <header><span class="zv-dot" [ngClass]="g.tone"></span><b>{{ g.label }}</b><span class="zv-n">{{ g.rows.length }}</span></header>
        <div class="er-kb-cards">
          <div class="er-kb-card" *ngFor="let r of g.rows" (click)="open(r)" (keydown.enter)="open(r)" tabindex="0" role="link" [class.dim]="!r.is_active">
            <span class="er-av sm" [style.background]="r.photo ? 'transparent' : colour(r.code)"><img *ngIf="r.photo" [src]="r.photo" alt=""><ng-container *ngIf="!r.photo">{{ r.initials }}</ng-container></span>
            <span class="er-kb-txt"><b>{{ r.name }}</b><small>{{ r.code }}<ng-container *ngIf="r.designation"> · {{ r.designation }}</ng-container></small>
              <small *ngIf="kbBy !== 'department' && r.department">{{ r.department }}</small>
              <span class="er-chips" *ngIf="(kbBy !== 'status' && (r.status !== 'active' || r.probation_days_left !== null)) || (kbBy !== 'doc' && r.doc && r.doc.level !== 'valid')">
                <span class="z-chip" *ngIf="kbBy !== 'status' && (r.status !== 'active' || r.probation_days_left !== null)" [ngClass]="statusClass(r)">{{ statusText(r) }}</span>
                <span class="z-chip" *ngIf="kbBy !== 'doc' && r.doc && r.doc.level !== 'valid'" [ngClass]="badgeClass(r.doc)">{{ t(shortDoc(r.doc.document)) }} · {{ docDays(r.doc) }}</span></span></span>
          </div>
        </div>
      </section>
      <p class="z-empty" *ngIf="!shown.length">No employees match · <button type="button" (click)="clear()">Clear filters</button></p>
    </div>
  </div>

  <!-- v1.19.3 Graph and Pivot (the same view engine as every other list) -->
  <div class="er-card er-vw" *ngIf="mode === 'graph' || mode === 'pivot'" [innerHTML]="viewHtml" (click)="viewClick($event)" (change)="viewChange($event)"></div>

  <div class="er-pager" *ngIf="shown.length && (mode === 'table' || mode === 'cards')">
    <span>Rows per page <select [(ngModel)]="per" (ngModelChange)="pg = 0" aria-label="Rows per page"><option [ngValue]="25">25</option><option [ngValue]="50">50</option><option [ngValue]="100">100</option></select></span>
    <span>{{ t('{0}–{1} of {2}', [pg * per + 1, min((pg + 1) * per, shown.length), shown.length]) }}</span>
    <button type="button" class="er-icon" [disabled]="pg === 0" (click)="pg = pg - 1" aria-label="Previous page">‹</button>
    <button type="button" class="er-icon" [disabled]="(pg + 1) * per >= shown.length" (click)="pg = pg + 1" aria-label="Next page">›</button>
  </div>
</div>`,
})
export class EmployeeListComponent implements OnInit {
  rows: any[] = []; shown: any[] = []; look: any = null; counters: any = {};
  q = ''; view = 'all'; mode: 'table' | 'cards' | 'kanban' | 'graph' | 'pivot' = 'table'; menu = ''; rowMenu = 0;
  f: any = { branch: '', department: '', designation: '', category: '', status: '', nationality: '', joined_from: '', expiring: '' };
  sort = 'name'; dir = 1; per = 25; pg = 0; loading = true; busy = false;
  canAdd = false; canDelete = false; sel = new Set<number>(); bulkDept = ''; bulkMgr = '';
  myViews: { name: string; f: any; q: string }[] = [];
  dmy = dmy; badgeClass = badgeClass; min = Math.min; t = i18nT;
  counterKeys = [{ key: 'active', label: 'Active', view: 'active' }, { key: 'probation', label: 'On probation', view: 'probation' },
    { key: 'expiring', label: 'Documents expiring in 30 days', view: 'expiring' }, { key: 'incomplete', label: 'Files incomplete', view: 'incomplete' }];
  cols: Col[] = [
    { key: 'name', label: 'Employee', on: true }, { key: 'designation', label: 'Designation', on: true }, { key: 'department', label: 'Department', on: true },
    { key: 'branch', label: 'Branch', on: true }, { key: 'joined', label: 'Joined', on: true }, { key: 'status', label: 'Status', on: true },
    { key: 'doc', label: 'Documents', on: true, sort: r => r.doc ? r.doc.days : 99999 }, { key: 'completeness', label: 'Completeness', on: true },
    { key: 'category', label: 'Category', on: false }, { key: 'nationality', label: 'Nationality', on: false }, { key: 'mobile', label: 'Mobile', on: false },
  ];
  private timer: any;

  constructor(private api: ErService, private router: Router, private dialog: MatDialog, private cd: ChangeDetectorRef, private san: DomSanitizer) {}

  @HostListener('document:click') closeMenus(): void { if (this.menu || this.rowMenu) { this.menu = ''; this.rowMenu = 0; } }

  async ngOnInit(): Promise<void> {
    try { this.mode = (localStorage.getItem('er_mode') as any) || 'table'; } catch { /* ignore */ }
    try { const v = JSON.parse(localStorage.getItem('er_vs') || '{}'); if (v.kbBy) { this.kbBy = v.kbBy; } delete v.kbBy; this.vs = v; } catch { this.vs = {}; }
    try { const c = JSON.parse(localStorage.getItem('er_cols') || 'null'); if (c) { this.cols.forEach(x => { if (x.key in c) { x.on = c[x.key]; } }); } } catch { /* ignore */ }
    try { this.myViews = JSON.parse(localStorage.getItem('er_views') || '[]'); } catch { this.myViews = []; }
    this.api.lookups().then(l => { this.look = l; this.cd.markForCheck(); }).catch(() => {});
    await this.load();
  }

  colour(s: string): string { return avatarColour(s); }
  setMode(m: 'table' | 'cards' | 'kanban' | 'graph' | 'pivot'): void { this.mode = m; try { localStorage.setItem('er_mode', m); } catch { /* ignore */ } this.renderView(); }

  // ------------------------------------------------------------------ v1.19.3 Kanban / Graph / Pivot
  kbFields = [{ key: 'status', label: 'Status' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' },
    { key: 'branch', label: 'Branch' }, { key: 'category', label: 'Category' }, { key: 'nationality', label: 'Nationality' },
    { key: 'doc', label: 'Documents' }, { key: 'year', label: 'Year joined' }];
  kbBy = 'status';
  vs: ViewState = {};
  viewHtml: SafeHtml = '';
  private VCOLS: { key: string; label: string; kind: 'text' | 'number' | 'date'; facet: boolean }[] = [
    { key: 'name', label: 'Employee', kind: 'text', facet: false }, { key: 'status', label: 'Status', kind: 'text', facet: true },
    { key: 'department', label: 'Department', kind: 'text', facet: true }, { key: 'designation', label: 'Designation', kind: 'text', facet: true },
    { key: 'branch', label: 'Branch', kind: 'text', facet: true }, { key: 'category', label: 'Category', kind: 'text', facet: true },
    { key: 'nationality', label: 'Nationality', kind: 'text', facet: true }, { key: 'doc', label: 'Documents', kind: 'text', facet: true },
    { key: 'year', label: 'Year joined', kind: 'text', facet: true }, { key: 'joined', label: 'Joined', kind: 'date', facet: false },
  ];
  /** The value of a field used to group employees (the same text on the table, the cards and the views). */
  facet(r: any, k: string): string {
    if (k === 'status') { return this.statusText(r); }
    if (k === 'doc') { return !r.doc ? i18nT('No documents') : r.doc.level === 'valid' ? i18nT('All valid') : r.doc.level === 'expired' ? i18nT('Expired') : r.doc.level === 'red' ? i18nT('Expiring in 30 days') : i18nT('Expiring in 31–60 days'); }
    if (k === 'year') { return r.joined ? String(r.joined).slice(0, 4) : i18nT('(none)'); }
    return r[k] || i18nT('(none)');
  }
  lanes(): { label: string; rows: any[]; tone: string }[] {
    const m = new Map<string, any[]>();
    for (const r of this.shown) { const k = this.facet(r, this.kbBy); if (!m.has(k)) { m.set(k, []); } m.get(k)!.push(r); }
    const order = this.kbBy === 'year' ? (a: any, b: any) => b[0].localeCompare(a[0]) : (a: any, b: any) => b[1].length - a[1].length;
    const tone = (k: string) => /^(active|all valid)/i.test(k) ? 'good' : /(left|inactive|expired|terminat)/i.test(k) ? 'bad' : /(probation|notice|expiring)/i.test(k) ? 'warn' : '';
    return [...m.entries()].sort(order).map(([label, rows]) => ({ label, rows, tone: tone(label) }));
  }
  private viewData(): { cols: VCol[]; rows: VRow[] } {
    const cols: VCol[] = this.VCOLS.map((c, i) => ({ idx: i, label: i18nT(c.label), kind: c.kind, skip: false, facet: c.facet }));
    const rows: VRow[] = this.shown.map((r, i) => ({ key: i, cells: this.VCOLS.map(c => c.key === 'joined' ? (r.joined || '') : this.facet(r, c.key)) }));
    return { cols, rows };
  }
  renderView(): void {
    if (this.mode !== 'graph' && this.mode !== 'pivot') { return; }
    const { cols, rows } = this.viewData();
    if (this.vs.graphBy === undefined) { this.vs = { graphBy: 2, graphMeasure: -1, graphType: 'bar', pivotRows: 2, pivotCols: 1, pivotMeasure: -1, ...this.vs }; }
    const st = viewDefaults(cols, this.vs);
    this.viewHtml = this.san.bypassSecurityTrustHtml(this.mode === 'graph' ? graphHtml(cols, rows, st) : pivotHtml(cols, rows, st));   // all values escaped by z-views
    this.cd.markForCheck();
  }
  viewChange(e: Event): void {
    const el = e.target as HTMLSelectElement; const k = el?.getAttribute?.('data-v');
    if (!k) { return; }
    (this.vs as any)[k] = Number(el.value); this.saveVs(); this.renderView();
  }
  viewClick(e: Event): void {
    const el = (e.target as HTMLElement).closest('[data-gt],[data-pivot-export]') as HTMLElement | null;
    if (!el) { return; }
    if (el.hasAttribute('data-gt')) { this.vs.graphType = el.getAttribute('data-gt') as any; this.saveVs(); this.renderView(); }
    if (el.hasAttribute('data-pivot-export')) {
      const { cols, rows } = this.viewData(); const { head, body } = pivotData(cols, rows, viewDefaults(cols, this.vs));
      const esc = (s: any) => `"${String(s).replace(/"/g, '""')}"`;
      const csv = [head, ...body].map(r => r.map(esc).join(',')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'employees-pivot.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  }
  saveVs(): void { try { localStorage.setItem('er_vs', JSON.stringify({ ...this.vs, kbBy: this.kbBy })); } catch { /* ignore */ } }
  saveCols(): void { try { localStorage.setItem('er_cols', JSON.stringify(Object.fromEntries(this.cols.map(c => [c.key, c.on])))); } catch { /* ignore */ } }
  anyFilter(): boolean { return !!this.q || Object.values(this.f).some(v => !!v); }
  onSearch(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }

  async load(): Promise<void> {
    this.loading = true;
    const q: any = { q: this.q, ...this.f };
    if (this.view === 'probation') { q.status = 'probation'; }
    if (this.view === 'active') { q.status = 'active,probation,on_notice'; }
    if (this.view === 'expiring') { q.expiring = 30; }
    if (this.view === 'incomplete') { q.incomplete = 1; }
    try {
      const d: any = await this.api.get('employee-profile/api/directory/', q);
      this.rows = d.rows || []; this.counters = d.counters || {}; this.canAdd = !!d.can_add; this.canDelete = !!d.can_delete;
    } catch (e) { this.rows = []; zToast(ErService.error(e, 'The employee list could not be loaded.'), 'err'); }
    this.loading = false; this.pg = 0; this.applySort();
  }

  pickView(v: string): void {
    this.view = v;
    if (v.startsWith('my:')) {
      const s = this.myViews.find(x => 'my:' + x.name === v);
      if (s) { this.f = { ...s.f }; this.q = s.q; }
    }
    this.load();
  }
  saveView(): void {
    const name = prompt('Name of the view');
    if (!name) { return; }
    this.myViews = [...this.myViews.filter(v => v.name !== name), { name, f: { ...this.f }, q: this.q }];
    try { localStorage.setItem('er_views', JSON.stringify(this.myViews)); } catch { /* ignore */ }
    this.view = 'my:' + name; zToast(`View "${name}" saved`, 'ok');
  }
  clear(): void { this.q = ''; this.view = 'all'; Object.keys(this.f).forEach(k => this.f[k] = ''); this.load(); }

  sortBy(k: string): void { if (this.sort === k) { this.dir = -this.dir; } else { this.sort = k; this.dir = 1; } this.applySort(); }
  applySort(): void {
    const c = this.cols.find(x => x.key === this.sort);
    const val = (r: any) => c?.sort ? c.sort(r) : (r[this.sort] ?? '');
    this.shown = [...this.rows].sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * this.dir; });
    this.renderView();
    try { sessionStorage.setItem('er_order', JSON.stringify(this.shown.map(r => r.id))); } catch { /* ignore */ }
    this.cd.markForCheck();
  }
  page(): any[] { return this.shown.slice(this.pg * this.per, (this.pg + 1) * this.per); }
  allOnPage(): boolean { const p = this.page(); return p.length > 0 && p.every(r => this.sel.has(r.id)); }
  toggleAll(e: any): void { const on = e.target.checked; this.page().forEach(r => on ? this.sel.add(r.id) : this.sel.delete(r.id)); }
  toggle(id: number): void { this.sel.has(id) ? this.sel.delete(id) : this.sel.add(id); }
  selRows(): any[] { return this.rows.filter(r => this.sel.has(r.id)); }

  statusClass(r: any): string { return { active: 'ok', probation: 'info', on_notice: 'warn' }[r.status as string] || (r.probation_days_left !== null ? 'info' : 'bad'); }
  statusText(r: any): string {
    if (r.probation_days_left !== null && r.status === 'active') { return i18nT('On probation'); }
    return i18nT(r.status === 'on_notice' ? 'Notice period' : r.status_label);
  }
  shortDoc(d: string): string { return ({ 'Residence visa': 'Visa', 'Labour card / work permit': 'Labour card', 'Medical insurance': 'Insurance', 'MOHRE contract': 'Contract' } as any)[d] || d; }
  docDays(b: any): string { return b.days < 0 ? i18nT('expired') : i18nT('{0} days', [b.days]); }

  open(r: any, edit = false): void { this.router.navigate([erPage(r.id)], edit ? { queryParams: { edit: 1 } } : {}); }
  transfer(r: any): void { this.router.navigate(['/main-sidebar/sub-sidebar/employee-transfer'], { queryParams: { employee: r.id } }); }
  goClassic(): void { this.router.navigate(['/main-sidebar/sub-sidebar/employee-master-classic']); }
  /** v1.26.0: the new employee import, right here (was: go to the classic list). */
  openImport(): void {
    this.menu = '';
    this.dialog.open(ZEmployeeImportComponent, { width: '900px', maxWidth: '96vw', maxHeight: '92vh', autoFocus: false })
      .afterClosed().subscribe(r => { if (r === 'imported') { this.load(); } });
  }
  create(): void {
    const ref = this.dialog.open(CreateEmployeeComponent, { width: 'min(1180px, 96vw)', maxWidth: '96vw', height: '90vh', panelClass: 'er-create-dialog' });
    ref.afterClosed().subscribe(() => this.load());
  }

  async bulk(field: string, value: any): Promise<void> {
    const rows = this.selRows();
    this.busy = true; let ok = 0; const bad: string[] = [];
    for (const r of rows) {
      try { await this.api.put(`employee-profile/api/record/${r.id}/job/`, { [field]: value }); ok++; }
      catch (e) { bad.push(`${r.name}: ${ErService.error(e)}`); }
    }
    this.busy = false; this.bulkDept = ''; this.bulkMgr = '';
    zToast(bad.length ? `${ok} updated, ${bad.length} not:\n${bad.slice(0, 5).join('\n')}` : `${ok} employee${ok === 1 ? '' : 's'} updated`, bad.length ? 'err' : 'ok');
    this.sel.clear(); await this.load();
  }
  async deactivate(rows: any[]): Promise<void> {
    if (!rows.length || !confirm(rows.length === 1 ? `Deactivate ${rows[0].name}?` : `Deactivate ${rows.length} employees?`)) { return; }
    let ok = 0;
    for (const r of rows) { try { await this.api.patch(`employee/api/Employee/${r.id}/`, { is_active: false }); ok++; } catch (e) { zToast(`${r.name}: ${ErService.error(e)}`, 'err'); } }
    if (ok) { zToast(`${ok} employee${ok === 1 ? '' : 's'} deactivated`, 'ok'); }
    this.sel.clear(); await this.load();
  }
  async remove(r: any): Promise<void> {
    if (!confirm(`Delete ${r.name}? This cannot be undone.`)) { return; }
    try { await this.api.del(`employee/api/Employee/${r.id}/`); zToast(`${r.name} deleted`, 'ok'); await this.load(); }
    catch (e) { zToast(ErService.error(e, 'It could not be deleted. Deactivate the employee instead.'), 'err'); }
  }

  exportCsv(rows: any[]): void {
    const cols = this.cols.filter(c => c.on);
    const val = (r: any, k: string) => k === 'name' ? `${r.name} (${r.code})` : k === 'doc' ? (r.doc ? `${r.doc.document} ${r.doc.label}` : '') : k === 'completeness' ? r.completeness + '%' : k === 'status' ? this.statusText(r) : (r[k] ?? '');
    const esc = (s: any) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [cols.map(c => esc(c.label)).join(','), ...rows.map(r => cols.map(c => esc(val(r, c.key))).join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'employees.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    this.menu = '';
  }
  printList(): void { this.menu = ''; const p = this.per; this.per = 100000; this.cd.detectChanges(); window.print(); this.per = p; }
}
