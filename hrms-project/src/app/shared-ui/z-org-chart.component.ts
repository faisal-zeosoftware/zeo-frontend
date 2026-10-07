import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';

interface Node { id: number; code: string; name: string; designation: string; department: string; branch: string; email: string; photo: string | null; manager: number | null; kids: Node[]; open: boolean; hit: boolean; size: number; }

/** Employee organisation chart, from each employee's reporting manager. */
@Component({
  selector: 'z-org-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zo-page">
    <header class="zo-h">
      <div><h2>Organisation chart</h2><p class="zr-muted">{{ total }} employees · built from each employee's reporting manager</p></div>
      <span class="zr-grow"></span>
      <div class="zo-tools">
        <label class="zo-search"><mat-icon>search</mat-icon><input [value]="q" (input)="search($any($event.target).value)" placeholder="Find an employee" aria-label="Find an employee"></label>
        <select class="zr-in" (change)="branch = $any($event.target).value; build()" aria-label="Branch"><option value="">All branches</option><option *ngFor="let b of branches" [value]="b">{{ b }}</option></select>
        <select class="zr-in" (change)="dept = $any($event.target).value; build()" aria-label="Department"><option value="">All departments</option><option *ngFor="let d of depts" [value]="d">{{ d }}</option></select>
        <button type="button" class="zr-btn" (click)="all(true)">Expand all</button>
        <button type="button" class="zr-btn" (click)="all(false)">Collapse</button>
        <span class="zo-zoom"><button type="button" class="zr-ic" (click)="zoom = Math.max(.4, zoom - .1)" aria-label="Zoom out"><mat-icon>remove</mat-icon></button>{{ (zoom * 100) | number:'1.0-0' }}%<button type="button" class="zr-ic" (click)="zoom = Math.min(1.4, zoom + .1)" aria-label="Zoom in"><mat-icon>add</mat-icon></button></span>
        <button type="button" class="zr-btn" (click)="print()"><mat-icon>print</mat-icon>Print</button>
      </div>
    </header>
    <p class="zr-muted" *ngIf="!loading && !roots.length">No employees match.</p>
    <p class="zr-muted" *ngIf="loading">Loading…</p>
    <div class="zo-canvas">
      <div class="zo-tree" [style.transform]="'scale(' + zoom + ')'">
        <ul class="zo-level"><ng-container *ngTemplateOutlet="level; context: { $implicit: roots }"></ng-container></ul>
      </div>
    </div>
    <ng-template #level let-nodes>
      <li *ngFor="let n of nodes">
        <div class="zo-card" [class.hit]="n.hit" [class.mute]="q && !n.hit">
          <span class="zo-av" [style.background]="color(n.department)"><img *ngIf="n.photo" [src]="photo(n.photo)" alt="">{{ n.photo ? '' : initials(n.name) }}</span>
          <div class="zo-txt"><b>{{ n.name }}</b><span>{{ n.designation || '—' }}</span><small>{{ n.department }}{{ n.branch ? ' · ' + n.branch : '' }}</small><small class="zo-code">{{ n.code }}</small></div>
          <button type="button" class="zo-tog" *ngIf="n.kids.length" (click)="n.open = !n.open" [attr.aria-expanded]="n.open" [attr.aria-label]="(n.open ? 'Hide ' : 'Show ') + n.size + ' reports'">{{ n.open ? '−' : n.size }}</button>
        </div>
        <ul *ngIf="n.kids.length && n.open"><ng-container *ngTemplateOutlet="level; context: { $implicit: n.kids }"></ng-container></ul>
      </li>
    </ng-template>
    <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
  </div>`,
  styles: [`
    .zo-page { padding: 4px 4px 40px; text-align: left; }
    .zo-h { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .zo-h h2 { font-size: 22px; margin: 0 0 2px; color: var(--zl-ink); }
    .zo-h p { margin: 0; }
    .zo-tools { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .zo-tools .zr-in { width: auto; height: 32px; padding: 0 8px; }
    .zo-search { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--zl-line); border-radius: 7px; padding: 0 8px; height: 32px; background: #fff; }
    .zo-search input { border: none; outline: none; font: inherit; font-size: 13px; width: 170px; }
    .zo-search .mat-icon { color: var(--zl-muted); font-size: 18px; width: 18px; height: 18px; }
    .zo-zoom { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: var(--zl-muted); }
    .zo-canvas { overflow: auto; background: #fff; border: 1px solid var(--zl-line); border-radius: 12px; padding: 24px; min-height: 420px; }
    .zo-tree { transform-origin: top left; width: max-content; }
    .zo-tree ul { display: flex; justify-content: center; padding: 22px 0 0; margin: 0; position: relative; list-style: none; }
    .zo-tree ul.zo-level { padding-top: 0; }
    .zo-tree li { display: flex; flex-direction: column; align-items: center; position: relative; padding: 22px 8px 0; }
    .zo-tree ul.zo-level > li { padding-top: 0; }
    /* connectors */
    .zo-tree li::before, .zo-tree li::after { content: ''; position: absolute; top: 0; width: 50%; height: 22px; border-top: 1.5px solid #cfd2e6; }
    .zo-tree li::before { right: 50%; }
    .zo-tree li::after { left: 50%; border-left: 1.5px solid #cfd2e6; }
    .zo-tree li:only-child::before, .zo-tree li:only-child::after { border-top: none; }
    .zo-tree li:first-child::before, .zo-tree li:last-child::after { border-top: none; }
    .zo-tree li:last-child::before { border-right: 1.5px solid #cfd2e6; border-radius: 0 6px 0 0; }
    .zo-tree li:first-child::after { border-radius: 6px 0 0 0; }
    .zo-tree ul.zo-level > li::before, .zo-tree ul.zo-level > li::after { display: none; }
    .zo-tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; height: 22px; border-left: 1.5px solid #cfd2e6; }
    .zo-tree ul.zo-level::before { display: none; }
    .zo-card { position: relative; display: flex; gap: 10px; align-items: center; width: 220px; padding: 10px 12px; background: #fff; border: 1px solid var(--zl-line); border-radius: 12px; box-shadow: 0 1px 3px rgba(27,22,64,.06); }
    .zo-card.hit { border-color: var(--zl-primary); box-shadow: 0 0 0 2px var(--zl-weak); }
    .zo-card.mute { opacity: .45; }
    .zo-av { flex: 0 0 40px; height: 40px; border-radius: 50%; color: #fff; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; }
    .zo-av img { width: 100%; height: 100%; object-fit: cover; }
    .zo-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
    .zo-txt b { font-size: 13px; color: var(--zl-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zo-txt span { font-size: 12px; color: var(--zl-text); }
    .zo-txt small { font-size: 11px; color: var(--zl-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zo-code { font-variant-numeric: tabular-nums; }
    .zo-tog { position: absolute; bottom: -11px; left: 50%; transform: translateX(-50%); min-width: 24px; height: 22px; border-radius: 11px; border: 1px solid var(--zl-line); background: #fff; font-size: 11px; font-weight: 600; color: var(--zl-primary-ink); cursor: pointer; z-index: 1; }
    @media print { .zo-h .zo-tools, app-main-sidebar nav, .sub-sidenav { display: none !important; } .zo-canvas { border: none; overflow: visible; } }
  `],
})
export class ZOrgChartComponent implements OnInit {
  Math = Math;
  nodes: Node[] = [];
  roots: Node[] = [];
  branches: string[] = []; depts: string[] = [];
  branch = ''; dept = ''; q = ''; zoom = 1; total = 0;
  loading = true; error = '';

  constructor(private rec: ZRecordService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      const rows = await firstValueFrom(this.rec.orgChart());
      this.nodes = rows.map(r => ({ ...r, kids: [], open: true, hit: false, size: 0 }));
      this.branches = Array.from(new Set(this.nodes.map(n => n.branch).filter(Boolean))).sort();
      this.depts = Array.from(new Set(this.nodes.map(n => n.department).filter(Boolean))).sort();
      this.build();
    } catch (e: any) { this.error = e?.error?.detail || 'The chart could not be loaded.'; }
    this.loading = false; this.cd.detectChanges();
  }

  build(): void {
    const keep = this.nodes.filter(n => (!this.branch || n.branch === this.branch) && (!this.dept || n.department === this.dept));
    const ids = new Map(keep.map(n => [n.id, n]));
    keep.forEach(n => { n.kids = []; });
    const roots: Node[] = [];
    for (const n of keep) {
      const m = n.manager !== null ? ids.get(n.manager) : undefined;
      // guard against loops in the reporting lines
      if (m && !this.isAbove(n, m, ids)) { m.kids.push(n); } else { roots.push(n); }
    }
    const size = (n: Node): number => (n.size = n.kids.reduce((s, k) => s + 1 + size(k), 0));
    roots.forEach(size);
    const sortKids = (list: Node[]) => { list.sort((a, b) => b.size - a.size || a.name.localeCompare(b.name)); list.forEach(n => sortKids(n.kids)); };
    sortKids(roots);
    // people without a manager and without reports are grouped under one "Not in a reporting line" card row
    this.roots = roots;
    this.total = keep.length;
    if (keep.length > 60) { this.roots.forEach(r => r.kids.forEach(k => k.open = false)); }
    this.search(this.q);
  }

  private isAbove(n: Node, m: Node, ids: Map<number, Node>): boolean {
    let cur: Node | undefined = m; let guard = 0;
    while (cur && guard++ < 500) { if (cur.id === n.id) { return true; } cur = cur.manager !== null ? ids.get(cur.manager) : undefined; }
    return false;
  }

  search(q: string): void {
    this.q = q.trim().toLowerCase();
    const walk = (n: Node): boolean => {
      n.hit = !!this.q && [n.name, n.code, n.designation, n.department].some(x => (x || '').toLowerCase().includes(this.q));
      const below = n.kids.map(walk).some(Boolean);
      if (this.q && below) { n.open = true; }
      return n.hit || below;
    };
    this.roots.forEach(walk);
    this.cd.detectChanges();
  }

  all(open: boolean): void { const w = (n: Node) => { n.open = open; n.kids.forEach(w); }; this.roots.forEach(w); }
  initials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase(); }
  photo(p: string): string { return /^https?:/.test(p) ? p : this.rec.api + p; }
  color(dept: string): string {
    const pal = ['#5b4fe0', '#2e9d6a', '#b8730f', '#3a8fd6', '#c4479a', '#d64550', '#4b5563', '#0f766e'];
    let h = 0; for (const c of dept || '') { h = (h * 31 + c.charCodeAt(0)) >>> 0; }
    return pal[h % pal.length];
  }
  print(): void { this.all(true); setTimeout(() => window.print(), 200); }
}
