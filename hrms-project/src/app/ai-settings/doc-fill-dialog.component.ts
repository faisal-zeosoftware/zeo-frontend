import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AiSettingsApi, DocField, DocReading } from './ai-settings.service';
import { environment } from '../../environments/environment';
import { TPipe } from '../shared-ui/i18n.service';

/** Form values the dialog can fill (the names of the employee document form). */
export interface DocFormValues { document_type?: any; emp_doc_number?: any; emp_doc_issued_date?: any; emp_doc_expiry_date?: any; record_saved?: boolean; }
/** v1.53.2 empId: also offer "Update the employee record"; inForm: the document is being added or edited in a form
 *  (the identity details are saved without adding a document of their own – the form's document is the one). */
export interface DocFillOptions { empId?: number | null; inForm?: boolean; above?: boolean; }
export interface DocFillData extends DocFillOptions { file: File; types: { id: any; type_name: string }[]; current: DocFormValues; keys?: string[]; }
export interface RecLine {
  key: string; label: string; group: string; current: any; found: any; current_show: any; found_show: any;
  status: 'new' | 'same' | 'different' | 'unknown'; pick: boolean; note: string;
}

const SOURCE: Record<string, string> = {
  text: 'the text of the PDF', ocr: 'text recognition (OCR) of the image', 'file name': 'the file name only',
};

/**
 * v1.16.0 – "Fill from document": reads the chosen file on the server (built-in reader by default; the company's external AI
 * when switched on in Settings → AI settings) and shows what it found. The user picks what to fill – nothing is saved here.
 * Open it with openDocFill(dialog, file, types, current) → the chosen values, or null.
 */
@Component({
  selector: 'z-doc-fill-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TPipe],
  template: `
<div class="df" role="dialog" aria-labelledby="df-title">
  <header>
    <h2 id="df-title">Fill from document</h2>
    <button type="button" class="df-x" (click)="close()" aria-label="Close">×</button>
  </header>
  <div class="df-body">
    <p class="df-file">{{ data.file.name }} <small>({{ size() }})</small></p>
    <p class="df-muted" *ngIf="loading" role="status">Reading the document… (scans and photos can take a few seconds)</p>
    <div class="df-msg err" *ngIf="error" role="alert">{{ error }}</div>

    <ng-container *ngIf="r">
      <div class="df-facts">
        <span><b>{{ r.kind_label || 'Type not recognised' }}</b></span>
        <span>Read from {{ source() }}</span>
        <span class="df-tag" [class.ext]="r.mode === 'external'">{{ r.mode === 'external' ? 'External AI' : 'Built-in reader – stayed on the server' }}</span>
        <span class="df-tag ok" *ngIf="r.mrz_ok">Machine-readable zone verified</span>
      </div>

      <table class="df-table" *ngIf="rows.length">
        <thead><tr><th><span class="sr">Fill</span></th><th>Field</th><th>Found in the document</th><th>Now in the form</th><th>Certainty</th></tr></thead>
        <tbody>
          <tr *ngFor="let x of rows" [class.same]="x.same">
            <td><input type="checkbox" [(ngModel)]="x.pick" [disabled]="x.same" [attr.aria-label]="'Fill ' + x.label"></td>
            <td>{{ x.label }}</td>
            <td><b>{{ x.show }}</b></td>
            <td>{{ x.now || '–' }}<small *ngIf="x.same"> (same)</small></td>
            <td><span class="df-tag" [class.ok]="x.f.confidence === 'high'" [class.warn]="x.f.confidence === 'low'">{{ certainty(x.f) }}</span></td>
          </tr>
        </tbody>
      </table>

      <div class="df-info" *ngIf="r.info.length">
        <b>Also found (not filled – for checking)</b>
        <ul><li *ngFor="let i of r.info">{{ i.label }}: {{ i.value }}</li></ul>
      </div>
      <ul class="df-notes" *ngIf="r.notes.length"><li *ngFor="let n of r.notes">{{ n }}</li></ul>
      <p class="df-muted">Check the values against the document. Nothing is saved until you save the document form.</p>

      <!-- v1.53.2 the values of the document compared with the employee record; the ticked ones are saved on the record -->
      <section class="df-rec" *ngIf="data.empId && r.record" aria-labelledby="df-rec-title">
        <h3 id="df-rec-title">Update the employee record</h3>
        <p class="df-muted">The identity details and the employee's details compared with the document. Tick what to save on the record.</p>
        <p class="df-muted" *ngIf="recLoading" role="status">Comparing with the employee record…</p>
        <div class="df-msg err" *ngIf="recError" role="alert">{{ recError }}</div>
        <table class="df-table" *ngIf="recLines.length" data-df-rec>
          <thead><tr><th><span class="sr">Save</span></th><th>Field</th><th>On the record</th><th>On the document</th><th><span class="sr">Status</span></th></tr></thead>
          <tbody>
            <ng-container *ngFor="let g of recGroups">
              <tr class="df-g"><td colspan="5">{{ g }}</td></tr>
              <tr *ngFor="let x of linesOf(g)" [class.same]="x.status === 'same'" [class.diff]="x.status === 'different'" [attr.data-key]="x.key">
                <td><input type="checkbox" [(ngModel)]="x.pick" [disabled]="x.status === 'same' || x.status === 'unknown' || !!recSaved" [attr.aria-label]="'Save ' + x.label"></td>
                <td>{{ x.label }}<small class="df-note" *ngIf="x.note">{{ x.note }}</small></td>
                <td>{{ fmt(x.current_show) || '–' }}</td>
                <td><b>{{ fmt(x.found_show) }}</b></td>
                <td><span class="df-tag" [ngClass]="{ ok: x.status === 'same', warn: x.status === 'different', ext: x.status === 'new' }">{{ statusText(x) | t }}</span></td>
              </tr>
            </ng-container>
          </tbody>
        </table>
        <p class="df-muted" *ngIf="!recLoading && !recError && !recLines.length">The document has nothing to compare with the employee record.</p>
        <div class="df-rec-f" *ngIf="recLines.length && !recSaved">
          <span class="df-muted" *ngIf="mismatches">{{ '{0} values differ from the record' | t:[mismatches] }}</span>
          <span class="df-spacer"></span>
          <button type="button" class="df-btn" data-df-rec-save (click)="saveRecord()" [disabled]="!recPicked() || recSaving">{{ recSaving ? 'Saving…' : 'Save on the employee record' }}</button>
        </div>
        <div class="df-msg ok" *ngIf="recSaved" role="status">{{ 'Saved on the employee record: {0}' | t:[recSaved] }}</div>
      </section>
    </ng-container>
  </div>
  <footer>
    <button type="button" class="df-btn" (click)="close()">Cancel</button>
    <button type="button" class="df-btn primary" (click)="apply()" [disabled]="!picked() && !recSaved">{{ picked() || !recSaved ? 'Fill the selected fields' : 'Done' }}</button>
  </footer>
</div>`,
  styles: [`
.df { display: flex; flex-direction: column; max-height: 82vh; font-size: 13px; color: #1d2033; }
.df header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #eceef5; }
.df h2 { margin: 0; font-size: 16px; font-weight: 600; }
.df-x { border: 0; background: transparent; font-size: 22px; line-height: 1; cursor: pointer; color: #6b7185; }
.df-body { padding: 14px 18px; overflow: auto; }
.df-file { margin: 0 0 8px; font-weight: 600; word-break: break-all; }
.df-file small, .df-muted { color: #6b7185; font-weight: 400; }
.df-msg.ok { background: #ecfdf3; color: #1f7a4d; border: 1px solid #b7e4c7; border-radius: 8px; padding: 8px 10px; margin: 6px 0; }
.df-rec { margin-top: 14px; padding-top: 12px; border-top: 1px solid #eceef5; }
.df-rec h3 { margin: 0 0 2px; font-size: 14px; font-weight: 600; }
.df-table tr.df-g td { background: #f6f7fb; font-size: 11.5px; font-weight: 600; color: #4a4f63; padding: 5px 6px; }
.df-table tr.diff td { background: #fffaf0; }
.df-note { display: block; color: #9a5b00; font-size: 11.5px; margin-top: 2px; }
.df-rec-f { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
.df-spacer { flex: 1; }
.df-msg.err { background: #fff5f5; color: #b42318; border: 1px solid #f3c3c3; border-radius: 8px; padding: 8px 10px; margin: 6px 0; }
.df-facts { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; margin: 4px 0 10px; }
.df-tag { display: inline-block; font-size: 11.5px; font-weight: 600; border-radius: 10px; padding: 2px 9px; background: #f1f2f6; color: #4a4f63; white-space: nowrap; }
.df-tag.ok { background: #ecfdf3; color: #1f7a4d; }
.df-tag.warn { background: #fff7e6; color: #9a5b00; }
.df-tag.ext { background: #efedff; color: #4338ca; }
.df-table { width: 100%; border-collapse: collapse; margin: 4px 0 10px; }
.df-table th { text-align: left; font-size: 11.5px; color: #4a4f63 !important; background: #f6f7fb !important; font-weight: 600; padding: 6px; border-bottom: 1px solid #eceef5; text-transform: none; }
.df-table td { background: #fff; padding: 7px 6px; border-bottom: 1px solid #f3f4f8; vertical-align: middle; }
.df-table tr.same td { color: #8a8fa3; }
.df-table input { width: 16px; height: 16px; accent-color: #5b4ff5; }
.df-info { background: #fafafd; border: 1px solid #eceef5; border-radius: 8px; padding: 8px 12px; margin: 6px 0; }
.df-info ul, .df-notes { margin: 4px 0 0; padding-left: 18px; }
.df-notes { color: #9a5b00; }
.df footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px; border-top: 1px solid #eceef5; }
.df-btn { height: 34px; border: 1px solid #dfe1ea; background: #fff; border-radius: 8px; padding: 0 14px; font-size: 13px; cursor: pointer; }
.df-btn.primary { background: #5b4ff5; border-color: #5b4ff5; color: #fff; }
.df-btn:disabled { opacity: .5; cursor: default; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
`],
})
export class DocFillDialogComponent implements OnInit {
  r: DocReading | null = null;
  rows: { f: DocField; label: string; show: string; now: string; same: boolean; pick: boolean }[] = [];
  loading = true; error = '';
  // v1.53.2 update the employee record
  recLines: RecLine[] = []; recGroups: string[] = []; recLoading = false; recError = ''; recSaving = false; recSaved = ''; mismatches = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DocFillData, private ref: MatDialogRef<DocFillDialogComponent>,
              private api: AiSettingsApi, private cd: ChangeDetectorRef, private http: HttpClient) {}

  private recUrl(): string {
    return `${environment.apiBaseUrl}/employee-profile/api/doc-record/${this.data.empId}/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
  }

  private async compare(): Promise<void> {
    if (!this.data.empId || !this.r?.record) { return; }
    this.recLoading = true; this.recError = '';
    try {
      const res: any = await firstValueFrom(this.http.post(this.recUrl(), { action: 'preview', record: this.r.record }));
      this.setLines(res);
    } catch (e: any) {
      this.recError = e?.status === 403 ? (e?.error?.detail || 'You may not change this employee\'s record.') : (e?.error?.detail || 'The employee record could not be compared.');
    }
    this.recLoading = false; this.cd.markForCheck();
  }

  private setLines(res: any): void {
    this.recLines = res?.lines || [];
    this.mismatches = res?.mismatches || 0;
    this.recGroups = [...new Set(this.recLines.map(x => x.group))];
  }

  linesOf(g: string): RecLine[] { return this.recLines.filter(x => x.group === g); }

  statusText(x: RecLine): string {
    return x.status === 'same' ? 'Same' : x.status === 'different' ? 'Different' : x.status === 'new' ? 'Not on the record' : 'Not in the list';
  }

  recPicked(): number { return this.recLines.filter(x => x.pick && (x.status === 'new' || x.status === 'different')).length; }

  async saveRecord(): Promise<void> {
    const keys = this.recLines.filter(x => x.pick && (x.status === 'new' || x.status === 'different')).map(x => x.key);
    if (!keys.length) { return; }
    this.recSaving = true; this.recError = '';
    try {
      const res: any = await firstValueFrom(this.http.post(this.recUrl(), {
        action: 'apply', record: this.r!.record, keys, file_name: this.data.file.name, sync: !this.data.inForm,
      }));
      this.recSaved = (res?.saved || []).join(', ');
      this.setLines(res?.preview);
    } catch (e: any) {
      const err = e?.error;
      this.recError = err?.detail || (err && typeof err === 'object' ? Object.values(err).map((v: any) => Array.isArray(v) ? v.join(' ') : String(v)).join(' ') : '')
        || 'The employee record could not be saved.';
    }
    this.recSaving = false; this.cd.markForCheck();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.r = await firstValueFrom(this.api.readDocument(this.data.file));
      const cur: any = this.data.current || {};
      this.rows = this.r.fields.filter(f => !this.data.keys || this.data.keys.includes(f.key)).map(f => {
        const show = f.key === 'document_type' ? (f.note || this.typeName(f.value)) : this.fmt(f.value);
        const nowRaw = cur[f.key];
        const now = f.key === 'document_type' ? this.typeName(nowRaw) : this.fmt(nowRaw);
        const same = nowRaw !== undefined && nowRaw !== null && String(nowRaw) !== '' && String(nowRaw) === String(f.value);
        return { f, label: this.label(f), show, now, same, pick: !same && f.confidence !== 'low' };
      });
      this.loading = false; this.cd.markForCheck();
      await this.compare();
    } catch (e: any) {
      this.error = e?.status === 403 ? 'You do not have permission to read documents here.'
        : e?.status === 429 ? (e?.error?.detail || 'Too many documents read in a short time. Wait a few minutes.')
        : (e?.error?.detail || 'The document could not be read. Fill the fields yourself.');
    }
    this.loading = false; this.cd.markForCheck();
  }

  private label(f: DocField): string {
    return ({ document_type: 'Document type', emp_doc_number: 'Document number', emp_doc_issued_date: 'Issue date', emp_doc_expiry_date: 'Expiry date' } as any)[f.key] || f.label;
  }

  private typeName(id: any): string {
    if (id === undefined || id === null || id === '') { return ''; }
    const t = (this.data.types || []).find(x => String(x.id) === String(id));
    return t ? t.type_name : String(id);
  }

  fmt(v: any): string {
    if (v === undefined || v === null) { return ''; }
    const s = String(v);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
  }

  certainty(f: DocField): string { return f.confidence === 'high' ? 'Verified' : f.confidence === 'medium' ? 'Likely' : 'Check'; }

  source(): string { return SOURCE[this.r?.source || ''] || 'the file'; }

  size(): string { const n = this.data.file.size || 0; return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`; }

  picked(): number { return this.rows.filter(x => x.pick && !x.same).length; }

  apply(): void {
    const out: DocFormValues = {};
    for (const x of this.rows) { if (x.pick && !x.same) { (out as any)[x.f.key] = x.f.value; } }
    if (this.recSaved) { out.record_saved = true; }
    this.ref.close(out);
  }

  close(): void { this.ref.close(this.recSaved ? { record_saved: true } : null); }
}

/** Opens "Fill from document" for a chosen file; resolves with the values the user picked (or null). */
export function openDocFill(dialog: MatDialog, file: File, types: { id: any; type_name: string }[], current: DocFormValues,
                            keys?: (keyof DocFormValues)[], opts: DocFillOptions = {}): Promise<DocFormValues | null> {
  const ref = dialog.open(DocFillDialogComponent, { width: opts.empId ? '760px' : '640px', maxWidth: '96vw', panelClass: 'z-no-record',   // no record footer inside
    data: { file, types, current, keys, ...opts } as DocFillData, autoFocus: false });
  // opened from a side panel that sits above the page (the employee page's panel): the dialog goes above it while open
  const box = opts.above ? document.querySelector('.cdk-overlay-container') as HTMLElement | null : null;
  const prev = box?.style.zIndex || '';
  if (box) { box.style.zIndex = '100010'; ref.afterClosed().subscribe(() => { box.style.zIndex = prev; }); }
  return firstValueFrom(ref.afterClosed()).then(v => v || null);
}
