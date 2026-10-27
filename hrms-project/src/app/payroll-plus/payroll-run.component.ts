/**
 * v1.62.0 payroll – one payroll run: stage indicator, summary tiles (vs last month with the main reasons), exceptions
 * (computed read-only), the payslips table with a drill to each payslip, the actions of the current stage for this user and
 * the history. Every action uses the existing API and its rules (rights, segregation of duties, AI audit gate):
 *   recalculate          DELETE payroll/api/PayrollRun/<id>/ + POST payroll/api/PayrollRun/ (same month, branches and filters)
 *   AI auditor           POST zeo-ai/api/payroll/runs/<id>/audit/
 *   send for approval    POST payroll/api/payslip/confirm-bulk/ {ids}
 *   approve my payslips  POST payroll/api/approval-payroll/bulk_approve/ {approval_ids}
 *   approve / undo       PATCH payroll/api/PayrollRun/<id>/ {status: approved | processed}
 *   WPS file             the WPS file screen (?run=<id>) – file generation unchanged
 *   paid                 PATCH payroll/api/PayrollRun/<id>/ {status: paid, payment_ref}
 *   journal              POST accounting/api/journals/build/ {source: payroll, id}
 * API (read): payroll-plus/api/workspace/runs/<id>/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PayStepsComponent, apiUrl, errText, wsUrl } from './pay162';

@Component({
  selector: 'app-payroll-run',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PayStepsComponent],
  styleUrls: ['../leave-policy/leave-policy.css', './pay162.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section" *ngIf="r">
      <div class="py-wrap py-head">
        <div>
          <a class="py-link py-muted" routerLink="/main-sidebar/salary-options/pay-roll">← Payroll runs</a>
          <h1 class="page-title" style="margin-top:4px" data-py-title>{{ r.name || r.period }}</h1>
          <p class="lp-desc">{{ r.period }} · {{ r.branches.join(' · ') }} · {{ r.kind_label }}
            <span *ngIf="r.payment_date"> · <span>Pay date</span> {{ r.payment_date | date:'dd/MM/yyyy' }}</span>
            <span *ngIf="r.attendance_start"> · <span>Attendance</span> {{ r.attendance_start | date:'dd/MM/yyyy' }} – {{ r.attendance_end | date:'dd/MM/yyyy' }}</span>
            <span *ngIf="r.prepared_by"> · <span>Prepared by</span> {{ short(r.prepared_by) }}</span></p>
        </div>
        <div class="py-tools"><span class="py-pill" [ngClass]="pillClass()" data-py-status>{{ r.stage_text }}</span></div>
      </div>
      <div class="py-wrap" style="margin-top:16px" data-py-stepper><py-steps [steps]="r.steps"></py-steps></div>
    </div>

    <div class="com_list mt-4" *ngIf="r">
      <p class="py-msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}</p>
      <p class="py-msg err" *ngFor="let w of warnings()">{{ w.text }}</p>

      <div class="py-tiles" data-py-tiles>
        <div class="py-tile"><span>Employees</span><b>{{ r.tiles.employees }}</b><small *ngIf="r.previous">{{ r.previous.headcount }} in {{ r.previous.period }}</small></div>
        <div class="py-tile"><span>Gross pay</span><b><i class="py-cur">AED</i>{{ r.tiles.gross | number:'1.2-2' }}</b><small><span>Basic</span> {{ r.tiles.basic | number:'1.0-0' }} · <span>Allowances</span> {{ r.tiles.allowances | number:'1.0-0' }}</small></div>
        <div class="py-tile"><span>Additions</span><b><i class="py-cur">AED</i>{{ r.tiles.additions | number:'1.2-2' }}</b><small>Overtime, arrears, accruals …</small></div>
        <div class="py-tile"><span>Deductions</span><b><i class="py-cur">AED</i>{{ r.tiles.deductions | number:'1.2-2' }}</b><small>Pension, loans, unpaid leave …</small></div>
        <div class="py-tile hi"><span>Net pay</span><b><i class="py-cur">AED</i>{{ r.tiles.net | number:'1.2-2' }}</b>
          <small *ngIf="r.change_pct !== null && r.change_pct !== undefined"><span class="py-chg" [class.up]="r.change_pct > 0" [class.down]="r.change_pct < 0">{{ r.change_pct > 0 ? '▲' : r.change_pct < 0 ? '▼' : '' }} {{ r.change_pct | number:'1.1-1' }} %</span> vs {{ r.previous?.period }}</small></div>
        <div class="py-tile"><span>Employer cost</span><b><i class="py-cur">AED</i>{{ r.tiles.employer_cost | number:'1.2-2' }}</b><small><span>Gross + employer contributions</span> {{ r.tiles.employer | number:'1.0-0' }}</small></div>
      </div>
      <div *ngIf="r.reasons?.length" class="py-muted" data-py-reasons><span>Main changes vs</span> {{ r.previous?.period }}:
        <ul class="py-reasons"><li *ngFor="let x of r.reasons">{{ x.text }}<b *ngIf="x.amount !== null"> {{ +x.amount > 0 ? '+' : '' }}{{ x.amount | number:'1.2-2' }}</b></li></ul></div>

      <div class="py-grid" style="margin-top:16px">
        <div style="min-width:0">
          <div class="py-panel" data-py-exceptions>
            <h3><span>Exceptions to check</span> <small>{{ exCount() }} · <span>computed from the payslips, nothing is changed</span></small></h3>
            <div class="py-ex" *ngFor="let e of r.exceptions" [attr.data-py-ex]="e.key">
              <button type="button" (click)="toggle(e.key)" [disabled]="!e.count" [attr.aria-expanded]="openEx === e.key">
                <span>{{ e.title }}</span><span class="cnt" [ngClass]="e.count ? e.severity : ''">{{ e.count }}</span></button>
              <ul *ngIf="openEx === e.key">
                <li *ngFor="let it of e.items"><span><button type="button" class="py-link" (click)="drill(it.payslip_id)">{{ it.name }}</button><span class="py-muted" style="margin-inline-start:6px">{{ it.code }}</span></span><span>{{ it.detail }}</span></li>
              </ul>
            </div>
            <div class="py-ex" *ngIf="r.audit" data-py-ex="audit">
              <button type="button" (click)="toggle('audit')"><span>AI payroll audit – {{ r.audit.at | date:'dd/MM/yyyy HH:mm' }}</span>
                <span class="cnt" [ngClass]="r.audit.open_critical ? 'error' : r.audit.open ? 'warning' : ''">{{ r.audit.open }}</span></button>
              <ul *ngIf="openEx === 'audit'"><li><span>{{ r.audit.summary }}</span></li>
                <li><a class="py-link" routerLink="/main-sidebar/zeo-ai/payroll-auditor">Open the findings in the AI payroll auditor</a></li></ul>
            </div>
          </div>

          <div class="py-panel">
            <h3><span>Payslips</span> <small>{{ filtered().length }} / {{ r.payslips.length }}</small></h3>
            <div class="py-tools" style="margin-bottom:10px">
              <input type="search" class="py-in" placeholder="Search employee, code, department…" [(ngModel)]="q" aria-label="Search payslips">
              <select class="py-sel" [(ngModel)]="fs" aria-label="Status">
                <option value="">All statuses</option><option value="draft">Draft</option><option value="waiting">Waiting for approval</option>
                <option value="approved">Approved</option><option value="rejected">Rejected</option><option value="flag">With an exception</option></select>
            </div>
            <div class="py-scroll" style="max-height:620px">
              <table class="py-t" zPlain data-py-payslips>
                <thead><tr><th>Employee</th><th class="num">Basic</th><th class="num">Allowances</th><th class="num">Additions</th>
                  <th class="num">Deductions</th><th class="num">Net (AED)</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let p of filtered()" class="click" (click)="drill(p.id)" [attr.data-py-payslip]="p.id">
                    <td><span class="nm">{{ p.name }}</span><span class="sub">{{ p.code }} · {{ p.designation || p.department }}
                      <span *ngIf="p.days < p.of_days"> · {{ p.days }}/{{ p.of_days }} days</span></span></td>
                    <td class="num">{{ p.basic | number:'1.2-2' }}</td><td class="num">{{ p.allowances | number:'1.2-2' }}</td>
                    <td class="num">{{ +p.additions ? (p.additions | number:'1.2-2') : '–' }}</td>
                    <td class="num">{{ +p.deductions ? (p.deductions | number:'1.2-2') : '–' }}</td>
                    <td class="num"><b>{{ p.net | number:'1.2-2' }}</b></td>
                    <td><span class="py-pill" [ngClass]="{ok: p.status === 'approved', wait: p.status === 'waiting', bad: p.status === 'rejected'}">{{ p.status_label }}</span>
                      <span *ngIf="p.flags.length" class="py-pill info" style="margin-inline-start:4px" [title]="flagText(p)">!</span></td>
                  </tr>
                  <tr *ngIf="!filtered().length"><td colspan="7" class="py-muted" style="text-align:center;padding:18px">No payslip matches.</td></tr>
                </tbody>
                <tfoot *ngIf="filtered().length"><tr><td>Total – {{ filtered().length }} employee(s)</td>
                  <td class="num">{{ sum('basic') | number:'1.2-2' }}</td><td class="num">{{ sum('allowances') | number:'1.2-2' }}</td>
                  <td class="num">{{ sum('additions') | number:'1.2-2' }}</td><td class="num">{{ sum('deductions') | number:'1.2-2' }}</td>
                  <td class="num">{{ sum('net') | number:'1.2-2' }}</td><td></td></tr></tfoot>
              </table>
            </div>
          </div>
        </div>

        <div style="min-width:0">
          <div class="py-panel" data-py-actions>
            <h3>Next steps</h3>
            <div class="py-acts">
              <ng-container *ngFor="let a of mainActions()">
                <button type="button" class="py-btn" [class.primary]="a.primary" [disabled]="busy" (click)="act(a)" [attr.data-py-act]="a.key">{{ a.label }}</button>
                <div class="py-act-why" *ngIf="a.warn">{{ a.reason }}</div>
              </ng-container>
              <div class="py-next" *ngIf="nextBlocked() as n" data-py-next><b><span>Next:</span> {{ n.label }}</b><span>{{ n.reason }}</span></div>
              <p class="py-muted" *ngIf="!mainActions().length && !nextBlocked()">Nothing for you to do on this run.</p>
              <div class="py-minor" *ngIf="minorActions().length">
                <button type="button" class="py-link" *ngFor="let a of minorActions()" [class.py-neg]="a.key === 'delete'" [disabled]="busy" (click)="act(a)" [attr.data-py-act]="a.key">{{ a.label }}</button>
              </div>
            </div>
          </div>

          <div class="py-panel" *ngIf="r.approvals?.length" data-py-progress>
            <h3>Approval progress</h3>
            <div class="py-prog" *ngFor="let g of r.approvals">
              <div class="who"><b>{{ short(g.approver) }}</b><span class="py-muted" style="display:block">Level {{ g.level }} · {{ g.role }}</span></div>
              <div class="py-bar" [title]="g.approved + ' approved, ' + g.pending + ' waiting, ' + g.rejected + ' rejected'">
                <i [style.width.%]="pct(g, 'approved')"></i><i class="r" [style.width.%]="pct(g, 'rejected')"></i></div>
              <span class="py-muted" style="white-space:nowrap">{{ g.approved }}/{{ g.approved + g.pending + g.rejected }}</span>
            </div>
          </div>

          <div class="py-panel">
            <h3>WPS and accounting</h3>
            <div class="py-prog"><div class="who">WPS file</div><span class="py-pill" [ngClass]="r.wps.done ? 'ok' : ''" data-py-wps>{{ r.wps.label }}</span></div>
            <div class="py-prog" *ngIf="r.wps.at"><div class="who py-muted">{{ r.wps.at | date:'dd/MM/yyyy HH:mm' }} · {{ short(r.wps.by) }}</div></div>
            <div class="py-prog"><div class="who">Journal</div><span class="py-pill" [ngClass]="r.journal?.done ? 'ok' : r.journal ? 'wait' : ''">{{ r.journal ? (r.journal.number || '#' + r.journal.id) + ' · ' + r.journal.status_label : 'Not made' }}</span></div>
            <div class="py-prog" *ngIf="r.control?.payment_ref"><div class="who">Payment reference</div><b>{{ r.control.payment_ref }}</b></div>
          </div>

          <div class="py-panel" data-py-history>
            <h3>History</h3>
            <ul class="py-hist">
              <li *ngFor="let h of r.history"><b>{{ h.text }}</b><span>{{ h.at | date:'dd/MM/yyyy HH:mm' }} · {{ short(h.by) || '–' }}</span></li>
              <li *ngIf="!r.history?.length"><b>No history yet</b></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="com_list mt-4" *ngIf="!r && !loading"><p class="py-msg err">{{ msg || 'This payroll run was not found.' }}</p></div>
  </div>
</div>

<div class="py-dlg-back" *ngIf="payDlg" (click)="payDlg = false">
  <div class="py-dlg" style="width:min(520px,100%)" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
    <header><div><h2>Mark as paid and release the payslips</h2><p>Do this after the salaries were transferred through WPS. The run is then closed – it cannot be changed or deleted, and employees see their payslips.</p></div>
      <button type="button" class="py-x" (click)="payDlg = false" aria-label="Close">×</button></header>
    <div class="body"><div class="py-form"><label class="wide">Payment reference (bank transfer / WPS)
      <input type="text" [(ngModel)]="payRef" maxlength="60" placeholder="e.g. WPS-ENBD-20261028" data-py-payref></label></div></div>
    <footer><button type="button" class="py-btn" (click)="payDlg = false">Cancel</button>
      <button type="button" class="py-btn primary" [disabled]="busy" (click)="setStatus('paid', payRef)" data-py-payok>Mark as paid</button></footer>
  </div>
</div>`,
})
export class PayrollRunComponent implements OnInit {
  r: any = null;
  loading = true; busy = false;
  msg = ''; msgErr = false;
  openEx = '';
  q = ''; fs = '';
  payDlg = false; payRef = '';
  private id = 0;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => { this.id = Number(p.get('id')); this.load(); });
  }

  async load(): Promise<void> {
    this.loading = true;
    try { this.r = await firstValueFrom(this.http.get(wsUrl(`runs/${this.id}/`))); }
    catch (e) { this.r = null; this.msg = errText(e, 'The payroll run could not be loaded.'); this.msgErr = true; }
    this.loading = false; this.cd.markForCheck();
  }

  short(n: string): string { return (n || '').split(' (')[0]; }
  pillClass(): string { const s = this.r?.stage; return s === 'done' ? 'ok' : s === 'approved' && this.r?.pending_approvals ? 'wait' : 'cur'; }
  warnings(): any[] { return (this.r?.control?.warnings || []).filter((w: any) => w.level === 'error'); }
  exCount(): number { return (this.r?.exceptions || []).reduce((a: number, e: any) => a + e.count, 0); }
  toggle(k: string): void { this.openEx = this.openEx === k ? '' : k; }
  pct(g: any, k: string): number { const t = g.approved + g.pending + g.rejected; return t ? (g[k] * 100) / t : 0; }
  flagText(p: any): string {
    const t: any = { joiner: 'New joiner', leaver: 'Leaver', unpaid: 'Unpaid days', zero_net: 'Zero net pay', bank: 'Bank details missing', salary_change: 'Salary changed', held: 'Rejected' };
    return p.flags.map((f: string) => t[f] || f).join(', ');
  }
  filtered(): any[] {
    const q = this.q.trim().toLowerCase();
    return (this.r?.payslips || []).filter((p: any) =>
      (!q || [p.name, p.code, p.department, p.designation, p.branch].join(' ').toLowerCase().includes(q))
      && (!this.fs || (this.fs === 'flag' ? p.flags.length > 0 : p.status === this.fs)));
  }
  sum(k: string): number { return this.filtered().reduce((a: number, p: any) => a + (Number(p[k]) || 0), 0); }
  drill(id: number): void { if (id) { this.router.navigate(['/main-sidebar/salary-options/payroll-details', id]); } }

  /** v1.62.0 payroll: the actions of the current stage the user may do now (Recalculate / Undo / Delete as small links) and the
   *  next step that is still blocked, with its reason */
  private static MINOR = ['recalculate', 'undo_approval', 'delete'];
  private allowed(): any[] { return (this.r?.actions || []).filter((x: any) => x.allowed); }
  mainActions(): any[] {
    return this.allowed().filter((x: any) => x.ready && !PayrollRunComponent.MINOR.includes(x.key))
      .sort((x: any, y: any) => Number(!!y.primary) - Number(!!x.primary));
  }
  minorActions(): any[] { return this.allowed().filter((x: any) => x.ready && PayrollRunComponent.MINOR.includes(x.key)); }
  nextBlocked(): any {
    const order = ['send', 'approve_payslips', 'approve_run', 'wps', 'pay', 'journal'];
    const st = String(this.r?.status || '').toLowerCase();
    if (st === 'paid' && this.r?.journal?.done) { return null; }
    return (this.r?.actions || []).filter((x: any) => !x.ready && x.reason && order.includes(x.key)
      && !(x.key === 'send' && (st !== 'processed' || !(x.ids || []).length)) && !(x.key === 'approve_run' && st !== 'processed'))
      .sort((a: any, b: any) => order.indexOf(a.key) - order.indexOf(b.key))[0] || null;
  }

  private say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.markForCheck(); }

  async act(a: any): Promise<void> {
    switch (a.key) {
      case 'recalculate': return this.recalc();
      case 'audit': return this.run(async () => {
        await firstValueFrom(this.http.post(apiUrl(`zeo-ai/api/payroll/runs/${this.id}/audit/`), {}));
        return 'The AI payroll audit is done – see the exceptions.';
      });
      case 'send': return this.run(async () => {
        if (a.warn && a.ready && !confirm(a.warn + '\n\nSend the payslips for approval anyway?')) { return ''; }
        const res: any = await firstValueFrom(this.http.post(apiUrl('payroll/api/payslip/confirm-bulk/'), { ids: a.ids }));
        if (!res?.confirmed) { throw { error: { detail: 'No payslip was sent – you may not have the right to see these payslips.' } }; }
        return res?.message || 'The payslips were sent for approval.';
      });
      case 'approve_payslips': return this.run(async () => {
        const res: any = await firstValueFrom(this.http.post(apiUrl('payroll/api/approval-payroll/bulk_approve/'), { approval_ids: a.ids, note: '' }));
        return res?.status || 'Approved.';
      });
      case 'approve_run':
        if (!confirm('Approve this payroll run? The WPS file can then be made.')) { return; }
        return this.setStatus('approved');
      case 'undo_approval':
        if (!confirm('Take back the approval? The run goes back to processed so payslips can be corrected.')) { return; }
        return this.setStatus('processed');
      case 'wps': this.router.navigate(['/main-sidebar/salary-options/wps'], { queryParams: { run: this.id } }); return;
      case 'pay': this.payRef = ''; this.payDlg = true; return;
      case 'journal':
        if (a.journal) { this.router.navigate(['/main-sidebar/salary-options/accounting']); return; }
        return this.run(async () => {
          await firstValueFrom(this.http.post(apiUrl('accounting/api/journals/build/'), { source: 'payroll', id: this.id }));
          return 'The accounting journal is made – post it from Payroll › Accounting journals.';
        });
      case 'delete':
        if (!confirm('Delete this payroll run and its payslips?')) { return; }
        this.busy = true;
        try {
          await firstValueFrom(this.http.delete(apiUrl(`payroll/api/PayrollRun/${this.id}/`)));
          this.router.navigate(['/main-sidebar/salary-options/pay-roll']);
        } catch (e) { this.say(errText(e, 'The payroll run could not be deleted.'), true); }
        this.busy = false; return;
    }
  }

  private async run(fn: () => Promise<string>): Promise<void> {
    this.busy = true; this.msg = '';
    try { const m = await fn(); if (m) { this.say(m); } await this.load(); }
    catch (e) { this.say(errText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }

  async setStatus(status: string, ref = ''): Promise<void> {
    this.payDlg = false;
    await this.run(async () => {
      const body: any = { status };
      if (status === 'paid') { body.payment_ref = ref; }
      await firstValueFrom(this.http.patch(apiUrl(`payroll/api/PayrollRun/${this.id}/`), body));
      return status === 'approved' ? 'The payroll run is approved – make the WPS file next.'
        : status === 'paid' ? 'The run is paid and closed – employees can see their payslips.' : 'The approval is taken back.';
    });
  }

  /** recalculate = delete the calculated run and run it again for the same month, branches and filters (before approval only) */
  async recalc(): Promise<void> {
    if (!confirm('Recalculate this payroll? The payslips are calculated again from the current salaries, attendance, leave, loans and overtime.')) { return; }
    const r = this.r; const f = r.filters || {};
    const body = { name: r.name, year: r.year, month: r.month, payment_date: r.payment_date || null, branch_ids: f.branch_ids || [],
      department: f.department || [], category: f.category || [], designation: f.designation || [], employees: [] };
    this.busy = true; this.msg = '';
    try {
      await firstValueFrom(this.http.delete(apiUrl(`payroll/api/PayrollRun/${this.id}/`)));
      const n: any = await firstValueFrom(this.http.post(apiUrl('payroll/api/PayrollRun/'), body));
      this.router.navigate(['/main-sidebar/salary-options/payroll-run', n.id]);
      this.say('The payroll is calculated again.');
    } catch (e) { this.say(errText(e, 'The payroll could not be recalculated.'), true); }
    this.busy = false; this.cd.markForCheck();
  }
}
