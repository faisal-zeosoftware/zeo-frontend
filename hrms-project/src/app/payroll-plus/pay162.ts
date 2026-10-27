// v1.62.0 payroll – shared helpers of the payroll workspace screens
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const PAY_API = `${environment.apiBaseUrl}`;
export function schemaQ(): string { return `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
export function wsUrl(p: string, q = ''): string { return `${PAY_API}/payroll-plus/api/workspace/${p}?${schemaQ()}${q}`; }
export function apiUrl(p: string, q = ''): string { return `${PAY_API}/${p}${p.includes('?') ? '&' : '?'}${schemaQ()}${q}`; }

/** a readable message from an API error (DRF detail / field errors / list) */
export function errText(e: any, fallback = 'Something went wrong. Try again.'): string {
  const b = (e instanceof HttpErrorResponse ? e.error : e?.error) ?? e;
  const pick = (v: any): string => Array.isArray(v) ? v.map(pick).filter(Boolean).join(' ') : (typeof v === 'string' ? v : (v && typeof v === 'object' ? Object.values(v).map(pick).filter(Boolean).join(' ') : ''));
  if (typeof b === 'string' && b.length < 400 && !b.trim().startsWith('<')) { return b; }
  if (b && typeof b === 'object') {
    return pick(b.detail) || pick(b.status) || pick(b.non_field_errors) || pick(b.error) || pick(b) || fallback;
  }
  return fallback;
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The run stage indicator: Draft → Calculated → Checked → Sent for approval → Approved → WPS file made → Paid → Posted */
@Component({
  selector: 'py-steps',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./pay162.css'],
  template: `
<ol class="py-steps" [class.mini]="mini" [attr.aria-label]="'Payroll stage' ">
  <li *ngFor="let s of steps; let i = index" [class]="s.state" [attr.data-step]="s.key" [attr.data-state]="s.state"
      [title]="s.label + (s.state === 'done' ? ' ✓' : s.state === 'skipped' ? ' – skipped' : s.state === 'current' ? ' – next' : '') + (s.by ? ' · ' + s.by : '')">
    <span class="dot">{{ s.state === 'done' ? '✓' : s.state === 'skipped' ? '–' : i + 1 }}</span>
    <span class="lab" *ngIf="!mini">{{ s.label }}</span>
    <span class="when" *ngIf="!mini && s.at && (s.state === 'done')">{{ s.at | date:'dd/MM/yyyy' }}</span>
  </li>
</ol>`,
})
export class PayStepsComponent {
  @Input() steps: any[] = [];
  @Input() mini = false;
}
