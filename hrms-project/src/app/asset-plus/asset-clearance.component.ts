import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ASSET_BASE, AssetApiService, money } from './asset-api.service';

/** Exit clearance (v1.12.0): employees who leave and what they still hold or owe. Blocks the final settlement until cleared or released. */
@Component({
  selector: 'app-asset-clearance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">Exit clearance</h1>
        <p class="ex-desc">Employees with an approved resignation or an end-of-service record. The final settlement cannot be processed while assets are still with
          the employee, damage / loss reports are undecided or asset deductions are left – receive the assets, move the deductions to the final settlement, or release the clearance with a reason.</p></div></div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <div class="ex-split" *ngIf="!loading">
        <div class="ex-rows">
          <div class="ex-row click" *ngFor="let e of rows" [class.on]="sel?.employee_id === e.employee_id" (click)="pick(e)">
            <div class="main"><div class="t">{{ e.employee }}</div>
              <div class="s">{{ e.branch }}<span *ngIf="e.last_working_date"> · last day {{ e.last_working_date | date:'dd MMM yyyy' }}</span><span *ngIf="e.eos_status"> · settlement {{ e.eos_status }}</span></div></div>
            <div class="r"><span class="ex-tag" [ngClass]="e.blocked ? 'rejected' : 'approved'">{{ e.blocked ? e.open_items + ' open' : (e.waived ? 'Released' : 'Clear') }}</span></div>
          </div>
          <p class="ex-muted" *ngIf="!rows.length">Nobody is leaving right now.</p>
        </div>
        <div class="ex-panel" *ngIf="sel">
          <div class="ex-h">{{ sel.employee }}</div>
          <div class="ap-note" [class.err]="sel.blocked" [class.ok]="!sel.blocked">{{ sel.blocked ? 'The final settlement is blocked.' : (sel.waived ? 'Clearance released: ' + sel.waiver?.reason : 'Nothing open – the final settlement can go ahead.') }}</div>
          <div class="ex-rows">
            <div class="ex-row" *ngFor="let i of sel.items">
              <div class="main"><div class="t">{{ i.text }}</div></div>
              <div class="r"><button type="button" class="ex-link" *ngIf="i.asset_id" (click)="open(i.asset_id)">Open asset</button></div>
            </div>
          </div>
          <div class="ex-actbar">
            <button type="button" class="ex-btn" *ngIf="+sel.recovery_due > 0" (click)="act('settle')">Deduct {{ m(sel.recovery_due) }} in the final settlement</button>
            <button type="button" class="ex-btn danger" *ngIf="sel.blocked && r.waive" (click)="act('waive')">Release with a reason…</button>
            <button type="button" class="ex-btn" *ngIf="sel.waived && r.waive" (click)="act('unwaive')">Withdraw the release</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class AssetClearanceComponent implements OnInit {
  rows: any[] = [];
  sel: any = null;
  r: any = {};
  loading = true;
  msg = ''; msgErr = false;

  constructor(private api: AssetApiService, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try { this.r = (await this.api.lookups()).rights || {}; } catch { /* */ }
    await this.load();
  }

  async load(): Promise<void> {
    try { this.rows = await this.api.get('clearance/'); } catch (e: any) { this.msg = AssetApiService.error(e); this.msgErr = true; }
    this.loading = false;
    if (this.sel) await this.pick(this.sel);
    this.cd.markForCheck();
  }

  async pick(e: any): Promise<void> {
    try { this.sel = await this.api.get(`clearance/${e.employee_id}/`); } catch (x: any) { this.msg = AssetApiService.error(x); this.msgErr = true; }
    this.cd.markForCheck();
  }

  async act(action: string): Promise<void> {
    const body: any = { action };
    if (action === 'waive') {
      const reason = prompt('Why can the final settlement go ahead with these items open?');
      if (!reason) return;
      body.reason = reason;
    } else if (action === 'settle' && !confirm(`Move ${this.m(this.sel.recovery_due)} of open asset deductions to the final settlement?`)) {
      return;
    }
    try {
      this.sel = await this.api.post(`clearance/${this.sel.employee_id}/`, body);
      this.msg = 'Saved.'; this.msgErr = false;
      await this.load();
    } catch (e: any) { this.msg = AssetApiService.error(e); this.msgErr = true; this.cd.markForCheck(); }
  }

  open(id: number): void { this.router.navigate([ASSET_BASE, 'register', id], { queryParams: { tab: 'assignment' } }); }
  m(v: any): string { return money(v); }
}
