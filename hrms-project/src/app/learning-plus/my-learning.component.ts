import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { LpApi } from './lp-api';

/** ESS: my nominations, my online courses (modules, progress, mark complete), my certificates (PDF). */
@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./learning-plus.css'],
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>My Learning</h1><p class="lp-desc">Your training sessions, online courses and certificates.</p></div>
  </div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <p class="lp-muted" *ngIf="loading">Loading…</p>

  <ng-container *ngIf="data && !loading">
    <div class="lp-tiles">
      <div class="lp-tile"><div class="k">Sessions</div><div class="v">{{ data.nominations.length }}</div></div>
      <div class="lp-tile"><div class="k">Online courses</div><div class="v">{{ data.online.length }}</div></div>
      <div class="lp-tile"><div class="k">Completed online</div><div class="v">{{ completedOnline() }}</div></div>
      <div class="lp-tile"><div class="k">Certificates</div><div class="v">{{ data.certificates.length }}</div></div>
    </div>

    <div class="lp-card">
      <h2>My online courses</h2>
      <p class="lp-muted" *ngIf="!data.online.length">No online course yet. Start one below.</p>
      <div *ngFor="let o of data.online" style="margin-bottom:14px">
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between">
          <strong style="overflow-wrap:anywhere">{{ o.course }}</strong>
          <span class="lp-tag" [ngClass]="o.status === 'completed' ? 'green' : 'grey'">{{ o.status === 'completed' ? 'Completed' + (o.score !== null ? ' · ' + o.score + '%' : '') : o.progress.percent + '%' }}</span>
        </div>
        <div class="lp-bar" style="margin:6px 0" [attr.aria-label]="'Progress ' + o.progress.percent + '%'"><span [style.width.%]="o.progress.percent"></span></div>
        <div class="lp-mod" *ngFor="let m of o.progress.items">
          <span class="lp-tag grey">{{ m.content_type }}</span>
          <span class="t">{{ m.order }}. {{ m.title }} <span class="lp-muted">· {{ m.duration_minutes }} min</span>
            <span class="lp-muted" *ngIf="m.score !== null"> · score {{ m.score }}%{{ m.passed === false ? ' (not passed - try again)' : '' }}</span></span>
          <span class="done" *ngIf="m.status === 'completed'">✓ Done</span>
          <ng-container *ngIf="m.status !== 'completed'">
            <button type="button" class="lp-btn small" *ngIf="m.url || m.file" (click)="openModule(m)" [disabled]="busy">Open</button>
            <button type="button" class="lp-btn small primary" (click)="complete(m)" [disabled]="busy">{{ m.content_type === 'quiz' ? 'Submit score' : 'Mark complete' }}</button>
          </ng-container>
        </div>
        <button type="button" class="lp-btn small" *ngIf="o.certificate_id" (click)="pdf(o.certificate_id, o.code)" style="margin-top:6px">Download certificate</button>
      </div>
      <ng-container *ngIf="data.available.length">
        <h2 style="margin-top:12px">Start an online course</h2>
        <div class="lp-mod" *ngFor="let c of data.available">
          <span class="t">{{ c.code }} - {{ c.title }}</span>
          <button type="button" class="lp-btn small primary" (click)="enrol(c)" [disabled]="busy">Start</button>
        </div>
      </ng-container>
    </div>

    <div class="lp-grid2">
      <div class="lp-card">
        <h2>My training sessions</h2>
        <p class="lp-muted" *ngIf="!data.nominations.length">No nominations.</p>
        <div class="lp-scroll" *ngIf="data.nominations.length">
          <table class="lp-table">
            <thead><tr><th>Course</th><th>Dates</th><th>Approval</th><th>Seat</th><th>Result</th></tr></thead>
            <tbody>
              <tr *ngFor="let n of data.nominations">
                <td>{{ n.course }}<div class="lp-muted">{{ n.session }}<span *ngIf="n.venue"> · {{ n.venue }}</span></div></td>
                <td style="white-space:nowrap">{{ n.start_date | date:'dd/MM/yy' }}<span *ngIf="n.end_date !== n.start_date"> – {{ n.end_date | date:'dd/MM/yy' }}</span></td>
                <td><span class="lp-tag" [ngClass]="tone(n.manager_status)">Mgr {{ n.manager_status }}</span> <span class="lp-tag" [ngClass]="tone(n.ld_status)">L&amp;D {{ n.ld_status }}</span></td>
                <td><span class="lp-tag" [ngClass]="n.seat_status === 'confirmed' ? 'green' : n.seat_status === 'cancelled' ? 'red' : 'amber'">{{ n.seat_status }}</span></td>
                <td>{{ n.passed === null ? '–' : n.passed ? 'Passed' : 'Not passed' }}<div class="lp-muted" *ngIf="n.attendance_percent !== null">{{ n.attendance_percent }}% attended</div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="lp-card">
        <h2>My certificates</h2>
        <p class="lp-muted" *ngIf="!data.certificates.length">No certificates yet.</p>
        <div class="lp-mod" *ngFor="let c of data.certificates">
          <span class="t">{{ c.title }}<div class="lp-muted">{{ c.number || '' }} · issued {{ c.issued_on | date:'dd/MM/yyyy' }}<span *ngIf="c.expiry_date"> · expires {{ c.expiry_date | date:'dd/MM/yyyy' }}</span></div></span>
          <span class="lp-tag" [ngClass]="c.status === 'valid' ? 'green' : c.status === 'expired' ? 'red' : c.status === 'expiring' ? 'amber' : 'grey'">{{ c.status }}</span>
          <button type="button" class="lp-btn small" (click)="pdf(c.id, c.number)">PDF</button>
        </div>
      </div>
    </div>
  </ng-container>
</div>`,
})
export class MyLearningComponent implements OnInit {
  data: any = null; loading = false; busy = false; msg = ''; err = false;
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true; this.cd.detectChanges();
    try { this.data = await this.api.get('learning/plus/api/my-learning/'); }
    catch (e) { this.data = null; this.say(LpApi.err(e, 'Could not load your learning.'), true); }
    this.loading = false; this.cd.detectChanges();
  }

  completedOnline(): number { return (this.data?.online || []).filter((o: any) => o.status === 'completed').length; }
  tone(s: string): string { return s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'amber'; }

  async openModule(m: any): Promise<void> {
    const link = m.url || m.file;
    if (link) { window.open(link, '_blank', 'noopener'); }
    try { await this.api.post(`learning/plus/api/modules/${m.id}/open/`); m.status = m.status === 'not_started' ? 'in_progress' : m.status; } catch { /* opening still works */ }
    this.cd.detectChanges();
  }

  async complete(m: any): Promise<void> {
    let body: any = {};
    if (m.content_type === 'quiz') {
      const s = prompt('Your quiz score (0-100)');
      if (s === null || s.trim() === '') { return; }
      body = { score: +s };
    }
    this.busy = true;
    try {
      const r: any = await this.api.post(`learning/plus/api/modules/${m.id}/complete/`, body);
      this.say(r.course_completed ? 'Course completed - well done! Your certificate / result has been recorded.'
        : (r.progress?.passed === false ? 'Score below the pass mark - review the material and try again.' : `Module done. Course ${r.course.percent}% complete.`), r.progress?.passed === false);
      await this.load();
    } catch (e) { this.say(LpApi.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }

  async enrol(c: any): Promise<void> {
    this.busy = true;
    try {
      await this.api.post('learning/plus/api/enrolments/', { course_id: c.id, employee_id: this.data.employee.id });
      this.say(`You started ${c.title}.`, false); await this.load();
    } catch (e) { this.say(LpApi.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }

  async pdf(id: number, number?: string): Promise<void> {
    try { await this.api.openBlob(`learning/plus/api/certificates/${id}/pdf/`, {}, `certificate-${number || id}.pdf`, true); }
    catch (e) { this.say('Could not open the certificate.', true); }
  }

  private say(t: string, err: boolean): void { this.msg = t; this.err = err; this.cd.detectChanges(); }
}
