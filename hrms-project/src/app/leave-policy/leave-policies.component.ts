import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ZListDirective } from '../shared-ui/z-list.directive';

interface Line { id?: number; leave_type_id: number; leave_type_name?: string; [k: string]: any; }

const BLANK_LINE = {
  days_per_year: 0, accrual: 'monthly', first_year_uae: false, count_days: 'calendar', gender: 'B', min_service_months: 0, after_probation: false,
  notice_days: 0, max_per_request: null, max_per_year: null, max_times_in_service: null, requires_document: false, allow_negative: false,
  pay_slabs: [], carry_forward_max: null, carry_forward_expiry_months: null, excess_action: 'keep', encashable: false, encash_max_per_year: null,
  law_reference: '', notes: '', prorate: 'calendar', prorate_fixed_days: 30, prorate_unpaid: false,
  comp_full_day_hours: null, comp_half_day_hours: null, comp_expiry_days: null,
  service_steps: [], worked_source: 'punch', worked_paid_leave: true,
};

/**
 * v1.10.0 – employee-wise leave policies (e.g. Office staff, Labour) under the UAE Labour Law:
 * what each leave type gives, who may take it and the limits; which categories / employees get the policy;
 * monthly accrual, leave-year end and opening balances.
 */
@Component({
  selector: 'app-leave-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZListDirective],
  styleUrls: ['./leave-policy.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Leave policies</h1>
          <p class="lp-desc">Employee-wise leave rules under the UAE Labour Law (Federal Decree-Law 33/2021). Each employee gets the policy of their category, or one given to them.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn" (click)="openSetup()">Load UAE standard setup</button>
          <button type="button" class="lp-btn" (click)="openRun('accrual')">Monthly accrual</button>
          <button type="button" class="lp-btn" (click)="openRun('year')">Leave year end</button>
          <button type="button" class="lp-btn" (click)="startLedger()" title="Writes an opening line for every balance that has no ledger yet">Start ledger from balances</button>
        </div>
      </div>
      <div class="lp-tabs" role="tablist">
        <button type="button" role="tab" [class.on]="tab === 'policies'" (click)="tab = 'policies'">Policies</button>
        <button type="button" role="tab" [class.on]="tab === 'employees'" (click)="tab = 'employees'; loadOverrides()">Employees</button>
        <button type="button" role="tab" [class.on]="tab === 'approvers'" (click)="tab = 'approvers'; loadApprovers()">Approvers</button>
        <button type="button" role="tab" [class.on]="tab === 'rules'" (click)="tab = 'rules'">UAE rules</button>
      </div>
    </div>

    <div class="com_list mt-4">
      <p class="lp-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>

      <!-- policies -->
      <ng-container *ngIf="tab === 'policies'">
        <div class="lp-cards">
          <button type="button" class="lp-card" *ngFor="let p of policies" [class.on]="edit?.id === p.id" (click)="pick(p)">
            <h3>{{ p.name }} <span class="lp-badge" [class.labour]="p.kind === 'labour'">{{ kindLabel(p.kind) }}</span><span class="lp-badge" *ngIf="p.is_default">Default</span></h3>
            <p>{{ p.employees_count }} employees · {{ p.lines?.length || 0 }} leave types</p>
            <div class="lp-chips"><span class="lp-chip" *ngFor="let c of p.categories">{{ c }}</span><span class="lp-muted" *ngIf="!p.categories?.length">No category</span></div>
          </button>
          <button type="button" class="lp-card" (click)="newPolicy()"><h3>+ New policy</h3><p>Start from an empty policy or copy one.</p></button>
        </div>
        <p class="lp-muted" *ngIf="!policies.length">No policies yet. Press <b>Load UAE standard setup</b> to add the UAE leave types and an Office staff and a Labour policy.</p>

        <ng-container *ngIf="edit">
          <div class="lp-form">
            <label>Name<input [(ngModel)]="edit.name" maxlength="100"></label>
            <label>Code<input [(ngModel)]="edit.code" maxlength="30"></label>
            <label>Kind<select [(ngModel)]="edit.kind"><option value="office">Office staff</option><option value="labour">Labour / site staff</option><option value="other">Other</option></select></label>
            <label>Leave year starts<select [(ngModel)]="edit.leave_year_start"><option *ngFor="let m of months; let i = index" [ngValue]="i + 1">{{ m }}</option></select></label>
            <label class="wide">Description<textarea [(ngModel)]="edit.description"></textarea></label>
            <div class="wide">
              <label style="margin-bottom:6px">Employee categories that get this policy</label>
              <div class="lp-catpick">
                <label *ngFor="let c of categories" [class.on]="hasCat(c.id)" [class.off]="catOwner(c.id)" [title]="catOwner(c.id) ? 'In ' + catOwner(c.id) : ''">
                  <input type="checkbox" [checked]="hasCat(c.id)" [disabled]="!!catOwner(c.id)" (change)="toggleCat(c.id)"> {{ c.ctgry_title }}<small *ngIf="catOwner(c.id)"> ({{ catOwner(c.id) }})</small></label>
              </div>
            </div>
            <label class="wide" style="flex-direction:row;align-items:center;gap:8px;font-weight:400;color:#2b2f42"><input type="checkbox" style="height:auto" [(ngModel)]="edit.is_default"> Default policy for employees whose category has none</label>
          </div>

          <div class="lp-scroll">
            <table zPlain class="lp-lines">
              <thead><tr>
                <th>Leave type</th><th>Days / year</th><th title="More days as service grows, e.g. from service year 3: 26 days">By length of service</th><th>How earned</th><th title="Part month / part year on joining and leaving, or by the days actually worked">Prorate</th><th>Fixed days a month</th><th title="Unpaid leave days in a month reduce what is earned">Unpaid leave reduces</th><th title="Days worked prorate: where the days worked come from, and whether paid leave counts as worked">Days worked from</th><th>First-year rule</th><th>Count</th><th>Gender</th><th>Min. service (months)</th><th>After probation</th>
                <th>Notice (days)</th><th>Max / request</th><th>Max / year</th><th>Times in service</th><th>Document</th><th>Allow negative</th><th title="Pay during the leave, counted from the start of the leave year: days at pay %. UAE sick leave: 15@100, 30@50, 45@0">Pay during leave (days &#64; pay %)</th>
                <th title="Days kept at the leave-year end. Empty: all (monthly leave) / none (yearly leave)">Carry forward max</th><th>Carried days expire after (months)</th><th>Above the limit</th><th>Encashable</th><th>Encash max / year</th><th title="Compensatory off: hours worked on a weekend / holiday for a full day">Comp off: hours for 1 day</th><th>Hours for ½ day</th><th>Comp off expires after (days)</th><th>Law</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let l of edit.lines; let i = index">
                  <td class="name">{{ typeName(l.leave_type_id) }}<small>{{ typePaid(l.leave_type_id) }}</small></td>
                  <td><input type="number" min="0" step="0.5" [(ngModel)]="l.days_per_year" [attr.aria-label]="'Days a year – ' + typeName(l.leave_type_id)"></td>
                  <td><button type="button" class="lp-stepbtn" [class.on]="stepLine === l" (click)="openSteps(l)" [attr.aria-label]="'Days by length of service – ' + typeName(l.leave_type_id)"
                        [disabled]="l.accrual !== 'monthly' && l.accrual !== 'yearly'">{{ stepSummary(l) }}</button></td>
                  <td><select [(ngModel)]="l.accrual" (ngModelChange)="accrualChanged(l)"><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="per_event">Per event</option><option value="none">No balance</option><option value="earned">Earned by work (comp off)</option></select></td>
                  <td><select [(ngModel)]="l.prorate" [attr.aria-label]="'Prorate – ' + typeName(l.leave_type_id)"><option value="none">No prorate</option><option value="calendar">Calendar days</option><option value="fixed">Fixed days</option><option value="worked" [disabled]="l.accrual !== 'monthly'">Days worked</option></select></td>
                  <td><input type="number" min="1" max="31" [(ngModel)]="l.prorate_fixed_days" [disabled]="l.prorate !== 'fixed'" style="width:64px"></td>
                  <td><input type="checkbox" [(ngModel)]="l.prorate_unpaid" [disabled]="l.prorate === 'none' || l.prorate === 'worked'" [title]="l.prorate === 'worked' ? 'Unpaid days are not worked, so they already reduce what is earned' : ''"></td>
                  <td><select [(ngModel)]="l.worked_source" [disabled]="l.prorate !== 'worked'" [attr.aria-label]="'Days worked from – ' + typeName(l.leave_type_id)"><option value="punch">Check-ins</option><option value="calendar">Attendance calendar</option></select>
                    <label class="lp-inline"><input type="checkbox" [(ngModel)]="l.worked_paid_leave" [disabled]="l.prorate !== 'worked'"> paid leave counts</label></td>
                  <td><input type="checkbox" [(ngModel)]="l.first_year_uae" title="Nothing in the first 6 months, then 2 days a month until 1 year"></td>
                  <td><select [(ngModel)]="l.count_days"><option value="calendar">Calendar</option><option value="working">Working</option></select></td>
                  <td><select [(ngModel)]="l.gender"><option value="B">Both</option><option value="F">Female</option><option value="M">Male</option></select></td>
                  <td><input type="number" min="0" [(ngModel)]="l.min_service_months"></td>
                  <td><input type="checkbox" [(ngModel)]="l.after_probation"></td>
                  <td><input type="number" min="0" [(ngModel)]="l.notice_days"></td>
                  <td><input type="number" min="0" [(ngModel)]="l.max_per_request"></td>
                  <td><input type="number" min="0" [(ngModel)]="l.max_per_year"></td>
                  <td><input type="number" min="0" [(ngModel)]="l.max_times_in_service"></td>
                  <td><input type="checkbox" [(ngModel)]="l.requires_document"></td>
                  <td><input type="checkbox" [(ngModel)]="l.allow_negative" title="Allow leave beyond the balance (recovered from later accrual)"></td>
                  <td class="lp-slab"><input type="text" [ngModel]="slabText(l)" (ngModelChange)="setSlabs(l, $event)" placeholder="full pay" style="width:150px">
                    <small *ngIf="l.pay_slabs?.length">{{ slabWords(l) }}</small>
                    <button type="button" class="lp-link" *ngIf="typeCat(l.leave_type_id) === 'sick'" (click)="setSlabs(l, '15@100, 30@50, 45@0')">UAE sick leave</button></td>
                  <td><input type="number" min="0" [(ngModel)]="l.carry_forward_max" [placeholder]="l.accrual === 'monthly' ? 'all' : 'none'"></td>
                  <td><input type="number" min="0" [(ngModel)]="l.carry_forward_expiry_months" placeholder="never"></td>
                  <td><select [(ngModel)]="l.excess_action"><option value="keep">Keep</option><option value="encash">Encash</option><option value="lapse">Lapse</option></select></td>
                  <td><input type="checkbox" [(ngModel)]="l.encashable"></td>
                  <td><input type="number" min="0" [(ngModel)]="l.encash_max_per_year"></td>
                  <td><input type="number" min="0" step="0.5" [(ngModel)]="l.comp_full_day_hours" [disabled]="l.accrual !== 'earned'" placeholder="any"></td>
                  <td><input type="number" min="0" step="0.5" [(ngModel)]="l.comp_half_day_hours" [disabled]="l.accrual !== 'earned'"></td>
                  <td><input type="number" min="0" [(ngModel)]="l.comp_expiry_days" [disabled]="l.accrual !== 'earned'" placeholder="never"></td>
                  <td><input type="text" [(ngModel)]="l.law_reference" style="width:110px"></td>
                  <td><button type="button" class="lp-x" (click)="removeLine(i)" [attr.aria-label]="'Remove ' + typeName(l.leave_type_id)">×</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="lp-add">
            <select [(ngModel)]="addType"><option [ngValue]="null">Add a leave type…</option><option *ngFor="let t of freeTypes()" [ngValue]="t.id">{{ t.name }}</option></select>
            <button type="button" class="lp-btn" [disabled]="!addType" (click)="addLine()">Add</button>
            <span class="lp-muted">Empty number = no limit. Pay slabs: days at pay %, counted from the start of the leave year.</span>
          </div>

          <!-- v1.12.0 days by length of service -->
          <div class="lp-steps" *ngIf="stepLine">
            <div class="lp-steps-head">
              <h3>{{ typeName(stepLine.leave_type_id) }} by length of service</h3>
              <button type="button" class="lp-x" (click)="stepLine = null" aria-label="Close">×</button>
            </div>
            <p class="lp-muted">Service year 1 gets the line's <b>{{ stepLine.days_per_year || 0 }}</b> days a year<ng-container *ngIf="stepLine.first_year_uae"> (the UAE first-year rule still applies in year 1)</ng-container>.
              Service is counted from the joining date. On the work anniversary the employee moves to the next step; that month (or leave year, for yearly leave) is earned part at the old and part at the new rate.</p>
            <table zPlain class="lp-mini lp-steptable">
              <thead><tr><th>From service year</th><th>Days a year</th><th>Carry-forward max</th><th></th></tr></thead>
              <tbody>
                <tr class="lp-base"><td>1</td><td>{{ stepLine.days_per_year || 0 }}</td><td>{{ stepLine.carry_forward_max ?? (stepLine.accrual === 'monthly' ? 'all' : 'none') }}</td><td><small>from the line</small></td></tr>
                <tr *ngFor="let st of stepLine.service_steps; let j = index">
                  <td><input type="number" min="2" max="60" step="1" [(ngModel)]="st.from_year" [attr.aria-label]="'From service year, step ' + (j + 1)"></td>
                  <td><input type="number" min="0" step="0.5" [(ngModel)]="st.days" [attr.aria-label]="'Days a year, step ' + (j + 1)"></td>
                  <td><input type="number" min="0" [(ngModel)]="st.carry_forward_max" placeholder="as line" [attr.aria-label]="'Carry-forward max, step ' + (j + 1)"></td>
                  <td><button type="button" class="lp-x" (click)="stepLine.service_steps.splice(j, 1)" [attr.aria-label]="'Remove step ' + (j + 1)">×</button></td>
                </tr>
              </tbody>
            </table>
            <p class="lp-bad lp-small" *ngIf="stepProblem(stepLine) as pr">{{ pr }}</p>
            <p class="lp-small" *ngIf="!stepProblem(stepLine) && stepLine.service_steps?.length">{{ stepWords(stepLine) }}</p>
            <div class="lp-add">
              <button type="button" class="lp-btn" (click)="addStep()">Add a step</button>
              <span class="lp-muted">Saved with the policy.</span>
            </div>
          </div>
          <div class="lp-foot">
            <button type="button" class="lp-btn danger" *ngIf="edit.id" (click)="remove()">Delete policy</button>
            <button type="button" class="lp-btn" *ngIf="edit.id" (click)="copy()">Copy</button>
            <button type="button" class="lp-btn" (click)="edit = null">Close</button>
            <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Saving…' : 'Save policy' }}</button>
          </div>
        </ng-container>
      </ng-container>

      <!-- employees -->
      <ng-container *ngIf="tab === 'employees'">
        <div class="lp-form" style="margin-top:0">
          <label>Employee<select [(ngModel)]="who" (ngModelChange)="effective()"><option [ngValue]="null">Pick an employee…</option><option *ngFor="let e of directory" [ngValue]="e.id">{{ e.name }} ({{ e.code }}) – {{ e.category || 'no category' }}</option></select></label>
          <label>Give this employee the policy<select [(ngModel)]="overridePolicy"><option [ngValue]="null">Policy of the category</option><option *ngFor="let p of policies" [ngValue]="p.id">{{ p.name }}</option></select></label>
          <label>Note<input [(ngModel)]="overrideNote" placeholder="Why this employee has another policy"></label>
          <label>&nbsp;<button type="button" class="lp-btn primary" [disabled]="!who" (click)="saveOverride()">Save</button></label>
        </div>
        <div *ngIf="eff" class="lp-msg" style="background:#f7f6ff;color:#2b2f42;border-color:#ddd8ff">
          <b>{{ eff.employee }}</b> – {{ eff.policy || 'no policy' }} ({{ eff.how }}), {{ eff.service_months }} months of service.
          <span *ngFor="let l of eff.lines">· {{ l.leave_type }}<small *ngIf="l.step_from_year"> ({{ l.days_per_year }} days a year, service year {{ l.service_year }})</small>: <ng-container *ngIf="l.balance !== null"><b>{{ l.balance }}</b> available</ng-container><ng-container *ngIf="l.balance === null"><b>{{ l.taken }}</b> taken this year</ng-container>{{ l.eligible ? '' : ' (not yet eligible)' }} </span>
        </div>
        <h3 style="font-size:14px;margin:16px 0 8px">Employees with a policy of their own</h3>
        <table class="table" *ngIf="overrides.length">
          <thead><tr><th>Employee</th><th>Policy</th><th>Note</th><th>Since</th><th>Actions</th></tr></thead>
          <tbody><tr *ngFor="let o of overrides"><td>{{ o.employee }}</td><td>{{ o.policy_name }}</td><td>{{ o.note || '-' }}</td><td>{{ o.assigned_at | date:'dd/MM/yyyy' }}</td>
            <td><button type="button" class="lp-btn" (click)="dropOverride(o)">Back to category policy</button></td></tr></tbody>
        </table>
        <p class="lp-muted" *ngIf="!overrides.length">Everybody follows the policy of their category.</p>
      </ng-container>

      <!-- approvers (v1.11.0) -->
      <ng-container *ngIf="tab === 'approvers'">
        <p class="lp-muted" *ngIf="!ap">Loading…</p>
        <ng-container *ngIf="ap">
          <h3 class="lp-h">Who holds each role</h3>
          <p class="lp-muted">Approval levels can name a role instead of a person. When someone leaves, change it here once. If nobody holds a role, the request goes to the branch HR manager, then the company HR manager, then a company admin – it is never approved automatically and never goes to the employee themselves.</p>
          <table zPlain class="lp-mini lp-roles">
            <thead><tr><th>Role</th><th>For</th><th>User</th></tr></thead>
            <tbody>
              <tr><td>Company HR manager</td><td>Whole company</td><td><select [(ngModel)]="apRoles['company_hr||']" aria-label="Company HR manager"><option [ngValue]="null">– nobody –</option><option *ngFor="let u of ap.users" [ngValue]="u.id">{{ u.name }}</option></select></td></tr>
              <tr *ngFor="let b of ap.branches"><td>Branch HR manager</td><td>{{ b.name }}</td><td><select [(ngModel)]="apRoles['branch_hr|' + b.id + '|']" [attr.aria-label]="'Branch HR manager ' + b.name"><option [ngValue]="null">– nobody –</option><option *ngFor="let u of ap.users" [ngValue]="u.id">{{ u.name }}</option></select></td></tr>
              <tr *ngFor="let d of ap.departments"><td>Department head</td><td>{{ d.name }}</td><td><select [(ngModel)]="apRoles['department_head||' + d.id]" [attr.aria-label]="'Department head ' + d.name"><option [ngValue]="null">– nobody –</option><option *ngFor="let u of ap.users" [ngValue]="u.id">{{ u.name }}</option></select></td></tr>
            </tbody>
          </table>

          <h3 class="lp-h">Approval levels and escalation</h3>
          <p class="lp-muted">Escalation: when a level waits longer than set, the request moves to the escalation person or role (checked every 15 minutes). Reporting-manager workflows use the employee's reporting manager with the same fallback.</p>
          <div class="lp-scroll">
          <table zPlain class="lp-mini lp-wf">
            <thead><tr><th>Leave type</th><th>Branches</th><th>Approval</th><th>Level</th><th>Approver</th><th>User</th><th>Escalate after (days / hours)</th><th>Escalate to (role)</th><th>Escalate to (user)</th></tr></thead>
            <tbody>
              <ng-container *ngFor="let w of ap.workflows">
                <tr *ngIf="!w.levels.length || w.approval_type !== 'multi_approval'"><td><b>{{ w.leave_type }}</b></td><td>{{ w.branches.join(', ') }}</td><td>{{ w.approval_type_label }}</td><td colspan="6" class="lp-muted">{{ w.approval_type === 'reporting_manager' ? 'Reporting manager → branch HR → company HR if missing' : w.approval_type === 'no_approval' ? 'Approved without approval' : 'No levels set' }}</td></tr>
                <ng-container *ngIf="w.approval_type === 'multi_approval'"><tr *ngFor="let l of w.levels; let i = index">
                  <td><b *ngIf="i === 0">{{ w.leave_type }}</b></td><td>{{ i === 0 ? w.branches.join(', ') : '' }}</td><td>{{ i === 0 ? w.approval_type_label : '' }}</td><td>{{ l.level }}</td>
                  <td><select [(ngModel)]="l.role" [attr.aria-label]="w.leave_type + ' level ' + l.level + ' approver'"><option *ngFor="let r of ap.roles" [value]="r[0]">{{ r[1] }}</option></select></td>
                  <td><select [(ngModel)]="l.approver_id" [disabled]="l.role !== 'user'"><option [ngValue]="null">–</option><option *ngFor="let u of ap.users" [ngValue]="u.id">{{ u.name }}</option></select></td>
                  <td><input type="number" min="0" [(ngModel)]="l.escalate_after_days" style="width:56px" aria-label="days"> d <input type="number" min="0" [(ngModel)]="l.escalate_after_hours" style="width:56px" aria-label="hours"> h</td>
                  <td><select [(ngModel)]="l.escalate_role"><option value="">–</option><option *ngFor="let r of ap.roles" [value]="r[0]" [hidden]="r[0] === 'user'">{{ r[1] }}</option></select></td>
                  <td><select [(ngModel)]="l.escalate_to_id" [disabled]="!!l.escalate_role"><option [ngValue]="null">–</option><option *ngFor="let u of ap.users" [ngValue]="u.id">{{ u.name }}</option></select></td>
                </tr></ng-container>
              </ng-container>
            </tbody>
          </table>
          </div>
          <div class="lp-foot"><button type="button" class="lp-btn primary" [disabled]="busy" (click)="saveApprovers()">Save approvers</button></div>

          <h3 class="lp-h">Check who approves</h3>
          <div class="lp-form" style="margin-top:0">
            <label>Employee<select [(ngModel)]="chkEmp"><option [ngValue]="null">Pick an employee…</option><option *ngFor="let e of directory" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
            <label>Leave type<select [(ngModel)]="chkType"><option [ngValue]="null">Pick a leave type…</option><option *ngFor="let t of types" [ngValue]="t.id">{{ t.name }}</option></select></label>
            <label>&nbsp;<button type="button" class="lp-btn" [disabled]="!chkEmp || !chkType" (click)="checkWho()">Check</button></label>
          </div>
          <div *ngIf="chk" class="lp-msg" style="background:#f7f6ff;color:#2b2f42;border-color:#ddd8ff">
            <b>{{ chk.employee }}</b> – {{ chk.workflow || chk.note }}
            <span *ngFor="let s of chk.steps"> · Level {{ s.level }}: <b>{{ s.approver || 'nobody' }}</b> ({{ howLabel(s.how) }})</span>
          </div>

          <h3 class="lp-h">Escalations due now</h3>
          <div class="lp-form" style="margin-top:0"><label>&nbsp;<button type="button" class="lp-btn" (click)="loadDue()">Show</button></label>
            <label>&nbsp;<button type="button" class="lp-btn primary" [disabled]="!due?.length || busy" (click)="escalateNow()">Escalate now</button></label></div>
          <table zPlain class="lp-mini" *ngIf="due?.length">
            <thead><tr><th>Request</th><th>Waiting with</th><th>Hours waiting</th><th>Goes to</th></tr></thead>
            <tbody><tr *ngFor="let d of due"><td>{{ d.document }}</td><td>{{ d.from }}</td><td>{{ d.waited_hours }}</td><td>{{ d.to || 'nobody' }} ({{ howLabel(d.how) }})</td></tr></tbody>
          </table>
          <p class="lp-muted" *ngIf="due && !due.length">Nothing is waiting longer than its escalation time.</p>
        </ng-container>
      </ng-container>

      <!-- UAE rules -->
      <ng-container *ngIf="tab === 'rules'">
        <table zPlain class="lp-mini">
          <thead><tr><th>Leave</th><th>UAE Labour Law</th><th>Pay</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of uaeRules"><td><b>{{ r[0] }}</b></td><td>{{ r[1] }}</td><td>{{ r[2] }}</td></tr>
          </tbody>
        </table>
        <p class="lp-muted" style="margin-top:12px">Federal Decree-Law 33 of 2021 (Art. 29–32) and Cabinet Resolution 1 of 2022. Companies may give more than the law, never less. Check the policy with your legal adviser before go-live.</p>
      </ng-container>
    </div>
  </div>
</div>

<!-- UAE setup -->
<div class="lp-modal-back" *ngIf="setup" (click)="setup = null">
  <div class="lp-modal" (click)="$event.stopPropagation()" role="dialog" aria-label="Load UAE standard setup">
    <header><h2>Load UAE standard setup</h2><button type="button" class="lp-btn" (click)="setup = null">Close</button></header>
    <div class="body">
      <p class="lp-muted">Adds what is missing – existing leave types and policies are not changed. New leave types get a reporting-manager approval workflow for every branch.</p>
      <table zPlain class="lp-mini"><thead><tr><th>Leave type</th><th>Rule</th><th></th></tr></thead>
        <tbody><tr *ngFor="let t of setup.leave_types"><td>{{ t.name }}</td><td>{{ t.description }}</td><td [class.lp-ok]="t.exists">{{ t.exists ? 'Exists' : 'Will be added' }}</td></tr></tbody></table>
      <table zPlain class="lp-mini" style="margin-top:12px"><thead><tr><th>Policy</th><th>Categories</th><th></th></tr></thead>
        <tbody><tr *ngFor="let p of setup.policies"><td>{{ p.name }}</td><td>{{ p.categories.join(', ') }}</td><td [class.lp-ok]="p.exists">{{ p.exists ? 'Exists' : 'Will be added' }}</td></tr></tbody></table>
    </div>
    <footer><button type="button" class="lp-btn" (click)="setup = null">Cancel</button><button type="button" class="lp-btn primary" [disabled]="busy" (click)="loadSetup()">Load</button></footer>
  </div>
</div>

<!-- accrual / year end -->
<div class="lp-modal-back" *ngIf="run" (click)="run = null">
  <div class="lp-modal" (click)="$event.stopPropagation()" role="dialog" [attr.aria-label]="run.kind === 'accrual' ? 'Monthly accrual' : 'Leave year end'">
    <header><h2>{{ run.kind === 'accrual' ? 'Monthly accrual' : 'Leave year end' }}</h2><button type="button" class="lp-btn" (click)="run = null">Close</button></header>
    <div class="body">
      <div class="lp-form" style="margin-top:0">
        <label *ngIf="run.kind === 'accrual'">Month to credit<input type="month" [(ngModel)]="run.month" (change)="preview()"></label>
        <label *ngIf="run.kind === 'year'">Leave year ends on<input type="date" [(ngModel)]="run.date" (change)="preview()"></label>
      </div>
      <p class="lp-muted" *ngIf="run.kind === 'accrual'">Credits the days earned in the month (annual leave monthly; sick, casual and study leave at the start of the leave year). Running it again for the same month adds nothing.</p>
      <p class="lp-muted" *ngIf="run.kind === 'year'">Balances above the policy's carry-forward limit are kept and flagged, sent for encashment or lapse – as set per policy line.</p>
      <p class="lp-muted" *ngIf="run.loading">Calculating…</p>
      <table zPlain class="lp-mini" *ngIf="run.rows?.length">
        <thead><tr><th>Employee</th><th>Leave type</th><th *ngIf="run.kind === 'accrual'">Days</th><th *ngIf="run.kind === 'accrual'">Note</th>
          <th *ngIf="run.kind === 'year'">Balance</th><th *ngIf="run.kind === 'year'">Carried forward</th><th *ngIf="run.kind === 'year'">Above the limit</th><th *ngIf="run.kind === 'year'">Action</th></tr></thead>
        <tbody><tr *ngFor="let r of run.rows">
          <td>{{ r.employee }}</td><td>{{ r.leave_type || typeName(r.leave_type_id) }}</td>
          <td *ngIf="run.kind === 'accrual'">{{ r.days }}</td><td *ngIf="run.kind === 'accrual'">{{ r.note }}</td>
          <td *ngIf="run.kind === 'year'">{{ r.balance }}</td><td *ngIf="run.kind === 'year'">{{ r.carry_forward }}</td><td *ngIf="run.kind === 'year'" [class.lp-bad]="r.excess">{{ r.excess }}</td><td *ngIf="run.kind === 'year'">{{ actionText(r) }}</td></tr></tbody>
      </table>
      <p class="lp-muted" *ngIf="run.rows && !run.rows.length && !run.loading">Nothing to do.</p>
    </div>
    <footer><span class="lp-muted" style="margin-right:auto">{{ run.rows?.length || 0 }} lines</span>
      <button type="button" class="lp-btn" (click)="run = null">Cancel</button>
      <button type="button" class="lp-btn primary" [disabled]="busy || !run.rows?.length" (click)="confirmRun()">{{ run.kind === 'accrual' ? 'Credit these days' : 'Close the leave year' }}</button></footer>
  </div>
</div>`,
})
export class LeavePoliciesComponent implements OnInit {
  tab: 'policies' | 'employees' | 'approvers' | 'rules' = 'policies';
  ap: any = null; apRoles: Record<string, number | null> = {}; chkEmp: number | null = null; chkType: number | null = null; chk: any = null; due: any[] | null = null;
  policies: any[] = [];
  types: any[] = [];
  categories: any[] = [];
  directory: any[] = [];
  overrides: any[] = [];
  edit: any = null;
  stepLine: any = null;   // v1.12.0: the line whose service steps are open
  addType: number | null = null;
  msg = ''; msgErr = false; busy = false;
  setup: any = null;
  run: any = null;
  who: number | null = null; overridePolicy: number | null = null; overrideNote = ''; eff: any = null;
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  uaeRules = [
    ['Annual leave', '30 days a year. In the first year: none in the first 6 months, then 2 days for each month. Unused leave may be carried forward by agreement and is paid at the end of service on the basic wage.', 'Full pay (basic + allowances)'],
    ['Sick leave', 'Up to 90 days a year after probation, with a medical report. During probation only unpaid leave.', '15 days full, 30 days half, 45 days unpaid'],
    ['Maternity leave', '60 days. Up to 45 more days unpaid for illness after the birth; 30 + 30 more days if the child is sick or has a disability.', '45 days full, 15 days half'],
    ['Parental leave', '5 working days for the father or mother, within 6 months of the birth.', 'Full pay'],
    ['Bereavement', '5 days for a spouse; 3 days for a parent, child, sibling, grandchild or grandparent.', 'Full pay'],
    ['Study leave', '10 working days a year to sit exams at an accredited UAE institution, after 2 years of service.', 'Full pay'],
    ['Hajj', 'Up to 30 days once in service (practice under the former law).', 'Unpaid unless the company decides'],
    ['Unpaid leave', 'By agreement with the employer.', 'Unpaid'],
    ['More days with service', 'Not in the law: a company may give more, e.g. 26 days from service year 3. Set "By length of service" on the policy line.', '–'],
    ['Counting days', 'Set per policy line: calendar days, or working days (weekends and public holidays inside the leave are not deducted).', '–'],
  ];

  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}

  private url(p: string, q = ''): string {
    return `${this.rec.api}/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`;
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
    try { this.types = await firstValueFrom(this.http.get<any[]>(this.url('calendars/api/leave-type/'))); } catch { this.types = []; }
    try { this.categories = await firstValueFrom(this.http.get<any[]>(this.url('organisation/api/Catogory/'))); } catch { this.categories = []; }
    try { this.directory = await firstValueFrom(this.http.get<any[]>(this.url('tools/api/directory/'))); } catch { this.directory = []; }
    this.cd.detectChanges();
  }

  async reload(): Promise<void> {
    try { this.policies = await firstValueFrom(this.http.get<any[]>(this.url('leave-policy/api/policies/'))); } catch (e: any) { this.say(e?.error?.detail || 'Policies could not be loaded.', true); }
    this.cd.detectChanges();
  }

  async startLedger(): Promise<void> {
    if (!confirm('Write an opening ledger line for every leave balance that has no ledger yet? Balances themselves do not change.')) { return; }
    try { const r = await firstValueFrom(this.http.post<any>(this.url('leave-policy/api/ledger/start/'), {})); this.say(`Ledger started: ${r.opening_lines} opening lines written.`); }
    catch (e: any) { this.say(this.err(e), true); }
  }
  // ---------------- approvers (v1.11.0)
  async loadApprovers(): Promise<void> {
    try {
      this.ap = await firstValueFrom(this.http.get<any>(this.url('leave-policy/api/approvers/')));
      this.apRoles = {};
      for (const r of this.ap.org_roles) { this.apRoles[`${r.role}|${r.branch_id || ''}|${r.department_id || ''}`] = r.user_id; }
    } catch (e: any) { this.say(this.err(e), true); }
    this.cd.detectChanges();
  }
  async saveApprovers(): Promise<void> {
    const org_roles = Object.entries(this.apRoles).map(([k, v]) => { const [role, b, d] = k.split('|'); return { role, branch_id: b ? +b : null, department_id: d ? +d : null, user_id: v }; });
    const levels = this.ap.workflows.filter((w: any) => w.approval_type === 'multi_approval').flatMap((w: any) => w.levels.map((l: any) => ({ level_id: l.level_id, role: l.role, escalate_role: l.escalate_role || '', approver_id: l.approver_id,
      escalate_to_id: l.escalate_role ? null : l.escalate_to_id, escalate_after_days: l.escalate_after_days || 0, escalate_after_hours: l.escalate_after_hours || 0 })));
    this.busy = true;
    try { await firstValueFrom(this.http.post(this.url('leave-policy/api/approvers/'), { org_roles, levels })); this.say('Approvers saved.'); await this.loadApprovers(); }
    catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  async checkWho(): Promise<void> {
    try { this.chk = await firstValueFrom(this.http.get<any>(this.url('leave-policy/api/who-approves/', `&employee=${this.chkEmp}&leave_type=${this.chkType}`))); }
    catch (e: any) { this.say(this.err(e), true); }
    this.cd.detectChanges();
  }
  async loadDue(): Promise<void> {
    try { this.due = (await firstValueFrom(this.http.get<any>(this.url('leave-policy/api/escalations/')))).due; } catch (e: any) { this.say(this.err(e), true); }
    this.cd.detectChanges();
  }
  async escalateNow(): Promise<void> {
    this.busy = true;
    try { const r = await firstValueFrom(this.http.post<any>(this.url('leave-policy/api/escalations/'), {})); this.say(`${r.escalated.length} request(s) escalated.`); this.due = null; }
    catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  howLabel(h: string): string {
    return ({ user: 'named user', reporting_manager: 'reporting manager', manager_of_manager: "manager's manager", branch_hr: 'branch HR manager',
              department_head: 'department head', company_hr: 'company HR manager', admin: 'company admin – nobody else found', escalate_to: 'escalation user', none: 'nobody found' } as any)[h] || h;
  }

  say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.detectChanges(); }
  kindLabel(k: string): string { return k === 'labour' ? 'Labour' : k === 'office' ? 'Office' : 'Other'; }
  actionText(r: any): string { return !r.excess ? '–' : ({ encash: 'Send for encashment', keep: 'Keep, flag in report', lapse: 'Lapse' } as any)[r.action] || r.action; }
  typeName(id: number): string { return this.types.find(t => t.id === id)?.name || `#${id}`; }
  typePaid(id: number): string { const t = this.types.find(x => x.id === id); return t ? (t.type === 'unpaid' ? 'Unpaid' : 'Paid') : ''; }
  freeTypes(): any[] { const used = new Set((this.edit?.lines || []).map((l: Line) => l.leave_type_id)); return this.types.filter(t => !used.has(t.id) && !t.is_compensatory); }

  pick(p: any): void { this.edit = JSON.parse(JSON.stringify(p)); this.msg = ''; this.stepLine = null; }

  // ---------------- v1.12.0 days by length of service
  openSteps(l: Line): void {
    if (!Array.isArray(l['service_steps'])) { l['service_steps'] = []; }
    this.stepLine = this.stepLine === l ? null : l;
    if (this.stepLine && !l['service_steps'].length) { this.addStep(); }
  }
  addStep(): void {
    const l = this.stepLine; if (!l) { return; }
    const st = l['service_steps'] as any[];
    const last = st.length ? st[st.length - 1] : null;
    st.push({ from_year: last ? Number(last.from_year || 1) + 3 : 2, days: last ? Number(last.days || 0) : Number(l['days_per_year'] || 0), carry_forward_max: null });
  }
  accrualChanged(l: Line): void {
    if (l['prorate'] === 'worked' && l['accrual'] !== 'monthly') { l['prorate'] = 'calendar'; }
  }
  stepSummary(l: Line): string {
    const st = (l['service_steps'] || []).filter((x: any) => x.from_year && x.days !== null && x.days !== '');
    if (!st.length) { return 'Add steps'; }
    return [...st].sort((a: any, b: any) => a.from_year - b.from_year).map((x: any) => `yr ${x.from_year}: ${x.days}`).join(' · ');
  }
  stepProblem(l: Line): string {
    const st = l['service_steps'] || [];
    const ys = st.map((x: any) => Number(x.from_year));
    if (ys.some((y: number) => !Number.isInteger(y) || y < 2)) { return 'Each step starts from service year 2 or later (whole years).'; }
    if (new Set(ys).size !== ys.length) { return 'Each service year once.'; }
    if (st.some((x: any) => x.days === null || x.days === '' || Number(x.days) < 0)) { return 'Give each step its days a year.'; }
    return '';
  }
  stepWords(l: Line): string {
    const st = [...(l['service_steps'] || [])].sort((a: any, b: any) => a.from_year - b.from_year);
    const parts: string[] = [];
    let from = 1, days = Number(l['days_per_year'] || 0);
    for (const x of st) {
      const to = Number(x.from_year) - 1;
      parts.push(to > from ? `years ${from}–${to}: ${days} days` : `year ${from}: ${days} days`);
      from = Number(x.from_year); days = Number(x.days);
    }
    parts.push(`year ${from} on: ${days} days`);
    return parts.join(' · ');
  }
  newPolicy(): void { this.edit = { name: '', code: '', kind: 'office', description: '', category_ids: [], is_default: false, leave_year_start: 1, active: true, lines: [] }; }
  copy(): void { const c = JSON.parse(JSON.stringify(this.edit)); delete c.id; c.name += ' (copy)'; c.code += '-C'; c.category_ids = []; c.is_default = false; c.lines.forEach((l: Line) => delete l.id); this.edit = c; }

  hasCat(id: number): boolean { return (this.edit?.category_ids || []).includes(id); }
  catOwner(id: number): string { const p = this.policies.find(x => x.id !== this.edit?.id && (x.category_ids || []).includes(id)); return p ? p.name : ''; }
  toggleCat(id: number): void { const a: number[] = this.edit.category_ids || []; this.edit.category_ids = a.includes(id) ? a.filter(x => x !== id) : [...a, id]; }

  removeLine(i: number): void { if (this.stepLine === this.edit.lines[i]) { this.stepLine = null; } this.edit.lines.splice(i, 1); }
  addLine(): void { if (this.addType) { this.edit.lines.push({ ...BLANK_LINE, leave_type_id: this.addType }); this.addType = null; } }
  slabWords(l: Line): string {
    return (l['pay_slabs'] || []).map((p: number[]) => `${p[0]} d ${p[1] >= 100 ? 'full' : p[1] <= 0 ? 'unpaid' : p[1] === 50 ? 'half' : p[1] + '%'}`).join(' · ');
  }
  typeCat(id: number): string { return this.types.find(t => t.id === id)?.leave_category || ''; }
  slabText(l: Line): string { return (l['pay_slabs'] || []).map((s: number[]) => `${s[0]}@${s[1]}`).join(', '); }
  setSlabs(l: Line, v: string): void {
    l['pay_slabs'] = (v || '').split(',').map(x => x.trim()).filter(Boolean).map(x => x.split('@').map(n => Number(n.trim()))).filter(p => p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
  }

  private clean(p: any): any {
    const out = { ...p };
    delete out.employees_count; delete out.categories;
    out.lines = (p.lines || []).map((l: Line) => {
      const c: any = { ...l }; delete c.leave_type_name;
      for (const k of ['max_per_request', 'max_per_year', 'max_times_in_service', 'carry_forward_max', 'carry_forward_expiry_months', 'encash_max_per_year',
                       'comp_full_day_hours', 'comp_half_day_hours', 'comp_expiry_days']) { if (c[k] === '' || c[k] === undefined) { c[k] = null; } }
      c.service_steps = (c.service_steps || []).filter((x: any) => x.from_year !== null && x.from_year !== '')
        .map((x: any) => ({ from_year: Number(x.from_year), days: Number(x.days || 0), carry_forward_max: x.carry_forward_max === '' || x.carry_forward_max === null || x.carry_forward_max === undefined ? null : Number(x.carry_forward_max) }));
      return c;
    });
    return out;
  }

  async save(): Promise<void> {
    if (!this.edit.name || !this.edit.code) { this.say('Give the policy a name and a code.', true); return; }
    const bad = (this.edit.lines || []).find((l: Line) => this.stepProblem(l));
    if (bad) { this.stepLine = bad; this.say(`${this.typeName(bad.leave_type_id)}: ${this.stepProblem(bad)}`, true); return; }
    this.busy = true;
    try {
      const body = this.clean(this.edit);
      const r = this.edit.id
        ? await firstValueFrom(this.http.put<any>(this.url(`leave-policy/api/policies/${this.edit.id}/`), body))
        : await firstValueFrom(this.http.post<any>(this.url('leave-policy/api/policies/'), body));
      const openType = this.stepLine?.leave_type_id;
      await this.reload(); this.edit = JSON.parse(JSON.stringify(this.policies.find(p => p.id === r.id) || r));
      this.stepLine = openType ? (this.edit.lines || []).find((l: Line) => l.leave_type_id === openType) || null : null;
      this.say(`Policy ${r.name} saved.`);
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }

  async remove(): Promise<void> {
    if (!confirm(`Delete the policy ${this.edit.name}? Its employees then follow the default policy.`)) { return; }
    try { await firstValueFrom(this.http.delete(this.url(`leave-policy/api/policies/${this.edit.id}/`))); this.edit = null; await this.reload(); this.say('Policy deleted.'); }
    catch (e: any) { this.say(this.err(e), true); }
  }

  private err(e: any): string {
    const d = e?.error;
    if (!d) { return 'It could not be saved.'; }
    if (typeof d === 'string') { return d; }
    return d.detail || Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ');
  }

  // ---------------- employees
  async loadOverrides(): Promise<void> {
    try { this.overrides = await firstValueFrom(this.http.get<any[]>(this.url('leave-policy/api/employee-policies/'))); } catch { this.overrides = []; }
    this.cd.detectChanges();
  }
  async effective(): Promise<void> {
    this.eff = null;
    if (!this.who) { return; }
    const o = this.overrides.find(x => x.employee_id === this.who);
    this.overridePolicy = o ? o.policy : null; this.overrideNote = o?.note || '';
    try { this.eff = await firstValueFrom(this.http.get<any>(this.url('leave-policy/api/effective/', `&employee=${this.who}`))); } catch { this.eff = null; }
    this.cd.detectChanges();
  }
  async saveOverride(): Promise<void> {
    const o = this.overrides.find(x => x.employee_id === this.who);
    try {
      if (!this.overridePolicy && o) { await firstValueFrom(this.http.delete(this.url(`leave-policy/api/employee-policies/${o.id}/`))); }
      else if (this.overridePolicy && o) { await firstValueFrom(this.http.patch(this.url(`leave-policy/api/employee-policies/${o.id}/`), { policy: this.overridePolicy, note: this.overrideNote })); }
      else if (this.overridePolicy) { await firstValueFrom(this.http.post(this.url('leave-policy/api/employee-policies/'), { employee_id: this.who, policy: this.overridePolicy, note: this.overrideNote })); }
      await this.loadOverrides(); await this.effective(); await this.reload(); this.say('Saved.');
    } catch (e: any) { this.say(this.err(e), true); }
  }
  async dropOverride(o: any): Promise<void> {
    try { await firstValueFrom(this.http.delete(this.url(`leave-policy/api/employee-policies/${o.id}/`))); await this.loadOverrides(); await this.reload(); this.say(`${o.employee} follows the policy of the category again.`); }
    catch (e: any) { this.say(this.err(e), true); }
  }

  // ---------------- setup, accrual, year end
  async openSetup(): Promise<void> {
    try { this.setup = await firstValueFrom(this.http.get<any>(this.url('leave-policy/api/uae-setup/'))); } catch (e: any) { this.say(this.err(e), true); }
    this.cd.detectChanges();
  }
  async loadSetup(): Promise<void> {
    this.busy = true;
    try {
      const r = await firstValueFrom(this.http.post<any>(this.url('leave-policy/api/uae-setup/'), {}));
      this.setup = null; await this.reload();
      try { this.types = await firstValueFrom(this.http.get<any[]>(this.url('calendars/api/leave-type/'))); } catch { /* keep */ }
      this.say(`Loaded: ${r.created_leave_types.length} leave types, ${r.created_policies.length} policies, ${r.workflows_added} approval workflows added.`);
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
  openRun(kind: 'accrual' | 'year'): void {
    const d = new Date(); const last = new Date(d.getFullYear(), d.getMonth(), 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    this.run = { kind, month: `${last.getFullYear()}-${pad(last.getMonth() + 1)}`, date: `${d.getFullYear() - (d.getMonth() === 0 ? 1 : 0)}-12-31`, rows: null, loading: false };
    if (kind === 'year') { this.run.date = `${d.getFullYear()}-12-31`; }
    this.preview();
  }
  async preview(): Promise<void> {
    this.run.loading = true; this.run.rows = null; this.cd.detectChanges();
    try {
      const body = this.run.kind === 'accrual' ? { month: this.run.month, preview: true } : { date: this.run.date, preview: true };
      const r = await firstValueFrom(this.http.post<any>(this.url(this.run.kind === 'accrual' ? 'leave-policy/api/accrual/' : 'leave-policy/api/year-end/'), body));
      this.run.rows = this.run.kind === 'accrual' ? r.lines : r.lines.filter((x: any) => x.excess > 0 || x.balance);
    } catch (e: any) { this.run.rows = []; this.say(this.err(e), true); }
    this.run.loading = false; this.cd.detectChanges();
  }
  async confirmRun(): Promise<void> {
    this.busy = true;
    try {
      const body = this.run.kind === 'accrual' ? { month: this.run.month } : { date: this.run.date };
      const r = await firstValueFrom(this.http.post<any>(this.url(this.run.kind === 'accrual' ? 'leave-policy/api/accrual/' : 'leave-policy/api/year-end/'), body));
      this.say(this.run.kind === 'accrual' ? `Accrual for ${r.month}: ${r.count} balances credited.` : `Leave year closed: ${r.lines.length} balances checked.`);
      this.run = null;
    } catch (e: any) { this.say(this.err(e), true); }
    this.busy = false; this.cd.detectChanges();
  }
}
