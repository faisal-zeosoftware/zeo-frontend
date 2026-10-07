import { Component, Input, OnInit } from '@angular/core';
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

type Opt = { value: any; label: string };

@Component({
  selector: 'app-hr-crud-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ZListDirective, ZOrgPickDirective],
  templateUrl: './crud-page.component.html',
  styleUrls: ['../hr-shared.css'],
})
export class CrudPageComponent implements OnInit {
  @Input() config!: PageConfig;

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

  // detail panel
  detail: any = null;
  childRows: Record<string, any[]> = {};

  // document view
  docHtml: SafeHtml | null = null;

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
  ) {}

  ngOnInit(): void {
    if (!this.config) {
      this.config = this.route.snapshot.data['config'];
    }
    this.route.data.subscribe(d => {
      if (d['config'] && d['config'] !== this.config) {
        this.config = d['config'];
        this.reset();
      }
    });
    this.reset();
  }

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
        this.rows = rows;
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
    this.formFiles = {};
    this.formFields.forEach(f => {
      const v = row?.[f.key];
      if (f.type === 'file') return;
      if (v !== undefined && v !== null) {
        this.formModel[f.key] = f.type === 'datetime' && typeof v === 'string' ? v.slice(0, 16) : (f.type === 'json' ? JSON.stringify(v) : v);
      } else if (f.default !== undefined) {
        this.formModel[f.key] = typeof f.default === 'function' ? f.default() : f.default;
      } else if (f.type === 'multiselect' || f.type === 'chips') {
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
      if (v === null && (f.type === 'multiselect' || f.type === 'chips')) v = [];
      if (v === null && !this.formEditId && !f.required) continue;
      clean[f.key] = v;
    }
    Object.assign(clean, this.formFixed || {});
    if (!multipart) return clean;
    const fd = new FormData();
    Object.entries(clean).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        const field = fields.find(x => x.key === k);
        if (field?.type === 'chips') fd.append(k, JSON.stringify(v));
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
    const req = this.formEditId ? this.api.update(this.formEndpoint, this.formEditId, body) : this.api.create(this.formEndpoint, body);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.formOpen = false;
        this.showOk('Saved.');
        this.afterSave?.();
        this.loadStats();
      },
      error: err => { this.saving = false; this.formErrors = ModuleApiService.errorText(err); },
    });
  }

  remove(row: any, ev?: Event): void {
    ev?.stopPropagation();
    if (!confirm(`Delete this ${this.singular().toLowerCase()}?`)) return;
    this.api.remove(this.config.endpoint, row.id).subscribe({
      next: () => { this.showOk('Deleted.'); if (this.detail?.id === row.id) this.detail = null; this.load(); },
      error: err => this.showError(err),
    });
  }

  // ---------------- actions ----------------
  async runAction(a: ActionConfig, row: any | null, endpoint = this.config.endpoint, after?: () => void, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    if (a.route) { this.router.navigateByUrl(a.route(row)); return; }
    if (a.confirm && !confirm(a.confirm)) return;
    let body: any = a.body ? a.body(row, this.filters) : {};
    if (a.prompt?.length) {
      const answer = await this.ask(a.label, a.prompt);
      if (!answer) return;
      body = { ...body, ...answer };
    }
    this.api.action(endpoint, row ? row.id : null, a.action || '', body, a.method || 'post').subscribe({
      next: (res: any) => {
        if (a.document) {
          this.docHtml = this.sanitizer.bypassSecurityTrustHtml(a.document(res));
          return;
        }
        this.showOk(res?.detail || `${a.label}: done.`);
        after ? after() : this.load();
        this.loadStats();
      },
      error: err => this.showError(err),
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

  removeChild(ch: ChildConfig, row: any): void {
    if (!confirm('Delete this line?')) return;
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
    if (tile.format === 'money') return `AED ${Number(v).toLocaleString()}`;
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
