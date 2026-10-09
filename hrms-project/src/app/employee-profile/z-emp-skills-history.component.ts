import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeeProfileService } from './employee-profile.service';

/** v1.13.0 – "Skills" tab: Learning Plus skills (level 1-5, source) and the older marketing / programming / language skills, read only. */
@Component({
  selector: 'z-emp-skills',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep" *ngIf="s">
  <div class="ep-bar"><span class="grow lp-muted">Skills come from passed courses, appraisals and HR. Change them in Learning.</span>
    <a class="lp-btn" routerLink="/main-sidebar/learning-options/employee-skills">Open employee skills</a>
    <a class="lp-btn" routerLink="/main-sidebar/learning-options/skill-matrix">Skill matrix</a></div>
  <div class="ep-sec">
    <h3>Skills</h3>
    <div class="ep-empty" *ngIf="!s.learning?.length">No skills recorded yet.</div>
    <div class="ep-scroll" *ngIf="s.learning?.length">
      <table class="ep-table" zPlain>
        <thead><tr><th>Skill</th><th>Category</th><th>Level</th><th>Source</th><th>Date</th><th>Verified</th></tr></thead>
        <tbody><tr *ngFor="let x of s.learning">
          <td>{{ x.skill }}</td><td>{{ x.category || '–' }}</td>
          <td><span class="ep-tag blue" [attr.aria-label]="'Level ' + x.level + ' of 5'">{{ '★'.repeat(x.level) }}{{ '☆'.repeat(5 - x.level) }}</span></td>
          <td>{{ x.source }}</td><td>{{ x.date || '–' }}</td><td>{{ x.verified ? 'Yes' : 'No' }}</td></tr></tbody>
      </table>
    </div>
  </div>
  <div class="ep-sec" *ngIf="s.marketing?.length || s.programming?.length || s.language?.length">
    <h3>Other skills</h3>
    <div class="ep-grid">
      <div class="ep-f" *ngIf="s.marketing?.length"><span>Marketing</span><b>{{ list(s.marketing) }}</b></div>
      <div class="ep-f" *ngIf="s.programming?.length"><span>Programming</span><b>{{ list(s.programming) }}</b></div>
      <div class="ep-f" *ngIf="s.language?.length"><span>Languages</span><b>{{ list(s.language) }}</b></div>
    </div>
  </div>
</div>
<div class="ep-empty" *ngIf="denied">{{ denied }}</div>`,
})
export class ZEmpSkillsComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  s: any = null;
  denied = '';
  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}
  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }
  async load(): Promise<void> {
    try { this.s = (await this.svc.profile(this.employeeId!)).skills; } catch { this.denied = 'The skills could not be loaded.'; }
    this.cd.markForCheck();
  }
  list(x: any[]): string { return x.map(i => i.skill + (i.percentage !== null && i.percentage !== undefined ? ` (${i.percentage}%)` : '')).join(', '); }
}

/**
 * v1.13.0 – "History" tab: one timeline of joining, probation and confirmation, transfers and promotions, salary
 * revisions, organisation changes, field changes (from the change log) and resignation / end of service.
 */
@Component({
  selector: 'z-emp-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep">
  <div class="ep-bar">
    <div class="ep-chips" role="group" aria-label="Event types">
      <button type="button" class="ep-chip" [class.on]="!picked.size" (click)="picked.clear(); load()">All</button>
      <button type="button" class="ep-chip" *ngFor="let t of types" [class.on]="picked.has(t.key)" (click)="toggle(t.key)">{{ t.label }}</button>
    </div>
    <span class="grow"></span>
    <label class="ep-f" style="flex-direction:row;align-items:center;gap:6px"><span>From</span><input type="date" [(ngModel)]="from" (change)="load()" style="width:150px"></label>
    <label class="ep-f" style="flex-direction:row;align-items:center;gap:6px"><span>To</span><input type="date" [(ngModel)]="to" (change)="load()" style="width:150px"></label>
  </div>
  <div class="ep-empty" *ngIf="loading">Loading…</div>
  <div class="ep-empty" *ngIf="error">{{ error }}</div>
  <div class="ep-empty" *ngIf="!loading && !error && !events.length">Nothing recorded for these filters.</div>
  <ul class="ep-tl" *ngIf="events.length">
    <li *ngFor="let e of events" [ngClass]="e.type">
      <div class="when">{{ fmt(e.date) }} · {{ typeLabel(e.type) }}<ng-container *ngIf="e.by"> · {{ e.by }}</ng-container></div>
      <div class="what">{{ e.title }}</div>
      <div class="det" *ngIf="e.detail">{{ e.detail }}</div>
    </li>
  </ul>
</div>`,
})
export class ZEmpHistoryComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  types: { key: string; label: string }[] = [
    { key: 'joined', label: 'Joined' }, { key: 'probation', label: 'Probation & confirmation' }, { key: 'transfer', label: 'Transfers & promotions' },
    { key: 'salary', label: 'Salary revisions' }, { key: 'org', label: 'Organisation changes' }, { key: 'field', label: 'Field changes' },
    { key: 'exit', label: 'Resignation & exit' }];
  picked = new Set<string>();
  from = '';
  to = '';
  events: any[] = [];
  loading = false;
  error = '';

  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}

  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }

  toggle(k: string): void { this.picked.has(k) ? this.picked.delete(k) : this.picked.add(k); this.load(); }
  typeLabel(k: string): string { return this.types.find(t => t.key === k)?.label || k; }
  fmt(v: string): string { const [y, m, d] = String(v || '').split('-'); return d ? `${d}/${m}/${y}` : v; }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    let extra = '';
    if (this.picked.size) { extra += '&types=' + [...this.picked].join(','); }
    if (this.from) { extra += '&from=' + this.from; }
    if (this.to) { extra += '&to=' + this.to; }
    try { this.events = (await this.svc.get<any>(`history/${this.employeeId}/`, extra)).events || []; }
    catch (e: any) { this.events = []; this.error = e?.status === 403 ? 'You do not have access to this history.' : 'The history could not be loaded.'; }
    this.loading = false;
    this.cd.markForCheck();
  }
}

/** v1.13.0 – small "file complete" card: share of the UAE employee-file fields filled and what is missing. */
@Component({
  selector: 'z-emp-completeness',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./employee-profile.css'],
  template: `
<div class="ep ep-sec" *ngIf="c">
  <h3>Employee file {{ c.score }}% complete <span class="ep-tag" [ngClass]="c.score >= 90 ? 'ok' : c.score >= 60 ? 'warn' : 'bad'">{{ c.filled }} of {{ c.total }}</span></h3>
  <div class="ep-meter" role="progressbar" [attr.aria-valuenow]="c.score" aria-valuemin="0" aria-valuemax="100"><i [style.width.%]="c.score"></i></div>
  <div class="ep-missing" *ngIf="c.missing?.length"><span class="ep-tag warn" *ngFor="let m of c.missing">{{ m }}</span></div>
</div>`,
})
export class ZEmpCompletenessComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  c: any = null;
  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}
  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }
  async load(): Promise<void> {
    try { this.c = (await this.svc.profile(this.employeeId!)).completeness; } catch { this.c = null; }
    this.cd.markForCheck();
  }
}
