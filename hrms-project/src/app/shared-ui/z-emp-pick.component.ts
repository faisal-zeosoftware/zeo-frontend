// v1.40.1
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild, ViewEncapsulation, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { environment } from '../../environments/environment';

/**
 * v1.40.1: one searchable employee picker for the payroll / document screens (a plain <select> cut the names off
 * and could not be searched). Shows "CODE – Name"; the list is searched through
 * `/employee/api/emplist/?search=&page_size=` so a company with thousands of employees still picks one quickly.
 * The list is drawn `position: fixed` (not inside the form), so a modal's overflow does not clip it.
 *
 *   <z-emp-pick [(ngModel)]="employee" (picked)="onEmp($event)"></z-emp-pick>   value = employee id (number)
 *
 * `employees` may hold an already loaded list (filtered locally; a search still asks the API when the list is
 * larger than `pageSize`). `valueKey` = 'id' (default) or 'emp_code'.
 */
@Component({
  selector: 'z-emp-pick',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZEmpPickComponent), multi: true }],
  template: `
  <div class="zep" [class.zep-open]="open" [class.zep-disabled]="disabled">
    <input #box type="text" class="form-control zep-in" autocomplete="off" role="combobox" [attr.aria-expanded]="open"
           [placeholder]="placeholder" [disabled]="disabled" [value]="text" [attr.id]="inputId || null" [attr.name]="name || null"
           (focus)="onFocus()" (input)="onType($any($event.target).value)" (keydown)="onKey($event)" (blur)="onBlur()">
    <button type="button" class="zep-clear" *ngIf="value != null && value !== '' && !disabled" aria-label="Clear" (mousedown)="$event.preventDefault(); clear()">×</button>
    <span class="zep-arrow" (mousedown)="$event.preventDefault(); toggle()">▾</span>
    <div class="zep-list" *ngIf="open" [style.top.px]="pos.top" [style.left.px]="pos.left" [style.width.px]="pos.width" [style.maxHeight.px]="pos.maxH" role="listbox">
      <div class="zep-item zep-muted" *ngIf="loading">Searching…</div>
      <div class="zep-item zep-muted" *ngIf="!loading && !rows.length">No employees found</div>
      <div class="zep-item" *ngFor="let e of rows; let i = index" role="option" [class.zep-active]="i === hi" [attr.aria-selected]="isValue(e)"
           [class.zep-selected]="isValue(e)" (mousedown)="$event.preventDefault(); pick(e)" (mousemove)="hi = i">
        <span class="zep-code">{{ e.emp_code }}</span><span class="zep-name">{{ nameOf(e) }}</span>
        <small class="zep-sub" *ngIf="e.emp_branch_id || e.emp_dept_id">{{ e.emp_branch_id }}<ng-container *ngIf="e.emp_branch_id && e.emp_dept_id"> · </ng-container>{{ e.emp_dept_id }}</small>
      </div>
      <div class="zep-item zep-muted" *ngIf="!loading && more">Showing the first {{ rows.length }} of {{ total }} – type more to narrow the list</div>
    </div>
  </div>`,
  styles: [`
    .zep { position: relative; width: 100%; }
    .zep .zep-in { width: 100%; padding-right: 44px; text-overflow: ellipsis; }
    .zep .zep-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666; user-select: none; }
    .zep .zep-clear { position: absolute; right: 26px; top: 50%; transform: translateY(-50%); border: 0; background: none; color: #888; font-size: 16px; line-height: 1; cursor: pointer; padding: 0 2px; }
    .zep .zep-clear:hover { color: #c00; }
    .zep-list { position: fixed; z-index: 100000; background: #fff; border: 1px solid #cfd4dc; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.18); overflow-y: auto; min-width: 260px; }
    .zep-item { padding: 7px 12px; cursor: pointer; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 8px; font-size: 13px; line-height: 1.35; color: #222; white-space: normal; }
    .zep-item .zep-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #4b4b4b; min-width: 70px; }
    .zep-item .zep-name { font-weight: 500; flex: 1 1 auto; }
    .zep-item .zep-sub { flex-basis: 100%; color: #777; font-size: 11px; }
    .zep-item.zep-active { background: #eef0ff; }
    .zep-item.zep-selected { background: #e8f5ec; }
    .zep-item.zep-muted { color: #888; cursor: default; font-style: italic; }
  `]
})
export class ZEmpPickComponent implements ControlValueAccessor, OnDestroy {
  @Input() employees: any[] | null = null;      // preloaded list (optional)
  @Input() placeholder = 'Search employee by name or code';
  @Input() valueKey: 'id' | 'emp_code' = 'id';
  @Input() pageSize = 30;
  @Input() inputId = '';
  @Input() name = '';
  @Input() disabled = false;
  @Input() activeOnly = true;
  @Output() picked = new EventEmitter<any>();
  @ViewChild('box') box!: ElementRef<HTMLInputElement>;

  value: any = null;
  text = '';
  open = false;
  loading = false;
  rows: any[] = [];
  total = 0;
  more = false;
  hi = -1;
  pos = { top: 0, left: 0, width: 0, maxH: 280 };
  private q = '';
  private timer: any;
  private seq = 0;
  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};
  private cache = new Map<string, any>();   // id -> employee (for the label of a value set before any search)

  constructor(private http: HttpClient, private el: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void { clearTimeout(this.timer); }

  // ---- ControlValueAccessor
  writeValue(v: any): void { this.value = v ?? null; this.q = ''; this.label(); }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  nameOf(e: any): string {
    return (e?.emp_name || [e?.emp_first_name, e?.emp_last_name].filter(Boolean).join(' ') || '').trim();
  }
  isValue(e: any): boolean { return this.value != null && this.value !== '' && String(e?.[this.valueKey]) === String(this.value); }

  private find(v: any): any {
    if (v == null || v === '') { return null; }
    const k = String(v);
    return (this.employees || []).find(e => String(e?.[this.valueKey]) === k || (this.valueKey === 'id' && String(e?.emp_code) === k))
      || this.rows.find(e => String(e?.[this.valueKey]) === k) || this.cache.get(k) || null;
  }

  /** The text box shows the chosen employee as "CODE – Name"; a value set before the list is known is looked up. */
  private label(): void {
    const e = this.find(this.value);
    if (e) { this.text = `${e.emp_code || ''}${e.emp_code ? ' – ' : ''}${this.nameOf(e)}`.trim(); return; }
    if (this.value == null || this.value === '') { this.text = ''; return; }
    this.text = String(this.value);
    if (this.valueKey === 'id' && /^\d+$/.test(String(this.value))) {
      this.http.get<any>(`${environment.apiBaseUrl}/employee/api/emplist/${this.value}/?schema=${encodeURIComponent(this.schema)}`)
        .subscribe({ next: e => { if (e && e.id) { this.cache.set(String(e.id), e); if (String(this.value) === String(e.id)) { this.label(); } } }, error: () => {} });
    }
  }

  private get schema(): string { return localStorage.getItem('selectedSchema') || ''; }
  private get branchParam(): string {
    try { const ids = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]'); return Array.isArray(ids) && ids.length ? `&branch_id=[${ids.join(',')}]` : ''; } catch { return ''; }
  }

  // ---- opening / closing
  onFocus(): void { this.show(); }
  toggle(): void { if (this.disabled) { return; } this.open ? this.hide() : (this.box.nativeElement.focus(), this.show()); }
  private show(): void {
    if (this.disabled || this.open) { return; }
    this.open = true; this.hi = -1; this.place();
    this.search(this.q, true);
  }
  private hide(): void { this.open = false; this.q = ''; this.label(); }
  onBlur(): void { this.onTouched(); setTimeout(() => { if (this.open && document.activeElement !== this.box?.nativeElement) { this.hide(); } }, 150); }
  clear(): void { this.value = null; this.q = ''; this.text = ''; this.onChange(null); this.picked.emit(null); this.box?.nativeElement.focus(); }

  @HostListener('window:resize') @HostListener('window:scroll', ['$event'])
  onWin(): void { if (this.open) { this.place(); } }
  @HostListener('document:scroll', ['$event'])
  onAnyScroll(ev: Event): void { if (this.open && !(ev.target as HTMLElement)?.closest?.('.zep-list')) { this.place(); } }

  private place(): void {
    const r = this.box?.nativeElement.getBoundingClientRect(); if (!r) { return; }
    const below = window.innerHeight - r.bottom - 8, above = r.top - 8;
    const maxH = Math.max(140, Math.min(320, below >= 180 ? below : Math.max(below, above)));
    const width = Math.max(r.width, Math.min(420, window.innerWidth - r.left - 8));
    const top = below >= 180 || below >= above ? r.bottom + 2 : r.top - 2 - maxH;
    this.pos = { top, left: Math.max(4, Math.min(r.left, window.innerWidth - width - 4)), width, maxH };
  }

  // ---- typing / keys
  onType(v: string): void {
    this.q = v; this.text = v; this.hi = -1;
    if (!this.open) { this.open = true; this.place(); }
    clearTimeout(this.timer); this.timer = setTimeout(() => this.search(v, false), 220);
  }
  onKey(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); if (!this.open) { this.show(); } this.hi = Math.min(this.rows.length - 1, this.hi + 1); this.scrollTo(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); this.hi = Math.max(0, this.hi - 1); this.scrollTo(); }
    else if (ev.key === 'Enter') { if (this.open && this.rows[this.hi >= 0 ? this.hi : 0]) { ev.preventDefault(); this.pick(this.rows[this.hi >= 0 ? this.hi : 0]); } }
    else if (ev.key === 'Escape') { if (this.open) { ev.stopPropagation(); this.hide(); } }
    else if (ev.key === 'Tab') { this.hide(); }
  }
  private scrollTo(): void {
    setTimeout(() => { const it = this.el.nativeElement.querySelectorAll('.zep-item')[this.hi + 0] as HTMLElement; it?.scrollIntoView?.({ block: 'nearest' }); });
  }

  pick(e: any): void {
    const v = e?.[this.valueKey] ?? null;
    this.cache.set(String(v), e);
    this.value = v; this.q = '';
    this.onChange(v); this.picked.emit(e);
    this.open = false; this.label();
  }

  // ---- data
  private search(q: string, initial: boolean): void {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const local = this.employees && this.employees.length ? this.employees.filter(e => this.activeOnly ? (e.is_active === undefined || e.is_active === null || e.is_active === true) : true) : null;
    if (local && (local.length <= this.pageSize * 20 || !words.length)) {
      // a preloaded list: filtered here (fast, works offline); the API is asked only for very large lists
      const hit = words.length ? local.filter(e => { const s = `${e.emp_code || ''} ${this.nameOf(e)}`.toLowerCase(); return words.every(w => s.includes(w)); }) : local;
      this.total = hit.length; this.rows = hit.slice(0, this.pageSize * 4); this.more = hit.length > this.rows.length; this.loading = false;
      return;
    }
    const id = ++this.seq; this.loading = true;
    const url = `${environment.apiBaseUrl}/employee/api/emplist/?schema=${encodeURIComponent(this.schema)}${this.branchParam}&page_size=${this.pageSize}&search=${encodeURIComponent(q.trim())}`;
    this.http.get<any>(url).subscribe({
      next: d => {
        if (id !== this.seq) { return; }
        const rows = Array.isArray(d) ? d : (d?.results || []);
        this.rows = rows; this.total = Array.isArray(d) ? rows.length : (d?.count ?? rows.length); this.more = this.total > rows.length; this.loading = false;
        rows.forEach((e: any) => this.cache.set(String(e?.[this.valueKey]), e));
        if (initial && !this.q) { this.label(); }
      },
      error: () => { if (id === this.seq) { this.loading = false; this.rows = []; this.total = 0; this.more = false; } }
    });
  }
}
