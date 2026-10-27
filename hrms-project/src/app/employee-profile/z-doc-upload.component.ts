import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeProfileService } from './employee-profile.service';
import { TPipe } from '../shared-ui/i18n.service';

/**
 * v1.53.2 – Employees → Upload document files: a zip of scans / PDFs for many employees at once.
 * The server matches every file to an employee and a document type from the folders, the file name, an optional list
 * (index.xlsx) and the text of the document, and shows a grid to check and correct; nothing is saved until Import.
 * API: employee-profile/api/doc-bulk/ (upload, template), …/<job>/ (rows, edit), …/<job>/import/, …/file/<i>/, …/report/.
 */
@Component({
  selector: 'app-doc-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="container ep du">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head"><div>
        <h1 class="page-title">Upload document files</h1>
        <p class="lp-desc">Upload one zip with the scans and PDFs of many employees. ZEO finds the employee and the document type
          from the folders and file names, reads the number and dates from the documents, and shows you the list to check. Nothing is saved until you press Import.</p>
      </div></div>
    </div>

    <ng-container *ngIf="!job">
      <div class="du-drop" [class.over]="over" (dragover)="$event.preventDefault(); over = true" (dragleave)="over = false" (drop)="drop($event)">
        <p><b>Drop the zip file here</b> or</p>
        <label class="lp-btn primary" style="cursor:pointer">Choose a zip file<input type="file" accept=".zip,application/zip" hidden data-du-file (change)="pick($event)"></label>
        <label class="du-opt"><input type="checkbox" [(ngModel)]="read"> Read the documents (number and dates from the text; a scan takes a few seconds)</label>
        <p class="lp-muted" *ngIf="uploading" role="status">{{ 'Uploading… {0}%' | t:[progress] }}</p>
      </div>
      <div class="ep-note err" *ngIf="error" role="alert">{{ error }}</div>
      <div class="ep-sec du-how">
        <h3>How the files are matched</h3>
        <div class="du-ways">
          <div><b>A folder per employee</b><code>EMP001/passport.pdf</code><code>EMP001/Emirates ID front.jpg</code></div>
          <div><b>A folder per document type</b><code>Passport/EMP001.pdf</code><code>Visa/EMP002 Ahmed.pdf</code></div>
          <div><b>Named files in one folder</b><code>EMP001_Passport_2032-06-14.pdf</code><small>A date in the name is the expiry date (two dates: issue and expiry).</small></div>
          <div><b>A list in the zip</b><code>index.xlsx</code><small>File, Employee Code, Document Type, Document Number, Issue Date, Expiry Date – the list wins over the guesses.</small>
            <button type="button" class="ep-link" (click)="template()">Download the list template</button></div>
        </div>
        <ul class="du-rules">
          <li>Employee: an employee code anywhere in the folders or the file name; else a passport, Emirates ID, UID or visa number on the document that is on an employee's record; else the name on the document (to check).</li>
          <li>Document type: the words of the folders and the file name, with their other names (PP, EID, هوية, Iqama, Residence, Work permit, DL …); else the kind of document read from it.</li>
          <li>Front and back (or 1 and 2) of the same document become one PDF.</li>
          <li>The same file, or the same number with the same expiry date, is skipped as a duplicate. A later expiry date updates the document; a new passport, visa or Emirates ID becomes the current one and the old one stays as history.</li>
          <li>Only the employees of your branches. The import can be undone in Import history.</li>
        </ul>
      </div>
    </ng-container>

    <div class="ep-sec" *ngIf="job && st?.state === 'running'" role="status">
      <h3>{{ st.file_name }}</h3>
      <p>{{ st.step | t }}<span *ngIf="st.total"> – {{ '{0} of {1} files' | t:[st.processed || 0, st.total] }}</span></p>
      <div class="ep-meter"><i [style.width.%]="st.total ? (100 * (st.processed || 0) / st.total) : 5"></i></div>
    </div>
    <div class="ep-note err" *ngIf="job && st?.state === 'failed'" role="alert">{{ st.error || 'The zip file could not be read.' }}
      <button type="button" class="ep-link" (click)="reset()">Upload another zip</button></div>

    <ng-container *ngIf="job && (st?.state === 'ready' || st?.state === 'done')">
      <div class="ep-note ok" *ngIf="result" role="status" data-du-result>
        {{ 'Imported {0} documents: {1} new, {2} updated.' | t:[result.imported, result.created, result.updated] }}
        <span *ngIf="result.replaced">{{ '{0} older documents are kept as history.' | t:[result.replaced] }}</span>
        <a routerLink="/main-sidebar/settings/import-history">Undo it in Import history</a>
      </div>
      <div class="ep-note err" *ngIf="result?.failed?.length">{{ '{0} documents could not be saved:' | t:[result.failed.length] }}
        <span *ngFor="let f of result.failed"> {{ f.path }} – {{ f.detail }};</span></div>
      <div class="ep-note err" *ngIf="error" role="alert">{{ error }}</div>

      <div class="ep-bar">
        <b class="du-file">{{ st.file_name }}</b>
        <span class="lp-muted" *ngIf="st.listed">{{ '{0} rows in the list' | t:[st.listed] }}</span>
        <span class="grow"></span>
        <button type="button" class="lp-btn" (click)="report()">Download the list (CSV)</button>
        <button type="button" class="lp-btn" (click)="reset(true)">Upload another zip</button>
      </div>
      <div class="ep-chips du-chips" role="group" aria-label="Show">
        <button type="button" class="ep-chip" [class.on]="!filter" (click)="filter = ''">{{ 'All {0}' | t:[rows.length] }}</button>
        <ng-container *ngFor="let k of statusKeys">
          <button type="button" class="ep-chip" *ngIf="count(k)" [class.on]="filter === k" [attr.data-du-chip]="k" (click)="filter = k">
            {{ statusName[k] | t }} {{ count(k) }}</button>
        </ng-container>
      </div>

      <p class="ep-empty" *ngIf="!rows.length && st.state === 'done'">All the documents of this zip are imported.</p>
      <div class="ep-scroll" *ngIf="rows.length">
        <table class="ep-table du-table" zPlain data-du-table>
          <thead><tr><th>File</th><th>Employee</th><th>Document type</th><th>Number</th><th>Issue date</th><th>Expiry date</th><th>Status</th><th><span class="sr">Skip</span></th></tr></thead>
          <tbody>
            <tr *ngFor="let r of shown(); trackBy: byId" [attr.data-row]="r.id" [ngClass]="'s-' + r.status">
              <td class="du-path">
                <button type="button" class="ep-link" *ngFor="let f of r.files" (click)="view(f)" [title]="f.path">{{ f.path }}</button>
                <small class="lp-muted" *ngIf="r.merged">Front and back – one PDF</small>
              </td>
              <td>
                <input class="du-in wide" list="du-emps" [ngModel]="r.employee" (change)="setEmp(r, $event)" [attr.aria-label]="'Employee of ' + r.path" [disabled]="r.skip">
                <small class="lp-muted" *ngIf="r.match">{{ how(r.match) | t }}</small>
                <small class="lp-muted" *ngIf="r.name_on_doc">{{ 'On the document: {0}' | t:[r.name_on_doc] }}</small>
              </td>
              <td>
                <select class="du-in" [ngModel]="r.type ?? ''" (ngModelChange)="edit(r, { type: $event })" [attr.aria-label]="'Document type of ' + r.path" [disabled]="r.skip">
                  <option value="">–</option>
                  <option *ngFor="let t of types" [ngValue]="t.id">{{ t.name }}</option>
                </select>
                <small class="lp-muted" *ngIf="r.type_from && r.type_from !== 'chosen'">{{ how(r.type_from) | t }}</small>
              </td>
              <td><input class="du-in" [ngModel]="r.number" (change)="edit(r, { number: val($event) })" [attr.aria-label]="'Number of ' + r.path" [disabled]="r.skip">
                <small class="lp-muted" *ngIf="r.from?.number && r.from.number !== 'chosen'">{{ how(r.from.number) | t }}</small></td>
              <td><input class="du-in" type="date" [ngModel]="r.issue" (change)="edit(r, { issue: val($event) })" [attr.aria-label]="'Issue date of ' + r.path" [disabled]="r.skip"></td>
              <td><input class="du-in" type="date" [ngModel]="r.expiry" (change)="edit(r, { expiry: val($event) })" [attr.aria-label]="'Expiry date of ' + r.path" [disabled]="r.skip"></td>
              <td class="du-st">
                <span class="ep-tag" [ngClass]="tagClass(r.status)">{{ r.status_label }}</span>
                <small *ngIf="r.action_label && r.status === 'ready'">{{ r.action_label }}</small>
                <small class="du-why" *ngFor="let n of r.notes_all">{{ n }}</small>
              </td>
              <td><button type="button" class="ep-link" [class.danger]="!r.skip" (click)="edit(r, { skip: !r.skip })">{{ r.skip ? 'Include' : 'Skip' }}</button></td>
            </tr>
          </tbody>
        </table>
        <datalist id="du-emps"><option *ngFor="let e of emps" [value]="e.code + ' – ' + e.name"></option></datalist>
      </div>
      <details class="du-skipped" *ngIf="st.skipped?.length"><summary>{{ '{0} files in the zip were not used' | t:[st.skipped.length] }}</summary>
        <ul><li *ngFor="let s of st.skipped">{{ s.path }} – {{ s.why }}</li></ul></details>

      <div class="ep-actions du-go" *ngIf="rows.length">
        <label class="du-opt"><input type="checkbox" [(ngModel)]="updateIdentity"> Also update the identity details (passport, visa, Emirates ID, labour card …) from these documents</label>
        <span class="grow"></span>
        <span class="lp-muted" *ngIf="count('review') + count('unmatched')">{{ 'Rows to check before they can be imported: {0}' | t:[count('review') + count('unmatched')] }}</span>
        <button type="button" class="lp-btn primary" data-du-import [disabled]="busy || !count('ready')" (click)="importReady()">
          {{ busy ? 'Importing…' : ('Import {0} ready documents' | t:[count('ready')]) }}</button>
      </div>
    </ng-container>
  </div>
</div>`,
  styles: [`
.du-drop { border: 2px dashed #cfd2e3; border-radius: 14px; background: #fbfbfe; padding: 26px 18px; text-align: center; margin-bottom: 14px; }
.du-drop.over { border-color: #5b4ff5; background: #f4f2ff; }
.du-drop p { margin: 0 0 10px; }
.du-opt { display: flex; align-items: center; gap: 8px; justify-content: center; margin-top: 12px; font-size: 12.5px; color: #4a4f63; }
.du-go .du-opt { justify-content: flex-start; margin: 0; }
.du-ways { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr)); gap: 10px; margin-bottom: 10px; }
.du-ways > div { border: 1px solid #eceef5; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.du-ways code { font-size: 12px; background: #f4f5fa; border-radius: 6px; padding: 2px 6px; align-self: flex-start; }
.du-ways small { color: #6b7185; }
.du-rules { margin: 0; padding-left: 18px; color: #4a4f63; line-height: 1.55; }
.du-file { overflow-wrap: anywhere; }
.du-chips { margin-bottom: 10px; }
.du-table td { vertical-align: top; }
.du-table small { display: block; font-size: 11.5px; margin-top: 2px; }
.du-path { min-width: 150px; max-width: 220px; }
.du-path .ep-link { display: block; text-align: start; padding: 0; overflow-wrap: anywhere; }
.du-in { height: 32px; border: 1px solid #cbd5e1; border-radius: 7px; padding: 0 6px; font-size: 12.5px; background: #fff; width: 118px; }
.du-in[type=date] { width: 132px; }
.du-in.wide { width: 190px; }
.du-st { min-width: 170px; max-width: 240px; }
.du-why { color: #9a5b00; }
tr.s-ready .du-why { color: #6b7185; }
tr.s-skipped td { opacity: .55; }
.du-skipped { margin: 10px 0; font-size: 12.5px; color: #4a4f63; }
.du-go { align-items: center; position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eceef5; }
.du-go .grow { flex: 1; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
`],
})
export class DocUploadComponent implements OnInit, OnDestroy {
  job = ''; st: any = null; rows: any[] = []; types: { id: any; name: string }[] = []; emps: { id: number; code: string; name: string }[] = [];
  read = true; over = false; uploading = false; progress = 0; error = ''; busy = false; filter = ''; result: any = null; updateIdentity = true;
  statusKeys = ['ready', 'review', 'unmatched', 'duplicate', 'conflict', 'skipped'];
  statusName: Record<string, string> = { ready: 'Ready', review: 'Needs review', unmatched: 'Employee not found', duplicate: 'Duplicate file', conflict: 'Conflict', skipped: 'Skipped' };
  private timer: any = null;

  constructor(private svc: EmployeeProfileService, private http: HttpClient, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      const c: any = await this.svc.get('doc-bulk/choices/');
      this.types = c.types || []; this.emps = c.employees || [];
    } catch (e: any) { this.error = this.svc.errors(e, 'The document types could not be loaded.').text; }
    const last = sessionStorage.getItem('zeo-docbulk-job');
    if (last) { this.job = last; await this.poll(); }
    this.cd.markForCheck();
  }

  ngOnDestroy(): void { clearTimeout(this.timer); }

  drop(ev: DragEvent): void {
    ev.preventDefault(); this.over = false;
    const f = ev.dataTransfer?.files?.[0];
    if (f) { this.upload(f); }
  }

  pick(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (f) { this.upload(f); }
  }

  upload(f: File): void {
    if (!/\.zip$/i.test(f.name)) { this.error = 'Choose a zip file.'; return; }
    this.error = ''; this.uploading = true; this.progress = 0; this.result = null;
    const fd = new FormData();
    fd.append('file', f, f.name);
    fd.append('read', this.read ? 'true' : 'false');
    this.http.post<any>(this.svc.url('doc-bulk/'), fd, { reportProgress: true, observe: 'events' }).subscribe({
      next: ev => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) { this.progress = Math.round(100 * ev.loaded / ev.total); this.cd.markForCheck(); }
        if (ev.type === HttpEventType.Response) {
          this.uploading = false; this.job = ev.body.job;
          sessionStorage.setItem('zeo-docbulk-job', this.job);
          this.poll();
        }
      },
      error: e => { this.uploading = false; this.error = this.svc.errors(e, 'The zip file could not be uploaded.').text; this.cd.markForCheck(); },
    });
  }

  async poll(): Promise<void> {
    clearTimeout(this.timer);
    try {
      this.set(await this.svc.get(`doc-bulk/${this.job}/`));
      if (this.st?.state === 'running') { this.timer = setTimeout(() => this.poll(), 1500); }
    } catch (e: any) {
      if (e?.status === 404) { this.reset(); } else { this.error = this.svc.errors(e, 'The upload could not be loaded.').text; }
    }
    this.cd.markForCheck();
  }

  private set(st: any): void { this.st = st; this.rows = st?.rows || []; }

  count(k: string): number { return this.rows.filter(r => r.status === k).length; }
  shown(): any[] { return this.filter ? this.rows.filter(r => r.status === this.filter) : this.rows; }
  byId(_: number, r: any): number { return r.id; }
  val(ev: Event): string { return (ev.target as HTMLInputElement).value; }

  tagClass(s: string): string { return s === 'ready' ? 'ok' : s === 'review' ? 'warn' : s === 'duplicate' || s === 'skipped' ? '' : 'bad'; }

  how(w: string): string {
    return ({ 'code in the folder': 'Code in the folder', 'code in the file name': 'Code in the file name', 'number on the document': 'Number on the document',
      'name on the document': 'Name on the document', 'list in the zip': 'From the list', folder: 'From the folder', 'file name': 'From the file name',
      document: 'Read from the document', chosen: 'Chosen by you' } as Record<string, string>)[w] || w;
  }

  setEmp(r: any, ev: Event): void {
    const v = this.val(ev).trim();
    if (!v) { this.edit(r, { emp_id: null }); return; }
    const e = this.emps.find(x => `${x.code} – ${x.name}` === v) || this.emps.find(x => x.code.toLowerCase() === v.split(' ')[0].toLowerCase());
    this.edit(r, e ? { emp_id: e.id } : { employee_code: v.split(' ')[0] });
  }

  private queue: Promise<void> = Promise.resolve();
  /** edits are sent one after the other, so a quick second change never overtakes the first */
  edit(r: any, change: any): Promise<void> {
    this.queue = this.queue.then(() => this.send(r, change));
    return this.queue;
  }

  private async send(r: any, change: any): Promise<void> {
    this.error = '';
    try {
      const res: any = await this.svc.put(`doc-bulk/${this.job}/`, { rows: [{ id: r.id, ...change }] });
      this.set(res);
      if (res.errors?.length) { this.error = res.errors.map((x: any) => x.detail).join(' '); }
    } catch (e: any) { this.error = this.svc.errors(e, 'The change could not be saved.').text; }
    this.cd.markForCheck();
  }

  async importReady(): Promise<void> {
    this.busy = true; this.error = '';
    try {
      const res: any = await this.svc.post(`doc-bulk/${this.job}/import/`, { update_identity: this.updateIdentity });
      this.result = res; this.set(res.job); this.filter = '';
    } catch (e: any) { this.error = this.svc.errors(e, 'The documents could not be imported.').text; }
    this.busy = false; this.cd.markForCheck();
  }

  private async download(path: string, name: string, open = false): Promise<void> {
    try {
      const b = await firstValueFrom(this.http.get(this.svc.url(path), { responseType: 'blob' }));
      const u = URL.createObjectURL(b);
      if (open) { window.open(u, '_blank'); } else {
        const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    } catch (e: any) { this.error = this.svc.errors(e, 'The file could not be opened.').text; this.cd.markForCheck(); }
  }

  view(f: any): void { this.download(`doc-bulk/${this.job}/file/${f.i}/`, f.path, true); }
  report(): void { this.download(`doc-bulk/${this.job}/report/`, 'document-files.csv'); }
  template(): void { this.download('doc-bulk/', 'index.xlsx'); }

  async reset(drop = false): Promise<void> {
    clearTimeout(this.timer);
    if (drop && this.job) { try { await this.svc.del(`doc-bulk/${this.job}/`); } catch { /* expired */ } }
    sessionStorage.removeItem('zeo-docbulk-job');
    this.job = ''; this.st = null; this.rows = []; this.result = null; this.filter = '';
    this.cd.markForCheck();
  }
}
