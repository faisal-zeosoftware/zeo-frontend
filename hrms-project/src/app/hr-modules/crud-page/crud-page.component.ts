import { Component, Input, OnInit } from '@angular/core';
import { i18nT } from '../../shared-ui/i18n.service';   // v1.62.0 people
import { ZDateFieldComponent } from '../../shared-ui/z-date-field.component';   // v1.62.0 people: dates dd/mm/yyyy
import { ZMoneyPipe } from '../../shared-ui/country-pack.service';   // v1.62.0 ui
import { ZListDirective } from '../../shared-ui/z-list.directive';
import { ZOrgPickDirective } from '../../shared-ui/z-org-pick.directive';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModuleApiService } from '../module-api.service';
import { ActionConfig, ChildConfig, ColumnConfig, FieldConfig, PageConfig } from '../page-config';
import { HrPermissionService } from '../hr-permission.service';
import { CountryPackService, cpLocalize } from '../../shared-ui/country-pack.service';
import { ZTranslateComponent } from '../../shared-ui/z-translate.component';
import { I18nService, i18nLocalize, TPipe } from '../../shared-ui/i18n.service';   // v1.15.0; v1.67.5 (bugs) TPipe
import { zConfirm } from '../../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

type Opt = { value: any; label: string };

@Component({
  selector: 'app-hr-crud-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ZListDirective, ZOrgPickDirective, ZTranslateComponent, ZMoneyPipe, ZDateFieldComponent, TPipe],   // v1.62.0 ui zmoney
  templateUrl: './crud-page.component.html',
  styleUrls: ['../hr-shared.css'],
})
export class CrudPageComponent implements OnInit {
  @Input() config!: PageConfig;
  /** v1.14.0: the config as written; `config` is its copy with the company's country captions / fields */
  private rawConfig: PageConfig | null = null;

  rows: any[] = [];
  loading = false;
  search = '';
  filters: Record<string, any> = {};
  options: Record<string, Opt[]> = {};
  stats: any = null;

  page = 1;
  pageSize = 100000; // paging, search, filters and export come from the shared list bar (z-list)

  // form modal
  formOpen = false;
  formFields: FieldConfig[] = [];
  formModel: any = {};
  // v1.67.5 (bugs) L3: the search text of a 'select' with search – the list stays shown after a pick
  pickQ: Record<string, string> = {};
  sameVal(a: any, b: any): boolean { return a !== null && a !== undefined && a !== '' && String(a) === String(b); }
  trackOpt(_i: number, o: Opt): any { return o.value; }
  pickOptions(f: FieldConfig): Opt[] {
    const all = this.options[f.key] || [];
    const q = (this.pickQ[f.key] || '').trim().toLowerCase();
    if (!q) { return all.slice(0, 200); }
    const hit = all.filter(o => o.label.toLowerCase().includes(q) || this.sameVal(this.formModel[f.key], o.value));
    return hit.slice(0, 200);
  }
  pickLabel(f: FieldConfig): string { return (this.options[f.key] || []).find(o => this.sameVal(this.formModel[f.key], o.value))?.label || String(this.formModel[f.key] ?? ''); }
  formFiles: Record<string, File | null> = {};
  formTitle = '';
  formEndpoint = '';
  formEditId: any = null;
  formMultipart = false;
  formFixed: any = {};
  formErrors = '';
  saving = false;
  private afterSave: (() => void) | null = null;

  // prompt modal (reason etc.)
  promptOpen = false;
  promptFields: FieldConfig[] = [];
  promptModel: any = {};
  promptTitle = '';
  private promptResolve: ((v: any) => void) | null = null;

  // v1.62.5 (item 19): a save the server answers 409 with a choice (code period_paid: salary of the days already paid) –
  // "Cancel" (nothing saved) or the server's choice ("Add to December salary"), sent again with confirm.key = confirm.value
  choiceAsk: { title: string; text: string; ok: string; cancel: string } | null = null;
  private choiceResolve: ((ok: boolean) => void) | null = null;

  // detail panel
  detail: any = null;
  childRows: Record<string, any[]> = {};

  // document view
  docHtml: SafeHtml | null = null;
  docTitle = ''; docPanel = false;   // v1.62.1

  toast: { text: string; kind: 'ok' | 'err' } | null = null;
  canAdd = true;
  canChange = true;
  canDeleteAny = true;

  constructor(
    private api: ModuleApiService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private perms: HrPermissionService,
    private cp: CountryPackService,
    private i18n: I18nService,
  ) {}

  ngOnInit(): void {
    if (!this.config) {
      this.config = this.route.snapshot.data['config'];
    }
    this.rawConfig = this.config;
    this.config = this.localize(this.rawConfig);   // v1.14.0 country captions, v1.15.0 then the language
    this.route.data.subscribe(d => {
      if (d['config'] && d['config'] !== this.rawConfig) {
        this.rawConfig = d['config'];
        this.config = this.localize(d['config'] as PageConfig);
        this.reset();
      }
    });
    // v1.14.0: the company's country pack arrived / changed → captions and country-only fields follow
    this.cp.pack$.subscribe(() => { if (this.rawConfig) { this.config = this.localize(this.rawConfig); } });
    this.i18n.lang$.subscribe(() => { if (this.rawConfig) { this.config = this.localize(this.rawConfig); } });   // v1.15.0
    this.reset();
  }

  /** Country pack captions first (v1.14.0), then the user's language (v1.15.0). */
  private localize(cfg: PageConfig): PageConfig { return i18nLocalize(cpLocalize(cfg, this.cp)); }

  private reset(): void {
    this.filters = { ...(this.config.defaultParams || {}) };
    this.detail = null;
    this.page = 1;
    this.loadFilterOptions();
    this.load();
    this.loadStats();
    if (this.config.model) {
      this.perms.can(this.config.model).subscribe(p => {
        this.canAdd = p.add; this.canChange = p.change; this.canDeleteAny = p.delete;
      });
    }
  }

  // ---------------- data ----------------
  load(): void {
    this.loading = true;
    this.api.list(this.config.endpoint, this.filters).subscribe({
      next: rows => {
        this.rows = this.config.sortRows ? [...rows].sort(this.config.sortRows) : rows;   // v1.62.0 talent-ops
        this.loading = false;
        if (this.detail) {
          const fresh = rows.find(r => r.id === this.detail.id);
          if (fresh) this.openDetail(fresh);
        }
      },
      error: err => { this.loading = false; this.showError(err); },
    });
  }

  loadStats(): void {
    if (!this.config.stats) { this.stats = null; return; }
    this.api.get(this.config.stats.endpoint).subscribe({ next: s => (this.stats = s), error: () => (this.stats = null) });
  }

  loadFilterOptions(): void {
    (this.config.filters || []).forEach(f => {
      if (f.options) this.options['filter:' + f.key] = f.options;
      else if (f.lookup) this.api.lookup(f.lookup).subscribe(o => (this.options['filter:' + f.key] = o));
    });
  }

  get filteredRows(): any[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.rows;
    const keys = this.config.searchKeys || this.config.columns.map(c => c.key);
    return this.rows.filter(r => keys.some(k => String(this.cellRaw(r, k) ?? '').toLowerCase().includes(q)));
  }

  get pagedRows(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  // ---------------- cells ----------------
  /** v1.62.0 talent-ops: short values (codes, numbers, dates, money, status chips) never wrap over several lines. */
  nwCol(c: ColumnConfig): boolean {
    if (['date', 'datetime', 'money', 'percent', 'tag', 'stars', 'number'].includes(c.type || '')) { return true; }
    return /(^|_)(code|number|no|job_code|document_number|emp_code|employee_code)$/.test(c.key) || ['No.', 'Code', 'Job code', 'Number'].includes(c.label);
  }

  cellRaw(row: any, key: string): any {
    return key.split('.').reduce((o, k) => (o == null ? o : o[k]), row);
  }

  cell(row: any, col: ColumnConfig): any {
    if (col.value) return col.value(row);
    const label = this.cellRaw(row, col.key + '_label');
    if (label !== undefined && label !== null && col.type !== 'tag') return label;
    const display = this.cellRaw(row, col.key + '_display');
    if (display !== undefined && display !== null) return Array.isArray(display) ? display.join(', ') : display;
    const v = this.cellRaw(row, col.key);
    if (col.type === 'tag') return this.cellRaw(row, col.key + '_label') ?? v;
    return v;
  }

  tagClass(row: any, col: ColumnConfig): string {
    const raw = this.cellRaw(row, col.colorKey || col.key);
    return 'tag tag-' + ((col.tagColors && col.tagColors[String(raw)]) || 'grey');
  }

  stars(n: any): number[] {
    return [1, 2, 3, 4, 5].map(i => (i <= Number(n || 0) ? 1 : 0));
  }

  // ---------------- permissions per row ----------------
  rowEditable(row: any): boolean {
    const ce = this.config.canEdit;
    if (ce === false || !this.config.fields?.length || !this.canChange) return false;
    return typeof ce === 'function' ? ce(row) : true;
  }

  rowDeletable(row: any): boolean {
    const cd = this.config.canDelete;
    if (cd === false || !this.canDeleteAny) return false;
    return typeof cd === 'function' ? cd(row) : cd === true;
  }

  actionVisible(a: ActionConfig, row: any): boolean {
    return !a.showIf || a.showIf(row);
  }

  // ---------------- form ----------------
  openCreate(): void {
    this.openForm(this.config.fields || [], this.config.endpoint, null, {}, `Create ${this.singular()}`, !!this.config.multipart, () => this.load());
  }

  openEdit(row: any, ev?: Event): void {
    ev?.stopPropagation();
    this.openForm(this.config.fields || [], this.config.endpoint, row.id, row, `Edit ${this.singular()}`, !!this.config.multipart, () => this.load());
  }

  singular(): string {
    return this.config.itemName || this.config.title.replace(/ies$/, 'y').replace(/s$/, '');
  }

  detailHeading(row: any): string {
    if (this.config.detailTitle) return this.config.detailTitle(row);
    const first = this.config.columns.find(c => !['date', 'datetime'].includes(c.type || 'text')) || this.config.columns[0];
    return this.cell(row, first) ?? '';
  }

  openForm(fields: FieldConfig[], endpoint: string, id: any, row: any, title: string, multipart: boolean, after: () => void, fixed: any = {}): void {
    this.formFixed = fixed;
    this.formFields = fields.filter(f => (id ? !f.createOnly : !f.editOnly));
    this.formModel = {};
    this.pickQ = {};   // v1.67.5 (bugs) L3
    this.formFiles = {};
    this.formFields.forEach(f => {
      const v = row?.[f.key];
      if (f.type === 'file') return;
      if (v !== undefined && v !== null) {
        this.formModel[f.key] = f.type === 'datetime' && typeof v === 'string' ? v.slice(0, 16) : (f.type === 'json' ? JSON.stringify(v) :
          (f.type === 'questions' && Array.isArray(v) ? v.map((q: any) => ({ ...q, options: [...(q.options || [])], must: Array.isArray(q.must) ? [...q.must] : q.must })) :
            (f.type === 'tags' && Array.isArray(v) ? [...v] : v)));
      } else if (f.default !== undefined) {
        this.formModel[f.key] = typeof f.default === 'function' ? f.default() : f.default;
      } else if (f.type === 'multiselect' || f.type === 'chips' || f.type === 'tags' || f.type === 'questions') {
        this.formModel[f.key] = [];
      } else if (f.type === 'checkbox') {
        this.formModel[f.key] = false;
      }
    });
    this.formTitle = title;
    this.formEndpoint = endpoint;
    this.formEditId = id;
    this.formMultipart = multipart || this.formFields.some(f => f.type === 'file');
    this.formErrors = '';
    this.afterSave = after;
    this.loadFieldOptions(this.formFields);
    this.formOpen = true;
  }

  loadFieldOptions(fields: FieldConfig[]): void {
    fields.forEach(f => {
      if (f.options) this.options[f.key] = f.options;
      else if (f.lookup) this.api.lookup(f.lookup).subscribe(o => (this.options[f.key] = o));
    });
  }

  fieldVisible(f: FieldConfig, model: any): boolean {
    return !f.showIf || f.showIf(model);
  }

  toggleMulti(model: any, key: string, value: any): void {
    const arr: any[] = Array.isArray(model[key]) ? [...model[key]] : [];
    const i = arr.indexOf(value);
    i >= 0 ? arr.splice(i, 1) : arr.push(value);
    model[key] = arr;
  }

  // v1.57.0 tags and question editors
  tagKey(model: any, key: string, ev: KeyboardEvent): void {
    const el = ev.target as HTMLInputElement;
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault();
      this.addTag(model, key, el);
    } else if (ev.key === 'Backspace' && !el.value && (model[key] || []).length) {
      model[key] = model[key].slice(0, -1);
    }
  }
  tagBlur(model: any, key: string, ev: Event): void { this.addTag(model, key, ev.target as HTMLInputElement); }
  private addTag(model: any, key: string, el: HTMLInputElement): void {
    const words = (el.value || '').split(',').map(w => w.trim()).filter(Boolean);
    const cur: string[] = Array.isArray(model[key]) ? [...model[key]] : [];
    words.forEach(w => { if (!cur.some(c => c.toLowerCase() === w.toLowerCase())) { cur.push(w); } });
    model[key] = cur;
    el.value = '';
  }
  removeTag(model: any, key: string, i: number): void { const cur = [...(model[key] || [])]; cur.splice(i, 1); model[key] = cur; }
  addQ(model: any, key: string): void {
    model[key] = [...(model[key] || []), { text: '', type: 'yes_no', options: [], required: true, must: null }];
  }
  moveQ(model: any, key: string, i: number, d: number): void {
    const a = [...model[key]]; const [q] = a.splice(i, 1); a.splice(i + d, 0, q); model[key] = a;
  }
  splitOpts(v: string): string[] { return String(v || '').split('|').map(x => x.trim()).filter(Boolean); }
  toggleMust(q: any, o: string): void {
    const m: string[] = Array.isArray(q.must) ? [...q.must] : [];
    const i = m.indexOf(o); i >= 0 ? m.splice(i, 1) : m.push(o);
    q.must = m.length ? m : null;
  }

  onFile(key: string, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.formFiles[key] = input.files && input.files.length ? input.files[0] : null;
  }

  private buildBody(fields: FieldConfig[], model: any, files: Record<string, File | null>, multipart: boolean): any {
    const clean: any = {};
    for (const f of fields) {
      if (!this.fieldVisible(f, model) || f.type === 'file') continue;
      let v = model[f.key];
      if (v === '' || v === undefined) v = null;
      if (f.type === 'number' && v !== null) v = Number(v);
      if (f.type === 'json' && typeof v === 'string' && v.trim()) {
        try { v = JSON.parse(v); } catch { throw new Error(`${f.label}: invalid JSON`); }
      }
      if (v === null && (f.type === 'multiselect' || f.type === 'chips' || f.type === 'tags' || f.type === 'questions')) v = [];
      if (f.type === 'questions' && Array.isArray(v)) {
        v = v.filter((q: any) => String(q.text || '').trim());
        const bad = v.find((q: any) => q.type === 'choice' && (q.options || []).length < 2);
        if (bad) { throw new Error(`"${bad.text}": give at least two answers, separated by |`); }
      }
      if (v === null && !this.formEditId && !f.required) continue;
      clean[f.key] = v;
    }
    Object.assign(clean, this.formFixed || {});
    if (!multipart) return clean;
    const fd = new FormData();
    Object.entries(clean).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        const field = fields.find(x => x.key === k);
        if (field?.type === 'chips' || field?.type === 'tags' || field?.type === 'questions') fd.append(k, JSON.stringify(v));
        else v.forEach(x => fd.append(k, String(x)));
      } else if (v !== null) fd.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
    });
    Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
    return fd;
  }

  save(): void {
    const missing = this.formFields.filter(f => f.required && this.fieldVisible(f, this.formModel) && f.type !== 'checkbox' &&
      (f.type === 'file' ? !this.formFiles[f.key] && !this.formEditId : (this.formModel[f.key] === undefined || this.formModel[f.key] === null || this.formModel[f.key] === '' ||
        (Array.isArray(this.formModel[f.key]) && !this.formModel[f.key].length))));
    if (missing.length) {
      this.formErrors = 'Please fill: ' + missing.map(m => m.label).join(', ');
      return;
    }
    let body: any;
    try {
      body = this.buildBody(this.formFields, this.formModel, this.formFiles, this.formMultipart);
    } catch (e: any) {
      this.formErrors = e.message;
      return;
    }
    this.saving = true;
    this.formErrors = '';
    this.send(body);
  }

  private send(body: any): void {
    const req = this.formEditId ? this.api.update(this.formEndpoint, this.formEditId, body) : this.api.create(this.formEndpoint, body);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.formOpen = false;
        this.showOk('Saved.');
        this.afterSave?.();
        this.loadStats();
      },
      error: async err => {
        const again = await this.choiceFor(err, body);   // v1.62.5 (item 19)
        if (again) { this.send(again); return; }
        this.saving = false;
        if (!this.isChoice(err)) { this.formErrors = ModuleApiService.errorText(err); }
      },
    });
  }

  // ---------------- v1.62.5 (item 19): the server asks before saving ----------------
  private isChoice(err: any): boolean { return err?.status === 409 && !!err?.error?.confirm?.key; }

  /** 409 with a choice: show it; the body to send again (with the choice) when the user takes it, else null. A 409 without a
   *  choice (the employee for their own leave) is an ordinary error message. */
  private async choiceFor(err: any, body: any): Promise<any> {
    if (!this.isChoice(err)) return null;
    const e = err.error;
    this.choiceAsk = { title: e.title || '', text: e.detail || '', ok: e.confirm.label || 'OK', cancel: e.cancel_label || 'Cancel' };
    const ok = await new Promise<boolean>(resolve => (this.choiceResolve = resolve));
    if (!ok) return null;
    if (body instanceof FormData) { const fd = new FormData(); body.forEach((v, k) => fd.append(k, v as any)); fd.set(e.confirm.key, e.confirm.value); return fd; }
    return { ...(body || {}), [e.confirm.key]: e.confirm.value };
  }

  answerChoice(ok: boolean): void {
    this.choiceAsk = null;
    this.choiceResolve?.(ok);
    this.choiceResolve = null;
  }

  async remove(row: any, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    if (!(await zConfirm(`Delete this ${this.singular().toLowerCase()}?`))) return;
    this.api.remove(this.config.endpoint, row.id).subscribe({
      next: () => { this.showOk('Deleted.'); if (this.detail?.id === row.id) this.detail = null; this.load(); },
      error: err => this.showError(err),
    });
  }

  // ---------------- actions ----------------
  /** v1.62.0 people: "New leave request" in the user's language (the button showed "+ New طلب إجازة" in Arabic). */
  newLabel(): string { const it = this.config.itemName || 'record'; return i18nT('New {0}', [/^[A-Za-z]/.test(it) ? it.toLowerCase() : it]); }

  // v1.62.0 people: a date-and-time value 'yyyy-mm-ddTHH:MM' edited as a dd/mm/yyyy date box plus HH:MM
  dtDate(v: any): string { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || '')); return m ? m[1] : ''; }
  dtTime(v: any): string { const m = /[T ](\d{2}:\d{2})/.exec(String(v || '')); return m ? m[1] : ''; }
  dtJoin(d: string, t: string): string { if (!d) { return ''; } const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim()); return m ? `${d}T${m[1].padStart(2, '0')}:${m[2]}` : `${d}T00:00`; }

  async runAction(a: ActionConfig, row: any | null, endpoint = this.config.endpoint, after?: () => void, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    if (a.route) { this.router.navigateByUrl(a.route(row)); return; }
    if (a.open) { if (await a.open(row)) { this.load(); } return; }   // v1.62.10 (item 172)
    if (a.confirm && !(await zConfirm(a.confirm))) return;
    let body: any = a.body ? a.body(row, this.filters) : {};
    if (a.prompt?.length) {
      const answer = await this.ask(a.label, a.prompt);
      if (!answer) return;
      body = { ...body, ...answer };
    }
    this.callAction(a, row, endpoint, body, after);
  }

  private callAction(a: ActionConfig, row: any | null, endpoint: string, body: any, after?: () => void): void {
    this.api.action(endpoint, row ? row.id : null, a.action || '', body, a.method || 'post').subscribe({
      next: (res: any) => {
        if (a.document) {
          this.docTitle = a.panel ? a.label : 'Preview'; this.docPanel = !!a.panel;   // v1.62.1
          this.docHtml = this.sanitizer.bypassSecurityTrustHtml(this.cp.text(a.document(res)));   // v1.14.0: currency / law captions
          return;
        }
        this.showOk(res?.detail || `${a.label}: done.`);
        after ? after() : this.load();
        this.loadStats();
      },
      error: async err => {
        const again = await this.choiceFor(err, body);   // v1.62.5 (item 19)
        if (again) { this.callAction(a, row, endpoint, again, after); return; }
        if (!this.isChoice(err)) { this.showError(err); }
      },
    });
  }

  ask(title: string, fields: FieldConfig[]): Promise<any> {
    this.promptTitle = title;
    this.promptFields = fields;
    this.promptModel = {};
    fields.forEach(f => (this.promptModel[f.key] = f.default ?? (f.type === 'checkbox' ? false : '')));
    this.loadFieldOptions(fields);
    this.promptOpen = true;
    return new Promise(resolve => (this.promptResolve = resolve));
  }

  closePrompt(ok: boolean): void {
    if (ok) {
      const missing = this.promptFields.filter(f => f.required && (this.promptModel[f.key] === '' || this.promptModel[f.key] == null));
      if (missing.length) { alert('Please fill: ' + missing.map(m => m.label).join(', ')); return; }
    }
    this.promptOpen = false;
    this.promptResolve?.(ok ? { ...this.promptModel } : null);
    this.promptResolve = null;
  }

  printDoc(): void {
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) return;
    const html = (document.querySelector('.hr-doc-body') as HTMLElement)?.innerHTML || '';
    w.document.write(`<html><head><title>${this.config.title}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#1f2433}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px;text-align:left}</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  // ---------------- detail + children ----------------
  openDetail(row: any): void {
    this.detail = row;
    (this.config.children || []).forEach(ch => this.loadChild(ch));
  }

  loadChild(ch: ChildConfig): void {
    if (!this.detail) return;
    if (ch.rowsFrom) {
      this.childRows[ch.title] = this.detail[ch.rowsFrom] || [];
      return;
    }
    this.api.list(ch.endpoint, { [ch.parentKey]: this.detail.id }).subscribe({
      next: rows => (this.childRows[ch.title] = rows),
      error: () => (this.childRows[ch.title] = []),
    });
  }

  addChild(ch: ChildConfig): void {
    this.openForm(this.childFieldsWithoutParent(ch), ch.endpoint, null, {}, `Add - ${ch.title}`, false,
      () => { this.loadChild(ch); this.load(); }, { [ch.parentKey]: this.detail.id });
  }

  editChild(ch: ChildConfig, row: any): void {
    this.openForm(this.childFieldsWithoutParent(ch), ch.endpoint, row.id, row, `Edit - ${ch.title}`, false, () => { this.loadChild(ch); this.load(); });
  }

  async removeChild(ch: ChildConfig, row: any): Promise<void> {
    if (!(await zConfirm('Delete this line?'))) return;
    this.api.remove(ch.endpoint, row.id).subscribe({ next: () => { this.loadChild(ch); this.load(); }, error: e => this.showError(e) });
  }

  loadChildFn(ch: ChildConfig): () => void {
    return () => { this.loadChild(ch); this.load(); };
  }

  childFieldsWithoutParent(ch: ChildConfig): FieldConfig[] {
    return (ch.fields || []).filter(f => f.key !== ch.parentKey);
  }

  // ---------------- toast ----------------
  showOk(text: string): void {
    this.toast = { text, kind: 'ok' };
    setTimeout(() => (this.toast = null), 3500);
  }

  showError(err: any): void {
    this.toast = { text: ModuleApiService.errorText(err), kind: 'err' };
    setTimeout(() => (this.toast = null), 7000);
  }

  statValue(tile: any): string {
    const v = this.stats?.[tile.key];
    if (v === null || v === undefined) return '–';
    if (tile.format === 'percent') return `${v}%`;
    if (tile.format === 'money') return `${this.cp.currency().code} ${Number(v).toLocaleString()}`;   // v1.14.0
    if (tile.format === 'days') return `${v} days`;
    return String(v);
  }

  trackById(_: number, r: any): any {
    return r.id;
  }

  keys(o: any): string[] {
    return Object.keys(o || {});
  }

  noop(): void {}
}
