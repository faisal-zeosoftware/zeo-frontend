import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';

const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);
const API = () => `${environment.apiBaseUrl}/cloud/api`;
function err(e: any, fb: string): string { const b = e?.error; return b?.detail || (typeof b === 'string' && b.length < 300 ? b : fb); }

/**
 * v1.26.0 – the own databases of a Premium account (Settings → Subscription for the owner, and the console's
 * Databases tab for Adept). Add an empty database, duplicate one with all its companies, choose the default one
 * (where new companies are made), rename, remove an empty one, and move a company between the databases.
 */
@Component({
  selector: 'z-cloud-databases',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
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
      <button type="button" class="lp-btn" *ngIf="d.state === 'ready' && d.company_list.length" (click)="openDup(d)" [disabled]="busy || !info?.can_add || !!job">{{ 'Duplicate' | t }}</button>
      <button type="button" class="lp-btn danger" *ngIf="!d.default && !d.company_list.length" (click)="remove(d)" [disabled]="busy">{{ 'Remove' | t }}</button>
    </div>
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
      <tr *ngFor="let c of d.company_list"><td>{{ c.name }}<small *ngIf="c.archived">{{ 'archived' | t }}</small><small *ngIf="c.moving || moving(c.id)">{{ 'Moving' | t }}: {{ (moving(c.id)?.step || '') | t }}</small></td>
        <td><ng-container *ngIf="dbs.length > 1 && !c.moving && !moving(c.id)">
          <select class="zk-in" [(ngModel)]="c._to" [attr.aria-label]="'Move to' | t"><option [ngValue]="undefined">–</option>
            <option *ngFor="let o of others(d)" [ngValue]="o.key">{{ o.title }}</option></select>
          <button type="button" class="cc-link" (click)="move(c, c._to)" [disabled]="busy || !c._to">{{ 'Move' | t }}</button></ng-container></td></tr>
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
        <button type="button" class="lp-btn primary" (click)="runDup()" [disabled]="busy || !dup.label.trim()">{{ 'Duplicate' | t }}</button></div>
    </div>
  </div>

  <!-- progress of a copy -->
  <div class="zdb-dup" *ngIf="job && js">
    <h3>{{ js.state === 'running' ? ('Copying the database…' | t) : js.state === 'done' ? ('The copy is ready' | t) : ('The copy failed' | t) }}</h3>
    <p class="zk-note" *ngIf="js.state === 'running'">{{ js.step | t }}</p>
    <ul class="zdb-steps"><li *ngFor="let c of js.companies" [ngClass]="c.state">{{ c.name }} → {{ c.copy }}
      <small>{{ stepText(c.state) }}</small>
      <small class="cc-err" *ngIf="c.error">{{ c.error }}</small></li></ul>
    <p class="cc-err" *ngIf="js.error">{{ js.error }}</p>
    <div class="zk-row" *ngIf="js.state !== 'running'"><span class="zk-sp"></span><button type="button" class="lp-btn" (click)="job = ''; js = null">{{ 'Close' | t }}</button></div>
  </div>

  <div class="zk-row zdb-add" *ngIf="info?.premium">
    <input class="zk-in" [(ngModel)]="newLabel" maxlength="120" [placeholder]="'Name of a new, empty database (e.g. Group 2)' | t" [attr.aria-label]="'New database' | t">
    <button type="button" class="lp-btn primary" (click)="add()" [disabled]="busy || !info?.can_add || newLabel.trim().length < 2">{{ busy && adding ? ('Creating…' | t) : ('Add database – 14-day trial' | t) }}</button>
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
  `]
})
export class ZCloudDatabasesComponent implements OnChanges, OnDestroy {
  @Input() accountId = 0;
  info: any = null; dbs: any[] = []; moves: any[] = [];
  msg = ''; bad = false; busy = false; adding = false; newLabel = '';
  dup: { key: string; label: string; suffix: string; neutralize: boolean } | null = null;
  job = ''; js: any = null;
  private t1: any = null; private t2: any = null;

  constructor(private http: HttpClient) {}

  ngOnChanges(): void { if (this.accountId) { this.load(); this.loadMoves(); } }
  ngOnDestroy(): void { clearTimeout(this.t1); clearInterval(this.t2); }

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
      clearTimeout(this.t1);
      if (running) { this.t1 = setTimeout(() => { this.loadMoves(); }, 3000); }
      else if (this.wasMoving) { this.load(); }
      this.wasMoving = running;
    } catch { /* keep */ }
  }
  private wasMoving = false;
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
    this.busy = true; this.adding = true;
    try { await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/databases/`, { label: this.newLabel.trim() })); this.say(T('Database {0} is ready.', this.newLabel.trim()), false); this.newLabel = ''; await this.load(); }
    catch (e) { this.say(err(e, T('The database could not be created.')), true); }
    this.busy = false; this.adding = false;
  }
  async act(d: any, action: string, extra: any = {}): Promise<void> {
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/databases/${d.key}/`, { action, ...extra })); this.dbs = r.databases || this.dbs; await this.load(); this.say(T('Saved.'), false); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  remove(d: any): void {
    if (!confirm(T('Remove the empty database {0}? It is deleted after 7 days.', d.title))) { return; }
    this.act(d, 'remove');
  }
  openDup(d: any): void { this.dup = { key: d.key, label: T('Copy of {0}', d.title), suffix: 'Test', neutralize: true }; }
  async runDup(): Promise<void> {
    const dp = this.dup; if (!dp) { return; }
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/databases/${dp.key}/`,
        { action: 'duplicate', label: dp.label.trim(), suffix: dp.suffix.trim(), neutralize: dp.neutralize }));
      this.job = r.job; this.dup = null; this.watch();
    } catch (e) { this.say(err(e, T('The copy could not start.')), true); }
    this.busy = false;
  }
  private watch(): void {
    clearInterval(this.t2);
    const tick = async () => {
      try {
        this.js = await firstValueFrom(this.http.get<any>(`${API()}/db-jobs/${this.job}/`));
        if (this.js.state !== 'running') { clearInterval(this.t2); this.load(); }
      } catch { /* keep trying */ }
    };
    tick();
    this.t2 = setInterval(tick, 3000);
  }
  async move(c: any, key: string): Promise<void> {
    const to = this.dbs.find(x => x.key === key);
    if (!confirm(T('Move {0} to {1}? The company is closed for a minute or two while it moves.', c.name, to?.title || key))) { return; }
    this.busy = true;
    try { await firstValueFrom(this.http.post(`${API()}/accounts/${this.accountId}/moves/`, { company: c.id, db: key })); this.say(T('Move started – {0}.', c.name), false); this.wasMoving = true; await this.loadMoves(); }
    catch (e) { this.say(err(e, T('The move could not start.')), true); }
    this.busy = false;
  }
  private say(m: string, b: boolean): void { this.msg = m; this.bad = b; }
}
