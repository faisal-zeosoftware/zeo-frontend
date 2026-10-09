import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BrowserQRCodeReader, BrowserQRCodeSvgWriter, IScannerControls } from '@zxing/browser';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ApApi, STATUS_COLOR, currentPosition, fileToDataUrl, isMobile } from './ap-api';

/** ESS / mobile (v1.12.0): punch in / out, breaks and lunch, scan a site QR, my month (status, late, early, OT, break),
 *  request a correction, my corrections, my QR badge and kiosk PIN. */
@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./attendance-plus.css'],
  template: `
<div class="ap-wrap">
  <div class="ap-head">
    <div><h1>My Attendance</h1>
      <p class="ap-desc">Clock in and out, take breaks, see your month and ask for a correction when a punch is missing or wrong.</p></div>
  </div>
  <p class="ap-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>

  <div class="ap-card" *ngIf="st">
    <div class="ap-punch">
      <div>
        <div class="ap-clock">{{ now | date:'HH:mm' }}</div>
        <div class="ap-muted">{{ st.work_date | date:'EEEE d MMM' }}
          <span *ngIf="st.shift && !st.shift.off"> · Shift {{ st.shift.name }} {{ st.shift.start }}–{{ st.shift.end }}</span>
          <span *ngIf="st.shift?.off"> · Day off</span></div>
        <div style="margin-top:4px">
          <span class="ap-tag" [ngClass]="st.clocked_in ? 'green' : 'grey'">{{ st.clocked_in ? 'Clocked in' : 'Not clocked in' }}</span>
          <span class="ap-tag amber" *ngIf="st.on_break" style="margin-left:6px">{{ st.on_break === 'lunch_out' ? 'On lunch' : 'On break' }}</span>
          <span class="ap-tag red" *ngIf="st.day?.is_late" style="margin-left:6px">Late {{ st.day.late }}</span>
        </div>
      </div>
      <div class="ap-punch" style="flex:1 1 280px;justify-content:flex-end">
        <button type="button" class="ap-btn big primary" (click)="punch('auto')" [disabled]="busy || !!st.on_break">{{ st.clocked_in ? 'Clock out' : 'Clock in' }}</button>
        <ng-container *ngIf="st.clocked_in">
          <button type="button" class="ap-btn big" *ngIf="!st.on_break" (click)="punch('break_out')" [disabled]="busy">Start break</button>
          <button type="button" class="ap-btn big" *ngIf="!st.on_break" (click)="punch('lunch_out')" [disabled]="busy">Start lunch</button>
          <button type="button" class="ap-btn big primary" *ngIf="st.on_break" (click)="punch(st.on_break === 'lunch_out' ? 'lunch_in' : 'break_in')" [disabled]="busy">
            {{ st.on_break === 'lunch_out' ? 'End lunch' : 'End break' }}</button>
        </ng-container>
        <button type="button" class="ap-btn" (click)="scanSite()" [disabled]="busy" *ngIf="allows('qr')">Scan site QR</button>
      </div>
    </div>
    <div *ngIf="st.require_selfie" style="margin-top:10px">
      <label class="ap-muted">Selfie for the punch (required):
        <input type="file" accept="image/*" capture="user" (change)="pickSelfie($event)"></label>
      <span class="ap-tag green" *ngIf="selfie">Photo ready</span>
    </div>
    <p class="ap-muted" *ngIf="st.require_gps" style="margin:8px 0 0">Your location is sent with the punch. Allow location access when asked.</p>
    <div *ngIf="scanning" style="margin-top:10px">
      <video #video class="ap-video" playsinline></video>
      <div><button type="button" class="ap-btn small" (click)="stopScan()">Stop scanning</button></div>
    </div>
    <div class="ap-scroll" *ngIf="st.punches?.length" style="margin-top:10px">
      <table class="ap-table"><tr><th>Time</th><th>Punch</th><th>Method</th></tr>
        <tr *ngFor="let p of st.punches"><td>{{ p.local_time | slice:11:16 }}</td><td>{{ p.kind_label }}</td><td>{{ p.source_label }}</td></tr></table>
    </div>
  </div>

  <div class="ap-card">
    <div class="ap-head" style="margin-bottom:8px">
      <h2 style="margin:0">My month</h2>
      <div class="ap-tools">
        <button type="button" class="ap-btn small" (click)="shift(-1)" aria-label="Previous month">‹</button>
        <strong>{{ monthLabel() }}</strong>
        <button type="button" class="ap-btn small" (click)="shift(1)" aria-label="Next month">›</button>
      </div>
    </div>
    <div class="ap-tiles" *ngIf="month">
      <div class="ap-tile"><div class="k">Present</div><div class="v">{{ month.totals.present }}</div></div>
      <div class="ap-tile"><div class="k">Absent</div><div class="v">{{ month.totals.absent_days }}</div></div>
      <div class="ap-tile"><div class="k">Half days</div><div class="v">{{ month.totals.half }}</div></div>
      <div class="ap-tile"><div class="k">Late (times / min)</div><div class="v">{{ month.totals.late_count }} / {{ month.totals.late_minutes }}</div></div>
      <div class="ap-tile"><div class="k">Early out (times)</div><div class="v">{{ month.totals.early_count }}</div></div>
      <div class="ap-tile"><div class="k">Missing punches</div><div class="v">{{ month.totals.missing }}</div></div>
      <div class="ap-tile"><div class="k">Overtime</div><div class="v">{{ hm(month.totals.ot_minutes) }}</div></div>
      <div class="ap-tile"><div class="k">Breaks</div><div class="v">{{ hm(month.totals.brk) }}</div></div>
    </div>
    <p class="ap-muted" *ngIf="loadingMonth">Loading…</p>
    <div class="ap-scroll" *ngIf="month">
      <table class="ap-table">
        <tr><th>Date</th><th>Status</th><th>Shift</th><th>In</th><th>Out</th><th>Worked</th><th>Break</th><th>Late</th><th>Early</th><th>OT</th><th></th></tr>
        <tr *ngFor="let d of month.days" [class.off]="d.status === 'weekly_off' || d.status === 'holiday'">
          <td>{{ d.date | date:'EEE d' }}</td>
          <td><span class="ap-tag" [ngClass]="color(d.status)">{{ d.status_label }}</span>
            <span class="ap-tag grey" *ngIf="d.is_night_shift" style="margin-left:4px">Night</span></td>
          <td>{{ d.shift_name }}</td><td>{{ d.first_in_local }}</td><td>{{ d.last_out_local }}</td><td>{{ d.worked }}</td>
          <td>{{ d.break }}</td><td>{{ d.late }}</td><td>{{ d.early }}</td><td>{{ d.ot_total_minutes ? d.ot : '' }}</td>
          <td><button type="button" class="ap-btn small" *ngIf="canCorrect(d)" (click)="startCorrection(d)">Request correction</button></td>
        </tr>
      </table>
    </div>
  </div>

  <div class="ap-card" *ngIf="form" id="ap-correction">
    <h2>Request a correction for {{ form.date | date:'EEEE d MMM yyyy' }}</h2>
    <div class="ap-form">
      <label>Type
        <select class="ap-input" [(ngModel)]="form.kind">
          <option value="missing_punch">Missing punch</option><option value="wrong_time">Wrong time</option>
          <option value="forgot">Forgot to punch</option><option value="on_duty">On duty / outside work</option><option value="wfh">Work from home</option>
        </select></label>
      <label>Correct clock-in<input class="ap-input" type="time" [(ngModel)]="form.in"></label>
      <label>Correct clock-out<input class="ap-input" type="time" [(ngModel)]="form.out"></label>
      <label><span><input type="checkbox" [(ngModel)]="form.waive"> Ask to waive the late / early penalty</span></label>
      <label class="wide">Reason<textarea class="ap-input" [(ngModel)]="form.reason" placeholder="What happened? e.g. the device was down"></textarea></label>
      <label class="wide">Attachment (optional)<input type="file" (change)="pickFile($event)"></label>
    </div>
    <p class="ap-muted">A clock-out earlier than the clock-in is taken as the next day (night shift). Your manager approves first, then HR.</p>
    <div class="ap-tools">
      <button type="button" class="ap-btn primary" (click)="sendCorrection()" [disabled]="busy">Send request</button>
      <button type="button" class="ap-btn" (click)="form = null">Close</button>
    </div>
  </div>

  <div class="ap-grid2">
    <div class="ap-card">
      <h2>My corrections</h2>
      <p class="ap-muted" *ngIf="!corrections.length">No correction requests.</p>
      <div class="ap-scroll" *ngIf="corrections.length">
        <table class="ap-table"><tr><th>Date</th><th>Type</th><th>In / out</th><th>Status</th><th></th></tr>
          <tr *ngFor="let c of corrections">
            <td>{{ c.date | date:'d MMM' }}</td><td>{{ c.kind_label }}</td>
            <td>{{ c.proposed_in_local | slice:11 }} – {{ c.proposed_out_local | slice:11 }}</td>
            <td><span class="ap-tag" [ngClass]="cColor(c.status)">{{ c.status_label }}</span>
              <div class="ap-muted" *ngIf="c.manager_note || c.hr_note">{{ c.hr_note || c.manager_note }}</div></td>
            <td><button type="button" class="ap-btn small red" *ngIf="c.status === 'manager' || c.status === 'hr'" (click)="cancel(c)">Cancel</button></td>
          </tr></table>
      </div>
    </div>
    <div class="ap-card">
      <h2>My badge and kiosk PIN</h2>
      <p class="ap-muted">Show this QR code at a kiosk to punch. Keep it private – anyone with it can punch for you.</p>
      <button type="button" class="ap-btn small" (click)="showQr()" *ngIf="!qrShown">Show my QR badge</button>
      <div *ngIf="qrShown"><div class="ap-qr" #qrBox></div></div>
      <div class="ap-form" style="margin-top:12px">
        <label>New kiosk PIN (4–8 digits)<input class="ap-input" type="password" inputmode="numeric" maxlength="8" [(ngModel)]="pin" autocomplete="new-password"></label>
        <button type="button" class="ap-btn" (click)="savePin()" [disabled]="busy || !pin">Save PIN</button>
      </div>
    </div>
  </div>
</div>`,
})
export class MyAttendanceComponent implements OnInit, OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('qrBox') qrBox?: ElementRef<HTMLDivElement>;
  api: ApApi;
  st: any = null;
  month: any = null;
  corrections: any[] = [];
  y = new Date().getFullYear();
  m = new Date().getMonth() + 1;
  msg = '';
  err = false;
  busy = false;
  loadingMonth = false;
  now = new Date();
  selfie: string | null = null;
  scanning = false;
  form: any = null;
  file: File | null = null;
  pin = '';
  qrShown = false;
  private timer: any;
  private controls?: IScannerControls;

  constructor(http: HttpClient, rec: ZRecordService, private cdr: ChangeDetectorRef) { this.api = new ApApi(http, rec); }

  ngOnInit(): void {
    this.timer = setInterval(() => { this.now = new Date(); this.cdr.markForCheck(); }, 30000);
    this.loadStatus(); this.loadMonth(); this.loadCorrections();
  }

  ngOnDestroy(): void { clearInterval(this.timer); this.stopScan(); }

  say(text: string, err = false): void { this.msg = text; this.err = err; this.cdr.markForCheck(); }
  color(s: string): string { return STATUS_COLOR[s] || 'grey'; }
  cColor(s: string): string { return ({ approved: 'green', rejected: 'red', cancelled: 'grey', manager: 'amber', hr: 'blue' } as Record<string, string>)[s] || 'grey'; }
  hm(m: number): string { m = m || 0; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; }
  allows(m: string): boolean { return !this.st?.methods?.length || this.st.methods.includes(m); }
  monthLabel(): string { return new Date(this.y, this.m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }

  async loadStatus(): Promise<void> {
    try { this.st = await this.api.get('punches/my_status/'); } catch (e) { this.say(ApApi.err(e, 'Your attendance could not be loaded.'), true); }
    this.cdr.markForCheck();
  }

  async loadMonth(): Promise<void> {
    this.loadingMonth = true;
    try { this.month = await this.api.get('days/my_month/', { year: this.y, month: this.m }); } catch (e) { this.say(ApApi.err(e), true); }
    this.loadingMonth = false; this.cdr.markForCheck();
  }

  async loadCorrections(): Promise<void> {
    try { this.corrections = await this.api.get('corrections/', { mine: 1 }); } catch { this.corrections = []; }
    this.cdr.markForCheck();
  }

  shift(n: number): void {
    this.m += n;
    if (this.m < 1) { this.m = 12; this.y--; }
    if (this.m > 12) { this.m = 1; this.y++; }
    this.loadMonth();
  }

  async pickSelfie(ev: Event): Promise<void> {
    const f = (ev.target as HTMLInputElement).files?.[0];
    this.selfie = f ? await fileToDataUrl(f) : null; this.cdr.markForCheck();
  }

  async punch(kind: string, siteQr?: string): Promise<void> {
    if (this.st?.require_selfie && !this.selfie) { this.say('Take a selfie first (button above), then punch.', true); return; }
    this.busy = true; this.say(siteQr ? 'Sending…' : 'Getting your location…');
    const body: any = { kind, source: siteQr ? 'qr' : (isMobile() ? 'mobile' : 'web'), device_id: navigator.userAgent.slice(0, 60) };
    if (siteQr) body.site_qr = siteQr;
    const pos = await currentPosition(this.st?.require_gps ? 15000 : 5000);
    if (pos) { body.lat = pos.lat; body.lng = pos.lng; }
    else if (this.st?.require_gps) { this.busy = false; this.say('Your location is required. Allow location access in the browser / phone settings and try again.', true); return; }
    if (this.selfie) body.photo = this.selfie;
    try {
      const r: any = await this.api.post('punches/punch/', body);
      this.say(r.detail || 'Punch recorded.'); this.selfie = null;
      await this.loadStatus(); this.loadMonth();
    } catch (e) { this.say(ApApi.err(e, 'The punch was not recorded. Try again.'), true); }
    this.busy = false; this.cdr.markForCheck();
  }

  async scanSite(): Promise<void> {
    this.scanning = true; this.cdr.detectChanges();
    try {
      const reader = new BrowserQRCodeReader();
      this.controls = await reader.decodeFromVideoDevice(undefined, this.video!.nativeElement, (res) => {
        if (res) { const text = res.getText(); this.stopScan(); this.punch('auto', text); }
      });
    } catch { this.scanning = false; this.say('The camera could not be opened. Allow camera access and try again.', true); }
  }

  stopScan(): void { try { this.controls?.stop(); } catch { /* already stopped */ } this.controls = undefined; this.scanning = false; this.cdr.markForCheck(); }

  canCorrect(d: any): boolean {
    const past = d.date <= new Date().toISOString().slice(0, 10);
    return past && ['absent', 'missing_punch', 'half_day', 'present'].includes(d.status);
  }

  startCorrection(d: any): void {
    this.form = { date: d.date, kind: d.status === 'missing_punch' ? 'missing_punch' : (d.status === 'absent' ? 'forgot' : 'wrong_time'),
      in: d.first_in_local || '', out: d.last_out_local || '', reason: '', waive: false };
    this.file = null;
    setTimeout(() => document.getElementById('ap-correction')?.scrollIntoView({ behavior: 'smooth' }));
  }

  pickFile(ev: Event): void { this.file = (ev.target as HTMLInputElement).files?.[0] || null; }

  async sendCorrection(): Promise<void> {
    const f = this.form;
    if (!f.reason?.trim()) { this.say('Write the reason for the correction.', true); return; }
    const fd = new FormData();
    fd.append('date', f.date); fd.append('kind', f.kind); fd.append('reason', f.reason); fd.append('waive_penalty', f.waive ? 'true' : 'false');
    if (f.in) fd.append('proposed_in', `${f.date} ${f.in}`);
    if (f.out) fd.append('proposed_out', `${f.date} ${f.out}`);
    if (this.file) fd.append('attachment', this.file);
    this.busy = true;
    try { await this.api.post('corrections/', fd); this.say('Correction sent for approval.'); this.form = null; this.loadCorrections(); }
    catch (e) { this.say(ApApi.err(e, 'The request could not be sent.'), true); }
    this.busy = false; this.cdr.markForCheck();
  }

  async cancel(c: any): Promise<void> {
    if (!confirm('Cancel this correction request?')) return;
    try { await this.api.post(`corrections/${c.id}/cancel/`); this.loadCorrections(); } catch (e) { this.say(ApApi.err(e), true); }
  }

  async showQr(): Promise<void> {
    try {
      const r: any = await this.api.get('punches/my_qr/');
      this.qrShown = true; this.cdr.detectChanges();
      const box = this.qrBox?.nativeElement;
      if (box) { box.innerHTML = ''; box.appendChild(new BrowserQRCodeSvgWriter().write(r.qr, 220, 220)); }
    } catch (e) { this.say(ApApi.err(e), true); }
  }

  async savePin(): Promise<void> {
    this.busy = true;
    try { await this.api.post('punches/set_pin/', { pin: this.pin }); this.pin = ''; this.say('Kiosk PIN saved.'); }
    catch (e) { this.say(ApApi.err(e), true); }
    this.busy = false; this.cdr.markForCheck();
  }
}
