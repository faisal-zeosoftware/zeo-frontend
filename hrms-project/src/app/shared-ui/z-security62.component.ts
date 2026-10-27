// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZRecordService } from './z-record.service';
import { httpErrorText } from './z-http-error.interceptor';
import { TPipe, ZDatePipe, i18nT } from './i18n.service';
import { ZAD_STYLES, ZAdminBase, downloadBlob } from './z-admin-pages.component';

/**
 * v1.62.0 – security and history screens (README-UPDATE section 83):
 *  ZActivateComponent          /activate – an employee without e-mail activates the login with the slip / WhatsApp code, or resets it
 *  ZSecurityDashboardComponent Settings › Security dashboard – users without the authenticator, wrong passwords, sign-ins, API keys,
 *                              exports, administrators, security events
 *  ZGiveAccessComponent        Employees › Give access – logins with and without e-mail (link, code, slip, generated password …)
 *  ZBankChangesComponent       Employees › Bank-detail changes – the second person approves
 *  ZHistoryCleaningComponent   Settings › Data retention › Log and history retention (also on its own page)
 */

function bytes(n: number): string {
  if (!n) { return '0'; }
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
}

/* ------------------------------------------------------------------------------------------------ /activate (no login) */
@Component({
  selector: 'z-activate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [`
  .zac { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f4f5fa; padding: 16px; }
  .zac-box { background: #fff; border-radius: 16px; border: 1px solid #e3e6ea; padding: 26px 24px; width: 100%; max-width: 440px; }
  .zac h1 { font-size: 22px; margin: 0 0 6px; color: #1b1640; } .zac p { color: #5d6670; font-size: 14px; margin: 0 0 14px; line-height: 1.5; }
  .zac label { display: flex; flex-direction: column; gap: 5px; font-size: 13.5px; color: #3c4450; margin-bottom: 14px; }
  .zac input { padding: 13px 12px; border: 1px solid #cfd5dc; border-radius: 10px; font: inherit; font-size: 17px; }
  .zac-big { width: 100%; padding: 15px; border: 0; border-radius: 10px; background: #5b4fe0; color: #fff; font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; }
  .zac-big.alt { background: #fff; color: #1b1640; border: 1px solid #cfd5dc; } .zac-big:disabled { opacity: .6; }
  .zac-err { color: #9b2c24; font-size: 14px; margin: 0 0 12px; } .zac-ok { color: #1d6b37; font-size: 14px; margin: 0 0 12px; }
  .zac-steps { display: flex; gap: 6px; margin: 0 0 16px; } .zac-steps span { flex: 1; height: 5px; border-radius: 3px; background: #e3e6ea; }
  .zac-steps span.on { background: #5b4fe0; } .zac a { color: #5b4fe0; font-size: 14px; } .zac-ico { font-size: 22px; }
  .zac-lang { float: inline-end; border: 1px solid #cfd5dc; background: #fff; border-radius: 8px; padding: 4px 10px; cursor: pointer; font-size: 13px; }`],
  template: `
<div class="zac" data-activate [attr.dir]="ar ? 'rtl' : 'ltr'"><div class="zac-box">
  <button type="button" class="zac-lang" (click)="toggleLang()">{{ ar ? 'English' : 'العربية' }}</button>
  <div class="zac-steps" aria-hidden="true"><span [class.on]="step >= 1"></span><span [class.on]="step >= 2"></span><span [class.on]="step >= 3"></span></div>
  <ng-container *ngIf="step === 1">
    <h1>{{ L('Activate your ZEO login') }}</h1>
    <p>{{ L('Type your user name (your employee code) from the slip, or ask for a code on WhatsApp / SMS.') }}</p>
    <p class="zac-err" *ngIf="err" role="alert">{{ err }}</p>
    <label>{{ L('User name') }}<input [(ngModel)]="u" autocomplete="username" autocapitalize="none" data-act-user></label>
    <button type="button" class="zac-big" (click)="haveCode()" [disabled]="!u" data-act-have><span class="zac-ico">🔑</span>{{ L('I have a code (slip or message)') }}</button>
    <button type="button" class="zac-big alt" (click)="send()" [disabled]="!u || busy" data-act-send><span class="zac-ico">💬</span>{{ L('Send me a code on WhatsApp / SMS') }}</button>
    <p style="margin-top:8px"><a routerLink="/login">{{ L('Back to sign in') }}</a></p>
  </ng-container>
  <ng-container *ngIf="step === 2">
    <h1>{{ L('Type the code and your new password') }}</h1>
    <p class="zac-ok" *ngIf="note">{{ note }}</p>
    <p class="zac-err" *ngIf="err" role="alert">{{ err }}</p>
    <label>{{ L('Code') }}<input [(ngModel)]="c" autocomplete="one-time-code" autocapitalize="characters" data-act-code></label>
    <label>{{ L('New password') }}<input type="password" [(ngModel)]="pw" autocomplete="new-password" data-act-pw></label>
    <label>{{ L('The same password again') }}<input type="password" [(ngModel)]="pw2" autocomplete="new-password" data-act-pw2></label>
    <button type="button" class="zac-big" (click)="save()" [disabled]="busy || !c || !pw" data-act-save><span class="zac-ico">✓</span>{{ L('Save my password') }}</button>
    <button type="button" class="zac-big alt" (click)="step = 1; err = ''">{{ L('Back') }}</button>
  </ng-container>
  <ng-container *ngIf="step === 3">
    <h1>{{ L('Done') }}</h1>
    <p class="zac-ok" data-act-done>{{ L('Your password is set. Sign in with your user name and your new password.') }}</p>
    <a class="zac-big" routerLink="/login" style="text-decoration:none">{{ L('Sign in') }}</a>
  </ng-container>
</div></div>`,
})
export class ZActivateComponent implements OnInit {
  step = 1; u = ''; c = ''; pw = ''; pw2 = ''; err = ''; note = ''; busy = false; ar = false;
  private AR: Record<string, string> = {
    'Activate your ZEO login': 'تفعيل حسابك في زيو', 'Type your user name (your employee code) from the slip, or ask for a code on WhatsApp / SMS.':
      'اكتب اسم المستخدم (رقمك الوظيفي) من الورقة، أو اطلب رمزاً عبر واتساب / رسالة نصية.', 'User name': 'اسم المستخدم',
    'I have a code (slip or message)': 'لدي رمز (ورقة أو رسالة)', 'Send me a code on WhatsApp / SMS': 'أرسل لي رمزاً عبر واتساب / رسالة نصية',
    'Back to sign in': 'العودة لتسجيل الدخول', 'Type the code and your new password': 'اكتب الرمز وكلمة المرور الجديدة', 'Code': 'الرمز',
    'New password': 'كلمة المرور الجديدة', 'The same password again': 'كلمة المرور مرة أخرى', 'Save my password': 'حفظ كلمة المرور', 'Back': 'رجوع',
    'Done': 'تم', 'Your password is set. Sign in with your user name and your new password.': 'تم حفظ كلمة المرور. سجّل الدخول باسم المستخدم وكلمة المرور الجديدة.',
    'Sign in': 'تسجيل الدخول', 'The two passwords are not the same.': 'كلمتا المرور غير متطابقتين.',
    'If your user name is right and HR set up WhatsApp / SMS, a code is on its way to your mobile.': 'إذا كان اسم المستخدم صحيحاً وكان واتساب / الرسائل مفعّلاً، فالرمز في طريقه إلى هاتفك.',
  };
  constructor(private http: HttpClient, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}
  L(s: string): string { return this.ar ? (this.AR[s] || i18nT(s)) : i18nT(s); }
  toggleLang(): void { this.ar = !this.ar; }
  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.u = q.get('u') || ''; this.c = q.get('c') || '';
    try { this.ar = (localStorage.getItem('zeo_lang') || navigator.language || '').startsWith('ar'); } catch { this.ar = false; }
    if (this.u && this.c) { this.step = 2; }
  }
  private api(p: string): string { return `${environment.apiBaseUrl}/users/${p}`; }
  haveCode(): void { this.err = ''; this.note = ''; this.step = 2; }
  async send(): Promise<void> {
    this.busy = true; this.err = '';
    try { const r: any = await firstValueFrom(this.http.post(this.api('activate/send/'), { username: this.u.trim() })); this.note = this.L(r.detail); this.step = 2; }
    catch (e) { this.err = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }
  async save(): Promise<void> {
    if (this.pw !== this.pw2) { this.err = this.L('The two passwords are not the same.'); return; }
    this.busy = true; this.err = '';
    try { await firstValueFrom(this.http.post(this.api('activate/'), { username: this.u.trim(), code: this.c.trim(), password: this.pw })); this.step = 3; }
    catch (e) { this.err = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }
}

/* ------------------------------------------------------------------------------------------------ security dashboard */
@Component({
  selector: 'z-security-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, TPipe, ZDatePipe, RouterModule],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES + ` .zsd-k { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin-bottom: 14px; }
    .zsd-k div { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 10px 12px; } .zsd-k b { display: block; font-size: 22px; color: #1b1640; }
    .zsd-k span { font-size: 12px; color: #5d6670; }`],
  template: `
<div class="zad" data-security-dashboard>
  <h2>Security dashboard</h2>
  <p class="zad-muted">Who could be a weak point, what happened in the last days, and what left the system. Administrators only.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <ng-container *ngIf="d">
    <div class="zsd-k">
      <div data-k-no2fa><b>{{ d.without_authenticator.length }}</b><span>staff users without the authenticator app (of {{ d.staff }})</span></div>
      <div data-k-failed><b>{{ d.failed_week }}</b><span>wrong passwords / codes in 7 days</span></div>
      <div><b>{{ d.locked.length }}</b><span>accounts locked now</span></div>
      <div><b>{{ d.session_count }}</b><span>active sign-ins</span></div>
      <div><b>{{ d.api_keys.length }}</b><span>API keys</span></div>
      <div><b>{{ d.exports.length }}</b><span>exports in 30 days</span></div>
    </div>
    <section class="zad-card" data-events><h3><mat-icon>report</mat-icon>Security events (30 days)</h3>
      <table class="zad-t" *ngIf="d.events.length; else noE"><tr><th>When</th><th>What</th><th>User</th><th>Detail</th><th>Address</th></tr>
        <tr *ngFor="let e of d.events" [attr.data-event]="e.kind"><td>{{ e.at | date:'d MMM, HH:mm' }}</td><td>{{ e.kind_text | t }}<span class="zad-pill" *ngIf="e.emailed"> e-mailed</span></td>
          <td>{{ e.user }}<div class="zad-muted" *ngIf="e.by && e.by !== e.user">by {{ e.by }}</div></td><td>{{ e.detail }}</td><td>{{ e.ip }}</td></tr></table>
      <ng-template #noE><p class="zad-muted">Nothing in the last 30 days.</p></ng-template></section>
    <section class="zad-card"><h3><mat-icon>phonelink_lock</mat-icon>Staff users without the authenticator app</h3>
      <p class="zad-muted" *ngIf="!d.without_authenticator.length">Every staff user has it.</p>
      <table class="zad-t" *ngIf="d.without_authenticator.length"><tr *ngFor="let u of d.without_authenticator"><td><b>{{ u.name }}</b> <span class="zad-pill warn" *ngIf="u.admin">administrator</span></td><td>{{ u.email }}</td></tr></table>
      <p class="zad-muted">Require it in <a routerLink="/main-sidebar/settings/sign-in-security">Sign-in security</a> (administrators, staff or everybody).</p></section>
    <section class="zad-card"><h3><mat-icon>password</mat-icon>Wrong passwords (7 days)</h3>
      <table class="zad-t" *ngIf="d.failed_by_user.length; else noF"><tr><th>User</th><th>Times</th><th>From</th></tr>
        <tr *ngFor="let f of d.failed_by_user"><td>{{ f.user }}</td><td>{{ f.count }}</td><td>{{ f.addresses.join(', ') }}</td></tr></table>
      <ng-template #noF><p class="zad-muted">None.</p></ng-template>
      <p class="zad-muted" *ngIf="d.locked.length">Locked now: {{ d.locked.join(', ') }}</p></section>
    <section class="zad-card"><h3><mat-icon>admin_panel_settings</mat-icon>Administrators</h3>
      <table class="zad-t"><tr *ngFor="let a of d.admins"><td><b>{{ a.name }}</b></td><td>{{ a.email }}</td><td><span class="zad-pill" [class.ok]="a.authenticator" [class.warn]="!a.authenticator">{{ a.authenticator ? 'authenticator on' : 'no authenticator' }}</span></td></tr></table></section>
    <section class="zad-card"><h3><mat-icon>devices</mat-icon>Active sign-ins</h3>
      <table class="zad-t"><tr><th>User</th><th>Device</th><th>Address</th><th>Since</th><th>Last used</th></tr>
        <tr *ngFor="let s of d.sessions"><td>{{ s.user }} <span class="zad-pill" *ngIf="s.admin">admin</span></td><td>{{ s.device }}</td><td>{{ s.ip }} {{ s.country }}</td>
          <td>{{ s.since | date:'d MMM, HH:mm' }}</td><td>{{ s.last_seen | date:'d MMM, HH:mm' }}</td></tr></table></section>
    <section class="zad-card"><h3><mat-icon>vpn_key</mat-icon>API keys</h3>
      <table class="zad-t" *ngIf="d.api_keys.length; else noK"><tr><th>Name</th><th>Acts as</th><th>Access</th><th>Last used</th><th>Expires</th></tr>
        <tr *ngFor="let k of d.api_keys"><td>{{ k.name }} <span class="zad-pill" *ngIf="!k.active">off</span></td><td>{{ k.user }}</td><td>{{ k.read_only ? 'read only' : 'read and write' }}<div class="zad-muted">{{ (k.scopes || []).join(', ') }}</div></td>
          <td>{{ k.last_used | date:'dd/MM/yyyy' }}</td><td>{{ k.expires | date:'dd/MM/yyyy' }}</td></tr></table>
      <ng-template #noK><p class="zad-muted">No API keys.</p></ng-template></section>
    <section class="zad-card" data-exports><h3><mat-icon>download</mat-icon>Exports (30 days)</h3>
      <table class="zad-t" *ngIf="d.exports.length; else noX"><tr><th>When</th><th>User</th><th>Screen</th><th>Kind</th><th>Rows</th><th></th></tr>
        <tr *ngFor="let x of d.exports"><td>{{ x.at | date:'d MMM, HH:mm' }}</td><td>{{ x.user }}</td><td style="word-break:break-all">{{ x.path }}</td><td>{{ x.kind }}</td><td>{{ x.rows }}</td>
          <td><span class="zad-pill bad" *ngIf="x.refused">refused – {{ x.refused }}</span></td></tr></table>
      <ng-template #noX><p class="zad-muted">No exports.</p></ng-template></section>
  </ng-container>
</div>`,
})
export class ZSecurityDashboardComponent extends ZAdminBase implements OnInit {
  d: any = null;
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await this.act(async () => { this.d = await this.get('/users/security/dashboard/'); }); }
}

/* ------------------------------------------------------------------------------------------------ give access */
@Component({
  selector: 'z-give-access',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES + ` .zga-ways { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; margin: 8px 0; }
    .zga-ways label { border: 1px solid #e3e6ea; border-radius: 10px; padding: 8px 10px; display: flex; gap: 8px; align-items: flex-start; cursor: pointer; font-size: 13px; }
    .zga-ways label.on { border-color: #5b4fe0; background: #f3f1ff; } .zga-ways small { display: block; color: #5d6670; font-size: 11.5px; }
    .zga-pw { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f4f5f7; padding: 2px 8px; border-radius: 5px; user-select: all; }`],
  template: `
<div class="zad" data-give-access>
  <h2>Give access</h2>
  <p class="zad-muted">Logins for employees – with and without e-mail. Choose the employees, then how the password is set. Nobody gets a shared password that others could use first.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card">
    <div class="zad-act" style="margin:0 0 8px">
      <select [(ngModel)]="flt" (change)="load()" aria-label="Show" data-ga-filter><option value="not_activated">Not activated (no login or never signed in)</option>
        <option value="no_login">No login</option><option value="">Everybody</option></select>
      <input [(ngModel)]="q" (keyup.enter)="load()" placeholder="Code or name" aria-label="Search" style="width:200px"><button type="button" class="zad-btn" (click)="load()">Search</button>
      <span class="zad-muted">{{ rows.length }} employee(s) · {{ sel.size }} chosen</span></div>
    <table class="zad-t"><tr><th><input type="checkbox" (change)="all($event)" aria-label="Choose all"></th><th>Employee</th><th>E-mail</th><th>Mobile</th><th>Sign-in ID</th><th>Login</th><th>Last given</th></tr>
      <tr *ngFor="let r of rows" [attr.data-ga-row]="r.code"><td><input type="checkbox" [checked]="sel.has(r.id)" (change)="tog(r.id)" [attr.aria-label]="r.name"></td>
        <td><b>{{ r.name }}</b><div class="zad-muted">{{ r.code }}{{ r.category ? ' · ' + r.category : '' }}</div></td><td>{{ r.email || '–' }}</td><td>{{ r.mobile ? '✓' : '–' }}</td>
        <td>{{ r.rule === 'email' ? 'e-mail required' : 'e-mail optional' }}</td>
        <td><span *ngIf="r.login">{{ r.login }} <span class="zad-pill" [class.ok]="r.activated" [class.warn]="!r.activated">{{ r.activated ? 'activated' : 'not activated' }}</span></span>
          <span *ngIf="!r.login" class="zad-muted">none</span><span class="zad-pill" *ngIf="r.kiosk_pin"> kiosk PIN</span></td>
        <td class="zad-muted">{{ r.last_way }}<div>{{ r.last_at | date:'dd/MM/yyyy' }}</div></td></tr></table>
  </section>
  <section class="zad-card" data-ga-ways>
    <h3><mat-icon>key</mat-icon>How the password is set</h3>
    <div class="zga-ways">
      <label *ngFor="let w of ways" [class.on]="way === w.k" [attr.data-way]="w.k"><input type="radio" name="way" [value]="w.k" [(ngModel)]="way" [disabled]="w.off">
        <span><b>{{ w.t | t }}</b><small>{{ w.d | t }}</small><small class="zad-bad" *ngIf="w.off">{{ w.off | t }}</small></span></label>
    </div>
    <div class="zad-grid" *ngIf="way === 'typed'"><label>Password<input type="text" [(ngModel)]="typed" autocomplete="off" data-ga-typed></label></div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="give()" [disabled]="busy || !sel.size" data-ga-give>Give access to {{ sel.size }} employee(s)</button></div>
  </section>
  <section class="zad-card" *ngIf="res" data-ga-result>
    <h3><mat-icon>task_alt</mat-icon>Result</h3>
    <table class="zad-t" *ngIf="res.done.length"><tr><th>Employee</th><th>How</th><th>Detail</th></tr>
      <tr *ngFor="let d of res.done" [attr.data-ga-done]="d.code"><td><b>{{ d.name }}</b><div class="zad-muted">{{ d.code }}</div></td><td>{{ d.method }}</td>
        <td>{{ d.detail }}<div *ngIf="d.password">{{ 'User name' | t }} <span class="zga-pw">{{ d.username }}</span> · {{ 'Password' | t }} <span class="zga-pw" data-ga-pw>{{ d.password }}</span>
          <span class="zad-muted"> – shown only now</span></div>
          <div *ngIf="d.pin">{{ 'Start PIN' | t }} <span class="zga-pw">{{ d.pin }}</span></div></td></tr></table>
    <div class="zad-act" *ngIf="res.slip_pdf"><button type="button" class="zad-btn primary" (click)="slips()" data-ga-slips>Print the slips (PDF)</button>
      <span class="zad-muted">Available for 15 minutes, once.</span></div>
    <div *ngIf="res.missed.length" style="margin-top:10px"><b>Not given ({{ res.missed.length }})</b>
      <table class="zad-t"><tr *ngFor="let m of res.missed" [attr.data-ga-missed]="m.code"><td><b>{{ m.name }}</b> <span class="zad-muted">{{ m.code }}</span></td><td class="zad-bad">{{ m.why }}</td></tr></table></div>
  </section>
  <section class="zad-card" *ngIf="grants.length"><h3><mat-icon>history</mat-icon>Recent</h3>
    <table class="zad-t"><tr *ngFor="let g of grants"><td>{{ g.at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ g.code }}</td><td>{{ g.method }}</td><td>{{ g.detail }}</td><td>{{ g.by }}</td></tr></table></section>
</div>`,
})
export class ZGiveAccessComponent extends ZAdminBase implements OnInit {
  rows: any[] = []; grants: any[] = []; sel = new Set<number>(); flt = 'not_activated'; q = ''; way = 'auto'; typed = ''; res: any = null; info: any = {};
  ways: any[] = [];
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await this.load(); }
  private build(): void {
    const p = this.info.policy || {};
    this.ways = [
      { k: 'auto', t: 'By the rule (recommended for many)', d: 'E-mail link where there is an e-mail; a WhatsApp / SMS code where there is a mobile; a printed slip for the rest.' },
      { k: 'link', t: 'Send set-password link', d: `One-time link by e-mail, valid ${p.link_hours || 24} hours. Nobody else knows the password.`, off: this.info.app_url ? '' : 'Set ZEO_APP_URL on the server first.' },
      { k: 'existing', t: 'Use existing login', d: 'The e-mail already has a ZEO login of another company: this company is added to it.' },
      { k: 'generate', t: 'Generate password', d: 'A strong random password shown once to you – copy, print or send it. Changed at the first sign-in.' },
      { k: 'code', t: 'Code by WhatsApp / SMS', d: 'A 6-digit code to the mobile on file; the employee opens /activate and chooses the password.', off: this.info.messaging ? '' : 'Set up WhatsApp / SMS first.' },
      { k: 'slip', t: 'Printed activation slip', d: 'A one-time code and QR code, valid 7 days, handed over and signed for. A new slip cancels the old one.' },
      { k: 'kiosk', t: 'Kiosk only', d: 'No login – the kiosk with the employee code and a start PIN the employee replaces at the first use.' },
      { k: 'typed', t: 'HR types a password', d: 'Changed at the first sign-in; the company password rules apply.', off: p.hr_types_password ? '' : 'Switched off in Sign-in security.' },
      { k: 'default', t: 'Company default password', d: `Self-service only; expires after ${p.default_password_days || 7} days; the first sign-in asks the Emirates ID digits and the date of birth; 3 wrong tries lock.`, off: p.default_password_on ? '' : 'Not switched on in Sign-in security.' },
    ];
  }
  async load(): Promise<void> {
    await this.act(async () => {
      const r = await this.get(`/zeo-admin/api/access/?filter=${this.flt}&q=${encodeURIComponent(this.q)}`);
      this.rows = r.rows; this.grants = r.grants; this.info = r; this.build();
      this.sel = new Set([...this.sel].filter(i => this.rows.some(x => x.id === i)));
    });
  }
  tog(id: number): void { if (this.sel.has(id)) { this.sel.delete(id); } else { this.sel.add(id); } }
  all(ev: Event): void { this.sel = (ev.target as HTMLInputElement).checked ? new Set(this.rows.map(r => r.id)) : new Set(); }
  async give(): Promise<void> {
    if (!confirm(`Give access to ${this.sel.size} employee(s) – ${(this.ways.find(w => w.k === this.way) || {}).t}?`)) { return; }
    await this.act(async () => {
      this.res = await this.post('/zeo-admin/api/access/', { employee_ids: [...this.sel], method: this.way, password: this.typed });
      this.say(`${this.res.done.length} given, ${this.res.missed.length} not given.`, !!this.res.missed.length && !this.res.done.length);
    });
    this.typed = ''; this.sel.clear(); await this.reloadKeep();
  }
  private async reloadKeep(): Promise<void> { const keep = this.res; await this.load(); this.res = keep; this.cd.markForCheck(); }
  async slips(): Promise<void> {
    await this.act(() => downloadBlob(this.http, this.u(`/zeo-admin/api/access/slips/${this.res.slip_pdf}/`), 'zeo-activation-slips.pdf'), 'The slips are downloaded – print them.');
    this.res.slip_pdf = '';
  }
}

/* ------------------------------------------------------------------------------------------------ bank-detail changes */
@Component({
  selector: 'z-bank-changes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-bank-changes>
  <h2>Bank-detail changes</h2>
  <p class="zad-muted">A bank account added, changed or removed by HR waits here until a second person approves it – the most common payroll fraud is an IBAN changed quietly before the salary run. The employee is told about every change.</p>
  <p class="zad-warn" *ngIf="d && !d.on">The rule is off – changes apply at once. Switch it on in Sign-in security › Data protection.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <div class="zad-act" style="margin:0 0 10px"><select [(ngModel)]="st" (change)="load()" aria-label="Show"><option value="pending">Waiting</option><option value="">All</option></select></div>
  <table class="zad-t" *ngIf="d?.rows?.length; else none"><tr><th>Employee</th><th>Change</th><th>Before</th><th>After</th><th>Asked by</th><th>State</th><th></th></tr>
    <tr *ngFor="let c of d.rows" [attr.data-change]="c.id"><td><b>{{ c.emp_code }}</b></td><td>{{ c.action }}</td>
      <td><div *ngFor="let k of keys(c.old)">{{ k }}: {{ (c.old_full || c.old)[k] }}</div></td><td><div *ngFor="let k of keys(c.new)"><b>{{ k }}</b>: {{ (c.new_full || c.new)[k] }}</div></td>
      <td>{{ c.requested_by }}<div class="zad-muted">{{ c.requested_at | date:'dd/MM/yyyy HH:mm' }}</div></td>
      <td><span class="zad-pill" [class.warn]="c.state === 'pending'" [class.ok]="c.state === 'approved'" [class.bad]="c.state === 'rejected'">{{ c.state }}</span>
        <div class="zad-muted" *ngIf="c.decided_by">{{ c.decided_by }} {{ c.decided_at | date:'d MMM' }} {{ c.note }}</div></td>
      <td style="white-space:nowrap"><ng-container *ngIf="c.can_decide"><button type="button" class="zad-btn sm primary" (click)="decide(c, 'approve')" data-approve>Approve</button>
        <button type="button" class="zad-btn sm danger" (click)="decide(c, 'reject')" data-reject>Reject</button></ng-container>
        <span class="zad-muted" *ngIf="c.state === 'pending' && !c.can_decide">{{ c.requested_by_id ? 'a second person decides' : '' }}</span></td></tr></table>
  <ng-template #none><p class="zad-muted">No changes.</p></ng-template>
</div>`,
})
export class ZBankChangesComponent extends ZAdminBase implements OnInit {
  d: any = null; st = 'pending';
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await this.load(); }
  keys(o: any): string[] { return Object.keys(o || {}).filter(k => ['bank_name', 'account_number', 'iban_number', 'route_code', 'branch_name', 'is_active'].includes(k)); }
  async load(): Promise<void> { await this.act(async () => { this.d = await this.get(`/zeo-admin/api/bank-changes/${this.st ? '?state=' + this.st : ''}`); }); }
  async decide(c: any, action: string): Promise<void> {
    const note = action === 'reject' ? prompt('Why is it rejected?') : '';
    if (action === 'reject' && !note) { return; }
    if (await this.act(() => this.post('/zeo-admin/api/bank-changes/', { id: c.id, action, note }), action === 'approve' ? 'Approved – the bank details are changed and the employee is told.' : 'Rejected.')) { await this.load(); }
  }
}

/* ------------------------------------------------------------------------------------------------ log and history retention */
@Component({
  selector: 'z-history-cleaning',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div [class.zad]="page" data-history>
  <h2 *ngIf="page">Log and history retention</h2>
  <section class="zad-card">
    <h3><mat-icon>cleaning_services</mat-icon>Log and history retention</h3>
    <p class="zad-muted">System noise (read inbox items, notifications, message logs, webhook deliveries, automation runs, import history) can go after some days. Audit history (change history, audit log, approval audit, "view as" log) is kept at least one year – it is written to a zip archive before it is removed. Payroll, payslips, leave, attendance, approved requests and documents are never cleaned by date. Legal holds keep history out of every cleaning.</p>
    <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
    <p class="zad-warn" *ngIf="o?.holds?.company">The company is under a legal hold – audit history is not cleaned.</p>
    <p class="zad-muted" *ngIf="o && (o.holds.employees || o.holds.cases)">Legal holds now: {{ o.holds.employees }} employee(s), {{ o.holds.cases }} case(s) – their history stays.</p>
    <table class="zad-t" *ngIf="o"><tr><th></th><th>What</th><th>Now</th><th>Oldest</th><th>Keep for (days, 0 = for ever)</th><th>Would go now</th></tr>
      <tr *ngFor="let c of o.categories" [attr.data-cat]="c.key"><td><input type="checkbox" [checked]="pick.has(c.key)" (change)="tog(c.key)" [disabled]="c.server" [attr.aria-label]="c.label"></td>
        <td><b>{{ c.label | t }}</b> <span class="zad-pill" [class.warn]="c.kind === 'B'">{{ c.kind === 'A' ? 'system noise' : 'audit history' }}</span>
          <div class="zad-muted" *ngIf="c.server">server files – the nightly job</div></td>
        <td>{{ c.total_rows | number }} <span class="zad-muted">· {{ fmt(c.total_bytes) }}</span></td><td>{{ c.oldest | date:'dd/MM/yyyy' }}</td>
        <td><input type="number" min="0" style="width:90px" [(ngModel)]="days[c.key]" [disabled]="c.fixed" [attr.data-days]="c.key"> <span class="zad-muted" *ngIf="c.fixed">fixed</span></td>
        <td><b>{{ c.rows | number }}</b> <span class="zad-muted">· {{ fmt(c.bytes) }}</span><div class="zad-muted" *ngIf="c.kept_by_hold">{{ c.kept_by_hold }} kept by legal holds</div></td></tr></table>
    <label class="zad-chk" *ngIf="o"><input type="checkbox" [(ngModel)]="nightly" data-nightly> Clean every night (about 02:00) by these periods</label>
    <div class="zad-act"><button type="button" class="zad-btn" (click)="save()" [disabled]="busy" data-hist-save>Save the periods</button>
      <button type="button" class="zad-btn" (click)="preview()" [disabled]="busy || !pick.size" data-hist-preview>Preview</button>
      <input [(ngModel)]="confirmName" placeholder="Type the company name to confirm" aria-label="Company name" style="width:230px" data-hist-confirm>
      <button type="button" class="zad-btn danger" (click)="clean()" [disabled]="busy || !pick.size || !previewed" data-hist-clean>Clean now</button></div>
    <p class="zad-muted" *ngIf="pv" data-hist-pv>Preview: {{ pvText() }}</p>
    <table class="zad-t" *ngIf="o?.runs?.length" style="margin-top:10px"><tr><th>When</th><th>How</th><th>What</th><th>Archive</th></tr>
      <tr *ngFor="let r of o.runs" [attr.data-run]="r.id"><td>{{ r.at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ r.how_text | t }}<div class="zad-muted">{{ r.by }}</div></td><td>{{ r.text }}</td>
        <td><button type="button" class="zad-btn sm" *ngIf="r.archive" (click)="archive(r)">{{ r.archive }}</button></td></tr></table>
    <details style="margin-top:8px"><summary class="zad-muted">Never cleaned</summary><ul class="zad-muted"><li *ngFor="let n of o?.never || []">{{ n | t }}</li></ul></details>
  </section>
</div>`,
})
export class ZHistoryCleaningComponent extends ZAdminBase implements OnInit {
  @Input() page = false;
  o: any = null; days: any = {}; nightly = false; pick = new Set<string>(); pv: any[] | null = null; previewed = false; confirmName = '';
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef, route: ActivatedRoute) { super(http, rec, cd); this.page = !!route.snapshot.data['page']; }
  async ngOnInit(): Promise<void> { await this.load(); }
  fmt(n: number): string { return bytes(n || 0); }
  private take(r: any): void { this.o = r; this.nightly = r.nightly; this.days = {}; for (const c of r.categories) { this.days[c.key] = c.days; } this.cd.markForCheck(); }
  async load(): Promise<void> { await this.act(async () => this.take(await this.get('/zeo-admin/api/history/'))); }
  tog(k: string): void { if (this.pick.has(k)) { this.pick.delete(k); } else { this.pick.add(k); } this.previewed = false; this.pv = null; }
  async save(): Promise<void> {
    const ch: any = {};
    for (const c of this.o.categories) { if (!c.fixed && Number(this.days[c.key]) !== c.days) { ch[c.key] = Number(this.days[c.key]); } }
    await this.act(async () => this.take(await this.put('/zeo-admin/api/history/', { days: ch, nightly: this.nightly })), 'Saved.');
  }
  async preview(): Promise<void> { await this.act(async () => { this.pv = (await this.post('/zeo-admin/api/history/', { action: 'preview', categories: [...this.pick] })).preview; this.previewed = true; }); }
  pvText(): string { return (this.pv || []).map(p => `${(p.rows || 0).toLocaleString()} ${i18nT(p.label).toLowerCase()} (${bytes(p.bytes)})`).join('; ') + ' would be removed.'; }
  async clean(): Promise<void> {
    if (!confirm(`Remove now: ${this.pvText()}`)) { return; }
    await this.act(async () => { const r = await this.post('/zeo-admin/api/history/', { action: 'clean', categories: [...this.pick], confirm: this.confirmName }); this.say(r.run.text); });
    this.previewed = false; this.pv = null; this.confirmName = ''; await this.load();
  }
  async archive(r: any): Promise<void> { await this.act(() => downloadBlob(this.http, this.u(`/zeo-admin/api/history/${r.id}/archive/`), r.archive)); }
}
