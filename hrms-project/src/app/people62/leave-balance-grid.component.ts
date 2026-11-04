/**
 * v1.62.0 people – Leave balance as one grid: employees × leave types (types of the same name in several branches are one
 * column). A cell opens the history of that balance (opening, earned, taken, cancelled, encashed, carried, lapsed …, the
 * same ledger as "How my balances work" in self service). Adjusting balances stays in the balance list (link in the header).
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { TPipe, ZDatePipe } from '../shared-ui/i18n.service';
import { exportExcel } from '../shared-ui/z-export';

@Component({
  selector: 'app-leave-balance-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe, ZDatePipe],
  template: `
  <div class="lbg">
    <div class="lbg-head">
      <div>
        <h1>{{ 'Leave balance' | t }}</h1>
        <p class="mut">{{ 'The days each employee has left, per leave type. Click a number to see how it was built up: opening, earned, taken, cancelled, encashed and carried forward.' | t }}</p>
      </div>
      <div class="lbg-act">
        <button type="button" class="btn-o" (click)="xls()">{{ 'Export to Excel' | t }}</button>
        <a class="btn-o" routerLink="/main-sidebar/leave-options/leave-balance-list">{{ 'Adjust balances' | t }}</a>
      </div>
    </div>
    <div class="lbg-bar">
      <input type="search" [(ngModel)]="q" (ngModelChange)="apply()" [placeholder]="'Search employee or code' | t">
      <select [(ngModel)]="dept" (ngModelChange)="apply()"><option value="">{{ 'All departments' | t }}</option><option *ngFor="let d of depts" [value]="d">{{ d }}</option></select>
      <label class="chk"><input type="checkbox" [(ngModel)]="all" (ngModelChange)="pickCols()"> {{ 'Show leave types nobody has days on' | t }}</label>
      <span class="mut">{{ shown.length }} {{ 'employees' | t }}</span>
    </div>
    <div class="mut pad" *ngIf="loading">{{ 'Loading…' | t }}</div>
    <div class="mut pad" *ngIf="!loading && err">{{ err }}</div>
    <div class="lbg-wrap" *ngIf="!loading && !err">
      <table class="lbg-t">
        <thead><tr><th class="emp">{{ 'Employee' | t }}</th><th *ngFor="let c of cols" class="num" [title]="c.label">{{ c.label }}</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of shown">
            <td class="emp"><b>{{ r.employee }}</b><span class="sub">{{ r.designation }}<ng-container *ngIf="r.department"> · {{ r.department }}</ng-container></span></td>
            <td *ngFor="let c of cols" class="num">
              <button type="button" *ngIf="r.cells[c.key] as x; else none" class="cell" [class.neg]="x.balance < 0" [class.zero]="!x.balance" (click)="open(r, c, x)">
                {{ x.balance | number:'1.0-2' }}<span class="pend" *ngIf="x.pending">−{{ x.pending | number:'1.0-2' }} {{ 'pending' | t }}</span></button>
              <ng-template #none><span class="mut">–</span></ng-template>
            </td>
          </tr>
          <tr *ngIf="!shown.length"><td [attr.colspan]="cols.length + 1" class="mut pad">{{ 'No employee matches.' | t }}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="lbg-ov" *ngIf="cell" (click)="cell = null">
    <div class="lbg-pop" (click)="$event.stopPropagation()">
      <div class="lbg-pop-h"><div><h2>{{ cell.type }}</h2><p class="mut">{{ cell.employee }}</p></div><button type="button" class="x" (click)="cell = null">×</button></div>
      <p class="big">{{ 'Balance now' | t }}: <b>{{ cell.balance | number:'1.0-2' }}</b>&nbsp;<span class="mut">{{ cell.unit === 'hours' ? ('hours' | t) : ('days' | t) }}</span></p>
      <!-- v1.62.0 people: adjust this balance (same rights and booking as the balance list; a ledger line with the reason) -->
      <form class="adj" *ngIf="canAdjust" (ngSubmit)="adjust()">
        <label>{{ 'Adjust by (days, − to take off)' | t }}<input type="number" step="0.5" [(ngModel)]="adjDays" name="adjDays"></label>
        <label class="wide">{{ 'Reason' | t }}<input type="text" [(ngModel)]="adjNote" name="adjNote" [placeholder]="'e.g. correction of the opening balance' | t"></label>
        <button type="submit" class="btn-o pri" [disabled]="busy || !adjDays || !adjNote.trim()">{{ 'Adjust' | t }}</button>
      </form>
      <p class="msg" *ngIf="adjMsg" [class.err]="adjErr">{{ adjMsg }}</p>
      <div class="mut pad" *ngIf="cell.loading">{{ 'Loading…' | t }}</div>
      <table class="lbg-t led" *ngIf="!cell.loading && cell.rows.length">
        <thead><tr><th>{{ 'Date' | t }}</th><th>{{ 'What' | t }}</th><th class="num">{{ 'Days' | t }}</th><th class="num">{{ 'Balance' | t }}</th><th>{{ 'Note' | t }}</th></tr></thead>
        <tbody><tr *ngFor="let l of cell.rows"><td>{{ l.date | zdate }}</td><td>{{ l.kind }}</td><td class="num" [class.neg]="l.days < 0">{{ l.days > 0 ? '+' : '' }}{{ l.days | number:'1.0-2' }}</td>
          <td class="num">{{ l.balance | number:'1.0-2' }}</td><td class="mut">{{ l.note }}</td></tr></tbody>
      </table>
      <p class="mut" *ngIf="!cell.loading && !cell.rows.length">{{ 'No history is recorded for this balance yet (it was entered as an opening balance before the leave ledger started).' | t }}</p>
    </div>
  </div>`,
  styles: [`
  .lbg{padding:16px 20px;font-size:13px;color:#1f2433}
  .lbg-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;background:#fff;border:1px solid #e3e7ef;border-radius:10px;padding:14px 18px;margin-bottom:12px}
  .lbg-head h1{font-size:20px;margin:0 0 4px;font-weight:600}.mut{color:#6b7280}.pad{padding:16px}
  .lbg-act{display:flex;gap:8px;flex-shrink:0}.btn-o{border:1px solid #cbd5e1;background:#fff;border-radius:6px;padding:6px 12px;color:#1f2433;text-decoration:none;cursor:pointer;font-size:13px}
  .lbg-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
  .lbg-bar input[type=search],.lbg-bar select{border:1px solid #cbd5e1;border-radius:6px;padding:6px 10px;font-size:13px;min-width:220px}.chk{display:flex;gap:6px;align-items:center;margin:0}
  .lbg-wrap{overflow:auto;max-height:calc(100vh - 260px);background:#fff;border:1px solid #e3e7ef;border-radius:10px}
  .lbg-t{border-collapse:separate;border-spacing:0;width:100%}.lbg-t th,.lbg-t td{padding:7px 10px;border-bottom:1px solid #eef1f6;white-space:nowrap}
  .lbg-t thead th{position:sticky;top:0;background:#f7f9fc;font-weight:600;font-size:12px;z-index:1;max-width:120px;overflow:hidden;text-overflow:ellipsis}
  .lbg-t .emp{position:sticky;left:0;background:#fff;text-align:start;min-width:220px;z-index:2}.lbg-t thead .emp{z-index:3;background:#f7f9fc}
  .emp .sub{display:block;color:#6b7280;font-size:11px}.num{text-align:end}
  .cell{border:0;background:none;color:#1d4ed8;font-weight:600;cursor:pointer;padding:2px 4px;border-radius:4px;font-size:13px}.cell:hover{background:#eff6ff}
  .cell.zero{color:#9ca3af;font-weight:400}.neg{color:#b91c1c !important}.pend{display:block;font-size:10px;color:#c2410c;font-weight:400}
  .lbg-ov{position:fixed;inset:0;background:rgba(15,23,42,.35);z-index:1000;display:flex;align-items:center;justify-content:center}
  .lbg-pop{background:#fff;border-radius:12px;width:min(760px,94vw);max-height:84vh;overflow:auto;padding:18px 20px}
  .lbg-pop-h{display:flex;justify-content:space-between}.lbg-pop-h h2{margin:0;font-size:18px}.x{border:0;background:none;font-size:22px;cursor:pointer}
  .big{font-size:15px;margin:10px 0}
  .adj{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;background:#f7f9fc;border:1px solid #e3e7ef;border-radius:10px;padding:10px 12px;margin:6px 0 12px}
  .adj label{display:flex;flex-direction:column;font-size:12px;color:#5d6670;gap:4px}.adj input{height:32px;border:1px solid #cbd5e1;border-radius:6px;padding:0 8px;width:120px}
  .adj .wide input{width:300px}.btn-o.pri{background:#5b4ff5;color:#fff;border-color:#5b4ff5}.btn-o.pri:disabled{opacity:.5}
  .msg{font-size:13px;color:#15803d;margin:0 0 8px}.msg.err{color:#b91c1c}.led td,.led th{font-size:12px}`],
})
export class LeaveBalanceGridComponent implements OnInit {
  loading = true; err = ''; q = ''; dept = ''; all = false;
  allCols: any[] = []; cols: any[] = []; rows: any[] = []; shown: any[] = []; depts: string[] = [];
  cell: any = null;
  canAdjust = false; adjDays: number | null = null; adjNote = ''; adjMsg = ''; adjErr = false; busy = false;   // v1.62.0 people
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.rec.api}/leave-policy/api/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }
  async ngOnInit(): Promise<void> {
    try {
      const d: any = await firstValueFrom(this.http.get(this.url('balance-grid/')));
      this.allCols = d.columns || []; this.rows = d.rows || []; this.canAdjust = !!d.can_adjust;
      this.depts = Array.from(new Set(this.rows.map(r => r.department).filter(Boolean))).sort() as string[];
      this.pickCols(); this.apply();
    } catch (e: any) { this.err = e?.error?.detail || 'The balances could not be loaded.'; }
    this.loading = false; this.cd.detectChanges();
  }
  pickCols(): void { this.cols = this.all ? this.allCols : this.allCols.filter(c => c.main); }
  apply(): void {
    const q = this.q.trim().toLowerCase();
    this.shown = this.rows.filter(r => (!q || r.employee.toLowerCase().includes(q)) && (!this.dept || r.department === this.dept));
  }
  async open(r: any, c: any, x: any): Promise<void> {
    this.cell = { employee: r.employee, code: r.code, type: c.label, unit: c.unit, balance: x.balance, rows: [], loading: true, row: r, col: c, x };
    this.adjDays = null; this.adjNote = ''; this.adjMsg = '';
    try {
      const d: any = await firstValueFrom(this.http.get(this.url('ledger/', `&employee=${r.employee_id}&leave_type=${x.leave_type_id}`)));
      this.cell.rows = (d.rows || []).slice().reverse();
    } catch { this.cell.rows = []; }
    this.cell.loading = false; this.cd.detectChanges();
  }
  async adjust(): Promise<void> {
    if (!this.cell || !this.adjDays) { return; }
    this.busy = true;
    try {
      const body = { date: new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10), mode: 'add', kind: 'adjustment',
        note: this.adjNote.trim(), rows: [{ employee_code: this.cell.code, leave_type: this.cell.type, days: this.adjDays }] };
      const r: any = await firstValueFrom(this.http.post(this.url('openings/'), body));
      if (r.errors?.length) { throw { error: { detail: r.errors.join(' ') } }; }
      const nb = Math.round((Number(this.cell.balance) + Number(this.adjDays)) * 100) / 100;
      this.cell.balance = nb; this.cell.x.balance = nb;
      this.adjMsg = 'Balance adjusted.'; this.adjErr = false; this.adjDays = null; this.adjNote = '';
      await this.open(this.cell.row, this.cell.col, this.cell.x); this.adjMsg = 'Balance adjusted.';
    } catch (e: any) { const d = e?.error; this.adjMsg = (d && (d.detail || Object.values(d).flat().join(' '))) || 'It could not be saved.'; this.adjErr = true; }
    this.busy = false; this.cd.detectChanges();
  }

  xls(): void {
    const head = ['Employee', 'Department', ...this.cols.map(c => c.label)];
    const body = this.shown.map(r => [r.employee, r.department, ...this.cols.map(c => String(r.cells[c.key]?.balance ?? ''))]);
    exportExcel('Leave balances', head, body);
  }
}
