// v1.63.0 (item 27): new piece – the salary split on the employee's Bank / payment details
import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { openZForm } from '../shared-ui/z-form.component';
import { zConfirm } from '../shared-ui/z-confirm';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';
import { splitForm } from '../pay163/pay163.component';

const SPL = '/payroll-plus/api/pay-splits/';
const T = (s: string, p?: any[]) => i18nT(s, p);
function dmy(d: any): string { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : (d ? String(d) : '–'); }

/**
 * v1.63.0 (item 27) – Salary split on the employee's Bank tab: the main account (payment mode of the salary account – WPS for the UAE
 * part) plus a second bank account, cash, cheque or an own method, by a fixed amount or a % of the net pay, from a date; the history.
 * API /payroll-plus/api/pay-splits/?employee=<id> (PayrollPlus/pay163_views.py).
 */
@Component({
  selector: 'z-emp-pay-split',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep ep-sec" *ngIf="d" data-emp-split>
  <h3>Salary split <span class="ep-tag blue">{{ T('Main account: {0}', [d.main_method_label]) }}</span></h3>
  <p class="lp-muted" style="margin:0 0 10px">Pay part of the net salary to a second bank account, in cash, by cheque or by an own method – a fixed amount or a percentage, from a date. The rest goes to the main account. Held salary is taken off the main part first.</p>
  <div class="ep-empty" *ngIf="!d.rows.length">No salary split – the whole net pay goes to the main account.</div>
  <div class="ep-scroll" *ngIf="d.rows.length">
    <table class="ep-table" zPlain>
      <thead><tr><th>From</th><th>Second part</th><th>Account</th><th>Status</th><th>Note</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let s of d.rows" [attr.data-emp-split-row]="s.effective_from">
          <td>{{ dmy(s.effective_from) }}</td><td>{{ s.text }}</td>
          <td><small>{{ s.iban || s.account_number || '–' }}</small><br *ngIf="s.bank_name"><small class="lp-muted" *ngIf="s.bank_name">{{ s.bank_name }}</small></td>
          <td><span class="ep-tag" [ngClass]="s.status !== 'active' ? 'bad' : s.current ? 'ok' : s.future ? 'warn' : ''">{{ s.status !== 'active' ? s.status_label : s.current ? T('In force') : s.future ? T('From a later date') : T('Earlier') }}</span></td>
          <td>{{ s.note }}</td>
          <td><button type="button" class="ep-link" *ngIf="d.can_edit && !readonly && s.status === 'active'" (click)="cancel(s)">Cancel</button></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="ep-actions" *ngIf="d.can_edit && !readonly" style="margin-top:10px">
    <button type="button" class="lp-btn primary" (click)="add()" data-emp-split-new>+ New salary split</button>
  </div>
</div>`,
})
export class ZEmpPaySplitComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  @Input() readonly = false;
  d: any = null;
  dmy = dmy; T = T;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  url(p: string): string {
    const sch = encodeURIComponent(localStorage.getItem('selectedSchema') || '');
    return `${environment.apiBaseUrl}${p}${p.includes('?') ? '&' : '?'}schema=${sch}`;
  }
  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(this.url(`${SPL}?employee=${this.employeeId}`))); }
    catch { this.d = null; }   // no right: the section is not shown
    this.cd.detectChanges();
  }
  async add(): Promise<void> {
    if (await openZForm(splitForm(this.d?.methods || [], +this.employeeId!))) { await this.load(); }
  }
  async cancel(s: any): Promise<void> {
    if (!(await zConfirm(T('Cancel the salary split from {0}?', [dmy(s.effective_from)]), { danger: true, ok: T('Cancel the split') }))) { return; }
    try { await firstValueFrom(this.http.post<any>(this.url(`${SPL}${s.id}/cancel/`), {})); zToast(T('Cancelled.'), 'ok'); }
    catch (e: any) { zToast(e?.error?.detail || T('Request failed'), 'err'); }
    await this.load();
  }
}
