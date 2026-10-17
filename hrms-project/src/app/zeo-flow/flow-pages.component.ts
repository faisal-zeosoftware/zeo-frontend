/** v1.29.0 – Workflow automation pages: dashboard, rules, execution log, scheduled actions, templates, audit. */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FLOW_CSS, FlowMeta, FlowService } from './flow.service';
import { zToast } from '../shared-ui/z-toast';
import { TPipe } from '../shared-ui/i18n.service';

const IMPORTS = [CommonModule, FormsModule, RouterModule, TPipe];

@Component({
  selector: 'z-flow-dashboard', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw">
  <div class="fw-head"><div><h1>{{ 'Automation' | t }}</h1><p>{{ 'Rules that run by themselves: triggers, conditions, actions, approvals and scheduled actions for every ZEO app.' | t }}</p></div>
    <span class="sp"></span><a class="fw-btn primary" routerLink="/main-sidebar/automation/rules/new">+ {{ 'New rule' | t }}</a></div>
  <p class="fw-msg err" *ngIf="msg">{{ msg }}</p>
  <div class="fw-kpis" *ngIf="d">
    <a class="fw-kpi" routerLink="/main-sidebar/automation/rules"><span>{{ 'Rules' | t }}</span><b>{{ d.workflows.total }}</b><span>{{ d.workflows.active }} active · {{ d.workflows.draft }} draft · {{ d.workflows.inactive }} inactive</span></a>
    <a class="fw-kpi" routerLink="/main-sidebar/automation/runs"><span>{{ 'Runs today' | t }}</span><b>{{ d.runs.today }}</b><span>{{ d.runs.ok_7d }} ok in 7 days</span></a>
    <a class="fw-kpi" [class.bad]="d.runs.failed_7d" routerLink="/main-sidebar/automation/runs" [queryParams]="{ status: 'failed' }"><span>{{ 'Failed (7 days)' | t }}</span><b>{{ d.runs.failed_7d }}</b></a>
    <a class="fw-kpi" [class.warn]="d.runs.waiting" routerLink="/main-sidebar/automation/scheduled"><span>{{ 'Waiting' | t }}</span><b>{{ d.runs.waiting }}</b><span>{{ d.scheduled.pending }} scheduled · {{ d.scheduled.overdue }} overdue</span></a>
    <a class="fw-kpi" [class.warn]="d.approvals.mine" routerLink="/main-sidebar/automation/approvals"><span>{{ 'Approvals pending' | t }}</span><b>{{ d.approvals.pending }}</b><span>{{ d.approvals.mine }} for me · {{ d.approvals.overdue }} overdue</span></a>
  </div>
  <div class="fw-grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))" *ngIf="d">
    <div class="fw-card"><h2>{{ 'Latest runs' | t }}</h2>
      <table class="fw-table" zPlain><thead><tr><th>{{ 'When' | t }}</th><th>{{ 'Rule' | t }}</th><th>{{ 'Record' | t }}</th><th>{{ 'Status' | t }}</th></tr></thead>
        <tbody><tr *ngFor="let r of d.recent_runs"><td class="fw-muted">{{ r.started_at | date:'dd/MM HH:mm' }}</td><td>{{ r.workflow_name }}</td><td><a *ngIf="r.link" [routerLink]="r.link">{{ r.record_label }}</a><span *ngIf="!r.link">{{ r.record_label }}</span></td><td><span class="fw-chip" [ngClass]="r.status">{{ r.status }}</span></td></tr>
        <tr *ngIf="!d.recent_runs.length"><td colspan="4" class="fw-empty">{{ 'No run yet. Create a rule and activate it.' | t }}</td></tr></tbody></table></div>
    <div class="fw-card"><h2>{{ 'Most failures (7 days)' | t }}</h2>
      <table class="fw-table" zPlain><tbody><tr *ngFor="let e of d.top_errors"><td>{{ e.workflow__name }}</td><td><span class="fw-chip failed">{{ e.n }}</span></td></tr>
        <tr *ngIf="!d.top_errors.length"><td class="fw-empty">{{ 'No failures.' | t }}</td></tr></tbody></table>
      <h2 style="margin-top:14px">{{ 'Get started' | t }}</h2>
      <ol class="fw-muted" style="padding-left:18px;margin:0;line-height:1.7">
        <li>{{ 'Templates: write the e-mail / notification texts once, with variables for the record fields.' | t }}</li>
        <li>{{ 'Approval flows: who approves what, in which order, with deadlines.' | t }}</li>
        <li>{{ 'Rules: trigger → conditions → actions. Test on a record, then activate.' | t }}</li>
        <li>{{ 'Watch the execution log; retry a failed run after fixing the cause.' | t }}</li></ol></div>
  </div>
</div>`,
})
export class FlowDashboardComponent implements OnInit {
  d: any = null; msg = '';
  constructor(private api: FlowService, private cd: ChangeDetectorRef) {}
  async ngOnInit() { try { this.d = await this.api.get('dashboard/'); } catch (e) { this.msg = this.api.err(e, 'The dashboard could not be loaded.'); } this.cd.markForCheck(); }
}


@Component({
  selector: 'z-flow-rules', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw">
  <div class="fw-head"><div><h1>{{ 'Workflow rules' | t }}</h1><p>{{ 'Create, test, activate, duplicate or archive rules. An inactive rule keeps its history.' | t }}</p></div>
    <span class="sp"></span><button class="fw-btn" (click)="samples()">{{ 'Load sample rules' | t }}</button><a class="fw-btn primary" routerLink="/main-sidebar/automation/rules/new">+ {{ 'New rule' | t }}</a></div>
  <p class="fw-msg err" *ngIf="msg">{{ msg }}</p>
  <div class="fw-filters">
    <input placeholder="{{ 'Search…' | t }}" [(ngModel)]="q" (ngModelChange)="load()">
    <select [(ngModel)]="state" (ngModelChange)="load()"><option value="draft,active,inactive">{{ 'All but archived' | t }}</option><option value="active">{{ 'Active' | t }}</option><option value="draft">{{ 'Draft' | t }}</option><option value="inactive">{{ 'Inactive' | t }}</option><option value="archived">{{ 'Archived' | t }}</option></select>
    <select [(ngModel)]="module" (ngModelChange)="load()"><option value="">{{ 'All modules' | t }}</option><option *ngFor="let m of meta?.modules" [value]="m.key">{{ m.label }}</option></select>
  </div>
  <div class="fw-card" style="padding:0;overflow:hidden">
    <table class="fw-table" zPlain><thead><tr><th>{{ 'Rule' | t }}</th><th>{{ 'Module · record' | t }}</th><th>{{ 'Trigger' | t }}</th><th>{{ 'Actions' | t }}</th><th>{{ 'State' | t }}</th><th>{{ 'Runs' | t }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let w of rows">
          <td><a [routerLink]="['/main-sidebar/automation/rules', w.id]"><b>{{ w.name }}</b></a><div class="fw-muted" *ngIf="w.description">{{ w.description }}</div><div class="fw-small fw-muted" *ngIf="w.problems?.length"><span class="fw-chip bad">{{ w.problems.length }} {{ 'to fix' | t }}</span></div></td>
          <td>{{ w.module_label }} · {{ w.model_label }}</td>
          <td>{{ w.summary.trigger }}<span class="fw-muted" *ngIf="w.summary.conditions"> · {{ w.summary.conditions }} {{ 'condition(s)' | t }}</span></td>
          <td class="fw-small">{{ w.summary.actions.join(' → ') }}</td>
          <td><span class="fw-chip" [ngClass]="w.state">{{ w.state }}</span><div class="fw-small fw-muted">v{{ w.version }}</div></td>
          <td>{{ w.runs_count }}<span class="fw-muted" *ngIf="w.errors_count"> · <span style="color:#b42318">{{ w.errors_count }} failed</span></span><div class="fw-small fw-muted" *ngIf="w.last_run_at">{{ w.last_run_at | date:'dd/MM HH:mm' }}</div></td>
          <td style="white-space:nowrap">
            <button class="fw-btn sm primary" *ngIf="w.state !== 'active'" (click)="act(w, 'activate')" [disabled]="w.problems?.length">{{ 'Activate' | t }}</button>
            <button class="fw-btn sm" *ngIf="w.state === 'active'" (click)="act(w, 'deactivate')">{{ 'Deactivate' | t }}</button>
            <button class="fw-btn sm" *ngIf="w.state === 'active' || w.trigger === 'manual'" (click)="runOn = w; runId = ''">{{ 'Run' | t }}</button>
            <button class="fw-btn sm" (click)="act(w, 'duplicate')">{{ 'Duplicate' | t }}</button>
            <button class="fw-btn sm" *ngIf="w.state !== 'archived'" (click)="act(w, 'archive')">{{ 'Archive' | t }}</button>
            <button class="fw-btn sm danger" *ngIf="w.state === 'archived' || w.state === 'draft'" (click)="del(w)">{{ 'Delete' | t }}</button>
          </td></tr>
        <tr *ngIf="!rows.length && loaded"><td colspan="7" class="fw-empty">{{ 'No rule yet.' | t }} <a routerLink="/main-sidebar/automation/rules/new">{{ 'Create the first one' | t }}</a></td></tr>
      </tbody></table>
  </div>
  <div class="fw-back" *ngIf="runOn" (click)="runOn = null"></div>
  <div class="fw-drawer" *ngIf="runOn"><header><h2>{{ 'Run' | t }}: {{ runOn.name }}</h2><button class="fw-ic" (click)="runOn = null"><span class="material-icons">close</span></button></header>
    <div class="body"><p class="fw-muted">{{ 'Runs the rule now for one record of type' | t }} <b>{{ runOn.model_label }}</b>. {{ 'The conditions are checked unless you tick "ignore".' | t }}</p>
      <div class="fw-form"><div class="fw-f"><label>{{ 'Record id' | t }}</label><input type="number" [(ngModel)]="runId"></div>
        <div class="fw-f"><label>&nbsp;</label><label class="fw-check"><input type="checkbox" [(ngModel)]="runIgnore"> {{ 'Ignore the conditions' | t }}</label></div></div>
      <div *ngIf="runRes" style="margin-top:12px"><span class="fw-chip" [ngClass]="runRes.status">{{ runRes.status }}</span> <span class="fw-muted">{{ runRes.record_label }} {{ runRes.error }}</span>
        <div class="fw-stepline" *ngFor="let s of runRes.steps"><span class="i">{{ s.index }}</span><div><b>{{ s.label }}</b> <span class="fw-chip" [ngClass]="s.status">{{ s.status }}</span><div class="fw-muted">{{ s.detail }}</div></div></div></div></div>
    <footer><button class="fw-btn" (click)="runOn = null">{{ 'Close' | t }}</button><button class="fw-btn primary" (click)="runNow()" [disabled]="!runId || busy">{{ 'Run now' | t }}</button></footer></div>
</div>`,
})
export class FlowRulesComponent implements OnInit {
  rows: any[] = []; meta: FlowMeta | null = null; msg = ''; q = ''; state = 'draft,active,inactive'; module = ''; loaded = false; busy = false;
  runOn: any = null; runId: any = ''; runIgnore = false; runRes: any = null;
  constructor(private api: FlowService, private cd: ChangeDetectorRef) {}
  async ngOnInit() { this.meta = await this.api.meta(); await this.load(); }
  async load() { try { this.rows = await this.api.get('workflows/', { q: this.q, state: this.state, module: this.module }); } catch (e) { this.msg = this.api.err(e, 'The rules could not be loaded.'); } this.loaded = true; this.cd.markForCheck(); }
  async act(w: any, a: string) {
    try { const r = await this.api.post(`workflows/${w.id}/${a}/`); zToast(a === 'duplicate' ? `Copy "${r.name}" created as a draft.` : `"${w.name}" ${a === 'activate' ? 'is active' : a + 'd'}.`, 'ok'); await this.load(); }
    catch (e) { zToast(this.api.err(e), 'err'); }
  }
  async samples() { try { const r = await this.api.post('workflows/load_samples/'); zToast(r.created.length ? `${r.created.length} sample rule(s) added as drafts: ${r.created.join(', ')}` : 'The sample rules already exist.', 'ok'); await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
  async del(w: any) { if (!confirm(`Delete the rule "${w.name}" and its history?`)) { return; } try { await this.api.delete(`workflows/${w.id}/`); zToast('Deleted.', 'ok'); await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
  async runNow() { this.busy = true; this.runRes = null; try { this.runRes = await this.api.post(`workflows/${this.runOn.id}/run/`, { id: this.runId, ignore_conditions: this.runIgnore, force: this.runOn.state !== 'active' }); await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } this.busy = false; this.cd.markForCheck(); }
}


@Component({
  selector: 'z-flow-runs', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw">
  <div class="fw-head"><div><h1>{{ 'Execution log' | t }}</h1><p>{{ 'Every run: what started it, which record, every action with its result, errors and retries.' | t }}</p></div><span class="sp"></span><button class="fw-btn" (click)="load()">{{ 'Refresh' | t }}</button></div>
  <div class="fw-filters">
    <input placeholder="{{ 'Record, rule or error…' | t }}" [(ngModel)]="f.q" (ngModelChange)="load()">
    <select [(ngModel)]="f.status" (ngModelChange)="load()"><option value="">{{ 'All statuses' | t }}</option><option value="ok">ok</option><option value="failed">failed</option><option value="waiting">waiting</option><option value="skipped">skipped</option><option value="cancelled">cancelled</option></select>
    <select [(ngModel)]="f.workflow" (ngModelChange)="load()"><option value="">{{ 'All rules' | t }}</option><option *ngFor="let w of rules" [value]="w.id">{{ w.name }}</option></select>
    <input type="date" [(ngModel)]="f.from" (ngModelChange)="load()"><input type="date" [(ngModel)]="f.to" (ngModelChange)="load()">
  </div>
  <div class="fw-card" style="padding:0;overflow:hidden">
    <table class="fw-table" zPlain><thead><tr><th>{{ 'Started' | t }}</th><th>{{ 'Rule' | t }}</th><th>{{ 'Record' | t }}</th><th>{{ 'Trigger' | t }}</th><th>{{ 'By' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'Steps' | t }}</th><th>{{ 'Duration' | t }}</th><th></th></tr></thead>
      <tbody><tr *ngFor="let r of rows" (click)="sel = r" style="cursor:pointer">
        <td class="fw-muted" style="white-space:nowrap">{{ r.started_at | date:'dd/MM/yy HH:mm:ss' }}</td><td>{{ r.workflow_name }} <span class="fw-muted fw-small">v{{ r.version }}</span></td>
        <td><a *ngIf="r.link" [routerLink]="r.link" (click)="$event.stopPropagation()">{{ r.record_label }}</a><span *ngIf="!r.link">{{ r.record_label || '–' }}</span></td>
        <td>{{ r.trigger }}</td><td>{{ r.initiated_by_name || r.initiator }}</td><td><span class="fw-chip" [ngClass]="r.status">{{ r.status }}</span><div class="fw-small" style="color:#b42318" *ngIf="r.error">{{ r.error | slice:0:80 }}</div></td>
        <td>{{ okSteps(r) }}/{{ r.steps.length }}<span class="fw-muted" *ngIf="r.retry_count"> · retry {{ r.retry_count }}</span></td><td class="fw-muted">{{ r.duration_ms != null ? r.duration_ms + ' ms' : '–' }}</td>
        <td><button class="fw-btn sm" *ngIf="r.status === 'failed'" (click)="retry(r); $event.stopPropagation()">{{ 'Retry' | t }}</button></td></tr>
      <tr *ngIf="!rows.length && loaded"><td colspan="9" class="fw-empty">{{ 'No run matches.' | t }}</td></tr></tbody></table>
  </div>
  <div class="fw-back" *ngIf="sel" (click)="sel = null"></div>
  <div class="fw-drawer" *ngIf="sel"><header><h2>{{ 'Run' | t }} #{{ sel.id }} · {{ sel.workflow_name }}</h2><button class="fw-ic" (click)="sel = null"><span class="material-icons">close</span></button></header>
    <div class="body">
      <dl class="fw-preview"><dt>{{ 'Record' | t }}</dt><dd><a *ngIf="sel.link" [routerLink]="sel.link">{{ sel.record_label }}</a><span *ngIf="!sel.link">{{ sel.record_label || '–' }}</span> <span class="fw-muted">({{ sel.model }} #{{ sel.object_id }})</span></dd>
        <dt>{{ 'Trigger · initiated by' | t }}</dt><dd>{{ sel.trigger }} · {{ sel.initiated_by_name || sel.initiator }}</dd>
        <dt>{{ 'Started · finished · duration' | t }}</dt><dd>{{ sel.started_at | date:'dd/MM/yyyy HH:mm:ss' }} · {{ (sel.finished_at | date:'HH:mm:ss') || '–' }} · {{ sel.duration_ms != null ? sel.duration_ms + ' ms' : '–' }}</dd>
        <dt>{{ 'Status' | t }}</dt><dd><span class="fw-chip" [ngClass]="sel.status">{{ sel.status }}</span> <span style="color:#b42318">{{ sel.error }}</span></dd>
        <dt>{{ 'Correlation id · version · retries' | t }}</dt><dd class="fw-small">{{ sel.correlation_id }} · v{{ sel.version }} · {{ sel.retry_count }}</dd></dl>
      <h2 style="font-size:14px;margin:14px 0 4px">{{ 'Actions' | t }}</h2>
      <div class="fw-stepline" *ngFor="let s of sel.steps"><span class="i">{{ s.index }}</span><div><b>{{ s.label }}</b> <span class="fw-chip" [ngClass]="s.status">{{ s.status }}</span><div class="fw-muted">{{ s.detail }}</div></div></div>
      <p class="fw-empty" *ngIf="!sel.steps.length">{{ 'No action ran.' | t }}</p>
    </div>
    <footer><button class="fw-btn" (click)="sel = null">{{ 'Close' | t }}</button><button class="fw-btn primary" *ngIf="sel.status === 'failed'" (click)="retry(sel)">{{ 'Retry the failed step' | t }}</button></footer></div>
</div>`,
})
export class FlowRunsComponent implements OnInit {
  rows: any[] = []; rules: any[] = []; sel: any = null; loaded = false; f: any = { q: '', status: '', workflow: '', from: '', to: '' };
  constructor(private api: FlowService, private cd: ChangeDetectorRef, private router: Router) {}
  async ngOnInit() {
    const qp = new URLSearchParams(location.search); this.f.status = qp.get('status') || ''; this.f.workflow = qp.get('workflow') || '';
    try { this.rules = await this.api.get('workflows/', { state: 'draft,active,inactive,archived' }); } catch { /* ignore */ }
    await this.load();
  }
  async load() { try { this.rows = await this.api.get('runs/', this.f); } catch (e) { zToast(this.api.err(e), 'err'); } this.loaded = true; this.cd.markForCheck(); }
  okSteps(r: any) { return (r.steps || []).filter((s: any) => s.status === 'ok').length; }
  async retry(r: any) { try { const n = await this.api.post(`runs/${r.id}/retry/`); zToast(n.status === 'ok' ? 'The run completed.' : `Run ${n.status}: ${n.error}`, n.status === 'ok' ? 'ok' : 'err'); this.sel = null; await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
}


@Component({
  selector: 'z-flow-scheduled', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw">
  <div class="fw-head"><div><h1>{{ 'Scheduled actions' | t }}</h1><p>{{ 'Waits inside rules and delayed starts, with when they continue. The scheduler runs every 15 minutes (Celery beat or manage.py run_workflows).' | t }}</p></div>
    <span class="sp"></span><button class="fw-btn" (click)="load()">{{ 'Refresh' | t }}</button><button class="fw-btn primary" (click)="runDue()" [disabled]="busy">{{ 'Run the scheduler now' | t }}</button></div>
  <div class="fw-filters"><select [(ngModel)]="status" (ngModelChange)="load()"><option value="pending">{{ 'Pending' | t }}</option><option value="overdue">{{ 'Overdue' | t }}</option><option value="done">{{ 'Done' | t }}</option><option value="cancelled">{{ 'Cancelled' | t }}</option><option value="failed">{{ 'Failed' | t }}</option><option value="">{{ 'All' | t }}</option></select></div>
  <p class="fw-msg" *ngIf="res">{{ res }}</p>
  <div class="fw-card" style="padding:0;overflow:hidden">
    <table class="fw-table" zPlain><thead><tr><th>{{ 'Due' | t }}</th><th>{{ 'Kind' | t }}</th><th>{{ 'Rule' | t }}</th><th>{{ 'Record' | t }}</th><th>{{ 'Note' | t }}</th><th>{{ 'Status' | t }}</th><th></th></tr></thead>
      <tbody><tr *ngFor="let s of rows"><td style="white-space:nowrap" [style.color]="overdue(s) ? '#b42318' : ''">{{ s.due_at | date:'dd/MM/yy HH:mm' }}</td><td>{{ s.kind }}</td><td>{{ s.workflow_name }}</td>
        <td><a *ngIf="s.link" [routerLink]="s.link">{{ s.record_label }}</a></td><td class="fw-small">{{ s.note }} <span class="fw-muted" *ngIf="s.actions?.length">· {{ s.actions.length }} action(s) left</span></td>
        <td><span class="fw-chip" [ngClass]="s.status">{{ s.status }}</span></td><td><button class="fw-btn sm danger" *ngIf="s.status === 'pending'" (click)="cancel(s)">{{ 'Cancel' | t }}</button></td></tr>
      <tr *ngIf="!rows.length && loaded"><td colspan="7" class="fw-empty">{{ 'Nothing scheduled.' | t }}</td></tr></tbody></table></div>
</div>`,
})
export class FlowScheduledComponent implements OnInit {
  rows: any[] = []; status = 'pending'; loaded = false; busy = false; res = '';
  constructor(private api: FlowService, private cd: ChangeDetectorRef) {}
  async ngOnInit() { await this.load(); }
  async load() { try { this.rows = await this.api.get('scheduled/', { status: this.status }); } catch (e) { zToast(this.api.err(e), 'err'); } this.loaded = true; this.cd.markForCheck(); }
  overdue(s: any) { return s.status === 'pending' && new Date(s.due_at) < new Date(); }
  async cancel(s: any) { if (!confirm('Cancel this scheduled action? The run stops here.')) { return; } try { await this.api.post(`scheduled/${s.id}/cancel/`); await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
  async runDue() { this.busy = true; try { const r = await this.api.post('scheduled/run_due/'); this.res = `Scheduler ran: ${r.resumed} resumed, ${r.date_runs} date runs, ${r.schedule_runs} scheduled runs, ${r.approval_reminders} approval reminders.`; await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } this.busy = false; this.cd.markForCheck(); }
}


@Component({
  selector: 'z-flow-templates', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw">
  <div class="fw-head"><div><h1>{{ 'Notification templates' | t }}</h1><p>{{ 'E-mail and in-app texts used by the rules. Variables:' | t }} <code *ngFor="let v of meta?.variables" style="margin-right:4px">{{ v }}</code></p></div>
    <span class="sp"></span><button class="fw-btn primary" (click)="edit({ name: '', kind: 'email', model: '', subject: '', body: '', active: true })">+ {{ 'New template' | t }}</button></div>
  <div class="fw-card" style="padding:0;overflow:hidden">
    <table class="fw-table" zPlain><thead><tr><th>{{ 'Name' | t }}</th><th>{{ 'Kind' | t }}</th><th>{{ 'Record type' | t }}</th><th>{{ 'Subject' | t }}</th><th>{{ 'Active' | t }}</th><th></th></tr></thead>
      <tbody><tr *ngFor="let t of rows"><td><a class="fw-link" (click)="edit(t)"><b>{{ t.name }}</b></a></td><td>{{ t.kind }}</td><td>{{ modelLabel(t.model) }}</td><td class="fw-small">{{ t.subject }}</td><td><span class="fw-chip" [ngClass]="t.active ? 'ok' : 'inactive'">{{ t.active ? 'yes' : 'no' }}</span></td>
        <td><button class="fw-btn sm" (click)="edit(t)">{{ 'Edit' | t }}</button> <button class="fw-btn sm danger" (click)="del(t)">{{ 'Delete' | t }}</button></td></tr>
      <tr *ngIf="!rows.length && loaded"><td colspan="6" class="fw-empty">{{ 'No template yet.' | t }}</td></tr></tbody></table></div>
  <div class="fw-back" *ngIf="cur" (click)="cur = null"></div>
  <div class="fw-drawer" *ngIf="cur"><header><h2>{{ (cur.id ? 'Edit template' : 'New template') | t }}</h2><button class="fw-ic" (click)="cur = null"><span class="material-icons">close</span></button></header>
    <div class="body"><div class="fw-form">
      <div class="fw-f"><label>{{ 'Name' | t }} *</label><input [(ngModel)]="cur.name"></div>
      <div class="fw-f"><label>{{ 'Kind' | t }}</label><select [(ngModel)]="cur.kind"><option value="email">E-mail</option><option value="inapp">In-app notification</option><option value="both">Both</option></select></div>
      <div class="fw-f"><label>{{ 'Record type (for the variables)' | t }}</label><select [(ngModel)]="cur.model"><option value="">–</option><optgroup *ngFor="let m of meta?.modules" [label]="m.label"><option *ngFor="let mm of modelsOf(m.key)" [value]="mm.key">{{ mm.label }}</option></optgroup></select></div>
      <div class="fw-f"><label>&nbsp;</label><label class="fw-check"><input type="checkbox" [(ngModel)]="cur.active"> {{ 'Active' | t }}</label></div>
      <div class="fw-f full"><label>{{ 'Subject / title' | t }}</label><input [(ngModel)]="cur.subject"></div>
      <div class="fw-f full"><label>{{ 'Body' | t }}</label><textarea [(ngModel)]="cur.body" rows="8"></textarea><div class="fw-vars"><code *ngFor="let v of meta?.variables">{{ v }}</code></div></div>
      <div class="fw-f full" *ngIf="cur.id"><div class="fw-row"><input style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;width:140px" type="number" placeholder="Record id" [(ngModel)]="pid"><button class="fw-btn sm" (click)="preview()">{{ 'Preview with a record' | t }}</button></div>
        <div class="fw-preview" *ngIf="pv" style="margin-top:8px"><b>{{ pv.subject }}</b><pre style="white-space:pre-wrap;font:inherit;margin:6px 0 0">{{ pv.body }}</pre></div></div>
    </div></div>
    <footer><button class="fw-btn" (click)="cur = null">{{ 'Cancel' | t }}</button><button class="fw-btn primary" (click)="save()" [disabled]="!cur.name">{{ 'Save' | t }}</button></footer></div>
</div>`,
})
export class FlowTemplatesComponent implements OnInit {
  rows: any[] = []; meta: FlowMeta | null = null; cur: any = null; loaded = false; pid: any = ''; pv: any = null;
  constructor(private api: FlowService, private cd: ChangeDetectorRef) {}
  async ngOnInit() { this.meta = await this.api.meta(); await this.load(); }
  async load() { try { this.rows = await this.api.get('templates/'); } catch (e) { zToast(this.api.err(e), 'err'); } this.loaded = true; this.cd.markForCheck(); }
  modelsOf(m: string) { return (this.meta?.models || []).filter(x => x.module === m); }
  modelLabel(k: string) { return this.meta?.models.find(m => m.key === k)?.label || k || '–'; }
  edit(t: any) { this.cur = { ...t }; this.pv = null; }
  async save() { try { if (this.cur.id) { await this.api.patch(`templates/${this.cur.id}/`, this.cur); } else { await this.api.post('templates/', this.cur); } zToast('Template saved.', 'ok'); this.cur = null; await this.api.meta(true); await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
  async del(t: any) { if (!confirm(`Delete "${t.name}"?`)) { return; } try { await this.api.delete(`templates/${t.id}/`); await this.api.meta(true); await this.load(); } catch (e) { zToast(this.api.err(e), 'err'); } }
  async preview() { try { this.pv = await this.api.post(`templates/${this.cur.id}/preview/`, { id: this.pid, model: this.cur.model }); } catch (e) { zToast(this.api.err(e), 'err'); } this.cd.markForCheck(); }
}


@Component({
  selector: 'z-flow-audit', standalone: true, imports: IMPORTS, styles: [FLOW_CSS],
  template: `
<div class="fw"><div class="fw-head"><div><h1>{{ 'Configuration changes' | t }}</h1><p>{{ 'Who created, changed, activated, archived or deleted rules, approval flows and templates.' | t }}</p></div></div>
  <div class="fw-card" style="padding:0;overflow:hidden"><table class="fw-table" zPlain><thead><tr><th>{{ 'When' | t }}</th><th>{{ 'User' | t }}</th><th>{{ 'What' | t }}</th><th>{{ 'Action' | t }}</th><th>{{ 'Detail' | t }}</th></tr></thead>
    <tbody><tr *ngFor="let a of rows"><td class="fw-muted" style="white-space:nowrap">{{ a.at | date:'dd/MM/yy HH:mm' }}</td><td>{{ a.user }}</td><td>{{ a.kind }} #{{ a.object_id }}</td><td>{{ a.action }}</td><td class="fw-small">{{ a.detail | json }}</td></tr>
    <tr *ngIf="!rows.length && loaded"><td colspan="5" class="fw-empty">{{ 'Nothing yet.' | t }}</td></tr></tbody></table></div></div>`,
})
export class FlowAuditComponent implements OnInit {
  rows: any[] = []; loaded = false;
  constructor(private api: FlowService, private cd: ChangeDetectorRef) {}
  async ngOnInit() { try { this.rows = await this.api.get('audit/'); } catch (e) { zToast(this.api.err(e), 'err'); } this.loaded = true; this.cd.markForCheck(); }
}
