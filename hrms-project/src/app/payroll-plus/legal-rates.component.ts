import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from '../shared-ui/i18n.service';
import { FLOW_CSS } from '../zeo-flow/flow.service';

/**
 * v1.59.0 – Payroll → Setup → Legal rates: the legal figures ZEO uses in its own calculations (UAE GPSSA rates and the
 * contribution salary limits) with a value from a date. Without a row the built-in value applies. "Rules on" shows what
 * is in force on any day; the payroll uses the 1st of the pay month. Statutory schemes have their own "Rates by date";
 * country policies (gratuity, annual leave, overtime) their "Law changes by date".
 * API: payroll-plus/api/legal-rates/ (GET ?date=, POST, DELETE ?id=)
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/legal-rates/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
const CSS = FLOW_CSS + `
.lr-wrap{padding:18px 22px 40px}
.lr-top{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;justify-content:space-between;margin-bottom:14px}
.lr-top h1{margin:0;font-size:22px;font-weight:700;color:#1b1640}.lr-top p{margin:4px 0 0;color:#6b7185;font-size:13px;max-width:760px}
.lr-on{display:flex;align-items:center;gap:8px;font-size:13px;color:#6b7185}
.lr-on input,.lr-form input,.lr-form select,.lr-form textarea{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0}
.lr-form{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));align-items:end;margin-top:10px}
.lr-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185;min-width:0}.lr-form label.wide{grid-column:1/-1}
.lr-form textarea{height:auto;min-height:50px;padding:6px 10px}
.lr-msg{border-radius:8px;padding:8px 12px;font-size:13px;margin:0 0 12px;background:#ecfdf3;color:#1f7a4d}.lr-msg.err{background:#fff5f5;color:#b42318}
.lr-val{font-size:15px;font-weight:700;color:#1b1640}
.lr-hist{margin:6px 0 0;padding:0;list-style:none;font-size:12px;color:#6b7185}.lr-hist li{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.lr-wide{overflow:auto}
.lp-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:1px solid #dfe1ea;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#2b2f42;cursor:pointer;white-space:nowrap}
.lp-btn.primary{background:#5b4ff5;border-color:#5b4ff5;color:#fff}.lp-btn:disabled{opacity:.5}
.lp-muted{color:#6b7185;font-size:12.5px}
`;
function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail; }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}

@Component({
  selector: 'app-legal-rates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="lr-wrap" data-legal-rates>
  <div class="lr-top">
    <div>
      <h1>{{ 'Legal rates' | t }}</h1>
      <p>{{ 'The legal figures ZEO uses in its own payroll calculations, each with a value from a date. When the law changes, add the new value from the day it starts; earlier months keep the old value. Without a value here the built-in figure applies.' | t }}</p>
    </div>
    <label class="lr-on">{{ 'Rules on' | t }}<input type="date" [(ngModel)]="on" (change)="load()" data-rules-on></label>
  </div>
  <div class="lr-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
  <p class="lp-muted" style="margin:-4px 0 12px">{{ 'Statutory scheme rates have their own Rates by date; gratuity, annual leave and overtime are in Country policies › Law changes by date.' | t }}
    <a class="fw-link" routerLink="/main-sidebar/salary-options/statutory-schemes">{{ 'Statutory schemes' | t }}</a></p>

  <div class="fw-card lr-wide" *ngIf="d">
    <table class="fw-table" zPlain>
      <thead><tr><th>{{ 'Figure' | t }}</th><th>{{ 'In force on' | t }} {{ d.date }}</th><th>{{ 'Built-in' | t }}</th><th>{{ 'History' | t }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let r of d.rows" [attr.data-rate]="r.key">
          <td><b>{{ r.label }}</b><br><small class="lp-muted">{{ r.key }} · {{ r.country }}</small></td>
          <td><span class="lr-val">{{ r.value }}</span><br><small class="lp-muted">{{ r.source === 'rate' ? (('from' | t) + ' ' + r.from) : ('built-in value' | t) }}</small>
            <br *ngIf="r.law_reference"><small class="lp-muted" *ngIf="r.law_reference">{{ r.law_reference }}</small></td>
          <td>{{ r.built_in ?? '–' }}</td>
          <td><ul class="lr-hist"><li *ngFor="let h of r.history">{{ h.effective_from }}: <b>{{ h.value }}</b> <span class="fw-chip ok" *ngIf="h.in_force">{{ 'in force' | t }}</span>
              <a class="fw-link" *ngIf="d.can_change" (click)="del(h)">{{ 'Delete' | t }}</a></li>
            <li *ngIf="!r.history.length">–</li></ul></td>
          <td><button type="button" class="lp-btn" *ngIf="d.can_change" (click)="start(r)">{{ 'New value from a date' | t }}</button></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="fw-card" *ngIf="f" data-rate-form>
    <h2>{{ 'New value from a date' | t }} – {{ f.label }}</h2>
    <div class="lr-form">
      <label>{{ 'Value' | t }}<input type="number" step="0.0001" [(ngModel)]="f.value"></label>
      <label>{{ 'Starts on' | t }}<input type="date" [(ngModel)]="f.effective_from"></label>
      <label class="wide">{{ 'Law reference' | t }}<input [(ngModel)]="f.law_reference" maxlength="400"></label>
      <label class="wide">{{ 'Notes' | t }}<textarea [(ngModel)]="f.notes"></textarea></label>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || f.value === null || f.value === '' || !f.effective_from">{{ 'Save' | t }}</button>
      <button type="button" class="lp-btn" (click)="f = null">{{ 'Cancel' | t }}</button>
    </div>
  </div>
</div>`,
})
export class LegalRatesComponent implements OnInit {
  d: any = null; f: any = null; on = ''; busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    const params: any = { schema: schema() };
    if (this.on) { params.date = this.on; }
    try { this.d = await firstValueFrom(this.http.get<any>(API, { params })); this.bad = false; }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  start(r: any): void {
    this.f = { key: r.key, label: r.label, value: r.value === null ? null : +r.value, effective_from: '', law_reference: '', notes: '' };
    setTimeout(() => document.querySelector('[data-rate-form]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    try {
      const r = await firstValueFrom(this.http.post<any>(API, this.f, { params: { schema: schema() } }));
      this.f = null; this.msg = 'Saved.' + (r.note ? ' ' + r.note : ''); await this.load();
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async del(h: any): Promise<void> {
    if (!confirm(`Delete the value from ${h.effective_from}?`)) { return; }
    try { await firstValueFrom(this.http.delete<any>(API, { params: { schema: schema(), id: h.id } })); await this.load(); }
    catch (e) { this.msg = err(e); this.bad = true; this.cd.detectChanges(); }
  }
}
