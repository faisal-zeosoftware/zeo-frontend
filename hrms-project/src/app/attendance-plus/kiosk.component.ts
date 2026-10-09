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
  template: `
<div class="ap-wrap" style="max-width:760px">
  <div class="ap-head">
    <div><h1>{{ info?.name || 'Attendance kiosk' }}</h1><p class="ap-desc">Scan your badge or enter your employee code and PIN to clock in or out.</p></div>
    <div class="ap-clock">{{ now | date:'HH:mm' }}</div>
  </div>
  <p class="ap-msg" *ngIf="msg" [class.err]="err" style="font-size:16px">{{ msg }}</p>
  <ng-container *ngIf="info">
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

  ngOnDestroy(): void { clearInterval(this.timer); this.stop(); }

  say(t: string, err = false): void {
    this.msg = t; this.err = err; this.cdr.markForCheck();
    setTimeout(() => { if (this.msg === t) { this.msg = ''; this.cdr.markForCheck(); } }, 6000);
  }

  async refresh(): Promise<void> {
    try {
      this.info = await this.api.get('kiosk/info/', {}, this.headers);
      this.cdr.detectChanges();
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

  async punch(body: any): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const r: any = await this.api.post('kiosk/punch/', body, this.headers);
      this.say(r.detail || 'Done.'); this.code = ''; this.pin = ''; this.card = '';
    } catch (e) { this.say(ApApi.err(e, 'Not recorded. Try again.'), true); }
    this.busy = false; this.cdr.markForCheck();
  }
}
