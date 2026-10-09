import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ESS_BASE, EssApiService, POLICY_LABEL, money } from './ess-api.service';

interface FormField { key: string; label: string; type: string; policy: string; value: any; options?: any[]; source?: string; readonly?: boolean; }
interface FormState { title: string; intro: string; group: string; action: 'create' | 'update' | 'delete'; recordId: number | null;
  fields: FormField[]; values: Record<string, any>; files: File[]; reason: string; needsHr: boolean; allowFiles: boolean; busy: boolean; err: string; }

/** v1.13.0 – My profile: every group read-only, inline edit of "self" fields, "Request a change" for "request" fields, lock on HR fields. */
@Component({
  selector: 'app-ess-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">My profile</h1>
          <p class="es-desc" *ngIf="p">{{ p.employee }}<span *ngIf="p.manager"> · Reports to {{ p.manager }}</span></p>
        </div>
        <div class="es-actions">
          <button type="button" class="es-btn" (click)="go('my-requests')">My change requests</button>
          <button type="button" class="es-btn" (click)="go('')">Self service home</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="es-legend">
        <span><mat-icon style="color:#0f766e">edit</mat-icon> You can change it</span>
        <span><mat-icon style="color:#3730a3">outbox</mat-icon> Change needs HR approval</span>
        <span><mat-icon style="color:#9aa0b2">lock</mat-icon> Kept by HR</span>
      </div>
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <p class="es-muted" *ngIf="loading">Loading…</p>

      <ng-container *ngIf="p">
        <div class="es-panel" *ngFor="let g of p.groups" [attr.id]="'g-' + g.key">
          <div class="es-h">
            <span>{{ g.label }}</span>
            <span class="es-actions">
              <ng-container *ngIf="g.single && !g.read_only">
                <button type="button" class="es-btn sm" *ngIf="has(g, 'self') && editing !== g.key" (click)="startInline(g)"><mat-icon style="font-size:16px;width:16px;height:16px">edit</mat-icon> Edit</button>
                <button type="button" class="es-btn sm" *ngIf="has(g, 'request')" (click)="openRequest(g)">Request a change</button>
              </ng-container>
              <button type="button" class="es-btn sm" *ngIf="!g.single && !g.read_only && (g.record_policy === 'self' || g.record_policy === 'request')" (click)="openCreate(g)">
                + Add{{ g.record_policy === 'request' ? ' (HR approves)' : '' }}</button>
            </span>
          </div>

          <!-- one record: fields -->
          <ng-container *ngIf="g.single">
            <div class="es-fields">
              <div class="es-field" *ngFor="let f of g.fields">
                <div class="k">{{ f.label }}
                  <mat-icon *ngIf="f.policy === 'hr'" title="Kept by HR">lock</mat-icon>
                  <mat-icon *ngIf="f.policy === 'request'" title="Change needs HR approval" style="color:#3730a3">outbox</mat-icon>
                </div>
                <div class="v" *ngIf="editing === g.key && f.policy === 'self'">
                  <ng-container *ngTemplateOutlet="input; context: { f: f, vals: inline }"></ng-container>
                </div>
                <div class="v" *ngIf="!(editing === g.key && f.policy === 'self')">
                  <span [class.empty]="isEmpty(f.display)">{{ show(f) }}</span>
                </div>
              </div>
            </div>
            <div class="es-actions" style="margin-top:12px" *ngIf="editing === g.key">
              <button type="button" class="es-btn primary" [disabled]="busy" (click)="saveInline(g)">Save</button>
              <button type="button" class="es-btn" (click)="editing = ''">Cancel</button>
            </div>
          </ng-container>

          <!-- many records -->
          <ng-container *ngIf="!g.single && g.key !== 'salary'">
            <div class="es-rows">
              <div class="es-row" *ngFor="let r of g.records">
                <div class="main">
                  <div class="t">{{ title(g, r) }}</div>
                  <div class="s">{{ subtitle(g, r) }}</div>
                </div>
                <div class="r">
                  <span class="es-tag" *ngIf="r.expiry" [ngClass]="r.expiry.state">{{ r.expiry.label }}</span>
                  <button type="button" class="es-btn sm" *ngIf="g.key === 'documents' && r.has_file" (click)="download(r)">Download</button>
                  <button type="button" class="es-btn sm" (click)="openView(g, r)">View</button>
                  <button type="button" class="es-btn sm" *ngIf="editable(r.fields)" (click)="openUpdate(g, r)">{{ g.key === 'documents' ? 'Upload a new copy' : 'Change' }}</button>
                  <button type="button" class="es-btn sm danger" *ngIf="g.record_policy === 'self' || g.record_policy === 'request'" (click)="openDelete(g, r)">Remove</button>
                </div>
              </div>
              <p class="es-muted" *ngIf="!g.records?.length">Nothing recorded yet.</p>
            </div>
          </ng-container>

          <!-- salary: view only -->
          <ng-container *ngIf="g.key === 'salary'">
            <div class="es-scroll">
              <table class="es-table" zPlain>
                <thead><tr><th>Component</th><th>Type</th><th style="text-align:right">Monthly amount</th></tr></thead>
                <tbody>
                  <tr *ngFor="let r of g.rows"><td>{{ r.component }}</td><td>{{ r.type }}</td><td style="text-align:right">{{ m(r.amount) }}</td></tr>
                  <tr *ngIf="!g.rows?.length"><td colspan="3" class="es-muted">No salary structure is set up yet.</td></tr>
                </tbody>
              </table>
            </div>
            <p class="es-muted" style="margin-top:8px" *ngIf="g.totals">Gross {{ m(g.totals.gross) }} · deductions {{ m(g.totals.deductions) }} · net {{ m(g.totals.net) }}. Only HR changes the salary.</p>
          </ng-container>
        </div>
      </ng-container>
    </div>
  </div>
</div>

<!-- shared input -->
<ng-template #input let-f="f" let-vals="vals">
  <ng-container [ngSwitch]="kind(f)">
    <input *ngSwitchCase="'date'" type="date" class="es-input" [(ngModel)]="vals[f.key]" [disabled]="f.readonly">
    <input *ngSwitchCase="'number'" type="number" class="es-input" [(ngModel)]="vals[f.key]" [disabled]="f.readonly">
    <label *ngSwitchCase="'bool'" style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" [(ngModel)]="vals[f.key]" [disabled]="f.readonly"> Yes</label>
    <select *ngSwitchCase="'select'" class="es-input" [(ngModel)]="vals[f.key]" [disabled]="f.readonly">
      <option [ngValue]="null">—</option>
      <option *ngFor="let o of opts(f)" [ngValue]="o.value">{{ o.label }}</option>
    </select>
    <input *ngSwitchCase="'file'" type="file" class="es-input" (change)="pickFile(vals, f.key, $event)" [disabled]="f.readonly">
    <input *ngSwitchCase="'email'" type="email" class="es-input" [(ngModel)]="vals[f.key]" [disabled]="f.readonly">
    <input *ngSwitchCase="'phone'" type="tel" class="es-input" [(ngModel)]="vals[f.key]" placeholder="+971 50 123 4567" [disabled]="f.readonly">
    <input *ngSwitchDefault type="text" class="es-input" [(ngModel)]="vals[f.key]" [disabled]="f.readonly" [attr.dir]="f.key === 'arabic_name' ? 'rtl' : null">
  </ng-container>
</ng-template>

<!-- change / request modal -->
<div class="es-backdrop" *ngIf="form" (click)="form = null">
  <div class="es-modal" (click)="$event.stopPropagation()">
    <h3>{{ form.title }}</h3>
    <p class="es-muted">{{ form.intro }}</p>
    <p class="es-msg err" *ngIf="form.err">{{ form.err }}</p>
    <div class="es-form" *ngIf="form.action !== 'delete'">
      <div *ngFor="let f of form.fields" [class.wide]="f.type === 'file'">
        <label>{{ f.label }} <span *ngIf="f.policy === 'request'" class="es-tag request">HR approves</span><span *ngIf="f.readonly" class="es-tag hr">kept by HR</span></label>
        <ng-container *ngTemplateOutlet="input; context: { f: f, vals: form.values }"></ng-container>
      </div>
    </div>
    <div class="es-form" style="margin-top:10px" *ngIf="form.needsHr">
      <div class="wide">
        <label>Reason for the change</label>
        <textarea [(ngModel)]="form.reason" placeholder="e.g. Renewed passport, new salary account, married on 12 May"></textarea>
      </div>
      <div class="wide" *ngIf="form.allowFiles">
        <label>Supporting documents (optional)</label>
        <input type="file" multiple class="es-input" (change)="pickFiles($event)">
        <div class="hint">Attach the new passport copy, bank letter or certificate so HR can check it.</div>
      </div>
    </div>
    <div class="foot">
      <button type="button" class="es-btn" (click)="form = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="form.busy" (click)="submit()">{{ form.action === 'delete' ? (form.needsHr ? 'Ask HR to remove it' : 'Remove') : (form.needsHr ? 'Send to HR' : 'Save') }}</button>
    </div>
  </div>
</div>

<!-- view a record -->
<div class="es-backdrop" *ngIf="viewing" (click)="viewing = null">
  <div class="es-modal" (click)="$event.stopPropagation()">
    <h3>{{ viewing.title }}</h3>
    <div class="es-fields" style="margin-top:10px">
      <div class="es-field" *ngFor="let f of viewing.fields">
        <div class="k">{{ f.label }} <mat-icon *ngIf="f.policy === 'hr'">lock</mat-icon></div>
        <div class="v"><span [class.empty]="isEmpty(f.display)">{{ show(f) }}</span></div>
      </div>
    </div>
    <div class="foot"><button type="button" class="es-btn" (click)="viewing = null">Close</button></div>
  </div>
</div>`,
})
export class EssProfileComponent implements OnInit {
  p: any = null; loading = false; msg = ''; ok = ''; busy = false;
  editing = ''; inline: Record<string, any> = {};
  form: FormState | null = null; viewing: any = null;
  optionCache: Record<string, any[]> = {};
  m = money; policyLabel = POLICY_LABEL;

  constructor(private api: EssApiService, private router: Router, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try { this.p = await this.api.get('profile/'); this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load your profile.'); }
    this.loading = false; this.cd.detectChanges();
    const g = this.route.snapshot.queryParamMap.get('group');
    if (g) setTimeout(() => document.getElementById('g-' + g)?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  go(path: string): void { this.router.navigate([ESS_BASE + (path ? '/' + path : '')]); }

  has(g: any, pol: string): boolean { return (g.fields || []).some((f: any) => f.policy === pol); }
  editable(fields: any[]): boolean { return (fields || []).some(f => f.policy === 'self' || f.policy === 'request'); }
  isEmpty(v: any): boolean { return v === null || v === undefined || v === ''; }
  show(f: any): string {
    if (this.isEmpty(f.display)) return '—';
    if (f.type === 'bool') return f.display ? 'Yes' : 'No';
    if (f.type === 'file') return String(f.display).split('/').pop() || '';
    return String(f.display);
  }
  kind(f: FormField): string {
    if (f.options?.length || f.source) return 'select';
    if (f.type === 'date') return 'date';
    if (f.type === 'number') return 'number';
    if (f.type === 'bool') return 'bool';
    if (f.type === 'file') return 'file';
    if (f.type === 'email') return 'email';
    if (f.type === 'phone') return 'phone';
    return 'text';
  }
  opts(f: FormField): any[] {
    if (f.options?.length) return f.options;
    if (!f.source) return [];
    if (!this.optionCache[f.source]) {
      this.optionCache[f.source] = [];
      this.api.get('options/', { source: f.source }).then(r => { this.optionCache[f.source!] = r as any[]; this.cd.detectChanges(); }).catch(() => {});
    }
    return this.optionCache[f.source];
  }
  title(g: any, r: any): string {
    const f = (r.fields || []).filter((x: any) => !this.isEmpty(x.display));
    return f.length ? this.show(f[0]) : 'Record';
  }
  subtitle(g: any, r: any): string {
    return (r.fields || []).slice(1, 4).filter((x: any) => !this.isEmpty(x.display) && x.type !== 'file').map((x: any) => `${x.label}: ${this.show(x)}`).join(' · ');
  }

  pickFile(vals: Record<string, any>, key: string, ev: any): void { vals[key] = ev.target.files?.[0] || null; }
  pickFiles(ev: any): void { if (this.form) this.form.files = Array.from(ev.target.files || []); }

  // ---------- inline edit of "self" fields
  startInline(g: any): void {
    this.editing = g.key;
    this.inline = {};
    g.fields.filter((f: any) => f.policy === 'self').forEach((f: any) => (this.inline[f.key] = f.type === 'file' ? null : f.value));
    this.ok = this.msg = '';
  }

  async saveInline(g: any): Promise<void> {
    const data: Record<string, any> = {};
    let file: File | null = null;
    g.fields.filter((f: any) => f.policy === 'self').forEach((f: any) => {
      const v = this.inline[f.key];
      if (f.type === 'file') { if (v) file = v; return; }
      if ((v ?? '') !== (f.value ?? '')) data[f.key] = v;
    });
    if (!Object.keys(data).length && !file) { this.editing = ''; return; }
    this.busy = true;
    try {
      const body = this.body({ group: g.key, action: 'update', record_id: null, data }, file ? [] : [], file ? { emp_profile_pic: file } : {});
      const r: any = await this.api.post('profile/change/', body);
      this.ok = r.message || 'Saved.'; this.msg = ''; this.editing = '';
      await this.load();
    } catch (e: any) { this.msg = EssApiService.error(e, 'Your change could not be saved.'); }
    this.busy = false; this.cd.detectChanges();
  }

  // ---------- modal forms
  private meta(g: any): any[] {
    const first = g.records?.[0]?.fields;
    if (first) return first.map((f: any) => ({ ...f, value: null, display: null }));
    return (this.metaGroups[g.key] || []).map((f: any) => ({ ...f, policy: g.record_policy, value: null }));
  }
  metaGroups: Record<string, any[]> = {};

  async ensureMeta(): Promise<void> {
    if (Object.keys(this.metaGroups).length) return;
    try { const m: any = await this.api.meta(); (m.groups || []).forEach((g: any) => (this.metaGroups[g.key] = g.fields)); } catch { /* lists stay empty */ }
  }

  openRequest(g: any): void {
    const fields = g.fields.filter((f: any) => f.policy === 'request').map((f: any) => ({ ...f, readonly: false }));
    this.form = { title: `Request a change – ${g.label}`, intro: 'HR checks the change before it is saved. You will get a notification with the decision.',
      group: g.key, action: 'update', recordId: null, fields, values: this.valuesOf(fields), files: [], reason: '', needsHr: true, allowFiles: true, busy: false, err: '' };
  }

  async openCreate(g: any): Promise<void> {
    await this.ensureMeta();
    const fields = (this.metaGroups[g.key] || []).map((f: any) => ({ ...f, policy: g.record_policy, value: null, readonly: false }));
    this.form = { title: `Add – ${g.label}`, intro: g.record_policy === 'request' ? 'HR checks new records before they are added to your profile.' : 'The record is added to your profile at once.',
      group: g.key, action: 'create', recordId: null, fields, values: {}, files: [], reason: '', needsHr: g.record_policy === 'request',
      allowFiles: g.record_policy === 'request', busy: false, err: '' };
    this.cd.detectChanges();
  }

  openUpdate(g: any, r: any): void {
    const fields: FormField[] = r.fields.filter((f: any) => f.policy !== 'hidden').map((f: any) => ({ ...f, readonly: !(f.policy === 'self' || f.policy === 'request') }));
    const needsHr = fields.some(f => f.policy === 'request' && !f.readonly) || g.key === 'documents';
    const values = this.valuesOf(fields.filter(f => !f.readonly));
    if (g.key === 'skills' && r.kind && r.kind !== 'skill') values['kind'] = r.kind;
    this.form = { title: g.key === 'documents' ? 'Upload a new copy' : `Change – ${g.label}`,
      intro: needsHr ? 'Fields marked "HR approves" are checked by HR before they are saved.' : 'The change is saved at once.',
      group: g.key, action: 'update', recordId: r.id, fields, values, files: [], reason: '', needsHr, allowFiles: needsHr, busy: false, err: '' };
  }

  openDelete(g: any, r: any): void {
    const needsHr = g.record_policy === 'request';
    this.form = { title: `Remove – ${this.title(g, r)}`, intro: needsHr ? 'HR checks the removal before the record is deleted.' : 'The record is removed from your profile.',
      group: g.key, action: 'delete', recordId: r.id, fields: [], values: g.key === 'skills' && r.kind !== 'skill' ? { kind: r.kind } : {}, files: [], reason: '', needsHr, allowFiles: false, busy: false, err: '' };
  }

  openView(g: any, r: any): void { this.viewing = { title: `${g.label} – ${this.title(g, r)}`, fields: r.fields }; }

  private valuesOf(fields: any[]): Record<string, any> {
    const v: Record<string, any> = {};
    fields.forEach(f => (v[f.key] = f.type === 'file' ? null : f.value));
    return v;
  }

  private body(payload: any, files: File[], fileFields: Record<string, File> = {}): any {
    if (!files.length && !Object.keys(fileFields).length) return payload;
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      fd.append(k, k === 'data' ? JSON.stringify(v) : String(v));
    });
    files.forEach(f => fd.append('files', f, f.name));
    Object.entries(fileFields).forEach(([k, f]) => fd.append(k, f, f.name));
    return fd;
  }

  async submit(): Promise<void> {
    const f = this.form;
    if (!f) return;
    const data: Record<string, any> = {};
    const fileFields: Record<string, File> = {};
    f.fields.filter(x => !x.readonly).forEach(x => {
      const v = f.values[x.key];
      if (x.type === 'file') { if (v) fileFields[x.key] = v; return; }
      if (f.action === 'create') { if (v !== null && v !== undefined && v !== '') data[x.key] = v; return; }
      if ((v ?? '') !== (x.value ?? '')) data[x.key] = v;
    });
    if (f.values['kind']) data['kind'] = f.values['kind'];
    if (f.action === 'update' && !Object.keys(data).filter(k => k !== 'kind').length && !f.files.length && !Object.keys(fileFields).length) {
      f.err = 'Nothing was changed – edit a field or attach the new document.'; return;
    }
    // a new document file goes to HR as an attachment of the request
    const files = [...f.files, ...Object.values(fileFields)];
    f.busy = true; f.err = '';
    try {
      const r: any = await this.api.post('profile/change/', this.body({ group: f.group, action: f.action, record_id: f.recordId, data, reason: f.reason }, files));
      this.ok = r.message || 'Saved.'; this.msg = ''; this.form = null;
      await this.load();
    } catch (e: any) { f.err = EssApiService.error(e, 'It could not be sent. Check the fields and try again.'); }
    if (this.form) this.form.busy = false;
    this.cd.detectChanges();
  }

  async download(r: any): Promise<void> {
    try { await this.api.download(`documents/${r.id}/file/`, `${this.title({}, r)}.pdf`.replace(/\s+/g, '-'), true); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The file could not be downloaded.'); this.cd.detectChanges(); }
  }
}
