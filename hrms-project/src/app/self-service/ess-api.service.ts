import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

/** v1.13.0 – base path of the self-service pages (routes are registered under 'self-service'). */
export const ESS_BASE = '/main-sidebar/self-service';

/** API helper for /self-service/api/… and the other modules the ESS pages use (always with ?schema=<company>). */
@Injectable({ providedIn: 'root' })
export class EssApiService {
  private metaCache: Promise<any> | null = null;

  constructor(private http: HttpClient, private rec: ZRecordService) {}

  /** Full URL: `path` is relative to /self-service/api/ unless it starts with '/' (another module, e.g. '/calendars/api/…'). */
  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`;
    });
    const p = path.startsWith('/') ? path : `/self-service/api/${path}`;
    return `${this.rec.api}${p}${p.includes('?') ? '&' : '?'}${q}`;
  }

  get<T = any>(path: string, query: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(path, query))); }
  post<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path), body)); }
  put<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.put<T>(this.url(path), body)); }
  patch<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(path), body)); }
  delete(path: string): Promise<any> { return firstValueFrom(this.http.delete(this.url(path))); }

  /** Rights and lists for the screens (cached for the session). */
  meta(): Promise<any> {
    if (!this.metaCache) this.metaCache = this.get('meta/').catch(e => { this.metaCache = null; throw e; });
    return this.metaCache;
  }

  /** Authenticated file download (media is not public): opens / saves the blob. */
  async download(path: string, filename: string, open = false): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(path), { responseType: 'blob' }));
    const href = URL.createObjectURL(blob);
    if (open) {
      window.open(href, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(href), 20000);
  }

  /** Readable text of a DRF error. */
  static error(e: any, fallback = 'It could not be done. Please try again.'): string {
    const b = e?.error;
    if (!b) return e?.message || fallback;
    if (b instanceof Blob) return fallback;
    if (typeof b === 'string') return b.length > 300 ? fallback : b;
    if (b.detail && typeof b.detail === 'string') return b.detail;
    const lines: string[] = [];
    Object.entries(b).forEach(([k, v]) => {
      const text = Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
      lines.push(['detail', 'policy', 'non_field_errors', 'apply', 'data', 'request', 'status'].includes(k) ? text : `${k.replace(/_/g, ' ')}: ${text}`);
    });
    return lines.join('\n') || fallback;
  }
}

export const money = (v: any): string =>
  'AED ' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const POLICY_LABEL: Record<string, string> = {
  self: 'You can change this', request: 'Change needs HR approval', hr: 'Kept by HR', hidden: 'Not shown',
};
