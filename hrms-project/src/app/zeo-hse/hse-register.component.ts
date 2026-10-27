import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HSE_BASE, HseApiService, csv, day, stClass, today, when } from './hse-api.service';

/** A field input of a generic register form (text, number, date, choice, linked record, several records, yes/no). */
@Component({
  selector: 'hse-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  // v1.56.1 release checklist: HSE forms had labels beside small boxes – the same field layout and picker as the app-kit forms
  styles: [`.wide { grid-column: 1 / -1; }
    :host > label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: #6b7185; min-width: 0; }
    :host > label > input:not([type=checkbox]):not([type=radio]):not([type=file]), :host > label > select, :host > label > textarea {
      width: 100%; box-sizing: border-box; height: 38px; border: 1px solid #dcdfea; border-radius: 8px; padding: 0 10px; font: inherit; font-size: 13.5px;
      font-weight: 400; color: #1d2033; background: #fff; }
    :host > label > textarea { height: 76px; padding: 8px 10px; resize: vertical; }
    :host > label > input:focus, :host > label > select:focus, :host > label > textarea:focus { outline: 2px solid #c9c3ff; border-color: #5b4fe0; }
    :host > label.ck { flex-direction: row; align-items: center; gap: 8px; font-weight: 500; color: #2b2f42; font-size: 13px; }
    :host > label.ck > input { width: 16px; height: 16px; accent-color: #5b4fe0; }
    :host > label .zaf-h { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    :host input::placeholder { text-transform: none !important; color: #9aa0b4 !important; }
    .zaf-pick { position: relative; display: block; }
    .zaf-pick > input { width: 100%; box-sizing: border-box; height: 38px; border: 1px solid #dcdfea; border-radius: 8px; padding: 0 28px 0 10px;
      font: inherit; font-size: 13.5px; font-weight: 400; color: #1d2033; background: #fff; }
    .zaf-pick > input:focus { outline: 2px solid #c9c3ff; border-color: #5b4fe0; }
    .zaf-caret { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #6b7185; font-size: 11px; pointer-events: none; }
    .zaf-list { position: absolute; z-index: 30; left: 0; right: 0; top: 40px; max-height: 240px; overflow-y: auto; background: #fff;
      border: 1px solid #dcdfea; border-radius: 8px; box-shadow: 0 8px 24px rgba(27,22,64,.14); padding: 4px 0; display: block; }
    .zaf-list.up { top: auto; bottom: 40px; }
    .zaf-opt, .zaf-empty { display: block; padding: 7px 12px; font-size: 13px; font-weight: 400; color: #1d2033; cursor: pointer; }
    .zaf-opt.hi, .zaf-opt:hover { background: #f4f5fa; } .zaf-opt.on { font-weight: 600; color: #5b4fe0; }
    .zaf-none { color: #6b7185; } .zaf-empty { color: #6b7185; cursor: default; }
    :host-context([dir=rtl]) .zaf-pick > input { padding: 0 10px 0 28px; } :host-context([dir=rtl]) .zaf-caret { right: auto; left: 10px; }`],
  template: `
<ng-container [ngSwitch]="kind">
  <label *ngSwitchCase="'bool'" class="ck"><input type="checkbox" [ngModel]="!!value" (ngModelChange)="set($event)"> {{ f.label }}</label>
  <label *ngSwitchCase="'bool3'">{{ f.label }}{{ f.required ? ' *' : '' }}
    <select [ngModel]="value === true ? 'y' : value === false ? 'n' : ''" (ngModelChange)="set($event === 'y' ? true : $event === 'n' ? false : null)">
      <option value="">–</option><option value="y">Yes</option><option value="n">No</option></select></label>
  <label *ngSwitchCase="'textarea'" class="wide">{{ f.label }}{{ f.required ? ' *' : '' }}<textarea [ngModel]="value" (ngModelChange)="set($event)" rows="3"></textarea></label>
  <label *ngSwitchCase="'choice'">{{ f.label }}{{ f.required ? ' *' : '' }}
    <select [ngModel]="value" (ngModelChange)="set($event)"><option [ngValue]="''">–</option>
      <option *ngFor="let c of choices" [ngValue]="c.value">{{ c.label }}</option></select></label>
  <label *ngSwitchCase="'fk'"><span class="zaf-h">{{ f.label }}{{ f.required ? ' *' : '' }}</span>
    <span class="zaf-pick" (focusout)="pickBlur($event)">
      <input type="text" role="combobox" autocomplete="off" [attr.aria-expanded]="open" [value]="open ? filter : selLabel()" placeholder="Search or choose…"
             (focus)="openPick($event)" (click)="openPick($event)" (input)="filter = $any($event.target).value; open = true; hi = 0" (keydown)="pickKey($event)">
      <span class="zaf-caret" aria-hidden="true">▾</span>
      <span class="zaf-list" role="listbox" *ngIf="open" [class.up]="up">
        <span class="zaf-opt zaf-none" role="option" (mousedown)="choose(null, $event)">–</span>
        <span class="zaf-opt" role="option" *ngFor="let o of filtered().slice(0, 300); let i = index" [class.on]="o.id === value" [class.hi]="i === hi"
              (mousedown)="choose(o.id, $event)">{{ o.label }}</span>
        <span class="zaf-empty" *ngIf="!filtered().length">No match</span>
      </span>
    </span></label>
  <div *ngSwitchCase="'m2m'" class="wide" style="display:flex;flex-direction:column;gap:4px">
    <span style="font-size:12px;font-weight:600;color:#6b7185">{{ f.label }}</span>
    <input type="search" [(ngModel)]="filter" placeholder="Filter…" style="height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;font:inherit;font-size:12.5px">
    <div class="hs-multi"><label *ngFor="let o of filtered()"><input type="checkbox" [checked]="has(o.id)" (change)="toggle(o.id)"> {{ o.label }}</label></div>
  </div>
  <label *ngSwitchCase="'file'" class="wide">{{ f.label }}{{ f.required ? ' *' : '' }}<input type="file" (change)="pick($event)"></label>
  <label *ngSwitchCase="'files'" class="wide">{{ f.label }}<input type="file" multiple (change)="pick($event)"></label>
  <label *ngSwitchDefault [class.wide]="wide">{{ f.label }}{{ f.required ? ' *' : '' }}
    <input [type]="htmlType" [ngModel]="value" (ngModelChange)="set($event)" [step]="kind === 'decimal' ? 'any' : null"></label>
</ng-container>`,
})
export class HseFieldComponent implements OnChanges {
  @Input() f: any;
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();
  @Output() files = new EventEmitter<File[]>();
  opts: any[] = [];
  choices: any[] = [];
  filter = '';
  kind = 'text';
  wide = false;

  constructor(private api: HseApiService) {}

  async ngOnChanges(): Promise<void> {
    const t: string = this.f?.type || 'text';
    if (t.startsWith('fk:')) { this.kind = 'fk'; this.opts = await this.api.options(t.slice(3)).catch(() => []); return; }
    if (t.startsWith('choice:')) {
      this.kind = 'choice';
      this.choices = t.slice(7).split(',').map(x => { const [v, l] = x.split('='); return { value: v, label: l || v }; });
      return;
    }
    this.kind = t;
    this.choices = this.f?.choices || [];
    this.wide = t === 'text' && /title|description|summary|name/.test(this.f?.name || '') && false;
    if ((t === 'fk' || t === 'm2m') && this.f.options) this.opts = await this.api.options(this.f.options).catch(() => []);
  }

  get htmlType(): string {
    return { int: 'number', decimal: 'number', date: 'date', datetime: 'datetime-local' }[this.kind] || 'text';
  }

  set(v: any): void { this.value = v; this.valueChange.emit(v); }
  has(id: number): boolean { return (this.value || []).includes(id); }
  toggle(id: number): void { const v = [...(this.value || [])]; const i = v.indexOf(id); i >= 0 ? v.splice(i, 1) : v.push(id); this.set(v); }
  filtered(): any[] { const q = this.filter.toLowerCase(); return q ? this.opts.filter(o => o.label.toLowerCase().includes(q) || o.id === this.value) : this.opts; }
  pick(ev: any): void { this.files.emit(Array.from(ev.target.files || [])); }

  // v1.56.1 one picker (search and choose in one box) – as the app-kit forms
  open = false;
  hi = 0;
  up = false;
  selLabel(): string { const o = this.opts.find(x => x.id === this.value); return o ? o.label : ''; }
  openPick(ev?: Event): void {
    if (this.open) { return; }
    const el = ev?.target as HTMLElement | undefined;
    if (el) { const r = el.getBoundingClientRect(); const box = (el.closest('.body, .ex-modal') as HTMLElement | null)?.getBoundingClientRect();
      const below = Math.min(window.innerHeight, box ? box.bottom : window.innerHeight) - r.bottom; this.up = below < 250 && r.top > 260; }
    this.open = true; this.filter = ''; this.hi = Math.max(0, this.filtered().findIndex(o => o.id === this.value));
  }
  choose(id: any, ev?: Event): void { ev?.preventDefault(); this.set(id); this.open = false; this.filter = ''; }
  pickBlur(ev: FocusEvent): void { const to = ev.relatedTarget as Node | null; if (!to || !(ev.currentTarget as HTMLElement).contains(to)) { this.open = false; this.filter = ''; } }
  pickKey(ev: KeyboardEvent): void {
    const list = this.filtered();
    if (ev.key === 'ArrowDown') { this.open = true; this.hi = Math.min(list.length - 1, this.hi + 1); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { this.hi = Math.max(0, this.hi - 1); ev.preventDefault(); }
    else if (ev.key === 'Enter' && this.open) { if (list[this.hi]) { this.choose(list[this.hi].id); } ev.preventDefault(); }
    else if (ev.key === 'Escape' && this.open) { this.open = false; this.filter = ''; ev.preventDefault(); ev.stopPropagation(); }
  }
}

/** Create / edit form of any register (fields from the register meta). */
@Component({
  selector: 'hse-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HseFieldComponent],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(820px,100%)">
    <header><h2>{{ title }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note info" *ngIf="help">{{ help }}</p>
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <ng-container *ngFor="let f of fields">
          <hse-field *ngIf="show(f)" [f]="f" [(value)]="v[f.name]" (files)="files = $event" [class.wide]="f.type === 'textarea' || f.type === 'm2m'"></hse-field>
        </ng-container>
        <label class="wide" *ngIf="!id && withFiles">Attachments<input type="file" multiple (change)="files = toList($any($event.target).files)"></label>
      </div>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Saving…' : (id ? 'Save' : 'Create') }}</button>
    </footer>
  </div>
</div>`,
  styles: [':host ::ng-deep hse-field.wide { grid-column: 1 / -1; } :host ::ng-deep hse-field { display: contents; }'],
})
export class HseFormComponent implements OnInit {
  @Input() reg: any;
  @Input() id: number | null = null;
  @Input() values: any = {};
  @Input() preset: any = {};
  @Input() withFiles = true;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  v: any = {};
  files: File[] = [];
  err = '';
  busy = false;

  constructor(private api: HseApiService) {}

  get title(): string { return (this.id ? 'Change ' : 'New ') + (this.reg?.label || '').toLowerCase(); }
  get help(): string { return this.reg?.help || ''; }
  get fields(): any[] { return (this.reg?.form || []).filter((f: any) => f.type !== 'json' && !(f.name in this.preset)); }

  ngOnInit(): void {
    this.v = {};
    for (const f of this.reg.form) {
      if (f.type === 'json') continue;
      let val = this.values?.[f.name];
      if (val === undefined) val = f.type === 'bool' ? false : f.type === 'm2m' ? [] : (f.type === 'fk' || f.type === 'bool3') ? null : '';
      if (val === null && (f.type === 'choice' || f.type === 'text' || f.type === 'textarea')) val = '';
      if (f.type === 'date' && !val && !this.id && /date|_on$/.test(f.name) && f.required) val = today();
      this.v[f.name] = val;
    }
    if (this.id === null && 'is_active' in this.v && this.values?.is_active === undefined) this.v.is_active = true;
  }

  show(f: any): boolean { return !(f.restricted && this.values?.restricted_hidden); }
  toList(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }

  async save(): Promise<void> {
    this.err = '';
    const miss = this.fields.filter(f => f.required && (this.v[f.name] === '' || this.v[f.name] === null || this.v[f.name] === undefined));
    if (miss.length) { this.err = miss.map(f => f.label).join(', ') + ' required.'; return; }
    this.busy = true;
    const body: any = { ...this.v, ...this.preset };
    try {
      const r = this.id
        ? await this.api.patch(`r/${this.reg.kind}/${this.id}/`, body)
        : await this.api.post(`r/${this.reg.kind}/`, this.files.length ? HseApiService.form(body, this.files) : body);
      this.saved.emit(r);
    } catch (e) { this.err = HseApiService.error(e); }
    this.busy = false;
  }
}

/** Dialog of a workflow action (fields from the action spec). */
@Component({
  selector: 'hse-action-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, HseFieldComponent],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(640px,100%)">
    <header><h2>{{ act.label }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <hse-field *ngFor="let f of act.fields" [f]="f" [(value)]="v[f.name]" (files)="files[f.name] = $event"
                   [class.wide]="f.type === 'textarea' || f.type === 'file' || f.type === 'files'"></hse-field>
      </div>
      <p class="hs-muted" *ngIf="!act.fields.length">Confirm: {{ act.label.toLowerCase() }}.</p>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn" [class.primary]="act.style !== 'danger'" [class.danger]="act.style === 'danger'" (click)="run()" [disabled]="busy">{{ busy ? 'Working…' : act.label }}</button>
    </footer>
  </div>
</div>`,
  styles: [':host ::ng-deep hse-field.wide { grid-column: 1 / -1; } :host ::ng-deep hse-field { display: contents; }'],
})
export class HseActionDialogComponent implements OnInit {
  @Input() act: any;
  @Input() path = '';
  @Output() closed = new EventEmitter<void>();
  @Output() done = new EventEmitter<any>();
  v: any = {};
  files: Record<string, File[]> = {};
  err = '';
  busy = false;

  constructor(private api: HseApiService) {}

  ngOnInit(): void {
    for (const f of this.act.fields) this.v[f.name] = f.type === 'bool' ? (f.name === 'formal_required') : f.type === 'date' && f.required ? today() : f.type.startsWith('fk') ? null : '';
  }

  async run(): Promise<void> {
    this.err = '';
    const miss = this.act.fields.filter((f: any) => f.required && f.type !== 'bool' && (f.type === 'file' ? !(this.files[f.name] || []).length : (this.v[f.name] === '' || this.v[f.name] === null)));
    if (miss.length) { this.err = miss.map((f: any) => f.label).join(', ') + ' required.'; return; }
    this.busy = true;
    try {
      const fileKeys = Object.keys(this.files).filter(k => this.files[k]?.length);
      let body: any = this.v;
      if (fileKeys.length) {
        const fd = HseApiService.form(this.v);
        fileKeys.forEach(k => this.files[k].forEach(x => fd.append(k, x, x.name)));
        body = fd;
      }
      const r = await this.api.post(this.path, body);
      this.done.emit(r);
    } catch (e) { this.err = HseApiService.error(e); }
    this.busy = false;
  }
}

/** Any blueprint register (change management, audits, health, environment, chemicals, claims, compliance, documents…):
 *  list with filters and export, record page with fields, workflow actions, approval steps, linked records, files and history. */
@Component({
  selector: 'app-hse-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HseFormComponent, HseActionDialogComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <p class="hs-note err" *ngIf="msg" style="margin:16px">{{ msg }}</p>
    <!-- list -->
    <ng-container *ngIf="reg && !id">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title">{{ reg.plural }}</h1><p class="ex-desc">{{ reg.help || intro[reg.kind] || '' }}</p></div>
          <div class="ex-actions">
            <button type="button" class="ex-btn" (click)="export()" [disabled]="!rows.length">Export CSV</button>
            <button type="button" class="ex-btn primary" *ngIf="reg.can_create" (click)="creating = true">+ New {{ reg.label.toLowerCase() }}</button>
          </div>
        </div>
        <div class="hs-filters">
          <input type="search" [(ngModel)]="q" (ngModelChange)="soon()" placeholder="Search…" aria-label="Search">
          <ng-container *ngFor="let f of reg.filters">
            <select *ngIf="f.type === 'choice'" [(ngModel)]="flt[f.name]" (ngModelChange)="load()" [attr.aria-label]="f.label">
              <option value="">{{ f.label }}: all</option><option *ngFor="let c of f.choices" [value]="c.value">{{ c.label }}</option></select>
            <select *ngIf="f.type === 'bool'" [(ngModel)]="flt[f.name]" (ngModelChange)="load()" [attr.aria-label]="f.label">
              <option value="">{{ f.label }}: all</option><option value="1">Yes</option><option value="0">No</option></select>
            <select *ngIf="f.type === 'fk'" [(ngModel)]="flt[f.name]" (ngModelChange)="load()" [attr.aria-label]="f.label">
              <option value="">{{ f.label }}: all</option><option *ngFor="let o of fopts[f.name] || []" [value]="o.id">{{ o.label }}</option></select>
          </ng-container>
          <label class="ck" *ngIf="hasStatus"><input type="checkbox" [(ngModel)]="openOnly" (ngModelChange)="load()"> Open only</label>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="ex-muted" *ngIf="loading">Loading…</p>
        <div class="hs-scroll" *ngIf="!loading">
          <ng-container *ngFor="let k of [reg.kind]">
          <table class="hs-table zl-hse">
            <tr><th *ngFor="let c of reg.cols">{{ c.label }}</th></tr>
            <tr class="click" *ngFor="let r of rows" (click)="open(r.id)">
              <td *ngFor="let c of reg.cols; let i = index">
                <ng-container [ngSwitch]="c.name">
                  <span *ngSwitchCase="'status'" class="hs-b" [ngClass]="cls(r.status)">{{ r.status_label }}</span>
                  <span *ngSwitchDefault [class.hs-code]="i === 0 && (c.name === 'number' || c.name === 'code' || c.name === 'ref')">{{ show(r, c) }}</span>
                </ng-container>
              </td>
            </tr>
          </table>
          </ng-container>
          <p class="hs-empty" *ngIf="!rows.length">Nothing here yet.</p>
          <div class="hs-acts" style="margin-top:10px" *ngIf="count > rows.length"><button type="button" class="ex-btn" (click)="more()">Show more ({{ rows.length }} of {{ count }})</button></div>
        </div>
      </div>
    </ng-container>

    <!-- record -->
    <ng-container *ngIf="reg && id && d">
      <div class="header_section">
        <div class="ex-head">
          <div>
            <h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button>
              {{ reg.label }} <span class="hs-code">{{ d._title }}</span>
              <span class="hs-b" *ngIf="d.status_label" [ngClass]="cls(d.status)" style="margin-left:6px">{{ d.status_label }}</span></h1>
            <p class="ex-desc">{{ d._subtitle }}</p>
          </div>
          <div class="ex-actions">
            <button type="button" class="ex-btn" (click)="pdf()">PDF</button>
            <button type="button" class="ex-btn" *ngIf="d.can_edit" (click)="editing = true">Edit</button>
            <button type="button" *ngFor="let a of d.actions" class="ex-btn" [class.primary]="a.style === 'primary'" [class.danger]="a.style === 'danger'" (click)="act(a)">{{ a.label }}</button>
          </div>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
        <div class="hs-steps" *ngIf="d.steps?.length">
          <div class="s" *ngFor="let s of d.steps" [class.done]="s.status === 'approved'" [class.bad]="s.status === 'rejected'" [class.now]="s === current()">
            {{ s.label }}<div *ngIf="s.by" style="font-weight:400">{{ s.by }} · {{ w(s.at) }}</div></div>
        </div>
        <div class="hs-split">
          <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
            <div class="hs-card">
              <h3>Details</h3>
              <p class="hs-note info" *ngIf="d.restricted_hidden">Some details are restricted and hidden for you.</p>
              <dl class="hs-kv">
                <ng-container *ngFor="let f of viewFields()">
                  <dt>{{ f.label }}</dt><dd style="white-space:pre-wrap">{{ show(d, f) || '–' }}</dd>
                </ng-container>
              </dl>
            </div>

            <!-- MOC impact assessment -->
            <div class="hs-card" *ngIf="d.impact_areas">
              <h3>Impact assessment</h3>
              <div class="hs-impact">
                <ng-container *ngFor="let a of d.impact_areas">
                  <b style="text-transform:capitalize">{{ a }}</b>
                  <div class="hs-seg"><button type="button" *ngFor="let l of ['none','low','medium','high']" [class.on]="imp(a).level === l"
                    [class.y]="l === 'none' || l === 'low'" [class.o]="l === 'medium'" [class.n]="l === 'high'" [disabled]="!d.can_edit" (click)="imp(a).level = l; dirty = true">{{ l }}</button></div>
                  <input [(ngModel)]="imp(a).note" (ngModelChange)="dirty = true" [disabled]="!d.can_edit" placeholder="Note">
                </ng-container>
              </div>
              <h3 style="margin-top:14px">Pre-start verification</h3>
              <label *ngFor="let p of d.prestart" class="ck" style="display:flex;gap:8px;font-size:13px;margin:4px 0">
                <input type="checkbox" [checked]="d.prestart_checks?.[p[0]]" [disabled]="!d.can_edit" (change)="chk(p[0], $any($event.target).checked)"> {{ p[1] }}</label>
              <div class="hs-acts" style="margin-top:8px" *ngIf="dirty"><button type="button" class="ex-btn primary sm" (click)="saveJson()">Save assessment</button></div>
            </div>

            <!-- audit checklist -->
            <div class="hs-card" *ngIf="d.checklist?.length">
              <h3>Checklist{{ d.score !== null && d.score !== undefined ? ' · score ' + (d.score | number:'1.0-0') + ' %' : '' }}</h3>
              <div class="hs-q" *ngFor="let q of d.checklist">
                <div><div class="sec">{{ q.section }}</div><span class="crit" *ngIf="q.critical" title="Critical">★</span>{{ q.text }}</div>
                <div class="hs-seg">
                  <button type="button" *ngFor="let o of auditOpts" [class.on]="ans(q.key).value === o.v" [ngClass]="o.c" [disabled]="d.status !== 'in_progress'" (click)="ans(q.key).value = o.v; dirty = true">{{ o.l }}</button>
                </div>
                <input class="note" *ngIf="d.status === 'in_progress' || ans(q.key).note" [(ngModel)]="ans(q.key).note" (ngModelChange)="dirty = true" [disabled]="d.status !== 'in_progress'" placeholder="Evidence / note">
              </div>
              <div class="hs-acts" style="margin-top:8px" *ngIf="dirty && d.status === 'in_progress'"><button type="button" class="ex-btn primary sm" (click)="saveJson()">Save answers</button></div>
            </div>

            <!-- management review inputs -->
            <div class="hs-card" *ngIf="d.inputs?.kpis">
              <h3>Review inputs</h3>
              <div class="hs-kv3" style="margin-bottom:10px">
                <div><small>Incidents</small><b>{{ d.inputs.incidents }}</b></div><div><small>Open actions</small><b>{{ d.inputs.open_actions }}</b></div>
                <div><small>Overdue actions</small><b>{{ d.inputs.overdue_actions }}</b></div><div><small>Audits done</small><b>{{ d.inputs.audits_closed }}</b></div>
                <div><small>Compliance gaps</small><b>{{ d.inputs.noncompliant_obligations }}</b></div>
              </div>
              <table class="hs-table" zPlain><tr><th>KPI</th><th class="r">Latest</th><th class="r">Target</th><th class="r">Months off target</th></tr>
                <tr *ngFor="let k of d.inputs.kpis"><td>{{ k.code }} {{ k.name }}</td><td class="r">{{ k.latest ?? '–' }} {{ k.unit }}</td><td class="r">{{ k.target ?? '–' }}</td><td class="r">{{ k.deviations }}</td></tr></table>
            </div>

            <!-- children -->
            <div class="hs-card" *ngFor="let c of d.children">
              <h3>{{ c.label }} <button type="button" class="hs-rlink" *ngIf="c.can_add" (click)="addChild(c)">+ Add</button></h3>
              <div class="hs-scroll"><table class="hs-table" zPlain>
                <tr><th *ngFor="let col of c.cols">{{ col.label }}</th><th *ngIf="childReg(c.kind)?.manages"></th></tr>
                <tr *ngFor="let r of c.rows">
                  <td *ngFor="let col of c.cols"><span *ngIf="col.name !== 'status'">{{ show(r, col) }}</span>
                    <span *ngIf="col.name === 'status'" class="hs-b" [ngClass]="cls(r.status)">{{ r.status_label }}</span></td>
                  <td *ngIf="childReg(c.kind)?.manages"><button type="button" class="ex-btn sm" (click)="openChild(c, r)">Open</button></td>
                </tr></table></div>
              <p class="hs-empty" *ngIf="!c.rows.length">None yet.</p>
            </div>

            <!-- actions raised -->
            <div class="hs-card" *ngIf="d.actions_list">
              <h3>Corrective actions</h3>
              <table class="hs-table" zPlain *ngIf="d.actions_list.length"><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr>
                <tr class="click" *ngFor="let a of d.actions_list" (click)="go(['actions'], { open: a.id })"><td><span class="hs-code">{{ a.number }}</span> {{ a.title }}</td>
                  <td>{{ a.owner?.name }}</td><td [style.color]="a.overdue ? '#b42318' : null">{{ dd(a.due_date) }}</td><td><span class="hs-b" [ngClass]="cls(a.status)">{{ a.status_label }}</span></td></tr></table>
              <p class="hs-empty" *ngIf="!d.actions_list.length">No actions raised.</p>
            </div>
          </div>

          <div class="hs-side">
            <div class="hs-card" *ngIf="d.outstanding !== undefined"><h3>Financials</h3><div class="hs-big">{{ d.outstanding | number:'1.2-2' }}</div><div class="hs-muted">outstanding (approved − paid)</div></div>
            <div class="hs-card" *ngIf="d.incompatible?.length"><h3>Storage warning</h3><p class="hs-note err" style="margin:0">Incompatible with: {{ d.incompatible.join(', ') }}</p></div>
            <div class="hs-card" *ngIf="d.revisions?.length > 1"><h3>Revisions</h3>
              <div class="hs-ev" *ngFor="let r of d.revisions"><div class="t"><a href="javascript:void(0)" (click)="open(r.id)">Rev {{ r.revision }}</a></div><div class="m">{{ r.status }}</div></div></div>
            <div class="hs-card" *ngIf="d.acks !== undefined"><h3>Acknowledgements</h3><div class="hs-big">{{ d.acks }}</div><div class="hs-muted">{{ d.acked ? 'You have acknowledged it.' : '' }}</div></div>
            <div class="hs-card" *ngIf="reg.files">
              <h3>Files</h3>
              <div class="hs-files"><button type="button" class="hs-file" *ngFor="let f of d.files" (click)="api.download(f.id, f.name)" [title]="f.note || ''">📎 {{ f.name }}</button></div>
              <p class="hs-empty" *ngIf="!d.files?.length">No files.</p>
              <label class="ex-btn sm" style="margin-top:6px;cursor:pointer">Attach…<input type="file" multiple hidden (change)="attach($any($event.target).files)"></label>
            </div>
            <div class="hs-card"><h3>History</h3>
              <div class="hs-ev" *ngFor="let h of d.history"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div></div>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</div>
<hse-form *ngIf="creating && reg" [reg]="reg" (closed)="creating = false" (saved)="created($event)"></hse-form>
<hse-form *ngIf="editing && reg" [reg]="reg" [id]="id" [values]="d" (closed)="editing = false" (saved)="d = $event; editing = false"></hse-form>
<hse-form *ngIf="child" [reg]="child.reg" [id]="child.id" [values]="child.values" [preset]="child.preset" (closed)="child = null" (saved)="child = null; reload()"></hse-form>
<hse-action-dialog *ngIf="action" [act]="action" [path]="action._path || ('r/' + reg.kind + '/' + id + '/do/' + action.name + '/')" (closed)="action = null" (done)="acted($event)"></hse-action-dialog>`,
})
export class HseRegisterComponent implements OnInit, OnDestroy {
  regs: any[] = [];
  reg: any = null;
  kind = '';
  id: number | null = null;
  rows: any[] = [];
  count = 0;
  q = '';
  flt: Record<string, string> = {};
  fopts: Record<string, any[]> = {};
  openOnly = false;
  loading = true;
  d: any = null;
  msg = '';
  ok = '';
  creating = false;
  editing = false;
  dirty = false;
  action: any = null;
  child: any = null;
  w = when;
  dd = day;
  cls = stClass;
  auditOpts = [{ v: 'compliant', l: 'Compliant', c: 'y' }, { v: 'noncompliant', l: 'Not compliant', c: 'n' }, { v: 'observation', l: 'Observation', c: 'o' }, { v: 'na', l: 'N/A', c: 'na' }];
  intro: Record<string, string> = {
    moc: 'Control changes to equipment, processes, chemicals, layouts, software or people before they create new hazards.',
    audits: 'Plan and run audits with approved checklists; findings become corrective actions automatically.',
    quality: 'Quality nonconformities from issue to verified closure – containment, disposition, root cause, actions.',
    kpis: 'HSE objectives and KPIs, calculated each month from the records.',
    reviews: 'Management reviews with the KPI snapshot, decisions and follow-up actions.',
    waste: 'Waste generation, storage, transfer and disposal evidence.',
    documents: 'Controlled HSE documents: draft → review → approval → published → revision.',
    competencies: 'Training and competency records of employees; expired records block permits where configured.',
  };
  private sub?: Subscription;
  private timer: any;

  constructor(public api: HseApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async pm => {
      this.kind = pm.get('kind') || '';
      this.id = pm.get('id') ? Number(pm.get('id')) : null;
      this.msg = ''; this.ok = ''; this.d = null; this.dirty = false;
      try {
        this.regs = await this.api.registers();
        this.reg = this.regs.find(r => r.kind === this.kind) || null;
        if (!this.reg) { this.msg = 'You have no access to this register.'; return; }
        if (this.id) await this.reload();
        else {
          if (this.route.snapshot.queryParamMap.get('new')) this.creating = true;
          this.flt = {};
          for (const f of this.reg.filters) if (f.type === 'fk' && f.options) this.fopts[f.name] = await this.api.options(f.options).catch(() => []);
          await this.load();
        }
      } catch (e) { this.msg = HseApiService.error(e); }
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  get hasStatus(): boolean { return this.reg?.cols.some((c: any) => c.name === 'status'); }

  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }

  async load(more = false): Promise<void> {
    this.loading = !more;
    try {
      const r = await this.api.get(`r/${this.kind}/`, { q: this.q, ...this.flt, open: this.openOnly ? 1 : '', offset: more ? this.rows.length : 0, limit: 1000 });
      this.rows = more ? this.rows.concat(r.results) : r.results;
      this.count = r.count;
    } catch (e) { this.msg = HseApiService.error(e); }
    this.loading = false;
  }

  more(): void { this.load(true); }

  async reload(): Promise<void> {
    try { this.d = await this.api.get(`r/${this.kind}/${this.id}/`); this.dirty = false; } catch (e) { this.msg = HseApiService.error(e); }
  }

  show(r: any, c: any): string {
    const v = r[c.name + '_label'] !== undefined ? r[c.name + '_label'] : r[c.name];
    if (v === null || v === undefined || v === '') return '';
    if (c.type === 'bool' || c.type === 'bool3') return v === true ? 'Yes' : v === false ? 'No' : '';
    if (c.type === 'date') return day(v);
    if (c.type === 'datetime') return when(v);
    if (c.type === 'decimal') return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
    return String(v);
  }

  viewFields(): any[] {
    const seen = new Set<string>();
    return [...this.reg.cols, ...this.reg.form].filter((f: any) => f.type !== 'json' && f.name !== 'status' && !seen.has(f.name) && seen.add(f.name));
  }

  current(): any { return (this.d?.steps || []).find((s: any) => s.status === 'pending'); }
  open(id: number): void { this.router.navigate([HSE_BASE, 'r', this.kind, id]); }
  back(): void { this.router.navigate([HSE_BASE, 'r', this.kind]); }
  go(path: string[], q: any = {}): void { this.router.navigate([HSE_BASE, ...path], { queryParams: q }); }
  created(r: any): void { this.creating = false; this.open(r.id); }
  act(a: any): void { this.ok = ''; this.msg = ''; this.action = a; }

  acted(r: any): void {
    const label = this.action?.label;
    const child = !!this.action?._path;
    this.action = null;
    if (child) { this.ok = `${label}: done.`; this.reload(); return; }
    if (r?.created && r.created.kind === this.kind && r.created.id !== this.id) { this.open(r.created.id); return; }
    this.d = r;
    this.ok = `${label}: done.` + (r?.created?.number ? ` ${r.created.number} created.` : '');
  }

  imp(a: string): any {
    this.d.impacts = this.d.impacts || {};
    this.d.impacts[a] = this.d.impacts[a] || { level: '', note: '' };
    return this.d.impacts[a];
  }

  chk(k: string, v: boolean): void { this.d.prestart_checks = { ...(this.d.prestart_checks || {}), [k]: v }; this.dirty = true; }

  ans(k: string): any {
    this.d.answers = this.d.answers || {};
    this.d.answers[k] = this.d.answers[k] || { value: '', note: '' };
    return this.d.answers[k];
  }

  async saveJson(): Promise<void> {
    const body: any = {};
    for (const f of this.reg.form) if (f.type === 'json' && this.d[f.name] !== undefined) body[f.name] = this.d[f.name];
    try { this.d = await this.api.patch(`r/${this.kind}/${this.id}/`, body); this.ok = 'Saved.'; this.dirty = false; }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  childReg(kind: string): any { return this.regs.find(r => r.kind === kind); }

  addChild(c: any): void {
    const reg = this.childReg(c.kind);
    if (reg) this.child = { reg, id: null, values: {}, preset: { [c.fk]: this.id } };
  }

  async openChild(c: any, row: any): Promise<void> {
    const reg = this.childReg(c.kind);
    if (!reg) return;
    try {
      const det = await this.api.get(`r/${c.kind}/${row.id}/`);
      if (det.actions?.length) {   // a child with a workflow action (e.g. audit finding → raise action)
        const a = det.actions[0];
        this.action = { ...a, _path: `r/${c.kind}/${row.id}/do/${a.name}/` };
        return;
      }
      if (det.can_edit) this.child = { reg, id: row.id, values: det, preset: { [c.fk]: this.id } };
      else this.ok = 'This record can no longer be changed.';
    } catch (e) { this.msg = HseApiService.error(e); }
  }

  async attach(fl: FileList | null): Promise<void> {
    if (!fl?.length) return;
    try { this.d = await this.api.post(`r/${this.kind}/${this.id}/files/`, HseApiService.form({}, Array.from(fl))); this.ok = 'File attached.'; }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  pdf(): void { this.api.file(`r/${this.kind}/${this.id}/pdf/`, `${this.d._title}.pdf`).catch(e => this.msg = HseApiService.error(e)); }

  export(): void {
    const cols = this.reg.cols.map((c: any) => ({ key: c.name, label: c.label }));
    csv(`${this.kind}.csv`, cols, this.rows.map(r => Object.fromEntries(this.reg.cols.map((c: any) => [c.name, this.show(r, c)]))));
  }
}
