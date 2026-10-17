import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { I18N_UI, i18nLang } from '../shared-ui/i18n.service';
import { errText, T, ZeoMobileService } from './m.service';

const KIND: Record<string, string> = { in: 'Check in', out: 'Check out', break_out: 'Break', break_in: 'Back from break', lunch_out: 'Lunch', lunch_in: 'Back from lunch' };

function hhmm(iso: string | null | undefined): string {
  if (!iso) { return ''; }
  const d = new Date(iso);
  return isNaN(+d) ? String(iso).slice(11, 16) : d.toLocaleTimeString(i18nLang() === 'ar' ? 'ar-AE' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
}
function day(iso: string | null | undefined): string {
  if (!iso) { return ''; }
  const d = new Date(String(iso).length === 10 ? iso + 'T00:00:00' : iso);
  return isNaN(+d) ? String(iso) : d.toLocaleDateString(i18nLang() === 'ar' ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'short' });
}
function stLabel(s: string): string { const k = stKey(s); return ({ pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' } as any)[k] || s; }
function stKey(s: string): string { const v = String(s || '').toLowerCase(); return v.startsWith('pend') ? 'pending' : v.startsWith('appr') ? 'approved' : v.startsWith('rej') ? 'rejected' : v; }

/** Shared check-in logic (home dial and Attendance tab). */
class Punch {
  busy = false;
  constructor(private m: ZeoMobileService) {}
  async run(home: any): Promise<{ ok: boolean; text: string }> {
    const p = home?.punch || {};
    this.busy = true;
    try {
      const pos = await this.m.position();
      if (!pos && p.require_gps) { return { ok: false, text: T('Turn on location (GPS) and try again – your location is required to punch.') }; }
      let photo: string | null = null;
      if (p.require_selfie) {
        photo = await this.m.selfie();
        if (!photo) { return { ok: false, text: T('Take a selfie photo to punch – a photo is required.') }; }
      }
      const body: any = { kind: 'auto', source: 'mobile', device_id: await this.m.uid() };
      if (pos) { body.lat = pos.lat; body.lng = pos.lng; body.location = `GPS ±${pos.acc} m`; }
      if (photo) { body.photo = photo; }
      const r: any = await this.m.post('/attendance-plus/api/punches/punch/', body);
      return { ok: true, text: r?.detail || T('Done.') };
    } catch (e) {
      return { ok: false, text: errText(e, 'The punch was not recorded. Try again.') };
    } finally { this.busy = false; }
  }
}

/** v1.25.0 – the app frame: page + bottom tabs (Home, Attendance, Leave, Approvals, More). */
@Component({
  selector: 'zm-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<div class="shell">
  <router-outlet></router-outlet>
  <nav class="tabs" [attr.aria-label]="'Main' | t">
    <a routerLink="/m/home" [class.on]="is('/m/home')"><span class="material-icons" aria-hidden="true">home</span>{{ 'Home' | t }}</a>
    <a routerLink="/m/attendance" [class.on]="is('/m/attendance')"><span class="material-icons" aria-hidden="true">schedule</span>{{ 'Attendance' | t }}</a>
    <a routerLink="/m/leave" [class.on]="is('/m/leave')"><span class="material-icons" aria-hidden="true">event_available</span>{{ 'Leave' | t }}</a>
    <a routerLink="/m/approvals" *ngIf="showApprovals()" [class.on]="is('/m/approvals')"><span class="material-icons" aria-hidden="true">task_alt</span>{{ 'Approvals' | t }}
      <span class="badge" *ngIf="m.home?.approvals">{{ m.home.approvals }}</span></a>
    <a routerLink="/m/more" [class.on]="is('/m/more') || is('/m/payslips') || is('/m/requests')"><span class="material-icons" aria-hidden="true">menu</span>{{ 'More' | t }}</a>
  </nav>
</div>`,
})
export class MShellComponent implements OnInit, OnDestroy {
  url = '';
  private sub?: Subscription;
  constructor(public m: ZeoMobileService, private router: Router) {}
  ngOnInit(): void {
    if (!this.m.hasServer()) { this.router.navigate(['/m/connect']); return; }
    if (!this.m.tokenOk()) { this.router.navigate(['/m']); return; }
    if (!this.m.schema()) { this.router.navigate(['/m/companies']); return; }
    this.url = this.router.url;
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => this.url = e.urlAfterRedirects);
    void this.m.startApp();
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  is(p: string): boolean { return this.url.startsWith(p); }
  showApprovals(): boolean { const h = this.m.home; return !!h && (h.has_team || h.is_admin || h.approvals > 0); }
}

/** v1.25.0 – /m/home */
@Component({
  selector: 'zm-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<header class="band">
  <div class="band-top">
    <button type="button" class="band-co" (click)="companies()"><span>{{ company }}</span><span class="material-icons" aria-hidden="true">expand_more</span></button>
    <a class="avatar" routerLink="/m/more" [attr.aria-label]="'More' | t"><img *ngIf="h?.employee?.photo" [src]="h.employee.photo" alt=""><ng-container *ngIf="!h?.employee?.photo">{{ initials() }}</ng-container></a>
  </div>
  <h1>{{ greet() }}</h1>
  <div class="sub" *ngIf="h?.employee">{{ h.employee.code }} · {{ h.employee.designation || h.employee.department }}</div>
</header>
<main class="page" style="margin-top:-30px">
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <ng-container *ngIf="!h && !msg"><div class="skel" style="height:168px"></div><div class="skel"></div><div class="skel"></div></ng-container>
  <ng-container *ngIf="h">
    <div class="mmsg info" *ngIf="h.message">{{ h.message | t }}</div>
    <section class="clock" *ngIf="h.employee && canPunch()">
      <button type="button" class="dial" [class.out]="h.punch?.clocked_in" (click)="punch()" [disabled]="p.busy">
        <span class="t">{{ now }}</span><span class="l" *ngIf="!p.busy">{{ (h.punch?.clocked_in ? 'Check out' : 'Check in') | t }}</span><span class="spin" *ngIf="p.busy"></span></button>
      <div class="clock-info">
        <b>{{ (h.punch?.clocked_in ? 'You are checked in' : 'Not checked in yet') | t }}</b>
        <span *ngIf="h.punch?.shift?.start">{{ 'Shift {0} – {1}' | t:h.punch.shift.start:h.punch.shift.end }}</span>
        <span *ngIf="h.punch?.shift?.off">{{ 'Day off' | t }}</span>
        <span *ngIf="!(h.punch?.punches || []).length">{{ 'Tap the clock to check in.' | t }}</span>
        <div class="row">
          <span class="chip" *ngFor="let x of h.punch?.punches || []"><span class="material-icons" aria-hidden="true">{{ x.kind === 'in' ? 'login' : x.kind === 'out' ? 'logout' : 'free_breakfast' }}</span>{{ time(x.ts) }}</span>
        </div>
        <div class="row">
          <span class="chip" *ngIf="h.punch?.require_gps"><span class="material-icons" aria-hidden="true">my_location</span>{{ 'GPS' | t }}</span>
          <span class="chip" *ngIf="h.punch?.require_selfie"><span class="material-icons" aria-hidden="true">photo_camera</span>{{ 'Selfie' | t }}</span>
        </div>
      </div>
    </section>
    <div class="tiles">
      <a class="tile" routerLink="/m/leave"><span>{{ (bal()?.name || 'Annual leave') | t }}</span><b>{{ bal() ? num(bal().balance) : '–' }}</b><small>{{ 'days left' | t }}</small></a>
      <a class="tile" routerLink="/m/payslips"><span>{{ 'Payslip' | t }}</span>
        <b style="font-size:17px;line-height:24px">{{ h.payslip?.period || h.ess?.last_payslip?.period || h.ess?.next_payslip?.period || '–' }}</b>
        <small>{{ (h.payslip || h.ess?.last_payslip) ? ('Ready' | t) : (h.ess?.next_payslip?.state || '' | t) }}</small></a>
      <a class="tile alert" routerLink="/m/approvals" *ngIf="h.approvals"><span>{{ 'Waiting for you' | t }}</span><b>{{ h.approvals }}</b><small>{{ 'approvals' | t }}</small></a>
      <div class="tile" *ngIf="!h.approvals && h.holidays?.length"><span>{{ 'Next holiday' | t }}</span><b style="font-size:17px;line-height:24px">{{ d(h.holidays[0].from) }}</b><small>{{ h.holidays[0].name | t }}</small></div>
      <a class="tile" routerLink="/m/attendance"><span>{{ 'This month' | t }}</span><b>{{ h.month?.present ?? '–' }}</b><small>{{ 'days present' | t }}<ng-container *ngIf="h.month?.late"> · {{ '{0} late' | t:h.month.late }}</ng-container></small></a>
    </div>
    <section class="card">
      <h2>{{ 'Quick actions' | t }}</h2>
      <div class="list">
        <a class="li" routerLink="/m/leave" [queryParams]="{ new: 1 }"><span class="ic"><span class="material-icons" aria-hidden="true">beach_access</span></span><span class="tx"><b>{{ 'Request leave' | t }}</b><span>{{ 'Sent to your manager for approval' | t }}</span></span><span class="material-icons chev" aria-hidden="true">chevron_right</span></a>
        <a class="li" routerLink="/m/payslips"><span class="ic"><span class="material-icons" aria-hidden="true">receipt_long</span></span><span class="tx"><b>{{ 'Payslips' | t }}</b><span>{{ 'Open or share as PDF' | t }}</span></span><span class="material-icons chev" aria-hidden="true">chevron_right</span></a>
        <a class="li" routerLink="/m/requests"><span class="ic"><span class="material-icons" aria-hidden="true">assignment</span></span><span class="tx"><b>{{ 'My requests' | t }}</b><span>{{ 'Leave and other requests and where they are' | t }}</span></span><span class="material-icons chev" aria-hidden="true">chevron_right</span></a>
      </div>
    </section>
    <section class="card" *ngIf="h.holidays?.length">
      <h2>{{ 'Next holidays' | t }}</h2>
      <div class="list"><div class="li" *ngFor="let x of h.holidays"><span class="ic"><span class="material-icons" aria-hidden="true">celebration</span></span><span class="tx"><b>{{ x.name | t }}</b><span>{{ d(x.from) }}<ng-container *ngIf="x.to && x.to !== x.from"> – {{ d(x.to) }}</ng-container></span></span></div></div>
    </section>
  </ng-container>
</main>
<div class="mtoast" *ngIf="toast" [class.bad]="toastBad" role="status">{{ toast }}</div>`,
})
export class MHomeComponent implements OnInit, OnDestroy {
  h: any = null; msg = ''; now = ''; company = ''; toast = ''; toastBad = false;
  p: Punch;
  private tick: any;
  constructor(public m: ZeoMobileService, private router: Router, private cd: ChangeDetectorRef) { this.p = new Punch(m); }
  ngOnInit(): void {
    this.company = this.m.companyName();
    this.h = this.m.home;
    this.clock(); this.tick = setInterval(() => { this.clock(); this.cd.detectChanges(); }, 15000);
    void this.load();
  }
  ngOnDestroy(): void { clearInterval(this.tick); }
  private clock(): void { this.now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  async load(): Promise<void> {
    try { this.h = this.m.home = await this.m.get('/mobile-co/api/home/'); this.msg = ''; if (!this.company) { this.company = this.m.companyName(); } }
    catch (e: any) { if (e?.status === 401) { this.router.navigate(['/m']); return; } this.msg = errText(e, 'Could not load. Pull down or open again.'); }
    this.cd.detectChanges();
  }
  canPunch(): boolean { const ms = this.h?.punch?.methods; return !this.h?.punch?.error && (!ms || ms.includes('mobile')); }
  greet(): string {
    const n = (this.h?.employee?.name || this.m.user()?.username || '').split(' ')[0];
    const hr = new Date().getHours();
    return T(hr < 12 ? 'Good morning, {0}' : hr < 17 ? 'Good afternoon, {0}' : 'Good evening, {0}', n);
  }
  initials(): string { return (this.h?.employee?.name || this.m.user()?.username || '?').split(/\s+/).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase(); }
  bal(): any { const b = this.h?.leave_balances || []; return b.find((x: any) => /annual/i.test(x.name)) || b[0]; }
  num(v: any): string { const n = Number(v || 0); return Number.isInteger(n) ? String(n) : n.toFixed(1); }
  time(v: string): string { return hhmm(v); }
  d(v: string): string { return day(v); }
  companies(): void { this.router.navigate(['/m/companies']); }
  async punch(): Promise<void> {
    const r = await this.p.run(this.h);
    this.show(r.text, !r.ok);
    if (r.ok) { await this.load(); }
  }
  private show(t: string, bad: boolean): void { this.toast = t; this.toastBad = bad; this.cd.detectChanges(); setTimeout(() => { this.toast = ''; this.cd.detectChanges(); }, 4000); }
}

/** v1.25.0 – /m/attendance */
@Component({
  selector: 'zm-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<header class="ptitle"><h1>{{ 'Attendance' | t }}</h1></header>
<main class="page">
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <ng-container *ngIf="h">
    <section class="clock" *ngIf="canPunch(); else noMobile">
      <button type="button" class="dial" [class.out]="h.punch?.clocked_in" (click)="punch()" [disabled]="p.busy">
        <span class="t">{{ now }}</span><span class="l" *ngIf="!p.busy">{{ (h.punch?.clocked_in ? 'Check out' : 'Check in') | t }}</span><span class="spin" *ngIf="p.busy"></span></button>
      <div class="clock-info">
        <b>{{ today }}</b>
        <span *ngIf="h.punch?.shift?.start">{{ 'Shift {0} – {1}' | t:h.punch.shift.start:h.punch.shift.end }}</span>
        <span>{{ needs() }}</span>
      </div>
    </section>
    <ng-template #noMobile><div class="mmsg info">{{ (h.punch?.error || 'Your company records your attendance with a device or kiosk, not with the app.') | t }}</div></ng-template>
    <section class="card">
      <h2>{{ 'Today' | t }}</h2>
      <div class="list">
        <div class="li" *ngFor="let x of h.punch?.punches || []"><span class="ic"><span class="material-icons" aria-hidden="true">{{ x.kind === 'in' ? 'login' : x.kind === 'out' ? 'logout' : 'free_breakfast' }}</span></span>
          <span class="tx"><b>{{ kind(x.kind) | t }}</b><span>{{ 'From the app' | t }}</span></span><span class="end"><b style="color:#231b2e;font-size:16px;font-weight:500">{{ time(x.ts) }}</b></span></div>
        <div class="empty" *ngIf="!(h.punch?.punches || []).length"><span class="material-icons">schedule</span>{{ 'No punch yet today.' | t }}</div>
      </div>
    </section>
    <section class="card" *ngIf="h.month">
      <h2>{{ h.month.month_label }}</h2>
      <div class="stats">
        <div><b>{{ h.month.present ?? 0 }}</b><span>{{ 'Present' | t }}</span></div>
        <div><b>{{ h.month.late ?? 0 }}</b><span>{{ 'Late' | t }}</span></div>
        <div><b>{{ h.month.absent ?? 0 }}</b><span>{{ 'Absent' | t }}</span></div>
        <div><b>{{ h.month.avg_hours ?? 0 }}</b><span>{{ 'Hours / day' | t }}</span></div>
      </div>
    </section>
    <p class="empty" style="padding:4px 8px">{{ 'Your location is sent only with each punch, never in the background.' | t }}</p>
  </ng-container>
  <ng-container *ngIf="!h && !msg"><div class="skel" style="height:168px"></div><div class="skel"></div></ng-container>
</main>
<div class="mtoast" *ngIf="toast" [class.bad]="toastBad" role="status">{{ toast }}</div>`,
})
export class MAttendanceComponent implements OnInit, OnDestroy {
  h: any = null; msg = ''; now = ''; today = ''; toast = ''; toastBad = false;
  p: Punch; private tick: any;
  constructor(public m: ZeoMobileService, private cd: ChangeDetectorRef) { this.p = new Punch(m); }
  ngOnInit(): void {
    this.h = this.m.home;
    const t = () => { this.now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); this.today = new Date().toLocaleDateString(i18nLang() === 'ar' ? 'ar-AE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); };
    t(); this.tick = setInterval(() => { t(); this.cd.detectChanges(); }, 15000);
    void this.load();
  }
  ngOnDestroy(): void { clearInterval(this.tick); }
  async load(): Promise<void> {
    try { this.h = this.m.home = await this.m.get('/mobile-co/api/home/'); this.msg = ''; } catch (e) { this.msg = errText(e, 'Could not load. Pull down or open again.'); }
    this.cd.detectChanges();
  }
  canPunch(): boolean { const ms = this.h?.punch?.methods; return !this.h?.punch?.error && (!ms || ms.includes('mobile')); }
  needs(): string {
    const p = this.h?.punch || {};
    if (p.require_gps && p.require_selfie) { return T('Your location and a selfie are sent with each punch.'); }
    if (p.require_gps) { return T('Your location is sent with each punch.'); }
    if (p.require_selfie) { return T('A selfie is sent with each punch.'); }
    return T('Tap the clock to punch.');
  }
  kind(k: string): string { return KIND[k] || k; }
  time(v: string): string { return hhmm(v); }
  async punch(): Promise<void> {
    const r = await this.p.run(this.h);
    this.toast = r.text; this.toastBad = !r.ok; this.cd.detectChanges();
    setTimeout(() => { this.toast = ''; this.cd.detectChanges(); }, 4000);
    if (r.ok) { await this.load(); }
  }
}

/** v1.25.0 – /m/leave: balances, request, my requests (withdraw while pending). */
@Component({
  selector: 'zm-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<header class="ptitle"><h1 class="grow">{{ 'Leave' | t }}</h1><button type="button" class="mbtn sm" (click)="openNew()" [disabled]="!empId">{{ 'Request leave' | t }}</button></header>
<main class="page">
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <div class="mmsg ok" *ngIf="ok">{{ ok }}</div>
  <section class="card" *ngIf="balances.length">
    <h2>{{ 'Balance' | t }}</h2>
    <div class="bal"><div *ngFor="let b of balances"><b>{{ num(b.balance) }}</b><span>{{ (b.leave_type_name || b.leave_type) | t }}</span></div></div>
  </section>
  <section class="card">
    <h2>{{ 'My leave requests' | t }}</h2>
    <div class="list">
      <div class="li" *ngFor="let r of rows">
        <span class="ic"><span class="material-icons" aria-hidden="true">event</span></span>
        <span class="tx"><b>{{ r.leave_type | t }}</b><span>{{ d(r.start_date) }}<ng-container *ngIf="r.end_date !== r.start_date"> – {{ d(r.end_date) }}</ng-container> · {{ '{0} d' | t:num(r.number_of_days) }}</span></span>
        <span class="end"><span class="st" [ngClass]="key(r.status)">{{ lbl(r.status) | t }}</span>
          <button type="button" class="mlink" style="padding:0;font-size:13px" *ngIf="key(r.status) === 'pending'" (click)="withdraw(r)">{{ 'Withdraw' | t }}</button></span>
      </div>
      <div class="empty" *ngIf="loaded && !rows.length"><span class="material-icons">beach_access</span>{{ 'No leave requests yet.' | t }}</div>
      <div class="skel" *ngIf="!loaded"></div>
    </div>
  </section>
</main>
<div class="sheet-bg" *ngIf="f" (click)="f = null">
  <form class="sheet" (click)="$event.stopPropagation()" (ngSubmit)="save()">
    <span class="grip"></span>
    <h2>{{ 'Request leave' | t }}</h2>
    <label class="mfield">{{ 'Leave type' | t }}<select name="lt" [(ngModel)]="f.leave_type"><option [ngValue]="null">{{ 'Choose' | t }}</option>
      <option *ngFor="let t of types" [ngValue]="t.id">{{ t.name | t }}</option></select></label>
    <div class="row2">
      <label class="mfield">{{ 'From' | t }}<input name="s" type="date" [(ngModel)]="f.start_date" (change)="!f.end_date || f.end_date < f.start_date ? f.end_date = f.start_date : null"></label>
      <label class="mfield">{{ 'To' | t }}<input name="e" type="date" [(ngModel)]="f.end_date" [min]="f.start_date"></label>
    </div>
    <label class="check"><input type="checkbox" name="h" [(ngModel)]="f.dis_half_day"> {{ 'Half day' | t }}</label>
    <div class="seg" *ngIf="f.dis_half_day"><button type="button" [class.on]="f.half_day_period === 'first_half'" (click)="f.half_day_period = 'first_half'">{{ 'First half' | t }}</button>
      <button type="button" [class.on]="f.half_day_period === 'second_half'" (click)="f.half_day_period = 'second_half'">{{ 'Second half' | t }}</button></div>
    <label class="mfield">{{ 'Reason' | t }}<textarea name="r" [(ngModel)]="f.reason" maxlength="500"></textarea></label>
    <div class="mmsg" *ngIf="ferr">{{ ferr }}</div>
    <button type="submit" class="mbtn" [disabled]="busy"><span class="spin" *ngIf="busy"></span>{{ 'Send for approval' | t }}</button>
    <button type="button" class="mbtn ghost" (click)="f = null">{{ 'Cancel' | t }}</button>
  </form>
</div>`,
})
export class MLeaveComponent implements OnInit {
  rows: any[] = []; balances: any[] = []; types: any[] = []; empId: any = null; empCode = '';
  loaded = false; msg = ''; ok = ''; f: any = null; ferr = ''; busy = false;
  constructor(private m: ZeoMobileService, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    try {
      const h = this.m.home || (this.m.home = await this.m.get('/mobile-co/api/home/'));
      this.empId = h?.employee?.id; this.empCode = h?.employee?.code || '';
      if (!this.empId) { this.msg = T('This login is not linked to an employee record.'); }
    } catch (e) { this.msg = errText(e, 'Could not load your leave.'); }
    await this.load();
    if (this.route.snapshot.queryParamMap.get('new')) { this.openNew(); }
  }
  async load(): Promise<void> {
    if (!this.empId) { this.loaded = true; this.cd.detectChanges(); return; }
    try {
      const [list, bal]: any[] = await Promise.all([this.m.get('/calendars/api/emp-leave-request/'), this.m.get(`/employee/api/Employee/${this.empId}/leave_balance/`)]);
      const rows = Array.isArray(list) ? list : list.results || [];
      this.rows = rows.filter((r: any) => !this.empCode || r.employee === this.empCode).sort((a: any, b: any) => (b.start_date || '').localeCompare(a.start_date || ''));
      this.balances = (bal.leave_balance || []).filter((b: any) => b.include_dashboard !== false && (b.balance || b.openings));
      this.types = bal.available_leave_types || [];
    } catch (e) { this.msg = errText(e, 'Could not load your leave.'); }
    this.loaded = true; this.cd.detectChanges();
  }
  num(v: any): string { const n = Number(v || 0); return Number.isInteger(n) ? String(n) : n.toFixed(1); }
  d(v: string): string { return day(v); }
  key(s: string): string { return stKey(s); }
  lbl(s: string): string { return stLabel(s); }
  openNew(): void { this.ok = ''; this.ferr = ''; this.f = { leave_type: null, start_date: '', end_date: '', reason: '', dis_half_day: false, half_day_period: 'first_half' }; }
  async save(): Promise<void> {
    const f = this.f;
    if (!f.leave_type) { this.ferr = T('Choose the leave type.'); return; }
    if (!f.start_date || !f.end_date) { this.ferr = T('Choose the first and last day of the leave.'); return; }
    if (f.end_date < f.start_date) { this.ferr = T('The last day cannot be before the first day.'); return; }
    if (!String(f.reason || '').trim()) { this.ferr = T('Give the reason for the leave.'); return; }
    const body: any = { employee: this.empId, leave_type: f.leave_type, start_date: f.start_date, end_date: f.end_date, reason: f.reason || '', dis_half_day: !!f.dis_half_day };
    if (f.dis_half_day) { body.half_day_period = f.half_day_period; }
    this.busy = true; this.ferr = '';
    try { await this.m.post('/calendars/api/emp-leave-request/', body); this.f = null; this.ok = T('Your leave request was sent for approval.'); await this.load(); }
    catch (e) { this.ferr = errText(e, 'The leave request could not be saved.'); }
    this.busy = false; this.cd.detectChanges();
  }
  async withdraw(r: any): Promise<void> {
    if (!confirm(T('Withdraw this leave request?'))) { return; }
    try { await this.m.del(`/calendars/api/emp-leave-request/${r.id}/`); this.ok = T('Leave request withdrawn.'); await this.load(); }
    catch (e) { this.msg = errText(e, 'The request could not be withdrawn.'); this.cd.detectChanges(); }
  }
}

/** v1.25.0 – /m/payslips */
@Component({
  selector: 'zm-payslips',
  standalone: true,
  imports: [CommonModule, RouterModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<header class="ptitle"><button type="button" class="back" (click)="back()" [attr.aria-label]="'Back' | t"><span class="material-icons">arrow_back</span></button><h1>{{ 'Payslips' | t }}</h1></header>
<main class="page">
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <section class="card" *ngIf="ytd?.payslips">
    <h2>{{ 'Year {0}' | t:ytd.year }}</h2>
    <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <div><b>{{ money(ytd.gross) }}</b><span>{{ 'Gross' | t }}</span></div><div><b>{{ money(ytd.deductions) }}</b><span>{{ 'Deductions' | t }}</span></div><div><b>{{ money(ytd.net) }}</b><span>{{ 'Net' | t }}</span></div></div>
  </section>
  <div class="mmsg info" *ngIf="next">{{ 'Next payslip: {0} – {1}' | t:next.period:(next.state | t) }}</div>
  <section class="card">
    <div class="list">
      <button type="button" class="li" *ngFor="let p of list" (click)="open(p)" [disabled]="busy === p.id">
        <span class="ic"><span class="material-icons" aria-hidden="true">receipt_long</span></span>
        <span class="tx"><b>{{ p.period }}</b><span>{{ 'Net {0}' | t:money(p.net) }} · {{ '{0} of {1} days' | t:p.days_worked:p.working_days }}</span></span>
        <span class="end"><span class="spin dark" *ngIf="busy === p.id"></span><span class="material-icons" *ngIf="busy !== p.id" style="color:#5b2087" aria-hidden="true">picture_as_pdf</span></span></button>
      <div class="empty" *ngIf="loaded && !list.length"><span class="material-icons">receipt_long</span>{{ 'No payslips yet. They appear here when payroll is approved.' | t }}</div>
      <div class="skel" *ngIf="!loaded"></div>
    </div>
  </section>
</main>`,
})
export class MPayslipsComponent implements OnInit {
  list: any[] = []; ytd: any = null; next: any = null; loaded = false; msg = ''; busy: any = null;
  constructor(private m: ZeoMobileService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    try { const r: any = await this.m.get('/self-service/api/payslips/'); this.list = r.payslips || []; this.ytd = r.ytd; this.next = r.next; }
    catch (e) { this.msg = errText(e, 'Your payslips could not be loaded.'); }
    this.loaded = true; this.cd.detectChanges();
  }
  money(v: any): string { return Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  back(): void { history.back(); }
  async open(p: any): Promise<void> {
    this.busy = p.id; this.msg = ''; this.cd.detectChanges();
    try { const b = await this.m.blob(`/self-service/api/payslips/${p.id}/pdf/`); await this.m.openFile(b, `payslip-${p.year}-${String(p.month).padStart(2, '0')}.pdf`); }
    catch (e) { this.msg = errText(e, 'The payslip PDF could not be downloaded.'); }
    this.busy = null; this.cd.detectChanges();
  }
}

/** v1.25.0 – /m/approvals: decide on the phone (leave, late in, general / document requests, assets, loans, advances, air tickets, resignations). */
@Component({
  selector: 'zm-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<header class="ptitle"><h1>{{ 'Approvals' | t }}</h1></header>
<main class="page">
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <div class="mmsg ok" *ngIf="ok">{{ ok }}</div>
  <section class="card" *ngFor="let a of list">
    <div style="display:flex;gap:12px;align-items:flex-start">
      <span class="ic" style="width:40px;height:40px;border-radius:12px;background:#f4e8e8;color:#5b2087;display:flex;align-items:center;justify-content:center;flex:none"><span class="material-icons" aria-hidden="true">{{ icon(a.module) }}</span></span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-weight:500;font-size:15.5px">{{ a.employee }}</b><span class="st pending">{{ a.label }}</span></div>
        <div style="font-size:14px;margin-top:4px">{{ a.summary }}</div>
        <div style="font-size:12.5px;color:#6e6578;margin-top:4px">{{ a.document_number }} · {{ d(a.date) }}<ng-container *ngIf="a.level"> · {{ 'Level {0}' | t:a.level }}</ng-container></div>
      </div>
    </div>
    <div class="row2" style="margin-top:12px" *ngIf="a.in_app">
      <button type="button" class="mbtn ghost sm" style="width:100%" (click)="reject(a)" [disabled]="busy">{{ 'Reject' | t }}</button>
      <button type="button" class="mbtn sm" style="width:100%" (click)="approve(a)" [disabled]="busy">{{ 'Approve' | t }}</button></div>
    <div class="mmsg info" style="margin-top:10px" *ngIf="!a.in_app">{{ 'Open ZEO on a computer to decide on this one.' | t }}</div>
  </section>
  <div class="card empty" *ngIf="loaded && !list.length"><span class="material-icons">task_alt</span>{{ 'Nothing is waiting for you.' | t }}</div>
  <div class="skel" *ngIf="!loaded"></div>
</main>
<div class="sheet-bg" *ngIf="rej" (click)="rej = null">
  <form class="sheet" (click)="$event.stopPropagation()" (ngSubmit)="sendReject()">
    <span class="grip"></span><h2>{{ 'Reject' | t }} – {{ rej.employee }}</h2>
    <label class="mfield">{{ 'Reason' | t }}<textarea name="r" [(ngModel)]="reason" maxlength="500"></textarea></label>
    <button type="submit" class="mbtn" [disabled]="busy || !reason.trim()">{{ 'Reject' | t }}</button>
    <button type="button" class="mbtn ghost" (click)="rej = null">{{ 'Cancel' | t }}</button>
  </form>
</div>`,
})
export class MApprovalsComponent implements OnInit {
  list: any[] = []; loaded = false; msg = ''; ok = ''; busy = false; rej: any = null; reason = '';
  constructor(private m: ZeoMobileService, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { void this.load(); }
  async load(): Promise<void> {
    try { this.list = await this.m.get('/mobile-co/api/approvals/'); if (this.m.home) { this.m.home.approvals = this.list.length; } }
    catch (e) { this.msg = errText(e, 'Could not load the approvals.'); }
    this.loaded = true; this.cd.detectChanges();
  }
  d(v: string): string { return day(v); }
  icon(m: string): string { return ({ leave: 'beach_access', latein: 'alarm', loan: 'payments', advance: 'payments', airticket: 'flight', asset: 'devices', document: 'description', resignation: 'logout' } as any)[m] || 'assignment'; }
  private async act(a: any, act: string, body: any): Promise<void> {
    this.busy = true; this.msg = ''; this.ok = '';
    try { const r: any = await this.m.post(`/mobile-co/api/approvals/${a.module}/${a.approval_id}/${act}/`, body); this.ok = `${a.employee}: ${r.detail}`; this.rej = null; await this.load(); }
    catch (e) { this.msg = errText(e, 'It could not be saved.'); }
    this.busy = false; this.cd.detectChanges();
  }
  approve(a: any): Promise<void> { return this.act(a, 'approve', {}); }
  reject(a: any): void { this.rej = a; this.reason = ''; }
  sendReject(): Promise<void> { return this.act(this.rej, 'reject', { reason: this.reason.trim(), note: this.reason.trim() }); }
}

/** v1.25.0 – /m/requests */
@Component({
  selector: 'zm-requests',
  standalone: true,
  imports: [CommonModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<header class="ptitle"><button type="button" class="back" (click)="back()" [attr.aria-label]="'Back' | t"><span class="material-icons">arrow_back</span></button><h1>{{ 'My requests' | t }}</h1></header>
<main class="page">
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <section class="card"><div class="list">
    <div class="li" *ngFor="let r of list"><span class="ic"><span class="material-icons" aria-hidden="true">assignment</span></span>
      <span class="tx"><b>{{ r.label }}</b><span>{{ r.summary }}</span></span>
      <span class="end"><span class="st" [ngClass]="key(r.status_key || r.status)">{{ lbl(r.status) | t }}</span><span>{{ d(r.date) }}</span></span></div>
    <div class="empty" *ngIf="loaded && !list.length"><span class="material-icons">assignment</span>{{ 'No requests yet.' | t }}</div>
    <div class="skel" *ngIf="!loaded"></div>
  </div></section>
</main>`,
})
export class MRequestsComponent implements OnInit {
  list: any[] = []; loaded = false; msg = '';
  constructor(private m: ZeoMobileService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    try { this.list = await this.m.get('/mobile-co/api/requests/'); } catch (e) { this.msg = errText(e, 'Could not load your requests.'); }
    this.loaded = true; this.cd.detectChanges();
  }
  key(s: string): string { return stKey(s); }
  lbl(s: string): string { return stLabel(s); }
  d(v: string): string { return day(v); }
  back(): void { history.back(); }
}

/** v1.25.0 – /m/more: profile, payslips, requests, fingerprint, phones, language, server, full ZEO, sign out. */
@Component({
  selector: 'zm-more',
  standalone: true,
  imports: [CommonModule, RouterModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<header class="ptitle"><h1>{{ 'More' | t }}</h1></header>
<main class="page">
  <section class="card" *ngIf="h?.employee as e">
    <div class="li" style="border:0;padding:0"><span class="avatar" style="width:52px;height:52px;margin:0;font-size:18px">{{ initials(e.name) }}</span>
      <span class="tx"><b style="font-size:17px">{{ e.name }}</b><span>{{ e.code }} · {{ e.designation || '' }}</span><span>{{ e.department || '' }}</span></span></div>
  </section>
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <div class="mmsg ok" *ngIf="ok">{{ ok }}</div>
  <section class="card"><div class="list">
    <a class="li" routerLink="/m/payslips"><span class="ic"><span class="material-icons" aria-hidden="true">receipt_long</span></span><span class="tx"><b>{{ 'Payslips' | t }}</b></span><span class="material-icons chev" aria-hidden="true">chevron_right</span></a>
    <a class="li" routerLink="/m/requests"><span class="ic"><span class="material-icons" aria-hidden="true">assignment</span></span><span class="tx"><b>{{ 'My requests' | t }}</b></span><span class="material-icons chev" aria-hidden="true">chevron_right</span></a>
    <button type="button" class="li" (click)="full()"><span class="ic"><span class="material-icons" aria-hidden="true">open_in_new</span></span><span class="tx"><b>{{ 'Open full ZEO' | t }}</b><span>{{ 'Letters, documents, expenses and every other screen' | t }}</span></span><span class="material-icons chev" aria-hidden="true">chevron_right</span></button>
    <button type="button" class="li" (click)="companies()"><span class="ic"><span class="material-icons" aria-hidden="true">domain</span></span><span class="tx"><b>{{ 'Switch company' | t }}</b><span>{{ company }}</span></span><span class="material-icons chev" aria-hidden="true">chevron_right</span></button>
  </div></section>
  <section class="card"><h2>{{ 'This phone' | t }}</h2><div class="list">
    <div class="li" *ngIf="bio.ok"><span class="ic"><span class="material-icons" aria-hidden="true">fingerprint</span></span><span class="tx"><b>{{ 'Fingerprint sign-in' | t }}</b><span>{{ (bioOn ? 'On' : 'Off') | t }}</span></span>
      <button type="button" class="mbtn sm" [class.ghost]="bioOn" (click)="toggleBio()" [disabled]="busy">{{ (bioOn ? 'Turn off' : 'Turn on') | t }}</button></div>
    <div class="li"><span class="ic"><span class="material-icons" aria-hidden="true">notifications</span></span><span class="tx"><b>{{ 'Notifications' | t }}</b>
      <span>{{ (pushBuilt ? (serverPush ? 'Leave decisions, approvals and payslips' : 'The server has not set up notifications yet') : 'Available in the app from the Play Store') | t }}</span></span></div>
    <div class="li"><span class="ic"><span class="material-icons" aria-hidden="true">translate</span></span><span class="tx"><b>{{ 'Language' | t }}</b></span><z-lang-picker variant="select" [reload]="true" [showAlways]="true"></z-lang-picker></div>
    <div class="li"><span class="ic"><span class="material-icons" aria-hidden="true">dns</span></span><span class="tx"><b>{{ 'Server' | t }}</b><span>{{ server }}</span></span>
      <button type="button" class="mbtn ghost sm" (click)="changeServer()">{{ 'Change' | t }}</button></div>
  </div></section>
  <section class="card" *ngIf="devices.length > 1"><h2>{{ 'Phones signed in' | t }}</h2><div class="list">
    <div class="li" *ngFor="let d of devices"><span class="ic"><span class="material-icons" aria-hidden="true">smartphone</span></span>
      <span class="tx"><b>{{ d.model || d.platform }}<ng-container *ngIf="d.this"> · {{ 'this phone' | t }}</ng-container></b><span>{{ 'Last used {0}' | t:when(d.last_seen) }}</span></span>
      <button type="button" class="mbtn ghost sm" *ngIf="!d.this" (click)="signOutPhone(d)">{{ 'Sign out' | t }}</button></div>
  </div></section>
  <button type="button" class="mbtn ghost" (click)="out()">{{ 'Sign out' | t }}</button>
  <p class="empty" style="padding:0 0 12px">ZEO {{ ver }} · {{ 'server' | t }} {{ serverVer }}</p>
</main>`,
})
export class MMoreComponent implements OnInit {
  h: any = null; msg = ''; ok = ''; busy = false; bio = { ok: false, kind: '' }; bioOn = false; devices: any[] = [];
  company = ''; server = ''; ver = ''; serverVer = ''; pushBuilt = false; serverPush = false;
  constructor(private m: ZeoMobileService, private router: Router, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    this.h = this.m.home; this.company = this.m.companyName(); this.server = this.m.server().replace(/^https?:\/\//, ''); this.ver = this.m.appVersion;
    this.pushBuilt = this.m.pushBuilt(); this.bioOn = this.m.biometricOn();
    this.bio = await this.m.biometricAvailable();
    try { const i: any = await this.m.get('/mobile/api/info/', false); this.serverVer = i.server_version; this.serverPush = !!i.push; } catch { /* offline */ }
    try { this.devices = await this.m.get('/mobile/api/devices/', false); } catch { this.devices = []; }
    if (!this.h) { try { this.h = this.m.home = await this.m.get('/mobile-co/api/home/'); } catch { /* shown on home */ } }
    this.cd.detectChanges();
  }
  initials(n: string): string { return (n || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  when(v: string): string { return day(v); }
  async toggleBio(): Promise<void> {
    this.busy = true; this.msg = ''; this.ok = '';
    try { if (this.bioOn) { await this.m.disableBiometric(); this.ok = T('Fingerprint sign-in is off.'); } else { await this.m.enableBiometric(); this.ok = T('Fingerprint sign-in is on.'); } }
    catch (e) { this.msg = errText(e, 'It could not be changed.'); }
    this.bioOn = this.m.biometricOn(); this.busy = false; this.cd.detectChanges();
  }
  async signOutPhone(d: any): Promise<void> {
    try { await this.m.del(`/mobile/api/devices/${d.id}/`, false); this.devices = this.devices.filter(x => x.id !== d.id); this.ok = T('That phone was signed out.'); }
    catch (e) { this.msg = errText(e, 'It could not be changed.'); }
    this.cd.detectChanges();
  }
  full(): void { this.router.navigate(['/main-sidebar/home']); }   // v1.28.1: one Home for everyone
  companies(): void { this.router.navigate(['/m/companies']); }
  changeServer(): void { this.router.navigate(['/m/connect']); }
  out(): void { void this.m.signOut(); }
}
