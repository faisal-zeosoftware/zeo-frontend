import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/** Base path of the HSE pages (routes registered under 'zeo-hse'). v1.16.0 */
export const HSE_BASE = '/main-sidebar/zeo-hse';

/** HSE API (/zeo-hse/api/...) with ?schema=<selected company>. */
@Injectable({ providedIn: 'root' })
export class HseApiService {
  readonly api = environment.apiBaseUrl;
  private cache: Record<string, Promise<any> | null> = {};
  private cacheSchema = '';

  constructor(private http: HttpClient) {}

  get schema(): string { return localStorage.getItem('selectedSchema') || ''; }

  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(this.schema)}`;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`;
    });
    return `${this.api}/zeo-hse/api/${path}?${q}`;
  }

  get<T = any>(path: string, query: Record<string, any> = {}): Promise<T> {
    // v1.22.0: a dashboard figure opens its list for the same period / branch (?date_field=&from=&to=&branch= on the page address)
    if (/^(incidents|permits|risks|inspections|observations|toolbox|actions)\/$|^r\/[a-z_-]+\/$/.test(path)) {
      const sp = new URLSearchParams(window.location.search);
      for (const k of ['date_field', 'from', 'to', 'branch']) { if (sp.get(k) && query[k] === undefined) { query = { ...query, [k]: sp.get(k) }; } }
    }
    return firstValueFrom(this.http.get<T>(this.url(path, query)));
  }
  post<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path), body)); }
  postQ<T = any>(path: string, query: Record<string, any>, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path, query), body)); }
  patch<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(path), body)); }
  put<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.put<T>(this.url(path), body)); }

  private cached(key: string, path: string, refresh: boolean): Promise<any> {
    if (this.cacheSchema !== this.schema) { this.cache = {}; this.cacheSchema = this.schema; }
    if (!this.cache[key] || refresh) this.cache[key] = this.get(path).catch(e => { this.cache[key] = null; throw e; });
    return this.cache[key]!;
  }

  /** Pickers, choice lists, terminology and the user's HSE rights. */
  lookups(refresh = false): Promise<any> { return this.cached('lookups', 'lookups/', refresh); }
  /** Meta of the generic registers (fields, filters, rights). */
  registers(refresh = false): Promise<any[]> { return this.cached('registers', 'registers/', refresh); }
  options(name: string): Promise<any[]> { return this.cached('opt:' + name, `options/${name}/`, false); }
  clear(): void { this.cache = {}; }

  /** Download a server-made file (PDF) with the login token. */
  async file(path: string, name: string, query: Record<string, any> = {}): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(path, query), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  download(fileId: number, name: string): Promise<void> { return this.file(`files/${fileId}/`, name); }

  /** FormData from a plain object (arrays / objects as JSON) plus files. */
  static form(data: Record<string, any>, files: File[] = [], key = 'files'): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    files.forEach(f => fd.append(key, f, f.name));
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

export function when(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function day(v: any): string {
  if (!v) return '';
  const d = new Date(String(v).length <= 10 ? v + 'T00:00:00' : v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const today = (): string => new Date().toISOString().slice(0, 10);

/** yyyy-MM-ddTHH:mm in local time for <input type="datetime-local">. */
export function localDT(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const num = (v: any, d = 1): string => (v === null || v === undefined || v === '') ? '–' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });

/** Status → badge colour class (hse.css). */
export function stClass(s: string): string {
  if (!s) return '';
  if (['closed', 'approved', 'published', 'compliant', 'disposed', 'settled', 'verified', 'completed', 'fit', 'reviewed', 'done'].includes(s)) return 'ok';
  if (['rejected', 'noncompliant', 'cancelled', 'unfit', 'disputed', 'expired', 'suspended', 'temp_unfit', 'extreme', 'action'].includes(s)) return 'bad';
  if (['submitted', 'approval', 'review', 'reported', 'pending', 'to_review', 'screening', 'verification', 'partial', 'fit_restrictions', 'contained'].includes(s)) return 'wait';
  if (['active', 'implementing', 'in_progress', 'investigation', 'actions', 'transferred', 'assessment'].includes(s)) return 'work';
  return '';
}

export function csv(name: string, cols: { key: string; label: string }[], rows: any[]): void {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [cols.map(c => esc(c.label)).join(',')].concat(rows.map(r => cols.map(c => esc(r[c.key])).join(',')));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const BAND_COLOR = (score: number, bands: any[]): string => (bands || []).find(b => score >= b.min && score <= b.max)?.color || '#94a3b8';
