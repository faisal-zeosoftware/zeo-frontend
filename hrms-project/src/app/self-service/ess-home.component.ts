import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ESS_BASE, EssApiService, money } from './ess-api.service';

interface Tile { icon: string; label: string; hint: string; link: string; query?: any; }

/** v1.13.0 – ESS home: one place for everything an employee does for themselves. */
export const ESS_LINKS: { title: string; items: Tile[] }[] = [
  { title: 'Me', items: [
    { icon: 'badge', label: 'My profile', hint: 'Personal, contact, family, bank and documents', link: ESS_BASE + '/profile' },
    { icon: 'pending_actions', label: 'My change requests', hint: 'Profile changes waiting for HR', link: ESS_BASE + '/my-requests' },
    { icon: 'folder_shared', label: 'My documents', hint: 'Download, see expiry, upload a new copy', link: ESS_BASE + '/documents' },
    { icon: 'policy', label: 'My policies', hint: 'Read and acknowledge company policies', link: '/main-sidebar/my-policies' },
  ] },
  { title: 'Time', items: [
    { icon: 'event_busy', label: 'My leave', hint: 'Apply, see balance and status', link: ESS_BASE + '/leave' },
    { icon: 'fingerprint', label: 'My attendance', hint: 'Punches and worked hours', link: '/main-sidebar/attendance-plus/my-attendance' },
    { icon: 'edit_calendar', label: 'Attendance corrections', hint: 'Fix a missed punch', link: '/main-sidebar/attendance-plus/corrections' },
    { icon: 'event_available', label: 'My schedule', hint: 'Shifts and swap requests', link: '/main-sidebar/shift-planner/my-schedule' },
  ] },
  { title: 'Pay and money', items: [
    { icon: 'receipt', label: 'My payslips', hint: 'Approved payslips, PDF and year to date', link: ESS_BASE + '/payslips' },
    { icon: 'receipt_long', label: 'Expenses', hint: 'Claims with receipts', link: '/main-sidebar/expense-options/expenses' },
    { icon: 'request_quote', label: 'Claims and requests', hint: 'General requests, advance, loan, air ticket', link: ESS_BASE + '/claims' },
    { icon: 'devices', label: 'My assets', hint: 'Laptop, phone, access cards', link: '/main-sidebar/asset-plus/my-assets' },
  ] },
  { title: 'Growth', items: [
    { icon: 'flag', label: 'My goals', hint: 'Goal setting and check-ins', link: '/main-sidebar/performance-options/goal-setting' },
    { icon: 'rate_review', label: 'Self appraisal', hint: 'Rate yourself, acknowledge the final rating', link: '/main-sidebar/performance-options/self-appraisal' },
    { icon: 'school', label: 'My learning', hint: 'Trainings, courses and certificates', link: '/main-sidebar/learning-options/my-learning' },
  ] },
  { title: 'HR services', items: [
    { icon: 'description', label: 'HR letters', hint: 'Salary certificate, NOC, embassy letter …', link: ESS_BASE + '/letters' },
    { icon: 'report', label: 'Complaints', hint: 'Raise a confidential or anonymous complaint', link: ESS_BASE + '/complaints' },
    { icon: 'campaign', label: 'Announcements', hint: 'News for your branch and team', link: ESS_BASE + '/announcements' },
  ] },
];

@Component({
  selector: 'app-ess-home',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">Self service</h1>
          <p class="es-desc">Everything you do for yourself in one place: your profile, leave, pay, letters and requests.</p>
        </div>
        <div class="es-actions">
          <button type="button" class="es-btn primary" (click)="go(base + '/leave', { new: 1 })">Apply for leave</button>
          <button type="button" class="es-btn" (click)="go(base + '/letters', { new: 1 })">Request a letter</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <p class="es-muted" *ngIf="loading">Loading…</p>
      <div class="es-tiles" *ngIf="d">
        <button type="button" class="es-tile" (click)="go(base + '/my-requests')">
          <div class="lbl">Changes waiting for HR</div><div class="num">{{ d.change_requests_pending }}</div><div class="sub">profile change requests</div></button>
        <button type="button" class="es-tile t3" (click)="go(base + '/letters')">
          <div class="lbl">Letters ready</div><div class="num">{{ d.letters_ready }}</div><div class="sub">{{ d.letters_pending }} waiting for HR</div></button>
        <button type="button" class="es-tile t4" (click)="go(base + '/complaints')">
          <div class="lbl">Open complaints</div><div class="num">{{ d.complaints_open }}</div><div class="sub">named cases</div></button>
        <button type="button" class="es-tile t2" (click)="go(base + '/announcements')">
          <div class="lbl">Unread announcements</div><div class="num">{{ d.announcements_unread }}</div><div class="sub">for you</div></button>
        <button type="button" class="es-tile t5" (click)="go('/main-sidebar/my-policies')">
          <div class="lbl">Policies to acknowledge</div><div class="num">{{ d.policies_unacknowledged }}</div><div class="sub">read and confirm</div></button>
        <button type="button" class="es-tile" (click)="go(base + '/payslips')">
          <div class="lbl">Next payslip</div><div class="num" style="font-size:17px">{{ d.next_payslip?.period }}</div>
          <div class="sub">{{ d.next_payslip?.state === 'being prepared' ? 'Payroll is being prepared' : 'Not started yet' }}<span *ngIf="d.last_payslip"> · last {{ m(d.last_payslip.net) }}</span></div></button>
        <button type="button" class="es-tile t2" *ngIf="d.documents_expiring" (click)="go(base + '/documents')">
          <div class="lbl">Documents expiring</div><div class="num">{{ d.documents_expiring }}</div><div class="sub">within 60 days</div></button>
        <button type="button" class="es-tile t3" *ngIf="d.hr_change_requests !== undefined" (click)="go(base + '/hr-requests')">
          <div class="lbl">HR · changes to review</div><div class="num">{{ d.hr_change_requests }}</div><div class="sub">your branches</div></button>
        <button type="button" class="es-tile t3" *ngIf="d.hr_letters !== undefined" (click)="go(base + '/hr-letters')">
          <div class="lbl">HR · letters to issue</div><div class="num">{{ d.hr_letters }}</div><div class="sub">your branches</div></button>
      </div>
      <ng-container *ngFor="let sec of links">
        <div class="es-section-title">{{ sec.title }}</div>
        <div class="es-grid">
          <button type="button" class="es-card-link" *ngFor="let l of sec.items" (click)="go(l.link)">
            <mat-icon>{{ l.icon }}</mat-icon>
            <div><div class="t">{{ l.label }}</div><div class="s">{{ l.hint }}</div></div>
          </button>
        </div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class EssHomeComponent implements OnInit {
  d: any = null; loading = false; msg = '';
  base = ESS_BASE; links = ESS_LINKS; m = money;

  constructor(private api: EssApiService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const r: any = await this.api.get('dashboard/');
      this.d = r && r.next_payslip !== undefined ? r : null;
      this.msg = r && r.detail && !this.d ? r.detail : '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'Could not load your self-service summary.'); }
    this.loading = false; this.cd.detectChanges();
  }

  go(link: string, query: any = {}): void { this.router.navigate([link], { queryParams: query }); }
}
