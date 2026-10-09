import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EssApiService } from './ess-api.service';

/**
 * v1.13.0 – claims and requests in one list: general requests, advance salary, loans, air tickets, documents,
 * resignation … (all modules, from the dashboard "my requests" feed) plus a form for a general request.
 * Receipt-based claims go to Expenses. General request amounts are whole dirhams (the amount column has no fils).
 */
@Component({
  selector: 'app-ess-claims',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">Claims and requests</h1>
          <p class="es-desc">Follow everything you asked for. Claims with receipts (taxi, meals, travel) go through Expenses; other claims are general requests.</p>
        </div>
        <div class="es-actions">
          <button type="button" class="es-btn primary" (click)="openNew()">New general request</button>
          <button type="button" class="es-btn" (click)="router.navigate(['/main-sidebar/expense-options/expenses'], { queryParams: { new: 1 } })">New expense with receipt</button>
          <button type="button" class="es-btn" (click)="router.navigate(['/employee-dashboard'])">Advance, loan or air ticket</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <div class="es-tabs">
        <button type="button" class="es-tab" [class.on]="!module" (click)="module = ''">All</button>
        <button type="button" class="es-tab" *ngFor="let m of modules()" [class.on]="module === m.key" (click)="module = m.key">{{ m.label }}</button>
      </div>
      <div class="es-rows">
        <div class="es-row" *ngFor="let r of filtered()">
          <div class="main"><div class="t">{{ r.module_label }} · {{ r.document_number || ('#' + r.id) }}</div><div class="s">{{ r.summary }} · {{ r.date | date:'dd MMM yyyy' }}</div></div>
          <div class="r"><span class="es-tag" [ngClass]="r.status_key">{{ r.status }}</span></div>
        </div>
        <p class="es-muted" *ngIf="!loading && !rows.length">You have no requests yet.</p>
      </div>
    </div>
  </div>
</div>

<div class="es-backdrop" *ngIf="f" (click)="f = null">
  <div class="es-modal" (click)="$event.stopPropagation()">
    <h3>New general request</h3>
    <p class="es-muted">Amounts are in whole dirhams (AED) – round to the nearest dirham. For receipts with fils use Expenses.</p>
    <p class="es-msg err" *ngIf="ferr">{{ ferr }}</p>
    <div class="es-form">
      <div class="wide"><label>Type</label><select [(ngModel)]="f.request_type"><option [ngValue]="null">Choose…</option><option *ngFor="let t of types" [ngValue]="t.id">{{ t.name }}</option></select></div>
      <div><label>Amount (AED, whole dirhams)</label><input type="number" step="1" min="0" [(ngModel)]="f.total"></div>
      <div class="wide"><label>Reason</label><textarea [(ngModel)]="f.reason" maxlength="200"></textarea></div>
      <div class="wide"><label>Supporting document (optional)</label><input type="file" (change)="file = $any($event.target).files?.[0] || null"></div>
    </div>
    <div class="foot">
      <button type="button" class="es-btn" (click)="f = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="busy" (click)="save()">Send for approval</button>
    </div>
  </div>
</div>`,
})
export class EssClaimsComponent implements OnInit {
  rows: any[] = []; types: any[] = []; module = ''; loading = false; busy = false; msg = ''; ok = ''; ferr = '';
  f: any = null; file: File | null = null; empId: number | null = null; branchId: number | null = null;

  constructor(private api: EssApiService, public router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      const p: any = await this.api.get('profile/');
      this.empId = p.employee_id;
      this.branchId = (p.groups.find((g: any) => g.key === 'org')?.fields || []).find((x: any) => x.key === 'emp_branch_id')?.value ?? null;
    } catch { /* shown by load */ }
    await this.load();
  }

  modules(): { key: string; label: string }[] {
    const seen = new Map<string, string>();
    this.rows.forEach(r => seen.set(r.module, r.module_label));
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }
  filtered(): any[] { return this.module ? this.rows.filter(r => r.module === this.module) : this.rows; }

  async load(): Promise<void> {
    this.loading = true;
    try { const r: any = await this.api.get('/dashboard/api/drill/', { metric: 'my_requests' }); this.rows = r.rows || []; this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load your requests.'); }
    this.loading = false; this.cd.detectChanges();
  }

  async openNew(): Promise<void> {
    this.ferr = ''; this.file = null; this.f = { request_type: null, total: null, reason: '' };
    if (!this.types.length) {
      try { const r: any = await this.api.get('/employee/api/request-type/'); this.types = Array.isArray(r) ? r : r.results || []; } catch { this.types = []; }
    }
    this.cd.detectChanges();
  }

  async save(): Promise<void> {
    const f = this.f;
    if (!f.request_type) { this.ferr = 'Choose the type of request.'; return; }
    if (!String(f.reason || '').trim()) { this.ferr = 'Write the reason.'; return; }
    if (f.total !== null && f.total !== '' && !Number.isInteger(Number(f.total))) { this.ferr = 'Enter the amount in whole dirhams, e.g. 125 instead of 125.50.'; return; }
    const fd = new FormData();
    fd.append('employee', String(this.empId)); fd.append('request_type', String(f.request_type)); fd.append('reason', f.reason);
    if (this.branchId) fd.append('branch', String(this.branchId));
    if (f.total !== null && f.total !== '') fd.append('total', String(f.total));
    if (this.file) fd.append('request_document', this.file, this.file.name);
    this.busy = true; this.ferr = '';
    try { await this.api.post('/employee/api/general-request/', fd); this.ok = 'Your request was sent for approval.'; this.f = null; await this.load(); }
    catch (e: any) { this.ferr = EssApiService.error(e, 'The request could not be sent.'); }
    this.busy = false; this.cd.detectChanges();
  }
}
