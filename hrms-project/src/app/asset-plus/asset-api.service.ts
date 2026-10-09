import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

/** Base path of the Assets pages (routes registered under 'asset-plus'). v1.12.0 */
export const ASSET_BASE = '/main-sidebar/asset-plus';

/** AssetPlus API (/asset-plus/api/...) with ?schema=<selected company>. */
@Injectable({ providedIn: 'root' })
export class AssetApiService {
  private lookupCache: Promise<any> | null = null;

  constructor(private http: HttpClient, private rec: ZRecordService) {}

  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`;
    });
    return `${this.rec.api}/asset-plus/api/${path}?${q}`;
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

  /** Employees, branches, departments, types and the user's asset rights (cached per page load). */
  lookups(refresh = false): Promise<any> {
    if (!this.lookupCache || refresh) this.lookupCache = this.get('lookups/').catch(e => { this.lookupCache = null; throw e; });
    return this.lookupCache;
  }

  /** FormData from a plain object (arrays / objects as JSON) plus files. */
  static form(data: Record<string, any>, files: Record<string, File | File[] | null | undefined> = {}): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    Object.entries(files).forEach(([k, f]) => {
      if (!f) return;
      (Array.isArray(f) ? f : [f]).forEach(x => fd.append(k, x, x.name));
    });
    return fd;
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

export const money = (v: any, cur = 'AED'): string =>
  `${cur} ` + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const STATUS_LABEL: Record<string, string> = {
  available: 'Available', assigned: 'Assigned', maintenance: 'Under maintenance', disposed: 'Disposed', lost: 'Lost / stolen',
  pending: 'Waiting for approval', approved: 'Approved', completed: 'Completed', rejected: 'Rejected', cancelled: 'Cancelled',
  requested: 'Return requested', reported: 'Waiting for approval', recovering: 'Being recovered', closed: 'Closed', open: 'Open',
  accepted: 'Confirmed', disputed: 'Confirmed with remarks', not_required: 'Not required', deducted: 'Deducted', final_settlement: 'In final settlement',
};

export const STATUS_CLASS: Record<string, string> = {
  available: 'approved', assigned: 'reimbursed', maintenance: 'pending', disposed: 'draft', lost: 'rejected',
  pending: 'pending', reported: 'pending', requested: 'pending', open: 'pending', approved: 'approved', completed: 'approved', accepted: 'approved',
  recovering: 'submitted', closed: 'closed', deducted: 'closed', rejected: 'rejected', cancelled: 'draft', disputed: 'sent_back', not_required: 'draft',
  final_settlement: 'closed',
};

export const CONDITIONS = [
  { value: 'healthy', label: 'Healthy' }, { value: 'minor_damage', label: 'Minor damage' }, { value: 'major_damage', label: 'Major damage' },
];

export const EVENT_ICON: Record<string, string> = {
  created: 'add_circle', edited: 'edit', requested: 'shopping_cart', request_approved: 'thumb_up', request_rejected: 'thumb_down',
  allocated: 'assignment_ind', acknowledged: 'verified', allocation_updated: 'event', transfer_requested: 'swap_horiz', transferred: 'swap_horiz',
  transfer_rejected: 'block', transfer_cancelled: 'block', return_requested: 'keyboard_return', return_cancelled: 'block', returned: 'keyboard_return',
  maintenance_started: 'build', maintenance_done: 'build_circle', maintenance_cancelled: 'build', schedule_added: 'event_repeat', schedule_removed: 'event_busy',
  damaged: 'report_problem', damage_approved: 'gavel', damage_rejected: 'block', lost: 'location_off', loss_approved: 'gavel', loss_rejected: 'block',
  investigation: 'policy', found: 'location_on', recovered: 'payments', disposal_requested: 'delete_sweep', disposed: 'delete_forever',
  disposal_rejected: 'block', disposal_cancelled: 'block', file_added: 'attach_file', file_removed: 'attach_file', clearance_waived: 'how_to_reg',
};

export const isImage = (url: string | null | undefined): boolean => !!url && /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);
export const today = (): string => new Date().toISOString().slice(0, 10);
export const firstOfMonth = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
