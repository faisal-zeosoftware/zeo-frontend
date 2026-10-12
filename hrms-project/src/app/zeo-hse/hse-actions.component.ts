import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { HSE_BASE, HseApiService, csv, day, stClass, today, when } from './hse-api.service';

/** Raise a corrective / preventive action from any record. */
@Component({
  selector: 'hse-new-action',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(680px,100%)">
    <header><h2>New corrective action{{ ref ? ' – ' + ref : '' }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <label class="wide">Action *<input [(ngModel)]="f.title" maxlength="255" placeholder="What must be done"></label>
        <label class="wide">Details<textarea [(ngModel)]="f.description" rows="3"></textarea></label>
        <label>Owner *<select [(ngModel)]="f.owner"><option [ngValue]="null">Choose…</option><option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
        <label>Due date *<input type="date" [(ngModel)]="f.due_date"></label>
        <label>Priority<select [(ngModel)]="f.priority"><option *ngFor="let p of lk.priorities" [value]="p.value">{{ p.label }}</option></select></label>
        <label>Type<select [(ngModel)]="f.kind"><option value="corrective">Corrective</option><option value="preventive">Preventive</option></select></label>
        <label class="wide">Verifier (checks it worked – not the owner)<select [(ngModel)]="f.verifier"><option [ngValue]="null">HSE officer</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
      </div>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Saving…' : 'Raise action' }}</button>
    </footer>
  </div>
</div>`,
})
export class HseNewActionComponent implements OnInit {
  @Input() source = 'manual';
  @Input() sourceId: number | null = null;
  @Input() ref = '';
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { employees: [], priorities: [] };
  f: any = { title: '', description: '', owner: null, due_date: '', priority: 'medium', kind: 'corrective', verifier: null };
  err = '';
  busy = false;

  constructor(private api: HseApiService) {}

  async ngOnInit(): Promise<void> {
    this.f.title = this.title;
    const d = new Date(); d.setDate(d.getDate() + 14); this.f.due_date = d.toISOString().slice(0, 10);
    try { this.lk = await this.api.lookups(); } catch (e) { this.err = HseApiService.error(e); }
  }

  async save(): Promise<void> {
    this.err = '';
    if (!this.f.title.trim() || !this.f.owner || !this.f.due_date) { this.err = 'Action, owner and due date are required.'; return; }
    if (this.f.verifier && this.f.verifier === this.f.owner) { this.err = 'The verifier must be someone other than the owner.'; return; }
    this.busy = true;
    try { this.saved.emit(await this.api.post('actions/', { ...this.f, source: this.source, source_id: this.sourceId })); }
    catch (e) { this.err = HseApiService.error(e); }
    this.busy = false;
  }
}

/** One action: progress, evidence, independent verification, reassignment with reason. */
@Component({
  selector: 'hse-action-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(760px,100%)" *ngIf="a">
    <header><h2><span class="hs-code">{{ a.number }}</span> {{ a.title }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="hs-kv3" style="margin-bottom:12px">
        <div><small>Status</small><b><span class="hs-b" [ngClass]="cls(a.status)">{{ a.status_label }}</span></b></div>
        <div><small>Owner</small><b>{{ a.owner?.name }}</b></div>
        <div><small>Due</small><b [style.color]="a.overdue ? '#b42318' : null">{{ d(a.due_date) }}{{ a.overdue ? ' (' + a.days_late + ' d late)' : '' }}</b></div>
        <div><small>Priority</small><b>{{ a.priority_label }}</b></div>
        <div><small>From</small><b>{{ a.source_label }} {{ a.source_ref }}</b></div>
        <div><small>Verifier</small><b>{{ a.verifier?.name || 'HSE officer' }}</b></div>
      </div>
      <p style="white-space:pre-wrap;font-size:13.5px" *ngIf="a.description">{{ a.description }}</p>
      <div class="hs-note ok" *ngIf="a.evidence"><b>Evidence:</b> {{ a.evidence }}</div>
      <div class="hs-note" *ngIf="a.verification_note"><b>Verification:</b> {{ a.verification_note }}</div>

      <ng-container *ngIf="['open', 'in_progress', 'rejected'].includes(a.status)">
        <div class="ex-form" style="margin-top:10px">
          <label class="wide">What was done (evidence)<textarea [(ngModel)]="evidence" rows="3"></textarea></label>
          <label class="wide">Photos / documents<input type="file" multiple (change)="files = toList($any($event.target).files)"></label>
        </div>
        <div class="hs-acts" style="margin-top:8px">
          <button type="button" class="ex-btn" *ngIf="a.status !== 'in_progress'" (click)="step('start')">Start</button>
          <button type="button" class="ex-btn primary" (click)="done()">Mark done</button>
        </div>
      </ng-container>
      <ng-container *ngIf="a.status === 'done'">
        <div class="ex-form" style="margin-top:10px"><label class="wide">Verification note<textarea [(ngModel)]="note" rows="2"></textarea></label></div>
        <div class="hs-acts" style="margin-top:8px">
          <button type="button" class="ex-btn green" (click)="verify(true)">Effective – close</button>
          <button type="button" class="ex-btn danger" (click)="verify(false)">Not effective – reopen</button>
        </div>
      </ng-container>
      <details style="margin-top:14px" *ngIf="staff && !['closed','cancelled'].includes(a.status)">
        <summary style="cursor:pointer;font-size:13px;color:#4338ca">Reassign / change due date / cancel</summary>
        <div class="ex-form" style="margin-top:8px">
          <label>Owner<select [(ngModel)]="ch.owner"><option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
          <label>Due date<input type="date" [(ngModel)]="ch.due_date"></label>
          <label class="wide">Reason (kept in the history) *<input [(ngModel)]="ch.reason"></label>
        </div>
        <div class="hs-acts" style="margin-top:8px"><button type="button" class="ex-btn" (click)="change()">Save change</button>
          <button type="button" class="ex-btn danger" (click)="cancel()">Cancel action</button></div>
      </details>
      <div class="hs-files" style="margin-top:10px"><button type="button" class="hs-file" *ngFor="let f of a.files" (click)="api.download(f.id, f.name)">📎 {{ f.name }}</button></div>
      <div class="hs-section">History</div>
      <div class="hs-ev" *ngFor="let h of a.history"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div>
    </div>
  </div>
</div>`,
})
export class HseActionViewComponent implements OnInit {
  @Input() id!: number;
  @Input() staff = false;
  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<any>();
  a: any = null;
  lk: any = { employees: [] };
  evidence = '';
  note = '';
  files: File[] = [];
  ch: any = { owner: null, due_date: '', reason: '' };
  err = '';
  w = when;
  d = day;
  cls = stClass;

  constructor(public api: HseApiService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.lk = await this.api.lookups();
      this.set(await this.api.get(`actions/${this.id}/`));
    } catch (e) { this.err = HseApiService.error(e); }
  }

  set(a: any): void { this.a = a; this.ch = { owner: a.owner?.id, due_date: a.due_date, reason: '' }; this.changed.emit(a); }
  toList(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }

  async step(s: string, body: any = {}): Promise<void> {
    this.err = '';
    try { this.set(await this.api.post(`actions/${this.id}/${s}/`, body)); } catch (e) { this.err = HseApiService.error(e); }
  }

  async done(): Promise<void> {
    if (this.files.length) {
      try { await this.api.postQ('files/', { model: 'action', id: this.id }, HseApiService.form({}, this.files)); } catch (e) { this.err = HseApiService.error(e); return; }
    }
    await this.step('done', { evidence: this.evidence });
  }

  verify(ok: boolean): Promise<void> { return this.step('verify', { effective: ok, note: this.note }); }

  async change(): Promise<void> {
    this.err = '';
    try { this.set(await this.api.patch(`actions/${this.id}/`, this.ch)); } catch (e) { this.err = HseApiService.error(e); }
  }

  async cancel(): Promise<void> {
    if (!this.ch.reason) { this.err = 'Give the reason for cancelling.'; return; }
    try { this.set(await this.api.patch(`actions/${this.id}/`, { status: 'cancelled', reason: this.ch.reason })); } catch (e) { this.err = HseApiService.error(e); }
  }
}

/** Central CAPA register: every corrective / preventive action from every module. */
@Component({
  selector: 'app-hse-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HseNewActionComponent, HseActionViewComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Corrective actions (CAPA)</h1>
          <p class="ex-desc">One register for actions from incidents, audits, inspections, risk assessments, permits, observations, quality, environment, hygiene, compliance and reviews. Owners complete them with evidence; someone else verifies they worked.</p></div>
        <div class="ex-actions"><button type="button" class="ex-btn" (click)="export()" [disabled]="!rows.length">Export CSV</button>
          <button type="button" class="ex-btn primary" *ngIf="lk.rights?.staff" (click)="creating = true">+ New action</button></div>
      </div>
      <div class="hs-filters"><div class="hs-pill-row">
        <button type="button" class="hs-chip" *ngFor="let v of views" [class.on]="view === v.k" (click)="view = v.k; load()">{{ v.l }}</button></div></div>
      <div class="hs-filters">
        <select [(ngModel)]="source" (ngModelChange)="load()" aria-label="Source"><option value="">Every source</option>
          <option *ngFor="let s of sources" [value]="s.v">{{ s.l }}</option></select>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
      <div class="hs-scroll"><table class="hs-table zl-hse">
        <tr><th>Action</th><th>Branch</th><th>From</th><th>Owner</th><th>Priority</th><th>Due</th><th>Status</th></tr>
        <tr class="click" *ngFor="let a of rows" (click)="openId = a.id">
          <td><span class="hs-code">{{ a.number }}</span><div style="font-weight:600;color:#1b1640">{{ a.title }}</div><div class="hs-muted">{{ a.site_name }}</div></td><td>{{ a.branch_name }}</td>
          <td>{{ a.source_label }}<div class="hs-muted">{{ a.source_ref }}</div></td>
          <td>{{ a.owner?.name }}</td><td><span class="hs-b" [ngClass]="'pr-' + a.priority">{{ a.priority_label }}</span></td>
          <td [style.color]="a.overdue ? '#b42318' : null">{{ d(a.due_date) }}<div class="hs-muted" *ngIf="a.overdue">{{ a.days_late }} d late</div></td>
          <td><span class="hs-b" [ngClass]="cls(a.status)">{{ a.status_label }}</span></td>
        </tr></table></div>
      <p class="hs-empty" *ngIf="!rows.length">No actions.</p>
    </div>
  </div>
</div>
<hse-new-action *ngIf="creating" (closed)="creating = false" (saved)="creating = false; load(); openId = $event.id"></hse-new-action>
<hse-action-view *ngIf="openId" [id]="openId" [staff]="!!lk.rights?.staff" (closed)="openId = null; load()"></hse-action-view>`,
})
export class HseActionsComponent implements OnInit {
  lk: any = { rights: {} };
  rows: any[] = [];
  view = 'open';
  source = '';
  views = [{ k: 'open', l: 'Open' }, { k: 'mine', l: 'Mine' }, { k: 'overdue', l: 'Overdue' }, { k: 'verify', l: 'To verify' }, { k: '', l: 'All' }];
  sources = [['incident', 'Incident'], ['inspection', 'Inspection'], ['permit', 'Permit'], ['risk', 'Risk assessment'], ['observation', 'BBS observation'],
             ['moc', 'Change (MOC)'], ['audit', 'Audit finding'], ['quality', 'Quality NC'], ['environment', 'Environmental'], ['hygiene', 'Industrial hygiene'],
             ['compliance', 'Compliance'], ['review', 'Management review'], ['ergonomics', 'Ergonomics'], ['chemical', 'Chemical'], ['health', 'Occupational health'],
             ['kpi', 'KPI deviation'], ['manual', 'Other']].map(([v, l]) => ({ v, l }));
  creating = false;
  openId: number | null = null;
  msg = '';
  d = day;
  cls = stClass;

  constructor(private api: HseApiService, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('view') !== null) this.view = qp.get('view') || '';
    if (qp.get('open')) this.openId = Number(qp.get('open'));
    try { this.lk = await this.api.lookups(); } catch { /* list still loads */ }
    await this.load();
  }

  async load(): Promise<void> {
    try {
      const r = await this.api.get('actions/', { view: this.view, limit: 1000 });
      this.rows = this.source ? r.results.filter((a: any) => a.source === this.source) : r.results;
    } catch (e) { this.msg = HseApiService.error(e); }
  }

  export(): void {
    csv('hse-actions.csv', [{ key: 'number', label: 'Action' }, { key: 'title', label: 'Title' }, { key: 'source_label', label: 'Source' },
      { key: 'source_ref', label: 'Reference' }, { key: 'owner_name', label: 'Owner' }, { key: 'priority_label', label: 'Priority' },
      { key: 'due_date', label: 'Due' }, { key: 'status_label', label: 'Status' }], this.rows.map(a => ({ ...a, owner_name: a.owner?.name })));
  }
}
