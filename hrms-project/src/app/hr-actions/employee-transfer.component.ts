/**
 * README – Employee transfer (v1.11.0)
 * ------------------------------------------------------------------------------------------------
 * Moves an employee to another branch / department / designation / category / reporting manager on
 * an effective date, optionally with new salary amounts. The backend (HRActions) carries what belongs
 * to the employee: leave balances, branch salary components and structures, open requests, user
 * branch access and geo-fences; documents, attendance and payslips stay with the employee.
 *
 * API (all with ?schema=<selectedSchema>):
 *   GET  hr-actions/api/transfers/                 list (employee, dates, from → to, status, done lines)
 *   POST hr-actions/api/transfers/preview/         {employee, effective_date, to_*, salary_changes, reason}
 *                                                  → {changes:[{area,what,from,to}], warnings, blockers, stays}
 *   POST hr-actions/api/transfers/                 same body → {status:'done', done:[…]} | {status:'scheduled', plan}
 *   POST hr-actions/api/transfers/<id>/apply/      carry out a scheduled transfer now
 *   POST hr-actions/api/transfers/<id>/cancel/     cancel a scheduled transfer
 * Lookups: tools/api/directory/, organisation/api/Branch|Department|Designation|Catogory/, users/api/user/,
 *          payroll/api/salarycomponent/, employee/api/Employee/<id>/ (current reporting manager).
 *
 * Flow: New transfer → pick employee (current posting is shown) → choose what changes (empty = no change)
 *       → Preview (changes by area, warnings, blockers, what stays) → Transfer. A date in the future is
 *       scheduled and carried out by the daily job, or now with "Carry out now".
 * Permissions: change_emp_master / run_employee_transfer (backend checks them too).
 */
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { OrgSettingsService } from '../org-structure/org-settings.service';   // v1.12.0
import { ZIfOrgDirective } from '../org-structure/z-if-org.directive';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { employeeUrl } from '../shared-ui/z-nav';

interface Plan { changes: { area: string; what: string; from: string; to: string }[]; warnings: string[]; blockers: string[]; stays: string[]; }
interface SalRow { code: string; amount: number | null; }

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function firstOfNextMonth(): string { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth() + 1, 1)); }
function list<T = any>(x: any): T[] { return Array.isArray(x) ? x : (x?.results || x?.data || []); }

@Component({
  selector: 'app-employee-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective, ZIfOrgDirective],
  styleUrls: ['../leave-policy/leave-policy.css', './hr-actions.css'],
  template: `
<div class="container ha-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Employee transfer</h1>
          <p class="lp-desc">Move an employee to another branch, department, designation, category or reporting manager. Leave balances, branch salary components, open requests and branch access move with them; documents, attendance and payslips stay with the employee. A future date is scheduled and carried out on that day.</p>
        </div>
        <div class="lp-actions">
          <select [(ngModel)]="filter" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px" aria-label="Status">
            <option value="">All transfers</option><option value="Scheduled">Scheduled</option><option value="Done">Done</option><option value="Cancelled">Cancelled</option></select>
          <button type="button" class="lp-btn primary" (click)="openNew()" *ngIf="!form">+ New transfer</button>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}
        <ul class="ha-done" *ngIf="msgLines.length"><li *ngFor="let l of msgLines">{{ l }}</li></ul>
      </div>

      <!-- new transfer -->
      <div class="ha-panel" *ngIf="form">
        <h2>New transfer</h2>
        <p class="lp-muted" style="margin:0">Leave a field on “No change” to keep it as it is.</p>
        <div class="lp-form">
          <label>Find employee<input [(ngModel)]="q" placeholder="Name or code" aria-label="Find employee"></label>
          <label>Employee
            <select [(ngModel)]="form.employee" (ngModelChange)="pickEmp($event)">
              <option [ngValue]="null">Choose…</option>
              <option *ngFor="let e of empOptions()" [ngValue]="e.id">{{ e.code }} – {{ e.name }}</option>
            </select></label>
          <label>Effective date<input type="date" [(ngModel)]="form.effective_date" (ngModelChange)="dirty()"></label>
        </div>

        <div class="ha-now" *ngIf="cur">
          <div><span>Branch</span><b>{{ cur.branch || '–' }}</b></div>
          <div><span>Department</span><b>{{ cur.department || '–' }}</b></div>
          <div><span>Designation</span><b>{{ cur.designation || '–' }}</b></div>
          <div *zIfOrg="'employee_categories'"><span>Category</span><b>{{ cur.category || '–' }}</b></div>
          <div><span>Reporting manager</span><b>{{ curManager || '–' }}</b></div>
          <div *ngFor="let f of orgFields"><span>{{ f.label }}</span><b>{{ cur[f.field] || '–' }}</b></div>
        </div>

        <ng-container *ngIf="form.employee">
          <div class="ha-sub">Move to</div>
          <div class="lp-form" style="margin-top:0">
            <label>New branch
              <select [(ngModel)]="form.to_branch" (ngModelChange)="dirty()"><option [ngValue]="null">No change</option>
                <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.branch_name }}{{ cur?.branch_id === b.id ? ' (current)' : '' }}</option></select></label>
            <label>New department
              <select [(ngModel)]="form.to_department" (ngModelChange)="dirty()"><option [ngValue]="null">No change</option>
                <option *ngFor="let d of depts" [ngValue]="d.id">{{ d.dept_name }}{{ cur?.department_id === d.id ? ' (current)' : '' }}</option></select></label>
            <label>New designation
              <select [(ngModel)]="form.to_designation" (ngModelChange)="dirty()"><option [ngValue]="null">No change</option>
                <option *ngFor="let d of desigs" [ngValue]="d.id">{{ d.desgntn_job_title }}{{ cur?.designation_id === d.id ? ' (current)' : '' }}</option></select></label>
            <label *zIfOrg="'employee_categories'">New category
              <select [(ngModel)]="form.to_category" (ngModelChange)="dirty()"><option [ngValue]="null">No change</option>
                <option *ngFor="let c of cats" [ngValue]="c.id">{{ c.ctgry_title }}{{ cur?.category_id === c.id ? ' (current)' : '' }}</option></select></label>
            <label>New reporting manager
              <select [(ngModel)]="form.to_manager" (ngModelChange)="dirty()"><option [ngValue]="null">No change</option>
                <option *ngFor="let u of users" [ngValue]="u.id">{{ u.username }}{{ curManager === u.username ? ' (current)' : '' }}</option></select></label>
            <!-- v1.12.0: organisation fields switched on in Organisation settings -->
            <label *ngFor="let f of orgFields">New {{ f.label.toLowerCase() }}
              <select [(ngModel)]="form['to_' + f.field]" (ngModelChange)="dirty()"><option [ngValue]="null">No change</option>
                <option *ngFor="let o of orgOpts[f.field] || []" [ngValue]="o.id">{{ o.name }}{{ cur && cur[f.field + '_id'] === o.id ? ' (current)' : '' }}</option></select></label>
            <label class="wide">Reason<input [(ngModel)]="form.reason" (ngModelChange)="dirty()" maxlength="255" placeholder="e.g. New project in Abu Dhabi"></label>
          </div>

          <div class="ha-sub">New salary amounts <span class="lp-muted" style="font-weight:400">(optional, monthly)</span></div>
          <div class="ha-sal" *ngFor="let s of sal; let i = index">
            <select [(ngModel)]="s.code" (ngModelChange)="dirty()" [attr.aria-label]="'Salary component ' + (i + 1)">
              <option value="">Component…</option>
              <option *ngFor="let c of comps" [value]="c.code" [disabled]="taken(c.code, s)">{{ c.name }} ({{ c.code }})</option></select>
            <input type="number" min="0" step="0.01" [(ngModel)]="s.amount" (ngModelChange)="dirty()" placeholder="New amount" [attr.aria-label]="'New amount ' + (i + 1)">
            <button type="button" class="lp-x" (click)="sal.splice(i, 1); dirty()" aria-label="Remove salary line">×</button>
          </div>
          <button type="button" class="lp-btn" (click)="sal.push({ code: '', amount: null })">+ Salary change</button>

          <!-- preview -->
          <ng-container *ngIf="plan">
            <div class="ha-plan">
              <div class="ha-card block" *ngIf="plan.blockers.length">
                <h3>Blockers</h3>
                <ul><li *ngFor="let b of plan.blockers">{{ b }}</li></ul>
              </div>
              <div class="ha-card changes" *ngIf="plan.changes.length">
                <h3>Changes</h3>
                <ng-container *ngFor="let g of groups">
                  <div class="ha-area">{{ g.area }}</div>
                  <div class="ha-chg" *ngFor="let c of g.items"><b>{{ c.what }}</b><br><span class="from">{{ c.from }}</span><span class="arr">→</span><span class="to">{{ c.to }}</span></div>
                </ng-container>
              </div>
              <div class="ha-card warn" *ngIf="plan.warnings.length">
                <h3>Warnings</h3>
                <ul><li *ngFor="let w of plan.warnings">{{ w }}</li></ul>
              </div>
              <div class="ha-card stay" *ngIf="plan.stays.length">
                <h3>Stays with the employee</h3>
                <ul><li *ngFor="let s of plan.stays">{{ s }}</li></ul>
              </div>
            </div>
          </ng-container>
        </ng-container>

        <div class="lp-foot">
          <button type="button" class="lp-btn" (click)="closeNew()">Close</button>
          <button type="button" class="lp-btn" [disabled]="busy || !form.employee" (click)="preview()">{{ busy && !posting ? 'Checking…' : 'Preview' }}</button>
          <button type="button" class="lp-btn primary" [disabled]="busy || !plan || plan.blockers.length > 0" (click)="submit()"
                  [title]="!plan ? 'Preview first' : plan.blockers.length ? 'Solve the blockers first' : ''">
            {{ posting ? 'Saving…' : (isFuture() ? 'Schedule transfer' : 'Transfer') }}</button>
        </div>
      </div>

      <!-- list -->
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <table class="table" *ngIf="!loading">
        <thead><tr><th>Employee</th><th>Effective date</th><th>Branch move</th><th>Department move</th><th>Other changes</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of shown()">
            <td data-label="Employee"><a href="" (click)="$event.preventDefault(); openEmp(r)">{{ r.employee }}</a></td>
            <td data-label="Effective date">{{ r.effective_date | date:'dd/MM/yyyy' }}</td>
            <td data-label="Branch move" class="ha-move"><ng-container *ngIf="r.to_branch && r.to_branch !== r.from_branch; else same">{{ r.from_branch || '–' }}<span class="arr">→</span>{{ r.to_branch }}</ng-container><ng-template #same>{{ r.from_branch || '–' }}</ng-template></td>
            <td data-label="Department move" class="ha-move"><ng-container *ngIf="r.to_department && r.to_department !== r.from_department; else same2">{{ r.from_department || '–' }}<span class="arr">→</span>{{ r.to_department }}</ng-container><ng-template #same2>{{ r.from_department || '–' }}</ng-template></td>
            <td data-label="Other changes" class="ha-move">{{ others(r) || '–' }}</td>
            <td data-label="Status"><span class="ha-tag" [ngClass]="tagClass(r.status)">{{ r.status }}</span></td>
            <td data-label="Actions"><div class="ha-row-actions">
              <button type="button" class="lp-btn" (click)="detail = r">{{ r.status === 'Done' ? 'What moved' : 'Details' }}</button>
              <ng-container *ngIf="r.status === 'Scheduled'">
                <button type="button" class="lp-btn primary" [disabled]="busy" (click)="act(r, 'apply')">Carry out now</button>
                <button type="button" class="lp-btn danger" [disabled]="busy" (click)="act(r, 'cancel')">Cancel</button>
              </ng-container></div></td>
          </tr>
        </tbody>
      </table>
      <p class="lp-muted" *ngIf="!loading && !shown().length">No transfers{{ filter ? ' (' + filter.toLowerCase() + ')' : '' }}.</p>
    </div>
  </div>
</div>

<!-- what was moved -->
<div class="lp-modal-back" *ngIf="detail" (click)="detail = null">
  <div class="lp-modal" style="width:min(640px, 100%)" (click)="$event.stopPropagation()" role="dialog" aria-label="Transfer details">
    <header><h2>{{ detail.employee }}</h2><span class="ha-tag" [ngClass]="tagClass(detail.status)">{{ detail.status }}</span>
      <button type="button" class="lp-x" (click)="detail = null" aria-label="Close" style="color:#6b7185">×</button></header>
    <div class="body">
      <div class="ha-facts">
        <div><span>Effective</span>{{ detail.effective_date | date:'dd/MM/yyyy' }}</div>
        <div><span>Branch</span>{{ detail.from_branch || '–' }}<ng-container *ngIf="detail.to_branch"> → {{ detail.to_branch }}</ng-container></div>
        <div><span>Department</span>{{ detail.from_department || '–' }}<ng-container *ngIf="detail.to_department"> → {{ detail.to_department }}</ng-container></div>
        <div *ngIf="detail.to_designation"><span>New designation</span>{{ detail.to_designation }}</div>
        <div *ngIf="detail.to_category"><span>New category</span>{{ detail.to_category }}</div>
        <div *ngIf="detail.to_manager"><span>New manager</span>{{ detail.to_manager }}</div>
        <div *ngIf="detail.done_at"><span>Carried out</span>{{ detail.done_at | date:'dd/MM/yyyy HH:mm' }}</div>
      </div>
      <p *ngIf="detail.reason" style="font-size:13px;margin:6px 0"><b>Reason:</b> {{ detail.reason }}</p>
      <div class="ha-card changes" *ngIf="detail.done?.length">
        <h3>What was moved</h3>
        <ul><li *ngFor="let l of detail.done">{{ l }}</li></ul>
      </div>
      <p class="lp-muted" *ngIf="detail.status === 'Scheduled'">Scheduled – it is carried out on {{ detail.effective_date | date:'dd/MM/yyyy' }}, or now with “Carry out now”. The full list of what moves is worked out on that day.</p>
      <p class="lp-muted" *ngIf="detail.status === 'Cancelled'">This transfer was cancelled – nothing was changed.</p>
    </div>
    <footer>
      <ng-container *ngIf="detail.status === 'Scheduled'">
        <button type="button" class="lp-btn danger" [disabled]="busy" (click)="act(detail, 'cancel')">Cancel transfer</button>
        <button type="button" class="lp-btn primary" [disabled]="busy" (click)="act(detail, 'apply')">Carry out now</button>
      </ng-container>
      <button type="button" class="lp-btn" (click)="detail = null">Close</button>
    </footer>
  </div>
</div>`,
})
export class EmployeeTransferComponent implements OnInit {
  rows: any[] = []; filter = ''; loading = false; busy = false; posting = false;
  msg = ''; msgErr = false; msgLines: string[] = [];
  dir: any[] = []; branches: any[] = []; depts: any[] = []; desigs: any[] = []; cats: any[] = []; users: any[] = []; comps: any[] = [];
  form: any = null; q = ''; cur: any = null; curManager = ''; sal: SalRow[] = [];
  plan: Plan | null = null; groups: { area: string; items: Plan['changes'] }[] = [];
  detail: any = null;
  private lookupsLoaded = false;
  // v1.12.0: location / division / section / cost centre / grade / position / employment type
  private orgSettings = inject(OrgSettingsService);
  orgFields: { field: string; label: string; endpoint: string }[] = [];
  orgOpts: Record<string, any[]> = {};

  constructor(private http: HttpClient, private rec: ZRecordService, private router: Router, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.rec.api}/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }
  private err(e: any, d = 'It could not be done.'): string {
    const x = e?.error; if (!x) { return d; }
    if (typeof x === 'string') { return x.length < 300 ? x : d; }
    return x.detail || (Array.isArray(x) ? x.join(' ') : Object.values(x).flat().join(' ')) || d;
  }
  private say(m: string, bad = false, lines: string[] = []): void { this.msg = m; this.msgErr = bad; this.msgLines = lines; }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true; this.cd.detectChanges();
    try { this.rows = list(await firstValueFrom(this.http.get<any>(this.url('hr-actions/api/transfers/')))); }
    catch (e: any) { this.rows = []; this.say(this.err(e, 'Transfers could not be loaded.'), true); }
    this.loading = false; this.cd.detectChanges();
  }

  private async lookups(): Promise<void> {
    if (this.lookupsLoaded) { return; }
    const get = async (p: string) => { try { return list(await firstValueFrom(this.http.get<any>(this.url(p)))); } catch { return []; } };
    const [dir, b, d, g, c, u, s] = await Promise.all([get('tools/api/directory/'), get('organisation/api/Branch/'), get('organisation/api/Department/'),
      get('organisation/api/Designation/'), get('organisation/api/Catogory/'), get('users/api/user/'), get('payroll/api/salarycomponent/')]);
    const by = (k: string) => (x: any, y: any) => String(x[k] || '').localeCompare(String(y[k] || ''));
    this.dir = dir; this.branches = b.sort(by('branch_name')); this.depts = d.sort(by('dept_name')); this.desigs = g.sort(by('desgntn_job_title'));
    this.cats = c.sort(by('ctgry_title')); this.users = u.filter((x: any) => x.username).sort(by('username'));
    try {   // v1.12.0 organisation fields
      const st = await firstValueFrom(this.orgSettings.load());
      this.orgFields = this.orgSettings.activeFields(st).map(f => ({ field: f.field, label: f.label, endpoint: f.endpoint }));
      const opts = await Promise.all(this.orgFields.map(f => get(`org-structure/api/${f.endpoint}/`)));
      this.orgFields.forEach((f, i) => (this.orgOpts[f.field] = opts[i].filter((o: any) => o.active !== false).sort(by('name'))));
    } catch { this.orgFields = []; }
    const seen = new Set<string>();   // one line per component code (branches may have their own copy)
    this.comps = s.filter((x: any) => x.code && !seen.has(x.code) && seen.add(x.code)).sort(by('name'));
    this.lookupsLoaded = true;
  }

  shown(): any[] { return this.filter ? this.rows.filter(r => r.status === this.filter) : this.rows; }
  tagClass(s: string): string { return s === 'Scheduled' ? 'sched' : s === 'Done' ? 'done' : s === 'Cancelled' ? 'cancel' : ''; }
  others(r: any): string {
    const org = Object.keys(r.org || {}).length;   // v1.12.0
    return [r.to_designation && 'Designation: ' + r.to_designation, r.to_category && 'Category: ' + r.to_category, r.to_manager && 'Manager: ' + r.to_manager,
      org && `Organisation: ${org} field${org > 1 ? 's' : ''}`]
      .filter(Boolean).join(' · ');
  }
  openEmp(r: any): void { if (r.employee_id) { this.router.navigateByUrl(employeeUrl(r.employee_id)); } }

  // ------------------------------------------------------------ new transfer
  async openNew(): Promise<void> {
    this.form = { employee: null, effective_date: firstOfNextMonth(), to_branch: null, to_department: null, to_designation: null, to_category: null, to_manager: null, reason: '' };
    this.sal = []; this.plan = null; this.cur = null; this.curManager = ''; this.q = ''; this.say('');
    this.cd.detectChanges();
    await this.lookups(); this.cd.detectChanges();
  }
  closeNew(): void { this.form = null; this.plan = null; this.cur = null; }

  empOptions(): any[] {
    const q = this.q.trim().toLowerCase();
    const out = q ? this.dir.filter(e => `${e.code} ${e.name}`.toLowerCase().includes(q)) : this.dir;
    const sel = this.form?.employee ? this.dir.find(e => e.id === this.form.employee) : null;
    const top = out.slice(0, 300);
    return sel && !top.includes(sel) ? [sel, ...top] : top;
  }

  async pickEmp(id: number | null): Promise<void> {
    this.cur = this.dir.find(e => e.id === id) || null; this.curManager = ''; this.dirty();
    if (!id) { return; }
    try {
      const e = await firstValueFrom(this.http.get<any>(this.url(`employee/api/Employee/${id}/`)));
      if (this.form?.employee === id) { this.curManager = typeof e?.emp_reporting_manager === 'string' ? e.emp_reporting_manager : ''; }
    } catch { /* manager is shown in the preview anyway */ }
    this.cd.detectChanges();
  }

  taken(code: string, row: SalRow): boolean { return this.sal.some(s => s !== row && s.code === code); }
  dirty(): void { this.plan = null; this.groups = []; }
  isFuture(): boolean { return !!this.form?.effective_date && this.form.effective_date > iso(new Date()); }

  private body(): any {
    const f = this.form; const salary_changes: Record<string, number> = {};
    for (const s of this.sal) { if (s.code && s.amount !== null && s.amount !== undefined && String(s.amount) !== '') { salary_changes[s.code] = Number(s.amount); } }
    return { employee: f.employee, effective_date: f.effective_date, to_branch: f.to_branch, to_department: f.to_department, to_designation: f.to_designation,
      to_category: f.to_category, to_manager: f.to_manager, salary_changes, reason: (f.reason || '').trim(),
      ...Object.fromEntries(this.orgFields.map(o => ['to_' + o.field, f['to_' + o.field] ?? null])) };   // v1.12.0
  }

  private setPlan(p: any): void {
    this.plan = { changes: p?.changes || [], warnings: p?.warnings || [], blockers: p?.blockers || [], stays: p?.stays || [] };
    const m = new Map<string, Plan['changes']>();
    for (const c of this.plan.changes) { if (!m.has(c.area)) { m.set(c.area, []); } m.get(c.area)!.push(c); }
    this.groups = [...m.entries()].map(([area, items]) => ({ area, items }));
  }

  async preview(): Promise<void> {
    if (!this.form?.employee) { return; }
    this.busy = true; this.say(''); this.cd.detectChanges();
    try { this.setPlan(await firstValueFrom(this.http.post<any>(this.url('hr-actions/api/transfers/preview/'), this.body()))); }
    catch (e: any) { this.plan = null; this.say(this.err(e, 'The preview could not be made.'), true); }
    this.busy = false; this.cd.detectChanges();
  }

  async submit(): Promise<void> {
    if (!this.plan || this.plan.blockers.length) { return; }
    const who = this.cur ? `${this.cur.name} (${this.cur.code})` : 'the employee';
    this.busy = true; this.posting = true; this.cd.detectChanges();
    try {
      const d = await firstValueFrom(this.http.post<any>(this.url('hr-actions/api/transfers/'), this.body()));
      if (d?.status === 'done') { this.say(`Transfer done for ${who}:`, false, d.done || []); }
      else { this.say(`Transfer of ${who} scheduled for ${this.form.effective_date.split('-').reverse().join('/')} – it is carried out on that day.`); }
      this.closeNew(); await this.load();
    } catch (e: any) {
      if (e?.error?.plan) { this.setPlan(e.error.plan); }
      this.say(this.err(e, 'The transfer could not be saved.'), true);
    }
    this.busy = false; this.posting = false; this.cd.detectChanges();
  }

  // ------------------------------------------------------------ scheduled actions
  async act(r: any, action: 'apply' | 'cancel'): Promise<void> {
    const q = action === 'apply' ? `Carry out the transfer of ${r.employee} now (effective ${String(r.effective_date).split('-').reverse().join('/')})?`
      : `Cancel the scheduled transfer of ${r.employee}?`;
    if (!confirm(q)) { return; }
    this.busy = true; this.cd.detectChanges();
    try {
      const d = await firstValueFrom(this.http.post<any>(this.url(`hr-actions/api/transfers/${r.id}/${action}/`), {}));
      if (action === 'apply') { this.say(`Transfer done for ${r.employee}:`, false, d?.done || []); } else { this.say(`Transfer of ${r.employee} cancelled.`); }
      this.detail = null; await this.load();
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
}
