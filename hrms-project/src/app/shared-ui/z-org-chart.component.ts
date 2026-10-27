import { ElementRef, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ZListService } from './z-list.service';
import { OrgSettingsService } from '../org-structure/org-settings.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { HttpClient } from '@angular/common/http';   // v1.45.0 transfer request by drag and drop

interface Node { id: number; code: string; name: string; designation: string; department: string; branch: string; email: string; photo: string | null; manager: number | null; kids: Node[]; open: boolean; hit: boolean; size: number;
  dotted?: { manager: number; area: string } | null; assignments?: { kind: string; where: string; percent: string }[]; }   // v1.58.0

/** Employee organisation chart, from each employee's reporting manager. */
@Component({
  selector: 'z-org-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zo-page">
    <header class="zo-h">
      <div><h2>Organisation chart</h2><p class="zr-muted">{{ total }} employees · built from each employee's reporting manager · drag a card onto another person to ask HR for a move</p></div>
      <span class="zr-grow"></span>
      <div class="zo-tools">
        <label class="zo-search"><mat-icon>search</mat-icon><input [value]="q" (input)="search($any($event.target).value)" placeholder="Find an employee" aria-label="Find an employee"></label>
        <select class="zr-in" (change)="branch = $any($event.target).value; build()" aria-label="Branch"><option value="">All branches</option><option *ngFor="let b of branches" [value]="b">{{ b }}</option></select>
        <select class="zr-in" (change)="dept = $any($event.target).value; build()" aria-label="Department"><option value="">All departments</option><option *ngFor="let d of depts" [value]="d">{{ d }}</option></select>
        <select class="zr-in" *ngIf="units.length" (change)="unit = $any($event.target).value; build()" aria-label="Organisation unit"><option value="">All units</option><option *ngFor="let u of units" [value]="u.key">{{ u.label }}</option></select>
        <button type="button" class="zr-btn" (click)="all(true)">Expand all</button>
        <button type="button" class="zr-btn" (click)="all(false)">Collapse</button>
        <span class="zo-zoom"><button type="button" class="zr-ic" (click)="zoom = Math.max(.3, zoom - .1)" aria-label="Zoom out"><mat-icon>remove</mat-icon></button>{{ (zoom * 100) | number:'1.0-0' }}%<button type="button" class="zr-ic" (click)="zoom = Math.min(1.4, zoom + .1)" aria-label="Zoom in"><mat-icon>add</mat-icon></button></span>
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
        <div class="zo-card" [class.hit]="n.hit" [class.mute]="q && !n.hit" [class.drop]="overId === n.id" draggable="true"
             (dragstart)="dragStart($event, n)" (dragend)="overId = null" (dragover)="dragOver($event, n)" (dragleave)="overId === n.id && (overId = null)" (drop)="dropOn($event, n)"
             [title]="'Drag onto another person: ' + n.name + ' would report to them (HR approves)'">
          <span class="zo-av" [style.background]="color(n.department)"><img *ngIf="n.photo" [src]="photo(n.photo)" alt="">{{ n.photo ? '' : initials(n.name) }}</span>
          <div class="zo-txt"><b>{{ n.name }}</b><span>{{ n.designation || '—' }}</span><small>{{ n.department }}{{ n.branch ? ' · ' + n.branch : '' }}</small><small *ngIf="extra(n)">{{ extra(n) }}</small><small class="zo-code">{{ n.code }}</small>
            <small class="zo-dotted" *ngIf="n.dotted" [attr.data-dotted]="n.id" [title]="'Functional (dotted-line) manager'">┄ {{ dottedName(n) }}{{ n.dotted.area ? ' (' + n.dotted.area + ')' : '' }}</small>
            <small class="zo-asg" *ngFor="let a of n.assignments || []" [attr.data-asg]="n.id">{{ a.kind }}: {{ a.where }} {{ a.percent }}%</small></div>
          <button type="button" class="zo-tog" *ngIf="n.kids.length" (click)="n.open = !n.open" [attr.aria-expanded]="n.open" [attr.aria-label]="(n.open ? 'Hide ' : 'Show ') + n.size + ' reports'">{{ n.open ? '−' : n.size }}</button>
        </div>
        <ul *ngIf="n.kids.length && n.open"><ng-container *ngTemplateOutlet="level; context: { $implicit: n.kids }"></ng-container></ul>
      </li>
    </ng-template>
    <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
    <!-- v1.45.0 move request -->
    <div class="zo-move-back" *ngIf="move" (click)="move = null">
      <div class="zo-move" role="dialog" aria-modal="true" aria-label="Transfer request" (click)="$event.stopPropagation()">
        <h3>Move {{ move.emp.name }}</h3>
        <p>New reporting manager: <b>{{ move.to.name }}</b>{{ move.to.designation ? ' (' + move.to.designation + ')' : '' }}</p>
        <p class="zr-muted">Now reports to {{ managerName(move.emp) }}. HR approves the request; the move is then made on the date below (a transfer with history and the employee timeline).</p>
        <label class="zf-label">Effective date<input type="date" class="zf-in" [value]="move.date" (change)="move.date = $any($event.target).value"></label>
        <label class="zf-label">Reason<textarea class="zf-in" rows="2" [value]="move.reason" (input)="move.reason = $any($event.target).value" placeholder="Why the move"></textarea></label>
        <div class="zr-err" *ngIf="move.err">{{ move.err }}</div>
        <div class="zr-row"><span class="zr-grow"></span><button type="button" class="zr-btn" (click)="move = null">Cancel</button>
          <button type="button" class="zr-btn primary" [disabled]="move.busy" (click)="sendMove()">Send to HR</button></div>
      </div>
    </div>
    <div class="zo-ok" *ngIf="moved" role="status">{{ moved }}</div>
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
    .zo-dotted { color: #3E3A99; border-top: 1px dashed #B9B3F0; margin-top: 3px; padding-top: 2px; } .zo-asg { color: #2E7D57; }   /* v1.58.0 */
    .zo-tog { position: absolute; bottom: -11px; left: 50%; transform: translateX(-50%); min-width: 24px; height: 22px; border-radius: 11px; border: 1px solid var(--zl-line); background: #fff; font-size: 11px; font-weight: 600; color: var(--zl-primary-ink); cursor: pointer; z-index: 1; }
    .zo-card[draggable=true] { cursor: grab; }
    .zo-card.drop { border-color: var(--zl-primary); box-shadow: 0 0 0 3px var(--zl-weak); background: #f6f5ff; }
    .zo-move-back { position: fixed; inset: 0; background: rgba(27,22,64,.35); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .zo-move { background: #fff; border-radius: 14px; width: min(460px, 100%); padding: 18px 20px; box-shadow: 0 24px 60px rgba(27,22,64,.3); display: flex; flex-direction: column; gap: 8px; }
    .zo-move h3 { margin: 0; font-size: 17px; color: var(--zl-ink); }
    .zo-move p { margin: 0; font-size: 13px; }
    .zo-move .zf-label { display: flex; flex-direction: column; gap: 4px; }
    .zo-ok { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1b1640; color: #fff; padding: 10px 16px; border-radius: 8px; z-index: 2100; font-size: 13px; }
    @media print { .zo-h .zo-tools, app-main-sidebar nav, .sub-sidenav { display: none !important; } .zo-canvas { border: none; overflow: visible; } }
  `],
})
export class ZOrgChartComponent implements OnInit {
  Math = Math;
  nodes: Node[] = [];
  roots: Node[] = [];
  branches: string[] = []; depts: string[] = [];
  branch = ''; dept = ''; q = ''; zoom = 1; total = 0;
  // v1.12.0: filter by a switched-on org unit (division, section, location …) and show the job position / grade on the card
  unit = ''; units: { key: string; label: string }[] = [];
  private orgDir = new Map<string, any>();
  private orgFields: { field: string; label: string }[] = [];
  private zl = inject(ZListService);
  private orgSettings = inject(OrgSettingsService);
  loading = true; error = '';

  constructor(private rec: ZRecordService, private cd: ChangeDetectorRef, private host: ElementRef<HTMLElement>, private http: HttpClient) {}

  // ---------------------------------------------------------------- v1.45.0 drag a card onto another person = transfer request
  overId: number | null = null;
  move: { emp: Node; to: Node; date: string; reason: string; busy: boolean; err: string } | null = null;
  moved = '';
  private dragId: number | null = null;
  dragStart(ev: DragEvent, n: Node): void { this.dragId = n.id; ev.dataTransfer?.setData('text/plain', String(n.id)); if (ev.dataTransfer) { ev.dataTransfer.effectAllowed = 'move'; } }
  dragOver(ev: DragEvent, n: Node): void {
    if (this.dragId === null || this.dragId === n.id) { return; }
    const emp = this.nodes.find(x => x.id === this.dragId);
    if (!emp || emp.manager === n.id || this.isUnder(n, emp)) { return; }   // already the manager, or would make a loop
    ev.preventDefault(); this.overId = n.id;
  }
  dropOn(ev: DragEvent, n: Node): void {
    ev.preventDefault(); this.overId = null;
    const emp = this.nodes.find(x => x.id === this.dragId);
    this.dragId = null;
    if (!emp || emp.id === n.id) { return; }
    this.move = { emp, to: n, date: new Date().toISOString().slice(0, 10), reason: '', busy: false, err: '' };
  }
  private isUnder(n: Node, emp: Node): boolean {
    const ids = new Map(this.nodes.map(x => [x.id, x]));
    let cur: Node | undefined = n; let guard = 0;
    while (cur && guard++ < 500) { if (cur.id === emp.id) { return true; } cur = cur.manager !== null ? ids.get(cur.manager) : undefined; }
    return false;
  }
  managerName(n: Node): string { return this.nodes.find(x => x.id === n.manager)?.name || 'nobody'; }
  dottedName(n: Node): string { return this.nodes.find(x => x.id === n.dotted?.manager)?.name || ''; }   // v1.58.0
  async sendMove(): Promise<void> {
    if (!this.move) { return; }
    const m = this.move;
    m.busy = true; m.err = '';
    try {
      await firstValueFrom(this.http.post(`${this.rec.api}/hr-actions/api/transfers/`,
        { request: true, employee: m.emp.id, to_manager_employee: m.to.id, effective_date: m.date, reason: m.reason || 'Moved on the org chart' },
        { params: { schema: localStorage.getItem('selectedSchema') || '' } }));
      this.move = null;
      this.moved = `Request sent to HR: ${m.emp.name} to report to ${m.to.name}.`;
      setTimeout(() => { this.moved = ''; this.cd.detectChanges(); }, 5000);
    } catch (e: any) { m.err = e?.error?.detail || 'The request could not be sent.'; m.busy = false; }
    this.cd.detectChanges();
  }

  async ngOnInit(): Promise<void> {
    try {
      const rows = await firstValueFrom(this.rec.orgChart());
      this.nodes = rows.map(r => ({ ...r, kids: [], open: true, hit: false, size: 0 }));
      this.branches = Array.from(new Set(this.nodes.map(n => n.branch).filter(Boolean))).sort();
      this.depts = Array.from(new Set(this.nodes.map(n => n.department).filter(Boolean))).sort();
      await this.loadOrgUnits();
      this.build();
    } catch (e: any) { this.error = e?.error?.detail || 'The chart could not be loaded.'; }
    this.loading = false; this.cd.detectChanges();
  }

  private async loadOrgUnits(): Promise<void> {
    try {
      const st = await firstValueFrom(this.orgSettings.load());
      this.orgFields = this.orgSettings.activeFields(st).map(f => ({ field: f.field, label: f.label }));
      if (!this.orgFields.length) { return; }
      const dir = await firstValueFrom(this.zl.directory());
      this.orgDir = new Map((dir || []).map((e: any) => [String(e.code), e]));
      const out: { key: string; label: string }[] = [];
      for (const f of this.orgFields.filter(x => x.field !== 'job_position')) {
        const vals = Array.from(new Set((dir || []).map((e: any) => e[f.field]).filter(Boolean))).sort() as string[];
        vals.forEach(v => out.push({ key: f.field + '|' + v, label: `${f.label}: ${v}` }));
      }
      this.units = out;
    } catch { this.units = []; }
  }

  extra(n: Node): string {
    const e = this.orgDir.get(String(n.code));
    if (!e) { return ''; }
    return [e.job_position, e.grade && 'Grade ' + e.grade].filter(Boolean).join(' · ');
  }

  private inUnit(n: Node): boolean {
    if (!this.unit) { return true; }
    const [f, v] = [this.unit.slice(0, this.unit.indexOf('|')), this.unit.slice(this.unit.indexOf('|') + 1)];
    return this.orgDir.get(String(n.code))?.[f] === v;
  }

  build(): void {
    const keep = this.nodes.filter(n => (!this.branch || n.branch === this.branch) && (!this.dept || n.department === this.dept) && this.inUnit(n));
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
    this.fit();
  }

  /** Phones and tablets: start zoomed out so the whole chart fits the screen width. */
  private fit(): void {
    if (window.innerWidth > 991) { return; }
    const tree = this.host.nativeElement.querySelector('.zo-tree') as HTMLElement | null;
    const box = tree?.parentElement;
    if (!tree || !box || !tree.scrollWidth) { return; }
    const z = Math.floor(Math.min(1, (box.clientWidth - 8) / tree.scrollWidth) * 10) / 10;
    this.zoom = Math.max(.6, z);
    this.cd.detectChanges();
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
