/** v1.29.0 – Workflow rule editor: a five-step wizard (basics → trigger → conditions → actions → review & test). */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FLOW_CSS, FlowField, FlowMeta, FlowService } from './flow.service';
import { zToast } from '../shared-ui/z-toast';
import { TPipe } from '../shared-ui/i18n.service';

type Cond = { field?: string; operator?: string; value?: any; value2?: any; op?: string; items?: Cond[] };

@Component({
  selector: 'z-flow-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [FLOW_CSS],
  template: `
<div class="fw" *ngIf="w">
  <div class="fw-head">
    <div><h1>{{ (w.id ? 'Edit rule' : 'New rule') | t }} <span class="fw-chip" [ngClass]="w.state">{{ w.state }}</span></h1>
      <p>{{ 'When something happens to a record, check conditions, then do things – in order. Nothing to code.' | t }}</p></div>
    <span class="sp"></span>
    <a class="fw-btn" routerLink="/main-sidebar/automation/rules">{{ 'Back to rules' | t }}</a>
    <button class="fw-btn" (click)="save(false)" [disabled]="busy">{{ 'Save draft' | t }}</button>
    <button class="fw-btn primary" (click)="save(true)" [disabled]="busy">{{ (w.state === 'active' ? 'Save and publish' : 'Save and activate') | t }}</button>
  </div>
  <p class="fw-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>

  <div class="fw-steps">
    <button class="fw-step" *ngFor="let s of steps; let i = index" [class.on]="step === i" [class.done]="step > i" (click)="step = i"><b>{{ i + 1 }}</b> {{ s | t }}</button>
  </div>

  <!-- 1 basics -->
  <div class="fw-card" *ngIf="step === 0">
    <h2>{{ 'What is this rule about?' | t }}</h2>
    <div class="fw-form">
      <div class="fw-f"><label>{{ 'Rule name' | t }} *</label><input [(ngModel)]="w.name" placeholder="e.g. Probation review reminder"></div>
      <div class="fw-f"><label>{{ 'Module' | t }} *</label>
        <select [(ngModel)]="w.module" (ngModelChange)="onModule()"><option value="">{{ 'Choose…' | t }}</option><option *ngFor="let m of meta?.modules" [value]="m.key">{{ m.label }}</option></select></div>
      <div class="fw-f"><label>{{ 'Record type' | t }} *</label>
        <select [(ngModel)]="w.model" (ngModelChange)="onModel()"><option value="">{{ 'Choose…' | t }}</option><option *ngFor="let m of modelsOfModule()" [value]="m.key">{{ m.label }}</option></select>
        <div class="hint" *ngIf="w.trigger === 'schedule'">{{ 'Optional for a scheduled rule: with a record type the rule runs for every record that meets the conditions.' | t }}</div></div>
      <div class="fw-f"><label>{{ 'Owner' | t }}</label>
        <select [(ngModel)]="w.owner"><option [ngValue]="null">–</option><option *ngFor="let u of meta?.users" [ngValue]="u.id">{{ u.label }}</option></select></div>
      <div class="fw-f full"><label>{{ 'Description' | t }}</label><textarea [(ngModel)]="w.description" rows="2"></textarea></div>
    </div>
    <div class="fw-row" style="margin-top:12px"><span class="sp"></span><button class="fw-btn primary" (click)="step = 1">{{ 'Next: trigger' | t }}</button></div>
  </div>

  <!-- 2 trigger -->
  <div class="fw-card" *ngIf="step === 1">
    <h2>{{ 'When should it run?' | t }}</h2>
    <div class="fw-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
      <label class="fw-cond" *ngFor="let t of meta?.triggers" style="cursor:pointer;margin:0" [style.borderColor]="w.trigger === t.key ? '#5b4fe0' : ''">
        <input type="radio" name="trig" [value]="t.key" [(ngModel)]="w.trigger"> {{ t.label | t }}</label>
    </div>
    <div class="fw-form" style="margin-top:14px">
      <ng-container *ngIf="w.trigger === 'field_changed'">
        <div class="fw-f"><label>{{ 'Field to watch' | t }} *</label>
          <select [(ngModel)]="w.trigger_config.field"><option value="">{{ 'Choose…' | t }}</option><option *ngFor="let f of ownFields" [value]="f.key">{{ f.label }}</option></select></div>
        <div class="fw-f"><label>{{ 'Only when it changes from' | t }}</label><ng-container *ngTemplateOutlet="valueInput; context: { f: fieldByKey(w.trigger_config.field), m: w.trigger_config, k: 'from' }"></ng-container></div>
        <div class="fw-f"><label>{{ 'Only when it changes to' | t }}</label><ng-container *ngTemplateOutlet="valueInput; context: { f: fieldByKey(w.trigger_config.field), m: w.trigger_config, k: 'to' }"></ng-container></div>
      </ng-container>
      <ng-container *ngIf="w.trigger === 'date'">
        <div class="fw-f"><label>{{ 'Date field' | t }} *</label>
          <select [(ngModel)]="w.trigger_config.date_field"><option value="">{{ 'Choose…' | t }}</option><option *ngFor="let f of dateFields" [value]="f.key">{{ f.label }}</option></select></div>
        <div class="fw-f"><label>{{ 'Run' | t }}</label>
          <select [(ngModel)]="w.trigger_config.when"><option value="on">{{ 'On that date' | t }}</option><option value="before">{{ 'Days before' | t }}</option><option value="after">{{ 'Days after' | t }}</option></select></div>
        <div class="fw-f" *ngIf="w.trigger_config.when !== 'on'"><label>{{ 'Number of days' | t }}</label><input type="number" min="0" [(ngModel)]="w.trigger_config.offset_days"></div>
        <div class="fw-f full hint">{{ 'Checked every 15 minutes; runs once a day per record (e.g. "30 days before Visa expiry").' | t }}</div>
      </ng-container>
      <ng-container *ngIf="w.trigger === 'schedule'">
        <div class="fw-f"><label>{{ 'Every' | t }}</label>
          <select [(ngModel)]="w.trigger_config.every"><option value="hourly">{{ 'Hour' | t }}</option><option value="daily">{{ 'Day' | t }}</option><option value="weekly">{{ 'Week' | t }}</option><option value="monthly">{{ 'Month' | t }}</option></select></div>
        <div class="fw-f" *ngIf="w.trigger_config.every !== 'hourly'"><label>{{ 'At (company time)' | t }}</label><input type="time" [(ngModel)]="w.trigger_config.time"></div>
        <div class="fw-f" *ngIf="w.trigger_config.every === 'hourly'"><label>{{ 'At minute' | t }}</label><input type="time" [(ngModel)]="w.trigger_config.time"></div>
        <div class="fw-f" *ngIf="w.trigger_config.every === 'weekly'"><label>{{ 'Weekday' | t }}</label>
          <select [(ngModel)]="w.trigger_config.weekday"><option *ngFor="let d of weekdays; let i = index" [ngValue]="i">{{ d | t }}</option></select></div>
        <div class="fw-f" *ngIf="w.trigger_config.every === 'monthly'"><label>{{ 'Day of month' | t }}</label><input type="number" min="1" max="28" [(ngModel)]="w.trigger_config.day"></div>
      </ng-container>
      <div class="fw-f full hint" *ngIf="w.trigger === 'manual'">{{ 'Runs when a user presses "Run" on the rule (Rules page) for a chosen record, or through the API.' | t }}</div>
    </div>
    <h2 style="margin-top:18px">{{ 'Timing and limits' | t }}</h2>
    <div class="fw-form">
      <div class="fw-f"><label>{{ 'Wait before running (minutes)' | t }}</label><input type="number" min="0" [(ngModel)]="w.delay_minutes"><div class="hint">{{ '0 = immediately. A delayed start lets the record settle (e.g. 10 minutes after creation).' | t }}</div></div>
      <div class="fw-f"><label>{{ 'Runs per day (0 = no limit)' | t }}</label><input type="number" min="0" [(ngModel)]="w.max_runs_per_day"></div>
      <div class="fw-f"><label>&nbsp;</label><label class="fw-check"><input type="checkbox" [(ngModel)]="w.once_per_record"> {{ 'At most once per record' | t }}</label></div>
    </div>
    <div class="fw-row" style="margin-top:12px"><button class="fw-btn" (click)="step = 0">{{ 'Back' | t }}</button><span class="sp"></span><button class="fw-btn primary" (click)="step = 2">{{ 'Next: conditions' | t }}</button></div>
  </div>

  <!-- 3 conditions -->
  <div class="fw-card" *ngIf="step === 2">
    <h2>{{ 'Only if…' | t }} <span class="fw-muted">{{ '(optional – no condition = always)' | t }}</span></h2>
    <ng-container *ngTemplateOutlet="group; context: { g: w.conditions, depth: 0 }"></ng-container>
    <div class="fw-row" style="margin-top:12px"><button class="fw-btn" (click)="step = 1">{{ 'Back' | t }}</button><span class="sp"></span><button class="fw-btn primary" (click)="step = 3">{{ 'Next: actions' | t }}</button></div>
  </div>

  <!-- 4 actions -->
  <div class="fw-card" *ngIf="step === 3">
    <h2>{{ 'Then do, in this order' | t }}</h2>
    <ng-container *ngTemplateOutlet="actList; context: { list: w.actions, depth: 0 }"></ng-container>
    <div class="fw-row" style="margin-top:12px"><button class="fw-btn" (click)="step = 2">{{ 'Back' | t }}</button><span class="sp"></span><button class="fw-btn primary" (click)="step = 4">{{ 'Next: review' | t }}</button></div>
  </div>

  <!-- 5 review -->
  <div class="fw-card" *ngIf="step === 4">
    <h2>{{ 'Review' | t }}</h2>
    <div class="fw-grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
      <dl class="fw-preview">
        <dt>{{ 'Rule' | t }}</dt><dd><b>{{ w.name || '–' }}</b></dd>
        <dt>{{ 'Module · record type' | t }}</dt><dd>{{ moduleLabel() }} · {{ modelLabel(w.model) }}</dd>
        <dt>{{ 'Trigger' | t }}</dt><dd>{{ triggerText() }}</dd>
        <dt>{{ 'Conditions' | t }}</dt><dd>{{ condText(w.conditions) || ('Always' | t) }}</dd>
        <dt>{{ 'Actions' | t }}</dt><dd><ol style="margin:0;padding-left:18px"><li *ngFor="let a of w.actions">{{ actionText(a) }}</li></ol><span *ngIf="!w.actions.length">–</span></dd>
        <dt>{{ 'Timing' | t }}</dt><dd>{{ w.delay_minutes ? (w.delay_minutes + ' min after the trigger') : 'Immediately' }}<span *ngIf="w.once_per_record"> · once per record</span><span *ngIf="w.max_runs_per_day"> · max {{ w.max_runs_per_day }}/day</span></dd>
      </dl>
      <div>
        <div class="fw-msg err" *ngIf="problems.length"><b>{{ 'Before activating:' | t }}</b><ul style="margin:6px 0 0;padding-left:18px"><li *ngFor="let p of problems">{{ p }}</li></ul></div>
        <div class="fw-card" style="margin:0">
          <h2>{{ 'Test on a record' | t }}</h2>
          <p class="fw-muted">{{ 'A dry run: shows whether the conditions hold and what every action would do. Nothing is changed or sent.' | t }}</p>
          <div class="fw-row"><input style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;width:160px" type="number" placeholder="Record id" [(ngModel)]="testId">
            <button class="fw-btn" (click)="test()" [disabled]="!w.id || busy">{{ 'Test' | t }}</button><span class="fw-muted" *ngIf="!w.id">{{ 'Save the draft first.' | t }}</span></div>
          <div *ngIf="testRes" style="margin-top:10px">
            <div class="fw-row"><span class="fw-chip" [ngClass]="testRes.conditions_met ? 'ok' : 'skipped'">{{ testRes.conditions_met ? 'Conditions met' : 'Conditions not met' }}</span><span class="fw-muted">{{ testRes.record }}</span><span class="fw-chip bad" *ngIf="testRes.limit">{{ testRes.limit }}</span></div>
            <div class="fw-stepline" *ngFor="let s of testRes.actions"><span class="i">{{ s.index }}</span><div><b>{{ s.label }}</b><div class="fw-muted">{{ s.detail }}</div><pre *ngIf="s.body" class="fw-small" style="white-space:pre-wrap;background:#f7f7fb;padding:8px;border-radius:8px">{{ s.body }}</pre></div></div>
          </div>
        </div>
      </div>
    </div>
    <div class="fw-row" style="margin-top:12px"><button class="fw-btn" (click)="step = 3">{{ 'Back' | t }}</button><span class="sp"></span>
      <button class="fw-btn" (click)="save(false)" [disabled]="busy">{{ 'Save draft' | t }}</button>
      <button class="fw-btn primary" (click)="save(true)" [disabled]="busy || problems.length > 0">{{ (w.state === 'active' ? 'Save and publish' : 'Save and activate') | t }}</button></div>
  </div>
</div>

<!-- ============ templates ============ -->
<ng-template #group let-g="g" let-depth="depth">
  <div class="fw-cond">
    <div class="fw-row" style="margin-bottom:4px">
      <span class="fw-op"><button type="button" [class.on]="(g.op || 'and') === 'and'" (click)="g.op = 'and'">{{ 'ALL of' | t }}</button><button type="button" [class.on]="g.op === 'or'" (click)="g.op = 'or'">{{ 'ANY of' | t }}</button></span>
      <span class="fw-muted" *ngIf="!g.items?.length">{{ 'no condition yet' | t }}</span>
      <span class="sp"></span>
      <button type="button" class="fw-btn sm" (click)="addCond(g)">+ {{ 'Condition' | t }}</button>
      <button type="button" class="fw-btn sm" *ngIf="depth < 2" (click)="addGroup(g)">+ {{ 'Group' | t }}</button>
    </div>
    <ng-container *ngFor="let c of g.items; let i = index">
      <div class="fw-cond-line" *ngIf="!c.items">
        <select [(ngModel)]="c.field" (ngModelChange)="onCondField(c)"><option value="">{{ 'Field…' | t }}</option>
          <optgroup [label]="'Fields' | t"><option *ngFor="let f of ownFields" [value]="f.key">{{ f.label }}</option></optgroup>
          <optgroup [label]="'Linked records' | t" *ngIf="relFields.length"><option *ngFor="let f of relFields" [value]="f.key">{{ f.label }}</option></optgroup></select>
        <select [(ngModel)]="c.operator"><option *ngFor="let o of opsFor(c.field)" [value]="o.key">{{ o.label | t }}</option></select>
        <div class="fw-row" style="flex-wrap:nowrap">
          <ng-container *ngIf="needsValue(c.operator)"><ng-container *ngTemplateOutlet="valueInput; context: { f: fieldByKey(c.field), m: c, k: 'value' }"></ng-container></ng-container>
          <ng-container *ngIf="needsValue2(c.operator)"><span class="fw-muted">–</span><ng-container *ngTemplateOutlet="valueInput; context: { f: fieldByKey(c.field), m: c, k: 'value2' }"></ng-container></ng-container>
        </div>
        <button type="button" class="fw-ic" (click)="g.items.splice(i, 1)" title="Remove"><span class="material-icons">close</span></button>
      </div>
      <div *ngIf="c.items" style="position:relative"><ng-container *ngTemplateOutlet="group; context: { g: c, depth: depth + 1 }"></ng-container>
        <button type="button" class="fw-ic" style="position:absolute;top:8px;right:8px" (click)="g.items.splice(i, 1)"><span class="material-icons">close</span></button></div>
    </ng-container>
  </div>
</ng-template>

<ng-template #valueInput let-f="f" let-m="m" let-k="k">
  <ng-container [ngSwitch]="f?.type">
    <select *ngSwitchCase="'choice'" [(ngModel)]="m[k]"><option value="">–</option><option *ngFor="let c of f.choices" [value]="c.value">{{ c.label }}</option></select>
    <select *ngSwitchCase="'bool'" [(ngModel)]="m[k]"><option value="true">Yes</option><option value="false">No</option></select>
    <input *ngSwitchCase="'date'" [(ngModel)]="m[k]" placeholder="yyyy-mm-dd or today, today+30">
    <input *ngSwitchCase="'datetime'" [(ngModel)]="m[k]" placeholder="yyyy-mm-dd or today">
    <input *ngSwitchCase="'number'" type="number" [(ngModel)]="m[k]">
    <ng-container *ngSwitchCase="'link'">
      <select *ngIf="f.user" [(ngModel)]="m[k]"><option value="">–</option><option *ngFor="let u of meta?.users" [value]="u.id">{{ u.label }}</option></select>
      <input *ngIf="!f.user" [(ngModel)]="m[k]" [placeholder]="'id, code or name of the ' + (f.link_label || 'record')">
    </ng-container>
    <input *ngSwitchDefault [(ngModel)]="m[k]" placeholder="value">
  </ng-container>
</ng-template>

<ng-template #actList let-list="list" let-depth="depth">
  <ng-container *ngFor="let a of list; let i = index">
    <div class="fw-act" [class.sub]="depth > 0">
      <header><span class="n">{{ i + 1 }}</span><b>{{ actionLabel(a.type) }}<span class="fw-muted" *ngIf="a.label"> · {{ a.label }}</span></b>
        <label class="fw-check fw-small"><input type="checkbox" [(ngModel)]="a.disabled"> {{ 'disabled' | t }}</label>
        <button type="button" class="fw-ic" (click)="move(list, i, -1)" [disabled]="i === 0" title="Up"><span class="material-icons">arrow_upward</span></button>
        <button type="button" class="fw-ic" (click)="move(list, i, 1)" [disabled]="i === list.length - 1" title="Down"><span class="material-icons">arrow_downward</span></button>
        <button type="button" class="fw-ic" (click)="list.splice(i, 1)" title="Remove"><span class="material-icons">delete_outline</span></button></header>
      <div class="body">
        <div class="fw-form">
          <div class="fw-f full" *ngIf="a.type === 'send_email' || a.type === 'notify'"><label>{{ 'To' | t }} *</label><ng-container *ngTemplateOutlet="recList; context: { list: a.to }"></ng-container></div>
          <ng-container *ngIf="a.type === 'send_email'">
            <div class="fw-f"><label>{{ 'Template' | t }}</label><select [(ngModel)]="a.template"><option [ngValue]="null">{{ '– write it here –' | t }}</option><option *ngFor="let t of emailTemplates()" [ngValue]="t.id">{{ t.name }}</option></select></div>
            <div class="fw-f" *ngIf="!a.template"><label>{{ 'Subject' | t }} *</label><input [(ngModel)]="a.subject"></div>
            <div class="fw-f full" *ngIf="!a.template"><label>{{ 'Message' | t }}</label><textarea [(ngModel)]="a.body" rows="4"></textarea><ng-container *ngTemplateOutlet="vars"></ng-container></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'notify'">
            <div class="fw-f"><label>{{ 'Template' | t }}</label><select [(ngModel)]="a.template"><option [ngValue]="null">{{ '– write it here –' | t }}</option><option *ngFor="let t of inappTemplates()" [ngValue]="t.id">{{ t.name }}</option></select></div>
            <div class="fw-f" *ngIf="!a.template"><label>{{ 'Title' | t }}</label><input [(ngModel)]="a.title"></div>
            <div class="fw-f full" *ngIf="!a.template"><label>{{ 'Message' | t }} *</label><textarea [(ngModel)]="a.message" rows="2"></textarea><ng-container *ngTemplateOutlet="vars"></ng-container></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'create_task'">
            <div class="fw-f full"><label>{{ 'Assign to' | t }}</label><ng-container *ngTemplateOutlet="recList; context: { list: a.assign }"></ng-container></div>
            <div class="fw-f"><label>{{ 'Type' | t }}</label><select [(ngModel)]="a.activity_type"><option value="todo">To-do</option><option value="call">Call</option><option value="meeting">Meeting</option><option value="email">E-mail</option><option value="follow_up">Follow-up</option><option value="document">Upload document</option></select></div>
            <div class="fw-f"><label>{{ 'Due in (days)' | t }}</label><input type="number" min="0" [(ngModel)]="a.due_in_days"></div>
            <div class="fw-f full"><label>{{ 'Summary' | t }} *</label><input [(ngModel)]="a.summary" [placeholder]="'e.g. Probation review: ' + ob + ' record.emp_code ' + cb"></div>
            <div class="fw-f full"><label>{{ 'Note' | t }}</label><textarea [(ngModel)]="a.note" rows="2"></textarea><ng-container *ngTemplateOutlet="vars"></ng-container></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'update_fields'">
            <div class="fw-f full"><label>{{ 'Set these fields' | t }}</label>
              <div class="fw-cond-line" *ngFor="let kv of a._fields; let j = index" style="grid-template-columns:minmax(160px,1fr) minmax(160px,1.4fr) auto">
                <select [(ngModel)]="kv.k"><option value="">{{ 'Field…' | t }}</option><option *ngFor="let f of writableFields" [value]="f.key">{{ f.label }}</option></select>
                <ng-container *ngTemplateOutlet="valueInput; context: { f: fieldByKey(kv.k), m: kv, k: 'v' }"></ng-container>
                <button type="button" class="fw-ic" (click)="a._fields.splice(j, 1)"><span class="material-icons">close</span></button></div>
              <button type="button" class="fw-btn sm" (click)="a._fields.push({ k: '', v: '' })">+ {{ 'Field' | t }}</button>
              <div class="hint">{{ hintValue }}</div></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'create_record'">
            <div class="fw-f"><label>{{ 'Record type' | t }} *</label><select [(ngModel)]="a.model" (ngModelChange)="loadFieldsFor(a.model)"><option value="">{{ 'Choose…' | t }}</option><optgroup *ngFor="let m of meta?.modules" [label]="m.label"><option *ngFor="let mm of modelsOfModule(m.key)" [value]="mm.key">{{ mm.label }}</option></optgroup></select></div>
            <div class="fw-f"><label>&nbsp;</label><label class="fw-check"><input type="checkbox" [(ngModel)]="a.link_back"> {{ 'Link it to this record' | t }}</label></div>
            <div class="fw-f full"><label>{{ 'Fields of the new record' | t }}</label>
              <div class="fw-cond-line" *ngFor="let kv of a._fields; let j = index" style="grid-template-columns:minmax(160px,1fr) minmax(160px,1.4fr) auto">
                <select [(ngModel)]="kv.k"><option value="">{{ 'Field…' | t }}</option><option *ngFor="let f of fieldsFor[a.model] || []" [value]="f.key">{{ f.label }}{{ f.required ? ' *' : '' }}</option></select>
                <ng-container *ngTemplateOutlet="valueInput; context: { f: fieldOf(a.model, kv.k), m: kv, k: 'v' }"></ng-container>
                <button type="button" class="fw-ic" (click)="a._fields.splice(j, 1)"><span class="material-icons">close</span></button></div>
              <button type="button" class="fw-btn sm" (click)="a._fields.push({ k: '', v: '' })">+ {{ 'Field' | t }}</button>
              <div class="hint">{{ hintCreate }}</div></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'assign_owner'">
            <div class="fw-f"><label>{{ 'User field to set' | t }} *</label><select [(ngModel)]="a.field"><option value="">{{ 'Choose…' | t }}</option><option *ngFor="let f of userFields" [value]="f.key">{{ f.label }}</option></select></div>
            <div class="fw-f"><label>{{ 'Assign' | t }}</label><select [(ngModel)]="a.how"><option value="user">{{ 'A user' | t }}</option><option value="role">{{ 'First user of a role' | t }}</option><option value="round_robin">{{ 'Round robin in a role' | t }}</option><option value="manager">{{ "The employee's manager" | t }}</option><option value="owner">{{ 'The record owner' | t }}</option><option value="triggering_user">{{ 'The user who made the change' | t }}</option></select></div>
            <div class="fw-f" *ngIf="a.how === 'user'"><label>{{ 'User' | t }}</label><select [(ngModel)]="a.value"><option value="">–</option><option *ngFor="let u of meta?.users" [value]="u.id">{{ u.label }}</option></select></div>
            <div class="fw-f" *ngIf="a.how === 'role' || a.how === 'round_robin'"><label>{{ 'Role' | t }}</label><select [(ngModel)]="a.role"><option value="">–</option><option *ngFor="let r of meta?.roles" [value]="r.id">{{ r.label }}</option></select></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'submit_approval'">
            <div class="fw-f"><label>{{ 'Approval flow' | t }} *</label><select [(ngModel)]="a.flow"><option [ngValue]="null">{{ 'Choose…' | t }}</option><option *ngFor="let f of flowsForModel()" [ngValue]="f.id">{{ f.name }}</option></select>
              <div class="hint"><a class="fw-link" routerLink="/main-sidebar/automation/approval-flows">{{ 'Manage approval flows' | t }}</a></div></div>
            <div class="fw-f"><label>{{ 'Note to the approvers' | t }}</label><input [(ngModel)]="a.note"></div>
            <div class="fw-f full"><label>{{ 'When approved, do' | t }}</label><ng-container *ngTemplateOutlet="actList; context: { list: a.on_approved, depth: depth + 1 }"></ng-container></div>
            <div class="fw-f full"><label>{{ 'When rejected, do' | t }}</label><ng-container *ngTemplateOutlet="actList; context: { list: a.on_rejected, depth: depth + 1 }"></ng-container></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'wait'">
            <div class="fw-f"><label>{{ 'Days' | t }}</label><input type="number" min="0" [(ngModel)]="a.days"></div>
            <div class="fw-f"><label>{{ 'Hours' | t }}</label><input type="number" min="0" [(ngModel)]="a.hours"></div>
            <div class="fw-f"><label>{{ 'Minutes' | t }}</label><input type="number" min="0" [(ngModel)]="a.minutes"></div>
            <div class="fw-f"><label>{{ 'or until a date field' | t }}</label><select [(ngModel)]="a.until_field"><option value="">–</option><option *ngFor="let f of dateFields" [value]="f.key">{{ f.label }}</option></select></div>
            <div class="fw-f" *ngIf="a.until_field"><label>{{ 'Days before (−) / after (+)' | t }}</label><input type="number" [(ngModel)]="a.offset_days"></div>
          </ng-container>
          <ng-container *ngIf="a.type === 'branch'">
            <div class="fw-f full"><label>{{ 'If' | t }}</label><ng-container *ngTemplateOutlet="group; context: { g: a.conditions, depth: 1 }"></ng-container></div>
            <div class="fw-f full"><label>{{ 'Then' | t }}</label><ng-container *ngTemplateOutlet="actList; context: { list: a.then, depth: depth + 1 }"></ng-container></div>
            <div class="fw-f full"><label>{{ 'Else' | t }}</label><ng-container *ngTemplateOutlet="actList; context: { list: a.else, depth: depth + 1 }"></ng-container></div>
          </ng-container>
          <div class="fw-f full" *ngIf="a.type === 'stop'"><label>{{ 'Note' | t }}</label><input [(ngModel)]="a.note"></div>
          <div class="fw-f"><label>{{ 'Label (optional)' | t }}</label><input [(ngModel)]="a.label"></div>
          <div class="fw-f"><label>{{ 'If this action fails' | t }}</label><select [(ngModel)]="a.on_error"><option value="">{{ 'Stop the run (default)' | t }}</option><option value="continue">{{ 'Continue with the next action' | t }}</option></select></div>
        </div>
      </div>
    </div>
  </ng-container>
  <div class="fw-row" style="margin:8px 0 4px" [style.marginLeft.px]="depth > 0 ? 18 : 0">
    <select style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;max-width:520px" #pick><option value="">+ {{ 'Add an action…' | t }}</option><option *ngFor="let t of meta?.actions" [value]="t.key" [disabled]="depth > 1 && (t.key === 'branch' || t.key === 'submit_approval')">{{ t.label }} — {{ t.hint }}</option></select>
    <button type="button" class="fw-btn sm primary" (click)="addAction(list, pick.value); pick.value = ''">{{ 'Add' | t }}</button>
  </div>
</ng-template>

<ng-template #recList let-list="list">
  <div class="fw-rec" *ngFor="let r of list; let j = index">
    <select style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;max-width:260px" [(ngModel)]="r.type"><option *ngFor="let t of meta?.recipient_types" [value]="t.key">{{ t.label | t }}</option></select>
    <select *ngIf="r.type === 'user'" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px" [(ngModel)]="r.value"><option value="">–</option><option *ngFor="let u of meta?.users" [value]="u.id">{{ u.label }}</option></select>
    <select *ngIf="r.type === 'role'" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px" [(ngModel)]="r.value"><option value="">–</option><option *ngFor="let g of meta?.roles" [value]="g.id">{{ g.label }}</option></select>
    <select *ngIf="r.type === 'field'" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px" [(ngModel)]="r.value"><option value="">–</option><option *ngFor="let f of userOrEmailFields" [value]="f.key">{{ f.label }}</option></select>
    <input *ngIf="r.type === 'email'" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;min-width:220px" [(ngModel)]="r.value" [placeholder]="'name@company.com, ' + ob + ' record.emp_personal_email ' + cb">
    <button type="button" class="fw-ic" (click)="list.splice(j, 1)"><span class="material-icons">close</span></button>
  </div>
  <button type="button" class="fw-btn sm" (click)="list.push({ type: 'owner', value: '' })">+ {{ 'Recipient' | t }}</button>
</ng-template>

<ng-template #vars><div class="fw-vars"><span class="fw-muted">{{ 'Variables:' | t }}</span><code *ngFor="let v of varList()">{{ v }}</code></div></ng-template>
  `,
})
export class FlowEditorComponent implements OnInit {
  w: any = null;
  meta: FlowMeta | null = null;
  fields: FlowField[] = [];
  fieldsFor: Record<string, FlowField[]> = {};
  step = 0; busy = false; msg = ''; msgErr = false; testId: any = ''; testRes: any = null;
  steps = ['Basics', 'Trigger', 'Conditions', 'Actions', 'Review & test'];
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  ob = '{{'; cb = '}}';
  hintValue = 'A value may use variables, e.g. {{ today }} or {{ record.emp_code }}.';
  hintCreate = 'Use {{ record.<field> }} to copy a value from the record that triggered the rule; "{{ record }}" links the record itself.';

  constructor(private api: FlowService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.meta = await this.api.meta();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      try { this.w = this.unpack(await this.api.get(`workflows/${id}/`)); } catch (e) { this.msg = this.api.err(e, 'The rule could not be loaded.'); this.msgErr = true; }
    } else {
      this.w = { name: '', description: '', module: this.route.snapshot.queryParamMap.get('module') || '', model: this.route.snapshot.queryParamMap.get('model') || '',
        trigger: 'created', trigger_config: { when: 'on', every: 'daily', time: '08:00', weekday: 0, day: 1 }, conditions: { op: 'and', items: [] }, actions: [],
        delay_minutes: 0, once_per_record: false, max_runs_per_day: 0, owner: null, state: 'draft' };
    }
    await this.onModel(false);
    this.cd.markForCheck();
  }

  // ---- fields
  get ownFields(): FlowField[] { return this.fields.filter(f => !f.related); }
  get relFields(): FlowField[] { return this.fields.filter(f => !!f.related); }
  get dateFields(): FlowField[] { return this.ownFields.filter(f => f.type === 'date' || f.type === 'datetime'); }
  get userFields(): FlowField[] { return this.ownFields.filter(f => f.type === 'link' && f.user); }
  get userOrEmailFields(): FlowField[] { return this.ownFields.filter(f => (f.type === 'link' && (f.user || f.employee)) || f.type === 'email'); }
  get writableFields(): FlowField[] { return this.ownFields.filter(f => f.key !== 'id' && !f.many); }
  fieldByKey(k: string): FlowField | undefined { return this.fields.find(f => f.key === k); }
  fieldOf(model: string, k: string): FlowField | undefined { return (this.fieldsFor[model] || []).find(f => f.key === k); }
  modelsOfModule(m = this.w?.module) { return (this.meta?.models || []).filter(x => !m || x.module === m); }
  modelLabel(k: string) { return this.meta?.models.find(m => m.key === k)?.label || k || '–'; }
  moduleLabel() { return this.meta?.modules.find(m => m.key === this.w.module)?.label || this.w.module || '–'; }
  onModule() { if (this.w.model && !this.modelsOfModule().some(m => m.key === this.w.model)) { this.w.model = ''; this.fields = []; } }
  async onModel(reset = true) {
    if (reset) { this.w.trigger_config.field = ''; this.w.trigger_config.date_field = ''; }
    if (this.w.model) {
      const m = this.meta?.models.find(x => x.key === this.w.model); if (m && !this.w.module) { this.w.module = m.module; }
      try { this.fields = await this.api.fields(this.w.model); } catch { this.fields = []; }
    } else { this.fields = []; }
    this.cd.markForCheck();
  }
  async loadFieldsFor(model: string) { if (model && !this.fieldsFor[model]) { try { this.fieldsFor[model] = (await this.api.fields(model)).filter(f => !f.related && f.key !== 'id'); } catch { this.fieldsFor[model] = []; } this.cd.markForCheck(); } }

  // ---- conditions
  opsFor(field: string) {
    const f = this.fieldByKey(field); const type = f?.type === 'email' ? 'text' : (f?.type || 'text');
    const keys = this.meta?.operators_by_type[type] || this.meta?.operators_by_type['text'] || [];
    return (this.meta?.operators || []).filter(o => keys.includes(o.key));
  }
  needsValue(op: string) { return !['empty', 'not_empty', 'true', 'false', 'date_today', 'date_overdue', 'changed', 'related_exists', 'related_not_exists'].includes(op || ''); }
  needsValue2(op: string) { return op === 'between' || op === 'not_between'; }
  addCond(g: Cond) { g.items = g.items || []; g.items.push({ field: '', operator: 'eq', value: '' }); }
  addGroup(g: Cond) { g.items = g.items || []; g.items.push({ op: 'and', items: [] }); }
  onCondField(c: Cond) { const ops = this.opsFor(c.field || ''); if (!ops.some(o => o.key === c.operator)) { c.operator = ops[0]?.key || 'eq'; } }
  condText(g: Cond): string {
    if (!g || !g.items?.length) { return ''; }
    const parts = g.items.map(i => i.items ? `(${this.condText(i)})` : `${this.fieldByKey(i.field || '')?.label || i.field} ${this.meta?.operators.find(o => o.key === i.operator)?.label?.toLowerCase() || i.operator} ${this.needsValue(i.operator || '') ? (i.value ?? '') : ''}${this.needsValue2(i.operator || '') ? ' – ' + (i.value2 ?? '') : ''}`.trim());
    return parts.join(g.op === 'or' ? ' OR ' : ' AND ');
  }

  // ---- actions
  actionLabel(t: string) { return this.meta?.actions.find(a => a.key === t)?.label || t; }
  addAction(list: any[], type: string) {
    if (!type) { return; }
    const a: any = { type, label: '', on_error: '' };
    if (type === 'send_email' || type === 'notify') { a.to = [{ type: 'owner', value: '' }]; a.template = null; }
    if (type === 'create_task') { a.assign = [{ type: 'owner', value: '' }]; a.activity_type = 'todo'; a.due_in_days = 3; }
    if (type === 'update_fields' || type === 'create_record') { a._fields = [{ k: '', v: '' }]; a.link_back = true; }
    if (type === 'assign_owner') { a.how = 'user'; }
    if (type === 'submit_approval') { a.flow = null; a.on_approved = []; a.on_rejected = []; }
    if (type === 'branch') { a.conditions = { op: 'and', items: [] }; a.then = []; a.else = []; }
    if (type === 'wait') { a.days = 1; }
    list.push(a);
  }
  move(list: any[], i: number, d: number) { const j = i + d; if (j < 0 || j >= list.length) { return; } [list[i], list[j]] = [list[j], list[i]]; }
  emailTemplates() { return (this.meta?.templates || []).filter(t => t.kind !== 'inapp'); }
  inappTemplates() { return (this.meta?.templates || []).filter(t => t.kind !== 'email'); }
  flowsForModel() { return (this.meta?.approval_flows || []).filter(f => !f.model || f.model === this.w.model); }
  varList() { return (this.meta?.variables || []); }
  actionText(a: any): string {
    const l = this.actionLabel(a.type);
    const rec = (list: any[]) => (list || []).map(r => r.type === 'user' ? (this.meta?.users.find(u => String(u.id) === String(r.value))?.label || 'user') : r.type === 'role' ? (this.meta?.roles.find(g => String(g.id) === String(r.value))?.label || 'role') : r.type === 'email' ? r.value : (this.meta?.recipient_types.find(t => t.key === r.type)?.label || r.type)).join(', ');
    if (a.type === 'send_email') { return `${l} to ${rec(a.to)} – ${a.subject || 'template'}`; }
    if (a.type === 'notify') { return `${l} to ${rec(a.to)} – ${a.title || a.message || ''}`; }
    if (a.type === 'create_task') { return `${l}: ${a.summary || ''} → ${rec(a.assign)}`; }
    if (a.type === 'update_fields') { return `${l}: ${(a._fields || []).filter((x: any) => x.k).map((x: any) => `${x.k} = ${x.v}`).join(', ')}`; }
    if (a.type === 'create_record') { return `${l}: ${this.modelLabel(a.model)}`; }
    if (a.type === 'submit_approval') { return `${l}: ${this.meta?.approval_flows.find(f => f.id === a.flow)?.name || '?'}`; }
    if (a.type === 'wait') { return `${l} ${a.until_field ? 'until ' + a.until_field : `${a.days || 0}d ${a.hours || 0}h ${a.minutes || 0}m`}`; }
    if (a.type === 'branch') { return `${l}: if ${this.condText(a.conditions) || 'always'} → ${(a.then || []).length} action(s), else ${(a.else || []).length}`; }
    return l + (a.label ? ' · ' + a.label : '');
  }

  // ---- pack / unpack (the fields map is edited as a list)
  private unpack(w: any) {
    const walk = (list: any[]) => (list || []).forEach(a => {
      if (a.type === 'update_fields' || a.type === 'create_record') { a._fields = Object.entries(a.fields || {}).map(([k, v]) => ({ k, v })); if (!a._fields.length) { a._fields = [{ k: '', v: '' }]; } }
      if (a.type === 'branch') { a.conditions = a.conditions || { op: 'and', items: [] }; a.then = a.then || []; a.else = a.else || []; walk(a.then); walk(a.else); }
      if (a.type === 'submit_approval') { a.on_approved = a.on_approved || []; a.on_rejected = a.on_rejected || []; walk(a.on_approved); walk(a.on_rejected); }
      if (a.type === 'send_email' || a.type === 'notify') { a.to = a.to || []; a.template = a.template ?? null; }
      if (a.type === 'create_task') { a.assign = a.assign || []; }
      a.on_error = a.on_error || '';
      (a.to || a.assign || []).forEach((r: any) => {   // roles written by name (API) → the id the picker uses
        if (r.type === 'role' && r.value && isNaN(Number(r.value))) { const g = this.meta?.roles.find(x => x.label.toLowerCase() === String(r.value).toLowerCase()); if (g) { r.value = String(g.id); } }
        if (r.value !== undefined && r.value !== null) { r.value = String(r.value); }
      });
    });
    w.conditions = w.conditions && w.conditions.items ? w.conditions : { op: 'and', items: [] };
    w.trigger_config = { when: 'on', every: 'daily', time: '08:00', weekday: 0, day: 1, ...(w.trigger_config || {}) };
    w.actions = w.actions || [];
    walk(w.actions);
    return w;
  }
  private pack(): any {
    const clone = JSON.parse(JSON.stringify(this.w));
    const prune = (g: any) => { if (!g || !g.items) { return g; } g.items = g.items.filter((i: any) => i.items ? (prune(i), i.items.length > 0) : !!i.field); return g; };
    prune(clone.conditions);
    const walk = (list: any[]) => (list || []).forEach(a => {
      if (a.type === 'branch') { prune(a.conditions); }
      if (a._fields) { a.fields = {}; a._fields.forEach((x: any) => { if (x.k) { a.fields[x.k] = x.v; } }); delete a._fields; }
      walk(a.then); walk(a.else); walk(a.on_approved); walk(a.on_rejected);
    });
    walk(clone.actions);
    ['problems', 'summary', 'owner_name', 'model_label', 'module_label', 'trigger_label', 'history', 'runs_count', 'errors_count', 'last_run_at', 'published_at', 'version'].forEach(k => delete clone[k]);
    return clone;
  }
  get problems(): string[] {
    const p: string[] = [];
    if (!this.w.name) { p.push('Give the rule a name.'); }
    if (this.w.trigger !== 'schedule' && !this.w.model) { p.push('Choose the record type.'); }
    if (this.w.trigger === 'field_changed' && !this.w.trigger_config.field) { p.push('Choose the field to watch.'); }
    if (this.w.trigger === 'date' && !this.w.trigger_config.date_field) { p.push('Choose the date field.'); }
    if (!this.w.actions.length) { p.push('Add at least one action.'); }
    this.w.actions.forEach((a: any, i: number) => {
      if ((a.type === 'send_email' || a.type === 'notify') && !(a.to || []).length) { p.push(`Action ${i + 1}: choose who receives it.`); }
      if (a.type === 'send_email' && !a.template && !a.subject) { p.push(`Action ${i + 1}: a subject or a template.`); }
      if (a.type === 'update_fields' && !(a._fields || []).some((x: any) => x.k)) { p.push(`Action ${i + 1}: choose the fields to set.`); }
      if (a.type === 'create_record' && !a.model) { p.push(`Action ${i + 1}: choose the record type to create.`); }
      if (a.type === 'submit_approval' && !a.flow) { p.push(`Action ${i + 1}: choose the approval flow.`); }
      if (a.type === 'wait' && !(a.days || a.hours || a.minutes || a.until_field)) { p.push(`Action ${i + 1}: a duration or a date field.`); }
      if (a.type === 'assign_owner' && !a.field) { p.push(`Action ${i + 1}: choose the user field to set.`); }
    });
    return p;
  }

  async save(activate: boolean): Promise<void> {
    this.busy = true; this.msg = '';
    try {
      const body = this.pack();
      let saved: any;
      if (this.w.id) { saved = await this.api.patch(`workflows/${this.w.id}/`, body); } else { saved = await this.api.post('workflows/', body); }
      if (activate) { saved = await this.api.post(`workflows/${saved.id}/activate/`); zToast(`"${saved.name}" is active (version ${saved.version}).`, 'ok'); }
      else { zToast('Draft saved.', 'ok'); }
      const isNew = !this.w.id;
      this.w = this.unpack(saved);
      await this.api.meta(true);
      if (isNew) { this.router.navigate(['/main-sidebar/automation/rules', saved.id], { replaceUrl: true }); }
    } catch (e) { this.msg = this.api.err(e, 'The rule could not be saved.'); this.msgErr = true; }
    this.busy = false; this.cd.markForCheck();
  }
  async test(): Promise<void> {
    this.busy = true; this.testRes = null;
    try { await this.api.patch(`workflows/${this.w.id}/`, this.pack()); this.testRes = await this.api.post(`workflows/${this.w.id}/test/`, { id: this.testId }); }
    catch (e) { zToast(this.api.err(e, 'The test could not run.'), 'err'); }
    this.busy = false; this.cd.markForCheck();
  }
  triggerText(): string {
    const c = this.w.trigger_config || {}; const t = this.meta?.triggers.find(x => x.key === this.w.trigger)?.label || this.w.trigger;
    if (this.w.trigger === 'field_changed') { return `When ${this.fieldByKey(c.field)?.label || c.field || '?'} changes${c.from ? ' from ' + c.from : ''}${c.to ? ' to ' + c.to : ''}`; }
    if (this.w.trigger === 'date') { return c.when === 'on' ? `On ${this.fieldByKey(c.date_field)?.label || '?'}` : `${c.offset_days || 0} days ${c.when} ${this.fieldByKey(c.date_field)?.label || '?'}`; }
    if (this.w.trigger === 'schedule') { return `Every ${c.every || 'day'} at ${c.time || '08:00'}${c.every === 'weekly' ? ' on ' + this.weekdays[c.weekday || 0] : ''}${c.every === 'monthly' ? ' on day ' + (c.day || 1) : ''}`; }
    return t;
  }
}
