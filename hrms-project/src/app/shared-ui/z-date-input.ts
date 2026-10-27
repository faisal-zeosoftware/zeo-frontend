// v1.62.0 ui – every native date field shows dd/mm/yyyy (date and time: dd/mm/yyyy HH:mm), whatever the browser language.
//
// Chrome / Edge draw <input type="date"> in the order of the browser's language, so an en-US browser shows 10/01/2026
// (mm/dd). The 360+ date fields of the app keep their native input (value yyyy-mm-dd, ngModel / form controls, the
// calendar button and keyboard input unchanged); while a field is not being edited its own text is hidden and the date is
// painted in dd/mm/yyyy in the same place, font and colour (a canvas image as the field's background). When the field has
// the focus the native editor shows, so typing and the calendar work as before. Started once for the whole page
// (APP_INITIALIZER), it also covers fields added later, dialogs and the fields of the designer.
// Opt out: <input type="date" data-native-date>.

import { i18nT as T } from './i18n-core';

const SEL = 'input[type=date]:not([data-native-date]), input[type=datetime-local]:not([data-native-date])';
const VALUE = typeof HTMLInputElement !== 'undefined' ? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value') : undefined;
const tracked = new Set<HTMLInputElement>();
let started = false;
let canvas: HTMLCanvasElement | null = null;

function supported(): boolean {
  try { return typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('selector(::-webkit-datetime-edit)'); } catch { return false; }
}

const p2 = (s: string) => s.padStart(2, '0');
/** 2026-10-01 → 01/10/2026; 2026-10-01T08:30 → 01/10/2026 08:30 ('' when empty or not a date). */
export function dmyOfInput(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v || '');
  if (!m) { return ''; }
  return `${p2(m[3])}/${p2(m[2])}/${m[1]}` + (m[4] ? ` ${m[4]}:${m[5]}` : '');
}

function clear(i: HTMLInputElement): void {
  if (!i.classList.contains('zdi-on')) { return; }
  i.classList.remove('zdi-on');
  i.style.backgroundImage = i.dataset['zdiBg'] || '';
  i.style.backgroundRepeat = i.dataset['zdiRep'] || '';
  i.style.backgroundPosition = i.dataset['zdiPos'] || '';
  i.style.backgroundSize = i.dataset['zdiSize'] || '';
  delete i.dataset['zdiKey'];
}

function paint(i: HTMLInputElement): void {
  const type = (i.getAttribute('type') || '').toLowerCase();
  if ((type !== 'date' && type !== 'datetime-local') || i.hasAttribute('data-native-date')) { clear(i); return; }
  if (document.activeElement === i || !i.isConnected || i.offsetParent === null && getComputedStyle(i).position !== 'fixed') { clear(i); return; }
  const v = VALUE ? (VALUE.get!.call(i) as string) : i.value;
  const text = dmyOfInput(v) || (type === 'date' ? T('dd/mm/yyyy') : T('dd/mm/yyyy') + ' --:--');
  const cs = getComputedStyle(i);
  const empty = !dmyOfInput(v);
  const color = empty || i.disabled ? (empty ? '#8a8fa3' : '#9aa0b0') : cs.color;
  const rtl = cs.direction === 'rtl';
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const key = [text, font, color, rtl ? 'r' : 'l', cs.paddingLeft, cs.paddingRight, window.devicePixelRatio].join('|');
  if (i.dataset['zdiKey'] === key && i.classList.contains('zdi-on')) { return; }
  if (!i.classList.contains('zdi-on')) {
    i.dataset['zdiBg'] = i.style.backgroundImage; i.dataset['zdiRep'] = i.style.backgroundRepeat;
    i.dataset['zdiPos'] = i.style.backgroundPosition; i.dataset['zdiSize'] = i.style.backgroundSize;
  }
  canvas = canvas || document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) { return; }
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const size = parseFloat(cs.fontSize) || 13;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 2;
  const h = Math.ceil(size * 1.5);
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'middle';
  ctx.fillText(text, 1, h / 2 + 0.5);
  const url = canvas.toDataURL('image/png');
  const pad = rtl ? (parseFloat(cs.paddingRight) || 0) : (parseFloat(cs.paddingLeft) || 0);
  i.style.backgroundImage = `url("${url}")`;
  i.style.backgroundRepeat = 'no-repeat';
  i.style.backgroundSize = `${w}px ${h}px`;
  i.style.backgroundPosition = rtl ? `right ${pad}px center` : `left ${pad}px center`;
  i.classList.add('zdi-on');
  i.dataset['zdiKey'] = key;
}

function attach(i: HTMLInputElement): void {
  if (tracked.has(i)) { paint(i); return; }
  tracked.add(i);
  // Angular (ngModel / form controls) sets .value without an event: repaint on every set
  if (VALUE && !Object.prototype.hasOwnProperty.call(i, 'value')) {
    try {
      Object.defineProperty(i, 'value', {
        configurable: true, enumerable: true,
        get(this: HTMLInputElement) { return VALUE.get!.call(this); },
        set(this: HTMLInputElement, x: any) { VALUE.set!.call(this, x); queue(this); },
      });
    } catch { /* keep the native property */ }
  }
  const again = () => queue(i);
  i.addEventListener('focus', () => clear(i));
  i.addEventListener('blur', again);
  i.addEventListener('change', again);
  i.addEventListener('input', () => { if (document.activeElement !== i) { queue(i); } });
  paint(i);
}

const pending = new Set<HTMLInputElement>();
let raf = 0;
function queue(i: HTMLInputElement): void {
  pending.add(i);
  if (!raf) {
    raf = requestAnimationFrame(() => { raf = 0; const l = [...pending]; pending.clear(); l.forEach(paint); });
  }
}

function scan(root: ParentNode): void {
  if ((root as Element).matches?.(SEL)) { attach(root as HTMLInputElement); }
  root.querySelectorAll?.(SEL).forEach(e => attach(e as HTMLInputElement));
}

/** Start once (APP_INITIALIZER). */
export function startDateInputs(): void {
  if (started || typeof document === 'undefined' || !supported()) { return; }
  started = true;
  const go = () => {
    scan(document);
    new MutationObserver(recs => {
      for (const r of recs) {
        if (r.type === 'attributes') {
          const el = r.target as HTMLInputElement;
          if (el.tagName === 'INPUT') { if (el.matches(SEL)) { attach(el); } else if (tracked.has(el)) { clear(el); } }
          continue;
        }
        r.addedNodes.forEach(n => { if (n.nodeType === 1) { scan(n as Element); } });
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['type', 'disabled', 'data-native-date'] });
    // fields that become visible later (tabs, collapsed sections) and fonts that load late
    setInterval(() => tracked.forEach(i => { if (!i.isConnected) { tracked.delete(i); pending.delete(i); } else { paint(i); } }), 900);
  };
  if (document.body) { go(); } else { document.addEventListener('DOMContentLoaded', go, { once: true }); }
}
