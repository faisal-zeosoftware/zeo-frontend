import { ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ApApi } from './ap-api';

/** v1.49.0 – attendance setup: the overtime law of the country (rates put on the attendance rules) and the
 *  regularisation reasons (proof photo, document, monthly limit). */
@Component({
  selector: 'app-ap-setup149',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./attendance-plus.css'],
  template: `
<div class="ap-wrap">
  <div class="ap-head"><div><h1>Overtime law and regularisation reasons</h1>
    <p class="ap-desc">The overtime rates of your country's labour law for the attendance rules, and the reasons employees pick when they ask to correct a day.</p></div></div>
  <p class="ap-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="ap-card" *ngIf="law">
    <h2>Overtime law – {{ law.country }}</h2>
    <div class="ap-tools"><select class="ap-input" [(ngModel)]="country" (ngModelChange)="loadLaw()" aria-label="Country">
      <option *ngFor="let c of law.countries" [value]="c.code">{{ c.code }}</option></select></div>
    <p class="ap-muted" style="max-width:820px">{{ law.law }}</p>
    <table class="ap-table" style="max-width:520px"><tr><th>Overtime on</th><th class="r">Rate</th></tr>
      <tr><td>Normal day</td><td class="r">× {{ law.normal }}</td></tr><tr><td>Night</td><td class="r">× {{ law.night }}</td></tr>
      <tr><td>Rest day / weekend</td><td class="r">× {{ law.weekend }}</td></tr><tr><td>Public holiday</td><td class="r">× {{ law.holiday }}</td></tr></table>
    <div class="ap-tools" style="margin-top:8px"><button type="button" class="ap-btn primary" (click)="applyLaw()" [disabled]="busy" data-apply-law>Put these rates on every attendance rule</button></div>
    <p class="ap-muted">Rules without their own rates use the law of the company country. Employees see how their overtime was calculated next to their payslip.</p>
  </div>
  <div class="ap-card">
    <h2>Regularisation reasons</h2>
    <div class="ap-scroll"><table class="ap-table">
      <tr><th>Code</th><th>Reason</th><th>Type</th><th>Proof photo</th><th>Document</th><th>Times a month</th><th>Waive penalty</th><th>Active</th><th></th></tr>
      <tr *ngFor="let r of reasons" [attr.data-code]="r.code">
        <td><input class="ap-input" [(ngModel)]="r.code" style="width:90px"></td><td><input class="ap-input" [(ngModel)]="r.name"></td>
        <td><select class="ap-input" [(ngModel)]="r.kind"><option *ngFor="let k of kinds" [value]="k[0]">{{ k[1] }}</option></select></td>
        <td><input type="checkbox" [(ngModel)]="r.needs_photo"></td><td><input type="checkbox" [(ngModel)]="r.needs_attachment"></td>
        <td><input class="ap-input" type="number" min="0" [(ngModel)]="r.max_per_month" style="width:70px"></td>
        <td><input type="checkbox" [(ngModel)]="r.waive_penalty"></td><td><input type="checkbox" [(ngModel)]="r.is_active"></td>
        <td><button type="button" class="ap-btn small" (click)="save(r)">Save</button></td></tr>
    </table></div>
    <div class="ap-tools"><button type="button" class="ap-btn" (click)="add()">+ Add a reason</button></div>
  </div>
</div>`,
})
export class ApSetup149Component implements OnInit {
  api: ApApi; law: any = null; country = ''; reasons: any[] = []; msg = ''; err = false; busy = false;
  readonly kinds = [['missing_punch', 'Missing punch'], ['wrong_time', 'Wrong time'], ['forgot', 'Forgot to punch'], ['on_duty', 'On duty / outside work'], ['wfh', 'Work from home']];
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new ApApi(http, rec); }
  async ngOnInit(): Promise<void> { await this.loadLaw(); this.reasons = await this.api.get('regularisation-reasons/', { all: 1 }).catch(() => []); this.cd.markForCheck(); }
  async loadLaw(): Promise<void> { try { this.law = await this.api.get('ot-law/', { country: this.country }); this.country = this.law.country; } catch (e) { this.say(ApApi.err(e), true); } this.cd.markForCheck(); }
  async applyLaw(): Promise<void> {
    this.busy = true;
    try { const r: any = await this.api.post('ot-law/', { country: this.country }); this.say(`Overtime rates of ${r.country} put on ${r.updated} rule(s).`); }
    catch (e) { this.say(ApApi.err(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  add(): void { this.reasons = [...this.reasons, { code: '', name: '', kind: 'missing_punch', needs_photo: false, needs_attachment: false, max_per_month: null, waive_penalty: false, is_active: true }]; }
  async save(r: any): Promise<void> {
    try { const x = await this.api.post('regularisation-reasons/', r); Object.assign(r, x); this.say(`Saved: ${x.name}.`); }
    catch (e) { this.say(ApApi.err(e), true); }
    this.cd.markForCheck();
  }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}

/** v1.49.0 – punch photos (kiosk photos and selfies) for HR to check: accept, flag or remove a punch. */
@Component({
  selector: 'app-ap-photos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./attendance-plus.css'],
  template: `
<div class="ap-wrap">
  <div class="ap-head"><div><h1>Punch photos</h1><p class="ap-desc">Photos taken by the kiosks and the selfies of mobile punches, next to the employee's profile picture. Flag a doubtful one or remove the punch (the day is recalculated).</p></div></div>
  <p class="ap-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="ap-tools">
    <label>From <input class="ap-input" type="date" [(ngModel)]="from"></label><label>To <input class="ap-input" type="date" [(ngModel)]="to"></label>
    <select class="ap-input" [(ngModel)]="only" aria-label="Show"><option value="">All</option><option value="flagged">Flagged</option><option value="void">Removed</option></select>
    <button type="button" class="ap-btn" (click)="load()">Show</button></div>
  <p class="ap-muted" *ngIf="loaded && !rows.length">No punch photos in this period.</p>
  <div class="ap-photos">
    <div class="ap-ph" *ngFor="let p of rows" [class.flag]="p.flagged" [class.void]="p.void" [attr.data-punch]="p.id">
      <div class="ap-ph-imgs"><img *ngIf="p.profile" [src]="p.profile" alt="Profile picture" title="Profile picture"><img [src]="p.photo" alt="Punch photo" title="Punch photo"></div>
      <b>{{ p.employee }}</b><small>{{ p.code }} · {{ p.kind }} · {{ p.ts | date:'d MMM, HH:mm' }} · {{ p.kiosk || p.source }}</small>
      <small *ngIf="p.note" class="ap-note">{{ p.note }}</small>
      <div class="ap-tools" *ngIf="!p.void">
        <button type="button" class="ap-btn small" (click)="act(p, 'ok')">Fine</button>
        <button type="button" class="ap-btn small" (click)="act(p, 'flag')" data-flag>Flag</button>
        <button type="button" class="ap-btn small danger" (click)="act(p, 'void')">Remove punch</button></div>
      <span class="ap-removed" *ngIf="p.void">Removed</span>
    </div>
  </div>
</div>`,
  styles: [`.ap-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; margin-top: 12px; }
    .ap-ph { background: #fff; border: 1px solid #e3e5ee; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
    .ap-ph.flag { border-color: #e0a100; background: #fffaf0; } .ap-ph.void { opacity: .6; }
    .ap-ph-imgs { display: flex; gap: 6px; } .ap-ph-imgs img { width: 50%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; background: #f0f1f6; }
    .ap-ph small { color: #6b7185; font-size: 12px; } .ap-note { color: #7a5200 !important; } .ap-removed { color: #a32626; font-size: 12px; font-weight: 600; }`],
})
export class ApPhotosComponent implements OnInit {
  api: ApApi; rows: any[] = []; from = ''; to = ''; only = ''; msg = ''; err = false; loaded = false;
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new ApApi(http, rec); }
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    try { const r: any = await this.api.get('punch-photos/', { from: this.from, to: this.to, only: this.only }); this.rows = r.rows; this.from = r.from; this.to = r.to; this.msg = ''; }
    catch (e) { this.msg = ApApi.err(e); this.err = true; }
    this.loaded = true; this.cd.markForCheck();
  }
  async act(p: any, action: string): Promise<void> {
    let note = '';
    if (action !== 'ok') { note = prompt(action === 'void' ? 'Why is the punch removed?' : 'What is wrong with the photo?') || ''; if (action === 'void' && !note) return; }
    try { Object.assign(p, await this.api.post('punch-photos/', { id: p.id, action, note })); } catch (e) { this.msg = ApApi.err(e); this.err = true; }
    this.cd.markForCheck();
  }
}

/** v1.49.0 – how an employee's overtime of a month was calculated (used on My payslips and by HR). */
@Component({
  selector: 'app-ot-breakdown',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./attendance-plus.css'],
  template: `
<div class="ap-card ap-ot" *ngIf="d">
  <h2>Overtime of {{ label }}</h2>
  <p class="ap-muted" *ngIf="!d.rows.length">No overtime in this month.</p>
  <ng-container *ngIf="d.rows.length">
    <div class="ap-scroll"><table class="ap-table">
      <tr><th>Day</th><th>On</th><th class="r">Hours</th><th class="r">Rate</th><th class="r">Paid as hours</th><th>Approved</th></tr>
      <tr *ngFor="let r of d.rows"><td>{{ r.date | date:'EEE d MMM' }}</td><td>{{ r.type }}{{ r.night ? ' · night' : '' }}</td><td class="r">{{ r.hours }}</td>
        <td class="r">× {{ r.rate }}</td><td class="r">{{ r.weighted }}</td><td>{{ r.approved ? 'Yes' : 'Waiting' }}</td></tr>
      <tr class="tot"><td colspan="4"><b>Approved overtime, paid as hours</b></td><td class="r"><b>{{ d.weighted_hours }}</b></td><td></td></tr>
    </table></div>
    <p *ngIf="d.components.length">On the payslip: <span *ngFor="let c of d.components; let last = last"><b>{{ c.component }} {{ c.amount }}</b>{{ last ? '' : ', ' }}</span>
      <span *ngIf="d.hourly"> – {{ d.weighted_hours }} hours × {{ d.hourly }} an hour.</span></p>
    <p class="ap-muted" *ngIf="!d.components.length">The overtime is paid when the month's payroll is processed.</p>
  </ng-container>
  <p class="ap-muted" style="font-size:12px">{{ d.law?.law }}</p>
</div>`,
})
export class OtBreakdownComponent implements OnChanges {
  @Input() year = 0; @Input() month = 0; @Input() employee: number | null = null;
  api: ApApi; d: any = null;
  get label(): string { return new Date(this.year, this.month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new ApApi(http, rec); }
  async ngOnChanges(): Promise<void> {
    if (!this.year || !this.month) { return; }
    try { this.d = await this.api.get('ot-breakdown/', { year: this.year, month: this.month, employee: this.employee }); } catch { this.d = null; }
    this.cd.markForCheck();
  }
}
