import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EmployeeProfileService } from './employee-profile.service';

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
  readonly cols: { field: string; label: string }[] = [
    { field: 'passport_expiry', label: 'Passport expiry' }, { field: 'visa_expiry', label: 'Visa expiry' },
    { field: 'eid_expiry', label: 'Emirates ID expiry' }, { field: 'status_label', label: 'Employment status' },
    { field: 'probation_end', label: 'Probation ends' }, { field: 'manager', label: 'Reporting manager' },
  ];
  private rows = new Map<number, any>();
  private at = 0;
  private schema = '';
  private loading = false;

  constructor(private http: HttpClient, private svc: EmployeeProfileService) {}

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
