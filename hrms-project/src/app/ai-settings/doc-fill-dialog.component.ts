import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AiSettingsApi, DocField, DocReading } from './ai-settings.service';

/** Form values the dialog can fill (the names of the employee document form). */
export interface DocFormValues { document_type?: any; emp_doc_number?: any; emp_doc_issued_date?: any; emp_doc_expiry_date?: any; }
export interface DocFillData { file: File; types: { id: any; type_name: string }[]; current: DocFormValues; keys?: string[]; }

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
  imports: [CommonModule, FormsModule],
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
    </ng-container>
  </div>
  <footer>
    <button type="button" class="df-btn" (click)="close()">Cancel</button>
    <button type="button" class="df-btn primary" (click)="apply()" [disabled]="!picked()">Fill the selected fields</button>
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

  constructor(@Inject(MAT_DIALOG_DATA) public data: DocFillData, private ref: MatDialogRef<DocFillDialogComponent>,
              private api: AiSettingsApi, private cd: ChangeDetectorRef) {}

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

  private fmt(v: any): string {
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
    this.ref.close(out);
  }

  close(): void { this.ref.close(null); }
}

/** Opens "Fill from document" for a chosen file; resolves with the values the user picked (or null). */
export function openDocFill(dialog: MatDialog, file: File, types: { id: any; type_name: string }[], current: DocFormValues,
                            keys?: (keyof DocFormValues)[]): Promise<DocFormValues | null> {
  const ref = dialog.open(DocFillDialogComponent, { width: '640px', maxWidth: '96vw', data: { file, types, current, keys } as DocFillData, autoFocus: false });
  return firstValueFrom(ref.afterClosed()).then(v => v || null);
}
