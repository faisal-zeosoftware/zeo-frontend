import { Component, OnInit } from '@angular/core';
import { ZListDirective } from '../../shared-ui/z-list.directive';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ModuleApiService } from '../module-api.service';

const CYCLES = '/performance/api/cycles/';

/** HR calibration: rating spread vs guideline, department averages, adjust with reason, lock, outcomes. */
@Component({
  selector: 'app-hr-calibration',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ZListDirective],
  templateUrl: './calibration.component.html',
  styleUrls: ['../hr-shared.css', './calibration.component.css'],
})
export class CalibrationComponent implements OnInit {
  cycles: any[] = [];
  cycleId: any = null;
  data: any = null;
  sheets: any[] = [];
  logs: any[] = [];
  editing: any = null;
  form = { new_rating: 3, reason: '' };
  toast: { text: string; kind: 'ok' | 'err' } | null = null;

  constructor(private api: ModuleApiService) {}

  ngOnInit(): void {
    this.api.list(CYCLES).subscribe(c => {
      this.cycles = c.filter(x => x.status !== 'draft');
      if (this.cycles.length) { this.cycleId = this.cycles[0].id; this.load(); }
    });
  }

  get cycle(): any { return this.cycles.find(c => c.id === this.cycleId); }

  load(): void {
    if (!this.cycleId) return;
    this.api.get(`${CYCLES}${this.cycleId}/distribution/`).subscribe({ next: d => (this.data = d), error: e => this.err(e) });
    this.api.list('/performance/api/goal-sheets/', { cycle: this.cycleId, status: 'reviewed,calibrated,acknowledged' }).subscribe(s => (this.sheets = s));
    this.api.list('/performance/api/calibration-logs/', { cycle: this.cycleId }).subscribe(l => (this.logs = l));
  }

  maxPct(): number {
    const vals = (this.data?.distribution || []).flatMap((d: any) => [d.percent, d.guideline_percent || 0]);
    return Math.max(10, ...vals);
  }

  open(s: any): void {
    this.editing = s;
    this.form = { new_rating: s.final_rating || 3, reason: '' };
  }

  save(): void {
    this.api.action('/performance/api/goal-sheets/', this.editing.id, 'calibrate', this.form).subscribe({
      next: () => { this.editing = null; this.ok('Rating calibrated.'); this.load(); },
      error: e => this.err(e),
    });
  }

  cycleAction(action: string, confirmText: string): void {
    if (!confirm(confirmText)) return;
    this.api.action(CYCLES, this.cycleId, action).subscribe({
      next: (r: any) => { this.ok(r.detail); this.api.list(CYCLES).subscribe(c => (this.cycles = c.filter(x => x.status !== 'draft'))); this.load(); },
      error: e => this.err(e),
    });
  }

  ok(text: string): void { this.toast = { text, kind: 'ok' }; setTimeout(() => (this.toast = null), 3500); }
  err(e: any): void { this.toast = { text: ModuleApiService.errorText(e), kind: 'err' }; setTimeout(() => (this.toast = null), 7000); }
}
