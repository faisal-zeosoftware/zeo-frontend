import { Injectable } from '@angular/core';
import { dmy } from '../shared-ui/z-present';   // v1.62.0 ui
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/** v1.18.0 – the business apps built on the ZEO app kit. Each app is installed on its own; links appear when the others are there. */
export const ZA_APPS: Record<string, { title: string; icon: string }> = {
  'zeo-crm': { title: 'CRM', icon: 'handshake' },
  'zeo-property': { title: 'Property', icon: 'apartment' },
  'zeo-maintenance': { title: 'Maintenance', icon: 'build' },
  'zeo-assets': { title: 'Asset Management', icon: 'inventory_2' },   // v1.33.0
  'zeo-people': { title: 'People', icon: 'diversity_3' },   // v1.36.0
  'zeo-masters': { title: 'Business partners', icon: 'diversity_2' },   // v1.41.0 shared masters under every business app
  'zeo-hr': { title: 'HR operations', icon: 'gavel' },   // v1.48.0
};

/** The app (slug) of a page URL: /main-sidebar/zeo-crm/... → zeo-crm. */
export function appOf(url: string): string {
  const m = /\/(zeo-crm|zeo-property|zeo-maintenance|zeo-assets|zeo-people|zeo-masters|zeo-hr)(\/|$|\?)/.exec(url || '');
  return m ? m[1] : 'zeo-crm';
}

export const base = (slug: string): string => `/main-sidebar/${slug}`;

/** API of one kit app: /<slug>/api/... with ?schema=<selected company>. */
export class ZaClient {
  private cache: Record<string, Promise<any> | null> = {};
  constructor(private http: HttpClient, public slug: string, private schemaFn: () => string) {}
  get schema(): string { return this.schemaFn(); }

  url(path: string, query: Record<string, any> = {}): string {
    let q = `schema=${encodeURIComponent(this.schema)}`;
    Object.entries(query).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') q += `&${k}=${encodeURIComponent(String(v))}`; });
    return `${environment.apiBaseUrl}/${this.slug}/api/${path}${path.includes('?') ? '&' : '?'}${q}`;
  }
  get<T = any>(path: string, query: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(path, query))); }
  post<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(path), body)); }
  patch<T = any>(path: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(path), body)); }
  del<T = any>(path: string): Promise<T> { return firstValueFrom(this.http.delete<T>(this.url(path))); }

  private cached(key: string, path: string, refresh: boolean): Promise<any> {
    const k = this.schema + ':' + key;
    if (!this.cache[k] || refresh) this.cache[k] = this.get(path).catch(e => { this.cache[k] = null; throw e; });
    return this.cache[k]!;
  }
  /** Activation, industry, rights, wording (terms), links to the other apps. */
  info(refresh = false): Promise<any> { return this.cached('app', 'app/', refresh); }
  registers(refresh = false): Promise<any[]> { return this.cached('regs', 'registers/', refresh); }
  options(name: string, refresh = false): Promise<any[]> { return this.cached('opt:' + name, `options/${name}/`, refresh); }
  clear(): void { this.cache = {}; }

  /** v1.33.0: a file from the API as a Blob (PDF labels, floor plan images). */
  blob(path: string, query: Record<string, any> = {}): Promise<Blob> { return firstValueFrom(this.http.get(this.url(path, query), { responseType: 'blob' })); }

  async file(path: string, name: string, query: Record<string, any> = {}): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(path, query), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  download(fileId: number, name: string): Promise<void> { return this.file(`files/${fileId}/`, name); }
}

@Injectable({ providedIn: 'root' })
export class ZaApiService {
  private clients: Record<string, ZaClient> = {};
  constructor(private http: HttpClient) {}
  get schema(): string { return localStorage.getItem('selectedSchema') || ''; }
  for(slug: string): ZaClient {
    return this.clients[slug] ||= new ZaClient(this.http, slug, () => this.schema);
  }

  static form(data: Record<string, any>, files: File[] = [], key = 'files'): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v)); });
    files.forEach(f => fd.append(key, f, f.name));
    return fd;
  }

  static error(e: any, fallback = 'It could not be done.'): string {
    const b = e?.error;
    if (!b) return e?.message || fallback;
    if (typeof b === 'string') return b.length > 300 ? fallback : b;
    if (b.detail) return b.detail;
    return Object.entries(b).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n') || fallback;
  }
}

export function when(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : dmy(d, true);   // v1.62.0 ui: dd/mm/yyyy HH:mm
}
export function day(v: any): string {
  if (!v) return '';
  const d = new Date(String(v).length <= 10 ? v + 'T00:00:00' : v);
  return isNaN(d.getTime()) ? String(v) : dmy(d);   // v1.62.0 ui: dd/mm/yyyy (was "27 Sept 2026")
}
export const today = (): string => new Date().toISOString().slice(0, 10);
export const money = (v: any): string => (v === null || v === undefined || v === '') ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Status → badge colour class (za.css / hs-b). */
export function stClass(s: string): string {
  if (!s) return '';
  if (['found', 'confirmed', 'returned'].includes(s)) return 'ok';                       // v1.33.0 Asset Management
  if (['missing', 'damaged', 'disposed', 'reversed'].includes(s)) return 'bad';
  if (['cwip', 'review', 'misplaced', 'unexpected', 'requested'].includes(s)) return 'wait';
  if (['counting', 'checked_out', 'handed_over'].includes(s)) return 'work';
  if (['waiting', 'resolved'].includes(s)) return 'wait';   // v1.34.0
  if (['published', 'shared', 'given', 'ended'].includes(s)) return 'ok';   // v1.36.0 People
  if (['requested', 'submitted', 'nurture', 'collecting'].includes(s)) return 'wait';
  if (['declined', 'dropped'].includes(s)) return 'bad';
  if (['closed', 'approved', 'won', 'done', 'paid', 'cleared', 'settled', 'active', 'let', 'sold', 'signed', 'handed_over', 'accepted', 'posted', 'reviewed', 'available', 'converted', 'issued_ok', 'working', 'delivered', 'invoiced', 'qualified'].includes(s)) return 'ok';
  if (['lost', 'rejected', 'cancelled', 'bounced', 'void', 'expired', 'terminated', 'faulty', 'no_show', 'disqualified'].includes(s)) return 'bad';
  if (['approval', 'pending', 'to_review', 'quoting', 'notice', 'reserved', 'draft', 'scheduled', 'planned', 'sent', 'part_paid', 'on_hold', 'received', 'inspected', 'nurture'].includes(s)) return 'wait';
  if (['open', 'new', 'assigned', 'in_progress', 'deposited', 'issued', 'maintenance', 'confirmed', 'progress'].includes(s)) return 'work';
  return '';
}
