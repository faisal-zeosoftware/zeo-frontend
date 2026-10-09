import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/** Base path of the pages (registered as children of 'project-options'). */
export const PC_BASE = '/main-sidebar/project-options';

/** Project control API (/project-control/api/...) with ?schema=<selected company>. */
@Injectable({ providedIn: 'root' })
export class ProjectControlApiService {
  constructor(private http: HttpClient) {}

  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`;
    });
    return `${environment.apiBaseUrl}/project-control/api/${path}?${q}`;
  }

  get<T = any>(path: string, query: Record<string, any> = {}): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.url(path, query)));
  }

  post<T = any>(path: string, body: any = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(path), body));
  }

  put<T = any>(path: string, body: any = {}): Promise<T> {
    return firstValueFrom(this.http.put<T>(this.url(path), body));
  }

  /** Readable text of a DRF error. */
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

export const num = (v: any): number => Number(v || 0);
export const hrs = (v: any): string => {
  const n = Number(v || 0);
  return n ? (Math.round(n * 100) / 100).toString() : '0';
};
export const money = (v: any, cur = 'AED'): string =>
  cur + ' ' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (iso: string, n: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + n));
};
export const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', submitted: 'Waiting approval', approved: 'Approved', rejected: 'Rejected', mixed: 'Mixed', '': '',
};
