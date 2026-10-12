import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ZpApiService, when } from './zp-api.service';
import { ZpNotifyComponent } from './zp-notify.component';
import { ZpPlansComponent } from './zp-plans.component';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRIOS = ['critical', 'high', 'medium', 'low'];

/** Projects set-up (v1.14.0): working hours and reminders, SLA policies, support teams, products, issue categories,
 *  customer portal and the support mailbox. */
@Component({
  selector: 'app-zp-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ZpNotifyComponent, ZpPlansComponent],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">Projects settings</h1><p class="ex-desc">SLA clock, reminders, teams and the lists used on tickets and contracts.</p></div></div>
      <div class="ex-tabs"><button type="button" *ngFor="let t of tabs" [class.on]="tab === t.k" (click)="tab = t.k">{{ t.l }}</button></div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <p class="zp-note ok" *ngIf="ok">{{ ok }}</p>

      <ng-container *ngIf="tab === 'general' && s">
        <div class="ex-form" style="max-width:900px">
          <div class="zp-section">Working time (SLA clock)</div>
          <div class="wide"><div class="zp-pill-row">
            <button type="button" class="zp-chip" *ngFor="let dname of days; let i = index" [class.on]="s.work_days.includes(i)" (click)="togDay(i)">{{ dname }}</button></div></div>
          <label>Work starts<input type="time" [(ngModel)]="s.work_start"></label>
          <label>Work ends<input type="time" [(ngModel)]="s.work_end"></label>
          <label>Time zone<input [(ngModel)]="s.timezone"></label>
          <label>Currency<input [(ngModel)]="s.currency" maxlength="3"></label>
          <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Holiday calendars that stop the clock (none = all)</div>
            <div class="zp-multi"><label *ngFor="let c of s.holiday_calendars"><input type="checkbox" [checked]="s.holiday_calendar_ids.includes(c.id)" (change)="tog(s.holiday_calendar_ids, c.id)"> {{ c.name }}</label></div></div>
          <div class="zp-section">Tickets</div>
          <label>Default team<select [(ngModel)]="s.default_team"><option [ngValue]="null">–</option><option *ngFor="let t of teams" [ngValue]="t.id">{{ t.name }}</option></select></label>
          <label>Default SLA policy<select [(ngModel)]="s.default_sla"><option [ngValue]="null">–</option><option *ngFor="let p of slas" [ngValue]="p.id">{{ p.name }}</option></select></label>
          <label>Escalate again every (minutes)<input type="number" min="15" [(ngModel)]="s.escalation_minutes"></label>
          <label>Remind customers who keep us waiting after (days)<input type="number" min="0" [(ngModel)]="s.waiting_customer_reminder_days"></label>
          <label>Close resolved tickets after (days, 0 = never)<input type="number" min="0" [(ngModel)]="s.auto_close_resolved_days"></label>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.notify_customer"> E-mail customers on new tickets and stage changes</label>
          <div class="zp-section">Work approval</div>
          <label class="ck wide"><input type="checkbox" [(ngModel)]="s.approval_not_covered"> Tickets not covered by an AMC need a support manager's approval before work starts
            <span class="zp-muted">(covered tickets are assigned straight away)</span></label>
          <label>Approval needed for time beyond (hours per ticket, 0 = no limit)<input type="number" min="0" step="0.25" [(ngModel)]="s.approval_hours_limit"></label>
          <div class="zp-section">Weekly summary e-mail</div>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.weekly_report_enabled"> Send managers a weekly summary every Monday</label>
          <label class="wide">Send to (comma separated, empty = support managers and management)<input [(ngModel)]="s.weekly_report_emails" placeholder="ceo@yourcompany.com, support.manager@yourcompany.com"></label>
          <div class="zp-section">AMC renewals</div>
          <label>Remind days before expiry<input [ngModel]="s.renewal_reminder_days.join(', ')" (ngModelChange)="s.renewal_reminder_days = ints($event)" placeholder="90, 60, 30, 0"></label>
          <label>After expiry, remind every (days)<input type="number" min="0" [(ngModel)]="s.after_expiry_reminder_days"></label>
          <label>"Expiring" status from (days before end)<input type="number" min="1" [(ngModel)]="s.expiring_window_days"></label>
          <div class="zp-section">Numbering</div>
          <label>Ticket prefix<input [(ngModel)]="s.ticket_prefix"></label><label>AMC prefix<input [(ngModel)]="s.amc_prefix"></label>
          <label>Development request prefix<input [(ngModel)]="s.dev_prefix"></label><label>Change request prefix<input [(ngModel)]="s.cr_prefix"></label>
          <label>Project prefix<input [(ngModel)]="s.project_prefix"></label><label>Customer prefix<input [(ngModel)]="s.customer_prefix"></label>
          <div class="zp-section">Customer portal</div>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.portal_enabled"> Portal switched on</label>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.portal_show_hours"> Customers see AMC hours used / left</label>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.portal_show_invoices"> Customers see their invoices</label>
          <label class="wide">Portal address for invitation e-mails<input [(ngModel)]="s.portal_url" placeholder="https://hr.yourcompany.com/#/portal/login"></label>
          <div class="zp-section">Support mailbox (e-mail to ticket, IMAP)</div>
          <label class="ck wide"><input type="checkbox" [(ngModel)]="s.mailbox_enabled"> Read the mailbox every 5 minutes and turn mails into tickets</label>
          <label>IMAP server<input [(ngModel)]="s.mailbox_host" placeholder="imap.gmail.com / outlook.office365.com"></label>
          <label>Port<input type="number" [(ngModel)]="s.mailbox_port"></label>
          <label>User<input [(ngModel)]="s.mailbox_user"></label>
          <label>Password<input type="password" [(ngModel)]="pw" [placeholder]="s.mailbox_password_set ? '(saved – type to change)' : ''"></label>
          <label>Folder<input [(ngModel)]="s.mailbox_folder"></label>
          <label class="ck"><input type="checkbox" [(ngModel)]="s.mailbox_ssl"> SSL</label>
          <p class="zp-muted wide" *ngIf="s.mailbox_last_check">Last check {{ w(s.mailbox_last_check) }} {{ s.mailbox_last_error ? '– error: ' + s.mailbox_last_error : '– OK' }}</p>
          <div class="wide"><button type="button" class="ex-btn primary" (click)="saveSettings()">Save settings</button></div>
        </div>
      </ng-container>

      <ng-container *ngIf="tab === 'templates'"><app-zp-plans></app-zp-plans></ng-container>
      <ng-container *ngIf="tab === 'notifications'"><app-zp-notify scope="company"></app-zp-notify></ng-container>

      <ng-container *ngIf="tab === 'sla'">
        <div class="zp-card" *ngFor="let p of slas" style="margin-bottom:12px">
          <h3>{{ p.name }} <span class="zp-b" *ngIf="p.is_default">Default</span> <span class="zp-b" *ngIf="!p.is_active">Off</span></h3>
          <div class="zp-target"><b>Priority</b><b>Respond (min)</b><b>Resolve (min)</b><b>Working hours only</b>
            <ng-container *ngFor="let pr of prios"><span style="text-transform:capitalize">{{ pr }}</span>
              <input type="number" min="1" [(ngModel)]="t(p, pr).response_minutes"><input type="number" min="1" [(ngModel)]="t(p, pr).resolution_minutes">
              <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" style="width:16px;height:16px" [(ngModel)]="t(p, pr).business_hours"> {{ t(p, pr).resolution_text }}</label></ng-container></div>
          <div class="zp-acts" style="margin-top:10px">
            <button type="button" class="ex-btn primary" (click)="saveSla(p)">Save</button>
            <button type="button" class="ex-btn" *ngIf="!p.is_default" (click)="saveSla(p, { is_default: true })">Make default</button>
            <button type="button" class="ex-btn" (click)="saveSla(p, { is_active: !p.is_active })">{{ p.is_active ? 'Switch off' : 'Switch on' }}</button></div>
        </div>
        <div class="zp-acts"><input [(ngModel)]="newName" placeholder="New policy name, e.g. Premium 24/7" class="ex-btn" style="padding:0 10px;min-width:260px">
          <button type="button" class="ex-btn" (click)="addSla()">+ Policy</button></div>
        <p class="zp-muted" style="margin-top:8px">One working day = the working hours set under General (e.g. 9 h = 540 minutes). A 24/7 contract always counts all hours.</p>
      </ng-container>

      <ng-container *ngIf="tab === 'teams'">
        <div class="zp-card" *ngFor="let t of teams" style="margin-bottom:12px">
          <div class="ex-form">
            <label>Team<input [(ngModel)]="t.name"></label>
            <label>Lead (first escalation)<select [(ngModel)]="t.lead_id"><option [ngValue]="null">–</option><option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
            <label>E-mail alias (to-address for this team)<input [(ngModel)]="t.email_alias" placeholder="erp-support@yourcompany.com"></label>
            <label class="ck"><input type="checkbox" [(ngModel)]="t.auto_assign"> Give new tickets to the least busy member</label>
            <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Members ({{ t.member_ids.length }}) · {{ t.open_tickets }} open tickets</div>
              <div class="zp-multi"><label *ngFor="let e of lk.employees"><input type="checkbox" [checked]="t.member_ids.includes(e.id)" (change)="tog(t.member_ids, e.id)"> {{ e.name }}</label></div></div>
            <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveTeam(t)">Save</button>
              <button type="button" class="ex-btn" (click)="toggleTeam(t)">{{ t.is_active ? 'Switch off' : 'Switch on' }}</button></div>
          </div>
        </div>
        <div class="zp-acts"><input [(ngModel)]="newName" placeholder="New team name" class="ex-btn" style="padding:0 10px;min-width:220px"><button type="button" class="ex-btn" (click)="addMaster('teams')">+ Team</button></div>
      </ng-container>

      <ng-container *ngIf="tab === 'products' || tab === 'categories'">
        <div class="zp-scroll"><table class="zp-table">
          <tr><th>Name</th><th *ngIf="tab === 'products'">Kind</th><th>Default team</th><th *ngIf="tab === 'categories'">Needs development</th><th *ngIf="tab === 'categories'">Billing</th><th>Active</th><th></th></tr>
          <tr *ngFor="let x of (tab === 'products' ? products : categories)">
            <td><input [(ngModel)]="x.name" class="ex-btn" style="padding:0 8px;width:100%"></td>
            <td *ngIf="tab === 'products'"><select [(ngModel)]="x.category" class="ex-btn"><option *ngFor="let c of lk.product_categories" [value]="c.value">{{ c.label }}</option></select></td>
            <td><select [(ngModel)]="x.default_team" class="ex-btn"><option [ngValue]="null">–</option><option *ngFor="let t of teams" [ngValue]="t.id">{{ t.name }}</option></select></td>
            <td *ngIf="tab === 'categories'"><input type="checkbox" [(ngModel)]="x.needs_development"></td>
            <td *ngIf="tab === 'categories'"><select [(ngModel)]="x.default_billable" class="ex-btn"><option value="">From the AMC</option><option *ngFor="let b of lk.billable" [value]="b.value">{{ b.label }}</option></select></td>
            <td><input type="checkbox" [(ngModel)]="x.is_active"></td>
            <td class="r"><button type="button" class="ex-btn sm primary" (click)="saveMaster(tab, x)">Save</button></td>
          </tr>
        </table></div>
        <div class="zp-acts" style="margin-top:10px"><input [(ngModel)]="newName" [placeholder]="tab === 'products' ? 'New product / service' : 'New category'" class="ex-btn" style="padding:0 10px;min-width:220px">
          <button type="button" class="ex-btn" (click)="addMaster(tab)">+ Add</button></div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class ZpSetupComponent implements OnInit {
  tab = 'general';
  tabs = [{ k: 'general', l: 'General' }, { k: 'sla', l: 'SLA policies' }, { k: 'teams', l: 'Support teams' }, { k: 'products', l: 'Products / services' }, { k: 'categories', l: 'Issue categories' },
          { k: 'templates', l: 'Plan templates' }, { k: 'notifications', l: 'Notifications' }];
  s: any = null;
  slas: any[] = [];
  teams: any[] = [];
  products: any[] = [];
  categories: any[] = [];
  lk: any = { employees: [], product_categories: [], billable: [] };
  days = DAYS;
  prios = PRIOS;
  pw = '';
  newName = '';
  msg = '';
  ok = '';
  constructor(private api: ZpApiService, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    const t = this.route.snapshot.queryParamMap.get('tab') || this.route.snapshot.data['tab'];
    if (t && this.tabs.some(x => x.k === t)) this.tab = t;
    this.lk = await this.api.lookups().catch(() => this.lk);
    await this.load();
  }
  async load(): Promise<void> {
    try {
      [this.s, this.slas, this.teams, this.products, this.categories] = await Promise.all([
        this.api.get('settings/'), this.api.get('masters/sla-policies/'), this.api.get('masters/teams/'), this.api.get('masters/products/'), this.api.get('masters/categories/')]);
      this.teams.forEach(t => { t.lead_id = t.lead?.id || null; t.member_ids = t.members.map((m: any) => m.id); });
      this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  private async run(fn: () => Promise<any>, done = 'Saved.'): Promise<void> {
    this.ok = ''; this.msg = '';
    try { await fn(); await this.load(); await this.api.lookups(true); this.ok = done; setTimeout(() => this.ok = '', 2500); } catch (e) { this.msg = ZpApiService.error(e); }
  }
  togDay(i: number): void { this.tog(this.s.work_days, i); this.s.work_days.sort(); }
  tog(list: number[], id: number): void { const i = list.indexOf(id); i >= 0 ? list.splice(i, 1) : list.push(id); }
  ints(v: string): number[] { return v.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x)); }
  saveSettings(): Promise<void> { const d = { ...this.s }; if (this.pw) d.mailbox_password = this.pw; return this.run(() => this.api.put('settings/', d)); }

  t(p: any, pr: string): any {
    let x = p.targets.find((y: any) => y.priority === pr);
    if (!x) { x = { priority: pr, response_minutes: 60, resolution_minutes: 480, business_hours: true }; p.targets.push(x); }
    return x;
  }
  saveSla(p: any, extra: any = {}): Promise<void> { return this.run(() => this.api.patch(`masters/sla-policies/${p.id}/`, { name: p.name, targets: p.targets, ...extra })); }
  addSla(): Promise<void> {
    const name = this.newName.trim(); if (!name) return Promise.resolve();
    this.newName = '';
    return this.run(() => this.api.post('masters/sla-policies/', { name, targets: PRIOS.map(pr => ({ priority: pr, response_minutes: 60, resolution_minutes: 480, business_hours: true })) }));
  }
  saveTeam(t: any): Promise<void> {
    return this.run(() => this.api.patch(`masters/teams/${t.id}/`, { name: t.name, lead: t.lead_id, email_alias: t.email_alias, auto_assign: t.auto_assign, members: t.member_ids }));
  }
  toggleTeam(t: any): Promise<void> { return this.run(() => this.api.patch(`masters/teams/${t.id}/`, { is_active: !t.is_active })); }
  saveMaster(kind: string, x: any, extra: any = {}): Promise<void> { return this.run(() => this.api.patch(`masters/${kind}/${x.id}/`, { ...x, ...extra })); }
  addMaster(kind: string): Promise<void> {
    const name = this.newName.trim(); if (!name) return Promise.resolve();
    this.newName = '';
    return this.run(() => this.api.post(`masters/${kind}/`, { name }));
  }
  w(v: any): string { return when(v); }
}
