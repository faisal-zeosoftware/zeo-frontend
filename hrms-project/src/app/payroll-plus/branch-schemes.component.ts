// v1.62.11 (item 229): new screen – pension / end-of-service scheme of each branch (GPSSA or ADPF, DIFC DEWS)
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe, i18nT } from '../shared-ui/i18n.service';
import { FLOW_CSS } from '../zeo-flow/flow.service';
import { exportExcel } from '../shared-ui/z-export';

/**
 * v1.62.11 (item 229) – Payroll › Setup › Branch pension schemes.
 * UAE nationals of a branch pay GPSSA (federal) or ADPF (Abu Dhabi Pension Fund – employed in Abu Dhabi). A DIFC branch pays the
 * DIFC Employee Workplace Savings (DEWS) contribution every month instead of accruing gratuity for expatriates. Rates and limits are
 * in Payroll › Legal rates (dated); the contributions of a year per employee and month are below.
 * API: payroll-plus/api/branch-schemes/ (GET, PUT {rows}), branch-schemes/report/?year=&scheme=adpf|dews
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/branch-schemes/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
const CSS = FLOW_CSS + `
.bs-wrap{padding:18px 22px 40px}
.bs-top h1{margin:0;font-size:22px;font-weight:700;color:#1b1640}.bs-top p{margin:4px 0 14px;color:#6b7185;font-size:13px;max-width:880px;line-height:1.5}
.bs-msg{border-radius:8px;padding:8px 12px;font-size:13px;margin:0 0 12px;background:#ecfdf3;color:#1f7a4d}.bs-msg.err{background:#fff5f5;color:#b42318}
.bs-wide{overflow:auto}.bs-num{text-align:end;white-space:nowrap;font-variant-numeric:tabular-nums}
.bs-wide select,.bs-wide input,.bs-bar select,.bs-bar input{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0;background:#fff}
.bs-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:10px}.bs-bar label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185}
.bs-tot td{font-weight:700;border-top:2px solid #e3e5ee}
.lp-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:1px solid #dfe1ea;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#2b2f42;cursor:pointer;white-space:nowrap}
.lp-btn.primary{background:#5b4ff5;border-color:#5b4ff5;color:#fff}.lp-btn:disabled{opacity:.5}
.lp-muted{color:#6b7185;font-size:12.5px}
.bs-help{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:12px;margin-bottom:12px}
.bs-help .fw-card{margin:0}.bs-help h3{margin:0 0 6px;font-size:14px;color:#1b1640}.bs-help p{margin:0;font-size:12.5px;color:#4b5065;line-height:1.5}
@media (max-width:640px){.bs-wrap{padding:12px 16px 30px}}
`;
function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail; }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}

@Component({
  selector: 'app-branch-schemes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="bs-wrap" data-branch-schemes>
  <div class="bs-top">
    <h1>{{ 'Branch pension schemes' | t }}</h1>
    <p>{{ 'Choose for each branch which pension fund its UAE nationals pay and whether it is a DIFC branch. Nothing changes for a branch until you set it here.' | t }}</p>
  </div>
  <div class="bs-msg" *ngIf="msg" [class.err]="bad" role="status">{{ msg }}</div>

  <div class="bs-help">
    <div class="fw-card"><h3>{{ 'GPSSA or ADPF' | t }}</h3>
      <p>{{ 'UAE nationals employed in Abu Dhabi are insured with the Abu Dhabi Pension Fund instead of GPSSA. ADPF: employee 11 % (insured from 01/12/2023; 5 % before), employer 15 %, of the contract salary between AED 6,000 and 100,000 (150,000 for those insured before). GPSSA is not deducted for a branch on ADPF, and nationals get no gratuity.' | t }}</p></div>
    <div class="fw-card"><h3>{{ 'DIFC DEWS' | t }}</h3>
      <p>{{ 'A DIFC branch pays every month 5.83 % of the basic wage (at least 50 % of the wage) for the first 5 years of service and 8.33 % after, from 01/02/2020 (or the date you enter). There is no gratuity for that service: the final settlement pays only the gratuity for the service before DEWS (21 days a year for the first 5 years, 30 after). UAE and GCC nationals registered with GPSSA are exempt.' | t }}</p></div>
  </div>

  <div class="fw-card bs-wide" *ngIf="d">
    <h2>{{ 'Branches' | t }}</h2>
    <table class="fw-table" zPlain data-bs-branches>
      <thead><tr><th>{{ 'Branch' | t }}</th><th>{{ 'Emirate' | t }}</th><th class="bs-num">{{ 'Employees' | t }}</th><th>{{ 'Pension for UAE nationals' | t }}</th><th>{{ 'DIFC DEWS instead of gratuity' | t }}</th><th>{{ 'DEWS from' | t }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let r of d.rows" [attr.data-bs-branch]="r.branch">
          <td><b>{{ r.branch_name }}</b></td>
          <td>{{ r.emirate || '–' }}</td>
          <td class="bs-num">{{ r.employees }}</td>
          <td><select [(ngModel)]="r.pension" [disabled]="!d.can_change" [attr.aria-label]="'Pension for UAE nationals' | t" data-bs-pension>
                <option value="gpssa">{{ 'GPSSA (federal)' | t }}</option><option value="adpf">{{ 'ADPF (Abu Dhabi Pension Fund)' | t }}</option></select>
              <br *ngIf="r.suggest_adpf"><small class="fw-chip warn" *ngIf="r.suggest_adpf">{{ 'Abu Dhabi branch – usually ADPF' | t }}</small></td>
          <td><label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" [(ngModel)]="r.dews" [disabled]="!d.can_change" data-bs-dews> {{ 'DIFC branch' | t }}</label></td>
          <td><input type="date" [(ngModel)]="r.dews_start" [disabled]="!d.can_change || !r.dews" min="2020-02-01" [attr.aria-label]="'DEWS from' | t" data-bs-dews-start>
              <br><small class="lp-muted" *ngIf="r.dews && !r.dews_start">{{ 'Empty = 01/02/2020' | t }}</small></td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap">
      <button type="button" class="lp-btn primary" *ngIf="d.can_change" [disabled]="busy" (click)="save()" data-bs-save>{{ 'Save' | t }}</button>
      <span class="lp-muted">{{ 'Saving makes the statutory scheme and its salary components (Payroll › Statutory schemes) and adds them to the active employees of the branch.' | t }}</span>
    </div>
    <p class="lp-muted" *ngIf="!d.can_change">{{ 'You can see this setup; payroll setup rights are needed to change it.' | t }}</p>
  </div>

  <div class="fw-card bs-wide" *ngIf="d">
    <h2>{{ 'Rates in force today' | t }}</h2>
    <table class="fw-table" zPlain data-bs-rates>
      <thead><tr><th>{{ 'Figure' | t }}</th><th class="bs-num">{{ 'Value' | t }}</th><th></th></tr></thead>
      <tbody><tr *ngFor="let r of d.rates"><td>{{ r.label }}</td><td class="bs-num">{{ shownRate(r) }}</td>
        <td><span class="fw-chip warn" *ngIf="r.to_be_confirmed">{{ 'To be confirmed' | t }}</span></td></tr></tbody>
    </table>
    <p class="lp-muted">{{ 'Change a figure from a date in' | t }} <a class="fw-link" routerLink="/main-sidebar/salary-options/legal-rates">{{ 'Legal rates' | t }}</a>.</p>
  </div>

  <div class="fw-card bs-wide" data-bs-report>
    <h2>{{ 'Contributions' | t }}</h2>
    <div class="bs-bar">
      <label>{{ 'Scheme' | t }}<select [(ngModel)]="scheme" (change)="loadReport()" data-bs-scheme><option value="dews">DIFC DEWS</option><option value="adpf">ADPF</option></select></label>
      <label>{{ 'Year' | t }}<input type="number" [(ngModel)]="year" (change)="loadReport()" style="width:100px" data-bs-year></label>
      <button type="button" class="lp-btn" (click)="doExport()" [disabled]="!rep?.rows?.length">{{ 'Excel' | t }}</button>
    </div>
    <table class="fw-table" zPlain *ngIf="rep?.rows?.length">
      <thead><tr><th>{{ 'Employee' | t }}</th><th>{{ 'Branch' | t }}</th><th *ngFor="let m of months" class="bs-num">{{ m.label | t }}</th>
        <th class="bs-num" *ngIf="scheme === 'adpf'">{{ 'Employee share' | t }}</th><th class="bs-num">{{ 'Employer share' | t }}</th>
        <th class="bs-num" *ngIf="scheme === 'dews'">{{ 'Gratuity before DEWS (today)' | t }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let r of rep.rows"><td><b>{{ r.employee }}</b><br><small class="lp-muted">{{ r.employee_code }}</small></td><td>{{ r.branch }}</td>
          <td *ngFor="let m of months" class="bs-num">{{ cell(r, m.n) }}</td>
          <td class="bs-num" *ngIf="scheme === 'adpf'">{{ r.employee_total | number:'1.2-2' }}</td><td class="bs-num">{{ r.employer_total | number:'1.2-2' }}</td>
          <td class="bs-num" *ngIf="scheme === 'dews'">{{ r.pre_dews_gratuity === undefined ? '–' : (r.pre_dews_gratuity | number:'1.2-2') }}</td></tr>
        <tr class="bs-tot"><td colspan="2">{{ 'Total' | t }}</td><td *ngFor="let m of months"></td>
          <td class="bs-num" *ngIf="scheme === 'adpf'">{{ rep.totals.employee | number:'1.2-2' }}</td><td class="bs-num">{{ rep.totals.employer | number:'1.2-2' }}</td>
          <td class="bs-num" *ngIf="scheme === 'dews'">{{ rep.totals.pre_dews_gratuity | number:'1.2-2' }}</td></tr>
      </tbody>
    </table>
    <p class="lp-muted" *ngIf="rep && !rep.rows?.length">{{ 'No contributions in this year.' | t }}</p>
  </div>
</div>`,
})
export class BranchSchemesComponent implements OnInit {
  d: any = null; rep: any = null; msg = ''; bad = false; busy = false;
  scheme = 'dews'; year = new Date().getFullYear();
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((label, i) => ({ label, n: i + 1 }));
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  private q(extra = ''): string { return `?schema=${encodeURIComponent(schema())}${extra}`; }
  async ngOnInit(): Promise<void> { await this.load(); this.loadReport(); }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(API + this.q())); }
    catch (e: any) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  async loadReport(): Promise<void> {
    try { this.rep = await firstValueFrom(this.http.get<any>(API + 'report/' + this.q(`&year=${this.year}&scheme=${this.scheme}`))); }
    catch (e: any) { this.rep = null; if (!this.msg) { this.msg = err(e); this.bad = true; } }
    this.cd.detectChanges();
  }
  cell(r: any, m: number): string {
    const c = (r.months || {})[String(m)];
    if (!c) { return ''; }
    const v = this.scheme === 'adpf' ? (c.employee || 0) + (c.employer || 0) : (c.employer || 0);
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  shownRate(r: any): string {
    const n = +r.value;
    if (/salary_(min|max)/.test(r.key)) { return 'AED ' + n.toLocaleString('en-US'); }
    if (/_years$|_days_|_divisor$|_to_employee$/.test(r.key)) { return n.toLocaleString('en-US', { maximumFractionDigits: 4 }); }
    return `${+(n * 100).toFixed(3)} %`;
  }
  async save(): Promise<void> {
    this.busy = true; this.msg = '';
    const rows = this.d.rows.map((r: any) => ({ branch: r.branch, pension: r.pension, dews: !!r.dews, dews_start: r.dews ? (r.dews_start || '') : '' }));
    try {
      const d = await firstValueFrom(this.http.put<any>(API + this.q(), { rows }));
      this.d = d; this.msg = i18nT('Saved.'); this.bad = false; this.loadReport();
    } catch (e: any) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  doExport(): void {
    const h = ['Employee', 'Code', 'Branch', ...this.months.map(m => m.label), 'Employee share', 'Employer share', 'Gratuity before DEWS (today)'].map(x => i18nT(x));
    const rows = (this.rep?.rows || []).map((r: any) => [r.employee, r.employee_code, r.branch, ...this.months.map(m => this.cell(r, m.n)),
      r.employee_total, r.employer_total, r.pre_dews_gratuity === undefined ? '' : r.pre_dews_gratuity]);
    exportExcel(i18nT(this.scheme === 'adpf' ? 'ADPF contributions' : 'DIFC DEWS contributions') + ' ' + this.year, h, rows as any);
  }
}
