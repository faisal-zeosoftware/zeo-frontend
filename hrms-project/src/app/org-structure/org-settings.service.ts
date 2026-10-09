import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, take, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { setOrgKeys } from '../shared-ui/z-org-keys';

/**
 * v1.12.0 – Organisation settings (which org fields the company uses, their labels and whether the
 * employee form requires them). Cached per company; every screen can use it:
 *
 *   constructor(public org: OrgSettingsService) {}
 *   this.org.load().subscribe(() => …);          // or org.settings$ | async
 *   org.isOn('sections')  org.label('sections')  org.mandatory('sections')
 *
 * Keys: locations, divisions, sections, cost_centers, grades, job_positions, employment_types, employee_categories.
 * Employee field names (EmployeeOrg / directory): location, division, section, cost_center, grade, job_position, employment_type.
 */
export type OrgKey = 'locations' | 'divisions' | 'sections' | 'cost_centers' | 'grades' | 'job_positions' | 'employment_types' | 'employee_categories';
export type OrgField = 'location' | 'division' | 'section' | 'cost_center' | 'grade' | 'job_position' | 'employment_type';

export interface OrgSettings {
  use_locations: boolean; use_divisions: boolean; use_sections: boolean; use_cost_centers: boolean; use_grades: boolean;
  use_job_positions: boolean; use_employment_types: boolean; use_employee_categories: boolean;
  labels: Record<string, string>; mandatory: Record<string, boolean>; active_fields: OrgKey[]; default_labels: Record<string, string>;
  can_change?: boolean; updated_at?: string;
}

/** employee field ↔ settings key, in display order (right after Department on the forms) */
export const ORG_FIELDS: { field: OrgField; key: OrgKey; endpoint: string }[] = [
  { field: 'location', key: 'locations', endpoint: 'locations' },
  { field: 'division', key: 'divisions', endpoint: 'divisions' },
  { field: 'section', key: 'sections', endpoint: 'sections' },
  { field: 'cost_center', key: 'cost_centers', endpoint: 'cost-centers' },
  { field: 'grade', key: 'grades', endpoint: 'grades' },
  { field: 'job_position', key: 'job_positions', endpoint: 'positions' },
  { field: 'employment_type', key: 'employment_types', endpoint: 'employment-types' },
];

const DEFAULTS: OrgSettings = {
  use_locations: false, use_divisions: false, use_sections: false, use_cost_centers: false, use_grades: false, use_job_positions: false,
  use_employment_types: false, use_employee_categories: true, labels: {}, mandatory: {}, active_fields: [], default_labels: {},
};
const LABELS: Record<string, string> = {
  locations: 'Location', divisions: 'Division', sections: 'Section', cost_centers: 'Cost centre', grades: 'Grade',
  job_positions: 'Job position', employment_types: 'Employment type', employee_categories: 'Category',
};

@Injectable({ providedIn: 'root' })
export class OrgSettingsService {
  readonly api = `${environment.apiBaseUrl}/org-structure/api/`;
  private cur$ = new BehaviorSubject<OrgSettings | null>(null);
  private req$?: Observable<OrgSettings>;
  private schemaLoaded = '';

  /** the settings once loaded (DEFAULTS until then) */
  readonly settings$: Observable<OrgSettings> = this.cur$.pipe(map(s => s || DEFAULTS));

  constructor(private http: HttpClient) {}

  private get schema(): string { return localStorage.getItem('selectedSchema') || ''; }

  get current(): OrgSettings { return this.cur$.value || DEFAULTS; }

  /** loads once per company (cached); emits the settings */
  load(force = false): Observable<OrgSettings> {
    const s = this.schema;
    if (!s) { return of(DEFAULTS); }
    if (!force && this.schemaLoaded === s && this.cur$.value) { return of(this.cur$.value); }
    if (force || !this.req$ || this.schemaLoaded !== s) {
      this.schemaLoaded = s;
      this.req$ = this.http.get<OrgSettings>(`${this.api}settings/?schema=${encodeURIComponent(s)}`).pipe(
        catchError(() => of(DEFAULTS)),
        tap(v => this.publish(v)),
        shareReplay(1));
    }
    return this.req$;
  }

  /** first loaded value (waits for the request) */
  ready(): Observable<OrgSettings> {
    this.load().subscribe();
    return this.cur$.pipe(filter(v => !!v), take(1), map(v => v as OrgSettings));
  }

  save(body: Partial<OrgSettings>): Observable<OrgSettings> {
    return this.http.put<OrgSettings>(`${this.api}settings/?schema=${encodeURIComponent(this.schema)}`, body).pipe(tap(v => this.publish(v)));
  }

  private publish(v: OrgSettings): void {
    this.cur$.next(v);
    setOrgKeys(ORG_FIELDS.filter(f => (v as any)['use_' + f.key]).map(f => ({ key: f.field, label: this.label(f.key, v) })),
      v.use_employee_categories !== false, this.label('employee_categories', v));
  }

  isOn(key: OrgKey | OrgField, s: OrgSettings = this.current): boolean {
    const k = ORG_FIELDS.find(f => f.field === key)?.key || key;
    return !!(s as any)['use_' + k];
  }

  label(key: OrgKey | OrgField, s: OrgSettings = this.current): string {
    const k = ORG_FIELDS.find(f => f.field === key)?.key || key;
    return (s.labels || {})[k] || LABELS[k] || String(k);
  }

  mandatory(key: OrgKey | OrgField, s: OrgSettings = this.current): boolean {
    const k = ORG_FIELDS.find(f => f.field === key)?.key || key;
    return !!(s.mandatory || {})[k];
  }

  /** employee fields that are switched on, in display order */
  activeFields(s: OrgSettings = this.current): { field: OrgField; key: OrgKey; endpoint: string; label: string; mandatory: boolean }[] {
    return ORG_FIELDS.filter(f => this.isOn(f.key, s)).map(f => ({ ...f, label: this.label(f.key, s), mandatory: this.mandatory(f.key, s) }));
  }

  /** false hides Category on the employee form, list, filters and reports (data is kept) */
  categoriesOn(s: OrgSettings = this.current): boolean { return s.use_employee_categories !== false; }
}
