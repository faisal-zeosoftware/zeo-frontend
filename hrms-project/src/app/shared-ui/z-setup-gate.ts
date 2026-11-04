/**
 * v1.62.1 (user request 2 Nov) – required setup before HR transactions.
 *
 * A company created from 1.62.1 on finishes every step of the setup guide (completed, or skipped where a step can be skipped) before leave, attendance, overtime,
 * payroll, loans, advances, air tickets and requests can be saved. The server answers such a save with
 * 409 {code: 'setup_required', detail, employee_detail, steps, link}.
 *
 *  - showSetupGate(): every screen – the HTTP error interceptor shows the server's message with a "Continue the setup"
 *    link (in self service: the friendly notice for employees, no link) instead of the screen's own error message;
 *    toasts with an error just after it are not shown (setupGateJustShown).
 *  - <z-setup-gate-notice>: the notice on top of a page while the company waits (self service: mode="employee";
 *    Home and the setup guide: mode="admin" with the open step names and a Continue button).
 * API: GET /zeo-admin/api/setup-gate/ → {enforced, allow, blocked, open: [names], count, total, message, employee_message, link, admin}
 */
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe, i18nT } from './i18n.service';
import { markSetupGateShown } from './z-toast';

export const SETUP_LINK = '/main-sidebar/settings/setup-guide';
let shownAt = 0;
let panel: HTMLElement | null = null;

/** true for a few seconds after the notice was shown: the screen's own "Failed …" toast is not shown on top of it. */
export function setupGateJustShown(): boolean { return Date.now() - shownAt < 5000; }

export function isSetupRequired(e: any): boolean { return e?.status === 409 && e?.error?.code === 'setup_required'; }

/** pages where employees work on their own requests: the friendly notice, without the link to the setup guide */
export function employeeContext(): boolean {
  try { return /\/main-sidebar\/(self-service|my-)/.test(location.pathname); } catch { return false; }
}

function go(link: string): void {
  try {
    history.pushState({}, '', link);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));   // the Angular router follows popstate
  } catch { location.href = link; }
}

export function showSetupGate(body: any): void {
  if (typeof document === 'undefined') { return; }
  shownAt = Date.now();
  markSetupGateShown();
  const emp = employeeContext();
  const text = emp ? (body?.employee_detail || i18nT('Your company is still being set up – requests open when HR finishes the setup.'))
    : (body?.detail || i18nT('Finish the setup first.'));
  if (panel && document.body.contains(panel)) { panel.remove(); }
  const el = document.createElement('div');
  el.className = 'zsgate-pop';
  el.setAttribute('role', 'alert');
  el.setAttribute('data-setup-gate', emp ? 'employee' : 'admin');
  el.setAttribute('data-no-translate', '');
  el.style.cssText = 'position:fixed;z-index:10050;inset-inline-end:20px;bottom:20px;max-width:440px;background:#fff;color:#1f2433;'
    + 'border:1px solid #f0c36d;border-inline-start:5px solid #b8730f;border-radius:12px;box-shadow:0 10px 30px rgba(20,20,50,.18);'
    + 'padding:12px 14px;font-size:13.5px;line-height:1.45;display:flex;gap:10px;align-items:flex-start';
  const ic = document.createElement('span');
  ic.textContent = '!'; ic.setAttribute('aria-hidden', 'true');
  ic.style.cssText = 'flex:none;width:22px;height:22px;border-radius:50%;background:#b8730f;color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center';
  const tx = document.createElement('div');
  tx.style.cssText = 'flex:1';
  const p = document.createElement('div');
  p.className = 'zsgate-text'; p.textContent = text;
  tx.appendChild(p);
  if (!emp) {
    const a = document.createElement('a');
    a.href = body?.link || SETUP_LINK; a.className = 'zsgate-link'; a.setAttribute('data-setup-gate-link', '');
    a.textContent = i18nT('Continue the setup');
    a.style.cssText = 'display:inline-block;margin-top:6px;color:#5b4fe0;font-weight:600;text-decoration:underline';
    a.onclick = (ev) => { ev.preventDefault(); el.remove(); go(a.getAttribute('href') || SETUP_LINK); };
    tx.appendChild(a);
  }
  const x = document.createElement('button');
  x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', i18nT('Close'));
  x.style.cssText = 'flex:none;border:0;background:none;font-size:18px;line-height:1;cursor:pointer;color:#6b7185';
  x.onclick = () => el.remove();
  el.append(ic, tx, x);
  document.body.appendChild(el);
  panel = el;
  setTimeout(() => { if (panel === el) { el.remove(); } }, 15000);
}

/** The notice on top of a page while the company still waits for the required setup steps. */
@Component({
  selector: 'z-setup-gate-notice',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TPipe],
  styles: [`
  .zsgn { display: flex; gap: 10px; align-items: flex-start; background: #fff8e6; border: 1px solid #f0d28a; border-inline-start: 4px solid #b8730f;
          border-radius: 12px; padding: 10px 14px; margin: 0 0 14px; color: #5c3d00; font-size: 13.5px; }
  .zsgn mat-icon { color: #b8730f; flex: none; } .zsgn b { color: #3d2900; } .zsgn .grow { flex: 1; }
  .zsgn p { margin: 2px 0 0; } .zsgn small { display: block; color: #7a5a1a; margin-top: 2px; }
  .zsgn a.btn { flex: none; align-self: center; background: #5b4fe0; color: #fff; border-radius: 7px; padding: 6px 12px; text-decoration: none; font-weight: 600; font-size: 13px; }
  .zsgn.emp { margin: 12px 16px 0; }`],
  template: `
<div class="zsgn emp" *ngIf="d?.blocked && mode === 'employee'" role="status" data-setup-gate-notice="employee">
  <mat-icon>hourglass_top</mat-icon><div class="grow"><b>{{ d.employee_message }}</b></div>
</div>
<div class="zsgn" *ngIf="d?.blocked && mode === 'admin'" role="status" data-setup-gate-notice="admin">
  <mat-icon>lock_clock</mat-icon>
  <div class="grow"><b>{{ (d.count === 1 ? 'HR transactions open after 1 more setup step.' : 'HR transactions open after {0} more setup steps.') | t:[d.count] }}</b>
    <p>{{ 'Still open' | t }}: {{ d.open.join(', ') }}</p>
    <small>{{ 'Leave, attendance, payroll, loans, air tickets and requests wait until then. Masters, employees and users can be set up now.' | t }}</small></div>
  <a class="btn" [routerLink]="d.link" *ngIf="showLink" data-setup-gate-continue>{{ 'Continue the setup' | t }}</a>
</div>`,
})
export class ZSetupGateNoticeComponent implements OnInit {
  @Input() mode: 'employee' | 'admin' = 'admin';
  @Input() showLink = true;
  d: any = null;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> {
    const schema = localStorage.getItem('selectedSchema') || '';
    if (!schema) { return; }
    try { this.d = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/zeo-admin/api/setup-gate/?schema=${encodeURIComponent(schema)}`)); }
    catch { this.d = null; }
    this.cd.markForCheck();
  }
}
