/**
 * v1.62.0 – "Type your password again" (step-up) before sensitive actions: payroll approval, the WPS file, bank details,
 * user rights, exports – when the company switched it on (Settings › Sign-in security). The API answered 403
 * {code: 'step_up_required', step_up, totp}; this asks for the password (or the authenticator code), calls /users/step-up/ and
 * lets the interceptor repeat the request. A plain DOM dialog, so it works on every screen without a module of its own.
 */
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { i18nT } from './i18n.service';

let open: Promise<boolean> | null = null;

const LABELS: Record<string, string> = {
  payroll_approve: 'approving payroll', wps: 'the WPS salary file', bank: 'changing bank details', rights: 'changing user rights',
  export: 'exporting a list',
};

/** the same dialog for code outside Angular's HttpClient (exports made in the browser) */
export function askStepUpFetch(info: any, token: string | null): Promise<boolean> {
  return askStepUp(info, token, null);
}

export function askStepUp(info: any, token: string | null, http: HttpClient | null): Promise<boolean> {
  if (open) { return open; }   // several requests at once: one dialog
  open = new Promise<boolean>(resolve => {
    const t = (s: string) => { try { return i18nT(s); } catch { return s; } };
    const wrap = document.createElement('div');
    wrap.setAttribute('data-step-up', '');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(20,24,40,.45);display:flex;align-items:center;justify-content:center;padding:16px';
    const totp = !!info?.totp;
    const what = t(LABELS[info?.step_up] || 'this action');
    wrap.innerHTML = `<form style="background:#fff;border-radius:12px;max-width:380px;width:100%;padding:20px 22px;box-shadow:0 12px 40px rgba(0,0,0,.25);font:14px system-ui,Segoe UI,Roboto,sans-serif;color:#1f2433">
      <h3 style="margin:0 0 6px;font-size:17px"></h3><p class="zsu-t" style="margin:0 0 12px;color:#5d6670;font-size:13px"></p>
      <input class="zsu-in" style="width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #cfd5dc;border-radius:7px;font:inherit;font-size:15px">
      <p class="zsu-err" role="alert" style="color:#9b2c24;font-size:12.5px;margin:8px 0 0;min-height:16px"></p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
        <button type="button" class="zsu-no" style="border:1px solid #cfd5dc;background:#fff;border-radius:7px;padding:7px 14px;cursor:pointer"></button>
        <button type="submit" class="zsu-ok" style="border:1px solid #5b4fe0;background:#5b4fe0;color:#fff;border-radius:7px;padding:7px 14px;cursor:pointer"></button></div></form>`;
    (wrap.querySelector('h3') as HTMLElement).textContent = t('Confirm it is you');
    (wrap.querySelector('.zsu-t') as HTMLElement).textContent = (totp ? t('Type the 6-digit code of your authenticator app to continue ({0}).') :
      t('Type your password again to continue ({0}).')).replace('{0}', what);
    const inp = wrap.querySelector('.zsu-in') as HTMLInputElement;
    inp.type = totp ? 'text' : 'password';
    inp.autocomplete = totp ? 'one-time-code' : 'current-password';
    inp.inputMode = totp ? 'numeric' : 'text';
    inp.setAttribute('aria-label', totp ? t('Authenticator code') : t('Password'));
    inp.setAttribute('data-step-up-input', '');
    (wrap.querySelector('.zsu-no') as HTMLElement).textContent = t('Cancel');
    (wrap.querySelector('.zsu-ok') as HTMLElement).textContent = t('Continue');
    const err = wrap.querySelector('.zsu-err') as HTMLElement;
    const done = (ok: boolean) => { wrap.remove(); open = null; resolve(ok); };
    (wrap.querySelector('.zsu-no') as HTMLElement).onclick = () => done(false);
    wrap.addEventListener('keydown', ev => { if ((ev as KeyboardEvent).key === 'Escape') { done(false); } });
    (wrap.querySelector('form') as HTMLFormElement).onsubmit = async ev => {
      ev.preventDefault();
      const v = inp.value.trim();
      if (!v) { return; }
      err.textContent = '';
      try {
        const body = totp ? { code: v } : { password: v };
        if (http) {
          await firstValueFrom(http.post(`${environment.apiBaseUrl}/users/step-up/`, body, { headers: token ? { Authorization: `Bearer ${token}` } : {} }));
        } else {
          const r = await fetch(`${environment.apiBaseUrl}/users/step-up/`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
          if (!r.ok) { let j: any = {}; try { j = await r.json(); } catch { j = {}; } throw { error: j }; }
        }
        done(true);
      } catch (e: any) {
        err.textContent = e?.error?.detail || t('The password (or code) is not correct.');
        inp.select();
      }
    };
    document.body.appendChild(wrap);
    setTimeout(() => inp.focus(), 30);
  });
  return open;
}
