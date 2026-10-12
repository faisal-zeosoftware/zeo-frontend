import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PRIORITY_CLASS, SLA_LABEL, STAGE_CLASS, ZP_BASE, ZpApiService, day, minutes, num, slaText, today, when } from './zp-api.service';

const STAGE_ACTION: Record<string, string> = {
  assigned: 'Assigned', in_progress: 'Start work', waiting_customer: 'Ask the customer', waiting_internal: 'Waiting for internal team',
  testing: 'Testing', resolved: 'Resolve', closed: 'Close', reopened: 'Reopen', under_development: 'Back to development',
};

/** One ticket (v1.14.0): conversation with the customer and internal notes, stage, assignment, SLA, AMC coverage,
 *  work logs and development request. */
@Component({
  selector: 'app-zp-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div style="min-width:0">
          <button type="button" class="ex-btn sm" (click)="back()">← Tickets</button>
          <h1 class="page-title" style="margin-top:8px" *ngIf="t"><span class="zp-code">{{ t.number }}</span> {{ t.subject }}</h1>
          <div class="zp-pill-row" *ngIf="t" style="margin-top:6px">
            <span class="zp-b" [ngClass]="sc[t.stage]">{{ t.stage_label }}</span>
            <span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority_label }}</span>
            <span class="zp-b" [ngClass]="'sla-' + t.sla_state">SLA: {{ sla(t) }}</span>
            <span class="zp-b" [ngClass]="t.billable_status">{{ t.billable_label }}</span>
            <span class="zp-b" *ngIf="t.escalation_level">Escalated ×{{ t.escalation_level }}</span>
            <span class="zp-b" *ngIf="t.approval_status !== 'none'" [ngClass]="t.approval_status === 'pending' ? 'pr-high' : t.approval_status === 'rejected' ? 'pr-critical' : 'st-done'">{{ t.approval_status_label }}{{ t.approval_reason_label ? ' · ' + t.approval_reason_label : '' }}</span>
            <span class="zp-b">{{ t.channel_label }}</span>
          </div>
        </div>
        <div class="ex-actions" *ngIf="t">
          <a class="ex-btn" *ngIf="t.whatsapp_phone" [href]="wa()" target="_blank" rel="noopener" title="Opens WhatsApp with a prepared message (no paid service)">WhatsApp</a>
          <button type="button" class="ex-btn" *ngIf="t.can_work && !t.assigned_to && me && t.approval_status !== 'pending'" (click)="assignMe()">Take it</button>
          <ng-container *ngFor="let s of t.allowed_stages">
            <button type="button" class="ex-btn" [class.primary]="s === 'resolved' || s === 'in_progress'" [class.green]="s === 'closed'"
                    *ngIf="s !== 'assigned'" (click)="askStage(s)">{{ label(s) }}</button>
          </ng-container>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <p class="ex-muted" *ngIf="!t && !msg">Loading…</p>
      <div class="zp-split" *ngIf="t">
        <div style="min-width:0;display:flex;flex-direction:column;gap:14px">
          <div class="zp-note" *ngIf="stageAsk">
            <b>{{ label(stageAsk) }}</b>
            <div class="ex-form" style="margin-top:8px">
              <label class="wide">{{ stageAsk === 'resolved' ? 'Resolution notes (sent to the customer) *' : stageAsk === 'waiting_customer' ? 'What do you need from the customer? (sent to them)' : 'Note' }}
                <textarea [(ngModel)]="stageNote" rows="3"></textarea></label>
            </div>
            <div class="zp-acts" style="margin-top:8px">
              <button type="button" class="ex-btn primary" (click)="setStage()" [disabled]="busy">Confirm</button>
              <button type="button" class="ex-btn" (click)="stageAsk = ''">Cancel</button>
            </div>
          </div>
          <div class="zp-card zp-approval" *ngIf="t.approval_status === 'pending' || t.approval_status === 'rejected' || askTime">
            <h3>Approval</h3>
            <ng-container *ngIf="t.approval_status === 'pending'">
              <p style="margin:0 0 8px" *ngIf="t.approval_reason === 'not_covered'"><b>Not covered by an AMC.</b> {{ t.coverage_note }} – a support manager approves the chargeable work before anyone starts.</p>
              <p style="margin:0 0 8px" *ngIf="t.approval_reason === 'over_hours'"><b>{{ n(t.approval_requested_hours) }} more hours requested.</b> {{ t.approval_note }}
                <span class="zp-muted">({{ n(t.hours_logged) }} h logged, limit {{ n(t.hours_limit) }} h)</span></p>
              <div class="ex-form" *ngIf="t.can_manage" style="margin-top:6px">
                <label *ngIf="t.approval_reason === 'over_hours'">Hours to approve<input type="number" min="0.25" step="0.25" [(ngModel)]="ap.hours"></label>
                <label *ngIf="t.approval_reason === 'not_covered' && !t.assigned_to">Assign to<select [(ngModel)]="ap.assigned_to"><option [ngValue]="null">Team rule (least busy)</option>
                  <option *ngFor="let x of lk.employees" [ngValue]="x.id">{{ x.name }}</option></select></label>
                <label class="wide">Note (required to reject)<input [(ngModel)]="ap.note" placeholder="e.g. quotation QT-120 accepted"></label>
                <div class="wide zp-acts"><button type="button" class="ex-btn green" (click)="decide('approve')" [disabled]="busy">Approve</button>
                  <button type="button" class="ex-btn danger" (click)="decide('reject')" [disabled]="busy">Reject</button></div>
              </div>
              <p class="zp-muted" style="margin:0" *ngIf="!t.can_manage">Waiting for a support manager.</p>
            </ng-container>
            <p style="margin:0" *ngIf="t.approval_status === 'rejected'"><b>Not approved</b> by {{ t.approval_by }} {{ w(t.approval_at) }}. {{ t.approval_note }}</p>
            <div class="ex-form" *ngIf="askTime" style="margin-top:6px">
              <label>More hours needed *<input type="number" min="0.25" step="0.25" [(ngModel)]="more.hours"></label>
              <label class="wide">Why *<textarea rows="2" [(ngModel)]="more.note" placeholder="What is left and why it takes longer"></textarea></label>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="askMore()" [disabled]="busy">Send to manager</button>
                <button type="button" class="ex-btn" (click)="askTime = false">Cancel</button></div>
            </div>
          </div>
          <div class="zp-card">
            <h3>Request</h3>
            <div style="white-space:pre-wrap;font-size:13.5px">{{ t.description || '(no details)' }}</div>
            <div class="zp-files" *ngIf="t.files.length">
              <button type="button" class="zp-file" *ngFor="let f of t.files" (click)="dl(f)">📎 {{ f.name }}{{ f.internal ? ' (internal)' : '' }}</button>
            </div>
            <div *ngIf="t.resolution_note" class="zp-note ok" style="margin:12px 0 0"><b>Resolution:</b> {{ t.resolution_note }}</div>
            <div *ngIf="t.satisfaction" class="zp-muted" style="margin-top:8px">Customer rating: {{ stars(t.satisfaction) }} {{ t.satisfaction_note }}</div>
          </div>
          <div class="zp-card">
            <h3>Conversation</h3>
            <div class="zp-chat">
              <div class="zp-msg" *ngFor="let m of t.messages" [class.internal]="m.internal" [class.customer]="m.from_customer && !m.internal" [class.staff]="!m.from_customer && !m.internal">
                <div class="who">{{ m.author || 'System' }} <small>{{ w(m.at) }}</small>
                  <span class="zp-b" *ngIf="m.internal">Internal note</span><span class="zp-b" *ngIf="m.via === 'email'">E-mail</span><span class="zp-b" *ngIf="m.via === 'portal'">Portal</span></div>
                <div class="body">{{ m.body }}</div>
                <div class="zp-files" *ngIf="m.files.length"><button type="button" class="zp-file" *ngFor="let f of m.files" (click)="dl(f)">📎 {{ f.name }}</button></div>
              </div>
              <p class="zp-empty" *ngIf="!t.messages.length">No messages yet.</p>
            </div>
            <div class="zp-compose" style="margin-top:12px" [class.internal]="internal">
              <div class="bar">
                <div class="zp-tabs2" *ngIf="t.can_work">
                  <button type="button" [class.on]="!internal" (click)="internal = false">Reply to customer</button>
                  <button type="button" [class.on]="internal" (click)="internal = true">Internal note</button>
                </div>
                <span class="zp-muted" *ngIf="!internal && t.contact_email">To: {{ t.contact_email }}</span>
              </div>
              <textarea [(ngModel)]="reply" [placeholder]="internal ? 'Only your colleagues see this note' : 'Write to the customer…'"></textarea>
              <div class="bar">
                <input type="file" multiple (change)="files = list($any($event.target).files)">
                <button type="button" class="ex-btn primary" (click)="send()" [disabled]="busy || (!reply.trim() && !files.length)">{{ internal ? 'Add note' : 'Send' }}</button>
              </div>
            </div>
          </div>
          <div class="zp-card" *ngIf="t.dev_requests?.length || t.can_work">
            <h3>Development</h3>
            <div *ngFor="let d of t.dev_requests" class="ex-row click" (click)="go('dev-requests', d.id)">
              <div class="main"><div class="t"><span class="zp-code">{{ d.number }}</span> {{ d.title }}</div>
                <div class="s">{{ d.estimated_hours }} h · {{ d.chargeable ? 'chargeable' : 'not charged' }}{{ d.task_id ? ' · task created' : '' }}</div></div>
              <div class="r"><span class="ex-tag">{{ d.status_label }}</span></div>
            </div>
            <ng-container *ngIf="t.can_work && !openDev() && t.is_open">
              <button type="button" class="ex-btn" *ngIf="!devForm" (click)="startDev()">Raise development request</button>
              <div class="ex-form" *ngIf="devForm" style="margin-top:8px">
                <label class="wide">Title *<input [(ngModel)]="dev.title"></label>
                <label class="wide">Issue *<textarea [(ngModel)]="dev.issue" rows="3"></textarea></label>
                <label class="wide">Proposed solution<textarea [(ngModel)]="dev.proposed_solution" rows="3"></textarea></label>
                <label>Estimated hours<input type="number" min="0" step="0.5" [(ngModel)]="dev.estimated_hours"></label>
                <label>Estimated cost<input type="number" min="0" [(ngModel)]="dev.estimated_cost"></label>
                <label class="ck"><input type="checkbox" [(ngModel)]="dev.chargeable"> Chargeable to the customer</label>
                <label class="ck"><input type="checkbox" [(ngModel)]="dev.needs_customer_approval"> Customer must approve first</label>
                <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="raiseDev()" [disabled]="busy">Send for approval</button>
                  <button type="button" class="ex-btn" (click)="devForm = false">Cancel</button></div>
              </div>
            </ng-container>
          </div>
          <div class="zp-card">
            <h3>History</h3>
            <div class="zp-ev" *ngFor="let e of t.events"><div class="t">{{ e.text }}</div><div class="m">{{ e.by }} · {{ w(e.at) }}</div></div>
          </div>
        </div>
        <div class="zp-side">
          <div class="zp-card">
            <h3>SLA</h3>
            <dl class="zp-kv">
              <dt>Policy</dt><dd>{{ t.sla_policy || '–' }} {{ t.sla_business_hours ? '(working hours)' : '(24/7)' }}</dd>
              <dt>Respond in</dt><dd>{{ t.response_target || '–' }}</dd>
              <dt>Respond by</dt><dd>{{ w(t.response_due) || '–' }} <span class="zp-b sla-breached" *ngIf="t.response_breached">missed</span></dd>
              <dt>First reply</dt><dd>{{ w(t.first_response_at) || 'not yet' }}</dd>
              <dt>Resolve in</dt><dd>{{ t.resolution_target || '–' }}</dd>
              <dt>Resolve by</dt><dd>{{ w(t.resolution_due) || '–' }}</dd>
              <dt>Status</dt><dd><span class="zp-b" [ngClass]="'sla-' + t.sla_state">{{ sla(t) }}</span></dd>
            </dl>
          </div>
          <div class="zp-card">
            <h3>Details</h3>
            <ng-container *ngIf="!editing">
              <dl class="zp-kv">
                <dt>Customer</dt><dd>{{ t.customer_name }}</dd>
                <dt>Contact</dt><dd>{{ t.contact_name || '–' }}<div class="zp-muted">{{ t.contact_email }}</div></dd>
                <dt>Product</dt><dd>{{ t.product_name || '–' }}</dd>
                <dt>Category</dt><dd>{{ t.category_name || '–' }}</dd>
                <dt>Channel</dt><dd>{{ t.channel_label }}</dd>
                <dt>AMC</dt><dd>{{ t.contract_number || 'none' }}<div class="zp-muted">{{ t.coverage_note }}</div></dd>
                <dt>Created</dt><dd>{{ w(t.created_at) }}</dd>
              </dl>
              <button type="button" class="ex-btn sm" style="margin-top:10px" *ngIf="t.can_work" (click)="startEdit()">Change</button>
            </ng-container>
            <div class="ex-form" *ngIf="editing" style="grid-template-columns:1fr">
              <label>Priority<select [(ngModel)]="e.priority"><option *ngFor="let p of lk.priorities" [value]="p.value">{{ p.label }}</option></select></label>
              <label>Product<select [(ngModel)]="e.product"><option [ngValue]="null">–</option><option *ngFor="let p of lk.products" [ngValue]="p.id">{{ p.name }}</option></select></label>
              <label>Category<select [(ngModel)]="e.category"><option [ngValue]="null">–</option><option *ngFor="let c of lk.categories" [ngValue]="c.id">{{ c.name }}</option></select></label>
              <label>Billing<select [(ngModel)]="e.billable_status"><option *ngFor="let b of lk.billable" [value]="b.value">{{ b.label }}</option></select></label>
              <div class="zp-acts"><button type="button" class="ex-btn primary" (click)="saveEdit()" [disabled]="busy">Save</button><button type="button" class="ex-btn" (click)="editing = false">Cancel</button></div>
            </div>
          </div>
          <div class="zp-card" *ngIf="t.contract_usage">
            <h3>AMC hours – {{ t.contract_number }}</h3>
            <ng-container *ngIf="!t.contract_usage.unlimited; else unl">
              <div class="zp-meter" [ngClass]="(t.contract_usage.used_pct || 0) > 100 ? 'bad' : (t.contract_usage.used_pct || 0) > 80 ? 'warn' : 'ok'"><div [style.width.%]="min(t.contract_usage.used_pct)"></div></div>
              <p class="zp-muted" style="margin:6px 0 0">{{ n(t.contract_usage.used_hours) }} of {{ n(t.contract_usage.included_hours) }} h used · {{ n(t.contract_usage.remaining_hours) }} h left</p>
            </ng-container>
            <ng-template #unl><p class="zp-muted">Unlimited hours · {{ n(t.contract_usage.used_hours) }} h used</p></ng-template>
          </div>
          <div class="zp-card">
            <h3>Assignment</h3>
            <dl class="zp-kv"><dt>Team</dt><dd>{{ t.team_name || '–' }}</dd><dt>Engineer</dt><dd>{{ t.assigned_to?.name || 'not assigned' }}</dd></dl>
            <div class="ex-form" style="grid-template-columns:1fr;margin-top:10px" *ngIf="t.can_manage">
              <label>Team<select [(ngModel)]="asg.team"><option [ngValue]="null">–</option><option *ngFor="let x of lk.teams" [ngValue]="x.id">{{ x.name }}</option></select></label>
              <label>Engineer<select [(ngModel)]="asg.employee"><option [ngValue]="null">–</option><option *ngFor="let x of lk.employees" [ngValue]="x.id">{{ x.name }} ({{ x.code }})</option></select></label>
              <button type="button" class="ex-btn" (click)="assign()" [disabled]="busy">Assign</button>
            </div>
          </div>
          <div class="zp-card" *ngIf="t.worklogs">
            <h3>Time · {{ n(t.hours) }} h<span *ngIf="t.hours_limit !== null" style="font-weight:500;text-transform:none;letter-spacing:0"> · {{ n(t.hours_limit) }} h allowed</span></h3>
            <div class="zp-ev" *ngFor="let l of t.worklogs">
              <div class="t">{{ l.employee?.name }} · {{ n(l.hours) }} h{{ l.onsite ? ' onsite' : '' }} <span class="zp-b" [class.chargeable]="l.billable">{{ l.billable ? 'chargeable' : l.counts_against_amc ? 'AMC' : 'not counted' }}</span>
                <div class="zp-muted">{{ l.description }}</div></div>
              <div class="m">{{ d(l.date) }}<br><span class="ex-tag" [ngClass]="l.status">{{ l.status }}</span></div>
            </div>
            <ng-container *ngIf="t.can_work">
              <div class="zp-acts" style="margin-top:8px" *ngIf="!logForm">
                <button type="button" class="ex-btn sm" (click)="logForm = true">+ Log time</button>
                <button type="button" class="ex-btn sm" *ngIf="t.hours_limit !== null && t.approval_status !== 'pending' && !t.can_manage" (click)="askTime = true">Ask for more time</button>
              </div>
              <div class="ex-form" style="grid-template-columns:1fr 1fr;margin-top:8px" *ngIf="logForm">
                <label>Date<input type="date" [(ngModel)]="log.date" [max]="today"></label>
                <label>Hours *<input type="number" min="0.25" max="24" step="0.25" [(ngModel)]="log.hours"></label>
                <label class="wide">What was done<textarea [(ngModel)]="log.description" rows="2"></textarea></label>
                <label class="ck"><input type="checkbox" [(ngModel)]="log.onsite"> Onsite</label>
                <label class="ck"><input type="checkbox" [(ngModel)]="log.billable"> Chargeable</label>
                <label>Travel cost<input type="number" min="0" [(ngModel)]="log.travel_cost"></label>
                <label>Other charges<input type="number" min="0" [(ngModel)]="log.other_charges"></label>
                <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveLog()" [disabled]="busy">Save</button><button type="button" class="ex-btn" (click)="logForm = false">Cancel</button></div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class ZpTicketComponent implements OnInit {
  t: any = null;
  lk: any = { priorities: [], products: [], categories: [], billable: [], teams: [], employees: [], rights: {} };
  msg = '';
  busy = false;
  reply = '';
  internal = false;
  files: File[] = [];
  stageAsk = '';
  stageNote = '';
  editing = false;
  e: any = {};
  asg: any = { team: null, employee: null };
  logForm = false;
  log: any = {};
  devForm = false;
  dev: any = {};
  me: number | null = null;
  ap: any = { hours: null, note: '', assigned_to: null };
  askTime = false;
  more: any = { hours: 1, note: '' };
  sc = STAGE_CLASS;
  pc = PRIORITY_CLASS;
  today = today();

  constructor(private api: ZpApiService, private route: ActivatedRoute, private router: Router) {}

  async ngOnInit(): Promise<void> {
    try { this.lk = await this.api.lookups(); this.me = this.lk.rights?.employee_id || null; } catch { /* page still loads */ }
    this.route.paramMap.subscribe(p => this.load(Number(p.get('id'))));
  }

  async load(id?: number): Promise<void> {
    try {
      this.t = await this.api.get(`tickets/${id || this.t.id}/`);
      this.asg = { team: this.t.team, employee: this.t.assigned_to?.id || null };
      this.ap = { hours: this.t.approval_requested_hours, note: '', assigned_to: null };
      this.log = { date: today(), hours: 1, description: '', onsite: false, billable: this.t.billable_status === 'chargeable', travel_cost: 0, other_charges: 0 };
      this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e, 'The ticket could not be opened.'); }
  }

  private async run(fn: () => Promise<any>): Promise<void> {
    this.busy = true;
    try { await fn(); await this.load(); this.msg = ''; }
    catch (e) { this.msg = ZpApiService.error(e); }
    this.busy = false;
  }

  label(s: string): string { return STAGE_ACTION[s] || s; }
  askStage(s: string): void { this.stageAsk = s; this.stageNote = s === 'resolved' ? (this.t.resolution_note || '') : ''; if (s === 'in_progress' || s === 'closed') this.setStage(); }
  setStage(): Promise<void> {
    const s = this.stageAsk; this.stageAsk = '';
    return this.run(() => this.api.post(`tickets/${this.t.id}/stage/`, { stage: s, note: this.stageNote }));
  }

  send(): Promise<void> {
    const fd = ZpApiService.form({ body: this.reply, internal: this.internal }, this.files);
    return this.run(async () => { const r = await this.api.post(`tickets/${this.t.id}/messages/`, fd); this.reply = ''; this.files = []; return r; });
  }

  assignMe(): Promise<void> { return this.run(() => this.api.post(`tickets/${this.t.id}/assign/`, { employee: this.me })); }
  assign(): Promise<void> { return this.run(() => this.api.post(`tickets/${this.t.id}/assign/`, this.asg)); }

  startEdit(): void { this.e = { priority: this.t.priority, product: this.t.product, category: this.t.category, billable_status: this.t.billable_status }; this.editing = true; }
  saveEdit(): Promise<void> { this.editing = false; return this.run(() => this.api.patch(`tickets/${this.t.id}/`, this.e)); }

  async saveLog(): Promise<void> {
    if (!(Number(this.log.hours) > 0)) { this.msg = 'Enter the hours.'; return; }
    this.busy = true;
    try { await this.api.post(`tickets/${this.t.id}/worklogs/`, this.log); this.logForm = false; await this.load(); this.msg = ''; }
    catch (e: any) {
      this.msg = ZpApiService.error(e);
      if (e?.error?.approval || String(this.msg).includes('needs approval')) { this.askTime = true; this.logForm = false; }
    }
    this.busy = false;
  }

  decide(action: string): Promise<void> {
    if (action === 'reject' && !this.ap.note?.trim()) { this.msg = 'Give a reason for the rejection.'; return Promise.resolve(); }
    return this.run(() => this.api.post(`tickets/${this.t.id}/approval/`, { action, ...this.ap }));
  }
  askMore(): Promise<void> {
    if (!(Number(this.more.hours) > 0) || !this.more.note.trim()) { this.msg = 'Enter the hours and the reason.'; return Promise.resolve(); }
    this.askTime = false;
    return this.run(() => this.api.post(`tickets/${this.t.id}/approval/`, { action: 'request', ...this.more }));
  }
  /** wa.me link: opens WhatsApp (app or web) with the number and a prepared message – free, no API. */
  wa(): string {
    const phone = String(this.t.whatsapp_phone || '').replace(/[^0-9]/g, '').replace(/^00/, '');
    const text = `Hello ${this.t.contact_name || ''}, this is about your support ticket ${this.t.number} "${this.t.subject}". `;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  openDev(): boolean { return (this.t.dev_requests || []).some((d: any) => !['rejected', 'cancelled', 'done'].includes(d.status)); }
  startDev(): void {
    this.dev = { title: this.t.subject, issue: this.t.description, proposed_solution: '', estimated_hours: 0, estimated_cost: 0,
                 chargeable: this.t.billable_status === 'chargeable', needs_customer_approval: this.t.billable_status === 'chargeable' && this.t.customer };
    this.devForm = true;
  }
  raiseDev(): Promise<void> { this.devForm = false; return this.run(() => this.api.post(`tickets/${this.t.id}/dev-request/`, this.dev)); }

  dl(f: any): void { this.api.download(f.id, f.name).catch(e => this.msg = ZpApiService.error(e)); }
  list(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }
  back(): void { this.router.navigate([ZP_BASE, 'tickets']); }
  go(page: string, id: number): void { this.router.navigate([ZP_BASE, page, id]); }
  sla(t: any): string { return slaText(t) || SLA_LABEL[t.sla_state]; }
  w(v: any): string { return when(v); }
  d(v: any): string { return day(v); }
  n(v: any): string { return num(v); }
  m(v: any): string { return minutes(v); }
  min(v: any): number { return Math.min(100, Number(v || 0)); }
  stars(n: number): string { return '★'.repeat(n) + '☆'.repeat(5 - n); }
}
