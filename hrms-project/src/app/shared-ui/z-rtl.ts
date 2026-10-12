/**
 * v1.15.0 (langrtl) – right-to-left layout at runtime, like rtlcss but done in the browser.
 *
 * The 220+ screens were written for left-to-right with physical CSS (margin-left, left: 0, text-align: left …).
 * Instead of hand-writing a mirror rule for every one of them, when the language is right-to-left this mirrors the
 * app's own stylesheets in place (global styles.css + every component <style> Angular injects, also later ones):
 *   left ↔ right, margin/padding/border/radius left ↔ right, text-align / float / clear left ↔ right,
 *   box-shadow x offset, translate X, background-position X.
 * The original values are kept, so switching back to English restores them without a reload.
 * Not touched: rules whose selector mentions [dir] / :dir() / .rtl (already direction-aware), component styles that
 * contain their own [dir=rtl] rules (Angular Material), cross-origin CDN sheets, @keyframes.
 * Icons that show a direction (arrow_back, chevron_right …) get the class `z-mirror` (flipped by src/zrtl.css).
 * Elements whose whole text is a phone-like / signed number ("+971 50 123 4567", "050 123 4567", "-1,200.00") get the
 * class `z-ltr` (left-to-right, isolated) so the digit groups and the sign keep their order inside Arabic text.
 * Pairs and ranges ("4 / 26", "09:00 - 17:00") are left to the bidi algorithm: in an Arabic line they read right to left
 * in the same order as their Arabic caption ("مرات / دقائق").
 * Fine-tuning and things that are not in stylesheets (fonts, numbers, CDN Bootstrap 4 classes) live in src/zrtl.css.
 * Escape hatch: a rule whose selector contains `.z-no-mirror` is never mirrored, and nothing inside an element with
 * the attribute `data-no-mirror` gets its icons flipped.
 */

type Saved = { style: CSSStyleDeclaration; props: [string, string, string][] };

const PAIRS: [string, string][] = [
  ['left', 'right'],
  ['margin-left', 'margin-right'],
  ['padding-left', 'padding-right'],
  ['border-left-width', 'border-right-width'],
  ['border-left-style', 'border-right-style'],
  ['border-left-color', 'border-right-color'],
  ['border-top-left-radius', 'border-top-right-radius'],
  ['border-bottom-left-radius', 'border-bottom-right-radius'],
  ['scroll-margin-left', 'scroll-margin-right'],
  ['scroll-padding-left', 'scroll-padding-right'],
];
const SWAP_VALUE = ['text-align', 'float', 'clear'];
const ALL_PROPS = new Set<string>([...PAIRS.flat(), ...SWAP_VALUE, 'box-shadow', 'transform', 'background-position-x', 'translate']);

/** Material icon names that point to a side (mirrored in right-to-left, as Material Design asks). */
const MIRROR_ICONS = new Set<string>([
  'arrow_back', 'arrow_forward', 'arrow_back_ios', 'arrow_forward_ios', 'arrow_back_ios_new', 'arrow_right_alt', 'arrow_left',
  'arrow_right', 'chevron_left', 'chevron_right', 'navigate_before', 'navigate_next', 'keyboard_arrow_left', 'keyboard_arrow_right',
  'keyboard_double_arrow_left', 'keyboard_double_arrow_right', 'first_page', 'last_page', 'east', 'west', 'trending_flat',
  'logout', 'login', 'exit_to_app', 'input', 'output', 'send', 'reply', 'reply_all', 'forward', 'undo', 'redo', 'redo_outlined',
  'open_in_new', 'launch', 'call_made', 'call_received', 'subdirectory_arrow_right', 'subdirectory_arrow_left', 'turn_right',
  'turn_left', 'read_more', 'menu_open', 'format_indent_increase', 'format_indent_decrease', 'list', 'view_list', 'sort',
  'short_text', 'notes', 'wrap_text', 'label', 'label_important', 'help_outline', 'drive_file_move', 'next_plan', 'start',
  'double_arrow', 'arrow_circle_right', 'arrow_circle_left', 'segment', 'playlist_add', 'playlist_add_check', 'rule',
  'trending_up', 'trending_down', 'show_chart', 'multiline_chart', 'directions_run', 'directions_walk', 'flight_takeoff', 'flight_land',
]);

let on = false;
const saved = new Map<CSSStyleSheet, Saved[]>();
let headObserver: MutationObserver | null = null;
let bodyObserver: MutationObserver | null = null;
let pending = false;

function swapWord(v: string): string {
  return v.replace(/\b(left|right)\b/g, w => (w === 'left' ? 'right' : 'left'));
}

function negate(v: string): string {
  const t = v.trim();
  if (!t || t === '0' || /^0[a-z%]*$/.test(t)) { return t; }
  if (/^-?[\d.]+[a-z%]*$/.test(t)) { return t.startsWith('-') ? t.slice(1) : '-' + t; }
  return `calc(-1 * (${t}))`;
}

/** split a CSS value on top-level commas / spaces (not inside parentheses) */
function splitTop(v: string, sep: string): string[] {
  const out: string[] = []; let depth = 0; let cur = '';
  for (const ch of v) {
    if (ch === '(') { depth++; } else if (ch === ')') { depth--; }
    if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) { if (cur.trim()) { out.push(cur.trim()); } cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) { out.push(cur.trim()); }
  return out;
}

function mirrorShadow(v: string): string {
  if (!v || v === 'none') { return v; }
  return splitTop(v, ',').map(sh => {
    const parts = splitTop(sh, ' ');
    const i = parts.findIndex(p => /^-?[\d.]/.test(p) || p.startsWith('calc('));
    if (i >= 0) { parts[i] = negate(parts[i]); }
    return parts.join(' ');
  }).join(', ');
}

function mirrorTransform(v: string): string {
  if (!v || v === 'none') { return v; }
  return v
    .replace(/translateX\(([^()]*(?:\([^()]*\))?[^()]*)\)/g, (_m, a) => `translateX(${negate(a)})`)
    .replace(/translate\(([^(),]*(?:\([^()]*\))?[^(),]*)(,[^)]*)?\)/g, (_m, a, b) => `translate(${negate(a)}${b || ''})`)
    .replace(/translate3d\(([^(),]*(?:\([^()]*\))?[^(),]*),/g, (_m, a) => `translate3d(${negate(a)},`);
}

function mirrorTranslateProp(v: string): string {
  if (!v || v === 'none') { return v; }
  const parts = splitTop(v, ' ');
  parts[0] = negate(parts[0]);
  return parts.join(' ');
}

function mirrorBgX(v: string): string {
  return splitTop(v, ',').map(x => {
    const t = x.trim();
    if (/\b(left|right)\b/.test(t)) { return swapWord(t); }
    const m = /^(-?[\d.]+)%$/.exec(t);
    if (m) { return (100 - parseFloat(m[1])) + '%'; }
    if (/^-?[\d.]+(px|rem|em)$/.test(t)) { return t === '0px' ? '100%' : `right ${t}`; }
    return t;
  }).join(', ');
}

function mirrorStyle(style: CSSStyleDeclaration): Saved | null {
  // quick check: does the rule have any directional property at all?
  let any = false;
  for (let i = 0; i < style.length; i++) { if (ALL_PROPS.has(style[i])) { any = true; break; } }
  if (!any) { return null; }
  const props: [string, string, string][] = [];
  const keep = (p: string) => props.push([p, style.getPropertyValue(p), style.getPropertyPriority(p)]);
  const changes: [string, string, string][] = [];
  for (const [a, b] of PAIRS) {
    const va = style.getPropertyValue(a); const vb = style.getPropertyValue(b);
    if (!va && !vb) { continue; }
    if (va === vb && style.getPropertyPriority(a) === style.getPropertyPriority(b)) { continue; }
    keep(a); keep(b);
    changes.push([a, vb, style.getPropertyPriority(b)], [b, va, style.getPropertyPriority(a)]);
  }
  for (const p of SWAP_VALUE) {
    const v = style.getPropertyValue(p);
    if (v && /\b(left|right)\b/.test(v)) { keep(p); changes.push([p, swapWord(v), style.getPropertyPriority(p)]); }
  }
  const bs = style.getPropertyValue('box-shadow');
  if (bs && bs !== 'none' && !bs.includes('var(')) { const m = mirrorShadow(bs); if (m !== bs) { keep('box-shadow'); changes.push(['box-shadow', m, style.getPropertyPriority('box-shadow')]); } }
  const tf = style.getPropertyValue('transform');
  if (tf && /translate/.test(tf) && !tf.includes('var(')) { const m = mirrorTransform(tf); if (m !== tf) { keep('transform'); changes.push(['transform', m, style.getPropertyPriority('transform')]); } }
  const tr = style.getPropertyValue('translate');
  if (tr && tr !== 'none' && !tr.includes('var(')) { keep('translate'); changes.push(['translate', mirrorTranslateProp(tr), style.getPropertyPriority('translate')]); }
  const bx = style.getPropertyValue('background-position-x');
  if (bx && !bx.includes('var(')) { const m = mirrorBgX(bx); if (m !== bx) { keep('background-position-x'); changes.push(['background-position-x', m, style.getPropertyPriority('background-position-x')]); } }
  if (!changes.length) { return null; }
  // remove first, then set (a ↔ b swaps must not overwrite each other)
  for (const [p] of changes) { style.removeProperty(p); }
  for (const [p, v, pr] of changes) { if (v) { style.setProperty(p, v, pr); } }
  return { style, props };
}

function skipSheet(sheet: CSSStyleSheet): boolean {
  const node = sheet.ownerNode as Element | null;
  if (node && node.tagName === 'STYLE') {
    const txt = node.textContent || '';
    if (/\[dir=["']?rtl|:dir\(rtl\)/.test(txt)) { return true; }   // already direction-aware (Angular Material …)
  }
  if (node && node.hasAttribute && node.hasAttribute('data-no-mirror')) { return true; }
  return false;
}

function walkRules(rules: CSSRuleList, out: Saved[]): void {
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i] as CSSRule & { cssRules?: CSSRuleList; selectorText?: string; style?: CSSStyleDeclaration };
    if (r.type === 1 /* STYLE_RULE */) {
      const sel = r.selectorText || '';
      if (/\[dir|:dir\(|\.rtl\b|\.z-no-mirror|\[lang/.test(sel)) { continue; }
      const s = mirrorStyle(r.style!);
      if (s) { out.push(s); }
      if (r.cssRules && r.cssRules.length) { walkRules(r.cssRules, out); }   // CSS nesting
    } else if (r.cssRules && r.type !== 7 /* KEYFRAMES */) {
      walkRules(r.cssRules, out);   // @media, @supports, @layer, @container
    }
  }
}

function mirrorSheet(sheet: CSSStyleSheet): void {
  if (saved.has(sheet)) { return; }
  let rules: CSSRuleList;
  try { rules = sheet.cssRules; } catch { return; }   // cross-origin CDN sheet: not readable
  if (skipSheet(sheet)) { saved.set(sheet, []); return; }
  const out: Saved[] = [];
  walkRules(rules, out);
  saved.set(sheet, out);
}

function restoreAll(): void {
  saved.forEach(list => list.forEach(s => {
    for (const [p] of s.props) { s.style.removeProperty(p); }
    for (const [p, v, pr] of s.props) { if (v) { s.style.setProperty(p, v, pr); } }
  }));
  saved.clear();
}

function scanSheets(): void {
  // forget sheets Angular removed (component destroyed); they come back as new <style> elements
  saved.forEach((_l, sh) => { const n = sh.ownerNode as Node | null; if (!n || !n.isConnected) { saved.delete(sh); } });
  for (const sh of Array.from(document.styleSheets)) { mirrorSheet(sh); }
}

function iconName(el: Element): string {
  return (el.getAttribute('fontIcon') || el.getAttribute('data-icon') || el.textContent || '').trim();
}

function markIcons(root: ParentNode): void {
  const list = root.querySelectorAll ? root.querySelectorAll('mat-icon, .material-icons, .material-icons-outlined, .material-symbols-outlined') : [];
  list.forEach(el => markIcon(el));
  if ((root as Element).matches?.('mat-icon, .material-icons, .material-icons-outlined, .material-symbols-outlined')) { markIcon(root as Element); }
}

function markIcon(el: Element): void {
  const want = on && MIRROR_ICONS.has(iconName(el)) && !el.closest('[data-no-mirror]');
  el.classList.toggle('z-mirror', want);
}

/** phone-like digit groups and signed numbers: the bidi algorithm would reorder these in a right-to-left line */
const WEAK_ONLY = /^[\s\d+\-\u2212.,()]+$/;
function needsLtr(t: string): boolean {
  if (/^\s*[+\-\u2212]\s*\d/.test(t)) { return true; }                       // +971 50 …, -1,200.00
  return /^[\d\s().-]+$/.test(t) && t.trim().split(/\s+/).length >= 3;     // 050 123 4567, (04) 123 4567
}
const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'OPTION', 'SELECT', 'SCRIPT', 'STYLE', 'TD', 'TH', 'CODE', 'PRE', 'MAT-ICON', 'svg', 'text', 'tspan']);

function checkNumberEl(el: Element | null): void {
  if (!el || SKIP_TAGS.has(el.tagName) || el.classList.contains('material-icons')) { return; }
  const t = el.textContent || '';
  const want = on && t.length < 80 && /\d/.test(t) && WEAK_ONLY.test(t) && needsLtr(t) && el.childElementCount === 0;
  if (want !== el.classList.contains('z-ltr')) { el.classList.toggle('z-ltr', want); }
}

function markNumbers(root: Node): void {
  if (root.nodeType === 3) { checkNumberEl(root.parentElement); return; }
  if (root.nodeType !== 1) { return; }
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const v = n.nodeValue || '';
    if (v.length < 80 && /\d/.test(v)) { checkNumberEl(n.parentElement); }
  }
}

function schedule(): void {
  if (pending) { return; }
  pending = true;
  requestAnimationFrame(() => { pending = false; if (on) { scanSheets(); } });
}

/** Turn right-to-left mirroring on or off (called by I18nService whenever the language pack changes). */
export function setRtlMirror(rtl: boolean): void {
  if (typeof document === 'undefined') { return; }
  if (rtl === on) { return; }
  on = rtl;
  if (rtl) {
    scanSheets();
    markIcons(document.body);
    markNumbers(document.body);
    headObserver = new MutationObserver(muts => {
      // new component styles: mirror them right away (before the next paint) – <link> sheets once loaded
      let again = false;
      for (const m of muts) {
        m.addedNodes.forEach(n => {
          if (n instanceof HTMLStyleElement && n.sheet) { mirrorSheet(n.sheet); }
          else if (n instanceof HTMLLinkElement) { n.addEventListener('load', () => schedule(), { once: true }); again = true; }
        });
      }
      if (again) { schedule(); }
    });
    headObserver.observe(document.head, { childList: true });
    bodyObserver = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'characterData') {
          const icon = m.target.parentElement?.closest('mat-icon, .material-icons, .material-icons-outlined, .material-symbols-outlined');
          if (icon) { markIcon(icon); } else { checkNumberEl(m.target.parentElement); }
          continue;
        }
        const t = m.target as Element;
        if (t.nodeType === 1 && t.matches('mat-icon, .material-icons, .material-icons-outlined, .material-symbols-outlined')) { markIcon(t); }
        else if (t.nodeType === 1) { checkNumberEl(t); }
        m.addedNodes.forEach(n => { if (n.nodeType === 1) { markIcons(n as Element); } markNumbers(n); });
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  } else {
    headObserver?.disconnect(); headObserver = null;
    bodyObserver?.disconnect(); bodyObserver = null;
    restoreAll();
    document.querySelectorAll('.z-mirror').forEach(el => el.classList.remove('z-mirror'));
    document.querySelectorAll('.z-ltr').forEach(el => el.classList.remove('z-ltr'));
  }
}

/** true while the right-to-left mirroring is on */
export function rtlMirrorOn(): boolean { return on; }
