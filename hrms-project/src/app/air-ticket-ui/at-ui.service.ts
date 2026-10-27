// v1.62.0 air ticket – one look for the air ticket screens: the read-only summaries (/payroll-plus/api/air-tickets/…) and the
// words, amounts and dates they show (no raw codes such as BOTH, TWO_WAY, ENCASHMENT, APPROVED or true / false).
// Saving stays in the screens' own forms and the existing /payroll/api/airticket-* endpoints.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { cpMoney } from '../shared-ui/country-pack.service';
import { i18nT as T } from '../shared-ui/i18n-core';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';

export const AT_BASE = '/main-sidebar/air-ticket-options';

/** REST paths of the existing endpoints the row actions use (delete one record). */
const DELETE_PATH: Record<string, string> = {
  policy: 'airticket-policy', rule: 'airticket-rule', allocation: 'airticket-allocation', request: 'airticket-request',
  level: 'airticket-approval-levels',
};

@Injectable({ providedIn: 'root' })
export class AtUiService {
  constructor(private http: HttpClient, private rec: ZRecordService) {}

  private schema(): string { return encodeURIComponent(localStorage.getItem('selectedSchema') || ''); }

  /** GET a summary: policies | allocations | requests | approvals | levels | mine. */
  get<Tp = any>(path: string, q: Record<string, any> = {}): Promise<Tp> {
    let qs = `schema=${this.schema()}`;
    Object.entries(q).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) { return; }
      qs += `&${k}=${encodeURIComponent(Array.isArray(v) ? `[${v.join(',')}]` : String(v))}`;
    });
    return firstValueFrom(this.http.get<Tp>(`${this.rec.api}/payroll-plus/api/air-tickets/${path}/?${qs}`));
  }

  /** Delete one record through its existing endpoint (after the user confirmed). */
  async remove(kind: string, id: number, what: string): Promise<boolean> {
    if (!confirm(T('Delete {0}? This cannot be undone.', [what]))) { return false; }
    try {
      await firstValueFrom(this.http.delete(`${this.rec.api}/payroll/api/${DELETE_PATH[kind]}/${id}/?schema=${this.schema()}`));
      return true;
    } catch (e) {
      alert(this.err(e, T('It could not be deleted.')));
      return false;
    }
  }

  err(e: any, fallback: string): string { try { return httpErrorText(e) || fallback; } catch { return fallback; } }

  // ---------- words ----------
  money(v: any): string { return v === null || v === undefined || v === '' ? '–' : cpMoney(v, '0.0-2'); }
  /** dd/mm/yyyy (UAE style) of an ISO date. */
  dmy(v: any): string {
    if (!v) { return '–'; }
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
  }
  every(amount: any, years: number): string {
    const n = +years || 1;
    return n === 1 ? T('{0} every year', [this.money(amount)]) : T('{0} every {1} years', [this.money(amount), n]);
  }
  everyYears(years: number): string { const n = +years || 1; return n === 1 ? T('every year') : T('every {0} years', [n]); }
  ticketType(code: string): string {
    return T(({ BOTH: 'Ticket or cash', TICKET: 'Ticket only', CASH: 'Cash only' } as any)[code] || code || '–');
  }
  travelClass(code: string): string {
    return T(({ ECONOMY: 'Economy class', BUSINESS: 'Business class', FIRST: 'First class' } as any)[code] || code || '–');
  }
  probation(allowed: boolean): string { return T(allowed ? 'Can be used during probation' : 'Not during probation'); }
  ruleKind(code: string): string {
    return T(({ TWO_WAY: 'Return ticket', ONE_WAY: 'One-way ticket', ENCASHMENT: 'Cash instead of the ticket' } as any)[code] || code || '–');
  }
  /** "Return ticket after 1 year of service", "Cash instead of the ticket after 2 years, paid in the next payroll". */
  ruleText(r: any): string {
    const y = +r.years || 0;
    const one = y === 1;
    if (r.type === 'ENCASHMENT') {
      if (r.next_payroll) {
        return one ? T('Cash instead of the ticket after 1 year, paid in the next payroll')
          : T('Cash instead of the ticket after {0} years, paid in the next payroll', [y]);
      }
      return one ? T('Cash instead of the ticket after 1 year of service') : T('Cash instead of the ticket after {0} years of service', [y]);
    }
    if (r.type === 'ONE_WAY') {
      return one ? T('One-way ticket after 1 year of service') : T('One-way ticket after {0} years of service', [y]);
    }
    if (y === 0) { return r.type === 'TWO_WAY' ? T('Return ticket from joining') : this.ruleKind(r.type); }
    return one ? T('Return ticket after 1 year of service') : T('Return ticket after {0} years of service', [y]);
  }
  serviceText(y: number): string {
    const n = +y || 0;
    return n === 0 ? T('From joining') : n === 1 ? T('After 1 year of service') : T('After {0} years of service', [n]);
  }
  /** Who the policy applies to, as chips. */
  appliesTo(p: any): string[] {
    const out: string[] = [];
    const any = (p.departments || []).length || (p.designations || []).length || (p.categories || []).length || (p.branches || []).length;
    out.push(any ? T('Employees from {0}', [p.country]) : T('All employees from {0}', [p.country]));
    if ((p.departments || []).length) { out.push(T('Departments: {0}', [p.departments.join(', ')])); }
    if ((p.designations || []).length) { out.push(T('Designations: {0}', [p.designations.join(', ')])); }
    if ((p.categories || []).length) { out.push(T('Categories: {0}', [p.categories.join(', ')])); }
    if ((p.branches || []).length) { out.push(T('Branches: {0}', [p.branches.join(', ')])); }
    return out;
  }
  requestType(code: string): string { return T(code === 'ENCASHMENT' ? 'Cash instead of ticket' : 'Ticket'); }
  route(r: any): string {
    if (r.type === 'ENCASHMENT' && !r.origin && !r.destination) { return T('Paid in payroll'); }
    return r.origin || r.destination ? `${r.origin || '–'} → ${r.destination || '–'}` : '–';
  }
  /** Request status word + chip colour. */
  reqStatus(r: any): string {
    const s = r.status;
    if (s === 'PROCESSED') { return T(r.type === 'ENCASHMENT' ? 'Paid in payroll' : 'Processed'); }
    return T(({ PENDING: 'Waiting for approval', APPROVED: 'Approved', REJECTED: 'Rejected' } as any)[s] || s || '–');
  }
  reqClass(s: string): string { return ({ PENDING: 'warn', APPROVED: 'ok', REJECTED: 'bad', PROCESSED: 'info' } as any)[s] || ''; }
  /** Allocation state word + chip colour. */
  allocStatus(st: string): string {
    return T(({ approved: 'Approved', used: 'Used', expired: 'Expired', ticket_taken: 'Ticket taken', pending: 'Pending', rejected: 'Rejected',
      inactive: 'Inactive' } as any)[st] || st || '–');
  }
  allocClass(st: string): string {
    return ({ approved: 'ok', used: 'info', ticket_taken: 'info', expired: 'muted', pending: 'warn', rejected: 'bad', inactive: 'muted' } as any)[st] || '';
  }
  stepStatus(s: string): string { return T(({ Pending: 'Waiting for me', Approved: 'Approved', Rejected: 'Rejected', Escalated: 'Escalated' } as any)[s] || s); }
  stepClass(s: string): string { return ({ Pending: 'warn', Approved: 'ok', Rejected: 'bad', Escalated: 'info' } as any)[s] || ''; }
  /** Approval progress line of a request. */
  progress(r: any): string {
    const p = r.progress || {};
    if (p.type === 'no_approval') { return T('No approval needed'); }
    if (r.status === 'REJECTED') { return p.rejected_by ? T('Rejected by {0}', [p.rejected_by]) : T('Rejected'); }
    if (r.status === 'APPROVED' || r.status === 'PROCESSED') {
      return p.total > 1 ? T('All {0} levels approved', [p.total]) : T('Approved');
    }
    if (!p.total) { return T('No approval workflow for this branch'); }
    const lvl = T('Level {0} of {1}', [Math.min((p.done || 0) + 1, p.total), p.total]);
    return p.waiting_for ? `${lvl} · ${T('waiting for {0}', [p.waiting_for])}` : lvl;
  }
  /** the progress line without the name (the name goes on a second line: progressWho) */
  progressMain(r: any): string {
    const p = r.progress || {};
    if (r.status === 'PENDING' && p.total) { return T('Level {0} of {1}', [Math.min((p.done || 0) + 1, p.total), p.total]); }
    if (r.status === 'REJECTED') { return T('Rejected'); }
    return this.progress(r);
  }
  progressWho(r: any): string {
    const p = r.progress || {};
    if (r.status === 'PENDING' && p.waiting_for) { return T('waiting for {0}', [p.waiting_for]); }
    if (r.status === 'REJECTED' && p.rejected_by) { return T('by {0}', [p.rejected_by]); }
    return '';
  }
  dots(r: any): boolean[] {
    const p = r.progress || {};
    const n = Math.max(+p.total || 0, 0);
    const done = r.status === 'APPROVED' || r.status === 'PROCESSED' ? n : +p.done || 0;
    return Array.from({ length: Math.min(n, 6) }, (_, i) => i < done);
  }
  workflowType(code: string): string {
    return T(({ no_approval: 'Approved automatically', reporting_manager: 'Reporting manager approves', multi_approval: 'Approval levels' } as any)[code] || code || '–');
  }
  /** "After 2 days 4 hours" / "No escalation". */
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
  approverOf(l: any, wfType: string): string {
    if (wfType === 'reporting_manager') { return T("The employee's reporting manager"); }
    if (wfType === 'no_approval') { return T('Nobody – approved automatically'); }
    return l.approver || T('Not set');
  }
  t(s: string, p?: any[]): string { return T(s, p); }
}
