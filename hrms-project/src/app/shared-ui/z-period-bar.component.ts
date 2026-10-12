import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DASH_PRESETS, DashPreset, presetRange } from './z-dash-period';
import { I18N_UI } from './i18n.service';
import { environment } from '../../environments/environment';

export interface ZPeriodPick { preset: DashPreset; from: string; to: string; branch: number | null; }

/**
 * v1.22.0 – one period and branch bar for the dashboards of every app (CRM, Property, Maintenance, HSE, Projects):
 * the HRMS period presets (today … this year, custom dates) and the user's branches. Remembered per dashboard on this device.
 */
@Component({
  selector: 'z-period-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  template: `
  <div class="zpb" role="group" [attr.aria-label]="'Period and branch' | t">
    <select [(ngModel)]="preset" (ngModelChange)="presetChanged()" [attr.aria-label]="'Period' | t">
      <option *ngFor="let p of presets" [ngValue]="p.k">{{ p.l | t }}</option>
    </select>
    <ng-container *ngIf="preset === 'custom'">
      <input type="date" [(ngModel)]="from" (change)="emit()" [attr.aria-label]="'From' | t">
      <span class="zpb-dash">–</span>
      <input type="date" [(ngModel)]="to" (change)="emit()" [attr.aria-label]="'To' | t">
    </ng-container>
    <span class="zpb-range" *ngIf="preset !== 'custom'">{{ nice(from) }} – {{ nice(to) }}</span>
    <select *ngIf="showBranch && branches.length > 1" [(ngModel)]="branch" (ngModelChange)="emit()" [attr.aria-label]="'Branch' | t">
      <option [ngValue]="null">{{ 'All my branches' | t }}</option>
      <option *ngFor="let b of branches" [ngValue]="b.id">{{ b.name }}</option>
    </select>
  </div>`,
  styles: [`
  .zpb { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .zpb select, .zpb input { height: 34px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font-size: 13px; color: #1b1640; background: #fff; }
  .zpb-range { font-size: 13px; color: #6b7185; }
  .zpb-dash { color: #6b7185; }`],
})
export class ZPeriodBarComponent implements OnInit {
  @Input() name = 'dash';
  @Input() showBranch = true;
  @Input() defaultPreset: DashPreset = 'this_month';
  @Output() changed = new EventEmitter<ZPeriodPick>();
  presets = DASH_PRESETS;
  preset: DashPreset = 'this_month';
  from = ''; to = '';
  branch: number | null = null;
  branches: { id: number; name: string }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    let saved: any = null;
    try { saved = JSON.parse(localStorage.getItem('zpb:' + this.name) || 'null'); } catch { saved = null; }
    this.preset = saved?.preset || this.defaultPreset;
    if (this.preset === 'custom' && saved?.from && saved?.to) { this.from = saved.from; this.to = saved.to; }
    else { [this.from, this.to] = presetRange(this.preset === 'custom' ? 'this_month' : this.preset); }
    this.branch = saved?.branch ?? null;
    if (this.showBranch) { this.loadBranches(); }
    this.emit(false);
  }

  private loadBranches(): void {
    let schema = '';
    try { schema = localStorage.getItem('selectedSchema') || ''; } catch { schema = ''; }
    // the user's branches (Settings › Branch permissions); company administrators get every branch
    this.http.get<any>(`${environment.apiBaseUrl}/organisation/api/user-accessible-branches/?schema=${encodeURIComponent(schema)}`).subscribe({
      next: r => {
        const xs = Array.isArray(r) ? r : (r?.branches || r?.results || []);
        this.branches = xs.map((b: any) => ({ id: b.id, name: b.branch_name || b.name })).filter((b: any) => b.id);
        if (this.branch && !this.branches.some(b => b.id === this.branch)) { this.branch = null; this.emit(); }
      },
      error: () => { this.branches = []; },
    });
  }

  presetChanged(): void {
    if (this.preset !== 'custom') { [this.from, this.to] = presetRange(this.preset); }
    this.emit();
  }

  emit(save = true): void {
    if (!this.from || !this.to) { return; }
    if (save) { try { localStorage.setItem('zpb:' + this.name, JSON.stringify({ preset: this.preset, from: this.from, to: this.to, branch: this.branch })); } catch { /* storage off */ } }
    this.changed.emit({ preset: this.preset, from: this.from, to: this.to, branch: this.branch });
  }

  nice(s: string): string {
    if (!s) { return ''; }
    const d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
