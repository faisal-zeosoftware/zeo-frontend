import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { readSheet } from '../shared-ui/z-export';
import { EmployeeProfileService } from './employee-profile.service';

/** v1.13.0 – Employee code numbering: one rule per branch (prefix, next number, digits) plus a company default. */
@Component({
  selector: 'app-emp-code-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="container ep">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head"><div>
        <h1 class="page-title">Employee code numbering</h1>
        <p class="lp-desc">When a rule is on, the employee code is filled when the employee is saved (for example SHJ-0001, SHJ-0002 …).
          A branch rule wins over the company default. Codes already in use are skipped. Turn a rule off to type codes by hand.</p>
      </div></div>
    </div>
    <div class="ep-note err" *ngIf="error">{{ error }}</div>
    <div class="ep-sec">
      <div class="ep-scroll">
        <table class="ep-table" zPlain>
          <thead><tr><th>Applies to</th><th>Prefix</th><th>Next number</th><th>Digits</th><th>Next code</th><th>On</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let r of rows">
              <ng-container *ngIf="editId !== r.id">
                <td>{{ r.branch_name }}</td><td>{{ r.prefix || '–' }}</td><td>{{ r.next_number }}</td><td>{{ r.padding }}</td><td><b>{{ r.preview }}</b></td>
                <td><span class="ep-tag" [ngClass]="r.enabled ? 'ok' : ''">{{ r.enabled ? 'On' : 'Off' }}</span></td>
                <td><button type="button" class="ep-link" (click)="edit(r)">Edit</button><button type="button" class="ep-link danger" (click)="remove(r)">Delete</button></td>
              </ng-container>
              <ng-container *ngIf="editId === r.id">
                <td>{{ r.branch_name }}</td>
                <td><input class="form-control" [(ngModel)]="f.prefix" placeholder="SHJ-" aria-label="Prefix"><small class="err">{{ ferr['prefix'] }}</small></td>
                <td><input class="form-control" type="number" min="1" [(ngModel)]="f.next_number" aria-label="Next number"><small class="err">{{ ferr['next_number'] }}</small></td>
                <td><input class="form-control" type="number" min="1" max="10" [(ngModel)]="f.padding" aria-label="Digits"><small class="err">{{ ferr['padding'] }}</small></td>
                <td><b>{{ preview() }}</b></td>
                <td><input type="checkbox" [(ngModel)]="f.enabled" aria-label="On"></td>
                <td><button type="button" class="lp-btn primary" (click)="save()">Save</button> <button type="button" class="lp-btn" (click)="editId = null">Cancel</button></td>
              </ng-container>
            </tr>
            <tr *ngIf="!rows.length"><td colspan="7" class="ep-empty">No numbering rule yet – employee codes are typed by hand.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="ep-row-form" *ngIf="adding">
        <div class="ep-grid">
          <label class="ep-f" [class.bad]="ferr['branch_id']"><span>Applies to</span>
            <select [(ngModel)]="f.branch_id"><option [ngValue]="null">Company default (all branches without a rule)</option>
              <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.branch_name }}</option></select><small class="err">{{ ferr['branch_id'] }}</small></label>
          <label class="ep-f" [class.bad]="ferr['prefix']"><span>Prefix</span><input [(ngModel)]="f.prefix" placeholder="SHJ-"><small class="err">{{ ferr['prefix'] }}</small></label>
          <label class="ep-f" [class.bad]="ferr['next_number']"><span>Next number</span><input type="number" min="1" [(ngModel)]="f.next_number"><small class="err">{{ ferr['next_number'] }}</small></label>
          <label class="ep-f" [class.bad]="ferr['padding']"><span>Digits</span><input type="number" min="1" max="10" [(ngModel)]="f.padding"><small class="err">{{ ferr['padding'] }}</small></label>
          <label class="ep-f check"><input type="checkbox" [(ngModel)]="f.enabled"> Number new employees automatically</label>
          <div class="ep-f"><span>First code</span><b>{{ preview() }}</b></div>
        </div>
        <div class="ep-actions"><button type="button" class="lp-btn primary" (click)="save()">Add rule</button><button type="button" class="lp-btn" (click)="adding = false">Cancel</button></div>
      </div>
      <div class="ep-actions" *ngIf="!adding && editId === null"><button type="button" class="lp-btn primary" (click)="add()">Add numbering rule</button></div>
    </div>
  </div>
</div>`,
})
export class EmpCodeSettingsComponent implements OnInit {
  rows: any[] = [];
  branches: any[] = [];
  f: any = {};
  ferr: Record<string, string> = {};
  editId: number | null = null;
  adding = false;
  error = '';

  constructor(private svc: EmployeeProfileService, private http: HttpClient, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    await this.load();
    try {
      const r: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/organisation/api/Branch/${this.svc.q()}`));
      this.branches = Array.isArray(r) ? r : r?.results || [];
    } catch { this.branches = []; }
    this.cd.markForCheck();
  }

  async load(): Promise<void> {
    try { this.rows = await this.svc.get('code-settings/'); this.error = ''; }
    catch (e: any) { this.error = this.svc.errors(e, 'The numbering rules could not be loaded.').text; }
    this.cd.markForCheck();
  }

  preview(): string { return `${this.f.prefix || ''}${String(this.f.next_number || 1).padStart(Number(this.f.padding) || 1, '0')}`; }
  add(): void { this.adding = true; this.editId = null; this.ferr = {}; this.f = { branch_id: null, prefix: '', next_number: 1, padding: 4, enabled: true }; }
  edit(r: any): void { this.adding = false; this.editId = r.id; this.ferr = {}; this.f = { ...r }; }

  async save(): Promise<void> {
    this.ferr = {};
    this.error = '';
    const body = { branch_id: this.f.branch_id ?? null, prefix: this.f.prefix || '', next_number: Number(this.f.next_number) || 1, padding: Number(this.f.padding) || 4, enabled: !!this.f.enabled };
    try {
      if (this.editId) { await this.svc.put(`code-settings/${this.editId}/`, body); } else { await this.svc.post('code-settings/', body); }
      this.adding = false;
      this.editId = null;
      await this.load();
    } catch (e: any) { const r = this.svc.errors(e); this.ferr = r.fields; this.error = r.fields['detail'] || 'Please correct the fields marked below.'; }
    this.cd.markForCheck();
  }

  async remove(r: any): Promise<void> {
    if (!confirm(`Delete the numbering rule for ${r.branch_name}? Codes will have to be typed by hand there.`)) { return; }
    try { await this.svc.del(`code-settings/${r.id}/`); await this.load(); } catch (e: any) { this.error = this.svc.errors(e).text; this.cd.markForCheck(); }
  }
}

/** v1.13.0 – employees whose probation ends soon (or has ended without a decision), with a link to decide. */
@Component({
  selector: 'app-probation-due',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="container ep">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head"><div>
        <h1 class="page-title">Probation ending</h1>
        <p class="lp-desc">Open probations that end within the chosen days, overdue first. Open the employee and use the Employment tab to confirm,
          extend (UAE maximum 6 months in total) or record that the probation was not passed. A daily reminder goes to the manager and HR.</p>
      </div></div>
    </div>
    <div class="ep-bar">
      <label class="ep-f" style="flex-direction:row;align-items:center;gap:8px"><span>Ending within</span>
        <select [(ngModel)]="days" (change)="load()" style="width:130px"><option [ngValue]="30">30 days</option><option [ngValue]="60">60 days</option><option [ngValue]="90">90 days</option><option [ngValue]="180">180 days</option></select></label>
    </div>
    <div class="ep-note err" *ngIf="error">{{ error }}</div>
    <table class="table table-striped">
      <thead><tr><th>Employee code</th><th>Employee</th><th>Branch</th><th>Department</th><th>Joining date</th><th>Probation ends</th><th>Days left</th><th>Probation</th><th>Manager</th></tr></thead>
      <tbody>
        <tr *ngFor="let r of rows" (click)="open(r)" style="cursor:pointer">
          <td>{{ r.employee_code }}</td><td>{{ r.employee }}</td><td>{{ r.branch }}</td><td>{{ r.department }}</td><td>{{ r.joined_date }}</td>
          <td>{{ r.probation_end_date }}</td><td><span class="ep-tag" [ngClass]="r.overdue ? 'bad' : r.days_left <= 7 ? 'warn' : 'blue'">{{ r.overdue ? 'Overdue ' + (-r.days_left) : r.days_left }}</span></td>
          <td>{{ r.probation_status }}</td><td>{{ r.manager || '–' }}</td>
        </tr>
      </tbody>
    </table>
    <div class="ep-empty" *ngIf="!rows.length && !error">No probation ends in this period.</div>
  </div>
</div>`,
})
export class ProbationDueComponent implements OnInit {
  rows: any[] = [];
  days = 30;
  error = '';
  constructor(private svc: EmployeeProfileService, private router: Router, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    try { this.rows = await this.svc.get('probation/due/', `&days=${this.days}`); this.error = ''; }
    catch (e: any) { this.rows = []; this.error = this.svc.errors(e, 'The list could not be loaded.').text; }
    this.cd.markForCheck();
  }
  open(r: any): void { this.router.navigate(['/main-sidebar/sub-sidebar/employee-details', r.employee_id, 'details']).catch(() => {}); }
}

/** v1.13.0 – import passport / visa / Emirates ID / labour details from Excel or CSV: check first (dry run), then save. */
@Component({
  selector: 'app-identity-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="container ep">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head"><div>
        <h1 class="page-title">Import identity details</h1>
        <p class="lp-desc">Passport, visa, Emirates ID, labour card, MOHRE contract and insurance for many employees at once. Download the template,
          fill one row per employee (empty cells are left unchanged), then check the file – nothing is saved until you press Save.</p>
      </div></div>
    </div>
    <div class="ep-bar">
      <button type="button" class="lp-btn" (click)="template()">Download template (CSV)</button>
      <label class="lp-btn" style="cursor:pointer">Choose file (Excel or CSV)<input type="file" accept=".csv,.xlsx,.xls" hidden (change)="pick($event)"></label>
      <span class="lp-muted" *ngIf="fileName">{{ fileName }} – {{ rows.length }} rows</span>
    </div>
    <div class="ep-note err" *ngIf="error">{{ error }}</div>
    <div class="ep-actions" *ngIf="rows.length">
      <button type="button" class="lp-btn" [disabled]="busy" (click)="run(true)">Check rows</button>
      <button type="button" class="lp-btn primary" [disabled]="busy || !checked || !result?.ok" (click)="run(false)">Save {{ result?.ok || 0 }} correct rows</button>
    </div>
    <div class="ep-note ok" *ngIf="result && !result.dry_run">Saved {{ result.ok }} of {{ result.total }} rows.</div>
    <div class="ep-sec" *ngIf="result">
      <h3>{{ result.dry_run ? 'Check' : 'Result' }}: {{ result.ok }} correct, {{ result.failed }} with problems</h3>
      <table class="ep-table" zPlain>
        <thead><tr><th>Row</th><th>Employee</th><th>Result</th></tr></thead>
        <tbody><tr *ngFor="let r of result.results">
          <td>{{ r.row }}</td><td>{{ r.employee || rows[r.row - 1]?.employee_code }}</td>
          <td><span class="ep-tag" [ngClass]="r.ok ? 'ok' : 'bad'">{{ r.ok ? 'OK' : 'Problem' }}</span>
            <span *ngFor="let e of entries(r.errors)"> {{ e[0] }}: {{ e[1] }}</span>
            <span *ngFor="let e of entries(r.warnings)" class="lp-muted"> {{ e[1] }}</span></td></tr></tbody>
      </table>
    </div>
  </div>
</div>`,
})
export class IdentityImportComponent implements OnInit {
  columns: string[] = [];
  rows: any[] = [];
  fileName = '';
  result: any = null;
  checked = false;
  busy = false;
  error = '';
  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try { this.columns = (await this.svc.get<any>('identity/import/')).columns || []; } catch (e: any) { this.error = this.svc.errors(e, 'The template could not be loaded.').text; }
    this.cd.markForCheck();
  }

  entries(o: any): [string, string][] { return o ? Object.entries(o).map(([k, v]) => [k.replace(/_/g, ' '), String(v)]) : []; }

  template(): void {
    const csv = this.columns.join(',') + '\n' + this.columns.map(c => c === 'employee_code' ? 'EMP1001' : '').join(',') + '\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'identity-import-template.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async pick(ev: Event): Promise<void> {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) { return; }
    this.fileName = f.name;
    this.result = null;
    this.checked = false;
    this.error = '';
    try {
      const data = await readSheet(f);
      const norm = (h: string) => String(h || '').trim().toLowerCase().replace(/\s+/g, '_');
      this.rows = data.rows.map(r => Object.fromEntries(data.headers.map(h => [norm(h), r[h] ?? ''])));
    } catch { this.error = 'The file could not be read. Use the template (CSV) or an Excel file with the same columns.'; this.rows = []; }
    this.cd.markForCheck();
  }

  async run(dry: boolean): Promise<void> {
    this.busy = true;
    this.error = '';
    try {
      this.result = await this.svc.post('identity/import/', { rows: this.rows, dry_run: dry });
      this.checked = dry;
    } catch (e: any) { this.error = this.svc.errors(e, 'The rows could not be checked.').text; }
    this.busy = false;
    this.cd.markForCheck();
  }
}
