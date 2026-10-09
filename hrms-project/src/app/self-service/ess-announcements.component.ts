import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EssApiService } from './ess-api.service';

/** v1.13.0 – announcements for me (branch / department / designation / category / company-wide), mark as read; HR sees read counts. */
@Component({
  selector: 'app-ess-announcements',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">Announcements</h1>
          <p class="es-desc">News for you, your branch, department and the whole company. Mark an announcement as read so HR knows it reached you.</p>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="es-tabs">
        <button type="button" class="es-tab" [class.on]="tab === 'mine'" (click)="tab = 'mine'">For me <span *ngIf="unread()">({{ unread() }} unread)</span></button>
        <button type="button" class="es-tab" *ngIf="hr" [class.on]="tab === 'stats'" (click)="tab = 'stats'; loadStats()">Who read what (HR)</button>
      </div>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <p class="es-muted" *ngIf="loading">Loading…</p>

      <ng-container *ngIf="tab === 'mine'">
        <div class="es-panel" *ngFor="let a of rows" [style.border-left]="a.read ? '' : '4px solid #0f766e'">
          <div class="es-h">
            <span>{{ a.title }} <span class="es-tag" *ngIf="a.is_sticky">pinned</span> <span class="es-tag pending" *ngIf="!a.read">new</span></span>
            <span class="es-muted">{{ (a.schedule_at || a.created_at) | date:'dd MMM yyyy' }}</span>
          </div>
          <p style="white-space:pre-line;font-size:13.5px;margin:0">{{ a.message }}</p>
          <div class="es-actions" style="margin-top:10px">
            <button type="button" class="es-btn sm" *ngIf="a.has_attachment" (click)="file(a)">Open attachment</button>
            <button type="button" class="es-btn sm primary" *ngIf="!a.read" (click)="read(a)">Mark as read</button>
            <span class="es-muted" *ngIf="a.read">Read {{ a.read_at | date:'dd MMM, HH:mm' }}</span>
            <span class="es-muted" *ngIf="a.expires_at">· until {{ a.expires_at | date:'dd MMM yyyy' }}</span>
          </div>
        </div>
        <p class="es-muted" *ngIf="!loading && !rows.length">There are no announcements for you right now.</p>
      </ng-container>

      <ng-container *ngIf="tab === 'stats'">
        <div class="es-rows">
          <div class="es-row click" *ngFor="let s of stats" (click)="openStats(s)">
            <div class="main"><div class="t">{{ s.title }}</div><div class="s">{{ s.created_at | date:'dd MMM yyyy' }}<span *ngIf="s.expires_at"> · until {{ s.expires_at | date:'dd MMM' }}</span></div></div>
            <div class="r"><b>{{ s.read }}</b> / {{ s.audience }} read</div>
          </div>
        </div>
        <div class="es-panel" *ngIf="detail" style="margin-top:14px">
          <div class="es-h">{{ detail.title }} – {{ detail.read }} of {{ detail.audience }} read</div>
          <div class="es-rows">
            <div class="es-row" *ngFor="let r of detail.readers"><div class="main"><div class="t">{{ r.employee }}</div></div><div class="r es-muted">{{ r.read_at | date:'dd MMM, HH:mm' }}</div></div>
            <p class="es-muted" *ngIf="!detail.readers.length">Nobody has read it yet.</p>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class EssAnnouncementsComponent implements OnInit {
  rows: any[] = []; stats: any[] = []; detail: any = null; hr = false; tab = 'mine'; loading = false; msg = '';

  constructor(private api: EssApiService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try { this.hr = !!(await this.api.meta()).rights?.announcements; } catch { this.hr = false; }
    await this.load();
  }

  unread(): number { return this.rows.filter(a => !a.read).length; }

  async load(): Promise<void> {
    this.loading = true;
    try { this.rows = await this.api.get('announcements/'); this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load the announcements.'); }
    this.loading = false; this.cd.detectChanges();
  }

  async read(a: any): Promise<void> {
    try { const r: any = await this.api.post(`announcements/${a.id}/read/`, {}); a.read = true; a.read_at = r.read_at; }
    catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }

  async file(a: any): Promise<void> {
    try { await this.api.download(`announcements/${a.id}/attachment/`, a.title, true); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The attachment could not be opened.'); this.cd.detectChanges(); }
  }

  async loadStats(): Promise<void> {
    try { this.stats = await this.api.get('announcements/stats/'); this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }

  async openStats(s: any): Promise<void> {
    try { this.detail = await this.api.get(`announcements/${s.id}/stats/`); }
    catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }
}
