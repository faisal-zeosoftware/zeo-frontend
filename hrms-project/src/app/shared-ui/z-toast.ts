/**
 * v1.19.0 design rules – messages as a small toast instead of the browser's alert() box.
 * Every alert() in the screens (about 1,800 calls) now shows a toast at the bottom of the page: green for done, red for problems,
 * dark for information. It does not block the page; click it to close. A toast shown just before a page reload is kept for a few
 * seconds and shown again after the reload. confirm() stays a real question.
 * Also `zToast(text, kind)` for new code.
 */
export type ZToastKind = 'ok' | 'err' | 'info';

const BAD = /\b(fail|failed|error|errors|could not|couldn't|cannot|can't|not allowed|invalid|required|denied|refused|missing|not found|wrong|already exists|unable|please (select|enter|fill|choose|provide)|must|exceed|no permission|do not have)\b/i;
const GOOD = /\b(success|successfully|saved|created|added|updated|deleted|removed|approved|rejected|submitted|sent|done|uploaded|imported|completed|assigned|generated|cancelled|restored|published|copied)\b/i;
const KEY = 'zeo_toast_queue';
let host: HTMLElement | null = null;

function kindOf(text: string): ZToastKind {
  if (BAD.test(text)) { return 'err'; }
  if (GOOD.test(text)) { return 'ok'; }
  return 'info';
}

function ensureHost(): HTMLElement {
  if (host && document.body.contains(host)) { return host; }
  host = document.createElement('div');
  host.className = 'ztoast-host';
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  document.body.appendChild(host);
  return host;
}

export function zToast(message: any, kind?: ZToastKind, remember = true): void {
  const text = message === undefined || message === null ? '' : (typeof message === 'string' ? message : (() => { try { return JSON.stringify(message); } catch { return String(message); } })());
  if (!text.trim()) { return; }
  const k = kind || kindOf(text);
  if (remember) {
    try {
      const q = JSON.parse(sessionStorage.getItem(KEY) || '[]').filter((x: any) => Date.now() - x.t < 4000);
      q.push({ m: text, k, t: Date.now() });
      sessionStorage.setItem(KEY, JSON.stringify(q.slice(-3)));
      setTimeout(() => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }, 3500);
    } catch { /* storage not available */ }
  }
  const el = document.createElement('div');
  el.className = `ztoast ztoast-${k}`;
  const icon = document.createElement('span');
  icon.className = 'ztoast-ic';
  icon.textContent = k === 'ok' ? '✓' : (k === 'err' ? '!' : 'i');
  icon.setAttribute('aria-hidden', 'true');
  const body = document.createElement('div');
  body.className = 'ztoast-tx';
  body.textContent = text;
  const x = document.createElement('button');
  x.type = 'button'; x.className = 'ztoast-x'; x.textContent = '×'; x.setAttribute('aria-label', 'Close');
  el.append(icon, body, x);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  x.onclick = close; el.onclick = close;
  ensureHost().appendChild(el);
  setTimeout(close, k === 'err' ? 9000 : 5000);
}

/** Replace window.alert with the toast and replay a toast queued just before a reload. Call once before bootstrap. */
export function installToasts(): void {
  if (typeof window === 'undefined' || (window as any).__zToast) { return; }
  (window as any).__zToast = true;
  window.alert = (m?: any) => zToast(m);
  const replay = () => {
    try {
      const q = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      sessionStorage.removeItem(KEY);
      q.filter((x: any) => Date.now() - x.t < 4000).forEach((x: any) => zToast(x.m, x.k, false));
    } catch { /* ignore */ }
  };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', replay); } else { replay(); }
}
