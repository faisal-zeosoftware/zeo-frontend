import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EmployeeProfileService } from './employee-profile.service';
import { CountryPackService, cpLocalize } from '../shared-ui/country-pack.service';   // v1.14.0

/**
 * v1.13.0 – optional employee-list columns (passport / visa / Emirates ID expiry, employment status, probation end,
 * manager). One request loads every visible employee (GET employee-profile/api/employee-columns/), refreshed after a
 * minute. The columns start hidden (th[data-zl-optional]); users show them under Columns and they export with the list.
 *
 *   readonly profileCols = inject(EmpProfileColumnsService);
 *   <th data-zl-optional *ngFor="let c of profileCols.cols">{{ c.label }}</th>
 *   <td *ngFor="let c of profileCols.cols" [attr.data-label]="c.label">{{ profileCols.value(emp.id, c.field) }}</td>
 */
@Injectable({ providedIn: 'root' })
export class EmpProfileColumnsService {
  private readonly all: { field: string; label: string; country?: string }[] = [
    { field: 'passport_expiry', label: 'Passport expiry' }, { field: 'visa_expiry', label: 'Visa expiry', country: 'residence_visa' },
    { field: 'eid_expiry', label: 'Emirates ID expiry', country: 'national_id' }, { field: 'status_label', label: 'Employment status' },
    { field: 'probation_end', label: 'Probation ends' }, { field: 'manager', label: 'Reporting manager' },
  ];
  private local: { field: string; label: string }[] = this.all;
  /** v1.14.0: the columns for the company's country (Emirates ID → the country's ID caption, or left out) */
  get cols(): { field: string; label: string }[] { this.cp.pack; return this.local; }
  private rows = new Map<number, any>();
  private at = 0;
  private schema = '';
  private loading = false;

  constructor(private http: HttpClient, private svc: EmployeeProfileService, private cp: CountryPackService) {
    this.cp.pack$.subscribe(() => { this.local = cpLocalize(this.all, this.cp); });
  }

  value(empId: number, field: string): string {
    this.refresh();
    const v = this.rows.get(Number(empId))?.[field];
    if (!v) { return ''; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) { const [y, m, d] = String(v).split('-'); return `${d}/${m}/${y}`; }
    return String(v);
  }

  refresh(force = false): void {
    const s = this.svc.schema;
    if (this.loading || (!force && s === this.schema && Date.now() - this.at < 60000)) { return; }
    this.loading = true; this.schema = s; this.at = Date.now();
    this.http.get<any[]>(this.svc.url('employee-columns/')).subscribe({
      next: list => { this.rows = new Map((list || []).map(r => [Number(r.employee_id), r])); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
