/**
 * v1.62.0 payroll – Employee salary: every employee's fixed monthly salary (basic, housing, transport, other allowances, total)
 * with the date of the last change. The existing assign / edit screen stays as the second tab ("Assign components").
 * API (read): payroll-plus/api/workspace/salaries/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errText, wsUrl } from '../payroll-plus/pay162';

@Component({
  selector: 'app-salary-register',
  styleUrls: ['../leave-policy/leave-policy.css', '../payroll-plus/pay162.css'],
  template: `
<div class="container" *ngIf="tab === 'list'">
  <div class="comapny_section">
    <div class="header_section">
      <div class="py-wrap py-head">
        <div>
          <h1 class="page-title">Employee salary</h1>
          <p class="lp-desc">The fixed monthly salary of every employee – the amounts payroll starts from before attendance, leave, overtime and deductions.</p>
        </div>
        <div class="py-tools">
          <button type="button" class="py-btn primary" *ngIf="canEdit" (click)="go('assign')" data-py-assign>Assign or change components</button>
        </div>
      </div>
      <div class="py-wrap" style="margin-top:12px"><div class="py-tabs" style="margin:0;border:0">
        <button type="button" class="on">Monthly salaries <span class="cnt">{{ rows.length }}</span></button>
        <button type="button" (click)="go('assign')">Assign components</button></div></div>
    </div>
    <div class="com_list mt-4">
      <p class="py-msg err" *ngIf="msg" role="alert">{{ msg }}</p>
      <div class="py-tiles" style="margin-top:0">
        <div class="py-tile"><span>Employees</span><b>{{ rows.length }}</b><small *ngIf="without">{{ without }} without a salary</small></div>
        <div class="py-tile"><span>Basic</span><b><i class="py-cur">AED</i>{{ totals.basic | number:'1.2-2' }}</b></div>
        <div class="py-tile"><span>Allowances</span><b><i class="py-cur">AED</i>{{ allowances() | number:'1.2-2' }}</b></div>
        <div class="py-tile hi"><span>Monthly total</span><b><i class="py-cur">AED</i>{{ totals.total | number:'1.2-2' }}</b><small>Fixed pay of the employees shown</small></div>
      </div>
      <div class="py-tools" style="margin:6px 0 10px">
        <input type="search" class="py-in" placeholder="Search employee, code, department…" [(ngModel)]="q" aria-label="Search">
        <select class="py-sel" [(ngModel)]="dept" aria-label="Department"><option value="">All departments</option>
          <option *ngFor="let d of depts()" [value]="d">{{ d }}</option></select>
        <select class="py-sel" [(ngModel)]="br" aria-label="Branch"><option value="">All branches</option>
          <option *ngFor="let d of branches()" [value]="d">{{ d }}</option></select>
      </div>
      <div class="py-scroll">
        <table class="py-t" zPlain data-py-salaries>
          <thead><tr><th>Employee</th><th>Department</th><th class="num">Basic</th><th class="num">Housing</th><th class="num">Transport</th>
            <th class="num">Other</th><th class="num">Total (AED)</th><th>Last change</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of shown()" [attr.data-py-sal]="r.code" [title]="tip(r)">
              <td><span class="nm">{{ r.name }}</span><span class="sub">{{ r.code }} · {{ r.designation }}</span></td>
              <td>{{ r.department || '–' }}<span class="sub">{{ r.branch }}</span></td>
              <td class="num">{{ +r.basic ? (r.basic | number:'1.2-2') : '–' }}</td>
              <td class="num">{{ +r.housing ? (r.housing | number:'1.2-2') : '–' }}</td>
              <td class="num">{{ +r.transport ? (r.transport | number:'1.2-2') : '–' }}</td>
              <td class="num">{{ +r.other ? (r.other | number:'1.2-2') : '–' }}</td>
              <td class="num"><b *ngIf="!r.no_salary">{{ r.total | number:'1.2-2' }}</b><span *ngIf="r.no_salary" class="py-pill wait">No salary</span></td>
              <td>{{ r.last_change ? (r.last_change | date:'dd/MM/yyyy') : '–' }}</td>
            </tr>
            <tr *ngIf="!shown().length && !loading"><td colspan="8" class="py-muted" style="text-align:center;padding:18px">No employee matches.</td></tr>
          </tbody>
          <tfoot *ngIf="shown().length"><tr><td colspan="2">Total – {{ shown().length }} employee(s)</td>
            <td class="num">{{ sum('basic') | number:'1.2-2' }}</td><td class="num">{{ sum('housing') | number:'1.2-2' }}</td>
            <td class="num">{{ sum('transport') | number:'1.2-2' }}</td><td class="num">{{ sum('other') | number:'1.2-2' }}</td>
            <td class="num">{{ sum('total') | number:'1.2-2' }}</td><td></td></tr></tfoot>
        </table>
      </div>
    </div>
  </div>
</div>
<ng-container *ngIf="tab === 'assign'">
  <div class="container" style="padding-bottom:0"><div class="comapny_section" style="margin-bottom:0">
    <div class="py-tabs" style="margin:6px 0 0">
      <button type="button" (click)="go('list')" data-py-tab-list>Monthly salaries</button>
      <button type="button" class="on">Assign components</button></div></div></div>
  <app-employee-salary></app-employee-salary>
</ng-container>`,
})
export class SalaryRegisterComponent implements OnInit {
  tab: 'list' | 'assign' = 'list';
  rows: any[] = []; totals: any = {}; without = 0; canEdit = false; loading = true; msg = '';
  q = ''; dept = ''; br = '';

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(p => { this.tab = p.get('tab') === 'assign' ? 'assign' : 'list'; if (this.tab === 'list') { this.load(); } });
  }
  go(t: string): void { this.router.navigate([], { relativeTo: this.route, queryParams: { tab: t === 'assign' ? 'assign' : null } }); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const d: any = await firstValueFrom(this.http.get(wsUrl('salaries/')));
      this.rows = d.rows || []; this.totals = d.totals || {}; this.without = d.without_salary || 0; this.canEdit = !!d.can_edit;
    } catch (e) { this.msg = errText(e, 'The salaries could not be loaded.'); }
    this.loading = false; this.cd.markForCheck();
  }
  allowances(): number { return ['housing', 'transport', 'other'].reduce((a, k) => a + (Number(this.totals[k]) || 0), 0); }
  depts(): string[] { return Array.from(new Set(this.rows.map(r => r.department).filter(Boolean))).sort(); }
  branches(): string[] { return Array.from(new Set(this.rows.map(r => r.branch).filter(Boolean))).sort(); }
  shown(): any[] {
    const q = this.q.trim().toLowerCase();
    return this.rows.filter(r => (!q || [r.name, r.code, r.department, r.designation].join(' ').toLowerCase().includes(q))
      && (!this.dept || r.department === this.dept) && (!this.br || r.branch === this.br));
  }
  sum(k: string): number { return this.shown().reduce((a, r) => a + (Number(r[k]) || 0), 0); }
  tip(r: any): string { return (r.components || []).map((c: any) => `${c.name}: ${c.deduction ? '−' : ''}${Number(c.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n'); }
}
