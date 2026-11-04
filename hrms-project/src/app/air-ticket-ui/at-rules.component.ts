// v1.66.0 (items 118–123, decision 261): new screen – Air tickets › Setup › Air ticket settings
/**
 * The air ticket rules that were missing after the air ticket audit, each a company or a policy setting that starts at today's rule:
 * provision posted to accounts (118), probation / rule types / class / "next payroll" applied (119), family tickets, fare table,
 * partial use (120), monthly accrual, lapse, carry-forward at exit, ticket-only policy (121, 261), request checks (122), policy overlap
 * and category change (123). Tabs: Company rules · Policy rules · Fares · Check an employee · Provision report · Family travel.
 * API: payroll-plus/api/air-tickets/rules/… (PayrollPlus/air_rules_views.py).
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zConfirm } from '../shared-ui/z-confirm';
import { TPipe, i18nT } from '../shared-ui/i18n.service';
import { cpMoney } from '../shared-ui/country-pack.service';
import { LV_STYLES } from '../leavers/leavers.styles';

interface Opt { v: string; label: string; hint: string; }
type Tab = 'company' | 'policy' | 'fares' | 'check' | 'provision' | 'travel';

@Component({
  selector: 'app-at-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [LV_STYLES + `
.lv .tabs{display:flex;gap:4px;flex-wrap:wrap;margin-top:16px;border-bottom:1px solid var(--line)}
.lv .tabs button{border:0;background:none;padding:10px 14px;font-weight:600;font-size:13px;color:var(--mut);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.lv .tabs button.on{color:var(--acc);border-bottom-color:var(--acc)}
.lv .es-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:16px;margin-top:16px;align-items:start}
.lv .es-card .ch{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line)}
.lv .es-card .ch .material-icons{color:var(--acc);font-size:20px}
.lv .es-card .ch .sp{flex:1}
.lv .es-card .cb{padding:6px 18px 16px}
.lv .es-q{padding:12px 0;border-bottom:1px solid #f0f1f5}
.lv .es-q:last-child{border-bottom:0}
.lv .es-q > b{display:block;color:var(--ink);font-size:13px;margin-bottom:8px}
.lv .es-q > p{margin:-4px 0 8px;color:var(--mut);font-size:12px;line-height:1.45}
.lv .seg{display:flex;flex-wrap:wrap;gap:8px}
.lv .seg label{flex:1 1 180px;display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:9px 11px;cursor:pointer;background:#fff}
.lv .seg label.on{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc) inset;background:#fbfbff}
.lv .seg input{margin-top:2px;accent-color:var(--acc)}
.lv .seg span{display:flex;flex-direction:column;gap:2px;font-size:13px;font-weight:600;color:var(--ink)}
.lv .seg small{font-weight:400;color:var(--mut);font-size:11.5px;line-height:1.35}
.lv .seg .dflt{font-size:10.5px;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.3px;font-style:normal}
.lv .sw{display:flex;gap:9px;align-items:flex-start;font-size:13px;padding:6px 0;cursor:pointer}
.lv .sw input{margin-top:3px;accent-color:var(--acc)}
.lv .sw small{display:block;color:var(--mut);font-size:11.5px}
.lv .es-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
.lv .es-bar{position:sticky;bottom:0;z-index:5;display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:16px;padding:12px 18px;background:#fff;
  border:1px solid var(--line);border-radius:14px;box-shadow:0 -4px 16px rgba(27,22,64,.06);flex-wrap:wrap}
.lv .es-bar .sp{flex:1;color:var(--mut);font-size:12px}
.lv .es-note{margin-top:16px;padding:12px 16px;border-radius:12px;background:var(--infobg);color:var(--info);font-size:12.5px;line-height:1.5;display:flex;gap:10px}
.lv .es-note.warn{background:var(--warnbg);color:var(--warn)}
.lv .pol-pick{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.lv .pol-pick button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 13px;font-size:12.5px;cursor:pointer;color:var(--ink2)}
.lv .pol-pick button.on{border-color:var(--acc);background:var(--acc2);color:var(--acc);font-weight:600}
.lv .kv{display:grid;grid-template-columns:minmax(140px,auto) 1fr;gap:6px 16px;font-size:13px}
.lv .kv dt{color:var(--mut)}
.lv .kv dd{margin:0;color:var(--ink)}
.lv ul.ln{margin:6px 0 0;padding-inline-start:18px;color:var(--ink2);font-size:12.5px;line-height:1.6}
.lv .tblw{overflow-x:auto}
.lv table.lt tbody tr{cursor:default}
@media (max-width:640px){.lv{padding:14px 16px 30px}.lv .lv-head{flex-direction:column}}
`],
  template: `
<div class="lv" *ngIf="d" data-at-rules>
  <div class="card lv-head">
    <div>
      <h1>{{ 'Air ticket settings' | t }}</h1>
      <p>{{ 'The rules of the air ticket policies: accounting provision, probation, ticket types and class, family tickets and fares, monthly accrual, lapse and exit, request checks and overlapping policies. Every rule starts at today’s behaviour.' | t }}</p>
    </div>
    <a class="lv-btn" routerLink="/main-sidebar/air-ticket-options/air-ticket-policy"><span class="material-icons">policy</span>{{ 'Policies' | t }}</a>
  </div>
  <p class="msg" *ngIf="msg" [class.err]="bad" role="status" data-msg>{{ msg }}</p>

  <div class="tabs" role="tablist">
    <button type="button" *ngFor="let x of tabs" [class.on]="tab === x.v" (click)="go(x.v)" [attr.data-tab]="x.v" role="tab">{{ x.label | t }}</button>
  </div>

  <!-- ================= company rules ================= -->
  <ng-container *ngIf="tab === 'company'">
    <div class="es-note warn" *ngIf="d.overlaps?.length" data-overlaps><span class="material-icons" style="font-size:18px">warning</span>
      <div><b>{{ 'Policies that apply to the same employees' | t }}</b>
        <div *ngFor="let o of d.overlaps">{{ '“{0}” and “{1}” – the most specific is “{2}”.' | t:o.a_name:o.b_name:o.winner_name }}</div></div></div>
    <div class="es-grid">
      <div class="card es-card">
        <div class="ch"><span class="material-icons">account_balance</span><h2>{{ 'Provision and accounting' | t }}</h2></div>
        <div class="cb">
          <label class="sw"><input type="checkbox" [(ngModel)]="s.post_provision" name="pp" [disabled]="!d.can_edit" data-k="post_provision">
            <span>{{ 'Post the air ticket provision to accounts' | t }}<small>{{ 'The month-end provisions journal carries Dr air ticket expense, Cr air ticket provision per employee. A cash payout paid by payroll and the air ticket of a final settlement are taken from the provision first; the rest is expense. Off (default): the air ticket is shown on the Provisions page but not posted.' | t }}</small></span></label>
          <div class="es-row" style="margin-top:8px">
            <label class="fl">{{ 'Air ticket expense account' | t }}<input class="f num" [(ngModel)]="s.expense_account" name="ea" maxlength="40" [disabled]="!d.can_edit" style="width:150px"></label>
            <label class="fl">{{ 'Air ticket provision account' | t }}<input class="f num" [(ngModel)]="s.provision_account" name="pa" maxlength="40" [disabled]="!d.can_edit" style="width:150px"></label>
          </div>
          <p class="mut" style="font-size:12px;margin:8px 0 0">{{ 'A mapping “Air ticket (expense / provision)” in Accounting › Account mapping wins over these accounts.' | t }}</p>
        </div>
      </div>

      <div class="card es-card">
        <div class="ch"><span class="material-icons">rule</span><h2>{{ 'Rules shown on the policy screen' | t }}</h2></div>
        <div class="cb">
          <div class="es-q" *ngFor="let q of policyQs"><b>{{ q.title | t }}</b>
            <div class="seg"><label *ngFor="let o of q.opts" [class.on]="s[q.k] === o.v">
              <input type="radio" [name]="q.k" [value]="o.v" [(ngModel)]="s[q.k]" [disabled]="!d.can_edit" [attr.data-opt]="q.k + ':' + o.v">
              <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults[q.k] === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        </div>
      </div>

      <div class="card es-card">
        <div class="ch"><span class="material-icons">fact_check</span><h2>{{ 'Request checks' | t }}</h2></div>
        <div class="cb">
          <label class="sw"><input type="checkbox" [(ngModel)]="s.check_duplicate_cycle" name="cd" [disabled]="!d.can_edit" data-k="check_duplicate_cycle">
            <span>{{ 'Refuse a second request for the same cycle' | t }}<small>{{ 'Another request of the same policy whose allocation falls in the same cycle (every N years) is refused.' | t }}</small></span></label>
          <label class="sw"><input type="checkbox" [(ngModel)]="s.check_leavers" name="cl" [disabled]="!d.can_edit" data-k="check_leavers">
            <span>{{ 'Refuse requests of leavers' | t }}<small>{{ 'After an approved resignation or termination (any last working day) or when the employee has left – the air ticket is settled in the final settlement.' | t }}</small></span></label>
          <label class="sw"><input type="checkbox" [(ngModel)]="s.check_type" name="ct" [disabled]="!d.can_edit" data-k="check_type">
            <span>{{ 'Ticket or cash as the policy allows' | t }}<small>{{ 'A cash-only policy refuses a ticket request; a ticket-only policy refuses a cash request (unless the policy accepts cash).' | t }}</small></span></label>
        </div>
      </div>

      <div class="card es-card">
        <div class="ch"><span class="material-icons">call_split</span><h2>{{ 'Overlapping policies and category change' | t }}</h2></div>
        <div class="cb">
          <div class="es-q" *ngFor="let q of overlapQs"><b>{{ q.title | t }}</b>
            <div class="seg"><label *ngFor="let o of q.opts" [class.on]="s[q.k] === o.v">
              <input type="radio" [name]="q.k" [value]="o.v" [(ngModel)]="s[q.k]" [disabled]="!d.can_edit" [attr.data-opt]="q.k + ':' + o.v">
              <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults[q.k] === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        </div>
      </div>
    </div>
    <div class="es-bar" *ngIf="d.can_edit">
      <button type="button" class="lv-btn" (click)="resetCompany()" [disabled]="busy">{{ 'Back to the defaults' | t }}</button>
      <button type="button" class="lv-btn primary" (click)="saveCompany()" [disabled]="busy" data-save-company><span class="material-icons">save</span>{{ 'Save' | t }}</button>
    </div>
  </ng-container>

  <!-- ================= policy rules ================= -->
  <ng-container *ngIf="tab === 'policy'">
    <div class="pol-pick">
      <button type="button" *ngFor="let p of d.policies" [class.on]="pol?.id === p.id" (click)="pick(p)" [attr.data-pol]="p.id">{{ p.name }}<span *ngIf="!p.is_active" class="mut"> · {{ 'inactive' | t }}</span></button>
    </div>
    <div class="empty card" *ngIf="!d.policies.length" style="margin-top:16px"><span class="material-icons">policy</span>{{ 'No air ticket policy yet.' | t }}</div>
    <div class="es-grid" *ngIf="pol">
      <div class="card es-card">
        <div class="ch"><span class="material-icons">sell</span><h2>{{ 'Ticket value' | t }}</h2></div>
        <div class="cb">
          <dl class="kv" style="margin:8px 0 4px"><dt>{{ 'Country' | t }}</dt><dd>{{ pol.country }}</dd><dt>{{ 'Policy amount' | t }}</dt><dd class="num">{{ money(pol.amount) }}</dd>
            <dt>{{ 'Class' | t }}</dt><dd>{{ cls(pol.travel_class) | t }}</dd><dt>{{ 'Ticket or cash' | t }}</dt><dd>{{ kind(pol.allowance_type) | t }}</dd></dl>
          <div class="es-q"><b>{{ 'The value comes from' | t }}</b>
            <div class="seg"><label *ngFor="let o of fareSource" [class.on]="pr.fare_source === o.v">
              <input type="radio" name="fs" [value]="o.v" [(ngModel)]="pr.fare_source" [disabled]="!d.can_edit" [attr.data-opt]="'fare_source:' + o.v">
              <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.policy_defaults.fare_source === o.v">{{ 'Default' | t }}</em></span></label></div></div>
          <div class="es-q" *ngIf="pr.fare_source === 'fares'">
            <div class="es-row"><label class="fl">{{ 'Route in the fare table' | t }}<input class="f" [(ngModel)]="pr.route" name="rt" maxlength="40" [placeholder]="'empty = the policy country' | t" [disabled]="!d.can_edit" style="width:220px"></label></div></div>
          <div class="es-q"><b>{{ 'One-way ticket' | t }}</b><p>{{ 'Used when “Rule types” is applied and the rule the employee meets is a one-way ticket.' | t }}</p>
            <div class="es-row"><label class="fl">{{ '% of the return fare' | t }}<input class="f num" type="number" min="1" max="100" [(ngModel)]="pr.one_way_percent" name="ow" [disabled]="!d.can_edit" style="width:120px"></label></div></div>
        </div>
      </div>

      <div class="card es-card">
        <div class="ch"><span class="material-icons">family_restroom</span><h2>{{ 'Family tickets' | t }}</h2></div>
        <div class="cb">
          <label class="sw"><input type="checkbox" [(ngModel)]="pr.family" name="fam" [disabled]="!d.can_edit" data-k="family">
            <span>{{ 'Tickets for the family too' | t }}<small>{{ 'From the employee’s family records: the spouse and the children within the limits below.' | t }}</small></span></label>
          <ng-container *ngIf="pr.family">
            <label class="sw"><input type="checkbox" [(ngModel)]="pr.spouse" name="sp" [disabled]="!d.can_edit"><span>{{ 'The spouse' | t }}</span></label>
            <div class="es-row" style="margin:6px 0 8px">
              <label class="fl">{{ 'Children (at most)' | t }}<input class="f num" type="number" min="0" max="12" [(ngModel)]="pr.max_children" name="mc" [disabled]="!d.can_edit" style="width:110px"></label>
              <label class="fl">{{ 'Younger than (age)' | t }}<input class="f num" type="number" min="0" max="30" [(ngModel)]="pr.child_max_age" name="ca" [disabled]="!d.can_edit" style="width:110px"></label>
              <label class="fl">{{ 'Child fare under (age)' | t }}<input class="f num" type="number" min="0" max="30" [(ngModel)]="pr.child_fare_age" name="cf" [disabled]="!d.can_edit" style="width:110px"></label>
            </div>
            <label class="sw"><input type="checkbox" [(ngModel)]="pr.partial_use" name="pu" [disabled]="!d.can_edit" data-k="partial_use">
              <span>{{ 'Partial use' | t }}<small>{{ 'Some of the family may travel; the fares of the others stay on the allocation (Family travel tab).' | t }}</small></span></label>
          </ng-container>
        </div>
      </div>

      <div class="card es-card">
        <div class="ch"><span class="material-icons">event_repeat</span><h2>{{ 'Accrual and lapse' | t }}</h2></div>
        <div class="cb">
          <div class="es-q"><b>{{ 'Accrual' | t }}</b>
            <div class="seg"><label *ngFor="let o of accrual" [class.on]="pr.accrual === o.v">
              <input type="radio" name="ac" [value]="o.v" [(ngModel)]="pr.accrual" [disabled]="!d.can_edit" [attr.data-opt]="'accrual:' + o.v">
              <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.policy_defaults.accrual === o.v">{{ 'Default' | t }}</em></span></label></div></div>
          <div class="es-q"><b>{{ 'An unused entitlement' | t }}</b>
            <div class="seg"><label *ngFor="let o of unused" [class.on]="pr.unused === o.v">
              <input type="radio" name="un" [value]="o.v" [(ngModel)]="pr.unused" [disabled]="!d.can_edit" [attr.data-opt]="'unused:' + o.v">
              <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.policy_defaults.unused === o.v">{{ 'Default' | t }}</em></span></label></div>
            <div class="es-row" *ngIf="pr.unused === 'lapse'" style="margin-top:8px"><label class="fl">{{ 'Lapses after (months)' | t }}<input class="f num" type="number" min="0" max="120" [(ngModel)]="pr.lapse_months" name="lm" [disabled]="!d.can_edit" style="width:120px"></label>
              <span class="mut" style="font-size:12px;flex:1 1 200px">{{ '0 = when the next cycle starts.' | t }}</span></div></div>
        </div>
      </div>

      <div class="card es-card">
        <div class="ch"><span class="material-icons">logout</span><h2>{{ 'At exit and ticket-only policies' | t }}</h2></div>
        <div class="cb">
          <label class="sw"><input type="checkbox" [(ngModel)]="pr.exit_carry_forward" name="ecf" [disabled]="!d.can_edit" data-k="exit_carry_forward">
            <span>{{ 'Pay every unused earlier cycle at exit (carry forward)' | t }}<small>{{ 'Off (default): one open entitlement of the policy is paid – the latest.' | t }}</small></span></label>
          <label class="sw"><input type="checkbox" [(ngModel)]="pr.ticket_only_cash_at_exit" name="toc" [disabled]="!d.can_edit">
            <span>{{ 'A ticket-only policy is paid in cash at exit' | t }}<small>{{ 'On (default, as today). Off: the unused ticket is shown on the settlement, not paid.' | t }}</small></span></label>
          <label class="sw"><input type="checkbox" [(ngModel)]="pr.ticket_only_accepts_cash" name="toa" [disabled]="!d.can_edit">
            <span>{{ 'A ticket-only policy accepts a cash request' | t }}<small>{{ 'Only matters when “Ticket or cash as the policy allows” is on.' | t }}</small></span></label>
          <div class="es-q" *ngIf="pol.cash_rules?.length"><b>{{ 'Cash rules of the policy' | t }}</b>
            <div *ngFor="let r of pol.cash_rules" class="mut" style="font-size:12.5px">{{ (r.next_payroll ? 'Cash after {0} years – paid in the next payroll' : 'Cash after {0} years – paid outside payroll when “Pay in the next payroll” is applied') | t:r.years }}</div></div>
        </div>
      </div>
    </div>
    <div class="es-bar" *ngIf="pol && d.can_edit">
      <span class="sp">{{ 'Rules of “{0}”' | t:pol.name }}</span>
      <button type="button" class="lv-btn" (click)="resetPolicy()" [disabled]="busy">{{ 'Back to the defaults' | t }}</button>
      <button type="button" class="lv-btn primary" (click)="savePolicy()" [disabled]="busy" data-save-policy><span class="material-icons">save</span>{{ 'Save' | t }}</button>
    </div>
  </ng-container>

  <!-- ================= fares ================= -->
  <ng-container *ngIf="tab === 'fares'">
    <div class="card" style="margin-top:16px">
      <div class="es-card"><div class="ch"><span class="material-icons">airplane_ticket</span><h2>{{ 'Fare table' | t }}</h2><span class="sp"></span>
        <button type="button" class="lv-btn primary sm" *ngIf="d.can_edit" (click)="newFare()" data-new-fare>+ {{ 'New fare' | t }}</button></div></div>
      <p class="mut" style="padding:10px 18px 0;margin:0;font-size:12.5px">{{ 'Return fares by route or destination country and class. A policy that takes its value from the fare table uses the latest fare valid on the day.' | t }}</p>
      <div class="tblw">
      <table class="lt" *ngIf="d.fares.length">
        <thead><tr><th>{{ 'Route / country' | t }}</th><th>{{ 'Class' | t }}</th><th class="end">{{ 'Adult fare' | t }}</th><th class="end">{{ 'Child fare' | t }}</th><th>{{ 'Valid from' | t }}</th><th>{{ 'Note' | t }}</th><th></th></tr></thead>
        <tbody><tr *ngFor="let f of d.fares" [attr.data-fare]="f.id">
          <td>{{ f.route || f.country }}</td><td>{{ cls(f.travel_class) | t }}</td><td class="end num">{{ money(f.adult_fare) }}</td><td class="end num">{{ money(f.child_fare) }}</td>
          <td class="num">{{ dmy(f.valid_from) }}</td><td class="mut">{{ f.note }}</td>
          <td class="end" style="white-space:nowrap"><button type="button" class="lv-link" *ngIf="d.can_edit" (click)="editFare(f)">{{ 'Edit' | t }}</button>
            <button type="button" class="lv-link" *ngIf="d.can_edit" style="color:var(--bad);margin-inline-start:10px" (click)="delFare(f)">{{ 'Delete' | t }}</button></td></tr></tbody>
      </table></div>
      <div class="empty" *ngIf="!d.fares.length"><span class="material-icons">airplane_ticket</span>{{ 'No fares yet.' | t }}</div>
    </div>
  </ng-container>

  <!-- ================= check an employee ================= -->
  <ng-container *ngIf="tab === 'check'">
    <div class="card" style="margin-top:16px;padding:16px 18px">
      <div class="es-row">
        <label class="fl" style="flex:1 1 260px">{{ 'Employee' | t }}<select class="f" [(ngModel)]="chkEmp" name="ce" data-chk-emp>
          <option [ngValue]="null">{{ 'Choose…' | t }}</option><option *ngFor="let e of emps" [ngValue]="e.id">{{ e.code }} – {{ e.name }}</option></select></label>
        <label class="fl">{{ 'On' | t }}<input class="f num" type="date" [(ngModel)]="chkOn" name="co"></label>
        <button type="button" class="lv-btn primary" (click)="check()" [disabled]="!chkEmp || busy" data-chk-go>{{ 'Check' | t }}</button>
      </div>
    </div>
    <div class="es-grid" *ngIf="chk">
      <div class="card es-card">
        <div class="ch"><span class="material-icons">badge</span><h2>{{ chk.code }}</h2></div>
        <div class="cb"><dl class="kv" style="margin-top:10px">
          <dt>{{ 'Joined' | t }}</dt><dd class="num">{{ dmy(chk.joined) }}</dd>
          <dt>{{ 'Probation ends' | t }}</dt><dd class="num">{{ dmy(chk.probation_end) }}</dd>
          <dt>{{ 'Matching policies' | t }}</dt><dd><span *ngFor="let m of chk.matching; let l = last">{{ m.name }}<span *ngIf="!l">, </span></span><span *ngIf="!chk.matching.length">–</span></dd>
          <dt>{{ 'Policy that applies' | t }}</dt><dd><b>{{ chk.policy?.name || '–' }}</b></dd></dl></div>
      </div>
      <div class="card es-card" *ngIf="chk.policy">
        <div class="ch"><span class="material-icons">sell</span><h2>{{ 'Value and accrual' | t }}</h2></div>
        <div class="cb"><dl class="kv" style="margin-top:10px">
          <dt>{{ 'Ticket value' | t }}</dt><dd class="num"><b data-chk-value>{{ money(chk.policy.value) }}</b></dd>
          <dt>{{ 'Running cycle' | t }}</dt><dd class="num">{{ dmy(chk.policy.cycle?.[0]) }} – {{ dmy(chk.policy.cycle?.[1]) }}</dd>
          <dt>{{ 'Accrued so far' | t }}</dt><dd class="num">{{ money(chk.policy.accrued) }}</dd>
          <dt>{{ 'In probation' | t }}</dt><dd>{{ (chk.policy.in_probation ? 'Yes' : 'No') | t }}</dd>
          <dt>{{ 'Next allocation due' | t }}</dt><dd>{{ (chk.policy.allocation_due ? 'Yes' : 'No') | t }}</dd>
          <dt>{{ 'Leaving' | t }}</dt><dd>{{ (chk.policy.left ? 'Yes' : 'No') | t }}</dd></dl>
          <ul class="ln"><li *ngFor="let l of chk.policy.value_lines">{{ l }}</li><li *ngFor="let l of chk.policy.accrued_lines">{{ l }}</li></ul></div>
      </div>
      <div class="card es-card" *ngIf="chk.policy">
        <div class="ch"><span class="material-icons">groups</span><h2>{{ 'Travellers' | t }}</h2></div>
        <table class="lt"><thead><tr><th>{{ 'Name' | t }}</th><th>{{ 'Relation' | t }}</th><th>{{ 'Age' | t }}</th><th>{{ 'Fare' | t }}</th><th class="end">{{ 'Amount' | t }}</th></tr></thead>
          <tbody><tr *ngFor="let t of chk.policy.travellers"><td>{{ t.name }}</td><td>{{ t.relation | t }}</td><td class="num">{{ t.age ?? '–' }}</td><td>{{ (t.fare === 'child' ? 'Child fare' : 'Adult fare') | t }}</td><td class="end num">{{ money(t.amount) }}</td></tr></tbody></table>
      </div>
    </div>
  </ng-container>

  <!-- ================= provision report ================= -->
  <ng-container *ngIf="tab === 'provision'">
    <div class="card" style="margin-top:16px;padding:16px 18px">
      <div class="es-row">
        <label class="fl">{{ 'As of' | t }}<input class="f num" type="date" [(ngModel)]="provOn" name="po"></label>
        <button type="button" class="lv-btn primary" (click)="loadProv()" [disabled]="busy" data-prov-go>{{ 'Show' | t }}</button>
        <span class="chip" [class.ok]="prov?.post_provision" *ngIf="prov">{{ (prov.post_provision ? 'Posted to accounts' : 'Not posted (setting off)') | t }}</span>
      </div>
    </div>
    <div class="card" style="margin-top:12px" *ngIf="prov">
      <div class="tblw">
      <table class="lt" *ngIf="prov.rows.length" data-prov>
        <thead><tr><th>{{ 'Employee' | t }}</th><th>{{ 'Branch' | t }}</th><th>{{ 'Basis' | t }}</th><th class="end">{{ 'Liability' | t }}</th><th class="end">{{ 'Posted' | t }}</th><th class="end">{{ 'To post' | t }}</th></tr></thead>
        <tbody><tr *ngFor="let r of prov.rows"><td>{{ r.code }} – {{ r.name }}</td><td>{{ r.branch }}</td><td class="mut">{{ basis(r.basis) }}</td>
          <td class="end num">{{ money(r.liability) }}</td><td class="end num">{{ money(r.posted) }}</td><td class="end num">{{ money(r.to_post) }}</td></tr>
          <tr style="font-weight:700"><td colspan="3">{{ 'Total' | t }}</td><td class="end num">{{ money(prov.totals.liability) }}</td><td class="end num">{{ money(prov.totals.posted) }}</td><td class="end num">{{ money(prov.totals.to_post) }}</td></tr></tbody>
      </table></div>
      <div class="empty" *ngIf="!prov.rows.length"><span class="material-icons">savings</span>{{ 'No air ticket liability on this day.' | t }}</div>
    </div>
  </ng-container>

  <!-- ================= family travel ================= -->
  <ng-container *ngIf="tab === 'travel'">
    <div class="card" style="margin-top:16px">
      <p class="mut" style="padding:14px 18px 0;margin:0;font-size:12.5px">{{ 'Ticket requests of policies with partial use: record who travels before the approval; on approval their fares are taken off the allocation, the rest stays for the others.' | t }}</p>
      <div class="tblw">
      <table class="lt" *ngIf="trips.length" data-trips>
        <thead><tr><th>{{ 'Request' | t }}</th><th>{{ 'Employee' | t }}</th><th>{{ 'Policy' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'Travellers' | t }}</th><th class="end">{{ 'Left on the allocation' | t }}</th><th></th></tr></thead>
        <tbody><tr *ngFor="let r of trips"><td class="num">{{ r.number }}</td><td>{{ r.code }} – {{ r.employee }}</td><td>{{ r.policy }}</td><td>{{ status(r.status) | t }}</td>
          <td>{{ r.travellers.join(', ') || '–' }}</td><td class="end num">{{ money(r.left) }}</td>
          <td class="end"><button type="button" class="lv-link" *ngIf="d.can_requests && r.status === 'PENDING'" (click)="openTrip(r)">{{ 'Who travels' | t }}</button></td></tr></tbody>
      </table></div>
      <div class="empty" *ngIf="!trips.length"><span class="material-icons">family_restroom</span>{{ 'No ticket request of a policy with partial use.' | t }}</div>
    </div>
  </ng-container>
</div>
<div class="lv" *ngIf="!d && msg"><p class="msg err">{{ msg }}</p></div>

<!-- fare form -->
<div class="lv-dlg-back" *ngIf="fare" (click)="fare = null">
  <div class="lv-dlg lv" style="padding:0;min-height:0;background:#fff" (click)="$event.stopPropagation()" role="dialog" data-fare-form>
    <header><h2>{{ (fare.id ? 'Edit fare' : 'New fare') | t }}</h2><button type="button" class="lv-link" (click)="fare = null">✕</button></header>
    <div class="body">
      <label class="fl">{{ 'Route' | t }}<input class="f" [(ngModel)]="fare.route" name="fr" maxlength="40" placeholder="DXB-COK"><span class="err-t" *ngIf="fe.route">{{ fe.route }}</span></label>
      <label class="fl">{{ 'or destination country' | t }}<select class="f" [(ngModel)]="fare.country_id" name="fc"><option [ngValue]="null">–</option>
        <option *ngFor="let c of countries()" [ngValue]="c.id">{{ c.name }}</option></select></label>
      <label class="fl">{{ 'Class' | t }}<select class="f" [(ngModel)]="fare.travel_class" name="fk"><option value="ECONOMY">{{ 'Economy' | t }}</option><option value="BUSINESS">{{ 'Business' | t }}</option><option value="FIRST">{{ 'First class' | t }}</option></select></label>
      <label class="fl">{{ 'Valid from' | t }}<input class="f num" type="date" [(ngModel)]="fare.valid_from" name="fv"><span class="err-t" *ngIf="fe.valid_from">{{ fe.valid_from }}</span></label>
      <label class="fl">{{ 'Adult fare' | t }}<input class="f num" type="number" min="0" [(ngModel)]="fare.adult_fare" name="fa"><span class="err-t" *ngIf="fe.adult_fare">{{ fe.adult_fare }}</span></label>
      <label class="fl">{{ 'Child fare' | t }}<input class="f num" type="number" min="0" [(ngModel)]="fare.child_fare" name="fch"><span class="err-t" *ngIf="fe.child_fare">{{ fe.child_fare }}</span></label>
      <label class="fl wide">{{ 'Note' | t }}<input class="f" [(ngModel)]="fare.note" name="fn" maxlength="120"></label>
      <p class="msg err wide" *ngIf="fmsg" style="margin:0">{{ fmsg }}</p>
    </div>
    <footer><button type="button" class="lv-btn" (click)="fare = null">{{ 'Cancel' | t }}</button>
      <button type="button" class="lv-btn primary" (click)="saveFare()" [disabled]="busy" data-save-fare>{{ 'Save' | t }}</button></footer>
  </div>
</div>

<!-- who travels -->
<div class="lv-dlg-back" *ngIf="trip" (click)="trip = null">
  <div class="lv-dlg lv" style="padding:0;min-height:0;background:#fff" (click)="$event.stopPropagation()" role="dialog" data-trip-form>
    <header><h2>{{ 'Who travels – {0}' | t:trip.request.number }}</h2><button type="button" class="lv-link" (click)="trip = null">✕</button></header>
    <div class="body">
      <div class="wide mut" style="font-size:12.5px">{{ '{0} · {1} · left on the allocation {2}' | t:trip.request.employee:trip.request.policy:money(trip.request.left) }}</div>
      <label class="sw wide" *ngFor="let t of trip.covered">
        <input type="checkbox" [checked]="tripSel.has(t.key)" (change)="tickTrip(t.key)" [disabled]="trip.travelled.includes(t.key)">
        <span>{{ t.name }} · {{ t.relation | t }}<span *ngIf="t.age !== null"> · {{ t.age }}</span><small>{{ money(t.amount) }}<span *ngIf="trip.travelled.includes(t.key)"> · {{ 'already travelled on this allocation' | t }}</span></small></span></label>
      <p class="msg err wide" *ngIf="fmsg" style="margin:0">{{ fmsg }}</p>
    </div>
    <footer><button type="button" class="lv-btn" (click)="trip = null">{{ 'Cancel' | t }}</button>
      <button type="button" class="lv-btn primary" (click)="saveTrip()" [disabled]="busy || !tripSel.size" data-save-trip>{{ 'Save' | t }}</button></footer>
  </div>
</div>`,
})
export class AtRulesComponent implements OnInit {
  d: any = null; s: any = {}; pol: any = null; pr: any = {}; msg = ''; bad = false; busy = false; tab: Tab = 'company';
  emps: any[] = []; chkEmp: number | null = null; chkOn = new Date().toISOString().slice(0, 10); chk: any = null;
  provOn = new Date().toISOString().slice(0, 10); prov: any = null; trips: any[] = [];
  fare: any = null; fe: any = {}; fmsg = ''; trip: any = null; tripSel = new Set<string>();
  tabs: { v: Tab; label: string }[] = [{ v: 'company', label: 'Company rules' }, { v: 'policy', label: 'Policy rules' }, { v: 'fares', label: 'Fares' },
    { v: 'check', label: 'Check an employee' }, { v: 'provision', label: 'Provision report' }, { v: 'travel', label: 'Family travel' }];
  policyQs: { k: string; title: string; opts: Opt[] }[] = [
    { k: 'probation', title: 'Probation', opts: [{ v: 'ignore', label: 'Not applied', hint: 'As today: allocations and requests during probation' },
      { v: 'enforce', label: 'Applied', hint: 'A policy not “usable during probation” gives no allocation, accrual or request until probation ends' }] },
    { k: 'rule_types', title: 'Rule types (one-way, return, cash after N years)', opts: [{ v: 'ignore', label: 'Not applied', hint: 'As today: the rules only decide the first allocation' },
      { v: 'enforce', label: 'Applied', hint: 'One-way rule = the one-way % of the fare; cash and tickets need the years of their rule' }] },
    { k: 'next_payroll', title: '“Pay in the next payroll” of a cash rule', opts: [{ v: 'ignore', label: 'Not applied', hint: 'As today: payroll pays every approved cash payout' },
      { v: 'enforce', label: 'Applied', hint: 'Without the tick payroll does not pay it; HR records the payment outside payroll' }] },
  ];
  overlapQs: { k: string; title: string; opts: Opt[] }[] = [
    { k: 'overlap', title: 'Two policies for the same employee', opts: [{ v: 'first', label: 'Both apply', hint: 'As today: the job allocates every matching policy; the settlement takes the oldest' },
      { v: 'specific', label: 'The most specific wins', hint: 'The policy with the most limits (department, designation, category, branch); a tie goes to the older one' },
      { v: 'refuse', label: 'Refuse the second policy', hint: 'Saving an active policy that applies to the same employees as another is refused' }] },
    { k: 'category_change', title: 'Category, department or branch change', opts: [{ v: 'off', label: 'Nothing special', hint: 'As today: the new policy gives a full allocation at once' },
      { v: 'split', label: 'Close the old policy pro-rata', hint: 'The earned part of the running cycle is allocated under the old policy; the new policy’s cycle starts on the change day' }] },
  ];
  fareSource: Opt[] = [{ v: 'policy', label: 'The policy amount', hint: 'As today' }, { v: 'fares', label: 'The fare table', hint: 'Fare of the route (or country) and class valid on the day' }];
  accrual: Opt[] = [{ v: 'off', label: 'No accrual', hint: 'As today: the provision is the open allocations' },
    { v: 'monthly', label: 'Monthly', hint: 'The value accrues month by month (unpaid days left out); the provision and the exit pay the accrued part' }];
  unused: Opt[] = [{ v: 'keep', label: 'Stays usable', hint: 'As today' }, { v: 'lapse', label: 'Lapses', hint: 'Expires after the months below' }];

  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private q(): string { return `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  private u(p: string, extra = ''): string { return `${this.rec.api}/payroll-plus/api/air-tickets/rules/${p}?${this.q()}${extra}`; }
  private err(e: any): string {
    const x = e?.error;
    if (x && typeof x === 'object' && typeof x.detail === 'string') { return x.detail + (x.errors ? ' ' + Object.values(x.errors).filter(v => typeof v === 'string').join(' ') : ''); }
    return httpErrorText(e) || i18nT('It could not be done.');
  }
  private say(m: string, bad = false): void { this.msg = m; this.bad = bad; this.cd.detectChanges(); }

  async ngOnInit(): Promise<void> {
    try { this.set(await firstValueFrom(this.http.get<any>(this.u('')))); }
    catch (e: any) { this.say(this.err(e), true); }
    try { const t = localStorage.getItem('atRulesTab') as Tab; if (t && this.tabs.some(x => x.v === t)) { await this.go(t); } } catch { /* storage off */ }
    this.cd.detectChanges();
  }
  private set(d: any): void {
    this.d = d; this.s = JSON.parse(JSON.stringify(d.settings || {}));
    if (this.pol) { const p = d.policies.find((x: any) => x.id === this.pol.id); if (p) { this.pick(p); } }
    else if (d.policies?.length) { this.pick(d.policies[0]); }
  }
  async go(t: Tab): Promise<void> {
    this.tab = t; this.msg = '';
    try { localStorage.setItem('atRulesTab', t); } catch { /* storage off */ }
    if (t === 'check' && !this.emps.length) { try { this.emps = (await firstValueFrom(this.http.get<any>(this.u('check/')))).employees || []; } catch (e: any) { this.say(this.err(e), true); } }
    if (t === 'provision' && !this.prov) { await this.loadProv(); }
    if (t === 'travel') { await this.loadTrips(); }
    this.cd.detectChanges();
  }
  pick(p: any): void { this.pol = p; this.pr = JSON.parse(JSON.stringify(p.rules || {})); }
  money(v: any): string { return v === null || v === undefined || v === '' ? '–' : cpMoney(v, '0.2-2'); }
  dmy(v: any): string { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : '–'; }
  cls(c: string): string { return ({ ECONOMY: 'Economy', BUSINESS: 'Business', FIRST: 'First class' } as any)[c] || c || '–'; }
  kind(c: string): string { return ({ CASH: 'Cash only', TICKET: 'Ticket only', BOTH: 'Ticket or cash' } as any)[c] || c || '–'; }
  status(c: string): string { return ({ PENDING: 'Pending', APPROVED: 'Approved', PROCESSED: 'Processed', REJECTED: 'Rejected' } as any)[c] || c; }
  basis(b: string): string { return String(b || '').split(', ').map(x => x.startsWith('accrued ') ? i18nT('accrued {0}', [x.slice(8)]) : i18nT(x)).join(', '); }
  countries(): any[] { const ids = new Set(this.d?.policy_countries || []); const l = this.d?.countries || []; return [...l.filter((c: any) => ids.has(c.id)), ...l.filter((c: any) => !ids.has(c.id))]; }

  resetCompany(): void { this.s = { ...this.s, ...JSON.parse(JSON.stringify(this.d.defaults || {})) }; this.say(i18nT('Defaults set – save to keep them.')); }
  async saveCompany(): Promise<void> {
    this.busy = true;
    const body: any = {}; Object.keys(this.d.defaults || {}).forEach(k => body[k] = this.s[k]);
    try { this.set(await firstValueFrom(this.http.put<any>(this.u(''), { settings: body }))); this.say(i18nT('Saved. The rules apply from now on; saved settlements and paid payslips do not change.')); }
    catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  resetPolicy(): void { this.pr = { ...this.pr, ...JSON.parse(JSON.stringify(this.d.policy_defaults || {})) }; this.say(i18nT('Defaults set – save to keep them.')); }
  async savePolicy(): Promise<void> {
    this.busy = true;
    const body: any = {}; Object.keys(this.d.policy_defaults || {}).forEach(k => body[k] = this.pr[k]);
    try {
      const r = await firstValueFrom(this.http.put<any>(this.u(`policy/${this.pol.id}/`), body));
      const i = this.d.policies.findIndex((x: any) => x.id === r.policy.id); if (i >= 0) { this.d.policies[i] = r.policy; } this.pick(r.policy);
      this.say(i18nT('Saved. The rules apply from now on; saved settlements and paid payslips do not change.'));
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  newFare(): void { this.fe = {}; this.fmsg = ''; this.fare = { route: '', country_id: this.d.policy_countries?.[0] || null, travel_class: 'ECONOMY', adult_fare: null, child_fare: null, valid_from: new Date().toISOString().slice(0, 10), note: '' }; }
  editFare(f: any): void { this.fe = {}; this.fmsg = ''; this.fare = { ...f }; }
  async saveFare(): Promise<void> {
    this.busy = true; this.fe = {}; this.fmsg = '';
    try {
      const r = await firstValueFrom(this.http.post<any>(this.u('fares/'), this.fare));
      const names: any = {}; (this.d.countries || []).forEach((c: any) => names[c.id] = c.name);
      this.d.fares = (r.fares || []).map((f: any) => ({ ...f, country: names[f.country_id] || '' })); this.fare = null; this.say(i18nT('Fare saved.'));
    } catch (e: any) { this.fe = e?.error?.errors || {}; this.fmsg = e?.error?.detail || this.err(e); }
    this.busy = false; this.cd.detectChanges();
  }
  async delFare(f: any): Promise<void> {
    if (!(await zConfirm(i18nT('Delete the fare {0} from {1}?', [f.route || f.country, this.dmy(f.valid_from)])))) { return; }
    try {
      const r = await firstValueFrom(this.http.delete<any>(this.u(`fares/${f.id}/`)));
      const names: any = {}; (this.d.countries || []).forEach((c: any) => names[c.id] = c.name);
      this.d.fares = (r.fares || []).map((x: any) => ({ ...x, country: names[x.country_id] || '' })); this.say(i18nT('Fare deleted.'));
    } catch (e: any) { this.say(this.err(e), true); }
  }
  async check(): Promise<void> {
    this.busy = true; this.chk = null;
    try { this.chk = await firstValueFrom(this.http.get<any>(this.u('check/', `&employee_id=${this.chkEmp}&on=${this.chkOn}`))); this.msg = ''; }
    catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async loadProv(): Promise<void> {
    this.busy = true;
    try { this.prov = await firstValueFrom(this.http.get<any>(this.u('provision/', `&as_of=${this.provOn}`))); }
    catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async loadTrips(): Promise<void> {
    try { this.trips = (await firstValueFrom(this.http.get<any>(this.u('travel/')))).rows || []; }
    catch (e: any) { this.say(this.err(e), true); }
  }
  async openTrip(r: any): Promise<void> {
    this.fmsg = '';
    try {
      this.trip = await firstValueFrom(this.http.get<any>(this.u('travel/', `&request_id=${r.id}`)));
      this.tripSel = new Set<string>(this.trip.travel?.travellers || []);
    } catch (e: any) { this.say(this.err(e), true); }
    this.cd.detectChanges();
  }
  tickTrip(k: string): void { if (this.tripSel.has(k)) { this.tripSel.delete(k); } else { this.tripSel.add(k); } }
  async saveTrip(): Promise<void> {
    this.busy = true; this.fmsg = '';
    try {
      await firstValueFrom(this.http.post<any>(this.u('travel/'), { request_id: this.trip.request.id, travellers: [...this.tripSel] }));
      this.trip = null; await this.loadTrips(); this.say(i18nT('Travellers saved.'));
    } catch (e: any) { this.fmsg = this.err(e); }
    this.busy = false; this.cd.detectChanges();
  }
}
