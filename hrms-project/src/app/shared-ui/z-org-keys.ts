import { BehaviorSubject } from 'rxjs';

/**
 * v1.12.0 – the organisation fields the list tools (z-list) and employee pickers (z-org-pick) offer as filters:
 * Branch / Department / Designation / Category plus the fields switched on in Organisation settings
 * (Location, Division, Section, Cost centre, Grade, Job position, Employment type). OrgSettingsService
 * updates the list when the settings are loaded or saved; Category drops out when employee categories are off.
 * `key` is the property of a directory row (tools/api/directory/) that holds the value.
 */
export interface OrgKeyDef { key: string; label: string; re: RegExp; }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const BASE_ORG_KEYS: OrgKeyDef[] = [
  { key: 'branch', label: 'Branch', re: /^(branch|branches|branch name|work location|location)$/i },
  { key: 'department', label: 'Department', re: /^(department|dept|departments|department name)$/i },
  { key: 'designation', label: 'Designation', re: /^(designation|job title|position|designations)$/i },
  { key: 'category', label: 'Category', re: /^(category|employee category|categories)$/i },
];

export const ORG_KEYS$ = new BehaviorSubject<OrgKeyDef[]>(BASE_ORG_KEYS);

export function orgKeys(): OrgKeyDef[] { return ORG_KEYS$.value; }

/** extra: [{key: 'section', label: 'Unit'}...] in display order; categories: false hides Category. */
export function setOrgKeys(extra: { key: string; label: string }[], categories = true, categoryLabel = 'Category'): void {
  const locOn = extra.some(e => e.key === 'location');
  const posOn = extra.some(e => e.key === 'job_position');
  const base = BASE_ORG_KEYS.filter(o => categories || o.key !== 'category').map(o => {
    if (o.key === 'branch' && locOn) { return { ...o, re: /^(branch|branches|branch name)$/i }; }        // "Location" is its own field now
    if (o.key === 'designation' && posOn) { return { ...o, re: /^(designation|job title|designations)$/i }; }
    if (o.key === 'category' && categoryLabel && categoryLabel !== 'Category') {
      return { ...o, label: categoryLabel, re: new RegExp(`^(category|employee category|categories|${esc(categoryLabel)})$`, 'i') };
    }
    return o;
  });
  const extras = extra.map(e => {
    const words = [e.label, e.key.replace(/_/g, ' ')];
    if (e.key === 'cost_center') { words.push('cost center', 'cost centre'); }
    if (e.key === 'job_position') { words.push('position'); }
    if (e.key === 'location') { words.push('location', 'work site', 'site'); }
    return { key: e.key, label: e.label, re: new RegExp(`^(${words.map(w => esc(w.toLowerCase())).join('|')})s?$`, 'i') };
  });
  const next = [...base, ...extras];
  const same = next.length === ORG_KEYS$.value.length && next.every((o, i) => o.key === ORG_KEYS$.value[i].key && o.label === ORG_KEYS$.value[i].label);
  if (!same) { ORG_KEYS$.next(next); }
}
