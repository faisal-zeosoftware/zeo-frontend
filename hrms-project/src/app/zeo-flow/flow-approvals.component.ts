// v1.62.0 ui: dates dd/MM/yyyy
/** v1.29.0 – Approval engine screens: My approvals (decide / delegate / resubmit) and Approval flows (the chains). */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FLOW_CSS, FlowMeta, FlowService } from './flow.service';
import { zToast } from '../shared-ui/z-toast';
import { SessionService } from '../login/session.service';
import { TPipe } from '../shared-ui/i18n.service';
import { ZListDirective } from '../shared-ui/z-list.directive';

const IMPORTS = [CommonModule, FormsModule, RouterModule, TPipe, ZListDirective];   // v1.38.0: the HRMS list bar (search, views, columns, export) on the lists

@Component({
  selector: 'z-flow-approvals', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw">
  <div class="fw-head"><div><h1>{{ 'Approvals' | t }}</h1><p>{{ 'Requests waiting for your decision, the ones you submitted, and the history. Approve, reject with a comment, ask for changes or delegate.' | t }}</p></div>
    <span class="sp"></span><button class="fw-btn" (click)="load()">{{ 'Refresh' | t }}</button></div>
  <div class="fw-tabs"><button [class.on]="box === 'mine'" (click)="box = 'mine'; load()">{{ 'For me' | t }}</button><button [class.on]="box === 'submitted'" (click)="box = 'submitted'; load()">{{ 'Submitted by me' | t }}</button><button [class.on]="box === 'history'" (click)="box = 'history'; load()">{{ 'History' | t }}</button><button *ngIf="meta?.can_configure" [class.on]="box === 'all'" (click)="box = 'all'; load()">{{ 'All (admin)' | t }}</button></div>
  <div class="fw-card" style="padding:0;overflow:hidden">
    <table class="fw-table"><thead><tr><th>{{ 'Submitted' | t }}</th><th>{{ 'Record' | t }}</th><th>{{ 'Flow' | t }}</th><th>{{ 'By' | t }}</th><th>{{ 'Level' | t }}</th><th>{{ 'Status' | t }}</th><th></th></tr></thead>
      <tbody><tr *ngFor="let r of rows" (click)="sel = r" style="cursor:pointer">
        <td class="fw-muted" style="white-space:nowrap">{{ r.submitted_at | date:'dd/MM/yyyy HH:mm' }}</td><td><b>{{ r.record_label }}</b><div class="fw-small fw-muted">{{ r.model_label }}<span *ngIf="r.amount"> · {{ r.amount | number:'1.2-2' }}</span></div></td>
        <td>{{ r.flow_name }}</td><td>{{ r.submitted_by_name }}</td><td>{{ levelText(r) }}</td><td><span class="fw-chip" [ngClass]="r.status">{{ r.status_label }}</span><span class="fw-chip bad" *ngIf="overdue(r)">{{ 'overdue' | t }}</span></td>
        <td style="white-space:nowrap" (click)="$event.stopPropagation()"><ng-container *ngFor="let s of actSteps(r)"><button class="fw-btn sm primary" (click)="open(r, s, 'approved')">{{ 'Approve' | t }}</button> <button class="fw-btn sm danger" (click)="open(r, s, 'rejected')">{{ 'Reject' | t }}</button></ng-container></td></tr>
      <tr *ngIf="!rows.length && loaded"><td colspan="7" class="fw-empty">{{ 'Nothing here.' | t }}</td></tr></tbody></table></div>

  <div class="fw-back" *ngIf="sel" (click)="sel = null"></div>
  <div class="fw-drawer" *ngIf="sel"><header><h2>{{ sel.record_label }} <span class="fw-chip" [ngClass]="sel.status">{{ sel.status_label }}</span></h2><button class="fw-ic" (click)="sel = null"><span class="material-icons">close</span></button></header>
    <div class="body">
      <dl class="fw-preview"><dt>{{ 'Flow · record type' | t }}</dt><dd>{{ sel.flow_name }} · {{ sel.model_label }} <a *ngIf="sel.record_link" [routerLink]="sel.record_link">{{ 'open the record' | t }}</a></dd>
        <dt>{{ 'Submitted by' | t }}</dt><dd>{{ sel.submitted_by_name }} · {{ sel.submitted_at | date:'dd/MM/yyyy HH:mm' }}<span *ngIf="sel.note"> · {{ sel.note }}</span></dd>
        <dt *ngIf="sel.amount">{{ 'Amount' | t }}</dt><dd *ngIf="sel.amount">{{ sel.amount | number:'1.2-2' }}</dd></dl>
      <h2 style="font-size:14px;margin:14px 0 4px">{{ 'Approval trail' | t }}</h2>
      <p class="fw-muted fw-small" *ngIf="skippedCount(sel)">{{ skippedCount(sel) }} {{ 'other approver(s) of the same level were skipped (another approver decided or the request ended).' | t }}</p>
      <div class="fw-stepline" *ngFor="let s of trail(sel)"><span class="i">L{{ s.level }}</span>
        <div style="flex:1"><b>{{ s.level_name }}</b> · {{ s.approver_name }}<span *ngIf="s.delegate_name"> → {{ s.delegate_name }}</span><span *ngIf="s.escalated_to_name"> ↑ {{ s.escalated_to_name }}</span>
          <span class="fw-chip" [ngClass]="s.status">{{ s.status }}</span><span class="fw-chip bad" *ngIf="s.overdue">{{ 'overdue' | t }}</span>
          <div class="fw-muted fw-small" *ngIf="s.due_at && s.status === 'pending'">{{ 'due' | t }} {{ s.due_at | date:'dd/MM HH:mm' }}</div>
          <div class="fw-small" *ngIf="s.decided_at">{{ s.decided_by_name }} · {{ s.decided_at | date:'dd/MM/yyyy HH:mm' }}</div>
          <div class="fw-small" *ngIf="s.comment" style="white-space:pre-wrap">“{{ s.comment }}”</div>
          <div class="fw-row" style="margin-top:6px" *ngIf="s.can_act"><button class="fw-btn sm primary" (click)="open(sel, s, 'approved')">{{ 'Approve' | t }}</button><button class="fw-btn sm danger" (click)="open(sel, s, 'rejected')">{{ 'Reject' | t }}</button><button class="fw-btn sm" (click)="open(sel, s, 'changes')">{{ 'Ask for changes' | t }}</button><button class="fw-btn sm" (click)="open(sel, s, 'delegate')">{{ 'Delegate' | t }}</button></div></div></div>
      <div class="fw-card" *ngIf="act" style="margin-top:12px"><h2>{{ actTitle() }}</h2>
        <div class="fw-form"><div class="fw-f full" *ngIf="act.kind === 'delegate'"><label>{{ 'Delegate to' | t }}</label><select [(ngModel)]="act.user"><option value="">–</option><option *ngFor="let u of meta?.users" [value]="u.id">{{ u.label }}</option></select></div>
          <div class="fw-f full"><label>{{ 'Comment' | t }}{{ act.kind === 'rejected' || act.kind === 'changes' ? ' *' : '' }}</label><textarea [(ngModel)]="act.comment" rows="3"></textarea></div></div>
        <div class="fw-row" style="margin-top:8px"><span class="sp"></span><button class="fw-btn" (click)="act = null">{{ 'Cancel' | t }}</button><button class="fw-btn primary" (click)="doAct()" [disabled]="busy">{{ 'Confirm' | t }}</button></div></div>
    </div>
    <footer><button class="fw-btn" (click)="sel = null">{{ 'Close' | t }}</button>
      <button class="fw-btn" *ngIf="sel.status === 'pending' && (sel.submitted_by === me || meta?.is_admin)" (click)="cancelReq()">{{ 'Cancel request' | t }}</button>
      <button class="fw-btn primary" *ngIf="sel.status === 'rejected' || sel.status === 'changes'" (click)="resubmit()">{{ 'Submit again' | t }}</button></footer></div>
</div>`,
})
export class FlowApprovalsComponent implements OnInit {
  rows: any[] = []; meta: FlowMeta | null = null; box = 'mine'; sel: any = null; act: any = null; loaded = false; busy = false; me: any = null;
  constructor(private api: FlowService, private cd: ChangeDetectorRef, private session: SessionService) {}
  async ngOnInit() { this.meta = await this.api.meta(); this.me = Number(this.session.getUserId() || 0) || null; await this.load(); }
  async load() { try { this.rows = await this.api.get('approvals/', { box: this.box }); } catch (e) { zToast(this.api.err(e), 'err'); } this.loaded = true; this.cd.markForCheck(); }
  actSteps(r: any) { return (r.steps || []).filter((s: any) => s.can_act); }
  trail(r: any) { return (r.steps || []).filter((s: any) => s.status !== 'skipped'); }
  skippedCount(r: any) { return (r.steps || []).filter((s: any) => s.status === 'skipped').length; }
  levelText(r: any) { const lv = (r.steps || []).map((s: any) => s.level); const max = lv.length ? Math.max(...lv) : 0; return r.status === 'pending' ? `${r.current_level} / ${max}` : `${max}`; }
  overdue(r: any) { return (r.steps || []).some((s: any) => s.overdue); }
  open(r: any, s: any, kind: string) { this.sel = r; this.act = { kind, step: s, comment: '', user: '' }; }
  actTitle() { return { approved: 'Approve', rejected: 'Reject', changes: 'Ask for changes', delegate: 'Delegate' }[this.act?.kind as string] || ''; }
  async doAct() {
    this.busy = true;
    try {
      if (this.act.kind === 'delegate') { await this.api.post(`approvals/${this.sel.id}/steps/${this.act.step.id}/delegate/`, { user: this.act.user, comment: this.act.comment }); zToast('Delegated.', 'ok'); }
      else { const r = await this.api.post(`approvals/${this.sel.id}/steps/${this.act.step.id}/decide/`, { decision: this.act.kind, comment: this.act.comment }); zToast(r.status === 'pending' ? 'Decision saved – the next level is notified.' : `Request ${r.status_label.toLowerCase()}.`, 'ok'); }
      this.act = null; this.sel = null; await this.load();
    } catch (e) { zToast(this.api.err(e), 'err'); }
    this.busy = false; this.cd.markForCheck();
  }
  async cancelReq() { if (!confirm('Cancel this approval request?')) { return; } try { await this.api.post(`approvals/${this.sel.id}/cancel/`); this.sel = null; await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
  async resubmit() { try { await this.api.post(`approvals/${this.sel.id}/resubmit/`, { note: 'Submitted again' }); zToast('Submitted again – the approvers are notified.', 'ok'); this.sel = null; this.box = 'submitted'; await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
}


@Component({
  selector: 'z-flow-approval-flows', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw">
  <div class="fw-head"><div><h1>{{ 'Approval flows' | t }}</h1><p>{{ 'Who approves a record type, in which order. Levels run one after the other; inside a level either the first approver decides or everyone must (parallel). A level with an amount threshold is skipped below it. Deadlines send reminders and escalate.' | t }}</p></div>
    <span class="sp"></span><button class="fw-btn primary" (click)="edit(blank())">+ {{ 'New approval flow' | t }}</button></div>
  <div class="fw-card" style="padding:0;overflow:hidden">
    <table class="fw-table"><thead><tr><th>{{ 'Name' | t }}</th><th>{{ 'Record type' | t }}</th><th>{{ 'Levels' | t }}</th><th>{{ 'Pending' | t }}</th><th>{{ 'Active' | t }}</th><th></th></tr></thead>
      <tbody><tr *ngFor="let f of rows"><td><a class="fw-link" (click)="edit(f)"><b>{{ f.name }}</b></a><div class="fw-muted fw-small">{{ f.description }}</div></td><td>{{ f.model_label }}</td><td class="fw-small">{{ levelsText(f) }}</td><td>{{ f.pending }}</td><td><span class="fw-chip" [ngClass]="f.active ? 'ok' : 'inactive'">{{ f.active ? 'yes' : 'no' }}</span></td>
        <td><button class="fw-btn sm" (click)="edit(f)">{{ 'Edit' | t }}</button> <button class="fw-btn sm" (click)="submitOn = f; subId = ''">{{ 'Submit a record' | t }}</button> <button class="fw-btn sm danger" (click)="del(f)">{{ 'Delete' | t }}</button></td></tr>
      <tr *ngIf="!rows.length && loaded"><td colspan="6" class="fw-empty">{{ 'No approval flow yet.' | t }}</td></tr></tbody></table></div>

  <div class="fw-back" *ngIf="cur || submitOn" (click)="cur = null; submitOn = null"></div>
  <div class="fw-drawer" *ngIf="cur"><header><h2>{{ (cur.id ? 'Edit approval flow' : 'New approval flow') | t }}</h2><button class="fw-ic" (click)="cur = null"><span class="material-icons">close</span></button></header>
    <div class="body">
      <div class="fw-form">
        <div class="fw-f"><label>{{ 'Name' | t }} *</label><input [(ngModel)]="cur.name"></div>
        <div class="fw-f"><label>{{ 'Record type' | t }} *</label><select [(ngModel)]="cur.model" (ngModelChange)="loadFields()"><option value="">{{ 'Choose…' | t }}</option><optgroup *ngFor="let m of meta?.modules" [label]="m.label"><option *ngFor="let mm of modelsOf(m.key)" [value]="mm.key">{{ mm.label }}</option></optgroup></select></div>
        <div class="fw-f full"><label>{{ 'Description' | t }}</label><input [(ngModel)]="cur.description"></div>
        <div class="fw-f"><label class="fw-check"><input type="checkbox" [(ngModel)]="cur.allow_self_approval"> {{ 'Allow self-approval' | t }}</label></div>
        <div class="fw-f"><label class="fw-check"><input type="checkbox" [(ngModel)]="cur.require_comment_on_reject"> {{ 'Comment required to reject' | t }}</label></div>
        <div class="fw-f"><label class="fw-check"><input type="checkbox" [(ngModel)]="cur.active"> {{ 'Active' | t }}</label></div>
        <div class="fw-f full"><label>{{ 'Status field of the record set by the decision (optional)' | t }}</label>
          <div class="fw-row"><select [(ngModel)]="cur.status_field" style="flex:1"><option value="">–</option><option *ngFor="let f of statusFields" [value]="f.key">{{ f.label }}</option></select>
            <input [(ngModel)]="cur.pending_value" placeholder="pending value" style="width:140px"><input [(ngModel)]="cur.approved_value" placeholder="approved value" style="width:140px"><input [(ngModel)]="cur.rejected_value" placeholder="rejected value" style="width:140px"></div></div>
      </div>
      <h2 style="font-size:14px;margin:16px 0 6px">{{ 'Levels' | t }}</h2>
      <div class="fw-act" *ngFor="let st of cur.steps; let i = index"><header><span class="n">{{ i + 1 }}</span><b>{{ st.name || ('Level ' + (i + 1)) }}</b>
          <button class="fw-ic" (click)="move(i, -1)" [disabled]="i === 0"><span class="material-icons">arrow_upward</span></button><button class="fw-ic" (click)="move(i, 1)" [disabled]="i === cur.steps.length - 1"><span class="material-icons">arrow_downward</span></button><button class="fw-ic" (click)="cur.steps.splice(i, 1)"><span class="material-icons">delete_outline</span></button></header>
        <div class="body"><div class="fw-form">
          <div class="fw-f"><label>{{ 'Level name' | t }}</label><input [(ngModel)]="st.name" placeholder="e.g. Department manager"></div>
          <div class="fw-f"><label>{{ 'Inside the level' | t }}</label><select [(ngModel)]="st.mode"><option value="sequential">{{ 'First approver to decide wins' | t }}</option><option value="parallel_all">{{ 'Everyone must approve (parallel)' | t }}</option></select></div>
          <div class="fw-f full"><label>{{ 'Approvers' | t }}</label>
            <div class="fw-rec" *ngFor="let ap of st.approvers; let j = index">
              <select [(ngModel)]="ap.type" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px"><option value="manager">{{ "Employee's reporting manager" | t }}</option><option value="submitter_manager">{{ "Submitter's manager" | t }}</option><option value="department_head">{{ 'Department head' | t }}</option><option value="owner">{{ 'Record owner' | t }}</option><option value="user">{{ 'A user' | t }}</option><option value="role">{{ 'A role' | t }}</option><option value="field">{{ 'A user field of the record' | t }}</option></select>
              <select *ngIf="ap.type === 'user'" [(ngModel)]="ap.user" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px"><option value="">–</option><option *ngFor="let u of meta?.users" [value]="u.id">{{ u.label }}</option></select>
              <select *ngIf="ap.type === 'role'" [(ngModel)]="ap.group" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px"><option value="">–</option><option *ngFor="let g of meta?.roles" [value]="g.id">{{ g.label }}</option></select>
              <select *ngIf="ap.type === 'field'" [(ngModel)]="ap.field" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px"><option value="">–</option><option *ngFor="let f of userFields" [value]="f.key">{{ f.label }}</option></select>
              <button class="fw-ic" (click)="st.approvers.splice(j, 1)"><span class="material-icons">close</span></button></div>
            <button class="fw-btn sm" (click)="st.approvers.push({ type: 'manager' })">+ {{ 'Approver' | t }}</button></div>
          <div class="fw-f"><label>{{ 'Only when amount field' | t }}</label><select [(ngModel)]="st.amount_field"><option value="">{{ '– always –' | t }}</option><option *ngFor="let f of numberFields" [value]="f.key">{{ f.label }}</option></select></div>
          <div class="fw-f"><label>{{ 'is at least' | t }}</label><input type="number" [(ngModel)]="st.min_amount" [disabled]="!st.amount_field"></div>
          <div class="fw-f"><label>{{ 'Deadline (hours)' | t }}</label><input type="number" min="0" [(ngModel)]="st.deadline_hours"><div class="hint">{{ 'After it: a reminder a day and escalation' | t }}</div></div>
          <div class="fw-f"><label>{{ 'Escalate to' | t }}</label><select [(ngModel)]="st.escalate_to"><option value="">–</option><option *ngFor="let u of meta?.users" [value]="u.id">{{ u.label }}</option></select></div>
        </div></div></div>
      <button class="fw-btn sm" (click)="addLevel()">+ {{ 'Level' | t }}</button>
    </div>
    <footer><button class="fw-btn" (click)="cur = null">{{ 'Cancel' | t }}</button><button class="fw-btn primary" (click)="save()" [disabled]="!cur.name || !cur.model || !cur.steps.length">{{ 'Save' | t }}</button></footer></div>

  <div class="fw-drawer" *ngIf="submitOn"><header><h2>{{ 'Submit for approval' | t }}: {{ submitOn.name }}</h2><button class="fw-ic" (click)="submitOn = null"><span class="material-icons">close</span></button></header>
    <div class="body"><p class="fw-muted">{{ 'Starts this approval flow for one record of type' | t }} <b>{{ submitOn.model_label }}</b>.</p>
      <div class="fw-form"><div class="fw-f"><label>{{ 'Record id' | t }}</label><input type="number" [(ngModel)]="subId"></div><div class="fw-f full"><label>{{ 'Note to the approvers' | t }}</label><input [(ngModel)]="subNote"></div></div></div>
    <footer><button class="fw-btn" (click)="submitOn = null">{{ 'Close' | t }}</button><button class="fw-btn primary" (click)="submitRec()" [disabled]="!subId">{{ 'Submit' | t }}</button></footer></div>
</div>`,
})
export class FlowApprovalFlowsComponent implements OnInit {
  rows: any[] = []; meta: FlowMeta | null = null; cur: any = null; loaded = false; fields: any[] = []; submitOn: any = null; subId: any = ''; subNote = '';
  constructor(private api: FlowService, private cd: ChangeDetectorRef) {}
  async ngOnInit() { this.meta = await this.api.meta(); await this.load(); }
  async load() { try { this.rows = await this.api.get('approval-flows/'); } catch (e) { zToast(this.api.err(e), 'err'); } this.loaded = true; this.cd.markForCheck(); }
  modelsOf(m: string) { return (this.meta?.models || []).filter(x => x.module === m); }
  blank() { return { name: '', model: '', description: '', steps: [{ level: 1, name: 'Manager', mode: 'sequential', approvers: [{ type: 'manager' }], amount_field: '', min_amount: null, deadline_hours: 48, escalate_to: '' }], allow_self_approval: false, require_comment_on_reject: true, status_field: '', pending_value: '', approved_value: '', rejected_value: '', active: true }; }
  edit(f: any) { this.cur = JSON.parse(JSON.stringify(f)); this.cur.steps = this.cur.steps || []; this.loadFields(); }
  async loadFields() { this.fields = this.cur?.model ? await this.api.fields(this.cur.model).catch(() => []) : []; this.cd.markForCheck(); }
  get statusFields() { return this.fields.filter(f => !f.related && (f.type === 'choice' || f.type === 'text' || f.type === 'bool')); }
  get userFields() { return this.fields.filter(f => !f.related && f.type === 'link' && (f.user || f.employee)); }
  get numberFields() { return this.fields.filter(f => !f.related && f.type === 'number'); }
  addLevel() { this.cur.steps.push({ level: this.cur.steps.length + 1, name: '', mode: 'sequential', approvers: [{ type: 'user', user: '' }], amount_field: '', min_amount: null, deadline_hours: 48, escalate_to: '' }); }
  move(i: number, d: number) { const j = i + d; if (j < 0 || j >= this.cur.steps.length) { return; } [this.cur.steps[i], this.cur.steps[j]] = [this.cur.steps[j], this.cur.steps[i]]; }
  levelsText(f: any) { return (f.steps || []).map((s: any, i: number) => `${i + 1}. ${s.name || 'Level'} (${(s.approvers || []).map((a: any) => a.type).join(', ')})`).join(' → '); }
  async save() {
    this.cur.steps.forEach((s: any, i: number) => { s.level = i + 1; if (!s.escalate_to) { s.escalate_to = null; } if (s.min_amount === '') { s.min_amount = null; } });
    try { if (this.cur.id) { await this.api.patch(`approval-flows/${this.cur.id}/`, this.cur); } else { await this.api.post('approval-flows/', this.cur); } zToast('Approval flow saved.', 'ok'); this.cur = null; await this.api.meta(true); await this.load(); }
    catch (e) { zToast(this.api.err(e), 'err'); }
  }
  async del(f: any) { if (!confirm(`Delete "${f.name}"? Its requests are deleted too.`)) { return; } try { await this.api.delete(`approval-flows/${f.id}/`); await this.api.meta(true); await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
  async submitRec() { try { const r = await this.api.post('approvals/submit/', { flow: this.submitOn.id, model: this.submitOn.model, id: this.subId, note: this.subNote }); zToast(`Submitted: ${r.record_label} – ${r.status_label}.`, 'ok'); this.submitOn = null; await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
}
