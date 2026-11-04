// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { LpApi, dots, employeeLabel } from './lp-api';
import { COUNTRY_PACK_UI } from '../shared-ui/country-pack.service';   // v1.14.0

/** Training history per employee: HR / managers pick an employee, ESS sees their own. Timeline + totals. */
@Component({
  selector: 'app-training-history',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, CommonModule, FormsModule],
  styleUrls: ['./learning-plus.css'],
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>Training history</h1><p class="lp-desc">Sessions, results, online courses, certificates, hours and cost{{ people ? ' – of every employee. Open a person to see the timeline.' : '.' }}</p></div>
    <div class="lp-tools">
      <input *ngIf="people && !employee" class="lp-search" [(ngModel)]="q" placeholder="Search a name, code or department" aria-label="Search">
      <button type="button" class="lp-btn" *ngIf="people && employee" (click)="employee = null; h = null; msg = ''" data-back>← All employees</button>
    </div>
  </div>
  <p class="lp-msg err" *ngIf="msg">{{ msg }}</p>
  <p class="lp-muted" *ngIf="loading">Loading…</p>
  <!-- v1.62.0 talent-ops: HR opens on the people list (was "Me" + "Pick an employee.") -->
  <ng-container *ngIf="people && !employee && !loading">
    <div class="lp-tiles" data-hist-tiles>
      <div class="lp-tile"><div class="k">Employees</div><div class="v">{{ ps.employees }}</div></div>
      <div class="lp-tile"><div class="k">Trained</div><div class="v">{{ ps.trained }}</div></div>
      <div class="lp-tile"><div class="k">No training yet</div><div class="v">{{ ps.never }}</div></div>
      <div class="lp-tile"><div class="k">Training hours</div><div class="v">{{ ps.hours }}</div></div>
      <div class="lp-tile"><div class="k">Certificates expiring (60 days)</div><div class="v">{{ ps.expiring }}</div></div>
    </div>
    <div class="lp-card lp-scroll">
      <table class="lp-table" data-hist-people>
        <thead><tr><th>Employee</th><th>Department</th><th class="c">Sessions</th><th class="c">Passed</th><th class="c">Hours</th><th>Certificates</th><th>Last training</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let r of shownPeople" [attr.data-emp]="r.id">
            <td><b>{{ r.name }}</b><div class="lp-muted">{{ r.code }}</div></td>
            <td>{{ r.department || '–' }}<div class="lp-muted">{{ r.designation }}</div></td>
            <td class="c">{{ r.sessions }}<span class="lp-muted" *ngIf="r.upcoming"> +{{ r.upcoming }}</span></td>
            <td class="c">{{ r.done ? r.passed + '/' + r.done : '–' }}</td>
            <td class="c">{{ r.hours || '–' }}</td>
            <td><span class="lp-tag green" *ngIf="r.certificates.valid">{{ r.certificates.valid }} valid</span>
              <span class="lp-tag amber" *ngIf="r.certificates.expiring">{{ r.certificates.expiring }} expiring</span>
              <span class="lp-tag red" *ngIf="r.certificates.expired">{{ r.certificates.expired }} expired</span>
              <span class="lp-muted" *ngIf="!r.certificates.valid && !r.certificates.expiring && !r.certificates.expired">–</span></td>
            <td class="nw">{{ r.last ? (r.last | date:'dd/MM/yyyy') : '–' }}<div class="lp-muted">{{ r.last_course }}</div></td>
            <td style="text-align:end"><button type="button" class="lp-btn small" (click)="employee = r.id; load()">History</button></td>
          </tr>
        </tbody>
      </table>
      <p class="lp-muted" *ngIf="!shownPeople.length">Nobody matches.</p>
    </div>
  </ng-container>
  <ng-container *ngIf="h && !loading && (!people || employee)">
    <p style="margin:0 0 10px"><strong>{{ h.employee.name }}</strong> <span class="lp-muted">{{ h.employee.designation || '' }}{{ h.employee.department ? ' · ' + h.employee.department : '' }}</span></p>
    <div class="lp-tiles">
      <div class="lp-tile"><div class="k">Sessions</div><div class="v">{{ h.totals.sessions }}</div></div>
      <div class="lp-tile"><div class="k">Passed</div><div class="v">{{ h.totals.passed }}/{{ h.totals.completed }}</div></div>
      <div class="lp-tile"><div class="k">Online completed</div><div class="v">{{ h.totals.online_completed }}</div></div>
      <div class="lp-tile"><div class="k">Training hours</div><div class="v">{{ h.totals.hours }}</div></div>
      <div class="lp-tile"><div class="k">{{ 'Cost (AED)' | zc }}</div><div class="v">{{ h.totals.cost | number:'1.0-0' }}</div></div>
      <div class="lp-tile"><div class="k">Valid certificates</div><div class="v">{{ h.totals.certificates_valid + h.totals.certificates_expiring }}</div></div>
    </div>
    <div class="lp-grid2">
      <div class="lp-card">
        <h2>Timeline</h2>
        <p class="lp-muted" *ngIf="!h.items.length">No training yet.</p>
        <ul class="lp-tl">
          <li *ngFor="let i of h.items" [class.fail]="i.passed === false" [class.online]="i.type === 'online'">
            <div class="d">{{ i.date | date:'dd/MM/yyyy' }} · {{ i.type === 'online' ? 'Online course' : i.session }}</div>
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
              <span *ngIf="i.hours">{{ i.hours }} h</span><span *ngIf="i.cost">{{ i.cost | zmoney:'1.0-0' }}</span>
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
  people: any[] | null = null; ps: any = {}; q = '';   // v1.62.0 talent-ops: HR / L&D open on the people list
  loading = false; msg = ''; dots = dots;
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {   // v1.62.0 talent-ops: HR / L&D get the people list; an employee (no HR right) gets their own history
      const r: any = await this.api.get('learning/plus/api/history/people/');
      this.people = r.rows || []; this.ps = r.summary || {};
      this.loading = false; this.cd.detectChanges();
      return;
    } catch { this.people = null; }
    await this.load();
  }
  get shownPeople(): any[] {
    const q = this.q.toLowerCase().trim();
    return (this.people || []).filter(r => !q || [r.name, r.code, r.department, r.designation].join(' ').toLowerCase().includes(q));
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
