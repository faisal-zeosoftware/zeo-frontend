/**
 * v1.16.0 – dashboard periods (same presets as DashboardManagement/period.py).
 * A dashboard has one period; a card can have its own (saved with the layout).
 */
export type DashPreset = 'today' | 'yesterday' | 'this_week' | 'last_7' | 'this_month' | 'last_30' | 'this_quarter' | 'this_year' | 'custom';

export interface DashPeriodSetting { preset: DashPreset | 'dashboard'; from?: string; to?: string; }
export interface DashPeriod { preset: DashPreset; from: string; to: string; label: string; }
/** What a dashboard gets from the designer: its period and the cards that have another one. */
export interface DashPeriods { dash: DashPeriod; cards: Record<string, DashPeriod>; }

export const DASH_PRESETS: { k: DashPreset; l: string }[] = [
  { k: 'today', l: 'Today' }, { k: 'yesterday', l: 'Yesterday' }, { k: 'this_week', l: 'This week' }, { k: 'last_7', l: 'Last 7 days' },
  { k: 'this_month', l: 'This month' }, { k: 'last_30', l: 'Last 30 days' }, { k: 'this_quarter', l: 'This quarter' }, { k: 'this_year', l: 'This year' },
  { k: 'custom', l: 'Custom dates' },
];

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function presetRange(p: DashPreset, now = new Date()): [string, string] {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const day = (yy: number, mm: number, dd: number) => isoDay(new Date(yy, mm, dd));
  switch (p) {
    case 'today': return [day(y, m, d), day(y, m, d)];
    case 'yesterday': return [day(y, m, d - 1), day(y, m, d - 1)];
    case 'this_week': { const wd = (now.getDay() + 6) % 7; return [day(y, m, d - wd), day(y, m, d - wd + 6)]; }
    case 'last_7': return [day(y, m, d - 6), day(y, m, d)];
    case 'last_30': return [day(y, m, d - 29), day(y, m, d)];
    case 'this_quarter': { const q = m - (m % 3); return [day(y, q, 1), day(y, q + 3, 0)]; }
    case 'this_year': return [day(y, 0, 1), day(y, 11, 31)];
    default: return [day(y, m, 1), day(y, m + 1, 0)];
  }
}

const FMT = (s: string, withYear: boolean) => {
  const [y, m, d] = s.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]}${withYear ? ' ' + y : ''}`;
};

/** The period a setting stands for, with a short label (English; the screen translates the preset labels). */
export function resolvePeriod(s: DashPeriodSetting | null | undefined, fallback: DashPreset = 'this_month'): DashPeriod {
  if (s && s.preset === 'custom' && s.from && s.to) {
    const [a, b] = s.from <= s.to ? [s.from, s.to] : [s.to, s.from];
    const hit = DASH_PRESETS.find(p => p.k !== 'custom' && presetRange(p.k).join() === [a, b].join());
    if (hit) { return { preset: hit.k, from: a, to: b, label: hit.l }; }
    return { preset: 'custom', from: a, to: b, label: a === b ? FMT(a, true) : `${FMT(a, a.slice(0, 4) !== b.slice(0, 4))} – ${FMT(b, true)}` };
  }
  const p = (s && s.preset && s.preset !== 'custom' && s.preset !== 'dashboard' ? s.preset : fallback) as DashPreset;
  const [a, b] = presetRange(p);
  return { preset: p, from: a, to: b, label: DASH_PRESETS.find(x => x.k === p)!.l };
}

/** Query string for an API call with a period: &from=…&to=… */
export function periodQuery(p?: DashPeriod | null): string {
  return p ? `&from=${p.from}&to=${p.to}` : '';
}

/** The dashboard period saved on this device by the designer (before the designer is on the page). */
export function savedPeriod(name: string): DashPeriod {
  try { const x = JSON.parse(localStorage.getItem('zdd2:' + name) || 'null'); return resolvePeriod(x?.period || null); } catch { return resolvePeriod(null); }
}
