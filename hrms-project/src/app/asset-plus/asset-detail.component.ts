import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ASSET_BASE, AssetApiService, CONDITIONS, EVENT_ICON, STATUS_CLASS, STATUS_LABEL, isImage, money, today } from './asset-api.service';
import { AssetFormComponent } from './asset-form.component';
import { Bar, code39 } from './barcode';

type Act = '' | 'allocate' | 'return' | 'transfer' | 'maintenance' | 'close' | 'schedule' | 'damage' | 'loss' | 'dispose' | 'label' | 'upload';

/** One asset (v1.12.0): details, assignment, maintenance, history and documents, with every life-cycle action. */
@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AssetFormComponent],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <button type="button" class="ex-link ap-noprint" (click)="back()">← Asset register</button>
          <h1 class="page-title" *ngIf="a">{{ a.name }} <span class="ap-code">{{ a.code }}</span></h1>
          <p class="ex-desc" *ngIf="a">{{ a.asset_type_name }} · SN {{ a.serial_number }}<span *ngIf="a.model"> · {{ a.model }}</span>
            · <span class="ex-tag" [ngClass]="cls(a.status)">{{ a.status_label }}</span>
            <span class="ex-flag warn" *ngIf="a.condition !== 'healthy'">{{ cond(a.condition) }}</span></p>
        </div>
        <div class="ex-actions ap-noprint" *ngIf="a">
          <ng-container *ngIf="a.status !== 'disposed'">
            <button type="button" class="ex-btn primary" *ngIf="r.alloc_add && a.status === 'available'" (click)="openAct('allocate')">Allocate</button>
            <button type="button" class="ex-btn primary" *ngIf="r.alloc_change && a.holder && a.status === 'assigned'" (click)="openAct('return')">Receive back</button>
            <button type="button" class="ex-btn" *ngIf="r.transfer_add && a.holder && a.status === 'assigned' && !a.pending?.transfer" (click)="openAct('transfer')">Transfer</button>
            <button type="button" class="ex-btn" *ngIf="r.maint_change && a.status !== 'maintenance' && a.status !== 'lost'" (click)="openAct('maintenance')">Send to maintenance</button>
            <button type="button" class="ex-btn" *ngIf="r.damage_add && a.status !== 'lost'" (click)="openAct('damage')">Report damage</button>
            <button type="button" class="ex-btn" *ngIf="r.loss_add && a.status !== 'lost' && a.status !== 'maintenance'" (click)="openAct('loss')">Report lost / stolen</button>
            <button type="button" class="ex-btn danger" *ngIf="r.disposal_add && !a.holder && a.status !== 'maintenance' && !a.pending?.disposal" (click)="openAct('dispose')">Dispose</button>
            <button type="button" class="ex-btn" *ngIf="r.master_change" (click)="editing = true">Edit</button>
          </ng-container>
          <button type="button" class="ex-btn" (click)="openAct('label')">Print label</button>
        </div>
      </div>
      <div class="ex-tabs ap-noprint">
        <button type="button" *ngFor="let t of tabs" [class.on]="tab === t.key" (click)="tab = t.key">{{ t.label }}</button>
      </div>
    </div>

    <div class="com_list mt-4" *ngIf="a">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <div class="ap-note" *ngIf="a.pending?.transfer">Transfer {{ a.pending.transfer.number }} waits for approval.
        <button type="button" class="ex-link" (click)="go('transfers')">Open transfers</button></div>
      <div class="ap-note" *ngIf="a.pending?.return">The employee asked to return this asset ({{ a.pending.return.number }}). Use “Receive back” to record the check list.</div>
      <div class="ap-note" *ngIf="a.pending?.disposal">Disposal {{ a.pending.disposal.number }} waits for approval.</div>
      <div class="ap-note err" *ngIf="a.status === 'lost' && a.pending?.loss">Reported lost / stolen ({{ a.pending.loss.number }}). It cannot be allocated until it is found.
        <button type="button" class="ex-link" (click)="go('losses')">Open the loss record</button></div>
      <div class="ap-note" *ngIf="a.disposal">Disposed by {{ a.disposal.method | lowercase }} on {{ a.disposal.date | date:'dd MMM yyyy' }} ({{ a.disposal.number }}):
        value {{ m(a.disposal.value) }}, book value {{ m(a.disposal.book_value) }},
        <span class="ap-gl" [class.gain]="+a.disposal.gain_loss > 0" [class.loss]="+a.disposal.gain_loss < 0">{{ +a.disposal.gain_loss >= 0 ? 'gain' : 'loss' }} {{ m(abs(a.disposal.gain_loss)) }}</span></div>

      <!-- details -->
      <ng-container *ngIf="tab === 'details'">
        <div class="ex-sum" *ngIf="a.book_value !== undefined">
          <div><small>Purchase cost</small><b>{{ m(a.purchase_cost, a.currency) }}</b></div>
          <div class="hl"><small>Book value today</small><b>{{ m(a.book_value, a.currency) }}</b></div>
          <div><small>Maintenance cost</small><b>{{ m(a.counts?.maintenance_cost, a.currency) }}</b></div>
          <div><small>Warranty</small><b>{{ a.warranty_end ? (a.warranty_days_left >= 0 ? a.warranty_days_left + ' day(s) left' : 'Expired') : '–' }}</b></div>
        </div>
        <div class="ap-kv">
          <div><small>Asset code</small><b>{{ a.code }}</b></div><div><small>Barcode</small><b>{{ a.barcode }}</b></div><div><small>Type</small><b>{{ a.asset_type_name }}</b></div>
          <div><small>Branch</small><b>{{ a.branch_name || '–' }}</b></div><div><small>Location</small><b>{{ a.location || '–' }}</b></div><div><small>Department</small><b>{{ a.department_name || '–' }}</b></div>
          <div><small>Purchase date</small><b>{{ a.purchase_date | date:'dd MMM yyyy' }}</b></div><div><small>Vendor</small><b>{{ a.vendor || '–' }}</b></div>
          <div><small>Invoice</small><b>{{ a.invoice_no || '–' }} <a *ngIf="a.invoice_file" class="ex-link" [href]="a.invoice_file" target="_blank" rel="noopener">open</a></b></div>
          <div><small>Purchase order</small><b>{{ a.purchase_order || '–' }}</b></div>
          <div><small>Warranty</small><b>{{ a.warranty_start ? (a.warranty_start | date:'dd MMM yyyy') : '–' }} → {{ a.warranty_end ? (a.warranty_end | date:'dd MMM yyyy') : '–' }}</b></div>
          <div><small>Insurance</small><b>{{ a.insurance_provider || '–' }} {{ a.insurance_policy_no }}<span *ngIf="a.insurance_expiry"> until {{ a.insurance_expiry | date:'dd MMM yyyy' }}</span></b></div>
          <div><small>Depreciation</small><b>{{ dep(a.depreciation_method) }}<span *ngIf="a.depreciation_method !== 'none'">, {{ a.useful_life_months }} months</span></b></div>
          <div><small>Salvage value</small><b>{{ a.salvage_value !== undefined ? m(a.salvage_value, a.currency) : '–' }}</b></div>
          <div><small>Meter reading</small><b>{{ a.meter_reading || '–' }}</b></div>
          <div *ngFor="let c of a.custom_fields"><small>{{ c.name }}</small><b>{{ c.value || '–' }}</b></div>
          <div style="grid-column:1/-1" *ngIf="a.notes"><small>Notes</small><b>{{ a.notes }}</b></div>
        </div>
        <div class="ex-panel" style="margin-top:16px" *ngIf="(a.depreciation_schedule || []).length">
          <div class="ex-h">Depreciation schedule</div>
          <div class="ap-scroll"><table class="ap-table"><thead><tr><th>Year</th><th>Until</th><th>Opening</th><th>Depreciation</th><th>Closing</th></tr></thead>
            <tbody><tr *ngFor="let y of a.depreciation_schedule"><td>{{ y.year }}</td><td>{{ y.until | date:'dd MMM yyyy' }}</td><td>{{ m(y.opening) }}</td>
              <td>{{ m(y.depreciation) }}</td><td>{{ m(y.closing) }}</td></tr></tbody></table></div>
        </div>
      </ng-container>

      <!-- assignment -->
      <ng-container *ngIf="tab === 'assignment'">
        <div class="ap-hold" *ngIf="a.holder_detail as h; else store">
          <div class="ic">{{ (h.name || '?').slice(0, 1) }}</div>
          <div class="main"><div class="t" style="font-weight:700">{{ h.type === 'employee' ? 'With ' : 'At ' }}{{ h.name }}</div>
            <div class="ex-muted">Since {{ h.since | date:'dd MMM yyyy' }}<span *ngIf="h.expected_return_date"> · expected back {{ h.expected_return_date | date:'dd MMM yyyy' }}</span>
              <span *ngIf="h.custodian"> · custodian {{ h.custodian }}</span>
              <span *ngIf="h.type === 'employee'"> · receipt {{ lbl(h.ack_status) | lowercase }}</span></div></div>
        </div>
        <ng-template #store><div class="ap-note ok">In the store – not allocated to anyone.</div></ng-template>
        <div class="ex-panel"><div class="ex-h">Allocations</div>
          <div class="ex-rows">
            <div class="ex-row" *ngFor="let x of allocs">
              <div class="main"><div class="t">{{ x.employee || x.holder }}</div>
                <div class="s">{{ x.assigned_date | date:'dd MMM yyyy' }} → {{ x.returned_date ? (x.returned_date | date:'dd MMM yyyy') : 'now' }}
                  <span *ngIf="x.accessories"> · {{ x.accessories }}</span><span *ngIf="x.ack_condition_notes"> · remarks: {{ x.ack_condition_notes }}</span>
                  <span *ngIf="x.return_condition"> · returned {{ cond(x.return_condition) | lowercase }}</span></div></div>
              <div class="r"><span class="ex-tag" [ngClass]="cls(x.open ? (x.ack_status || 'approved') : 'closed')">{{ x.open ? (x.kind === 'employee' ? lbl(x.ack_status) : 'Shared') : 'Returned' }}</span>
                <div *ngIf="x.handover_file"><a class="ex-link" [href]="x.handover_file" target="_blank" rel="noopener">Hand-over form</a></div>
                <button type="button" class="ex-link" *ngIf="x.open && x.kind === 'employee' && r.alloc_change" (click)="editExpected(x)">Change expected return</button></div>
            </div>
            <p class="ex-muted" *ngIf="!allocs.length">Never allocated.</p>
          </div></div>
        <div class="ex-panel"><div class="ex-h">Transfers</div>
          <div class="ex-rows"><div class="ex-row" *ngFor="let t of transfers">
            <div class="main"><div class="t">{{ t.number }} · {{ t.from }} → {{ t.to }}</div><div class="s">{{ t.transfer_date | date:'dd MMM yyyy' }} · {{ t.reason }}<span *ngIf="t.decision_note"> · {{ t.decision_note }}</span></div></div>
            <div class="r"><span class="ex-tag" [ngClass]="cls(t.status)">{{ t.status_label }}</span></div></div>
            <p class="ex-muted" *ngIf="!transfers.length">No transfers.</p></div></div>
        <div class="ex-panel"><div class="ex-h">Damage and loss</div>
          <div class="ex-rows"><div class="ex-row" *ngFor="let d of incidents">
            <div class="main"><div class="t">{{ d.number }} · {{ d.kind_of_record === 'damage' ? 'Damage (' + d.severity_label + ')' : d.kind_label }}</div>
              <div class="s">{{ (d.damage_date || d.loss_date) | date:'dd MMM yyyy' }} · {{ d.employee || 'no employee' }} · {{ d.description }}</div></div>
            <div class="r"><div class="money" *ngIf="+d.recovery_amount">{{ m(d.recovery_amount) }}</div><span class="ex-tag" [ngClass]="cls(d.status)">{{ d.status_label }}</span></div></div>
            <p class="ex-muted" *ngIf="!incidents.length">None.</p></div></div>
      </ng-container>

      <!-- maintenance -->
      <ng-container *ngIf="tab === 'maintenance'">
        <div class="ex-panel"><div class="ex-h">Maintenance plans
          <button type="button" class="ex-btn sm" *ngIf="r.maint_change && a.status !== 'disposed'" (click)="openAct('schedule')">+ Plan</button></div>
          <div class="ex-rows"><div class="ex-row" *ngFor="let s of schedules">
            <div class="main"><div class="t">{{ s.title }} – every {{ s.interval_value }} {{ s.interval_type }}</div>
              <div class="s">Last done {{ s.last_done_date ? (s.last_done_date | date:'dd MMM yyyy') : '–' }}<span *ngIf="s.last_done_reading"> at {{ s.last_done_reading }}</span>
                · next {{ s.next_due_date ? (s.next_due_date | date:'dd MMM yyyy') : ('at ' + s.next_due_reading) }}<span *ngIf="s.vendor"> · {{ s.vendor }}</span></div></div>
            <div class="r"><span class="ex-tag" [ngClass]="s.due === 'overdue' ? 'rejected' : (s.due === 'due' ? 'pending' : 'draft')">{{ s.due === 'overdue' ? 'Overdue' : (s.due === 'due' ? 'Due soon' : (s.active ? 'Planned' : 'Off')) }}</span>
              <div><button type="button" class="ex-link" *ngIf="r.maint_change && a.status !== 'maintenance' && a.status !== 'disposed' && a.status !== 'lost'" (click)="startFromPlan(s)">Start</button>
                <button type="button" class="ex-link" *ngIf="r.maint_change" (click)="removePlan(s)" style="margin-left:8px">Remove</button></div></div></div>
            <p class="ex-muted" *ngIf="!schedules.length">No plans. Add one to get reminders (every N days, kilometres or running hours).</p></div></div>
        <div class="ex-panel"><div class="ex-h">Maintenance records</div>
          <div class="ex-rows"><div class="ex-row" *ngFor="let x of maint">
            <div class="main"><div class="t">{{ x.number }} · {{ x.kind_label }}<span *ngIf="x.vendor"> · {{ x.vendor }}</span></div>
              <div class="s">{{ x.start_date | date:'dd MMM yyyy' }} → {{ x.end_date ? (x.end_date | date:'dd MMM yyyy') : 'open' }} · {{ x.description }}
                <span *ngIf="x.downtime_hours"> · downtime {{ x.downtime_hours }} h</span><span *ngIf="x.result_label"> · {{ x.result_label }}</span></div></div>
            <div class="r"><div class="money">{{ m(x.cost) }}</div><span class="ex-tag" [ngClass]="cls(x.status)">{{ x.status_label }}</span>
              <div *ngIf="x.status === 'open' && r.maint_change"><button type="button" class="ex-link" (click)="closeMaint(x)">Complete</button></div></div></div>
            <p class="ex-muted" *ngIf="!maint.length">No maintenance yet.</p></div></div>
      </ng-container>

      <!-- history -->
      <ng-container *ngIf="tab === 'history'">
        <div class="ap-ev" *ngFor="let e of history">
          <mat-icon>{{ icon(e.event) }}</mat-icon>
          <div class="txt">{{ e.summary }}
            <div class="ap-ch" *ngIf="e.changes && keys(e.changes).length"><span *ngFor="let k of keys(e.changes)"><b>{{ e.changes[k].label }}</b>: {{ e.changes[k].old || '–' }} → {{ e.changes[k].new || '–' }}</span></div>
            <div class="meta">{{ e.at | date:'dd MMM yyyy, HH:mm' }} · {{ e.user }}</div></div>
        </div>
        <p class="ex-muted" *ngIf="!history.length">No history yet.</p>
      </ng-container>

      <!-- documents -->
      <ng-container *ngIf="tab === 'documents'">
        <div class="ex-h">Photos and documents <button type="button" class="ex-btn sm" *ngIf="r.master_change && a.status !== 'disposed'" (click)="openAct('upload')">+ Upload</button></div>
        <div class="ap-files">
          <div class="ap-file" *ngFor="let f of files">
            <a [href]="f.url" target="_blank" rel="noopener"><img *ngIf="img(f.url)" [src]="f.url" [alt]="f.name"><div class="doc" *ngIf="!img(f.url)">{{ ext(f.name) }}</div></a>
            <div class="n" [title]="f.name">{{ f.name }}</div>
            <div class="ex-muted" style="font-size:11px">{{ f.kind_label }}<span *ngIf="f.record_type"> · {{ f.record_type }}</span> · {{ f.uploaded_at | date:'dd MMM yyyy' }}</div>
            <button type="button" class="ex-link danger" *ngIf="r.master_change" (click)="removeFile(f)">Remove</button>
          </div>
        </div>
        <p class="ex-muted" *ngIf="!files.length">No files yet.</p>
      </ng-container>
    </div>
  </div>
</div>

<app-asset-form *ngIf="editing" [asset]="a" (closed)="editing = false" (saved)="editing = false; done('Asset saved.')"></app-asset-form>

<!-- action dialog -->
<div class="ex-back" *ngIf="act" (click)="act = ''">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
    <header><h2>{{ titles[act] }}</h2><button type="button" (click)="act = ''" aria-label="Close">×</button></header>
    <div class="body">
      <p class="ex-msg err" *ngIf="err">{{ err }}</p>
      <div class="ex-form" *ngIf="act === 'allocate'">
        <label>Give to
          <select [(ngModel)]="x.target_type" name="tt"><option value="employee">An employee</option><option value="location">A location (shared)</option><option value="department">A department (shared)</option></select></label>
        <label *ngIf="x.target_type === 'employee'">Employee *<select [(ngModel)]="x.employee" name="e"><option [ngValue]="null">Choose…</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
        <ng-container *ngIf="x.target_type !== 'employee'">
          <label>Branch<select [(ngModel)]="x.branch_id" name="b"><option [ngValue]="null">–</option><option *ngFor="let b of lk.branches" [ngValue]="b.id">{{ b.name }}</option></select></label>
          <label *ngIf="x.target_type === 'location'">Location<input [(ngModel)]="x.location" name="l" placeholder="e.g. Reception, meeting room 2"></label>
          <label *ngIf="x.target_type === 'department'">Department *<select [(ngModel)]="x.department_id" name="d"><option [ngValue]="null">Choose…</option>
            <option *ngFor="let d of lk.departments" [ngValue]="d.id">{{ d.name }}</option></select></label>
          <label>Custodian (optional)<select [(ngModel)]="x.custodian_employee_id" name="c"><option [ngValue]="null">–</option>
            <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
        </ng-container>
        <label>Date<input type="date" [(ngModel)]="x.assigned_date" name="ad"></label>
        <label>Expected return<input type="date" [(ngModel)]="x.expected_return_date" name="er"></label>
        <label class="wide">Accessories handed over<input [(ngModel)]="x.accessories" name="acc" placeholder="Bag, charger, mouse …"></label>
        <label class="wide">Hand-over note<textarea [(ngModel)]="x.handover_note" name="hn"></textarea></label>
        <label class="wide">Signed hand-over form<input type="file" accept="image/*,application/pdf" (change)="upl = file($event)" aria-label="Hand-over form"></label>
      </div>
      <div class="ex-form" *ngIf="act === 'return'">
        <label>Return date<input type="date" [(ngModel)]="x.return_date" name="rd"></label>
        <label>Condition<select [(ngModel)]="x.condition" name="c"><option *ngFor="let c of conditions" [value]="c.value">{{ c.label }}</option></select></label>
        <label class="ck"><input type="checkbox" [(ngModel)]="x.accessories_returned" name="ar"> All accessories returned</label>
        <label class="ck"><input type="checkbox" [(ngModel)]="x.data_wiped" name="dw"> Data wiped / accounts removed</label>
        <label class="wide" *ngIf="!x.accessories_returned">Missing items *<input [(ngModel)]="x.missing_items" name="mi"></label>
        <label class="ck wide"><input type="checkbox" [(ngModel)]="x.damage_found" name="df"> Damage found (creates a damage record for approval)</label>
        <ng-container *ngIf="x.damage_found || x.condition !== 'healthy'">
          <label class="wide">Damage description *<textarea [(ngModel)]="x.damage_description" name="dd"></textarea></label>
          <label>Repair estimate<input type="number" min="0" step="0.01" [(ngModel)]="x.damage_estimate" name="de"></label>
        </ng-container>
        <label class="wide">Notes<textarea [(ngModel)]="x.notes" name="n"></textarea></label>
        <label class="wide">Signed return form / photos<input type="file" multiple (change)="upls = pickMany($event)" aria-label="Return files"></label>
      </div>
      <div class="ex-form" *ngIf="act === 'transfer'">
        <div class="wide ex-muted">From: <b>{{ a?.holder?.name }}</b></div>
        <label>To<select [(ngModel)]="x.to_type" name="tt"><option value="employee">Another employee</option><option value="location">A location</option>
          <option value="department">A department</option><option value="store">Back to the store</option></select></label>
        <label *ngIf="x.to_type === 'employee'">Employee *<select [(ngModel)]="x.to_employee_id" name="e"><option [ngValue]="null">Choose…</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
        <label *ngIf="x.to_type === 'location' || x.to_type === 'department'">Branch<select [(ngModel)]="x.to_branch_id" name="b"><option [ngValue]="null">–</option>
          <option *ngFor="let b of lk.branches" [ngValue]="b.id">{{ b.name }}</option></select></label>
        <label *ngIf="x.to_type === 'location'">Location<input [(ngModel)]="x.to_location" name="l"></label>
        <label *ngIf="x.to_type === 'department'">Department *<select [(ngModel)]="x.to_department_id" name="d"><option [ngValue]="null">Choose…</option>
          <option *ngFor="let d of lk.departments" [ngValue]="d.id">{{ d.name }}</option></select></label>
        <label>Transfer date<input type="date" [(ngModel)]="x.transfer_date" name="td"></label>
        <label class="wide">Reason *<textarea [(ngModel)]="x.reason" name="r"></textarea></label>
        <p class="wide ex-muted">The transfer waits for approval by a user with the “approve asset transfers” right; on approval the current allocation is closed and the new one opened.</p>
      </div>
      <div class="ex-form" *ngIf="act === 'maintenance'">
        <label>Type<select [(ngModel)]="x.kind" name="k"><option value="breakdown">Breakdown / repair</option><option value="preventive">Preventive (scheduled)</option><option value="inspection">Inspection</option></select></label>
        <label>Plan<select [(ngModel)]="x.schedule" name="s"><option [ngValue]="null">–</option><option *ngFor="let s of schedules" [ngValue]="s.id">{{ s.title }}</option></select></label>
        <label>Vendor / workshop<input [(ngModel)]="x.vendor" name="v"></label>
        <label>Start date<input type="date" [(ngModel)]="x.start_date" name="sd"></label>
        <label>Estimated cost<input type="number" min="0" step="0.01" [(ngModel)]="x.cost" name="c"></label>
        <label>Meter reading<input type="number" min="0" step="0.1" [(ngModel)]="x.reading" name="rd"></label>
        <label class="wide">Work to be done *<textarea [(ngModel)]="x.description" name="d"></textarea></label>
        <p class="wide ex-muted">While the record is open the asset shows “Under maintenance” and cannot be allocated.</p>
      </div>
      <div class="ex-form" *ngIf="act === 'close'">
        <label>End date<input type="date" [(ngModel)]="x.end_date" name="ed"></label>
        <label>Result<select [(ngModel)]="x.result" name="r"><option value="fixed">Fixed</option><option value="replaced">Part replaced</option>
          <option value="ok">No fault found</option><option value="not_fixed">Could not be fixed</option></select></label>
        <label>Final cost<input type="number" min="0" step="0.01" [(ngModel)]="x.cost" name="c"></label>
        <label>Downtime (hours)<input type="number" min="0" step="0.5" [(ngModel)]="x.downtime_hours" name="dt" placeholder="Empty = days × 24"></label>
        <label>Meter reading<input type="number" min="0" step="0.1" [(ngModel)]="x.reading" name="rd"></label>
        <label class="ck"><input type="checkbox" [(ngModel)]="x.cancel" name="cn"> Cancel instead (no work done)</label>
        <label class="wide">Notes<textarea [(ngModel)]="x.result_notes" name="n"></textarea></label>
        <label class="wide">Invoice / job card<input type="file" multiple (change)="upls = pickMany($event)" aria-label="Maintenance files"></label>
      </div>
      <div class="ex-form" *ngIf="act === 'schedule'">
        <label class="wide">Title *<input [(ngModel)]="x.title" name="t" placeholder="e.g. Oil change, AC service"></label>
        <label>Repeat every *<input type="number" min="1" [(ngModel)]="x.interval_value" name="iv"></label>
        <label>Unit<select [(ngModel)]="x.interval_type" name="it"><option value="days">Days</option><option value="km">Kilometres</option><option value="hours">Running hours</option></select></label>
        <label *ngIf="x.interval_type === 'days'">Last done<input type="date" [(ngModel)]="x.last_done_date" name="ld"></label>
        <label *ngIf="x.interval_type !== 'days'">Last done at reading<input type="number" min="0" [(ngModel)]="x.last_done_reading" name="lr"></label>
        <label>Remind days before<input type="number" min="0" max="365" [(ngModel)]="x.remind_days_before" name="rb"></label>
        <label>Vendor<input [(ngModel)]="x.vendor" name="v"></label>
        <label>Estimated cost<input type="number" min="0" step="0.01" [(ngModel)]="x.estimated_cost" name="ec"></label>
      </div>
      <div class="ex-form" *ngIf="act === 'damage'">
        <label>Date<input type="date" [(ngModel)]="x.damage_date" name="dd" [max]="todayStr"></label>
        <label>Severity<select [(ngModel)]="x.severity" name="s"><option value="minor">Minor</option><option value="major">Major</option><option value="total">Beyond repair</option></select></label>
        <label>Employee responsible<select [(ngModel)]="x.employee" name="e"><option [ngValue]="null">{{ a?.holder?.type === 'employee' ? 'Current holder' : '–' }}</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
        <label>Repair cost / estimate<input type="number" min="0" step="0.01" [(ngModel)]="x.repair_cost" name="rc"></label>
        <label class="wide">What happened *<textarea [(ngModel)]="x.description" name="d"></textarea></label>
        <label class="wide">Photos<input type="file" accept="image/*" multiple (change)="upls = pickMany($event)" aria-label="Damage photos"></label>
        <p class="wide ex-muted">Responsibility and any recovery from the employee's salary are decided when the report is approved (Assets → Damage).</p>
      </div>
      <div class="ex-form" *ngIf="act === 'loss'">
        <label>Lost or stolen<select [(ngModel)]="x.kind" name="k"><option value="lost">Lost</option><option value="stolen">Stolen</option></select></label>
        <label>Date<input type="date" [(ngModel)]="x.loss_date" name="ld" [max]="todayStr"></label>
        <label>Employee<select [(ngModel)]="x.employee" name="e"><option [ngValue]="null">{{ a?.holder?.type === 'employee' ? 'Current holder' : '–' }}</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
        <label>Where<input [(ngModel)]="x.place" name="p"></label>
        <label>Police report no.<input [(ngModel)]="x.police_report_no" name="pr"></label>
        <label>Police report<input type="file" accept="image/*,application/pdf" (change)="upl = file($event)" aria-label="Police report"></label>
        <label class="wide">What happened *<textarea [(ngModel)]="x.description" name="d"></textarea></label>
        <p class="wide ex-muted">The current allocation is closed and the asset shows “Lost / stolen” until it is found.</p>
      </div>
      <div class="ex-form" *ngIf="act === 'dispose'">
        <label>Method<select [(ngModel)]="x.method" name="m"><option value="sale">Sale</option><option value="scrap">Scrap</option><option value="donate">Donation</option><option value="write_off">Write-off</option></select></label>
        <label>Date<input type="date" [(ngModel)]="x.disposal_date" name="dd"></label>
        <label *ngIf="x.method === 'sale' || x.method === 'scrap'">{{ x.method === 'sale' ? 'Sale price *' : 'Scrap value' }}<input type="number" min="0" step="0.01" [(ngModel)]="x.value" name="v"></label>
        <label *ngIf="x.method === 'sale' || x.method === 'donate'">{{ x.method === 'sale' ? 'Buyer *' : 'Given to' }}<input [(ngModel)]="x.buyer" name="b"></label>
        <label class="wide">Reason *<textarea [(ngModel)]="x.reason" name="r"></textarea></label>
        <div class="ex-calc" *ngIf="a?.book_value !== undefined">Book value today {{ m(a.book_value) }} →
          <span class="ap-gl" [class.gain]="(+x.value || 0) - +a.book_value > 0" [class.loss]="(+x.value || 0) - +a.book_value < 0">
            {{ (+x.value || 0) - +a.book_value >= 0 ? 'gain' : 'loss' }} {{ m(abs((+x.value || 0) - +a.book_value)) }}</span> (final figure on the disposal date)</div>
      </div>
      <div class="ex-form" *ngIf="act === 'upload'">
        <label>Kind<select [(ngModel)]="x.kind" name="k"><option *ngFor="let k of fileKinds" [value]="k[0]">{{ k[1] }}</option></select></label>
        <label>Files *<input type="file" multiple (change)="upls = pickMany($event)" aria-label="Files"></label>
      </div>
      <div *ngIf="act === 'label' && a" class="ap-label">
        <svg [attr.viewBox]="'0 0 ' + (bc.width + 20) + ' 70'" style="width:100%;max-width:420px;height:90px" role="img" [attr.aria-label]="'Barcode ' + a.barcode">
          <rect x="0" y="0" [attr.width]="bc.width + 20" height="70" fill="#fff"></rect>
          <rect *ngFor="let b of bc.bars" [attr.x]="b.x + 10" y="5" [attr.width]="b.w" height="60" fill="#000"></rect></svg>
        <div><div class="code">{{ a.barcode }}</div><div>{{ a.name }}</div><div class="ex-muted">SN {{ a.serial_number }} · {{ a.asset_type_name }}</div>
          <div class="ex-muted">{{ companyHint }}</div></div>
      </div>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="act = ''">Cancel</button>
      <button type="button" class="ex-btn primary" *ngIf="act === 'label'" (click)="print()">Print</button>
      <button type="button" class="ex-btn primary" *ngIf="act !== 'label'" [disabled]="busy" (click)="submit()">{{ okText[act] || 'Save' }}</button>
    </footer>
  </div>
</div>`,
})
export class AssetDetailComponent implements OnInit {
  id = 0;
  a: any = null;
  r: any = {};
  lk: any = { employees: [], branches: [], departments: [] };
  tab = 'details';
  tabs = [{ key: 'details', label: 'Details' }, { key: 'assignment', label: 'Assignment' }, { key: 'maintenance', label: 'Maintenance' },
    { key: 'history', label: 'History' }, { key: 'documents', label: 'Documents' }];
  history: any[] = []; files: any[] = []; allocs: any[] = []; transfers: any[] = []; maint: any[] = []; schedules: any[] = []; incidents: any[] = [];
  act: Act = '';
  x: any = {};
  upl: File | null = null;
  upls: File[] = [];
  err = ''; msg = ''; msgErr = false; busy = false; editing = false;
  conditions = CONDITIONS;
  todayStr = today();
  bc: { bars: Bar[]; width: number } = { bars: [], width: 0 };
  companyHint = 'Property of the company – if found, please return to HR.';
  fileKinds = [['photo', 'Photo'], ['document', 'Document'], ['invoice', 'Invoice'], ['warranty', 'Warranty'], ['insurance', 'Insurance'], ['handover', 'Hand-over form'], ['other', 'Other']];
  titles: Record<string, string> = { allocate: 'Allocate the asset', return: 'Receive the asset back', transfer: 'Request a transfer', maintenance: 'Send to maintenance',
    close: 'Complete maintenance', schedule: 'Add a maintenance plan', damage: 'Report damage', loss: 'Report lost / stolen', dispose: 'Request disposal',
    label: 'Asset label', upload: 'Upload files' };
  okText: Record<string, string> = { allocate: 'Allocate', return: 'Record the return', transfer: 'Send for approval', maintenance: 'Start maintenance',
    close: 'Save', schedule: 'Add plan', damage: 'Report damage', loss: 'Report', dispose: 'Send for approval', upload: 'Upload' };
  private closing: any = null;

  constructor(private api: AssetApiService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.id = +(this.route.snapshot.paramMap.get('id') || 0);
    const t = this.route.snapshot.queryParamMap.get('tab');
    if (t) this.tab = t;
    try {
      this.lk = await this.api.lookups();
      this.r = this.lk.rights || {};
    } catch { /* rights stay empty */ }
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.a = await this.api.get(`assets/${this.id}/`);
      this.bc = code39(this.a.barcode || this.a.code);
      const q = { asset: this.id };
      const safe = (p: Promise<any>) => p.catch(() => []);
      const [h, f, al, tr, mt, sc, dm, ls] = await Promise.all([
        safe(this.api.get(`assets/${this.id}/history/`)), safe(this.api.get(`assets/${this.id}/files/`)), safe(this.api.get('allocations/', q)),
        safe(this.api.get('transfers/', q)), safe(this.api.get('maintenance/', q)), safe(this.api.get('schedules/', q)),
        safe(this.api.get('damages/', q)), safe(this.api.get('losses/', q))]);
      Object.assign(this, { history: h, files: f, allocs: al, transfers: tr, maint: mt, schedules: sc, incidents: [...dm, ...ls] });
    } catch (e: any) {
      this.msg = AssetApiService.error(e, 'The asset could not be loaded.');
      this.msgErr = true;
    }
    this.cd.markForCheck();
  }

  openAct(a: Act): void {
    this.err = ''; this.upl = null; this.upls = [];
    const d = today();
    const defaults: Record<string, any> = {
      allocate: { target_type: 'employee', employee: null, assigned_date: d, expected_return_date: null, accessories: '', handover_note: '', branch_id: this.a?.branch_id ?? null, location: '', department_id: null, custodian_employee_id: null },
      return: { return_date: d, condition: 'healthy', accessories_returned: true, missing_items: '', damage_found: false, damage_description: '', damage_estimate: 0, data_wiped: false, notes: '',
        return_request: this.a?.pending?.return?.id || null },
      transfer: { to_type: 'employee', to_employee_id: null, to_branch_id: null, to_location: '', to_department_id: null, transfer_date: d, reason: '' },
      maintenance: { kind: 'breakdown', schedule: null, vendor: '', start_date: d, cost: 0, reading: null, description: '' },
      schedule: { title: '', interval_value: 90, interval_type: 'days', last_done_date: d, last_done_reading: null, remind_days_before: 7, vendor: '', estimated_cost: 0 },
      damage: { damage_date: d, severity: 'minor', employee: null, repair_cost: 0, description: '' },
      loss: { kind: 'lost', loss_date: d, employee: null, place: '', police_report_no: '', description: '' },
      dispose: { method: 'sale', disposal_date: d, value: 0, buyer: '', reason: '' },
      upload: { kind: 'document' },
    };
    this.x = { ...(defaults[a] || {}) };
    this.act = a;
  }

  startFromPlan(s: any): void {
    this.openAct('maintenance');
    Object.assign(this.x, { kind: 'preventive', schedule: s.id, vendor: s.vendor, cost: s.estimated_cost, description: s.title });
  }

  closeMaint(m: any): void {
    this.closing = m;
    this.openAct('close');
    this.x = { end_date: today(), result: 'fixed', cost: m.cost, downtime_hours: null, reading: null, cancel: false, result_notes: '' };
  }

  async submit(): Promise<void> {
    this.err = '';
    this.busy = true;
    const id = this.id;
    try {
      let ok = 'Saved.';
      switch (this.act) {
        case 'allocate':
          await this.api.post(`assets/${id}/allocate/`, this.upl ? AssetApiService.form(this.x, { handover_file: this.upl }) : this.x);
          ok = 'Asset allocated. The employee confirms receipt in self-service.'; break;
        case 'return': {
          const res: any = await this.api.post(`assets/${id}/return/`, AssetApiService.form(this.x, { files: this.upls }));
          ok = res.detail; break;
        }
        case 'transfer': await this.api.post(`assets/${id}/transfer/`, this.x); ok = 'Transfer sent for approval.'; break;
        case 'maintenance': await this.api.post(`assets/${id}/maintenance/`, this.x); ok = 'The asset is now under maintenance.'; break;
        case 'close': await this.api.post(`maintenance/${this.closing.id}/close/`, AssetApiService.form(this.x, { files: this.upls })); ok = 'Maintenance completed.'; break;
        case 'schedule': await this.api.post('schedules/', { ...this.x, asset: id }); ok = 'Maintenance plan added.'; break;
        case 'damage': await this.api.post(`assets/${id}/damage/`, AssetApiService.form(this.x, { photos: this.upls })); ok = 'Damage reported – it waits for approval.'; break;
        case 'loss': await this.api.post(`assets/${id}/loss/`, AssetApiService.form(this.x, { police_report_file: this.upl })); ok = 'Loss reported – it waits for approval.'; break;
        case 'dispose': await this.api.post(`assets/${id}/dispose/`, this.x); ok = 'Disposal sent for approval.'; break;
        case 'upload':
          if (!this.upls.length) { this.err = 'Choose at least one file.'; this.busy = false; return; }
          await this.api.post(`assets/${id}/files/`, AssetApiService.form(this.x, { files: this.upls })); ok = 'Files uploaded.'; break;
      }
      this.act = '';
      this.done(ok);
    } catch (e: any) {
      this.err = AssetApiService.error(e, 'It could not be saved.');
    }
    this.busy = false;
    this.cd.markForCheck();
  }

  async editExpected(x: any): Promise<void> {
    const v = prompt('Expected return date (YYYY-MM-DD), empty to clear:', x.expected_return_date || '');
    if (v === null) return;
    try {
      await this.api.patch(`allocations/${x.id}/`, { expected_return_date: v || null });
      this.done('Expected return date saved.');
    } catch (e: any) { this.fail(e); }
  }

  async removePlan(s: any): Promise<void> {
    if (!confirm(`Remove the plan "${s.title}"?`)) return;
    try { await this.api.delete(`schedules/${s.id}/`); this.done('Plan removed.'); } catch (e: any) { this.fail(e); }
  }

  async removeFile(f: any): Promise<void> {
    if (!confirm(`Remove ${f.name}?`)) return;
    try { await this.api.delete(`assets/${this.id}/files/${f.id}/`); this.done('File removed.'); } catch (e: any) { this.fail(e); }
  }

  done(m: string): void { this.msg = m; this.msgErr = false; this.load(); }
  fail(e: any): void { this.msg = AssetApiService.error(e); this.msgErr = true; this.cd.markForCheck(); }
  print(): void { window.print(); }
  back(): void { this.router.navigate([ASSET_BASE, 'register']); }
  go(p: string): void { this.router.navigate([ASSET_BASE, p], { queryParams: { asset: this.id } }); }
  file(ev: Event): File | null { return (ev.target as HTMLInputElement).files?.[0] || null; }
  pickMany(ev: Event): File[] { return Array.from((ev.target as HTMLInputElement).files || []); }
  m(v: any, c?: string): string { return money(v, c || this.a?.currency || 'AED'); }
  abs(v: any): number { return Math.abs(+v || 0); }
  lbl(s: string): string { return STATUS_LABEL[s] || s; }
  cls(s: string): string { return STATUS_CLASS[s] || ''; }
  cond(c: string): string { return CONDITIONS.find(x => x.value === c)?.label || c; }
  dep(m: string): string { return ({ straight_line: 'Straight line', declining: 'Declining balance', none: 'No depreciation' } as any)[m] || m; }
  icon(e: string): string { return EVENT_ICON[e] || 'history'; }
  keys(o: any): string[] { return Object.keys(o || {}); }
  img(u: string): boolean { return isImage(u); }
  ext(n: string): string { return (n.split('.').pop() || 'FILE').toUpperCase().slice(0, 4); }
}
