import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/** Base path of the Projects pages (routes registered under 'zeo-projects'). v1.14.0 */
export const ZP_BASE = '/main-sidebar/zeo-projects';

/** Projects API (/zeo-projects/api/...) with ?schema=<selected company>. */
@Injectable({ providedIn: 'root' })
export class ZpApiService {
  readonly api = environment.apiBaseUrl;
  private lookupCache: Promise<any> | null = null;
  private lookupSchema = '';

  constructor(private http: HttpClient) {}

  get schema(): string { return localStorage.getItem('selectedSchema') || ''; }

  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(this.schema)}`;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`;
    });
    return `${this.api}/zeo-projects/api/${path}?${q}`;
  }

  get<T = any>(path: string, query: Record<string, any> = {}): Promise<T> {
    // v1.22.0: the dashboard's branch goes with a figure to its list or report (?branch= on the page address)
    if (/^(tickets|contracts|customers|worklogs|dev-requests|devrequests|billing|projects)\/$|^reports\/[a-z-]+\/$/.test(path)) {
      const b = new URLSearchParams(window.location.search).get('branch');
      if (b && query['branch'] === undefined) { query = { ...query, branch: b }; }
    }
    return firstValueFrom(this.http.get<T>(this.url(path, query)));
  }
  post<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path), body)); }
  patch<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(path), body)); }
  put<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.put<T>(this.url(path), body)); }
  putQ<T = any>(path: string, query: Record<string, any>, body: any = {}): Promise<T> { return firstValueFrom(this.http.put<T>(this.url(path, query), body)); }
  postQ<T = any>(path: string, query: Record<string, any>, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path, query), body)); }
  /** Download a server-made file (PDF / Excel) with the login token. */
  async file(path: string, query: Record<string, any>, name: string): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(path, query), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  delete(path: string): Promise<any> { return firstValueFrom(this.http.delete(this.url(path))); }

  /** v1.17.0 – the project's HSE figures from the HSE app; null when HSE is not installed or not linked with Projects. */
  hse(projectId: number): Promise<any> {
    return firstValueFrom(this.http.get(`${this.api}/zeo-hse/api/project/${projectId}/?schema=${encodeURIComponent(this.schema)}`)).catch(() => null);
  }

  /** Pickers, choice lists and the user's Projects rights (cached per page load and company). */
  lookups(refresh = false): Promise<any> {
    if (!this.lookupCache || refresh || this.lookupSchema !== this.schema) {
      this.lookupSchema = this.schema;
      this.lookupCache = this.get('lookups/').catch(e => { this.lookupCache = null; throw e; });
    }
    return this.lookupCache;
  }

  /** Download a ticket file (the request carries the login token). */
  async download(fileId: number, name: string, portal = false): Promise<void> {
    const path = portal ? `portal/files/${fileId}/` : `files/${fileId}/`;
    const url = portal ? `${this.api}/zeo-projects/api/${path}?schema=${encodeURIComponent(localStorage.getItem('zpPortalSchema') || '')}` : this.url(path);
    const blob = await firstValueFrom(this.http.get(url, { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /** FormData from a plain object (arrays / objects as JSON) plus files under "files". */
  static form(data: Record<string, any>, files: File[] = []): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    files.forEach(f => fd.append('files', f, f.name));
    return fd;
  }

  /** Readable text of an API error. */
  static error(e: any, fallback = 'It could not be done.'): string {
    const b = e?.error;
    if (!b) return e?.message || fallback;
    if (typeof b === 'string') return b.length > 300 ? fallback : b;
    if (b.detail) return b.detail;
    const lines: string[] = [];
    Object.entries(b).forEach(([k, v]) => lines.push(`${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`));
    return lines.join('\n') || fallback;
  }
}

export const money = (v: any, cur = 'AED'): string =>
  `${cur} ` + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const num = (v: any, d = 1): string => (v === null || v === undefined || v === '') ? '–' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });

/** 75 → "1 h 15 min", 2880 → "2 d" (clock time). */
export function minutes(v: any): string {
  if (v === null || v === undefined) return '–';
  let m = Math.round(Math.abs(Number(v)));
  const neg = Number(v) < 0 ? '-' : '';
  if (m < 60) return `${neg}${m} min`;
  const d = Math.floor(m / 1440); m -= d * 1440;
  const h = Math.floor(m / 60); m -= h * 60;
  return neg + [d ? `${d} d` : '', h ? `${h} h` : '', m && !d ? `${m} min` : ''].filter(Boolean).join(' ');
}

export function when(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function day(v: any): string {
  if (!v) return '';
  const d = new Date(String(v).length <= 10 ? v + 'T00:00:00' : v);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const today = (): string => new Date().toISOString().slice(0, 10);

export const STAGE_CLASS: Record<string, string> = {
  new: 'st-new', assigned: 'st-new', in_progress: 'st-work', waiting_customer: 'st-wait', waiting_internal: 'st-wait',
  pending_dev_approval: 'st-dev', under_development: 'st-dev', testing: 'st-dev', resolved: 'st-done', closed: 'st-closed', reopened: 'st-bad',
};
export const PRIORITY_CLASS: Record<string, string> = { critical: 'pr-critical', high: 'pr-high', medium: 'pr-medium', low: 'pr-low' };
export const SLA_LABEL: Record<string, string> = { ok: 'On time', at_risk: 'At risk', breached: 'Breached', met: 'Met', paused: 'Paused', none: 'No SLA' };
export const HEALTH_LABEL: Record<string, string> = { on_track: 'On track', at_risk: 'At risk', delayed: 'Delayed', done: 'Done', cancelled: 'Cancelled' };

export function slaText(t: any): string {
  if (!t) return '';
  if (t.sla_state === 'ok' || t.sla_state === 'at_risk') return `${minutes(t.sla_minutes_left)} left`;
  if (t.sla_state === 'breached' && t.sla_minutes_left !== null) return `${minutes(Math.abs(t.sla_minutes_left))} over`;
  return SLA_LABEL[t.sla_state] || '';
}

export function csv(name: string, cols: string[], rows: any[]): void {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(',')));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
