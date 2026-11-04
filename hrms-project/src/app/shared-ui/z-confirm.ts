/**
 * v1.62.10 (item 180) – one confirm window in the new design instead of the browser's confirm() pop-up, on every screen.
 *
 *   if (!(await zConfirm('Delete this record?'))) { return; }
 *   zConfirm(msg, { danger: true, ok: 'Delete' }).then(ok => { if (ok) { … } });
 *
 * Same look as the shared form (z-form.component.ts): a title, the message, Cancel and the action button. Esc / the veil /
 * Cancel answer "no", Enter answers "yes". The texts go through the translator (Arabic: right to left). Plain DOM, so it
 * works from services, directives and screens alike, inside or outside Angular's zone; one window at a time (a second
 * call waits until the first is answered).
 */
import { i18nMessage, i18nT } from './i18n-core';

export interface ZConfirmOptions {
  title?: string;      // default "Please confirm"
  ok?: string;         // default "OK" (or "Delete" when danger)
  cancel?: string;     // default "Cancel"
  danger?: boolean;    // red action button (deletes, cancellations)
}

const CSS = `
.zcf-host { position: fixed; inset: 0; z-index: 1400; display: grid; place-items: center; font-family: inherit; }
.zcf-veil { position: absolute; inset: 0; background: rgba(27,22,64,.38); }
.zcf-box { position: relative; width: min(440px, calc(100vw - 32px)); background: #fff; border-radius: 14px; box-shadow: 0 24px 60px rgba(27,22,64,.28);
  font-size: 13.5px; color: #1d2033; outline: none; }
.zcf-head { padding: 18px 22px 6px; }
.zcf-title { margin: 0; font-size: 17px; font-weight: 600; color: #1b1640; }
.zcf-msg { margin: 0; padding: 4px 22px 18px; color: #3b3f55; line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere; max-height: 50vh; overflow: auto; }
.zcf-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 22px; border-top: 1px solid #eceef5; }
.zcf-btn { height: 36px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe1ea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; color: #1d2033; }
.zcf-btn.primary { background: #5b4fe0; border-color: #5b4fe0; color: #fff; }
.zcf-btn.danger { background: #c4314b; border-color: #c4314b; color: #fff; }
.zcf-btn:focus-visible { outline: 2px solid #5b4fe0; outline-offset: 2px; }
`;

let queue: Promise<any> = Promise.resolve();

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
}

function show(message: any, o: ZConfirmOptions): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    if (typeof document === 'undefined') { resolve(false); return; }
    if (!document.getElementById('zcf-css')) {
      const st = document.createElement('style'); st.id = 'zcf-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const prev = document.activeElement as HTMLElement | null;
    const rtl = document.documentElement.dir === 'rtl' || document.body?.dir === 'rtl';
    const host = document.createElement('div');
    host.className = 'zcf-host'; host.setAttribute('data-zconfirm', '');
    if (rtl) { host.dir = 'rtl'; }
    const okText = i18nT(o.ok || (o.danger ? 'Delete' : 'OK'));
    host.innerHTML = `<div class="zcf-veil"></div>
<div class="zcf-box" role="alertdialog" aria-modal="true" aria-labelledby="zcf-t" aria-describedby="zcf-m" tabindex="-1">
  <div class="zcf-head"><h2 class="zcf-title" id="zcf-t">${esc(i18nT(o.title || 'Please confirm'))}</h2></div>
  <p class="zcf-msg" id="zcf-m">${esc(i18nMessage(String(message ?? '')))}</p>
  <div class="zcf-foot">
    <button type="button" class="zcf-btn" data-zconfirm-cancel>${esc(i18nT(o.cancel || 'Cancel'))}</button>
    <button type="button" class="zcf-btn ${o.danger ? 'danger' : 'primary'}" data-zconfirm-ok>${esc(okText)}</button>
  </div>
</div>`;
    let done = false;
    const finish = (v: boolean) => {
      if (done) { return; } done = true;
      document.removeEventListener('keydown', onKey, true);
      host.remove();
      try { prev?.focus?.(); } catch { /* element gone */ }
      resolve(v);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
      else if (e.key === 'Enter' && !(e.target as HTMLElement)?.matches?.('[data-zconfirm-cancel]')) { e.preventDefault(); e.stopPropagation(); finish(true); }
      else if (e.key === 'Tab') {   // keep the focus inside the window
        const b = Array.from(host.querySelectorAll('button')) as HTMLElement[];
        const i = b.indexOf(document.activeElement as HTMLElement);
        e.preventDefault(); b[(i + (e.shiftKey ? b.length - 1 : 1)) % b.length]?.focus();
      }
    };
    host.querySelector('.zcf-veil')!.addEventListener('click', () => finish(false));
    host.querySelector('[data-zconfirm-cancel]')!.addEventListener('click', () => finish(false));
    host.querySelector('[data-zconfirm-ok]')!.addEventListener('click', () => finish(true));
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(host);
    setTimeout(() => (host.querySelector('[data-zconfirm-ok]') as HTMLElement | null)?.focus(), 0);
  });
}

/** Ask the user; resolves true for the action button, false for Cancel / Esc / outside. */
export function zConfirm(message: any, opts: ZConfirmOptions = {}): Promise<boolean> {
  const run = queue.then(() => show(message, opts));
  queue = run.catch(() => false);
  return run;
}
