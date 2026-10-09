import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrgSettingsService } from './org-settings.service';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * v1.12.0 – Country policies: labour-law rule sets per country (UAE Federal Decree-Law 33/2021, Saudi Labour Law,
 * Qatar, Oman, Bahrain, Kuwait as standard) – weekend, hours, Ramadan hours, annual / sick / maternity leave,
 * gratuity, overtime, notice, probation, public holidays and WPS notes. "Apply to branches" makes a rule set the
 * one of those branches (else a branch uses the standard set of its country). Leave and payroll can read it
 * (country_policy_for(branch) on the server); they are not switched to it automatically.
 * API: org-structure/api/country-policies/ (CRUD, load-standard/, <id>/apply/, for-branch/) · branch-country-policies/
 */
@Component({
  selector: 'app-country-policies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', '../hr-actions/hr-actions.css', './org-structure.css'],
  template: `
<div class="container os-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Country policies</h1>
          <p class="lp-desc">Labour-law rules per country: weekend, working hours, leave, gratuity, overtime, notice and probation. Standard GCC sets are included with the law reference –
            check them against the current law and adjust if your contracts give more. Apply a rule set to branches to use it there.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn" (click)="loadStandard()" [disabled]="busy">Add missing standard sets</button>
          <button type="button" class="lp-btn primary" (click)="newCopy()" [disabled]="!sel">+ Copy as new</button>
        </div>
      </div>
      <div class="lp-tabs">
        <button type="button" [class.on]="tab === 'sets'" (click)="tab = 'sets'">Rule sets</button>
        <button type="button" [class.on]="tab === 'branches'" (click)="tab = 'branches'; loadBranches()">Branches</button>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>

      <ng-container *ngIf="tab === 'sets'">
        <div class="lp-cards">
          <button type="button" class="lp-card" *ngFor="let p of rows" [class.on]="sel?.id === p.id" (click)="pick(p)">
            <h3>{{ p.country_name }} <span class="lp-badge" *ngIf="p.is_standard">Standard</span><span class="lp-badge labour" *ngIf="!p.active">Inactive</span></h3>
            <p>{{ p.name }}</p>
            <div class="lp-chips"><span class="lp-chip" *ngFor="let b of p.branches">{{ b.name }}</span></div>
          </button>
        </div>

        <!-- view -->
        <div class="ha-panel" style="margin-top:18px" *ngIf="sel && !form">
          <div class="lp-head" style="padding:0">
            <div><h2>{{ sel.name }}</h2><p class="lp-muted" style="margin:0">{{ sel.law_reference }}</p></div>
            <div class="lp-actions">
              <button type="button" class="lp-btn" (click)="edit()">Edit</button>
              <button type="button" class="lp-btn primary" (click)="openApply()">Apply to branches</button>
            </div>
          </div>
          <div class="os-sec">Working time</div>
          <div class="os-facts">
            <div><span>Weekend</span><b>{{ sel.weekend_names || '–' }}</b></div>
            <div><span>Hours</span><b>{{ sel.daily_hours }} a day · {{ sel.weekly_hours }} a week</b></div>
            <div><span>Ramadan</span><b>{{ sel.ramadan_daily_hours ? sel.ramadan_daily_hours + ' hours a day' : '–' }}</b></div>
            <div><span>Probation</span><b>Up to {{ sel.probation_max_months }} months</b></div>
            <div><span>Notice period</span><b>{{ sel.notice_period?.min_days ?? '–' }} – {{ sel.notice_period?.max_days ?? '–' }} days</b><small>{{ sel.notice_period?.note }}</small></div>
          </div>
          <div class="os-sec">Leave</div>
          <div class="os-facts">
            <div><span>Annual leave</span><b>{{ sel.annual_leave?.days }} {{ sel.annual_leave?.basis === 'working' ? 'working' : 'calendar' }} days a year</b>
              <small *ngIf="sel.annual_leave?.first_year_days_per_month">First year: {{ sel.annual_leave.first_year_days_per_month }} days a month after {{ sel.annual_leave.first_year_after_months }} months</small>
              <small *ngIf="!sel.annual_leave?.first_year_days_per_month && sel.annual_leave?.first_year_after_months">Earned after {{ sel.annual_leave.first_year_after_months }} months</small>
              <small *ngFor="let s of sel.annual_leave?.steps || []">After {{ s.after_years }} years: {{ s.days }} days</small>
              <small>{{ sel.annual_leave?.note }}</small></div>
            <div><span>Sick leave</span><b>{{ slabText(sel.sick_leave) }}</b></div>
            <div><span>Maternity</span><b>{{ sel.maternity?.days }} days</b><small>{{ sel.maternity?.full_pay_days }} full pay · {{ sel.maternity?.half_pay_days || 0 }} half pay. {{ sel.maternity?.note }}</small></div>
            <div><span>Paternity</span><b>{{ sel.paternity_days }} days</b></div>
          </div>
          <div class="os-sec">Pay</div>
          <div class="os-facts">
            <div><span>Gratuity</span><b>{{ gratText(sel.gratuity) }}</b><small>{{ sel.gratuity?.note }}</small></div>
            <div><span>Overtime (% of hourly wage)</span><b>Normal {{ sel.overtime?.normal }}% · night {{ sel.overtime?.night }}%</b>
              <small>Rest day {{ sel.overtime?.rest_day }}% · public holiday {{ sel.overtime?.holiday }}%{{ sel.overtime?.max_hours_per_day ? ' · max ' + sel.overtime.max_hours_per_day + ' h a day' : '' }}</small><small>{{ sel.overtime?.note }}</small></div>
            <div><span>Public holidays</span><b>{{ sel.public_holiday_source || '–' }}</b></div>
            <div><span>WPS / payroll</span><b>{{ sel.wps_notes || '–' }}</b></div>
          </div>
          <p class="lp-muted" *ngIf="sel.notes" style="margin-top:10px">{{ sel.notes }}</p>
        </div>

        <!-- edit -->
        <div class="ha-panel" style="margin-top:18px" *ngIf="form">
          <h2>{{ form.id ? 'Edit ' + form.name : 'New rule set' }}</h2>
          <div class="lp-form">
            <label>Name<input [(ngModel)]="form.name" maxlength="150"></label>
            <label>Code<input [(ngModel)]="form.code" maxlength="20"></label>
            <label>Country<input [(ngModel)]="form.country_name" maxlength="80"></label>
            <label>Country code (2 letters)<input [(ngModel)]="form.country_code" maxlength="2"></label>
            <label class="wide">Law reference<input [(ngModel)]="form.law_reference" maxlength="300"></label>
          </div>
          <div class="os-sec">Working time</div>
          <div class="os-days" role="group" aria-label="Weekend days">
            <label *ngFor="let d of days; let i = index" [class.on]="form.weekend_days.includes(i)"><input type="checkbox" [checked]="form.weekend_days.includes(i)" (change)="toggleDay(i)">{{ d }}</label>
          </div>
          <div class="lp-form">
            <label>Hours a day<input type="number" step="0.5" [(ngModel)]="form.daily_hours"></label>
            <label>Hours a week<input type="number" step="0.5" [(ngModel)]="form.weekly_hours"></label>
            <label>Ramadan hours a day<input type="number" step="0.5" [(ngModel)]="form.ramadan_daily_hours"></label>
            <label>Probation up to (months)<input type="number" [(ngModel)]="form.probation_max_months"></label>
            <label>Notice from (days)<input type="number" [(ngModel)]="form.notice_period.min_days"></label>
            <label>Notice up to (days)<input type="number" [(ngModel)]="form.notice_period.max_days"></label>
          </div>
          <div class="os-sec">Leave</div>
          <div class="lp-form">
            <label>Annual leave days<input type="number" [(ngModel)]="form.annual_leave.days"></label>
            <label>Counted in<select [(ngModel)]="form.annual_leave.basis"><option value="calendar">Calendar days</option><option value="working">Working days</option></select></label>
            <label>First year: earned after (months)<input type="number" [(ngModel)]="form.annual_leave.first_year_after_months"></label>
            <label>First year: days a month<input type="number" step="0.5" [(ngModel)]="form.annual_leave.first_year_days_per_month"></label>
            <label>Maternity days<input type="number" [(ngModel)]="form.maternity.days"></label>
            <label>… at full pay<input type="number" [(ngModel)]="form.maternity.full_pay_days"></label>
            <label>… at half pay<input type="number" [(ngModel)]="form.maternity.half_pay_days"></label>
            <label>Paternity days<input type="number" [(ngModel)]="form.paternity_days"></label>
          </div>
          <table class="os-slabs" zPlain>
            <thead><tr><th>More annual leave after (years)</th><th>Days</th><th></th></tr></thead>
            <tbody><tr *ngFor="let s of form.annual_leave.steps; let i = index"><td><input type="number" [(ngModel)]="s.after_years" aria-label="After years"></td>
              <td><input type="number" [(ngModel)]="s.days" aria-label="Days"></td><td><button type="button" class="lp-x" (click)="form.annual_leave.steps.splice(i, 1)" aria-label="Remove">×</button></td></tr></tbody>
          </table>
          <button type="button" class="lp-btn" (click)="form.annual_leave.steps.push({ after_years: 5, days: 30 })">+ Step</button>
          <table class="os-slabs" zPlain style="margin-top:10px">
            <thead><tr><th>Sick leave: days</th><th>Pay %</th><th></th></tr></thead>
            <tbody><tr *ngFor="let s of form.sick_leave; let i = index"><td><input type="number" [(ngModel)]="s[0]" aria-label="Days"></td>
              <td><input type="number" [(ngModel)]="s[1]" aria-label="Pay %"></td><td><button type="button" class="lp-x" (click)="form.sick_leave.splice(i, 1)" aria-label="Remove">×</button></td></tr></tbody>
          </table>
          <button type="button" class="lp-btn" (click)="form.sick_leave.push([15, 100])">+ Sick leave slab</button>
          <div class="os-sec">Gratuity</div>
          <div class="lp-form">
            <label>Based on<select [(ngModel)]="form.gratuity.basis"><option value="basic">Basic salary</option><option value="last_wage">Last full wage</option></select></label>
            <label>Minimum service (years)<input type="number" step="0.5" [(ngModel)]="form.gratuity.min_service_years"></label>
            <label>Capped at (years of pay)<input type="number" step="0.5" [(ngModel)]="form.gratuity.cap_years_of_pay"></label>
          </div>
          <table class="os-slabs" zPlain>
            <thead><tr><th>From year</th><th>To year (empty = after)</th><th>Days a year</th><th></th></tr></thead>
            <tbody><tr *ngFor="let s of form.gratuity.slabs; let i = index"><td><input type="number" [(ngModel)]="s.from_year" aria-label="From year"></td>
              <td><input type="number" [(ngModel)]="s.to_year" aria-label="To year"></td><td><input type="number" [(ngModel)]="s.days" aria-label="Days"></td>
              <td><button type="button" class="lp-x" (click)="form.gratuity.slabs.splice(i, 1)" aria-label="Remove">×</button></td></tr></tbody>
          </table>
          <button type="button" class="lp-btn" (click)="form.gratuity.slabs.push({ from_year: 1, to_year: null, days: 21 })">+ Gratuity slab</button>
          <div class="os-sec">Overtime (% of the hourly wage)</div>
          <div class="lp-form">
            <label>Normal<input type="number" [(ngModel)]="form.overtime.normal"></label>
            <label>Night<input type="number" [(ngModel)]="form.overtime.night"></label>
            <label>Rest day<input type="number" [(ngModel)]="form.overtime.rest_day"></label>
            <label>Public holiday<input type="number" [(ngModel)]="form.overtime.holiday"></label>
            <label>Max overtime hours a day<input type="number" [(ngModel)]="form.overtime.max_hours_per_day"></label>
          </div>
          <div class="os-sec">Other</div>
          <div class="lp-form">
            <label class="wide">Public holidays come from<input [(ngModel)]="form.public_holiday_source" maxlength="200"></label>
            <label class="wide">WPS / payroll notes<textarea [(ngModel)]="form.wps_notes"></textarea></label>
            <label class="wide">Notes<textarea [(ngModel)]="form.notes"></textarea></label>
            <label>Status<select [(ngModel)]="form.active"><option [ngValue]="true">Active</option><option [ngValue]="false">Inactive</option></select></label>
          </div>
          <div class="lp-foot">
            <button type="button" class="lp-btn danger" *ngIf="form.id && !form.is_standard" (click)="remove()">Delete</button>
            <button type="button" class="lp-btn" (click)="form = null">Cancel</button>
            <button type="button" class="lp-btn primary" [disabled]="busy" (click)="save()">{{ busy ? 'Saving…' : 'Save' }}</button>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="tab === 'branches'">
        <table class="table">
          <thead><tr><th>Branch</th><th>Rule set</th><th>How</th><th>Actions</th></tr></thead>
          <tbody><tr *ngFor="let b of branchRows">
            <td data-label="Branch">{{ b.branch }}</td><td data-label="Rule set">{{ b.policy || 'None – no rule set for its country' }}</td>
            <td data-label="How"><span class="os-tag" [ngClass]="b.source === 'Applied' ? 'blue' : b.source === 'None' ? 'bad' : ''">{{ b.source === 'By country' ? 'Standard for its country' : b.source }}</span></td>
            <td data-label="Actions"><button type="button" class="lp-btn" *ngIf="b.source === 'Applied'" (click)="unapply(b)">Use the country standard</button></td>
          </tr></tbody>
        </table>
      </ng-container>
    </div>
  </div>
</div>

<div class="lp-modal-back" *ngIf="applyOpen" (click)="applyOpen = false">
  <div class="lp-modal" style="width:min(520px, 100%)" (click)="$event.stopPropagation()" role="dialog" aria-label="Apply to branches">
    <header><h2>Apply “{{ sel?.name }}”</h2><button type="button" class="lp-x" (click)="applyOpen = false" aria-label="Close" style="color:#6b7185">×</button></header>
    <div class="body">
      <p class="lp-muted">The chosen branches use this rule set from now on (it replaces the one they had).</p>
      <div class="lp-catpick"><label *ngFor="let b of branches" [class.on]="pickB[b.id]"><input type="checkbox" [(ngModel)]="pickB[b.id]">{{ b.branch_name }}</label></div>
    </div>
    <footer><button type="button" class="lp-btn" (click)="applyOpen = false">Cancel</button>
      <button type="button" class="lp-btn primary" [disabled]="busy" (click)="apply()">Apply</button></footer>
  </div>
</div>`,
})
export class CountryPoliciesComponent implements OnInit {
  rows: any[] = []; sel: any = null; form: any = null; tab: 'sets' | 'branches' = 'sets';
  branchRows: any[] = []; branches: any[] = []; pickB: Record<number, boolean> = {}; applyOpen = false;
  busy = false; msg = ''; err = false; days = DAYS;

  constructor(private http: HttpClient, private org: OrgSettingsService, private cd: ChangeDetectorRef) {}
  private q(): string { return `?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  private url(p: string): string { return `${this.org.api}${p}${this.q()}`; }
  private say(m: string, bad = false): void { this.msg = m; this.err = bad; this.cd.markForCheck(); }
  private errText(e: any, d: string): string {
    const x = e?.error; if (!x) { return d; }
    if (x.detail) { return x.detail; }
    return Object.entries(x).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ') || d;
  }

  ngOnInit(): void { this.load(); }

  async load(keep?: number): Promise<void> {
    try { this.rows = await firstValueFrom(this.http.get<any[]>(this.url('country-policies/'))); }
    catch (e: any) { this.say(this.errText(e, 'The rule sets could not be loaded.'), true); }
    this.sel = this.rows.find(r => r.id === keep) || this.sel && this.rows.find(r => r.id === this.sel.id) || this.rows.find(r => r.country_code === 'AE') || this.rows[0] || null;
    this.cd.markForCheck();
  }

  pick(p: any): void { this.sel = p; this.form = null; }

  slabText(s: any[]): string { return (s || []).map(x => `${x[0]} days ${x[1] === 100 ? 'full pay' : x[1] === 0 ? 'unpaid' : x[1] + '%'}`).join(', ') || '–'; }
  gratText(g: any): string {
    if (!g?.slabs?.length) { return '–'; }
    return g.slabs.map((s: any) => `${s.days} days a year ${s.to_year ? `(years ${s.from_year}–${s.to_year})` : `from year ${s.from_year}`}`).join(', ')
      + (g.cap_years_of_pay ? `; max ${g.cap_years_of_pay} years’ pay` : '');
  }

  private editable(p: any): any {
    const f = JSON.parse(JSON.stringify(p));
    f.annual_leave = { steps: [], basis: 'calendar', ...(f.annual_leave || {}) }; f.annual_leave.steps = f.annual_leave.steps || [];
    f.maternity = f.maternity || {}; f.gratuity = { slabs: [], ...(f.gratuity || {}) }; f.gratuity.slabs = f.gratuity.slabs || [];
    f.overtime = f.overtime || {}; f.notice_period = f.notice_period || {}; f.sick_leave = f.sick_leave || []; f.weekend_days = f.weekend_days || [];
    return f;
  }
  edit(): void { this.form = this.editable(this.sel); }
  newCopy(): void {
    const f = this.editable(this.sel);
    delete f.id; f.code = (f.code + '-COPY').slice(0, 20); f.name = f.name + ' (copy)'; f.is_standard = false;
    this.form = f;
  }
  toggleDay(i: number): void { const w = this.form.weekend_days; const k = w.indexOf(i); k >= 0 ? w.splice(k, 1) : w.push(i); w.sort(); }

  async save(): Promise<void> {
    const f = { ...this.form }; delete f.branches; delete f.weekend_names; delete f.updated_at; delete f.is_standard;
    const num = (v: any) => (v === '' || v === null || v === undefined ? null : Number(v));
    f.sick_leave = (f.sick_leave || []).map((s: any[]) => [Number(s[0]), Number(s[1])]);
    f.gratuity.slabs = (f.gratuity.slabs || []).map((s: any) => ({ ...s, from_year: num(s.from_year), to_year: num(s.to_year), days: num(s.days) }));
    f.annual_leave.steps = (f.annual_leave.steps || []).map((s: any) => ({ after_years: num(s.after_years), days: num(s.days) }));
    for (const k of ['days', 'first_year_after_months', 'first_year_days_per_month']) { f.annual_leave[k] = num(f.annual_leave[k]); }
    for (const k of ['days', 'full_pay_days', 'half_pay_days']) { f.maternity[k] = num(f.maternity[k]); }
    for (const k of ['normal', 'night', 'rest_day', 'holiday', 'max_hours_per_day']) { if (f.overtime[k] !== undefined) { f.overtime[k] = num(f.overtime[k]); } }
    for (const k of ['min_days', 'max_days']) { f.notice_period[k] = num(f.notice_period[k]); }
    this.busy = true;
    try {
      const r: any = f.id ? await firstValueFrom(this.http.patch(this.url(`country-policies/${f.id}/`), f)) : await firstValueFrom(this.http.post(this.url('country-policies/'), f));
      this.form = null; this.say('Saved.'); await this.load(r?.id);
    } catch (e: any) { this.say(this.errText(e, 'The rule set could not be saved.'), true); }
    this.busy = false; this.cd.markForCheck();
  }

  async remove(): Promise<void> {
    if (!confirm(`Delete “${this.form.name}”?`)) { return; }
    try { await firstValueFrom(this.http.delete(this.url(`country-policies/${this.form.id}/`))); this.form = null; this.sel = null; this.say('Deleted.'); await this.load(); }
    catch (e: any) { this.say(this.errText(e, 'It could not be deleted.'), true); }
  }

  async loadStandard(): Promise<void> {
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.post(this.url('country-policies/load-standard/'), {})); this.say(r.created?.length ? `${r.created.length} standard rule set(s) added.` : 'Every standard rule set is already there.'); await this.load(); }
    catch (e: any) { this.say(this.errText(e, 'They could not be added.'), true); }
    this.busy = false; this.cd.markForCheck();
  }

  async openApply(): Promise<void> {
    try { this.branches = await firstValueFrom(this.http.get<any[]>(`${environment.apiBaseUrl}/organisation/api/Branch/${this.q()}`)); } catch { this.branches = []; }
    this.pickB = {}; (this.sel?.branches || []).forEach((b: any) => (this.pickB[b.id] = true));
    this.applyOpen = true; this.cd.markForCheck();
  }

  async apply(): Promise<void> {
    const ids = Object.entries(this.pickB).filter(([, v]) => v).map(([k]) => Number(k));
    if (!ids.length) { this.say('Choose at least one branch.', true); return; }
    this.busy = true;
    try { await firstValueFrom(this.http.post(this.url(`country-policies/${this.sel.id}/apply/`), { branch_ids: ids })); this.applyOpen = false; this.say(`Applied to ${ids.length} branch(es).`); await this.load(this.sel.id); }
    catch (e: any) { this.say(this.errText(e, 'It could not be applied.'), true); }
    this.busy = false; this.cd.markForCheck();
  }

  async loadBranches(): Promise<void> {
    try { this.branchRows = await firstValueFrom(this.http.get<any[]>(this.url('branch-country-policies/'))); } catch { this.branchRows = []; }
    this.cd.markForCheck();
  }

  async unapply(b: any): Promise<void> {
    try { await firstValueFrom(this.http.delete(`${this.org.api}branch-country-policies/${this.q()}&branch=${b.branch_id}`)); await this.loadBranches(); await this.load(); }
    catch (e: any) { this.say(this.errText(e, 'It could not be changed.'), true); }
  }
}
