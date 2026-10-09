import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetApiService, CONDITIONS, today } from './asset-api.service';

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'OMR', 'BHD', 'KWD', 'INR'];

/** New / edit asset (v1.12.0): base asset + profile (purchase, warranty, insurance, depreciation) + the asset type's custom fields. */
@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(860px,100%)">
    <header><h2>{{ asset?.id ? 'Edit ' + asset.name : 'New asset' }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="ex-msg err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <div class="ap-section">Asset</div>
        <label>Asset type *
          <select [(ngModel)]="f.asset_type" (ngModelChange)="typeChanged()" name="t">
            <option [ngValue]="null">Choose…</option><option *ngFor="let t of lk.types" [ngValue]="t.id">{{ t.name }}</option></select></label>
        <label>Name *<input [(ngModel)]="f.name" name="n" maxlength="100" placeholder="e.g. Dell Latitude 5440"></label>
        <label>Serial number *<input [(ngModel)]="f.serial_number" name="sn" maxlength="100"></label>
        <label>Model<input [(ngModel)]="f.model" name="m" maxlength="100"></label>
        <label>Asset code<input [(ngModel)]="f.asset_code" name="code" [placeholder]="asset?.id ? '' : 'Empty = next number of the type'"></label>
        <label>Condition
          <select [(ngModel)]="f.condition" name="c"><option *ngFor="let c of conditions" [value]="c.value">{{ c.label }}</option></select></label>

        <div class="ap-section">Where it is</div>
        <label>Branch {{ lk.branches?.length > 1 ? '*' : '' }}
          <select [(ngModel)]="f.branch_id" name="b"><option [ngValue]="null">–</option><option *ngFor="let b of lk.branches" [ngValue]="b.id">{{ b.name }}</option></select></label>
        <label>Location<input [(ngModel)]="f.location" name="loc" placeholder="Building, floor, store …"></label>
        <label>Department<select [(ngModel)]="f.department_id" name="d"><option [ngValue]="null">–</option>
          <option *ngFor="let d of lk.departments" [ngValue]="d.id">{{ d.name }}</option></select></label>
        <label>Barcode / tag<input [(ngModel)]="f.barcode" name="bc" placeholder="Empty = asset code"></label>

        <div class="ap-section">Purchase</div>
        <label>Purchase date *<input type="date" [(ngModel)]="f.purchase_date" name="pd" [max]="maxDate"></label>
        <label>Vendor<input [(ngModel)]="f.vendor" name="v"></label>
        <label>Purchase cost<input type="number" min="0" step="0.01" [(ngModel)]="f.purchase_cost" name="pc"></label>
        <label>Currency<select [(ngModel)]="f.currency" name="cur"><option *ngFor="let c of currencies" [value]="c">{{ c }}</option></select></label>
        <label>Invoice no.<input [(ngModel)]="f.invoice_no" name="inv"></label>
        <label>Purchase order<input [(ngModel)]="f.purchase_order" name="po"></label>
        <label class="wide">Invoice file <input type="file" accept="image/*,application/pdf" (change)="invoice = file($event)" aria-label="Invoice file">
          <a *ngIf="asset?.invoice_file && !invoice" class="ex-link" [href]="asset.invoice_file" target="_blank" rel="noopener">Open the current invoice</a></label>

        <div class="ap-section">Warranty and insurance</div>
        <label>Warranty from<input type="date" [(ngModel)]="f.warranty_start" name="ws"></label>
        <label>Warranty until<input type="date" [(ngModel)]="f.warranty_end" name="we"></label>
        <label>Remind days before the warranty ends<input type="number" min="0" max="365" [(ngModel)]="f.warranty_reminder_days" name="wr" placeholder="Company default"></label>
        <label>Insurer<input [(ngModel)]="f.insurance_provider" name="ip"></label>
        <label>Policy no.<input [(ngModel)]="f.insurance_policy_no" name="ipn"></label>
        <label>Insurance expiry<input type="date" [(ngModel)]="f.insurance_expiry" name="ie"></label>

        <div class="ap-section">Depreciation</div>
        <label>Method<select [(ngModel)]="f.depreciation_method" name="dm">
          <option value="straight_line">Straight line</option><option value="declining">Declining balance</option><option value="none">No depreciation</option></select></label>
        <label>Useful life (months)<input type="number" min="1" max="600" [(ngModel)]="f.useful_life_months" name="ul" [disabled]="f.depreciation_method === 'none'"></label>
        <label>Salvage value<input type="number" min="0" step="0.01" [(ngModel)]="f.salvage_value" name="sv"></label>
        <label *ngIf="f.depreciation_method === 'declining'">Rate % per year<input type="number" min="0" max="100" step="0.01" [(ngModel)]="f.declining_rate" name="dr" placeholder="Empty = double declining"></label>
        <label>Depreciation from<input type="date" [(ngModel)]="f.depreciation_start" name="ds" title="Empty = purchase date"></label>
        <label>Meter reading (km / hours)<input type="number" min="0" step="0.1" [(ngModel)]="f.meter_reading" name="mr"></label>

        <ng-container *ngIf="cfs.length">
          <div class="ap-section">More details ({{ typeName }})</div>
          <ng-container *ngFor="let c of cfs">
            <label *ngIf="c.type === 'text'">{{ c.name }}<input [(ngModel)]="cv[c.id]" [name]="'cf' + c.id"></label>
            <label *ngIf="c.type === 'date'">{{ c.name }}<input type="date" [(ngModel)]="cv[c.id]" [name]="'cf' + c.id"></label>
            <label *ngIf="c.type === 'dropdown' || c.type === 'radio'">{{ c.name }}
              <select [(ngModel)]="cv[c.id]" [name]="'cf' + c.id"><option [ngValue]="null">–</option><option *ngFor="let o of c.options" [value]="o">{{ o }}</option></select></label>
            <div *ngIf="c.type === 'checkbox'" class="wide" style="font-size:12px;font-weight:600;color:#6b7185">{{ c.name }}
              <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:4px">
                <label class="ck" *ngFor="let o of c.options" style="flex-direction:row;align-items:center;gap:6px;font-weight:500;color:#2b2f42">
                  <input type="checkbox" [checked]="checked(c.id, o)" (change)="toggle(c.id, o)" style="width:16px;height:16px"> {{ o }}</label>
              </div></div>
          </ng-container>
        </ng-container>

        <label class="wide">Notes<textarea [(ngModel)]="f.notes" name="notes"></textarea></label>
        <label class="wide" *ngIf="!asset?.id">Photos<input type="file" accept="image/*" multiple (change)="photos = files($event)" aria-label="Photos"></label>
      </div>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" [disabled]="busy" (click)="save()">{{ asset?.id ? 'Save changes' : 'Create asset' }}</button>
    </footer>
  </div>
</div>`,
})
export class AssetFormComponent implements OnInit {
  @Input() asset: any = null;
  @Output() saved = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();
  lk: any = { types: [], branches: [], departments: [] };
  f: any = {};
  cfs: any[] = [];
  cv: Record<number, any> = {};
  invoice: File | null = null;
  photos: File[] = [];
  err = '';
  busy = false;
  conditions = CONDITIONS;
  currencies = CURRENCIES;
  maxDate = today();

  constructor(private api: AssetApiService, private cd: ChangeDetectorRef) {}

  get typeName(): string { return (this.lk.types || []).find((t: any) => t.id === this.f.asset_type)?.name || ''; }

  async ngOnInit(): Promise<void> {
    const a = this.asset || {};
    this.f = {
      asset_type: a.asset_type ?? null, name: a.name || '', serial_number: a.serial_number || '', model: a.model || '', asset_code: a.code || '',
      condition: a.condition || 'healthy', branch_id: a.branch_id ?? null, location: a.location || '', department_id: a.department_id ?? null,
      barcode: a.barcode && a.barcode !== a.code ? a.barcode : '', purchase_date: a.purchase_date || today(), vendor: a.vendor || '',
      purchase_cost: a.purchase_cost ?? 0, currency: a.currency || 'AED', invoice_no: a.invoice_no || '', purchase_order: a.purchase_order || '',
      warranty_start: a.warranty_start || null, warranty_end: a.warranty_end || null, warranty_reminder_days: a.warranty_reminder_days ?? null,
      insurance_provider: a.insurance_provider || '', insurance_policy_no: a.insurance_policy_no || '', insurance_expiry: a.insurance_expiry || null,
      depreciation_method: a.depreciation_method || 'straight_line', useful_life_months: a.useful_life_months ?? 36, salvage_value: a.salvage_value ?? 0,
      declining_rate: a.declining_rate ?? null, depreciation_start: a.depreciation_start || null, meter_reading: a.meter_reading ?? null, notes: a.notes || '',
    };
    (a.custom_fields || []).forEach((c: any) => (this.cv[c.id] = c.type === 'checkbox' ? (c.value ? String(c.value).split(',') : []) : c.value));
    this.cfs = a.custom_fields || [];
    try {
      this.lk = await this.api.lookups();
      if (!a.id && this.lk.branches?.length === 1) this.f.branch_id = this.lk.branches[0].id;
      if (!a.id && this.f.asset_type) await this.typeChanged();
    } catch (e: any) {
      this.err = AssetApiService.error(e, 'The lists could not be loaded.');
    }
    this.cd.markForCheck();
  }

  async typeChanged(): Promise<void> {
    if (!this.f.asset_type) { this.cfs = []; return; }
    try {
      const types: any[] = await this.api.get('types/');
      const t = types.find(x => x.asset_type === this.f.asset_type);
      if (!this.asset?.id && t) {
        this.f.depreciation_method = t.depreciation_method;
        this.f.useful_life_months = t.useful_life_months;
      }
      if (this.asset?.id && this.asset.asset_type === this.f.asset_type) {
        this.cfs = this.asset.custom_fields || [];
      } else {
        this.cfs = (t?.custom_fields || []).map((c: any) => ({ id: c.id, name: c.custom_field, type: c.data_type || 'text', options: c.options || [] }));
      }
    } catch { /* lists stay as they are */ }
    this.cd.markForCheck();
  }

  checked(id: number, o: string): boolean { return (this.cv[id] || []).includes(o); }
  toggle(id: number, o: string): void {
    const cur: string[] = this.cv[id] || [];
    this.cv[id] = cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o];
  }
  file(ev: Event): File | null { return (ev.target as HTMLInputElement).files?.[0] || null; }
  files(ev: Event): File[] { return Array.from((ev.target as HTMLInputElement).files || []); }

  async save(): Promise<void> {
    this.err = '';
    if (!this.f.asset_type || !this.f.name || !this.f.serial_number || !this.f.purchase_date) {
      this.err = 'Fill in the asset type, name, serial number and purchase date.';
      return;
    }
    const custom: Record<string, any> = {};
    this.cfs.forEach(c => (custom[c.id] = this.cv[c.id] === undefined ? null : this.cv[c.id]));
    const body: any = { ...this.f, custom_fields: custom };
    if (!body.asset_code) delete body.asset_code;
    this.busy = true;
    try {
      let res: any;
      if (this.asset?.id) {
        res = this.invoice ? await this.api.patch(`assets/${this.asset.id}/`, AssetApiService.form(body, { invoice_file: this.invoice }))
          : await this.api.patch(`assets/${this.asset.id}/`, body);
      } else {
        res = await this.api.post('assets/', AssetApiService.form(body, { invoice_file: this.invoice, photos: this.photos }));
      }
      this.saved.emit(res);
    } catch (e: any) {
      this.err = AssetApiService.error(e, 'The asset could not be saved.');
    }
    this.busy = false;
    this.cd.markForCheck();
  }
}
