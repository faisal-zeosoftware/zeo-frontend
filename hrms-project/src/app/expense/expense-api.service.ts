import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

/** Base path of the module pages (routes are registered under 'expense-options'). */
export const EXPENSE_BASE = '/main-sidebar/expense-options';

/** Expense API (/expense/api/...) with ?schema=<selected company>. */
@Injectable({ providedIn: 'root' })
export class ExpenseApiService {
  constructor(private http: HttpClient, private rec: ZRecordService) {}

  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`;
    });
    return `${this.rec.api}/expense/api/${path}?${q}`;
  }

  get<T = any>(path: string, query: Record<string, any> = {}): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.url(path, query)));
  }

  post<T = any>(path: string, body: any = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(path), body));
  }

  patch<T = any>(path: string, body: any = {}): Promise<T> {
    return firstValueFrom(this.http.patch<T>(this.url(path), body));
  }

  delete(path: string): Promise<any> {
    return firstValueFrom(this.http.delete(this.url(path)));
  }

  /** CSV of the accounting export as a download. */
  async download(path: string, query: Record<string, any>, filename: string): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(path, query), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
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

export const money = (v: any): string =>
  'AED ' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const STATUS_LABEL: Record<string, string> = {
  unreported: 'Unreported', draft: 'Draft', submitted: 'Awaiting approval', approved: 'Approved', rejected: 'Rejected',
  sent_back: 'Sent back', reimbursed: 'Reimbursed', pending: 'Pending', waiting: 'Waiting', skipped: 'Skipped',
};

export const isImage = (url: string | null | undefined): boolean => !!url && /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);
