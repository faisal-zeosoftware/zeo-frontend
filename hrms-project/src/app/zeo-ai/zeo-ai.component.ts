// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from '../shared-ui/i18n.service';
import { FLOW_CSS } from '../zeo-flow/flow.service';
import { renderAnswer } from '../shared-ui/z-ask.component';

/**
 * v1.37.0 – AI assistants: payroll auditor, attendance & shifts, recruitment, performance & development, workforce analytics.
 * Everything is computed on the server from the company's own records with a written reason for every flag – no outside AI
 * service is needed. When the company switched on an external model in Settings → AI settings, wording (job descriptions,
 * summaries) is polished by it; the numbers never leave ZEO. The assistants advise – people decide.
 * API: zeo-ai/api/…
 */
const API = `${environment.apiBaseUrl}/zeo-ai/api/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
const CSS = FLOW_CSS + `
.ai-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #e3e5ee;margin:0 0 14px}
.ai-tabs button{border:0;background:none;padding:9px 14px;font-size:13.5px;color:#6b7185;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:inline-flex;align-items:center;gap:6px}
.ai-tabs button .material-icons{font-size:18px}
.ai-tabs button.on{color:#5b4fe0;border-bottom-color:#5b4fe0;font-weight:600}
.ai-form{display:grid;gap:10px 14px;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));align-items:end;margin-bottom:12px}
.ai-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185;min-width:0}
.ai-form input,.ai-form select{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0;background:#fff}
.ai-form label.chk{flex-direction:row;align-items:center;gap:8px}.ai-form label.chk input{height:auto}
.ai-wide{overflow:auto}
.ai-num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.ai-sev{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 9px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
.ai-sev.critical{background:#fde8e8;color:#b42318}.ai-sev.warning{background:#fff4de;color:#b45309}.ai-sev.info{background:#e8eefb;color:#2b4fb5}
.ai-why{color:#4a4f63;font-size:12.5px;margin-top:3px;line-height:1.45}
.ai-done td{opacity:.6}
.ai-gate{padding:10px 12px;border-radius:10px;font-size:13px;margin-bottom:12px;display:flex;gap:8px;align-items:center}
.ai-gate.ok{background:#e3f6ea;color:#1f7a4d}.ai-gate.audit{background:#fff4de;color:#b45309}.ai-gate.critical{background:#fde8e8;color:#b42318}
.ai-two{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr))}
.ai-stack{display:grid;gap:14px;grid-template-columns:1fr}
.ai-stack .fw-table td{max-width:none}
.ai-note{font-size:12px;color:#6b7185;margin:8px 0 0}
.ai-text{font-size:13.5px;line-height:1.55;color:#2b2f42;white-space:pre-wrap}
.ai-md p{margin:0 0 8px;font-size:13.5px;line-height:1.5}.ai-md .za-h{font-weight:700;color:#1b1640;margin:10px 0 6px}.ai-md ul,.ai-md ol{margin:0 0 8px;padding-left:20px;font-size:13.5px}
.ai-md table{border-collapse:collapse;font-size:13px;margin:4px 0 10px}.ai-md th{text-align:left;color:#6b7185;font-size:12px;padding:6px 10px;border-bottom:1px solid #e3e5ee}.ai-md td{padding:6px 10px;border-bottom:1px solid #f0f1f6}
.ai-chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.ai-chips button{border:1px solid #dcdfea;background:#fff;border-radius:999px;padding:4px 11px;font-size:12px;color:#3c3f8f;cursor:pointer}.ai-chips button:hover{background:#f3f1ff}
.ai-ask{display:flex;gap:8px}.ai-ask input{flex:1;height:38px;border:1px solid #dcdfea;border-radius:10px;padding:0 12px;font-size:14px}
.ai-bar{display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0}.ai-bar i{display:block;height:10px;border-radius:5px;background:#5b4fe0;min-width:2px}.ai-bar i.fc{background:#b9b3f2}.ai-bar span{width:60px;color:#6b7185}.ai-bar b{width:40px;text-align:right}
.ai-score{display:inline-block;min-width:36px;text-align:center;border-radius:8px;padding:2px 6px;font-weight:700;font-size:13px}
.ai-score.hi{background:#e3f6ea;color:#1f7a4d}.ai-score.mid{background:#fff4de;color:#b45309}.ai-score.lo{background:#fde8e8;color:#b42318}
.ai-pre{font-family:inherit;font-size:13px;white-space:pre-wrap;background:#f6f7fb;border-radius:10px;padding:12px 14px;margin:0;line-height:1.5}
.ai-step{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f0f1f6;font-size:13px}.ai-step b{display:block}.ai-step small{color:#6b7185}
.ai-flag{font-size:12.5px;margin:2px 0}
.ai-q{font-size:13.5px;padding:6px 0;border-bottom:1px solid #f0f1f6}.ai-q .fw-chip{margin-right:8px}
.ai-gap{display:flex;align-items:center;gap:8px}.ai-gap .lv{display:inline-block;width:14px;height:14px;border-radius:3px;background:#e3e5ee}.ai-gap .lv.on{background:#5b4fe0}.ai-gap .lv.need{background:#f3c3c3}
`;
function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail; }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}
const TABS: [string, string, string][] = [['payroll', 'Payroll auditor', 'fact_check'], ['attendance', 'Attendance & shifts', 'schedule'], ['recruitment', 'Recruitment', 'person_search'],
  ['performance', 'Performance & development', 'school'], ['workforce', 'Workforce analytics', 'insights'], ['settings', 'Settings', 'tune']];
const EXAMPLES = ['Which departments have high turnover or absence?', 'Salary budget for the next 6 months with 5% growth', 'How many hires do we need with 10% growth?',
  'Compare workforce cost by department', 'Compare workforce cost by company', 'Headcount forecast for the next year', 'Overtime forecast for the next quarter'];

@Component({
  selector: 'app-zeo-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="fw">
  <div class="fw-head">
    <div>
      <h1>{{ 'AI assistants' | t }}</h1>
      <p>{{ 'Payroll audit, attendance patterns and rosters, CV screening, development plans and workforce forecasts – computed from your own records with the reason for every flag. The assistants advise; people decide.' | t }}</p>
    </div>
    <span class="sp"></span>
    <span class="fw-chip">{{ 'Built-in · no outside AI service' | t }}</span>
  </div>
  <div class="fw-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
  <div class="ai-tabs">
    <button type="button" *ngFor="let t of tabs" [class.on]="tab === t[0]" (click)="go(t[0])"><span class="material-icons">{{ t[2] }}</span>{{ t[1] | t }}</button>
  </div>

  <!-- ================= payroll auditor ================= -->
  <ng-container *ngIf="tab === 'payroll'">
    <div class="ai-stack">
      <div class="fw-card">
        <h2>{{ 'Payroll runs' | t }}</h2>
        <div class="ai-wide"><table class="fw-table">
          <tr><th>{{ 'Run' | t }}</th><th>{{ 'Status' | t }}</th><th class="ai-num">{{ 'Payslips' | t }}</th><th>{{ 'Audit' | t }}</th><th></th></tr>
          <tr *ngFor="let r of runs" [style.background]="r.id === run?.id ? '#f6f5ff' : ''">
            <td><a class="fw-link" (click)="openRun(r)">{{ r.name || (r.month + '/' + r.year) }}</a><div class="fw-muted" style="font-size:11.5px">{{ r.month }}/{{ r.year }}</div></td>
            <td><span class="fw-chip" [ngClass]="r.status">{{ r.status | t }}</span></td>
            <td class="ai-num">{{ r.payslips }}</td>
            <td>
              <ng-container *ngIf="r.audit; else noaudit">
                <span class="ai-sev critical" *ngIf="r.audit.open_critical">{{ r.audit.open_critical }} {{ 'critical' | t }}</span>
                <span class="ai-sev warning" *ngIf="!r.audit.open_critical && r.audit.open">{{ r.audit.open }} {{ 'open' | t }}</span>
                <span class="fw-chip ok" *ngIf="!r.audit.open">{{ 'clean' | t }}</span>
                <div class="fw-muted" style="font-size:11px">{{ r.audit.at | date:'d MMM HH:mm' }}</div>
              </ng-container>
              <ng-template #noaudit><span class="fw-chip waiting">{{ 'not audited' | t }}</span></ng-template>
            </td>
            <td><button class="fw-btn sm" type="button" (click)="audit(r)" [disabled]="busy">{{ (r.audit ? 'Re-run' : 'Audit') | t }}</button></td>
          </tr>
          <tr *ngIf="!runs.length"><td colspan="5" class="fw-empty">{{ 'No payroll runs yet.' | t }}</td></tr>
        </table></div>
        <p class="ai-note">{{ 'Rules: totals against the previous month, headcount, duplicate payslips and components, zero or negative net, gross and net changes per employee with the components that moved, missing attendance, overtime in attendance but not on the payslip, unpaid leave without deduction, missing IBAN, employees paid last month but not now.' | t }}</p>
      </div>
      <div class="fw-card" *ngIf="run">
        <h2>{{ run.name || (run.month + '/' + run.year) }}</h2>
        <div *ngIf="!a" class="fw-empty">{{ 'Not audited yet – click Audit.' | t }}</div>
        <ng-container *ngIf="a">
          <div class="ai-gate" [ngClass]="gate[0]"><span class="material-icons">{{ gate[0] === 'ok' ? 'verified' : gate[0] === 'audit' ? 'pending' : 'block' }}</span>
            {{ gate[0] === 'ok' ? ('Approval is not blocked by the audit.' | t) : gate[1] }}</div>
          <div class="fw-kpis">
            <div class="fw-kpi"><span>{{ 'Payslips' | t }}</span><b>{{ a.payslips }}</b></div>
            <div class="fw-kpi"><span>{{ 'Gross' | t }} <small *ngIf="a.totals.previous?.gross">({{ 'prev.' | t }} {{ a.totals.previous.gross | number:'1.0-0' }})</small></span><b>{{ a.totals.now.gross | number:'1.0-0' }}</b></div>
            <div class="fw-kpi"><span>{{ 'Net' | t }} <small *ngIf="a.totals.previous?.net">({{ 'prev.' | t }} {{ a.totals.previous.net | number:'1.0-0' }})</small></span><b>{{ a.totals.now.net | number:'1.0-0' }}</b></div>
            <div class="fw-kpi" [class.bad]="a.counts.critical"><span>{{ 'Critical' | t }}</span><b>{{ a.counts.critical || 0 }}</b></div>
            <div class="fw-kpi" [class.warn]="a.counts.warning"><span>{{ 'Warnings' | t }}</span><b>{{ a.counts.warning || 0 }}</b></div>
          </div>
          <p class="ai-text" style="margin:10px 0">{{ a.summary }}</p>
          <div class="fw-row" style="margin-bottom:8px">
            <span class="fw-muted" style="font-size:12px">{{ 'Audited' | t }} {{ a.at | date:'dd/MM/yyyy HH:mm' }} {{ a.by ? '· ' + a.by : '' }}{{ a.totals.previous_label ? ' · ' + ('compared with' | t) + ' ' + a.totals.previous_label : '' }}</span>
            <span class="sp" style="flex:1"></span>
            <label class="fw-check" style="font-size:12px"><input type="checkbox" [(ngModel)]="showDone"> {{ 'show decided' | t }}</label>
            <a class="fw-btn sm" [href]="xlsx(run.id)" target="_blank"><span class="material-icons">download</span>Excel</a>
          </div>
          <div class="ai-wide"><table class="fw-table">
            <tr><th style="min-width:360px">{{ 'Finding' | t }}</th><th>{{ 'Employee' | t }}</th><th class="ai-num">{{ 'Previous' | t }}</th><th class="ai-num">{{ 'Now' | t }}</th><th>{{ 'Decision' | t }}</th></tr>
            <ng-container *ngFor="let f of a.findings">
            <tr *ngIf="showDone || f.status === 'open'" [class.ai-done]="f.status !== 'open'">
              <td><span class="ai-sev" [ngClass]="f.severity">{{ f.severity | t }}</span> <b style="font-size:13px">{{ f.title }}</b><div class="ai-why">{{ f.explanation }}</div>
                <div class="fw-muted" style="font-size:11.5px;margin-top:3px" *ngIf="f.status !== 'open'">{{ f.status | t }} · {{ f.decided_by }} {{ f.decided_at | date:'d MMM HH:mm' }}<span *ngIf="f.note"> · {{ f.note }}</span></div></td>
              <td>{{ f.employee }}<div class="fw-muted" style="font-size:11px">{{ f.emp_code }}</div></td>
              <td class="ai-num">{{ f.previous != null ? (f.previous | number:'1.2-2') : '' }}</td>
              <td class="ai-num">{{ f.current != null ? (f.current | number:'1.2-2') : '' }}<div *ngIf="f.change_pct != null" class="fw-muted" style="font-size:11px">{{ f.change_pct > 0 ? '+' : '' }}{{ f.change_pct }}%</div></td>
              <td style="white-space:nowrap">
                <ng-container *ngIf="f.status === 'open'">
                  <button class="fw-btn sm" type="button" (click)="decide(f, 'acknowledged')" title="Seen – expected, no change needed for approval">{{ 'Acknowledge' | t }}</button>
                  <button class="fw-btn sm" type="button" (click)="decide(f, 'resolved')" title="Fixed in the payroll">{{ 'Resolved' | t }}</button>
                  <button class="fw-btn sm" type="button" (click)="decide(f, 'dismissed')" title="Not an issue">{{ 'Dismiss' | t }}</button>
                </ng-container>
                <button class="fw-btn sm" type="button" *ngIf="f.status !== 'open'" (click)="decide(f, 'open')">{{ 'Reopen' | t }}</button>
              </td>
            </tr>
            </ng-container>
            <tr *ngIf="!a.findings.length"><td colspan="5" class="fw-empty">{{ 'Nothing to report – the run looks consistent.' | t }}</td></tr>
          </table></div>
          <p class="ai-note">{{ 'Acknowledge = expected (approved increment, bonus, joiner); Resolved = corrected in the payroll (re-run the audit after fixing); Dismiss = not an issue. Critical findings block approval while open when "approval is refused while critical findings are open" is on in Settings.' | t }}</p>
        </ng-container>
      </div>
    </div>
  </ng-container>

  <!-- ================= attendance & shifts ================= -->
  <ng-container *ngIf="tab === 'attendance'">
    <div class="ai-form">
      <label>{{ 'Branch' | t }}<select [(ngModel)]="af.branch" (change)="loadAtt()"><option value="">{{ 'All' | t }}</option><option *ngFor="let b of lk.branches" [value]="b.id">{{ b.name }}</option></select></label>
      <label>{{ 'Department' | t }}<select [(ngModel)]="af.department" (change)="loadAtt()"><option value="">{{ 'All' | t }}</option><option *ngFor="let d of lk.departments" [value]="d.id">{{ d.name }}</option></select></label>
      <label>{{ 'Pattern window (days)' | t }}<input type="number" [(ngModel)]="af.days" (change)="loadAtt()" min="7" max="120"></label>
    </div>
    <div class="fw-kpis" *ngIf="pat && cov">
      <div class="fw-kpi"><span>{{ 'Employees' | t }}</span><b>{{ pat.employees }}</b></div>
      <div class="fw-kpi" [class.warn]="pat.flagged.length"><span>{{ 'Flagged patterns' | t }}</span><b>{{ pat.flagged.length }}</b></div>
      <div class="fw-kpi" [class.bad]="cov.gaps.length"><span>{{ 'Coverage gaps (14 d)' | t }}</span><b>{{ cov.gaps.length }}</b></div>
      <div class="fw-kpi"><span>{{ 'Overtime forecast (14 d)' | t }}</span><b>{{ cov.ot_forecast_hours }} h</b><span>{{ cov.ot_forecast_cost | number:'1.0-0' }} · {{ 'last 30 d' | t }} {{ cov.ot_last_30_hours }} h</span></div>
    </div>
    <div class="ai-two">
      <div class="fw-card" *ngIf="pat">
        <h2>{{ 'Repeated lates, missed punches, patterns' | t }}</h2>
        <div class="ai-wide"><table class="fw-table">
          <tr><th>{{ 'Employee' | t }}</th><th class="ai-num">{{ 'Days' | t }}</th><th class="ai-num">{{ 'Late' | t }}</th><th class="ai-num">{{ 'Missed' | t }}</th><th class="ai-num">{{ 'Absent' | t }}</th><th>{{ 'Why flagged' | t }}</th><th></th></tr>
          <tr *ngFor="let r of pat.flagged">
            <td>{{ r.employee }}<div class="fw-muted" style="font-size:11px">{{ r.code }} · {{ r.department }}</div></td>
            <td class="ai-num">{{ r.days }}</td><td class="ai-num">{{ r.late }}</td><td class="ai-num">{{ r.missing }}</td><td class="ai-num">{{ r.absent }}</td>
            <td><div class="ai-flag" *ngFor="let f of r.flags"><span class="ai-sev" [ngClass]="f.severity">{{ f.kind.replace('_', ' ') }}</span> {{ f.text }}</div></td>
            <td><button class="fw-btn sm" type="button" (click)="rf.employee = r.employee_id; findRepl()">{{ 'Cover' | t }}</button></td>
          </tr>
          <tr *ngIf="!pat.flagged.length"><td colspan="7" class="fw-empty">{{ 'No repeated lates, missed punches or absence patterns in this window.' | t }}</td></tr>
        </table></div>
        <ng-container *ngIf="pat.anomalies.length">
          <h2 style="margin-top:14px">{{ 'Anomalies for review' | t }}</h2>
          <div class="ai-flag" *ngFor="let x of pat.anomalies"><b>{{ x.employee }}</b> · {{ x.date | date:'d MMM' }} – {{ x.text }}</div>
        </ng-container>
      </div>
      <div class="fw-card" *ngIf="cov">
        <h2>{{ 'Coverage – next 14 days' | t }}</h2>
        <div class="ai-wide"><table class="fw-table">
          <tr><th>{{ 'Day' | t }}</th><th class="ai-num">{{ 'Usual' | t }}</th><th class="ai-num">{{ 'Rostered' | t }}</th><th class="ai-num">{{ 'On leave' | t }}</th><th class="ai-num">{{ 'Available' | t }}</th><th>{{ 'Coverage' | t }}</th></tr>
          <tr *ngFor="let d of cov.days" [style.background]="d.gap ? '#fff5f5' : ''">
            <td>{{ d.date | date:'EEE d MMM' }}</td><td class="ai-num">{{ d.usual }}</td><td class="ai-num">{{ d.rostered ?? '–' }}</td><td class="ai-num">{{ d.on_leave }}</td><td class="ai-num">{{ d.available }}</td>
            <td><span class="fw-chip" [ngClass]="d.gap ? 'bad' : 'ok'">{{ d.pct }}%</span> <span class="fw-muted" style="font-size:11.5px" *ngIf="d.gap">{{ 'short' | t }} {{ d.gap }}</span></td>
          </tr>
        </table></div>
        <p class="ai-note">{{ cov.note }}</p>
        <ng-container *ngIf="cov.ot_rows.length">
          <h2 style="margin-top:14px">{{ 'Overtime in the roster' | t }}</h2>
          <table class="fw-table"><tr><th>{{ 'Employee' | t }}</th><th class="ai-num">{{ 'Hours' | t }}</th><th class="ai-num">{{ 'Cost' | t }}</th></tr>
            <tr *ngFor="let r of cov.ot_rows"><td>{{ r.employee }}</td><td class="ai-num">{{ r.hours }}</td><td class="ai-num">{{ r.cost | number:'1.0-0' }}</td></tr></table>
        </ng-container>
      </div>
      <div class="fw-card">
        <h2>{{ 'Who can cover?' | t }}</h2>
        <div class="ai-form">
          <label>{{ 'Absent employee' | t }}<select [(ngModel)]="rf.employee"><option value="">–</option><option *ngFor="let e of lk.employees" [value]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
          <label>{{ 'Date' | t }}<input type="date" [(ngModel)]="rf.date"></label>
          <label>{{ 'Shift' | t }}<select [(ngModel)]="rf.shift"><option value="">{{ 'Any' | t }}</option><option *ngFor="let s of lk.shifts" [value]="s.id">{{ s.name }}</option></select></label>
          <label><span>&nbsp;</span><button class="fw-btn primary" type="button" (click)="findRepl()" [disabled]="!rf.employee">{{ 'Suggest' | t }}</button></label>
        </div>
        <table class="fw-table" *ngIf="repl"><tr><th>{{ 'Employee' | t }}</th><th>{{ 'Why' | t }}</th><th class="ai-num">{{ 'Score' | t }}</th></tr>
          <tr *ngFor="let r of repl"><td>{{ r.employee }}<div class="fw-muted" style="font-size:11px">{{ r.code }} · {{ r.department }} {{ r.designation ? '· ' + r.designation : '' }}</div></td><td style="font-size:12.5px">{{ r.why }}</td><td class="ai-num"><span class="ai-score" [ngClass]="r.score >= 60 ? 'hi' : r.score >= 30 ? 'mid' : 'lo'">{{ r.score }}</span></td></tr>
          <tr *ngIf="!repl.length"><td colspan="3" class="fw-empty">{{ 'Nobody free – everyone is on leave, unavailable or already rostered.' | t }}</td></tr></table>
      </div>
      <div class="fw-card">
        <h2>{{ 'Recommend a roster' | t }}</h2>
        <div class="ai-form">
          <label>{{ 'Branch' | t }}<select [(ngModel)]="ro.branch"><option value="">{{ 'All' | t }}</option><option *ngFor="let b of lk.branches" [value]="b.id">{{ b.name }}</option></select></label>
          <label>{{ 'Department' | t }}<select [(ngModel)]="ro.department"><option value="">{{ 'All' | t }}</option><option *ngFor="let d of lk.departments" [value]="d.id">{{ d.name }}</option></select></label>
          <label>{{ 'From' | t }}<input type="date" [(ngModel)]="ro.date_from"></label>
          <label>{{ 'To' | t }}<input type="date" [(ngModel)]="ro.date_to"></label>
          <label>{{ 'Shift' | t }}<select [(ngModel)]="ro.shift"><option value="">–</option><option *ngFor="let s of lk.shifts" [value]="s.id">{{ s.name }}</option></select></label>
          <label><span>&nbsp;</span><button class="fw-btn primary" type="button" (click)="roster()" [disabled]="busy">{{ 'Recommend' | t }}</button></label>
        </div>
        <ng-container *ngIf="ros">
          <p class="ai-note" *ngFor="let n of ros.notes">{{ n }}</p>
          <div class="ai-wide"><table class="fw-table"><tr><th>{{ 'Date' | t }}</th><th>{{ 'Working' | t }}</th><th>{{ 'Off' | t }}</th></tr>
            <tr *ngFor="let d of rosterDays()"><td>{{ d.date | date:'EEE d MMM' }}</td><td style="font-size:12.5px">{{ d.on.join(', ') }}</td><td class="fw-muted" style="font-size:12px">{{ d.off.join(', ') }}</td></tr></table></div>
          <p class="ai-note">{{ ros.rule }} {{ 'Nothing is saved – copy the recommendation into Shift planner › Rosters.' | t }}</p>
        </ng-container>
      </div>
    </div>
  </ng-container>

  <!-- ================= recruitment ================= -->
  <ng-container *ngIf="tab === 'recruitment'">
    <div class="fw-kpis" *ngIf="rm">
      <div class="fw-kpi"><span>{{ 'Open jobs' | t }}</span><b>{{ rm.open_jobs }}</b></div>
      <div class="fw-kpi"><span>{{ 'Applications (180 d)' | t }}</span><b>{{ rm.applications }}</b></div>
      <div class="fw-kpi"><span>{{ 'Avg. time to hire' | t }}</span><b>{{ rm.avg_time_to_hire != null ? rm.avg_time_to_hire + ' d' : '–' }}</b></div>
      <div class="fw-kpi"><span>{{ 'Offer acceptance' | t }}</span><b>{{ rm.offer_acceptance }}%</b></div>
    </div>
    <div class="fw-card" *ngIf="rm">
      <h2>{{ 'Pipeline and time-to-hire' | t }}</h2>
      <div class="ai-wide"><table class="fw-table">
        <tr><th>{{ 'Job' | t }}</th><th>{{ 'Department' | t }}</th><th>{{ 'Status' | t }}</th><th class="ai-num">{{ 'Applied' | t }}</th><th class="ai-num">{{ 'Screening' | t }}</th><th class="ai-num">{{ 'Interview' | t }}</th><th class="ai-num">{{ 'Offer' | t }}</th><th class="ai-num">{{ 'Hired' | t }}</th><th class="ai-num">{{ 'Days open' | t }}</th><th class="ai-num">{{ 'Time to hire' | t }}</th></tr>
        <tr *ngFor="let j of rm.jobs"><td><b>{{ j.job }}</b><div class="fw-muted" style="font-size:11px">{{ j.code }} · {{ j.openings }} {{ 'opening(s)' | t }}</div></td><td>{{ j.department }}</td><td><span class="fw-chip" [ngClass]="j.status">{{ j.status }}</span></td>
          <td class="ai-num">{{ j.applied }}</td><td class="ai-num">{{ j.screening }}</td><td class="ai-num">{{ j.interview }}</td><td class="ai-num">{{ j.offer }}</td><td class="ai-num">{{ j.hired }}</td><td class="ai-num">{{ j.days_open ?? '–' }}</td><td class="ai-num">{{ j.time_to_hire_days ?? '–' }}</td></tr>
        <tr *ngIf="!rm.jobs.length"><td colspan="10" class="fw-empty">{{ 'No job openings in the last 180 days.' | t }}</td></tr>
      </table></div>
    </div>
    <div class="ai-form">
      <label>{{ 'Job opening' | t }}<select [(ngModel)]="rc.job" (change)="loadJob()"><option value="">–</option><option *ngFor="let j of lk.jobs" [value]="j.id">{{ j.title }}</option></select></label>
      <label><span>&nbsp;</span><div class="fw-row"><button class="fw-btn" type="button" (click)="jobWhat('description')" [disabled]="!rc.job">{{ 'Job description' | t }}</button>
        <button class="fw-btn" type="button" (click)="jobWhat('questions')" [disabled]="!rc.job">{{ 'Interview questions' | t }}</button>
        <button class="fw-btn" type="button" (click)="jobWhat('slots')" [disabled]="!rc.job">{{ 'Free slots' | t }}</button></div></label>
    </div>
    <div class="ai-two" *ngIf="rc.job">
      <div class="fw-card" *ngIf="short">
        <h2>{{ 'Shortlist – ' + short.job }}</h2>
        <div class="ai-wide"><table class="fw-table">
          <tr><th>{{ 'Candidate' | t }}</th><th>{{ 'Stage' | t }}</th><th class="ai-num">{{ 'Match' | t }}</th><th class="ai-num">{{ 'Years' | t }}</th><th>{{ 'Missing' | t }}</th><th></th></tr>
          <tr *ngFor="let r of short.rows"><td><a class="fw-link" (click)="openCand(r.candidate_id)">{{ r.candidate }}</a><div class="fw-muted" style="font-size:11px">{{ r.skills.join(', ') }}</div></td><td><span class="fw-chip">{{ r.stage }}</span></td>
            <td class="ai-num"><span class="ai-score" [ngClass]="r.score >= 70 ? 'hi' : r.score >= 40 ? 'mid' : 'lo'">{{ r.score }}</span></td><td class="ai-num">{{ r.experience_years ?? '–' }}</td>
            <td style="font-size:12px">{{ r.missing.join(' · ') || '–' }}</td>
            <td style="white-space:nowrap"><button class="fw-btn sm" type="button" (click)="draft(r.application_id, 'invite')">{{ 'Invite' | t }}</button> <button class="fw-btn sm" type="button" (click)="draft(r.application_id, 'regret')">{{ 'Regret' | t }}</button></td></tr>
          <tr *ngIf="!short.rows.length"><td colspan="6" class="fw-empty">{{ 'No applications yet.' | t }}</td></tr>
        </table></div>
        <p class="ai-note">{{ short.note }}</p>
      </div>
      <div class="fw-card" *ngIf="cand">
        <h2>{{ cand.candidate.name }} <span class="fw-chip" *ngIf="!cand.candidate.has_cv">{{ 'no CV file' | t }}</span></h2>
        <p class="ai-text">{{ cand.summary }}</p>
        <div class="fw-grid" style="font-size:12.5px;margin:8px 0">
          <div><b>{{ 'Experience' | t }}</b> {{ cand.extracted.experience_years }} {{ 'yrs' | t }}</div><div><b>{{ 'Education' | t }}</b> {{ cand.extracted.education_all.join(', ') || '–' }}</div>
          <div><b>{{ 'Languages' | t }}</b> {{ cand.extracted.languages.join(', ') || '–' }}</div><div><b>{{ 'Notice' | t }}</b> {{ cand.extracted.notice_days ?? '–' }} d</div>
          <div><b>{{ 'Nationality' | t }}</b> {{ cand.extracted.nationality || '–' }}</div><div><b>{{ 'Visa' | t }}</b> {{ cand.extracted.visa || '–' }}</div>
          <div><b>{{ 'Phone' | t }}</b> {{ cand.extracted.phone || '–' }}</div><div><b>{{ 'Driving licence' | t }}</b> {{ cand.extracted.driving_licence ? ('yes' | t) : '–' }}</div>
        </div>
        <div class="ai-chips"><span class="fw-chip" *ngFor="let s of cand.extracted.skills">{{ s }}</span></div>
        <div *ngFor="let m of cand.matches" style="margin-top:8px;border-top:1px solid #f0f1f6;padding-top:8px">
          <div class="fw-row"><b style="font-size:13px">{{ m.job }}</b><span class="ai-score" [ngClass]="m.score >= 70 ? 'hi' : m.score >= 40 ? 'mid' : 'lo'">{{ m.score }}</span></div>
          <div class="ai-why" *ngFor="let r of m.reasons">• {{ r }}</div>
          <div class="ai-why" *ngIf="m.missing.length" style="color:#b42318">{{ 'Missing' | t }}: {{ m.missing.join('; ') }}</div>
        </div>
        <p class="ai-note">{{ cand.note }}</p>
      </div>
      <div class="fw-card" *ngIf="jd">
        <h2>{{ 'Job description (draft)' | t }} <button class="fw-btn sm" type="button" (click)="copy(jd.description)">{{ 'Copy' | t }}</button></h2>
        <div class="ai-md" [innerHTML]="md(jd.description)"></div>
        <p class="ai-note">{{ 'Made from the opening\\'s title, description, requirements and salary range – edit it in Recruitment › Job openings.' | t }}</p>
      </div>
      <div class="fw-card" *ngIf="qs">
        <h2>{{ 'Interview questions' | t }} <span class="fw-chip" *ngIf="qs.candidate">{{ qs.candidate }}</span> <button class="fw-btn sm" type="button" (click)="copyQs()">{{ 'Copy' | t }}</button></h2>
        <div class="ai-q" *ngFor="let q of qs.questions"><span class="fw-chip">{{ q.area }}</span>{{ q.question }}</div>
      </div>
      <div class="fw-card" *ngIf="slots">
        <h2>{{ 'Free interview slots' | t }}</h2>
        <div class="ai-chips"><span class="fw-chip" *ngFor="let s of slots.slots">{{ s | date:'EEE d MMM HH:mm' }}</span></div>
        <p class="ai-note">{{ 'Working days, 10:00 / 11:00 / 14:00 / 15:00, skipping times that already have an interview for this job. Book the interview in Recruitment › Interviews.' | t }}</p>
      </div>
      <div class="fw-card" *ngIf="dr">
        <h2>{{ 'E-mail draft' | t }} <button class="fw-btn sm" type="button" (click)="copy(dr.subject + '\\n\\n' + dr.body)">{{ 'Copy' | t }}</button></h2>
        <div class="ai-form"><label>{{ 'Kind' | t }}<select [(ngModel)]="drKind" (change)="draft(drApp, drKind)"><option value="invite">{{ 'Interview invitation' | t }}</option><option value="hold">{{ 'Still in process' | t }}</option><option value="offer_note">{{ 'Moving to offer' | t }}</option><option value="regret">{{ 'Regret' | t }}</option></select></label></div>
        <b style="font-size:13px">{{ dr.subject }}</b>
        <pre class="ai-pre">{{ dr.body }}</pre>
        <p class="ai-note">{{ 'Nothing is sent automatically – paste it into your e-mail or the candidate\\'s record.' | t }}</p>
      </div>
    </div>
  </ng-container>

  <!-- ================= performance & development ================= -->
  <ng-container *ngIf="tab === 'performance'">
    <div class="ai-form">
      <label>{{ 'Employee' | t }}<select [(ngModel)]="pf.employee" (change)="loadEmp()"><option value="">–</option><option *ngFor="let e of lk.employees" [value]="e.id">{{ e.name }} ({{ e.code }}) – {{ e.designation }}</option></select></label>
      <label><span>&nbsp;</span><div class="fw-row"><button class="fw-btn" type="button" (click)="tmpl()">{{ 'Appraisal template' | t }}</button><button class="fw-btn" type="button" (click)="loadTraining()">{{ 'Training & certificates' | t }}</button></div></label>
    </div>
    <div class="ai-two" *ngIf="pf.employee && ps">
      <div class="fw-card">
        <h2>{{ 'Review summary' | t }}</h2>
        <p class="ai-text">{{ ps.text }}</p>
        <table class="fw-table" *ngIf="ps.sheets.length" style="margin-top:8px"><tr><th>{{ 'Cycle' | t }}</th><th class="ai-num">{{ 'Self' | t }}</th><th class="ai-num">{{ 'Manager' | t }}</th><th class="ai-num">{{ 'Rating' | t }}</th><th>{{ 'Strongest / weakest' | t }}</th></tr>
          <tr *ngFor="let s of ps.sheets"><td>{{ s.cycle }}<div class="fw-muted" style="font-size:11px">{{ s.period }}</div></td><td class="ai-num">{{ s.self_score ?? '–' }}</td><td class="ai-num">{{ s.manager_score ?? '–' }}</td><td class="ai-num">{{ s.final_rating ?? '–' }}</td><td style="font-size:12px">↑ {{ s.best }} ({{ s.best_rating }})<br>↓ {{ s.weakest }} ({{ s.weakest_rating }})</td></tr></table>
        <div class="ai-chips" *ngIf="ps.themes.length"><span class="fw-muted" style="font-size:12px">{{ 'Themes' | t }}:</span><span class="fw-chip" *ngFor="let t of ps.themes">{{ t }}</span></div>
      </div>
      <div class="fw-card" *ngIf="pg">
        <h2>{{ 'Skill gaps vs the role' | t }} <span class="ai-score" *ngIf="pg.readiness != null" [ngClass]="pg.readiness >= 80 ? 'hi' : pg.readiness >= 50 ? 'mid' : 'lo'">{{ pg.readiness }}%</span></h2>
        <p class="ai-text" style="font-size:12.5px">{{ pg.text }}</p>
        <table class="fw-table"><tr><th>{{ 'Skill' | t }}</th><th>{{ 'Level' | t }}</th><th>{{ 'Closes the gap' | t }}</th></tr>
          <tr *ngFor="let g of pg.gaps"><td><b>{{ g.skill }}</b><div class="fw-muted" style="font-size:11px">{{ g.category }}</div></td>
            <td><div class="ai-gap"><span class="lv" *ngFor="let i of [1,2,3,4,5]" [class.on]="i <= g.current" [class.need]="i > g.current && i <= g.required"></span><small>{{ g.current_label }} → {{ g.required_label }}</small></div></td>
            <td style="font-size:12.5px"><div *ngFor="let c of g.courses">{{ c.title }} <span class="fw-muted">({{ c.hours }} h{{ c.cost ? ', ' + (c.cost | number:'1.0-0') : '' }})</span></div><span class="fw-muted" *ngIf="!g.courses.length">{{ 'no course mapped' | t }}</span></td></tr>
          <tr *ngFor="let g of pg.met"><td>{{ g.skill }}</td><td><div class="ai-gap"><span class="lv" *ngFor="let i of [1,2,3,4,5]" [class.on]="i <= g.current"></span><small>{{ g.current_label }}</small></div></td><td><span class="fw-chip ok">{{ 'meets' | t }}</span></td></tr>
        </table>
      </div>
      <div class="fw-card" *ngIf="pc">
        <h2>{{ 'Recommended training' | t }}</h2>
        <div class="ai-step" *ngFor="let r of pc.recommendations"><span class="ai-sev" [ngClass]="r.priority === 'high' ? 'critical' : r.priority === 'medium' ? 'warning' : 'info'">{{ r.priority }}</span><div><b>{{ r.title }}</b><small>{{ r.reason }}</small></div></div>
        <div class="fw-empty" *ngIf="!pc.recommendations.length">{{ 'Nothing to recommend – no gaps, expiring certificates or open training needs.' | t }}</div>
      </div>
      <div class="fw-card" *ngIf="po">
        <h2>{{ 'Suggested objectives for the next cycle' | t }} <button class="fw-btn sm" type="button" (click)="copyObj()">{{ 'Copy' | t }}</button></h2>
        <table class="fw-table"><tr><th>{{ 'Objective' | t }}</th><th class="ai-num">{{ 'Weight' | t }}</th><th>{{ 'Measure' | t }}</th><th>{{ 'Why' | t }}</th></tr>
          <tr *ngFor="let o of po.objectives"><td>{{ o.title }}</td><td class="ai-num">{{ o.weight }}%</td><td style="font-size:12px">{{ o.measure }}</td><td class="fw-muted" style="font-size:12px">{{ o.source }}</td></tr></table>
      </div>
      <div class="fw-card" *ngIf="pp">
        <h2>{{ 'Development plan (draft)' | t }} <button class="fw-btn sm primary" type="button" (click)="savePlan()" [disabled]="busy">{{ 'Save to People' | t }}</button></h2>
        <b style="font-size:13px">{{ pp.title }}</b>
        <div class="ai-step" *ngFor="let s of pp.steps; let i = index"><span class="fw-chip">{{ i + 1 }}</span><div><b>{{ s.title }}</b><small>{{ s.how }} · {{ 'due' | t }} {{ s.due }} · {{ s.measure }}</small></div></div>
        <p class="ai-note">{{ 'Saved as a draft plan in People › Development plans, where the manager and employee edit and track it.' | t }}</p>
      </div>
    </div>
    <div class="ai-two" *ngIf="tp || tr">
      <div class="fw-card" *ngIf="tp">
        <h2>{{ 'Appraisal template (suggestion)' | t }}</h2>
        <div *ngFor="let s of tp.sections" style="margin-bottom:10px"><b style="font-size:13px">{{ s.name }}</b> <span class="fw-chip" *ngIf="s.weight">{{ s.weight }}%</span>
          <div class="ai-chips"><span class="fw-chip" *ngFor="let it of (s.items || [])">{{ it.name }}{{ it.weight ? ' · ' + it.weight : '' }}</span><span class="fw-chip" *ngFor="let f of (s.fields || [])">{{ f }}</span></div></div>
        <div class="ai-chips"><span class="fw-chip" *ngFor="let r of tp.rating_scale">{{ r.value }} – {{ r.label }}</span></div>
        <p class="ai-note">{{ tp.guidance }}</p>
      </div>
      <div class="fw-card" *ngIf="tr">
        <h2>{{ 'Training completion & certificate expiry' | t }}</h2>
        <div class="fw-kpis"><div class="fw-kpi"><span>{{ 'Completion (90 d)' | t }}</span><b>{{ tr.completion_pct }}%</b></div><div class="fw-kpi" [class.warn]="tr.overdue_needs.length"><span>{{ 'Overdue needs' | t }}</span><b>{{ tr.overdue_needs.length }}</b></div>
          <div class="fw-kpi" [class.warn]="ce?.expiring?.length"><span>{{ 'Expiring (90 d)' | t }}</span><b>{{ ce?.expiring?.length || 0 }}</b></div><div class="fw-kpi" [class.bad]="ce?.expired?.length"><span>{{ 'Expired' | t }}</span><b>{{ ce?.expired?.length || 0 }}</b></div></div>
        <table class="fw-table" *ngIf="ce" style="margin-top:8px"><tr><th>{{ 'Employee' | t }}</th><th>{{ 'Certificate / document' | t }}</th><th>{{ 'Expiry' | t }}</th></tr>
          <tr *ngFor="let c of ce.expired"><td>{{ c.employee }}</td><td>{{ c.title }} <span class="fw-chip">{{ c.kind }}</span></td><td><span class="ai-sev critical">{{ 'expired' | t }}</span> {{ c.expiry_date | date:'dd/MM/yyyy' }}</td></tr>
          <tr *ngFor="let c of ce.expiring"><td>{{ c.employee }}</td><td>{{ c.title }} <span class="fw-chip">{{ c.kind }}</span></td><td><span class="ai-sev" [ngClass]="c.days <= 30 ? 'warning' : 'info'">{{ c.days }} d</span> {{ c.expiry_date | date:'dd/MM/yyyy' }}</td></tr></table>
        <table class="fw-table" *ngIf="tr.rows.length" style="margin-top:8px"><tr><th>{{ 'Employee' | t }}</th><th>{{ 'Course' | t }}</th><th>{{ 'Date' | t }}</th><th>{{ 'Result' | t }}</th></tr>
          <tr *ngFor="let r of tr.rows"><td>{{ r.employee }}</td><td>{{ r.course }}</td><td>{{ r.date | date:'d MMM' }}</td><td><span class="fw-chip" [ngClass]="r.status === 'passed' ? 'ok' : r.status === 'failed' ? 'bad' : ''">{{ r.status }}</span></td></tr></table>
      </div>
    </div>
  </ng-container>

  <!-- ================= workforce ================= -->
  <ng-container *ngIf="tab === 'workforce'">
    <div class="fw-card">
      <h2>{{ 'Ask about the workforce' | t }}</h2>
      <div class="ai-ask"><input [(ngModel)]="q" (keyup.enter)="ask()" placeholder="{{ 'e.g. Salary budget for the next 6 months with 5% growth' | t }}"><button class="fw-btn primary" type="button" (click)="ask()" [disabled]="busy || !q.trim()">{{ 'Ask' | t }}</button></div>
      <div class="ai-chips"><button type="button" *ngFor="let e of examples" (click)="q = e; ask()">{{ e }}</button></div>
      <div class="ai-md" *ngIf="ans" [innerHTML]="ans"></div>
      <p class="ai-note">{{ 'The same questions work in Ask ZEO (bottom-right) from any page.' | t }}</p>
    </div>
    <div class="ai-form">
      <label>{{ 'Branch' | t }}<select [(ngModel)]="wf.branch" (change)="loadWf()"><option value="">{{ 'All' | t }}</option><option *ngFor="let b of lk.branches" [value]="b.id">{{ b.name }}</option></select></label>
      <label>{{ 'Department' | t }}<select [(ngModel)]="wf.department" (change)="loadWf()"><option value="">{{ 'All' | t }}</option><option *ngFor="let d of lk.departments" [value]="d.id">{{ d.name }}</option></select></label>
      <label>{{ 'Months ahead' | t }}<input type="number" [(ngModel)]="wf.months" (change)="loadWf()" min="1" max="24"></label>
      <label>{{ 'Planned growth % / year' | t }}<input type="number" [(ngModel)]="wf.growth" (change)="loadWf()" step="0.5"></label>
      <label>{{ 'Increment %' | t }}<input type="number" [(ngModel)]="wf.increment" (change)="loadWf()" step="0.5"></label>
      <label>{{ 'Increment from' | t }}<input type="month" [(ngModel)]="wf.increment_month" (change)="loadWf()"></label>
    </div>
    <div class="ai-two">
      <div class="fw-card" *ngIf="hc">
        <h2>{{ 'Headcount – history and forecast' | t }}</h2>
        <div class="ai-bar" *ngFor="let r of hc.history.slice(-6)"><span>{{ r.month }}</span><i [style.width.%]="r.headcount / hcMax() * 100"></i><b>{{ r.headcount }}</b><small class="fw-muted">+{{ r.joiners }} / −{{ r.leavers }}</small></div>
        <div class="ai-bar" *ngFor="let r of hc.forecast"><span>{{ r.month }}</span><i class="fc" [style.width.%]="r.headcount / hcMax() * 100"></i><b>{{ r.headcount }}</b><small class="fw-muted">{{ 'forecast' | t }}</small></div>
        <p class="ai-note" *ngFor="let n of hc.notes">{{ n }}</p>
      </div>
      <div class="fw-card" *ngIf="bg">
        <h2>{{ 'Salary budget forecast' | t }}</h2>
        <div class="fw-kpis"><div class="fw-kpi"><span>{{ 'Monthly gross now' | t }}</span><b>{{ bg.current_monthly_gross | number:'1.0-0' }}</b></div><div class="fw-kpi"><span>{{ 'Average per employee' | t }}</span><b>{{ bg.average_gross | number:'1.0-0' }}</b></div><div class="fw-kpi"><span>{{ 'Annualised forecast' | t }}</span><b>{{ bg.annual_forecast | number:'1.0-0' }}</b></div></div>
        <table class="fw-table" style="margin-top:8px"><tr><th>{{ 'Month' | t }}</th><th class="ai-num">{{ 'Headcount' | t }}</th><th class="ai-num">{{ 'Salary' | t }}</th><th class="ai-num">{{ 'Overtime' | t }}</th><th class="ai-num">{{ 'Total' | t }}</th></tr>
          <tr *ngFor="let r of bg.forecast"><td>{{ r.month }}</td><td class="ai-num">{{ r.headcount }}</td><td class="ai-num">{{ r.salary | number:'1.0-0' }}</td><td class="ai-num">{{ r.overtime | number:'1.0-0' }}</td><td class="ai-num"><b>{{ r.total | number:'1.0-0' }}</b></td></tr></table>
        <p class="ai-note" *ngFor="let n of bg.assumptions">{{ n }}</p>
      </div>
      <div class="fw-card" *ngIf="hs">
        <h2>{{ 'Turnover and absence by department' | t }}</h2>
        <table class="fw-table"><tr><th>{{ 'Department' | t }}</th><th class="ai-num">{{ 'Headcount' | t }}</th><th class="ai-num">{{ 'Leavers 12 m' | t }}</th><th class="ai-num">{{ 'Turnover' | t }}</th><th class="ai-num">{{ 'Absence' | t }}</th><th></th></tr>
          <tr *ngFor="let r of hs.departments" [style.background]="r.flags.length ? '#fff5f5' : ''"><td>{{ r.department }}</td><td class="ai-num">{{ r.headcount }}</td><td class="ai-num">{{ r.leavers }}</td><td class="ai-num">{{ r.turnover_pct }}%</td><td class="ai-num">{{ r.absence_pct ?? '–' }}%</td><td style="font-size:12px;color:#b42318">{{ r.flags.join('; ') }}</td></tr></table>
        <p class="ai-note">{{ 'Turnover = leavers over the last 12 months ÷ average headcount, annualised. Absence = absent and unmarked days ÷ working days in the last 90 days. Alert levels in Settings.' | t }}</p>
      </div>
      <div class="fw-card" *ngIf="rn">
        <h2>{{ 'Recruitment needs' | t }}</h2>
        <p class="ai-text">{{ rn.text }}</p>
        <div class="fw-kpis" style="margin-top:8px"><div class="fw-kpi"><span>{{ 'Hires needed' | t }}</span><b>{{ rn.total_hires }}</b></div><div class="fw-kpi"><span>{{ 'Openings published' | t }}</span><b>{{ rn.open_job_openings }}</b></div><div class="fw-kpi" [class.warn]="rn.still_to_open"><span>{{ 'Still to open' | t }}</span><b>{{ rn.still_to_open }}</b></div></div>
        <table class="fw-table" style="margin-top:8px"><tr><th>{{ 'Department' | t }}</th><th class="ai-num">{{ 'Headcount' | t }}</th><th class="ai-num">{{ 'Leaving' | t }}</th><th class="ai-num">{{ 'Growth' | t }}</th><th class="ai-num">{{ 'Replacement' | t }}</th><th class="ai-num">{{ 'Hires' | t }}</th></tr>
          <tr *ngFor="let r of rn.by_department"><td>{{ r.department }}</td><td class="ai-num">{{ r.headcount }}</td><td class="ai-num">{{ r.leaving }}</td><td class="ai-num">{{ r.growth }}</td><td class="ai-num">{{ r.replacement }}</td><td class="ai-num"><b>{{ r.hires }}</b></td></tr></table>
      </div>
      <div class="fw-card">
        <h2>{{ 'Workforce cost comparison' | t }}
          <span class="ai-chips" style="display:inline-flex;margin:0 0 0 8px"><button type="button" *ngFor="let b of ['branch','department','company']" [style.background]="cmpBy === b ? '#f3f1ff' : ''" (click)="cmpBy = b; loadCmp()">{{ b | t }}</button></span></h2>
        <div class="fw-msg err" *ngIf="cmp?.error">{{ cmp.error }}</div>
        <table class="fw-table" *ngIf="cmp?.rows?.length"><tr><th>{{ cmpBy | t }}</th><th class="ai-num">{{ 'Headcount' | t }}</th><th class="ai-num">{{ 'Monthly gross' | t }}</th><th class="ai-num">{{ 'Average' | t }}</th><th class="ai-num">{{ 'Overtime last month' | t }}</th><th class="ai-num">{{ 'Share' | t }}</th></tr>
          <tr *ngFor="let r of cmp.rows"><td>{{ r.name }}<span class="fw-chip" *ngIf="r.error" style="margin-left:6px">{{ r.error }}</span></td><td class="ai-num">{{ r.headcount }}</td><td class="ai-num">{{ r.monthly_gross | number:'1.0-0' }}</td><td class="ai-num">{{ r.average | number:'1.0-0' }}</td><td class="ai-num">{{ r.overtime_last_month | number:'1.0-0' }}</td><td class="ai-num">{{ r.share_pct }}%</td></tr>
          <tr><td><b>{{ 'Total' | t }}</b></td><td class="ai-num"><b>{{ cmp.total_headcount }}</b></td><td class="ai-num"><b>{{ cmp.total_monthly | number:'1.0-0' }}</b></td><td colspan="3"></td></tr></table>
        <p class="ai-note" *ngIf="cmp?.group">{{ 'Group' | t }}: {{ cmp.group }} – {{ 'figures read company by company with your group rights.' | t }}</p>
      </div>
    </div>
  </ng-container>

  <!-- ================= settings ================= -->
  <ng-container *ngIf="tab === 'settings'">
    <div class="fw-card" *ngIf="st">
      <h2>{{ 'Thresholds' | t }}</h2>
      <h3 style="font-size:13px;margin:6px 0">{{ 'Payroll auditor' | t }}</h3>
      <div class="ai-form">
        <label>{{ 'Flag a gross change above (%)' | t }}<input type="number" [(ngModel)]="st.gross_change_pct" step="0.5"></label>
        <label>{{ 'Critical above (%)' | t }}<input type="number" [(ngModel)]="st.gross_critical_pct" step="0.5"></label>
        <label>{{ 'Net change with steady gross (%)' | t }}<input type="number" [(ngModel)]="st.net_change_pct" step="0.5"></label>
        <label>{{ 'Payroll total change (%)' | t }}<input type="number" [(ngModel)]="st.totals_change_pct" step="0.5"></label>
        <label class="chk"><input type="checkbox" [(ngModel)]="st.require_audit">{{ 'A run must be audited before approval' | t }}</label>
        <label class="chk"><input type="checkbox" [(ngModel)]="st.block_on_critical">{{ 'Approval is refused while critical findings are open' | t }}</label>
      </div>
      <h3 style="font-size:13px;margin:6px 0">{{ 'Attendance & shifts' | t }}</h3>
      <div class="ai-form">
        <label>{{ 'Repeated lates – flag from (times / 30 d)' | t }}<input type="number" [(ngModel)]="st.late_repeat"></label>
        <label>{{ 'Repeated missed punches – flag from' | t }}<input type="number" [(ngModel)]="st.missed_repeat"></label>
        <label>{{ 'Coverage gap below (% of usual)' | t }}<input type="number" [(ngModel)]="st.min_staff_pct"></label>
        <label>{{ 'Standard hours / month (overtime rate)' | t }}<input type="number" [(ngModel)]="st.ot_cost_hours_per_month"></label>
      </div>
      <h3 style="font-size:13px;margin:6px 0">{{ 'Workforce analytics' | t }}</h3>
      <div class="ai-form">
        <label>{{ 'Forecast horizon (months)' | t }}<input type="number" [(ngModel)]="st.forecast_months"></label>
        <label>{{ 'Turnover alert above (% / 12 m)' | t }}<input type="number" [(ngModel)]="st.turnover_alert_pct" step="0.5"></label>
        <label>{{ 'Absenteeism alert above (% of days)' | t }}<input type="number" [(ngModel)]="st.absence_alert_pct" step="0.5"></label>
      </div>
      <button class="fw-btn primary" type="button" (click)="saveSt()" [disabled]="busy || !lk.rights?.admin">{{ 'Save' | t }}</button>
      <p class="ai-note">{{ 'External AI (optional) is configured under Settings › AI settings; when switched on it only rephrases summaries and job descriptions – all figures and flags come from ZEO\\'s own rules.' | t }}</p>
    </div>
    <div class="fw-card" *ngIf="log">
      <h2>{{ 'What the assistants did' | t }}</h2>
      <table class="fw-table"><tr><th>{{ 'When' | t }}</th><th>{{ 'Kind' | t }}</th><th>{{ 'By' | t }}</th><th>{{ 'Summary' | t }}</th></tr>
        <tr *ngFor="let l of log"><td style="white-space:nowrap">{{ l.at | date:'d MMM HH:mm' }}</td><td><span class="fw-chip">{{ l.kind }}</span></td><td>{{ l.by }}</td><td style="font-size:12.5px">{{ l.summary }}</td></tr>
        <tr *ngIf="!log.length"><td colspan="4" class="fw-empty">{{ 'Nothing yet.' | t }}</td></tr></table>
    </div>
  </ng-container>
</div>`,
})
export class ZeoAiComponent implements OnInit, OnDestroy {
  tabs = TABS; tab = 'payroll'; msg = ''; bad = false; busy = false;
  examples = EXAMPLES;
  lk: any = { employees: [], branches: [], departments: [], designations: [], jobs: [], shifts: [], rights: {} };
  // payroll
  runs: any[] = []; run: any = null; a: any = null; gate: [string, string] = ['ok', '']; showDone = false;
  // attendance
  af = { branch: '', department: '', days: 30 }; pat: any = null; cov: any = null;
  rf = { employee: '', date: new Date().toISOString().slice(0, 10), shift: '' }; repl: any[] | null = null;
  ro = { branch: '', department: '', date_from: '', date_to: '', shift: '' }; ros: any = null;
  // recruitment
  rm: any = null; rc = { job: '' }; short: any = null; cand: any = null; jd: any = null; qs: any = null; slots: any = null; dr: any = null; drKind = 'invite'; drApp = 0;
  // performance
  pf = { employee: '' }; ps: any = null; pg: any = null; pc: any = null; po: any = null; pp: any = null; tp: any = null; tr: any = null; ce: any = null;
  // workforce
  q = ''; ans: SafeHtml | null = null; wf = { branch: '', department: '', months: 6, growth: 0, increment: 0, increment_month: '' };
  hc: any = null; bg: any = null; hs: any = null; rn: any = null; cmp: any = null; cmpBy = 'branch';
  // settings
  st: any = null; log: any[] | null = null;
  private sub?: Subscription;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef, private san: DomSanitizer) {}

  ngOnInit(): void {
    this.get('lookups/').then(d => { this.lk = d; this.cd.markForCheck(); }).catch(() => {});
    const t = new Date(); const t2 = new Date(t.getTime() + 13 * 864e5);
    this.ro.date_from = t.toISOString().slice(0, 10); this.ro.date_to = t2.toISOString().slice(0, 10);
    this.sub = this.route.paramMap.subscribe(p => { const t = p.get('tab') || 'payroll'; this.tab = t === 'payroll-auditor' ? 'payroll' : t; this.load(); });   // payroll-auditor = the Payroll menu's entry (keeps the Payroll sidebar)
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  go(t: string): void { this.router.navigate(['..', t], { relativeTo: this.route }); }

  private get(path: string, params: any = {}): Promise<any> {
    return firstValueFrom(this.http.get(API + path, { params: { ...params, schema: schema() } }));
  }
  private post(path: string, body: any): Promise<any> { return firstValueFrom(this.http.post(API + path, body, { params: { schema: schema() } })); }
  private fail(e: any): void { this.msg = err(e); this.bad = true; this.busy = false; this.cd.markForCheck(); }
  private ok(m: string): void { this.msg = m; this.bad = false; }
  md(s: string): SafeHtml { return this.san.bypassSecurityTrustHtml(renderAnswer(s || '')); }
  copy(s: string): void { navigator.clipboard?.writeText(s).then(() => this.ok('Copied.')); this.cd.markForCheck(); }

  load(): void {
    this.msg = '';
    if (this.tab === 'payroll') { this.loadRuns(); }
    if (this.tab === 'attendance') { this.loadAtt(); }
    if (this.tab === 'recruitment') { this.get('recruitment/metrics/').then(d => { this.rm = d; this.cd.markForCheck(); }).catch(e => this.fail(e)); }
    if (this.tab === 'workforce') { this.loadWf(); this.loadCmp(); }
    if (this.tab === 'settings') {
      this.get('settings/').then(d => { this.st = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
      this.get('log/').then(d => { this.log = d; this.cd.markForCheck(); }).catch(() => { this.log = []; });
    }
  }

  // ---------------- payroll
  loadRuns(): void {
    this.get('payroll/runs/').then(d => { this.runs = d.runs; if (this.run) { this.run = this.runs.find(r => r.id === this.run.id) || null; } this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  openRun(r: any): void {
    this.run = r; this.a = null;
    this.get(`payroll/runs/${r.id}/audit/`).then(d => { this.a = d.audit; this.gate = d.gate; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  audit(r: any): void {
    this.busy = true; this.run = r; this.msg = '';
    this.post(`payroll/runs/${r.id}/audit/`, {}).then(d => { this.a = d.audit; this.gate = d.gate; this.busy = false; this.ok(d.audit.summary); this.loadRuns(); }).catch(e => this.fail(e));
  }
  decide(f: any, status: string): void {
    const note = status === 'open' ? '' : (prompt(status === 'dismissed' ? 'Why is this not an issue? (optional)' : 'Note (optional)') ?? null);
    if (note === null && status !== 'open') { return; }
    this.post(`payroll/findings/${f.id}/`, { status, note: note || '' }).then(d => {
      Object.assign(f, d);
      this.a.counts.open = this.a.findings.filter((x: any) => x.status === 'open').length;
      this.get(`payroll/runs/${this.run.id}/audit/`).then(r => { this.gate = r.gate; this.cd.markForCheck(); });
      this.loadRuns();
    }).catch(e => this.fail(e));
  }
  xlsx(id: number): string { return `${API}payroll/runs/${id}/audit.xlsx?schema=${schema()}`; }

  // ---------------- attendance
  loadAtt(): void {
    const p: any = { days: this.af.days }; if (this.af.branch) { p.branch = this.af.branch; } if (this.af.department) { p.department = this.af.department; }
    this.get('attendance/patterns/', p).then(d => { this.pat = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
    const c: any = { days: 14 }; if (this.af.branch) { c.branch = this.af.branch; } if (this.af.department) { c.department = this.af.department; }
    this.get('attendance/coverage/', c).then(d => { this.cov = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  findRepl(): void {
    const p: any = { employee: this.rf.employee, date: this.rf.date }; if (this.rf.shift) { p.shift = this.rf.shift; }
    this.get('attendance/replacements/', p).then(d => { this.repl = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  roster(): void {
    this.busy = true;
    this.post('attendance/roster/', { branch: this.ro.branch || null, department: this.ro.department || null, date_from: this.ro.date_from, date_to: this.ro.date_to, shift: this.ro.shift || null })
      .then(d => { this.ros = d; this.busy = false; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  rosterDays(): any[] {
    const m = new Map<string, any>();
    for (const r of this.ros?.rows || []) {
      const d = m.get(r.date) || { date: r.date, on: [], off: [] };
      (r.off ? d.off : d.on).push(r.employee); m.set(r.date, d);
    }
    return [...m.values()];
  }

  // ---------------- recruitment
  loadJob(): void {
    this.short = this.cand = this.jd = this.qs = this.slots = this.dr = null;
    if (!this.rc.job) { return; }
    this.get(`recruitment/jobs/${this.rc.job}/shortlist/`).then(d => { this.short = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  openCand(id: number): void {
    this.get(`recruitment/candidates/${id}/`, { job: this.rc.job }).then(d => { this.cand = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  jobWhat(w: string): void {
    const p: any = {}; if (w === 'questions' && this.cand) { p.candidate = this.cand.candidate.id; }
    this.get(`recruitment/jobs/${this.rc.job}/${w}/`, p).then(d => { (this as any)[w === 'description' ? 'jd' : w === 'questions' ? 'qs' : 'slots'] = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  draft(appId: number, kind: string): void {
    this.drApp = appId; this.drKind = kind;
    this.get(`recruitment/applications/${appId}/draft/`, { kind }).then(d => { this.dr = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  copyQs(): void { this.copy((this.qs?.questions || []).map((q: any, i: number) => `${i + 1}. [${q.area}] ${q.question}`).join('\n')); }

  // ---------------- performance
  loadEmp(): void {
    this.ps = this.pg = this.pc = this.po = this.pp = null;
    const id = this.pf.employee; if (!id) { return; }
    for (const [w, k] of [['summary', 'ps'], ['gaps', 'pg'], ['courses', 'pc'], ['objectives', 'po'], ['plan', 'pp']]) {
      this.get(`performance/employees/${id}/${w}/`).then(d => { (this as any)[k] = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
    }
  }
  tmpl(): void {
    const e = this.lk.employees.find((x: any) => String(x.id) === String(this.pf.employee));
    const p: any = {}; if (e?.department_id) { p.department = e.department_id; }
    this.get('performance/template/', p).then(d => { this.tp = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  loadTraining(): void {
    this.get('performance/training/').then(d => { this.tr = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
    this.get('performance/certificates/', { within: 90 }).then(d => { this.ce = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  copyObj(): void { this.copy((this.po?.objectives || []).map((o: any) => `${o.title} – ${o.weight}% – ${o.measure}`).join('\n')); }
  savePlan(): void {
    this.busy = true;
    this.post(`performance/employees/${this.pf.employee}/plan/save/`, { title: this.pp.title, steps: this.pp.steps }).then(d => { this.busy = false; this.ok(`Development plan ${d.number} saved as a draft in People.`); this.cd.markForCheck(); }).catch(e => this.fail(e));
  }

  // ---------------- workforce
  ask(): void {
    if (!this.q.trim()) { return; }
    this.busy = true;
    this.post('workforce/ask/', { question: this.q }).then(d => { this.ans = this.md(d.answer); this.busy = false; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  loadWf(): void {
    const p: any = { months: this.wf.months }; if (this.wf.branch) { p.branch = this.wf.branch; } if (this.wf.department) { p.department = this.wf.department; }
    this.get('workforce/headcount/', p).then(d => { this.hc = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
    const b: any = { ...p, growth: this.wf.growth || 0, increment: this.wf.increment || 0 }; if (this.wf.increment_month) { b.increment_month = this.wf.increment_month; }
    this.get('workforce/budget/', b).then(d => { this.bg = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
    this.get('workforce/hotspots/').then(d => { this.hs = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
    this.get('workforce/recruitment/', { growth: this.wf.growth || 0, months: this.wf.months }).then(d => { this.rn = d; this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
  loadCmp(): void { this.get('workforce/compare/', { by: this.cmpBy }).then(d => { this.cmp = d; this.cd.markForCheck(); }).catch(e => this.fail(e)); }
  hcMax(): number { return Math.max(1, ...(this.hc?.history || []).map((r: any) => r.headcount), ...(this.hc?.forecast || []).map((r: any) => r.headcount)); }

  // ---------------- settings
  saveSt(): void {
    this.busy = true;
    firstValueFrom(this.http.put(API + 'settings/', this.st, { params: { schema: schema() } })).then(d => { this.st = d; this.busy = false; this.ok('Settings saved.'); this.cd.markForCheck(); }).catch(e => this.fail(e));
  }
}
