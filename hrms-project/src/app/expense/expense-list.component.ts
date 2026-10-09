import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EXPENSE_BASE, ExpenseApiService, STATUS_LABEL, isImage, money } from './expense-api.service';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD', 'INR', 'PKR', 'EGP', 'JOD'];

/** My expenses: list (unreported / all), new / edit expense with receipt, mileage and per diem, live policy check, add to report. */
@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./expense.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <h1 class="page-title">My expenses</h1>
          <p class="ex-desc">Add each expense with its receipt. Mileage and per diem are calculated from your expense policy. Select unreported expenses to put them in a report.</p>
        </div>
        <div class="ex-actions">
          <button type="button" class="ex-btn" [disabled]="!selected.size" (click)="openAdd()">Add to report ({{ selected.size }})</button>
          <button type="button" class="ex-btn primary" (click)="openNew()">+ New expense</button>
        </div>
      </div>
      <div class="ex-tabs">
        <button type="button" *ngFor="let t of tabs" [class.on]="tab === t.key" (click)="setTab(t.key)">{{ t.label }}</button>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <div class="ex-rows" *ngIf="!loading">
        <div class="ex-row click" *ngFor="let e of rows" (click)="openEdit(e)">
          <input type="checkbox" *ngIf="e.status === 'unreported' && !e.report" [checked]="selected.has(e.id)" (click)="$event.stopPropagation(); toggle(e.id)" [attr.aria-label]="'Select ' + (e.merchant || e.category_name)">
          <div class="ex-thumb" [class.none]="!e.receipt">
            <img *ngIf="img(e.receipt)" [src]="e.receipt" alt="Receipt"><span *ngIf="e.receipt && !img(e.receipt)">PDF</span><span *ngIf="!e.receipt">—</span>
          </div>
          <div class="main">
            <div class="t">{{ e.merchant || e.category_name }}</div>
            <div class="s">{{ e.date | date:'dd MMM yyyy' }} · {{ e.category_name }}
              <span *ngIf="e.category_kind === 'mileage'"> · {{ e.mileage_km }} km</span>
              <span *ngIf="e.category_kind === 'per_diem'"> · {{ e.per_diem_days }} day(s)</span>
              <span *ngIf="e.report_number"> · {{ e.report_number }}</span></div>
            <div><span class="ex-flag" [ngClass]="v.level" *ngFor="let v of e.policy_violations">{{ v.message }}</span></div>
          </div>
          <div class="r">
            <div class="money">{{ m(e.amount_aed) }}</div>
            <div class="s" *ngIf="e.currency !== 'AED'">{{ e.currency }} {{ e.amount }}</div>
            <span class="ex-tag" [ngClass]="e.status">{{ lbl(e.status) }}</span>
          </div>
        </div>
        <p class="ex-muted" *ngIf="!rows.length">No expenses here.</p>
      </div>
    </div>
  </div>
</div>

<!-- new / edit expense -->
<div class="ex-back" *ngIf="form" (click)="close()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
    <header><h2>{{ form.id ? (editable ? 'Edit expense' : 'Expense') : 'New expense' }}</h2><button type="button" (click)="close()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="ex-msg err" *ngIf="formErr">{{ formErr }}</p>
      <fieldset [disabled]="!editable" style="border:0;padding:0;margin:0;min-width:0">
      <div class="ex-form">
        <label>Category *
          <select [(ngModel)]="form.category" (ngModelChange)="changed()" name="category">
            <option [ngValue]="null">Choose…</option>
            <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
          </select></label>
        <label>Date *<input type="date" [(ngModel)]="form.date" (ngModelChange)="changed()" name="date"></label>

        <ng-container *ngIf="kind === 'mileage'">
          <label>From<input [(ngModel)]="form.mileage_from" name="mf" placeholder="e.g. Sharjah office"></label>
          <label>To<input [(ngModel)]="form.mileage_to" name="mt" placeholder="e.g. Client – Dubai Marina"></label>
          <label>Distance (km) *<input type="number" min="0" step="0.1" [(ngModel)]="form.mileage_km" (ngModelChange)="changed()" name="km"></label>
          <label>Rate per km<input [value]="policy?.mileage_rate ? 'AED ' + policy.mileage_rate : '–'" disabled></label>
        </ng-container>
        <ng-container *ngIf="kind === 'per_diem'">
          <label>Days *<input type="number" min="0" step="0.5" [(ngModel)]="form.per_diem_days" (ngModelChange)="changed()" name="days"></label>
          <label>Rate per day<input [value]="perDiemRate ? 'AED ' + perDiemRate : 'Enter the amount'" disabled></label>
        </ng-container>
        <ng-container *ngIf="!autoAmount">
          <label>Amount *<input type="number" min="0" step="0.01" [(ngModel)]="form.amount" (ngModelChange)="changed()" name="amount"></label>
          <label>Currency
            <select [(ngModel)]="form.currency" (ngModelChange)="changed()" name="currency"><option *ngFor="let c of currencies" [value]="c">{{ c }}</option></select></label>
          <label *ngIf="form.currency !== 'AED'">Rate to AED<input type="number" min="0" step="0.0001" [(ngModel)]="form.exchange_rate" (ngModelChange)="changed()" name="rate" placeholder="empty = standard rate (USD, SAR, QAR, OMR, BHD)"></label>
          <label>Merchant<input [(ngModel)]="form.merchant" name="merchant" placeholder="Shop / hotel / airline"></label>
        </ng-container>
        <div class="ex-calc" *ngIf="check?.amount_aed !== null && check?.amount_aed !== undefined">
          Amount: <b>{{ m(check.amount_aed) }}</b>
          <span *ngIf="kind === 'mileage'"> ({{ form.mileage_km || 0 }} km × AED {{ check.mileage_rate }})</span>
          <span *ngIf="kind === 'per_diem' && perDiemRate"> ({{ form.per_diem_days || 0 }} day(s) × AED {{ perDiemRate }})</span>
          <span *ngIf="form.currency !== 'AED' && !autoAmount"> ({{ form.currency }} {{ form.amount }} × {{ check.exchange_rate }})</span>
        </div>
        <label class="wide">Description {{ catDescRequired ? '*' : '' }}<textarea [(ngModel)]="form.description" (ngModelChange)="changed()" name="desc" placeholder="What was it for? Client / project"></textarea></label>
        <label>Cost centre
          <select [(ngModel)]="form.cost_center" name="cc"><option [ngValue]="null">–</option><option *ngFor="let c of costCenters" [ngValue]="c.id">{{ c.code }} – {{ c.name }}</option></select></label>
        <label>Add to report
          <select [(ngModel)]="form.report" (ngModelChange)="changed()" name="report"><option [ngValue]="null">Keep unreported</option>
            <option *ngFor="let r of openReports" [ngValue]="r.id">{{ r.number }} – {{ r.title }}</option></select></label>
        <label class="ck"><input type="checkbox" [(ngModel)]="form.billable" name="billable"> Billable to the client</label>

        <div class="ex-drop">
          <img *ngIf="preview && previewIsImage" [src]="preview" alt="Receipt preview">
          <div class="pdf" *ngIf="preview && !previewIsImage">PDF</div>
          <div style="min-width:0;flex:1">
            <div class="ex-muted" *ngIf="!preview">No receipt yet.</div>
            <a *ngIf="form.receipt && !file" [href]="form.receipt" target="_blank" rel="noopener" class="ex-link">Open receipt</a>
            <div style="margin-top:6px"><input type="file" accept="image/*,application/pdf" (change)="onFile($event)" aria-label="Receipt"></div>
          </div>
        </div>
      </div>
      </fieldset>
      <div class="ex-warns" *ngIf="(check?.violations || []).length" style="margin-top:12px">
        <span class="ex-flag" [ngClass]="v.level" *ngFor="let v of check.violations">{{ v.level === 'block' ? 'Must fix: ' : 'Policy: ' }}{{ v.message }}</span>
      </div>
    </div>
    <footer>
      <button type="button" class="ex-btn danger" *ngIf="form.id && editable" [disabled]="busy" (click)="remove()" style="margin-right:auto">Delete</button>
      <button type="button" class="ex-btn" (click)="close()">{{ editable ? 'Cancel' : 'Close' }}</button>
      <button type="button" class="ex-btn primary" *ngIf="editable" [disabled]="busy" (click)="save()">Save</button>
    </footer>
  </div>
</div>

<!-- add selected to a report -->
<div class="ex-back" *ngIf="adding" (click)="adding = false">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(480px,100%)">
    <header><h2>Add {{ selected.size }} expense(s) to a report</h2><button type="button" (click)="adding = false" aria-label="Close">×</button></header>
    <div class="body">
      <div class="ex-form">
        <label class="wide">Report
          <select [(ngModel)]="addTo" name="addto"><option [ngValue]="'new'">New report…</option>
            <option *ngFor="let r of openReports" [ngValue]="r.id">{{ r.number }} – {{ r.title }}</option></select></label>
        <label class="wide" *ngIf="addTo === 'new'">Title *<input [(ngModel)]="newTitle" name="title" placeholder="e.g. Dubai client visits – October"></label>
      </div>
    </div>
    <footer><button type="button" class="ex-btn" (click)="adding = false">Cancel</button>
      <button type="button" class="ex-btn primary" [disabled]="busy || (addTo === 'new' && !newTitle)" (click)="addToReport()">Add</button></footer>
  </div>
</div>`,
})
export class ExpenseListComponent implements OnInit, OnDestroy {
  tabs = [{ key: 'unreported', label: 'Unreported' }, { key: 'reported', label: 'In reports' }, { key: 'all', label: 'All' }];
  tab = 'unreported';
  rows: any[] = []; categories: any[] = []; costCenters: any[] = []; openReports: any[] = []; policy: any = null;
  currencies = CURRENCIES;
  selected = new Set<number>();
  loading = false; busy = false; msg = ''; msgErr = false;
  form: any = null; formErr = ''; file: File | null = null; preview = ''; previewIsImage = false; check: any = null;
  adding = false; addTo: any = 'new'; newTitle = '';
  private timer: any; private objUrl = '';
  m = money; lbl = (s: string) => STATUS_LABEL[s] || s; img = isImage;

  constructor(private api: ExpenseApiService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  get cat(): any { return this.categories.find(c => c.id === this.form?.category) || null; }
  get kind(): string { return this.cat?.kind || 'general'; }
  get catDescRequired(): boolean { return !!this.cat?.description_required; }
  get perDiemRate(): number { return Number(this.policy?.per_diem_rate || 0); }
  get autoAmount(): boolean { return this.kind === 'mileage' || (this.kind === 'per_diem' && this.perDiemRate > 0); }
  get editable(): boolean { return !this.form?.id || this.form.status === 'unreported'; }

  async ngOnInit(): Promise<void> {
    const q = this.route.snapshot.queryParamMap;
    this.tab = q.get('tab') || 'unreported';
    try {
      [this.categories, this.costCenters, this.policy] = await Promise.all([
        this.api.get('categories/', { active: 'true' }), this.api.get('cost-centers/', { active: 'true' }), this.api.get('policies/mine/')]);
    } catch (e: any) { this.flash(ExpenseApiService.error(e, 'Could not load the expense setup.'), true); }
    await this.load();
    if (q.get('new')) this.openNew();
    const open = Number(q.get('open'));
    if (open) {
      const e = this.rows.find(r => r.id === open) || await this.api.get(`expenses/${open}/`).catch(() => null);
      if (e) this.openEdit(e);
    }
  }

  ngOnDestroy(): void { clearTimeout(this.timer); if (this.objUrl) URL.revokeObjectURL(this.objUrl); }

  async load(): Promise<void> {
    this.loading = true; this.cd.detectChanges();
    try {
      const q: any = { mine: 1 };
      if (this.tab === 'unreported') q.unreported = 1;
      const rows: any[] = await this.api.get('expenses/', q);
      this.rows = this.tab === 'reported' ? rows.filter(r => r.report) : rows;
      this.openReports = await this.api.get('reports/', { mine: 1, status: 'draft,sent_back' });
    } catch (e: any) { this.rows = []; this.flash(ExpenseApiService.error(e, 'Could not load expenses.'), true); }
    this.selected.forEach(id => { if (!this.rows.some(r => r.id === id)) this.selected.delete(id); });
    this.loading = false; this.cd.detectChanges();
  }

  setTab(t: string): void {
    this.tab = t;
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: t }, replaceUrl: true });
    this.load();
  }

  toggle(id: number): void { this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }

  // ---------------- form
  openNew(): void {
    this.form = { category: null, date: new Date().toISOString().slice(0, 10), amount: null, currency: 'AED', exchange_rate: null, merchant: '',
      description: '', cost_center: null, report: null, billable: false, mileage_km: null, mileage_from: '', mileage_to: '', per_diem_days: null };
    this.resetFile(); this.formErr = ''; this.check = null;
  }

  openEdit(e: any): void {
    this.form = { ...e, exchange_rate: e.currency === 'AED' ? null : e.exchange_rate };
    this.resetFile();
    this.preview = e.receipt || ''; this.previewIsImage = isImage(e.receipt);
    this.formErr = ''; this.check = { amount_aed: e.amount_aed, exchange_rate: e.exchange_rate, mileage_rate: this.policy?.mileage_rate, violations: e.policy_violations };
  }

  close(): void { this.form = null; this.resetFile(); clearTimeout(this.timer); }

  private resetFile(): void {
    this.file = null; this.preview = ''; this.previewIsImage = false;
    if (this.objUrl) { URL.revokeObjectURL(this.objUrl); this.objUrl = ''; }
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files && input.files.length ? input.files[0] : null;
    this.resetFile();
    this.file = f;
    if (f) { this.objUrl = URL.createObjectURL(f); this.preview = this.objUrl; this.previewIsImage = f.type.startsWith('image/'); }
    this.changed();
  }

  /** Live policy check (debounced). */
  changed(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.runCheck(), 400);
  }

  private body(): any {
    const f = this.form, out: any = {};
    const keys = ['category', 'date', 'merchant', 'description', 'cost_center', 'report', 'billable', 'currency', 'exchange_rate', 'amount'];
    if (this.kind === 'mileage') keys.push('mileage_km', 'mileage_from', 'mileage_to');
    if (this.kind === 'per_diem') keys.push('per_diem_days');
    keys.forEach(k => {
      let v = f[k];
      if ((k === 'amount') && this.autoAmount) v = 0;
      if (k === 'exchange_rate' && (f.currency === 'AED' || v === '' || v === null)) return;
      if (v !== undefined) out[k] = v;
    });
    if (this.autoAmount) out.currency = 'AED';
    return out;
  }

  async runCheck(): Promise<void> {
    if (!this.form?.category || !this.editable) return;
    try {
      this.check = await this.api.post('expenses/check/', { ...this.body(), id: this.form.id || undefined, has_receipt: !!(this.file || this.form.receipt) });
    } catch { /* the form may still be incomplete */ }
    this.cd.detectChanges();
  }

  async save(): Promise<void> {
    if (!this.form.category || !this.form.date) { this.formErr = 'Choose the category and the date.'; return; }
    const b = this.body();
    const fd = new FormData();
    Object.entries(b).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v)); });
    if (this.form.id && b.report === null) fd.append('report', '');
    if (this.file) fd.append('receipt', this.file);
    this.busy = true;
    try {
      const saved: any = this.form.id ? await this.api.patch(`expenses/${this.form.id}/`, fd) : await this.api.post('expenses/', fd);
      const warn = (saved.policy_violations || []).length;
      this.flash(`Saved: ${saved.category_name} ${money(saved.amount_aed)}` + (warn ? ` – ${warn} policy note(s)` : ''), false);
      this.close(); await this.load();
    } catch (e: any) { this.formErr = ExpenseApiService.error(e); }
    this.busy = false; this.cd.detectChanges();
  }

  async remove(): Promise<void> {
    if (!confirm('Delete this expense?')) return;
    this.busy = true;
    try { await this.api.delete(`expenses/${this.form.id}/`); this.close(); this.flash('Expense deleted.', false); await this.load(); }
    catch (e: any) { this.formErr = ExpenseApiService.error(e); }
    this.busy = false; this.cd.detectChanges();
  }

  // ---------------- add to report
  openAdd(): void { this.adding = true; this.addTo = this.openReports.length ? this.openReports[0].id : 'new'; this.newTitle = ''; }

  async addToReport(): Promise<void> {
    const ids = [...this.selected];
    this.busy = true;
    try {
      const r: any = this.addTo === 'new'
        ? await this.api.post('reports/', { title: this.newTitle, expense_ids: ids })
        : await this.api.post(`reports/${this.addTo}/add_expenses/`, { expense_ids: ids });
      this.adding = false; this.selected.clear();
      this.router.navigate([`${EXPENSE_BASE}/reports`], { queryParams: { open: r.id } });
    } catch (e: any) { this.flash(ExpenseApiService.error(e), true); this.adding = false; }
    this.busy = false; this.cd.detectChanges();
  }

  private flash(t: string, err: boolean): void { this.msg = t; this.msgErr = err; this.cd.detectChanges(); }
}
