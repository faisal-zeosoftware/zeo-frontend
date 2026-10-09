import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetApiService } from './asset-api.service';

/** Asset settings (v1.12.0): code prefix and numbering per asset type, default depreciation, reminders, acknowledgement, exit clearance. */
@Component({
  selector: 'app-asset-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">Asset settings</h1>
        <p class="ex-desc">Asset codes are the type prefix plus the next number (e.g. LAP-0001). The depreciation set here is the default for new assets of the type.
          Asset types and their extra fields are managed in Asset types and the Asset form designer.</p></div></div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <div class="ex-panel">
        <div class="ex-h">Company settings</div>
        <div class="ex-form" *ngIf="s">
          <label>Currency<input [(ngModel)]="s.currency" name="c" maxlength="3"></label>
          <label>Digits in the asset number<input type="number" min="1" max="8" [(ngModel)]="s.code_padding" name="p"></label>
          <label>Warranty / insurance reminder (days before)<input type="number" min="0" max="365" [(ngModel)]="s.warranty_reminder_days" name="w"></label>
          <label>Most instalments for a recovery<input type="number" min="1" max="60" [(ngModel)]="s.max_instalments" name="m"></label>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.require_acknowledgement" name="a"> Employees confirm receipt in self-service</label>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.block_final_settlement" name="b"> Block the final settlement while assets are open</label>
        </div>
        <div class="ex-actbar"><button type="button" class="ex-btn primary" [disabled]="busy" (click)="saveSettings()">Save settings</button></div>
      </div>
      <div class="ex-panel">
        <div class="ex-h">Asset types</div>
        <div class="ap-scroll">
          <table class="ap-table">
            <thead><tr><th>Type</th><th>Prefix</th><th>Next no.</th><th>Depreciation</th><th>Life (months)</th><th>Salvage %</th><th>Assets</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let t of types">
                <td>{{ t.name }}<div class="ex-muted" *ngIf="t.custom_fields.length">{{ t.custom_fields.length }} extra field(s)</div></td>
                <td><input [(ngModel)]="t.code_prefix" [name]="'p' + t.asset_type" maxlength="12" style="width:80px" aria-label="Prefix"></td>
                <td><input type="number" min="1" [(ngModel)]="t.next_number" [name]="'n' + t.asset_type" style="width:80px" aria-label="Next number"></td>
                <td><select [(ngModel)]="t.depreciation_method" [name]="'d' + t.asset_type" aria-label="Depreciation"><option value="straight_line">Straight line</option>
                  <option value="declining">Declining</option><option value="none">None</option></select></td>
                <td><input type="number" min="1" max="600" [(ngModel)]="t.useful_life_months" [name]="'l' + t.asset_type" style="width:80px" aria-label="Useful life"></td>
                <td><input type="number" min="0" max="100" [(ngModel)]="t.salvage_percent" [name]="'s' + t.asset_type" style="width:70px" aria-label="Salvage %"></td>
                <td>{{ t.assets }}</td>
                <td><button type="button" class="ex-btn sm" (click)="saveType(t)">Save</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class AssetSetupComponent implements OnInit {
  s: any = null;
  types: any[] = [];
  msg = ''; msgErr = false; busy = false;

  constructor(private api: AssetApiService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      [this.s, this.types] = await Promise.all([this.api.get('settings/'), this.api.get('types/')]);
    } catch (e: any) { this.fail(e); }
    this.cd.markForCheck();
  }

  async saveSettings(): Promise<void> {
    this.busy = true;
    try { this.s = await this.api.patch('settings/', this.s); this.ok('Settings saved.'); } catch (e: any) { this.fail(e); }
    this.busy = false;
    this.cd.markForCheck();
  }

  async saveType(t: any): Promise<void> {
    try {
      this.types = await this.api.patch('types/', { asset_type: t.asset_type, code_prefix: t.code_prefix, next_number: t.next_number,
        depreciation_method: t.depreciation_method, useful_life_months: t.useful_life_months, salvage_percent: t.salvage_percent });
      this.ok(`${t.name} saved.`);
    } catch (e: any) { this.fail(e); }
    this.cd.markForCheck();
  }

  ok(m: string): void { this.msg = m; this.msgErr = false; }
  fail(e: any): void { this.msg = AssetApiService.error(e); this.msgErr = true; }
}
