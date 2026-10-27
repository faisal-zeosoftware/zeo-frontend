// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';   // v1.62.0 workbook
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { ZRecordService } from './z-record.service';
import { httpErrorText } from './z-http-error.interceptor';
import { TPipe, ZDatePipe, i18nT } from './i18n.service';   // v1.53.1 Arabic

/**
 * v1.52.0 – administration pages:
 *  ZMyAccountComponent         my sign-in: authenticator app, recovery codes, my sign-ins, out of office
 *  ZSignInSecurityComponent    Settings › Sign-in security: password rules, lock, authenticator rule, users (unlock, sign out,
 *                              reset the authenticator, view as the user)
 *  ZIntegrationsComponent      Settings › API keys and webhooks
 *  ZScheduledReportsComponent  Reports › Scheduled reports (e-mailed as Excel / CSV)
 *  ZImportHistoryComponent     Settings › Import history (undo an import)
 *  ZHealthComponent            Settings › System health
 *  ZImpBannerComponent         the bar shown while an administrator views ZEO as another user
 */
export const ZAD_STYLES = `.zad { padding: 16px 20px; max-width: 1150px; } .zad h2 { margin: 0 0 4px; font-size: 20px; }
  .zad-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
  .zad-card h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; margin: 0 0 10px; }
  .zad-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px 14px; margin: 10px 0; }
  .zad-grid label, .zad-f { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #5d6670; }
  .zad input:not([type=checkbox]):not([type=radio]), .zad select, .zad textarea { padding: 6px 8px; border: 1px solid #cfd5dc; border-radius: 6px; font: inherit; font-size: 13px; color: #1f2433; background: #fff; }
  .zad-chk { display: flex; gap: 6px; align-items: center; font-size: 13px; color: #1f2433; }
  .zad-act { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; }
  .zad-btn { border: 1px solid #cfd5dc; background: #fff; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px; color: #1f2433; }
  .zad-btn:disabled { opacity: .55; cursor: default; } .zad-btn.primary { background: #5b4fe0; border-color: #5b4fe0; color: #fff; }
  .zad-btn.danger { color: #9b2c24; border-color: #e6b8b3; } .zad-btn.sm { padding: 3px 8px; font-size: 12px; }
  .zad-muted { color: #5d6670; font-size: 12.5px; } .zad-msg { padding: 8px 12px; border-radius: 8px; background: #e3f4ea; color: #1d6b37; margin: 0 0 10px; }
  .zad-msg.err { background: #fde8e6; color: #9b2c24; } .zad-warn { padding: 8px 12px; border-radius: 8px; background: #fff4dc; color: #7a5200; margin: 0 0 10px; }
  table.zad-t { width: 100%; border-collapse: collapse; font-size: 12.5px; } .zad-t td, .zad-t th { padding: 6px 6px; border-bottom: 1px solid #eef0f2; text-align: start; vertical-align: top; }
  .zad-t th { color: #5d6670; font-weight: 600; } .zad-ok { color: #1d6b37; } .zad-bad { color: #9b2c24; } .zad-off { color: #7d8590; }
  .zad-pill { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 11.5px; background: #eef0f2; color: #3c4450; }
  .zad-pill.ok { background: #e3f4ea; color: #1d6b37; } .zad-pill.bad { background: #fde8e6; color: #9b2c24; } .zad-pill.warn { background: #fff4dc; color: #7a5200; }
  .zad-secret { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f4f5f7; border: 1px dashed #b9c0c8; padding: 8px 10px; border-radius: 6px; word-break: break-all; user-select: all; }
  .zad-codes { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .zad-codes span { background: #f4f5f7; padding: 4px 8px; border-radius: 4px; text-align: center; }
  .zad-qr { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-start; } .zad-qr-box { background: #fff; border: 1px solid #e3e6ea; border-radius: 8px; padding: 6px; width: 212px; height: 212px; }
  .zad-health { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
  .zad-h { border: 1px solid #e3e6ea; border-radius: 10px; padding: 10px 12px; background: #fff; border-inline-start: 4px solid #b9c0c8; }
  .zad-h.ok { border-inline-start-color: #2e9a57; } .zad-h.warn { border-inline-start-color: #d9a400; } .zad-h.bad { border-inline-start-color: #c63c2f; }
  .zad-h b { display: block; font-size: 13.5px; margin-bottom: 2px; } .zad-h .t { font-size: 13px; } .zad-h .d { font-size: 12px; color: #5d6670; margin-top: 3px; word-break: break-word; }
  .zad-tabs { display: flex; gap: 4px; border-bottom: 1px solid #e3e6ea; margin: 10px 0 14px; } .zad-tabs button { border: 0; background: none; padding: 8px 12px; cursor: pointer; font-size: 13.5px; color: #5d6670; border-bottom: 2px solid transparent; }
  .zad-tabs button.on { color: #1f2433; border-bottom-color: #5b4fe0; font-weight: 600; }`;

function schemaQ(): string { return `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }

export abstract class ZAdminBase {
  msg = ''; err = false; busy = false;
  constructor(protected http: HttpClient, protected rec: ZRecordService, protected cd: ChangeDetectorRef) {}
  protected u(path: string): string { return `${this.rec.api}${path}${path.includes('?') ? '&' : '?'}${schemaQ()}`; }
  protected get<T = any>(path: string): Promise<T> { return firstValueFrom(this.http.get<T>(this.u(path))); }
  protected post<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.u(path), body)); }
  protected put<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.put<T>(this.u(path), body)); }
  protected patch<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.patch<T>(this.u(path), body)); }
  protected del(path: string): Promise<any> { return firstValueFrom(this.http.delete(this.u(path))); }
  say(t: string, err = false): void { this.msg = t; this.err = err; this.cd.markForCheck(); }
  protected async act(fn: () => Promise<any>, ok = ''): Promise<boolean> {
    this.busy = true; this.cd.markForCheck();
    try { await fn(); if (ok) { this.say(ok); } return true; } catch (e) { this.say(httpErrorText(e), true); return false; } finally { this.busy = false; this.cd.markForCheck(); }
  }
}

/* ------------------------------------------------------------------------------------------------ my account */
@Component({
  selector: 'z-my-account',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-my-account>
  <h2>Sign-in and out of office</h2>
  <p class="zad-muted">How you sign in to ZEO, where you are signed in, and who approves for you while you are away.</p>
  <p class="zad-warn" *ngIf="ask.includes('2fa')" data-ask-2fa>Your company asks you to switch on the authenticator app. Set it up below.</p>
  <p class="zad-warn" *ngIf="ask.includes('password')">Your password has expired under the company's rules. Change it from the user menu.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>

  <section class="zad-card" *ngIf="tf" data-2fa>
    <h3><mat-icon>phonelink_lock</mat-icon>Authenticator app</h3>
    <ng-container *ngIf="!tf.on && !setup">
      <p class="zad-muted">{{ (tf.must_setup ? 'Off. With the authenticator app on, signing in needs your password and the 6-digit code from an app on your phone (Google Authenticator, Microsoft Authenticator or any TOTP app) – your company requires it.' : 'Off. With the authenticator app on, signing in needs your password and the 6-digit code from an app on your phone (Google Authenticator, Microsoft Authenticator or any TOTP app).') | t }}</p>
      <div class="zad-act"><button type="button" class="zad-btn primary" (click)="startSetup()" [disabled]="busy" data-2fa-setup>Set up the authenticator app</button></div>
    </ng-container>
    <ng-container *ngIf="setup">
      <div class="zad-qr">
        <div class="zad-qr-box" #qr aria-label="QR code for the authenticator app"></div>
        <div style="flex:1;min-width:240px">
          <p>1. Scan the code with the authenticator app, or type this key in it:</p>
          <p class="zad-secret" data-2fa-secret>{{ setup.secret }}</p>
          <p>2. Type the 6-digit code the app shows now:</p>
          <div class="zad-act"><input [(ngModel)]="code" inputmode="numeric" maxlength="6" placeholder="123456" aria-label="Code" style="width:120px" data-2fa-code>
            <button type="button" class="zad-btn primary" (click)="confirm()" [disabled]="busy || !code" data-2fa-confirm>Switch on</button>
            <button type="button" class="zad-btn" (click)="setup = null">Cancel</button></div>
        </div>
      </div>
    </ng-container>
    <ng-container *ngIf="codes.length">
      <p><b>Recovery codes.</b> Each code signs you in once if you lose the phone. Keep them somewhere safe – they are not shown again.</p>
      <div class="zad-codes" data-2fa-codes><span *ngFor="let c of codes">{{ c }}</span></div>
      <div class="zad-act"><button type="button" class="zad-btn" (click)="copyCodes()">Copy the codes</button><button type="button" class="zad-btn" (click)="codes = []">I have kept them</button></div>
    </ng-container>
    <ng-container *ngIf="tf.on && !codes.length">
      <p><span class="zad-pill ok">{{ 'On' | t }}</span> {{ 'since {0} · {1} recovery code(s) left' | t:[(tf.since | zdate), tf.recovery_left] }}</p>
      <div class="zad-act"><input [(ngModel)]="code" maxlength="12" placeholder="Code from the app" aria-label="Code from the app" style="width:160px">
        <button type="button" class="zad-btn" (click)="newCodes()" [disabled]="busy || !code">New recovery codes</button>
        <button type="button" class="zad-btn danger" (click)="disable()" [disabled]="busy || !code" *ngIf="tf.required === 'off' || !tf.must_setup">Switch off</button></div>
    </ng-container>
  </section>

  <section class="zad-card" data-my-data>   <!-- v1.53.0 -->
    <h3><mat-icon>download</mat-icon>My data</h3>
    <p class="zad-muted">Download everything ZEO keeps about you as an employee – one zip with your records and documents.</p>
    <div class="zad-act" style="margin:0"><button type="button" class="zad-btn" (click)="myData()" [disabled]="busy" data-my-data-btn>Download my data</button></div>
  </section>

  <section class="zad-card" data-clear-history>   <!-- v1.62.0 -->
    <h3><mat-icon>history_toggle_off</mat-icon>My recently viewed and searches</h3>
    <p class="zad-muted">Clear the list of records you opened lately and the searches this browser remembers.</p>
    <div class="zad-act" style="margin:0"><button type="button" class="zad-btn" (click)="clearHistory()" [disabled]="busy" data-clear-history-btn>Clear my history</button></div>
  </section>

  <section class="zad-card" data-sessions>
    <h3><mat-icon>devices</mat-icon>Where you are signed in</h3>
    <table class="zad-t" *ngIf="sessions.length; else noS">
      <tr><th>Device</th><th>IP</th><th>How</th><th>Signed in</th><th>Last used</th><th></th></tr>
      <tr *ngFor="let s of sessions"><td>{{ s.device }} <span class="zad-pill ok" *ngIf="s.current">this one</span><span class="zad-muted" *ngIf="s.impersonator"> (opened by {{ s.impersonator }})</span></td>
        <td>{{ s.ip }}</td><td>{{ s.how }}</td><td>{{ s.created_at | date:'d MMM, HH:mm' }}</td><td>{{ s.last_seen | date:'d MMM, HH:mm' }}</td>
        <td><button type="button" class="zad-btn sm" *ngIf="!s.current" (click)="endOne(s)">Sign out</button></td></tr>
    </table>
    <ng-template #noS><p class="zad-muted">No other sign-ins.</p></ng-template>
    <div class="zad-act"><button type="button" class="zad-btn" (click)="endOthers()" [disabled]="busy || sessions.length < 2" data-end-others>Sign out everywhere else</button></div>
  </section>

  <section class="zad-card" data-my-alerts>   <!-- v1.61.0 -->
    <h3><mat-icon>notification_important</mat-icon>Sign-in alerts <span class="zad-pill warn" *ngIf="alertsOpen">{{ alertsOpen }}</span></h3>
    <p class="zad-muted">ZEO writes here (and e-mails you) when your account is signed in to from a new network and a new device, when wrong passwords lock it, or when a sign-in is refused because of your company's networks.</p>
    <table class="zad-t" *ngIf="alerts.length; else noA">
      <tr><th>When</th><th>What</th><th>Device</th><th>Address</th><th></th></tr>
      <tr *ngFor="let a of alerts" [attr.data-alert]="a.id"><td>{{ a.created_at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ a.kind_text | t }}</td><td>{{ a.device }}</td><td>{{ a.ip }}</td>
        <td style="white-space:nowrap"><ng-container *ngIf="a.status === 'open'">
          <button type="button" class="zad-btn sm" (click)="answer(a, 'was_me')" data-was-me>This was me</button>
          <button type="button" class="zad-btn sm danger" (click)="answer(a, 'not_me')" data-not-me>This was not me</button></ng-container>
          <span class="zad-pill" *ngIf="a.status === 'was_me'">It was me</span><span class="zad-pill bad" *ngIf="a.status === 'not_me'">Not me – signed out</span></td></tr>
    </table>
    <ng-template #noA><p class="zad-muted">No alerts.</p></ng-template>
  </section>

  <section class="zad-card" data-ooo>
    <h3><mat-icon>beach_access</mat-icon>Out of office</h3>
    <p class="zad-muted">{{ 'While you are away, your approvals ({0}) go to a colleague. Approvals already waiting for you move too.' | t:[kindsText()] }}</p>
    <div class="zad-grid">
      <label>Colleague who approves for you<select [(ngModel)]="nf.delegate_id" data-ooo-delegate><option [ngValue]="null">Choose…</option>
        <option *ngFor="let u of ooo?.users || []" [ngValue]="u.id">{{ u.name }}</option></select></label>
      <label>From<input type="date" [(ngModel)]="nf.start_date" data-ooo-from></label>
      <label>To<input type="date" [(ngModel)]="nf.end_date" data-ooo-to></label>
      <label>Note<input [(ngModel)]="nf.note" maxlength="255" placeholder="Annual leave"></label>
    </div>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="nf.include_pending"> Also move the approvals waiting for me now</label>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="addOoo()" [disabled]="busy || !nf.delegate_id || !nf.start_date || !nf.end_date" data-ooo-save>Save</button></div>
    <table class="zad-t" *ngIf="ooo?.mine?.length" style="margin-top:10px">
      <tr><th>From</th><th>To</th><th>Colleague</th><th>Moved</th><th>State</th><th></th></tr>
      <tr *ngFor="let o of ooo.mine"><td>{{ o.start_date | date:'dd/MM/yyyy' }}</td><td>{{ o.end_date | date:'dd/MM/yyyy' }}</td><td>{{ o.delegate }}</td><td>{{ o.moved }}</td>
        <td><span class="zad-pill" [class.ok]="o.state === 'now'">{{ o.state }}</span></td>
        <td><button type="button" class="zad-btn sm" *ngIf="o.state !== 'ended'" (click)="endOoo(o)">{{ o.state === 'planned' ? 'Cancel' : 'I am back' }}</button></td></tr>
    </table>
    <p *ngIf="ooo?.for_me?.length" class="zad-muted" style="margin-top:10px" data-ooo-forme>You approve for:
      <span *ngFor="let o of ooo.for_me; let l = last">{{ o.user }} ({{ o.start_date | date:'d MMM' }} – {{ o.end_date | date:'d MMM' }}){{ l ? '' : ', ' }}</span></p>
  </section>
</div>`,
})
export class ZMyAccountComponent extends ZAdminBase implements OnInit {
  @ViewChild('qr') qr?: ElementRef<HTMLDivElement>;
  tf: any = null; setup: any = null; code = ''; codes: string[] = []; sessions: any[] = []; ooo: any = null; ask: string[] = [];
  alerts: any[] = []; alertsOpen = 0;   // v1.61.0
  nf: any = { delegate_id: null, start_date: '', end_date: '', note: '', include_pending: true };
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> {
    try { this.ask = (sessionStorage.getItem('zeo_security_ask') || '').split(',').filter(x => x); } catch { this.ask = []; }
    await Promise.all([this.loadTf(), this.loadSessions(), this.loadOoo(), this.loadAlerts()]);
  }
  async loadAlerts(): Promise<void> {
    try { const r = await this.get('/users/security/alerts/'); this.alerts = r.rows || []; this.alertsOpen = r.open || 0; } catch { this.alerts = []; }
    this.cd.markForCheck();
  }
  async answer(a: any, ans: 'was_me' | 'not_me'): Promise<void> {
    if (ans === 'not_me' && !confirm('Sign out of ZEO everywhere (also here) and change your password at the next sign-in?')) { return; }
    if (await this.act(async () => { await this.post('/users/security/alerts/', { id: a.id, answer: ans }); }, ans === 'was_me' ? 'Thank you – noted.' : 'Every sign-in is ended. Sign in again and choose a new password.')) {
      if (ans === 'not_me') { setTimeout(() => { try { localStorage.removeItem('auth_token'); } catch { /* storage */ } window.location.href = '/login'; }, 1500); return; }
      await this.loadAlerts();
    }
  }
  async loadTf(): Promise<void> { try { this.tf = await this.get('/users/2fa/'); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async loadSessions(): Promise<void> { try { this.sessions = (await this.get('/users/sessions/')).active || []; } catch { this.sessions = []; } this.cd.markForCheck(); }
  kindsText(): string { return (this.ooo?.kinds || []).map((k: string) => i18nT(k)).join(', '); }
  async loadOoo(): Promise<void> { try { this.ooo = await this.get('/zeo-admin/api/out-of-office/'); } catch { this.ooo = null; } this.cd.markForCheck(); }
  async startSetup(): Promise<void> {
    await this.act(async () => {
      this.setup = await this.post('/users/2fa/', { action: 'setup' }); this.code = ''; this.cd.detectChanges();
      const box = this.qr?.nativeElement;
      if (box) { box.innerHTML = ''; box.appendChild(new BrowserQRCodeSvgWriter().write(this.setup.uri, 200, 200)); }
    });
  }
  async confirm(): Promise<void> {
    if (await this.act(async () => { const r = await this.post('/users/2fa/', { action: 'confirm', code: this.code.trim() }); this.codes = r.recovery_codes || []; }, 'The authenticator app is on. From now on you sign in with its code.')) {
      this.setup = null; this.code = '';
      try { const a = this.ask.filter(x => x !== '2fa'); this.ask = a; sessionStorage.setItem('zeo_security_ask', a.join(',')); } catch { /* storage */ }
      await this.loadTf();
    }
  }
  async newCodes(): Promise<void> { if (await this.act(async () => { this.codes = (await this.post('/users/2fa/', { action: 'recovery', code: this.code.trim() })).recovery_codes || []; }, 'New recovery codes made – the old ones no longer work.')) { this.code = ''; await this.loadTf(); } }
  async disable(): Promise<void> {
    if (!confirm('Switch off the authenticator app? Signing in needs only your password (and the e-mail code) again.')) { return; }
    if (await this.act(() => this.post('/users/2fa/', { action: 'disable', code: this.code.trim() }), 'The authenticator app is off.')) { this.code = ''; await this.loadTf(); }
  }
  async clearHistory(): Promise<void> {
    if (!confirm('Clear your recently viewed records and your searches?')) { return; }
    await this.act(async () => {
      const r = await this.post('/zeo-admin/api/history/mine/', {});
      try { Object.keys(localStorage).filter(k => /search|recent|zl-q|zlist.*q/i.test(k)).forEach(k => localStorage.removeItem(k)); } catch { /* storage */ }
      this.say(`Cleared (${r.cleared} recently viewed).`);
    });
  }
  async myData(): Promise<void> { await this.act(() => downloadBlob(this.http, this.u('/zeo-admin/api/privacy/export/me/'), 'zeo-my-data.zip'), 'The zip is downloaded.'); }
  copyCodes(): void { try { navigator.clipboard.writeText(this.codes.join('\n')); this.say('Copied.'); } catch { this.say('Select the codes and copy them.', true); } }
  async endOne(s: any): Promise<void> { if (await this.act(() => this.post('/users/sessions/', { action: 'end', id: s.id }), 'Signed out there.')) { await this.loadSessions(); } }
  async endOthers(): Promise<void> {
    if (!confirm('Sign out of ZEO on every other browser and phone?')) { return; }
    if (await this.act(async () => { const r = await this.post('/users/sessions/', { action: 'end_others' }); this.say(`${r.ended} sign-in(s) ended.`); })) { await this.loadSessions(); }
  }
  async addOoo(): Promise<void> {
    if (await this.act(async () => { const r = await this.post('/zeo-admin/api/out-of-office/', this.nf); this.say(`Saved. ${r.moved_now} waiting approval(s) moved to ${r.delegate}.`); })) {
      this.nf = { delegate_id: null, start_date: '', end_date: '', note: '', include_pending: true }; await this.loadOoo();
    }
  }
  async endOoo(o: any): Promise<void> { if (await this.act(() => this.del(`/zeo-admin/api/out-of-office/${o.id}/`), 'Ended.')) { await this.loadOoo(); } }
}

/* ------------------------------------------------------------------------------------------------ sign-in security */
@Component({
  selector: 'z-sign-in-security',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-signin-security>
  <h2>Sign-in security</h2>
  <p class="zad-muted">Password rules, the lock after wrong passwords, the authenticator app and the users of this company.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card" *ngIf="p" data-policy>
    <h3><mat-icon>password</mat-icon>Rules</h3>
    <div class="zad-grid">
      <label>Minimum password length<input type="number" min="6" max="64" [(ngModel)]="p.min_length" data-min-length></label>
      <label>Password expires after (days, 0 = never)<input type="number" min="0" max="365" [(ngModel)]="p.expiry_days"></label>
      <label>Not one of the last … passwords (0 = off)<input type="number" min="0" max="24" [(ngModel)]="p.history"></label>
      <label>Lock after … wrong passwords<input type="number" min="3" max="20" [(ngModel)]="p.max_failed" data-max-failed></label>
      <label>Lock for (minutes)<input type="number" min="1" max="1440" [(ngModel)]="p.lock_minutes"></label>
      <label>Authenticator app required for<select [(ngModel)]="p.require_2fa" data-require-2fa><option value="off">Nobody (each user chooses)</option>
        <option value="admins">Administrators</option><option value="staff">All staff users (not employees)</option><option value="all">Everybody</option></select></label>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px 18px">
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.need_upper"> A capital letter</label>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.need_lower"> A small letter</label>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.need_digit" data-need-digit> A digit</label>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.need_symbol"> A symbol</label>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.allow_impersonation"> Administrators may view ZEO as another user (support)</label>
    </div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="save()" [disabled]="busy" data-policy-save>Save the rules</button>
      <span class="zad-muted">A user in several companies follows the strictest rules of them.</span></div>
  </section>
  <section class="zad-card" *ngIf="p" data-networks>   <!-- v1.61.0 -->
    <h3><mat-icon>lan</mat-icon>Networks allowed</h3>
    <p class="zad-muted">Only these IP addresses or networks may use this company – for example the office lines. Outside them ZEO refuses the company's data (and the sign-in when every company of the user refuses). Your address now: <b data-your-ip>{{ p.your_ip }}</b></p>
    <div class="zad-grid">
      <label>Applies to<select [(ngModel)]="p.ip_scope" data-ip-scope><option value="off">Nobody (off)</option>
        <option value="staff">Staff users (employees in self service may sign in from anywhere)</option><option value="all">Everybody</option></select></label>
    </div>
    <label class="zad-f">Addresses and networks – one per line, e.g. 94.200.10.0/24 (# starts a note)
      <textarea rows="4" [(ngModel)]="p.ip_allowlist" data-ip-list placeholder="94.200.10.0/24  # Dubai office"></textarea></label>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveNet()" [disabled]="busy" data-net-save>Save the networks</button>
      <span class="zad-muted">Your own address must stay in the list. The server owner (superuser) is never refused.</span></div>
    <h3 style="margin-top:14px"><mat-icon>notification_important</mat-icon>Sign-in alerts</h3>
    <div style="display:flex;flex-wrap:wrap;gap:6px 18px">
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.alert_new_signin" data-alert-new> E-mail the user after a sign-in from a new network and a new device</label>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.alert_lock"> E-mail the user when wrong passwords lock the account</label>
    </div>
    <div class="zad-act"><button type="button" class="zad-btn" (click)="saveNet()" [disabled]="busy">Save</button></div>
    <table class="zad-t" *ngIf="alerts.length" style="margin-top:8px" data-company-alerts>
      <tr><th>When</th><th>User</th><th>What</th><th>Device</th><th>Address</th><th>Answer</th></tr>
      <tr *ngFor="let a of alerts"><td>{{ a.created_at | date:'d MMM, HH:mm' }}</td><td>{{ a.user }}<div class="zad-muted">{{ a.email }}</div></td><td>{{ a.kind_text | t }}</td>
        <td>{{ a.device }}</td><td>{{ a.ip }}</td><td><span class="zad-pill" [class.bad]="a.status === 'not_me'" [class.ok]="a.status === 'was_me'">{{ a.status === 'open' ? ('no answer yet' | t) : (a.status === 'was_me' ? ('it was me' | t) : ('not me' | t)) }}</span></td></tr>
    </table>
    <p class="zad-muted" *ngIf="!alerts.length">No sign-in alerts in the last 90 days.</p>
  </section>
  <ng-container *ngIf="p">   <!-- v1.62.0 -->
  <section class="zad-card" data-sessions62>
    <h3><mat-icon>timer</mat-icon>Sessions</h3>
    <p class="zad-muted">{{ 'Sign-in tokens last {0} minutes and are renewed while ZEO is in use; a used refresh token cannot be used again. HTTPS on the server: {1}.' | t:[p.access_minutes, p.https ? ('yes' | t) : ('no – ask the server administrator (ZEO_HTTPS)' | t)] }}</p>
    <div class="zad-grid">
      <label>Sign out after … minutes without use (0 = off)<input type="number" min="0" max="1440" [(ngModel)]="p.idle_minutes" data-idle></label>
      <label>Administrators: sign in again every … hours (0 = like everybody)<input type="number" min="0" max="720" [(ngModel)]="p.admin_session_hours" data-admin-hours></label>
      <label>Administrators: sign out after … idle minutes (0 = like everybody)<input type="number" min="0" max="1440" [(ngModel)]="p.admin_idle_minutes"></label>
    </div>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.bind_device" data-device-lock> A sign-in works only on the device that signed in (a copied token is refused and the sign-in ends)</label>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveF(['idle_minutes','admin_session_hours','admin_idle_minutes','bind_device'])" [disabled]="busy" data-save-sessions>Save</button></div>
  </section>
  <section class="zad-card" data-countries>
    <h3><mat-icon>public</mat-icon>Countries</h3>
    <p class="zad-muted">Allow ZEO only from some countries (for example AE, SA, OM). Needs the free country database on the server.
      <b *ngIf="p.country_db?.ready">{{ 'Ready – your address is in {0}.' | t:[p.your_country || '?'] }}</b>
      <b class="zad-bad" *ngIf="!p.country_db?.ready">{{ 'Not set on this server – the rule cannot be checked (ZEO_GEOIP_DB).' | t }}</b></p>
    <div class="zad-grid">
      <label>Applies to<select [(ngModel)]="p.country_scope" data-country-scope><option value="off">Nobody (off)</option><option value="staff">Staff users</option><option value="all">Everybody</option></select></label>
      <label>Allowed countries (ISO codes)<input [(ngModel)]="p.country_allow" placeholder="AE, SA, OM" data-country-allow></label>
    </div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveF(['country_scope','country_allow'])" [disabled]="busy" data-save-countries>Save</button></div>
  </section>
  <section class="zad-card" data-stepup>
    <h3><mat-icon>verified_user</mat-icon>Ask for the password again</h3>
    <p class="zad-muted">Before these actions ZEO asks for the password (or the authenticator code) again – a stolen open session cannot approve payroll or change a bank account.</p>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.step_up" data-step-up> On</label>
    <div style="display:flex;flex-wrap:wrap;gap:6px 18px;margin:6px 0">
      <label class="zad-chk" *ngFor="let a of stepActs"><input type="checkbox" [checked]="!p.step_up_actions?.length || p.step_up_actions.includes(a.k)" (change)="togStep(a.k)" [attr.data-step-act]="a.k"> {{ a.t | t }}</label></div>
    <div class="zad-grid"><label>Asked again after (minutes)<input type="number" min="1" max="120" [(ngModel)]="p.step_up_minutes"></label></div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveF(['step_up','step_up_minutes','step_up_actions'])" [disabled]="busy" data-save-stepup>Save</button></div>
  </section>
  <section class="zad-card" data-protection>
    <h3><mat-icon>shield</mat-icon>Data protection</h3>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.mask_sensitive" data-mask> Mask IBAN, Emirates ID, passport numbers and salaries (••••1234) for users without the rights "Can see full bank details / identity numbers / salaries"</label>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.bank_two_person" data-bank2> Bank-detail changes by HR need a second person (the employee is told every time)</label>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.export_control" data-export-control> Exports need the right "Can export lists" (employees still export their own data)</label>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.export_watermark" data-watermark> PDFs carry the user and the time on every page</label>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.upload_scan"> Scan uploads for viruses {{ p.clamav ? ('(ClamAV is running)' | t) : ('(ClamAV is not installed on the server – the type and size checks run anyway)' | t) }}</label>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.alert_admins" data-alert-admins> E-mail the administrators about security events (new administrator, API key, many wrong passwords, a reused token …)</label>
    <div class="zad-grid"><label>Largest export without the right "Can export large lists" (rows, 0 = no limit)<input type="number" min="0" [(ngModel)]="p.export_row_limit" data-row-limit></label></div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveF(['mask_sensitive','bank_two_person','export_control','export_watermark','upload_scan','alert_admins','export_row_limit'])" [disabled]="busy" data-save-protection>Save</button></div>
  </section>
  <section class="zad-card" data-access-rules>
    <h3><mat-icon>badge</mat-icon>Giving access to employees</h3>
    <div class="zad-grid">
      <label>Sign-in ID<select [(ngModel)]="p.signin_id" data-signin-id><option value="optional">E-mail optional – employees without e-mail sign in with their code</option><option value="email">E-mail required – everybody signs in with an e-mail</option></select></label>
      <label>Set-password links work for (hours)<input type="number" min="1" max="336" [(ngModel)]="p.link_hours"></label>
    </div>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.hr_types_password"> HR may type a password for an employee (changed at the first sign-in)</label>
    <h3 style="margin-top:12px"><mat-icon>warning</mat-icon>Company default password (not recommended)</h3>
    <p class="zad-muted">Only for self-service employees, never "Admin" or a common password; it stops working after the days below; the first sign-in asks the last 4 digits of the Emirates ID and the date of birth; 3 wrong tries lock the account until HR unlocks it. Prefer "Generate password" or the printed slip.</p>
    <div class="zad-grid">
      <label>New default password<input type="text" [(ngModel)]="defPw" autocomplete="off" [placeholder]="p.default_password_set ? ('set – type to change' | t) : ''" data-default-pw></label>
      <label>Works for (days)<input type="number" min="1" max="30" [(ngModel)]="p.default_password_days"></label>
    </div>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.default_password_on" data-default-on> Switch the company default password on</label>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveAccess()" [disabled]="busy" data-save-access>Save</button>
      <a class="zad-btn" href="/main-sidebar/settings/give-access">Give access</a> <a class="zad-btn" href="/main-sidebar/settings/security-dashboard">Security dashboard</a></div>
  </section>
  </ng-container>
  <section class="zad-card" data-users>
    <h3><mat-icon>group</mat-icon>Users</h3>
    <div class="zad-act" style="margin:0 0 8px"><input [(ngModel)]="q" (keyup.enter)="load()" placeholder="Search name or e-mail" aria-label="Search users" style="width:240px">
      <button type="button" class="zad-btn" (click)="load()">Search</button></div>
    <table class="zad-t">
      <tr><th>User</th><th>Authenticator</th><th>State</th><th>Last sign-in</th><th>Sign-ins</th><th></th></tr>
      <tr *ngFor="let u of rows" [attr.data-user]="u.id"><td><b>{{ u.name }}</b><div class="zad-muted">{{ u.email || u.username }}{{ u.is_ess ? ' · employee' : '' }}</div></td>
        <td><span class="zad-pill" [class.ok]="u.authenticator">{{ u.authenticator ? 'On' : 'Off' }}</span></td>
        <td><span class="zad-pill bad" *ngIf="u.locked">Locked</span><span class="zad-pill" *ngIf="!u.locked && !u.active">Inactive</span><span *ngIf="!u.locked && u.active" class="zad-muted">–</span></td>
        <td>{{ u.last_login | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ u.sessions }}</td>
        <td style="white-space:nowrap"><button type="button" class="zad-btn sm" *ngIf="u.locked" (click)="userAct(u, 'unlock')" data-unlock>Unlock</button>
          <button type="button" class="zad-btn sm" *ngIf="u.sessions && !u.me" (click)="userAct(u, 'end_sessions')">Sign out</button>
          <button type="button" class="zad-btn sm" *ngIf="u.authenticator && !u.me" (click)="userAct(u, 'reset_2fa')">Reset authenticator</button>
          <button type="button" class="zad-btn sm" *ngIf="!u.me && u.active && p?.allow_impersonation" (click)="viewAs(u)" data-view-as>View as</button></td></tr>
    </table>
    <p class="zad-muted">View as opens ZEO as that user for one hour, read only unless you choose otherwise, and writes it to the audit log. Administrators cannot be viewed as.</p>
  </section>
</div>`,
})
export class ZSignInSecurityComponent extends ZAdminBase implements OnInit {
  p: any = null; rows: any[] = []; q = ''; alerts: any[] = []; defPw = '';
  stepActs = [{ k: 'payroll_approve', t: 'Approving payroll' }, { k: 'wps', t: 'The WPS salary file' }, { k: 'bank', t: 'Bank details' },
    { k: 'rights', t: 'User rights' }, { k: 'export', t: 'Exports' }];
  togStep(k: string): void {
    let cur: string[] = (this.p.step_up_actions && this.p.step_up_actions.length) ? [...this.p.step_up_actions] : this.stepActs.map(a => a.k);
    cur = cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k];
    this.p.step_up_actions = cur.length === this.stepActs.length ? [] : cur;
  }
  async saveF(fields: string[]): Promise<void> {
    const body: any = {};
    fields.forEach(f => { body[f] = this.p[f]; });
    await this.act(async () => { this.p = await this.put('/users/security/policy/', body); }, 'Saved.');
  }
  async saveAccess(): Promise<void> {
    const body: any = { signin_id: this.p.signin_id, link_hours: this.p.link_hours, hr_types_password: this.p.hr_types_password,
      default_password_days: this.p.default_password_days, default_password_on: this.p.default_password_on };
    if (this.defPw) { body.default_password = this.defPw; }
    if (await this.act(async () => { this.p = await this.put('/users/security/policy/', body); }, 'Saved.')) { this.defPw = ''; }
  }
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await this.load(); await this.loadAlerts(); }
  async loadAlerts(): Promise<void> { try { this.alerts = (await this.get('/users/security/alerts/?company=1')).rows || []; } catch { this.alerts = []; } this.cd.markForCheck(); }
  async saveNet(): Promise<void> {
    await this.act(async () => {
      this.p = await this.put('/users/security/policy/', { ip_scope: this.p.ip_scope, ip_allowlist: this.p.ip_allowlist, alert_new_signin: this.p.alert_new_signin, alert_lock: this.p.alert_lock });
    }, 'Saved.');
  }
  async load(): Promise<void> {
    try { const r = await this.get(`/users/security/users/?q=${encodeURIComponent(this.q)}`); this.rows = r.rows; this.p = this.p || r.policy; }
    catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  async save(): Promise<void> { await this.act(async () => { this.p = await this.put('/users/security/policy/', this.p); }, 'The sign-in rules are saved.'); }
  async userAct(u: any, action: string): Promise<void> {
    const ask: any = { end_sessions: `Sign ${u.name} out everywhere?`, reset_2fa: `Reset the authenticator app of ${u.name}? They set it up again at the next sign-in.` };
    if (ask[action] && !confirm(ask[action])) { return; }
    if (await this.act(async () => { const r = await this.post('/users/security/users/', { user_id: u.id, action }); this.say(r.detail); })) { await this.load(); }
  }
  async viewAs(u: any): Promise<void> {
    const ro = confirm(`View ZEO as ${u.name}?\n\nOK = read only (nothing can be changed)\nCancel = choose whether changes are allowed`);
    let readOnly = true;
    if (!ro) {
      if (!confirm(`Allow changes while viewing as ${u.name}? Every change is recorded as made by you as this user.\n\nOK = allow changes, Cancel = stop`)) { return; }
      readOnly = false;
    }
    await this.act(async () => {
      const r = await this.post('/users/impersonate/', { user_id: u.id, read_only: readOnly });
      startImpersonation(r);
    });
  }
}

/** Keep the administrator's sign-in in this tab and open ZEO with the user's token. */
export function startImpersonation(r: any): void {
  try {
    sessionStorage.setItem('zeo_imp_admin', JSON.stringify({
      token: localStorage.getItem('auth_token'), refresh: localStorage.getItem('refresh_token'), url: location.pathname + location.search,
      branches: localStorage.getItem('selectedBranchIds'), name: r.name, read_only: r.read_only, until: Date.now() + (r.expires_in || 3600) * 1000,
    }));
  } catch { /* storage */ }
  localStorage.setItem('auth_token', r.access);
  if (r.refresh) { localStorage.setItem('refresh_token', r.refresh); }   // v1.62.0 the viewing session renews its own token
  window.location.href = '/main-sidebar/home';
}

/* ------------------------------------------------------------------------------------------------ banner */
@Component({
  selector: 'z-imp-banner',
  standalone: true,
  imports: [CommonModule, TPipe],
  styles: [`.zib { position: fixed; inset-inline: 0; bottom: 0; z-index: 2000; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center;
    background: #7a1f5c; color: #fff; padding: 6px 12px; font-size: 13px; } .zib.ask { background: #6a4b00; } .zib button { border: 1px solid #fff; background: none; color: #fff; border-radius: 6px; padding: 3px 10px; cursor: pointer; }`],
  template: `<div class="zib" *ngIf="on" role="status" data-imp-banner>
    <span>You are viewing ZEO as <b>{{ name || 'another user' }}</b>{{ ro ? ' – read only' : ' – changes are recorded as made by you' }}.</span>
    <button type="button" (click)="stop()" data-imp-stop>Stop viewing as this user</button></div>
  <div class="zib ask" *ngIf="!on && ask.length && !onAccount()" role="status" data-security-ask>
    <span>{{ ask.includes('2fa') ? 'Your company asks you to switch on the authenticator app.' : 'Your password has expired under the company\'s sign-in rules.' }}</span>
    <button type="button" (click)="openAccount()">{{ ask.includes('2fa') ? 'Set it up' : 'Open' }}</button><button type="button" (click)="ask = []">Later</button></div>`,
})
export class ZImpBannerComponent implements OnInit {
  on = false; ro = true; name = ''; ask: string[] = [];
  onAccount(): boolean { return location.pathname.includes('/settings/my-account'); }
  openAccount(): void { window.location.href = '/main-sidebar/settings/my-account'; }
  constructor(private http: HttpClient, private rec: ZRecordService) {}
  ngOnInit(): void {
    const t = localStorage.getItem('auth_token') || '';
    try {
      const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      this.on = !!p.imp; this.ro = !!p.ro;
      const a = JSON.parse(sessionStorage.getItem('zeo_imp_admin') || 'null');
      this.name = a?.name || '';
    } catch { this.on = false; }
    try { this.ask = (sessionStorage.getItem('zeo_security_ask') || '').split(',').filter(x => x); } catch { this.ask = []; }
  }
  async stop(): Promise<void> {
    try { await firstValueFrom(this.http.post(`${this.rec.api}/users/impersonate/stop/`, {})); } catch { /* ended already */ }
    let a: any = null;
    try { a = JSON.parse(sessionStorage.getItem('zeo_imp_admin') || 'null'); sessionStorage.removeItem('zeo_imp_admin'); } catch { a = null; }
    if (a?.token) {
      localStorage.setItem('auth_token', a.token);
      if (a.refresh) { localStorage.setItem('refresh_token', a.refresh); }   // v1.62.0 back to the administrator's own sign-in
      if (a.branches) { localStorage.setItem('selectedBranchIds', a.branches); }
      window.location.href = a.url || '/main-sidebar/settings/sign-in-security';
    } else {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  }
}

/* ------------------------------------------------------------------------------------------------ API keys and webhooks */
@Component({
  selector: 'z-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-integrations>
  <h2>API keys and webhooks</h2>
  <p class="zad-muted">Let other systems read ZEO (Power BI, an intranet, a bank or ERP) with an API key, and tell them when records change with a webhook.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <div class="zad-tabs" role="tablist"><button type="button" role="tab" [class.on]="tab === 'keys'" (click)="tab = 'keys'">API keys</button>
    <button type="button" role="tab" [class.on]="tab === 'hooks'" (click)="tab = 'hooks'" data-tab-hooks>Webhooks</button></div>

  <ng-container *ngIf="tab === 'keys'">
    <section class="zad-card" *ngIf="newKey" data-new-key><h3><mat-icon>key</mat-icon>Copy the key now</h3>
      <p class="zad-secret">{{ newKey }}</p><p class="zad-muted">It is not shown again. Send it as the header <code>Authorization: Api-Key …</code> (or <code>X-API-Key</code>) with <code>?schema={{ schema }}</code>.</p>
      <div class="zad-act"><button type="button" class="zad-btn" (click)="copy(newKey)">Copy</button><button type="button" class="zad-btn" (click)="newKey = ''">Done</button></div></section>
    <section class="zad-card"><h3><mat-icon>add</mat-icon>New API key</h3>
      <div class="zad-grid"><label>Name<input [(ngModel)]="kf.name" placeholder="Power BI" data-key-name></label>
        <label>Acts as the user (their rights apply)<select [(ngModel)]="kf.user_id" data-key-user><option [ngValue]="null">Choose…</option><option *ngFor="let u of users" [ngValue]="u.id">{{ u.name }} – {{ u.email }}</option></select></label>
        <label>Only from these IP addresses (comma, empty = any)<input [(ngModel)]="kf.allowed_ips" placeholder="203.0.113.10"></label>
        <label>Expires on (empty = never)<input type="date" [(ngModel)]="kf.expires_at"></label></div>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="kf.read_only"> Read only (GET) – recommended</label>
      <div class="zad-muted" style="margin-top:8px">API v1 – what the key may use (<code>/api/v1/</code>):</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px 16px;margin:4px 0 6px" data-key-scopes>
        <label class="zad-chk" *ngFor="let s of scopes"><input type="checkbox" [checked]="kf.scopes.includes(s.scope)" (change)="tog(kf.scopes, s.scope)" [attr.data-scope]="s.scope"> {{ s.meaning | t }}</label></div>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="kf.v1_only" data-v1-only> API v1 only (the key cannot call ZEO's internal addresses) – recommended for new integrations</label>
      <div class="zad-act"><button type="button" class="zad-btn primary" (click)="addKey()" [disabled]="busy || !kf.name || !kf.user_id" data-key-add>Make the key</button></div></section>
    <section class="zad-card" data-api-v1-doc><h3><mat-icon>menu_book</mat-icon>API v1</h3>
      <p class="zad-muted">A small, stable API for integrations. Field names do not change within v1; new fields may be added. Every call needs the key and <code>?schema={{ schema }}</code>; lists are paged with <code>page</code> and <code>page_size</code> (at most 500). The key sees the branches of the user it acts as.</p>
      <table class="zad-t"><tr><th>Address</th><th>Method</th><th>Scope</th><th>Filters</th></tr>
        <tr *ngFor="let e of v1Doc"><td><code>{{ e[0] }}</code></td><td>{{ e[1] }}</td><td><code>{{ e[2] }}</code></td><td class="zad-muted">{{ e[3] }}</td></tr></table>
      <p class="zad-muted" style="margin-top:8px">Example:</p>
      <p class="zad-secret">curl -H "Authorization: Api-Key zeo_…" "{{ apiBase }}/api/v1/employees/?schema={{ schema }}&amp;active=1&amp;page_size=100"</p></section>
    <section class="zad-card"><table class="zad-t"><tr><th>Name</th><th>Key</th><th>Acts as</th><th>Access</th><th>Last used</th><th>Uses</th><th></th></tr>
      <tr *ngFor="let k of keys"><td><b>{{ k.name }}</b><div class="zad-muted">by {{ k.created_by }}, {{ k.created_at | date:'dd/MM/yyyy' }}</div></td><td><code>{{ k.prefix }}</code></td><td>{{ k.user }}</td>
        <td>{{ k.read_only ? 'Read only' : 'Read and write' }}<div class="zad-muted" *ngIf="k.scopes?.length">v1: {{ k.scopes.join(', ') }}{{ k.v1_only ? ' · ' + ('API v1 only' | t) : '' }}</div><div class="zad-muted" *ngIf="k.allowed_ips?.length">{{ k.allowed_ips.join(', ') }}</div><div class="zad-muted" *ngIf="k.expires_at">until {{ k.expires_at | date:'dd/MM/yyyy' }}</div></td>
        <td>{{ k.last_used ? (k.last_used | date:'d MMM, HH:mm') : 'never' }}<div class="zad-muted">{{ k.last_ip }}</div></td><td>{{ k.uses }}</td>
        <td style="white-space:nowrap"><button type="button" class="zad-btn sm" (click)="toggleKey(k)">{{ k.active ? 'Switch off' : 'Switch on' }}</button>
          <button type="button" class="zad-btn sm danger" (click)="delKey(k)">Delete</button></td></tr>
      <tr *ngIf="!keys.length"><td colspan="7" class="zad-muted">No API keys yet.</td></tr></table></section>
  </ng-container>

  <ng-container *ngIf="tab === 'hooks'">
    <section class="zad-card" *ngIf="newSecret" data-new-secret><h3><mat-icon>key</mat-icon>Signing secret</h3><p class="zad-secret">{{ newSecret }}</p>
      <p class="zad-muted">Each delivery has the header <code>X-ZEO-Signature: sha256=…</code> – the HMAC-SHA256 of the body with this secret. It is not shown again.</p>
      <div class="zad-act"><button type="button" class="zad-btn" (click)="copy(newSecret)">Copy</button><button type="button" class="zad-btn" (click)="newSecret = ''">Done</button></div></section>
    <section class="zad-card"><h3><mat-icon>{{ hf.id ? 'edit' : 'add' }}</mat-icon>{{ hf.id ? 'Change the webhook' : 'New webhook' }}</h3>
      <div class="zad-grid"><label>Name<input [(ngModel)]="hf.name" placeholder="Intranet" data-hook-name></label>
        <label style="grid-column: span 2">URL (POST JSON)<input [(ngModel)]="hf.url" placeholder="https://intranet.example.com/zeo" data-hook-url></label></div>
      <div class="zad-muted">Record types</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px 16px;margin:4px 0 8px;max-height:180px;overflow:auto">
        <label class="zad-chk" *ngFor="let c of choices"><input type="checkbox" [checked]="hf.models_list.includes(c.key)" (change)="tog(hf.models_list, c.key)" [attr.data-model]="c.key"> {{ c.label }}</label></div>
      <div class="zad-muted">Events</div>
      <div style="display:flex;gap:16px;margin:4px 0 8px"><label class="zad-chk" *ngFor="let e of events"><input type="checkbox" [checked]="hf.events.includes(e)" (change)="tog(hf.events, e)"> {{ e }}</label></div>
      <label class="zad-chk" *ngIf="hf.id"><input type="checkbox" [(ngModel)]="hf.new_secret"> Make a new signing secret</label>
      <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveHook()" [disabled]="busy || !hf.name || !hf.url" data-hook-save>Save</button>
        <button type="button" class="zad-btn" *ngIf="hf.id" (click)="resetHook()">Cancel</button></div></section>
    <section class="zad-card"><table class="zad-t"><tr><th>Name</th><th>Sends</th><th>Last delivery</th><th></th></tr>
      <ng-container *ngFor="let h of hooks"><tr><td><b>{{ h.name }}</b><div class="zad-muted">{{ h.url }}</div></td>
        <td>{{ labels(h) }}<div class="zad-muted">{{ h.events.join(', ') }}</div></td>
        <td><span class="zad-pill" [class.ok]="h.last_status?.startsWith('sent')" [class.bad]="h.last_status?.startsWith('failed')">{{ h.last_status || 'none yet' }}</span>
          <div class="zad-muted">{{ h.last_at | date:'d MMM, HH:mm' }}{{ h.active ? '' : ' · switched off' }}{{ h.failures ? ' · ' + h.failures + ' failure(s)' : '' }}</div></td>
        <td style="white-space:nowrap"><button type="button" class="zad-btn sm" (click)="testHook(h)" data-hook-test>Send a test</button>
          <button type="button" class="zad-btn sm" (click)="openLog(h)">Deliveries</button><button type="button" class="zad-btn sm" (click)="editHook(h)">Change</button>
          <button type="button" class="zad-btn sm" (click)="toggleHook(h)">{{ h.active ? 'Switch off' : 'Switch on' }}</button><button type="button" class="zad-btn sm danger" (click)="delHook(h)">Delete</button></td></tr>
        <tr *ngIf="log && log.webhook.id === h.id"><td colspan="4"><table class="zad-t"><tr><th>When</th><th>Event</th><th>Result</th><th>Tries</th><th></th></tr>
          <tr *ngFor="let d of log.deliveries"><td>{{ d.at | date:'d MMM, HH:mm:ss' }}</td><td>{{ d.event }}</td>
            <td [class.zad-ok]="d.status === 'sent'" [class.zad-bad]="d.status === 'failed'">{{ d.status }} {{ d.code || '' }} <span class="zad-muted">{{ d.response | slice:0:80 }}</span></td>
            <td>{{ d.tries }}<div class="zad-muted" *ngIf="d.next_try && d.status !== 'sent'">next {{ d.next_try | date:'HH:mm' }}</div></td>
            <td><button type="button" class="zad-btn sm" *ngIf="d.status !== 'sent'" (click)="retry(h, d)">Try again</button></td></tr>
          <tr *ngIf="!log.deliveries.length"><td colspan="5" class="zad-muted">No deliveries yet.</td></tr></table></td></tr>
      </ng-container>
      <tr *ngIf="!hooks.length"><td colspan="4" class="zad-muted">No webhooks yet.</td></tr></table>
      <p class="zad-muted">A failed delivery is tried again after 1, 5, 30 minutes, 2 and 6 hours; a webhook that fails 20 times in a row is switched off. Automation rules can also call a webhook (action "Call a webhook").</p></section>
  </ng-container>
</div>`,
})
export class ZIntegrationsComponent extends ZAdminBase implements OnInit {
  tab: 'keys' | 'hooks' = 'keys'; keys: any[] = []; users: any[] = []; schema = ''; newKey = ''; hooks: any[] = []; choices: any[] = []; events: string[] = [];
  newSecret = ''; log: any = null;
  kf: any = { name: '', user_id: null, allowed_ips: '', expires_at: '', read_only: true, scopes: [], v1_only: true };
  hf: any = { name: '', url: '', models_list: [], events: ['created', 'updated'] };
  scopes: any[] = []; apiBase = this.rec.api;   // v1.61.0 API v1
  v1Doc: string[][] = [
    ['/api/v1/', 'GET', '–', 'the endpoints and the scopes of the key'],
    ['/api/v1/employees/', 'GET', 'employees:read', 'active, branch, department, updated_since'],
    ['/api/v1/employees/<id>/', 'GET', 'employees:read', ''],
    ['/api/v1/branches/ · departments/ · designations/', 'GET', 'org:read', ''],
    ['/api/v1/leave-requests/', 'GET', 'leave:read', 'from, to, status, employee'],
    ['/api/v1/leave-balances/', 'GET', 'leave:read', 'employee'],
    ['/api/v1/attendance-days/', 'GET', 'attendance:read', 'from, to (at most 62 days), employee'],
    ['/api/v1/attendance/punches/', 'POST', 'attendance:write', '{employee_id or employee_code, time, kind: in | out | auto, device_ref}'],
    ['/api/v1/payslips/', 'GET', 'payroll:read', 'year, month, employee'],
  ];
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await Promise.all([this.loadKeys(), this.loadHooks()]); }
  async loadKeys(): Promise<void> { try { const r = await this.get('/zeo-admin/api/api-keys/'); this.keys = r.rows; this.users = r.users; this.schema = r.schema; this.scopes = r.scopes || []; } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async loadHooks(): Promise<void> { try { const r = await this.get('/zeo-admin/api/webhooks/'); this.hooks = r.rows; this.choices = r.choices; this.events = r.events; } catch { this.hooks = []; } this.cd.markForCheck(); }
  tog(list: string[], v: string): void { const i = list.indexOf(v); if (i >= 0) { list.splice(i, 1); } else { list.push(v); } }
  labels(h: any): string { return (h.models || []).map((m: any) => m.label).join(', '); }
  copy(t: string): void { try { navigator.clipboard.writeText(t); this.say('Copied.'); } catch { this.say('Select the text and copy it.', true); } }
  async addKey(): Promise<void> {
    if (await this.act(async () => { const r = await this.post('/zeo-admin/api/api-keys/', this.kf); this.newKey = r.key; })) {
      this.kf = { name: '', user_id: null, allowed_ips: '', expires_at: '', read_only: true, scopes: [], v1_only: true }; await this.loadKeys();
    }
  }
  async toggleKey(k: any): Promise<void> { if (await this.act(() => this.patch(`/zeo-admin/api/api-keys/${k.id}/`, { active: !k.active }))) { await this.loadKeys(); } }
  async delKey(k: any): Promise<void> { if (!confirm(`Delete the key "${k.name}"? Systems using it stop at once.`)) { return; } if (await this.act(() => this.del(`/zeo-admin/api/api-keys/${k.id}/`), 'Deleted.')) { await this.loadKeys(); } }
  resetHook(): void { this.hf = { name: '', url: '', models_list: [], events: ['created', 'updated'] }; }
  editHook(h: any): void { this.hf = { id: h.id, name: h.name, url: h.url, models_list: [...h.models_list], events: [...h.events], new_secret: false }; this.cd.markForCheck(); }
  async saveHook(): Promise<void> {
    if (await this.act(async () => { const r = await this.post('/zeo-admin/api/webhooks/', this.hf); if (r.secret) { this.newSecret = r.secret; } }, 'Saved.')) { this.resetHook(); await this.loadHooks(); }
  }
  async testHook(h: any): Promise<void> { await this.act(async () => { const r = await this.post(`/zeo-admin/api/webhooks/${h.id}/test/`); this.say(`Test: ${r.status} ${r.code || ''} ${r.response || ''}`.trim(), r.status !== 'sent'); }); await this.loadHooks(); }
  async toggleHook(h: any): Promise<void> { if (await this.act(() => this.post('/zeo-admin/api/webhooks/', { id: h.id, active: !h.active }))) { await this.loadHooks(); } }
  async delHook(h: any): Promise<void> { if (!confirm(`Delete the webhook "${h.name}"?`)) { return; } if (await this.act(() => this.del(`/zeo-admin/api/webhooks/${h.id}/`), 'Deleted.')) { this.log = null; await this.loadHooks(); } }
  async openLog(h: any): Promise<void> { if (this.log?.webhook.id === h.id) { this.log = null; return; } await this.act(async () => { this.log = await this.get(`/zeo-admin/api/webhooks/${h.id}/`); }); }
  async retry(h: any, d: any): Promise<void> { await this.act(async () => { const r = await this.post(`/zeo-admin/api/webhooks/${h.id}/retry/`, { delivery: d.id }); this.say(`Delivery ${r.status}.`, r.status !== 'sent'); }); this.log = await this.get(`/zeo-admin/api/webhooks/${h.id}/`); await this.loadHooks(); }
}

/* ------------------------------------------------------------------------------------------------ scheduled reports */
@Component({
  selector: 'z-scheduled-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-schedules>
  <h2>Scheduled reports</h2>
  <p class="zad-muted">A report of Reports e-mailed on a schedule, as Excel or CSV. It runs with your rights (your branches) for the period you choose.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card"><h3><mat-icon>{{ f.id ? 'edit' : 'schedule_send' }}</mat-icon>{{ f.id ? 'Change the schedule' : 'New schedule' }}</h3>
    <div class="zad-grid">
      <label>Report<select [(ngModel)]="f.report" data-sch-report><option value="">Choose…</option>
        <optgroup *ngFor="let g of groups" [label]="g.section"><option *ngFor="let r of g.items" [value]="r.key">{{ r.title }}</option></optgroup></select></label>
      <label>Name in the e-mail<input [(ngModel)]="f.name" [placeholder]="title(f.report)"></label>
      <label>Period<select [(ngModel)]="f.period"><option value="last_month">Last month</option><option value="this_month">This month so far</option>
        <option value="last_week">Last week</option><option value="yesterday">Yesterday</option><option value="today">As of the day it is sent</option></select></label>
      <label>How often<select [(ngModel)]="f.frequency" data-sch-freq><option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option></select></label>
      <label *ngIf="f.frequency === 'weekly'">On<select [(ngModel)]="f.weekday"><option *ngFor="let d of days; let i = index" [ngValue]="i">{{ d }}</option></select></label>
      <label *ngIf="f.frequency === 'monthly'">Day of the month<input type="number" min="1" max="31" [(ngModel)]="f.day"></label>
      <label>At (hour, company time)<select [(ngModel)]="f.hour"><option *ngFor="let h of hours" [ngValue]="h">{{ h < 10 ? '0' + h : h }}:00</option></select></label>
      <label>Format<select [(ngModel)]="f.fmt"><option value="xlsx">Excel (xlsx)</option><option value="csv">CSV</option></select></label>
      <label style="grid-column: 1 / -1">E-mail to (comma between addresses){{ canAny ? '' : ' – your own e-mail; an administrator can add others' }}
        <input [(ngModel)]="f.recipients" [readonly]="!canAny" data-sch-to></label>
    </div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="save()" [disabled]="busy || !f.report" data-sch-save>Save</button>
      <button type="button" class="zad-btn" *ngIf="f.id" (click)="reset()">Cancel</button></div></section>
  <section class="zad-card"><table class="zad-t"><tr><th>Schedule</th><th>When</th><th>To</th><th>Last sent</th><th>Next</th><th></th></tr>
    <tr *ngFor="let s of rows" [attr.data-sch]="s.id"><td><b>{{ s.name }}</b><div class="zad-muted">{{ s.report_title }} · {{ period(s.period) }} · {{ s.fmt | uppercase }}{{ canAny ? ' · ' + s.owner : '' }}</div></td>
      <td>{{ when(s) }}</td><td>{{ s.recipients.join(', ') }}</td>
      <td>{{ s.last_run ? (s.last_run | date:'d MMM, HH:mm') : '–' }}<div class="zad-muted" [class.zad-bad]="s.last_status?.startsWith('failed')">{{ s.last_status }}</div></td>
      <td>{{ s.active ? (s.next_run | date:'d MMM, HH:mm') : 'paused' }}</td>
      <td style="white-space:nowrap"><button type="button" class="zad-btn sm" (click)="sendNow(s)" [disabled]="busy" data-sch-send>Send now</button>
        <button type="button" class="zad-btn sm" (click)="edit(s)">Change</button><button type="button" class="zad-btn sm" (click)="toggle(s)">{{ s.active ? 'Pause' : 'Resume' }}</button>
        <button type="button" class="zad-btn sm danger" (click)="remove(s)">Delete</button></td></tr>
    <tr *ngIf="!rows.length"><td colspan="6" class="zad-muted">No schedules yet.</td></tr></table></section>
</div>`,
})
export class ZScheduledReportsComponent extends ZAdminBase implements OnInit {
  rows: any[] = []; reports: any[] = []; groups: any[] = []; canAny = false; myEmail = '';
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; hours = Array.from({ length: 24 }, (_, i) => i);
  f: any = {};
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> {
    await this.load(); this.reset();
    const pre = new URLSearchParams(location.search).get('report');
    if (pre && this.reports.some(r => r.key === pre)) { this.f.report = pre; }
    this.cd.markForCheck();
  }
  async load(): Promise<void> {
    try {
      const r = await this.get('/zeo-admin/api/schedules/');
      this.rows = r.rows; this.reports = r.reports; this.canAny = r.can_any_address; this.myEmail = r.my_email || '';
      const g: any = {}; for (const x of this.reports) { (g[x.section] = g[x.section] || []).push(x); }
      this.groups = Object.keys(g).map(k => ({ section: k, items: g[k] }));
    } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  reset(): void { this.f = { report: '', name: '', period: 'last_month', frequency: 'monthly', weekday: 0, day: 1, hour: 7, fmt: 'xlsx', recipients: this.myEmail }; }
  title(k: string): string { return this.reports.find(r => r.key === k)?.title || ''; }
  period(p: string): string { return ({ last_month: 'last month', this_month: 'this month so far', last_week: 'last week', yesterday: 'yesterday', today: 'as of the day' } as any)[p] || p; }
  when(s: any): string {
    const h = `${s.hour < 10 ? '0' : ''}${s.hour}:00`;
    return s.frequency === 'daily' ? `Every day ${h}` : s.frequency === 'weekly' ? `Every ${this.days[s.weekday]} ${h}` : `Every month on day ${s.day}, ${h}`;
  }
  edit(s: any): void { this.f = { ...s, recipients: s.recipients.join(', ') }; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async save(): Promise<void> { if (await this.act(() => this.post('/zeo-admin/api/schedules/', this.f), 'Saved.')) { this.reset(); await this.load(); } }
  async sendNow(s: any): Promise<void> { await this.act(async () => { const r = await this.post(`/zeo-admin/api/schedules/${s.id}/send/`); this.say(`${s.name}: ${r.result}.`); }); await this.load(); }
  async toggle(s: any): Promise<void> { if (await this.act(() => this.post('/zeo-admin/api/schedules/', { id: s.id, report: s.report, recipients: s.recipients, active: !s.active }))) { await this.load(); } }
  async remove(s: any): Promise<void> { if (!confirm(`Delete the schedule "${s.name}"?`)) { return; } if (await this.act(() => this.del(`/zeo-admin/api/schedules/${s.id}/`), 'Deleted.')) { await this.load(); } }
}

/* ------------------------------------------------------------------------------------------------ import history */
@Component({
  selector: 'z-import-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, TPipe, ZDatePipe, RouterModule],   // v1.62.0 workbook: link to Data workbook
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-imports>
  <h2>Import history</h2>
  <p class="zad-muted">Every import from a file, with the records it made. Undo deletes the records an import created (records already used elsewhere are kept).</p>
  <p class="zad-muted" data-imports-workbook>A whole company (masters, employees, salaries, opening balances, history) from one Excel workbook: <a routerLink="/main-sidebar/settings/data-workbook">Data workbook</a>.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card"><table class="zad-t"><tr><th>When</th><th>What</th><th>File</th><th>Rows</th><th>By</th><th>State</th><th></th></tr>
    <tr *ngFor="let b of rows" [attr.data-batch]="b.id"><td>{{ b.at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ b.label || b.model }}</td><td>{{ b.file_name }}</td>
      <td>{{ b.ok }} imported<span *ngIf="b.failed" class="zad-bad">, {{ b.failed }} failed</span></td><td>{{ b.user }}</td>
      <td><span class="zad-pill" [class.ok]="b.status === 'done'" [class.warn]="b.status === 'partly'">{{ b.status_label }}</span><div class="zad-muted">{{ b.undo_note }}</div></td>
      <td><button type="button" class="zad-btn sm danger" *ngIf="b.status === 'done' && b.records" (click)="undo(b)" [disabled]="busy" data-undo>Undo this import</button></td></tr>
    <tr *ngIf="!rows.length"><td colspan="7" class="zad-muted">No imports yet.</td></tr></table></section>
</div>`,
})
export class ZImportHistoryComponent extends ZAdminBase implements OnInit {
  rows: any[] = [];
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> { try { this.rows = await this.get('/zeo-admin/api/imports/'); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async undo(b: any): Promise<void> {
    if (!confirm(`Undo the import of ${b.file_name || b.label}? The ${b.records} record(s) it created are deleted.`)) { return; }
    await this.act(async () => { const r = await this.post(`/zeo-admin/api/imports/${b.id}/undo/`); this.say(`${r.deleted} record(s) deleted${r.kept?.length ? `, ${r.kept.length} kept (in use)` : ''}.`); });
    await this.load();
  }
}

/* ------------------------------------------------------------------------------------------------ system health */
@Component({
  selector: 'z-health',
  standalone: true,
  imports: [CommonModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-health>
  <h2>System health</h2>
  <p class="zad-muted">The state of what ZEO depends on: database, background jobs, the scheduler, e-mail, storage, backups, the licence and updates.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <div class="zad-act" style="margin:0 0 12px"><button type="button" class="zad-btn" (click)="load()" [disabled]="busy">Check again</button>
    <button type="button" class="zad-btn" (click)="load(true)" [disabled]="busy" data-test-mail>Test e-mail</button>
    <span class="zad-muted" *ngIf="h">Checked {{ h.checked_at | date:'d MMM, HH:mm:ss' }} ·
      <span [class.zad-ok]="h.state === 'ok'" [class.zad-bad]="h.state === 'bad'">{{ h.state === 'ok' ? 'All good' : h.state === 'warn' ? 'Needs a look' : 'Something is wrong' }}</span></span></div>
  <div class="zad-health" *ngIf="h">
    <div class="zad-h" *ngFor="let c of h.checks" [ngClass]="c.state" [attr.data-check]="c.key"><b>{{ c.label }}</b><div class="t">{{ c.text }}</div><div class="d" *ngIf="c.detail">{{ c.detail }}</div></div>
  </div>
</div>`,
})
export class ZHealthComponent extends ZAdminBase implements OnInit {
  h: any = null;
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(mail = false): Promise<void> { this.msg = ''; await this.act(async () => { this.h = await this.get(`/zeo-admin/api/health/${mail ? '?test_mail=1' : ''}`); }); }
}

/* ------------------------------------------------------------------------------------------------ v1.53.0 data retention and privacy */
export async function downloadBlob(http: HttpClient, url: string, fallback: string): Promise<void> {
  const r = await firstValueFrom(http.get(url, { responseType: 'blob', observe: 'response' }));
  const cd = r.headers.get('Content-Disposition') || '';
  const name = (/filename="([^"]+)"/.exec(cd) || [])[1] || fallback;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(r.body as Blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

@Component({
  selector: 'z-privacy',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-privacy>
  <h2>Data retention and privacy</h2>
  <p class="zad-muted">Remove the personal data of employees who left some years ago (the payroll, leave and attendance records stay, for the law and the accounts), and export all the data about a person when they ask for it (PDPL / GDPR).</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card" *ngIf="p" data-retention>
    <h3><mat-icon>auto_delete</mat-icon>Retention</h3>
    <div class="zad-grid"><label>Anonymise employees … years after their last working day (0 = never)<input type="number" min="0" max="50" [(ngModel)]="p.anonymise_after_years" data-ret-years></label></div>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.delete_documents"> Also delete their documents (passport, visa, Emirates ID …) and the files</label>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.delete_attachments"> Also delete photos and files on their leave, attendance, requests and payslip PDFs</label>
    <label class="zad-chk"><input type="checkbox" [(ngModel)]="p.automatic" data-ret-auto> Do it every night for those who are due (otherwise from the list below)</label>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="save()" [disabled]="busy" data-ret-save>Save</button>
      <span class="zad-muted" *ngIf="p.last_run">Last run {{ p.last_run | date:'dd/MM/yyyy HH:mm' }}: {{ p.last_result }}</span></div>
    <p class="zad-muted">Removed: the name (shown as "Former employee" and the code), date of birth, e-mails, phone numbers, addresses, parents' names, blood group, marital status, photo, face template, family members, bank accounts, qualifications, skills and extra fields; the login is switched off. Kept: the code, branch, department, designation, joining and leaving dates, and their payroll, leave, attendance and end-of-service records.</p>
  </section>
  <section class="zad-card" data-due>
    <h3><mat-icon>person_off</mat-icon>{{ 'Due for anonymising ({0})' | t:[due.length] }}</h3>
    <table class="zad-t" *ngIf="due.length"><tr><th><input type="checkbox" (change)="all($event)" aria-label="Choose all"></th><th>Employee</th><th>Last working day</th></tr>
      <tr *ngFor="let d of due" [attr.data-due-row]="d.id"><td><input type="checkbox" [checked]="sel.has(d.id)" (change)="tog(d.id)" [attr.aria-label]="d.name"></td><td><b>{{ d.name }}</b><span class="zad-muted"> · {{ d.code }}</span></td><td>{{ d.left_on | date:'dd/MM/yyyy' }}</td></tr></table>
    <p class="zad-muted" *ngIf="!due.length">{{ p?.anonymise_after_years ? 'Nobody is due.' : 'Set the number of years first.' }}</p>
    <div class="zad-act" *ngIf="due.length"><button type="button" class="zad-btn danger" (click)="anonymise()" [disabled]="busy || !sel.size" data-anonymise>Anonymise the chosen ({{ sel.size }})</button></div>
  </section>
  <section class="zad-card" data-export>
    <h3><mat-icon>download</mat-icon>Export all the data about a person</h3>
    <div class="zad-act" style="margin:0"><input [(ngModel)]="qtext" (keyup.enter)="find()" placeholder="Employee code or name" aria-label="Employee" style="width:240px" data-exp-q>
      <button type="button" class="zad-btn" (click)="find()" data-exp-find>Find</button></div>
    <table class="zad-t" *ngIf="found.length" style="margin-top:8px"><tr *ngFor="let e of found"><td><b>{{ e.name }}</b><span class="zad-muted"> · {{ e.code }}{{ e.active ? '' : ' · left' }}</span></td>
      <td><button type="button" class="zad-btn sm" (click)="exportOne(e)" [disabled]="busy" [attr.data-exp]="e.id">Download the zip</button></td></tr></table>
    <p class="zad-muted">The zip holds every record linked to the employee (one CSV per record type and one JSON file) and their documents and photos. Employees download their own data from My sign-in.</p>
  </section>
  <section class="zad-card" data-legal-holds>   <!-- v1.61.0 -->
    <h3><mat-icon>gavel</mat-icon>Legal holds</h3>
    <p class="zad-muted">While an employee is under a legal hold (a claim, a labour case, an audit), ZEO refuses to delete or anonymise their records: the employee, documents, family, identity, letters, tickets, cases, resignation, leave and payslips. The retention list skips them.</p>
    <div class="zad-act" style="margin:0 0 6px"><label class="zad-chk"><input type="radio" name="hscope" value="employee" [(ngModel)]="hf.scope"> An employee</label>
      <label class="zad-chk"><input type="radio" name="hscope" value="case" [(ngModel)]="hf.scope" data-hold-scope-case> A case</label>
      <label class="zad-chk"><input type="radio" name="hscope" value="company" [(ngModel)]="hf.scope" data-hold-scope-company> The whole company (no history cleaning)</label></div>
    <div class="zad-act" style="margin:0" *ngIf="hf.scope === 'employee'"><input [(ngModel)]="hq" (keyup.enter)="findHold()" placeholder="Employee code or name" aria-label="Employee" style="width:220px" data-hold-q>
      <button type="button" class="zad-btn" (click)="findHold()" data-hold-find>Find</button></div>
    <div *ngIf="hf.scope !== 'employee'" style="margin-top:8px"><div class="zad-grid">
      <label *ngIf="hf.scope === 'case'">Case<select [(ngModel)]="hf.case_model"><option value="ZeoHR.DisciplinaryCase">Disciplinary case</option><option value="ZeoHR.HRTicket">HR ticket</option>
        <option value="EmpManagement.EmployeeResignation">Resignation</option></select></label>
      <label *ngIf="hf.scope === 'case'">Its number in ZEO (id)<input [(ngModel)]="hf.case_id" inputmode="numeric" data-hold-case-id></label>
      <label>Reason<input [(ngModel)]="hf.reason" maxlength="300" data-hold-reason2></label>
      <label>Case / claim no.<input [(ngModel)]="hf.case_ref" maxlength="120"></label></div>
      <div class="zad-act"><button type="button" class="zad-btn primary" (click)="placeHold()" [disabled]="busy || !hf.reason || (hf.scope === 'case' && !hf.case_id)" data-hold-place2>Place the hold</button></div></div>
    <div *ngIf="hfound.length" style="margin-top:8px">
      <div class="zad-grid">
        <label>Employee<select [(ngModel)]="hf.employee_id" data-hold-emp><option [ngValue]="null">Choose…</option><option *ngFor="let e of hfound" [ngValue]="e.id">{{ e.name }} · {{ e.code }}</option></select></label>
        <label>Reason<input [(ngModel)]="hf.reason" maxlength="300" placeholder="Labour complaint" data-hold-reason></label>
        <label>Case / claim no.<input [(ngModel)]="hf.case_ref" maxlength="120" placeholder="MOHRE 2026/1234" data-hold-case></label>
      </div>
      <div class="zad-act"><button type="button" class="zad-btn primary" (click)="placeHold()" [disabled]="busy || !hf.employee_id || !hf.reason" data-hold-place>Place the hold</button></div>
    </div>
    <table class="zad-t" *ngIf="holds.length" style="margin-top:10px">
      <tr><th>Employee</th><th>Reason</th><th>Placed</th><th>State</th><th></th></tr>
      <tr *ngFor="let h of holds" [attr.data-hold]="h.id"><td><b>{{ h.scope === 'company' ? ('Whole company' | t) : (h.name || h.code) }}</b><span class="zad-muted" *ngIf="h.code"> · {{ h.code }}</span>
        <div class="zad-muted" *ngIf="h.scope === 'case'">{{ h.case_model }} {{ h.case_label || h.case_id }}</div></td>
        <td>{{ h.reason }}<div class="zad-muted" *ngIf="h.case_ref">{{ h.case_ref }}</div></td>
        <td>{{ h.placed_at | date:'dd/MM/yyyy' }}<div class="zad-muted">{{ h.placed_by }}</div></td>
        <td><span class="zad-pill bad" *ngIf="h.active">{{ 'On hold' | t }}</span>
          <span *ngIf="!h.active" class="zad-muted">{{ 'Released' | t }} {{ h.released_at | date:'dd/MM/yyyy' }} – {{ h.release_note }}</span></td>
        <td><button type="button" class="zad-btn sm" *ngIf="h.active" (click)="releaseHold(h)" data-hold-release>Release</button></td></tr>
    </table>
    <p class="zad-muted" *ngIf="!holds.length">No legal holds.</p>
  </section>
  <section class="zad-card" data-history-link>   <!-- v1.62.0 -->
    <h3><mat-icon>cleaning_services</mat-icon>Log and history retention</h3>
    <p class="zad-muted">How long inbox items, notifications, message logs, webhook deliveries, automation runs, import history and the audit history are kept – with a preview, Clean now and a nightly job.</p>
    <div class="zad-act" style="margin:0"><a class="zad-btn" href="/main-sidebar/settings/history-retention" data-history-open>Open</a></div>
  </section>
  <section class="zad-card" *ngIf="done.length || exports.length">
    <h3><mat-icon>history</mat-icon>Done</h3>
    <table class="zad-t"><tr><th>When</th><th>Employee</th><th>What</th><th>By</th></tr>
      <tr *ngFor="let a of done"><td>{{ a.at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ a.code }}</td><td>Anonymised – {{ removedText(a.removed) }}</td><td>{{ a.automatic ? 'nightly job' : a.by }}</td></tr>
      <tr *ngFor="let x of exports"><td>{{ x.at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ x.code }}</td><td>Data exported – {{ x.records }} records, {{ x.files }} files</td><td>{{ x.self_service ? 'the employee' : x.by }}</td></tr></table>
  </section>
</div>`,
})
export class ZPrivacyComponent extends ZAdminBase implements OnInit {
  p: any = null; due: any[] = []; done: any[] = []; exports: any[] = []; sel = new Set<number>(); qtext = ''; found: any[] = [];
  holds: any[] = []; hq = ''; hfound: any[] = []; hf: any = { scope: 'employee', employee_id: null, reason: '', case_ref: '', case_model: 'ZeoHR.DisciplinaryCase', case_id: '' };   // v1.61.0 / v1.62.0
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await Promise.all([this.load(), this.loadHolds()]); }
  async loadHolds(): Promise<void> { try { this.holds = (await this.get('/zeo-admin/api/legal-holds/')).rows || []; } catch { this.holds = []; } this.cd.markForCheck(); }
  async findHold(): Promise<void> { await this.act(async () => { this.hfound = (await this.get(`/zeo-admin/api/retention/?q=${encodeURIComponent(this.hq)}`)).employees; this.hf.employee_id = this.hfound.length === 1 ? this.hfound[0].id : null; }); }
  async placeHold(): Promise<void> {
    if (await this.act(async () => { this.holds = (await this.post('/zeo-admin/api/legal-holds/', this.hf)).rows; }, 'The hold is placed.')) {
      this.hf = { scope: 'employee', employee_id: null, reason: '', case_ref: '', case_model: 'ZeoHR.DisciplinaryCase', case_id: '' }; this.hfound = []; this.hq = ''; await this.load();
    }
  }
  async releaseHold(h: any): Promise<void> {
    const note = prompt(`Why is the hold on ${h.name || h.code} released? (e.g. the case is closed)`);
    if (!note) { return; }
    if (await this.act(async () => { this.holds = (await this.post('/zeo-admin/api/legal-holds/', { action: 'release', id: h.id, note })).rows; }, 'The hold is released.')) { await this.load(); }
  }
  private take(r: any): void { this.p = r.policy; this.due = r.due; this.done = r.done; this.exports = r.exports; this.sel = new Set([...this.sel].filter(i => this.due.some(d => d.id === i))); }
  async load(): Promise<void> { try { this.take(await this.get('/zeo-admin/api/retention/')); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async save(): Promise<void> { await this.act(async () => this.take(await this.put('/zeo-admin/api/retention/', this.p)), 'Saved.'); }
  tog(id: number): void { if (this.sel.has(id)) { this.sel.delete(id); } else { this.sel.add(id); } }
  all(ev: Event): void { this.sel = (ev.target as HTMLInputElement).checked ? new Set(this.due.map(d => d.id)) : new Set(); }
  async anonymise(): Promise<void> {
    if (!confirm(`Remove the personal data of ${this.sel.size} employee(s)? This cannot be undone.`)) { return; }
    await this.act(async () => { const r = await this.post('/zeo-admin/api/retention/anonymise/', { employee_ids: [...this.sel] });
      this.say(`${r.anonymised.length} anonymised.` + (r.failed.length ? ' Not done: ' + r.failed.join('; ') : ''), !!r.failed.length); this.sel.clear(); });
    await this.load();
  }
  async find(): Promise<void> { await this.act(async () => { this.found = (await this.get(`/zeo-admin/api/retention/?q=${encodeURIComponent(this.qtext)}`)).employees; }); }
  async exportOne(e: any): Promise<void> { await this.act(() => downloadBlob(this.http, this.u(`/zeo-admin/api/privacy/export/${e.id}/`), `zeo-data-${e.code}.zip`), 'The zip is downloaded.'); await this.load(); }
  removedText(r: any): string { const n = Object.values(r?.records || {}).reduce((a: number, b: any) => a + Number(b), 0); return `${(r?.fields || []).length} fields, ${n} records, ${r?.files || 0} files`; }
}

/* ------------------------------------------------------------------------------------------------ v1.53.0 test company */
@Component({
  selector: 'z-test-company',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES],
  template: `
<div class="zad" data-test-company>
  <h2>Test company</h2>
  <p class="zad-muted">A new company with the setup of this one, but none of its employees or records – to try new leave policies, salary components, forms or automations, or to train people. No e-mail leaves ZEO for it, and outside AI is off. Administrators of this company get access. Need the data too? Use Duplicate on the company list.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card">
    <h3><mat-icon>science</mat-icon>Make a test company</h3>
    <div class="zad-grid"><label>Name<input [(ngModel)]="name" maxlength="100" placeholder="(this company) – test" data-tc-name></label></div>
    <div class="zad-muted">Copy</div>
    <label class="zad-chk" *ngFor="let k of kinds"><input type="checkbox" [checked]="pick.has(k.key)" (change)="tog(k.key)" [attr.data-tc-kind]="k.key"> {{ k.label }}</label>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="make()" [disabled]="busy || !pick.size || running()" data-tc-make>Make the test company</button>
      <span class="zad-muted" *ngIf="running()">Being made – this takes a minute or two.</span></div>
  </section>
  <section class="zad-card" *ngIf="rows.length"><table class="zad-t"><tr><th>Test company</th><th>Copied</th><th>State</th><th>Made</th><th></th></tr>
    <tr *ngFor="let t of rows" [attr.data-tc-row]="t.id"><td><b>{{ t.name }}</b><div class="zad-muted">{{ t.schema_name }}</div></td><td>{{ kindsText(t) }}</td>
      <td><span class="zad-pill" [class.ok]="t.state === 'done'" [class.bad]="t.state === 'failed'" [class.warn]="t.state === 'running'">{{ t.state_label }}</span>
        <div class="zad-muted">{{ t.state === 'failed' ? t.error : t.step }}</div></td><td>{{ t.at | date:'dd/MM/yyyy HH:mm' }}<div class="zad-muted">{{ t.by }}</div></td>
      <td style="white-space:nowrap"><button type="button" class="zad-btn sm" *ngIf="t.state === 'done'" (click)="openIt(t)" data-tc-open>Open</button>
        <button type="button" class="zad-btn sm danger" *ngIf="t.state !== 'running'" (click)="remove(t)" data-tc-delete>Delete</button></td></tr></table></section>
</div>`,
})
export class ZTestCompanyComponent extends ZAdminBase implements OnInit {
  kinds: any[] = []; rows: any[] = []; pick = new Set<string>(); name = ''; private timer: any = null;
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> { await this.load(); this.pick = new Set(this.kinds.map(k => k.key)); this.cd.markForCheck(); }
  ngOnDestroy(): void { clearTimeout(this.timer); }
  running(): boolean { return this.rows.some(r => r.state === 'running'); }
  async load(): Promise<void> {
    try { const r = await this.get('/zeo-admin/api/test-company/'); this.kinds = r.kinds; this.rows = r.rows; } catch (e) { this.say(httpErrorText(e), true); }
    clearTimeout(this.timer);
    if (this.running()) { this.timer = setTimeout(() => this.load(), 4000); }
    this.cd.markForCheck();
  }
  tog(k: string): void { if (this.pick.has(k)) { this.pick.delete(k); } else { this.pick.add(k); } }
  kindsText(t: any): string { return (t.kinds || []).map((k: string) => (this.kinds.find(x => x.key === k)?.label || k).split(' (')[0].toLowerCase()).join(', '); }
  async make(): Promise<void> { if (await this.act(() => this.post('/zeo-admin/api/test-company/', { name: this.name, kinds: [...this.pick] }), 'The test company is being made.')) { await this.load(); } }
  openIt(t: any): void {
    try { localStorage.setItem('selectedSchema', t.schema_name); localStorage.setItem('selectedSchemaId', String(t.company_id)); localStorage.removeItem('selectedBranchIds'); } catch { /* storage */ }
    window.location.href = '/main-sidebar/home';
  }
  async remove(t: any): Promise<void> {
    if (!confirm(`Delete the test company "${t.name}" and everything in it?`)) { return; }
    if (await this.act(() => this.del(`/zeo-admin/api/test-company/${t.id}/`), 'Deleted.')) { await this.load(); }
  }
}
