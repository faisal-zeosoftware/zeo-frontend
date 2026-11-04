// v1.62.10 (item 174)
/**
 * v1.62.10 (item 174) – what the approval-level and escalation screens share: the kind of the route (route data `kind`),
 * the users who can approve (labelled by the person's name), the branches, and the texts of an approval type / a waiting time.
 */
import { AP62_KINDS, AP62_TYPES, Ap62Kind } from './ap62-kinds';
import { T } from '../time62/t62';

export interface Ap62User { id: number; username: string; label: string; }

export function ap62Kind(key: string): Ap62Kind { return AP62_KINDS[key] || AP62_KINDS['general']; }

/** users of the approver list, each with the person's name and code when the user is an employee */
export function ap62Users(list: any[], names: any[]): Ap62User[] {
  const by = new Map<string, any>();
  for (const n of names || []) { if (n && n.username) { by.set(String(n.username).toLowerCase(), n); } }
  return (list || []).filter(u => u && u.id).map(u => {
    const n = by.get(String(u.username || '').toLowerCase());
    const label = n?.name ? (n.code ? `${n.name} (${n.code})` : n.name) : (u.username || u.email || String(u.id));
    return { id: Number(u.id), username: String(u.username || ''), label };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

/** a user given as id or as user name → the id in the list (null when not there) */
export function ap62UserId(users: Ap62User[], v: any): number | null {
  if (v === null || v === undefined || v === '' || v === 0) { return null; }
  if (typeof v === 'number' || /^\d+$/.test(String(v))) { return Number(v); }
  const s = String(v).toLowerCase();
  return users.find(u => u.username.toLowerCase() === s)?.id ?? null;
}

export function ap62UserLabel(users: Ap62User[], v: any, fallback?: string): string {
  if (v === null || v === undefined || v === '') { return fallback || ''; }
  const id = ap62UserId(users, v);
  return users.find(u => u.id === id)?.label || fallback || String(v);
}

export function ap62TypeLabel(v: string): string { return T(AP62_TYPES.find(x => x.value === v)?.label || v || '–'); }

/** "2 days 4 hours" – the waiting time before a level escalates ('' when none) */
export function ap62After(d: any, h: any, m: any): string {
  const p: string[] = [];
  const n = (x: any) => Math.max(0, Number(x) || 0);
  if (n(d)) { p.push(n(d) === 1 ? T('1 day') : T('{0} days', [n(d)])); }
  if (n(h)) { p.push(n(h) === 1 ? T('1 hour') : T('{0} hours', [n(h)])); }
  if (n(m)) { p.push(n(m) === 1 ? T('1 minute') : T('{0} minutes', [n(m)])); }
  return p.join(' ');
}

/** branch names of a workflow row → ids */
export function ap62BranchIds(branches: any[], row: any): number[] {
  if (Array.isArray(row?.branch_ids)) { return row.branch_ids.map(Number); }
  const v = row?.branch;
  const list = Array.isArray(v) ? v : (v === null || v === undefined || v === '' ? [] : [v]);
  return list.map((b: any) => typeof b === 'number' || /^\d+$/.test(String(b)) ? Number(b) : branches.find(x => x.branch_name === b)?.id)
    .filter((x: any) => x !== undefined && x !== null);
}
