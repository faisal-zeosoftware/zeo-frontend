import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { ZJobProgressComponent } from '../shared-ui/z-job-progress.component';
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);
const API = () => `${environment.apiBaseUrl}/cloud/api`;
function err(e: any, fb: string): string { const b = e?.error; return b?.detail || (typeof b === 'string' && b.length < 300 ? b : fb); }

/**
 * v1.26.0 – the own databases of a Premium account (Settings → Subscription for the owner, and the console's
 * Databases tab for Adept). Add an empty database, duplicate one with all its companies, choose the default one
 * (where new companies are made), rename, remove an empty one, and move a company between the databases.
 * v1.62.1: Add database, Duplicate and every move show <z-job-progress> – the %, what is being done now, the steps with
 * their seconds, time taken and left – and a done / failed state with a Close button (no pop-up at the end).
 */
@Component({
  selector: 'z-cloud-databases',
  standalone: true,
  imports: [CommonModule, FormsModule, ZJobProgressComponent, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './cloud.css'],
  template: `
<div class="zk-card zdb" data-no-help>
  <div class="zk-row"><h2>{{ 'Databases' | t }}</h2><span class="zk-sp"></span>
    <span class="zk-note" *ngIf="info">{{ '{0} databases' | t:dbs.length }}</span></div>
  <p class="zk-note">{{ 'Each database is a separate PostgreSQL database for your companies. New companies are made in the default one; Duplicate makes a new database with a copy of every company in it – for a test or training copy, or to start a new group.' | t }}</p>
  <p class="zk-note" *ngIf="info?.premium">{{ priceNote() }}</p>
  <div class="lp-msg" *ngIf="msg" [class.err]="bad" role="status">{{ msg }}</div>
  <p class="zk-note" *ngIf="info && !info.premium">{{ 'Own databases are part of Premium – use Request upgrade.' | t }}</p>

  <div class="zdb-item" *ngFor="let d of dbs">
    <div class="zk-row">
      <b>{{ d.title }}</b>
      <span class="zk-st active" *ngIf="d.default">{{ 'default' | t }}</span>
      <span class="zk-st" [ngClass]="d.state === 'ready' ? 'included' : (d.state === 'failed' ? 'suspended' : 'trial')" *ngIf="d.state !== 'ready'">{{ dbState(d.state) }}</span>
      <span class="zk-st trial" *ngIf="d.copying">{{ 'being copied' | t }}</span>
      <span class="zk-st" [ngClass]="subClass(d.sub)">{{ subText(d) }}</span>
      <small class="zk-note" data-no-translate>{{ d.name }}<ng-container *ngIf="d.size_mb != null"> · {{ d.size_mb | number:'1.0-0' }} MB</ng-container></small>
      <span class="zk-sp"></span>
      <button type="button" class="lp-btn" *ngIf="!d.default && d.state === 'ready'" (click)="act(d, 'default')" [disabled]="busy">{{ 'Make default' | t }}</button>
      <button type="button" class="lp-btn" (click)="d._ren = !d._ren; d._label = d.title" [disabled]="busy">{{ 'Rename' | t }}</button>
      <button type="button" class="lp-btn" *ngIf="d.state === 'ready' && d.company_list.length" (click)="openDup(d)" data-act="duplicate" [disabled]="busy || !info?.can_add || !!job">{{ 'Duplicate' | t }}</button>
      <button type="button" class="lp-btn danger" *ngIf="!d.default && !d.company_list.length" (click)="remove(d)" [disabled]="busy">{{ 'Remove' | t }}</button>
      <!-- v1.67.1 (companies) make inactive / active and delete a database with its companies (not the default one) -->
      <button type="button" class="lp-btn" *ngIf="!d.default && d.state === 'ready' && !d.inactive" (click)="setActive(d, false)" [disabled]="busy" data-db-inactive>{{ 'Make inactive' | t }}</button>
      <button type="button" class="lp-btn primary" *ngIf="d.inactive" (click)="setActive(d, true)" [disabled]="busy" data-db-active>{{ 'Make active' | t }}</button>
      <button type="button" class="lp-btn danger" *ngIf="!d.default && d.company_list.length" (click)="del(d)" [disabled]="busy || !!job" data-db-delete>{{ 'Delete…' | t }}</button>
    </div>
    <small class="zk-note zdb-off" *ngIf="d.inactive" data-db-inactive-note><b class="zk-st suspended">{{ 'Inactive' | t }}</b> {{ 'Its companies are closed and hidden from their users until the database is made active again.' | t }}</small>
    <small class="cc-err" *ngIf="d.note && d.state === 'failed'">{{ d.note }}</small>
    <small class="cc-err" *ngIf="d.sub?.read_only">{{ 'Its companies are read-only (view, export, print) until the database is paid. Use Request upgrade, or move the companies to a paid database.' | t }}</small>
    <!-- Adept: the subscription of an extra database -->
    <div class="zk-row zdb-pay" *ngIf="info?.admin && d.extra">
      <label>{{ 'Paid until' | t }} <input class="zk-in" type="date" [(ngModel)]="d._until"></label>
      <label>{{ 'Price / year' | t }} <input class="zk-in" type="number" min="0" [(ngModel)]="d._price" [placeholder]="info?.database_price ?? ''"></label>
      <button type="button" class="lp-btn primary" (click)="act(d, 'paid', { until: d._until, price: d._price })" [disabled]="busy || !d._until">{{ 'Mark paid' | t }}</button>
      <button type="button" class="lp-btn" *ngIf="!d.paid_until" (click)="act(d, 'extend', {})" [disabled]="busy">{{ 'Extend trial 14 days' | t }}</button>
    </div>
    <div class="zk-row" *ngIf="d._ren"><input class="zk-in" [(ngModel)]="d._label" maxlength="120" [attr.aria-label]="'Name' | t">
      <button type="button" class="lp-btn primary" (click)="act(d, 'rename', { label: d._label })" [disabled]="busy || !d._label?.trim()">{{ 'Save' | t }}</button></div>

    <div class="zk-scroll" *ngIf="d.company_list.length"><table class="zk-table">
      <tr><th>{{ 'Company' | t }}</th><th>{{ 'Move to' | t }}</th></tr>
      <tr *ngFor="let c of d.company_list"><td>{{ c.name }}<small *ngIf="c.archived">{{ 'archived' | t }}</small><small *ngIf="c.inactive && !d.inactive">{{ 'Inactive' | t }}</small><small *ngIf="c.moving || moving(c.id)">{{ 'Moving' | t }}: {{ moving(c.id)?.percent || 0 }}%</small></td>
        <td><ng-container *ngIf="dbs.length > 1 && !c.moving && !moving(c.id)">
          <select class="zk-in" [(ngModel)]="c._to" [attr.aria-label]="'Move to' | t"><option [ngValue]="undefined">–</option>
            <option *ngFor="let o of others(d)" [ngValue]="o.key">{{ o.title }}</option></select>
          <button type="button" class="cc-link" (click)="move(c, c._to)" data-act="move" [disabled]="busy || !c._to">{{ 'Move' | t }}</button></ng-container></td></tr>
    </table></div>
    <p class="zk-note" *ngIf="!d.company_list.length">{{ 'No companies yet.' | t }}</p>

    <!-- duplicate this database -->
    <div class="zdb-dup" *ngIf="dup && dup.key === d.key && !job">
      <h3>{{ 'Duplicate {0}' | t:d.title }}</h3>
      <p class="zk-note">{{ 'A new database is made with a copy of these {0} companies – all data, settings and users. The original does not change.' | t:d.company_list.length }}</p>
      <p class="zk-note">{{ priceNote() }}</p>
      <div class="lp-form">
        <label>{{ 'Name of the new database' | t }}<input [(ngModel)]="dup.label" maxlength="120"></label>
        <label>{{ 'Added to the company names' | t }}<input [(ngModel)]="dup.suffix" maxlength="30" placeholder="Test"></label>
        <label class="wide cc-inline"><input type="checkbox" [(ngModel)]="dup.neutralize"> {{ 'Test copy – no e-mails are sent from the copies' | t }}</label></div>
      <div class="zk-row"><span class="zk-note">{{ 'Example: {0}' | t:(d.company_list[0]?.name + ' (' + (dup.suffix || dup.label || 'Copy') + ')') }}</span><span class="zk-sp"></span>
        <button type="button" class="lp-btn" (click)="dup = null">{{ 'Cancel' | t }}</button>
        <button type="button" class="lp-btn primary" (click)="runDup()" data-act="run-duplicate" [disabled]="busy || !dup.label.trim()">{{ 'Duplicate' | t }}</button></div>
    </div>
  </div>

  <!-- v1.62.1 progress of the moves (one card per moving company) -->
  <div class="zdb-prog zdb-moves" *ngIf="moveCards().length">
    <z-job-progress *ngFor="let m of moveCards(); trackBy: byId" class="zdb-move" [compact]="true" [job]="m" [title]="moveTitle(m)"
      [doneText]="'The company is open in the new database.'" [note]="'The company is closed while it moves.'">
      <button type="button" class="lp-btn" (click)="closeMove(m)">{{ 'Close' | t }}</button>
    </z-job-progress>
  </div>

  <!-- progress of a copy (v1.62.1 with %, steps and the % of every company) -->
  <div class="zdb-prog" *ngIf="job && js">
    <z-job-progress class="zdb-dupjob" [job]="js" [title]="'Copying the database {0}' | t:(js.label || '')"
      [doneText]="js.failed ? ('{0} of {1} companies copied – see below.' | t:((js.companies?.length || 0) - js.failed):(js.companies?.length || 0)) : ('The copy is ready. Its companies are in the new database.' | t)"
      [note]="'You can leave this window open. Large companies take longer.'">
      <button type="button" class="lp-btn" (click)="closeJob()">{{ 'Close' | t }}</button>
    </z-job-progress>
    <ul class="zdb-steps zdb-comp" *ngIf="js.companies?.length">
      <li *ngFor="let c of js.companies" [ngClass]="c.state">
        <span class="zdb-cn">{{ c.name }} → {{ c.copy }}</span>
        <span class="zdb-cbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="cpct(c)" [attr.aria-label]="c.name"><i [style.width.%]="cpct(c)"></i></span>
        <small>{{ cpct(c) }}% · {{ stepText(c.state) }}</small>
        <small class="cc-err" *ngIf="c.error">{{ c.error }}</small></li></ul>
  </div>

  <!-- v1.62.1 progress of a new database -->
  <div class="zdb-prog" *ngIf="cjob && cs">
    <z-job-progress class="zdb-addjob" [job]="cs" [title]="'Creating the database {0}' | t:(cs.label || '')"
      [doneText]="'The database is ready. New companies can be made in it, or companies moved to it.'" [note]="'This can take a few minutes. You can leave this window open.'"><!-- v1.67.2 (signup) not a fixed "about a minute" -->
      <button type="button" class="lp-btn" (click)="closeCreate()">{{ 'Close' | t }}</button>
    </z-job-progress>
  </div>

  <div class="zk-row zdb-add" *ngIf="info?.premium">
    <input class="zk-in" [(ngModel)]="newLabel" maxlength="120" [placeholder]="'Name of a new, empty database (e.g. Group 2)' | t" [attr.aria-label]="'New database' | t">
    <button type="button" class="lp-btn primary" (click)="add()" [disabled]="busy || !!cjob || !info?.can_add || newLabel.trim().length < 2">{{ (busy && adding) || cs?.state === 'running' ? ('Creating…' | t) : ('Add database – 14-day trial' | t) }}</button>
    <span class="zk-note" *ngIf="info && !info.can_add">{{ info.add_note }}</span>
  </div>
</div>`,
  styles: [`
  .zdb-item{border-top:1px solid #ecebf5;padding:12px 0}
  .zdb-item .zk-row{gap:8px;flex-wrap:wrap}
  .zdb-dup{background:#f7f6fd;border-radius:10px;padding:12px 14px;margin-top:10px}
  .zdb-dup h3{font-size:15px;margin:0 0 6px}
  .zdb-steps{margin:6px 0;padding-left:18px}
  .zdb-steps li{margin:3px 0}.zdb-steps li small{margin-left:8px;color:#6b6880}
  .zdb-steps li.done small{color:#1f9d6b}.zdb-steps li.failed small{color:#c62828}
  .zdb-pay{gap:8px;flex-wrap:wrap;margin-top:6px;font-size:13px}.zdb-pay .zk-in{width:auto}
  .zdb-add{border-top:1px solid #ecebf5;padding-top:12px;gap:8px;flex-wrap:wrap}
  .zdb-add .zk-in{min-width:260px;flex:1}
  .zdb-prog{margin-top:12px}
  .zdb-moves{display:grid;gap:10px}
  .zdb-comp{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:8px}
  .zdb-comp li{display:grid;grid-template-columns:minmax(0,1fr) 140px auto;align-items:center;gap:10px;font-size:13px}
  .zdb-comp .zdb-cn{overflow-wrap:anywhere}
  .zdb-cbar{display:block;height:6px;border-radius:4px;background:#EEF0F5;overflow:hidden}
  .zdb-cbar i{display:block;height:100%;background:#5B4FE0;border-radius:4px;transition:width .6s ease}
  .zdb-comp li.done .zdb-cbar i{background:#2E9B47}.zdb-comp li.failed .zdb-cbar i{background:#D64550}
  :host-context([dir=rtl]) .zdb-cbar i{margin-inline-start:auto}
  @media (max-width:600px){.zdb-comp li{grid-template-columns:1fr}}
  `]
})
export class ZCloudDatabasesComponent implements OnChanges, OnDestroy {
  @Input() accountId = 0;
  info: any = null; dbs: any[] = []; moves: any[] = [];
  msg = ''; bad = false; busy = false; adding = false; newLabel = '';
  dup: { key: string; label: string; suffix: string; neutralize: boolean } | null = null;
  job = ''; js: any = null;
  cjob = ''; cs: any = null;   // v1.62.1 a new database being made
  private watched = new Set<number>();   // moves started or seen running here: their card stays until Close
  private t1: any = null; private t2: any = null; private t3: any = null;

  constructor(private http: HttpClient) {}

  ngOnChanges(): void {
    if (this.accountId) {
      this.load(); this.loadMoves();
      // a job started before a reload of the page goes on showing (this browser only)
      const j = this.mem('dup'); if (j && !this.job) { this.job = j; this.watch(); }
      const c = this.mem('add'); if (c && !this.cjob) { this.cjob = c; this.watchCreate(); }
    }
  }
  ngOnDestroy(): void { clearTimeout(this.t1); clearInterval(this.t2); clearInterval(this.t3); }
  private mem(k: string, v?: string): string {
    const key = `zdb-${k}-${this.accountId}`;
    try { if (v === undefined) { return localStorage.getItem(key) || ''; } if (v) { localStorage.setItem(key, v); } else { localStorage.removeItem(key); } } catch { /* no storage */ }
    return '';
  }

  async load(): Promise<void> {
    try {
      this.info = await firstValueFrom(this.http.get<any>(`${API()}/accounts/${this.accountId}/databases/`));
      this.dbs = (this.info.databases || []).map((d: any) => ({ ...d, _until: d.paid_until || '', _price: d.price }));
    }
    catch (e) { this.say(err(e, T('The databases could not be loaded.')), true); }
  }
  async loadMoves(): Promise<void> {
    try {
      this.moves = await firstValueFrom(this.http.get<any[]>(`${API()}/accounts/${this.accountId}/moves/`));
      const running = this.moves.some(m => m.state === 'running' || m.state === 'waiting');
      this.moves.forEach(m => { if (m.state === 'running' || m.state === 'waiting') { this.watched.add(m.id); } });
      clearTimeout(this.t1);
      if (running) { this.t1 = setTimeout(() => { this.loadMoves(); }, 2000); }
      else if (this.wasMoving) { this.load(); }
      this.wasMoving = running;
    } catch { /* keep */ }
  }
  private wasMoving = false;
  /** v1.62.1 the moves with a progress card: running ones, and finished ones seen running here (until Close) */
  moveCards(): any[] {   // the move inside a database copy is shown by the copy's card
    return this.moves.filter(m => this.watched.has(m.id) && !(this.js && this.js.target && m.target === this.js.target));
  }
  moveTitle(m: any): string { return T('Moving {0} to {1}', m.company, m.to_label || T(m.to)); }
  closeMove(m: any): void { this.watched.delete(m.id); }
  byId(_i: number, m: any): any { return m.id; }
  cpct(c: any): number { return c.state === 'done' ? 100 : Math.max(0, Math.min(100, Math.round(Number(c.percent) || 0))); }
  closeJob(): void { this.job = ''; this.js = null; this.mem('dup', ''); }
  closeCreate(): void { this.cjob = ''; this.cs = null; this.mem('add', ''); }
  moving(companyId: number): any { return this.moves.find(m => m.company_id === companyId && (m.state === 'running' || m.state === 'waiting')) || null; }
  others(d: any): any[] { return this.dbs.filter(x => x.key !== d.key && x.state === 'ready'); }
  priceNote(): string {
    const p = this.info?.database_price;
    return p != null ? T('Every database after the first is an extra subscription: {0} days free, then {1} {2} a year. After the trial an unpaid database becomes read-only.', this.info.trial_days || 14, p, this.info.currency || 'AED')
                     : T('Every database after the first is an extra subscription: {0} days free, then a yearly fee (Adept sends the invoice). After the trial an unpaid database becomes read-only.', this.info?.trial_days || 14);
  }
  subText(d: any): string {
    const s = d.sub || {};
    if (s.status === 'included') { return T('Included in Premium'); }
    if (s.status === 'trial') { return T('Trial – {0} days left', s.days_left ?? 0); }
    if (s.status === 'active') { return T('Paid until {0}', s.until); }
    if (s.status === 'grace') { return T('Expired – grace, {0} days left', s.days_left ?? 0); }
    if (s.status === 'expired') { return T('Read-only – not paid'); }
    return '';
  }
  subClass(s: any): string { return ({ included: 'included', trial: 'trial', active: 'active', grace: 'grace', expired: 'suspended' } as any)[s?.status] || ''; }
  stepText(s: string): string { return T(({ waiting: 'waiting', copying: 'copying…', done: 'done', failed: 'failed' } as any)[s] || s); }
  dbState(s: string): string { return T(({ ready: 'Ready', creating: 'Creating', failed: 'Failed', retired: 'Retired' } as any)[s] || s); }

  async add(): Promise<void> {
    this.busy = true; this.adding = true; this.msg = '';
    try {   // v1.62.1 in the background: the card shows the %, the steps and the time
      const r: any = await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/databases/`, { label: this.newLabel.trim(), background: true }));
      this.cjob = r.job; this.mem('add', r.job);
      this.cs = { state: 'running', percent: 0, step: 'Creating the database', label: this.newLabel.trim() };
      this.newLabel = ''; this.watchCreate(); await this.load();
    }
    catch (e) { this.say(err(e, T('The database could not be created.')), true); }
    this.busy = false; this.adding = false;
  }
  private watchCreate(): void {
    clearInterval(this.t3);
    const tick = async () => {
      try {
        this.cs = await firstValueFrom(this.http.get<any>(`${API()}/db-jobs/${this.cjob}/`));
        if (this.cs.state !== 'running') { clearInterval(this.t3); this.load(); }
      } catch (e: any) { if (e?.status === 404 || e?.status === 403) { clearInterval(this.t3); this.closeCreate(); } }
    };
    tick();
    this.t3 = setInterval(tick, 1500);
  }
  async act(d: any, action: string, extra: any = {}): Promise<void> {
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/databases/${d.key}/`, { action, ...extra })); this.dbs = r.databases || this.dbs; await this.load(); this.say(T('Saved.'), false); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  async remove(d: any): Promise<void> {
    if (!(await zConfirm(T('Remove the empty database {0}? It is deleted after 30 days.', d.title)))) { return; }   // v1.67.1 (companies) was 7 days
    this.act(d, 'remove');
  }
  // ---- v1.67.1 (companies) ----
  async setActive(d: any, active: boolean): Promise<void> {
    const ok = active
      ? await zConfirm(T('The companies of {0} open again for their users.', d.title), { title: T('Make {0} active?', d.title), ok: 'Make active' })
      : await zConfirm(T('Nobody can sign in to the {0} companies of {1} or use them while it is inactive, and they are hidden from their users. Nothing is deleted.', d.company_list.length, d.title),
          { title: T('Make {0} inactive?', d.title), ok: 'Make inactive', danger: true, items: d.company_list.map((c: any) => ({ label: c.name })) });
    if (!ok) { return; }
    this.act(d, active ? 'active' : 'inactive');
  }
  async del(d: any): Promise<void> {
    const ok = await zConfirm(T('The database {0} is deleted with these {1} companies and everything in them. A backup of the whole database is made first and downloaded to this computer; the server keeps a copy too.', d.title, d.company_list.length), {
      title: T('Delete {0}?', d.title), ok: 'Delete database', danger: true, typed: d.title,
      items: d.company_list.map((c: any) => ({ label: c.name })), typedLabel: T('Type the database name "{0}" to confirm', d.title),
      note: T('Every user loses access to these companies at once (their logins stay). The names are free again straight away. Only the ZEO server administrator can bring the database back within {0} days.', 30) });
    if (!ok) { return; }
    this.busy = true; this.say(T('Making the backup and deleting the database…'), false);
    try {
      const r: any = await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/databases/${d.key}/`, { action: 'delete', confirm: d.title }));
      this.dbs = r.databases || this.dbs; this.say(r.detail || T('Deleted.'), false);
      if (r.download) { this.download(r.download, r.file_name); }
      await this.load();
    } catch (e) { this.say(err(e, T('The database could not be deleted. Nothing was changed.')), true); }
    this.busy = false;
  }
  /** the backup goes to the browser at once (the server keeps a copy) */
  download(url: string, name: string): void {
    this.http.get(`${environment.apiBaseUrl}${url}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name || 'zeo-backup.zip'; a.setAttribute('data-backup-download', '');
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      },
      error: () => this.say(T('The backup could not be downloaded. The server keeps its copy – ask your ZEO administrator.'), true),
    });
  }
  openDup(d: any): void { this.dup = { key: d.key, label: T('Copy of {0}', d.title), suffix: 'Test', neutralize: true }; }
  async runDup(): Promise<void> {
    const dp = this.dup; if (!dp) { return; }
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/databases/${dp.key}/`,
        { action: 'duplicate', label: dp.label.trim(), suffix: dp.suffix.trim(), neutralize: dp.neutralize }));
      this.job = r.job; this.mem('dup', r.job); this.dup = null;
      this.js = { state: 'running', percent: 0, step: 'Creating the new database', label: dp.label.trim(), companies: [] };
      this.watch(); this.load();
    } catch (e) { this.say(err(e, T('The copy could not start.')), true); }
    this.busy = false;
  }
  private watch(): void {
    clearInterval(this.t2);
    const tick = async () => {
      try {
        this.js = await firstValueFrom(this.http.get<any>(`${API()}/db-jobs/${this.job}/`));
        if (this.js.state !== 'running') { clearInterval(this.t2); this.load(); this.loadMoves(); }
      } catch (e: any) { if (e?.status === 404 || e?.status === 403) { clearInterval(this.t2); this.closeJob(); } }
    };
    tick();
    this.t2 = setInterval(tick, 2000);
  }
  async move(c: any, key: string): Promise<void> {
    const to = this.dbs.find(x => x.key === key);
    if (!(await zConfirm(T('Move {0} to {1}? The company is closed for a minute or two while it moves.', c.name, to?.title || key)))) { return; }
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/moves/`, { company: c.id, db: key })); if (r?.id) { this.watched.add(r.id); } this.msg = ''; this.wasMoving = true; await this.loadMoves(); }
    catch (e) { this.say(err(e, T('The move could not start.')), true); }
    this.busy = false;
  }
  private say(m: string, b: boolean): void { this.msg = m; this.bad = b; }
}
