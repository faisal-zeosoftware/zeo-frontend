import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { employeeUrl, recordUrl } from '../../shared-ui/z-nav';
import { DashboardService, DrillColumn, DrillRequest } from './dashboard.service';

/**
 * Right-hand drawer used by both dashboards.
 * Level 1: the rows behind a tile / bar (search, CSV).  Level 2: one employee across all modules.
 * Rows with a module emit (navigate) so the host can open the request / approval screen.
 */
@Component({
  selector: 'z-drill-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drill-panel.component.html',
  styleUrls: ['./dashboards.css'],
})
export class DrillPanelComponent implements OnChanges {
  @Input() request: DrillRequest | null = null;
  @Input() canOpenEmployee = true;
  @Output() closed = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<{ module: string; kind: 'request' | 'approval' }>();

  title = '';
  columns: DrillColumn[] = [];
  rows: any[] = [];
  loading = false;
  error = '';
  q = '';
  person: any = null;      // employee 360
  personLoading = false;

  constructor(private svc: DashboardService, private router: Router) {}

  ngOnChanges(): void {
    this.person = null;
    this.q = '';
    if (!this.request) { return; }
    this.loading = true;
    this.error = '';
    this.title = this.request.title || '';
    this.svc.drill(this.request).subscribe({
      next: r => { this.title = this.request?.title || r.title; this.columns = r.columns; this.rows = r.rows; this.loading = false; },
      error: e => { this.error = e?.error?.detail || 'Could not load the list.'; this.loading = false; },
    });
  }

  @HostListener('document:keydown.escape')
  esc(): void {
    if (this.person) { this.person = null; } else if (this.request) { this.closed.emit(); }
  }

  get filtered(): any[] {
    const q = this.q.trim().toLowerCase();
    if (!q) { return this.rows; }
    return this.rows.filter(r => this.columns.some(c => String(r[c.key] ?? '').toLowerCase().includes(q)));
  }

  rowClick(r: any): void {
    if (r.employee_id && this.canOpenEmployee) {
      this.personLoading = true;
      this.svc.employee(r.employee_id).subscribe({
        next: p => { this.person = p; this.personLoading = false; },
        error: e => { this.error = e?.error?.detail || 'You cannot open this employee.'; this.personLoading = false; },
      });
    } else if (r._m) {
      this.record(r);
    } else if (r.module) {
      this.navigate.emit({ module: r.module, kind: this.request?.metric === 'approvals' ? 'approval' : 'request' });
    }
  }

  /** Approvals open the approval screen (to act on them); the record button opens the request itself. */
  open(r: any, ev: Event): void {
    ev.stopPropagation();
    this.navigate.emit({ module: r.module, kind: this.request?.metric === 'approvals' ? 'approval' : 'request' });
  }

  /** v1.8.1: the record behind a row. */
  record(r: any, ev?: Event): void {
    ev?.stopPropagation();
    if (r?._m) { this.closed.emit(); this.router.navigateByUrl(recordUrl(r._m, r._id)); }
  }

  employeePage(): void {
    const id = this.person?.employee?.id ?? this.person?.employee?.employee_id;
    if (id) { this.closed.emit(); this.router.navigateByUrl(employeeUrl(id)); }
  }

  statusClass(v: any): string {
    const s = String(v ?? '').toLowerCase();
    if (/(reject|expired|absent|declin|cancel)/.test(s)) { return 'pill bad'; }
    if (/(pending|late|expiring|waiting|draft|submitted|in progress|awaiting)/.test(s)) { return 'pill warn'; }
    if (/(approv|confirm|valid|processed|deducted|paid|present|completed|reviewed|calibrated|acknowledged)/.test(s)) { return 'pill good'; }
    return 'pill';
  }

  csv(): void {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [this.columns.map(c => esc(c.label)).join(',')].concat(this.filtered.map(r => this.columns.map(c => esc(r[c.key])).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (this.title || 'list').replace(/[^\w\- ]+/g, '').trim() + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  initials(n: string): string {
    return (n || '?').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  }
}
