/**
 * v1.62.10 (item 167) – one review window for the approvals of loan, advance salary, air ticket and asset requests (it
 * replaces the old in-template "review / approve-reject" and "Send delegation" pop-ups of the four approval screens).
 * Same design as the shared form (z-form.component.ts): the request in words, the step it is at, a note, then Approve,
 * Reject (with the reason the employee sees, required next to the field) or Delegate (to another user). It calls the same
 * endpoints with the same bodies as the old pop-ups (…/approve/, …/reject/, …/delegate/); the server still decides who may.
 *
 *   const r = await openZReview({ title, base: '/payroll/api/loan-approval/', approvalId, facts })   // 'approved' | 'rejected' | 'delegated' | null
 */
import { ChangeDetectorRef, Component, ComponentRef, OnInit, createComponent } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { i18nT } from './i18n-core';
import { zToast } from './z-toast';
import { zFormHost } from './z-form.component';
import { environment } from '../../environments/environment';

export interface ZReviewFact { label: string; value: any; }
export interface ZReviewStep { text: string; cls?: string; title?: string; }
export interface ZReviewConfig {
  title: string;                 // already in the user's language, e.g. i18nT('Loan request {0}', [number])
  base: string;                  // the approval endpoint, e.g. /payroll/api/loan-approval/
  approvalId: number;
  facts?: ZReviewFact[];         // labels are translated, values are data
  steps?: ZReviewStep[];         // the levels of the request (optional)
  canAct?: boolean;              // false: view only; omitted: the step's own status decides (Pending → actions)
  start?: 'approve' | 'reject';
  kind?: string;                 // v1.62.11 (item 95) loan | advance | asset | airticket … – the "handed over by out of office" line
}
export type ZReviewResult = 'approved' | 'rejected' | 'delegated' | null;

export function openZReview(cfg: ZReviewConfig): Promise<ZReviewResult> {
  return new Promise(resolve => {
    const { app, env } = zFormHost();
    if (!app || !env) { resolve(null); return; }
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ref: ComponentRef<ZReviewComponent> = createComponent(ZReviewComponent, { environmentInjector: env, hostElement: host });
    ref.instance.cfg = cfg;
    ref.instance.done = (r: ZReviewResult) => { app.detachView(ref.hostView); ref.destroy(); host.remove(); resolve(r); };
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  });
}

const STATUS: Record<string, string> = { Pending: 'Waiting for a decision', Approved: 'Approved', Rejected: 'Rejected', Escalated: 'Escalated' };

@Component({
  selector: 'z-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="zr-veil" (click)="close()"></div>
<div class="zr-box" role="dialog" aria-modal="true" [attr.aria-label]="cfg.title" (keydown.escape)="close()" data-zreview>
  <div class="zr-head">
    <div><h2 class="zr-title">{{ cfg.title }}</h2>
      <p class="zr-sub" *ngIf="apr">{{ t('Level {0}', [apr.level]) }}<ng-container *ngIf="apr.role"> · {{ apr.role }}</ng-container> · <span class="zr-st" [ngClass]="stCls(apr.status)" data-zr-status>{{ t(status(apr.status)) }}</span></p></div>
    <button type="button" class="zr-x" (click)="close()" [attr.aria-label]="t('Close')">×</button>
  </div>
  <div class="zr-body" *ngIf="!loading; else wait">
    <p class="zr-err zr-top" *ngIf="err['_']" role="alert" data-zr-error>{{ err['_'] }}</p>
    <p class="zr-info" *ngIf="info" data-zr-info>{{ info }}</p>
    <p class="zr-info" *ngIf="ooo" data-zr-ooo>{{ oooText() }}</p>
    <dl class="zr-facts" *ngIf="cfg.facts?.length">
      <ng-container *ngFor="let f of cfg.facts"><div *ngIf="f.value !== null && f.value !== undefined && f.value !== ''"><dt>{{ t(f.label) }}</dt><dd>{{ f.value }}</dd></div></ng-container>
    </dl>
    <div class="zr-steps" *ngIf="cfg.steps?.length"><span *ngFor="let s of cfg.steps" [ngClass]="s.cls || ''" [title]="s.title || ''">{{ s.text }}</span></div>
    <div class="zr-said" *ngIf="apr && !actionable && (apr.note || apr.rejection_reason)">
      <div *ngIf="apr.note"><b>{{ t('Note') }}</b> {{ apr.note }}</div>
      <div *ngIf="apr.rejection_reason"><b>{{ t('Reason') }}</b> {{ apr.rejection_reason }}</div>
    </div>
    <div class="zr-said" *ngIf="apr?.delegation_details?.is_deligate">
      <div><b>{{ t('Delegated to') }}</b> {{ apr.delegation_details.delegate_to || '–' }}</div>
      <div *ngIf="apr.delegation_details.response && !ooo"><b>{{ t('Response') }}</b> {{ apr.delegation_details.response }}</div>   <!-- v1.62.11 (item 95): the out-of-office line says it -->
    </div>
    <ng-container *ngIf="actionable">
      <label class="zr-f" *ngIf="mode !== 'delegate'" data-zr-field="note">
        <span class="zr-l">{{ t('Note') }}</span>
        <textarea rows="2" [(ngModel)]="note" [placeholder]="t('Optional – kept with this step')" data-zr-note></textarea>
      </label>
      <label class="zr-f" *ngIf="mode === 'reject'" data-zr-field="reason">
        <span class="zr-l">{{ t('Reason for the rejection') }} <span class="zr-req" aria-hidden="true">*</span></span>
        <textarea rows="3" [(ngModel)]="reason" [class.bad]="err['reason']" [placeholder]="t('The employee sees this')" data-zr-reason></textarea>
        <small class="zr-err" *ngIf="err['reason']" data-zr-field-error>{{ err['reason'] }}</small>
      </label>
      <label class="zr-f" *ngIf="mode === 'delegate'" data-zr-field="delegate">
        <span class="zr-l">{{ t('Delegate to') }} <span class="zr-req" aria-hidden="true">*</span></span>
        <input type="search" class="zr-q" [(ngModel)]="q" [placeholder]="t('Search')" autocomplete="off">
        <select [(ngModel)]="delegateTo" [class.bad]="err['delegate']" data-zr-user>
          <option [ngValue]="null">–</option>
          <option *ngFor="let u of shownUsers()" [ngValue]="u.id">{{ u.label }}</option>
        </select>
        <small class="zr-hint">{{ t('The request waits for this user instead of you. They can answer you with a note.') }}</small>
        <small class="zr-err" *ngIf="err['delegate']" data-zr-field-error>{{ err['delegate'] }}</small>
      </label>
    </ng-container>
  </div>
  <ng-template #wait><div class="zr-body"><p class="zr-muted">{{ t('Loading…') }}</p></div></ng-template>
  <div class="zr-foot">
    <ng-container *ngIf="!actionable || mode === 'view'">
      <button type="button" class="zr-btn" (click)="close()" [disabled]="busy">{{ t('Close') }}</button>
      <span class="zr-grow"></span>
      <ng-container *ngIf="actionable">
        <button type="button" class="zr-btn" (click)="go('delegate')" [disabled]="busy" data-zr-delegate>{{ t('Delegate') }}</button>
        <button type="button" class="zr-btn danger" (click)="go('reject')" [disabled]="busy" data-zr-reject>{{ t('Reject') }}</button>
        <button type="button" class="zr-btn primary" (click)="approve()" [disabled]="busy" data-zr-approve>{{ busy ? t('Saving…') : t('Approve') }}</button>
      </ng-container>
    </ng-container>
    <ng-container *ngIf="actionable && mode === 'reject'">
      <button type="button" class="zr-btn" (click)="go('view')" [disabled]="busy">{{ t('Back') }}</button>
      <span class="zr-grow"></span>
      <button type="button" class="zr-btn danger solid" (click)="reject()" [disabled]="busy" data-zr-confirm-reject>{{ busy ? t('Saving…') : t('Reject the request') }}</button>
    </ng-container>
    <ng-container *ngIf="actionable && mode === 'delegate'">
      <button type="button" class="zr-btn" (click)="go('view')" [disabled]="busy">{{ t('Back') }}</button>
      <span class="zr-grow"></span>
      <button type="button" class="zr-btn primary" (click)="delegate()" [disabled]="busy" data-zr-send>{{ busy ? t('Saving…') : t('Delegate') }}</button>
    </ng-container>
  </div>
</div>`,
  styles: [`
  :host { position: fixed; inset: 0; z-index: 1300; display: grid; place-items: center; }
  .zr-veil { position: absolute; inset: 0; background: rgba(27,22,64,.38); }
  .zr-box { position: relative; width: min(640px, calc(100vw - 32px)); max-height: calc(100vh - 48px); display: flex; flex-direction: column; background: #fff;
    border-radius: 14px; box-shadow: 0 24px 60px rgba(27,22,64,.28); font-size: 13.5px; color: #1d2033; }
  .zr-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 18px 22px 12px; border-bottom: 1px solid #eceef5; }
  .zr-title { margin: 0; font-size: 18px; font-weight: 600; color: #1b1640; }
  .zr-sub { margin: 4px 0 0; color: #6b7185; font-size: 13px; }
  .zr-st { font-weight: 600; } .zr-st.ok { color: #067647; } .zr-st.bad { color: #b3263a; } .zr-st.warn { color: #b54708; }
  .zr-x { border: 0; background: transparent; font-size: 22px; line-height: 1; color: #6b7185; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
  .zr-x:hover { background: #f3f4f8; }
  .zr-body { padding: 12px 22px 16px; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
  .zr-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; margin: 0; }
  .zr-facts dt { font-size: 12px; font-weight: 600; color: #6b7185; margin: 0; }
  .zr-facts dd { margin: 2px 0 0; color: #1d2033; }
  .zr-steps { display: flex; flex-wrap: wrap; gap: 6px; }
  .zr-steps span { padding: 3px 9px; border-radius: 12px; background: #f3f4f8; font-size: 12px; }
  .zr-steps span.ok { background: #e3f6ec; color: #067647; } .zr-steps span.bad { background: #fde2e4; color: #b3263a; } .zr-steps span.warn { background: #fff4e0; color: #b54708; }
  .zr-said { background: #f8f9fc; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
  .zr-said b { font-weight: 600; color: #3b3f55; margin-inline-end: 6px; }
  .zr-f { display: flex; flex-direction: column; gap: 5px; margin: 0; }
  .zr-l { font-size: 12.5px; font-weight: 600; color: #3b3f55; }
  .zr-req { color: #b3263a; }
  .zr-f textarea, .zr-f select, .zr-f input { width: 100%; border: 1px solid #dfe1ea; border-radius: 8px; padding: 8px 10px; font: inherit; background: #fff; }
  .zr-f select, .zr-f input { height: 36px; padding: 0 10px; }
  .zr-f input.zr-q { height: 30px; font-size: 12.5px; background: #f8f9fc; }
  .zr-f textarea:focus, .zr-f select:focus { outline: none; border-color: #5b4fe0; box-shadow: 0 0 0 3px rgba(91,79,224,.12); }
  .zr-f .bad { border-color: #d92d20 !important; }
  .zr-hint { color: #6b7185; font-size: 12px; }
  .zr-err { color: #b3263a; font-size: 12px; }
  .zr-info { background: #eef0ff; color: #3b31b8; border-radius: 8px; padding: 8px 10px; margin: 0; font-size: 12.5px; }
  .zr-top { background: #fde2e4; border-radius: 8px; padding: 8px 10px; margin: 0; }
  .zr-foot { display: flex; align-items: center; gap: 8px; padding: 12px 22px; border-top: 1px solid #eceef5; }
  .zr-grow { flex: 1; }
  .zr-btn { height: 36px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe1ea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; color: #1d2033; }
  .zr-btn.primary { background: #5b4fe0; border-color: #5b4fe0; color: #fff; }
  .zr-btn.danger { color: #b3263a; border-color: #f1b8bf; }
  .zr-btn.danger.solid { background: #d92d20; border-color: #d92d20; color: #fff; }
  .zr-btn[disabled] { opacity: .6; cursor: default; }
  .zr-muted { color: #6b7185; }
  @media (max-width: 640px) { .zr-facts { grid-template-columns: 1fr; } .zr-foot { flex-wrap: wrap; } }
  `],
})
export class ZReviewComponent implements OnInit {
  cfg!: ZReviewConfig;
  done: (r: ZReviewResult) => void = () => {};
  apr: any = null;
  loading = true;
  busy = false;
  mode: 'view' | 'reject' | 'delegate' = 'view';
  note = '';
  reason = '';
  delegateTo: number | null = null;
  q = '';
  users: { id: number; label: string }[] = [];
  err: Record<string, string> = {};
  info = '';
  ooo: any = null;   // v1.62.11 (item 95)
  t = (s: string, p?: any[]) => i18nT(s, p);
  oooText(): string {
    const o = this.ooo; const d = (x: string) => x ? x.split('-').reverse().join('/') : '';
    return o.back_on ? this.t('Handed over by out of office of {0} – will come back on {1}', [o.from, d(o.back_on)])
      : this.t('Handed over by out of office of {0} (until {1})', [o.from, d(o.until)]);
  }

  constructor(private cd: ChangeDetectorRef) {}

  get actionable(): boolean {
    if (!this.apr || this.cfg.canAct === false) { return false; }
    return this.apr.status === 'Pending';
  }
  status(s: string): string { return STATUS[s] || s || '–'; }
  stCls(s: string): string { return s === 'Approved' ? 'ok' : s === 'Rejected' ? 'bad' : s === 'Pending' ? 'warn' : ''; }

  async ngOnInit(): Promise<void> {
    const r = await this.api('GET', `${this.ep()}`);
    if (r.ok && r.data && typeof r.data === 'object') { this.apr = r.data; }
    else if (r.status === 404) { this.info = this.t('Only the approver of this step can open it.'); }
    else { this.err['_'] = this.msg(r.data, this.t('The approval could not be loaded.')); }
    if (this.cfg.kind && this.apr) {   // v1.62.11 (item 95)
      const h = await this.api('GET', `/zeo-admin/api/out-of-office/handed/?kind=${encodeURIComponent(this.cfg.kind)}`);
      this.ooo = (h.ok && h.data && h.data[this.cfg.kind]) ? (h.data[this.cfg.kind][String(this.cfg.approvalId)] || null) : null;
    }
    this.loading = false;
    if (this.actionable && this.cfg.start) { this.mode = this.cfg.start === 'reject' ? 'reject' : 'view'; }
    this.cd.detectChanges();
    setTimeout(() => (document.querySelector('[data-zreview] textarea') as HTMLElement | null)?.focus(), 30);
  }

  private ep(action = ''): string { const b = this.cfg.base.endsWith('/') ? this.cfg.base : this.cfg.base + '/'; return `${b}${this.cfg.approvalId}/${action ? action + '/' : ''}`; }

  async go(m: 'view' | 'reject' | 'delegate'): Promise<void> {
    this.mode = m; this.err = {};
    if (m === 'delegate' && !this.users.length) {
      // the users of the company by name (the old pop-up read /users/tenant-users/, which shows an approver without user rights only themself)
      const r = await this.api('GET', '/tools/api/user-names/');
      const me = this.me();
      const list: any[] = Array.isArray(r.data) ? r.data : (r.data?.results || []);
      this.users = list.filter(u => u.id && u.id !== me).map(u => ({ id: u.id, label: u.name ? (u.code ? `${u.name} (${u.code})` : u.name) : u.username }))
        .sort((x, y) => x.label.localeCompare(y.label));
    }
    this.cd.detectChanges();
  }
  shownUsers(): { id: number; label: string }[] {
    const s = this.q.trim().toLowerCase();
    return s ? this.users.filter(u => u.label.toLowerCase().includes(s) || u.id === this.delegateTo) : this.users;
  }

  async approve(): Promise<void> {
    await this.send('approve', { note: this.note || '', status: 'Approved' }, 'approved', this.t('Approved.'));
  }
  async reject(): Promise<void> {
    this.err = {};
    if (!this.reason.trim()) { this.err['reason'] = this.t('{0} is required.', [this.t('Reason for the rejection')]); this.cd.detectChanges(); return; }
    await this.send('reject', { note: this.note || '', status: 'Rejected', rejection_reason: this.reason.trim() }, 'rejected', this.t('Rejected.'));
  }
  async delegate(): Promise<void> {
    this.err = {};
    if (!this.delegateTo) { this.err['delegate'] = this.t('{0} is required.', [this.t('Delegate to')]); this.cd.detectChanges(); return; }
    await this.send('delegate', { approver: this.me(), deligate_to: this.delegateTo }, 'delegated', this.t('Delegated.'));
  }

  private async send(action: string, body: any, result: ZReviewResult, ok: string): Promise<void> {
    if (this.busy) { return; }
    this.busy = true; this.cd.detectChanges();
    const r = await this.api('POST', this.ep(action), body);
    this.busy = false;
    if (r.ok) { zToast(ok, 'ok'); this.done(result); return; }
    this.err = { _: this.msg(r.data, this.t('It could not be saved.')) };
    this.cd.detectChanges();
  }

  close(): void { if (!this.busy) { this.done(null); } }

  private me(): number | null {
    try { const tk = localStorage.getItem('auth_token') || ''; return JSON.parse(atob(tk.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).user_id ?? null; } catch { return null; }
  }
  private msg(d: any, fallback: string): string {
    if (!d) { return fallback; }
    if (typeof d === 'string') { return d.length < 300 ? d : fallback; }
    if (Array.isArray(d)) { return d.filter(x => typeof x === 'string').join(' ') || fallback; }
    if (typeof d === 'object') {
      const parts = Object.entries(d).map(([k, v]) => { const m = Array.isArray(v) ? v.join(' ') : typeof v === 'string' ? v : ''; return ['detail', 'error', 'non_field_errors'].includes(k) ? m : (m ? `${k}: ${m}` : ''); }).filter(Boolean);
      return parts.join(' ') || fallback;
    }
    return fallback;
  }
  private async api(method: string, path: string, body?: any): Promise<{ ok: boolean; status: number; data: any }> {
    const sch = localStorage.getItem('selectedSchema') || '';
    const h: any = { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || ''), 'Content-Type': 'application/json' };
    try { const l = localStorage.getItem('zeoLang'); if (l) { h['X-Language'] = l; } } catch { /* storage off */ }
    const url = `${environment.apiBaseUrl}${path}${path.includes('?') ? '&' : '?'}schema=${encodeURIComponent(sch)}`;
    try {
      const res = await fetch(url, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
      const txt = await res.text(); let data: any = null;
      try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
      return { ok: res.ok, status: res.status, data };
    } catch (e: any) {
      return { ok: false, status: 0, data: String(e?.message || e) };
    }
  }
}
