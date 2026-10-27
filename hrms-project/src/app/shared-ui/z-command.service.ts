import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { ZListService } from './z-list.service';

/**
 * v1.47.0 – the shell's commands: global search (Ctrl+K), quick create (+), keyboard shortcuts, "What's new" and the
 * guided tours. Buttons anywhere call open(); the shell components listen. Also the API of the navigation pages
 * (chatter/api/search, quick, wall, my-team, one-on-ones, flags, whats-new).
 */
export type ZCommand = 'search' | 'quick' | 'keys' | 'whatsnew' | 'tour';

@Injectable({ providedIn: 'root' })
export class ZCommandService {
  readonly cmd$ = new Subject<{ cmd: ZCommand; arg?: any }>();
  readonly flags$ = new BehaviorSubject<Record<string, any> | null>(null);
  private flagsLoading?: Promise<Record<string, any>>;

  constructor(private http: HttpClient, private z: ZListService) {}

  open(cmd: ZCommand, arg?: any): void { this.cmd$.next({ cmd, arg }); }

  private get s(): string { return localStorage.getItem('selectedSchema') || ''; }
  url(p: string, q: Record<string, any> = {}): string {
    const qs = Object.entries(q).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `&${k}=${encodeURIComponent(String(v))}`).join('');
    return `${this.z.api}/chatter/api/${p}?schema=${this.s}${qs}`;
  }
  get<T = any>(p: string, q: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(p, q))); }
  post<T = any>(p: string, body: any): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(p), body)); }
  patch<T = any>(p: string, body: any): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(p), body)); }
  del(p: string): Promise<any> { return firstValueFrom(this.http.delete(this.url(p))); }
  /** Any API of the backend (e.g. /dashboard/api/reports/). */
  raw<T = any>(path: string, q: Record<string, any> = {}): Promise<T> {
    const qs = Object.entries(q).map(([k, v]) => `&${k}=${encodeURIComponent(String(v))}`).join('');
    return firstValueFrom(this.http.get<T>(`${this.z.api}${path}${path.includes('?') ? '&' : '?'}schema=${this.s}${qs}`));
  }
  rawPost<T = any>(path: string, body: any): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${this.z.api}${path}${path.includes('?') ? '&' : '?'}schema=${this.s}`, body));
  }

  // ------------------------------------------------------------------ per-user flags (tours done, release notes seen)
  flags(force = false): Promise<Record<string, any>> {
    if (this.flags$.value && !force) { return Promise.resolve(this.flags$.value); }
    if (!this.flagsLoading || force) {
      this.flagsLoading = this.get<Record<string, any>>('flags/').then(f => { this.flags$.next(f || {}); return f || {}; })
        .catch(() => { this.flags$.next({}); return {}; }).finally(() => { this.flagsLoading = undefined; });
    }
    return this.flagsLoading;
  }
  async setFlag(key: string, value: any): Promise<void> {
    this.flags$.next({ ...(this.flags$.value || {}), [key]: value });
    try { await this.post('flags/', { key, value }); } catch { /* best effort */ }
  }
}

/** Is the key press inside a field where typing must not trigger a shortcut? */
export function typingIn(ev: KeyboardEvent): boolean {
  const t = ev.target as HTMLElement | null;
  if (!t) { return false; }
  const tag = (t.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
}
