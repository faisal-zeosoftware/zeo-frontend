import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Lookup } from './page-config';

/** Thin HTTP wrapper: adds the base URL and ?schema=<selected company> to every call. */
@Injectable({ providedIn: 'root' })
export class ModuleApiService {
  private base = `${environment.apiBaseUrl}`;
  private lookupCache = new Map<string, Observable<{ value: any; label: string }[]>>();

  constructor(private http: HttpClient) {}

  get schema(): string {
    return localStorage.getItem('selectedSchema') || '';
  }

  private params(extra?: Record<string, any>): HttpParams {
    let p = new HttpParams().set('schema', this.schema);
    Object.entries(extra || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        p = p.set(k, String(v));
      }
    });
    return p;
  }

  list<T = any>(endpoint: string, query?: Record<string, any>): Observable<T[]> {
    return this.http.get<any>(this.base + endpoint, { params: this.params(query) }).pipe(
      map(r => (Array.isArray(r) ? r : r?.results ?? []))
    );
  }

  get<T = any>(endpoint: string, query?: Record<string, any>): Observable<T> {
    return this.http.get<T>(this.base + endpoint, { params: this.params(query) });
  }

  create<T = any>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(this.base + endpoint, body, { params: this.params() });
  }

  update<T = any>(endpoint: string, id: any, body: any): Observable<T> {
    return this.http.patch<T>(`${this.base}${endpoint}${id}/`, body, { params: this.params() });
  }

  remove(endpoint: string, id: any): Observable<any> {
    return this.http.delete(`${this.base}${endpoint}${id}/`, { params: this.params() });
  }

  /** POST/GET <endpoint>[<id>/]<action>/ */
  action<T = any>(endpoint: string, id: any | null, action: string, body: any = {}, method: 'post' | 'get' = 'post'): Observable<T> {
    const url = id !== null && id !== undefined ? `${this.base}${endpoint}${id}/${action}/` : `${this.base}${endpoint}${action}/`;
    return method === 'get'
      ? this.http.get<T>(url, { params: this.params(body) })
      : this.http.post<T>(url, body, { params: this.params() });
  }

  /** Options for select boxes; cached per page load. */
  lookup(l: Lookup): Observable<{ value: any; label: string }[]> {
    const key = l.endpoint + JSON.stringify(l.params || {}) + String(l.label);
    if (!this.lookupCache.has(key)) {
      const obs = this.list(l.endpoint, l.params).pipe(
        map(rows => rows.map(r => ({
          value: r[l.value || 'id'],
          label: typeof l.label === 'function' ? l.label(r) : (r[l.label] ?? r.id),
        }))),
        shareReplay(1)
      );
      this.lookupCache.set(key, obs);
    }
    return this.lookupCache.get(key) || of([]);
  }

  clearLookups(): void {
    this.lookupCache.clear();
  }

  /** DRF error body -> readable lines */
  static errorText(err: any): string {
    const e = err?.error;
    if (!e) return err?.message || 'Request failed.';
    if (typeof e === 'string') return e.length > 300 ? 'Request failed (' + err.status + ').' : e;
    const lines: string[] = [];
    const walk = (obj: any, prefix = '') => {
      if (Array.isArray(obj)) obj.forEach(v => (typeof v === 'object' ? walk(v, prefix) : lines.push(prefix + v)));
      else if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => walk(v, k === 'detail' || k === 'non_field_errors' ? prefix : `${prefix}${k.replace(/_/g, ' ')}: `));
      } else if (obj !== undefined) lines.push(prefix + obj);
    };
    walk(e);
    return lines.join('\n') || 'Request failed.';
  }
}

/** Common lookups reused across the three modules. */
export const LOOKUPS = {
  employees: { endpoint: '/employee/api/emplist/', label: (r: any) => `${[r.emp_first_name, r.emp_last_name].filter(Boolean).join(' ')} (${r.emp_code})` } as Lookup,
  departments: { endpoint: '/organisation/api/Department/', label: 'dept_name' } as Lookup,
  designations: { endpoint: '/organisation/api/Designation/', label: 'desgntn_job_title' } as Lookup,
  branches: { endpoint: '/organisation/api/Branch/', label: 'branch_name' } as Lookup,
  categories: { endpoint: '/organisation/api/Catogory/', label: 'ctgry_title' } as Lookup,
  users: { endpoint: '/users/api/user/', label: (r: any) => r.username || r.email } as Lookup,
  nationalities: { endpoint: '/core/api/Nationality/', label: 'N_name' } as Lookup,
};
