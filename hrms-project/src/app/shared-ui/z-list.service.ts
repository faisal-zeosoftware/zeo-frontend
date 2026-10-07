import { Injectable, InjectionToken, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, concatMap, map, shareReplay, tap } from 'rxjs/operators';
import { checkValue } from './field-types';
import { environment } from '../../environments/environment';

export interface DirEmp {
  id: number; code: string; name: string;
  branch_id: number; branch: string; department_id: number; department: string;
  designation_id: number; designation: string; category_id: number; category: string;
}

/** Token for the record service (avoids an import cycle). */
export const ZRecordServiceToken = new InjectionToken<any>('ZRecordService');

export interface RecordedList { url: string; path: string; route: string; items: any[]; at: number; }

/**
 * Shared state for the list toolbar (z-list directive) and the employee pickers:
 * - remembers which list APIs each screen loaded (so Import knows where rows go);
 * - one cached employee directory (branch, department, designation, category);
 * - the user's permission codenames (menus, import / export buttons).
 */
@Injectable({ providedIn: 'root' })
export class ZListService {
  readonly api = environment.apiBaseUrl;
  private recorded: RecordedList[] = [];
  private dir$?: Observable<DirEmp[]>;
  private dirSchema = '';
  private perms$?: Observable<{ admin: boolean; codes: Set<string> }>;
  private permsSchema = '';

  constructor(readonly http: HttpClient) {}

  get schema(): string { return localStorage.getItem('selectedSchema') || ''; }

  // ---------- list APIs the current screen loaded ----------
  record(url: string, body: any): void {
    const items = Array.isArray(body) ? body : (body && Array.isArray(body.results) ? body.results : null);
    if (!items) { return; }
    const path = url.replace(this.api, '').split('?')[0];
    if (/\/(tools|dashboard)\/|permissions\/|notification/i.test(path)) { return; }
    const route = location.pathname;
    this.recorded = this.recorded.filter(r => !(r.path === path && r.route === route));
    this.recorded.push({ url, path, route, items: items.slice(0, 300), at: Date.now() });
    if (this.recorded.length > 60) { this.recorded.splice(0, this.recorded.length - 60); }
  }

  /** Lists the current screen loaded (newest last). */
  recordedLists(): RecordedList[] {
    const route = location.pathname;
    return this.recorded.filter(r => r.route === route);
  }

  /** Best matching list API for the rows shown in a table (by comparing cell text with API values). */
  endpointFor(rowTexts: string[][]): string | null {
    const route = location.pathname;
    const cands = this.recorded.filter(r => r.route === route && r.items.length);
    if (!cands.length || !rowTexts.length) { return null; }
    const sample = rowTexts.slice(0, 40);
    let best: RecordedList | null = null; let bestScore = 0;
    for (const c of cands) {
      const vals = new Set<string>();
      for (const it of c.items.slice(0, 300)) {
        for (const v of Object.values(it || {})) {
          if (v !== null && v !== undefined && typeof v !== 'object' && String(v).trim().length > 1) { vals.add(String(v).trim().toLowerCase()); }
        }
      }
      let hit = 0;
      for (const row of sample) {
        const n = row.filter(t => t && vals.has(t.trim().toLowerCase())).length;
        if (n >= Math.min(2, row.filter(Boolean).length)) { hit++; }
      }
      const score = hit / sample.length + Math.min(c.items.length, rowTexts.length) / Math.max(c.items.length, rowTexts.length, 1) * 0.2;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    return best && bestScore >= 0.45 ? best.path : null;
  }

  // ---------- employee directory ----------
  directory(): Observable<DirEmp[]> {
    const s = this.schema;
    if (!this.dir$ || this.dirSchema !== s) {
      this.dirSchema = s;
      this.dir$ = this.http.get<DirEmp[]>(`${this.api}/tools/api/directory/?schema=${s}`).pipe(
        catchError(() => of([] as DirEmp[])), shareReplay(1));
    }
    return this.dir$;
  }

  // ---------- permissions ----------
  permissions(): Observable<{ admin: boolean; codes: Set<string> }> {
    const s = this.schema;
    if (!this.perms$ || this.permsSchema !== s) {
      this.permsSchema = s;
      this.perms$ = this.http.get<any[]>(`${this.api}/organisation/api/permissions/?schema=${s}`).pipe(
        map(list => {
          const me = this.userId();
          const all = Array.isArray(list) ? list : [];
          const p = all.find(x => me !== null && Number(x.profile) === me) || (all.length === 1 ? all[0] : {});
          const codes = new Set<string>();
          (p.groups || []).forEach((g: any) => (g.permissions || []).forEach((x: any) => codes.add(x.codename)));
          // only superusers receive other people's rows from this API
          const admin = !!p.is_superuser || (all.length > 1 && !all.some(x => me !== null && Number(x.profile) === me));
          return { admin, codes };
        }),
        catchError(() => of({ admin: false, codes: new Set<string>() })), shareReplay(1));
    }
    return this.perms$;
  }

  /** Logged-in user id from the JWT (no extra request). */
  userId(): number | null {
    try {
      const tok = localStorage.getItem('auth_token') || '';
      const body = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return Number(body.user_id ?? body.id ?? null);
    } catch { return null; }
  }

  // ---------- import ----------
  fields(endpoint: string): Observable<any> {
    return this.http.get(`${this.api}/tools/api/fields/?endpoint=${encodeURIComponent(endpoint)}&schema=${this.schema}`);
  }

  importRows(endpoint: string, rows: any[], dryRun: boolean): Observable<any> {
    return this.http.post(`${this.api}/tools/api/import/?schema=${this.schema}`, { endpoint, rows, dry_run: dryRun });
  }
}

/**
 * Watches the screens' API calls:
 * - records list responses (Import, row → record);
 * - tells the record panel which record a form belongs to;
 * - extra designer fields: blocks a save while a required one is empty, and saves them after the screen's own save;
 * - shows duplicate / access messages from the server on every screen.
 */
@Injectable()
export class ZListRecorderInterceptor implements HttpInterceptor {
  constructor(private z: ZListService, private injector: Injector) {}

  private get rec(): any {
    // lazy: the record service also uses HttpClient
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return this.injector.get(ZRecordServiceToken, null);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const rec = this.rec;
    if (req.method !== 'GET') {
      const forms = rec && ['POST', 'PUT', 'PATCH'].includes(req.method) ? rec.formsFor(req.method, req.url) : [];
      for (const f of forms) {
        const errs = f.fields.map((d: any) => checkValue(d, f.values[d.name])).filter(Boolean);
        if (errs.length) {
          f.onError(errs.join(' '));
          const err = new HttpErrorResponse({ status: 400, url: req.url, error: { detail: errs.join(' ') } });
          this.notify(err, true);
          return throwError(() => err);
        }
      }
      const snap = forms.map((f: any) => ({ f, values: { ...f.values } }));
      return next.handle(req).pipe(
        tap(ev => {
          if (ev instanceof HttpResponse && rec) {
            try { rec.seen(req.method, req.url, ev.body, true); } catch { /* never break the screen */ }
          }
        }),
        // the screen gets its answer only after the extra fields are stored (many screens reload right away)
        concatMap(ev => ev instanceof HttpResponse && snap.length && ev.ok
          ? from(this.saveExtras(rec, req, ev.body, snap)).pipe(map(() => ev))
          : of(ev)),
        catchError((err: any) => {
          if (err instanceof HttpErrorResponse && !req.url.includes('/tools/api/') && !req.url.includes('/chatter/api/')) { this.notify(err); }
          return throwError(() => err);
        }));
    }
    return next.handle(req).pipe(tap(ev => {
      if (ev instanceof HttpResponse) {
        try { this.z.record(req.urlWithParams, ev.body); } catch { /* never break the screen */ }
        try { rec?.seen('GET', req.url, ev.body, true); } catch { /* never break the screen */ }
      }
    }));
  }

  /** After the screen saved its record: store the extra field values of the form(s) that belong to it. */
  private async saveExtras(rec: any, req: HttpRequest<any>, body: any, snap: { f: any; values: any }[]): Promise<void> {
    const path = req.url.replace(this.z.api, '').split('?')[0];
    const m = /^(.*\/)(\d+)\/?$/.exec(path);
    let endpoint = m ? m[1] : (path.endsWith('/') ? path : path + '/');
    let id: string | null = m ? m[2] : (body && typeof body === 'object' && body.id !== undefined ? String(body.id) : null);
    if (!id && body && typeof body === 'object') {
      const inner = body.data || body.result || body.employee || null;
      if (inner && inner.id !== undefined) { id = String(inner.id); }
    }
    if (!id) {  // the screen's API does not return the new record: take the newest one of the list
      try {
        const list: any = await new Promise((res, rej) => this.z.http.get(`${this.z.api}${endpoint}?schema=${this.z.schema}`).subscribe({ next: res, error: rej }));
        const items: any[] = Array.isArray(list) ? list : (list?.results || []);
        const ids = items.map(i => Number(i?.id)).filter(n => !isNaN(n));
        if (ids.length) { id = String(Math.max(...ids)); }
      } catch { /* leave it */ }
    }
    for (const { f, values } of snap) {
      if (!id) { this.toastMsg('The extra fields could not be saved: the screen did not return the new record.', true); return; }
      const has = Object.values(values).some(v => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length));
      try {
        if (has) {
          const ready = await rec.resolveFiles(endpoint, id, values);
          await new Promise((res, rej) => rec.saveValues(endpoint, id, ready).subscribe({ next: res, error: rej }));
        }
        f.onSaved(endpoint, id);
      } catch (e: any) {
        const msg = e?.error?.detail || 'The extra fields were not saved.';
        f.onError(msg); this.toastMsg(msg, true);
      }
    }
  }

  private toastMsg(msg: string, bad = false): void {
    const t = document.createElement('div');
    t.className = 'zl-toast' + (bad ? ' bad' : ''); t.setAttribute('role', 'alert'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 6000);
  }

  private notify(err: HttpErrorResponse, force = false): void {
    const msgs: string[] = [];
    const walk = (v: any) => {
      if (typeof v === 'string') { msgs.push(v); } else if (Array.isArray(v)) { v.forEach(walk); } else if (v && typeof v === 'object') { Object.values(v).forEach(walk); }
    };
    walk(err.error);
    const show = force ? msgs : msgs.filter(m => /already exists|only (raise|work|delete|change)|do not have (permission|access)|not have access/i.test(m));
    if (!show.length) { return; }
    const t = document.createElement('div');
    t.className = 'zl-toast bad'; t.setAttribute('role', 'alert');
    t.textContent = Array.from(new Set(show)).slice(0, 3).join('\n');
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 6000);
  }
}
