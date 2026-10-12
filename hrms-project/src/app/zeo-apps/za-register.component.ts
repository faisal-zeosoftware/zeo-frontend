import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0
import { ZaApiService, ZaClient, appOf, base, day, money, stClass, today, when } from './za-api.service';

/** One input of a kit form or action: text, number, date, choice, record picker (own app or a linked app), several records, yes/no,
 *  JSON lists (lines or a small table), a checklist to tick, inspection results. v1.18.0 */
@Component({
  selector: 'za-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<ng-container [ngSwitch]="kind">
  <label *ngSwitchCase="'bool'" class="ck"><input type="checkbox" [ngModel]="!!value" (ngModelChange)="set($event)"> {{ f.label }}</label>
  <label *ngSwitchCase="'bool3'">{{ f.label }}
    <select [ngModel]="value === true ? 'y' : value === false ? 'n' : ''" (ngModelChange)="set($event === 'y' ? true : $event === 'n' ? false : null)">
      <option value="">–</option><option value="y">Yes</option><option value="n">No</option></select></label>
  <label *ngSwitchCase="'textarea'" class="wide">{{ f.label }}{{ f.required ? ' *' : '' }}<textarea [ngModel]="value" (ngModelChange)="set($event)" rows="3"></textarea></label>
  <label *ngSwitchCase="'choice'">{{ f.label }}{{ f.required ? ' *' : '' }}
    <select [ngModel]="value" (ngModelChange)="set($event)"><option [ngValue]="''">–</option>
      <option *ngFor="let c of choices" [ngValue]="c.value">{{ c.label }}</option></select></label>
  <label *ngSwitchCase="'fk'">{{ f.label }}{{ f.required ? ' *' : '' }}<span class="za-link" *ngIf="f.link" style="margin-left:6px">{{ linkName }}</span>
    <input *ngIf="opts.length > 15" type="search" [(ngModel)]="filter" placeholder="Search…" style="margin-bottom:4px">
    <select [ngModel]="value" (ngModelChange)="set($event)"><option [ngValue]="null">–</option>
      <option *ngFor="let o of filtered()" [ngValue]="o.id">{{ o.label }}</option></select></label>
  <div *ngSwitchCase="'m2m'" class="wide" style="display:flex;flex-direction:column;gap:4px">
    <span style="font-size:12px;font-weight:600;color:#6b7185">{{ f.label }}</span>
    <input type="search" [(ngModel)]="filter" placeholder="Filter…" style="height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;font:inherit;font-size:12.5px">
    <div class="hs-multi"><label *ngFor="let o of filtered()"><input type="checkbox" [checked]="has(o.id)" (change)="toggle(o.id)"> {{ o.label }}</label></div>
  </div>
  <label *ngSwitchCase="'lines'" class="wide">{{ f.label }} <span class="hs-muted">(one per line)</span>
    <textarea [ngModel]="(value || []).join('\\n')" (ngModelChange)="set(lines($event))" rows="5"></textarea></label>
  <div *ngSwitchCase="'plan'" class="wide">
    <span style="font-size:12px;font-weight:600;color:#6b7185">{{ f.label }}</span>
    <table class="hs-table" zPlain><tr><th>Instalment</th><th class="r">%</th><th class="r">or amount</th><th>Due</th><th></th></tr>
      <tr *ngFor="let p of value || []; let i = index">
        <td><input [(ngModel)]="p.label" (ngModelChange)="set(value)"></td><td><input type="number" [(ngModel)]="p.percent" (ngModelChange)="set(value)" style="width:70px"></td>
        <td><input type="number" [(ngModel)]="p.amount" (ngModelChange)="set(value)" style="width:110px"></td><td><input type="date" [(ngModel)]="p.due" (ngModelChange)="set(value)"></td>
        <td><button type="button" class="ex-btn sm" (click)="value.splice(i, 1); set(value)">×</button></td></tr></table>
    <button type="button" class="hs-rlink" (click)="set((value || []).concat([{ label: '', percent: null, amount: null, due: '' }]))">+ Add instalment</button>
  </div>
  <div *ngSwitchCase="'checklist'" class="wide">
    <span style="font-size:12px;font-weight:600;color:#6b7185">{{ f.label }}</span>
    <label class="za-check" *ngFor="let c of ctx?.checklist || []; let i = index"><input type="checkbox" [checked]="has(i)" (change)="toggle(i)"> {{ c.item }}</label>
  </div>
  <div *ngSwitchCase="'results'" class="wide">
    <div class="za-res"><b>Item</b><b>OK?</b><b>Note</b><b>Cost</b>
      <ng-container *ngFor="let r of value || []">
        <span>{{ r.item }}</span>
        <span class="hs-seg"><button type="button" [class.on]="r.ok === true" class="y" (click)="r.ok = true; set(value)">OK</button><button type="button" [class.on]="r.ok === false" class="n" (click)="r.ok = false; set(value)">Not OK</button></span>
        <input [(ngModel)]="r.note" (ngModelChange)="set(value)" placeholder="Note"><input type="number" [(ngModel)]="r.cost" (ngModelChange)="set(value)" placeholder="0">
      </ng-container></div>
  </div>
  <label *ngSwitchDefault>{{ f.label }}{{ f.required ? ' *' : '' }}
    <input [type]="htmlType" [ngModel]="value" (ngModelChange)="set($event)" [step]="kind === 'decimal' ? 'any' : null" [readonly]="f.readonly"></label>
</ng-container>`,
})
export class ZaFieldComponent implements OnChanges {
  @Input() f: any;
  @Input() value: any;
  @Input() api!: ZaClient;
  @Input() ctx: any = null;       // the record (for checklists, results and options of this record)
  @Input() kindOf = '';
  @Output() valueChange = new EventEmitter<any>();
  opts: any[] = [];
  choices: any[] = [];
  filter = '';
  kind = 'text';

  get linkName(): string { return ({ ZeoProperty: 'Property', ZeoCRM: 'CRM', ZeoMaintenance: 'Maintenance' } as any)[this.f.link] || ''; }

  async ngOnChanges(): Promise<void> {
    const t: string = this.f?.type || 'text';
    let opt = '';
    if (t.startsWith('choice:')) {
      this.kind = 'choice';
      this.choices = t.slice(7).split('|').map(x => { const [v, l] = x.split('='); return { value: v, label: l || v }; });
      return;
    }
    if (t.startsWith('opt:')) { this.kind = 'fk'; opt = t.slice(4); }
    else if (t.startsWith('opt-multi:')) { this.kind = 'm2m'; opt = t.slice(10); }
    else if (t === 'json') this.kind = this.f.name === 'plan' ? 'plan' : 'lines';
    else { this.kind = t; this.choices = this.f?.choices || []; if (t === 'fk' || t === 'm2m') opt = this.f.options; }
    if (this.kind === 'results' && !this.value && this.ctx?.results) this.set(JSON.parse(JSON.stringify(this.ctx.results)));
    if (this.kind === 'checklist' && !Array.isArray(this.value)) this.set((this.ctx?.checklist || []).map((c: any, i: number) => c.done ? i : -1).filter((i: number) => i >= 0));
    if (opt) {
      const parent = this.ctx && this.kindOf ? `${this.kindOf}:${this.ctx.id}` : '';
      this.opts = await (parent && t.startsWith('opt') ? this.api.get(`options/${opt}/`, { parent }) : this.api.options(opt)).catch(() => []);
    }
  }

  get htmlType(): string { return ({ int: 'number', decimal: 'number', date: 'date', datetime: 'datetime-local' } as any)[this.kind] || 'text'; }
  set(v: any): void { this.value = v; this.valueChange.emit(v); }
  has(id: number): boolean { return (this.value || []).includes(id); }
  toggle(id: number): void { const v = [...(this.value || [])]; const i = v.indexOf(id); i >= 0 ? v.splice(i, 1) : v.push(id); this.set(v); }
  filtered(): any[] { const q = this.filter.toLowerCase(); return q ? this.opts.filter(o => o.label.toLowerCase().includes(q) || o.id === this.value) : this.opts; }
  lines(t: string): string[] { return t.split('\n').map(x => x.trim()).filter(x => x); }
}

/** Create / change form of a register. */
@Component({
  selector: 'za-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ZaFieldComponent],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(840px,100%)">
    <header><h2>{{ (id ? 'Change ' : 'New ') + label.toLowerCase() }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note info" *ngIf="reg.help && !id">{{ reg.help }}</p>
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="hs-acts" *ngIf="dup"><button type="button" class="ex-btn sm" (click)="force = true; save()">Save anyway</button>
        <button type="button" class="ex-btn sm" (click)="openDup.emit(dup)">Open {{ dup.number }}</button></div>
      <div class="ex-form">
        <ng-container *ngFor="let f of fields">
          <za-field [f]="f" [api]="api" [(value)]="v[f.name]" [class.wide]="['textarea','m2m','json'].includes(f.type)"></za-field>
        </ng-container>
        <label class="wide" *ngIf="!id && reg.files">Attachments<input type="file" multiple (change)="files = toList($any($event.target).files)"></label>
      </div>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Saving…' : (id ? 'Save' : 'Create') }}</button>
    </footer>
  </div>
</div>`,
  styles: [':host ::ng-deep za-field.wide { grid-column: 1 / -1; } :host ::ng-deep za-field { display: contents; }'],
})
export class ZaFormComponent implements OnInit {
  @Input() reg: any;
  @Input() api!: ZaClient;
  @Input() id: number | null = null;
  @Input() values: any = {};
  @Input() preset: any = {};
  @Input() label = '';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  @Output() openDup = new EventEmitter<any>();
  v: any = {};
  files: File[] = [];
  err = '';
  busy = false;
  dup: any = null;
  force = false;

  get fields(): any[] { return (this.reg?.form || []).filter((f: any) => !(f.name in this.preset) && !(f.restricted && this.values?.restricted_hidden) && !f.readonly); }

  ngOnInit(): void {
    this.label = this.label || this.reg.label;
    for (const f of this.reg.form) {
      let val = this.values?.[f.name];
      if (val === undefined) val = f.type === 'bool' ? false : f.type === 'm2m' ? [] : f.type === 'json' ? [] : (f.type === 'fk' || f.type === 'bool3') ? null : '';
      if (val === null && ['choice', 'text', 'textarea'].includes(f.type)) val = '';
      if (f.type === 'date' && !val && !this.id && f.required) val = today();
      if (f.type === 'json') val = JSON.parse(JSON.stringify(val || []));
      this.v[f.name] = val;
    }
    if (this.id === null && 'is_active' in this.v && this.values?.is_active === undefined) this.v.is_active = true;
  }

  toList(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }

  async save(): Promise<void> {
    this.err = ''; this.dup = null;
    const miss = this.fields.filter(f => f.required && (this.v[f.name] === '' || this.v[f.name] === null || this.v[f.name] === undefined));
    if (miss.length) { this.err = miss.map(f => f.label).join(', ') + ' required.'; return; }
    this.busy = true;
    const body: any = { ...this.v, ...this.preset };
    if (this.force) body.force_duplicate = true;
    try {
      const r = this.id ? await this.api.patch(`r/${this.reg.kind}/${this.id}/`, body)
        : await this.api.post(`r/${this.reg.kind}/`, this.files.length ? ZaApiService.form(body, this.files) : body);
      this.saved.emit(r);
    } catch (e: any) { this.err = ZaApiService.error(e); this.dup = e?.error?.duplicate || null; }
    this.busy = false;
  }
}

/** Dialog of a workflow action. */
@Component({
  selector: 'za-action',
  standalone: true,
  imports: [CommonModule, FormsModule, ZaFieldComponent],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [style.width]="wide ? 'min(900px,100%)' : 'min(620px,100%)'">
    <header><h2>{{ act.label }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="hs-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <za-field *ngFor="let f of act.fields" [f]="f" [api]="api" [ctx]="rec" [kindOf]="kind" [(value)]="v[f.name]"
                  [class.wide]="['textarea','checklist','results'].includes(f.type)"></za-field>
      </div>
      <p class="hs-muted" *ngIf="!act.fields.length">Confirm: {{ act.label.toLowerCase() }}.</p>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn" [class.primary]="act.style !== 'danger'" [class.danger]="act.style === 'danger'" (click)="run()" [disabled]="busy">{{ busy ? 'Working…' : act.label }}</button>
    </footer>
  </div>
</div>`,
  styles: [':host ::ng-deep za-field.wide { grid-column: 1 / -1; } :host ::ng-deep za-field { display: contents; }'],
})
export class ZaActionComponent implements OnInit {
  @Input() act: any;
  @Input() api!: ZaClient;
  @Input() kind = '';
  @Input() rec: any;
  @Output() closed = new EventEmitter<void>();
  @Output() done = new EventEmitter<any>();
  v: any = {};
  err = '';
  busy = false;
  get wide(): boolean { return this.act.fields.some((f: any) => f.type === 'results'); }

  ngOnInit(): void {
    for (const f of this.act.fields) this.v[f.name] = f.type === 'bool' ? false : f.type === 'date' && f.required ? today() : (f.type.startsWith('opt:') ? null : f.type.startsWith('opt-multi') ? [] : undefined);
  }

  async run(): Promise<void> {
    this.err = '';
    const miss = this.act.fields.filter((f: any) => f.required && f.type !== 'bool' && (this.v[f.name] === '' || this.v[f.name] === null || this.v[f.name] === undefined));
    if (miss.length) { this.err = miss.map((f: any) => f.label).join(', ') + ' required.'; return; }
    if (this.act.confirm && !confirm(this.act.confirm)) return;
    this.busy = true;
    const body: any = {};
    Object.entries(this.v).forEach(([k, x]) => { if (x !== undefined) body[k] = x; });
    try { this.done.emit(await this.api.post(`r/${this.kind}/${this.rec.id}/do/${this.act.name}/`, body)); }
    catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false;
  }
}

const BOARDS: Record<string, string> = { opportunity: 'stage_label', work_order: 'status_label', unit: 'status_label', lease: 'status_label', reservation: 'status_label' };

/** Any register of a kit app: list (table or board) with filters and Excel export; record page with details, workflow actions,
 *  linked records in the other apps, children, files and history. Route: /main-sidebar/<app>/r/<kind>[/<id>]. */
@Component({
  selector: 'app-za-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ZaFormComponent, ZaActionComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <p class="hs-note err" *ngIf="msg" style="margin:16px">{{ msg }}</p>
    <ng-container *ngIf="reg && !id">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title">{{ term(reg.plural) }}</h1><p class="ex-desc">{{ reg.help }}</p></div>
          <div class="ex-actions">
            <span class="hs-tabs2" *ngIf="boardKey"><button type="button" [class.on]="!board" (click)="showBoard(false)">List</button><button type="button" [class.on]="board" (click)="showBoard(true)">Board</button></span>
            <button type="button" class="ex-btn primary" *ngIf="reg.can_create" (click)="creating = true">+ New {{ term(reg.label).toLowerCase() }}</button>
          </div>
        </div>
        <div class="hs-filters">
          <label class="ck" *ngIf="hasStatus"><input type="checkbox" [(ngModel)]="openOnly" (ngModelChange)="load()"> Open only</label>
          <span class="hs-b" *ngIf="span" style="cursor:pointer" (click)="span = null; load()" title="Show all">{{ span.from }} – {{ span.to }} ✕</span>
          <ng-container *ngFor="let f of reg.filters"><span class="hs-b" *ngIf="flt[f.name]" style="cursor:pointer" (click)="flt[f.name] = ''; load()" title="Remove">{{ f.label }}: {{ fltLabel(f) }} ✕</span></ng-container>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="ex-muted" *ngIf="loading">Loading…</p>
        <div class="za-kanban" *ngIf="!loading && board">
          <div class="za-col" *ngFor="let g of groups()"><h4>{{ g.key || '–' }} <span>{{ g.rows.length }}</span></h4>
            <div class="za-tile" *ngFor="let r of g.rows" (click)="open(r.id)"><b>{{ r._title }}</b><div class="m">{{ r._subtitle }}</div>
              <div class="m" *ngIf="r.value">{{ money(r.value) }}</div><div class="m" *ngIf="r.owner_label">{{ r.owner_label }}</div>
              <div class="m" *ngIf="r.technician_label">{{ r.technician_label }}</div></div></div>
        </div>
        <div class="hs-scroll" *ngIf="!loading && !board">
          <ng-container *ngFor="let k of [reg.kind]">
          <!-- v1.22.0: the HRMS list – search, filters (Branch…), group by, export, columns, views, saved views -->
          <table class="hs-table za-list">
            <thead><tr><th *ngFor="let c of reg.cols" [class.r]="c.type === 'decimal'">{{ c.label }}</th></tr></thead>
            <tbody>
            <tr class="click" *ngFor="let r of rows" (click)="open(r.id)">
              <td *ngFor="let c of reg.cols; let i = index" [class.r]="c.type === 'decimal'">
                <span *ngIf="c.name === 'status' || c.name === 'review_status'" class="hs-b" [ngClass]="cls(r[c.name])">{{ show(r, c) }}</span>
                <span *ngIf="c.name !== 'status' && c.name !== 'review_status'" [class.hs-code]="i === 0 && (c.name === 'number' || c.name === 'code')">{{ show(r, c) }}</span>
              </td>
            </tr>
            </tbody>
          </table>
          </ng-container>
          <p class="hs-empty" *ngIf="!rows.length">Nothing here yet.</p>
          <div class="hs-acts" style="margin-top:10px" *ngIf="count > rows.length"><button type="button" class="ex-btn" (click)="load(true)">Show more ({{ rows.length }} of {{ count }})</button></div>
        </div>
      </div>
    </ng-container>

    <ng-container *ngIf="reg && id && d">
      <div class="header_section">
        <div class="ex-head">
          <div>
            <h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button>
              {{ term(reg.label) }} <span class="hs-code">{{ d.number || d.code || '' }}</span> {{ d._title !== (d.number || d.code) ? d._title : '' }}
              <span class="hs-b" *ngIf="d.status_label" [ngClass]="cls(d.status)" style="margin-left:6px">{{ d.status_label }}</span></h1>
            <p class="ex-desc">{{ d._subtitle }}</p>
          </div>
          <div class="ex-actions">
            <button type="button" class="ex-btn" *ngIf="d.can_edit" (click)="editing = true">Edit</button>
            <button type="button" *ngFor="let a of d.actions" class="ex-btn" [class.primary]="a.style === 'primary'" [class.danger]="a.style === 'danger'" (click)="ok = ''; msg = ''; action = a">{{ a.label }}</button>
          </div>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
        <div class="hs-split">
          <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
            <div class="hs-card">
              <h3>Details</h3>
              <p class="hs-note info" *ngIf="d.restricted_hidden">Some details are restricted and hidden for you.</p>
              <dl class="hs-kv">
                <ng-container *ngFor="let f of viewFields()"><dt>{{ f.label }}</dt>
                  <dd style="white-space:pre-wrap">{{ show(d, f) || '–' }}</dd></ng-container>
              </dl>
            </div>
            <div class="hs-card" *ngIf="d.checklist?.length"><h3>Checklist · {{ doneCount(d.checklist) }}/{{ d.checklist.length }}</h3>
              <div class="za-check" *ngFor="let c of d.checklist"><span>{{ c.done ? '☑' : '☐' }}</span> {{ c.item }}</div></div>
            <div class="hs-card" *ngIf="d.results?.length"><h3>Inspection checklist</h3>
              <table class="hs-table" zPlain><tr><th>Item</th><th>Result</th><th>Note</th><th class="r">Cost</th></tr>
                <tr *ngFor="let r of d.results"><td>{{ r.item }}</td><td><span class="hs-b" [ngClass]="r.ok === true ? 'ok' : r.ok === false ? 'bad' : ''">{{ r.ok === true ? 'OK' : r.ok === false ? 'Not OK' : '–' }}</span></td>
                  <td>{{ r.note }}</td><td class="r">{{ r.cost ? money(r.cost) : '' }}</td></tr></table></div>
            <div class="hs-card" *ngIf="d.lines?.length"><h3>Statement lines</h3>
              <table class="hs-table" zPlain><tr><th>Date</th><th>Unit</th><th>Line</th><th class="r">Amount</th></tr>
                <tr *ngFor="let l of d.lines"><td>{{ dd(l.date) }}</td><td>{{ l.unit }}</td><td>{{ l.text }}</td><td class="r" [style.color]="l.amount < 0 ? '#b42318' : null">{{ money(l.amount) }}</td></tr></table></div>
            <div class="hs-card" *ngFor="let c of d.children">
              <h3>{{ term(c.label) }} <button type="button" class="hs-rlink" *ngIf="c.can_add" (click)="addChild(c)">+ Add</button></h3>
              <div class="hs-scroll"><table class="hs-table" zPlain>
                <tr><th *ngFor="let col of c.cols" [class.r]="col.type === 'decimal'">{{ col.label }}</th></tr>
                <tr class="click" *ngFor="let r of c.rows" (click)="goRec(c.kind, r.id)">
                  <td *ngFor="let col of c.cols" [class.r]="col.type === 'decimal'"><span [class.hs-b]="col.name === 'status'" [ngClass]="col.name === 'status' ? cls(r.status) : ''">{{ show(r, col) }}</span></td>
                </tr></table></div>
              <p class="hs-empty" *ngIf="!c.rows.length">None yet.</p>
            </div>
          </div>
          <div class="hs-side">
            <div class="hs-card" *ngIf="d.money"><h3>Money</h3>
              <div class="hs-kv3"><div><small>Billed</small><b>{{ money(d.money.billed) }}</b></div><div><small>Paid</small><b>{{ money(d.money.paid) }}</b></div>
                <div><small>Overdue</small><b [style.color]="d.money.overdue ? '#b42318' : null">{{ money(d.money.overdue) }}</b></div></div></div>
            <div class="hs-card" *ngIf="d.sla"><h3>Service level</h3>
              <dl class="hs-kv"><dt>Respond by</dt><dd [style.color]="d.sla.response_late ? '#b42318' : null">{{ w(d.sla.response_due) }}</dd>
                <dt>Fix by</dt><dd [style.color]="d.sla.resolve_late ? '#b42318' : null">{{ w(d.sla.resolve_due) }}</dd>
                <dt>Cost so far</dt><dd>{{ money(d.cost_total) }}</dd></dl></div>
            <div class="hs-card" *ngIf="d.tenant"><h3>Tenant (Property)</h3><b>{{ d.tenant.name }}</b><div class="hs-muted">{{ d.tenant.lease }} · {{ d.tenant.phone }} {{ d.tenant.email }}</div></div>
            <div class="hs-card" *ngIf="d.current"><h3>Current lease</h3><b>{{ d.current.tenant }}</b><div class="hs-muted">{{ d.current.lease }} · ends {{ dd(d.current.end) }} · rent {{ money(d.current.rent) }}</div></div>
            <div class="hs-card" *ngIf="d.work_orders?.length"><h3>Maintenance</h3>
              <div class="za-row" *ngFor="let w of d.work_orders"><span>{{ w.number }} {{ w.title }}</span><span class="bd">{{ w.status }}</span></div></div>
            <div class="hs-card" *ngIf="linkList().length"><h3>Linked in ZEO</h3>
              <div *ngFor="let l of linkList()" style="font-size:13px;margin:3px 0"><span class="hs-muted">{{ l.k }}:</span> {{ l.v }}</div></div>
            <div class="hs-card" *ngIf="d.versions?.length"><h3>Versions</h3>
              <div class="za-row" *ngFor="let v of d.versions" (click)="open(v.id)"><span>{{ v.number }}</span><span class="bd">{{ v.status }}</span></div></div>
            <div class="hs-card" *ngIf="reg.files">
              <h3>Files</h3>
              <div class="hs-files"><button type="button" class="hs-file" *ngFor="let f of d.files" (click)="api.download(f.id, f.name)">📎 {{ f.name }}{{ f.portal ? ' · portal' : '' }}</button></div>
              <p class="hs-empty" *ngIf="!d.files?.length">No files.</p>
              <label class="ex-btn sm" style="margin-top:6px;cursor:pointer">Attach…<input type="file" multiple hidden (change)="attach($any($event.target).files, false)"></label>
              <label class="ex-btn sm" style="margin:6px 0 0 6px;cursor:pointer" *ngIf="app === 'zeo-property'">Attach for the portal…<input type="file" multiple hidden (change)="attach($any($event.target).files, true)"></label>
            </div>
            <div class="hs-card"><h3>History</h3>
              <div class="hs-ev" *ngFor="let h of d.history"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div></div>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</div>
<za-form *ngIf="creating && reg" [reg]="reg" [api]="api" [label]="term(reg.label)" (closed)="creating = false" (saved)="created($event)" (openDup)="creating = false; open($event.id)"></za-form>
<za-form *ngIf="editing && reg" [reg]="reg" [api]="api" [id]="id" [values]="d" [label]="term(reg.label)" (closed)="editing = false" (saved)="d = $event; editing = false; ok = 'Saved.'"></za-form>
<za-form *ngIf="child" [reg]="child.reg" [api]="api" [preset]="child.preset" (closed)="child = null" (saved)="child = null; reload()"></za-form>
<za-action *ngIf="action" [act]="action" [api]="api" [kind]="kind" [rec]="d" (closed)="action = null" (done)="acted($event)"></za-action>`,
})
export class ZaRegisterComponent implements OnInit, OnDestroy {
  app = '';
  api!: ZaClient;
  info: any = null;
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
  board = false;
  d: any = null;
  msg = '';
  ok = '';
  creating = false;
  editing = false;
  action: any = null;
  child: any = null;
  w = when; dd = day; cls = stClass; money = money;
  private sub?: Subscription;
  private timer: any;

  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router) {}

  get boardKey(): string { return BOARDS[this.kind] || ''; }
  get hasStatus(): boolean { return this.reg?.cols.some((c: any) => c.name === 'status'); }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async pm => {
      this.app = appOf(this.router.url);
      this.api = this.za.for(this.app);
      this.kind = pm.get('kind') || '';
      this.id = pm.get('id') ? Number(pm.get('id')) : null;
      this.msg = ''; this.ok = ''; this.d = null; this.board = false;
      try {
        [this.info, this.regs] = await Promise.all([this.api.info(), this.api.registers()]);
        this.reg = this.regs.find(r => r.kind === this.kind) || null;
        if (!this.reg) { this.msg = 'You have no access to this list.'; return; }
        if (this.id) await this.reload();
        else {
          const qp = this.route.snapshot.queryParamMap;
          this.flt = {};
          for (const f of this.reg.filters) {
            this.flt[f.name] = qp.get(f.name) || '';
            if (f.type === 'fk' && f.options) this.fopts[f.name] = await this.api.options(f.options).catch(() => []);
          }
          this.openOnly = qp.get('open') === '1';
          // v1.22.0: a dashboard figure opens its records for the same period
          this.span = qp.get('date_field') ? { date_field: qp.get('date_field'), from: qp.get('from') || '', to: qp.get('to') || '' } : null;
          this.creating = !!qp.get('new');
          await this.load();
        }
      } catch (e) { this.msg = ZaApiService.error(e); }
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  term(label: string): string {
    const t = this.info?.terms || {};
    const k = (label || '').toLowerCase();
    return t[k] || label;
  }

  appName(label: string): string { return ({ ZeoProperty: 'Property', ZeoCRM: 'CRM', ZeoMaintenance: 'Maintenance' } as any)[label] || ''; }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }
  span: any = null;   // v1.22.0
  fltLabel(f: any): string {
    const v = this.flt[f.name];
    if (f.type === 'choice') return (f.choices || []).find((c: any) => c.value === v)?.label || v;
    if (f.type === 'fk') return (this.fopts[f.name] || []).find((o: any) => String(o.id) === String(v))?.label || v;
    return v === '1' ? 'Yes' : v === '0' ? 'No' : v;
  }

  async load(more = false): Promise<void> {
    this.loading = !more;
    try {
      const r = await this.api.get(`r/${this.kind}/`, { q: this.q, ...this.flt, ...(this.span || {}), open: this.openOnly ? 1 : '', offset: more ? this.rows.length : 0, limit: 1000 });
      this.rows = more ? this.rows.concat(r.results) : r.results;
      this.count = r.count;
    } catch (e) { this.msg = ZaApiService.error(e); }
    this.loading = false;
  }

  /** Board columns in their natural order (stages of the chosen pipeline, or the status list), empty ones included. */
  groups(): { key: string; rows: any[] }[] {
    const out: { key: string; rows: any[] }[] = this.columns().map(k => ({ key: k, rows: [] as any[] }));
    for (const r of this.rows) {
      const k = r[this.boardKey] || '';
      let g = out.find(x => x.key === k);
      if (!g) { g = { key: k, rows: [] }; out.push(g); }
      g.rows.push(r);
    }
    return out;
  }

  stageOpts: any[] = [];

  columns(): string[] {
    if (this.kind === 'opportunity') {
      const p = (this.fopts['pipeline'] || []).find(x => String(x.id) === String(this.flt['pipeline']));
      return p ? this.stageOpts.filter(s => s.label.startsWith(p.label + ' ›')).map(s => s.label) : [];
    }
    const st = (this.reg?.filters || []).find((f: any) => f.name === 'status');
    return st ? st.choices.map((c: any) => c.label).filter((l: string) => !this.openOnly || !['Closed', 'Cancelled', 'Lost', 'Ended', 'Expired'].includes(l)) : [];
  }

  async showBoard(on: boolean): Promise<void> {
    this.board = on;
    if (on && this.kind === 'opportunity') {
      this.stageOpts = await this.api.options('stages').catch(() => []);
      if (!this.flt['pipeline'] && this.fopts['pipeline']?.length) this.flt['pipeline'] = String(this.fopts['pipeline'][0].id);
    }
    await this.load();
  }

  async reload(): Promise<void> {
    try { this.d = await this.api.get(`r/${this.kind}/${this.id}/`); } catch (e) { this.msg = ZaApiService.error(e); }
  }

  show(r: any, c: any): string {
    const v = r[c.name + '_label'] !== undefined && r[c.name + '_label'] !== '' ? r[c.name + '_label'] : r[c.name];
    if (v === null || v === undefined || v === '') return '';
    if (c.name === 'review_status') return v === 'to_review' ? 'To review' : 'Reviewed';
    if (c.type === 'bool' || c.type === 'bool3') return v === true ? 'Yes' : v === false ? 'No' : '';
    if (c.type === 'date') return day(v);
    if (c.type === 'datetime') return when(v);
    if (c.type === 'decimal') return money(v);
    if (Array.isArray(v)) return v.map(x => typeof x === 'object' ? Object.values(x).join(' ') : x).join(', ');
    return String(v);
  }

  viewFields(): any[] {
    const seen = new Set<string>();
    return [...this.reg.cols, ...this.reg.form, ...(this.d?.info || [])]
      .filter((f: any) => f.type !== 'json' && f.name !== 'status' && f.name !== 'review_status' && !seen.has(f.name) && seen.add(f.name)
        && (f.required || this.show(this.d, f) !== ''));   // empty optional fields are left out of the record page
  }

  linkList(): { k: string; v: string }[] {
    const l = this.d?.links || {};
    const names: Record<string, string> = { unit: 'Unit', reservation: 'Reservation', renewal_lease: 'Lease to renew', inspection: 'Inspection',
      crm: 'CRM opportunity', bill: 'Billing record', first_contact_due: 'First contact due', first_contacted_at: 'First contact' };
    return Object.entries(l).filter(([k, v]) => v && k !== 'late').map(([k, v]) => ({ k: names[k] || k, v: /_(due|at)$/.test(k) ? when(v) : String(v) }));
  }

  doneCount(c: any[]): number { return c.filter(x => x.done).length; }
  open(id: number): void { this.router.navigate([base(this.app), 'r', this.kind, id]); }
  goRec(kind: string, id: number): void { this.router.navigate([base(this.app), 'r', kind, id]); }
  back(): void { this.router.navigate([base(this.app), 'r', this.kind]); }
  created(r: any): void { this.creating = false; this.open(r.id); }

  acted(r: any): void {
    const label = this.action?.label;
    this.action = null;
    if (r?.created && r.created.app === this.app && (r.created.kind !== this.kind || r.created.id !== this.id)) {
      this.router.navigate([base(this.app), 'r', r.created.kind, r.created.id]);
      return;
    }
    this.d = r;
    this.ok = r?.result?.message || `${label}: done.`;
    if (r?.result?.password) this.ok += ` Password: ${r.result.password} (also e-mailed).`;
  }

  addChild(c: any): void {
    const reg = this.regs.find(x => x.kind === c.kind);
    if (reg) this.child = { reg, preset: { [c.fk]: this.id } };
  }

  async attach(fl: FileList | null, portal: boolean): Promise<void> {
    if (!fl?.length) return;
    try { this.d = await this.api.post(`r/${this.kind}/${this.id}/files/`, ZaApiService.form({ portal }, Array.from(fl))); this.ok = 'File attached.'; }
    catch (e) { this.msg = ZaApiService.error(e); }
  }

  excel(): void {
    this.api.file(`r/${this.kind}/export/`, `${this.kind}.xlsx`, { q: this.q, ...this.flt, open: this.openOnly ? 1 : '' }).catch(e => this.msg = ZaApiService.error(e));
  }
}
