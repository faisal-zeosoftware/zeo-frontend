import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18N_UI } from '../shared-ui/i18n.service';
import { CLOUD_URL, errText, T, ZeoMobileService } from './m.service';

/** v1.25.0 – /m: where the app starts (server chosen? signed in? fingerprint?). */
@Component({
  selector: 'zm-start',
  standalone: true,
  imports: [CommonModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<div class="mf" style="align-items:center;justify-content:center;text-align:center">
  <img class="mf-logo" style="align-self:center;height:44px" src="assets/zeo_logo_new.png" alt="ZEO">
  <div class="spin dark" *ngIf="!msg"></div>
  <ng-container *ngIf="msg">
    <div class="mmsg">{{ msg }}</div>
    <button type="button" class="mbtn" (click)="go()">{{ 'Try again' | t }}</button>
    <button type="button" class="mlink" (click)="pwd()">{{ 'Sign in with password' | t }}</button>
  </ng-container>
</div>`,
})
export class MStartComponent implements OnInit {
  msg = '';
  constructor(private m: ZeoMobileService, private router: Router) {}
  ngOnInit(): void { void this.m.startApp(); void this.go(); }

  async go(): Promise<void> {
    this.msg = '';
    if (!this.m.hasServer()) { this.router.navigate(['/m/connect']); return; }
    if (this.m.tokenOk()) { await this.next(); return; }
    if (this.m.biometricOn()) {
      try { await this.m.unlock(); await this.next(); return; }
      catch (e: any) { if (String(e?.message || '').match(/cancel/i)) { this.pwd(); return; } this.msg = e?.message || T('Fingerprint sign-in did not work.'); return; }
    }
    this.pwd();
  }
  private async next(): Promise<void> {
    try { await this.m.afterLogin(); } catch (e) { this.msg = errText(e, 'The server could not be reached. Check the internet connection and the server address.'); }
  }
  pwd(): void { this.router.navigate(['/m/login']); }
}

/** v1.25.0 – /m/connect: ZEO Cloud or the company's own server. */
@Component({
  selector: 'zm-connect',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<form class="mf" (ngSubmit)="connect()">
  <img class="mf-logo" src="assets/zeo_logo_new.png" alt="ZEO">
  <h1>{{ 'Where is your ZEO?' | t }}</h1>
  <p class="lead">{{ 'Choose once. You can change it later under More.' | t }}</p>
  <button type="button" class="mchoice" [class.on]="mode === 'cloud'" (click)="mode = 'cloud'; msg = ''">
    <span class="ic"><span class="material-icons" aria-hidden="true">cloud</span></span>
    <span class="tx"><b>ZEO Cloud</b><span>{{ 'Your company signed up for ZEO online' | t }}</span></span></button>
  <button type="button" class="mchoice" [class.on]="mode === 'own'" (click)="mode = 'own'; msg = ''">
    <span class="ic"><span class="material-icons" aria-hidden="true">dns</span></span>
    <span class="tx"><b>{{ 'Company server' | t }}</b><span>{{ 'ZEO runs on your company\\'s own server' | t }}</span></span></button>
  <label class="mfield" *ngIf="mode === 'own'">{{ 'Server address' | t }}
    <input name="url" [(ngModel)]="url" type="url" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="https://hr.yourcompany.ae">
    <small>{{ 'Ask your HR or IT team. It is the address you open ZEO with in the browser.' | t }}</small></label>
  <div class="mmsg" *ngIf="msg" role="alert">{{ msg }}</div>
  <div class="mmsg info" *ngIf="warnHttp()">{{ 'This address is not secure (http). Use https for real data.' | t }}</div>
  <button type="submit" class="mbtn" [disabled]="busy || !mode || (mode === 'own' && !url.trim())">
    <span class="spin" *ngIf="busy"></span>{{ busy ? ('Checking…' | t) : ('Continue' | t) }}</button>
  <div class="mf-foot"><z-lang-picker variant="select" [reload]="true" [showAlways]="true"></z-lang-picker><span>ZEO {{ ver }}</span></div>
</form>`,
})
export class MConnectComponent {
  mode: '' | 'cloud' | 'own' = '';
  url = '';
  msg = '';
  busy = false;
  ver: string;
  constructor(private m: ZeoMobileService, private router: Router, private cd: ChangeDetectorRef) {
    this.ver = m.appVersion;
    const cur = m.serverInfo();
    if (cur?.url) { this.mode = cur.url === CLOUD_URL ? 'cloud' : 'own'; this.url = cur.url === CLOUD_URL ? '' : cur.url; }
  }
  warnHttp(): boolean { return this.mode === 'own' && /^http:\/\//i.test(this.url.trim()) && !/localhost|127\.0\.0\.1/.test(this.url); }
  async connect(): Promise<void> {
    this.busy = true; this.msg = '';
    try {
      const info = await this.m.check(this.mode === 'cloud' ? CLOUD_URL : this.url);
      this.m.useServer(info);
      this.router.navigate(['/m/login']);
    } catch (e: any) { this.msg = e?.message || T('No ZEO server answered.'); }
    this.busy = false; this.cd.detectChanges();
  }
}

/** v1.25.0 – /m/login: e-mail or employee code + password, the code for office users, then fingerprint. */
@Component({
  selector: 'zm-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<form class="mf" (ngSubmit)="submit()" autocomplete="on">
  <img class="mf-logo" src="assets/zeo_logo_new.png" alt="ZEO">
  <ng-container *ngIf="step === 1">
    <h1>{{ 'Sign in' | t }}</h1>
    <p class="lead">{{ where }}</p>
    <button type="button" class="mbtn soft" *ngIf="bioReady" (click)="bio()" [disabled]="busy">
      <span class="material-icons" aria-hidden="true">fingerprint</span>{{ 'Sign in with fingerprint' | t }}</button>
    <label class="mfield">{{ 'E-mail or employee code' | t }}
      <input name="u" [(ngModel)]="username" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="email"></label>
    <label class="mfield">{{ 'Password' | t }}
      <span style="position:relative;display:block"><input name="p" [(ngModel)]="password" [type]="show ? 'text' : 'password'" autocomplete="current-password">
        <button type="button" (click)="show = !show" [attr.aria-label]="(show ? 'Hide password' : 'Show password') | t"
          style="position:absolute;inset-inline-end:4px;top:3px;width:44px;height:44px;border:0;background:none;color:#6e6578"><span class="material-icons">{{ show ? 'visibility_off' : 'visibility' }}</span></button></span></label>
  </ng-container>
  <ng-container *ngIf="step === 2">
    <h1>{{ 'Confirm it is you' | t }}</h1>
    <p class="lead">{{ 'We send a code to your registered e-mail or phone.' | t }}</p>
  </ng-container>
  <ng-container *ngIf="step === 3">
    <h1>{{ 'Enter the code' | t }}</h1>
    <p class="lead">{{ 'We sent the code to your registered e-mail or phone.' | t }}</p>
    <label class="mfield">{{ 'Code' | t }}<input name="otp" [(ngModel)]="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></label>
  </ng-container>
  <ng-container *ngIf="step === 4">
    <span class="material-icons" style="font-size:56px;color:#5b2087" aria-hidden="true">fingerprint</span>
    <h1>{{ 'Use your fingerprint next time?' | t }}</h1>
    <p class="lead">{{ 'Open ZEO with your {0} instead of the password and code. You can turn it off under More.' | t:bioKind }}</p>
  </ng-container>
  <div class="mmsg" *ngIf="msg" role="alert">{{ msg }}</div>
  <div class="mmsg" *ngIf="old">{{ 'This app is older than your server allows. Update ZEO from the Play Store.' | t }}</div>
  <button type="submit" class="mbtn" [disabled]="busy">
    <span class="spin" *ngIf="busy"></span>{{ label() | t }}</button>
  <button type="button" class="mlink" *ngIf="step === 4" (click)="done()">{{ 'Not now' | t }}</button>
  <button type="button" class="mlink" *ngIf="step === 2 || step === 3" (click)="step = 1; msg = ''">{{ 'Back' | t }}</button>
  <div class="mf-foot">
    <button type="button" class="mlink" style="padding:0" (click)="change()">{{ 'Change server' | t }}</button>
    <z-lang-picker variant="select" [reload]="true" [showAlways]="true"></z-lang-picker></div>
</form>`,
})
export class MLoginComponent implements OnInit {
  step = 1; username = ''; password = ''; otp = ''; show = false; busy = false; msg = '';
  userId: any = null; bioReady = false; bioKind = 'fingerprint'; where = ''; old = false;
  constructor(private m: ZeoMobileService, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    if (!this.m.hasServer()) { this.router.navigate(['/m/connect']); return; }
    const info = this.m.serverInfo();
    this.where = info?.name || (this.m.isCloud() ? 'ZEO Cloud' : this.m.server().replace(/^https?:\/\//, ''));
    this.old = this.m.outdated();
    const b = await this.m.biometricAvailable();
    this.bioKind = T(b.kind || 'fingerprint');
    this.bioReady = b.ok && this.m.biometricOn();
    this.cd.detectChanges();
  }
  label(): string { return ({ 1: 'Sign in', 2: 'Send the code', 3: 'Confirm', 4: 'Use fingerprint' } as any)[this.step]; }

  async submit(): Promise<void> {
    if (this.step === 1) { return this.signIn(); }
    if (this.step === 2) { return this.sendCode(); }
    if (this.step === 3) { return this.verify(); }
    return this.enableBio();
  }
  private async run(fn: () => Promise<void>): Promise<void> {
    this.busy = true; this.msg = '';
    try { await fn(); } catch (e: any) { this.msg = e?.message && !e?.status ? e.message : errText(e, 'It did not work. Try again.'); }
    this.busy = false; this.cd.detectChanges();
  }
  signIn(): Promise<void> {
    return this.run(async () => {
      if (!this.username.trim() || !this.password) { throw new Error(T(!this.username.trim() ? 'Enter your e-mail or employee code.' : 'Enter your password.')); }
      const body = { username: this.username.trim(), password: this.password };
      try { await this.m.post('/users/validate-credentials/', body, false); }
      catch (e: any) { if (e?.status === 0 || e?.name === 'TimeoutError') { throw e; } throw new Error(T('The e-mail, employee code or password is not correct.')); }
      const r: any = await this.m.post('/users/token/', body, false);
      this.m.storeLogin({ access: r.access, refresh: r.refresh, user_id: r.user_id });
      const u: any = await this.m.get(`/users/api/user/${r.user_id}/`, false);
      this.m.storeLogin({ access: r.access, refresh: r.refresh, user_id: r.user_id, username: u.username, email: u.email, is_ess: u.is_ess, is_superuser: u.is_superuser });
      if (u.is_superuser || u.is_ess) { await this.offerBio(); return; }
      this.userId = r.user_id;
      this.step = 2;
    });
  }
  sendCode(): Promise<void> {
    return this.run(async () => { await this.m.post('/users/send-otp/', { user_id: this.userId }, false); this.step = 3; });
  }
  verify(): Promise<void> {
    return this.run(async () => {
      if (!this.otp.trim()) { throw new Error(T('Enter the code.')); }
      let r: any;
      try { r = await this.m.post('/users/verify-otp/', { user_id: this.userId, otp: this.otp.trim() }, false); }
      catch (e: any) { if (e?.status === 400) { throw new Error(T('The code is not correct or has expired.')); } throw e; }
      const u = this.m.user() || {};
      this.m.storeLogin({ ...r, is_ess: u.is_ess, is_superuser: u.is_superuser, email: u.email });
      await this.offerBio();
    });
  }
  private async offerBio(): Promise<void> {
    const b = await this.m.biometricAvailable();
    if (b.ok && !this.m.biometricOn()) { this.bioKind = T(b.kind || 'fingerprint'); this.step = 4; return; }
    await this.m.afterLogin();
  }
  enableBio(): Promise<void> {
    return this.run(async () => {
      try { await this.m.enableBiometric(); } catch (e: any) { this.msg = errText(e, 'Fingerprint sign-in could not be turned on.'); }
      await this.m.afterLogin();
    });
  }
  done(): Promise<void> { return this.run(() => this.m.afterLogin()); }
  bio(): Promise<void> { return this.run(async () => { await this.m.unlock(); await this.m.afterLogin(); }); }
  change(): void { this.router.navigate(['/m/connect']); }
}

/** v1.25.0 – /m/companies: a login with several companies (or several customers on ZEO Cloud). */
@Component({
  selector: 'zm-companies',
  standalone: true,
  imports: [CommonModule, ...I18N_UI],
  styleUrls: ['./m.css'],
  template: `
<div class="mf">
  <img class="mf-logo" src="assets/zeo_logo_new.png" alt="ZEO">
  <h1>{{ 'Choose a company' | t }}</h1>
  <p class="lead" *ngIf="list.length">{{ 'You have access to {0} companies.' | t:list.length }}</p>
  <div class="skel" *ngIf="loading"></div><div class="skel" *ngIf="loading"></div>
  <ng-container *ngFor="let g of groups">
    <div class="mgroup" *ngIf="g.name">{{ g.name }}</div>
    <button type="button" class="mchoice" *ngFor="let c of g.list" (click)="pick(c)" [disabled]="c.moving">
      <span class="ic">{{ initials(c.name) }}</span>
      <span class="tx"><b>{{ c.name }}</b><span>{{ c.moving ? ('Being moved – back in a few minutes' | t) : (c.read_only ? ('Read-only' | t) : (c.industry || '')) }}</span></span>
      <span class="material-icons chev" aria-hidden="true">chevron_right</span></button>
  </ng-container>
  <div class="mmsg" *ngIf="msg">{{ msg }}</div>
  <div class="empty" *ngIf="!loading && !list.length && !msg"><span class="material-icons">domain_disabled</span>{{ 'No company is set up for your login yet. Ask your HR team.' | t }}</div>
  <div class="mf-foot"><button type="button" class="mlink" (click)="out()">{{ 'Sign out' | t }}</button></div>
</div>`,
})
export class MCompaniesComponent implements OnInit {
  list: any[] = []; groups: { name: string; list: any[] }[] = []; loading = true; msg = '';
  constructor(private m: ZeoMobileService, private router: Router, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    try {
      const r: any = await this.m.get('/users/api/my-companies/', false);
      this.list = r.companies || [];
      const accs: any[] = r.accounts || [];
      this.groups = accs.length ? accs.map(a => ({ name: a.name, list: this.list.filter(c => c.account === a.id) })).filter(g => g.list.length) : [];
      const rest = this.list.filter(c => !c.account || !accs.some(a => a.id === c.account));
      if (rest.length) { this.groups.push({ name: this.groups.length ? T('Other companies') : '', list: rest }); }
    } catch (e) { this.msg = errText(e, 'Your companies could not be loaded.'); }
    this.loading = false; this.cd.detectChanges();
  }
  initials(n: string): string { return (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  pick(c: any): void { this.m.setCompany(c.schema_name, c.name); void this.m.registerDevice({}); this.router.navigate(['/m/home']); }
  out(): void { void this.m.signOut(); }
}
