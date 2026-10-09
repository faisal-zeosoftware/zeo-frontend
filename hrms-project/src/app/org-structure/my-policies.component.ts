import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OrgSettingsService } from './org-settings.service';

/**
 * v1.12.0 – My policies (ESS): the company policies that apply to me; open the document and confirm I have read it.
 * API: GET org-structure/api/my-policies/ · GET my-policies/<id>/file/ · POST my-policies/<id>/acknowledge/
 */
@Component({
  selector: 'app-my-policies',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['../leave-policy/leave-policy.css', './org-structure.css'],
  template: `
<div class="container os-wrap" [class.os-own]="ownPage">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">My policies</h1>
          <p class="lp-desc">Company policies that apply to you. Open each one, read it, then press “I have read and accept” to confirm.</p>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <p class="lp-muted" *ngIf="!loading && !rows.length">There are no company policies for you at the moment.</p>
      <div class="os-grid">
        <div class="os-card" *ngFor="let p of rows" [class.on]="!p.acknowledged && p.requires_ack">
          <h3>{{ p.title }} <span class="os-tag" style="margin-left:auto" [ngClass]="p.acknowledged ? 'ok' : p.requires_ack ? 'warn' : ''">{{ p.status }}</span></h3>
          <p *ngIf="p.description">{{ p.description }}</p>
          <p>Version {{ p.version }} · {{ p.version_date | date:'dd/MM/yyyy' }}
            <ng-container *ngIf="!p.acknowledged && p.requires_ack && p.due_date"> · please confirm by {{ p.due_date | date:'dd/MM/yyyy' }}</ng-container>
            <ng-container *ngIf="p.acknowledged"> · confirmed {{ p.acknowledged_at | date:'dd/MM/yyyy HH:mm' }}</ng-container></p>
          <div class="row2">
            <button type="button" class="lp-btn" *ngIf="p.has_file" (click)="openFile(p)">Open document</button>
            <button type="button" class="lp-btn primary" *ngIf="!p.acknowledged && p.requires_ack" [disabled]="busy" (click)="ack(p)">I have read and accept</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class MyPoliciesComponent implements OnInit {
  rows: any[] = []; loading = false; busy = false; msg = ''; err = false;

  ownPage = false;   // v1.12.0: opened from the main menu (no sub-menu) – needs its own space under the top bar

  constructor(private http: HttpClient, private org: OrgSettingsService, private cd: ChangeDetectorRef, private route: ActivatedRoute) {
    this.ownPage = !!this.route.snapshot?.data?.['ownPage'];
  }
  private url(p: string): string { return `${this.org.api}${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true; this.cd.markForCheck();
    try { this.rows = await firstValueFrom(this.http.get<any[]>(this.url('my-policies/'))); }
    catch { this.rows = []; this.msg = 'Your policies could not be loaded.'; this.err = true; }
    this.loading = false; this.cd.markForCheck();
  }

  async openFile(p: any): Promise<void> {
    try {
      const blob = await firstValueFrom(this.http.get(this.url(`my-policies/${p.id}/file/`), { responseType: 'blob' }));
      const u = URL.createObjectURL(blob);
      window.open(u, '_blank');
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    } catch { this.msg = 'The document could not be opened. Ask HR for a copy.'; this.err = true; this.cd.markForCheck(); }
  }

  async ack(p: any): Promise<void> {
    if (!confirm(`Confirm that you have read and accept “${p.title}”?`)) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.post(this.url(`my-policies/${p.id}/acknowledge/`), {}));
      this.msg = `Thank you – “${p.title}” is confirmed.`; this.err = false; await this.load();
    } catch (e: any) { this.msg = e?.error?.detail || 'It could not be confirmed. Try again.'; this.err = true; }
    this.busy = false; this.cd.markForCheck();
  }
}
