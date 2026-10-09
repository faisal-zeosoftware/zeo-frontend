import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ESS_BASE, EssApiService } from './ess-api.service';

/**
 * v1.13.0 – HR letters.
 *  employee (route data hr=false): request a letter, follow it, download the PDF ("My letters");
 *  HR (hr=true): approve → PDF is generated, reject with a reason, issue a letter directly, verify a code.
 */
@Component({
  selector: 'app-ess-letters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">{{ hr ? 'HR letters to issue' : 'My letters' }}</h1>
          <p class="es-desc" *ngIf="!hr">Ask HR for a salary certificate, NOC, embassy letter and more. When HR approves, the signed PDF appears here.</p>
          <p class="es-desc" *ngIf="hr">Approve a request to create the PDF with its reference number and verification code, or issue a letter directly.</p>
        </div>
        <div class="es-actions">
          <button type="button" class="es-btn primary" *ngIf="!hr" (click)="openNew()">Request a letter</button>
          <button type="button" class="es-btn primary" *ngIf="hr" (click)="openNew()">Issue a letter</button>
          <button type="button" class="es-btn" *ngIf="hr" (click)="router.navigate([base + '/settings'], { queryParams: { tab: 'templates' } })">Letter templates</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <div class="es-tabs" *ngIf="hr">
        <button type="button" class="es-tab" *ngFor="let t of tabs" [class.on]="tab === t.key" (click)="tab = t.key; load()">{{ t.label }}</button>
      </div>
      <div class="es-rows">
        <div class="es-row" *ngFor="let l of rows">
          <div class="main">
            <div class="t">{{ l.letter_label }} <span class="es-muted" *ngIf="l.language === 'ar'">(Arabic)</span></div>
            <div class="s"><span *ngIf="hr">{{ l.employee }} · </span>{{ l.number || l.reference_no }} · {{ l.created_at | date:'dd MMM yyyy' }}<span *ngIf="l.addressee"> · To: {{ l.addressee }}</span><span *ngIf="l.purpose"> · {{ l.purpose }}</span></div>
            <div class="s" *ngIf="l.status === 'issued'">Reference {{ l.reference_no }} · verification code {{ l.verification_code }}</div>
            <div class="s" *ngIf="l.decision_note">HR: {{ l.decision_note }}</div>
          </div>
          <div class="r">
            <span class="es-tag" [ngClass]="l.status">{{ l.status_label }}</span>
            <button type="button" class="es-btn sm" *ngIf="l.status === 'issued'" (click)="pdf(l)">Download PDF</button>
            <button type="button" class="es-btn sm danger" *ngIf="!hr && l.status === 'pending'" (click)="act(l, 'withdraw')">Withdraw</button>
            <ng-container *ngIf="hr && l.status === 'pending'">
              <button type="button" class="es-btn sm primary" [disabled]="busy" (click)="act(l, 'approve')">Approve and create PDF</button>
              <button type="button" class="es-btn sm danger" [disabled]="busy" (click)="reject(l)">Reject</button>
            </ng-container>
          </div>
        </div>
        <p class="es-muted" *ngIf="!loading && !rows.length">{{ hr ? 'No letters here.' : 'You have not requested a letter yet.' }}</p>
      </div>

      <div class="es-panel" style="margin-top:18px" *ngIf="hr">
        <div class="es-h">Verify a letter</div>
        <div class="es-form">
          <div><label>Verification code</label><input [(ngModel)]="code" placeholder="10 letters / digits from the letter footer"></div>
          <div style="align-self:end"><button type="button" class="es-btn" (click)="verify()">Check</button></div>
        </div>
        <p class="es-msg" style="margin-top:10px" *ngIf="verified?.valid">Valid: {{ verified.letter }} for {{ verified.employee }}, reference {{ verified.reference_no }}, issued {{ verified.issued_at | date:'dd MMM yyyy' }}.</p>
        <p class="es-msg err" style="margin-top:10px" *ngIf="verified && !verified.valid">{{ verified.detail }}</p>
      </div>
    </div>
  </div>
</div>

<div class="es-backdrop" *ngIf="f" (click)="f = null">
  <div class="es-modal" (click)="$event.stopPropagation()">
    <h3>{{ hr ? 'Issue a letter' : 'Request a letter' }}</h3>
    <p class="es-muted">{{ hr ? 'The PDF is created at once and the employee is notified.' : 'HR reviews the request. Your name, job, joining date, passport and salary are filled in automatically.' }}</p>
    <p class="es-msg err" *ngIf="ferr">{{ ferr }}</p>
    <div class="es-form">
      <div class="wide" *ngIf="hr">
        <label>Employee</label>
        <select [(ngModel)]="f.employee_id">
          <option [ngValue]="null">Choose…</option>
          <option *ngFor="let e of employees" [ngValue]="e.id">{{ e.emp_first_name }} {{ e.emp_last_name }} ({{ e.emp_code }})</option>
        </select>
      </div>
      <div>
        <label>Letter</label>
        <select [(ngModel)]="f.letter_type">
          <option *ngFor="let t of types" [ngValue]="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div>
        <label>Language</label>
        <select [(ngModel)]="f.language"><option value="en">English</option><option value="ar">Arabic</option></select>
      </div>
      <div class="wide"><label>Addressed to</label><input [(ngModel)]="f.addressee" placeholder="e.g. The Manager, Emirates NBD – or leave empty for 'To whom it may concern'"></div>
      <div class="wide"><label>Purpose</label><input [(ngModel)]="f.purpose" placeholder="e.g. car loan, visa application, opening a bank account"></div>
      <div *ngIf="needs('bank_name')"><label>Bank</label><input [(ngModel)]="f.bank_name" placeholder="e.g. Emirates NBD"></div>
      <div *ngIf="needs('destination')"><label>Destination</label><input [(ngModel)]="f.destination" placeholder="Country of travel"></div>
      <div *ngIf="needs('travel_from')"><label>Travel from</label><input type="date" [(ngModel)]="f.travel_from"></div>
      <div *ngIf="needs('travel_to')"><label>Return on</label><input type="date" [(ngModel)]="f.travel_to"></div>
    </div>
    <div class="foot">
      <button type="button" class="es-btn" (click)="f = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="busy" (click)="save()">{{ hr ? 'Issue the letter' : 'Send the request' }}</button>
    </div>
  </div>
</div>`,
})
export class EssLettersComponent implements OnInit {
  hr = false; rows: any[] = []; types: any[] = []; employees: any[] = [];
  loading = false; busy = false; msg = ''; ok = ''; ferr = ''; code = ''; verified: any = null;
  f: any = null; tab = 'pending'; base = ESS_BASE;
  tabs = [{ key: 'pending', label: 'Waiting' }, { key: 'issued', label: 'Issued' }, { key: 'rejected', label: 'Rejected' }, { key: '', label: 'All' }];

  constructor(private api: EssApiService, public router: Router, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.hr = !!this.route.snapshot.data['hr'];
    try { this.types = (await this.api.meta()).letter_types || []; } catch { this.types = []; }
    await this.load();
    if (this.route.snapshot.queryParamMap.get('new')) this.openNew();
  }

  async load(): Promise<void> {
    this.loading = true;
    try { this.rows = this.hr ? await this.api.get('letters/', { status: this.tab }) : await this.api.get('letters/mine/'); this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load the letters.'); }
    this.loading = false; this.cd.detectChanges();
  }

  needs(k: string): boolean { return !!this.types.find(t => t.value === this.f?.letter_type)?.needs?.includes(k); }

  async openNew(): Promise<void> {
    this.ferr = '';
    this.f = { letter_type: 'salary_certificate', language: 'en', addressee: '', purpose: '', bank_name: '', destination: '', travel_from: '', travel_to: '', employee_id: null };
    if (this.hr && !this.employees.length) {
      try { const r: any = await this.api.get('/employee/api/emplist/'); this.employees = Array.isArray(r) ? r : r.results || []; } catch { this.employees = []; }
    }
    this.cd.detectChanges();
  }

  async save(): Promise<void> {
    this.busy = true; this.ferr = '';
    const body = { ...this.f };
    Object.keys(body).forEach(k => { if (body[k] === '' || body[k] === null) delete body[k]; });
    try {
      const r: any = this.hr ? await this.api.post('letters/issue/', body) : await this.api.post('letters/mine/', body);
      this.ok = this.hr ? `${r.letter_label} issued (${r.reference_no}).` : `Your request ${r.number} was sent to HR.`;
      this.f = null; await this.load();
    } catch (e: any) { this.ferr = EssApiService.error(e, 'The letter could not be sent.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async act(l: any, a: string, note = ''): Promise<void> {
    this.busy = true;
    try {
      const r: any = await this.api.post(`letters/${l.id}/${a}/`, { note });
      this.ok = a === 'approve' ? `Letter ${r.reference_no} created – the employee can download it now.` : a === 'reject' ? 'Request rejected.' : 'Request withdrawn.';
      this.msg = ''; await this.load();
    } catch (e: any) { this.msg = EssApiService.error(e); }
    this.busy = false; this.cd.detectChanges();
  }

  reject(l: any): void {
    const note = window.prompt('Reason for rejecting (the employee will see it):', '');
    if (note === null) return;
    if (!note.trim()) { this.msg = 'Write the reason for rejecting.'; return; }
    this.act(l, 'reject', note);
  }

  async pdf(l: any): Promise<void> {
    try { await this.api.download(`letters/${l.id}/pdf/`, `${l.reference_no}.pdf`); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The PDF could not be downloaded.'); this.cd.detectChanges(); }
  }

  async verify(): Promise<void> {
    try { this.verified = await this.api.get('letters/verify/', { code: this.code.trim() }); this.msg = ''; }
    catch (e: any) { this.verified = null; this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }
}
