import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ESS_BASE, EssApiService } from './ess-api.service';

/**
 * v1.13.0 – profile change requests.
 *  route data { hr: false } → "My change requests" (history, withdraw a pending one);
 *  route data { hr: true }  → HR queue of the user's branches (approve / reject with a reason, attachments).
 */
@Component({
  selector: 'app-ess-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">{{ hr ? 'Profile changes to review' : 'My change requests' }}</h1>
          <p class="es-desc" *ngIf="!hr">Changes to your profile that need HR approval. You get a notification when HR decides.</p>
          <p class="es-desc" *ngIf="hr">Employees of your branches ask to change their details. Check the attachment, then approve (the change is saved at once) or reject with the reason.</p>
        </div>
        <div class="es-actions">
          <button type="button" class="es-btn" *ngIf="!hr" (click)="router.navigate([base + '/profile'])">Back to my profile</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="es-tabs">
        <button type="button" class="es-tab" *ngFor="let t of tabs" [class.on]="tab === t.key" (click)="tab = t.key; load()">{{ t.label }}</button>
      </div>
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <p class="es-muted" *ngIf="loading">Loading…</p>
      <div class="es-cols">
        <div class="es-rows">
          <div class="es-row click" *ngFor="let r of rows" [class.on]="sel?.id === r.id" (click)="sel = r">
            <div class="main">
              <div class="t">{{ r.number }} · {{ r.action_label }} {{ r.group_label | lowercase }}</div>
              <div class="s"><span *ngIf="hr">{{ r.employee }} · </span>{{ r.created_at | date:'dd MMM yyyy, HH:mm' }}<span *ngIf="r.reason"> · {{ r.reason }}</span></div>
            </div>
            <div class="r"><span class="es-tag" [ngClass]="r.status">{{ r.status_label }}</span></div>
          </div>
          <p class="es-muted" *ngIf="!loading && !rows.length">{{ hr ? 'Nothing waits for you.' : 'You have not asked for any change yet. Use "Request a change" in My profile.' }}</p>
        </div>
        <div *ngIf="sel" class="es-panel">
          <div class="es-h">{{ sel.number }} <span class="es-tag" [ngClass]="sel.status">{{ sel.status_label }}</span></div>
          <p class="es-muted" style="margin:0 0 8px"><span *ngIf="hr">{{ sel.employee }} · </span>{{ sel.action_label }} {{ sel.group_label | lowercase }}<span *ngIf="sel.record_id"> (record {{ sel.record_id }})</span></p>
          <div class="es-diff" *ngIf="sel.new_values.length">
            <div class="hd">Field</div><div class="hd">Now</div><div class="hd">Requested</div>
            <ng-container *ngFor="let n of sel.new_values">
              <div>{{ n.label }}</div><div class="old">{{ oldOf(n.key) }}</div><div class="new">{{ fmt(n.value) }}</div>
            </ng-container>
          </div>
          <p class="es-muted" *ngIf="sel.action === 'delete'">The employee asks to remove this record.</p>
          <p *ngIf="sel.reason" style="font-size:13px;margin-top:10px"><b>Reason:</b> {{ sel.reason }}</p>
          <div *ngIf="sel.attachments.length" style="margin-top:8px">
            <div class="es-label">Attachments</div>
            <button type="button" class="es-link" *ngFor="let a of sel.attachments" (click)="file(a)" style="margin-right:10px">{{ a.name }}</button>
          </div>
          <p *ngIf="sel.decided_by" class="es-muted" style="margin-top:10px">Decided by {{ sel.decided_by }} on {{ sel.decided_at | date:'dd MMM yyyy' }}<span *ngIf="sel.decision_note"> – {{ sel.decision_note }}</span></p>
          <div *ngIf="hr && sel.status === 'pending'" style="margin-top:12px">
            <label class="es-label">Note to the employee (required to reject)</label>
            <textarea class="es-input" [(ngModel)]="note" rows="2" placeholder="e.g. Please attach the new passport copy"></textarea>
            <div class="es-actions" style="margin-top:8px">
              <button type="button" class="es-btn primary" [disabled]="busy" (click)="act('approve')">Approve and save</button>
              <button type="button" class="es-btn danger" [disabled]="busy" (click)="act('reject')">Reject</button>
            </div>
          </div>
          <div class="es-actions" style="margin-top:12px" *ngIf="!hr && sel.status === 'pending'">
            <button type="button" class="es-btn danger" [disabled]="busy" (click)="act('withdraw')">Withdraw request</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class EssRequestsComponent implements OnInit {
  hr = false; rows: any[] = []; sel: any = null; loading = false; busy = false; msg = ''; ok = ''; note = '';
  tab = 'pending'; base = ESS_BASE;
  tabs = [{ key: 'pending', label: 'Waiting' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: '', label: 'All' }];

  constructor(private api: EssApiService, public router: Router, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.hr = !!this.route.snapshot.data['hr'];
    if (!this.hr) this.tab = '';
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const all: any[] = this.hr ? await this.api.get('change-requests/', { status: this.tab }) : await this.api.get('change-requests/mine/');
      this.rows = this.hr || !this.tab ? all : all.filter(r => r.status === this.tab);
      this.sel = this.sel ? this.rows.find(r => r.id === this.sel.id) || null : null;
      this.msg = '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'Could not load the requests.'); }
    this.loading = false; this.cd.detectChanges();
  }

  oldOf(key: string): string {
    const o = (this.sel?.old_values || []).find((x: any) => x.key === key);
    return o ? this.fmt(o.value) : '—';
  }
  fmt(v: any): string { return v === null || v === undefined || v === '' ? '—' : v === true ? 'Yes' : v === false ? 'No' : String(v); }

  async act(a: 'approve' | 'reject' | 'withdraw'): Promise<void> {
    if (!this.sel) return;
    if (a === 'reject' && !this.note.trim()) { this.msg = 'Write the reason for rejecting, so the employee knows what to fix.'; return; }
    this.busy = true;
    try {
      const r: any = await this.api.post(`change-requests/${this.sel.id}/${a}/`, { note: this.note });
      this.ok = a === 'approve' ? `${r.number} approved – the change is saved.` : a === 'reject' ? `${r.number} rejected.` : `${r.number} withdrawn.`;
      this.msg = ''; this.note = ''; this.sel = r;
      await this.load();
    } catch (e: any) { this.msg = EssApiService.error(e); }
    this.busy = false; this.cd.detectChanges();
  }

  async file(a: any): Promise<void> {
    try { await this.api.download(`change-requests/${this.sel.id}/attachments/${a.id}/`, a.name, true); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The attachment could not be opened.'); this.cd.detectChanges(); }
  }
}
