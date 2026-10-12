import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HSE_BASE, HseApiService, csv, day, localDT, stClass, when } from './hse-api.service';

/** Request a permit to work. */
@Component({
  selector: 'hse-permit-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(860px,100%)">
    <header><h2>Request a {{ (lk.terms?.permit || 'permit to work').toLowerCase() }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <p class="hs-note" *ngIf="!types().length">No permit type is ready yet – the HSE manager must review the industry pack permit types first.</p>
      <div class="ex-form">
        <label>Permit type *<select [(ngModel)]="f.permit_type"><option [ngValue]="null">Choose…</option>
          <option *ngFor="let t of types()" [ngValue]="t.id">{{ t.name }} (max {{ t.max_hours }} h)</option></select></label>
        <label>{{ lk.terms?.site || 'Site' }} *<select [(ngModel)]="f.site" (ngModelChange)="f.area = null"><option [ngValue]="null">Choose…</option>
          <option *ngFor="let s of lk.sites" [ngValue]="s.id">{{ s.name }}</option></select></label>
        <label>{{ lk.terms?.area || 'Area' }}<select [(ngModel)]="f.area"><option [ngValue]="null">–</option><option *ngFor="let a of areas()" [ngValue]="a.id">{{ a.name }}</option></select></label>
        <label>Exact location / equipment tag<input [(ngModel)]="f.location"></label>
        <label class="wide">Work to be done *<textarea [(ngModel)]="f.description" rows="3"></textarea></label>
        <label>From *<input type="datetime-local" [(ngModel)]="f.valid_from"></label>
        <label>To *<input type="datetime-local" [(ngModel)]="f.valid_to"></label>
        <label *ngIf="lk.links?.assets">Equipment (asset register)<select [(ngModel)]="f.asset_id"><option [ngValue]="null">– not in the register –</option>
          <option *ngFor="let a of assets" [ngValue]="a.id">{{ a.label }}</option></select></label>
        <label>Equipment{{ lk.links?.assets ? ' (other / details)' : '' }}<input [(ngModel)]="f.equipment"></label>
        <label>{{ lk.terms?.contractor || 'Contractor' }}<select [(ngModel)]="f.contractor"><option [ngValue]="null">Own staff</option>
          <option *ngFor="let c of lk.contractors" [ngValue]="c.id">{{ c.name }}{{ c.status !== 'approved' ? ' (not approved)' : '' }}</option></select></label>
        <label>{{ lk.terms?.supervisor || 'Supervisor in charge' }}<select [(ngModel)]="f.receiver"><option [ngValue]="null">–</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
        <label>Risk assessment<select [(ngModel)]="f.risk_assessment"><option [ngValue]="null">–</option><option *ngFor="let r of risks" [ngValue]="r.id">{{ r.label }}</option></select></label>
        <div class="wide" style="display:flex;flex-direction:column;gap:4px"><span style="font-size:12px;font-weight:600;color:#6b7185">Crew</span>
          <input type="search" [(ngModel)]="crewQ" placeholder="Filter employees…" style="height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;font:inherit">
          <div class="hs-multi"><label *ngFor="let e of crewList()"><input type="checkbox" [checked]="f.crew.includes(e.id)" (change)="toggle(e.id)"> {{ e.name }}</label></div></div>
        <label class="wide" *ngIf="sel()?.requires_method_statement">Method statement<textarea [(ngModel)]="f.method_statement" rows="3" placeholder="Steps, controls, equipment, people"></textarea></label>
        <label class="wide">Conditions / precautions<textarea [(ngModel)]="f.precautions" rows="2"></textarea></label>
      </div>
      <p class="hs-muted" *ngIf="sel() as t">Needs: {{ needs(t) }}</p>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Saving…' : 'Save draft' }}</button>
    </footer>
  </div>
</div>`,
})
export class HsePermitFormComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { permit_types: [], sites: [], contractors: [], employees: [], terms: {} };
  risks: any[] = [];
  f: any = { permit_type: null, site: null, area: null, location: '', description: '', valid_from: '', valid_to: '', equipment: '', contractor: null,
             receiver: null, risk_assessment: null, crew: [], method_statement: '', precautions: '', asset_id: null };
  assets: any[] = [];
  crewQ = '';
  err = '';
  busy = false;

  constructor(private api: HseApiService) {}

  async ngOnInit(): Promise<void> {
    const s = new Date(); s.setMinutes(0, 0, 0); s.setHours(s.getHours() + 1);
    const e = new Date(s); e.setHours(e.getHours() + 8);
    this.f.valid_from = localDT(s); this.f.valid_to = localDT(e);
    try {
      this.lk = await this.api.lookups(); this.risks = (await this.api.options('risks')).filter(r => r.label.includes('(Approved)'));
      if (this.lk.links?.assets) this.assets = await this.api.options('assets').catch(() => []);
    }
    catch (e2) { this.err = HseApiService.error(e2); }
  }

  types(): any[] { return (this.lk.permit_types || []).filter((t: any) => t.usable); }
  sel(): any { return this.lk.permit_types.find((t: any) => t.id === this.f.permit_type); }
  areas(): any[] { return this.lk.sites.find((s: any) => s.id === this.f.site)?.areas || []; }
  crewList(): any[] { const q = this.crewQ.toLowerCase(); return (this.lk.employees || []).filter((e: any) => !q || e.name.toLowerCase().includes(q)).slice(0, 200); }
  toggle(id: number): void { const i = this.f.crew.indexOf(id); i >= 0 ? this.f.crew.splice(i, 1) : this.f.crew.push(id); }

  needs(t: any): string {
    return [t.requires_risk_assessment && 'approved risk assessment', t.requires_method_statement && 'method statement', t.requires_gas_test && 'gas test',
            t.requires_isolation && 'verified isolations', 'checklist', 'team briefing'].filter(Boolean).join(', ') + '.';
  }

  async save(): Promise<void> {
    this.err = '';
    if (!this.f.permit_type || !this.f.site || !this.f.description.trim()) { this.err = 'Permit type, site and the work are required.'; return; }
    this.busy = true;
    try {
      this.saved.emit(await this.api.post('permits/', { ...this.f, valid_from: new Date(this.f.valid_from).toISOString(), valid_to: new Date(this.f.valid_to).toISOString() }));
    } catch (e) { this.err = HseApiService.error(e); }
    this.busy = false;
  }
}

/** Permits to work: live board, requests, approvals, prerequisites, gas tests, isolations, issue / suspend / hand-back. */
@Component({
  selector: 'app-hse-permits',
  standalone: true,
  imports: [CommonModule, FormsModule, HsePermitFormComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <p class="hs-note err" *ngIf="msg" style="margin:16px;white-space:pre-wrap">{{ msg }}</p>
    <ng-container *ngIf="!id">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title">{{ lk.terms?.permit || 'Permits to work' }}</h1>
            <p class="ex-desc">High-risk work is authorised only when every control is in place – a complete form is not enough.</p></div>
          <div class="ex-actions"><button type="button" class="ex-btn" (click)="export()" [disabled]="!rows.length">Export CSV</button>
            <button type="button" class="ex-btn primary" (click)="creating = true">+ Request permit</button></div>
        </div>
        <div class="hs-filters"><div class="hs-pill-row">
          <button type="button" class="hs-chip" *ngFor="let v of views" [class.on]="view === v.k" (click)="view = v.k; load()">{{ v.l }}</button></div></div>
        <div class="hs-filters">
          <input type="search" [(ngModel)]="q" (ngModelChange)="soon()" placeholder="Search number, work, location…" aria-label="Search">
          <select [(ngModel)]="site" (ngModelChange)="load()" aria-label="Site"><option value="">All sites</option><option *ngFor="let s of lk.sites" [value]="s.id">{{ s.name }}</option></select>
          <select [(ngModel)]="type" (ngModelChange)="load()" aria-label="Type"><option value="">All types</option><option *ngFor="let t of lk.permit_types" [value]="t.id">{{ t.name }}</option></select>
        </div>
      </div>
      <div class="com_list mt-4">
        <div class="hs-board" *ngIf="view === 'live'">
          <div class="pc" *ngFor="let p of rows" [style.border-left-color]="p.color" (click)="open(p.id)">
            <b>{{ p.number }} · {{ p.type_name }}</b>{{ p.description }}
            <div class="hs-muted">{{ p.site_name }}{{ p.area_name ? ' / ' + p.area_name : '' }} {{ p.location }}</div>
            <div class="hs-muted">{{ w(p.valid_from) }} → {{ w(p.valid_to) }}</div>
            <span class="hs-b" [ngClass]="cls(p.status)">{{ p.status_label }}</span> <span class="hs-b bad" *ngIf="p.overrun">Validity ended</span></div>
        </div>
        <div class="hs-scroll" *ngIf="view !== 'live'"><table class="hs-table zl-hse">
          <tr><th>Permit</th><th>Type</th><th>Site / location</th><th>Branch</th><th>Valid</th><th>Applicant</th><th>Status</th></tr>
          <tr class="click" *ngFor="let p of rows" (click)="open(p.id)">
            <td><span class="hs-code" [style.background]="p.color + '22'" [style.color]="p.color">{{ p.number }}</span><div>{{ p.description }}</div></td>
            <td>{{ p.type_name }}</td><td>{{ p.site_name }}{{ p.area_name ? ' / ' + p.area_name : '' }}<div class="hs-muted">{{ p.location }}</div></td><td>{{ p.branch_name }}</td>
            <td class="hs-muted">{{ w(p.valid_from) }}<br>{{ w(p.valid_to) }}</td><td>{{ p.applicant?.name }}<div class="hs-muted">{{ p.contractor_name }}</div></td>
            <td><span class="hs-b" [ngClass]="cls(p.status)">{{ p.status_label }}</span></td></tr></table></div>
        <p class="hs-empty" *ngIf="!rows.length">No permits.</p>
      </div>
    </ng-container>

    <ng-container *ngIf="id && p">
      <div class="com_list mt-4">
        <div class="hs-permit-head" [style.background]="p.color">
          <button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button>
          <h2>{{ p.number }} · {{ p.type_name }}<div style="font-size:13px;font-weight:400;opacity:.9">{{ p.site_name }}{{ p.area_name ? ' / ' + p.area_name : '' }} {{ p.location }} · {{ w(p.valid_from) }} → {{ w(p.valid_to) }}</div></h2>
          <span class="hs-b" style="background:#fff;color:#1b1640">{{ p.status_label }}</span>
          <button type="button" class="ex-btn sm" (click)="pdf()">Print with QR</button>
        </div>
        <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
        <div class="hs-acts" style="margin-bottom:12px">
          <button type="button" class="ex-btn primary" *ngIf="['draft','rejected'].includes(p.status) && p.can?.edit" (click)="act('submit')">Submit for approval</button>
          <button type="button" class="ex-btn primary" *ngIf="p.can?.decide" (click)="act('approve')">Approve ({{ p.current_step?.label }})</button>
          <button type="button" class="ex-btn danger" *ngIf="p.can?.decide" (click)="act('reject', 'note', 'Reason for rejection')">Reject</button>
          <button type="button" class="ex-btn green" *ngIf="p.can?.issue" (click)="act('issue')">{{ p.status === 'suspended' ? 'Resume work' : 'Issue – work may start' }}</button>
          <button type="button" class="ex-btn danger" *ngIf="p.can?.suspend" (click)="act('suspend', 'reason', 'Why must work stop?')">Stop work (suspend)</button>
          <button type="button" class="ex-btn" *ngIf="p.can?.close" (click)="handback = { people_out: false, tools_removed: false, area_safe: false, isolations_handled: false, note: '' }">Hand back and close</button>
          <button type="button" class="ex-btn danger" *ngIf="p.can?.cancel" (click)="act('cancel', 'reason', 'Reason for cancelling')">Cancel</button>
        </div>
        <div class="hs-steps" *ngIf="p.steps?.length"><div class="s" *ngFor="let s of p.steps" [class.done]="s.status === 'approved'" [class.bad]="s.status === 'rejected'"
          [class.now]="s.status === 'pending' && s.role === p.current_step?.role">{{ s.label }}<div *ngIf="s.by" style="font-weight:400">{{ s.by }} · {{ w(s.at) }}</div></div></div>

        <div class="hs-split">
          <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
            <div class="hs-card"><h3>Work</h3>
              <p style="white-space:pre-wrap;font-size:13.5px;margin:0 0 8px">{{ p.description }}</p>
              <dl class="hs-kv"><dt>Applicant</dt><dd>{{ p.applicant?.name }}</dd><dt>Supervisor</dt><dd>{{ p.receiver?.name || '–' }}</dd>
                <dt>Crew</dt><dd>{{ crewNames() || '–' }} ({{ p.crew_size }})</dd><dt>Contractor</dt><dd>{{ p.contractor_name || 'Own staff' }}</dd>
                <dt>Equipment</dt><dd>{{ p.asset ? p.asset.label || p.asset.name : '' }}{{ p.asset && p.equipment ? ' – ' : '' }}{{ p.equipment || (p.asset ? '' : '–') }}
                  <span class="hs-b" *ngIf="p.asset" [ngClass]="p.asset.status === 'maintenance' || p.asset.status === 'disposed' ? 'st-bad' : 'ok'">{{ p.asset.status_label || p.asset.status }}</span>
                  <div class="hs-muted" *ngFor="let m of p.asset?.maintenance">{{ m.title }}: next {{ d(m.next_due_date) }}<b *ngIf="m.state === 'overdue'" style="color:#b42318"> – overdue</b></div></dd>
                <dt *ngIf="p.project_name">Project</dt><dd *ngIf="p.project_name">{{ p.project_name }}</dd>
                <dt>Risk assessment</dt><dd>{{ p.risk_number || '–' }}</dd>
                <dt>Precautions</dt><dd style="white-space:pre-wrap">{{ p.precautions || '–' }}</dd>
                <dt *ngIf="p.method_statement">Method statement</dt><dd *ngIf="p.method_statement" style="white-space:pre-wrap">{{ p.method_statement }}</dd>
                <dt *ngIf="p.suspension_reason">Suspended</dt><dd *ngIf="p.suspension_reason" style="color:#b42318">{{ p.suspension_reason }}</dd></dl>
            </div>

            <div class="hs-card" *ngIf="p.checklist?.length">
              <h3>{{ p.permit_type?.checklist_name || 'Checklist' }}</h3>
              <div class="hs-q" *ngFor="let q of p.checklist">
                <div><div class="sec">{{ q.section }}</div><span class="crit" *ngIf="q.critical" title="Critical – must be Yes">★</span>{{ q.text }}</div>
                <div class="hs-seg" *ngIf="q.type === 'yesno' || !q.type">
                  <button type="button" *ngFor="let o of yn" [class.on]="val(q.key) === o.v" [ngClass]="o.c" [disabled]="!p.can?.checklist" (click)="answer(q.key, o.v)">{{ o.l }}</button></div>
                <input *ngIf="q.type && q.type !== 'yesno'" [type]="q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : 'text'" [ngModel]="val(q.key)"
                       (ngModelChange)="answer(q.key, $event)" [disabled]="!p.can?.checklist" style="height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;width:140px">
              </div>
              <label class="ck" style="display:flex;gap:8px;margin-top:10px;font-size:13px"><input type="checkbox" [(ngModel)]="briefed" [disabled]="!p.can?.checklist" (ngModelChange)="dirty = true">
                The work team has been briefed on the hazards and controls (toolbox briefing)</label>
              <div class="hs-acts" style="margin-top:8px" *ngIf="dirty"><button type="button" class="ex-btn primary sm" (click)="saveChecklist()">Save checklist</button></div>
            </div>

            <div class="hs-card" *ngIf="p.permit_type?.requires_gas_test || p.gas_tests?.length">
              <h3>Gas tests <span class="hs-muted" style="text-transform:none;font-weight:400">limits {{ limits() }}{{ p.permit_type?.gas_retest_hours ? ' · retest every ' + p.permit_type.gas_retest_hours + ' h' : '' }}</span></h3>
              <table class="hs-table" zPlain *ngIf="p.gas_tests.length"><tr><th>Time</th><th class="r">O₂ %</th><th class="r">LEL %</th><th class="r">H₂S</th><th class="r">CO</th><th>Result</th><th>Tester</th></tr>
                <tr *ngFor="let g of p.gas_tests"><td>{{ w(g.tested_at) }}</td><td class="r">{{ g.o2 ?? '–' }}</td><td class="r">{{ g.lel ?? '–' }}</td><td class="r">{{ g.h2s ?? '–' }}</td><td class="r">{{ g.co ?? '–' }}</td>
                  <td><span class="hs-b" [ngClass]="g.passed ? 'ok' : 'bad'">{{ g.passed ? 'Pass' : 'FAIL' }}</span></td><td>{{ g.tester }}</td></tr></table>
              <div class="hs-target" *ngIf="p.can?.gas" style="margin-top:10px;grid-template-columns:repeat(5,minmax(0,1fr)) auto">
                <input type="number" step="any" [(ngModel)]="gas.o2" placeholder="O₂ %"><input type="number" step="any" [(ngModel)]="gas.lel" placeholder="LEL %">
                <input type="number" step="any" [(ngModel)]="gas.h2s" placeholder="H₂S ppm"><input type="number" step="any" [(ngModel)]="gas.co" placeholder="CO ppm">
                <input [(ngModel)]="gas.instrument" placeholder="Instrument"><button type="button" class="ex-btn primary sm" (click)="addGas()">Record</button></div>
            </div>

            <div class="hs-card" *ngIf="p.permit_type?.requires_isolation || p.isolations?.length">
              <h3>Isolations</h3>
              <table class="hs-table" zPlain *ngIf="p.isolations.length"><tr><th>Point</th><th>Type / method</th><th>Lock</th><th>Isolated</th><th>Verified</th><th></th></tr>
                <tr *ngFor="let x of p.isolations"><td>{{ x.point }}</td><td>{{ x.kind_label }}<div class="hs-muted">{{ x.method }}</div></td><td>{{ x.lock_no }}</td>
                  <td>{{ x.isolated_by }}<div class="hs-muted">{{ w(x.isolated_at) }}</div></td>
                  <td>{{ x.verified_by || '–' }}<div class="hs-muted">{{ w(x.verified_at) }}</div><span class="hs-b" *ngIf="x.removed_at">Removed</span></td>
                  <td><button type="button" class="ex-btn sm" *ngIf="p.can?.isolate && !x.verified_at" (click)="iso(x.id, 'verify')">Verify</button>
                    <button type="button" class="ex-btn sm" *ngIf="p.can?.isolate && x.verified_at && !x.removed_at && p.status !== 'active'" (click)="iso(x.id, 'remove')">Remove</button></td></tr></table>
              <div class="hs-target" *ngIf="p.can?.isolate" style="margin-top:10px;grid-template-columns:2fr 1fr 2fr 1fr auto">
                <input [(ngModel)]="isoF.point" placeholder="Isolation point / tag"><select [(ngModel)]="isoF.kind" style="height:30px;border:1px solid #dcdfea;border-radius:6px">
                  <option *ngFor="let k of lk.isolation_kinds" [value]="k.value">{{ k.label }}</option></select>
                <input [(ngModel)]="isoF.method" placeholder="Lock, blind, DBB…"><input [(ngModel)]="isoF.lock_no" placeholder="Lock no."><button type="button" class="ex-btn primary sm" (click)="addIso()">Add</button></div>
              <p class="hs-muted">A second authorised person verifies each isolation. Isolations stay in place while work is in progress.</p>
            </div>
          </div>
          <div class="hs-side">
            <div class="hs-card"><h3>Before issue</h3>
              <div class="hs-pre"><div class="p" *ngFor="let x of p.prerequisites" [class.ok]="x.ok" [class.no]="!x.ok"><i>{{ x.ok ? '✓' : '✗' }}</i><div>{{ x.label }}<small *ngIf="!x.ok && x.detail">{{ x.detail }}</small></div></div></div>
            </div>
            <div class="hs-card" *ngIf="p.simops?.length"><h3>Simultaneous operations</h3>
              <div class="hs-ev" *ngFor="let s of p.simops"><div class="t"><a href="javascript:void(0)" (click)="open(s.id)">{{ s.number }}</a> {{ s.type }} {{ s.area }}</div>
                <div class="m"><span class="hs-b" [ngClass]="s.conflict ? 'bad' : ''">{{ s.conflict ? 'Conflict' : s.status }}</span></div></div></div>
            <div class="hs-card"><h3>Files</h3>
              <div class="hs-files"><button type="button" class="hs-file" *ngFor="let f of p.files" (click)="api.download(f.id, f.name)">📎 {{ f.name }}</button></div>
              <label class="ex-btn sm" style="margin-top:6px;cursor:pointer">Attach…<input type="file" multiple hidden (change)="attach($any($event.target).files)"></label></div>
            <div class="hs-card"><h3>History</h3><div class="hs-ev" *ngFor="let h of p.history"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div></div>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</div>
<hse-permit-form *ngIf="creating" (closed)="creating = false" (saved)="creating = false; open($event.id)"></hse-permit-form>
<div class="ex-back" *ngIf="handback" (click)="handback = null">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(560px,100%)">
    <header><h2>Hand back {{ p?.number }}</h2><button type="button" (click)="handback = null" aria-label="Close">×</button></header>
    <div class="body"><div class="ex-form">
      <label class="ck wide"><input type="checkbox" [(ngModel)]="handback.people_out"> All people out and accounted for</label>
      <label class="ck wide"><input type="checkbox" [(ngModel)]="handback.tools_removed"> Tools, equipment and materials removed</label>
      <label class="ck wide"><input type="checkbox" [(ngModel)]="handback.area_safe"> Area left safe and clean</label>
      <label class="ck wide"><input type="checkbox" [(ngModel)]="handback.isolations_handled"> Isolations removed or kept under another certificate</label>
      <label class="wide">Work status / note<textarea [(ngModel)]="handback.note" rows="2"></textarea></label></div></div>
    <footer><button type="button" class="ex-btn" (click)="handback = null">Cancel</button><button type="button" class="ex-btn primary" (click)="closePermit()">Close permit</button></footer>
  </div>
</div>`,
})
export class HsePermitsComponent implements OnInit, OnDestroy {
  lk: any = { sites: [], permit_types: [], terms: {}, isolation_kinds: [] };
  rows: any[] = [];
  id: number | null = null;
  p: any = null;
  view = 'live';
  views = [{ k: 'live', l: 'Live board' }, { k: 'waiting', l: 'Waiting for approval' }, { k: 'mine', l: 'My requests' }, { k: '', l: 'All' }];
  q = '';
  site = '';
  type = '';
  creating = false;
  answers: any = {};
  briefed = false;
  dirty = false;
  gas: any = {};
  isoF: any = { point: '', kind: 'electrical', method: '', lock_no: '' };
  handback: any = null;
  yn = [{ v: 'yes', l: 'Yes', c: 'y' }, { v: 'no', l: 'No', c: 'n' }, { v: 'na', l: 'N/A', c: 'na' }];
  msg = '';
  ok = '';
  w = when;
  d = day;
  cls = stClass;
  private sub?: Subscription;
  private timer: any;

  constructor(public api: HseApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async pm => {
      this.id = pm.get('id') ? Number(pm.get('id')) : null;
      this.msg = ''; this.ok = '';
      const qp = this.route.snapshot.queryParamMap;
      if (this.route.snapshot.data['view']) this.view = this.route.snapshot.data['view'];
      if (qp.get('view') !== null) this.view = qp.get('view') || '';
      if (qp.get('new')) this.creating = true;
      try { this.lk = await this.api.lookups(); } catch (e) { this.msg = HseApiService.error(e); }
      if (this.id) await this.reload(); else await this.load();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }

  async load(): Promise<void> {
    try { this.rows = (await this.api.get('permits/', { view: this.view, q: this.q, site: this.site, type: this.type, limit: 1000 })).results; }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  async reload(): Promise<void> { try { this.set(await this.api.get(`permits/${this.id}/`)); } catch (e) { this.msg = HseApiService.error(e); } }

  set(p: any): void {
    this.p = p;
    this.answers = JSON.parse(JSON.stringify(p.checklist_answers || {}));
    this.briefed = p.team_briefed;
    this.dirty = false;
  }

  open(id: number): void { this.router.navigate([HSE_BASE, 'permits', id]); }
  back(): void { this.router.navigate([HSE_BASE, 'permits']); }
  crewNames(): string { return (this.p.crew || []).map((e: any) => e.name).join(', '); }
  val(k: string): any { return this.answers[k]?.value ?? ''; }
  answer(k: string, v: any): void { this.answers[k] = { ...(this.answers[k] || {}), value: v }; this.dirty = true; }
  limits(): string { return Object.entries(this.p.permit_type?.gas_limits || {}).map(([k, v]: any) => `${k} ${v[0]}–${v[1]}`).join(', ') || '–'; }

  private async call(fn: () => Promise<any>, done: string): Promise<void> {
    this.msg = ''; this.ok = '';
    try { this.set(await fn()); this.ok = done; } catch (e) { this.msg = HseApiService.error(e); }
  }

  act(a: string, field = '', ask = ''): Promise<void> {
    const body: any = {};
    if (field) { const v = prompt(ask) || ''; if (!v.trim()) return Promise.resolve(); body[field] = v; }
    return this.call(() => this.api.post(`permits/${this.id}/${a}/`, body), 'Done.');
  }

  saveChecklist(): Promise<void> {
    return this.call(() => this.api.patch(`permits/${this.id}/`, { checklist_answers: this.answers, team_briefed: this.briefed }), 'Checklist saved.');
  }

  addGas(): Promise<void> { return this.call(() => this.api.post(`permits/${this.id}/gas-tests/`, this.gas), 'Gas test recorded.').then(() => { this.gas = {}; }); }
  addIso(): Promise<void> { return this.call(() => this.api.post(`permits/${this.id}/isolations/`, this.isoF), 'Isolation recorded.').then(() => { this.isoF = { point: '', kind: 'electrical', method: '', lock_no: '' }; }); }
  iso(id: number, action: string): Promise<void> { return this.call(() => this.api.patch(`isolations/${id}/`, { action }), action === 'verify' ? 'Isolation verified.' : 'Isolation removed.'); }

  closePermit(): Promise<void> {
    const hb = this.handback;
    return this.call(() => this.api.post(`permits/${this.id}/close/`, { checks: hb, note: hb.note }), 'Permit closed.').then(() => { if (this.p?.status === 'closed') this.handback = null; });
  }

  async attach(fl: FileList | null): Promise<void> {
    if (!fl?.length) return;
    try { await this.api.postQ('files/', { model: 'permit', id: this.id }, HseApiService.form({}, Array.from(fl))); await this.reload(); }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  pdf(): void { this.api.file(`permits/${this.id}/pdf/`, `${this.p.number}.pdf`).catch(e => this.msg = HseApiService.error(e)); }

  export(): void {
    csv('permits.csv', [{ key: 'number', label: 'Permit' }, { key: 'type_name', label: 'Type' }, { key: 'site_name', label: 'Site' }, { key: 'location', label: 'Location' },
      { key: 'description', label: 'Work' }, { key: 'valid_from', label: 'From' }, { key: 'valid_to', label: 'To' }, { key: 'status_label', label: 'Status' }], this.rows);
  }
}
