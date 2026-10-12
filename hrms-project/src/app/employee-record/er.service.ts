/**
 * v1.19.0 – Employee Master in the new design: API helper and shared helpers for the employee list and the employee page.
 * Backend: EmployeeProfile/record.py (record, directory, duplicates, lookups) and EmployeeProfile change / identity / employment APIs.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

export const ER_LIST = '/main-sidebar/sub-sidebar/employee-master';
export const erPage = (id: number) => `/main-sidebar/sub-sidebar/employee-details/${id}/details`;

export interface ErField { key: string; label: string; type: string; options?: { value: any; label: string }[]; source?: string; placeholder?: string; dir?: string; }
export interface ErGroup { key: string; label: string; many: boolean; fields: ErField[]; }

@Injectable({ providedIn: 'root' })
export class ErService {
  private look: Promise<any> | null = null;
  private lookSchema = '';
  constructor(private http: HttpClient, private rec: ZRecordService) {}

  get schema(): string { return localStorage.getItem('selectedSchema') || ''; }
  url(path: string, q: Record<string, any> = {}): string {
    let s = `schema=${encodeURIComponent(this.schema)}`;
    Object.entries(q).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') { s += `&${k}=${encodeURIComponent(String(v))}`; } });
    return `${this.rec.api}/${path}${path.includes('?') ? '&' : '?'}${s}`;
  }
  get<T = any>(path: string, q: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(path, q))); }
  post<T = any>(path: string, body: any): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path), body)); }
  put<T = any>(path: string, body: any): Promise<T> { return firstValueFrom(this.http.put<T>(this.url(path), body)); }
  patch<T = any>(path: string, body: any): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(path), body)); }
  del<T = any>(path: string): Promise<T> { return firstValueFrom(this.http.delete<T>(this.url(path))); }
  /** Download a file through the API (keeps the login header) and open it. */
  async open(path: string, name = 'file.pdf'): Promise<void> {
    const b = await firstValueFrom(this.http.get(this.url(path.replace(/^\//, '')), { responseType: 'blob' }));
    const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(u), 30000);
  }

  lookups(): Promise<any> {
    if (!this.look || this.lookSchema !== this.schema) {
      this.lookSchema = this.schema;
      this.look = this.get('employee-profile/api/record-lookups/');
      this.look.catch(() => (this.look = null));
    }
    return this.look;
  }

  /** Options of a field: its own choices, or the look-up list its source points to. */
  options(f: ErField, look: any): { value: any; label: string }[] {
    if (f.options) { return f.options; }
    const map: Record<string, string> = { 'Core.Nationality': 'nationalities', 'Core.ReligionMaster': 'religions', 'Core.cntry_mstr': 'countries',
      'Core.state_mstr': 'states', 'EmpManagement.document_type': 'document_types' };
    return (look && f.source && look[map[f.source]]) || [];
  }

  /** Readable DRF error: the detail, or "Field: message" lines. */
  static error(e: any, fallback = 'It could not be saved.'): string {
    const d = e?.error;
    if (!d) { return fallback; }
    if (typeof d === 'string') { return d.slice(0, 300); }
    if (d.detail) { return String(d.detail); }
    const out: string[] = [];
    Object.entries(d).forEach(([k, v]) => out.push(`${k.replace(/^emp_|_id$/g, '').replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`));
    return out.join('\n') || fallback;
  }
  /** Field → message of a DRF error, for messages under the fields. */
  static fieldErrors(e: any): Record<string, string> {
    const d = e?.error, out: Record<string, string> = {};
    if (d && typeof d === 'object') { Object.entries(d).forEach(([k, v]) => { if (k !== 'detail') { out[k] = Array.isArray(v) ? v.join(' ') : String(v); } }); }
    return out;
  }
}

// ------------------------------------------------------------------ formatting helpers (design rules)
export function money(v: any, cur = 'AED'): string {
  if (v === null || v === undefined || v === '') { return '–'; }
  const n = Number(v);
  return isNaN(n) ? String(v) : `${cur} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export function num(v: any): string {
  const n = Number(v);
  return v === null || v === undefined || v === '' || isNaN(n) ? '–' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 12 May 1990 */
export function dmy(v: any): string {
  if (!v) { return '–'; }
  const s = String(v).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) { return String(v); }
  return `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}`;
}
export function badgeClass(b: any): string {
  if (!b) { return ''; }
  return { valid: 'ok', amber: 'warn', red: 'bad', expired: 'dead' }[b.level as string] || '';
}
export const AVATAR = ['#5B4FE0', '#2E9D6A', '#B8730F', '#3A8FD6', '#C4479A', '#D64550', '#1B1640', '#0F8C8C'];
export function avatarColour(seed: string): string {
  let h = 0; for (const c of seed || '') { h = (h * 31 + c.charCodeAt(0)) >>> 0; }
  return AVATAR[h % AVATAR.length];
}

// ------------------------------------------------------------------ input masks (official formats)
/** Emirates ID 784-YYYY-NNNNNNN-N */
export function maskEid(v: string): string {
  const d = (v || '').replace(/\D/g, '').slice(0, 15);
  const p = [d.slice(0, 3), d.slice(3, 7), d.slice(7, 14), d.slice(14, 15)].filter(x => x);
  return p.join('-');
}
/** IBAN: AE + 21 digits, shown in groups of four */
export function maskIban(v: string): string {
  const s = (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 23);
  return s.replace(/(.{4})/g, '$1 ').trim();
}
/** MOHRE person code: 14 characters */
export function maskPersonCode(v: string): string { return (v || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14); }
export function maskFor(key: string): ((v: string) => string) | null {
  if (key === 'emirates_id') { return maskEid; }
  if (key === 'iban_number') { return maskIban; }
  if (key === 'person_id') { return maskPersonCode; }
  if (key === 'route_code') { return (v: string) => (v || '').replace(/\D/g, '').slice(0, 9); }
  return null;
}
