import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { skip } from 'rxjs/operators';
import { ZRecordService } from '../shared-ui/z-record.service';
import { EmployeeService } from '../employee-master/employee.service';
import { recordUrl } from '../shared-ui/z-nav';

const COLORS: Record<string, string> = {
  annual: '#5b4ff5', sick: '#d9534f', maternity: '#1b9e8f', paternity: '#1b9e8f', bereavement: '#55607a',
  casual: '#d38b00', unpaid: '#9aa0b4', compensatory: '#2e9d6a',
};
const LABELS: Record<string, string> = {
  annual: 'Annual', sick: 'Sick', maternity: 'Maternity / parental', bereavement: 'Bereavement', casual: 'Casual / study', unpaid: 'Unpaid / Hajj', compensatory: 'Compensatory',
};

/** v1.10.0 – Leave planner: who is away on which day, by department, with weekends, public holidays and pending requests. */
@Component({
  selector: 'app-leave-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./leave-policy.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Leave planner</h1>
          <p class="lp-desc">Who is away and when – approved leave in colour, requests waiting for approval striped. Click a bar to open the request.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn" (click)="shift(-1)" aria-label="Previous month">‹</button>
          <span class="pl-month">{{ title }}</span>
          <button type="button" class="lp-btn" (click)="shift(1)" aria-label="Next month">›</button>
          <button type="button" class="lp-btn" (click)="today()">This month</button>
        </div>
      </div>
      <div class="pl-bar">
        <select [(ngModel)]="dept" (ngModelChange)="regroup()" aria-label="Department"><option value="">All departments</option><option *ngFor="let d of depts" [value]="d">{{ d }}</option></select>
        <select [(ngModel)]="type" (ngModelChange)="load()" aria-label="Leave type"><option value="">All leave types</option><option *ngFor="let t of allTypes" [value]="t.id">{{ t.name }}</option></select>
        <label class="ck"><input type="checkbox" [(ngModel)]="showPending" (ngModelChange)="load()"> Waiting for approval</label>
        <label class="ck"><input type="checkbox" [(ngModel)]="onlyAway" (ngModelChange)="regroup()"> Only people with leave</label>
        <select [(ngModel)]="span" (ngModelChange)="load()" aria-label="Months shown"><option [ngValue]="1">1 month</option><option [ngValue]="2">2 months</option><option [ngValue]="3">3 months</option></select>
      </div>
    </div>

    <div class="com_list mt-4">
      <p class="lp-msg err" *ngIf="error">{{ error }}</p>
      <div class="pl-legend">
        <span *ngFor="let k of legend"><i [style.background]="color(k)"></i>{{ label(k) }}</span>
        <span><i style="background:#9aa0b4;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.6) 0 3px,transparent 3px 6px)"></i>Waiting for approval</span>
        <span><i style="background:#f3f4f8;border:1px solid #e3e5ef"></i>Weekend</span>
        <span><i style="background:#fff4e5;border:1px solid #f3dcb5"></i>Public holiday</span>
      </div>
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <div class="pl-wrap" *ngIf="!loading && data">
        <table zPlain class="pl-grid">
          <thead><tr>
            <th class="who">Employee</th>
            <th *ngFor="let d of days" [class.we]="d.we" [class.hol]="d.hol" [class.today]="d.today" [title]="d.hol ? 'Public holiday' : ''">{{ d.dow }}<br>{{ d.n }}</th>
          </tr></thead>
          <tbody>
            <ng-container *ngFor="let g of groups; trackBy: byName">
              <tr class="dept"><td [attr.colspan]="days.length + 1">{{ g.name }} <span class="lp-muted">· {{ g.rows.length }}</span></td></tr>
              <tr *ngFor="let r of g.rows; trackBy: byId">
                <td class="who" [title]="r.employee">{{ r.employee }}</td>
                <td *ngFor="let d of days; trackBy: byIso" class="pl-bar-cell" [class.we]="d.we" [class.hol]="d.hol">
                  <ng-container *ngIf="cell(r, d.iso) as l">
                    <button type="button" class="pl-pill" [class.start]="l.from === d.iso || d.first" [class.end]="l.to === d.iso || d.last"
                      [class.pending]="l.status === 'pending'" [class.half]="l.half" [style.background-color]="color(l.category)"
                      [attr.aria-label]="r.employee + ': ' + l.type + ' ' + l.start + ' to ' + l.end + ' (' + l.status + ')'"
                      (mouseenter)="tip($event, r, l)" (mouseleave)="tipText = ''" (focus)="tip($event, r, l)" (blur)="tipText = ''" (click)="open(l)"></button>
                  </ng-container>
                </td>
              </tr>
            </ng-container>
            <tr class="pl-count"><td class="who">Away</td><td *ngFor="let d of days" [class.hot]="(awayN[d.iso] || 0) >= hot">{{ awayN[d.iso] || '' }}</td></tr>
          </tbody>
        </table>
      </div>
      <p class="lp-muted" *ngIf="!loading && data && !groups.length">Nobody in this selection.</p>
      <p class="lp-muted" *ngIf="data" style="margin-top:10px">{{ data.headcount }} employees · red count = {{ hot }} or more away on the same day.</p>
    </div>
  </div>
</div>
<div class="pl-tip" *ngIf="tipText" [style.left.px]="tipX" [style.top.px]="tipY" [innerText]="tipText"></div>`,
})
export class LeavePlannerComponent implements OnInit, OnDestroy {
  start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  span = 1;
  dept = ''; type = ''; showPending = true; onlyAway = false;
  data: any = null; loading = false; error = '';
  days: any[] = []; depts: string[] = []; allTypes: any[] = []; legend: string[] = [];
  tipText = ''; tipX = 0; tipY = 0;
  private sub?: Subscription;
  private byEmp = new Map<number, Map<string, any>>();

  constructor(private http: HttpClient, private rec: ZRecordService, private router: Router, private emp: EmployeeService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.sub = this.emp.selectedBranches$.pipe(skip(1)).subscribe(() => this.load());
    firstValueFrom(this.http.get<any[]>(this.url('calendars/api/leave-type/'))).then(t => { this.allTypes = t || []; this.cd.detectChanges(); }).catch(() => {});
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private url(p: string, q = ''): string { return `${this.rec.api}/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }
  private iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  get title(): string {
    const end = new Date(this.start.getFullYear(), this.start.getMonth() + this.span - 1, 1);
    const f = (d: Date) => d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    return this.span === 1 ? f(this.start) : `${this.start.toLocaleString('en-GB', { month: 'short' })} – ${f(end)}`;
  }
  get hot(): number { return Math.max(3, Math.ceil((this.data?.headcount || 0) * 0.2)); }

  shift(n: number): void { this.start = new Date(this.start.getFullYear(), this.start.getMonth() + n, 1); this.load(); }
  today(): void { this.start = new Date(new Date().getFullYear(), new Date().getMonth(), 1); this.load(); }

  async load(): Promise<void> {
    this.loading = true; this.error = ''; this.cd.detectChanges();
    const end = new Date(this.start.getFullYear(), this.start.getMonth() + this.span, 0);
    let branches = '';
    try { branches = (JSON.parse(localStorage.getItem('selectedBranchIds') || '[]') as number[]).join(','); } catch { branches = ''; }
    const status = this.showPending ? 'approved,pending' : 'approved';
    try {
      this.data = await firstValueFrom(this.http.get<any>(this.url('leave-policy/api/planner/',
        `&from=${this.iso(this.start)}&to=${this.iso(end)}&branch=${branches}&status=${status}${this.type ? '&leave_type=' + this.type : ''}`)));
    } catch (e: any) { this.error = e?.error?.detail || 'The planner could not be loaded.'; this.data = null; }
    this.build(end);
    this.loading = false; this.cd.detectChanges();
  }

  private build(end: Date): void {
    this.days = []; this.byEmp.clear();
    if (!this.data) { this.regroup(); return; }
    const we = new Set<string>(this.data.weekend || []);
    const hol = new Set<string>((this.data.holidays || []).map((x: any) => String(x)));
    const todayIso = this.iso(new Date());
    const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let d = new Date(this.start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = this.iso(d);
      this.days.push({ iso, n: d.getDate(), dow: d.toLocaleString('en-GB', { weekday: 'short' }).slice(0, 2), we: we.has(names[d.getDay()]), hol: hol.has(iso), today: iso === todayIso,
                       first: d.getDate() === 1, last: d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() });
    }
    const cats = new Set<string>();
    for (const r of this.data.rows) {
      const m = new Map<string, any>();
      for (const l of r.leaves) {
        cats.add(this.cat(l.category));
        for (let d = new Date(l.from + 'T00:00:00'); this.iso(d) <= l.to; d.setDate(d.getDate() + 1)) { m.set(this.iso(d), l); }
      }
      this.byEmp.set(r.id, m);
    }
    this.legend = Object.keys(LABELS).filter(k => cats.has(k));
    this.depts = Array.from(new Set<string>(this.data.rows.map((r: any) => r.department || '(no department)'))).sort();
    this.regroup();
  }

  groups: { name: string; rows: any[] }[] = [];
  awayN: Record<string, number> = {};
  byName = (_: number, g: any) => g.name;
  byId = (_: number, r: any) => r.id;
  byIso = (_: number, d: any) => d.iso;

  regroup(): void {
    const out = new Map<string, any[]>(); this.awayN = {};
    for (const r of (this.data?.rows || [])) {
      const dn = r.department || '(no department)';
      if (this.dept && dn !== this.dept) { continue; }
      if (this.onlyAway && !r.leaves.length) { continue; }
      if (!out.has(dn)) { out.set(dn, []); }
      out.get(dn)!.push(r);
      for (const iso of (this.byEmp.get(r.id)?.keys() || [])) { this.awayN[iso] = (this.awayN[iso] || 0) + 1; }
    }
    this.groups = Array.from(out.entries()).map(([name, rows]) => ({ name, rows }));
  }

  cell(r: any, iso: string): any { return this.byEmp.get(r.id)?.get(iso) || null; }
  private cat(c: string): string { return c === 'paternity' ? 'maternity' : (COLORS[c] ? c : 'casual'); }
  color(c: string): string { return COLORS[this.cat(c)] || '#9aa0b4'; }
  label(c: string): string { return LABELS[c] || c; }

  tip(ev: Event, r: any, l: any): void {
    const el = ev.target as HTMLElement; const b = el.getBoundingClientRect();
    this.tipText = `${r.employee}\n${l.type} · ${l.number || ''}\n${l.start} → ${l.end} (${l.days} days)\n${l.status === 'pending' ? 'Waiting for approval' : 'Approved'}`;
    this.tipX = Math.min(b.left, window.innerWidth - 290); this.tipY = b.bottom + 6;
  }
  open(l: any): void { this.tipText = ''; this.router.navigateByUrl(recordUrl('calendars.employee_leave_request', l.id)); }
}
