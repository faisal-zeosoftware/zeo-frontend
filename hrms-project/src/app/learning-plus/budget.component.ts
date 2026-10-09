import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { LpApi } from './lp-api';

/** Training budget vs actual by department (actual = per-head cost of confirmed participants + session cost lines + online courses). */
@Component({
  selector: 'app-learning-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./learning-plus.css'],
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>Budget vs Actual</h1><p class="lp-desc">Actual = cost per head × confirmed participants + session cost lines (shared per participant) + completed self-paced online courses, by the participant's department.</p></div>
    <div class="lp-tools">
      <select [(ngModel)]="year" (ngModelChange)="load()" aria-label="Year"><option *ngFor="let y of years" [ngValue]="y">{{ y }}</option></select>
    </div>
  </div>
  <p class="lp-msg err" *ngIf="msg">{{ msg }}</p>
  <p class="lp-muted" *ngIf="loading">Loading…</p>
  <ng-container *ngIf="d && !loading">
    <div class="lp-tiles">
      <div class="lp-tile"><div class="k">Budget {{ d.year }}</div><div class="v">{{ d.budget_total | number:'1.0-0' }}</div></div>
      <div class="lp-tile"><div class="k">Actual</div><div class="v">{{ d.actual_total | number:'1.0-0' }}</div></div>
      <div class="lp-tile"><div class="k">Remaining</div><div class="v" [style.color]="d.variance_total < 0 ? '#c62f45' : null">{{ d.variance_total | number:'1.0-0' }}</div></div>
      <div class="lp-tile"><div class="k">Used</div><div class="v">{{ d.utilisation === null ? '–' : d.utilisation + '%' }}</div></div>
      <div class="lp-tile"><div class="k">Cost / participant</div><div class="v">{{ d.cost_per_participant === null ? '–' : (d.cost_per_participant | number:'1.0-0') }}</div></div>
    </div>
    <div class="lp-card">
      <h2>By department <span class="lp-muted" style="font-weight:400">(AED)</span></h2>
      <div class="lp-legend"><span><span class="lp-tag" style="background:#c9c4f7;color:#1f1d3a">budget</span></span><span><span class="lp-tag" style="background:#5b4fe0;color:#fff">actual</span></span><span><span class="lp-tag red">over budget</span></span></div>
      <p class="lp-muted" *ngIf="!d.rows.length">No budget or training cost for {{ d.year }}.</p>
      <div class="lp-brow" *ngFor="let r of d.rows">
        <div class="n">{{ r.department }}</div>
        <div class="bars">
          <div class="lp-bar budget" [attr.aria-label]="'Budget ' + (r.budget || 0)"><span [style.width.%]="pct(r.budget)"></span></div>
          <div class="lp-bar" [class.over]="r.budget !== null && r.actual > r.budget" [attr.aria-label]="'Actual ' + r.actual"><span [style.width.%]="pct(r.actual)"></span></div>
        </div>
        <div class="nums">
          <span>Budget {{ r.budget === null ? 'not set' : (r.budget | number:'1.0-0') }}</span><span>Actual {{ r.actual | number:'1.0-0' }}</span>
          <span *ngIf="r.utilisation !== null">{{ r.utilisation }}% used</span><span>{{ r.participants }} participant(s)</span>
          <span>per head {{ r.per_head | number:'1.0-0' }} · sessions {{ r.session_costs | number:'1.0-0' }} · online {{ r.online | number:'1.0-0' }}</span>
        </div>
      </div>
      <p class="lp-muted" *ngIf="d.unallocated">Session costs without participants (not allocated): AED {{ d.unallocated | number:'1.0-0' }}</p>
      <p class="lp-muted" *ngIf="d.company_budget !== null">Company-wide budget: AED {{ d.company_budget | number:'1.0-0' }} (department budgets add up to {{ d.department_budgets | number:'1.0-0' }}).</p>
    </div>
  </ng-container>
</div>`,
})
export class LearningBudgetComponent implements OnInit {
  d: any = null; year = new Date().getFullYear(); years = [0, 1, 2, 3].map(i => new Date().getFullYear() + 1 - i);
  loading = false; msg = ''; private max = 1;
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true; this.msg = ''; this.cd.detectChanges();
    try {
      this.d = await this.api.get('learning/plus/api/budget-vs-actual/', { year: this.year });
      this.max = Math.max(1, ...this.d.rows.map((r: any) => Math.max(r.budget || 0, r.actual || 0)));
    } catch (e) { this.d = null; this.msg = LpApi.err(e, 'Could not load the budget.'); }
    this.loading = false; this.cd.detectChanges();
  }

  pct(v: number | null): number { return Math.min(100, Math.round(((v || 0) * 100) / this.max)); }
}
