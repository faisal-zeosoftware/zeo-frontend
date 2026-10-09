/**
 * v1.12.0 Shift planner – API helper for /shift-planner/api/… (always with ?schema=<selected company>).
 * Backend: ShiftPlanner app (see /home/claude/allapps/shiftplan/INTEGRATION.md for every endpoint).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

export const SP_BASE = '/main-sidebar/shift-planner';

export interface SpMeta {
  rights: { manage: boolean; admin: boolean; manager: boolean; employee: boolean; add_shift: boolean; change_shift: boolean; delete_shift: boolean; approve: boolean; publish: boolean };
  me: { id: number; name: string; branch_id: number } | null;
  branches: { id: number; branch_name: string }[];
  departments: { id: number; dept_name: string }[];
  approvers: { id: number; username: string }[];
}

@Injectable({ providedIn: 'root' })
export class SpApiService {
  private metaCache: Promise<SpMeta> | null = null;
  constructor(private http: HttpClient, private rec: ZRecordService) {}

  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`;
    });
    return `${this.rec.api}/shift-planner/api/${path}?${q}`;
  }
  get<T = any>(path: string, query: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(path, query))); }
  post<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path), body)); }
  patch<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(path), body)); }
  delete(path: string): Promise<any> { return firstValueFrom(this.http.delete(this.url(path))); }

  meta(refresh = false): Promise<SpMeta> {
    if (!this.metaCache || refresh) {
      this.metaCache = this.get<SpMeta>('meta/');
      this.metaCache.catch(() => (this.metaCache = null));
    }
    return this.metaCache;
  }

  /** Download a CSV (template or report). */
  async download(path: string, query: Record<string, any>, filename: string): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(path, query), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /** Upload a file (multipart) with extra fields. */
  upload<T = any>(path: string, file: File, fields: Record<string, any> = {}): Promise<T> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
    return firstValueFrom(this.http.post<T>(this.url(path), fd));
  }

  /** Readable text of an API error (detail + field errors). */
  static error(e: any, fallback = 'It could not be done. Please try again.'): string {
    const b = e?.error;
    if (!b) return e?.message || fallback;
    if (typeof b === 'string') return b.length > 300 ? fallback : b;
    const lines: string[] = [];
    if (b.detail) lines.push(b.detail);
    if (b.errors && typeof b.errors === 'object') Object.entries(b.errors).forEach(([k, v]) => lines.push(`${k.replace(/_/g, ' ')}: ${v}`));
    if (Array.isArray(b.problems)) b.problems.slice(0, 8).forEach((p: any) => lines.push(p.message ? `${p.employee || p.employee_code || ''} ${p.date || ''}: ${p.message || (p.errors || []).join(' ')}`.trim() : JSON.stringify(p)));
    if (!lines.length) Object.entries(b).forEach(([k, v]) => lines.push(`${k}: ${Array.isArray(v) ? v.join(' ') : v}`));
    return lines.join('\n') || fallback;
  }
  /** Field errors of an API error ({field: message}). */
  static fieldErrors(e: any): Record<string, string> { return (e?.error?.errors as Record<string, string>) || {}; }
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(iso: string, n: number): string { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoDate(d); }
export function mondayOf(iso: string): string { const d = new Date(iso + 'T00:00:00'); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return isoDate(d); }
export function niceDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
