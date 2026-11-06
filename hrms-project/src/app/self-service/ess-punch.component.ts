// v1.67.5 (bugs) ESS1
/**
 * v1.67.5 (bugs) ESS1 – My profile › Punch with the camera: "Scan card / QR" and "Face" (register once, then punch).
 *
 * * Barcode / QR: the camera reads the code in the browser (@zxing/browser, already in the app; any format ZXing reads –
 *   QR, Code 128, Code 39, EAN …). Accepted by the server: the employee's own Attendance Card / Barcode or badge QR, or the
 *   company punch QR of a kiosk screen. A picture of the code can be chosen instead of the live camera.
 * * Face: @vladmandic/face-api (MIT), bundled in assets/vendor/face-api and loaded only here. Registering: the consent text,
 *   "I agree", three pictures → three descriptors (128 numbers each) are sent; no picture is kept. Punching: one descriptor
 *   is sent and compared on the server with the registered ones.
 * * The punch goes through the same checks as My attendance (allowed methods, GPS / geofence, IP list, selfie, "punched less
 *   than N minutes ago"); location and a selfie frame are sent when the attendance rule asks for them.
 * API: GET/POST attendance-plus/api/ess-punch/, POST/DELETE attendance-plus/api/ess-punch/face/.
 */
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { ZRecordService } from '../shared-ui/z-record.service';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { ApApi, currentPosition } from '../attendance-plus/ap-api';
import { zConfirm } from '../shared-ui/z-confirm';

declare const faceapi: any;
const FACE_LIB = 'assets/vendor/face-api/face-api.js';
const FACE_MODELS = 'assets/vendor/face-api/model';
let faceReady: Promise<void> | null = null;

/** The face library and its three models, once per page load. */
function loadFace(): Promise<void> {
  if (faceReady) { return faceReady; }
  faceReady = new Promise<void>((resolve, reject) => {
    if ((window as any).faceapi) { resolve(); return; }
    const s = document.createElement('script'); s.src = FACE_LIB; s.async = true;
    s.onload = () => resolve(); s.onerror = () => reject(new Error('face library'));
    document.head.appendChild(s);
  }).then(async () => {
    const f = (window as any).faceapi;
    try { await f.tf.setBackend('webgl'); await f.tf.ready(); } catch { await f.tf.setBackend('cpu'); await f.tf.ready(); }
    await Promise.all([f.nets.tinyFaceDetector.loadFromUri(FACE_MODELS), f.nets.faceLandmark68Net.loadFromUri(FACE_MODELS),
      f.nets.faceRecognitionNet.loadFromUri(FACE_MODELS)]);
  }).catch(e => { faceReady = null; throw e; });
  return faceReady;
}

type Mode = '' | 'scan' | 'register' | 'face';

@Component({
  selector: 'z-ess-punch',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['./ess.css'],
  template: `
<div class="es-panel" id="g-punch" data-ess-punch *ngIf="st && (st.barcode_on || st.face_on)">
  <div class="es-h"><span>{{ 'Punch with the camera' | t }}</span>
    <small class="ep-next" *ngIf="st.next">{{ 'Next:' | t }} <b>{{ kindLabel(st.next) | t }}</b></small></div>
  <div class="ep-body">
    <p class="es-muted">{{ 'Punch in and out with your attendance card / QR code, or with your face. The usual attendance rules apply (location, working hours, no double punches).' | t }}</p>
    <p class="es-msg" *ngIf="msg" [class.err]="err" role="status" data-ep-msg>{{ msg }}</p>

    <div class="ep-acts" *ngIf="!mode">
      <button type="button" class="es-btn primary" *ngIf="st.barcode_on" (click)="startScan()" [disabled]="busy" data-ep-scan>{{ 'Scan card / QR code' | t }}</button>
      <button type="button" class="es-btn primary" *ngIf="st.face_on && st.face_registered" (click)="startFace('face')" [disabled]="busy" data-ep-face>{{ 'Punch with my face' | t }}</button>
      <button type="button" class="es-btn" *ngIf="st.face_on" (click)="startFace('register')" [disabled]="busy" data-ep-register>{{ (st.face_registered ? 'Register my face again' : 'Register my face') | t }}</button>
      <button type="button" class="es-btn" *ngIf="st.face_on && st.face_registered" (click)="removeFace()" [disabled]="busy" data-ep-remove>{{ 'Remove my face data' | t }}</button>
    </div>
    <p class="es-muted ep-state" *ngIf="!mode">
      <span *ngIf="st.barcode_on">{{ (st.has_card ? 'Your attendance card is recorded.' : (st.site_qr ? 'No attendance card is recorded for you – scan the company QR code on the kiosk screen.' : 'No attendance card is recorded for you – ask HR.')) | t }}</span>
      <span *ngIf="st.face_on"> {{ (st.face_registered ? 'Your face is registered.' : 'Your face is not registered yet.') | t }}</span></p>

    <!-- camera -->
    <div class="ep-cam" *ngIf="mode" data-ep-cam>
      <video #video autoplay muted playsinline [class.mirror]="mode !== 'scan'"></video>
      <canvas #canvas hidden></canvas>
      <div class="ep-cam-t">
        <ng-container *ngIf="mode === 'scan'">
          <b>{{ 'Hold your card or the QR code in front of the camera.' | t }}</b>
          <label class="es-btn small">{{ 'Or choose a picture of the code' | t }}<input type="file" accept="image/*" (change)="scanFile($event)" hidden data-ep-scan-file></label>
        </ng-container>
        <ng-container *ngIf="mode === 'register'">
          <div class="ep-consent" data-ep-consent><p>{{ st.consent_text }}</p>
            <label><input type="checkbox" [(ngModel)]="agree" data-ep-agree> {{ 'I agree' | t }}</label></div>
          <b>{{ 'Look straight at the camera. Pictures taken:' | t }} {{ samples.length }} / 3</b>
          <div class="ep-acts">
            <button type="button" class="es-btn primary" (click)="takeSample()" [disabled]="busy || !agree || samples.length >= 3 || !camOn" data-ep-take>{{ 'Take picture' | t }}</button>
            <button type="button" class="es-btn primary" (click)="saveFace()" [disabled]="busy || !agree || samples.length < 3" data-ep-save>{{ 'Save my face' | t }}</button>
          </div>
        </ng-container>
        <ng-container *ngIf="mode === 'face'">
          <b>{{ 'Look straight at the camera, then punch.' | t }}</b>
          <div class="ep-acts"><button type="button" class="es-btn primary" (click)="facePunch()" [disabled]="busy || !camOn" data-ep-face-punch>{{ 'Punch now' | t }}</button></div>
        </ng-container>
        <small class="es-muted" *ngIf="loadingLib">{{ 'Loading the face model…' | t }}</small>
        <button type="button" class="es-btn small" (click)="stop()" data-ep-cancel>{{ 'Cancel' | t }}</button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
  .ep-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
  .ep-next { font-weight: 400; color: #4a4766; margin-inline-start: 10px; }
  .ep-acts { display: flex; flex-wrap: wrap; gap: 8px; }
  .ep-state { margin: 0; }
  .ep-cam { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 14px; align-items: start; }
  .ep-cam video { width: 100%; aspect-ratio: 4 / 3; background: #111; border-radius: 10px; object-fit: cover; }
  .ep-cam video.mirror { transform: scaleX(-1); }
  .ep-cam-t { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; min-width: 0; }
  .ep-consent { background: #f6f5ff; border: 1px solid #dcd8fb; border-radius: 8px; padding: 10px 12px; font-size: 13px; }
  .ep-consent p { margin: 0 0 8px; }
  .es-btn.small { height: 30px; font-size: 12.5px; padding: 0 12px; display: inline-flex; align-items: center; cursor: pointer; }
  @media (max-width: 700px) { .ep-cam { grid-template-columns: 1fr; } }
  `],
})
export class EssPunchComponent implements OnInit, OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  st: any = null; mode: Mode = ''; busy = false; msg = ''; err = false;
  agree = false; samples: number[][] = []; camOn = false; loadingLib = false;
  private api: ApApi;
  private stream: MediaStream | null = null;
  private controls?: IScannerControls;
  private reader = new BrowserMultiFormatReader();

  constructor(private http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new ApApi(http, rec); }
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.stop(); }

  async load(): Promise<void> {
    try { this.st = await this.api.get('ess-punch/'); } catch { this.st = null; }
    this.cd.markForCheck();
  }
  kindLabel(k: string): string { return ({ in: 'Clock in', out: 'Clock out', break_out: 'Start break', break_in: 'End break', lunch_out: 'Start lunch', lunch_in: 'End lunch' } as any)[k] || k; }
  say(t: string, err = false): void { this.msg = t; this.err = err; this.cd.markForCheck(); }

  // ------------------------------------------------------------------ camera
  private async openCamera(facing: 'user' | 'environment'): Promise<boolean> {
    this.cd.detectChanges();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      const v = this.video!.nativeElement; v.srcObject = this.stream; await v.play().catch(() => {});
      this.camOn = true; this.cd.markForCheck(); return true;
    } catch { this.say(i18nT('The camera could not be opened. Allow camera access in the browser and try again.'), true); this.stop(false); return false; }
  }
  stop(clear = true): void {
    try { this.controls?.stop(); } catch { /* stopped */ }
    this.controls = undefined;
    this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.camOn = false;
    this.mode = ''; this.samples = []; this.agree = false; this.busy = false;
    if (clear) { /* keep the last message */ }
    this.cd.markForCheck();
  }
  private frame(): string {
    const v = this.video?.nativeElement, c = this.canvas?.nativeElement;
    if (!v || !c || !v.videoWidth) { return ''; }
    c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d')!.drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.8);
  }

  // ------------------------------------------------------------------ barcode / QR
  async startScan(): Promise<void> {
    this.say(''); this.mode = 'scan'; this.cd.detectChanges();
    try {
      this.controls = await this.reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, this.video!.nativeElement, (res) => {
        if (res && !this.busy) { const text = res.getText(); const pic = this.frame(); this.controls?.stop(); this.send({ method: 'barcode', code: text }, pic); }
      });
      this.camOn = true; this.cd.markForCheck();
    } catch { this.say(i18nT('The camera could not be opened. Allow camera access, or choose a picture of the code.'), true); this.camOn = false; this.cd.markForCheck(); }
  }
  async scanFile(ev: any): Promise<void> {
    const f: File | undefined = ev?.target?.files?.[0]; if (ev?.target) { ev.target.value = ''; } if (!f) { return; }
    const url = URL.createObjectURL(f);
    try { const r = await this.reader.decodeFromImageUrl(url); await this.send({ method: 'barcode', code: r.getText() }); }
    catch { this.say(i18nT('No barcode or QR code was found in the picture.'), true); }
    finally { URL.revokeObjectURL(url); }
  }

  // ------------------------------------------------------------------ face
  async startFace(m: 'register' | 'face'): Promise<void> {
    this.say(''); this.mode = m; this.samples = []; this.agree = false; this.loadingLib = true; this.cd.detectChanges();
    const camOk = this.openCamera('user');
    try { await loadFace(); } catch { this.loadingLib = false; this.say(i18nT('The face model could not be loaded. Check the connection and try again.'), true); this.stop(false); return; }
    this.loadingLib = false; await camOk; this.cd.markForCheck();
  }
  private async descriptor(): Promise<number[] | null> {
    const v = this.video?.nativeElement; if (!v) { return null; }
    const f = (window as any).faceapi;
    const r = await f.detectSingleFace(v, new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor();
    return r ? Array.from(r.descriptor as Float32Array).map(x => +x.toFixed(6)) : null;
  }
  async takeSample(): Promise<void> {
    this.busy = true; this.cd.markForCheck();
    try {
      const d = await this.descriptor();
      if (!d) { this.say(i18nT('No face was found. Look straight at the camera in good light.'), true); }
      else { this.samples = [...this.samples, d]; this.say(i18nT('Picture {0} of 3 taken.', [this.samples.length])); }
    } catch { this.say(i18nT('The face could not be read. Try again.'), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async saveFace(): Promise<void> {
    this.busy = true; this.cd.markForCheck();
    try {
      const r: any = await this.api.post('ess-punch/face/', { descriptors: this.samples, consent: this.agree });
      this.stop(); this.say(r?.detail || i18nT('Your face is registered.')); await this.load();
    } catch (e) { this.busy = false; this.say(ApApi.err(e, i18nT('Your face could not be registered.')), true); }
    this.cd.markForCheck();
  }
  async facePunch(): Promise<void> {
    this.busy = true; this.cd.markForCheck();
    let d: number[] | null = null;
    try { d = await this.descriptor(); } catch { d = null; }
    if (!d) { this.busy = false; this.say(i18nT('No face was found. Look straight at the camera in good light.'), true); return; }
    await this.send({ method: 'face', descriptor: d }, this.frame());
  }
  async removeFace(): Promise<void> {
    if (!(await zConfirm(i18nT('Remove your face data? You will need to register again to punch with your face.')))) { return; }
    try { const r: any = await firstValueFrom(this.http.delete(this.api.url('ess-punch/face/'))); this.say(r?.detail || i18nT('Your face data was removed.')); await this.load(); }
    catch (e) { this.say(ApApi.err(e), true); }
  }

  // ------------------------------------------------------------------ the punch
  private async send(body: any, selfie = ''): Promise<void> {
    this.busy = true; this.say(i18nT('Sending…'));
    const pos = await currentPosition(this.st?.require_gps ? 15000 : 4000);
    if (pos) { body.lat = pos.lat; body.lng = pos.lng; }
    else if (this.st?.require_gps) { this.busy = false; this.say(i18nT('Your location is required. Allow location access in the browser / phone settings and try again.'), true); return; }
    if (this.st?.require_selfie && selfie) { body.photo = selfie; }
    body.kind = 'auto'; body.device_id = navigator.userAgent.slice(0, 60);
    try {
      const r: any = await this.api.post('ess-punch/', body);
      this.stop(); this.say(r?.detail || i18nT('Punch recorded.')); await this.load();
    } catch (e) {
      this.busy = false; this.say(ApApi.err(e, i18nT('The punch was not recorded. Try again.')), true);
      if (this.mode === 'scan') { this.stop(false); }
    }
    this.cd.markForCheck();
  }
}

/** v1.67.5 (bugs) ESS1 – Self-service settings › Punch from My profile (HR): switch each method on or off. */
@Component({
  selector: 'z-ess-punch-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['./ess.css'],
  template: `
<div class="es-panel" data-ess-punch-settings>
  <div class="es-h">{{ 'Punch from My profile' | t }}</div>
  <p class="es-msg" *ngIf="ok">{{ ok }}</p><p class="es-msg err" *ngIf="msg">{{ msg }}</p>
  <div class="ep-set" *ngIf="s">
    <label><input type="checkbox" [(ngModel)]="s.barcode" data-eps-barcode> <b>{{ 'Barcode / QR code' | t }}</b> – {{ 'employees scan their attendance card or the company QR code with the phone or laptop camera' | t }}</label>
    <label class="sub"><input type="checkbox" [(ngModel)]="s.own_card" [disabled]="!s.barcode" data-eps-own> {{ 'Accept the employee\\'s own attendance card / badge QR' | t }}</label>
    <label class="sub"><input type="checkbox" [(ngModel)]="s.site_qr" [disabled]="!s.barcode" data-eps-site> {{ 'Accept the company QR code shown on a kiosk screen (changes every 30 seconds)' | t }}</label>
    <label><input type="checkbox" [(ngModel)]="s.face" data-eps-face> <b>{{ 'Face' | t }}</b> – {{ 'employees register their face once (with consent) and punch with it; only a numeric description of the face is kept, no photo' | t }}</label>
    <label class="sub">{{ 'Face match threshold (lower is stricter)' | t }}
      <input type="number" min="0.3" max="0.7" step="0.05" [(ngModel)]="s.threshold" [disabled]="!s.face" class="es-input" style="max-width:110px" data-eps-threshold></label>
    <p class="es-muted">{{ 'Faces registered:' | t }} {{ s.faces_registered || 0 }}. {{ 'The face check has no liveness test – use it together with the location (geofence) or IP rules of the attendance rule.' | t }}</p>
    <div><button type="button" class="es-btn primary" (click)="save()" [disabled]="busy" data-eps-save>{{ 'Save' | t }}</button></div>
  </div>
</div>`,
  styles: [`.ep-set { display: flex; flex-direction: column; gap: 10px; padding: 4px 16px 14px; font-size: 13.5px; }
    .ep-set label { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 0; } .ep-set .sub { margin-inline-start: 26px; color: #4a4766; }`],
})
export class EssPunchSettingsComponent implements OnInit {
  s: any = null; ok = ''; msg = ''; busy = false;
  private api: ApApi;
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new ApApi(http, rec); }
  async ngOnInit(): Promise<void> {
    try { this.s = await this.api.get('ess-punch/settings/'); } catch (e) { this.msg = ApApi.err(e); }
    this.cd.markForCheck();
  }
  async save(): Promise<void> {
    this.busy = true; this.ok = ''; this.msg = '';
    try {
      const r: any = await firstValueFrom((this.api as any).http.put(this.api.url('ess-punch/settings/'), this.s));
      this.s = { ...this.s, ...r }; this.ok = i18nT('Saved.');
    } catch (e) { this.msg = ApApi.err(e); }
    this.busy = false; this.cd.markForCheck();
  }
}
