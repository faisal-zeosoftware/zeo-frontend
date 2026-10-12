import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HSE_BASE, HseApiService, csv, day, stClass, today, when } from './hse-api.service';
import { HseObservationFormComponent } from './hse-home.component';
import { HseNewActionComponent } from './hse-actions.component';

/** Inspections and checklists: start from an approved checklist, answer on site, "No" answers raise actions automatically. */
@Component({
  selector: 'app-hse-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <p class="hs-note err" *ngIf="msg" style="margin:16px">{{ msg }}</p>
    <ng-container *ngIf="!id">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title">Inspections</h1><p class="ex-desc">Scaffold, excavation, equipment, workplace and environmental inspections from the company's checklists. Every "No" becomes a corrective action.</p></div>
          <div class="ex-actions"><button type="button" class="ex-btn" (click)="export()" [disabled]="!rows.length">Export CSV</button>
            <button type="button" class="ex-btn primary" (click)="starting = true">+ Start inspection</button></div>
        </div>
        <div class="hs-filters"><select [(ngModel)]="status" (ngModelChange)="load()" aria-label="Status"><option value="">All</option><option value="draft">In progress</option><option value="completed">Completed</option></select></div>
      </div>
      <div class="com_list mt-4"><div class="hs-scroll"><table class="hs-table zl-hse">
        <tr><th>Inspection</th><th>Checklist</th><th>Site</th><th>Branch</th><th>Inspector</th><th>Date</th><th class="r">Score</th><th>Status</th></tr>
        <tr class="click" *ngFor="let x of rows" (click)="open(x.id)"><td><span class="hs-code">{{ x.number }}</span><div>{{ x.subject }}</div></td><td>{{ x.template_name }}</td>
          <td>{{ x.site_name }}</td><td>{{ x.branch_name }}</td><td>{{ x.inspector?.name }}</td><td>{{ d(x.date) }}</td><td class="r">{{ x.score !== null ? (x.score | number:'1.0-0') + ' %' : '–' }}</td>
          <td><span class="hs-b" [ngClass]="cls(x.status)">{{ x.status_label }}</span></td></tr></table></div>
        <p class="hs-empty" *ngIf="!rows.length">No inspections yet.</p></div>
    </ng-container>
    <ng-container *ngIf="id && x">
      <div class="header_section"><div class="ex-head">
        <div><h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button> <span class="hs-code">{{ x.number }}</span> {{ x.template_name }}
          <span class="hs-b" [ngClass]="cls(x.status)">{{ x.status_label }}</span></h1>
          <p class="ex-desc">{{ x.site_name }}{{ x.area_name ? ' / ' + x.area_name : '' }} · {{ x.subject }} · {{ x.inspector?.name }} · {{ d(x.date) }}{{ x.score !== null ? ' · score ' + (x.score | number:'1.0-0') + ' %' : '' }}</p></div>
        <div class="ex-actions" *ngIf="x.status === 'draft'"><button type="button" class="ex-btn" (click)="save(false)">Save</button><button type="button" class="ex-btn primary" (click)="save(true)">Complete</button></div>
      </div></div>
      <div class="com_list mt-4">
        <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
        <div class="hs-card">
          <div class="hs-q" *ngFor="let q of x.questions">
            <div><div class="sec">{{ q.section }}</div><span class="crit" *ngIf="q.critical">★</span>{{ q.text }}<div class="hs-muted" *ngIf="q.hint">{{ q.hint }}</div></div>
            <div class="hs-seg" *ngIf="!q.type || q.type === 'yesno'"><button type="button" *ngFor="let o of yn" [class.on]="a(q.key).value === o.v" [ngClass]="o.c" [disabled]="x.status !== 'draft'" (click)="a(q.key).value = o.v">{{ o.l }}</button></div>
            <input *ngIf="q.type && q.type !== 'yesno'" [type]="q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : 'text'" [(ngModel)]="a(q.key).value" [disabled]="x.status !== 'draft'"
                   style="height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;width:160px">
            <input class="note" [(ngModel)]="a(q.key).note" [disabled]="x.status !== 'draft'" placeholder="Note / finding" *ngIf="x.status === 'draft' || a(q.key).note">
          </div>
        </div>
        <div class="hs-card" style="margin-top:14px"><h3>History</h3><div class="hs-ev" *ngFor="let h of x.history"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div></div>
      </div>
    </ng-container>
  </div>
</div>
<div class="ex-back" *ngIf="starting" (click)="starting = false">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(600px,100%)">
    <header><h2>Start an inspection</h2><button type="button" (click)="starting = false" aria-label="Close">×</button></header>
    <div class="body"><div class="ex-form">
      <label class="wide">Checklist *<select [(ngModel)]="n.template"><option [ngValue]="null">Choose…</option>
        <option *ngFor="let t of checklists()" [ngValue]="t.id">{{ t.name }}{{ t.frequency ? ' (' + t.frequency + ')' : '' }}</option></select></label>
      <label>{{ lk.terms?.site || 'Site' }}<select [(ngModel)]="n.site"><option [ngValue]="null">–</option><option *ngFor="let s of lk.sites" [ngValue]="s.id">{{ s.name }}</option></select></label>
      <label>Date<input type="date" [(ngModel)]="n.date"></label>
      <label class="wide">What is inspected<input [(ngModel)]="n.subject" placeholder="Scaffold tag S-14, forklift FL-2, Ward 3…"></label>
      <label class="wide" *ngIf="lk.links?.assets">Equipment (asset register)<select [(ngModel)]="n.asset_id" (ngModelChange)="pickAsset()"><option [ngValue]="null">–</option>
        <option *ngFor="let a of assets" [ngValue]="a.id">{{ a.label }}</option></select></label></div></div>
    <footer><button type="button" class="ex-btn" (click)="starting = false">Cancel</button><button type="button" class="ex-btn primary" (click)="start()">Start</button></footer>
  </div>
</div>`,
})
export class HseInspectionsComponent implements OnInit, OnDestroy {
  lk: any = { templates: [], sites: [] };
  rows: any[] = [];
  id: number | null = null;
  x: any = null;
  status = '';
  starting = false;
  n: any = { template: null, site: null, date: today(), subject: '', asset_id: null };
  assets: any[] = [];
  pickAsset(): void { const a = this.assets.find(x => x.id === this.n.asset_id); if (a && !this.n.subject) this.n.subject = a.label; }
  yn = [{ v: 'yes', l: 'Yes', c: 'y' }, { v: 'no', l: 'No', c: 'n' }, { v: 'na', l: 'N/A', c: 'na' }];
  msg = '';
  ok = '';
  w = when;
  d = day;
  cls = stClass;
  private sub?: Subscription;

  constructor(private api: HseApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async pm => {
      this.id = pm.get('id') ? Number(pm.get('id')) : null;
      this.msg = ''; this.ok = '';
      try {
        this.lk = await this.api.lookups();
        if (this.lk.links?.assets) this.assets = await this.api.options('assets').catch(() => []);
      } catch (e) { this.msg = HseApiService.error(e); }
      if (this.id) { try { this.x = await this.api.get(`inspections/${this.id}/`); } catch (e) { this.msg = HseApiService.error(e); } } else await this.load();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  checklists(): any[] { return (this.lk.templates || []).filter((t: any) => ['inspection', 'drill'].includes(t.kind) && t.usable); }
  a(k: string): any { this.x.answers = this.x.answers || {}; return this.x.answers[k] = this.x.answers[k] || { value: '', note: '' }; }
  open(id: number): void { this.router.navigate([HSE_BASE, 'inspections', id]); }
  back(): void { this.router.navigate([HSE_BASE, 'inspections']); }

  async load(): Promise<void> { try { this.rows = (await this.api.get('inspections/', { status: this.status, limit: 1000 })).results; } catch (e) { this.msg = HseApiService.error(e); } }

  async start(): Promise<void> {
    if (!this.n.template) return;
    try { const r = await this.api.post('inspections/', this.n); this.starting = false; this.open(r.id); } catch (e) { this.msg = HseApiService.error(e); this.starting = false; }
  }

  async save(complete: boolean): Promise<void> {
    this.msg = ''; this.ok = '';
    try {
      this.x = await this.api.patch(`inspections/${this.id}/`, { answers: this.x.answers, complete });
      this.ok = complete ? 'Inspection completed – actions raised for every "No".' : 'Saved.';
    } catch (e) { this.msg = HseApiService.error(e); }
  }

  export(): void {
    csv('inspections.csv', [{ key: 'number', label: 'Inspection' }, { key: 'template_name', label: 'Checklist' }, { key: 'site_name', label: 'Site' },
      { key: 'subject', label: 'Subject' }, { key: 'date', label: 'Date' }, { key: 'score', label: 'Score' }, { key: 'status_label', label: 'Status' }], this.rows);
  }
}

/** Behaviour-based safety: observations, trends by category / place (never by person), escalation of serious hazards. */
@Component({
  selector: 'app-hse-observations',
  standalone: true,
  imports: [CommonModule, FormsModule, HseObservationFormComponent, HseNewActionComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Safety observations (BBS)</h1><p class="ex-desc">Safe and at-risk behaviour, unsafe conditions and suggestions. For learning, not blame.</p></div>
        <div class="ex-actions"><button type="button" class="ex-btn primary" (click)="creating = true">+ Observation</button></div>
      </div>
      <div class="hs-filters">
        <select [(ngModel)]="kind" (ngModelChange)="load()" aria-label="Type"><option value="">All types</option><option *ngFor="let k of lk.observation_kinds" [value]="k.value">{{ k.label }}</option></select>
        <select [(ngModel)]="category" (ngModelChange)="load()" aria-label="Category"><option value="">All categories</option><option *ngFor="let k of lk.observation_categories" [value]="k.value">{{ k.label }}</option></select>
        <select [(ngModel)]="status" (ngModelChange)="load()" aria-label="Status"><option value="">Any status</option><option value="open">Open</option><option value="actioned">Action raised</option><option value="closed">Closed</option></select>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="hs-note err" *ngIf="msg">{{ msg }}</p><p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
      <div class="ex-grid2" *ngIf="tr" style="margin-bottom:16px">
        <div class="ex-panel"><div class="ex-h">By category · {{ tr.total }} observations · {{ tr.safe_share ?? '–' }}% safe behaviour</div>
          <div class="hs-hbar" *ngFor="let r of tr.by_category"><span class="l">{{ r.label }}</span><div class="hs-meter"><div [style.width.%]="pct(r.n, mx(tr.by_category))"></div></div><span class="n">{{ r.n }}</span></div></div>
        <div class="ex-panel"><div class="ex-h">By {{ (lk.terms?.site || 'site').toLowerCase() }}</div>
          <div class="hs-hbar" *ngFor="let r of tr.by_site"><span class="l">{{ r.label }}</span><div class="hs-meter ok"><div [style.width.%]="pct(r.n, mx(tr.by_site))"></div></div><span class="n">{{ r.n }}</span></div></div>
      </div>
      <div class="hs-scroll"><table class="hs-table zl-hse">
        <tr><th>Observation</th><th>Type / category</th><th>Risk</th><th>Site</th><th>Branch</th><th>Reported</th><th>Status</th><th *ngIf="lk.rights?.staff"></th></tr>
        <tr *ngFor="let o of rows"><td><span class="hs-code">{{ o.number }}</span><div>{{ o.description }}</div><div class="hs-muted" *ngIf="o.immediate_action">Done: {{ o.immediate_action }}</div></td>
          <td>{{ o.kind_label }}<div class="hs-muted">{{ o.category_label }}{{ o.task ? ' · ' + o.task : '' }}</div></td>
          <td><span class="hs-b" [ngClass]="o.observed_risk === 'high' ? 'bad' : o.observed_risk === 'medium' ? 'wait' : ''">{{ o.observed_risk_label }}</span></td>
          <td>{{ o.site_name }}</td><td>{{ o.branch_name }}</td><td>{{ o.reported_by?.name }}<div class="hs-muted">{{ w(o.reported_at) }}</div></td>
          <td><span class="hs-b" [ngClass]="cls(o.status)">{{ o.status_label }}</span><div *ngIf="o.escalated_incident"><a href="javascript:void(0)" (click)="go(['incidents', o.escalated_incident.id])">{{ o.escalated_incident.number }}</a></div></td>
          <td *ngIf="lk.rights?.staff"><div class="hs-acts">
            <button type="button" class="ex-btn sm" *ngIf="o.status !== 'closed'" (click)="raise = o">Action</button>
            <button type="button" class="ex-btn sm" *ngIf="!o.escalated_incident && o.kind !== 'safe_act'" (click)="escalate(o)">To incident</button>
            <button type="button" class="ex-btn sm" *ngIf="o.status !== 'closed'" (click)="setStatus(o, 'closed')">Close</button></div></td></tr></table></div>
      <p class="hs-empty" *ngIf="!rows.length">No observations.</p>
    </div>
  </div>
</div>
<hse-observation-form *ngIf="creating" (closed)="creating = false" (saved)="creating = false; ok = 'Thank you – observation ' + $event.number + ' sent.'; load()"></hse-observation-form>
<hse-new-action *ngIf="raise" source="observation" [sourceId]="raise.id" [ref]="raise.number" [title]="raise.description.slice(0, 120)" (closed)="raise = null" (saved)="raise = null; load()"></hse-new-action>`,
})
export class HseObservationsComponent implements OnInit {
  lk: any = { rights: {}, observation_kinds: [], observation_categories: [] };
  rows: any[] = [];
  tr: any = null;
  kind = '';
  category = '';
  status = '';
  creating = false;
  raise: any = null;
  msg = '';
  ok = '';
  w = when;
  cls = stClass;

  constructor(private api: HseApiService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    try { this.lk = await this.api.lookups(); } catch { /* */ }
    await this.load();
    if (this.lk.rights?.view_all) this.tr = await this.api.get('observations/trends/').catch(() => null);
  }

  async load(): Promise<void> {
    try { this.rows = (await this.api.get('observations/', { kind: this.kind, category: this.category, status: this.status, limit: 1000 })).results; }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  pct(v: number, m: number): number { return m ? Math.round(v * 100 / m) : 0; }
  mx(a: any[]): number { return Math.max(1, ...(a || []).map(x => x.n)); }
  go(p: any[]): void { this.router.navigate([HSE_BASE, ...p]); }

  async escalate(o: any): Promise<void> {
    try { const r = await this.api.post(`observations/${o.id}/escalate/`); this.ok = `Incident ${r.incident.number} opened.`; await this.load(); } catch (e) { this.msg = HseApiService.error(e); }
  }

  async setStatus(o: any, s: string): Promise<void> {
    try { await this.api.patch(`observations/${o.id}/`, { status: s }); await this.load(); } catch (e) { this.msg = HseApiService.error(e); }
  }
}

/** Toolbox talks with attendance. */
@Component({
  selector: 'app-hse-toolbox',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section"><div class="ex-head">
      <div><h1 class="page-title">Toolbox talks</h1><p class="ex-desc">Short safety briefings with the topic, key points and attendance.</p></div>
      <div class="ex-actions"><button type="button" class="ex-btn primary" (click)="adding = true">+ Record talk</button></div></div></div>
    <div class="com_list mt-4">
      <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
      <table class="hs-table zl-hse"><tr><th>Talk</th><th>Topic</th><th>Site</th><th>Branch</th><th>Presenter</th><th>Date</th><th class="r">Attendees</th></tr>
        <tr *ngFor="let t of rows"><td><span class="hs-code">{{ t.number }}</span></td><td>{{ t.topic }}</td><td>{{ t.site_name }}</td><td>{{ t.branch_name }}</td><td>{{ t.presenter?.name }}</td><td>{{ d(t.date) }}</td><td class="r">{{ t.attendee_count }}</td></tr></table>
      <p class="hs-empty" *ngIf="!rows.length">No toolbox talks recorded.</p>
    </div>
  </div>
</div>
<div class="ex-back" *ngIf="adding" (click)="adding = false">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(720px,100%)">
    <header><h2>Record a toolbox talk</h2><button type="button" (click)="adding = false" aria-label="Close">×</button></header>
    <div class="body"><p class="hs-note err" *ngIf="err">{{ err }}</p><div class="ex-form">
      <label>Standard topic<select [(ngModel)]="f.template" (ngModelChange)="pickTopic()"><option [ngValue]="null">– own topic –</option>
        <option *ngFor="let t of topics()" [ngValue]="t.id">{{ t.name }}</option></select></label>
      <label>Topic *<input [(ngModel)]="f.topic"></label>
      <label>{{ lk.terms?.site || 'Site' }}<select [(ngModel)]="f.site"><option [ngValue]="null">–</option><option *ngFor="let s of lk.sites" [ngValue]="s.id">{{ s.name }}</option></select></label>
      <label>Date<input type="date" [(ngModel)]="f.date"></label>
      <label class="wide">Key points<textarea [(ngModel)]="f.key_points" rows="3"></textarea></label>
      <div class="wide"><span style="font-size:12px;font-weight:600;color:#6b7185">Employees present</span>
        <input type="search" [(ngModel)]="eq" placeholder="Filter…" style="height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;width:100%;margin:4px 0;font:inherit">
        <div class="hs-multi"><label *ngFor="let e of emps()"><input type="checkbox" [checked]="f.attendees.includes(e.id)" (change)="tog(e.id)"> {{ e.name }}</label></div></div>
      <label class="wide">Contractor workers (one per line)<textarea [(ngModel)]="f.other_attendees" rows="3"></textarea></label></div></div>
    <footer><button type="button" class="ex-btn" (click)="adding = false">Cancel</button><button type="button" class="ex-btn primary" (click)="save()">Save</button></footer>
  </div>
</div>`,
})
export class HseToolboxComponent implements OnInit {
  lk: any = { templates: [], sites: [], employees: [] };
  rows: any[] = [];
  adding = false;
  f: any = { template: null, topic: '', site: null, date: today(), key_points: '', attendees: [], other_attendees: '' };
  eq = '';
  msg = '';
  err = '';
  d = day;

  constructor(private api: HseApiService) {}

  async ngOnInit(): Promise<void> { try { this.lk = await this.api.lookups(); } catch { /* */ } await this.load(); }
  async load(): Promise<void> { try { this.rows = (await this.api.get('toolbox/', { limit: 1000 })).results; } catch (e) { this.msg = HseApiService.error(e); } }
  topics(): any[] { return (this.lk.templates || []).filter((t: any) => t.kind === 'toolbox_talk' && t.usable); }
  pickTopic(): void { const t = this.topics().find(x => x.id === this.f.template); if (t) this.f.topic = t.name; }
  emps(): any[] { const q = this.eq.toLowerCase(); return (this.lk.employees || []).filter((e: any) => !q || e.name.toLowerCase().includes(q)).slice(0, 300); }
  tog(id: number): void { const i = this.f.attendees.indexOf(id); i >= 0 ? this.f.attendees.splice(i, 1) : this.f.attendees.push(id); }

  async save(): Promise<void> {
    this.err = '';
    try { await this.api.post('toolbox/', this.f); this.adding = false; this.f = { template: null, topic: '', site: null, date: today(), key_points: '', attendees: [], other_attendees: '' }; await this.load(); }
    catch (e) { this.err = HseApiService.error(e); }
  }
}
