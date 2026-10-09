import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { LpApi, dots, employeeLabel } from './lp-api';

/** Training history per employee: HR / managers pick an employee, ESS sees their own. Timeline + totals. */
@Component({
  selector: 'app-training-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./learning-plus.css'],
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>Training History</h1><p class="lp-desc">Sessions, results, online courses, certificates, hours and cost.</p></div>
    <div class="lp-tools" *ngIf="employees.length > 1">
      <select [(ngModel)]="employee" (ngModelChange)="load()" aria-label="Employee" style="max-width:260px">
        <option [ngValue]="null">Me</option>
        <option *ngFor="let e of employees" [ngValue]="e.id">{{ e.label }}</option>
      </select>
    </div>
  </div>
  <p class="lp-msg err" *ngIf="msg">{{ msg }}</p>
  <p class="lp-muted" *ngIf="loading">Loading…</p>
  <ng-container *ngIf="h && !loading">
    <p style="margin:0 0 10px"><strong>{{ h.employee.name }}</strong> <span class="lp-muted">{{ h.employee.designation || '' }}{{ h.employee.department ? ' · ' + h.employee.department : '' }}</span></p>
    <div class="lp-tiles">
      <div class="lp-tile"><div class="k">Sessions</div><div class="v">{{ h.totals.sessions }}</div></div>
      <div class="lp-tile"><div class="k">Passed</div><div class="v">{{ h.totals.passed }}/{{ h.totals.completed }}</div></div>
      <div class="lp-tile"><div class="k">Online completed</div><div class="v">{{ h.totals.online_completed }}</div></div>
      <div class="lp-tile"><div class="k">Training hours</div><div class="v">{{ h.totals.hours }}</div></div>
      <div class="lp-tile"><div class="k">Cost (AED)</div><div class="v">{{ h.totals.cost | number:'1.0-0' }}</div></div>
      <div class="lp-tile"><div class="k">Valid certificates</div><div class="v">{{ h.totals.certificates_valid + h.totals.certificates_expiring }}</div></div>
    </div>
    <div class="lp-grid2">
      <div class="lp-card">
        <h2>Timeline</h2>
        <p class="lp-muted" *ngIf="!h.items.length">No training yet.</p>
        <ul class="lp-tl">
          <li *ngFor="let i of h.items" [class.fail]="i.passed === false" [class.online]="i.type === 'online'">
            <div class="d">{{ i.date | date:'dd MMM yyyy' }} · {{ i.type === 'online' ? 'Online course' : i.session }}</div>
            <div class="c">{{ i.course }}</div>
            <div class="f">
              <ng-container *ngIf="i.type === 'session'">
                <span>Seat: {{ i.seat_status }}</span>
                <span *ngIf="i.attendance_percent !== null">Attendance {{ i.attendance_percent }}%</span>
                <span *ngIf="i.pre_test_score !== null || i.post_test_score !== null">Test {{ i.pre_test_score ?? '–' }} → {{ i.post_test_score ?? '–' }}</span>
                <span *ngIf="i.passed !== null" [style.color]="i.passed ? '#2e7d4f' : '#c62f45'">{{ i.passed ? 'Passed' : 'Not passed' }}</span>
                <span *ngIf="i.certificate">Certificate {{ i.certificate.status }}</span>
              </ng-container>
              <ng-container *ngIf="i.type === 'online'"><span>{{ i.status }} · {{ i.progress }}%</span><span *ngIf="i.score !== null">Score {{ i.score }}%</span></ng-container>
              <span *ngIf="i.hours">{{ i.hours }} h</span><span *ngIf="i.cost">AED {{ i.cost | number:'1.0-0' }}</span>
            </div>
          </li>
        </ul>
      </div>
      <div>
        <div class="lp-card">
          <h2>Certificates</h2>
          <p class="lp-muted" *ngIf="!h.certificates.length">None.</p>
          <div class="lp-mod" *ngFor="let c of h.certificates">
            <span class="t">{{ c.title }}<div class="lp-muted">{{ c.issued_on | date:'dd/MM/yyyy' }}<span *ngIf="c.expiry_date"> → {{ c.expiry_date | date:'dd/MM/yyyy' }}</span></div></span>
            <span class="lp-tag" [ngClass]="c.status === 'valid' ? 'green' : c.status === 'expired' ? 'red' : c.status === 'expiring' ? 'amber' : 'grey'">{{ c.status }}</span>
            <button type="button" class="lp-btn small" (click)="pdf(c)">PDF</button>
          </div>
        </div>
        <div class="lp-card">
          <h2>Skills</h2>
          <p class="lp-muted" *ngIf="!h.skills.length">None recorded.</p>
          <div class="lp-mod" *ngFor="let s of h.skills">
            <span class="t">{{ s.skill }} <span class="lp-muted">· {{ s.source }}</span></span>
            <span class="lp-dots"><i *ngFor="let on of dots(s.level)" [class.on]="on"></i></span>
          </div>
        </div>
      </div>
    </div>
  </ng-container>
</div>`,
})
export class TrainingHistoryComponent implements OnInit {
  h: any = null; employees: { id: number; label: string }[] = []; employee: number | null = null;
  loading = false; msg = ''; dots = dots;
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  async ngOnInit(): Promise<void> {
    try {   // HR / managers get a list; ESS gets only themselves (picker hidden)
      const rows: any = await this.api.get('employee/api/emplist/');
      this.employees = (Array.isArray(rows) ? rows : rows?.results || []).map((r: any) => ({ id: r.id, label: employeeLabel(r) }));
    } catch { this.employees = []; }
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true; this.msg = ''; this.cd.detectChanges();
    try { this.h = await this.api.get('learning/api/history/', { employee: this.employee }); }
    catch (e) { this.h = null; this.msg = LpApi.err(e, 'Could not load the history.'); }
    this.loading = false; this.cd.detectChanges();
  }

  async pdf(c: any): Promise<void> {
    try { await this.api.openBlob(`learning/plus/api/certificates/${c.id}/pdf/`, {}, `certificate-${c.number || c.id}.pdf`); }
    catch { this.msg = 'Could not open the certificate.'; this.cd.detectChanges(); }
  }
}
