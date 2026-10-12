/**
 * v1.20.0 – which of the three ZEO apps is open (HRMS, Projects, Settings) and the modules used last (launcher "Recent").
 * Kept per user and browser; a page that belongs to one app switches to it, shared pages (Calendar, My To-do) keep the app.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Suite } from './menu-config';
import { environment } from '../../environments/environment';

export type AppSuite = Exclude<Suite, 'common'>;

@Injectable({ providedIn: 'root' })
export class ZSuiteService {
  readonly suite$ = new BehaviorSubject<AppSuite>(this.load('zeo-suite', 'hrms') as AppSuite);
  readonly recent$ = new BehaviorSubject<string[]>(this.loadList());
  /** v1.21.0: the apps active in the selected company (Settings → Apps); null until loaded. Settings is always there. */
  readonly active$ = new BehaviorSubject<string[] | null>(null);
  private loadedFor = '';

  constructor(private http: HttpClient) {}

  /** Load (or reload after an activation) which apps the company uses. An older server without the Apps service: all apps. */
  loadActive(force = false): void {
    let schema = '';
    try { schema = localStorage.getItem('selectedSchema') || ''; } catch { schema = ''; }
    if (!schema || (!force && this.loadedFor === schema && this.active$.value)) { return; }
    this.loadedFor = schema;
    this.http.get<{ active: string[] }>(`${environment.apiBaseUrl}/zeo-apps/api/apps/?lite=1&schema=${encodeURIComponent(schema)}`).subscribe({
      next: r => this.active$.next([...(r.active || []), 'settings']),
      error: () => this.active$.next(null),
    });
  }
  /** Is this app active? (true while not known, so nothing flickers away) */
  isActive(s: AppSuite): boolean {
    const a = this.active$.value;
    return s === 'settings' || !a || a.includes(s);
  }

  get suite(): AppSuite { return this.suite$.value; }
  set(s: AppSuite): void {
    if (s === this.suite$.value) { return; }
    try { localStorage.setItem('zeo-suite', s); } catch { /* storage off */ }
    this.suite$.next(s);
  }
  /** A module was opened: first in the recent list (5 kept). */
  touch(appKey: string): void {
    if (!appKey) { return; }
    const l = [appKey, ...this.recent$.value.filter(k => k !== appKey)].slice(0, 5);
    if (l.join() === this.recent$.value.join()) { return; }
    try { localStorage.setItem('zeo-recent-apps', JSON.stringify(l)); } catch { /* storage off */ }
    this.recent$.next(l);
  }
  private load(k: string, d: string): string { try { return localStorage.getItem(k) || d; } catch { return d; } }
  private loadList(): string[] { try { const v = JSON.parse(localStorage.getItem('zeo-recent-apps') || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
}
