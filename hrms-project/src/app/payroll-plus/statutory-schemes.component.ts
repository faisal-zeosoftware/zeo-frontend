import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from '../shared-ui/i18n.service';
import { FLOW_CSS } from '../zeo-flow/flow.service';

/**
 * v1.31.0 – Payroll → Setup → Statutory schemes: the statutory contributions / deductions of the company country
 * (GPSSA + ILOE, GOSI + SANED, GRSIA, PASI, SIO, PIFSS, EPF + ESI + professional tax + TDS …). Loaded by
 * Settings → Country settings → Apply country defaults (or "Load the country's schemes" here), editable, and turned into
 * salary components with formulas stat_<code>_emp / stat_<code>_er. "Check an employee" shows the figures per scheme.
 * API: payroll-plus/api/statutory/ (+ seed/, apply/, preview/?employee=)
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/statutory/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
const CSS = FLOW_CSS + `
.ss-wrap{padding:18px 22px 40px}
.ss-top{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
.ss-top h1{margin:0;font-size:22px;font-weight:700;color:#1b1640}.ss-top p{margin:4px 0 0;color:#6b7185;font-size:13px;max-width:760px}
.ss-act{display:flex;flex-wrap:wrap;gap:8px}
.ss-form{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));align-items:end}
.ss-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185;min-width:0}
.ss-form input,.ss-form select,.ss-form textarea{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0}
.ss-form textarea{height:auto;min-height:50px;padding:6px 10px}.ss-form label.wide{grid-column:1/-1}
.ss-form label.chk{flex-direction:row;align-items:center;gap:8px}.ss-form label.chk input{height:auto}
.ss-msg{border-radius:8px;padding:8px 12px;font-size:13px;margin:0 0 12px;background:#ecfdf3;color:#1f7a4d}.ss-msg.err{background:#fff5f5;color:#b42318}
.ss-verify{font-size:12.5px;color:#9a5b00;background:#fff7e6;border-radius:8px;padding:6px 10px;margin:0 0 12px}
.ss-slab{display:grid;gap:6px 8px;grid-template-columns:1fr 1fr 1fr auto;align-items:center;margin-bottom:4px}
.ss-slab input{height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;font-size:12.5px;min-width:0}
.ss-slab .hd{font-size:11px;color:#6b7185}
.ss-wide{overflow:auto}
.lp-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:1px solid #dfe1ea;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#2b2f42;cursor:pointer;white-space:nowrap}
.lp-btn.primary{background:#5b4ff5;border-color:#5b4ff5;color:#fff}.lp-btn:disabled{opacity:.5}
.lp-muted{color:#6b7185;font-size:12.5px}
`;
function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail; }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}

@Component({
  selector: 'app-statutory-schemes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="ss-wrap">
  <div class="ss-top">
    <div>
      <h1>{{ 'Statutory schemes' | t }}</h1>
      <p>{{ 'Social security, provident fund, insurance and tax deductions of the company country. Each active scheme gives the payroll formulas stat_CODE_base, stat_CODE_emp and stat_CODE_er for every employee, and "Make salary components" adds a deduction (employee share) and a hidden employer contribution that use them.' | t }}</p>
    </div>
    <div class="ss-act" *ngIf="d?.can_change">
      <button type="button" class="lp-btn" (click)="seed()" [disabled]="busy">{{ 'Load the country’s schemes' | t }} ({{ d.pack }})</button>
      <button type="button" class="lp-btn" (click)="apply()" [disabled]="busy || !d.rows.length">{{ 'Make salary components' | t }}</button>
      <button type="button" class="lp-btn primary" (click)="edit = blank()" [disabled]="busy">+ {{ 'Scheme' | t }}</button>
    </div>
  </div>
  <div class="ss-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
  <div class="ss-verify" *ngIf="d">{{ d.verify }} {{ 'Country pack:' | t }} {{ d.pack_name }} ({{ d.pack }}) · {{ d.currency }}</div>

  <div class="fw-card" *ngIf="edit">
    <h2>{{ (edit.id ? 'Change scheme' : 'New scheme') | t }}</h2>
    <div class="ss-form">
      <label>{{ 'Code (formula name)' | t }}<input [(ngModel)]="edit.code" maxlength="20" placeholder="e.g. gosi" [disabled]="!!edit.id"></label>
      <label class="wide" style="grid-column:span 2">{{ 'Name' | t }}<input [(ngModel)]="edit.name" maxlength="120"></label>
      <label>{{ 'Authority' | t }}<input [(ngModel)]="edit.authority" maxlength="80"></label>
      <label>{{ 'Kind' | t }}<select [(ngModel)]="edit.kind"><option *ngFor="let k of d.kinds" [value]="k[0]">{{ k[1] }}</option></select></label>
      <label>{{ 'Applies to' | t }}<select [(ngModel)]="edit.applies_to"><option *ngFor="let k of d.applies" [value]="k[0]">{{ k[1] }}</option></select></label>
      <label>{{ 'Wage base' | t }}<select [(ngModel)]="edit.base"><option *ngFor="let k of d.bases" [value]="k[0]">{{ k[1] }}</option></select></label>
      <label>{{ 'Minimum base' | t }}<input type="number" [(ngModel)]="edit.min_base"></label>
      <label>{{ 'Maximum base (ceiling)' | t }}<input type="number" [(ngModel)]="edit.max_base"></label>
      <label>{{ 'Only when gross ≤' | t }}<input type="number" [(ngModel)]="edit.eligible_gross_max" placeholder="ESI: 21000"></label>
      <ng-container *ngIf="edit.kind === 'percent'">
        <label>{{ 'Employee %' | t }}<input type="number" step="0.01" [(ngModel)]="edit.employee_rate"></label>
        <label>{{ 'Employer %' | t }}<input type="number" step="0.01" [(ngModel)]="edit.employer_rate"></label>
      </ng-container>
      <ng-container *ngIf="edit.kind === 'fixed'">
        <label>{{ 'Employee amount / month' | t }}<input type="number" step="0.01" [(ngModel)]="edit.employee_fixed"></label>
        <label>{{ 'Employer amount / month' | t }}<input type="number" step="0.01" [(ngModel)]="edit.employer_fixed"></label>
      </ng-container>
      <ng-container *ngIf="edit.kind === 'annual_slab'">
        <label>{{ 'Standard deduction (yearly)' | t }}<input type="number" [(ngModel)]="edit.standard_deduction"></label>
        <label>{{ 'No tax up to (yearly taxable)' | t }}<input type="number" [(ngModel)]="edit.rebate_income_limit"></label>
        <label>{{ 'Cess / surcharge %' | t }}<input type="number" step="0.01" [(ngModel)]="edit.cess_rate"></label>
      </ng-container>
      <label>{{ 'Effective from' | t }}<input type="date" [(ngModel)]="edit.effective_from"></label>
      <label class="chk"><input type="checkbox" [(ngModel)]="edit.active"> {{ 'Active' | t }}</label>
      <label class="wide">{{ 'Law reference' | t }}<input [(ngModel)]="edit.law_reference" maxlength="400"></label>
      <label class="wide">{{ 'Notes' | t }}<textarea [(ngModel)]="edit.notes"></textarea></label>
    </div>
    <div *ngIf="edit.kind === 'slab' || edit.kind === 'annual_slab'" style="margin-top:10px">
      <div class="lp-muted" style="margin-bottom:6px">{{ edit.kind === 'slab' ? ('Monthly slabs on the base: amounts per slab (the last row with an empty "up to" is "and above")' | t) : ('Yearly income slabs: percent rate per slab (empty "up to" = and above)' | t) }}</div>
      <div class="ss-slab"><span class="hd">{{ 'Up to' | t }}</span><span class="hd">{{ edit.kind === 'slab' ? ('Employee amount' | t) : ('Rate %' | t) }}</span><span class="hd">{{ edit.kind === 'slab' ? ('Employer amount' | t) : '' }}</span><span></span></div>
      <div class="ss-slab" *ngFor="let s of edit.slabs; let i = index">
        <input type="number" [(ngModel)]="s.to" placeholder="∞">
        <input type="number" step="0.01" *ngIf="edit.kind === 'slab'" [(ngModel)]="s.employee"><input type="number" step="0.01" *ngIf="edit.kind !== 'slab'" [(ngModel)]="s.rate">
        <input type="number" step="0.01" *ngIf="edit.kind === 'slab'" [(ngModel)]="s.employer"><span *ngIf="edit.kind !== 'slab'"></span>
        <button type="button" class="lp-btn" (click)="edit.slabs.splice(i, 1)">×</button>
      </div>
      <button type="button" class="lp-btn" (click)="edit.slabs.push({})">+ {{ 'Slab' | t }}</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || !edit.code || !edit.name">{{ 'Save' | t }}</button>
      <button type="button" class="lp-btn" (click)="edit = null">{{ 'Cancel' | t }}</button>
    </div>
  </div>

  <div class="fw-card ss-wide" *ngIf="d">
    <table class="fw-table" zPlain>
      <thead><tr><th>{{ 'Scheme' | t }}</th><th>{{ 'Applies to' | t }}</th><th>{{ 'Base' | t }}</th><th>{{ 'Employee' | t }}</th><th>{{ 'Employer' | t }}</th><th>{{ 'Ceiling' | t }}</th><th>{{ 'Components' | t }}</th><th>{{ 'Active' | t }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let r of d.rows">
          <td><b>{{ r.name }}</b><br><small class="lp-muted">{{ r.authority }} · stat_{{ r.code }}_emp / _er · {{ r.country }}</small></td>
          <td>{{ applies(r.applies_to) }}</td><td>{{ base(r.base) }}</td>
          <td>{{ share(r, 'employee') }}</td><td>{{ share(r, 'employer') }}</td>
          <td>{{ r.max_base ? (r.max_base | number) : '–' }}{{ r.eligible_gross_max ? (' · gross ≤ ' + (r.eligible_gross_max | number)) : '' }}</td>
          <td><code *ngIf="r.employee_component">{{ r.employee_component }}</code> <code *ngIf="r.employer_component">{{ r.employer_component }}</code><span *ngIf="!r.employee_component && !r.employer_component" class="lp-muted">–</span></td>
          <td><span class="fw-chip" [class.ok]="r.active" [class.inactive]="!r.active">{{ r.active ? ('yes' | t) : ('no' | t) }}</span></td>
          <td style="white-space:nowrap" *ngIf="d.can_change"><a class="fw-link" (click)="pick(r)">{{ 'Change' | t }}</a> · <a class="fw-link" (click)="del(r)">{{ 'Delete' | t }}</a></td>
        </tr>
        <tr *ngIf="!d.rows.length"><td colspan="9" class="lp-muted">{{ 'No schemes yet – load the country’s schemes, or add your own.' | t }}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="fw-card" *ngIf="d">
    <h2>{{ 'Check an employee' | t }}</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <input class="ss-form" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;width:160px" [(ngModel)]="empId" [placeholder]="'Employee id' | t">
      <button type="button" class="lp-btn" (click)="preview()" [disabled]="!empId">{{ 'Calculate' | t }}</button>
      <span class="lp-muted" *ngIf="pv">{{ pv.employee }} · {{ 'gross' | t }} {{ pv.gross | number }} · {{ pv.national ? ('national' | t) : ('expatriate' | t) }}</span>
    </div>
    <table class="fw-table" zPlain *ngIf="pv" style="margin-top:10px">
      <thead><tr><th>{{ 'Scheme' | t }}</th><th>{{ 'Base' | t }}</th><th>{{ 'Employee' | t }}</th><th>{{ 'Employer' | t }}</th></tr></thead>
      <tbody><tr *ngFor="let s of pv.schemes" [style.opacity]="s.applies ? 1 : .5"><td>{{ s.name }}</td><td>{{ s.base | number:'1.2-2' }}</td><td>{{ s.employee | number:'1.2-2' }}</td><td>{{ s.employer | number:'1.2-2' }}</td></tr></tbody>
    </table>
  </div>
</div>`,
})
export class StatutorySchemesComponent implements OnInit {
  d: any = null; edit: any = null; busy = false; msg = ''; bad = false; empId = ''; pv: any = null;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  blank(): any { return { id: null, code: '', name: '', authority: '', kind: 'percent', applies_to: 'all', base: 'basic', min_base: null, max_base: null, eligible_gross_max: null,
                          employee_rate: 0, employer_rate: 0, employee_fixed: 0, employer_fixed: 0, slabs: [], standard_deduction: 0, rebate_income_limit: 0, cess_rate: 0,
                          active: true, effective_from: null, law_reference: '', notes: '' }; }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(API, { params: { schema: schema() } })); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  applies(k: string): string { return (this.d?.applies || []).find((x: any) => x[0] === k)?.[1] || k; }
  base(k: string): string { return (this.d?.bases || []).find((x: any) => x[0] === k)?.[1] || k; }
  share(r: any, who: 'employee' | 'employer'): string {
    if (r.kind === 'percent') { return (+r[who + '_rate']).toString() + ' %'; }
    if (r.kind === 'fixed') { return (+r[who + '_fixed']).toString(); }
    if (r.kind === 'slab') { return who === 'employee' ? 'slabs' : ((r.slabs || []).some((s: any) => +s.employer) ? 'slabs' : '–'); }
    return who === 'employee' ? 'yearly slabs' : '–';
  }
  pick(r: any): void { this.edit = { ...r, slabs: (r.slabs || []).map((s: any) => ({ ...s })) }; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    const body: any = { ...this.edit };
    for (const k of ['min_base', 'max_base', 'eligible_gross_max', 'effective_from']) { if (body[k] === '' || body[k] === undefined) { body[k] = null; } }
    body.slabs = (body.slabs || []).map((s: any) => ({ ...s, to: s.to === '' || s.to === undefined ? null : s.to }));
    try {
      if (body.id) { await firstValueFrom(this.http.patch(API + `${body.id}/`, body, { params: { schema: schema() } })); }
      else { delete body.id; await firstValueFrom(this.http.post(API, body, { params: { schema: schema() } })); }
      this.msg = 'Saved.'; this.edit = null; await this.load();
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async del(r: any): Promise<void> {
    if (!confirm(`Delete ${r.name}? Salary components that use stat_${r.code}_… will show "Unknown name" until removed.`)) { return; }
    try { await firstValueFrom(this.http.delete(API + `${r.id}/`, { params: { schema: schema() } })); await this.load(); }
    catch (e) { this.msg = err(e); this.bad = true; this.cd.detectChanges(); }
  }
  async seed(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    try { const r = await firstValueFrom(this.http.post<any>(API + 'seed/', {}, { params: { schema: schema() } })); this.msg = `${r.added.length} added, ${r.kept.length} already there.`; await this.load(); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async apply(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    try { const r = await firstValueFrom(this.http.post<any>(API + 'apply/', {}, { params: { schema: schema() } })); this.msg = `Components: ${r.added.length} added, ${r.kept.length} already there.`; await this.load(); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async preview(): Promise<void> {
    try { this.pv = await firstValueFrom(this.http.get<any>(API + 'preview/', { params: { schema: schema(), employee: this.empId } })); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
}
