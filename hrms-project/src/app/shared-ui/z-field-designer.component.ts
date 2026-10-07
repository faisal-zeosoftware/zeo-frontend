import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { ZFieldInputComponent } from './z-field-input.component';
import { DesignField, DesignerAdapter, FIELD_TYPES, bySection, hasOptions, typeLabel } from './field-types';

/** Form designer for one screen: add, edit, order and preview the screen's extra fields. */
@Component({
  selector: 'z-field-designer',
  standalone: true,
  imports: [CommonModule, MatIconModule, ZFieldInputComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zd-modal" (click)="$event.target === $event.currentTarget && close()">
    <div class="zd" role="dialog" aria-modal="true" aria-labelledby="zd-title">
      <header class="zd-h">
        <div><h3 id="zd-title">Form designer{{ adapter ? ' · ' + adapter.title : '' }}</h3><span class="zr-muted">{{ subtitle }}</span></div>
        <span class="zr-grow"></span>
        <button type="button" class="zr-ic" (click)="close()" aria-label="Close"><mat-icon>close</mat-icon></button>
      </header>
      <div class="zd-body">
        <!-- field list -->
        <aside class="zd-list">
          <div class="zd-list-h"><b>Fields</b><span class="zr-grow"></span><button type="button" class="zr-btn primary sm" (click)="startNew()"><mat-icon>add</mat-icon>Add field</button></div>
          <p class="zr-muted" *ngIf="!fields.length">No extra fields yet.</p>
          <ol>
            <li *ngFor="let f of fields; let i = index" [class.on]="edit?.id === f.id" [class.off]="!f.active" draggable="true"
                (dragstart)="dragFrom = i" (dragover)="$event.preventDefault()" (drop)="dropAt(i)">
              <mat-icon class="zd-grip" aria-hidden="true">drag_indicator</mat-icon>
              <button type="button" class="zd-pick" (click)="pick(f)">
                <span>{{ f.label }}<span class="zf-req" *ngIf="f.required"> *</span></span>
                <small>{{ typeName(f.field_type) }}{{ f.section ? ' · ' + f.section : '' }}{{ f.active ? '' : ' · hidden' }}</small></button>
              <span class="zd-move">
                <button type="button" class="zr-ic" [disabled]="i === 0" (click)="move(i, -1)" aria-label="Move up"><mat-icon>arrow_upward</mat-icon></button>
                <button type="button" class="zr-ic" [disabled]="i === fields.length - 1" (click)="move(i, 1)" aria-label="Move down"><mat-icon>arrow_downward</mat-icon></button></span>
            </li>
          </ol>
        </aside>

        <!-- editor -->
        <section class="zd-edit" *ngIf="edit; else hint">
          <h4>{{ edit.id ? 'Edit field' : 'New field' }}</h4>
          <div class="zf-label">Type</div>
          <div class="zd-types" role="radiogroup" aria-label="Field type">
            <button type="button" *ngFor="let t of types" class="zd-type" [class.on]="edit.field_type === t.value" role="radio" [attr.aria-checked]="edit.field_type === t.value" (click)="edit.field_type = t.value" [title]="t.hint">
              <mat-icon>{{ t.icon }}</mat-icon><span>{{ t.label }}</span></button>
          </div>
          <div class="zr-grid">
            <div class="zf"><label class="zf-label" for="zd-label">Label *</label><input id="zd-label" class="zf-in" [value]="edit.label" (input)="edit.label = $any($event.target).value" placeholder="e.g. Cost centre"></div>
            <div class="zf"><label class="zf-label" for="zd-sec">Section</label><input id="zd-sec" class="zf-in" [attr.list]="'zd-secs'" [value]="edit.section || ''" (input)="edit.section = $any($event.target).value" placeholder="e.g. Finance">
              <datalist id="zd-secs"><option *ngFor="let s of sections" [value]="s"></option></datalist></div>
            <div class="zf zf-wide" *ngIf="needsOptions()"><label class="zf-label" for="zd-opts">Options (one per line) *</label>
              <textarea id="zd-opts" class="zf-in" rows="4" [value]="(edit.options || []).join('\\n')" (input)="setOptions($any($event.target).value)" placeholder="CC-100&#10;CC-200"></textarea></div>
            <div class="zf zf-wide"><label class="zf-label" for="zd-help">Help text</label><input id="zd-help" class="zf-in" [value]="edit.help_text || ''" (input)="edit.help_text = $any($event.target).value" placeholder="Shown under the field"></div>
            <div class="zf" *ngIf="!adapter"><label class="zf-label" for="zd-def">Default value</label><input id="zd-def" class="zf-in" [value]="edit.default || ''" (input)="edit.default = $any($event.target).value"></div>
            <div class="zf" *ngIf="adapter"><label class="zf-label" for="zd-ph">Placeholder</label><input id="zd-ph" class="zf-in" [value]="edit.placeholder || ''" (input)="edit.placeholder = $any($event.target).value" placeholder="Hint inside the empty field"></div>
            <div class="zf zd-flags">
              <label class="zf-check"><input type="checkbox" [checked]="edit.required" (change)="edit.required = $any($event.target).checked"><span>Required</span></label>
              <ng-container *ngIf="!adapter">
              <label class="zf-check"><input type="checkbox" [checked]="edit.show_in_list !== false" (change)="edit.show_in_list = $any($event.target).checked"><span>Show as a list column</span></label>
              <label class="zf-check"><input type="checkbox" [checked]="edit.active !== false" (change)="edit.active = $any($event.target).checked"><span>Active</span></label>
              </ng-container>
            </div>
          </div>
          <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
          <div class="zr-row">
            <button type="button" class="zr-btn danger" *ngIf="edit.id" (click)="remove()"><mat-icon>delete_outline</mat-icon>Delete field</button>
            <span class="zr-grow"></span>
            <button type="button" class="zr-btn" (click)="edit = null">Cancel</button>
            <button type="button" class="zr-btn primary" [disabled]="busy" (click)="save()">{{ edit.id ? 'Save field' : 'Add field' }}</button>
          </div>
        </section>
        <ng-template #hint><section class="zd-edit zd-hint"><mat-icon>dynamic_form</mat-icon><p>Pick a field to change it, or add a new one. Drag fields, or use the arrows, to set their order. Fields with the same section are shown together.</p></section></ng-template>

        <!-- preview -->
        <section class="zd-prev" aria-label="Preview">
          <h4>Preview</h4>
          <p class="zr-muted" *ngIf="!previewFields.length">The form's extra fields appear here.</p>
          <ng-container *ngFor="let g of previewGroups; trackBy: bySec">
            <div class="zr-sec" *ngIf="g.section">{{ g.section }}</div>
            <div class="zr-grid"><z-field-input *ngFor="let f of g.fields; trackBy: byName" [field]="f" [value]="sample[f.name] ?? f.default ?? null" (valueChange)="sample[f.name] = $event"
              [wide]="f.field_type === 'textarea' || f.field_type === 'multiselect'"></z-field-input></div>
          </ng-container>
        </section>
      </div>
    </div>
  </div>`,
})
export class ZFieldDesignerComponent implements OnInit, OnDestroy {
  @Input() screen: string | null = null;
  @Input() screenName = '';
  /** Employee custom fields (or any other store); default: the screen's extra fields. */
  @Input() adapter?: DesignerAdapter;
  @Output() closed = new EventEmitter<boolean>();
  fields: any[] = [];
  edit: any = null;
  types = FIELD_TYPES;
  busy = false; error = ''; changed = false;
  sample: Record<string, any> = {};
  dragFrom = -1;
  bySec = (_: number, g: { section: string }) => g.section;
  byName = (_: number, f: any) => f.id || f.name;

  constructor(private rec: ZRecordService, private cd: ChangeDetectorRef, private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    // the dialog sits on the page body, so no parent layout can clip or shift it
    document.body.appendChild(this.el.nativeElement);
    this.load();
  }

  ngOnDestroy(): void { this.el.nativeElement.remove(); }

  get subtitle(): string {
    return this.adapter
      ? 'Custom fields of the employee screens: create, edit and details pages, list columns and the import template'
      : `${this.screenName || this.screen} · extra fields show in this screen's form, list, export and import template`;
  }

  async load(): Promise<void> {
    try {
      if (this.adapter) { this.fields = await this.adapter.load(); }
      else if (this.screen) { const r = await firstValueFrom(this.rec.fields(this.screen)); this.fields = r.fields || []; }
    } catch (e: any) { this.error = e?.error?.detail || 'This screen cannot get extra fields.'; }
    this.cd.detectChanges();
  }

  get sections(): string[] { return Array.from(new Set(this.fields.map(f => f.section).filter(Boolean))); }
  get previewFields(): DesignField[] {
    const list = this.fields.filter(f => f.active !== false && (!this.edit || f.id !== this.edit.id));
    if (this.edit && this.edit.label && this.edit.active !== false) { list.push({ ...this.edit, name: this.edit.name || '_new', order: this.edit.order ?? 99999 }); }
    return list;
  }
  get previewGroups() { return bySection(this.previewFields); }
  typeName(v: string): string { return typeLabel(v); }
  needsOptions(): boolean { return hasOptions(this.edit?.field_type); }
  setOptions(text: string): void { this.edit.options = text.split('\n').map(s => s.trim()).filter(Boolean); }

  startNew(): void { this.error = ''; this.edit = { field_type: 'text', label: '', options: [], required: false, section: this.sections[0] || '', help_text: '', default: '', show_in_list: true, active: true }; }
  pick(f: any): void { this.error = ''; this.edit = { ...f, options: [...(f.options || [])] }; }

  async save(): Promise<void> {
    if (!this.edit.label.trim()) { this.error = 'Give the field a label.'; return; }
    if (this.needsOptions() && !(this.edit.options || []).length) { this.error = 'Add at least one option.'; return; }
    this.busy = true; this.error = '';
    try {
      if (this.adapter) {
        if (this.edit.id) { await this.adapter.save(this.edit); } else { await this.adapter.add({ ...this.edit, order: (this.fields.length + 1) * 10 }); }
      } else if (this.edit.id) { await firstValueFrom(this.rec.saveField(this.edit)); } else { await firstValueFrom(this.rec.addField({ ...this.edit, screen: this.screen })); }
      this.changed = true; this.edit = null; await this.load();
    } catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
    this.busy = false; this.cd.detectChanges();
  }

  async remove(): Promise<void> {
    if (!confirm(`Delete “${this.edit.label}”? The values entered in it are deleted too.`)) { return; }
    try { if (this.adapter) { await this.adapter.remove(this.edit); } else { await firstValueFrom(this.rec.deleteField(this.edit.id)); } this.changed = true; this.edit = null; await this.load(); }
    catch (e: any) { this.error = e?.error?.detail || 'Not deleted.'; }
  }

  move(i: number, d: number): void { const [f] = this.fields.splice(i, 1); this.fields.splice(i + d, 0, f); this.saveOrder(); }
  dropAt(i: number): void { if (this.dragFrom < 0 || this.dragFrom === i) { return; } const [f] = this.fields.splice(this.dragFrom, 1); this.fields.splice(i, 0, f); this.dragFrom = -1; this.saveOrder(); }
  private async saveOrder(): Promise<void> {
    this.fields.forEach((f, i) => f.order = (i + 1) * 10);
    try {
      if (this.adapter) { await this.adapter.reorder(this.fields); } else { await firstValueFrom(this.rec.saveField({ order: this.fields.map(f => f.id) })); }
      this.changed = true;
    } catch { this.error = 'The order was not saved.'; }
    this.cd.detectChanges();
  }

  close(): void { this.closed.emit(this.changed); }
}
