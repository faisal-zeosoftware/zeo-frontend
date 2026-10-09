import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { ZFieldInputComponent } from './z-field-input.component';
import { ZFieldDesignerComponent } from './z-field-designer.component';
import { DesignField, DesignerAdapter, bySection, checkValue, showIfOk, showValue, visibleOn } from './field-types';
import { ZListService } from './z-list.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { empFieldAdapter } from './emp-field-adapter';

interface FeedItem { kind: 'note' | 'change' | 'created' | 'deleted'; at: string; who: string; body?: string; changes?: any[]; attachments?: any[]; id?: number; mine?: boolean; }

const ACT_TYPES = [
  { value: 'todo', label: 'To-do', icon: 'task_alt' }, { value: 'call', label: 'Call', icon: 'call' },
  { value: 'meeting', label: 'Meeting', icon: 'groups' }, { value: 'email', label: 'E-mail', icon: 'mail' },
  { value: 'document', label: 'Upload document', icon: 'upload_file' }, { value: 'approval', label: 'Approval', icon: 'approval' },
  { value: 'follow_up', label: 'Follow-up', icon: 'update' },
];

/**
 * The record panel shown inside every screen's form (and on detail pages):
 * extra fields from the form designer, then Log note · Schedule activity · Files, planned activities
 * and one timeline of notes and changes (who changed what, when).
 */
@Component({
  selector: 'z-record-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, ZFieldInputComponent, ZFieldDesignerComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
  <section class="zr" [class.zr-page]="mode === 'page'" aria-label="Record details, notes and activity">
    <!-- extra fields -->
    <div class="zr-extra" *ngIf="fields.length || canDesign">
      <div class="zr-head">
        <h4>More details</h4>
        <span class="zr-grow"></span>
        <button type="button" class="zr-link" *ngIf="canDesign" (click)="designing = true"><mat-icon>tune</mat-icon>{{ isEmployee ? 'Design employee fields' : 'Design this form' }}</button>
      </div>
      <p class="zr-muted" *ngIf="!fields.length && !isEmployee">No extra fields yet. Use “Design this form” to add fields such as a cost centre, a contract file or a rating.</p>
      <p class="zr-muted" *ngIf="!fields.length && isEmployee">Employee fields you add appear in this form with the other employee details (reopen the form after designing).</p>
      <ng-container *ngFor="let g of visibleGroups()">
        <div class="zr-sec" *ngIf="g.section">{{ g.section }}</div>
        <div class="zr-grid">
          <z-field-input *ngFor="let f of g.fields" [field]="f" [value]="values[f.name]" [error]="errors[f.name] || ''" [disabled]="locked(f)" [wide]="f.field_type === 'textarea' || f.field_type === 'multiselect'"
                         [upload]="id ? uploader(f.name) : undefined" (valueChange)="change(f, $event)"></z-field-input>
        </div>
      </ng-container>
      <div class="zr-save" *ngIf="dirty && id">
        <span class="zr-muted">Saved with the form, or now:</span>
        <button type="button" class="zr-btn primary" [disabled]="saving" (click)="saveNow()">{{ saving ? 'Saving…' : 'Save extra fields' }}</button>
      </div>
      <div class="zr-err" *ngIf="formError" role="alert">{{ formError }}</div>
    </div>

    <!-- chatter -->
    <div class="zr-chatter">
      <div class="zr-bar" role="toolbar" aria-label="Notes, activities and files">
        <button type="button" class="zr-tab" [class.on]="tab === 'note'" [disabled]="!id" (click)="openTab('note')"><mat-icon>edit_note</mat-icon>Log note</button>
        <button type="button" class="zr-tab" [class.on]="tab === 'activity'" [disabled]="!id" (click)="openTab('activity')"><mat-icon>event_available</mat-icon>Schedule activity</button>
        <button type="button" class="zr-tab" [class.on]="tab === 'files'" [disabled]="!id" (click)="openTab('files')"><mat-icon>attach_file</mat-icon>Files<span class="zr-count" *ngIf="attachments.length">{{ attachments.length }}</span></button>
        <span class="zr-grow"></span>
        <span class="zr-muted zr-sum" *ngIf="id && !open">{{ summary() }}</span>
        <button type="button" class="zr-link" *ngIf="id" (click)="open = !open" [attr.aria-expanded]="open">
          <mat-icon>{{ open ? 'expand_less' : 'history' }}</mat-icon>{{ open ? 'Hide' : 'History' }}<span class="zr-count" *ngIf="!open && feed.length">{{ feed.length }}</span></button>
      </div>
      <p class="zr-muted zr-new" *ngIf="!id">Notes, activities, files and the change history are available once this record is saved.</p>

      <!-- log note -->
      <div class="zr-box" *ngIf="tab === 'note' && id">
        <textarea class="zr-in" rows="3" [value]="note" (input)="note = $any($event.target).value" placeholder="Write a note for the team (only visible inside the app)…" aria-label="Note"></textarea>
        <div class="zr-pending" *ngIf="noteFiles.length"><span *ngFor="let f of noteFiles; let i = index" class="zr-chip"><mat-icon>description</mat-icon>{{ f.name }}<button type="button" (click)="noteFiles.splice(i, 1)" aria-label="Remove"><mat-icon>close</mat-icon></button></span></div>
        <div class="zr-row">
          <label class="zr-btn"><input type="file" multiple (change)="pickNoteFiles($event)" hidden><mat-icon>attach_file</mat-icon>Attach</label>
          <span class="zr-grow"></span>
          <button type="button" class="zr-btn" (click)="tab = ''">Cancel</button>
          <button type="button" class="zr-btn primary" [disabled]="busy || (!note.trim() && !noteFiles.length)" (click)="logNote()">Log note</button>
        </div>
      </div>

      <!-- schedule activity -->
      <div class="zr-box" *ngIf="tab === 'activity' && id">
        <div class="zr-types" role="radiogroup" aria-label="Activity type">
          <button type="button" *ngFor="let t of actTypes" class="zr-type" [class.on]="act.activity_type === t.value" (click)="act.activity_type = t.value" role="radio" [attr.aria-checked]="act.activity_type === t.value"><mat-icon>{{ t.icon }}</mat-icon>{{ t.label }}</button>
        </div>
        <div class="zr-grid">
          <div class="zf zf-wide"><label class="zf-label" for="zr-sum">Summary</label><input id="zr-sum" class="zf-in" [value]="act.summary" (input)="act.summary = $any($event.target).value" placeholder="e.g. Collect the signed contract"></div>
          <div class="zf"><label class="zf-label" for="zr-due">Due date</label><input id="zr-due" type="date" class="zf-in" [value]="act.due_date" (change)="act.due_date = $any($event.target).value"></div>
          <div class="zf"><label class="zf-label" for="zr-who">Assigned to</label>
            <select id="zr-who" class="zf-in" (change)="act.assigned_to = +$any($event.target).value">
              <option *ngFor="let u of users" [value]="u.id" [selected]="u.id === act.assigned_to">{{ u.name }}{{ u.id === me ? ' (me)' : '' }}</option>
            </select></div>
          <div class="zf zf-wide"><label class="zf-label" for="zr-anote">Note</label><textarea id="zr-anote" class="zf-in" rows="2" [value]="act.note" (input)="act.note = $any($event.target).value"></textarea></div>
        </div>
        <div class="zr-row"><span class="zr-quick">
            <button type="button" class="zr-link" (click)="due(0)">Today</button><button type="button" class="zr-link" (click)="due(1)">Tomorrow</button><button type="button" class="zr-link" (click)="due(7)">Next week</button></span>
          <span class="zr-grow"></span>
          <button type="button" class="zr-btn" (click)="tab = ''">Cancel</button>
          <button type="button" class="zr-btn primary" [disabled]="busy" (click)="schedule()">Schedule</button></div>
      </div>

      <!-- files -->
      <div class="zr-box" *ngIf="tab === 'files' && id">
        <label class="zr-drop" (dragover)="$event.preventDefault()" (drop)="drop($event)">
          <input type="file" multiple (change)="pickFiles($event)" hidden><mat-icon>cloud_upload</mat-icon>
          <span>{{ busy ? 'Uploading…' : 'Drop files here or click to choose (up to 25 MB each)' }}</span></label>
        <ul class="zr-files" *ngIf="attachments.length">
          <li *ngFor="let a of attachments">
            <mat-icon>{{ icon(a) }}</mat-icon>
            <button type="button" class="zr-fname" (click)="openFile(a)">{{ a.name }}</button>
            <span class="zr-muted">{{ size(a.size) }} · {{ a.uploaded_by }} · {{ a.at | date:'dd MMM yyyy' }}{{ a.field ? ' · field' : '' }}</span>
            <span class="zr-grow"></span>
            <button type="button" class="zr-ic" (click)="openFile(a, true)" aria-label="Download"><mat-icon>download</mat-icon></button>
            <button type="button" class="zr-ic" *ngIf="a.uploaded_by_id === me || admin" (click)="removeFile(a)" aria-label="Delete file"><mat-icon>delete_outline</mat-icon></button>
          </li>
        </ul>
      </div>

      <!-- planned activities -->
      <div class="zr-acts" *ngIf="openActs.length">
        <div class="zr-sec">Planned activities</div>
        <div class="zr-act" *ngFor="let a of openActs" [class.late]="a.when === 'overdue'" [class.today]="a.when === 'today'">
          <span class="zr-when">{{ a.when === 'overdue' ? (-a.days) + ' day' + (a.days === -1 ? '' : 's') + ' late' : a.when === 'today' ? 'Today' : 'In ' + a.days + ' day' + (a.days === 1 ? '' : 's') }}</span>
          <div class="zr-act-body"><b>{{ a.type_label }}: {{ a.summary }}</b><span class="zr-muted"> for {{ a.assigned_to_name }} · due {{ a.due_date | date:'dd MMM' }} · by {{ a.created_by }}</span>
            <div class="zr-act-note" *ngIf="a.note">{{ a.note }}</div>
            <div class="zr-row" *ngIf="doneFor === a.id">
              <input class="zr-in" [value]="feedback" (input)="feedback = $any($event.target).value" placeholder="Feedback (optional)" aria-label="Feedback">
              <button type="button" class="zr-btn primary" (click)="markDone(a)">Done</button></div>
          </div>
          <div class="zr-act-do" *ngIf="a.assigned_to === me || a.created_by_id === me || admin">
            <button type="button" class="zr-link" (click)="doneFor = doneFor === a.id ? null : a.id; feedback = ''"><mat-icon>check</mat-icon>Mark done</button>
            <button type="button" class="zr-link" (click)="cancelAct(a)"><mat-icon>close</mat-icon>Cancel</button></div>
        </div>
      </div>

      <!-- timeline -->
      <ol class="zr-feed" *ngIf="open && id">
        <li *ngIf="!feed.length" class="zr-muted">No notes or changes yet.</li>
        <li *ngFor="let f of feed" [class]="'zr-item ' + f.kind">
          <span class="zr-dot"><mat-icon>{{ f.kind === 'note' ? 'chat_bubble_outline' : f.kind === 'created' ? 'add_circle_outline' : f.kind === 'deleted' ? 'delete_outline' : 'edit' }}</mat-icon></span>
          <div class="zr-item-body">
            <div><b>{{ f.who || 'System' }}</b> <span class="zr-muted">· {{ f.at | date:'dd MMM yyyy, HH:mm' }}{{ f.kind === 'created' ? ' · created this record' : f.kind === 'deleted' ? ' · deleted' : '' }}</span>
              <button type="button" class="zr-ic" *ngIf="f.kind === 'note' && (f.mine || admin)" (click)="removeNote(f)" aria-label="Delete note"><mat-icon>delete_outline</mat-icon></button></div>
            <div class="zr-note" *ngIf="f.body">{{ f.body }}</div>
            <div class="zr-pending" *ngIf="f.attachments?.length"><button type="button" class="zr-chip" *ngFor="let a of f.attachments" (click)="openFile(a)"><mat-icon>description</mat-icon>{{ a.name }}</button></div>
            <ul class="zr-changes" *ngIf="f.changes?.length">
              <li *ngFor="let c of (f.changes || []).slice(0, f.kind === 'created' ? 6 : 50)"><span class="zr-f">{{ c.label }}</span>
                <ng-container *ngIf="f.kind !== 'created'"><span class="zr-old">{{ c.old ?? '—' }}</span><mat-icon class="zr-arrow">arrow_forward</mat-icon></ng-container><span class="zr-newv">{{ c.new ?? '—' }}</span></li>
              <li *ngIf="f.kind === 'created' && (f.changes || []).length > 6" class="zr-muted">and {{ (f.changes || []).length - 6 }} more values</li>
            </ul>
          </div>
        </li>
      </ol>
      <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
    </div>

    <z-field-designer *ngIf="designing && !isEmployee" [screen]="endpoint" [screenName]="screenName" (closed)="designClosed($event)"></z-field-designer>
    <z-field-designer *ngIf="designing && isEmployee" [adapter]="employeeAdapter" (closed)="designClosed($event)"></z-field-designer>
  </section>`,
})
export class ZRecordPanelComponent implements OnInit, OnDestroy {
  @Input() endpoint: string | null = null;
  @Input() id: string | null = null;
  @Input() mode: 'form' | 'page' = 'form';
  @Input() screenName = '';
  /** The form element the panel sits in (to know when it is gone). */
  @Input() host?: HTMLElement;

  fields: DesignField[] = [];
  groups: { section: string; fields: DesignField[] }[] = [];
  values: Record<string, any> = {};
  errors: Record<string, string> = {};
  attachments: any[] = [];
  activities: any[] = [];
  feed: FeedItem[] = [];
  users: any[] = [];
  me = 0; admin = false; canDesign = false;
  tab = ''; open = false; busy = false; saving = false; dirty = false; designing = false;
  note = ''; noteFiles: File[] = []; feedback = ''; doneFor: number | null = null;
  error = ''; formError = '';
  actTypes = ACT_TYPES;
  act: any = { activity_type: 'todo', summary: '', due_date: '', assigned_to: 0, note: '' };
  private key = 0;

  /** v1.12.0: self-service employee (no back-office rights): read-only and hidden fields apply. */
  ess = false;

  constructor(private rec: ZRecordService, private cd: ChangeDetectorRef, private el: ElementRef<HTMLElement>, private http: HttpClient, private zl: ZListService) {}

  /** Values by field name and label (for "show only if"). */
  private valueMap(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const f of this.fields) { out[f.name] = this.values[f.name]; out[f.label] = this.values[f.name]; }
    return out;
  }
  /** Is the field shown now (show on, self service, show only if)? */
  shown(f: DesignField, vals = this.valueMap()): boolean {
    const r = f.rules || {};
    return visibleOn(r, this.id ? 'edit' : 'create') && (!this.ess || visibleOn(r, 'ess')) && showIfOk(r, vals);
  }
  visibleGroups() { const vals = this.valueMap(); return bySection(this.fields.filter(f => this.shown(f, vals))); }
  locked(f: DesignField): boolean { return this.ess && !!f.rules?.ess_read_only; }
  /** Problems of the shown, changeable fields (the interceptor asks before the screen saves). */
  problems(): string[] {
    const vals = this.valueMap();
    return this.fields.filter(f => this.shown(f, vals) && !this.locked(f)).map(f => checkValue(f, this.values[f.name])).filter(Boolean);
  }

  /** Employee screens keep their own custom fields (employee form designer), not the generic extra fields. */
  get isEmployee(): boolean { return /\/employee\/api\/(Employee|emplist)\//i.test(this.endpoint || ''); }
  private _empAdapter?: DesignerAdapter;
  get employeeAdapter(): DesignerAdapter { return this._empAdapter ??= empFieldAdapter(this.http, environment.apiBaseUrl, 'employee'); }

  get openActs(): any[] { return this.activities.filter(a => a.state === 'open'); }

  ngOnInit(): void {
    this.open = this.mode === 'page';
    this.key = this.rec.register({
      endpoint: this.endpoint, id: this.id, fields: [], values: this.values,
      visible: () => this.el.nativeElement.isConnected && (!this.host || this.host.isConnected),
      onError: (m) => { this.formError = m; this.markErrors(); this.cd.detectChanges(); },
      check: () => this.problems(),
      onSaved: (ep, id) => { this.dirty = false; if (!this.id) { this.endpoint = ep; this.id = id; this.rec.update(this.key, { endpoint: ep, id }); this.el.nativeElement.setAttribute('data-record', `${ep}#${id}`); } this.load(); },
    });
    this.zl.permissions().subscribe(p => { this.ess = !p.admin && !p.codes.size; this.cd.detectChanges(); });
    this.load();
  }

  ngOnDestroy(): void { this.rec.unregister(this.key); }

  async load(): Promise<void> {
    try {
      if (this.id && this.endpoint) {
        const r = await firstValueFrom(this.rec.record(this.endpoint, this.id));
        this.applyFields(r.fields || [], r.values || {});
        this.attachments = r.attachments || [];
        this.activities = r.activities || [];
        this.me = r.me; this.admin = r.admin;
        this.feed = this.buildFeed(r);
        this.canDesign = await this.designAllowed();
      } else if (this.endpoint) {
        const r = await firstValueFrom(this.rec.fields(this.endpoint));
        this.applyFields((r.fields || []).filter((f: any) => f.active), {});
        this.canDesign = !!r.can_design;
        for (const f of this.fields) { if (f.default && this.values[f.name] === undefined) { this.values[f.name] = f.default; } }
      }
    } catch (e: any) {
      if (e?.status !== 400) { this.error = e?.error?.detail || ''; }
    }
    this.rec.update(this.key, { fields: this.fields, values: this.values });
    this.cd.detectChanges();
  }

  private async designAllowed(): Promise<boolean> {
    if (!this.endpoint) { return false; }
    try { const r = await firstValueFrom(this.rec.fields(this.endpoint)); return !!r.can_design; } catch { return false; }
  }

  private applyFields(fields: any[], values: Record<string, any>): void {
    if (this.isEmployee) { fields = []; }
    this.fields = fields;
    this.groups = bySection(fields);
    for (const k of Object.keys(this.values)) { delete this.values[k]; }
    Object.assign(this.values, values);
  }

  private buildFeed(r: any): FeedItem[] {
    const items: FeedItem[] = [];
    for (const n of r.notes || []) { items.push({ kind: 'note', at: n.at, who: n.author, body: n.body, attachments: n.attachments, id: n.id, mine: n.author_id === r.me }); }
    for (const h of r.history || []) {
      const changes = Object.values(h.changes || {}).map((c: any) => ({ label: c.label, old: showValue(c.old) || null, new: showValue(c.new) || null }));
      items.push({ kind: h.action === 'created' ? 'created' : h.action === 'deleted' ? 'deleted' : 'change', at: h.at, who: h.user, changes });
    }
    return items.sort((a, b) => (a.at < b.at ? 1 : -1));
  }

  summary(): string {
    const notes = this.feed.filter(f => f.kind === 'note').length;
    const last = this.feed.find(f => f.kind !== 'note');
    const parts = [];
    if (notes) { parts.push(`${notes} note${notes > 1 ? 's' : ''}`); }
    if (last) { parts.push(`last change by ${last.who || 'System'}, ${this.ago(last.at)}`); }
    return parts.join(' · ');
  }

  private ago(at: string): string {
    const m = Math.round((Date.now() - new Date(at).getTime()) / 60000);
    if (m < 1) { return 'just now'; } if (m < 60) { return `${m} min ago`; }
    const h = Math.round(m / 60); if (h < 24) { return `${h} h ago`; }
    const d = Math.round(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`;
  }

  // ---------- extra fields
  change(f: DesignField, v: any): void {
    this.values[f.name] = v; this.dirty = true; this.errors[f.name] = ''; this.formError = '';
    this.rec.update(this.key, { values: this.values });
  }
  private markErrors(): void { const vals = this.valueMap(); for (const f of this.fields) { this.errors[f.name] = this.shown(f, vals) && !this.locked(f) ? checkValue(f, this.values[f.name]) : ''; } }
  uploader(field: string) {
    return async (file: File) => {
      const r = await firstValueFrom(this.rec.upload(this.endpoint!, this.id!, [file], field));
      return { id: r[0].id, name: r[0].name };
    };
  }
  async saveNow(): Promise<void> {
    this.markErrors();
    if (Object.values(this.errors).some(Boolean)) { this.formError = 'Fix the fields marked above.'; return; }
    this.saving = true;
    try {
      const ready = await this.rec.resolveFiles(this.endpoint!, this.id!, this.values);
      await firstValueFrom(this.rec.saveValues(this.endpoint!, this.id!, ready));
      this.dirty = false; this.formError = ''; await this.load();
    } catch (e: any) { this.formError = e?.error?.detail || 'Not saved.'; }
    this.saving = false; this.cd.detectChanges();
  }
  designClosed(changed: boolean): void { this.designing = false; if (changed) { this.load(); } }

  // ---------- chatter
  openTab(t: string): void {
    this.tab = this.tab === t ? '' : t;
    if (t === 'activity' && this.tab) {
      this.act = { activity_type: 'todo', summary: '', due_date: this.isoIn(0), assigned_to: this.me, note: '' };
      if (!this.users.length) { this.rec.users().subscribe(u => { this.users = u; if (!u.some(x => x.id === this.me)) { this.users.unshift({ id: this.me, name: 'Me' }); } this.cd.detectChanges(); }); }
    }
  }
  private isoIn(days: number): string { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
  due(days: number): void { this.act.due_date = this.isoIn(days); }

  pickNoteFiles(ev: Event): void { this.noteFiles.push(...Array.from((ev.target as HTMLInputElement).files || [])); }
  async logNote(): Promise<void> {
    this.busy = true; this.error = '';
    try {
      let ids: number[] = [];
      if (this.noteFiles.length) { ids = (await firstValueFrom(this.rec.upload(this.endpoint!, this.id!, this.noteFiles))).map(a => a.id); }
      await firstValueFrom(this.rec.addNote(this.endpoint!, this.id!, this.note.trim(), ids));
      this.note = ''; this.noteFiles = []; this.tab = ''; this.open = true;
      await this.load();
    } catch (e: any) { this.error = e?.error?.detail || 'The note was not saved.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async schedule(): Promise<void> {
    this.busy = true; this.error = '';
    try {
      await firstValueFrom(this.rec.addActivity({ endpoint: this.endpoint, id: this.id, ...this.act, page: location.pathname }));
      this.tab = ''; await this.load(); this.rec.refreshTodo();
    } catch (e: any) { this.error = e?.error?.detail || 'The activity was not scheduled.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async markDone(a: any): Promise<void> {
    try { await firstValueFrom(this.rec.patchActivity(a.id, { state: 'done', feedback: this.feedback })); this.doneFor = null; await this.load(); this.rec.refreshTodo(); }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
  }
  async cancelAct(a: any): Promise<void> {
    try { await firstValueFrom(this.rec.patchActivity(a.id, { state: 'cancelled' })); await this.load(); this.rec.refreshTodo(); }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
  }

  pickFiles(ev: Event): void { this.uploadFiles(Array.from((ev.target as HTMLInputElement).files || [])); }
  drop(ev: DragEvent): void { ev.preventDefault(); this.uploadFiles(Array.from(ev.dataTransfer?.files || [])); }
  private async uploadFiles(files: File[]): Promise<void> {
    if (!files.length) { return; }
    const big = files.find(f => f.size > 25 * 1024 * 1024);
    if (big) { this.error = `“${big.name}” is larger than 25 MB.`; return; }
    this.busy = true; this.error = '';
    try { await firstValueFrom(this.rec.upload(this.endpoint!, this.id!, files)); await this.load(); }
    catch (e: any) { this.error = e?.error?.detail || 'The files were not uploaded.'; }
    this.busy = false; this.cd.detectChanges();
  }
  openFile(a: any, download = false): void { this.rec.open(a, download).catch(() => { this.error = 'The file could not be opened.'; this.cd.detectChanges(); }); }
  async removeFile(a: any): Promise<void> {
    try { await firstValueFrom(this.rec.deleteAttachment(a.id)); await this.load(); } catch (e: any) { this.error = e?.error?.detail || 'Not deleted.'; }
  }
  async removeNote(f: FeedItem): Promise<void> {
    try { await firstValueFrom(this.rec.deleteNote(f.id!)); await this.load(); } catch (e: any) { this.error = e?.error?.detail || 'Not deleted.'; }
  }
  icon(a: any): string { return /image/.test(a.mime) ? 'image' : /pdf/.test(a.mime) ? 'picture_as_pdf' : /sheet|excel|csv/.test(a.mime) ? 'table_chart' : 'description'; }
  size(n: number): string { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
}
