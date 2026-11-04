// v1.62.10 (item 171)
/**
 * v1.62.10 (item 171) – Attendance › Setup › Face register in the new design. Before: an employee box and two big tiles
 * (Face / Barcode) with browser messages. Now: every employee with "Face registered" Yes / No and the badge number (shared list
 * tools: search, filters, export), "+ New registration" and the row buttons Face / Badge open one dialog in the look of the
 * shared form: employee (error next to the field), Face (camera, capture, register) or Badge (generate, download, register).
 * Saved by the same calls as before: /calendars/api/attendance/enroll_face/ and /register_barcode/. List: /calendars/api/face-register/.
 */
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import JsBarcode from 'jsbarcode';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zToast } from '../shared-ui/z-toast';
import { T, T62Base } from './t62';

@Component({
  selector: 'app-t62-face-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  template: `
<div class="container hr-page" data-t62="face">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Face and badge register</h1>
          <p class="hr-head-d">Register an employee's face for face punching, or give them a badge (barcode) to scan. The list shows who has a face or a badge registered.</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="open(null, 'face')" data-z-new data-t62-new>+ New registration</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list>
          <thead><tr><th>Code</th><th>Employee</th><th>Branch</th><th>Department</th><th>Face registered</th><th>Badge</th><th class="hr-col-actions" *ngIf="can.add">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td colspan="7" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td colspan="7" class="hr-empty">No employees.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-t62-emp]="r.id" [attr.data-z-id]="r.id">
              <td>{{ r.emp_code }}</td><td>{{ r.name }}</td><td>{{ r.branch || '–' }}</td><td>{{ r.department || '–' }}</td>
              <td><span class="tag" [ngClass]="r.face ? 'tag-green' : 'tag-grey'">{{ r.face ? 'Yes' : 'No' }}</span></td>
              <td>{{ r.barcode || '–' }}</td>
              <td class="t62-actions" *ngIf="can.add">
                <button type="button" class="t62-link" (click)="open(r, 'face')" data-t62-face>Face</button>
                <button type="button" class="t62-link" (click)="open(r, 'badge')" data-t62-badge>Badge</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="t62-dlg" *ngIf="dlg" data-t62-dialog>
  <div class="t62-veil" (click)="close()"></div>
  <div class="t62-box" role="dialog" aria-modal="true" (keydown.escape)="close()">
    <div class="t62-head">
      <div><h2 class="t62-title">{{ dlg.emp ? 'Register a face or badge' : 'New registration' }}</h2>
        <p class="t62-sub">The face is used by face punching; the badge is scanned at the punching screen.</p></div>
      <button type="button" class="t62-x" (click)="close()" aria-label="Close">×</button>
    </div>
    <div class="t62-dbody">
      <p class="t62-top" *ngIf="err['_']" role="alert">{{ err['_'] }}</p>
      <section class="t62-sec"><h3>Employee</h3>
        <div class="t62-fgrid">
          <label class="t62-f full" data-zf-field="employee"><span class="t62-l">Employee <span class="t62-req">*</span></span>
            <input type="search" class="t62-in" [(ngModel)]="q" placeholder="Search" autocomplete="off" *ngIf="!dlg.emp">
            <select [(ngModel)]="dlg.employee" [class.bad]="err['employee']" [disabled]="!!dlg.emp" data-t62-emp-select>
              <option [ngValue]="null">–</option>
              <option *ngFor="let e of shown()" [ngValue]="e.id">{{ e.name }} ({{ e.emp_code }})</option>
            </select>
            <small class="t62-err" *ngIf="err['employee']" data-zf-field-error>{{ err['employee'] }}</small>
          </label>
        </div>
      </section>
      <section class="t62-sec"><h3>What to register</h3>
        <div class="t62-seg"><button type="button" [class.on]="dlg.mode === 'face'" (click)="mode('face')" data-t62-mode-face>Face</button>
          <button type="button" [class.on]="dlg.mode === 'badge'" (click)="mode('badge')" data-t62-mode-badge>Badge (barcode)</button></div>
      </section>
      <section class="t62-sec" *ngIf="dlg.mode === 'face'">
        <h3>Face</h3>
        <p class="t62-hint" *ngIf="!camera">Start the camera, look straight at it and capture a clear photo.</p>
        <div class="t62-fgrid" *ngIf="camera">
          <div><video #video autoplay playsinline style="width:100%;border-radius:10px;background:#1d2033"></video></div>
          <div style="display:grid;place-items:center;border:1px dashed #dfe1ea;border-radius:10px;min-height:180px">
            <img *ngIf="photo" [src]="photo" style="max-width:100%;border-radius:10px" alt="">
            <span class="t62-hint" *ngIf="!photo">The photo appears here</span></div>
        </div>
        <small class="t62-err" *ngIf="err['photo']">{{ err['photo'] }}</small>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button type="button" class="t62-btn" *ngIf="!camera" (click)="startCamera()" data-t62-camera><mat-icon>photo_camera</mat-icon> Start the camera</button>
          <button type="button" class="t62-btn" *ngIf="camera" (click)="capture()"><mat-icon>camera_alt</mat-icon> Capture</button>
        </div>
      </section>
      <section class="t62-sec" *ngIf="dlg.mode === 'badge'">
        <h3>Badge</h3>
        <p class="t62-hint">Badge now: <b>{{ current()?.barcode || '–' }}</b></p>
        <p class="t62-hint">Generate a new number, download it for the ID card and register it.</p>
        <div style="margin-top:8px" [hidden]="!badge"><svg #bar></svg></div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button type="button" class="t62-btn" (click)="generate()" data-t62-generate><mat-icon>qr_code</mat-icon> Generate a number</button>
          <button type="button" class="t62-btn" (click)="download()" [disabled]="!badge"><mat-icon>download</mat-icon> Download</button>
        </div>
        <small class="t62-err" *ngIf="err['badge']">{{ err['badge'] }}</small>
      </section>
    </div>
    <div class="t62-foot">
      <button type="button" class="t62-btn" (click)="close()" [disabled]="busy">Cancel</button>
      <span class="t62-grow"></span>
      <button type="button" class="t62-btn primary" (click)="save()" [disabled]="busy" data-zf-save>{{ busy ? 'Saving…' : (dlg.mode === 'face' ? 'Register the face' : 'Register the badge') }}</button>
    </div>
  </div>
</div>`,
})
export class T62FaceRegisterComponent extends T62Base {
  model = 'attendance_faceregister';
  endpoint = '/calendars/api/face-register/';
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('bar') bar?: ElementRef<SVGElement>;
  dlg: { emp: any; employee: number | null; mode: 'face' | 'badge' } | null = null;
  err: Record<string, string> = {};
  q = ''; camera = false; photo: string | null = null; badge = ''; busy = false;
  private stream: MediaStream | null = null;

  shown(): any[] {
    const s = this.q.trim().toLowerCase();
    return s ? this.rows.filter(e => `${e.name} ${e.emp_code}`.toLowerCase().includes(s) || e.id === this.dlg?.employee) : this.rows;
  }
  current(): any { return this.rows.find(e => e.id === this.dlg?.employee) || null; }
  open(emp: any, mode: 'face' | 'badge'): void {
    this.dlg = { emp, employee: emp?.id ?? null, mode }; this.err = {}; this.photo = null; this.badge = ''; this.q = '';
  }
  mode(m: 'face' | 'badge'): void { if (this.dlg) { this.dlg.mode = m; this.err = {}; } if (m === 'badge') { this.stop(); } }
  close(): void { if (this.busy) { return; } this.stop(); this.dlg = null; }
  override ngOnDestroy(): void { this.stop(); }

  async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) { this.err = { photo: T('The camera can only be used on a secure (https) address.') }; return; }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
      this.camera = true; this.cd.detectChanges();
      if (this.video) { this.video.nativeElement.srcObject = this.stream; }
    } catch { this.err = { photo: T('The camera could not be opened – allow the camera for this site.') }; }
  }
  capture(): void {
    const v = this.video?.nativeElement; if (!v) { return; }
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0); this.photo = c.toDataURL('image/jpeg'); this.err = {};
  }
  private stop(): void { this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.camera = false; }

  generate(): void {
    this.badge = 'EMP-' + Math.random().toString(36).substring(2, 10).toUpperCase(); this.err = {};
    this.cd.detectChanges();
    if (this.bar) { JsBarcode(this.bar.nativeElement, this.badge, { format: 'CODE128', width: 2, height: 80, displayValue: true }); }
  }
  download(): void {
    if (!this.bar || !this.badge) { return; }
    const blob = new Blob([new XMLSerializer().serializeToString(this.bar.nativeElement)], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${this.badge}.svg`; a.click(); URL.revokeObjectURL(a.href);
  }

  async save(): Promise<void> {
    const d = this.dlg; if (!d) { return; }
    this.err = {};
    if (!d.employee) { this.err['employee'] = T('{0} is required.', [T('Employee')]); }
    if (d.mode === 'face' && !this.photo) { this.err['photo'] = T('Capture a photo first.'); }
    if (d.mode === 'badge' && !this.badge) { this.err['badge'] = T('Generate a badge number first.'); }
    if (Object.keys(this.err).length) { return; }
    this.busy = true;
    try {
      const path = d.mode === 'face' ? '/calendars/api/attendance/enroll_face/' : '/calendars/api/attendance/register_barcode/';
      const body = d.mode === 'face' ? { employee: d.employee, face_photo: this.photo } : { employee: d.employee, barcode: this.badge };
      await firstValueFrom(this.http.post(this.url(path), body));
      zToast(T(d.mode === 'face' ? 'Face registered.' : 'Badge registered.'), 'ok');
      this.busy = false; this.close(); await this.load();
    } catch (e) { this.busy = false; this.err['_'] = httpErrorText(e); }
  }
}
