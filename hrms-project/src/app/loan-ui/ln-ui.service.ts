// v1.62.0 talent-ops – one look for the loan and advance salary screens: the read-only summaries (/payroll-plus/api/loan-desk/…)
// and the words, amounts and dates they show (names instead of user names, stages instead of raw statuses, AED, dd/mm/yyyy).
// Saving stays in the screens' own forms and the existing /payroll/api/… endpoints (approve / reject included).
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { cpMoney } from '../shared-ui/country-pack.service';
import { i18nT as T } from '../shared-ui/i18n-core';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { ZReviewConfig, ZReviewFact, ZReviewStep } from '../shared-ui/z-review.component';   // v1.62.10 (item 167)
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable({ providedIn: 'root' })
export class LnUiService {
  constructor(private http: HttpClient, private rec: ZRecordService) {}

  private schema(): string { return encodeURIComponent(localStorage.getItem('selectedSchema') || ''); }

  /** GET a summary: requests | approvals | repayments | levels (a path starting with '/' is taken from the API root). */
  get<Tp = any>(path: string, q: Record<string, any> = {}): Promise<Tp> {
    let qs = `schema=${this.schema()}`;
    Object.entries(q).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) { return; }
      qs += `&${k}=${encodeURIComponent(Array.isArray(v) ? `[${v.join(',')}]` : String(v))}`;
    });
    const url = path.startsWith('/') ? `${this.rec.api}${path}?${qs}` : `${this.rec.api}/payroll-plus/api/loan-desk/${path}/?${qs}`;
    return firstValueFrom(this.http.get<Tp>(url));
  }

  /** POST to an existing endpoint of /payroll/api/ (approve / reject a step). */
  post(path: string, body: any): Promise<any> {
    const url = path.startsWith('/') ? `${this.rec.api}${path}/?schema=${this.schema()}` : `${this.rec.api}/payroll/api/${path}/?schema=${this.schema()}`;
    return firstValueFrom(this.http.post(url, body));
  }

  /** Delete one record through its existing endpoint (after the user confirmed). */
  async remove(path: string, id: number, what: string): Promise<boolean> {
    if (!(await zConfirm(T('Delete {0}? This cannot be undone.', [what])))) { return false; }
    try {
      const base = path.startsWith('/') ? `${this.rec.api}${path}` : `${this.rec.api}/payroll/api/${path}`;
      await firstValueFrom(this.http.delete(`${base}/${id}/?schema=${this.schema()}`));
      return true;
    } catch (e) {
      alert(this.err(e, T('It could not be deleted.')));
      return false;
    }
  }

  err(e: any, fallback: string): string { try { return httpErrorText(e) || fallback; } catch { return fallback; } }

  // ---------- words ----------
  money(v: any): string { return v === null || v === undefined || v === '' ? '–' : cpMoney(v, '1.2-2'); }
  dmy(v: any): string {
    if (!v) { return '–'; }
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
  }
  /** "Sep 2026" of 2026-09-01 */
  month(v: any): string {
    const m = /^(\d{4})-(\d{2})/.exec(String(v || ''));
    return m ? `${T(MONTHS[+m[2] - 1])} ${m[1]}` : '–';
  }
  months(n: any): string { const k = +n || 0; return k === 1 ? T('1 month') : T('{0} months', [k]); }
  /** "AED 1,000.00 × 8 months" */
  plan(r: any): string { return r.kind === 'advance' && !(+r.months > 1) ? T('One deduction') : `${this.money(r.instalment)} × ${this.months(r.months)}`; }   // v1.67.11 (loans): advances in instalments
  pct(r: any): number { const a = +r.amount || 0; return a > 0 ? Math.min(100, Math.round((+r.paid || 0) * 100 / a)) : 0; }

  stage(st: string, kind = 'loan'): string {
    const w: any = {
      in_approval: 'In approval', rejected: 'Rejected',
      approved: kind === 'advance' ? 'Approved – next payroll' : kind === 'asset' ? 'Approved' : 'Approved – not deducted yet',
      repaying: 'Repaying', paused: 'Paused', closed: 'Closed', deducted: 'Deducted in payroll', cancelled: 'Cancelled',
    };
    return T(w[st] || st || '–');
  }
  stageClass(st: string): string {
    return ({ in_approval: 'warn', rejected: 'bad', approved: 'info', repaying: '', paused: 'muted', closed: 'ok', deducted: 'ok', cancelled: 'muted' } as any)[st] ?? '';
  }
  /** Approval line under the stage: "Level 2 of 2 · waiting for Rajesh Menon" / "Rejected by Layla Farouk". */
  progress(r: any): string {
    const p = r.progress || {};
    if (r.stage === 'in_approval') {
      if (!p.total) { return p.waiting_for ? T('waiting for {0}', [p.waiting_for]) : T('No approval workflow for this branch'); }
      const lvl = T('Level {0} of {1}', [p.waiting_level || Math.min((p.done || 0) + 1, p.total), p.total]);
      return p.waiting_for ? `${lvl} · ${T('waiting for {0}', [p.waiting_for])}` : lvl;
    }
    if (r.stage === 'rejected') { return p.rejected_by ? T('by {0}', [p.rejected_by]) : ''; }
    if (p.type === 'no_approval') { return T('No approval needed'); }
    if (p.total > 1) { return T('All {0} levels approved', [p.total]); }
    return '';
  }
  stepClass(s: string): string { return ({ Pending: 'warn', Approved: 'ok', Rejected: 'bad', Escalated: 'info' } as any)[s] || ''; }
  stepWord(s: string): string { return T(({ Pending: 'Waiting', Approved: 'Approved', Rejected: 'Rejected', Escalated: 'Escalated' } as any)[s] || s); }
  workflowType(code: string): string {
    return T(({ no_approval: 'Approved automatically', reporting_manager: 'Reporting manager approves', multi_approval: 'Approval levels' } as any)[code] || code || '–');
  }
  approverOf(l: any, wfType: string): string {
    if (wfType === 'reporting_manager') { return T("The employee's reporting manager"); }
    if (wfType === 'no_approval') { return T('Nobody – approved automatically'); }
    return l.approver || (l.role ? l.role : T('Not set'));
  }
  escalation(l: any): string {
    const d = +l.days || 0, h = +l.hours || 0, m = +l.minutes || 0;
    if (!d && !h && !m) { return T('No escalation'); }
    const parts: string[] = [];
    if (d) { parts.push(d === 1 ? T('1 day') : T('{0} days', [d])); }
    if (h) { parts.push(h === 1 ? T('1 hour') : T('{0} hours', [h])); }
    if (m) { parts.push(m === 1 ? T('1 minute') : T('{0} minutes', [m])); }
    const after = T('After {0}', [parts.join(' ')]);
    return l.escalate_to ? `${after} → ${l.escalate_to}` : after;
  }
  t(s: string, p?: any[]): string { return T(s, p); }

  /** v1.62.10 (item 167): the shared review window (z-review.component.ts) of a desk approval row – loan, advance or asset */
  review(r: any, kind: 'loan' | 'advance' | 'asset', base: string, approvalId?: number): ZReviewConfig {
    const title = T(kind === 'loan' ? 'Loan request {0}' : kind === 'advance' ? 'Advance salary request {0}' : 'Asset request {0}', [r?.number || '']);
    const facts: ZReviewFact[] = r ? [
      { label: 'Employee', value: r.code ? `${r.employee} (${r.code})` : r.employee },
      { label: 'Branch', value: r.branch },
      ...(kind === 'loan' ? [{ label: 'Loan type', value: r.type }, { label: 'Amount', value: this.money(r.amount) },
        { label: 'Instalments', value: `${this.money(r.instalment)} × ${this.months(r.months)}` }] : []),
      ...(kind === 'advance' ? [{ label: 'Amount', value: this.money(r.amount) }, { label: 'Instalments', value: this.plan(r) }, { label: 'Reason', value: r.note || r.reason }] : []),
      ...(r.asked ? [{ label: 'Amount asked', value: this.money(r.asked) }] : []),   // v1.67.11 (loans, item 114)
      ...(kind === 'asset' ? [{ label: 'Asset type', value: r.type }, { label: 'Asset', value: r.asset?.name ? (r.asset.code ? `${r.asset.name} (${r.asset.code})` : r.asset.name) : '' },
        { label: 'Reason', value: r.note }] : []),
      { label: 'Requested on', value: this.dmy(r.applied) },
      { label: 'Stage', value: this.stage(r.stage, kind) }] : [];
    const steps: ZReviewStep[] = (r?.steps || []).map((s: any) => ({ text: `${T('L{0}', [s.level])} ${s.who || s.role || '–'} · ${this.stepWord(s.status)}`,
      cls: this.stepClass(s.status), title: s.reason || s.note || '' }));
    return { title, base, approvalId: approvalId ?? r?.approval_id, facts, steps, kind };   // v1.62.11 (item 95) kind: out-of-office line
  }
}
