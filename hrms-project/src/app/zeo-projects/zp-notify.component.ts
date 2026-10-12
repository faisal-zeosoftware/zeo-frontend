import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZpApiService } from './zp-api.service';

/** Notification settings matrix (v1.15.0), used in three places:
 *  scope 'company'  – Setup → Notifications (the defaults)
 *  scope 'customer' – a customer's page (overrides the company for that client)
 *  scope 'me'       – My work → My notifications (each user for themselves; staff events only)
 *  At customer and user level a row is either "as company" (inherited) or set here. */
@Component({
  selector: 'app-zp-notify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<p class="zp-note err" *ngIf="msg">{{ msg }}</p>
<p class="zp-note ok" *ngIf="saved">Saved.</p>
<p class="zp-muted" style="margin:0 0 10px">{{ intro() }}</p>
<div class="zp-scroll">
  <table class="zp-table">
    <tr><th>Event</th><th>Who gets it</th><th *ngIf="scope !== 'company'">Setting</th><th style="text-align:center">E-mail</th><th style="text-align:center">To-do / My work</th></tr>
    <ng-container *ngFor="let g of groups">
      <tr *ngIf="rowsOf(g.key).length"><td [attr.colspan]="scope !== 'company' ? 5 : 4" class="zp-grp">{{ g.label }}</td></tr>
      <tr *ngFor="let r of rowsOf(g.key)">
        <td><b style="font-weight:600">{{ r.label }}</b><div class="zp-muted" *ngIf="r.help">{{ r.help }}</div></td>
        <td class="zp-muted">{{ r.audience === 'customer' ? 'Customer contacts' : 'Our staff' }}</td>
        <td *ngIf="scope !== 'company'">
          <select [(ngModel)]="r.custom" (ngModelChange)="toggle(r)" [attr.aria-label]="'Setting for ' + r.label">
            <option [ngValue]="false">As company</option><option [ngValue]="true">Set here</option></select></td>
        <td style="text-align:center"><input type="checkbox" [(ngModel)]="r.email" [disabled]="!editable(r)" [attr.aria-label]="'E-mail: ' + r.label"></td>
        <td style="text-align:center"><input type="checkbox" *ngIf="r.has_dashboard" [(ngModel)]="r.dashboard" [disabled]="!editable(r)" [attr.aria-label]="'To-do: ' + r.label">
          <span class="zp-muted" *ngIf="!r.has_dashboard">–</span></td>
      </tr>
    </ng-container>
  </table>
</div>
<div class="zp-acts" style="margin-top:12px" *ngIf="canEdit">
  <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">Save notification settings</button>
</div>`,
  styles: [`.zp-grp { background: #f6f7fb; font-weight: 700; color: #4338ca; font-size: 11.5px; text-transform: none; }`],
})
export class ZpNotifyComponent implements OnChanges {
  @Input() scope: 'company' | 'customer' | 'me' = 'company';
  @Input() customerId: number | null = null;
  @Input() canEdit = true;
  rows: any[] = [];
  msg = '';
  saved = false;
  busy = false;
  groups = [{ key: 'customer', label: 'To the customer' }, { key: 'staff', label: 'To our team' }];

  constructor(private api: ZpApiService) {}

  ngOnChanges(): void { this.load(); }

  private q(): any { return this.scope === 'customer' ? { scope: 'customer', customer: this.customerId } : { scope: this.scope }; }

  async load(): Promise<void> {
    try { this.rows = (await this.api.get('notification-settings/', this.q())).rows; this.msg = ''; }
    catch (e) { this.msg = ZpApiService.error(e); }
  }

  rowsOf(a: string): any[] { return this.rows.filter(r => r.audience === a); }
  editable(r: any): boolean { return this.canEdit && (this.scope === 'company' || r.custom); }
  toggle(r: any): void { if (!r.custom) { r.email = r.inherited_email; r.dashboard = r.inherited_dashboard; } }

  intro(): string {
    if (this.scope === 'company') return 'The company default for every customer and user. Customers and users can be set differently.';
    if (this.scope === 'customer') return 'For this customer only. "As company" follows Setup → Notifications.';
    return 'Only for you. "As company" follows the company setting.';
  }

  async save(): Promise<void> {
    this.busy = true; this.saved = false;
    try {
      this.rows = (await this.api.putQ('notification-settings/', this.q(), { rows: this.rows })).rows;
      this.saved = true; this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e); }
    this.busy = false;
  }
}
