import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrgSettingsService } from './org-settings.service';

/**
 * v1.12.0 – organisation columns for employee lists (Location, Division, Section … – only those switched on).
 * One request loads every employee's values (GET org-structure/api/employee-org/), refreshed after a minute.
 *
 *   readonly orgCols = inject(EmpOrgColumnsService);
 *   <th *ngFor="let c of orgCols.cols">{{ c.label }}</th>
 *   <td *ngFor="let c of orgCols.cols" [attr.data-label]="c.label">{{ orgCols.value(emp.id, c.field) }}</td>
 */
@Injectable({ providedIn: 'root' })
export class EmpOrgColumnsService {
  cols: { field: string; label: string }[] = [];
  private rows = new Map<number, any>();
  private at = 0;
  private schema = '';
  private loading = false;

  constructor(private http: HttpClient, private org: OrgSettingsService) {
    this.org.settings$.subscribe(s => {
      this.cols = this.org.activeFields(s).map(f => ({ field: f.field, label: f.label }));
      if (this.cols.length) { this.refresh(); }
    });
    this.org.load().subscribe();
  }

  /** false when employee categories are switched off (hide Category) */
  get categoriesOn(): boolean { return this.org.categoriesOn(); }

  /** value of one column for an employee ('' when none); loads the values when they are older than a minute */
  value(empId: number, field: string): string {
    this.refresh();
    return this.rows.get(Number(empId))?.[field] || '';
  }

  refresh(force = false): void {
    const s = localStorage.getItem('selectedSchema') || '';
    if (!this.cols.length || this.loading || (!force && s === this.schema && Date.now() - this.at < 60000)) { return; }
    this.loading = true; this.schema = s; this.at = Date.now();
    this.http.get<any[]>(`${this.org.api}employee-org/?schema=${encodeURIComponent(s)}`).subscribe({
      next: list => { this.rows = new Map((list || []).map(r => [Number(r.employee_id), r])); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
