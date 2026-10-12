import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * v1.15.0 – "Translate" button + dialog for master records (department, designation, leave type …), like Odoo's
 * translatable fields. One row per translatable field and active language; saved through /translations/api/record/.
 *
 *   <z-translate endpoint="/organisation/api/Department/" [recordId]="row.id"></z-translate>
 *   <z-translate model="calendars.leave_type" [recordId]="id" (saved)="reload()"></z-translate>
 *
 * The button only shows for record types that can be translated and when the company has another language than English.
 */
interface RegModel { model: string; label: string; fields: { field: string; label: string }[]; endpoints: string[]; }
interface Registry { models: RegModel[]; languages: { code: string; name: string; english_name: string; dir: string }[]; }
interface TrValue { value: string; outdated: boolean; standard: boolean; id: number | null; }
interface RecordTr {
  model: string; model_label: string; record_id: number; record: string; can_edit: boolean;
  languages: { code: string; name: string; english_name: string; dir: string }[];
  fields: { field: string; label: string; original: string; translations: Record<string, TrValue> }[];
}

let REGISTRY$: Observable<Registry | null> | null = null;
let REGISTRY_SCHEMA = '';

@Component({
  selector: 'z-translate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button *ngIf="available" type="button" class="zt-btn" [class.zt-small]="small" (click)="open($event)"
            title="Translate the name into the company's other languages">
      <span class="zt-ico" aria-hidden="true">文A</span><span *ngIf="!iconOnly">Translate</span>
    </button>
    <div class="zt-back" *ngIf="show" (click)="close()">
      <div class="zt-dlg" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="zt-head">
          <h3>Translate {{ data?.model_label || 'record' }}<span *ngIf="data?.record" data-no-translate>: {{ data?.record }}</span></h3>
          <button type="button" class="zt-x" (click)="close()" aria-label="Close">×</button>
        </div>
        <div class="zt-body">
          <p class="zt-hint">The English name stays as it is. Users who work in another language see the translation in lists, forms and reports.</p>
          <div *ngIf="loading" class="zt-muted">Loading…</div>
          <ng-container *ngIf="data && !loading">
            <div class="zt-field" *ngFor="let f of data.fields">
              <div class="zt-label">{{ f.label }}</div>
              <div class="zt-row">
                <span class="zt-lang">English</span>
                <span class="zt-orig" data-no-translate dir="ltr">{{ f.original || '–' }}</span>
              </div>
              <div class="zt-row" *ngFor="let l of data.languages">
                <span class="zt-lang" data-no-translate>{{ l.name }}</span>
                <textarea *ngIf="f.field === 'body'; else oneLine" class="zt-input" rows="4" data-no-translate [attr.dir]="l.dir"
                          [(ngModel)]="edit[f.field][l.code]" [disabled]="!data.can_edit"
                          [placeholder]="'Translation of the ' + f.label.toLowerCase()"></textarea>
                <ng-template #oneLine>
                  <input class="zt-input" data-no-translate [attr.dir]="l.dir" [(ngModel)]="edit[f.field][l.code]" [disabled]="!data.can_edit"
                         [placeholder]="'Translation of the ' + f.label.toLowerCase()">
                </ng-template>
                <span class="zt-tag" *ngIf="f.translations[l.code]?.outdated" title="The English name changed after this translation was made">Check: English changed</span>
              </div>
            </div>
            <div class="zt-muted" *ngIf="!data.can_edit">You can see the translations. Only users who may change this record can edit them.</div>
          </ng-container>
          <pre class="zt-err" *ngIf="error">{{ error }}</pre>
          <div class="zt-ok" *ngIf="done">Translations saved.</div>
        </div>
        <div class="zt-foot">
          <button type="button" class="zt-b2" (click)="close()">Close</button>
          <button type="button" class="zt-b1" *ngIf="data?.can_edit" [disabled]="saving" (click)="save()">{{ saving ? 'Saving…' : 'Save translations' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
    .zt-btn { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #c9c4f2; background: #f6f5ff; color: #3b2fc9;
      border-radius: 6px; padding: 4px 10px; font-size: 13px; cursor: pointer; line-height: 1.4; }
    .zt-btn:hover { background: #ebe8ff; }
    .zt-small { padding: 2px 7px; font-size: 12px; }
    .zt-ico { font-size: 11px; font-weight: 700; letter-spacing: -1px; }
    .zt-back { position: fixed; inset: 0; background: rgba(20, 18, 40, .45); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .zt-dlg { background: #fff; border-radius: 10px; width: 560px; max-width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 12px 40px rgba(0,0,0,.25); }
    .zt-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #eee; }
    .zt-head h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1b1640; }
    .zt-x { border: 0; background: none; font-size: 22px; cursor: pointer; color: #666; }
    .zt-body { padding: 14px 18px; overflow: auto; }
    .zt-hint { margin: 0 0 12px; color: #6b7185; font-size: 13px; }
    .zt-field { margin-bottom: 14px; }
    .zt-label { font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #262a3d; }
    .zt-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
    .zt-lang { width: 90px; flex: none; font-size: 13px; color: #6b7185; padding-top: 6px; }
    .zt-orig { flex: 1; padding: 6px 0; font-size: 14px; }
    .zt-input { flex: 1; min-width: 200px; border: 1px solid #ccd; border-radius: 6px; padding: 6px 8px; font-size: 14px; font-family: inherit; }
    .zt-tag { font-size: 11px; color: #9a5b00; background: #fff4e0; border-radius: 4px; padding: 2px 6px; }
    .zt-muted { color: #6b7185; font-size: 13px; }
    .zt-err { color: #b00020; white-space: pre-wrap; font-family: inherit; font-size: 13px; margin: 8px 0 0; }
    .zt-ok { color: #1b7f3b; font-size: 13px; margin-top: 8px; }
    .zt-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px; border-top: 1px solid #eee; }
    .zt-b1 { background: #5b4fe0; color: #fff; border: 0; border-radius: 6px; padding: 7px 14px; cursor: pointer; }
    .zt-b1[disabled] { opacity: .6; }
    .zt-b2 { background: #fff; color: #333; border: 1px solid #ccd; border-radius: 6px; padding: 7px 14px; cursor: pointer; }
  `],
})
export class ZTranslateComponent implements OnChanges {
  /** API endpoint of the record list, e.g. /organisation/api/Department/ */
  @Input() endpoint = '';
  /** or the model label, e.g. OrganisationManager.dept_master */
  @Input() model = '';
  @Input() recordId: any = null;
  @Input() small = false;
  @Input() iconOnly = false;

  available = false;
  show = false;
  loading = false;
  saving = false;
  done = false;
  error = '';
  data: RecordTr | null = null;
  edit: Record<string, Record<string, string>> = {};

  constructor(private http: HttpClient) {}

  private get base(): string { return environment.apiBaseUrl; }
  private get schema(): string { try { return localStorage.getItem('selectedSchema') || ''; } catch { return ''; } }

  private registry(): Observable<Registry | null> {
    if (!REGISTRY$ || REGISTRY_SCHEMA !== this.schema) {
      REGISTRY_SCHEMA = this.schema;
      REGISTRY$ = this.http.get<Registry>(`${this.base}/translations/api/registry/`, { params: new HttpParams().set('schema', this.schema) }).pipe(
        catchError(() => of(null)), shareReplay(1));
    }
    return REGISTRY$;
  }

  ngOnChanges(): void {
    if (this.recordId === null || this.recordId === undefined || this.recordId === '') { this.available = false; return; }
    const ep = norm(this.endpoint);
    this.registry().pipe(map(r => !!r && r.languages.length > 0 && r.models.some(m =>
      (this.model && m.model === this.model) || (!!ep && m.endpoints.some(e => norm(e) === ep))))).subscribe(ok => this.available = ok);
  }

  open(ev?: Event): void {
    ev?.stopPropagation();
    this.show = true; this.done = false; this.error = ''; this.load();
  }

  close(): void { this.show = false; }

  private target(): Record<string, any> {
    return this.model ? { model: this.model, id: this.recordId } : { endpoint: this.endpoint, id: this.recordId };
  }

  private fillEdit(d: RecordTr): void {
    this.data = d;
    this.edit = {};
    for (const f of d.fields) {
      this.edit[f.field] = {};
      for (const l of d.languages) { this.edit[f.field][l.code] = f.translations[l.code]?.value || ''; }
    }
  }

  load(): void {
    this.loading = true;
    let p = new HttpParams().set('schema', this.schema);
    Object.entries(this.target()).forEach(([k, v]) => { p = p.set(k, String(v)); });
    this.http.get<RecordTr>(`${this.base}/translations/api/record/`, { params: p }).subscribe({
      next: d => { this.fillEdit(d); this.loading = false; },
      error: e => { this.loading = false; this.error = errText(e); },
    });
  }

  save(): void {
    if (!this.data) { return; }
    this.saving = true; this.error = ''; this.done = false;
    const body = { ...this.target(), translations: this.edit };
    this.http.put<RecordTr>(`${this.base}/translations/api/record/`, body, { params: new HttpParams().set('schema', this.schema) }).subscribe({
      next: d => { this.fillEdit(d); this.saving = false; this.done = true; },
      error: e => { this.saving = false; this.error = errText(e); },
    });
  }
}

function norm(ep: string): string {
  const p = String(ep || '').split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  return p ? ('/' + p.replace(/^\/+/, '').replace(/\/+$/, '') + '/').toLowerCase() : '';
}

function errText(e: any): string {
  const b = e?.error;
  if (b && typeof b === 'object' && b.detail) { return String(b.detail); }
  if (e?.status === 0) { return 'The server could not be reached. Check the connection and try again.'; }
  return 'The translations could not be loaded or saved (' + (e?.status || 'error') + '). Try again.';
}
