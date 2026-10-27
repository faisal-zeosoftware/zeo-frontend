// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';

/** v1.46.0 Settings › Audit log: every change of every record in the company – who, when, what, from where. */
@Component({
  selector: 'z-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zt za-audit">
    <header class="zt-h"><div><h2>Audit log</h2><p class="zr-muted">Who created, changed or deleted what, on every screen of every app. {{ total | number }} entries match.</p></div>
      <span class="zr-grow"></span><button type="button" class="zr-btn" (click)="csv()"><mat-icon>download</mat-icon>Download CSV</button></header>
    <div class="zi-filters">
      <input class="zr-in zau-q" [(ngModel)]="f.q" (keydown.enter)="load()" placeholder="Record, number or changed value" aria-label="Search">
      <select class="zr-in zi-app" [(ngModel)]="f.model" (change)="load()" aria-label="Record type"><option value="">All record types</option><option *ngFor="let m of models" [value]="m.key">{{ m.label }}</option></select>
      <select class="zr-in zi-app" [(ngModel)]="f.action" (change)="load()" aria-label="Action"><option value="">Created, changed, deleted</option><option value="created">Created</option><option value="updated">Changed</option><option value="deleted">Deleted</option></select>
      <input class="zr-in zau-u" [(ngModel)]="f.user" (keydown.enter)="load()" placeholder="By (user)" aria-label="User">
      <label class="zi-chk">From <input type="date" class="zr-in" [(ngModel)]="f.from" (change)="load()"></label>
      <label class="zi-chk">To <input type="date" class="zr-in" [(ngModel)]="f.to" (change)="load()"></label>
      <button type="button" class="zr-btn primary" (click)="load()">Search</button>
    </div>
    <table class="hs-table zau-t" zPlain>
      <tr><th>When</th><th>Who</th><th>Action</th><th>Record type</th><th>Record</th><th>Changes</th><th>IP</th></tr>
      <tr *ngFor="let r of rows">
        <td class="nw">{{ r.at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ r.user || 'System' }}</td>
        <td><span [class]="'zau-a ' + r.action">{{ r.action === 'updated' ? 'Changed' : r.action === 'created' ? 'Created' : 'Deleted' }}</span></td>
        <td>{{ r.model_label }}</td><td>{{ r.record || ('#' + r.object_id) }}</td>
        <td><div *ngFor="let c of r.changes.slice(0, open[r.id] ? 60 : 4)" class="zau-c"><b>{{ c.label }}</b>{{ r.action === 'updated' ? ': ' : ' ' }}<span class="zr-old" *ngIf="r.action === 'updated'">{{ show(c.old) }}</span>{{ r.action === 'updated' ? ' → ' : '' }}<span>{{ show(c.new) }}</span></div>
          <button type="button" class="zr-link" *ngIf="r.changes.length > 4" (click)="open[r.id] = !open[r.id]">{{ open[r.id] ? 'less' : '+' + (r.changes.length - 4) + ' more' }}</button></td>
        <td class="nw zr-muted">{{ r.ip }}</td>
      </tr>
    </table>
    <p class="zr-muted" *ngIf="!loading && !rows.length">No changes match.</p>
    <div class="zr-row" *ngIf="rows.length < total"><button type="button" class="zr-btn" (click)="more()">Show more ({{ rows.length }} of {{ total }})</button></div>
    <div class="zr-err" *ngIf="error">{{ error }}</div>
  </div>`,
})
export class ZAuditComponent implements OnInit {
  f: any = { q: '', model: '', action: '', user: '', from: '', to: '' };
  rows: any[] = []; models: any[] = []; total = 0; loading = false; error = ''; open: Record<number, boolean> = {};
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  private params(extra: any = {}): any { return { schema: localStorage.getItem('selectedSchema') || '', ...Object.fromEntries(Object.entries(this.f).filter(([, v]) => v)), ...extra }; }
  async load(more = false): Promise<void> {
    this.loading = true; this.error = '';
    try {
      const r: any = await firstValueFrom(this.http.get(`${this.rec.api}/chatter/api/audit/`, { params: this.params({ offset: more ? this.rows.length : 0, limit: 200 }) }));
      this.rows = more ? this.rows.concat(r.rows) : r.rows; this.total = r.total; if (r.models?.length) { this.models = r.models; }
    } catch (e: any) { this.error = e?.error?.detail || 'The audit log could not be loaded.'; }
    this.loading = false; this.cd.detectChanges();
  }
  more(): void { this.load(true); }
  show(v: any): string { return v === null || v === undefined || v === '' ? '–' : typeof v === 'object' ? JSON.stringify(v) : String(v); }
  async csv(): Promise<void> {
    const q = new URLSearchParams(this.params({ export: 'csv', limit: 5000 })).toString();
    const res = await fetch(`${this.rec.api}/chatter/api/audit/?${q}`, { headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') } });
    if (!res.ok) { this.error = 'The file could not be made.'; this.cd.detectChanges(); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(await res.blob()); a.download = 'audit-log.csv'; a.click();
  }
}
