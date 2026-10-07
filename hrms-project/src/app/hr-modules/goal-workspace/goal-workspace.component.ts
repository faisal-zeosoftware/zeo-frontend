import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ModuleApiService } from '../module-api.service';
import { SessionService } from '../../login/session.service';
import { HrPermissionService } from '../hr-permission.service';

const SHEETS = '/performance/api/goal-sheets/';
const GOALS = '/performance/api/goals/';
const CHECKINS = '/performance/api/checkins/';

export const SHEET_FLOW = [
  { key: 'draft', label: 'Draft' }, { key: 'submitted', label: 'Goals submitted' }, { key: 'approved', label: 'Goals approved' },
  { key: 'self_submitted', label: 'Self appraisal' }, { key: 'reviewed', label: 'Manager review' },
  { key: 'calibrated', label: 'Calibrated' }, { key: 'acknowledged', label: 'Acknowledged' },
];

/**
 * One workspace for Goal Setting, Mid-Year Check-in, Self Appraisal and Manager Review.
 * Route data 'mode' decides the default list (mine / team) and the screen title.
 */
@Component({
  selector: 'app-hr-goal-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './goal-workspace.component.html',
  styleUrls: ['../hr-shared.css', './goal-workspace.component.css'],
})
export class GoalWorkspaceComponent implements OnInit {
  mode: 'goals' | 'checkin' | 'self' | 'review' = 'goals';
  title = 'Goal Setting';
  flow = SHEET_FLOW;

  cycles: any[] = [];
  kpis: any[] = [];
  cycleId: any = null;
  scope: 'mine' | 'team' | 'all' = 'mine';
  statusFilter = '';
  sheets: any[] = [];
  sheet: any = null;
  checkins: any[] = [];

  goalForm: any = null; // add/edit goal
  checkinForm: any = null;
  reviewForm = { manager_comments: '', development_needs: '' };
  selfForm = { key_achievements: '', development_needs: '' };

  userId: number | null = null;
  isAdmin = false;
  busy = false;
  toast: { text: string; kind: 'ok' | 'err' } | null = null;

  constructor(private api: ModuleApiService, private route: ActivatedRoute, private session: SessionService, private perms: HrPermissionService) {}

  ngOnInit(): void {
    // the JWT user_id claim can be a string ('4') or a number depending on the simplejwt version
    const uid = this.session.getUserId();
    this.userId = uid === null || uid === undefined ? null : Number(uid);
    this.perms.isSuperuser().subscribe(v => (this.isAdmin = v));
    this.route.data.subscribe(d => {
      this.mode = d['mode'] || 'goals';
      this.title = ({ goals: 'Goal Setting', checkin: 'Mid-Year Check-in', self: 'Self Appraisal', review: 'Manager Review' } as any)[this.mode];
      this.scope = this.mode === 'review' || this.mode === 'checkin' ? 'team' : 'mine';
      this.sheet = null;
      this.loadSheets();
    });
    this.api.list('/performance/api/cycles/').subscribe(c => {
      this.cycles = c.filter(x => x.status !== 'draft');
      if (!this.cycleId && this.cycles.length) {
        this.cycleId = this.cycles[0].id;
        this.loadSheets();
      }
    });
    this.api.list('/performance/api/kpis/', { active: 'true' }).subscribe(k => (this.kpis = k));
  }

  loadSheets(): void {
    if (!this.cycleId) { this.sheets = []; return; }
    const q: any = { cycle: this.cycleId };
    if (this.scope === 'mine') q.mine = 'true';
    if (this.scope === 'team') q.team = 'true';
    if (this.statusFilter) q.status = this.statusFilter;
    this.api.list(SHEETS, q).subscribe({
      next: rows => {
        this.sheets = rows;
        if (this.sheet) this.sheet = rows.find(r => r.id === this.sheet.id) || null;
        if (!this.sheet && rows.length === 1 && this.scope === 'mine') this.open(rows[0]);
      },
      error: e => this.err(e),
    });
  }

  open(s: any): void {
    this.sheet = s;
    this.goalForm = null;
    this.checkinForm = null;
    this.reviewForm = { manager_comments: s.manager_comments || '', development_needs: s.development_needs || '' };
    this.selfForm = { key_achievements: s.key_achievements || '', development_needs: s.development_needs || '' };
    this.api.list(CHECKINS, { sheet: s.id }).subscribe(c => (this.checkins = c));
  }

  refresh(): void {
    if (!this.sheet) return;
    this.api.get(`${SHEETS}${this.sheet.id}/`).subscribe(s => {
      this.sheet = s;
      const i = this.sheets.findIndex(x => x.id === s.id);
      if (i >= 0) this.sheets[i] = s;
    });
  }

  // ----- roles -----
  get isOwner(): boolean { return !!this.sheet && (Number(this.sheet.employee_user) === this.userId || this.isAdmin); }
  get isManager(): boolean { return !!this.sheet && (Number(this.sheet.manager) === this.userId || this.isAdmin); }
  get showList(): boolean { return this.scope !== 'mine' || this.sheets.length !== 1; }
  stepIndex(key: string): number { return this.flow.findIndex(f => f.key === key); }

  get totalWeight(): number { return (this.sheet?.goals || []).reduce((a: number, g: any) => a + Number(g.weight || 0), 0); }
  get kpiWeight(): number { return (this.sheet?.goals || []).filter((g: any) => g.goal_type === 'kpi').reduce((a: number, g: any) => a + Number(g.weight || 0), 0); }

  canEditGoals(): boolean { return this.sheet?.status === 'draft' && this.isOwner || (this.isManager && ['submitted'].includes(this.sheet?.status)); }
  canSelfRate(): boolean { return this.sheet?.status === 'approved' && this.isOwner; }
  canManagerRate(): boolean { return this.sheet?.status === 'self_submitted' && this.isManager; }
  canProgress(): boolean { return this.sheet?.status === 'approved' && (this.isOwner || this.isManager); }

  // ----- goals -----
  newGoal(): void {
    this.goalForm = { sheet: this.sheet.id, kpi: null, title: '', goal_type: 'kpi', weight: 10, target: '', due_date: null };
  }

  editGoal(g: any): void {
    this.goalForm = { ...g };
  }

  pickKpi(): void {
    const k = this.kpis.find(x => x.id === this.goalForm.kpi);
    if (k) {
      this.goalForm.title = this.goalForm.title || k.name;
      this.goalForm.goal_type = k.kpi_type;
      this.goalForm.weight = Number(k.default_weight);
    }
  }

  saveGoal(): void {
    const f = this.goalForm;
    const body: any = { title: f.title, goal_type: f.goal_type, weight: f.weight, target: f.target || null, due_date: f.due_date || null, kpi: f.kpi || null };
    if (!f.id) body.sheet = this.sheet.id;
    const req = f.id ? this.api.update(GOALS, f.id, body) : this.api.create(GOALS, body);
    req.subscribe({ next: () => { this.goalForm = null; this.refresh(); }, error: e => this.err(e) });
  }

  deleteGoal(g: any): void {
    if (!confirm('Delete this goal?')) return;
    this.api.remove(GOALS, g.id).subscribe({ next: () => this.refresh(), error: e => this.err(e) });
  }

  patchGoal(g: any, fields: string[]): void {
    const body: any = {};
    fields.forEach(k => (body[k] = g[k] === '' ? null : g[k]));
    this.api.update(GOALS, g.id, body).subscribe({ next: () => this.ok('Saved.'), error: e => this.err(e) });
  }

  // ----- sheet actions -----
  act(action: string, body: any = {}, confirmText?: string): void {
    if (confirmText && !confirm(confirmText)) return;
    this.busy = true;
    this.api.action(SHEETS, this.sheet.id, action, body).subscribe({
      next: (r: any) => { this.busy = false; this.ok(r.detail); this.sheet = r.sheet; this.loadSheets(); },
      error: e => { this.busy = false; this.err(e); },
    });
  }

  sendBack(): void {
    const reason = prompt('Reason for sending back:');
    if (reason) this.act('return_form', { reason });
  }

  submitSelf(): void {
    this.api.update(SHEETS, this.sheet.id, this.selfForm).subscribe({
      next: () => this.act('submit_self', {}, 'Submit your self appraisal? You cannot change ratings afterwards.'),
      error: e => this.err(e),
    });
  }

  submitReview(): void {
    this.act('submit_review', this.reviewForm, 'Submit the manager review?');
  }

  acknowledge(disagree: boolean): void {
    const note = disagree ? prompt('Tell HR what you disagree with:') : '';
    if (disagree && !note) return;
    this.act('acknowledge', { disagree, note });
  }

  // ----- check-ins -----
  newCheckin(): void {
    this.checkinForm = { checkin_date: new Date().toISOString().slice(0, 10), manager_comments: '', employee_comments: '', goal_changes: '' };
  }

  saveCheckin(): void {
    this.api.create(CHECKINS, { ...this.checkinForm, sheet: this.sheet.id }).subscribe({
      next: () => { this.checkinForm = null; this.api.list(CHECKINS, { sheet: this.sheet.id }).subscribe(c => (this.checkins = c)); this.ok('Check-in saved.'); },
      error: e => this.err(e),
    });
  }

  stars(n: any): number[] { return [1, 2, 3, 4, 5].map(i => (i <= Number(n || 0) ? 1 : 0)); }

  statusClass(st: string): string {
    return 'tag tag-' + ({ draft: 'grey', submitted: 'orange', approved: 'blue', self_submitted: 'cyan', reviewed: 'blue', calibrated: 'green', acknowledged: 'green' } as any)[st];
  }

  ok(text: string): void { this.toast = { text, kind: 'ok' }; setTimeout(() => (this.toast = null), 3500); }
  err(e: any): void { this.toast = { text: ModuleApiService.errorText(e), kind: 'err' }; setTimeout(() => (this.toast = null), 7000); }
}
