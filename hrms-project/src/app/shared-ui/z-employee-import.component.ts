import { ChangeDetectorRef, Component, OnDestroy, Optional, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../environments/environment';

/**
 * v1.26.0 – employee bulk upload (rebuilt after the Falcon Demo test).
 * Check first or import straight away; good rows are imported, rows with errors are listed with the reason and can be
 * downloaded as a file, fixed and uploaded again. Progress is shown while the server works in the background.
 * Columns: the old template plus Reports To, bank / IBAN / salary card / routing code, Emirates ID, passport, visa,
 * labour card, salary components and Status / Exit date.
 */
@Component({
  selector: 'z-employee-import',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zi-wrap">
    <header class="zi-h">
      <div><h2>Import employees</h2>
        <p class="zr-muted">Excel (.xlsx) or CSV. Required: Employee Code, First Name, Date of Birth, Joining Date, Nationality, Branch, Department, Designation, Category.</p></div>
      <button type="button" class="zr-ic" (click)="close()" aria-label="Close">✕</button>
    </header>

    <section *ngIf="!job">
      <div class="zi-row">
        <button type="button" class="zr-btn" (click)="template()">Download the template</button>
        <span class="zr-muted">also accepts Reports To, IBAN, routing code, salary card, Emirates ID, passport, visa, labour card, salary columns and Exit date</span>
      </div>
      <label class="zi-drop" [class.has]="file">
        <input type="file" accept=".xlsx,.xls,.csv" (change)="pick($event)">
        <span *ngIf="!file">Choose a file or drop it here</span>
        <span *ngIf="file"><b>{{ file.name }}</b> · {{ (file.size / 1024) | number:'1.0-0' }} KB</span>
      </label>
      <fieldset class="zi-mode">
        <label><input type="radio" name="zimode" [checked]="mode === 'partial'" (change)="mode = 'partial'"> Import the good rows and list the rows with errors</label>
        <label><input type="radio" name="zimode" [checked]="mode === 'all'" (change)="mode = 'all'"> Import nothing if any row has an error</label>
      </fieldset>
      <div class="zi-actions">
        <button type="button" class="zr-btn" [disabled]="!file || busy" (click)="send(true)">Check only</button>
        <button type="button" class="zr-btn primary" [disabled]="!file || busy" (click)="send(false)">Import</button>
      </div>
      <p class="zi-err" *ngIf="error">{{ error }}</p>
    </section>

    <section *ngIf="job">
      <div class="zi-progress" *ngIf="st?.state === 'running'">
        <div class="zi-step">{{ st?.step || 'Working' }}…</div>
        <div class="zi-bar"><span [style.width.%]="pct()"></span></div>
        <div class="zr-muted">{{ st?.processed || 0 }} of {{ st?.valid ?? st?.total ?? '…' }} rows saved · {{ st?.total || 0 }} rows in the file</div>
      </div>
      <div *ngIf="st?.state === 'failed'" class="zi-err">The file could not be read: {{ st?.error }}
        <div *ngIf="st?.unknown_columns?.length" class="zr-muted">Columns not understood: {{ st.unknown_columns.join(', ') }}</div></div>
      <div *ngIf="st?.state === 'done'">
        <div class="zi-sum">
          <div><b>{{ st.total }}</b><span>rows in the file</span></div>
          <div class="ok" *ngIf="st.saved"><b>{{ st.created }}</b><span>created</span></div>
          <div class="ok" *ngIf="st.saved"><b>{{ st.updated }}</b><span>updated</span></div>
          <div class="ok" *ngIf="!st.saved"><b>{{ st.valid }}</b><span>rows are correct</span></div>
          <div class="bad"><b>{{ st.invalid || 0 }}</b><span>{{ st.saved ? 'not imported' : 'with errors' }}</span></div>
        </div>
        <p class="zr-muted" *ngIf="!st.saved && st.dry_run">Checked only – nothing was saved.</p>
        <p class="zr-muted" *ngIf="!st.saved && !st.dry_run">Nothing was saved because some rows have errors (you chose “import nothing if any row has an error”).</p>
        <p class="zr-muted" *ngIf="st.salary_columns?.length">Salary columns: {{ st.salary_columns.join(', ') }}</p>
        <p class="zr-muted" *ngIf="st.unknown_columns?.length">Columns not used: {{ st.unknown_columns.join(', ') }}</p>
        <p class="zr-muted" *ngIf="st.nationalities_added?.length">Nationalities added to the list: {{ st.nationalities_added.join(', ') }}</p>
        <div *ngIf="st.errors?.length">
          <div class="zi-row"><b>Rows not imported</b><span class="zr-grow"></span>
            <button type="button" class="zr-btn" (click)="errorsFile()">Download the rows with errors</button></div>
          <div class="zi-table"><table zPlain>
            <thead><tr><th>Row</th><th>Employee code</th><th>Reason</th></tr></thead>
            <tbody><tr *ngFor="let e of st.errors | slice:0:300"><td>{{ $any(e).row }}</td><td>{{ $any(e).code }}</td><td>{{ $any(e).errors?.join(' · ') }}</td></tr></tbody>
          </table></div>
          <p class="zr-muted" *ngIf="st.errors.length > 300">… and {{ st.errors.length - 300 }} more – download the file to see all.</p>
        </div>
        <div class="zi-actions">
          <button type="button" class="zr-btn" (click)="reset()">Upload another file</button>
          <button type="button" class="zr-btn primary" *ngIf="!st.saved && st.valid" (click)="send(false)">Import now</button>
          <button type="button" class="zr-btn primary" *ngIf="st.saved" (click)="close(true)">Done</button>
        </div>
      </div>
    </section>
  </div>`,
  styles: [`
  .zi-wrap{padding:20px 22px;max-width:860px;font-size:14px}
  .zi-h{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
  .zi-h h2{margin:0 0 4px;font-size:20px}
  .zi-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:10px 0}
  .zi-drop{display:block;border:2px dashed #c9c6ef;border-radius:10px;padding:22px;text-align:center;cursor:pointer;margin:12px 0;color:#4a4766}
  .zi-drop.has{border-style:solid;background:#f6f5ff}
  .zi-drop input{display:none}
  .zi-mode{border:0;padding:0;margin:8px 0;display:grid;gap:6px}
  .zi-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
  .zi-err{color:#c62828;margin-top:10px}
  .zi-progress{padding:14px 0}
  .zi-step{font-weight:600;margin-bottom:8px}
  .zi-bar{height:10px;border-radius:6px;background:#eceaf8;overflow:hidden;margin-bottom:6px}
  .zi-bar span{display:block;height:100%;background:#5b4fe0;transition:width .4s}
  .zi-sum{display:flex;gap:14px;flex-wrap:wrap;margin:6px 0 12px}
  .zi-sum div{background:#f4f3fb;border-radius:10px;padding:10px 16px;min-width:110px}
  .zi-sum b{display:block;font-size:22px}.zi-sum span{color:#4a4766;font-size:12px}
  .zi-sum .ok b{color:#1f9d6b}.zi-sum .bad b{color:#d93a3f}
  .zi-table{max-height:300px;overflow:auto;border:1px solid #e4e2f2;border-radius:8px}
  .zi-table table{width:100%;border-collapse:collapse;font-size:13px}
  .zi-table th,.zi-table td{padding:6px 8px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}
  .zi-table th{position:sticky;top:0;background:#fafafe}
  `]
})
export class ZEmployeeImportComponent implements OnDestroy {
  private api = `${environment.apiBaseUrl}/employee/api/emp-bulkupload`;
  file: File | null = null;
  mode: 'partial' | 'all' = 'partial';
  busy = false;
  error = '';
  job = '';
  st: any = null;
  private timer: any = null;
  private dryRunDone = false;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef, @Optional() private ref: MatDialogRef<ZEmployeeImportComponent>) {}

  private q(): string { return `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }

  pick(ev: any): void { this.file = ev?.target?.files?.[0] || null; this.error = ''; }

  pct(): number {
    const tot = this.st?.valid ?? this.st?.total ?? 0;
    if (!tot) return this.st?.step === 'Checking' ? 15 : 5;
    return Math.max(5, Math.min(100, Math.round(100 * (this.st?.processed || 0) / tot)));
  }

  send(dry: boolean): void {
    if (!this.file) return;
    this.busy = true; this.error = '';
    const fd = new FormData();
    fd.append('file', this.file);
    fd.append('mode', this.mode);
    if (dry) fd.append('dry_run', '1');
    this.dryRunDone = dry;
    this.http.post<any>(`${this.api}/import/?${this.q()}`, fd).subscribe({
      next: r => { this.job = r.job; this.st = { state: 'running', step: 'Reading the file' }; this.poll(); },
      error: e => { this.busy = false; this.error = e?.error?.error || e?.error?.detail || 'The file could not be sent.'; this.cd.markForCheck(); }
    });
  }

  private poll(): void {
    clearTimeout(this.timer);
    this.http.get<any>(`${this.api}/import-status/?job=${this.job}&${this.q()}`).subscribe({
      next: st => {
        this.st = st; this.cd.markForCheck();
        if (st.state === 'running') this.timer = setTimeout(() => this.poll(), 1500);
        else this.busy = false;
      },
      error: () => { this.timer = setTimeout(() => this.poll(), 3000); }
    });
  }

  private download(url: string, name: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }
  template(): void { this.download(`${this.api}/import-template/?${this.q()}`, 'employee_upload_template.xlsx'); }
  errorsFile(): void { this.download(`${this.api}/import-errors/?job=${this.job}&${this.q()}`, 'employee_upload_errors.csv'); }

  reset(): void { this.job = ''; this.st = null; this.file = null; this.busy = false; }
  close(done = false): void { clearTimeout(this.timer); if (this.ref) this.ref.close(done ? 'imported' : undefined); }
  ngOnDestroy(): void { clearTimeout(this.timer); }
}
