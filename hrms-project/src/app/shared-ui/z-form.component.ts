/**
 * v1.62.1 – one form shell for the create / edit pop-ups of the old screens (same design as the new "New employee" form):
 * sections, labels above the fields, only the fields the SERVER requires are marked (read from the API's OPTIONS
 * metadata), inline errors under each field, z-date-field dates (dd/mm/yyyy), "Save" and "Save and add another", a toast
 * instead of the old success pop-up, Arabic through the translator. Rights stay the screen's (it opens the form only when
 * the user may add / change) and the server's (it refuses).
 *
 *   const saved = await openZForm(DEPARTMENT_FORM, record?)   // record → edit (PATCH), none → create (POST)
 */
import { ApplicationRef, ChangeDetectorRef, Component, ComponentRef, EnvironmentInjector, OnInit, createComponent } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZDateFieldComponent } from './z-date-field.component';
import { i18nT } from './i18n-core';
import { zToast } from './z-toast';
import { environment } from '../../environments/environment';
import { EFFECTIVE_HINT, ZRuleKind, openRuleHistory, zEffectiveParam } from './z-rule-history';   // v1.67.12 (effective)

export interface ZFormOption { value: any; label: string; raw?: any; }
export interface ZFormField {
  key: string; label: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'select' | 'multi' | 'check' | 'password' | 'html' | 'file' | 'datetime';   // v1.62.10 (item 168): 'file' → sent as multipart; (item 172) 'datetime' = dd/mm/yyyy + time, value "YYYY-MM-DDTHH:MM"
  accept?: string;                     // v1.62.10 (item 168): file types of a 'file' field (e.g. ".pdf,.jpg,.png")
  required?: boolean;                  // forced; otherwise the server's metadata decides
  options?: ZFormOption[];             // fixed choices
  source?: { endpoint: string; value?: string; label: string | ((r: any) => string); filter?: (r: any) => boolean };
  hint?: string; full?: boolean; max?: number; createOnly?: boolean; editOnly?: boolean; placeholder?: string;
  showIf?: (v: any) => boolean;
  readonly?: boolean;                  // v1.67.6 (setup): shown, never sent (e.g. the branch currency = the company's)
  // v1.62.10 (item 166): `search` (declared below) also puts a search box above a long 'select' (employees)
  matchKey?: string;                  // v1.62.10 (item 166): an edited record's text value is matched to this field of the option's row (e.g. emp_code)
  search?: boolean;                    // v1.62.10 (items 166, 175): a search box above a long 'select' or 'multi' list (a 'multi' shows ticked first, up to 60)
  matchKeys?: string[];                // v1.62.10 (item 175): more raw fields an edited record may name its links by (e.g. code, username)
  optFilter?: (raw: any, v: any, opts: Record<string, ZFormOption[]>) => boolean;   // e.g. states of the chosen country
}
export interface ZFormSection { title: string; fields: ZFormField[]; }
export interface ZFormConfig {
  thing: string;                       // "department" → "New department" / "Edit department", toast "Department saved."
  endpoint: string;                    // list API, e.g. /organisation/api/Department/
  subtitle?: string;
  sections: ZFormSection[];
  fromRecord?: (r: any) => any;        // record → form values (edit)
  toBody?: (v: any, editing: boolean) => any;   // form values → request body
  idOf?: (r: any) => any;
  heading?: string; action?: string;   // v1.62.1: a one-off action form – its own title and button, no "Save and add another"
  okText?: (data: any, t: (s: string, a?: any[]) => string) => string | null;   // v1.62.1: the toast after a save, from the answer
  initial?: any;                       // v1.62.10 (item 170): values a NEW record starts with (e.g. the row an adjustment is for)
  failIf?: (data: any, t: (s: string, a?: any[]) => string) => string | null;   // v1.62.10 (item 170): a 200 answer that still says "not done" → shown at the top, form stays open
  validate?: (v: any, t: (s: string, a?: any[]) => string) => Record<string, string> | null;   // v1.62.10 (item 168): checks across fields (e.g. expiry after issue) → errors next to the fields
  // v1.67.9 (screens) item 18: record forms open as a full-height drawer from the inline-end side (full screen on a phone),
  // like the Permission groups editor; one-off action forms (`action` set) stay a small dialog unless drawer: true
  drawer?: boolean;
  // v1.67.12 (effective, item 64): a setup record with dated versions – an edit asks "Effective from" (empty = a correction) and offers
  // its history; a table kind (gratuity) asks it on a new row too
  effective?: ZRuleKind;
  effectiveId?: (r: any) => any;       // v1.67.12 (effective): the record whose history is shown (e.g. the policy of an overtime rule)
}

let APP: ApplicationRef | null = null;
let ENV: EnvironmentInjector | null = null;
/** APP_INITIALIZER: where the forms are attached */
export function setZFormHost(app: ApplicationRef, env: EnvironmentInjector): void { APP = app; ENV = env; }
/** v1.62.10 (item 167): the same host for the other shared windows (z-review.component.ts) */
export function zFormHost(): { app: ApplicationRef | null; env: EnvironmentInjector | null } { return { app: APP, env: ENV }; }

/** Open the form; resolves true when something was saved (the screen then reloads its list). */
export function openZForm(cfg: ZFormConfig, record?: any): Promise<boolean> {
  return new Promise(resolve => {
    if (!APP || !ENV) { resolve(false); return; }
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ref: ComponentRef<ZFormComponent> = createComponent(ZFormComponent, { environmentInjector: ENV, hostElement: host });
    ref.instance.cfg = cfg;
    ref.instance.record = record || null;
    ref.instance.done = (saved: boolean) => { APP!.detachView(ref.hostView); ref.destroy(); host.remove(); resolve(saved); };
    // v1.67.9 (screens) item 18: the drawer layout (record forms); the page behind does not scroll while it is open
    if (cfg.drawer ?? !cfg.action) { host.classList.add('zf-drawer'); host.setAttribute('data-zform-drawer', ''); }
    try { const l = localStorage.getItem('zeoLang') || ''; if (/^ar/.test(l) || document.documentElement.dir === 'rtl') { host.setAttribute('dir', 'rtl'); } } catch { /* storage off */ }
    APP.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  });
}

export function zTitle(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

@Component({
  selector: 'z-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ZDateFieldComponent],
  template: `
<div class="zf-veil" (click)="close()"></div>
<div class="zf-box" role="dialog" aria-modal="true" [attr.aria-label]="title" (keydown.escape)="close()" data-zform>
  <div class="zf-head">
    <div><h2 class="zf-title">{{ title }}</h2><p class="zf-sub" *ngIf="cfg.subtitle">{{ t(cfg.subtitle) }}</p></div>
    <button type="button" class="zf-x" (click)="close()" [attr.aria-label]="t('Close')">×</button>
  </div>
  <div class="zf-body" *ngIf="!loading; else wait">
    <p class="zf-err zf-top" *ngIf="err['_']" role="alert" data-zf-error>{{ err['_'] }}</p>
    <section class="zf-sec" *ngFor="let s of cfg.sections">
      <h3 *ngIf="s.title">{{ t(s.title) }}</h3>
      <div class="zf-grid">
        <ng-container *ngFor="let f of s.fields">
          <label class="zf-f" *ngIf="visible(f)" [class.full]="f.full || f.type === 'textarea' || f.type === 'html' || f.type === 'multi'" [class.check]="f.type === 'check'" [attr.data-zf-field]="f.key">
            <ng-container *ngIf="f.type !== 'check'">
              <span class="zf-l">{{ t(f.label) }} <span class="zf-req" *ngIf="req(f)" aria-hidden="true">*</span></span>
            </ng-container>
            <ng-container [ngSwitch]="f.type || 'text'">
              <textarea *ngSwitchCase="'textarea'" rows="3" [(ngModel)]="v[f.key]" [attr.maxlength]="f.max || null" [class.bad]="err[f.key]"></textarea>
              <textarea *ngSwitchCase="'html'" rows="8" class="zf-mono" [(ngModel)]="v[f.key]" [class.bad]="err[f.key]"></textarea>
              <input *ngSwitchCase="'number'" type="number" [(ngModel)]="v[f.key]" [class.bad]="err[f.key]">
              <input *ngSwitchCase="'email'" type="email" [(ngModel)]="v[f.key]" [attr.maxlength]="f.max || 254" [class.bad]="err[f.key]">
              <input *ngSwitchCase="'password'" type="password" [(ngModel)]="v[f.key]" autocomplete="new-password" [class.bad]="err[f.key]">
              <z-date-field *ngSwitchCase="'date'" [label]="t(f.label)" [(value)]="v[f.key]"></z-date-field>
              <span *ngSwitchCase="'datetime'" class="zf-dt"><!-- v1.62.10 (item 172) -->
                <z-date-field [label]="t(f.label)" [value]="dtPart(f.key, 0)" (valueChange)="dtSet(f.key, 0, $event)"></z-date-field>
                <input type="time" [value]="dtPart(f.key, 1)" (change)="dtSet(f.key, 1, $any($event.target).value)" [attr.aria-label]="t('Time')">
              </span>
              <input *ngIf="f.search && f.type === 'select'" type="search" class="zf-search" [(ngModel)]="q[f.key]" [placeholder]="t('Search')" autocomplete="off" data-zf-search><!-- v1.62.10 (item 166) -->
              <select *ngSwitchCase="'select'" [(ngModel)]="v[f.key]" [class.bad]="err[f.key]">
                <option [ngValue]="null">–</option>
                <option *ngFor="let o of optsFor(f)" [ngValue]="o.value">{{ o.label }}</option>
              </select>
              <span *ngSwitchCase="'multi'" class="zf-multi" [class.bad]="err[f.key]">
                <input *ngIf="f.search" type="search" class="zf-q" [placeholder]="t('Search')" [(ngModel)]="q[f.key]" autocomplete="off" data-zf-search><!-- v1.62.10 (item 175) -->
                <label *ngFor="let o of multiOpts(f)" class="zf-chip" [class.on]="has(f.key, o.value)">
                  <input type="checkbox" [checked]="has(f.key, o.value)" (change)="toggle(f.key, o.value)"> {{ o.label }}</label>
                <button type="button" class="zf-link" *ngIf="(opts[f.key] || []).length > 2" (click)="all(f.key)">{{ t(allOn(f.key) ? 'Clear (button)' : 'Select all') }}</button>
                <small class="zf-hint" *ngIf="f.search && hidden(f) > 0">{{ t('{0} more – type to search', [hidden(f)]) }}</small>
              </span>
              <span *ngSwitchCase="'check'" class="zf-ck"><input type="checkbox" [(ngModel)]="v[f.key]"> {{ t(f.label) }}</span>
              <span *ngSwitchCase="'file'" class="zf-file"><!-- v1.62.10 (item 168) -->
                <!-- v1.67.9 (screens): the browser's own "Choose File / No file chosen" is English whatever the language – own button -->
                <label class="zf-btn zf-pick"><input type="file" [attr.accept]="f.accept || null" (change)="pickFile(f.key, $event)" hidden [attr.data-zf-file]="f.key">{{ t('Choose a file') }}</label>
                <span class="zf-fname" [class.bad]="err[f.key]">{{ fileName(v[f.key]) || t('No file chosen') }}</span>
                <a *ngIf="isUrl(v[f.key])" [href]="v[f.key]" target="_blank" rel="noopener" class="zf-link">{{ t('Current file') }}</a>
              </span>
              <input *ngSwitchDefault type="text" [(ngModel)]="v[f.key]" [disabled]="!!f.readonly" [attr.readonly]="f.readonly ? '' : null" [attr.data-zf-readonly]="f.readonly ? '' : null" [style.background]="f.readonly ? '#f4f5f7' : null" [attr.maxlength]="f.max || meta[f.key]?.max_length || null" [placeholder]="f.placeholder ? t(f.placeholder) : ''" autocomplete="off" [class.bad]="err[f.key]">
            </ng-container>
            <small class="zf-hint" *ngIf="f.hint">{{ t(f.hint) }}</small>
            <small class="zf-err" *ngIf="err[f.key]" data-zf-field-error>{{ err[f.key] }}</small>
          </label>
        </ng-container>
      </div>
    </section>
    <!-- v1.67.12 (effective, item 64): when the change applies -->
    <section class="zf-sec" *ngIf="cfg.effective && (editing || cfg.effective === 'gratuity')" data-zf-effective>
      <h3>{{ t('When the change applies') }}</h3>
      <div class="zf-grid">
        <label class="zf-f" data-zf-field="_effective_from"><span class="zf-l">{{ t('Effective from') }}</span>
          <z-date-field [label]="t('Effective from')" [(value)]="eff"></z-date-field>
          <small class="zf-hint">{{ t(effHint) }}</small></label>
        <div class="zf-f"><span class="zf-l">{{ t('History') }}</span>
          <button type="button" class="zf-btn" (click)="history()" data-zf-history>{{ t('History of changes') }}</button></div>
      </div>
    </section>
  </div>
  <ng-template #wait><div class="zf-body"><p class="zf-muted">{{ t('Loading…') }}</p></div></ng-template>
  <div class="zf-foot">
    <button type="button" class="zf-btn" (click)="close()" [disabled]="busy">{{ t('Cancel') }}</button>
    <span class="zf-grow"></span>
    <button type="button" class="zf-btn" *ngIf="!editing && !cfg.action" (click)="save(true)" [disabled]="busy || loading" data-zf-another>{{ t('Save and add another') }}</button>
    <button type="button" class="zf-btn primary" (click)="save(false)" [disabled]="busy || loading" data-zf-save>{{ busy ? t('Saving…') : t(cfg.action || 'Save') }}</button>
  </div>
</div>`,
  styles: [`
  :host { position: fixed; inset: 0; z-index: 1300; display: grid; place-items: center; }
  .zf-veil { position: absolute; inset: 0; background: rgba(27,22,64,.38); }
  .zf-box { position: relative; width: min(760px, calc(100vw - 32px)); max-height: calc(100vh - 48px); display: flex; flex-direction: column; background: #fff;
    border-radius: 14px; box-shadow: 0 24px 60px rgba(27,22,64,.28); font-size: 13.5px; color: #1d2033; }
  .zf-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 18px 22px 12px; border-bottom: 1px solid #eceef5; }
  .zf-title { margin: 0; font-size: 18px; font-weight: 600; color: #1b1640; }
  .zf-sub { margin: 4px 0 0; color: #6b7185; font-size: 13px; }
  .zf-x { border: 0; background: transparent; font-size: 22px; line-height: 1; color: #6b7185; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
  .zf-x:hover { background: #f3f4f8; }
  .zf-body { padding: 8px 22px 16px; overflow: auto; }
  .zf-sec h3 { font-size: 12px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: #6b7185; margin: 14px 0 8px; }
  .zf-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; }
  .zf-f { display: flex; flex-direction: column; gap: 5px; margin: 0; min-width: 0; }
  .zf-f.full { grid-column: 1 / -1; }
  .zf-l { font-size: 12.5px; font-weight: 600; color: #3b3f55; }
  .zf-req { color: #b3263a; }
  .zf-f input:not([type=checkbox]), .zf-f select, .zf-f textarea { width: 100%; height: 36px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; }
  .zf-f textarea { height: auto; padding: 8px 10px; resize: vertical; }
  .zf-mono { font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; }
  .zf-f input:focus, .zf-f select:focus, .zf-f textarea:focus { outline: none; border-color: #5b4fe0; box-shadow: 0 0 0 3px rgba(91,79,224,.12); }
  .zf-f .bad { border-color: #d92d20 !important; }
  .zf-hint { color: #6b7185; font-size: 12px; }
  .zf-f input.zf-search { height: 30px; font-size: 12.5px; background: #f8f9fc; }
  .zf-err { color: #b3263a; font-size: 12px; }
  .zf-top { background: #fde2e4; border-radius: 8px; padding: 8px 10px; margin: 10px 0 0; }
  .zf-f.check { flex-direction: row; align-items: center; }
  .zf-ck { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; }
  .zf-multi { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; border-radius: 8px; }
  .zf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid #dfe1ea; border-radius: 16px; cursor: pointer; font-weight: 500; margin: 0; }
  .zf-chip.on { border-color: #5b4fe0; background: #eef0ff; color: #4b3fbf; }
  .zf-f .zf-q { flex: 1 0 100%; height: 32px; }   /* v1.62.10 (item 175) search of a long list */
  .zf-dt { display: flex; gap: 8px; align-items: center; }   /* v1.62.10 (item 172) */
  .zf-dt z-date-field { flex: 1; min-width: 0; display: block; }
  .zf-dt input[type=time] { width: 120px !important; flex: none; }
  .zf-file { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }   /* v1.62.10 (item 168) */
  .zf-file input[type=file] { flex: 1; min-width: 200px; padding-top: 6px; }
  .zf-pick { display: inline-flex; align-items: center; } .zf-fname { color: #6b7185; font-size: 12.5px; }
  .zf-link { border: 0; background: none; color: #5b4fe0; font-weight: 600; cursor: pointer; font-size: 12.5px; }
  .zf-foot { display: flex; align-items: center; gap: 8px; padding: 12px 22px; border-top: 1px solid #eceef5; }
  .zf-grow { flex: 1; }
  .zf-btn { height: 36px; padding: 0 16px; border-radius: 8px; border: 1px solid #dfe1ea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; color: #1d2033; }
  .zf-btn.primary { background: #5b4fe0; border-color: #5b4fe0; color: #fff; }
  .zf-btn[disabled] { opacity: .6; cursor: default; }
  .zf-muted { color: #6b7185; }
  @media (max-width: 640px) { .zf-grid { grid-template-columns: 1fr; } }
  /* v1.67.9 (screens) item 18: drawer – full height on the inline-end side (right in English, left in Arabic) */
  :host(.zf-drawer) { place-items: stretch end; }
  :host(.zf-drawer) .zf-box { width: min(720px, 100vw); max-height: none; height: 100dvh; border-radius: 0; box-shadow: -12px 0 40px rgba(27,22,64,.22);
    animation: zf-in .18s ease-out; }
  :host(.zf-drawer[dir=rtl]) .zf-box { box-shadow: 12px 0 40px rgba(27,22,64,.22); animation-name: zf-in-rtl; }
  :host(.zf-drawer) .zf-head { padding: 20px 24px 14px; background: #f8f9fc; }
  :host(.zf-drawer) .zf-body { flex: 1; padding: 6px 24px 20px; }
  :host(.zf-drawer) .zf-sec { border: 1px solid #eceef5; border-radius: 12px; padding: 4px 16px 16px; margin-top: 14px; }
  :host(.zf-drawer) .zf-foot { padding: 12px 24px; background: #fff; box-shadow: 0 -6px 16px rgba(27,22,64,.05); }
  @keyframes zf-in { from { transform: translateX(40px); opacity: .4; } to { transform: none; opacity: 1; } }
  @keyframes zf-in-rtl { from { transform: translateX(-40px); opacity: .4; } to { transform: none; opacity: 1; } }
  @media (max-width: 640px) { :host(.zf-drawer) .zf-box { width: 100vw; } :host(.zf-drawer) .zf-body { padding: 4px 14px 16px; } :host(.zf-drawer) .zf-sec { padding: 2px 12px 12px; } }
  `],
})
export class ZFormComponent implements OnInit {
  cfg!: ZFormConfig;
  record: any = null;
  done: (saved: boolean) => void = () => {};
  v: any = {};
  err: Record<string, string> = {};
  meta: Record<string, any> = {};
  opts: Record<string, ZFormOption[]> = {};
  loading = true;
  busy = false;
  saved = false;
  t = (s: string, p?: any[]) => i18nT(s, p);
  eff = '';                      // v1.67.12 (effective): the "Effective from" day of the change ('' = a correction)
  effHint = EFFECTIVE_HINT;

  constructor(private cd: ChangeDetectorRef) {}

  history(): void {   // v1.67.12 (effective)
    const id = this.cfg.effective === 'gratuity' ? 0 : (this.record ? (this.cfg.effectiveId ? this.cfg.effectiveId(this.record) : this.cfg.idOf ? this.cfg.idOf(this.record) : this.record.id) : null);
    const name = this.record ? (this.record.name || this.record.loan_type || '') : '';
    openRuleHistory(this.cfg.effective!, id, name);
  }

  get editing(): boolean { return !!this.record; }
  get title(): string { if (this.cfg.heading) { return this.t(this.cfg.heading); } return this.editing ? this.t('Edit {0}', [this.t(this.cfg.thing)]) : this.t('New {0}', [this.cfg.thing]); }   // v1.62.10 (item 172): "Edit {0}" with the thing in the user's language (Arabic showed "تعديل company policy")

  async ngOnInit(): Promise<void> {
    if (this.record && Object.keys(this.record).length === 1 && this.record.id !== undefined) {   // only the id: read the record
      const ep = this.cfg.endpoint.endsWith('/') ? this.cfg.endpoint : this.cfg.endpoint + '/';
      const r = await this.api('GET', `${ep}${this.record.id}/`);
      if (r.ok && r.data && typeof r.data === 'object') { this.record = r.data; }
    }
    this.reset();
    const jobs: Promise<any>[] = [this.api('OPTIONS', this.cfg.endpoint).then(r => {
      const a = r.data?.actions || {};
      this.meta = (this.editing ? (a.PUT || a.POST) : (a.POST || a.PUT)) || {};
    })];
    for (const s of this.cfg.sections) {
      for (const f of s.fields) {
        if (f.options) { this.opts[f.key] = f.options; continue; }
        if (f.source) {
          const src = f.source;
          jobs.push(this.api('GET', src.endpoint).then(r => {
            let list: any[] = Array.isArray(r.data) ? r.data : (r.data?.results || []);
            if (src.filter) { list = list.filter(src.filter); }
            this.opts[f.key] = list.map(x => ({ value: x[src.value || 'id'], label: typeof src.label === 'function' ? src.label(x) : x[src.label], raw: x }));
          }));
        } else if (this.meta[f.key]?.choices) {
          this.opts[f.key] = this.meta[f.key].choices.map((c: any) => ({ value: c.value, label: c.display_name }));
        }
      }
    }
    await Promise.all(jobs.map(j => j.catch(() => null)));
    // an edited record sends names for its links (e.g. branch: ["Head office"]) – matched to the options' ids
    for (const s of this.cfg.sections) {
      for (const f of s.fields) {
        const o = this.opts[f.key]; if (!o) { continue; }
        const byLabel = (x: any) => typeof x === 'string' && !/^\d+$/.test(x) ? (o.find(q => q.label === x || [f.matchKey, ...(f.matchKeys || [])].some(k => !!k && String(q.raw?.[k!] ?? '') === x))?.value ?? x) : x;   // v1.62.10 (items 166, 175): matchKey / matchKeys
        if (f.type === 'multi' && Array.isArray(this.v[f.key])) { this.v[f.key] = this.v[f.key].map((x: any) => typeof x === 'object' && x ? (x.id ?? x.value) : byLabel(x)); }
        if (f.type === 'select' && this.v[f.key] !== null && this.v[f.key] !== undefined) { const x = this.v[f.key]; this.v[f.key] = typeof x === 'object' ? (x.id ?? x.value ?? null) : byLabel(x); }
      }
    }
    for (const s of this.cfg.sections) {   // choices that came with the metadata
      for (const f of s.fields) { if (!this.opts[f.key] && this.meta[f.key]?.choices) { this.opts[f.key] = this.meta[f.key].choices.map((c: any) => ({ value: c.value, label: c.display_name })); } }
    }
    if (!this.editing) {   // v1.67.6 (setup) item 11: a company with one branch – its branch picker takes it
      for (const s of this.cfg.sections) {
        for (const f of s.fields) {
          const o = this.opts[f.key];
          if (f.type === 'select' && /branch/i.test(f.key) && o?.length === 1 && (this.v[f.key] === null || this.v[f.key] === '' || this.v[f.key] === undefined)) { this.v[f.key] = o[0].value; }
        }
      }
    }
    this.loading = false;
    this.cd.detectChanges();
    setTimeout(() => (document.querySelector('[data-zform] .zf-body input, [data-zform] .zf-body select') as HTMLElement | null)?.focus(), 30);
  }

  private reset(): void {
    this.eff = '';   // v1.67.12 (effective)
    const base = this.record ? (this.cfg.fromRecord ? this.cfg.fromRecord(this.record) : { ...this.record }) : { ...(this.cfg.initial || {}) };   // v1.62.10 (item 170)
    const v: any = { ...base };
    for (const s of this.cfg.sections) {
      for (const f of s.fields) {
        if (v[f.key] === undefined) { v[f.key] = f.type === 'multi' ? [] : f.type === 'check' ? false : f.type === 'select' ? null : ''; }
      }
    }
    this.v = v; this.err = {};
  }

  visible(f: ZFormField): boolean {
    if (f.createOnly && this.editing) { return false; }
    if (f.editOnly && !this.editing) { return false; }
    return f.showIf ? f.showIf(this.v) : true;
  }
  q: Record<string, string> = {};   // v1.62.10 (items 166, 175): the search text of a long choice
  // v1.62.10 (item 175): f.search on a 'multi' list – the search box filters the chips (optsFor), ticked ones first, up to 60 shown
  private multiAll(f: ZFormField): ZFormOption[] {
    const o = this.optsFor(f); if (!f.search) { return o; }
    return [...o.filter(x => this.has(f.key, x.value)), ...o.filter(x => !this.has(f.key, x.value))];
  }
  multiOpts(f: ZFormField): ZFormOption[] { const a = this.multiAll(f); return f.search ? a.slice(0, 60) : a; }
  hidden(f: ZFormField): number { return Math.max(0, this.multiAll(f).length - 60); }
  optsFor(f: ZFormField): ZFormOption[] {
    const o = this.opts[f.key] || []; let r = f.optFilter ? o.filter(x => f.optFilter!(x.raw, this.v, this.opts)) : o;
    const s = (this.q[f.key] || '').trim().toLowerCase();   // v1.62.10 (item 166): the chosen value stays in the list while searching
    if (s && f.type === 'select') { r = r.filter(x => String(x.label).toLowerCase().includes(s) || String(x.value) === String(this.v[f.key])); }
    return r;
  }
  req(f: ZFormField): boolean { return f.required ?? !!(this.meta[f.key]?.required); }
  // v1.67.5 (bugs) L4: a single value (an id, or a name from an old API) in a list field no longer breaks the whole form
  private arr(k: string): any[] { const x = this.v[k]; return Array.isArray(x) ? x : (x === null || x === undefined || x === '' ? [] : [x]); }
  has(k: string, val: any): boolean { return this.arr(k).some((x: any) => String(x) === String(val)); }
  toggle(k: string, val: any): void { const a = [...this.arr(k)]; const i = a.findIndex((x: any) => String(x) === String(val)); i >= 0 ? a.splice(i, 1) : a.push(val); this.v[k] = a; }
  allOn(k: string): boolean { return (this.opts[k] || []).length > 0 && (this.opts[k] || []).every(o => this.has(k, o.value)); }
  all(k: string): void { this.v[k] = this.allOn(k) ? [] : (this.opts[k] || []).map(o => o.value); }

  close(): void { if (!this.busy) { this.done(this.saved); } }
  pickFile(k: string, ev: any): void { const f = ev?.target?.files?.[0]; if (f) { this.v[k] = f; delete this.err[k]; } }   // v1.62.10 (item 168)
  fileName(x: any): string { return x instanceof File ? x.name : ''; }   // v1.67.9 (screens)
  isUrl(x: any): boolean { return typeof x === 'string' && /^(https?:)?\/\//.test(x); }
  /** v1.62.10 (item 172): a 'datetime' value "YYYY-MM-DDTHH:MM" – its date (0) or time (1) part */
  dtPart(k: string, i: 0 | 1): string { const s = String(this.v[k] || ''); return i === 0 ? s.slice(0, 10) : s.slice(11, 16); }
  dtSet(k: string, i: 0 | 1, x: string): void {
    const d = i === 0 ? (x || '') : this.dtPart(k, 0), tm = (i === 1 ? x : this.dtPart(k, 1)) || '00:00';
    this.v[k] = d ? `${d}T${tm}` : '';
  }

  private check(): boolean {
    this.err = {};
    for (const s of this.cfg.sections) {
      for (const f of s.fields) {
        if (!this.visible(f) || !this.req(f) || f.type === 'check') { continue; }
        const x = this.v[f.key];
        if (x === null || x === undefined || x === '' || (Array.isArray(x) && !x.length)) { this.err[f.key] = this.t('{0} is required.', [this.t(f.label)]); }
      }
    }
    if (this.cfg.validate && !Object.keys(this.err).length) { Object.assign(this.err, this.cfg.validate(this.v, (x, a) => this.t(x, a)) || {}); }   // v1.62.10 (item 168)
    return !Object.keys(this.err).length;
  }

  async save(another: boolean): Promise<void> {
    if (this.busy || !this.check()) { this.cd.detectChanges(); return; }
    this.busy = true; this.cd.detectChanges();
    const body: any = {};
    for (const s of this.cfg.sections) { for (const f of s.fields) { if (this.visible(f)) {
      const empty = (this.v[f.key] === '' || this.v[f.key] === null || this.v[f.key] === undefined) && (f.type === 'date' || f.type === 'number' || f.type === 'select' || f.type === 'datetime');   // v1.62.10 (item 172) datetime
      // v1.62.1: an empty number / date / choice of a new record is left out, so the server's default applies
      // (New branch with no probation days was refused: "This field may not be null.")
      if (empty && !this.editing) { continue; }
      if (f.type === 'file' && !(this.v[f.key] instanceof File)) { continue; }   // v1.62.10 (item 168): only a newly chosen file is sent
      if (f.readonly) { continue; }   // v1.67.6 (setup)
      body[f.key] = empty ? null : this.v[f.key];
    } } }
    const payload = this.cfg.toBody ? this.cfg.toBody({ ...this.v, ...body }, this.editing) : body;
    const id = this.record ? (this.cfg.idOf ? this.cfg.idOf(this.record) : this.record.id) : null;
    const ep = this.cfg.endpoint.endsWith('/') ? this.cfg.endpoint : this.cfg.endpoint + '/';
    const dated = this.cfg.effective ? zEffectiveParam(this.eff) : '';   // v1.67.12 (effective): ?effective_from=
    const r = await this.api(id ? 'PATCH' : 'POST', (id ? `${ep}${id}/` : ep) + dated, payload);
    this.busy = false;
    const fail = r.ok && this.cfg.failIf ? this.cfg.failIf(r.data, (x, a) => this.t(x, a)) : null;   // v1.62.10 (item 170)
    if (fail) { this.err = { _: fail }; this.cd.detectChanges(); return; }
    if (r.ok) {
      this.saved = true;
      zToast((this.cfg.okText && this.cfg.okText(r.data, (x, a) => this.t(x, a))) || this.t('{0} saved.', [zTitle(this.t(this.cfg.thing))]), 'ok');
      if (another && !this.editing) { this.reset(); this.cd.detectChanges(); return; }
      this.done(true); return;
    }
    this.err = {};
    const d = r.data;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      for (const [k, val] of Object.entries(d)) {
        const msg = Array.isArray(val) ? val.join(' ') : typeof val === 'string' ? val : JSON.stringify(val);
        if (this.cfg.sections.some(s => s.fields.some(f => f.key === k && this.visible(f)))) { this.err[k] = msg; } else if ((k === 'detail' || k === 'error') && ((this.err['_'] || '').includes(msg) || Object.entries(d).some(([q, x]) => q !== k && this.cfg.sections.some(s => s.fields.some(f => f.key === q && this.visible(f))) && (Array.isArray(x) ? x.join(' ') : x) === msg))) { continue; /* v1.62.10 (item 171): the same text once (an answer with emp_code + detail) */ } else { this.err['_'] =(this.err['_'] ? this.err['_'] + ' ' : '') + (k === 'detail' || k === 'non_field_errors' || k === 'error' ? '' : k + ': ') + msg; }
      }
    } else {
      // v1.62.10 (item 166): a plain list of messages (DRF ValidationError('…')) is shown as it is
      this.err['_'] = Array.isArray(d) && d.length && d.every(x => typeof x === 'string') ? d.join(' ') : typeof d === 'string' && d.length < 300 ? d : this.t('Not saved – try again.');
    }
    this.cd.detectChanges();
  }

  private async api(method: string, path: string, body?: any): Promise<{ ok: boolean; status: number; data: any }> {
    const sch = localStorage.getItem('selectedSchema') || '';
    const h: any = { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || ''), 'Content-Type': 'application/json' };
    // v1.62.10 (item 168): a body with a chosen file goes as multipart (the browser sets the boundary)
    if (body && typeof body === 'object' && !Array.isArray(body) && Object.values(body).some(x => x instanceof File)) {
      const fd = new FormData();
      for (const [k, x] of Object.entries(body)) {
        if (x === null || x === undefined) { continue; }
        if (Array.isArray(x)) { x.forEach(y => fd.append(k, String(y))); } else { fd.append(k, x instanceof File ? x : String(x)); }
      }
      body = fd; delete h['Content-Type'];
    }
    try { const l = localStorage.getItem('zeoLang'); if (l) { h['X-Language'] = l; } } catch { /* storage off */ }
    const url = `${environment.apiBaseUrl}${path}${path.includes('?') ? '&' : '?'}schema=${encodeURIComponent(sch)}`;
    try {
      const res = await fetch(url, { method, headers: h, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
      const txt = await res.text(); let data: any = null;
      try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
      return { ok: res.ok, status: res.status, data };
    } catch (e: any) {
      return { ok: false, status: 0, data: String(e?.message || e) };
    }
  }
}
