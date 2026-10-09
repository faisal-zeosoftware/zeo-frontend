import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, firstValueFrom } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { exportExcel, readSheet } from '../shared-ui/z-export';
import { OrgSettingsService } from './org-settings.service';
import { ZEmpOrgFieldsComponent } from './z-emp-org-fields.component';

/**
 * v1.12.0 – Employee organisation: every employee with location / division / section / cost centre / grade /
 * position / employment type (the fields that are on), edit one employee, or import many from Excel / CSV by codes.
 * API: GET org-structure/api/employee-org/ · PUT employee-org/<id>/ · POST employee-org/import/ {rows, dry_run}
 */
@Component({
  selector: 'app-org-assign',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective, ZEmpOrgFieldsComponent],
  styleUrls: ['../leave-policy/leave-policy.css', '../hr-actions/hr-actions.css', './org-structure.css'],
  template: `
<div class="container os-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Employee organisation</h1>
          <p class="lp-desc">Where each employee sits: {{ fieldNames || 'switch fields on in Organisation settings first' }}. Edit one employee here or on the employee form, or import many at once from a spreadsheet of codes.</p>
        </div>
        <div class="lp-actions" *ngIf="cols.length">
          <button type="button" class="lp-btn" (click)="template()">Download import template</button>
          <label class="lp-btn primary" style="margin:0">Import from Excel / CSV<input type="file" accept=".xlsx,.xls,.csv" hidden (change)="pick($event)"></label>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
      <p class="lp-muted" *ngIf="!cols.length && !loading">No organisation fields are switched on. Turn on Locations, Divisions, Sections, Cost centres, Grades, Job positions or Employment types in Organisation settings.</p>

      <!-- import check -->
      <div class="ha-panel" *ngIf="imp">
        <h2>Import {{ imp.file }}</h2>
        <p class="lp-muted" style="margin:0 0 8px">{{ imp.rows.length }} row(s). Rows are checked first; nothing is saved until you press Import.</p>
        <ng-container *ngIf="imp.result">
          <p><span class="os-tag ok">{{ imp.result.ok }} ready</span> <span class="os-tag bad" *ngIf="imp.result.failed">{{ imp.result.failed }} with problems</span></p>
          <div class="lp-scroll" *ngIf="problems().length"><table class="lp-mini" zPlain><thead><tr><th>Row</th><th>Problem</th></tr></thead>
            <tbody><tr *ngFor="let p of problems()"><td>{{ p.row + 1 }}</td><td>{{ p.text }}</td></tr></tbody></table></div>
        </ng-container>
        <div class="lp-foot">
          <button type="button" class="lp-btn" (click)="imp = null">Close</button>
          <button type="button" class="lp-btn primary" [disabled]="busy || !imp.result?.ok || imp.done" (click)="runImport(false)">
            {{ busy ? 'Importing…' : imp.done ? 'Imported' : 'Import ' + (imp.result?.ok || 0) + ' row(s)' }}</button>
        </div>
      </div>

      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <table class="table" *ngIf="!loading && cols.length">
        <thead><tr><th>Employee</th><th *ngFor="let c of cols">{{ c.label }}</th><th *ngIf="showEnd">Contract end</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td data-label="Employee">{{ r.employee }}</td>
            <td *ngFor="let c of cols" [attr.data-label]="c.label">{{ r[c.field] || '–' }}</td>
            <td *ngIf="showEnd" data-label="Contract end">{{ r.contract_end_date ? (r.contract_end_date | date:'dd/MM/yyyy') : '–' }}</td>
            <td data-label="Actions"><button type="button" class="lp-btn" (click)="edit = r">Edit</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div class="lp-modal-back" *ngIf="edit" (click)="edit = null">
  <div class="lp-modal" style="width:min(720px, 100%)" (click)="$event.stopPropagation()" role="dialog" aria-label="Edit organisation details">
    <header><h2>{{ edit.employee }}</h2><button type="button" class="lp-x" (click)="edit = null" aria-label="Close" style="color:#6b7185">×</button></header>
    <div class="body"><div class="row">
      <z-emp-org-fields #f [employeeId]="edit.employee_id" [departmentId]="edit.department_id" [designationId]="edit.designation_id" [branchId]="edit.branch_id"></z-emp-org-fields>
    </div></div>
    <footer>
      <button type="button" class="lp-btn" (click)="edit = null">Cancel</button>
      <button type="button" class="lp-btn primary" [disabled]="busy" (click)="saveOne(f)">{{ busy ? 'Saving…' : 'Save' }}</button>
    </footer>
  </div>
</div>`,
})
export class OrgAssignComponent implements OnInit, OnDestroy {
  rows: any[] = []; cols: { field: string; label: string }[] = []; showEnd = false; fieldNames = '';
  loading = false; busy = false; msg = ''; err = false; edit: any = null;
  imp: { file: string; rows: any[]; result: any; done: boolean } | null = null;
  private sub?: Subscription;

  constructor(private http: HttpClient, private org: OrgSettingsService, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.org.api}${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }

  ngOnInit(): void {
    this.sub = this.org.settings$.subscribe(s => {
      this.cols = this.org.activeFields(s).map(f => ({ field: f.field, label: f.label }));
      this.showEnd = this.org.isOn('employment_types', s);
      this.fieldNames = this.cols.map(c => c.label.toLowerCase()).join(', ');
      this.cd.markForCheck();
    });
    this.org.load(true).subscribe(() => this.load());
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  async load(): Promise<void> {
    this.loading = true; this.cd.markForCheck();
    try { this.rows = await firstValueFrom(this.http.get<any[]>(this.url('employee-org/'))); }
    catch (e: any) { this.rows = []; this.say(e?.error?.detail || 'The employees could not be loaded.', true); }
    this.loading = false; this.cd.markForCheck();
  }

  private say(m: string, bad = false): void { this.msg = m; this.err = bad; }

  async saveOne(f: ZEmpOrgFieldsComponent): Promise<void> {
    const miss = f.problems();
    if (miss.length) { return; }
    this.busy = true;
    const e = await f.save(this.edit.employee_id);
    this.busy = false;
    if (!e) { this.say(`Saved for ${this.edit.employee}.`); this.edit = null; await this.load(); }
    this.cd.markForCheck();
  }

  template(): void {
    const head = ['employee_code', ...this.cols.map(c => c.field + '_code'), ...(this.showEnd ? ['contract_end_date'] : [])];
    const sample = this.rows.slice(0, 3).map(r => [r.employee_code, ...this.cols.map(c => r[c.field + '_code'] || ''), ...(this.showEnd ? [r.contract_end_date || ''] : [])]);
    exportExcel('Employee organisation import', head, sample, [{ name: 'How to fill', rows: [
      ['Column', 'What to enter'], ['employee_code', 'The employee code (required)'],
      ...this.cols.map(c => [c.field + '_code', `Code of the ${c.label.toLowerCase()} (empty = no change)`]),
      ...(this.showEnd ? [['contract_end_date', 'YYYY-MM-DD (empty = no change)']] : []),
    ] }]);
  }

  async pick(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0]; input.value = '';
    if (!file) { return; }
    try {
      const s = await readSheet(file);
      this.imp = { file: file.name, rows: s.rows, result: null, done: false };
      await this.runImport(true);
    } catch { this.say('The file could not be read – use the template (Excel or CSV).', true); }
    this.cd.markForCheck();
  }

  async runImport(dry: boolean): Promise<void> {
    if (!this.imp) { return; }
    this.busy = true; this.cd.markForCheck();
    try {
      const r = await firstValueFrom(this.http.post<any>(this.url('employee-org/import/'), { rows: this.imp.rows, dry_run: dry }));
      this.imp.result = r;
      if (!dry) { this.imp.done = true; this.say(`${r.ok} employee(s) updated${r.failed ? `, ${r.failed} row(s) skipped` : ''}.`); await this.load(); }
    } catch (e: any) { this.say(e?.error?.detail || 'The import failed.', true); }
    this.busy = false; this.cd.markForCheck();
  }

  problems(): { row: number; text: string }[] {
    return (this.imp?.result?.results || []).filter((r: any) => !r.ok)
      .map((r: any) => ({ row: r.row, text: Object.entries(r.errors || {}).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ') }));
  }
}
