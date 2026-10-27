// auth-interceptor.service.ts
//
// v1.62.0 – short sign-in tokens (30 minutes) renewed with the refresh token, which is spent on every use (a new one comes
// back); "type your password again" before sensitive actions (step-up); the seconds since the person last touched the app
// (X-Zeo-Idle) so that the company's idle sign-out is not kept away by background requests.

import { Injectable, NgZone } from '@angular/core';
import { HttpBackend, HttpClient, HttpContextToken, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap } from 'rxjs/operators';
import { AuthenticationService } from './login/authentication.service';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { askStepUp } from './shared-ui/z-step-up';
import { installExportGuard } from './shared-ui/z-export';

installExportGuard();   // v1.62.0 every CSV / Excel download of a list is checked and written to the export log

const REFRESH_KEYS = ['refresh_token', 'zeo_refresh'];
const RETRIED = new HttpContextToken<boolean>(() => false);
const STEPPED = new HttpContextToken<boolean>(() => false);

function tokenExp(t: string | null): number {
  if (!t) { return 0; }
  try { return (JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp || 0) * 1000; } catch { return 0; }
}

let lastInput = Date.now();
function idleSeconds(): number { return Math.max(0, Math.round((Date.now() - lastInput) / 1000)); }
try {
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev => window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
} catch { /* no window */ }

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private static refreshing: Observable<string | null> | null = null;
  private static lastMediaCookie = 0;
  private bare: HttpClient;

  constructor(private authService: AuthenticationService, private router: Router, backend: HttpBackend, zone: NgZone) {
    this.bare = new HttpClient(backend);   // not through the interceptors (no loop)
    zone.runOutsideAngular(() => setInterval(() => this.keepFresh(), 60000));
  }

  private refreshKey(): string | null { return REFRESH_KEYS.find(k => !!localStorage.getItem(k)) || null; }

  /** a new access token (and refresh token); one call at a time for every tab of this page */
  private refresh(): Observable<string | null> {
    if (AuthInterceptor.refreshing) { return AuthInterceptor.refreshing; }
    const key = this.refreshKey();
    const rt = key ? localStorage.getItem(key) : null;
    if (!rt) { return of(null); }
    AuthInterceptor.refreshing = this.bare.post<any>(`${environment.apiBaseUrl}/users/token/refresh/`, { refresh: rt }).pipe(
      switchMap(r => {
        if (r?.access) {
          localStorage.setItem('auth_token', r.access);
          if (localStorage.getItem('access_token')) { localStorage.setItem('access_token', r.access); }
          if (r.refresh && key) { localStorage.setItem(key, r.refresh); }
          this.renewMediaCookie(r.access);
          return of(r.access as string);
        }
        return of(null);
      }),
      catchError((e: HttpErrorResponse) => {
        // a newer refresh token written by another tab meanwhile: use what it got
        const now = localStorage.getItem('auth_token');
        if (now && tokenExp(now) > Date.now() + 30000) { return of(now); }
        return throwError(() => e);
      }),
      finalize(() => { setTimeout(() => { AuthInterceptor.refreshing = null; }, 0); }),
      shareReplay(1));
    return AuthInterceptor.refreshing;
  }

  private renewMediaCookie(access: string): void {
    if (Date.now() - AuthInterceptor.lastMediaCookie < 3600000) { return; }
    AuthInterceptor.lastMediaCookie = Date.now();
    this.bare.post(`${environment.apiBaseUrl}/users/media-cookie/`, {}, { withCredentials: true, headers: { Authorization: `Bearer ${access}` } })
      .subscribe({ error: () => undefined });
  }

  /** every minute: renew the token before it ends (pages that download with fetch() keep working) */
  private keepFresh(): void {
    const t = this.authService.getAuthToken();
    const exp = tokenExp(t);
    if (t && exp && exp - Date.now() < 5 * 60000 && this.refreshKey()) {
      this.refresh().subscribe({ error: (e: HttpErrorResponse) => this.ended(e) });
    }
  }

  private ended(e: HttpErrorResponse): void {
    if (e?.status === 401 && (e.error?.code === 'session_ended' || e.error?.code === 'token_not_valid')) {
      this.authService.logout();
      this.authService.clearTokens();
      if (!location.pathname.includes('login')) { setTimeout(() => this.router.navigate(['/login']), 0); }
    }
  }

  private withToken(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
    const h: any = { 'X-Zeo-Idle': String(idleSeconds()) };
    if (token) { h.Authorization = `Bearer ${token}`; }
    return request.clone({ setHeaders: h });
  }

  private isAuthCall(url: string): boolean { return /\/users\/(token|token\/refresh|2fa\/login|activate|activate\/send|first-check)\/$/.test(url.split('?')[0]); }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.headers.has('Authorization') || this.isAuthCall(request.url)) {   // a call that brings its own token, or the sign-in itself
      return next.handle(request);
    }
    const token = this.authService.getAuthToken();
    const exp = tokenExp(token);
    const go = (t: string | null) => next.handle(this.withToken(request, t)).pipe(catchError((error: HttpErrorResponse) => this.onError(error, request, next, t)));
    if (token && exp && exp - Date.now() < 30000 && this.refreshKey()) {   // about to end: renew first
      return this.refresh().pipe(catchError(() => of(token)), switchMap(t => go(t || token)));
    }
    return go(token);
  }

  private onError(error: HttpErrorResponse, request: HttpRequest<any>, next: HttpHandler, used: string | null): Observable<HttpEvent<any>> {
    // the access token ended: renew it once and repeat the request
    if (error.status === 401 && error.error?.code === 'token_not_valid' && this.refreshKey() && !request.context.get(RETRIED)) {
      return this.refresh().pipe(
        switchMap(t => t ? next.handle(this.withToken(request, t).clone({ context: request.context.set(RETRIED, true) })) : throwError(() => error)),
        catchError((e: HttpErrorResponse) => { this.ended(e?.status === 401 ? e : error); return throwError(() => error); }));
    }
    // v1.62.0 the company asks for the password again before this action
    if (error.status === 403 && error.error?.code === 'step_up_required' && !request.context.get(STEPPED)) {
      return from(askStepUp(error.error, this.authService.getAuthToken(), this.bare)).pipe(
        switchMap(ok => ok ? next.handle(this.withToken(request, this.authService.getAuthToken()).clone({ context: request.context.set(STEPPED, true) }))
          : throwError(() => error)));
    }
    // v1.62.0 signed in with a password someone else knows (before this version): sign in again – the sign-in asks for an own password
    if (error.status === 403 && error.error?.code === 'password_change_required' && !location.pathname.includes('login')) {
      try { sessionStorage.setItem('zeo_login_notice', error.error?.detail || 'Choose your own password first.'); } catch { /* storage */ }
      this.authService.logout();
      this.authService.clearTokens();
      setTimeout(() => this.router.navigate(['/login']), 0);
      return throwError(() => error);
    }
    if (error.status === 401 && (error.error?.code === 'token_not_valid' || error.error?.code === 'session_ended')) {   // v1.52.0 signed out elsewhere
      if (error.error?.code === 'session_ended' && !location.hash.includes('login') && !location.pathname.includes('login')) {
        setTimeout(() => this.router.navigate(['/login']), 0);
      }
      this.authService.logout();
      this.authService.clearTokens();
    }
    return throwError(() => error);
  }
}
