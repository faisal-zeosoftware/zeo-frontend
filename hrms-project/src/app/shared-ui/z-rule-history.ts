// v1.67.12 (effective): new file
/**
 * v1.67.12 (effective, item 64) – the dated versions of a setup record ("effective from"): leave policy, leave type, overtime policy,
 * gratuity table, air ticket policy, pay structure, attendance rule. One window in the new design (as z-confirm.ts): each version with
 * its dates, what changed, who and when; "In force today" / "Future" tags. Plain DOM, texts through the translator.
 *
 *   openRuleHistory('leave_policy', policy.id, policy.name)
 *   zEffectiveParam(date)   → '?effective_from=2026-12-01' (or '') for the save URL of a dated change
 */
import { i18nT } from './i18n-core';
import { environment } from '../../environments/environment';

export type ZRuleKind = 'leave_policy' | 'leave_type' | 'overtime_policy' | 'gratuity' | 'air_ticket_policy' | 'pay_structure' | 'attendance_rule';

/** the hint of every "Effective from" field */
export const EFFECTIVE_HINT = 'Empty = a correction for every period. A date = the old rule stays for the periods before it (payroll re-runs, leave accrual, end of service).';

/** the query of a save with an effective date ('' without a date) – `join` '&' when the URL already has a query */
export function zEffectiveParam(d: string | null | undefined, join: '?' | '&' = '?'): string {
  const v = String(d || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${join}effective_from=${v}` : '';
}

const CSS = `
.zrh-host { position: fixed; inset: 0; z-index: 1450; display: grid; place-items: center; font-family: inherit; }
.zrh-veil { position: absolute; inset: 0; background: rgba(27,22,64,.38); }
.zrh-box { position: relative; width: min(820px, calc(100vw - 32px)); max-height: calc(100vh - 48px); display: flex; flex-direction: column; background: #fff;
  border-radius: 14px; box-shadow: 0 24px 60px rgba(27,22,64,.28); font-size: 13.5px; color: #1d2033; outline: none; }
.zrh-head { display: flex; justify-content: space-between; gap: 12px; padding: 18px 22px 10px; border-bottom: 1px solid #eceef5; }
.zrh-title { margin: 0; font-size: 17px; font-weight: 600; color: #1b1640; }
.zrh-sub { margin: 4px 0 0; color: #6b7185; font-size: 12.5px; line-height: 1.45; }
.zrh-x { border: 0; background: transparent; font-size: 22px; line-height: 1; color: #6b7185; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
.zrh-body { padding: 10px 22px 18px; overflow: auto; }
.zrh-v { border: 1px solid #eceef5; border-radius: 12px; padding: 10px 14px; margin: 10px 0; }
.zrh-v.now { border-color: #b8b2f5; background: #f7f6ff; }
.zrh-vh { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; }
.zrh-vh b { font-size: 14px; color: #1b1640; font-variant-numeric: tabular-nums; }
.zrh-tag { font-size: 11.5px; font-weight: 700; border-radius: 10px; padding: 2px 8px; background: #eceef5; color: #3b3f55; }
.zrh-tag.now { background: #5b4fe0; color: #fff; } .zrh-tag.fut { background: #fff4e0; color: #8a5300; }
.zrh-by { color: #6b7185; font-size: 12px; margin-inline-start: auto; }
.zrh-ch { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px; }
.zrh-ch th, .zrh-ch td { text-align: start; padding: 5px 8px; border-top: 1px solid #f0f1f6; vertical-align: top; overflow-wrap: anywhere; }
.zrh-ch th { color: #6b7185; font-weight: 600; }
.zrh-none { color: #6b7185; margin: 6px 0 0; }
.zrh-empty { color: #3b3f55; background: #f8f9fc; border-radius: 10px; padding: 12px 14px; line-height: 1.5; }
.zrh-foot { display: flex; justify-content: flex-end; padding: 12px 22px; border-top: 1px solid #eceef5; }
.zrh-btn { height: 36px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe1ea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; color: #1d2033; }
@media (max-width: 640px) { .zrh-ch th:nth-child(2), .zrh-ch td:nth-child(2) { white-space: normal; } .zrh-by { margin-inline-start: 0; flex-basis: 100%; } }
`;

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
}
function dmy(v: string | null | undefined): string {
  if (!v) { return ''; }
  const [y, m, d] = String(v).slice(0, 10).split('-');
  return d ? `${d}/${m}/${y}` : String(v);
}

/** Open the history window of one record (kind 'gratuity': the whole table, id ignored). */
export async function openRuleHistory(kind: ZRuleKind, id: number | string | null, title?: string): Promise<void> {
  if (typeof document === 'undefined') { return; }
  if (!document.getElementById('zrh-css')) {
    const st = document.createElement('style'); st.id = 'zrh-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  const t = (s: string, p?: any[]) => i18nT(s, p);
  const prev = document.activeElement as HTMLElement | null;
  const host = document.createElement('div');
  host.className = 'zrh-host'; host.setAttribute('data-zrule-history', kind);
  const rtl = document.documentElement.dir === 'rtl' || document.body?.dir === 'rtl';
  if (rtl) { host.dir = 'rtl'; }
  host.innerHTML = `<div class="zrh-veil"></div>
<div class="zrh-box" role="dialog" aria-modal="true" aria-labelledby="zrh-t" tabindex="-1">
  <div class="zrh-head"><div><h2 class="zrh-title" id="zrh-t">${esc(t('History of changes'))}${title ? ' – ' + esc(title) : ''}</h2>
    <p class="zrh-sub">${esc(t('Each version applies from its date until the next one; calculations of a period use the version in force then.'))}</p></div>
    <button type="button" class="zrh-x" data-zrh-close aria-label="${esc(t('Close'))}">×</button></div>
  <div class="zrh-body" data-zrh-body><p class="zrh-none">${esc(t('Loading…'))}</p></div>
  <div class="zrh-foot"><button type="button" class="zrh-btn" data-zrh-close>${esc(t('Close'))}</button></div>
</div>`;
  document.body.appendChild(host);
  const box = host.querySelector('.zrh-box') as HTMLElement;
  const close = () => { host.remove(); document.removeEventListener('keydown', onKey, true); try { prev?.focus(); } catch { /* gone */ } };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  document.addEventListener('keydown', onKey, true);
  host.querySelectorAll('[data-zrh-close]').forEach(b => b.addEventListener('click', close));
  host.querySelector('.zrh-veil')!.addEventListener('click', close);
  box.focus();
  const body = host.querySelector('[data-zrh-body]') as HTMLElement;
  let data: any = null;
  try {
    const sch = localStorage.getItem('selectedSchema') || '';
    const h: any = { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') };
    try { const l = localStorage.getItem('zeoLang'); if (l) { h['X-Language'] = l; } } catch { /* storage off */ }
    const q = `kind=${encodeURIComponent(kind)}${id !== null && id !== undefined ? '&id=' + encodeURIComponent(String(id)) : ''}&schema=${encodeURIComponent(sch)}`;
    const res = await fetch(`${environment.apiBaseUrl}/payroll-plus/api/rule-versions/?${q}`, { headers: h });
    data = res.ok ? await res.json() : null;
  } catch { data = null; }
  if (!data) { body.innerHTML = `<p class="zrh-empty">${esc(t('The history could not be loaded.'))}</p>`; return; }
  const vs: any[] = data.versions || [];
  if (!vs.length) {
    body.innerHTML = `<p class="zrh-empty" data-zrh-empty>${esc(t('No dated changes yet. To change this rule from a date, fill in "Effective from" when you save it – the periods before that date keep the rule as it is now.'))}</p>`;
    return;
  }
  body.innerHTML = vs.slice().reverse().map(v => {
    const when = v.base ? t('Before the first dated change') : t('From {0}', [dmy(v.effective_from)]);
    const until = v.until ? t('until {0}', [dmy(v.until)]) : t('no end date');
    const tag = v.in_force ? `<span class="zrh-tag now">${esc(t('In force today'))}</span>` : v.future ? `<span class="zrh-tag fut">${esc(t('Future'))}</span>` : '';
    const by = [v.created_by, v.created_at ? dmy(v.created_at) : ''].filter(Boolean).join(' · ');
    const ch = (v.changes || []).length
      ? `<table class="zrh-ch" zPlain><thead><tr><th>${esc(t('Field'))}</th><th>${esc(t('Before'))}</th><th>${esc(t('From this date'))}</th></tr></thead><tbody>${
          v.changes.map((c: any) => `<tr><td>${esc(c.field)}</td><td>${esc(c.before)}</td><td>${esc(c.after)}</td></tr>`).join('')}</tbody></table>`
      : `<p class="zrh-none">${esc(v.base ? t('The rule as it was before the first dated change.') : t('No field changed.'))}</p>`;
    return `<div class="zrh-v${v.in_force ? ' now' : ''}" data-zrh-version="${esc(v.effective_from || 'base')}"><div class="zrh-vh"><b>${esc(when)}</b><span>${esc(until)}</span>${tag}<span class="zrh-by">${esc(by)}</span></div>${ch}</div>`;
  }).join('');
}
