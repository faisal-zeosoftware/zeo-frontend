import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HseApiService, day, stClass } from './hse-api.service';

interface Col { k: string; l: string; t?: string; opts?: any[]; }

/** HSE set-up: industry pack and its review, settings and risk matrix, sites, contractors, permit types, forms, approval matrix,
 *  hazard library, incident categories, terminology and (v1.17.0) the links with the other ZEO apps. */
@Component({
  selector: 'app-hse-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">HSE set-up</h1>
        <p class="ex-desc">Industry pack content is a starting point only – review it for your real hazards, operating procedures and the legal requirements that apply before it is used.</p></div></div>
      <div class="ex-tabs"><button type="button" *ngFor="let t of tabs" [class.on]="tab === t.k" (click)="setTab(t.k)">{{ t.l }}</button></div>
    </div>
    <div class="com_list mt-4">
      <p class="hs-note err" *ngIf="msg">{{ msg }}</p><p class="hs-note ok" *ngIf="ok">{{ ok }}</p>

      <!-- pack -->
      <ng-container *ngIf="tab === 'pack' && pack">
        <div class="hs-note info">HSE industry: <b>{{ pack.industry_label }}</b> {{ pack.industry_source === 'chosen' ? '(chosen for HSE; company master: ' + (pack.company_industry_label || 'not set') + ')' : '(same as the company master)' }}
          · packs installed: {{ pack.installed.join(', ') || '–' }} · {{ pack.installed_at ? 'on ' + d(pack.installed_at) : '' }}.
          HSE asks for its industry when it is activated; the company industry is the default.</div>
        <div class="hs-section">Review before use</div>
        <div class="hs-card">
          <div class="hs-review-row" style="font-weight:600;color:#6b7185;font-size:12px"><span>Content</span><span>To review</span><span>Reviewed</span><span></span></div>
          <div class="hs-review-row" *ngFor="let k of reviewKinds">
            <span><a href="javascript:void(0)" (click)="setTab(k.tab)">{{ k.l }}</a></span>
            <span><span class="hs-b" [ngClass]="pack.review[k.k].to_review ? 'wait' : 'ok'">{{ pack.review[k.k].to_review }}</span></span>
            <span>{{ pack.review[k.k].reviewed }}</span>
            <span><button type="button" class="ex-btn sm" *ngIf="pack.review[k.k].to_review && rights.hse_manager" (click)="reviewAll(k.k)">Mark all reviewed</button></span>
          </div>
          <p class="hs-muted" style="margin-top:8px">Only reviewed permit types and checklists can be used. Open each list to read, change or switch off items before marking them reviewed.</p>
        </div>
        <div class="hs-section">Industry packs</div>
        <div class="hs-board">
          <div class="pc" *ngFor="let p of pack.packs" [style.border-left-color]="pack.installed.includes(p.code) ? '#10b981' : '#cbd5e1'" style="cursor:default">
            <b>{{ p.label }}</b><span class="hs-muted">{{ p.description }}</span>
            <div class="hs-muted" style="margin-top:6px">Permits: {{ p.permit_types.join(', ') || '–' }}</div>
            <div class="hs-muted">{{ p.forms }} forms · {{ p.hazards }} hazards · {{ p.incident_categories }} categories · {{ p.kpis }} KPIs</div>
            <div class="hs-muted" *ngIf="p.competencies.length">Competencies: {{ p.competencies.join(', ') }}</div>
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="hs-b ok" *ngIf="pack.installed.includes(p.code)">Installed</span>
              <span class="hs-b work" *ngIf="pack.industry === p.code">HSE industry</span>
              <button type="button" class="ex-btn sm" *ngIf="!pack.installed.includes(p.code) && pack.can_setup" (click)="install(p.code)">Add this pack</button>
              <button type="button" class="ex-btn sm" *ngIf="pack.industry !== p.code && pack.can_setup" (click)="install(p.code, true)">Make HSE industry</button></div>
          </div>
        </div>
      </ng-container>

      <!-- settings -->
      <ng-container *ngIf="tab === 'settings' && s">
        <div class="ex-grid2">
          <div class="hs-card"><h3>Numbering and rates</h3><div class="ex-form">
            <label *ngFor="let p of prefixes">{{ p.l }} prefix<input [(ngModel)]="s[p.k]" maxlength="10"></label>
            <label>Rate multiplier (hours)<select [(ngModel)]="s.rate_multiplier"><option [ngValue]="200000">200 000 (OSHA)</option><option [ngValue]="1000000">1 000 000</option></select></label>
            <label>Hours worked per month<input type="number" min="0" [(ngModel)]="s.hours_worked_month"></label>
            <label>Overdue action reminder every (days)<input type="number" min="1" [(ngModel)]="s.action_reminder_days"></label>
            <label>Environmental significance at ≥<input type="number" min="1" max="25" [(ngModel)]="s.significance_threshold"></label>
            <label class="ck wide"><input type="checkbox" [(ngModel)]="s.require_review"> Industry pack items must be reviewed before use</label>
            <label class="ck wide"><input type="checkbox" [(ngModel)]="s.block_expired_competency"> Expired or missing competencies block permit issue (otherwise a warning)</label>
          </div></div>
          <div class="hs-card"><h3>Risk matrix</h3>
            <div class="ex-form">
              <label *ngFor="let x of five; let i = index">Likelihood {{ i + 1 }}<input [(ngModel)]="s.likelihood_labels[i]"></label>
              <label *ngFor="let x of five; let i = index">Severity {{ i + 1 }}<input [(ngModel)]="s.severity_labels[i]"></label>
            </div>
            <div class="hs-section">Bands (cover 1–25)</div>
            <div class="hs-target" style="grid-template-columns:1fr 60px 60px 70px 90px" *ngFor="let b of s.risk_bands">
              <input [(ngModel)]="b.label"><input type="number" [(ngModel)]="b.min"><input type="number" [(ngModel)]="b.max"><input type="color" [(ngModel)]="b.color" style="padding:0">
              <label class="ck" style="font-size:12px"><input type="checkbox" [(ngModel)]="b.block"> Block</label></div>
          </div>
        </div>
        <div class="hs-acts" style="margin-top:12px"><button type="button" class="ex-btn primary" (click)="saveSettings()">Save settings</button></div>
      </ng-container>

      <!-- sites -->
      <ng-container *ngIf="tab === 'sites'">
        <div class="hs-acts" style="margin-bottom:10px"><button type="button" class="ex-btn primary" (click)="edit('sites', null)">+ {{ lk.terms?.site || 'Site' }}</button></div>
        <div class="hs-card" *ngFor="let x of rows" style="margin-bottom:10px">
          <h3>{{ x.code }} · {{ x.name }} <button type="button" class="hs-rlink" (click)="edit('sites', x)">Edit</button></h3>
          <div class="hs-muted">{{ x.kind }} · manager {{ x.manager?.name || '–' }} · {{ x.address }}</div>
          <div class="hs-muted" *ngIf="x.branch_name || x.project_name || x.cost_center_name">
            <span *ngIf="x.branch_name">Branch {{ x.branch_name }}</span><span *ngIf="x.project_name"> · project <b>{{ x.project_name }}</b></span><span *ngIf="x.cost_center_name"> · cost centre {{ x.cost_center_name }}</span></div>
          <div class="hs-pill-row" style="margin-top:8px"><span class="hs-chip" *ngFor="let a of x.areas" [style.opacity]="a.is_active ? 1 : .5">{{ a.name }}</span>
            <input [(ngModel)]="newArea[x.id]" placeholder="+ {{ lk.terms?.area || 'area' }}" (keyup.enter)="addArea(x)" style="height:28px;border:1px solid #dcdfea;border-radius:14px;padding:0 10px;font:inherit;font-size:12.5px"></div>
        </div>
      </ng-container>

      <!-- v1.17.0 links with the other ZEO apps -->
      <ng-container *ngIf="tab === 'links' && links">
        <div class="hs-note info">HSE works on its own. A link below switches on when that ZEO app is installed for this company; switch a link off to keep the manual way.</div>
        <div class="hs-link-list">
          <div class="hs-link" *ngFor="let x of links.links" [class.off]="!x.on">
            <div class="hs-link-head">
              <label class="ck"><input type="checkbox" [checked]="x.on" [disabled]="!x.available || !links.can_change" (change)="toggleLink(x)"> <b>{{ x.label }}</b></label>
              <span class="hs-b" [ngClass]="x.on ? 'ok' : (x.available ? 'wait' : 'closed')">{{ x.on ? 'On' : (x.available ? 'Switched off' : 'App not installed') }}</span>
            </div>
            <p>{{ x.what }}</p>
            <p class="hs-muted" *ngIf="!x.on">Now: {{ x.without }}</p>
            <p class="hs-muted" *ngIf="x.key === 'assets' && x.on && !links.asset_plus">Maintenance checks and asset damage need the Asset Plus app.</p>
            <p class="hs-muted" *ngIf="x.key === 'projects' && x.on && !links.zeo_projects">Project issues and costs need the ZEO Projects app.</p>
            <div class="ex-form" *ngIf="x.key === 'roster' && links.can_change" style="margin-top:6px;grid-template-columns:260px">
              <label>Fatigue warning above (hours worked the day before, 0 = off)<input type="number" min="0" max="24" [(ngModel)]="links.fatigue_max_hours"></label></div>
          </div>
        </div>
        <div class="hs-acts" style="margin-top:12px" *ngIf="links.can_change">
          <button type="button" class="ex-btn primary" (click)="saveLinks(false)">Save</button>
          <button type="button" class="ex-btn" (click)="saveLinks(true)">Save and bring in records now</button>
          <span class="hs-muted">Records are also brought in every night (certificates, leave, complaints, transfers).</span></div>
      </ng-container>

      <!-- generic masters -->
      <ng-container *ngIf="spec[tab]">
        <div class="hs-filters" style="padding-left:0">
          <button type="button" class="ex-btn primary" (click)="edit(tab, null)">+ New</button>
          <select [(ngModel)]="rf" aria-label="Review"><option value="">All</option><option value="to_review">To review</option><option value="reviewed">Reviewed</option></select>
          <button type="button" class="ex-btn" *ngIf="spec[tab].review && rights.hse_manager && selected().length" (click)="reviewSel()">Mark {{ selected().length }} reviewed</button>
        </div>
        <div class="hs-scroll"><table class="hs-table">
          <tr><th *ngIf="spec[tab].review"></th><th *ngFor="let c of spec[tab].cols">{{ c.l }}</th><th *ngIf="spec[tab].review">Review</th><th></th></tr>
          <tr *ngFor="let x of filtered()"><td *ngIf="spec[tab].review"><input type="checkbox" [(ngModel)]="sel[x.id]" *ngIf="x.review_status === 'to_review'"></td>
            <td *ngFor="let c of spec[tab].cols">{{ cell(x, c) }}</td>
            <td *ngIf="spec[tab].review"><span class="hs-b" [ngClass]="cls(x.review_status)">{{ x.review_status === 'reviewed' ? 'Reviewed' : 'To review' }}</span>
              <div class="hs-muted">{{ x.pack }}</div></td>
            <td><button type="button" class="ex-btn sm" (click)="edit(tab, x)">Edit</button></td></tr></table></div>
      </ng-container>
    </div>
  </div>
</div>

<!-- editor -->
<div class="ex-back" *ngIf="ed" (click)="ed = null">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(900px,100%)">
    <header><h2>{{ ed.v.id ? 'Edit' : 'New' }}</h2><button type="button" (click)="ed = null" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="edErr">{{ edErr }}</p>
      <div class="ex-form">
        <ng-container *ngFor="let c of form(ed.kind)">
          <label *ngIf="c.t === 'bool'" class="ck"><input type="checkbox" [(ngModel)]="ed.v[c.k]"> {{ c.l }}</label>
          <label *ngIf="c.t === 'select'">{{ c.l }}<select [(ngModel)]="ed.v[c.k]"><option [ngValue]="null">–</option><option *ngFor="let o of c.opts" [ngValue]="o.value">{{ o.label }}</option></select></label>
          <label *ngIf="c.t === 'area'" class="wide">{{ c.l }}<textarea [(ngModel)]="ed.v[c.k]" rows="2"></textarea></label>
          <label *ngIf="c.t === 'json'" class="wide">{{ c.l }}<textarea [(ngModel)]="ed.v[c.k]" rows="3" style="font-family:ui-monospace,monospace;font-size:12px"></textarea></label>
          <label *ngIf="!c.t || c.t === 'number' || c.t === 'date'">{{ c.l }}<input [type]="c.t || 'text'" [(ngModel)]="ed.v[c.k]"></label>
        </ng-container>
      </div>
      <!-- approval steps -->
      <ng-container *ngIf="ed.kind === 'permit-types' || ed.kind === 'approval-rules'">
        <div class="hs-section">Approval steps (in order)</div>
        <div class="hs-target" style="grid-template-columns:1fr 1fr auto" *ngFor="let st of ed.steps; let i = index">
          <select [(ngModel)]="st.role" style="height:30px;border:1px solid #dcdfea;border-radius:6px"><option *ngFor="let r of lk.roles" [value]="r.value">{{ r.label }}</option></select>
          <input [(ngModel)]="st.label" placeholder="Label on the permit"><button type="button" class="ex-btn sm" (click)="ed.steps.splice(i, 1)">×</button></div>
        <button type="button" class="ex-btn sm" (click)="ed.steps.push({ role: 'permit_issuer', label: '' })">+ Step</button>
      </ng-container>
      <!-- questions -->
      <ng-container *ngIf="ed.kind === 'templates'">
        <div class="hs-section">Questions</div>
        <div class="hs-target" style="grid-template-columns:110px 1fr 90px 70px auto" *ngFor="let q of ed.questions; let i = index">
          <input [(ngModel)]="q.section" placeholder="Section"><input [(ngModel)]="q.text" placeholder="Question">
          <select [(ngModel)]="q.type" style="height:30px;border:1px solid #dcdfea;border-radius:6px"><option value="yesno">Yes/No</option><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option></select>
          <label class="ck" style="font-size:12px"><input type="checkbox" [(ngModel)]="q.critical"> Critical</label>
          <button type="button" class="ex-btn sm" (click)="ed.questions.splice(i, 1)">×</button></div>
        <button type="button" class="ex-btn sm" (click)="ed.questions.push({ section: '', text: '', type: 'yesno', critical: false, required: true })">+ Question</button>
      </ng-container>
    </div>
    <footer><button type="button" class="ex-btn" (click)="ed = null">Cancel</button><button type="button" class="ex-btn primary" (click)="saveEd()">Save</button></footer>
  </div>
</div>`,
})
export class HseSetupComponent implements OnInit {
  tabs = [{ k: 'pack', l: 'Industry pack' }, { k: 'settings', l: 'Settings and risk matrix' }, { k: 'sites', l: 'Sites and areas' }, { k: 'contractors', l: 'Contractors' },
          { k: 'permit-types', l: 'Permit types' }, { k: 'templates', l: 'Forms and checklists' }, { k: 'approval-rules', l: 'Approval matrix' },
          { k: 'hazards', l: 'Hazard library' }, { k: 'categories', l: 'Incident categories' }, { k: 'terms', l: 'Terminology' },
          { k: 'links', l: 'Links with other apps' }];
  links: any = null;
  projOpts: any[] = [];
  ccOpts: any[] = [];
  reviewKinds = [{ k: 'permit_types', tab: 'permit-types', l: 'Permit types' }, { k: 'forms', tab: 'templates', l: 'Forms and checklists' },
                 { k: 'approvals', tab: 'approval-rules', l: 'Approval matrix' }, { k: 'hazards', tab: 'hazards', l: 'Hazard library' },
                 { k: 'incident_categories', tab: 'categories', l: 'Incident categories' }, { k: 'terms', tab: 'terms', l: 'Terminology' }];
  reviewKey: Record<string, string> = { 'permit-types': 'permit_types', templates: 'forms', 'approval-rules': 'approvals', hazards: 'hazards', categories: 'incident_categories', terms: 'terms' };
  prefixes = [{ k: 'incident_prefix', l: 'Incident' }, { k: 'permit_prefix', l: 'Permit' }, { k: 'risk_prefix', l: 'Risk' }, { k: 'action_prefix', l: 'Action' },
              { k: 'inspection_prefix', l: 'Inspection' }, { k: 'observation_prefix', l: 'Observation' }];
  spec: Record<string, { cols: Col[]; review?: boolean }> = {
    contractors: { cols: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'trade', l: 'Trade' }, { k: 'status_label', l: 'Status' }, { k: 'licence_expiry', l: 'Licence', t: 'date' }, { k: 'insurance_expiry', l: 'Insurance', t: 'date' }] },
    'permit-types': { review: true, cols: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'max_hours', l: 'Max h' }, { k: 'checklist_name', l: 'Checklist' }, { k: 'needs', l: 'Requires' }] },
    templates: { review: true, cols: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'kind_label', l: 'Type' }, { k: 'question_count', l: 'Questions' }, { k: 'frequency', l: 'Frequency' }] },
    'approval-rules': { review: true, cols: [{ k: 'subject_label', l: 'Subject' }, { k: 'key', l: 'Key' }, { k: 'stepsText', l: 'Steps' }, { k: 'note', l: 'Note' }] },
    hazards: { review: true, cols: [{ k: 'category', l: 'Category' }, { k: 'activity', l: 'Activity' }, { k: 'hazard', l: 'Hazard' }, { k: 'controls', l: 'Controls' }] },
    categories: { review: true, cols: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'kind', l: 'Kind' }, { k: 'restricted', l: 'Health restricted', t: 'bool' }] },
    terms: { review: true, cols: [{ k: 'key', l: 'Key' }, { k: 'label', l: 'Shown as' }] },
  };
  tab = 'pack';
  lk: any = { roles: [], terms: {} };
  rights: any = {};
  pack: any = null;
  s: any = null;
  rows: any[] = [];
  rf = '';
  sel: Record<number, boolean> = {};
  newArea: Record<number, string> = {};
  ed: any = null;
  edErr = '';
  msg = '';
  ok = '';
  five = [1, 2, 3, 4, 5];
  d = day;
  cls = stClass;

  constructor(private api: HseApiService, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    try { this.lk = await this.api.lookups(); this.rights = this.lk.rights || {}; } catch (e) { this.msg = HseApiService.error(e); }
    this.route.paramMap.subscribe(pm => this.setTab(pm.get('tab') || this.route.snapshot.queryParamMap.get('tab') || 'pack'));
  }

  async setTab(t: string): Promise<void> {
    this.tab = t; this.msg = ''; this.ok = ''; this.rows = []; this.sel = {}; this.rf = '';
    try {
      if (t === 'pack') this.pack = await this.api.get('pack/');
      else if (t === 'settings') this.s = await this.api.get('settings/');
      else if (t === 'links') this.links = await this.api.get('links/');
      else {
        this.rows = await this.api.get(`masters/${t}/`);
        if (t === 'sites') {   // pickers from the Projects and Expenses apps (empty when not linked)
          this.projOpts = this.lk.links?.projects ? await this.api.options('projects').catch(() => []) : [];
          this.ccOpts = this.lk.links?.costs ? await this.api.options('cost-centers').catch(() => []) : [];
        }
      }
    } catch (e) { this.msg = HseApiService.error(e); }
  }

  filtered(): any[] { return this.rows.filter(x => !this.rf || x.review_status === this.rf); }
  selected(): number[] { return Object.entries(this.sel).filter(([, v]) => v).map(([k]) => Number(k)); }

  cell(x: any, c: Col): string {
    if (c.k === 'needs') return [x.requires_risk_assessment && 'RA', x.requires_method_statement && 'MS', x.requires_gas_test && 'gas', x.requires_isolation && 'isolation',
                                 ...(x.required_competencies || [])].filter(Boolean).join(', ');
    if (c.k === 'stepsText') return (x.steps || []).map((s: any) => s.label || s.role).join(' → ') || 'not allowed / none';
    const v = x[c.k];
    if (c.t === 'bool') return v ? 'Yes' : '';
    if (c.t === 'date') return day(v);
    return v ?? '';
  }

  form(kind: string): Col[] {
    const yesno = (k: string, l: string): Col => ({ k, l, t: 'bool' });
    const F: Record<string, Col[]> = {
      sites: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'kind', l: 'Type (project, plant, hospital…)' }, { k: 'address', l: 'Address' },
              { k: 'manager', l: 'Manager', t: 'select', opts: (this.lk.employees || []).map((e: any) => ({ value: e.id, label: e.name })) },
              { k: 'branch', l: 'Branch (attendance hours, muster)', t: 'select', opts: (this.lk.branches || []).map((b: any) => ({ value: b.id, label: b.name })) },
              ...(this.lk.links?.projects ? [{ k: 'project_id', l: 'Project', t: 'select', opts: this.projOpts.map(o => ({ value: o.id, label: o.label })) }] : []),
              ...(this.lk.links?.costs ? [{ k: 'cost_center_id', l: 'Cost centre', t: 'select', opts: this.ccOpts.map(o => ({ value: o.id, label: o.label })) }] : []),
              yesno('is_active', 'Active')],
      contractors: [{ k: 'name', l: 'Name' }, { k: 'trade', l: 'Trade' }, { k: 'contact_name', l: 'Contact' }, { k: 'phone', l: 'Phone' }, { k: 'email', l: 'E-mail' },
                    { k: 'trade_licence_no', l: 'Trade licence no.' }, { k: 'licence_expiry', l: 'Licence expiry', t: 'date' }, { k: 'insurance_expiry', l: 'Insurance expiry', t: 'date' },
                    { k: 'status', l: 'Status', t: 'select', opts: this.lk.contractor_status || [] }, { k: 'notes', l: 'Notes', t: 'area' }, yesno('is_active', 'Active')],
      'permit-types': [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'description', l: 'Description', t: 'area' }, { k: 'color', l: 'Colour', t: 'color' },
                       { k: 'max_hours', l: 'Maximum validity (h)', t: 'number' }, { k: 'gas_retest_hours', l: 'Gas retest every (h, 0 = no)', t: 'number' },
                       { k: 'checklist', l: 'Checklist', t: 'select', opts: (this.lk.templates || []).filter((t: any) => t.kind === 'permit_checklist').map((t: any) => ({ value: t.id, label: t.name })) },
                       yesno('requires_risk_assessment', 'Approved risk assessment'), yesno('requires_method_statement', 'Method statement'), yesno('requires_gas_test', 'Gas test'),
                       yesno('requires_isolation', 'Verified isolations'), yesno('requires_contractor_approval', 'Approved contractor'),
                       { k: 'gas_limits', l: 'Gas limits (JSON, e.g. {"O2": [19.5, 23.5], "LEL": [0, 10]})', t: 'json' },
                       { k: 'required_competencies', l: 'Required competency codes (JSON list, e.g. ["IND", "WAH"])', t: 'json' },
                       { k: 'simops_conflicts', l: 'Must not run together with permit types (JSON list of codes)', t: 'json' }, yesno('is_active', 'Active')],
      templates: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'kind', l: 'Type', t: 'select', opts: this.lk.template_kinds || [] }, { k: 'frequency', l: 'Frequency' },
                  { k: 'description', l: 'Description', t: 'area' }, yesno('is_active', 'Active')],
      'approval-rules': [{ k: 'subject', l: 'Subject', t: 'select', opts: [{ value: 'risk', label: 'Risk assessment (key = band code)' }, { value: 'incident', label: 'Incident closure (key = severity 1–5)' },
                         { value: 'moc', label: 'Change (key = permanent / temporary / emergency)' }, { value: 'audit', label: 'Audit report (key = audit type or *)' },
                         { value: 'claim', label: 'Claim settlement (key = claim type or *)' }, { value: 'action', label: 'Corrective action' }] },
                         { k: 'key', l: 'Key' }, { k: 'note', l: 'Note' }, yesno('is_active', 'Active')],
      hazards: [{ k: 'category', l: 'Category' }, { k: 'activity', l: 'Activity' }, { k: 'hazard', l: 'Hazard' }, { k: 'consequence', l: 'Consequence' },
                { k: 'controls', l: 'Typical controls', t: 'area' }, { k: 'likelihood', l: 'Likelihood 1–5', t: 'number' }, { k: 'severity', l: 'Severity 1–5', t: 'number' }, yesno('is_active', 'Active')],
      categories: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Name' }, { k: 'kind', l: 'Kind', t: 'select', opts: ['injury', 'near_miss', 'property', 'environment', 'occupational', 'quality', 'security', 'other'].map(v => ({ value: v, label: v })) },
                   yesno('restricted', 'Health details restricted'), yesno('is_active', 'Active')],
      terms: [{ k: 'key', l: 'Key' }, { k: 'label', l: 'Shown as' }, yesno('is_active', 'Active')],
    };
    return (F[kind] || []).map(c => c.t === 'color' ? { ...c, t: undefined } : c);
  }

  edit(kind: string, x: any): void {
    this.edErr = '';
    const v: any = x ? { ...x } : { is_active: true };
    if (kind === 'sites') v.manager = x?.manager?.id ?? null;
    for (const c of this.form(kind)) if (c.t === 'json') v[c.k] = JSON.stringify(x ? x[c.k] ?? (c.k === 'gas_limits' ? {} : []) : (c.k === 'gas_limits' ? {} : []));
    this.ed = { kind, v, steps: JSON.parse(JSON.stringify(x?.approval_steps || x?.steps || [])), questions: JSON.parse(JSON.stringify(x?.questions || [])) };
    if (kind === 'templates' && x && !x.questions) this.api.get(`masters/templates/${x.id}/`).then(t => this.ed.questions = t.questions || []);
  }

  async saveEd(): Promise<void> {
    this.edErr = '';
    const body: any = { ...this.ed.v };
    try {
      for (const c of this.form(this.ed.kind)) if (c.t === 'json') body[c.k] = JSON.parse(body[c.k] || 'null');
    } catch { this.edErr = 'One of the JSON fields is not valid.'; return; }
    if (this.ed.kind === 'permit-types') body.approval_steps = this.ed.steps;
    if (this.ed.kind === 'approval-rules') body.steps = this.ed.steps;
    if (this.ed.kind === 'templates') body.questions = this.ed.questions.filter((q: any) => q.text?.trim());
    try {
      if (body.id) await this.api.patch(`masters/${this.ed.kind}/${body.id}/`, body); else await this.api.post(`masters/${this.ed.kind}/`, body);
      this.ed = null; this.ok = 'Saved.'; this.api.clear(); await this.setTab(this.tab);
    } catch (e) { this.edErr = HseApiService.error(e); }
  }

  async addArea(site: any): Promise<void> {
    const name = (this.newArea[site.id] || '').trim();
    if (!name) return;
    try { await this.api.post('areas/', { site: site.id, name }); this.newArea[site.id] = ''; this.api.clear(); await this.setTab('sites'); } catch (e) { this.msg = HseApiService.error(e); }
  }

  async reviewAll(kind: string): Promise<void> {
    try { const r = await this.api.post('pack/review/', { kind, all: true }); this.ok = `${r.updated} item(s) marked reviewed.`; this.api.clear(); await this.setTab('pack'); }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  async reviewSel(): Promise<void> {
    try { const r = await this.api.post('pack/review/', { kind: this.reviewKey[this.tab], ids: this.selected() }); this.ok = `${r.updated} item(s) marked reviewed.`; this.api.clear(); await this.setTab(this.tab); }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  async install(code: string, primary = false): Promise<void> {
    if (!confirm(primary ? 'Change the HSE industry to this pack? Its content is added (to review); nothing you already have is removed. The company master does not change.'
                         : 'Add this pack? It only adds what is missing; everything added is marked "to review".')) return;
    try { const r = await this.api.post('pack/', { industry: code, primary }); this.ok = 'Added: ' + Object.entries(r.added).filter(([, n]) => n).map(([k, n]) => `${n} ${k.replace(/_/g, ' ')}`).join(', '); await this.setTab('pack'); }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  toggleLink(x: any): void { x.on = !x.on; x.switched_off = !x.on; }

  async saveLinks(sync: boolean): Promise<void> {
    try {
      const off = this.links.links.filter((x: any) => x.available && !x.on).map((x: any) => x.key)
        .concat(this.links.links.filter((x: any) => !x.available && x.switched_off).map((x: any) => x.key));
      const r = await this.api.put('links/', { off, fatigue_max_hours: this.links.fatigue_max_hours, sync });
      this.links = r;
      const got = Object.entries(r.synced || {}).filter(([, n]) => n).map(([k, n]) => `${n} ${k.replace(/_/g, ' ')}`);
      this.ok = 'Links saved.' + (sync ? (got.length ? ' Brought in: ' + got.join(', ') + '.' : ' Nothing new to bring in.') : '');
      this.api.clear(); this.lk = await this.api.lookups(true);
    } catch (e) { this.msg = HseApiService.error(e); }
  }

  async saveSettings(): Promise<void> {
    try { this.s = await this.api.put('settings/', this.s); this.ok = 'Settings saved.'; this.api.clear(); } catch (e) { this.msg = HseApiService.error(e); }
  }
}
