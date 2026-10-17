import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { rememberHttpError } from './z-toast';

/** v1.28.1 – keeps the server's reason of the last failed request so a generic "Failed …" message on any screen can
 *  show it (see withServerReason in z-toast.ts). Nothing is changed in the error itself. */
export function httpErrorText(e: any): string {
  const b = e?.error;
  if (e?.status === 0) { return 'the server could not be reached'; }
  const pick = (v: any, depth = 0): string => {
    if (v === null || v === undefined || depth > 2) { return ''; }
    if (typeof v === 'string') { return v.trim().startsWith('<') ? '' : v.trim(); }
    if (Array.isArray(v)) { return v.map(x => pick(x, depth + 1)).filter(Boolean).join(' '); }
    if (typeof v === 'object') {
      for (const k of ['detail', 'error', 'message', 'non_field_errors', 'errors']) { if (v[k] !== undefined) { const t = pick(v[k], depth + 1); if (t) { return t; } } }
      return Object.keys(v).slice(0, 4).map(k => { const t = pick(v[k], depth + 1); return t ? (depth === 0 && !/^\d+$/.test(k) ? `${k.replace(/_/g, ' ')}: ${t}` : t) : ''; }).filter(Boolean).join('; ');
    }
    return String(v);
  };
  let t = pick(b);
  if (!t && e?.status) { t = e.status === 403 ? 'you do not have permission for this' : e.status === 404 ? 'not found on the server' : e.status >= 500 ? `server error (${e.status})` : `request refused (${e.status})`; }
  return t.length > 300 ? t.slice(0, 297) + '…' : t;
}

@Injectable()
export class ZHttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError((e: HttpErrorResponse) => {
      // every failed save / delete; a failed read only when the server gave a reason of its own (not a bare 404 / HTML page)
      const b = e?.error, said = b && typeof b === 'object' && (typeof b.detail === 'string' || typeof b.error === 'string');
      if (req.method !== 'GET' || said) { rememberHttpError(httpErrorText(e), e?.status || 0); }
      return throwError(() => e);
    }));
  }
}
