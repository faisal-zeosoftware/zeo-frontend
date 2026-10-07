import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DesignField } from './field-types';
import { DirEmp, ZListService } from './z-list.service';
import { ZRecordService } from './z-record.service';

let seq = 0;

/** One input for any designer field type. Value in, valueChange out; files go through `upload`. */
@Component({
  selector: 'z-field-input',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zf" [class.zf-wide]="wide">
    <label class="zf-label" [attr.for]="uid" *ngIf="field.field_type !== 'checkbox'">{{ field.label }}<span class="zf-req" *ngIf="field.required" aria-hidden="true"> *</span></label>
    <ng-container [ngSwitch]="field.field_type">
      <textarea *ngSwitchCase="'textarea'" class="zf-in" rows="3" [id]="uid" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || ''" (input)="set($any($event.target).value)"></textarea>

      <div *ngSwitchCase="'currency'" class="zf-affix"><span>AED</span>
        <input class="zf-in" [id]="uid" inputmode="decimal" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || '0.00'" (input)="set($any($event.target).value)"></div>
      <div *ngSwitchCase="'percent'" class="zf-affix zf-after">
        <input class="zf-in" [id]="uid" inputmode="decimal" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || '0'" (input)="set($any($event.target).value)"><span>%</span></div>
      <input *ngSwitchCase="'integer'" class="zf-in" [id]="uid" inputmode="numeric" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || ''" (input)="set($any($event.target).value)">
      <input *ngSwitchCase="'decimal'" class="zf-in" [id]="uid" inputmode="decimal" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || ''" (input)="set($any($event.target).value)">
      <input *ngSwitchCase="'date'" type="date" class="zf-in" [id]="uid" [disabled]="disabled" [value]="isoDate(value)" (change)="set($any($event.target).value)">
      <input *ngSwitchCase="'datetime'" type="datetime-local" class="zf-in" [id]="uid" [disabled]="disabled" [value]="value ?? ''" (change)="set($any($event.target).value)">
      <input *ngSwitchCase="'time'" type="time" class="zf-in" [id]="uid" [disabled]="disabled" [value]="value ?? ''" (change)="set($any($event.target).value)">
      <input *ngSwitchCase="'email'" type="email" class="zf-in" [id]="uid" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || 'name@company.ae'" (input)="set($any($event.target).value)">
      <input *ngSwitchCase="'phone'" type="tel" class="zf-in" [id]="uid" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || '+971 50 000 0000'" (input)="set($any($event.target).value)">
      <div *ngSwitchCase="'url'" class="zf-affix zf-after">
        <input type="url" class="zf-in" [id]="uid" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || 'https://'" (input)="set($any($event.target).value)">
        <a *ngIf="value" class="zf-open" [href]="link(value)" target="_blank" rel="noopener" aria-label="Open link"><mat-icon>open_in_new</mat-icon></a></div>
      <label *ngSwitchCase="'checkbox'" class="zf-check"><input type="checkbox" [id]="uid" [disabled]="disabled" [checked]="truthy(value)" (change)="set($any($event.target).checked)">
        <span>{{ field.label }}<span class="zf-req" *ngIf="field.required"> *</span></span></label>
      <select *ngSwitchCase="'dropdown'" class="zf-in" [id]="uid" [disabled]="disabled" (change)="set($any($event.target).value || null)">
        <option value="">Choose…</option>
        <option *ngFor="let o of field.options || []" [value]="o" [selected]="o === value">{{ o }}</option>
      </select>
      <div *ngSwitchCase="'radio'" class="zf-choices" role="radiogroup" [attr.aria-label]="field.label">
        <label *ngFor="let o of field.options || []"><input type="radio" [name]="uid" [disabled]="disabled" [checked]="o === value" (change)="set(o)"> {{ o }}</label>
      </div>
      <div *ngSwitchCase="'multiselect'" class="zf-choices" role="group" [attr.aria-label]="field.label">
        <label *ngFor="let o of field.options || []" class="zf-chipbox" [class.on]="has(o)"><input type="checkbox" [disabled]="disabled" [checked]="has(o)" (change)="toggle(o)"> {{ o }}</label>
      </div>
      <div *ngSwitchCase="'rating'" class="zf-stars" role="radiogroup" [attr.aria-label]="field.label">
        <button type="button" *ngFor="let n of [1,2,3,4,5]" [disabled]="disabled" [class.on]="+value >= n" (click)="set(+value === n ? null : n)" [attr.aria-label]="n + ' of 5'">
          <mat-icon>{{ +value >= n ? 'star' : 'star_border' }}</mat-icon></button>
      </div>
      <div *ngSwitchCase="'color'" class="zf-affix zf-after zf-color">
        <input type="color" [id]="uid" [disabled]="disabled" [value]="value || '#5b4fe0'" (input)="set($any($event.target).value)"><span>{{ value || 'Not set' }}</span></div>
      <ng-container *ngSwitchCase="'employee'">
        <input class="zf-in" [id]="uid" [attr.list]="uid + '-l'" [disabled]="disabled" [value]="empText(value)" placeholder="Code or name" (change)="pickEmp($any($event.target).value)">
        <datalist [id]="uid + '-l'"><option *ngFor="let e of emps" [value]="e.code + ' – ' + e.name"></option></datalist>
      </ng-container>
      <div *ngSwitchCase="'file'" class="zf-file">
        <ng-container *ngIf="value?.name; else pick">
          <mat-icon>description</mat-icon>
          <a *ngIf="value?.id" href="#" (click)="openFile($event)">{{ value.name }}</a>
          <span *ngIf="!value?.id">{{ value.name }} <em>(uploads when saved)</em></span>
          <button type="button" class="zf-x" *ngIf="!disabled" (click)="set(null)" aria-label="Remove file"><mat-icon>close</mat-icon></button>
        </ng-container>
        <ng-template #pick>
          <label class="zf-upload"><input type="file" [id]="uid" [disabled]="disabled || busy" (change)="file($event)"><mat-icon>upload</mat-icon>{{ busy ? 'Uploading…' : 'Choose a file' }}</label>
        </ng-template>
      </div>
      <input *ngSwitchDefault class="zf-in" [id]="uid" [disabled]="disabled" [value]="value ?? ''" [placeholder]="field.placeholder || ''" (input)="set($any($event.target).value)">
    </ng-container>
    <div class="zf-help" *ngIf="field.help_text && !error">{{ field.help_text }}</div>
    <div class="zf-err" *ngIf="error" role="alert">{{ error }}</div>
  </div>`,
})
export class ZFieldInputComponent implements OnInit {
  @Input() field!: DesignField;
  @Input() value: any = null;
  @Input() disabled = false;
  @Input() error = '';
  @Input() wide = false;
  /** Uploads a file now (record exists) and returns {id, name}; without it the File is kept until save. */
  @Input() upload?: (f: File) => Promise<{ id: number; name: string }>;
  @Output() valueChange = new EventEmitter<any>();
  uid = 'zf' + (++seq);
  emps: DirEmp[] = [];
  busy = false;

  constructor(private z: ZListService, private rec: ZRecordService) {}

  ngOnInit(): void {
    if (this.field.field_type === 'employee') { this.z.directory().subscribe(d => this.emps = d); }
  }

  set(v: any): void { this.value = v; this.valueChange.emit(v); }
  truthy(v: any): boolean { return v === true || ['yes', 'true', '1', 'on'].includes(String(v).toLowerCase()); }
  isoDate(v: any): string {
    if (!v) { return ''; }
    const m = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(String(v));
    return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v).slice(0, 10);
  }
  has(o: string): boolean { return Array.isArray(this.value) ? this.value.includes(o) : String(this.value || '').split(/,\s*/).includes(o); }
  toggle(o: string): void {
    const cur: string[] = Array.isArray(this.value) ? [...this.value] : String(this.value || '').split(/,\s*/).filter(Boolean);
    const i = cur.indexOf(o); i >= 0 ? cur.splice(i, 1) : cur.push(o);
    this.set((this.field.options || []).filter(x => cur.includes(x)));
  }
  link(v: string): string { return /^https?:\/\//i.test(v) ? v : 'https://' + v; }
  empText(v: any): string { return v && typeof v === 'object' ? `${v.code} – ${v.name}` : (v || ''); }
  pickEmp(text: string): void {
    const code = text.split(' – ')[0].trim().toLowerCase();
    const e = this.emps.find(x => x.code.toLowerCase() === code || x.name.toLowerCase() === text.trim().toLowerCase());
    this.set(e ? { id: e.id, code: e.code, name: e.name } : (text ? text : null));
  }
  openFile(ev: Event): void {
    ev.preventDefault();
    this.rec.open(this.value).catch(() => this.error = 'The file could not be opened.');
  }
  async file(ev: Event): Promise<void> {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) { return; }
    if (f.size > 25 * 1024 * 1024) { this.error = 'The file is larger than 25 MB.'; return; }
    if (!this.upload) { this.set({ name: f.name, pending: f }); return; }
    this.busy = true;
    try { this.set(await this.upload(f)); } catch (e: any) { this.error = e?.error?.detail || 'The file was not uploaded.'; }
    this.busy = false;
  }
}
