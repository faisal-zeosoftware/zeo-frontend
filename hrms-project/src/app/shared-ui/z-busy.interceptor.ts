import { Injectable, NgZone } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { i18nT } from './i18n-core';

/**
 * v1.28.1 – one loading indicator for every screen: while a save, update, delete, import or upload (POST / PUT /
 * PATCH / DELETE) is running longer than 400 ms a thin bar moves along the top of the window; after 2 s a small
 * “Working…” chip is shown as well, so slow operations (roster, open shift, imports, company creation) are never
 * silent. Nothing to add on the screens; GET requests are not shown (lists have their own skeletons).
 */
@Injectable()
export class ZBusyInterceptor implements HttpInterceptor {
  private active = 0;
  private bar: HTMLElement | null = null;
  private chip: HTMLElement | null = null;
  private showTimer: any = null;
  private chipTimer: any = null;

  constructor(private zone: NgZone) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || req.headers.has('X-No-Busy')) { return next.handle(req); }
    this.start();
    return next.handle(req).pipe(finalize(() => this.stop()));
  }

  private start(): void {
    this.active++;
    if (this.active !== 1) { return; }
    this.zone.runOutsideAngular(() => {
      this.showTimer = setTimeout(() => this.show(), 400);
      this.chipTimer = setTimeout(() => this.showChip(), 2000);
    });
  }
  private stop(): void {
    this.active = Math.max(0, this.active - 1);
    if (this.active) { return; }
    clearTimeout(this.showTimer); clearTimeout(this.chipTimer);
    if (this.bar) { this.bar.classList.remove('on'); }
    if (this.chip) { this.chip.classList.remove('on'); }
  }
  private show(): void {
    if (!this.bar) {
      const b = document.createElement('div'); b.className = 'zbusy'; b.setAttribute('aria-hidden', 'true');
      b.innerHTML = '<i></i>';
      document.body.appendChild(b); this.bar = b;
      if (!document.getElementById('zbusy-css')) {
        const st = document.createElement('style'); st.id = 'zbusy-css';
        st.textContent = `.zbusy{position:fixed;left:0;top:0;right:0;height:3px;z-index:20000;pointer-events:none;opacity:0;transition:opacity .2s}
.zbusy.on{opacity:1}.zbusy i{position:absolute;top:0;bottom:0;width:28%;background:linear-gradient(90deg,#5B4FE0,#C9B6E4);border-radius:2px;animation:zbusy 1.1s ease-in-out infinite}
@keyframes zbusy{0%{left:-28%}100%{left:100%}}
.zbusy-chip{position:fixed;top:12px;left:50%;transform:translate(-50%,-30px);z-index:20001;background:#1B1640;color:#fff;font:500 13px/1 Roboto,"Helvetica Neue",sans-serif;padding:9px 16px;border-radius:999px;box-shadow:0 8px 24px rgba(27,22,64,.3);display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none}
.zbusy-chip.on{opacity:1;transform:translate(-50%,0)}.zbusy-chip b{width:12px;height:12px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:zbusyspin .8s linear infinite}
@keyframes zbusyspin{to{transform:rotate(360deg)}}@media print{.zbusy,.zbusy-chip{display:none}}`;
        document.head.appendChild(st);
      }
    }
    this.bar.classList.add('on');
  }
  private showChip(): void {
    if (!this.chip) {
      const c = document.createElement('div'); c.className = 'zbusy-chip'; c.setAttribute('role', 'status');
      c.innerHTML = '<b></b><span></span>'; document.body.appendChild(c); this.chip = c;
    }
    (this.chip.querySelector('span') as HTMLElement).textContent = i18nT('Working… please wait');
    this.chip.classList.add('on');
  }
}
