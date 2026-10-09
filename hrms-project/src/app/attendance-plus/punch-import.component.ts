import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ApApi } from './ap-api';

/** Bulk import of punches (v1.12.0): check the file first (preview with the problem of every row), then import the valid rows. */
@Component({
  selector: 'app-punch-import',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./attendance-plus.css'],
  template: `
<div class="ap-wrap">
  <div class="ap-head">
    <div><h1>Import Punches</h1>
      <p class="ap-desc">CSV or Excel with the columns <b>employee_code, date, time, type</b> (date YYYY-MM-DD, time HH:MM, type in / out / break out / break in /
        lunch out / lunch in or empty for automatic). Check the file first; nothing is saved until you press Import. Punches already in the system are skipped.</p></div>
    <div class="ap-tools"><button type="button" class="ap-btn" (click)="template()">Download template</button></div>
  </div>
  <p class="ap-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="ap-card">
    <div class="ap-tools">
      <input type="file" accept=".csv,.xlsx" (change)="pick($event)">
      <button type="button" class="ap-btn" (click)="send(false)" [disabled]="!file || busy">Check file</button>
      <button type="button" class="ap-btn primary" (click)="send(true)" [disabled]="!file || busy || !res || !res.totals.ok">Import {{ res?.totals?.ok || '' }} valid rows</button>
    </div>
  </div>
  <div class="ap-card" *ngIf="res">
    <div class="ap-tiles">
      <div class="ap-tile"><div class="k">Ready</div><div class="v">{{ res.totals.ok }}</div></div>
      <div class="ap-tile"><div class="k">Imported</div><div class="v">{{ res.totals.imported }}</div></div>
      <div class="ap-tile"><div class="k">Already there</div><div class="v">{{ res.totals.duplicate }}</div></div>
      <div class="ap-tile"><div class="k">With problems</div><div class="v">{{ res.totals.error }}</div></div>
    </div>
    <div class="ap-scroll">
      <table class="ap-table"><tr><th>Row</th><th>Employee</th><th>Date</th><th>Time</th><th>Type</th><th>Result</th></tr>
        <tr *ngFor="let r of res.rows"><td>{{ r.row }}</td><td>{{ r.employee_code }}</td><td>{{ r.date }}</td><td>{{ r.time }}</td><td>{{ r.type || 'auto' }}</td>
          <td><span class="ap-tag" [ngClass]="tag(r.status)">{{ r.status }}</span>
            <span class="ap-muted"> {{ r.errors.join(' ') }}</span></td></tr></table>
    </div>
  </div>
</div>`,
})
export class PunchImportComponent {
  api: ApApi;
  file: File | null = null;
  res: any = null;
  msg = '';
  err = false;
  busy = false;

  constructor(http: HttpClient, rec: ZRecordService, private cdr: ChangeDetectorRef) { this.api = new ApApi(http, rec); }

  tag(s: string): string { return ({ ok: 'blue', imported: 'green', duplicate: 'grey', error: 'red' } as Record<string, string>)[s] || 'grey'; }

  pick(ev: Event): void { this.file = (ev.target as HTMLInputElement).files?.[0] || null; this.res = null; this.msg = ''; }

  template(): void {
    const blob = new Blob(['employee_code,date,time,type\nEMP1001,2026-10-01,09:00,in\nEMP1001,2026-10-01,18:00,out\n'], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'punch-import-template.csv'; a.click();
  }

  async send(commit: boolean): Promise<void> {
    if (!this.file) return;
    const fd = new FormData(); fd.append('file', this.file); if (commit) fd.append('commit', '1');
    this.busy = true; this.msg = '';
    try {
      this.res = await this.api.post('punches/import/', fd);
      this.err = false;
      this.msg = commit ? `${this.res.totals.imported} punches imported and the days recalculated.` : 'File checked – review the rows below, then import.';
    } catch (e) { this.err = true; this.msg = ApApi.err(e, 'The file could not be read.'); }
    this.busy = false; this.cdr.markForCheck();
  }
}
