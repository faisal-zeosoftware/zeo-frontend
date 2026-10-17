/**
 * v1.18.0 – Final settlement (spec sections 5 and 7). One statement per end of service: salary due, notice, unused leave,
 * gratuity, outstanding earnings, loans / advances, approved asset recovery – each with its basis. HR calculates and submits,
 * Finance validates, management approves, Finance pays (reference) – each step by a different person; payment is due within
 * 14 days of the last working day.
 * API (PayrollPlus): settlements/?status, settlements/eligible/, settlements/ (POST {eos}), settlements/<id>/,
 *                    settlements/<id>/recalculate|submit|validate|approve|pay|return|cancel/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { COUNTRY_PACK_UI } from '../shared-ui/country-pack.service';

@Component({
  selector: 'app-final-settlement',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [`
.fs-grid{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:18px;align-items:start}
@media (max-width:900px){.fs-grid{grid-template-columns:minmax(0,1fr)}}
.fs-list{border:1px solid #e3e6ea;border-radius:10px;background:#fff;overflow:hidden}
.fs-list button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eef0f2;background:#fff;padding:10px 12px;cursor:pointer}
.fs-list button:hover{background:#f6f8fa}.fs-list button.on{background:#eef4fb;box-shadow:inset 3px 0 0 #2b6cb0}
.fs-list .nm{font-weight:600}.fs-list .sub{font-size:12px;color:#5d6670;display:flex;justify-content:space-between;gap:8px}
.fs-st{font-size:11px;padding:1px 8px;border-radius:9px;background:#eef1f4;white-space:nowrap}
.fs-st[data-s=paid]{background:#e5f4ea;color:#1d6b37}.fs-st[data-s=approved],.fs-st[data-s=validated]{background:#e8f0fb;color:#1f4f8a}
.fs-st[data-s=submitted]{background:#fff4dc;color:#7a5600}.fs-st.late{background:#fdeceb;color:#9b2c24}
.fs-card{border:1px solid #e3e6ea;border-radius:10px;background:#fff;padding:16px 18px}
.fs-top{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start}
.fs-top h2{font-size:20px;margin:0}.fs-top .meta{font-size:13px;color:#5d6670;margin-top:2px}
.fs-net{text-align:right}.fs-net b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.fs-net span{font-size:12px;color:#5d6670}
.fs-facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:14px 0}
.fs-facts div{background:#f7f8fa;border-radius:8px;padding:8px 10px}.fs-facts span{display:block;font-size:11px;color:#5d6670}.fs-facts b{font-size:14px}
table.fs-lines{width:100%;border-collapse:collapse;font-size:13px}
.fs-lines td,.fs-lines th{padding:7px 6px;border-bottom:1px solid #eef0f2;vertical-align:top;text-align:left}
.fs-lines td.amt,.fs-lines th.amt{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.fs-lines .basis{font-size:12px;color:#5d6670}.fs-lines tr.ded td.amt{color:#9b2c24}.fs-lines tr.info td{color:#5d6670;font-style:italic}
.fs-lines tr.block td{color:#9b2c24;font-weight:600}.fs-lines tfoot td{font-weight:700;border-bottom:0}
.fs-trail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:16px 0}
@media (max-width:700px){.fs-trail{grid-template-columns:repeat(2,minmax(0,1fr))}}
.fs-trail div{border-top:3px solid #d6dbe0;padding-top:6px;font-size:12px;color:#5d6670}
.fs-trail div.done{border-color:#2e8b57;color:#1f2a33}.fs-trail b{display:block;font-size:12px}
.fs-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-top:1px solid #eef0f2;padding-top:12px}
.fs-actions input{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;min-width:200px}
.fs-notes{white-space:pre-line;font-size:12px;color:#5d6670;margin-top:10px}
.fs-elig{margin-top:14px}.fs-elig .row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eef0f2;font-size:13px;gap:8px}
`],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section"><div class="lp-head"><div>
      <h1 class="page-title">Final settlement</h1>
      <p class="lp-desc">One statement per leaver: every amount with its basis. HR calculates, Finance validates, management approves and Finance pays – within 14 days of the last working day.</p>
    </div>
    <div class="lp-actions">
      <select [(ngModel)]="status" (ngModelChange)="load()" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px" aria-label="Status">
        <option value="draft,submitted,validated,approved">Open</option><option value="paid">Paid</option><option value="">All</option></select>
    </div></div></div>
    <div class="com_list mt-4">
      <p class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}</p>
      <div class="fs-grid">
        <div>
          <div class="fs-list" *ngIf="rows.length">
            <button type="button" *ngFor="let r of rows" [class.on]="cur?.id === r.id" (click)="open(r.id)">
              <div class="nm">{{ r.employee }} <span class="lp-muted">{{ r.employee_code }}</span></div>
              <div class="sub" *ngIf="r.number"><span>{{ r.number }}</span></div>
              <div class="sub"><span>Last day {{ r.last_working_date | date:'dd MMM yyyy' }}</span>
                <span class="fs-st" [attr.data-s]="r.status" [class.late]="r.overdue">{{ r.overdue ? 'Overdue' : r.status_label }}</span></div>
              <div class="sub"><span>{{ r.designation }}</span><span>{{ r.net | number:'1.2-2' }}</span></div>
            </button>
          </div>
          <p class="lp-muted" *ngIf="!rows.length && !loading">No settlements here.</p>
          <div class="fs-elig" *ngIf="canStart && eligible.length">
            <div class="sp-h" style="font-weight:600">Ends of service without a settlement</div>
            <div class="row" *ngFor="let e of eligible">
              <span>{{ e.employee }} <span class="lp-muted">· last day {{ e.last_working_date | date:'dd MMM yyyy' }}</span></span>
              <button type="button" class="lp-btn primary" [disabled]="busy" (click)="start(e)">Calculate</button>
            </div>
          </div>
        </div>
        <div *ngIf="cur" class="fs-card">
          <div class="fs-top">
            <div><h2>{{ cur.employee }}</h2>
              <div class="meta">{{ cur.employee_code }} · {{ cur.designation }} · {{ cur.department }}</div>
              <div class="meta">{{ cur.exit_type }} · joined {{ cur.joined | date:'dd MMM yyyy' }} · last day {{ cur.last_working_date | date:'dd MMM yyyy' }}</div></div>
            <div class="fs-net"><span>Net settlement</span><b>{{ cur.net | number:'1.2-2' }}</b>
              <span class="fs-st" [attr.data-s]="cur.status" [class.late]="cur.overdue">{{ cur.overdue ? 'Overdue' : cur.status_label }}</span></div>
          </div>
          <div class="fs-facts">
            <div><span>Eligible service</span><b>{{ cur.service_years }} years</b></div>
            <div><span>Unpaid days (not service)</span><b>{{ cur.unpaid_days }}</b></div>
            <div><span>Basic / wage a month</span><b>{{ cur.basic | number:'1.2-2' }} / {{ cur.wage | number:'1.2-2' }}</b></div>
            <div><span>Calculated on</span><b>{{ cur.calc_date | date:'dd MMM yyyy' }}</b></div>
            <div><span>Pay by</span><b>{{ cur.due_date | date:'dd MMM yyyy' }}</b></div>
            <div *ngIf="cur.paid_on"><span>Paid on</span><b>{{ cur.paid_on | date:'dd MMM yyyy' }} · {{ cur.payment_ref }}</b></div>
          </div>
          <table class="fs-lines">
            <thead><tr><th>Component</th><th>Basis</th><th class="amt">Amount</th></tr></thead>
            <tbody>
              <tr *ngFor="let l of cur.lines" [class.ded]="l.kind === 'deduction'" [class.info]="l.kind === 'info'" [class.block]="l.kind === 'block'">
                <td>{{ l.label }}</td><td class="basis">{{ l.basis }}</td>
                <td class="amt">{{ l.kind === 'info' || l.kind === 'block' ? '' : (l.kind === 'deduction' ? '− ' : '') + (l.amount | number:'1.2-2') }}</td></tr>
            </tbody>
            <tfoot>
              <tr><td colspan="2">Entitlements</td><td class="amt">{{ cur.total_earnings | number:'1.2-2' }}</td></tr>
              <tr><td colspan="2">Deductions</td><td class="amt">− {{ cur.total_deductions | number:'1.2-2' }}</td></tr>
              <tr><td colspan="2">Net settlement</td><td class="amt">{{ cur.net | number:'1.2-2' }}</td></tr>
            </tfoot>
          </table>
          <div class="fs-trail">
            <div *ngFor="let t of cur.trail" [class.done]="t.by"><b>{{ t.step }}</b>{{ t.by || '–' }}<br>{{ t.at | date:'dd MMM yyyy, HH:mm' }}</div>
          </div>
          <div class="fs-actions" *ngIf="cur.status !== 'paid' && cur.status !== 'cancelled'">
            <ng-container *ngIf="cur.status === 'draft'">
              <label style="font-size:13px"><input type="checkbox" [(ngModel)]="cur.notice_waived" style="min-width:auto;height:auto"> Waive the notice not served</label>
              <button type="button" class="lp-btn" [disabled]="busy" (click)="act('recalculate')">Calculate again</button>
              <button type="button" class="lp-btn primary" [disabled]="busy" (click)="act('submit')">Submit to finance</button>
            </ng-container>
            <button type="button" class="lp-btn primary" *ngIf="cur.status === 'submitted'" [disabled]="busy" (click)="act('validate')">Validate (finance)</button>
            <button type="button" class="lp-btn primary" *ngIf="cur.status === 'validated'" [disabled]="busy" (click)="act('approve')">Approve (management)</button>
            <ng-container *ngIf="cur.status === 'approved'">
              <input [(ngModel)]="payRef" placeholder="Payment reference" aria-label="Payment reference">
              <input type="date" [(ngModel)]="paidOn" aria-label="Paid on" style="min-width:auto">
              <button type="button" class="lp-btn primary" [disabled]="busy || !payRef" (click)="act('pay')">Record payment</button>
            </ng-container>
            <ng-container *ngIf="cur.status === 'submitted' || cur.status === 'validated'">
              <input [(ngModel)]="note" placeholder="Why it goes back to HR" aria-label="Reason">
              <button type="button" class="lp-btn danger" [disabled]="busy || !note" (click)="act('return')">Send back</button>
            </ng-container>
          </div>
          <div class="fs-notes" *ngIf="cur.notes">{{ cur.notes }}</div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class FinalSettlementComponent implements OnInit {
  rows: any[] = []; eligible: any[] = []; cur: any = null;
  status = 'draft,submitted,validated,approved'; canStart = false; loading = false; busy = false;
  msg = ''; msgErr = false; note = ''; payRef = ''; paidOn = new Date().toISOString().slice(0, 10);
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.rec.api}/payroll-plus/api/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }
  private say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.detectChanges(); }
  private err(e: any): string {   // v1.28.1: never "undefined" – the server's reason, whatever shape it has
    const d = e?.error;
    if (d && typeof d === 'object' && typeof d.detail === 'string') { return d.detail + (d.errors ? ' ' + Object.values(d.errors).join(' ') : ''); }
    const t = httpErrorText(e);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) + (t.endsWith('.') ? '' : '.') : 'It could not be done.';
  }
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    this.loading = true;
    try {
      const r = await firstValueFrom(this.http.get<any>(this.url('settlements/', this.status ? `&status=${this.status}` : '')));
      this.rows = r.rows || []; this.canStart = !!r.can_start;
      if (this.canStart) { this.eligible = (await firstValueFrom(this.http.get<any>(this.url('settlements/eligible/')))).rows || []; }
      if (!this.cur && this.rows.length) { await this.open(this.rows[0].id); }
    } catch (e: any) { this.rows = []; this.say(this.err(e), true); }
    this.loading = false; this.cd.detectChanges();
  }
  async open(id: number): Promise<void> {
    try { this.cur = await firstValueFrom(this.http.get<any>(this.url(`settlements/${id}/`))); this.note = ''; this.payRef = ''; }
    catch (e: any) { this.say(this.err(e), true); }
    this.cd.detectChanges();
  }
  async start(e: any): Promise<void> {
    this.busy = true;
    try { this.cur = await firstValueFrom(this.http.post<any>(this.url('settlements/'), { eos: e.eos })); this.say(`Settlement of ${e.employee} calculated.`); this.status = 'draft,submitted,validated,approved'; await this.load(); }
    catch (x: any) { this.say(this.err(x), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async act(action: string): Promise<void> {
    const body: any = { note: this.note };
    if (action === 'recalculate') { body.notice_waived = this.cur.notice_waived; }
    if (action === 'pay') { body.payment_ref = this.payRef; body.paid_on = this.paidOn; }
    if (action === 'submit' && !confirm('Submit this settlement to Finance? It cannot be changed until it is sent back.')) { return; }
    this.busy = true;
    try {
      this.cur = await firstValueFrom(this.http.post<any>(this.url(`settlements/${this.cur.id}/${action}/`), body));
      const done: Record<string, string> = { recalculate: 'Calculated again from the current records.', submit: 'Submitted – Finance validates next.', validate: 'Validated – waiting for the management approval.',
        approve: 'Approved – Finance can record the payment.', pay: 'Payment recorded. The end of service is closed.', return: 'Sent back to HR.' };
      this.say(done[action] || 'Done.'); this.note = '';
      const keep = this.cur.id; this.cur = null; await this.load(); await this.open(keep);
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
}
