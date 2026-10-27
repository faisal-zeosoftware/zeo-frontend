// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { BrowserMultiFormatReader, BrowserQRCodeSvgWriter, IScannerControls } from '@zxing/browser';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ApApi } from './ap-api';

/** Kiosk page (v1.12.0) for a shared tablet: open once with the kiosk link (/attendance-kiosk/<token>?schema=<company>).
 *  Employees scan their QR badge / card, or type their employee code + PIN. Optionally shows a rotating site QR
 *  that employees scan with their phone (My Attendance → Scan site QR). No login needed – the kiosk token identifies the device. */
@Component({
  selector: 'app-attendance-kiosk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./attendance-plus.css'],
  styles: [`.ks-big { font-size: 17px; padding: 12px 20px; } .ks-in { font-size: 17px; padding: 10px; } select.ks-in { height: auto; min-height: 48px; }
    .ks-page { background: #fff; border: 1px solid #e3e6ea; border-radius: 12px; padding: 16px; } .ks-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .ks-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; } .ks-tabs button { font-size: 16px; padding: 10px 16px; border-radius: 22px; border: 1px solid #cfd5dc; background: #fff; cursor: pointer; }
    .ks-tabs button.on { background: #1f2433; color: #fff; border-color: #1f2433; }
    .ks-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; } .ks-tile { background: #f4f3fe; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; }
    .ks-tile b { font-size: 26px; } .ks-tile small { color: #7a4b00; } .ks-row { display: flex; justify-content: space-between; gap: 10px; padding: 12px 6px; border-bottom: 1px solid #eef0f2; font-size: 16px; }
    .ks-row.click { cursor: pointer; } .ks-net { font-size: 19px; border-top: 2px solid #1f2433; } .ks-warn { background: #fff4e0; color: #7a4b00; border-radius: 8px; padding: 7px 10px; }`],
  template: `
<div class="ap-wrap" style="max-width:760px">
  <div class="ap-head">
    <div><h1>{{ info?.name || 'Attendance kiosk' }}</h1><p class="ap-desc">Scan your badge or enter your employee code and PIN to clock in or out.</p></div>
    <div class="ap-clock">{{ now | date:'HH:mm' }}</div>
  </div>
  <p class="ap-msg" *ngIf="msg" [class.err]="err" style="font-size:16px">{{ msg }}</p>
  <!-- v1.51.0 self-service for staff without a phone: ID + PIN → payslips, leave balance, ask for leave, ask HR -->
  <div class="ap-card ks" *ngIf="info?.self_service && !ess && !essLogin">
    <h2>My payslip and leave</h2>
    <p class="ap-muted">See your payslips and leave balance, ask for leave or ask HR a question.</p>
    <button type="button" class="ap-btn primary ks-big" (click)="essLogin = { id: '', pin: '' }; poke()" data-ess-open>Open my page</button>
  </div>
  <div class="ap-card ks" *ngIf="essLogin && !ess">
    <h2>My payslip and leave – sign in</h2>
    <div class="ap-form">
      <label>Employee code or Emirates ID<input class="ap-input ks-in" [(ngModel)]="essLogin.id" autocomplete="off" (input)="poke()" data-ess-id></label>
      <label>PIN<input class="ap-input ks-in" type="password" inputmode="numeric" [(ngModel)]="essLogin.pin" autocomplete="off" (keyup.enter)="essSignIn()" (input)="poke()" data-ess-pin></label>
      <button type="button" class="ap-btn primary ks-big" (click)="essSignIn()" [disabled]="busy || !essLogin.id || !essLogin.pin" data-ess-signin>Sign in</button>
      <button type="button" class="ap-btn ks-big" (click)="essOut()">Cancel</button>
    </div>
  </div>
  <div class="ks-page" *ngIf="ess" (click)="poke()">
    <div class="ks-top"><div><h2 style="margin:0">{{ ess.employee.name }}</h2><span class="ap-muted">{{ ess.employee.code }} · {{ ess.employee.designation }}</span></div>
      <button type="button" class="ap-btn ks-big" (click)="essOut()" data-ess-out>Done – sign out</button></div>
    <p class="ap-muted">You are signed out by yourself after {{ idleLeft }} s without a touch.</p>
    <div *ngIf="ess.must_change_pin" class="ap-card" data-ess-newpin>   <!-- v1.62.0 the start PIN from HR is replaced by the employee's own -->
      <h3 style="margin:0 0 6px">Choose your own PIN</h3>
      <p class="ap-muted">This is your first sign-in with the start PIN from HR. Choose a PIN of 4 to 6 digits that only you know.</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
        <label>New PIN<input class="ap-input ks-in" type="password" inputmode="numeric" maxlength="6" [(ngModel)]="newPin.a" autocomplete="off" (input)="poke()" data-ess-pin-a></label>
        <label>The same PIN again<input class="ap-input ks-in" type="password" inputmode="numeric" maxlength="6" [(ngModel)]="newPin.b" autocomplete="off" (input)="poke()" data-ess-pin-b></label>
        <button type="button" class="ap-btn primary ks-big" (click)="essSetPin()" [disabled]="busy || !newPin.a" data-ess-pin-save>Save my PIN</button></div>
    </div>
    <ng-container *ngIf="!ess.must_change_pin">
    <div class="ks-tabs"><button type="button" *ngFor="let t of essTabs" [class.on]="essTab === t[0]" (click)="essTab = t[0]; slip = null" [attr.data-ess-tab]="t[0]">{{ t[1] }}</button></div>
    <ng-container *ngIf="essTab === 'home'">
      <div class="ks-tiles"><div *ngFor="let b of ess.balances" class="ks-tile"><b>{{ b.balance }}</b><span>{{ b.type }}</span><small *ngIf="b.pending">{{ b.pending }} waiting for approval</small></div>
        <p class="ap-muted" *ngIf="!ess.balances.length">No leave balance.</p></div>
      <h3>My leave requests</h3>
      <div class="ks-row" *ngFor="let r of ess.requests"><span>{{ r.type }} · {{ r.from | date:'d MMM' }} – {{ r.to | date:'dd/MM/yyyy' }} ({{ r.days }} d)</span><b>{{ r.status }}</b></div>
      <p class="ap-muted" *ngIf="!ess.requests.length">No leave request.</p>
    </ng-container>
    <ng-container *ngIf="essTab === 'pay'">
      <div *ngIf="!slip"><div class="ks-row click" *ngFor="let p of ess.payslips" (click)="openSlip(p)" [attr.data-ess-slip]="p.id"><span>{{ p.period }}</span><b>{{ p.net | number:'1.2-2' }}</b></div>
        <p class="ap-muted" *ngIf="!ess.payslips.length">No payslip yet.</p></div>
      <div *ngIf="slip"><h3>{{ slip.period }}</h3>
        <div class="ks-row" *ngFor="let l of slip.lines"><span>{{ l.name }}</span><b>{{ (l.type === 'deduction' ? '-' : '') }}{{ l.amount | number:'1.2-2' }}</b></div>
        <div class="ks-row ks-net"><span>Net pay</span><b>{{ slip.net | number:'1.2-2' }}</b></div>
        <button type="button" class="ap-btn" (click)="slip = null">Back</button></div>
    </ng-container>
    <ng-container *ngIf="essTab === 'leave'">
      <div class="ap-form">
        <label>Leave type<select class="ap-input ks-in" [(ngModel)]="lv.leave_type" (ngModelChange)="essCheck()" data-ess-lt><option [ngValue]="null">Choose…</option><option *ngFor="let t of ess.leave_types" [ngValue]="t.id">{{ t.name }}</option></select></label>
        <label>From<input class="ap-input ks-in" type="date" [(ngModel)]="lv.start_date" (ngModelChange)="essCheck()" data-ess-from></label>
        <label>To<input class="ap-input ks-in" type="date" [(ngModel)]="lv.end_date" (ngModelChange)="essCheck()" data-ess-to></label>
        <label style="flex:1;min-width:220px">Reason<input class="ap-input ks-in" [(ngModel)]="lv.reason"></label>
      </div>
      <div *ngIf="lvChk" style="margin:8px 0"><b>{{ lvChk.days }} day(s)</b>
        <p class="ap-msg err" *ngFor="let e of lvChk.errors">{{ e }}</p><p class="ks-warn" *ngFor="let w of lvChk.warnings">{{ w.text }}</p></div>
      <button type="button" class="ap-btn primary ks-big" (click)="essLeave()" [disabled]="busy || !lv.leave_type || !lv.start_date || !lv.end_date || lvChk?.errors?.length" data-ess-send-leave>Send for approval</button>
    </ng-container>
    <ng-container *ngIf="essTab === 'help'">
      <div class="ap-form">
        <label>About<select class="ap-input ks-in" [(ngModel)]="hq.category" data-ess-cat><option [ngValue]="null">Choose…</option><option *ngFor="let c of ess.help_categories" [ngValue]="c.id">{{ c.name }}</option></select></label>
        <label style="flex:1;min-width:260px">Your question<textarea class="ap-input ks-in" rows="3" [(ngModel)]="hq.description" data-ess-q></textarea></label>
      </div>
      <button type="button" class="ap-btn primary ks-big" (click)="essAsk()" [disabled]="busy || !hq.category || !hq.description" data-ess-ask>Send to HR</button>
      <p class="ap-muted">HR answers by message, e-mail or WhatsApp / SMS when your company uses it – or ask at the HR desk with the number.</p>
    </ng-container>
  </ng-container>
  </div>
  <ng-container *ngIf="info && !ess && !essLogin">
    <!-- v1.49.0: the kiosk takes a photo with every punch (front camera) -->
    <div class="ap-card ap-selfie" *ngIf="info.take_photo">
      <video #selfie class="ap-video" playsinline muted autoplay style="max-height:220px;transform:scaleX(-1)"></video>
      <p class="ap-muted">Look at the camera – a photo is taken with your punch.</p>
    </div>
    <div class="ap-card" *ngIf="info.allow_qr">
      <h2>Badge / QR</h2>
      <video #video class="ap-video" playsinline></video>
      <div class="ap-tools" style="margin-top:8px">
        <button type="button" class="ap-btn" (click)="scanning ? stop() : scan()">{{ scanning ? 'Stop camera' : 'Start camera' }}</button>
        <input class="ap-input" placeholder="…or type / swipe the card number" [(ngModel)]="card" (keyup.enter)="punch({ qr: card })">
      </div>
    </div>
    <div class="ap-card" *ngIf="info.allow_pin">
      <h2>Employee code + PIN</h2>
      <div class="ap-form">
        <label>Employee code<input class="ap-input" [(ngModel)]="code" autocomplete="off"></label>
        <label>PIN<input class="ap-input" type="password" inputmode="numeric" [(ngModel)]="pin" autocomplete="off" (keyup.enter)="punchPin()"></label>
        <button type="button" class="ap-btn primary" (click)="punchPin()" [disabled]="busy || !code || !pin">Clock in / out</button>
      </div>
    </div>
    <div class="ap-card" *ngIf="info.show_site_qr">
      <h2>Scan with your phone</h2>
      <p class="ap-muted">Open My Attendance on your phone and press "Scan site QR". The code changes every few seconds.</p>
      <div class="ap-qr" #siteBox></div>
    </div>
  </ng-container>
</div>`,
})
export class AttendanceKioskComponent implements OnInit, OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('siteBox') siteBox?: ElementRef<HTMLDivElement>;
  @ViewChild('selfie') selfie?: ElementRef<HTMLVideoElement>;
  private selfieStream?: MediaStream;
  api: ApApi;
  token = '';
  info: any = null;
  msg = '';
  err = false;
  busy = false;
  now = new Date();
  card = '';
  code = '';
  pin = '';
  scanning = false;
  private controls?: IScannerControls;
  private timer: any;
  private lastText = '';
  private lastAt = 0;

  constructor(http: HttpClient, rec: ZRecordService, route: ActivatedRoute, private cdr: ChangeDetectorRef) {
    this.token = route.snapshot.paramMap.get('token') || '';
    this.api = new ApApi(http, rec, route.snapshot.queryParamMap.get('schema') || localStorage.getItem('selectedSchema') || '');
  }

  get headers(): Record<string, string> { return { 'X-Kiosk-Token': this.token }; }

  ngOnInit(): void {
    this.refresh();
    this.timer = setInterval(() => { this.now = new Date(); if (this.info?.show_site_qr) this.refresh(); this.cdr.markForCheck(); }, 10000);
  }

  ngOnDestroy(): void { clearInterval(this.idleTimer); clearInterval(this.timer); this.stop(); this.selfieStream?.getTracks().forEach(t => t.stop()); }

  /** v1.49.0: front camera for the punch photo. */
  private async startSelfie(): Promise<void> {
    if (this.selfieStream || !this.info?.take_photo) return;
    try {
      this.selfieStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setTimeout(() => { if (this.selfie) { this.selfie.nativeElement.srcObject = this.selfieStream!; this.selfie.nativeElement.play().catch(() => {}); } }, 50);
    } catch { this.say('The camera could not be opened – the kiosk needs it for the punch photo.', true); }
  }

  private grab(): string {
    const v = (this.selfie?.nativeElement && this.selfieStream) ? this.selfie.nativeElement : (this.scanning ? this.video?.nativeElement : undefined);
    if (!v || !v.videoWidth) return '';
    const c = document.createElement('canvas');
    const w = Math.min(480, v.videoWidth); c.width = w; c.height = Math.round(v.videoHeight * w / v.videoWidth);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }

  say(t: string, err = false): void {
    this.msg = t; this.err = err; this.cdr.markForCheck();
    setTimeout(() => { if (this.msg === t) { this.msg = ''; this.cdr.markForCheck(); } }, 6000);
  }

  async refresh(): Promise<void> {
    try {
      this.info = await this.api.get('kiosk/info/', {}, this.headers);
      this.cdr.detectChanges();
      this.startSelfie();
      const box = this.siteBox?.nativeElement;
      if (box && this.info.site_qr) { box.innerHTML = ''; box.appendChild(new BrowserQRCodeSvgWriter().write(this.info.site_qr, 260, 260)); }
    } catch (e) { this.say(ApApi.err(e, 'This kiosk link is not valid. Ask HR for the kiosk link.'), true); }
  }

  async scan(): Promise<void> {
    this.scanning = true; this.cdr.detectChanges();
    try {
      this.controls = await new BrowserMultiFormatReader().decodeFromVideoDevice(undefined, this.video!.nativeElement, res => {
        if (!res) return;
        const t = res.getText();
        if (t === this.lastText && Date.now() - this.lastAt < 5000) return;   // same badge held in front of the camera
        this.lastText = t; this.lastAt = Date.now();
        this.punch({ qr: t });
      });
    } catch { this.scanning = false; this.say('The camera could not be opened. Allow camera access, or type the card number.', true); }
  }

  stop(): void { try { this.controls?.stop(); } catch { /* stopped */ } this.controls = undefined; this.scanning = false; }

  punchPin(): void { this.punch({ employee_code: this.code, pin: this.pin }); }

  // ---------------------------------------------------------------- v1.51.0 self-service on the kiosk
  ess: any = null; essLogin: any = null; essTab = 'home'; slip: any = null; lv: any = { leave_type: null, start_date: '', end_date: '', reason: '' };
  lvChk: any = null; hq: any = { category: null, description: '' }; idleLeft = 90; private idleTimer: any; private chkT: any;
  essTabs = [['home', 'Leave balance'], ['pay', 'Payslips'], ['leave', 'Ask for leave'], ['help', 'Ask HR']];
  private get sh(): Record<string, string> { return { ...this.headers, 'X-Kiosk-Session': this.ess?.session || '' }; }
  poke(): void {
    this.idleLeft = 90; clearInterval(this.idleTimer);
    this.idleTimer = setInterval(() => { this.idleLeft -= 1; if (this.idleLeft <= 0) { this.essOut(); } this.cdr.markForCheck(); }, 1000);
  }
  essOut(): void { clearInterval(this.idleTimer); this.ess = null; this.essLogin = null; this.slip = null; this.lvChk = null; this.essTab = 'home';
    this.lv = { leave_type: null, start_date: '', end_date: '', reason: '' }; this.hq = { category: null, description: '' }; this.cdr.markForCheck(); }
  private keep(r: any): void { if (r?.session && this.ess) { this.ess.session = r.session; } }
  async essSignIn(): Promise<void> {
    this.busy = true;
    try { this.ess = await this.api.post('kiosk/ess/', { action: 'login', id: this.essLogin.id, pin: this.essLogin.pin }, this.headers); this.essLogin = null; this.poke(); }
    catch (e) { this.say(ApApi.err(e, 'ID or PIN is wrong.'), true); }
    this.busy = false; this.cdr.markForCheck();
  }
  newPin: any = { a: '', b: '' };
  async essSetPin(): Promise<void> {
    this.busy = true;
    try { this.ess = await this.api.post('kiosk/ess/', { action: 'set_pin', pin: this.newPin.a, pin2: this.newPin.b }, this.sh); this.newPin = { a: '', b: '' };
      this.say('Your PIN is saved – use it from now on.'); this.poke(); }
    catch (e) { this.say(ApApi.err(e, 'The PIN could not be saved.'), true); }
    this.busy = false; this.cdr.markForCheck();
  }
  async openSlip(p: any): Promise<void> {
    try { const r: any = await this.api.post('kiosk/ess/', { action: 'payslip', id: p.id }, this.sh); this.keep(r); this.slip = r; }
    catch (e) { this.essFail(e); }
    this.cdr.markForCheck();
  }
  essCheck(): void {
    clearTimeout(this.chkT);
    if (!this.lv.leave_type || !this.lv.start_date || !this.lv.end_date) { this.lvChk = null; return; }
    this.chkT = setTimeout(async () => {
      try { const r: any = await this.api.post('kiosk/ess/', { action: 'check', ...this.lv }, this.sh); this.keep(r); this.lvChk = r; } catch (e) { this.essFail(e); }
      this.cdr.markForCheck();
    }, 300);
  }
  async essLeave(): Promise<void> {
    this.busy = true;
    try { const r: any = await this.api.post('kiosk/ess/', { action: 'leave', ...this.lv }, this.sh); this.keep(r);
      this.say(`Leave request ${r.number || ''} sent for approval (${r.days} day(s)).`); this.lv = { leave_type: null, start_date: '', end_date: '', reason: '' }; this.lvChk = null;
      this.ess = { ...(await this.api.get('kiosk/ess/', {}, this.sh)) }; this.essTab = 'home'; }
    catch (e) { this.essFail(e); }
    this.busy = false; this.cdr.markForCheck();
  }
  async essAsk(): Promise<void> {
    this.busy = true;
    try { const r: any = await this.api.post('kiosk/ess/', { action: 'ask', category: this.hq.category, description: this.hq.description }, this.sh); this.keep(r);
      this.say(`Sent to HR as ${r.number}.`); this.hq = { category: null, description: '' }; }
    catch (e) { this.essFail(e); }
    this.busy = false; this.cdr.markForCheck();
  }
  private essFail(e: any): void {
    const t = ApApi.err(e, 'Not sent. Try again.');
    if ((e as any)?.status === 401) { this.essOut(); }
    this.say(t, true);
  }

  async punch(body: any): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      if (this.info?.take_photo) { const photo = this.grab(); if (photo) body = { ...body, photo }; }
      const r: any = await this.api.post('kiosk/punch/', body, this.headers);
      this.say(r.detail || 'Done.'); this.code = ''; this.pin = ''; this.card = '';
    } catch (e) { this.say(ApApi.err(e, 'Not recorded. Try again.'), true); }
    this.busy = false; this.cdr.markForCheck();
  }
}
