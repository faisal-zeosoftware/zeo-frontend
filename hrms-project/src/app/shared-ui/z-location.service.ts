import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/** v1.30.0 – Location level: the user's locations (grouped by branch), the ticked ones (list filter) and the working
 *  location (default for new records, document numbering). Sent to the API on every call as X-Zeo-Locations /
 *  X-Zeo-Location. Everything is a no-op while location-level control is off in Settings › Organisation. */
export interface ZLocation { id: number; code: string; name: string; branch_id: number | null; branch_name: string; is_default: boolean; }
export interface ZLocationState {
  enabled: boolean; required: boolean; numbering: boolean; restrict: boolean; label: string;
  locations: ZLocation[]; allowed: number[] | null; current: number | null; own: number | null;
}
const EMPTY: ZLocationState = { enabled: false, required: false, numbering: false, restrict: false, label: 'Location', locations: [], allowed: null, current: null, own: null };
const K_SEL = 'zeoLocSel', K_CUR = 'zeoLocCur';

@Injectable({ providedIn: 'root' })
export class ZLocationService {
  private state = new BehaviorSubject<ZLocationState>(EMPTY);
  readonly state$ = this.state.asObservable();
  private selected = new BehaviorSubject<number[]>(this.read(K_SEL));
  readonly selected$ = this.selected.asObservable();
  private current = new BehaviorSubject<number | null>(this.readOne(K_CUR));
  readonly current$ = this.current.asObservable();
  private loadedFor = '';

  constructor(private http: HttpClient) {}

  get snapshot(): ZLocationState { return this.state.value; }
  get enabled(): boolean { return this.state.value.enabled; }
  get selectedIds(): number[] { return this.selected.value; }
  get currentId(): number | null { return this.current.value; }
  get currentName(): string { const c = this.currentId; return this.state.value.locations.find(l => l.id === c)?.name || ''; }

  /** reload after login / company switch (schema = the selected company) */
  load(schema: string | null, force = false): Observable<ZLocationState> {
    if (!schema) { this.state.next(EMPTY); return of(EMPTY); }
    if (!force && this.loadedFor === schema) { return of(this.state.value); }
    this.loadedFor = schema;
    return this.http.get<ZLocationState>(`${environment.apiBaseUrl}/org-structure/api/my-locations/`, { params: { schema } }).pipe(
      tap(s => {
        s = { ...EMPTY, ...s };
        this.state.next(s);
        if (!s.enabled) { return; }
        const ids = new Set(s.locations.map(l => l.id));
        // keep only locations the user still has; nothing ticked = all of them
        const sel = this.selected.value.filter(i => ids.has(i));
        this.setSelected(sel, false);
        let cur = this.current.value;
        if (cur == null || !ids.has(cur) || (sel.length && !sel.includes(cur))) {
          cur = s.current && ids.has(s.current) && (!sel.length || sel.includes(s.current)) ? s.current
              : (sel.length ? sel[0] : (s.locations.find(l => l.is_default)?.id ?? (s.locations.length === 1 ? s.locations[0].id : null)));
          this.setCurrent(cur, false);
        }
      }),
      catchError(() => { this.state.next(EMPTY); return of(EMPTY); }),
    );
  }

  setSelected(ids: number[], notify = true): void {
    ids = Array.from(new Set(ids));
    try { localStorage.setItem(K_SEL, JSON.stringify(ids)); } catch {}
    if (notify || ids.length !== this.selected.value.length) { this.selected.next(ids); }
    const cur = this.current.value;
    if (ids.length && cur != null && !ids.includes(cur)) { this.setCurrent(ids[0], notify); }
  }

  setCurrent(id: number | null, notify = true): void {
    try { if (id == null) { localStorage.removeItem(K_CUR); } else { localStorage.setItem(K_CUR, String(id)); } } catch {}
    if (notify || id !== this.current.value) { this.current.next(id); }
  }

  toggle(id: number): void {
    const s = this.selected.value.slice();
    const i = s.indexOf(id);
    if (i > -1) { s.splice(i, 1); } else { s.push(id); }
    this.setSelected(s);
  }

  clear(): void { this.setSelected([]); }

  /** locations grouped by branch, for the switcher */
  groups(): { branch_id: number | null; branch_name: string; items: ZLocation[] }[] {
    const out: { branch_id: number | null; branch_name: string; items: ZLocation[] }[] = [];
    for (const l of this.state.value.locations) {
      let g = out.find(x => x.branch_id === l.branch_id);
      if (!g) { g = { branch_id: l.branch_id, branch_name: l.branch_name || 'No branch', items: [] }; out.push(g); }
      g.items.push(l);
    }
    return out;
  }

  private read(k: string): number[] {
    try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v.map(Number).filter(n => !isNaN(n)) : []; } catch { return []; }
  }
  private readOne(k: string): number | null {
    try { const v = localStorage.getItem(k); return v && !isNaN(+v) ? +v : null; } catch { return null; }
  }
}

/** X-Zeo-Locations (ticked) and X-Zeo-Location (working) on every API call while location control is on. */
@Injectable()
export class ZLocationInterceptor implements HttpInterceptor {
  constructor(private loc: ZLocationService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.loc.enabled && req.url.startsWith(environment.apiBaseUrl)) {
      const h: Record<string, string> = {};
      const sel = this.loc.selectedIds;
      if (sel.length && !req.headers.has('X-Zeo-Locations')) { h['X-Zeo-Locations'] = sel.join(','); }
      const cur = this.loc.currentId;
      if (cur != null && !req.headers.has('X-Zeo-Location')) { h['X-Zeo-Location'] = String(cur); }
      if (Object.keys(h).length) { req = req.clone({ setHeaders: h }); }
    }
    return next.handle(req);
  }
}
