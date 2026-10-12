import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BAND_COLOR, HSE_BASE, HseApiService, day, stClass, when } from './hse-api.service';

/** Risk assessments (HIRA / JSA / TRA / aspects): hazard lines with initial and residual risk, approval by the matrix, revisions. */
@Component({
  selector: 'app-hse-risks',
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
          <div><h1 class="page-title">Risk assessments</h1><p class="ex-desc">Identify hazards, rate them on the company risk matrix and add controls until the residual risk is acceptable. Extreme residual risk cannot be approved.</p></div>
          <div class="ex-actions"><button type="button" class="ex-btn primary" (click)="newRa()">+ New risk assessment</button></div>
        </div>
        <div class="hs-filters">
          <input type="search" [(ngModel)]="q" (ngModelChange)="soon()" placeholder="Search…" aria-label="Search">
          <select [(ngModel)]="status" (ngModelChange)="load()" aria-label="Status"><option value="">Any status</option>
            <option value="draft">Draft</option><option value="submitted">Waiting for approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="superseded">Superseded</option></select>
        </div>
      </div>
      <div class="com_list mt-4"><div class="hs-scroll"><table class="hs-table zl-hse">
        <tr><th>Assessment</th><th>Type</th><th>Site</th><th>Branch</th><th>Hazards</th><th>Residual risk</th><th>Review</th><th>Status</th></tr>
        <tr class="click" *ngFor="let r of rows" (click)="open(r.id)">
          <td><span class="hs-code">{{ r.number }}</span><div style="font-weight:600;color:#1b1640">{{ r.title }}</div><div class="hs-muted">{{ r.owner?.name }}</div></td>
          <td>{{ r.kind_label }}</td><td>{{ r.site_name }}</td><td>{{ r.branch_name }}</td><td>{{ r.line_count }}</td>
          <td><span class="hs-score" [style.background]="r.band?.color || '#94a3b8'">{{ r.max_residual || '–' }}</span> {{ r.band?.label }}</td>
          <td [style.color]="r.review_overdue || r.review_required ? '#b42318' : null">{{ r.review_required ? 'Review required' : d(r.review_date) }}</td>
          <td><span class="hs-b" [ngClass]="cls(r.status)">{{ r.status_label }}</span></td></tr></table></div>
        <p class="hs-empty" *ngIf="!rows.length">No risk assessments.</p></div>
    </ng-container>

    <ng-container *ngIf="id && ra">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button>
            <span class="hs-code">{{ ra.number }}</span> {{ ra.title }} <span class="hs-b" [ngClass]="cls(ra.status)">{{ ra.status_label }}</span></h1>
            <p class="ex-desc">{{ ra.kind_label }} · {{ ra.site_name }}{{ ra.area_name ? ' / ' + ra.area_name : '' }}{{ ra.previous ? ' · revision of ' + ra.previous.number : '' }}</p></div>
          <div class="ex-actions">
            <button type="button" class="ex-btn" *ngIf="editable" (click)="save()">Save</button>
            <button type="button" class="ex-btn primary" *ngIf="editable" (click)="act('submit')">Submit for approval</button>
            <button type="button" class="ex-btn primary" *ngIf="ra.status === 'submitted' && canDecide()" (click)="act('approve')">Approve ({{ cur()?.label }})</button>
            <button type="button" class="ex-btn danger" *ngIf="ra.status === 'submitted' && canDecide()" (click)="act('reject', true)">Reject</button>
            <button type="button" class="ex-btn" *ngIf="ra.status === 'approved'" (click)="act('revise')">Revise</button>
          </div>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
        <p class="hs-note err" *ngIf="ra.review_required">{{ ra.review_reason }} – revise it before it is used again.</p>
        <div class="hs-steps" *ngIf="ra.steps?.length"><div class="s" *ngFor="let s of ra.steps" [class.done]="s.status === 'approved'" [class.bad]="s.status === 'rejected'">
          {{ s.label }}<div *ngIf="s.by" style="font-weight:400">{{ s.by }} · {{ w(s.at) }}</div></div></div>
        <div class="hs-card" style="margin-bottom:14px">
          <div class="ex-form">
            <label>Title<input [(ngModel)]="ra.title" [disabled]="!editable"></label>
            <label>Type<select [(ngModel)]="ra.kind" [disabled]="!editable"><option *ngFor="let k of lk.risk_kinds" [value]="k.value">{{ k.label }}</option></select></label>
            <label>{{ lk.terms?.site || 'Site' }}<select [(ngModel)]="ra.site" [disabled]="!editable"><option [ngValue]="null">–</option><option *ngFor="let s of lk.sites" [ngValue]="s.id">{{ s.name }}</option></select></label>
            <label>Owner<select [(ngModel)]="ownerId" [disabled]="!editable"><option [ngValue]="null">–</option><option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
            <label class="wide">Activity / scope<textarea [(ngModel)]="ra.activity" [disabled]="!editable" rows="2"></textarea></label>
            <label>Team<input [(ngModel)]="ra.team" [disabled]="!editable"></label>
            <label>Review date<input type="date" [(ngModel)]="ra.review_date" [disabled]="!editable"></label>
          </div>
        </div>
        <div class="hs-card">
          <h3>Hazards and controls
            <span *ngIf="editable"> · <button type="button" class="hs-rlink" (click)="addLine()">+ Line</button>
              <button type="button" class="hs-rlink" (click)="lib = !lib">From hazard library</button></span></h3>
          <div *ngIf="lib" style="margin-bottom:10px">
            <input type="search" [(ngModel)]="libQ" (ngModelChange)="findLib()" placeholder="Search activity or hazard…" style="height:32px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;width:100%;font:inherit">
            <div class="hs-ev" *ngFor="let h of libRows" style="cursor:pointer" (click)="useLib(h)"><div class="t"><b>{{ h.activity }}</b> – {{ h.hazard }}<div class="hs-muted">{{ h.controls }}</div></div><div class="m">{{ h.category }}</div></div>
          </div>
          <div class="hs-scroll"><table class="hs-table hs-lines">
            <tr><th style="min-width:140px">Step / hazard</th><th style="min-width:140px">Consequence</th><th style="min-width:160px">Existing controls</th><th>L</th><th>S</th><th>Risk</th>
              <th style="min-width:160px">Additional controls</th><th>L</th><th>S</th><th>Residual</th><th></th></tr>
            <tr *ngFor="let l of ra.lines; let k = index">
              <td><input [(ngModel)]="l.step" placeholder="Step" [disabled]="!editable"><textarea [(ngModel)]="l.hazard" placeholder="Hazard *" [disabled]="!editable"></textarea></td>
              <td><textarea [(ngModel)]="l.consequence" [disabled]="!editable"></textarea></td>
              <td><textarea [(ngModel)]="l.existing_controls" [disabled]="!editable"></textarea></td>
              <td><select [(ngModel)]="l.likelihood" [disabled]="!editable"><option *ngFor="let n of five" [ngValue]="n" [title]="lk.matrix?.likelihood?.[n-1]">{{ n }}</option></select></td>
              <td><select [(ngModel)]="l.severity" [disabled]="!editable"><option *ngFor="let n of five" [ngValue]="n" [title]="lk.matrix?.severity?.[n-1]">{{ n }}</option></select></td>
              <td><span class="hs-score" [style.background]="color(l.likelihood * l.severity)">{{ l.likelihood * l.severity }}</span></td>
              <td><textarea [(ngModel)]="l.additional_controls" [disabled]="!editable"></textarea></td>
              <td><select [(ngModel)]="l.residual_likelihood" [disabled]="!editable"><option *ngFor="let n of five" [ngValue]="n">{{ n }}</option></select></td>
              <td><select [(ngModel)]="l.residual_severity" [disabled]="!editable"><option *ngFor="let n of five" [ngValue]="n">{{ n }}</option></select></td>
              <td><span class="hs-score" [style.background]="color(l.residual_likelihood * l.residual_severity)">{{ l.residual_likelihood * l.residual_severity }}</span></td>
              <td><button type="button" class="ex-btn sm" *ngIf="editable" (click)="ra.lines.splice(k, 1)">×</button></td>
            </tr></table></div>
          <p class="hs-empty" *ngIf="!ra.lines?.length">Add the hazards of the activity.</p>
        </div>
        <div class="ex-grid2" style="margin-top:14px">
          <div class="hs-card"><h3>Risk matrix (likelihood × severity)</h3>
            <div class="hs-matrix">
              <div class="h"></div><div class="h" *ngFor="let s of five" [title]="lk.matrix?.severity?.[s-1]">S{{ s }}</div>
              <ng-container *ngFor="let l of [5,4,3,2,1]"><div class="h" [title]="lk.matrix?.likelihood?.[l-1]">L{{ l }} {{ lk.matrix?.likelihood?.[l-1] }}</div>
                <div *ngFor="let s of five" [style.background]="color(l * s)">{{ l * s }}</div></ng-container>
            </div>
            <div class="hs-legend"><span *ngFor="let b of lk.matrix?.bands"><i [style.background]="b.color"></i>{{ b.label }} {{ b.min }}–{{ b.max }}{{ b.block ? ' (not allowed)' : '' }}</span></div>
          </div>
          <div class="hs-card"><h3>History</h3><div class="hs-ev" *ngFor="let h of ra.history"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div>
            <div *ngIf="ra.permits?.length" class="hs-muted" style="margin-top:8px">Used by permits: {{ permitList() }}</div></div>
        </div>
      </div>
    </ng-container>
  </div>
</div>`,
})
export class HseRisksComponent implements OnInit, OnDestroy {
  lk: any = { matrix: { bands: [] }, sites: [], employees: [], risk_kinds: [] };
  rows: any[] = [];
  id: number | null = null;
  ra: any = null;
  ownerId: number | null = null;
  q = '';
  status = '';
  five = [1, 2, 3, 4, 5];
  lib = false;
  libQ = '';
  libRows: any[] = [];
  msg = '';
  ok = '';
  w = when;
  d = day;
  cls = stClass;
  private sub?: Subscription;
  private timer: any;

  constructor(private api: HseApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async pm => {
      this.id = pm.get('id') ? Number(pm.get('id')) : null;
      this.msg = ''; this.ok = '';
      try { this.lk = await this.api.lookups(); } catch (e) { this.msg = HseApiService.error(e); }
      if (this.id) await this.reload(); else await this.load();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  get editable(): boolean { return !!this.ra && ['draft', 'rejected'].includes(this.ra.status); }
  color(n: number): string { return BAND_COLOR(n, this.lk.matrix?.bands); }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }
  cur(): any { return (this.ra?.steps || []).find((s: any) => s.status === 'pending'); }
  canDecide(): boolean { const c = this.cur(); return !!c && (this.lk.rights?.[c.role] || this.lk.rights?.admin); }
  permitList(): string { return (this.ra.permits || []).map((p: any) => p.number).join(', '); }

  async load(): Promise<void> {
    try { this.rows = (await this.api.get('risks/', { q: this.q, status: this.status, limit: 1000 })).results; } catch (e) { this.msg = HseApiService.error(e); }
  }

  async reload(): Promise<void> {
    try { this.ra = await this.api.get(`risks/${this.id}/`); this.ownerId = this.ra.owner?.id || null; } catch (e) { this.msg = HseApiService.error(e); }
  }

  async newRa(): Promise<void> {
    const title = prompt('Title of the risk assessment (activity)');
    if (!title) return;
    try { const r = await this.api.post('risks/', { title, kind: 'tra' }); this.open(r.id); } catch (e) { this.msg = HseApiService.error(e); }
  }

  open(id: number): void { this.router.navigate([HSE_BASE, 'risks', id]); }
  back(): void { this.router.navigate([HSE_BASE, 'risks']); }

  addLine(h: any = null): void {
    this.ra.lines = this.ra.lines || [];
    this.ra.lines.push({ step: h?.activity || '', hazard: h?.hazard || '', consequence: h?.consequence || '', existing_controls: h?.controls || '',
                         likelihood: h?.likelihood || 3, severity: h?.severity || 3, additional_controls: '', residual_likelihood: Math.max(1, (h?.likelihood || 3) - 1),
                         residual_severity: h?.severity || 3 });
  }

  async findLib(): Promise<void> { this.libRows = await this.api.get('hazards/', { q: this.libQ }).catch(() => []); }
  useLib(h: any): void { this.addLine(h); }

  async save(): Promise<boolean> {
    this.msg = ''; this.ok = '';
    try {
      this.ra = await this.api.patch(`risks/${this.id}/`, { title: this.ra.title, kind: this.ra.kind, site: this.ra.site, owner: this.ownerId, activity: this.ra.activity,
                                                            team: this.ra.team, review_date: this.ra.review_date, lines: this.ra.lines });
      this.ok = 'Saved.';
      return true;
    } catch (e) { this.msg = HseApiService.error(e); return false; }
  }

  async act(a: string, ask = false): Promise<void> {
    if (a === 'submit' && !(await this.save())) return;
    const note = ask ? (prompt('Reason') || '') : '';
    if (ask && !note) return;
    this.msg = ''; this.ok = '';
    try {
      const r = await this.api.post(`risks/${this.id}/${a}/`, { note });
      if (a === 'revise') { this.open(r.id); return; }
      this.ra = r; this.ok = 'Done.';
    } catch (e) { this.msg = HseApiService.error(e); }
  }
}
