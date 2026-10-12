import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZPeriodBarComponent, ZPeriodPick } from '../shared-ui/z-period-bar.component';   // v1.22.0
import { ActivatedRoute, Router } from '@angular/router';
import { HSE_BASE, HseApiService, day, localDT, stClass, today, when } from './hse-api.service';

/** Report an incident or near miss – every employee (simple, phone friendly). */
@Component({
  selector: 'hse-incident-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(760px,100%)">
    <header><h2>Report an incident or near miss</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <label class="wide">What happened? *<input [(ngModel)]="f.title" maxlength="255" placeholder="e.g. Cable reel fell from scaffold"></label>
        <label>Type<select [(ngModel)]="f.category"><option [ngValue]="null">Not sure</option>
          <option *ngFor="let c of lk.categories" [ngValue]="c.id">{{ c.name }}</option></select></label>
        <label>When *<input type="datetime-local" [(ngModel)]="f.occurred_at"></label>
        <label>{{ t('site', 'Site') }}<select [(ngModel)]="f.site" (ngModelChange)="f.area = null"><option [ngValue]="null">–</option>
          <option *ngFor="let s of lk.sites" [ngValue]="s.id">{{ s.name }}</option></select></label>
        <label>{{ t('area', 'Area') }}<select [(ngModel)]="f.area"><option [ngValue]="null">–</option>
          <option *ngFor="let a of areas()" [ngValue]="a.id">{{ a.name }}</option></select></label>
        <label class="wide">Exact place<input [(ngModel)]="f.location" placeholder="Level 3, grid C-4"></label>
        <label class="wide">Description *<textarea [(ngModel)]="f.description" rows="4" placeholder="What happened, who was involved, what could have happened"></textarea></label>
        <label>Was anyone hurt?<select [(ngModel)]="f.treatment"><option *ngFor="let x of lk.treatments" [value]="x.value">{{ x.label }}</option></select></label>
        <label>How bad could it have been?<select [(ngModel)]="f.potential_severity">
          <option *ngFor="let s of [1,2,3,4,5]" [ngValue]="s">{{ s }} – {{ lk.matrix?.severity?.[s - 1] }}</option></select></label>
        <ng-container *ngIf="f.treatment !== 'none'">
          <label>Injured employee<select [(ngModel)]="f.injured_employee"><option [ngValue]="null">– (contractor / visitor)</option>
            <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
          <label>Injured person (if not an employee)<input [(ngModel)]="f.injured_name"></label>
          <label>Body part<input [(ngModel)]="f.body_part"></label>
        </ng-container>
        <label class="wide">What did you do immediately?<textarea [(ngModel)]="f.immediate_actions" rows="2"></textarea></label>
        <label>Related permit (if any)<input [(ngModel)]="f.permit_number" placeholder="PTW-…" (blur)="findPermit()"></label>
        <label>Witnesses<input [(ngModel)]="f.witnesses"></label>
        <label *ngIf="lk.links?.assets">Equipment involved (asset register)<select [(ngModel)]="f.asset_id"><option [ngValue]="null">–</option>
          <option *ngFor="let a of assets" [ngValue]="a.id">{{ a.label }}</option></select></label>
        <label class="wide">Photos / files<input type="file" multiple accept="image/*,.pdf" (change)="files = toList($any($event.target).files)"></label>
      </div>
      <p class="hs-muted">HSE is told at once. Health details are visible only to occupational health and the HSE manager.</p>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Sending…' : 'Report' }}</button>
    </footer>
  </div>
</div>`,
})
export class HseIncidentFormComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { categories: [], sites: [], treatments: [], employees: [], terms: {} };
  f: any = { title: '', category: null, occurred_at: localDT(), site: null, area: null, location: '', description: '', treatment: 'none',
             potential_severity: 2, injured_employee: null, injured_name: '', body_part: '', immediate_actions: '', witnesses: '', permit: null, permit_number: '',
             asset_id: null };
  assets: any[] = [];
  files: File[] = [];
  err = '';
  busy = false;

  constructor(private api: HseApiService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.lk = await this.api.lookups();
      if (this.lk.links?.assets) this.assets = await this.api.options('assets').catch(() => []);
    } catch (e) { this.err = HseApiService.error(e); }
  }
  t(k: string, d: string): string { return this.lk.terms?.[k] || d; }
  areas(): any[] { return this.lk.sites.find((s: any) => s.id === this.f.site)?.areas || []; }
  toList(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }

  async findPermit(): Promise<void> {
    this.f.permit = null;
    if (!this.f.permit_number.trim()) return;
    const r = await this.api.get('permits/', { q: this.f.permit_number.trim() }).catch(() => ({ results: [] }));
    this.f.permit = r.results?.[0]?.id || null;
  }

  async save(): Promise<void> {
    this.err = '';
    if (!this.f.title.trim() || !this.f.description.trim()) { this.err = 'Say what happened (title and description).'; return; }
    this.busy = true;
    try {
      const body = { ...this.f, occurred_at: new Date(this.f.occurred_at).toISOString() };
      delete body.permit_number;
      this.saved.emit(await this.api.post('incidents/', HseApiService.form(body, this.files)));
    } catch (e) { this.err = HseApiService.error(e, 'The report could not be sent.'); }
    this.busy = false;
  }
}

/** Behaviour-based safety observation (safe / at-risk behaviour, unsafe condition, suggestion). */
@Component({
  selector: 'hse-observation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(680px,100%)">
    <header><h2>Safety observation</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="hs-pill-row" style="margin-bottom:12px">
        <button type="button" class="hs-chip" *ngFor="let k of lk.observation_kinds" [class.on]="f.kind === k.value" (click)="f.kind = k.value">{{ k.label }}</button>
      </div>
      <div class="ex-form">
        <label>Category<select [(ngModel)]="f.category"><option *ngFor="let c of lk.observation_categories" [value]="c.value">{{ c.label }}</option></select></label>
        <label>Risk<select [(ngModel)]="f.observed_risk"><option *ngFor="let c of lk.observed_risks" [value]="c.value">{{ c.label }}</option></select></label>
        <label>{{ lk.terms?.site || 'Site' }}<select [(ngModel)]="f.site"><option [ngValue]="null">–</option><option *ngFor="let s of lk.sites" [ngValue]="s.id">{{ s.name }}</option></select></label>
        <label>Task<input [(ngModel)]="f.task" placeholder="What work was going on"></label>
        <label class="wide">What did you see? *<textarea [(ngModel)]="f.description" rows="3"></textarea></label>
        <label class="wide">Discussion / what was corrected on the spot<textarea [(ngModel)]="f.immediate_action" rows="2"></textarea></label>
        <label class="wide">Photo<input type="file" accept="image/*" multiple (change)="files = toList($any($event.target).files)"></label>
        <label class="ck wide"><input type="checkbox" [(ngModel)]="f.confidential"> Report confidentially (only the HSE manager sees my name)</label>
      </div>
      <p class="hs-muted">Observations are for learning, not blame – trends are shown by task, place and category, never by person.</p>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Sending…' : 'Send' }}</button>
    </footer>
  </div>
</div>`,
})
export class HseObservationFormComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { observation_kinds: [], observation_categories: [], observed_risks: [], sites: [] };
  f: any = { kind: 'unsafe_condition', category: 'other', observed_risk: 'low', site: null, task: '', description: '', immediate_action: '', confidential: false };
  files: File[] = [];
  err = '';
  busy = false;

  constructor(private api: HseApiService) {}

  async ngOnInit(): Promise<void> { try { this.lk = await this.api.lookups(); } catch (e) { this.err = HseApiService.error(e); } }
  toList(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }

  async save(): Promise<void> {
    if (!this.f.description.trim()) { this.err = 'Describe what you saw.'; return; }
    this.busy = true;
    try { this.saved.emit(await this.api.post('observations/', HseApiService.form(this.f, this.files))); }
    catch (e) { this.err = HseApiService.error(e); }
    this.busy = false;
  }
}

/** HSE home: what needs me today, the company picture (HSE staff) and one-tap reporting for everyone. */
@Component({
  selector: 'app-hse-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HseIncidentFormComponent, HseObservationFormComponent, ZPeriodBarComponent],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">{{ dash ? 'HSE home' : 'My safety' }}</h1>
          <p class="ex-desc">{{ lk.industry_label ? lk.industry_label + ' · ' : '' }}Report hazards and incidents, follow your permits and actions{{ dash ? ', and see how the company is doing' : '' }}.</p></div>
        <div class="ex-actions" *ngIf="dash">
          <!-- v1.22.0: HRMS period presets and branch; every figure opens its records for the same period and branch -->
          <z-period-bar name="hse" (changed)="period($event)"></z-period-bar>
          <select class="ex-btn" *ngIf="projects.length" [(ngModel)]="project" (ngModelChange)="loadDash()" aria-label="Project"><option value="">All projects</option>
            <option *ngFor="let p of projects" [value]="p.id">{{ p.label }}</option></select>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
      <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
      <p class="hs-note" *ngIf="lk.to_review && lk.rights?.setup">{{ lk.to_review }} item(s) from the {{ lk.industry_label }} industry pack are waiting for review before use.
        <button type="button" class="hs-rlink" (click)="go(['setup'], { tab: 'pack' })">Review now ›</button></p>

      <div class="hs-quick" style="margin-bottom:18px">
        <button type="button" (click)="reporting = 'incident'"><span class="ic" style="background:#fff0f0">⚠️</span><span><b>Report incident</b><small>Injury, damage, near miss</small></span></button>
        <button type="button" (click)="reporting = 'observation'"><span class="ic" style="background:#fff8e6">👁️</span><span><b>Safety observation</b><small>Hazard, behaviour, suggestion</small></span></button>
        <button type="button" (click)="go(['permits'], { new: 1 })"><span class="ic" style="background:#eef2ff">📝</span><span><b>Request a permit</b><small>Hot work, height, isolation…</small></span></button>
        <button type="button" (click)="go(['permits'], { view: 'live' })"><span class="ic" style="background:#e8f7ef">🟢</span><span><b>Live permit board</b><small>{{ dash?.live_permits ?? '' }} work in progress</small></span></button>
      </div>

      <!-- my work -->
      <div class="ex-grid2" *ngIf="my">
        <div class="ex-panel">
          <div class="ex-h">Needs my attention</div>
          <div class="hs-ev" *ngFor="let a of my.approvals" style="cursor:pointer" (click)="openRec(a.model, a.id)">
            <div class="t"><span class="hs-b wait">Approve</span> <span class="hs-code">{{ a.number }}</span> {{ a.title }}</div><div class="m">{{ a.step }}</div></div>
          <div class="hs-ev" *ngFor="let p of my.to_issue" style="cursor:pointer" (click)="go(['permits', p.id])">
            <div class="t"><span class="hs-b work">Issue</span> <span class="hs-code">{{ p.number }}</span> {{ p.type_name }} – {{ p.site_name }}</div><div class="m">{{ w(p.valid_from) }}</div></div>
          <div class="hs-ev" *ngFor="let a of my.actions" style="cursor:pointer" (click)="go(['actions'], { open: a.id })">
            <div class="t"><span class="hs-b" [ngClass]="a.overdue ? 'bad' : ''">Action</span> <span class="hs-code">{{ a.number }}</span> {{ a.title }}</div>
            <div class="m" [style.color]="a.overdue ? '#b42318' : null">due {{ d(a.due_date) }}</div></div>
          <div class="hs-ev" *ngFor="let a of my.verify" style="cursor:pointer" (click)="go(['actions'], { open: a.id })">
            <div class="t"><span class="hs-b ok">Verify</span> <span class="hs-code">{{ a.number }}</span> {{ a.title }}</div><div class="m">{{ a.owner?.name }}</div></div>
          <div class="hs-ev" *ngFor="let i of my.investigations" style="cursor:pointer" (click)="go(['incidents', i.id])">
            <div class="t"><span class="hs-b work">Investigate</span> <span class="hs-code">{{ i.number }}</span> {{ i.title }}</div><div class="m">{{ i.status_label }}</div></div>
          <div class="hs-ev" *ngFor="let o of my.other" style="cursor:pointer" (click)="go(o.route || ['r', o.kind, o.id])">
            <div class="t"><span class="hs-b wait">{{ o.tag }}</span> <span class="hs-code">{{ o.number }}</span> {{ o.title }}</div></div>
          <p class="hs-empty" *ngIf="!count()">Nothing waiting for you. 👍</p>
        </div>
        <div class="ex-panel">
          <div class="ex-h">My permits</div>
          <div class="hs-ev" *ngFor="let p of my.permits" style="cursor:pointer" (click)="go(['permits', p.id])">
            <div class="t"><span class="hs-code">{{ p.number }}</span> {{ p.type_name }}<div class="hs-muted">{{ p.description }}</div></div>
            <div class="m"><span class="hs-b" [ngClass]="cls(p.status)">{{ p.status_label }}</span></div></div>
          <p class="hs-empty" *ngIf="!my.permits.length">No open permits.</p>
        </div>
      </div>

      <!-- company picture -->
      <ng-container *ngIf="dash">
        <div class="hs-section">{{ dash.industry_label }} · {{ d(dash.from) }} – {{ d(dash.to) }}{{ dash.project ? ' · ' + projName() + ' (incident figures for its sites)' : '' }}</div>
        <div class="ex-tiles">
          <button type="button" class="ex-tile t3" (click)="go(['incidents'], span('occurred_at'))"><div class="lbl">Days without lost-time injury</div>
            <div class="num">{{ dash.days_since_lti ?? '–' }}</div><div class="amt">{{ dash.lti }} LTI · {{ dash.lost_days }} lost days in period</div></button>
          <button type="button" class="ex-tile t2" (click)="go(['incidents'], { status: 'open' })"><div class="lbl">Open incidents</div>
            <div class="num">{{ dash.open_incidents }}</div><div class="amt">{{ dash.incidents }} in period · {{ dash.high_potential }} high potential</div></button>
          <button type="button" class="ex-tile" (click)="go(['actions'], { view: 'overdue' })"><div class="lbl">Actions overdue</div>
            <div class="num" [style.color]="dash.overdue_actions ? '#b42318' : null">{{ dash.overdue_actions }}</div>
            <div class="amt">{{ dash.open_actions }} open · {{ dash.action_closure_pct ?? '–' }}% closed on time</div></button>
          <button type="button" class="ex-tile t4" (click)="go(['permits'], { view: 'live' })"><div class="lbl">Live permits</div>
            <div class="num">{{ dash.live_permits }}</div><div class="amt">{{ dash.waiting_permits }} waiting · {{ dash.suspended_permits }} suspended</div></button>
        </div>
        <div class="ex-tiles">
          <div class="ex-tile" role="button" tabindex="0" style="cursor:pointer" (click)="go(['incidents'], span('occurred_at'))"><div class="lbl">TRIR</div><div class="num">{{ dash.trir ?? '–' }}</div>
            <div class="amt" [title]="'Recordable × ' + dash.multiplier + ' ÷ hours worked'">{{ dash.hours ? 'per ' + (dash.multiplier | number) + ' h · ' + (dash.hours | number) + ' h worked' + (dash.hours_source === 'attendance' ? ' (attendance)' : '') : (dash.project ? 'no attendance hours for this project' : 'set hours worked in HSE settings') }}</div></div>
          <div class="ex-tile t2" role="button" tabindex="0" style="cursor:pointer" (click)="go(['incidents'], span('occurred_at'))"><div class="lbl">LTIFR</div><div class="num">{{ dash.ltifr ?? '–' }}</div><div class="amt">{{ dash.recordable }} recordable cases</div></div>
          <div class="ex-tile t3" role="button" tabindex="0" style="cursor:pointer" (click)="go(['observations'], span('reported_at'))"><div class="lbl">Near misses / observations</div><div class="num">{{ dash.near_misses }} / {{ dash.observations }}</div><div class="amt">{{ dash.toolbox_talks }} toolbox talks</div></div>
          <div class="ex-tile t4" role="button" tabindex="0" style="cursor:pointer" (click)="go(['inspections'], span('date'))"><div class="lbl">Inspections</div><div class="num">{{ dash.inspections }}</div><div class="amt">average score {{ dash.avg_score ?? '–' }}%</div></div>
        </div>
        <div class="ex-grid2">
          <div class="ex-panel">
            <div class="ex-h">Incidents and observations per week</div>
            <div class="hs-cols"><div class="c" *ngFor="let x of dash.weekly" [title]="'Week of ' + d(x.week) + ': ' + x.incidents + ' incidents, ' + x.observations + ' observations'">
              <div class="rec" [style.height.%]="pct(x.incidents, maxW())" style="background:#f59e0b"></div><div class="res" [style.height.%]="pct(x.observations, maxW())" style="background:#a5b4fc"></div></div></div>
            <div class="hs-legend"><span><i style="background:#f59e0b"></i>Incidents</span><span><i style="background:#a5b4fc"></i>Observations</span></div>
          </div>
          <div class="ex-panel">
            <div class="ex-h">Incidents by category</div>
            <div class="hs-hbar" *ngFor="let r of dash.by_category"><span class="l">{{ r.label }}</span><div class="hs-meter warn"><div [style.width.%]="pct(r.n, maxC())"></div></div><span class="n">{{ r.n }}</span></div>
            <p class="hs-empty" *ngIf="!dash.by_category.length">No incidents in the period.</p>
          </div>
        </div>
        <div class="ex-grid2" style="margin-top:16px">
          <div class="ex-panel">
            <div class="ex-h">Work in progress (live permits)</div>
            <div class="hs-board">
              <div class="pc" *ngFor="let p of dash.live" [style.border-left-color]="p.color" (click)="go(['permits', p.id])">
                <b>{{ p.number }} · {{ p.type_name }}</b>{{ p.site_name }}{{ p.area_name ? ' / ' + p.area_name : '' }}
                <div class="hs-muted">until {{ w(p.valid_to) }} <span class="hs-b bad" *ngIf="p.status === 'suspended'">Suspended</span><span class="hs-b bad" *ngIf="p.overrun">Overrun</span></div></div>
            </div>
            <p class="hs-empty" *ngIf="!dash.live.length">No work under permit right now.</p>
          </div>
          <div class="ex-panel">
            <div class="ex-h">Overdue actions</div>
            <div class="hs-ev" *ngFor="let a of dash.overdue" style="cursor:pointer" (click)="go(['actions'], { open: a.id })">
              <div class="t"><span class="hs-code">{{ a.number }}</span> {{ a.title }}<div class="hs-muted">{{ a.owner?.name }} · {{ a.source_label }} {{ a.source_ref }}</div></div>
              <div class="m" style="color:#b42318">{{ a.days_late }} d late</div></div>
            <p class="hs-empty" *ngIf="!dash.overdue.length">No overdue actions.</p>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
</div>
<hse-incident-form *ngIf="reporting === 'incident'" (closed)="reporting = ''" (saved)="sent('Incident ' + $event.number + ' reported – HSE has been told.')"></hse-incident-form>
<hse-observation-form *ngIf="reporting === 'observation'" (closed)="reporting = ''" (saved)="sent('Observation ' + $event.number + ' sent. Thank you!')"></hse-observation-form>`,
})
export class HseHomeComponent implements OnInit {
  lk: any = { rights: {} };
  my: any = null;
  dash: any = null;
  msg = '';
  ok = '';
  reporting = '';
  from = today().slice(0, 8) + '01';
  to = today();
  projects: any[] = [];   // v1.17.0 – when HSE is linked with Projects
  project = '';
  w = when;
  d = day;
  cls = stClass;

  constructor(private api: HseApiService, private router: Router, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    const r = this.route.snapshot.paramMap.get('report') || this.route.snapshot.queryParamMap.get('report');
    if (r) this.reporting = r;
    try {
      this.lk = await this.api.lookups();
      this.my = await this.api.get('my/');
      if (this.lk.rights?.view_all) {
        this.dashOn = true;
        if (this.lk.links?.projects) this.projects = await this.api.options('projects').catch(() => []);
        await this.loadDash();
      }
    } catch (e) { this.msg = HseApiService.error(e); }
  }

  branch: number | null = null;
  dashOn = false;
  period(p: ZPeriodPick): void { this.from = p.from; this.to = p.to; this.branch = p.branch; if (this.dashOn) { this.loadDash(); } }
  /** v1.22.0: query params so a figure opens its list for the dashboard's period and branch */
  span(field: string): any { const q: any = { date_field: field, from: this.from, to: this.to }; if (this.branch) { q.branch = this.branch; } return q; }
  async loadDash(): Promise<void> {
    try { this.dash = await this.api.get('dashboard/', { from: this.from, to: this.to, project: this.project, branch: this.branch || '' }); } catch (e) { this.msg = HseApiService.error(e); }
  }

  projName(): string { return this.projects.find(p => String(p.id) === String(this.dash?.project))?.label || 'project'; }

  count(): number { const m = this.my || {}; return ['approvals', 'to_issue', 'actions', 'verify', 'investigations', 'other'].reduce((n, k) => n + (m[k]?.length || 0), 0); }
  pct(v: number, m: number): number { return m ? Math.max(2, Math.round(v * 100 / m)) : 0; }
  maxW(): number { return Math.max(1, ...(this.dash?.weekly || []).map((x: any) => Math.max(x.incidents, x.observations))); }
  maxC(): number { return Math.max(1, ...(this.dash?.by_category || []).map((x: any) => x.n)); }
  go(path: any[], q: any = {}): void { this.router.navigate([HSE_BASE, ...path], { queryParams: q }); }

  openRec(model: string, id: number): void {
    const map: Record<string, any[]> = { permit: ['permits', id], risk: ['risks', id], incident: ['incidents', id], moc: ['r', 'moc', id], audit: ['r', 'audits', id],
                                         claim: ['r', 'claims', id] };
    this.go(map[model] || ['r', model, id]);
  }

  async sent(m: string): Promise<void> { this.reporting = ''; this.ok = m; this.my = await this.api.get('my/').catch(() => this.my); }
}
