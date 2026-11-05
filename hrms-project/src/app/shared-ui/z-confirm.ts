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
  // v1.67.1 (companies) a destructive action: what it removes (label + count) and a text to type before the button opens
  items?: { label: string; count?: number | string }[];
  typed?: string;      // the exact text (e.g. the company name) to type; OK stays off until it matches
  typedLabel?: string; // default 'Type "{0}" to confirm'
  note?: string;       // a small line under the list
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
.zcf-btn:disabled { opacity: .45; cursor: not-allowed; }
.zcf-items { margin: -8px 22px 14px; padding: 8px 12px; list-style: none; border: 1px solid #f1d5da; background: #fff7f8; border-radius: 10px; max-height: 32vh; overflow: auto; }
.zcf-items li { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px dashed #f1d5da; }
.zcf-items li:last-child { border-bottom: 0; }
.zcf-items b { font-variant-numeric: tabular-nums; color: #8b1d33; }
.zcf-note { margin: -6px 22px 12px; color: #6b6f85; font-size: 12.5px; line-height: 1.45; }
.zcf-typed { display: grid; gap: 6px; padding: 0 22px 16px; }
.zcf-typed span { color: #3b3f55; font-size: 12.5px; }
.zcf-typed input { height: 36px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; }
.zcf-typed input:focus { outline: 2px solid #c4314b33; border-color: #c4314b; }
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
    // v1.67.1 (companies): the list of what is removed and the text to type
    const items = (o.items || []).length ? `<ul class="zcf-items" data-zconfirm-items>${(o.items || []).map(it =>
      `<li><span>${esc(i18nT(it.label))}</span>${it.count !== undefined && it.count !== null ? `<b>${esc(it.count)}</b>` : ''}</li>`).join('')}</ul>` : '';
    const note = o.note ? `<p class="zcf-note">${esc(i18nMessage(o.note))}</p>` : '';
    const typed = o.typed ? `<label class="zcf-typed"><span>${esc(i18nT(o.typedLabel || 'Type "{0}" to confirm', [o.typed]))}</span>
      <input type="text" autocomplete="off" spellcheck="false" data-zconfirm-typed dir="auto"></label>` : '';
    host.innerHTML = `<div class="zcf-veil"></div>
<div class="zcf-box" role="alertdialog" aria-modal="true" aria-labelledby="zcf-t" aria-describedby="zcf-m" tabindex="-1">
  <div class="zcf-head"><h2 class="zcf-title" id="zcf-t">${esc(i18nT(o.title || 'Please confirm'))}</h2></div>
  <p class="zcf-msg" id="zcf-m">${esc(i18nMessage(String(message ?? '')))}</p>
  ${items}${note}${typed}
  <div class="zcf-foot">
    <button type="button" class="zcf-btn" data-zconfirm-cancel>${esc(i18nT(o.cancel || 'Cancel'))}</button>
    <button type="button" class="zcf-btn ${o.danger ? 'danger' : 'primary'}" data-zconfirm-ok>${esc(okText)}</button>
  </div>
</div>`;
    let done = false;
    const okBtn = host.querySelector('[data-zconfirm-ok]') as HTMLButtonElement;
    const typedIn = host.querySelector('[data-zconfirm-typed]') as HTMLInputElement | null;
    const matches = () => !typedIn || typedIn.value.trim() === String(o.typed || '').trim();
    if (typedIn) {
      okBtn.disabled = true;
      typedIn.addEventListener('input', () => { okBtn.disabled = !matches(); });
    }
    const finish = (v: boolean) => {
      if (v && !matches()) { return; }   // v1.67.1 (companies) the typed text must match
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
        const b = Array.from(host.querySelectorAll('input, button:not(:disabled)')) as HTMLElement[];
        const i = b.indexOf(document.activeElement as HTMLElement);
        e.preventDefault(); b[(i + (e.shiftKey ? b.length - 1 : 1)) % b.length]?.focus();
      }
    };
    host.querySelector('.zcf-veil')!.addEventListener('click', () => finish(false));
    host.querySelector('[data-zconfirm-cancel]')!.addEventListener('click', () => finish(false));
    host.querySelector('[data-zconfirm-ok]')!.addEventListener('click', () => finish(true));
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(host);
    setTimeout(() => ((typedIn || host.querySelector('[data-zconfirm-ok]')) as HTMLElement | null)?.focus(), 0);
  });
}

/** Ask the user; resolves true for the action button, false for Cancel / Esc / outside. */
export function zConfirm(message: any, opts: ZConfirmOptions = {}): Promise<boolean> {
  const run = queue.then(() => show(message, opts));
  queue = run.catch(() => false);
  return run;
}
