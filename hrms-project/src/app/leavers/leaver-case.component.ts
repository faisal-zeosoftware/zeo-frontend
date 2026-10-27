/**
 * v1.62.0 EOS – one leaver: who, the exit, the final settlement statement (earnings and deductions, each with its basis and calculation),
 * the company assets, HR's other additions / deductions, the steps per role (HR calculates and submits → Finance checks → approval →
 * payment) with the history, Print and PDF on the company letterhead. Self service (route data mine) shows the employee's own approved
 * statement, read only.
 * API (PayrollPlus): GET leavers/<id>/ · POST leavers/<id>/calculate/ · settlements/<id>/recalculate|submit|validate|approve|pay|reject/
 *                    POST settlements/<id>/lines/ · DELETE settlements/<id>/lines/<line>/ · POST settlements/<id>/assets/ · GET settlements/<id>/pdf/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { TPipe, ZDatePipe, i18nT } from '../shared-ui/i18n.service';
import { LV_STYLES } from './leavers.styles';

@Component({
  selector: 'app-leaver-case',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe, ZDatePipe],
  styles: [LV_STYLES + `
.lv .back{display:inline-flex;align-items:center;gap:4px;color:var(--acc);font-weight:600;text-decoration:none;margin-bottom:12px;font-size:13px;cursor:pointer;background:none;border:0;padding:0}
.lv .back .material-icons{font-size:18px}
.lv .hero{padding:20px 24px;display:flex;gap:18px;align-items:flex-start;border-bottom:3px solid var(--acc)}
.lv .hero .id{flex:1 1 auto;min-width:0}
.lv .hero .id .line{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.lv .hero .id .meta{color:var(--mut);margin-top:6px;font-size:13px}
.lv .hero .pay{text-align:end;flex:0 0 auto}
.lv .hero .pay span{display:block;font-size:12px;color:var(--mut);font-weight:600}
.lv .hero .pay b{display:block;font-size:28px;color:var(--ink);font-weight:800;margin:2px 0 6px}
.lv .hero .pay b small{font-size:14px;font-weight:700;color:var(--mut);margin-inline-end:6px}
.lv .tools{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
.lv .stepper{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:16px 20px;gap:6px}
.lv .stepper .st{position:relative;padding-top:30px;text-align:center}
.lv .stepper .st:before{content:'';position:absolute;top:11px;inset-inline-start:-50%;width:100%;height:2px;background:#dfe2ea;z-index:0}
.lv .stepper .st:first-child:before{display:none}
.lv .stepper .st.done:before,.lv .stepper .st.cur:before{background:var(--ok)}
.lv .stepper .dot{position:absolute;top:0;inset-inline-start:calc(50% - 12px);width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid #d3d6e2;color:#9aa0b5;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;z-index:1}
.lv .stepper .st.done .dot{background:var(--ok);border-color:var(--ok);color:#fff}
.lv .stepper .st.cur .dot{border-color:var(--acc);color:var(--acc);box-shadow:0 0 0 4px var(--acc2)}
.lv .stepper .st .t{font-weight:700;color:var(--ink);font-size:12.5px}
.lv .stepper .st .w{font-size:11.5px;color:var(--mut);margin-top:2px;line-height:1.35}
.lv .facts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:var(--line);border-top:1px solid var(--line);border-radius:0 0 14px 14px;overflow:hidden}
@media (max-width:1150px){.lv .facts{grid-template-columns:repeat(3,minmax(0,1fr))}}
.lv .facts div{background:#fff;padding:11px 16px}
.lv .facts span{display:block;font-size:11.5px;color:var(--mut);font-weight:600}
.lv .facts b{display:block;font-size:13.5px;color:var(--ink);margin-top:3px;font-weight:600}
.lv .grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;margin-top:16px;align-items:start}
@media (max-width:1150px){.lv .grid{grid-template-columns:minmax(0,1fr)}}
.lv .ch{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line);gap:10px}
.lv .stmt .sec{display:flex;justify-content:space-between;align-items:center;padding:10px 18px;background:#fafbfd;border-bottom:1px solid var(--line);
  font-weight:700;color:var(--ink);font-size:12.5px;text-transform:uppercase;letter-spacing:.4px}
.lv .stmt .sec.ded{color:#7a2a2a}
.lv .stmt .ln{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;padding:11px 18px;border-bottom:1px solid #f0f1f5}
.lv .stmt .ln .lb{font-weight:600;color:var(--ink);font-size:13.5px}
.lv .stmt .ln .bs{font-size:12px;color:var(--mut);margin-top:3px;line-height:1.45}
.lv .stmt .ln .calc{margin:6px 0 0;padding:8px 12px;background:var(--soft);border-radius:8px;font-size:12px;color:var(--ink2);list-style:none}
.lv .stmt .ln .calc li{padding:1px 0}
.lv .stmt .ln .am{font-weight:700;color:var(--ink);font-size:14px;text-align:end}
.lv .stmt .ln.d .am{color:#9b2c24}
.lv .stmt .ln .by{font-size:11.5px;color:var(--acc);margin-top:3px}
.lv .stmt .tot{display:flex;justify-content:space-between;padding:10px 18px;font-weight:700;color:var(--ink);border-bottom:1px solid var(--line)}
.lv .netbox{margin:16px 18px;padding:16px 20px;border-radius:12px;background:var(--ink);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:16px}
.lv .netbox span{display:block;font-size:12px;color:#c9c5f5;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.lv .netbox em{display:block;font-style:normal;font-size:12.5px;color:#e4e2fb;margin-top:4px}
.lv .netbox b{font-size:26px;font-weight:800;white-space:nowrap}
.lv .notes{margin:0 18px 16px;padding:12px 14px;border-radius:10px;background:var(--soft);font-size:12.5px}
.lv .notes div{padding:2px 0;color:var(--ink2)}
.lv .alert{margin:14px 18px 0;padding:11px 14px;border-radius:10px;background:var(--badbg);color:var(--bad);font-weight:600;display:flex;gap:8px;align-items:flex-start}
.lv .side .card{margin-bottom:16px}
.lv .side .cb{padding:14px 18px}
.lv .act{display:flex;flex-direction:column;gap:10px}
.lv .act .row2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
.lv .act .row2 .f{width:100%}
.lv .wait{padding:10px 12px;border-radius:10px;background:var(--infobg);color:var(--info);font-size:12.5px;font-weight:500}
.lv .paid{padding:12px;border-radius:10px;background:var(--okbg);color:var(--ok);font-weight:600}
.lv .ast{padding:12px 18px;border-bottom:1px solid #f0f1f5}
.lv .ast:last-child{border-bottom:0}
.lv .ast .top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.lv .ast .nm{font-weight:600;color:var(--ink)}
.lv .ast .sub{font-size:12px;color:var(--mut);margin-top:2px}
.lv .ast .dec{margin-top:8px;font-size:12px;padding:7px 10px;border-radius:8px;background:var(--soft)}
.lv .ast .btns{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.lv .ast .frm{display:grid;grid-template-columns:110px 1fr;gap:6px;margin-top:8px}
.lv .tl{list-style:none;margin:0;padding:6px 18px 14px}
.lv .tl li{position:relative;padding:8px 0 8px 18px;border-inline-start:2px solid #e3e5ee;margin-inline-start:5px;padding-inline-start:16px}
.lv .tl li:before{content:'';position:absolute;inset-inline-start:-7px;top:12px;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid var(--acc)}
.lv .tl li.ret:before{border-color:var(--bad)}
.lv .tl .a{font-weight:600;color:var(--ink);font-size:13px}
.lv .tl .w{font-size:12px;color:var(--mut)}
.lv .tl .n{font-size:12px;color:var(--ink2);margin-top:2px}
.lv .addl{display:grid;grid-template-columns:130px minmax(0,1fr) 120px;gap:8px;padding:14px 18px;border-top:1px solid var(--line);align-items:end}
.lv .addl .full{grid-column:1 / -1;display:flex;gap:8px}
.lv .addl .full input{flex:1}
.lv .nocalc{padding:28px 22px;text-align:center}
.lv .nocalc p{color:var(--mut);max-width:520px;margin:6px auto 16px;line-height:1.5}
`],
  template: `
<div class="lv" *ngIf="c">
  <button type="button" class="back no-print" *ngIf="!mine" (click)="back()"><span class="material-icons">{{ rtl ? 'chevron_right' : 'chevron_left' }}</span>Leavers</button>
  <p class="msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}</p>

  <div class="card" style="margin-top:4px">
    <div class="hero">
      <div class="av lg"><img *ngIf="c.photo" [src]="media(c.photo)" alt=""><ng-container *ngIf="!c.photo">{{ c.initials }}</ng-container></div>
      <div class="id">
        <div class="line"><h1>{{ c.employee }}</h1>
          <span class="chip" [class.bad]="c.exit_type === 'termination'" [class.info]="c.exit_type === 'end_of_contract'" [class.acc]="c.exit_type === 'resignation'">{{ c.exit_type_label }}</span>
          <span class="chip" [class.ok]="c.stage === 'paid'" [class.warn]="c.stage !== 'paid' && !c.overdue" [class.bad]="c.overdue">{{ c.stage_label }}</span></div>
        <div class="meta">{{ c.employee_code }}<ng-container *ngIf="c.designation"> · {{ c.designation }}</ng-container><ng-container *ngIf="c.department"> · {{ c.department }}</ng-container><ng-container *ngIf="c.branch"> · {{ c.branch }}</ng-container></div>
        <div class="meta" *ngIf="s?.number || c.document_number">{{ s?.number ? ('Settlement {0}' | t:s.number) : '' }}<ng-container *ngIf="s?.number && c.document_number"> · </ng-container>{{ c.document_number ? ('Exit document {0}' | t:c.document_number) : '' }}</div>
      </div>
      <div class="pay">
        <span>Net payable</span>
        <b class="num" *ngIf="s"><small>AED</small>{{ s.net | number:'1.2-2' }}</b>
        <b class="mut" *ngIf="!s" style="font-size:16px">Not calculated</b>
        <ng-container *ngIf="c.stage === 'paid'"><span class="chip ok">{{ 'Paid {0}' | t:(c.paid_on | zdate) }}</span></ng-container>
        <ng-container *ngIf="c.stage !== 'paid' && c.stage !== 'cancelled'">
          <span class="chip" [class.bad]="c.days_left < 0" [class.warn]="c.days_left >= 0 && c.days_left <= 3" [class.info]="c.days_left > 3">
            {{ c.days_left < 0 ? ('{0} days overdue' | t:(-c.days_left)) : (c.days_left === 0 ? ('Due today' | t) : ('{0} days left' | t:c.days_left)) }}</span>
          <div class="mut" style="font-size:12px;margin-top:4px">{{ 'Pay by {0}' | t:(c.due_date | zdate) }}</div></ng-container>
        <div class="tools no-print" *ngIf="s">
          <button type="button" class="lv-btn sm" (click)="pdf(true)" [disabled]="busy"><span class="material-icons">print</span>Print</button>
          <button type="button" class="lv-btn sm" (click)="pdf(false)" [disabled]="busy"><span class="material-icons">picture_as_pdf</span>PDF</button>
        </div>
      </div>
    </div>
    <div class="stepper">
      <div class="st" *ngFor="let t of stepRows; let i = index" [class.done]="i < c.steps_done" [class.cur]="i === c.steps_done && c.stage !== 'paid'">
        <div class="dot"><span *ngIf="i < c.steps_done" class="material-icons" style="font-size:15px">check</span><ng-container *ngIf="i >= c.steps_done">{{ i + 1 }}</ng-container></div>
        <div class="t">{{ t.label }}</div>
        <div class="w" *ngIf="t.by || t.at">{{ t.by }}<ng-container *ngIf="t.at"><br *ngIf="t.by"><span class="num">{{ t.at | zdate }}</span></ng-container></div>
        <div class="w" *ngIf="!t.by && !t.at && i === c.steps_done && c.stage !== 'paid'">{{ c.stage_label }}</div>
      </div>
    </div>
    <div class="facts">
      <div><span>Joined</span><b class="num">{{ c.joined | zdate }}</b></div>
      <div><span>Last working day</span><b class="num">{{ c.last_working_date | zdate }}</b></div>
      <div><span>Total service</span><b>{{ '{0} y {1} m {2} d' | t:c.service.years:c.service.months:c.service.days }}</b></div>
      <div><span>Unpaid days</span><b class="num">{{ c.unpaid_days | number:'1.0-2' }}</b></div>
      <div><span>Notice</span><b>{{ c.notice_date ? ('{0} days from {1}' | t:c.notice_days:(c.notice_date | zdate)) : '–' }}</b></div>
      <div><span>Basic salary</span><b class="num">AED {{ c.basic | number:'1.2-2' }}</b></div>
      <div [attr.title]="(c.wage_parts || []).join(' + ')"><span>Monthly wage</span><b class="num">AED {{ c.wage | number:'1.2-2' }}</b></div>
      <div><span>Exit type</span><b>{{ c.exit_type_label }}</b></div>
      <div><span>Branch</span><b>{{ c.branch || '–' }}</b></div>
      <div><span>Reason</span><b style="font-weight:500" [attr.title]="c.reason">{{ c.reason || '–' }}</b></div>
    </div>
  </div>

  <div class="grid">
    <!-- the statement -->
    <div>
      <div class="card stmt" *ngIf="s">
        <div class="ch"><h2>Final settlement statement</h2>
          <span class="mut" style="font-size:12px" *ngIf="s.calc_date && s.status === 'draft'">{{ 'Calculated {0}' | t:(s.calc_date | zdate) }}</span></div>
        <div class="alert" *ngFor="let b of blocks"><span class="material-icons" style="font-size:18px">block</span><div>{{ b.label }}<div style="font-weight:400;font-size:12px;margin-top:2px">Approval is blocked until each asset is returned, recovered or written off (Assets, on the right).</div></div></div>

        <div class="sec"><span>Earnings</span><span class="num">{{ s.total_earnings | number:'1.2-2' }}</span></div>
        <div class="ln" *ngFor="let l of earnings">
          <div><div class="lb">{{ l.label }}</div><div class="bs" *ngIf="l.basis">{{ l.basis }}</div>
            <ul class="calc" *ngIf="l.calc?.length"><li *ngFor="let x of l.calc">{{ x }}</li></ul>
            <div class="by" *ngIf="l.manual">{{ 'Added by {0}' | t:l.by }}<ng-container *ngIf="r.edit"> · <button type="button" class="lv-link" (click)="removeLine(l)">Remove</button></ng-container></div></div>
          <div class="am num">{{ l.amount | number:'1.2-2' }}</div>
        </div>
        <div class="ln" *ngIf="!earnings.length"><div class="mut">No earnings.</div><div></div></div>

        <div class="sec ded"><span>Deductions</span><span class="num">{{ s.total_deductions ? '−' : '' }}{{ s.total_deductions | number:'1.2-2' }}</span></div>
        <div class="ln d" *ngFor="let l of deductions">
          <div><div class="lb">{{ l.label }}</div><div class="bs" *ngIf="l.basis">{{ l.basis }}</div>
            <ul class="calc" *ngIf="l.calc?.length"><li *ngFor="let x of l.calc">{{ x }}</li></ul>
            <div class="by" *ngIf="l.manual || (l.section === 'assets' && l.by)">{{ (l.manual ? 'Added by {0}' : 'Decided by {0}') | t:l.by }}<ng-container *ngIf="r.edit && l.manual"> · <button type="button" class="lv-link" (click)="removeLine(l)">Remove</button></ng-container></div></div>
          <div class="am num">−{{ l.amount | number:'1.2-2' }}</div>
        </div>
        <div class="ln" *ngIf="!deductions.length"><div class="mut">No deductions.</div><div></div></div>

        <div class="netbox">
          <div><span>Net payable</span><em>{{ s.net_words }}</em></div>
          <b class="num">AED {{ s.net | number:'1.2-2' }}</b>
        </div>
        <div class="notes" *ngIf="infos.length"><h3 style="margin-bottom:6px">Notes</h3>
          <div *ngFor="let l of infos">{{ l.label }}<span class="mut" *ngIf="l.basis"> – {{ l.basis }}</span></div></div>

        <div class="addl no-print" *ngIf="r.edit">
          <div class="full"><h3 style="align-self:center">Other addition or deduction</h3></div>
          <label class="fl">Type<select class="f" [(ngModel)]="nl.kind" name="nk"><option value="deduction">Deduction</option><option value="earning">Addition</option></select></label>
          <label class="fl">Description<input class="f" [(ngModel)]="nl.label" name="nlb" placeholder="For example: traffic fine"></label>
          <label class="fl">Amount (AED)<input class="f num" type="number" min="0" step="0.01" [(ngModel)]="nl.amount" name="nam"></label>
          <div class="full"><input class="f" [(ngModel)]="nl.note" name="nnt" placeholder="Note (shown on the statement)">
            <button type="button" class="lv-btn primary" [disabled]="busy || !nl.label || !(nl.amount > 0)" (click)="addLine()">Add line</button></div>
        </div>
      </div>

      <div class="card nocalc" *ngIf="!s">
        <span class="material-icons" style="font-size:42px;color:#c4c7d6">calculate</span>
        <h2>End of service not calculated yet</h2>
        <p>Calculate the end of service: salary to the last working day, gratuity, unused leave, notice, air ticket, loans, advances and assets – each with its basis.</p>
        <button type="button" class="lv-btn primary" *ngIf="r.calculate" [disabled]="busy" (click)="calculate()"><span class="material-icons">calculate</span>Calculate the settlement</button>
      </div>
    </div>

    <!-- actions, assets, history -->
    <div class="side">
      <div class="card no-print" *ngIf="s && !mine">
        <div class="ch"><h2>Next step</h2></div>
        <div class="cb act">
          <ng-container *ngIf="s.status === 'draft'">
            <ng-container *ngIf="r.edit">
              <label style="display:flex;gap:8px;align-items:center;font-size:13px" *ngIf="hasNoticeShort || s.notice_waived">
                <input type="checkbox" [(ngModel)]="s.notice_waived" (ngModelChange)="act('recalculate')" name="nw"> Waive the notice not served</label>
              <button type="button" class="lv-btn" [disabled]="busy" (click)="act('recalculate')"><span class="material-icons">refresh</span>Calculate again</button>
              <button type="button" class="lv-btn primary" [disabled]="busy || blocks.length > 0" (click)="act('submit')"><span class="material-icons">send</span>Submit to Finance</button>
            </ng-container>
            <div class="wait" *ngIf="!r.edit">Waiting for HR to check and submit the settlement.</div>
          </ng-container>
          <ng-container *ngIf="s.status === 'submitted'">
            <button type="button" class="lv-btn primary" *ngIf="r.validate" [disabled]="busy" (click)="act('validate')"><span class="material-icons">fact_check</span>Checked – send for approval</button>
            <div class="wait" *ngIf="!r.validate">Waiting for Finance to check the settlement.</div>
          </ng-container>
          <ng-container *ngIf="s.status === 'validated'">
            <button type="button" class="lv-btn primary" *ngIf="r.approve" [disabled]="busy" (click)="act('approve')"><span class="material-icons">verified</span>Approve</button>
            <div class="wait" *ngIf="!r.approve">Waiting for the approval.</div>
          </ng-container>
          <ng-container *ngIf="s.status === 'approved'">
            <ng-container *ngIf="r.pay">
              <div class="row2"><label class="fl">Payment date<input class="f" type="date" [(ngModel)]="paidOn" name="po"></label>
                <label class="fl">Reference<input class="f" [(ngModel)]="payRef" name="pr" placeholder="Bank / WPS reference"></label></div>
              <button type="button" class="lv-btn ok" [disabled]="busy || !payRef" (click)="act('pay')"><span class="material-icons">payments</span>Mark as paid</button>
            </ng-container>
            <div class="wait" *ngIf="!r.pay">Approved – waiting for Finance to pay.</div>
          </ng-container>
          <div class="paid" *ngIf="s.status === 'paid'">{{ 'Paid on {0}, reference {1}' | t:(s.paid_on | zdate):s.payment_ref }}</div>
          <ng-container *ngIf="r.reject">
            <textarea class="f" rows="2" [(ngModel)]="reason" name="rj" placeholder="Reason for sending it back to HR"></textarea>
            <button type="button" class="lv-btn danger" [disabled]="busy || !reason" (click)="act('reject')"><span class="material-icons">undo</span>Send back to HR</button>
          </ng-container>
        </div>
      </div>

      <div class="card">
        <div class="ch"><h2>Company assets</h2><span class="chip" *ngIf="c.assets?.length" [class.ok]="!openAssets" [class.bad]="openAssets > 0">{{ openAssets ? ('{0} not returned' | t:openAssets) : (decidedAssets ? ('Cleared' | t) : ('All returned' | t)) }}</span></div>
        <div class="ast" *ngFor="let a of c.assets">
          <div class="top"><div><div class="nm">{{ a.name }}</div><div class="sub">{{ a.code }}<ng-container *ngIf="a.since"> · {{ 'since {0}' | t:(a.since | zdate) }}</ng-container></div></div>
            <span class="chip" [class.ok]="a.state === 'returned'" [class.bad]="a.state !== 'returned' && !a.decision" [class.warn]="a.state !== 'returned' && a.decision">
              {{ a.state === 'returned' ? ('Returned {0}' | t:(a.returned_on | zdate)) : (a.state === 'lost' ? ('Lost' | t) : ('Not returned' | t)) }}</span></div>
          <div class="dec" *ngIf="a.decision">
            <ng-container *ngIf="a.decision === 'recover'"><b>{{ 'Recover AED {0}' | t:(a.amount | number:'1.2-2') }}</b></ng-container>
            <ng-container *ngIf="a.decision === 'waive'"><b>Written off</b></ng-container>
            <ng-container *ngIf="a.decision === 'returned'"><b>Returned</b></ng-container>
            <span *ngIf="a.note"> – {{ a.note }}</span><div class="mut" *ngIf="a.by">{{ 'Decided by {0}' | t:a.by }}</div>
            <button type="button" class="lv-link no-print" *ngIf="r.edit" (click)="decide(a, 'clear')">Change</button></div>
          <ng-container *ngIf="r.edit && a.state === 'not_returned' && !a.decision">
            <div class="btns no-print" *ngIf="af?.key !== a.key">
              <button type="button" class="lv-btn sm" (click)="decide(a, 'returned')"><span class="material-icons">assignment_return</span>Returned</button>
              <button type="button" class="lv-btn sm" (click)="af = { key: a.key, decision: 'recover', amount: null, note: '' }">Recover</button>
              <button type="button" class="lv-btn sm" (click)="af = { key: a.key, decision: 'waive', note: '' }">Write off</button></div>
            <div class="frm no-print" *ngIf="af?.key === a.key">
              <input class="f num" type="number" min="0" step="0.01" *ngIf="af.decision === 'recover'" [(ngModel)]="af.amount" name="aa" placeholder="Amount">
              <input class="f" [(ngModel)]="af.note" name="an" [style.grid-column]="af.decision === 'recover' ? 'auto' : '1 / -1'" [placeholder]="af.decision === 'recover' ? ('Basis, e.g. replacement cost' | t) : ('Reason for writing it off' | t)">
              <div style="grid-column:1 / -1;display:flex;gap:6px;justify-content:flex-end">
                <button type="button" class="lv-btn sm" (click)="af = null">Cancel</button>
                <button type="button" class="lv-btn sm primary" [disabled]="busy || (af.decision === 'recover' ? !(af.amount > 0) : !af.note)" (click)="decide(a, af.decision, af)">Save</button></div>
            </div>
          </ng-container>
        </div>
        <div class="ast mut" *ngIf="!c.assets?.length">No company assets with this employee.</div>
      </div>

      <div class="card" *ngIf="s && !mine">
        <div class="ch"><h2>History</h2></div>
        <ul class="tl"><li *ngFor="let h of history" [class.ret]="h.action === 'return'">
          <div class="a">{{ h.label }}</div><div class="w">{{ h.by }}<ng-container *ngIf="h.at"> · <span class="num">{{ h.at | zdate:'datetime' }}</span></ng-container></div>
          <div class="n" *ngIf="h.note">{{ h.note }}</div></li></ul>
      </div>
    </div>
  </div>
  <iframe #pf class="no-print" style="position:absolute;width:0;height:0;border:0;visibility:hidden" title="print"></iframe>
</div>
<div class="lv" *ngIf="!c && !loading"><div class="card empty"><span class="material-icons">info</span>{{ msg || ('Not found.' | t) }}</div></div>`,
})
export class LeaverCaseComponent implements OnInit {
  c: any = null; s: any = null; r: any = {}; loading = true; busy = false; mine = false; rtl = false;
  earnings: any[] = []; deductions: any[] = []; infos: any[] = []; blocks: any[] = []; history: any[] = []; stepRows: any[] = [];
  openAssets = 0; decidedAssets = 0; hasNoticeShort = false; msg = ''; msgErr = false; reason = ''; payRef = ''; paidOn = new Date().toISOString().slice(0, 10);
  nl: any = { kind: 'deduction', label: '', amount: null, note: '' }; af: any = null; id = 0;
  constructor(private http: HttpClient, private rec: ZRecordService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}
  private url(p: string): string { return `${this.rec.api}/payroll-plus/api/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  media(p: string): string { return /^https?:/.test(p) ? p : this.rec.api + p; }
  private err(e: any): string {
    const d = e?.error;
    if (d && typeof d === 'object' && typeof d.detail === 'string') { return d.detail + (d.errors ? ' ' + Object.values(d.errors).filter(x => typeof x === 'string').join(' ') : ''); }
    const t = httpErrorText(e);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : i18nT('It could not be done.');
  }
  private say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.detectChanges(); }
  ngOnInit(): void {
    this.rtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
    this.mine = !!this.route.snapshot.data?.['mine'];
    this.route.paramMap.subscribe(p => { this.id = +(p.get('id') || 0); this.load(); });
  }
  back(): void { this.router.navigate(['/main-sidebar/sub-sidebar/leavers']); }
  async load(): Promise<void> {
    this.loading = true;
    try { this.set(await firstValueFrom(this.http.get<any>(this.url(this.mine ? 'leavers/mine/' : `leavers/${this.id}/`)))); }
    catch (e: any) { this.c = null; this.say(this.err(e), true); }
    this.loading = false; this.cd.detectChanges();
  }
  private set(c: any): void {
    this.c = c; this.s = c.settlement; this.r = c.rights || {};
    const ls: any[] = this.s?.lines || [];
    this.earnings = ls.filter(l => l.kind === 'earning');
    this.deductions = ls.filter(l => l.kind === 'deduction');
    this.infos = ls.filter(l => l.kind === 'info');
    this.blocks = ls.filter(l => l.kind === 'block');
    this.hasNoticeShort = ls.some(l => l.key === 'notice_short');
    this.history = this.s?.history || [];
    this.openAssets = (c.assets || []).filter((a: any) => a.state === 'not_returned' && !a.decision).length;
    this.decidedAssets = (c.assets || []).filter((a: any) => a.state === 'not_returned' && a.decision).length;
    const last = (acts: string[]) => { const h = [...this.history].reverse().find(x => acts.includes(x.action)); return h ? { by: h.by, at: h.at } : {}; };
    this.stepRows = [
      { label: c.step_label_1 || (c.steps || [])[0], by: '', at: c.notice_date && c.exit_type !== 'resignation' ? c.notice_date : null },
      { label: (c.steps || [])[1], ...(this.s ? last(['submit', 'calculated']) : {}) },
      { label: (c.steps || [])[2], ...(c.steps_done >= 3 ? last(['validate']) : {}) },
      { label: (c.steps || [])[3], ...(c.steps_done >= 4 ? last(['approve']) : {}) },
      { label: (c.steps || [])[4], ...(c.steps_done >= 5 ? last(['pay']) : {}) },
    ];
    if (c.exit_type === 'resignation') { this.stepRows[0].at = null; }
  }
  async calculate(): Promise<void> {
    this.busy = true;
    try { this.set(await firstValueFrom(this.http.post<any>(this.url(`leavers/${this.c.id}/calculate/`), {}))); this.say(i18nT('Settlement calculated – check each line, then submit it to Finance.')); }
    catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async act(action: string): Promise<void> {
    const body: any = {};
    if (action === 'recalculate') { body.notice_waived = this.s.notice_waived; }
    if (action === 'pay') { body.payment_ref = this.payRef; body.paid_on = this.paidOn; }
    if (action === 'reject') { body.reason = this.reason; body.note = this.reason; }
    if (action === 'submit' && !confirm(i18nT('Submit this settlement to Finance? It cannot be changed until it is sent back.'))) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.post<any>(this.url(`settlements/${this.s.id}/${action}/`), body));
      const done: Record<string, string> = { recalculate: 'Calculated again from the current records.', submit: 'Submitted – Finance checks it next.',
        validate: 'Checked – waiting for the approval.', approve: 'Approved – Finance can pay it.', pay: 'Payment recorded. The end of service is closed.', reject: 'Sent back to HR.' };
      this.reason = ''; this.payRef = '';
      await this.load();
      this.say(i18nT(done[action] || 'Done.'));
    } catch (e: any) { this.say(this.err(e), true); await this.load(); }
    this.busy = false; this.cd.detectChanges();
  }
  async addLine(): Promise<void> {
    this.busy = true;
    try {
      await firstValueFrom(this.http.post<any>(this.url(`settlements/${this.s.id}/lines/`), this.nl));
      this.nl = { kind: 'deduction', label: '', amount: null, note: '' };
      await this.load(); this.say(i18nT('Line added.'));
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async removeLine(l: any): Promise<void> {
    const id = String(l.key || '').replace('other_', '');
    if (!confirm(i18nT('Remove this line?'))) { return; }
    this.busy = true;
    try { await firstValueFrom(this.http.delete<any>(this.url(`settlements/${this.s.id}/lines/${id}/`))); await this.load(); this.say(i18nT('Line removed.')); }
    catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async decide(a: any, decision: string, f: any = null): Promise<void> {
    if (!this.s) { this.say(i18nT('Calculate the settlement first.'), true); return; }
    if (decision === 'returned' && !confirm(i18nT('Record that {0} was returned?', [a.name]))) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.post<any>(this.url(`settlements/${this.s.id}/assets/`), { key: a.key, decision, amount: f?.amount, note: f?.note || '' }));
      this.af = null; await this.load(); this.say(i18nT('Asset decision saved.'));
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async pdf(print: boolean): Promise<void> {
    this.busy = true; this.cd.detectChanges();
    try {
      const path = this.mine ? 'leavers/mine/pdf/' : `settlements/${this.s.id}/pdf/`;
      const blob = await firstValueFrom(this.http.get(this.url(path), { responseType: 'blob' }));
      const u = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      if (print) {
        const fr = document.querySelector('iframe[title="print"]') as HTMLIFrameElement | null;
        if (fr) { fr.onload = () => { try { fr.contentWindow?.focus(); fr.contentWindow?.print(); } catch { window.open(u, '_blank'); } }; fr.src = u; }
        else { window.open(u, '_blank'); }
      } else {
        const a = document.createElement('a');
        a.href = u; a.download = `${i18nT('Final settlement')} ${this.s.number || this.c.employee_code} ${this.c.employee}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
      }
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
}
