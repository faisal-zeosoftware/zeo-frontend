import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * v1.13.0 – Employee master extras API (EmployeeProfile app, /employee-profile/api/).
 * One cached profile per employee (refreshed after every save) so the tabs of the employee page share one request.
 */
@Injectable({ providedIn: 'root' })
export class EmployeeProfileService {
  readonly api = `${environment.apiBaseUrl}/employee-profile/api/`;
  private cache = new Map<string, { at: number; p: Promise<any> }>();

  constructor(private http: HttpClient) {}

  get schema(): string { return localStorage.getItem('selectedSchema') || ''; }
  q(extra = ''): string { return `?schema=${encodeURIComponent(this.schema)}${extra}`; }
  url(path: string, extra = ''): string { return `${this.api}${path}${this.q(extra)}`; }

  get<T = any>(path: string, extra = ''): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(path, extra))); }
  put<T = any>(path: string, body: any): Promise<T> { return firstValueFrom(this.http.put<T>(this.url(path), body)); }
  post<T = any>(path: string, body: any, extra = ''): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path, extra), body)); }
  del<T = any>(path: string): Promise<T> { return firstValueFrom(this.http.delete<T>(this.url(path))); }

  /** whole profile of an employee (identity, contacts, dependants, bank, qualifications, employment, skills, completeness) */
  profile(id: number | string, fresh = false): Promise<any> {
    const key = `${this.schema}|${id}`;
    const c = this.cache.get(key);
    if (!fresh && c && Date.now() - c.at < 15000) { return c.p; }
    const p = this.get(`profile/${id}/`);
    this.cache.set(key, { at: Date.now(), p });
    p.catch(() => this.cache.delete(key));
    return p;
  }

  forget(id: number | string): void { this.cache.delete(`${this.schema}|${id}`); }

  private lookups = new Map<string, Promise<{ id: number; name: string }[]>>();
  /** countries / nationalities for the drop-downs (cached) */
  lookup(kind: 'countries' | 'nationalities'): Promise<{ id: number; name: string }[]> {
    if (!this.lookups.has(kind)) {
      const path = kind === 'countries' ? 'Country' : 'Nationality';
      const p = firstValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/core/api/${path}/${this.q()}`)).then((r: any) =>
        (Array.isArray(r) ? r : r?.results || []).map((x: any) => ({ id: x.id, name: x.country_name || x.N_name || '' }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name)));
      p.catch(() => this.lookups.delete(kind));
      this.lookups.set(kind, p);
    }
    return this.lookups.get(kind)!;
  }

  /** field errors of a failed request as one readable line + a field map */
  errors(e: any, fallback = 'The change could not be saved.'): { text: string; fields: Record<string, string> } {
    const err = e?.error;
    const fields: Record<string, string> = {};
    if (err && typeof err === 'object' && !Array.isArray(err)) {
      for (const [k, v] of Object.entries(err)) { fields[k] = Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : String(v); }
    }
    const text = fields['detail'] || Object.values(fields).join(' ') || (e?.status === 403 ? 'You do not have permission to do this.' : fallback);
    return { text, fields };
  }
}

/** Luhn check of a 15-digit Emirates ID (784-YYYY-NNNNNNN-N) – the server checks the same */
export function eidProblem(v: string): string {
  const s = (v || '').replace(/[\s-]/g, '');
  if (!s) { return ''; }
  if (!/^\d{15}$/.test(s)) { return 'Enter the Emirates ID as 784-YYYY-NNNNNNN-N (15 digits).'; }
  if (!s.startsWith('784')) { return 'An Emirates ID starts with 784.'; }
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(s[14 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) { d -= 9; } }
    sum += d;
  }
  return sum % 10 === 0 ? '' : 'This Emirates ID number is not valid (the last digit does not match).';
}

/** UAE IBAN check (AE + 21 digits, mod-97) */
export function ibanProblem(v: string): string {
  const s = (v || '').replace(/\s+/g, '').toUpperCase();
  if (!s) { return ''; }
  if (!s.startsWith('AE')) { return 'Enter a UAE IBAN – it starts with AE.'; }
  if (s.length !== 23 || !/^\d+$/.test(s.slice(2))) { return `A UAE IBAN has 23 characters (AE + 21 digits); this one has ${s.length}.`; }
  const moved = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of moved) {
    const n = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of n) { rem = (rem * 10 + Number(d)) % 97; }
  }
  return rem === 1 ? '' : 'This IBAN is not valid (the check digits do not match).';
}

export const STATUS_LABEL: Record<string, string> = {
  active: 'Active', probation: 'On probation', on_notice: 'On notice', left: 'Left', terminated: 'Terminated', absconded: 'Absconded', retired: 'Retired',
};
