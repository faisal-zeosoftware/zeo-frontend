// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

/** v1.49.0 – every leave balance explained for this leave year: how it is earned, the carry-forward cap and expiry, the
 *  encashment limit; brought / earned / taken / encashed / lapsed; still to earn by the year end; carried days that expire. */
@Component({
  selector: 'app-leave-explained',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="lx" *ngIf="d?.types?.length">
  <div class="lx-h">How my balances work <small *ngIf="d.policy">· {{ d.policy }}</small></div>
  <div class="lx-grid">
    <div class="lx-card" *ngFor="let t of d.types" [attr.data-type]="t.leave_type_id">
      <div class="lx-top"><b>{{ t.leave_type }}</b><span class="lx-bal">{{ t.balance }} <small>days now</small></span></div>
      <p class="lx-rule">{{ t.accrual }} · {{ t.days_per_year }} days a year<ng-container *ngIf="t.carry_forward_max !== null"> · carry forward up to {{ t.carry_forward_max }} days</ng-container>
        <ng-container *ngIf="t.carry_forward_expiry_months"> (use within {{ t.carry_forward_expiry_months }} months)</ng-container>
        <ng-container *ngIf="t.encashable"> · encashable{{ t.encash_max_per_year !== null ? ' up to ' + t.encash_max_per_year + ' days a year' : '' }}</ng-container></p>
      <table>
        <tr><td>Brought forward</td><td>{{ t.brought_forward }}</td></tr>
        <tr *ngIf="t.opening"><td>Opening</td><td>{{ t.opening }}</td></tr>
        <tr><td>Earned this year</td><td>{{ t.earned != 0 ? '+' : '' }}{{ t.earned }}</td></tr>
        <tr><td>Taken</td><td>{{ t.taken != 0 ? '−' : '' }}{{ t.taken }}</td></tr>
        <tr *ngIf="t.encashed"><td>Encashed</td><td>−{{ t.encashed }}</td></tr>
        <tr *ngIf="t.lapsed"><td>Lapsed</td><td>−{{ t.lapsed }}</td></tr>
        <tr *ngIf="t.adjusted"><td>Adjusted</td><td>{{ t.adjusted }}</td></tr>
        <tr class="sep"><td>Still to earn by {{ t.year.to | date:'d MMM' }}</td><td>{{ t.to_earn_by_year_end != 0 ? '+' : '' }}{{ t.to_earn_by_year_end }}</td></tr>
        <tr><td>Balance at the year end</td><td>{{ t.balance_at_year_end }}</td></tr>
        <tr *ngIf="t.carry_forward_max !== null"><td>Carried to next year (cap)</td><td>{{ t.carry_at_year_end }}</td></tr>
      </table>
      <p class="lx-warn" *ngIf="t.carried_left_to_use">{{ t.carried_left_to_use }} carried days must be used by {{ t.carried_expiry | date:'dd/MM/yyyy' }} or they lapse.</p>
      <p class="lx-note" *ngIf="t.encashable_now">You may encash up to {{ t.encashable_now }} days now.</p>
    </div>
  </div>
</div>`,
  styles: [`.lx { margin: 14px 0; } .lx-h { font-weight: 600; font-size: 14px; color: #1b1640; margin-bottom: 8px; } .lx-h small { color: #6b7185; font-weight: 400; }
    .lx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
    .lx-card { background: #fff; border: 1px solid #e3e5ee; border-radius: 12px; padding: 10px 12px; font-size: 12.5px; }
    .lx-top { display: flex; justify-content: space-between; align-items: baseline; } .lx-bal { font-size: 18px; font-weight: 600; color: #1b1640; } .lx-bal small { font-size: 11px; color: #6b7185; font-weight: 400; }
    .lx-rule { color: #5d6670; margin: 4px 0 6px; } .lx-card table { width: 100%; border-collapse: collapse; } .lx-card td { padding: 2px 0; } .lx-card td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
    .lx-card tr.sep td { border-top: 1px dashed #e3e5ee; padding-top: 5px; } .lx-warn { color: #7a5200; background: #fff4dc; padding: 6px 8px; border-radius: 8px; margin: 6px 0 0; }
    .lx-note { color: #1d6b37; margin: 6px 0 0; }`],
})
export class LeaveExplainedComponent implements OnChanges {
  @Input() employee: number | null = null;
  @Input() refresh = 0;
  d: any = null;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  async ngOnChanges(): Promise<void> {
    const q = this.employee ? `&employee=${this.employee}` : '';
    try { this.d = await firstValueFrom(this.http.get(`${this.rec.api}/leave-policy/api/balance-explained/?schema=${localStorage.getItem('selectedSchema') || ''}${q}`)); }
    catch { this.d = null; }
    this.cd.markForCheck();
  }
}
