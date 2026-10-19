import { ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from './i18n.service';

/**
 * v1.31.0 – optional legal / registration details of the company and of a branch, kept in OrgStructure side tables
 * (CompanyProfile, BranchProfile) so the core company / branch rows stay untouched. Captions follow the country pack
 * (Trade licence / CR / CIN, TRN / VAT / GSTIN, GPSSA / GOSI / EPFO …). Nothing is mandatory.
 *   <z-company-profile [schema]="company.schema_name"></z-company-profile>   (Settings → Company → edit)
 *   <z-branch-profile [branchId]="branch.id"></z-branch-profile>              (Settings → Branches → edit)
 */
const API = `${environment.apiBaseUrl}/org-structure/api/`;
const CSS = `
.zp{border:1px solid #e3e5ee;border-radius:12px;margin:14px 0;background:#fafafd}
.zp-h{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;font-weight:700;color:#1b1640;font-size:14px}
.zp-h small{font-weight:400;color:#6b7185;font-size:12px}
.zp-h .zp-tg{margin-left:auto;color:#5b4fe0;font-size:12.5px;font-weight:600}
.zp-b{padding:4px 14px 14px;border-top:1px solid #eceef5}
.zp-sec{font-size:11.5px;font-weight:700;color:#6b7185;text-transform:uppercase;letter-spacing:.03em;margin:12px 0 6px}
.zp-g{display:grid;gap:10px 14px;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr))}
.zp-g label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#4a4f63;min-width:0}
.zp-g input,.zp-g select,.zp-g textarea{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0;background:#fff}
.zp-g textarea{height:auto;min-height:60px;padding:8px 10px}
.zp-g label.wide{grid-column:1/-1}
.zp-g label.chk{flex-direction:row;align-items:center;gap:8px}.zp-g label.chk input{height:auto;width:auto}
.zp-bank{display:grid;gap:6px 10px;grid-template-columns:1.2fr 1.2fr 1fr 1.5fr 1fr .6fr auto auto;align-items:center;margin-bottom:6px}
.zp-bank input{height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;font-size:12.5px;min-width:0;background:#fff}
.zp-bank .zp-hd{font-size:11px;color:#6b7185}
.zp-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:12px}
.zp-btn{height:32px;border:1px solid #dfe1ea;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#2b2f42;cursor:pointer}
.zp-btn.p{background:#5b4ff5;border-color:#5b4ff5;color:#fff}.zp-btn:disabled{opacity:.5}
.zp-msg{font-size:12.5px;color:#1f7a4d}.zp-msg.err{color:#b42318}
.zp-warn{font-size:12.5px;color:#9a5b00;background:#fff7e6;border-radius:8px;padding:6px 10px;margin:8px 0}
.zp-img{display:flex;align-items:center;gap:10px}.zp-img img{height:44px;border:1px solid #e3e5ee;border-radius:6px;background:#fff}
@media (max-width:760px){.zp-bank{grid-template-columns:1fr 1fr}}
`;

function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail; }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}
const BANK = () => ({ bank: '', account_name: '', account_no: '', iban: '', swift: '', currency: '', branch: '', wps: false });

@Component({
  selector: 'z-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TPipe],
  styles: [CSS],
  template: `
<div class="zp" *ngIf="d">
  <div class="zp-h" (click)="open = !open"><span>{{ 'Legal & registration details' | t }}</span><small>{{ 'optional · captions for' | t }} {{ d.pack_name || d.pack }}</small><span class="zp-tg">{{ open ? ('Hide' | t) : ('Show' | t) }}</span></div>
  <div class="zp-b" *ngIf="open">
    <div class="zp-warn" *ngIf="d.expiring?.length">{{ 'A registration expires within 60 days – see the dates below.' | t }}</div>
    <div class="zp-sec">{{ 'Legal entity' | t }}</div>
    <div class="zp-g">
      <label>{{ 'Legal name' | t }}<input [(ngModel)]="d.legal_name" maxlength="200" [disabled]="!d.can_change"></label>
      <label>{{ 'Name in local language' | t }}<input [(ngModel)]="d.name_local" maxlength="200" [disabled]="!d.can_change" dir="auto"></label>
      <label>{{ 'Company type' | t }}<select [(ngModel)]="d.company_type" [disabled]="!d.can_change"><option value="">–</option><option *ngFor="let t of d.company_types" [value]="t[0]">{{ t[1] }}</option></select></label>
      <label>{{ 'Jurisdiction' | t }}<select [(ngModel)]="d.jurisdiction" [disabled]="!d.can_change"><option value="">–</option><option *ngFor="let t of d.jurisdictions" [value]="t[0]">{{ t[1] }}</option></select></label>
      <label>{{ d.labels.authority }}<input [(ngModel)]="d.authority" maxlength="120" [disabled]="!d.can_change"></label>
      <label>{{ d.labels.licence_no }}<input [(ngModel)]="d.licence_no" maxlength="60" [disabled]="!d.can_change"></label>
      <label>{{ 'Issued on' | t }}<input type="date" [(ngModel)]="d.licence_issue" [disabled]="!d.can_change"></label>
      <label>{{ 'Expires on' | t }}<input type="date" [(ngModel)]="d.licence_expiry" [disabled]="!d.can_change"></label>
      <label>{{ d.labels.establishment_no }}<input [(ngModel)]="d.establishment_no" maxlength="60" [disabled]="!d.can_change"></label>
      <label>{{ 'Establishment expiry' | t }}<input type="date" [(ngModel)]="d.establishment_expiry" [disabled]="!d.can_change"></label>
      <label>{{ d.labels.chamber_no }}<input [(ngModel)]="d.chamber_no" maxlength="60" [disabled]="!d.can_change"></label>
    </div>
    <div class="zp-sec">{{ 'Tax and social security' | t }}</div>
    <div class="zp-g">
      <label>{{ d.labels.tax_id }}<input [(ngModel)]="d.tax_id" maxlength="40" [disabled]="!d.can_change"></label>
      <label>{{ 'Tax registration date' | t }}<input type="date" [(ngModel)]="d.tax_reg_date" [disabled]="!d.can_change"></label>
      <label>{{ d.labels.corporate_tax_no }}<input [(ngModel)]="d.corporate_tax_no" maxlength="40" [disabled]="!d.can_change"></label>
      <label>{{ d.labels.pension_reg_no }}<input [(ngModel)]="d.pension_reg_no" maxlength="60" [disabled]="!d.can_change"></label>
      <label>{{ d.labels.insurance_reg_no }}<input [(ngModel)]="d.insurance_reg_no" maxlength="60" [disabled]="!d.can_change"></label>
      <label *ngFor="let x of d.labels.extra">{{ x.label }}<input [(ngModel)]="d.extra_regs[x.key]" maxlength="80" [disabled]="!d.can_change"></label>
    </div>
    <div class="zp-sec">{{ 'Contact and signatory' | t }}</div>
    <div class="zp-g">
      <label>{{ 'Phone' | t }}<input [(ngModel)]="d.phone" maxlength="40" [disabled]="!d.can_change"></label>
      <label>{{ 'E-mail' | t }}<input type="email" [(ngModel)]="d.email" [disabled]="!d.can_change"></label>
      <label>{{ 'Website' | t }}<input [(ngModel)]="d.website" maxlength="120" [disabled]="!d.can_change"></label>
      <label>{{ 'PO box' | t }}<input [(ngModel)]="d.po_box" maxlength="40" [disabled]="!d.can_change"></label>
      <label>{{ 'Contact person' | t }}<input [(ngModel)]="d.contact_person" maxlength="120" [disabled]="!d.can_change"></label>
      <label>{{ 'Authorised signatory' | t }}<input [(ngModel)]="d.signatory_name" maxlength="120" [disabled]="!d.can_change"></label>
      <label>{{ 'Signatory designation' | t }}<input [(ngModel)]="d.signatory_designation" maxlength="120" [disabled]="!d.can_change"></label>
      <label>{{ 'Fiscal year starts in' | t }}<select [(ngModel)]="d.fiscal_year_start_month" [disabled]="!d.can_change"><option [ngValue]="null">–</option><option *ngFor="let m of months; let i = index" [ngValue]="i + 1">{{ m }}</option></select></label>
      <label>{{ 'Week starts on' | t }}<select [(ngModel)]="d.week_start" [disabled]="!d.can_change"><option [ngValue]="null">–</option><option *ngFor="let w of weekdays; let i = index" [ngValue]="i">{{ w }}</option></select></label>
      <label>{{ 'Signature image' | t }}<span class="zp-img"><img *ngIf="d.signature" [src]="d.signature" alt=""><input type="file" accept="image/*" (change)="file('signature', $event)" [disabled]="!d.can_change"></span></label>
      <label>{{ 'Company stamp image' | t }}<span class="zp-img"><img *ngIf="d.stamp" [src]="d.stamp" alt=""><input type="file" accept="image/*" (change)="file('stamp', $event)" [disabled]="!d.can_change"></span></label>
      <label class="wide">{{ 'Letterhead header (letters and certificates)' | t }}<textarea [(ngModel)]="d.letterhead_header" [disabled]="!d.can_change"></textarea></label>
      <label class="wide">{{ 'Letterhead footer' | t }}<textarea [(ngModel)]="d.letterhead_footer" [disabled]="!d.can_change"></textarea></label>
    </div>
    <div class="zp-sec">{{ 'Bank accounts' | t }} <small style="font-weight:400;text-transform:none">({{ 'tick the one used for the salary / WPS file' | t }})</small></div>
    <div class="zp-bank zp-hd"><span class="zp-hd">{{ 'Bank' | t }}</span><span class="zp-hd">{{ 'Account name' | t }}</span><span class="zp-hd">{{ 'Account no.' | t }}</span><span class="zp-hd">IBAN</span><span class="zp-hd">SWIFT</span><span class="zp-hd">{{ 'Currency' | t }}</span><span class="zp-hd">WPS</span><span></span></div>
    <div class="zp-bank" *ngFor="let b of d.bank_accounts; let i = index">
      <input [(ngModel)]="b.bank" [disabled]="!d.can_change"><input [(ngModel)]="b.account_name" [disabled]="!d.can_change"><input [(ngModel)]="b.account_no" [disabled]="!d.can_change">
      <input [(ngModel)]="b.iban" [disabled]="!d.can_change"><input [(ngModel)]="b.swift" [disabled]="!d.can_change"><input [(ngModel)]="b.currency" maxlength="3" [disabled]="!d.can_change">
      <input type="checkbox" [(ngModel)]="b.wps" [disabled]="!d.can_change"><button type="button" class="zp-btn" (click)="d.bank_accounts.splice(i, 1)" [disabled]="!d.can_change">×</button>
    </div>
    <button type="button" class="zp-btn" (click)="d.bank_accounts.push(bank())" [disabled]="!d.can_change">+ {{ 'Bank account' | t }}</button>
    <div class="zp-foot">
      <button type="button" class="zp-btn p" (click)="save()" [disabled]="busy || !d.can_change">{{ busy ? ('Saving…' | t) : ('Save registration details' | t) }}</button>
      <span class="zp-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</span>
    </div>
  </div>
</div>`,
})
export class ZCompanyProfileComponent implements OnInit, OnChanges {
  @Input() schema: string | null = null;
  @Input() open = false;
  d: any = null; busy = false; msg = ''; bad = false;
  files: Record<string, File> = {};
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  bank = BANK;
  private sch(): string { return this.schema || localStorage.getItem('selectedSchema') || ''; }
  ngOnInit(): void { this.load(); }
  ngOnChanges(): void { this.load(); }
  async load(): Promise<void> {
    if (!this.sch()) { return; }
    try { this.d = await firstValueFrom(this.http.get<any>(API + 'company-profile/', { params: { schema: this.sch() } })); this.d.extra_regs = this.d.extra_regs || {}; this.d.bank_accounts = this.d.bank_accounts || []; }
    catch (e) { this.d = null; }
    this.cd.detectChanges();
  }
  file(k: string, ev: Event): void { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) { this.files[k] = f; } }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    const fd = new FormData();
    const skip = new Set(['pack', 'pack_name', 'labels', 'can_change', 'company_types', 'jurisdictions', 'expiring', 'signature', 'stamp', 'id', 'updated_at', 'updated_by_id']);
    for (const [k, v] of Object.entries(this.d)) {
      if (skip.has(k)) { continue; }
      if (k === 'extra_regs' || k === 'bank_accounts') { fd.append(k, JSON.stringify(v)); continue; }
      fd.append(k, v === null || v === undefined ? '' : String(v));
    }
    for (const [k, f] of Object.entries(this.files)) { fd.append(k, f); }
    try {
      this.d = await firstValueFrom(this.http.put<any>(API + 'company-profile/', fd, { params: { schema: this.sch() } }));
      this.d.extra_regs = this.d.extra_regs || {}; this.d.bank_accounts = this.d.bank_accounts || []; this.files = {};
      this.msg = 'Saved.';
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}

@Component({
  selector: 'z-branch-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TPipe],
  styles: [CSS],
  template: `
<div class="zp" *ngIf="d">
  <div class="zp-h" (click)="open = !open"><span>{{ 'Registration and site details' | t }}</span><small>{{ 'optional' | t }}</small><span class="zp-tg">{{ open ? ('Hide' | t) : ('Show' | t) }}</span></div>
  <div class="zp-b" *ngIf="open">
    <div class="zp-g">
      <label>{{ 'Branch type' | t }}<select [(ngModel)]="d.branch_type" [disabled]="!d.can_change"><option value="">–</option><option *ngFor="let t of d.branch_types" [value]="t[0]">{{ t[1] }}</option></select></label>
      <label>{{ 'Name in local language' | t }}<input [(ngModel)]="d.name_local" maxlength="200" [disabled]="!d.can_change" dir="auto"></label>
      <label>{{ 'Own' | t }} {{ d.labels.licence_no }}<input [(ngModel)]="d.licence_no" maxlength="60" [disabled]="!d.can_change"></label>
      <label>{{ 'Licence expiry' | t }}<input type="date" [(ngModel)]="d.licence_expiry" [disabled]="!d.can_change"></label>
      <label>{{ 'Own' | t }} {{ d.labels.establishment_no }}<input [(ngModel)]="d.establishment_no" maxlength="60" [disabled]="!d.can_change"></label>
      <label>{{ 'Establishment expiry' | t }}<input type="date" [(ngModel)]="d.establishment_expiry" [disabled]="!d.can_change"></label>
      <label>{{ 'Own' | t }} {{ d.labels.tax_id }}<input [(ngModel)]="d.tax_id" maxlength="40" [disabled]="!d.can_change"></label>
      <label>{{ 'Timezone' | t }}<input [(ngModel)]="d.timezone" maxlength="50" placeholder="Asia/Dubai" [disabled]="!d.can_change"></label>
      <label>{{ 'PO box' | t }}<input [(ngModel)]="d.po_box" maxlength="40" [disabled]="!d.can_change"></label>
      <label>{{ 'Latitude' | t }}<input type="number" step="0.000001" [(ngModel)]="d.latitude" [disabled]="!d.can_change"></label>
      <label>{{ 'Longitude' | t }}<input type="number" step="0.000001" [(ngModel)]="d.longitude" [disabled]="!d.can_change"></label>
      <label class="chk"><input type="checkbox" [(ngModel)]="d.is_default" [disabled]="!d.can_change">{{ 'Default branch for new employees' | t }}</label>
      <label *ngFor="let x of d.labels.extra">{{ x.label }}<input [(ngModel)]="d.extra_regs[x.key]" maxlength="80" [disabled]="!d.can_change"></label>
    </div>
    <div class="zp-foot">
      <button type="button" class="zp-btn p" (click)="save()" [disabled]="busy || !d.can_change">{{ busy ? ('Saving…' | t) : ('Save branch details' | t) }}</button>
      <span class="zp-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</span>
    </div>
  </div>
</div>`,
})
export class ZBranchProfileComponent implements OnInit, OnChanges {
  @Input() branchId: number | string | null = null;
  @Input() open = false;
  d: any = null; busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  private sch(): string { return localStorage.getItem('selectedSchema') || ''; }
  ngOnInit(): void { this.load(); }
  ngOnChanges(): void { this.load(); }
  async load(): Promise<void> {
    if (!this.branchId) { this.d = null; return; }
    try { this.d = await firstValueFrom(this.http.get<any>(API + `branch-profile/${this.branchId}/`, { params: { schema: this.sch() } })); this.d.extra_regs = this.d.extra_regs || {}; }
    catch { this.d = null; }
    this.cd.detectChanges();
  }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    const body: any = { ...this.d };
    for (const k of ['pack', 'labels', 'branch_types', 'can_change', 'exists', 'id', 'updated_at', 'updated_by_id', 'branch_id']) { delete body[k]; }
    for (const k of ['latitude', 'longitude']) { if (body[k] === '' ) { body[k] = null; } }
    try { this.d = await firstValueFrom(this.http.put<any>(API + `branch-profile/${this.branchId}/`, body, { params: { schema: this.sch() } })); this.d.extra_regs = this.d.extra_regs || {}; this.msg = 'Saved.'; }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}
