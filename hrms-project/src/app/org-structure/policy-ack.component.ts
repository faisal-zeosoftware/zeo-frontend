import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { OrgSettingsService } from './org-settings.service';

/**
 * v1.12.0 – Policy acknowledgements (HR): every company policy with how many of the employees it applies to have
 * acknowledged the current version; who has and hasn't; reminders; whether acknowledgement is needed and in how many days.
 * A new file or a change to the policy starts a new version that everyone acknowledges again.
 * API: GET org-structure/api/policies/ · GET/PUT policies/<id>/ · POST policies/<id>/remind/
 */
@Component({
  selector: 'app-policy-ack',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../leave-policy/leave-policy.css', '../hr-actions/hr-actions.css', './org-structure.css'],
  template: `
<div class="container os-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Policy acknowledgements</h1>
          <p class="lp-desc">Who has read and confirmed each company policy. Policies are added on the Company policy screen; employees confirm them under My policies. Uploading a new file starts a new version that must be confirmed again.</p>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <p class="lp-muted" *ngIf="!loading && !rows.length">No company policies yet – add them on the Company policy screen.</p>
      <table class="table" *ngIf="!loading && rows.length">
        <thead><tr><th>Policy</th><th>Version</th><th>Applies to</th><th>Acknowledged</th><th>Pending</th><th>Progress</th><th>Acknowledgement</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td data-label="Policy"><b>{{ r.title }}</b><br><small class="lp-muted">{{ r.description }}</small></td>
            <td data-label="Version">v{{ r.version }}<br><small class="lp-muted">{{ r.version_date | date:'dd/MM/yyyy' }}</small></td>
            <td data-label="Applies to">{{ r.applies_to }}</td>
            <td data-label="Acknowledged">{{ r.acknowledged }}</td>
            <td data-label="Pending">{{ r.pending }}</td>
            <td data-label="Progress"><div class="os-bar" [attr.aria-label]="r.percent + '% acknowledged'"><i [style.width.%]="r.percent"></i></div><small>{{ r.percent }}%</small></td>
            <td data-label="Acknowledgement"><span class="os-tag" [ngClass]="r.requires_ack ? 'blue' : ''">{{ r.requires_ack ? 'Required within ' + r.due_days + ' days' : 'Not required' }}</span></td>
            <td data-label="Actions"><div class="ha-row-actions">
              <button type="button" class="lp-btn" (click)="open(r)">Who</button>
              <button type="button" class="lp-btn primary" [disabled]="busy || !r.pending || !r.requires_ack" (click)="remind(r)">Remind pending</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div class="lp-modal-back" *ngIf="det" (click)="det = null">
  <div class="lp-modal" (click)="$event.stopPropagation()" role="dialog" aria-label="Who has acknowledged">
    <header><h2>{{ det.title }} · v{{ det.version }}</h2><button type="button" class="lp-x" (click)="det = null" aria-label="Close" style="color:#6b7185">×</button></header>
    <div class="body">
      <div class="lp-form" style="margin-top:0">
        <label>Acknowledgement<select [(ngModel)]="det.requires_ack"><option [ngValue]="true">Required</option><option [ngValue]="false">Not required (for information)</option></select></label>
        <label>Days to acknowledge<input type="number" min="0" max="365" [(ngModel)]="det.due_days"></label>
        <label>Show<select [(ngModel)]="show"><option value="">Everyone</option><option value="Pending">Not yet acknowledged</option><option value="Acknowledged">Acknowledged</option></select></label>
      </div>
      <p><span class="os-tag ok">{{ det.acknowledged }} acknowledged</span> <span class="os-tag warn">{{ det.pending }} pending</span></p>
      <div class="lp-scroll"><table class="lp-mini" zPlain>
        <thead><tr><th>Employee</th><th>Branch</th><th>Department</th><th>Status</th><th>When</th><th>IP address</th></tr></thead>
        <tbody><tr *ngFor="let x of shown()">
          <td>{{ x.employee }}</td><td>{{ x.branch }}</td><td>{{ x.department }}</td>
          <td><span class="os-tag" [ngClass]="x.status === 'Acknowledged' ? 'ok' : 'warn'">{{ x.status }}</span></td>
          <td>{{ x.acknowledged_at ? (x.acknowledged_at | date:'dd/MM/yyyy HH:mm') : '–' }}</td><td>{{ x.ip || '–' }}</td></tr></tbody>
      </table></div>
    </div>
    <footer>
      <button type="button" class="lp-btn" (click)="newVersion()" [disabled]="busy" title="Everyone must acknowledge again">Ask everyone again</button>
      <button type="button" class="lp-btn" (click)="det = null">Close</button>
      <button type="button" class="lp-btn primary" (click)="saveDet()" [disabled]="busy">Save</button>
    </footer>
  </div>
</div>`,
})
export class PolicyAckComponent implements OnInit {
  rows: any[] = []; det: any = null; show = ''; loading = false; busy = false; msg = ''; err = false;

  constructor(private http: HttpClient, private org: OrgSettingsService, private cd: ChangeDetectorRef) {}
  private url(p: string): string { return `${this.org.api}${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  private say(m: string, bad = false): void { this.msg = m; this.err = bad; this.cd.markForCheck(); }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true; this.cd.markForCheck();
    try { this.rows = await firstValueFrom(this.http.get<any[]>(this.url('policies/'))); }
    catch (e: any) { this.rows = []; this.say(e?.error?.detail || 'The policies could not be loaded.', true); }
    this.loading = false; this.cd.markForCheck();
  }

  async open(r: any): Promise<void> {
    try { this.det = await firstValueFrom(this.http.get<any>(this.url(`policies/${r.id}/`))); this.show = ''; }
    catch (e: any) { this.say(e?.error?.detail || 'The list could not be loaded.', true); }
    this.cd.markForCheck();
  }

  shown(): any[] { return (this.det?.rows || []).filter((x: any) => !this.show || (this.show === 'Acknowledged' ? x.status === 'Acknowledged' : x.status !== 'Acknowledged')); }

  async saveDet(extra: any = {}): Promise<void> {
    this.busy = true;
    try {
      this.det = await firstValueFrom(this.http.put<any>(this.url(`policies/${this.det.id}/`), { requires_ack: this.det.requires_ack, due_days: this.det.due_days, ...extra }));
      this.say('Saved.'); await this.load();
    } catch (e: any) { this.say(e?.error?.detail || Object.values(e?.error || {}).join(' ') || 'It could not be saved.', true); }
    this.busy = false; this.cd.markForCheck();
  }

  newVersion(): void {
    if (confirm('Start a new version? Everyone the policy applies to must acknowledge it again.')) { this.saveDet({ new_version: true }); }
  }

  async remind(r: any): Promise<void> {
    if (!confirm(`Send a reminder to the ${r.pending} employee(s) who have not acknowledged “${r.title}”?`)) { return; }
    this.busy = true;
    try { const d = await firstValueFrom(this.http.post<any>(this.url(`policies/${r.id}/remind/`), {})); this.say(`Reminder sent to ${d.notified} employee(s).`); await this.load(); }
    catch (e: any) { this.say(e?.error?.detail || 'The reminder could not be sent.', true); }
    this.busy = false; this.cd.markForCheck();
  }
}
