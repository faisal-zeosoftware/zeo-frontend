import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ZListService } from './z-list.service';
import { DesignField } from './field-types';

/** Which record a form on the screen belongs to. */
export interface RecordCtx { endpoint: string; id: string | null; at: number; source: 'detail' | 'row' | 'create' | 'saved'; }

/** A form's extra fields waiting for the record to be saved (create) or for the screen's own save (edit). */
export interface PendingForm {
  key: number; endpoint: string | null; id: string | null; fields: DesignField[]; values: Record<string, any>;
  visible: () => boolean; onError: (msg: string) => void; onSaved: (endpoint: string, id: string) => void;
}

const API_RE = /\/api\//;
const SKIP_RE = /\/(chatter|tools|dashboard)\/api\/|\/permissions\/|notification|\/token|\/otp/i;

/**
 * Shared state for the record panel (notes, activities, attachments, history and extra fields):
 * API calls, plus working out which record a form on the screen belongs to:
 *  - the screen loaded / saved one record (GET, PUT, PATCH, DELETE …/<id>/),
 *  - the user clicked a row of a list (matched with the list the screen loaded),
 *  - the user pressed Create / Add / New (a new record; its id arrives with the screen's POST).
 */
@Injectable({ providedIn: 'root' })
export class ZRecordService {
  private ctxs: RecordCtx[] = [];
  private lastAction = 0;
  private pending = new Map<number, PendingForm>();
  private seq = 0;
  readonly todoCounts$ = new BehaviorSubject<{ overdue: number; today: number; planned: number }>({ overdue: 0, today: 0, planned: 0 });

  constructor(private http: HttpClient, private z: ZListService, private zone: NgZone) {
    document.addEventListener('click', this.onClick, true);
    (window as any).__zrec = this;  // for support: inspect the record panel state in the browser console
  }

  get api(): string { return this.z.api; }
  private get s(): string { return localStorage.getItem('selectedSchema') || ''; }
  private url(p: string, q = ''): string { return `${this.api}/chatter/api/${p}?schema=${this.s}${q}`; }

  // ------------------------------------------------------------------ context
  /** Called by the HTTP interceptor for every API call of the screens. */
  seen(method: string, url: string, body: any, ok: boolean): void {
    const path = url.replace(this.api, '').split('?')[0];
    if (!API_RE.test(path) || SKIP_RE.test(path)) { return; }
    const m = /^(.*\/)(\d+)\/?$/.exec(path);
    // only calls that follow a user action open a record (not background calls such as the logged-in user)
    const recent = Date.now() - this.lastAction < 3000;
    if (m && ok && (recent || method !== 'GET') && !/\/users\/api\/user\/|\/api\/company\//i.test(path)) {
      this.push({ endpoint: m[1], id: m[2], at: Date.now(), source: 'detail' });
    }
    if (method === 'POST' && ok && body && typeof body === 'object' && !Array.isArray(body) && body.id !== undefined && !m) {
      this.push({ endpoint: path.endsWith('/') ? path : path + '/', id: String(body.id), at: Date.now(), source: 'saved' });
    }
  }

  private push(c: RecordCtx): void {
    this.ctxs.push(c);
    if (this.ctxs.length > 40) { this.ctxs.splice(0, this.ctxs.length - 40); }
  }

  /** Best context for a form that just appeared. */
  latest(withinMs = 5000): RecordCtx | null {
    const now = Date.now();
    // a picked row stays the user's choice for a minute (tick a row, then press Edit); other signals are short-lived
    const fresh = this.ctxs.filter(c => now - c.at <= (c.source === 'row' ? 60000 : withinMs));
    if (!fresh.length) { return null; }
    const last = fresh[fresh.length - 1];
    // the most recent user action wins; a detail call shortly after a row click refines it
    if (last.source === 'create') { return last; }
    const createAfter = fresh.filter(c => c.source === 'create').pop();
    if (createAfter && createAfter.at >= last.at - 50) { return createAfter; }
    const detail = fresh.filter(c => c.source === 'detail').pop();
    const row = fresh.filter(c => c.source === 'row').pop();
    if (row && detail && detail.at >= row.at && detail.id === row.id) { return detail; }
    return row && (!detail || row.at > detail.at) ? row : (detail || last);
  }

  /** Context for a page whose URL ends in an id (e.g. employee details). */
  forId(id: string): RecordCtx | null {
    const c = [...this.ctxs].reverse().find(x => x.id === id && (x.source === 'detail' || x.source === 'row'));
    return c || null;
  }

  private onClick = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement;
    if (!t || t.closest('z-record-panel, .zl-bar, .zl-foot, .zl-menu, .zl-modal')) { return; }
    this.lastAction = Date.now();
    const btn = t.closest('button, a, [role=button]') as HTMLElement | null;
    const text = (btn ? this.label(btn) : '').trim().toLowerCase();
    const tr = t.closest('table tbody tr') as HTMLTableRowElement | null;
    if (btn && !tr && /^(\+\s*)?(create|add|new)\b|\badd new\b|\bcreate new\b|\bnew request\b|\bapply\b/.test(text) && !/import|upload|filter|bulk/.test(text)) {
      this.push({ endpoint: this.screenEndpoint() || '', id: null, at: Date.now(), source: 'create' });
      return;
    }
    if (tr) {
      const hit = this.rowRecord(tr);
      if (hit) { this.push({ endpoint: hit.endpoint, id: hit.id, at: Date.now(), source: 'row' }); }
    }
  };

  /** Button text without its icon (mat-icon ligatures such as "add_circle"). */
  private label(b: HTMLElement): string {
    const c = b.cloneNode(true) as HTMLElement;
    c.querySelectorAll('mat-icon, .material-icons, .material-symbols-outlined, i, svg').forEach(i => i.remove());
    return (c.textContent || '').trim() || b.getAttribute('aria-label') || b.getAttribute('title') || '';
  }

  /** The record behind a table row: the item of a list the screen loaded whose values match the row's cells. */
  rowRecord(tr: HTMLTableRowElement): { endpoint: string; id: string; item: any } | null {
    const cells = Array.from(tr.cells).map(c => (c.textContent || '').trim().toLowerCase()).filter(x => x.length > 1);
    if (!cells.length) { return null; }
    const lists = this.z.recordedLists();
    let best: { endpoint: string; id: string; item: any } | null = null; let bestN = 0;
    for (const l of lists) {
      for (const it of l.items) {
        if (!it || typeof it !== 'object' || it.id === undefined) { continue; }
        const vals = new Set<string>();
        for (const v of Object.values(it)) { if (v !== null && typeof v !== 'object') { vals.add(String(v).trim().toLowerCase()); } }
        const n = cells.filter(c => vals.has(c)).length;
        if (n > bestN) { bestN = n; best = { endpoint: l.path.endsWith('/') ? l.path : l.path + '/', id: String(it.id), item: it }; }
      }
    }
    return best && bestN >= Math.min(2, cells.length) ? best : null;
  }

  /** The list API of the screen (for a Create form). */
  screenEndpoint(): string | null {
    // the list behind the biggest table on the page
    const tables = Array.from(document.querySelectorAll('table')).filter(t => !t.closest('z-record-panel, .zl-modal, mat-dialog-container, .modal-content'));
    const big = tables.sort((a, b) => b.querySelectorAll('tbody tr').length - a.querySelectorAll('tbody tr').length)[0];
    if (big) {
      const rows = Array.from(big.querySelectorAll('tbody tr')).slice(0, 40).map(r => Array.from((r as HTMLTableRowElement).cells).map(c => (c.textContent || '').trim()));
      const ep = this.z.endpointFor(rows);
      if (ep) { return ep.endsWith('/') ? ep : ep + '/'; }
    }
    // no rows to compare: the list whose address shares the most words with the page (leave-approval-level → leave-approval-levels)
    const words = (x: string) => x.toLowerCase().replace(/[^a-z]+/g, ' ').split(' ')
      .map(w => w.replace(/(ies)$/, 'y').replace(/s$/, '')).filter(w => w.length > 2 && !['api', 'main', 'sidebar', 'options', 'master', 'employee', 'emp'].includes(w));
    const page = words(location.pathname.split('/').pop() || '');
    let best: string | null = null; let bestN = 0;
    for (const l of this.z.recordedLists()) {
      const w = words(l.path.split('/').filter(Boolean).pop() || '');
      const n = page.filter(x => w.some(y => y === x || (x.length > 4 && (y.startsWith(x) || x.startsWith(y))))).length;
      // "shift-pattern" ↔ "shiftpattern": the whole name joined is the strongest match
      const joined = page.join(''), seg = w.join('');
      const score = n / Math.max(page.length, 1) + (joined && (seg === joined || seg.startsWith(joined)) ? 1 : 0);
      if (n && score > bestN) { bestN = score; best = l.path; }
    }
    return best && bestN >= 0.5 ? (best.endsWith('/') ? best : best + '/') : null;
  }

  // ------------------------------------------------------------------ pending forms (extra fields)
  register(p: Omit<PendingForm, 'key'>): number {
    const key = ++this.seq;
    this.pending.set(key, { ...p, key });
    return key;
  }
  update(key: number, patch: Partial<PendingForm>): void { const p = this.pending.get(key); if (p) { Object.assign(p, patch); } }
  unregister(key: number): void { this.pending.delete(key); }

  /** Forms whose extra fields go with a save the screen is about to send. */
  formsFor(method: string, url: string): PendingForm[] {
    const path = url.replace(this.api, '').split('?')[0];
    if (!API_RE.test(path) || SKIP_RE.test(path)) { return []; }
    const m = /^(.*\/)(\d+)\/?$/.exec(path);
    const forms = [...this.pending.values()].filter(p => p.visible() && p.fields.length);
    if (method === 'POST' && !m) {
      const ep = path.endsWith('/') ? path : path + '/';
      return forms.filter(p => !p.id && (!p.endpoint || p.endpoint === ep));
    }
    if ((method === 'PUT' || method === 'PATCH') && m) {
      return forms.filter(p => p.id === m[2] && (!p.endpoint || p.endpoint === m[1]));
    }
    return [];
  }

  // ------------------------------------------------------------------ API
  record(endpoint: string, id: string): Observable<any> {
    return this.http.get(this.url('record/', `&endpoint=${encodeURIComponent(endpoint)}&id=${encodeURIComponent(id)}`));
  }
  addNote(endpoint: string, id: string, body: string, attachment_ids: number[] = []): Observable<any> {
    return this.http.post(this.url('notes/'), { endpoint, id, body, attachment_ids });
  }
  deleteNote(pk: number): Observable<any> { return this.http.delete(this.url(`notes/${pk}/`)); }
  upload(endpoint: string, id: string, files: File[], field = ''): Observable<any[]> {
    const fd = new FormData();
    fd.append('endpoint', endpoint); fd.append('id', id); if (field) { fd.append('field', field); }
    files.forEach(f => fd.append('file', f, f.name));
    return this.http.post<any[]>(this.url('attachments/'), fd);
  }
  deleteAttachment(pk: number): Observable<any> { return this.http.delete(this.url(`attachments/${pk}/`)); }
  addActivity(body: any): Observable<any> { return this.http.post(this.url('activities/'), body); }
  patchActivity(pk: number, body: any): Observable<any> { return this.http.patch(this.url(`activities/${pk}/`), body); }
  todo(scope = 'mine', state = 'open'): Observable<any> { return this.http.get(this.url('todo/', `&scope=${scope}&state=${state}`)); }
  users(): Observable<any[]> { return this.http.get<any[]>(this.url('users/')); }
  fields(screen: string): Observable<any> { return this.http.get(this.url('fields/', `&screen=${encodeURIComponent(screen)}`)); }
  allFields(): Observable<any> { return this.http.get(this.url('fields/')); }
  addField(body: any): Observable<any> { return this.http.post(this.url('fields/'), body); }
  saveField(body: any): Observable<any> { return this.http.put(this.url('fields/'), body); }
  deleteField(id: number): Observable<any> { return this.http.delete(this.url('fields/', `&id=${id}`)); }
  saveValues(endpoint: string, id: string, values: Record<string, any>): Observable<any> {
    return this.http.put(this.url('values/'), { endpoint, id, values });
  }
  listValues(endpoint: string, ids: string[]): Observable<any> {
    return this.http.get(this.url('values/', `&endpoint=${encodeURIComponent(endpoint)}&ids=${ids.join(',')}`));
  }
  layout(kind: 'dashboard' | 'list', key: string): Observable<any> {
    return this.http.get(this.url(`layout/${kind}/`, kind === 'dashboard' ? `&name=${encodeURIComponent(key)}` : `&key=${encodeURIComponent(key)}`));
  }
  saveLayout(kind: 'dashboard' | 'list', key: string, data: any): Observable<any> {
    return this.http.put(this.url(`layout/${kind}/`, kind === 'dashboard' ? `&name=${encodeURIComponent(key)}` : `&key=${encodeURIComponent(key)}`), data);
  }
  orgChart(): Observable<any[]> { return this.http.get<any[]>(this.url('orgchart/')); }

  refreshTodo(): void {
    if (!localStorage.getItem('auth_token') || !this.s) { return; }
    this.todo().subscribe({ next: r => this.todoCounts$.next(r.counts), error: () => { /* not available */ } });
  }

  /** Values ready to send: files picked before the record existed are uploaded first. */
  async resolveFiles(endpoint: string, id: string, values: Record<string, any>): Promise<Record<string, any>> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v && typeof v === 'object' && v.pending instanceof File) {
        const r = await firstValueFrom(this.upload(endpoint, id, [v.pending], k));
        out[k] = { id: r[0].id, name: r[0].name };
      } else { out[k] = v; }
    }
    return out;
  }

  /** Open / download an attachment (the API needs the login token, so a plain link does not work). */
  async open(att: { id: number; name: string; mime?: string }, download = false): Promise<void> {
    const res = await fetch(`${this.api}/chatter/api/attachments/${att.id}/download/?schema=${this.s}&inline=1`,
      { headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') } });
    if (!res.ok) { throw new Error('The file could not be opened.'); }
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    const viewable = /^(image\/|application\/pdf|text\/)/.test(blob.type || att.mime || '');
    if (viewable && !download) { window.open(u, '_blank', 'noopener'); } else {
      const a = document.createElement('a'); a.href = u; a.download = att.name; document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(u), 60000);
  }
}
