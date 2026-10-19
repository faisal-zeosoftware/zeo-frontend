import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { ZaApiService, ZaClient, base, day, when } from './za-api.service';

/** Resource URLs for the PDF frame. */
@Injectable({ providedIn: 'root' })
export class DomSanitizerLike { constructor(private s: DomSanitizer) {} bypass(u: string): any { return this.s.bypassSecurityTrustResourceUrl(u); } }

/** v1.36.0 ZEO People – the screens that are not plain registers: signing, surveys, forms, recognition wall, chat, 360° reviewer sheet. */
const APP = 'zeo-people';

// ---------------------------------------------------------------- e-signature
@Component({
  selector: 'zp-sign',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button> Sign: {{ d?.title }}</h1>
    <p class="ex-desc" *ngIf="d">{{ d.kind }} · {{ d.number }} · <span class="hs-b" [ngClass]="d.status === 'signed' ? 'ok' : d.status === 'sent' ? 'wait' : 'bad'">{{ d.status_label }}</span>
      <span *ngIf="d.expires_at && d.status === 'sent'"> · expires {{ w(d.expires_at) }}</span></p></div></div></div>
  <div class="com_list mt-4" *ngIf="d">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
    <div class="hs-split">
      <div class="hs-card" style="min-width:0">
        <h3>Document</h3>
        <p class="hs-muted" *ngIf="d.message" style="white-space:pre-wrap">{{ d.message }}</p>
        <iframe *ngIf="docUrl" [src]="docUrl" style="width:100%;height:70vh;border:1px solid #dcdfea;border-radius:8px"></iframe>
        <pre *ngIf="!d.has_document" class="zp-text">{{ d.text }}</pre>
        <div class="hs-acts" *ngIf="d.signed_file"><button type="button" class="ex-btn" (click)="open(true)">Open the signed PDF</button></div>
      </div>
      <div class="hs-side">
        <div class="hs-card" *ngIf="d.status === 'sent'">
          <h3>Your signature</h3>
          <ng-container *ngIf="d.otp_needed">
            <p class="hs-muted">1. Get a one-time code by e-mail, then enter it here.</p>
            <div class="hs-acts"><button type="button" class="ex-btn sm" (click)="sendOtp()" [disabled]="busy">{{ otpSent ? 'Send the code again' : 'Send me the code' }}</button>
              <span class="hs-muted" *ngIf="otpTo">sent to {{ otpTo }}</span></div>
            <label>One-time code<input [(ngModel)]="otp" maxlength="6" inputmode="numeric" placeholder="6 digits"></label>
          </ng-container>
          <p class="hs-muted">{{ d.otp_needed ? '2. ' : '' }}Draw your signature, or type your name.</p>
          <span class="hs-tabs2"><button type="button" [class.on]="mode === 'draw'" (click)="mode = 'draw'">Draw</button><button type="button" [class.on]="mode === 'type'" (click)="mode = 'type'">Type</button></span>
          <div *ngIf="mode === 'draw'" style="margin-top:8px">
            <canvas #pad width="320" height="140" class="zp-pad" (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up()" (pointerleave)="up()"></canvas>
            <button type="button" class="hs-rlink" (click)="clear()">Clear</button>
          </div>
          <label *ngIf="mode === 'type'" style="margin-top:8px">Your full name<input [(ngModel)]="typed" placeholder="As it should appear"></label>
          <p class="zp-typed" *ngIf="mode === 'type' && typed">{{ typed }}</p>
          <label class="ck" style="margin-top:8px"><input type="checkbox" [(ngModel)]="agree"> I have read the document and agree to sign it electronically.</label>
          <div class="hs-acts" style="margin-top:10px">
            <button type="button" class="ex-btn primary" (click)="sign()" [disabled]="busy || !agree">{{ busy ? 'Signing…' : 'Sign' }}</button>
            <button type="button" class="ex-btn" (click)="declining = !declining">Decline</button></div>
          <div *ngIf="declining" style="margin-top:8px"><label>Why<input [(ngModel)]="reason"></label><button type="button" class="ex-btn danger sm" (click)="decline()" [disabled]="!reason">Confirm decline</button></div>
        </div>
        <div class="hs-card"><h3>Audit trail</h3>
          <div class="hs-ev" *ngFor="let a of d.audit"><div class="t">{{ a.what }}<span *ngIf="a.note"> – {{ a.note }}</span></div><div class="m">{{ a.by || '' }} {{ a.ip || '' }}<br>{{ w(a.at) }}</div></div>
          <p class="hs-empty" *ngIf="!d.audit?.length">Nothing yet.</p></div>
      </div>
    </div>
  </div>
</div></div>`,
  styles: [`.zp-pad { border: 1px dashed #9aa0b5; border-radius: 8px; background: #fff; touch-action: none; width: 100%; max-width: 320px; display: block; }
    .zp-typed { font-family: 'Segoe Script', 'Brush Script MT', cursive; font-size: 26px; color: #1b1640; margin: 6px 0; }
    .zp-text { white-space: pre-wrap; font: inherit; font-size: 13.5px; background: #f7f8fb; padding: 14px; border-radius: 8px; max-height: 70vh; overflow: auto; }`],
})
export class ZpSignComponent implements OnInit {
  @ViewChild('pad') pad?: ElementRef<HTMLCanvasElement>;
  api!: ZaClient; d: any = null; err = ''; ok = ''; busy = false; otp = ''; otpSent = false; otpTo = ''; mode = 'draw'; typed = ''; agree = false; declining = false; reason = '';
  docUrl: any = null; drawing = false; drew = false; id = 0; w = when;
  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router, private sanitizer: DomSanitizerLike) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    await this.load();
  }
  async load(): Promise<void> {
    try {
      this.d = await this.api.get(`sign/${this.id}/`);
      if (this.d.has_document) { const b = await this.api.blob(`sign/${this.id}/document/`); this.docUrl = this.sanitizer.bypass(URL.createObjectURL(b)); }
    } catch (e) { this.err = ZaApiService.error(e); }
  }
  async open(signed: boolean): Promise<void> { await this.api.file(`sign/${this.id}/document/`, `${this.d.number}${signed ? '-signed' : ''}.pdf`, signed ? { signed: 1 } : {}); }
  async sendOtp(): Promise<void> {
    this.busy = true; this.err = '';
    try { const r = await this.api.post(`sign/${this.id}/`, { otp: 'send' }); this.otpSent = true; this.otpTo = r.to; this.ok = r.sent ? 'Code sent.' : 'E-mail is not set up – ask HR for the code.' + (r.demo_code ? ' (code ' + r.demo_code + ')' : ''); }
    catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false;
  }
  ctx(): CanvasRenderingContext2D | null { return this.pad?.nativeElement.getContext('2d') || null; }
  pos(e: PointerEvent): [number, number] { const c = this.pad!.nativeElement; const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; }
  down(e: PointerEvent): void { const c = this.ctx(); if (!c) return; this.drawing = true; this.drew = true; const [x, y] = this.pos(e); c.lineWidth = 2.2; c.lineCap = 'round'; c.strokeStyle = '#1b1640'; c.beginPath(); c.moveTo(x, y); }
  move(e: PointerEvent): void { if (!this.drawing) return; const c = this.ctx(); if (!c) return; const [x, y] = this.pos(e); c.lineTo(x, y); c.stroke(); }
  up(): void { this.drawing = false; }
  clear(): void { const c = this.ctx(); if (c && this.pad) { c.clearRect(0, 0, this.pad.nativeElement.width, this.pad.nativeElement.height); } this.drew = false; }
  async sign(): Promise<void> {
    this.err = ''; this.ok = '';
    const signature = this.mode === 'draw' ? (this.drew ? this.pad!.nativeElement.toDataURL('image/png') : '') : (this.typed ? 'typed:' + this.typed : '');
    if (!signature) { this.err = 'Draw or type your signature.'; return; }
    this.busy = true;
    try { this.d = await this.api.post(`sign/${this.id}/`, { signature, otp: this.otp }); this.ok = 'Signed. Thank you.'; }
    catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false;
  }
  async decline(): Promise<void> { try { this.d = await this.api.post(`sign/${this.id}/`, { decline: this.reason }); this.declining = false; this.ok = 'Declined.'; } catch (e) { this.err = ZaApiService.error(e); } }
  back(): void { this.router.navigate([base(APP), 'home']); }
}


// ---------------------------------------------------------------- survey: take
@Component({
  selector: 'zp-survey',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button> {{ d?.title }}</h1>
    <p class="ex-desc" *ngIf="d">{{ d.description }} <span class="hs-b wait" *ngIf="d.anonymous">anonymous</span></p></div></div></div>
  <div class="com_list mt-4" *ngIf="d">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <div class="hs-card" *ngIf="done"><h3>Thank you</h3><p>{{ done }}</p></div>
    <div class="hs-card" *ngIf="!done && !d.can_take"><p class="hs-muted">{{ d.done ? 'You have already answered this survey.' : 'This survey is not open.' }}</p></div>
    <div class="hs-card" *ngIf="!done && d.can_take" style="max-width:820px">
      <div class="zp-q" *ngFor="let q of d.questions; let i = index">
        <div class="t">{{ i + 1 }}. {{ q.text }} <span class="hs-muted" *ngIf="q.required === false">(optional)</span></div>
        <div class="zp-rate" *ngIf="q.type === 'rating'"><button type="button" *ngFor="let n of [1,2,3,4,5]" [class.on]="a[i] === n" (click)="a[i] = n">{{ n }}</button>
          <span class="hs-muted">1 = strongly disagree · 5 = strongly agree</span></div>
        <div class="hs-seg" *ngIf="q.type === 'yesno'"><button type="button" class="y" [class.on]="a[i] === 'yes'" (click)="a[i] = 'yes'">Yes</button><button type="button" class="n" [class.on]="a[i] === 'no'" (click)="a[i] = 'no'">No</button></div>
        <select *ngIf="q.type === 'choice'" [(ngModel)]="a[i]"><option value="">–</option><option *ngFor="let o of opts(q)" [value]="o">{{ o }}</option></select>
        <textarea *ngIf="q.type === 'text'" rows="3" [(ngModel)]="a[i]"></textarea>
      </div>
      <div class="hs-acts"><button type="button" class="ex-btn primary" (click)="submit()" [disabled]="busy">{{ busy ? 'Saving…' : 'Submit my answers' }}</button></div>
    </div>
  </div>
</div></div>`,
  styles: [`.zp-q { padding: 12px 0; border-bottom: 1px solid #eceef5; } .zp-q .t { font-weight: 600; margin-bottom: 8px; } .zp-q select, .zp-q textarea { width: 100%; max-width: 520px; border: 1px solid #dcdfea; border-radius: 8px; padding: 8px; font: inherit; }
    .zp-rate { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; } .zp-rate button { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #dcdfea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    .zp-rate button.on { background: #5b4fe0; color: #fff; border-color: #5b4fe0; }`],
})
export class ZpSurveyComponent implements OnInit {
  api!: ZaClient; d: any = null; a: any[] = []; err = ''; done = ''; busy = false; id = 0;
  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP); this.id = Number(this.route.snapshot.paramMap.get('id'));
    try { this.d = await this.api.get(`survey/${this.id}/take/`); this.a = (this.d.questions || []).map(() => ''); } catch (e) { this.err = ZaApiService.error(e); }
  }
  opts(q: any): string[] { return String(q.options || '').split('|').map(x => x.trim()).filter(x => x); }
  async submit(): Promise<void> {
    this.err = ''; this.busy = true;
    try { const r = await this.api.post(`survey/${this.id}/take/`, { answers: this.a }); this.done = r.message; } catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false;
  }
  back(): void { this.router.navigate([base(APP), 'home']); }
}

// ---------------------------------------------------------------- survey: results
@Component({
  selector: 'zp-survey-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button> Results: {{ d?.title }}</h1>
    <p class="ex-desc" *ngIf="d">{{ d.responses }} of {{ d.invited }} answered ({{ d.rate }} %) · <span class="hs-b" [ngClass]="d.status === 'open' ? 'work' : 'ok'">{{ d.status }}</span></p></div>
    <div class="ex-actions" *ngIf="d?.departments?.length"><select [(ngModel)]="dept" (ngModelChange)="load()"><option value="">All departments</option><option *ngFor="let x of d.departments" [value]="x">{{ x }}</option></select></div></div></div>
  <div class="com_list mt-4" *ngIf="d">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <p class="hs-note info" *ngIf="d.hidden">Fewer than {{ d.min_group }} answers – results are hidden to keep them anonymous.</p>
    <ng-container *ngIf="!d.hidden">
      <div class="hs-kv3" style="margin-bottom:14px"><div class="hs-card"><small>Favourable (ratings 4–5)</small><b style="font-size:26px">{{ d.engagement ?? '–' }}%</b></div>
        <div class="hs-card"><small>Responses</small><b style="font-size:26px">{{ d.responses }}</b></div><div class="hs-card"><small>Response rate</small><b style="font-size:26px">{{ d.rate }}%</b></div></div>
      <div class="hs-card" *ngFor="let q of d.questions; let i = index">
        <h3>{{ i + 1 }}. {{ q.text }} <span class="hs-muted">· {{ q.answered }} answers</span></h3>
        <ng-container *ngIf="q.type === 'rating'">
          <div class="zp-bar-row" *ngFor="let n of [5,4,3,2,1]"><span>{{ n }}</span><div class="za-bar" style="flex:1"><span [style.width.%]="q.answered ? 100 * q.dist[n-1] / q.answered : 0" [style.background]="n >= 4 ? '#1f7a4d' : n === 3 ? '#b8730f' : '#b42318'"></span></div><b>{{ q.dist[n-1] }}</b></div>
          <p class="hs-muted">Average {{ q.avg }} · favourable {{ q.favourable }}%</p></ng-container>
        <div *ngIf="q.type === 'yesno'" class="zp-bar-row"><span>Yes {{ q.yes }}</span><div class="za-bar" style="flex:1"><span [style.width.%]="q.favourable"></span></div><span>No {{ q.no }}</span></div>
        <div *ngIf="q.type === 'choice'"><div class="zp-bar-row" *ngFor="let c of q.choices"><span style="min-width:140px">{{ c.label }}</span><div class="za-bar" style="flex:1"><span [style.width.%]="q.answered ? 100 * c.n / q.answered : 0"></span></div><b>{{ c.n }}</b></div></div>
        <ul *ngIf="q.type === 'text'" class="zp-texts"><li *ngFor="let t of q.texts">{{ t }}</li></ul>
      </div>
    </ng-container>
  </div>
</div></div>`,
  styles: ['.zp-bar-row { display: flex; align-items: center; gap: 10px; margin: 4px 0; font-size: 13px; } .zp-texts { font-size: 13.5px; padding-left: 18px; } .zp-texts li { margin: 4px 0; }'],
})
export class ZpSurveyResultsComponent implements OnInit {
  api!: ZaClient; d: any = null; err = ''; dept = ''; id = 0;
  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router) {}
  async ngOnInit(): Promise<void> { this.api = this.za.for(APP); this.id = Number(this.route.snapshot.paramMap.get('id')); await this.load(); }
  async load(): Promise<void> { try { this.d = await this.api.get(`survey/${this.id}/results/`, { department: this.dept }); } catch (e) { this.err = ZaApiService.error(e); } }
  back(): void { this.router.navigate([base(APP), 'r', 'survey', this.id]); }
}

// ---------------------------------------------------------------- forms: list + fill
@Component({
  selector: 'zp-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title"><button type="button" class="ex-btn sm" *ngIf="t" (click)="t = null; ok = ''" aria-label="Back">‹</button> {{ t ? t.name : 'Forms' }}</h1>
    <p class="ex-desc">{{ t ? t.description : 'Fill a form; it goes to the right person for approval.' }}</p></div>
    <div class="ex-actions" *ngIf="!t"><button type="button" class="ex-btn" (click)="mine()">My submissions</button></div></div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
    <div class="zp-tiles" *ngIf="!t">
      <button type="button" class="zp-tile" *ngFor="let f of list" (click)="pick(f)" [disabled]="!f.can_fill">
        <b>{{ f.name }}</b><span class="hs-muted">{{ f.description || (f.fields + ' fields') }}</span>
        <span class="m"><span class="hs-b wait" *ngIf="f.needs_approval">approval</span> <span class="hs-b work" *ngIf="f.sign">signed</span> <span class="hs-muted" *ngIf="f.mine">· sent {{ f.mine }}×</span></span></button>
      <p class="hs-empty" *ngIf="!list.length">No forms yet.</p>
    </div>
    <div class="hs-card" *ngIf="t" style="max-width:760px">
      <div class="ex-form">
        <ng-container *ngFor="let f of t.fields">
          <label *ngIf="f.type === 'textarea'" class="wide">{{ f.label }}{{ f.required ? ' *' : '' }}<textarea rows="3" [(ngModel)]="v[f.name]"></textarea></label>
          <label *ngIf="f.type === 'choice'">{{ f.label }}{{ f.required ? ' *' : '' }}<select [(ngModel)]="v[f.name]"><option value="">–</option><option *ngFor="let o of opts(f)" [value]="o">{{ o }}</option></select></label>
          <label *ngIf="f.type === 'yesno'" class="ck"><input type="checkbox" [(ngModel)]="v[f.name]"> {{ f.label }}{{ f.required ? ' *' : '' }}</label>
          <label *ngIf="f.type === 'file'" class="wide">{{ f.label }}{{ f.required ? ' *' : '' }}<input type="file" (change)="file(f.name, $any($event.target).files)"></label>
          <label *ngIf="!['textarea','choice','yesno','file'].includes(f.type)">{{ f.label }}{{ f.required ? ' *' : '' }}<input [type]="f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'" [(ngModel)]="v[f.name]"></label>
        </ng-container>
      </div>
      <p class="hs-muted" *ngIf="t.sign" style="margin-top:8px">After sending you will be asked to sign this form.</p>
      <div class="hs-acts" style="margin-top:12px"><button type="button" class="ex-btn primary" (click)="submit()" [disabled]="busy">{{ busy ? 'Sending…' : 'Send' }}</button></div>
    </div>
  </div>
</div></div>`,
  styles: [`.zp-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .zp-tile { text-align: left; background: #fff; border: 1px solid #e3e5ee; border-radius: 12px; padding: 14px; font: inherit; cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
    .zp-tile:disabled { opacity: .5; cursor: default; } .zp-tile .m { font-size: 12px; margin-top: 4px; }`],
})
export class ZpFormsComponent implements OnInit {
  api!: ZaClient; list: any[] = []; t: any = null; v: any = {}; files: Record<string, File> = {}; err = ''; ok = ''; busy = false;
  constructor(private za: ZaApiService, private router: Router, private route: ActivatedRoute) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    try { this.list = await this.api.get('forms/'); } catch (e) { this.err = ZaApiService.error(e); }
    const id = this.route.snapshot.queryParamMap.get('fill');
    if (id) { const f = this.list.find(x => String(x.id) === id); if (f) await this.pick(f); }
  }
  opts(f: any): string[] { return String(f.options || '').split('|').map(x => x.trim()).filter(x => x); }
  async pick(f: any): Promise<void> { this.err = ''; this.ok = ''; try { this.t = await this.api.get(`forms/${f.id}/`); this.v = {}; this.files = {}; } catch (e) { this.err = ZaApiService.error(e); } }
  file(name: string, fl: FileList | null): void { if (fl?.length) { this.files[name] = fl[0]; this.v[name] = fl[0].name; } }
  async submit(): Promise<void> {
    this.err = ''; this.busy = true;
    try {
      const fd = new FormData(); fd.append('data', JSON.stringify(this.v));
      Object.entries(this.files).forEach(([k, f]) => fd.append('files', f, `${k}__${f.name}`));
      const r = await this.api.post(`forms/${this.t.id}/`, fd);
      this.ok = `${r.number} sent.` + (r.links?.sign_request ? ' Please sign it: Self service → Signatures.' : '');
      this.t = null; this.list = await this.api.get('forms/');
    } catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false;
  }
  mine(): void { this.router.navigate([base(APP), 'r', 'form_submission']); }
}

// ---------------------------------------------------------------- recognition wall
@Component({
  selector: 'zp-wall',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div><h1 class="page-title">Recognition wall</h1><p class="ex-desc">Say thank you, celebrate wins. You have <b>{{ d?.my_points || 0 }}</b> {{ d?.points_name || 'points' }}.</p></div>
    <div class="ex-actions"><button type="button" class="ex-btn primary" (click)="give()">+ Recognise someone</button><button type="button" class="ex-btn" (click)="redeem()" *ngIf="d?.my_points">Redeem points</button></div></div></div>
  <div class="com_list mt-4" *ngIf="d">
    <div class="hs-split">
      <div style="min-width:0">
        <div class="hs-card zp-post" *ngFor="let r of d.rows">
          <div class="zp-ico"><span class="material-icons">{{ r.icon || 'emoji_events' }}</span></div>
          <div style="min-width:0;flex:1"><div><b>{{ r.employee }}</b> <span class="hs-muted">received</span> <b>{{ r.award }}</b> <span class="hs-b ok">+{{ r.points }}</span></div>
            <div style="white-space:pre-wrap;margin:4px 0">{{ r.message }}</div>
            <div class="hs-muted" style="font-size:12px">{{ r.given_by }} · {{ w(r.at) }} · <button type="button" class="hs-rlink" (click)="like(r)">{{ r.liked ? '♥' : '♡' }} {{ r.likes }}</button></div></div>
        </div>
        <p class="hs-empty" *ngIf="!d.rows.length">Nobody has been recognised yet – be the first.</p>
      </div>
      <div class="hs-side"><div class="hs-card"><h3>Leaders · last 90 days</h3>
        <div class="za-row" *ngFor="let l of d.leaders; let i = index"><span>{{ i + 1 }}. {{ l.name }}</span><span class="bd">{{ l.points }} pts</span></div>
        <p class="hs-empty" *ngIf="!d.leaders.length">–</p></div></div>
    </div>
  </div>
</div></div>`,
  styles: ['.zp-post { display: flex; gap: 12px; margin-bottom: 10px; } .zp-ico { width: 44px; height: 44px; border-radius: 50%; background: #eceafd; color: #4b3fbf; display: flex; align-items: center; justify-content: center; flex: none; }'],
})
export class ZpWallComponent implements OnInit {
  api!: ZaClient; d: any = null; w = when;
  constructor(private za: ZaApiService, private router: Router) {}
  async ngOnInit(): Promise<void> { this.api = this.za.for(APP); await this.load(); }
  async load(): Promise<void> { try { this.d = await this.api.get('wall/'); } catch { this.d = { rows: [], leaders: [] }; } }
  async like(r: any): Promise<void> { const x = await this.api.post('wall/', { like: r.id }); r.likes = x.likes; r.liked = x.liked; }
  give(): void { this.router.navigate([base(APP), 'r', 'recognition'], { queryParams: { new: 1 } }); }
  redeem(): void { this.router.navigate([base(APP), 'r', 'reward'], { queryParams: { new: 1 } }); }
}

// ---------------------------------------------------------------- chat
@Component({
  selector: 'zp-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div><h1 class="page-title">Chat</h1><p class="ex-desc">Messages with colleagues – one to one or in a group.</p></div>
    <div class="ex-actions"><button type="button" class="ex-btn" (click)="newGroup = !newGroup">+ Group</button></div></div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <div class="hs-card" *ngIf="newGroup"><div class="ex-form"><label>Group name<input [(ngModel)]="gname"></label>
      <div class="wide"><span class="hs-muted">Members</span><div class="hs-multi" style="max-height:180px;overflow:auto"><label *ngFor="let p of people"><input type="checkbox" [checked]="gm.has(p.id)" (change)="gm.has(p.id) ? gm.delete(p.id) : gm.add(p.id)"> {{ p.name }} <span class="hs-muted">{{ p.sub }}</span></label></div></div></div>
      <div class="hs-acts"><button type="button" class="ex-btn primary sm" (click)="makeGroup()">Create</button></div></div>
    <div class="zp-chat">
      <div class="zp-list">
        <input type="search" [(ngModel)]="q" placeholder="Search people…" class="zas-input">
        <ng-container *ngIf="!q">
          <button type="button" class="zp-conv" *ngFor="let c of convs" [class.on]="cur?.id === c.id" (click)="openConv(c)">
            <b>{{ c.name }}</b><em *ngIf="c.unread">{{ c.unread }}</em><span class="hs-muted">{{ c.last?.text || (c.kind === 'direct' ? 'Say hello' : c.members.length + ' members') }}</span></button>
          <p class="hs-empty" *ngIf="!convs.length">No conversations yet – search a colleague to start one.</p>
        </ng-container>
        <ng-container *ngIf="q"><button type="button" class="zp-conv" *ngFor="let p of found()" (click)="start(p)"><b>{{ p.name }}</b><span class="hs-muted">{{ p.sub }}</span></button></ng-container>
      </div>
      <div class="zp-pane" *ngIf="cur">
        <div class="zp-head"><b>{{ cur.name }}</b><span class="hs-muted" *ngIf="cur.kind !== 'direct'"> · {{ memberNames() }}</span></div>
        <div class="zp-msgs" #box>
          <div class="zp-msg" *ngFor="let m of msgs" [class.mine]="m.mine"><div class="b"><div class="who" *ngIf="!m.mine && cur.kind !== 'direct'">{{ m.by }}</div>
            <div style="white-space:pre-wrap">{{ m.text }}</div><a *ngIf="m.file" (click)="dl(m)" class="hs-rlink">📎 {{ m.file_name }}</a><div class="t">{{ w(m.at) }}</div></div></div>
        </div>
        <div class="zp-send"><label class="ex-btn sm" style="cursor:pointer">📎<input type="file" hidden (change)="attach($any($event.target).files)"></label>
          <input [(ngModel)]="text" (keydown.enter)="send()" placeholder="Write a message…" [attr.aria-label]="'Message'">
          <button type="button" class="ex-btn primary sm" (click)="send()" [disabled]="!text && !fileToSend">Send</button></div>
        <div class="hs-muted" *ngIf="fileToSend" style="font-size:12px;padding:0 10px 6px">Attached: {{ fileToSend.name }}</div>
      </div>
      <div class="zp-pane hs-empty" *ngIf="!cur" style="display:flex;align-items:center;justify-content:center">Pick a conversation.</div>
    </div>
  </div>
</div></div>`,
  styles: [`.zp-chat { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 12px; min-height: 60vh; }
    .zp-list { border: 1px solid #e3e5ee; border-radius: 12px; background: #fff; padding: 8px; overflow: auto; max-height: 72vh; }
    .zp-conv { width: 100%; text-align: left; border: 0; background: none; padding: 8px; border-radius: 8px; font: inherit; cursor: pointer; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 6px; }
    .zp-conv:hover, .zp-conv.on { background: #eceafd; } .zp-conv span { grid-column: 1 / -1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zp-conv em { font-style: normal; background: #5b4fe0; color: #fff; border-radius: 10px; padding: 0 7px; font-size: 11px; height: 18px; line-height: 18px; }
    .zp-pane { border: 1px solid #e3e5ee; border-radius: 12px; background: #fff; display: flex; flex-direction: column; max-height: 72vh; }
    .zp-head { padding: 10px 14px; border-bottom: 1px solid #eceef5; } .zp-msgs { flex: 1; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; background: #f7f8fb; }
    .zp-msg { display: flex; } .zp-msg.mine { justify-content: flex-end; } .zp-msg .b { max-width: 72%; background: #fff; border: 1px solid #e3e5ee; border-radius: 12px; padding: 8px 12px; font-size: 13.5px; }
    .zp-msg.mine .b { background: #5b4fe0; color: #fff; border-color: #5b4fe0; } .zp-msg .t { font-size: 10.5px; opacity: .7; margin-top: 2px; } .zp-msg .who { font-size: 11px; font-weight: 600; color: #4b3fbf; }
    .zp-send { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #eceef5; align-items: center; } .zp-send input[type=text], .zp-send input:not([type]) { flex: 1; height: 38px; border: 1px solid #dcdfea; border-radius: 8px; padding: 0 10px; font: inherit; }
    @media (max-width: 760px) { .zp-chat { grid-template-columns: 1fr; } .zp-list { max-height: 30vh; } }`],
})
export class ZpChatComponent implements OnInit, OnDestroy {
  @ViewChild('box') box?: ElementRef<HTMLDivElement>;
  api!: ZaClient; convs: any[] = []; people: any[] = []; cur: any = null; msgs: any[] = []; text = ''; q = ''; err = ''; me = 0; newGroup = false; gname = ''; gm = new Set<number>();
  fileToSend: File | null = null; timer: any; lastId = 0; w = when;
  constructor(private za: ZaApiService, private route: ActivatedRoute) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    await this.refresh(true);
    const to = this.route.snapshot.queryParamMap.get('user');
    if (to) { await this.start({ id: Number(to) }); }
    this.timer = setInterval(() => this.poll(), 5000);
  }
  ngOnDestroy(): void { clearInterval(this.timer); }
  async refresh(withPeople = false): Promise<void> {
    try { const r = await this.api.get('chat/', withPeople ? { people: 1 } : {}); this.convs = r.conversations; this.me = r.me; if (withPeople) this.people = r.people; } catch (e) { this.err = ZaApiService.error(e); }
  }
  found(): any[] { const q = this.q.toLowerCase(); return this.people.filter(p => p.name.toLowerCase().includes(q)).slice(0, 30); }
  async start(p: any): Promise<void> { this.q = ''; const c = await this.api.post('chat/', { user: p.id }); await this.refresh(); await this.openConv(this.convs.find(x => x.id === c.id) || c); }
  async makeGroup(): Promise<void> { try { const c = await this.api.post('chat/', { name: this.gname, members: [...this.gm] }); this.newGroup = false; this.gname = ''; this.gm.clear(); await this.refresh(); await this.openConv(c); } catch (e) { this.err = ZaApiService.error(e); } }
  async openConv(c: any): Promise<void> { this.cur = c; this.msgs = []; this.lastId = 0; await this.poll(); c.unread = 0; }
  memberNames(): string { return (this.cur?.members || []).map((m: any) => m.name).join(', '); }
  polling = false;
  async poll(): Promise<void> {
    if (!this.cur) { await this.refresh(); return; }
    if (this.polling) return;
    this.polling = true;
    const conv = this.cur.id;
    try {
      const r = await this.api.get(`chat/${conv}/`, { since: this.lastId });
      if (this.cur?.id === conv && r.messages.length) {
        const seen = new Set(this.msgs.map((m: any) => m.id));
        const fresh = r.messages.filter((m: any) => !seen.has(m.id));
        this.msgs = this.msgs.concat(fresh); this.lastId = Math.max(this.lastId, r.messages[r.messages.length - 1].id);
        if (fresh.length) setTimeout(() => { if (this.box) this.box.nativeElement.scrollTop = this.box.nativeElement.scrollHeight; });
      }
    } catch { /* keep */ }
    this.polling = false;
  }
  attach(fl: FileList | null): void { this.fileToSend = fl?.length ? fl[0] : null; }
  async send(): Promise<void> {
    if (!this.cur || (!this.text && !this.fileToSend)) return;
    try {
      if (this.fileToSend) { const fd = new FormData(); fd.append('text', this.text); fd.append('file', this.fileToSend); await this.api.post(`chat/${this.cur.id}/`, fd); }
      else await this.api.post(`chat/${this.cur.id}/`, { text: this.text });
      this.text = ''; this.fileToSend = null; await this.poll();
    } catch (e) { this.err = ZaApiService.error(e); }
  }
  dl(m: any): void { this.api.file(`chat/${this.cur.id}/file/${m.id}/`, m.file_name); }
}

// ---------------------------------------------------------------- 360° reviewer sheet
@Component({
  selector: 'zp-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button> 360° review of {{ d?.employee }}</h1>
    <p class="ex-desc" *ngIf="d">{{ d.cycle }} · you answer as <b>{{ d.relation }}</b>{{ d.due ? ' · due ' + dd(d.due) : '' }}{{ d.anonymous ? ' · your answers are shown without your name' : '' }}</p></div></div></div>
  <div class="com_list mt-4" *ngIf="d">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
    <div class="hs-card" *ngIf="d.status === 'done'"><p>Thank you – your review is submitted.</p></div>
    <div class="hs-card" *ngIf="d.status !== 'done'" style="max-width:900px">
      <h3>Competencies <span class="hs-muted">1 = needs development · 5 = role model</span></h3>
      <div class="zp-comp" *ngFor="let c of d.competencies">
        <div><b>{{ c.name }}</b> <span class="hs-muted">· {{ c.group }}</span><div class="hs-muted" style="font-size:12.5px">{{ c.description }}</div></div>
        <div class="zp-rate"><button type="button" *ngFor="let n of [1,2,3,4,5]" [class.on]="r[c.id] === n" (click)="r[c.id] = n" [title]="c.levels[n-1] || ''">{{ n }}</button></div>
      </div>
      <div class="ex-form" style="margin-top:14px">
        <label class="wide" *ngFor="let q of d.questions; let i = index">{{ q }}<textarea rows="2" [(ngModel)]="a[i]"></textarea></label>
        <label class="wide">Strengths<textarea rows="2" [(ngModel)]="strengths"></textarea></label>
        <label class="wide">What could improve<textarea rows="2" [(ngModel)]="improve"></textarea></label>
        <label>Overall (1–5)<select [(ngModel)]="overall"><option [ngValue]="null">–</option><option *ngFor="let n of [1,2,3,4,5]" [ngValue]="n">{{ n }}</option></select></label>
      </div>
      <div class="hs-acts" style="margin-top:12px"><button type="button" class="ex-btn" (click)="save(true)" [disabled]="busy">Save draft</button>
        <button type="button" class="ex-btn primary" (click)="save(false)" [disabled]="busy">Submit review</button></div>
    </div>
  </div>
</div></div>`,
  styles: [`.zp-comp { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid #eceef5; }
    .zp-rate { display: flex; gap: 5px; } .zp-rate button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #dcdfea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; } .zp-rate button.on { background: #5b4fe0; color: #fff; border-color: #5b4fe0; }
    @media (max-width: 640px) { .zp-comp { grid-template-columns: 1fr; } }`],
})
export class ZpReviewComponent implements OnInit {
  api!: ZaClient; d: any = null; r: any = {}; a: string[] = []; strengths = ''; improve = ''; overall: number | null = null; err = ''; ok = ''; busy = false; id = 0; dd = day;
  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP); this.id = Number(this.route.snapshot.paramMap.get('id'));
    try { this.d = await this.api.get(`review/${this.id}/`); this.r = { ...(this.d.ratings || {}) }; this.a = (this.d.questions || []).map((_: any, i: number) => this.d.answers?.[i] || ''); this.strengths = this.d.strengths; this.improve = this.d.improve; this.overall = this.d.overall; }
    catch (e) { this.err = ZaApiService.error(e); }
  }
  async save(draft: boolean): Promise<void> {
    this.err = ''; this.ok = ''; this.busy = true;
    try { const x = await this.api.post(`review/${this.id}/`, { ratings: this.r, answers: this.a, strengths: this.strengths, improve: this.improve, overall: this.overall, draft }); this.ok = draft ? 'Draft saved.' : 'Submitted – thank you.'; if (!draft) this.d.status = x.status; }
    catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false;
  }
  back(): void { this.router.navigate([base(APP), 'home']); }
}
