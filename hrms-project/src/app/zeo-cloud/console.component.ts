import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule, Routes } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { APP_VERSION } from '../shared-ui/version';
import { ZConsoleEnterpriseComponent } from './console-enterprise.component';   // v1.28.0
import { ZCloudDatabasesComponent } from './databases.component';

const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);
const API = () => `${environment.apiBaseUrl}/cloud/api/console`;
const TITLES: Record<string, string> = { hrms: 'HR', payroll: 'Payroll', projects: 'Projects', crm: 'CRM', property: 'Property', maintenance: 'Maintenance', hse: 'HSE' };
const PAID = ['payroll', 'projects', 'crm', 'property', 'maintenance', 'hse'];
function err(e: any, fb: string): string { const b = e?.error; return b?.detail || (typeof b === 'string' && b.length < 300 ? b : fb); }

/**
 * v1.23.0 – the Adept control console (v1.24.0: own databases, moves, plan changes) (/control): customers, plans and prices, app licences, invoices, plan and status changes.
 * Only Adept platform administrators (manage.py cloud_admin --add) can open it; the API refuses everyone else.
 */
@Component({
  selector: 'app-cloud-console',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZCloudDatabasesComponent, ZConsoleEnterpriseComponent, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './cloud.css', './console.css'],
  template: `
<div class="cc-page" data-no-help>
  <header class="cc-top"><span class="cc-logo">zeo</span><span class="cc-tag">{{ 'Adept control console' | t }}</span><span class="zk-sp"></span>
    <a class="cc-back" routerLink="/schema-selection">{{ 'Company list' | t }}</a></header>
  <div class="cc-wrap">
    <nav class="cc-side" [attr.aria-label]="'Console' | t">
      <a routerLink="/control" [class.on]="view === 'customers' || view === 'customer' || view === 'new'">{{ 'Customers' | t }}</a>
      <a routerLink="/control/plans" [class.on]="view === 'plans'">{{ 'Plans and prices' | t }}</a>
      <a routerLink="/control/unlinked" [class.on]="view === 'unlinked'">{{ 'Companies without an account' | t }}</a>
      <a routerLink="/control/databases" [class.on]="view === 'databases'">{{ 'Databases' | t }}</a>
      <a routerLink="/control/enterprise" [class.on]="view === 'enterprise'">{{ 'Enterprise' | t }}</a>   <!-- v1.28.0 -->
    </nav>
    <main class="cc-main">
      <div class="lp-msg" *ngIf="msg" [class.err]="bad" role="status">{{ msg }}</div>
      <div class="lp-msg err" *ngIf="denied" role="alert">{{ 'The control console is for Adept staff only.' | t }}</div>

      <!-- ===== customers ===== -->
      <ng-container *ngIf="view === 'customers' && !denied">
        <div class="zk-row"><div><h1 class="cc-h1">{{ 'Customers' | t }}</h1>
          <p class="zk-note">{{ summary() }}</p></div><span class="zk-sp"></span>
          <a class="lp-btn primary" routerLink="/control/new">{{ 'New customer' | t }}</a></div>
        <div class="zk-row cc-filters">
          <input class="zk-in cc-q" type="search" [(ngModel)]="q" (keyup.enter)="loadList()" [placeholder]="'Search customer, owner e-mail, company' | t" [attr.aria-label]="'Search customers' | t">
          <select class="zk-in" [(ngModel)]="fPlan" (change)="loadList()" [attr.aria-label]="'Plan' | t"><option value="">{{ 'Plan: all' | t }}</option><option *ngFor="let p of plans" [value]="p.code" data-no-translate>{{ p.name }}</option></select>
          <select class="zk-in" [(ngModel)]="fStatus" (change)="loadList()" [attr.aria-label]="'Status' | t"><option value="">{{ 'Status: all' | t }}</option>
            <option value="trial">{{ 'Trial' | t }}</option><option value="active">{{ 'Active' | t }}</option><option value="grace">{{ 'Grace period' | t }}</option><option value="suspended">{{ 'Suspended' | t }}</option><option value="cancelled">{{ 'Cancelled' | t }}</option></select>
          <label class="cc-chk"><input type="checkbox" [(ngModel)]="fSoon" (change)="loadList()"> {{ 'Renewal in the next 30 days' | t }}</label>
        </div>
        <div class="zk-card cc-tablecard"><div class="zk-scroll"><table class="zk-table">
          <tr><th>{{ 'Customer' | t }}</th><th>{{ 'Plan' | t }}</th><th>{{ 'Companies' | t }}</th><th>{{ 'Employees' | t }}</th><th>{{ 'Users' | t }}</th><th>{{ 'Storage' | t }}</th><th>{{ 'Renewal' | t }}</th><th>{{ 'Status' | t }}</th></tr>
          <tr class="click" *ngFor="let c of list" (click)="go(c.id)" (keydown.enter)="go(c.id)" tabindex="0">
            <td><b>{{ c.name }}</b><small>{{ c.owner_email }}</small></td><td data-no-translate>{{ c.plan.name }}</td>
            <td>{{ c.usage.companies }}<small *ngIf="c.usage.extra_companies">{{ '{0} extra' | t:c.usage.extra_companies }}</small></td>
            <td>{{ c.usage.employees }}<ng-container *ngIf="c.limits.employees"> / {{ c.limits.employees }}</ng-container></td>
            <td>{{ c.usage.users }}<ng-container *ngIf="c.limits.users"> / {{ c.limits.users }}</ng-container></td>
            <td>{{ c.usage.storage_gb }}<ng-container *ngIf="c.limits.storage_gb"> / {{ c.limits.storage_gb }}</ng-container> GB</td>
            <td>{{ (c.status === 'trial' ? c.trial_ends : c.renews_on) || '–' }}</td>
            <td><span class="zk-st" [ngClass]="c.status">{{ statusText(c) }}</span></td></tr>
          <tr *ngIf="!list.length && loaded"><td colspan="8" class="zk-note">{{ 'No customers match.' | t }}</td></tr>
        </table></div></div>
      </ng-container>

      <!-- ===== new customer ===== -->
      <ng-container *ngIf="view === 'new' && !denied">
        <p class="zk-note"><a routerLink="/control">{{ 'Customers' | t }}</a> › {{ 'New customer' | t }}</p>
        <h1 class="cc-h1">{{ 'New customer account' | t }}</h1>
        <div class="cc-two">
          <div class="zk-card"><h2>{{ 'Account' | t }}</h2><div class="lp-form">
            <label class="wide">{{ 'Legal name' | t }}<input [(ngModel)]="nw.name" maxlength="150"></label>
            <label>{{ 'Owner name' | t }}<input [(ngModel)]="nw.owner_name"></label>
            <label>{{ 'Owner e-mail' | t }}<input type="email" [(ngModel)]="nw.owner_email"></label>
            <label>{{ 'TRN' | t }}<input [(ngModel)]="nw.trn" maxlength="20"></label>
            <label>{{ 'Country' | t }}<input [(ngModel)]="nw.country"></label></div></div>
          <div class="zk-card"><h2>{{ 'Subscription' | t }}</h2><div class="lp-form">
            <label>{{ 'Plan' | t }}<select [(ngModel)]="nw.plan" (change)="planDefaults()"><option *ngFor="let p of plans" [value]="p.code" data-no-translate>{{ p.name }}</option></select></label>
            <label>{{ 'Start' | t }}<select [(ngModel)]="nw.start_mode"><option value="trial">{{ 'Trial – 14 days' | t }}</option><option value="paid">{{ 'Paid – renews on' | t }}</option></select></label>
            <label *ngIf="nw.start_mode === 'paid'">{{ 'Renews on' | t }}<input type="date" [(ngModel)]="nw.start"></label>
            <label>{{ 'Employees' | t }}<input type="number" min="0" [(ngModel)]="nw.max_employees"></label>
            <label>{{ 'Users' | t }}<input type="number" min="0" [(ngModel)]="nw.max_users"></label>
            <label>{{ 'Storage (GB)' | t }}<input type="number" min="0" [(ngModel)]="nw.storage_gb"></label>
            <div class="wide"><span class="cc-lbl">{{ 'Apps (HR and Settings are included)' | t }}</span>
              <div class="lp-catpick"><label *ngFor="let k of paidApps" [class.on]="nw.apps.includes(k)"><input type="checkbox" [checked]="nw.apps.includes(k)" (change)="toggle(nw.apps, k)"> {{ title(k) | t }}</label></div></div>
          </div></div>
        </div>
        <div class="zk-card"><h2>{{ 'First company' | t }}</h2><div class="lp-form">
          <label class="wide">{{ 'Company name (optional – the owner can create it later)' | t }}<input [(ngModel)]="nw.company" maxlength="100"></label>
          <label>{{ 'Industry' | t }}<select [(ngModel)]="nw.industry"><option *ngFor="let i of industries" [value]="i.code">{{ i.label | t }}</option></select></label></div>
          <p class="zk-note">{{ 'Where: shared cloud for Standard and Advance; Premium companies go to the account\\'s own database.' | t }}</p></div>
        <div class="zk-row"><span class="zk-note">{{ 'A new owner gets an e-mail to set the password ("Forgot password" on the sign-in page).' | t }}</span><span class="zk-sp"></span>
          <button type="button" class="lp-btn primary" (click)="create()" [disabled]="busy || !nw.name.trim() || !nw.owner_email.trim()">{{ busy ? ('Creating…' | t) : ('Create account' | t) }}</button></div>
      </ng-container>

      <!-- ===== one customer ===== -->
      <ng-container *ngIf="view === 'customer' && c && !denied">
        <p class="zk-note"><a routerLink="/control">{{ 'Customers' | t }}</a> › {{ c.name }}</p>
        <div class="zk-row"><h1 class="cc-h1">{{ c.name }}</h1><span class="zk-st" [ngClass]="c.status">{{ statusText(c) }}</span><span class="lp-badge" data-no-translate>{{ c.plan.name }}</span>
          <span class="zk-sp"></span>
          <button type="button" class="lp-btn" (click)="cp.open = !cp.open; cp.plan = c.plan.code; tab = 'Overview'" [disabled]="busy">{{ 'Change plan' | t }}</button>
          <button type="button" class="lp-btn" (click)="act('extend')" [disabled]="busy">{{ (c.status === 'trial' ? 'Extend trial 14 days' : 'Extend renewal 30 days') | t }}</button>
          <button type="button" class="lp-btn" *ngIf="c.status === 'trial'" (click)="act('activate')" [disabled]="busy">{{ 'Activate (1 year)' | t }}</button>
          <button type="button" class="lp-btn" *ngIf="c.state === 'suspended' || c.status === 'suspended'" (click)="act('reactivate')" [disabled]="busy">{{ 'Reactivate' | t }}</button>
          <button type="button" class="lp-btn danger" *ngIf="c.state !== 'suspended' && c.state !== 'cancelled'" (click)="act('suspend')" [disabled]="busy">{{ 'Suspend' | t }}</button>
          <button type="button" class="lp-btn danger" *ngIf="c.state !== 'cancelled'" (click)="act('cancel')" [disabled]="busy">{{ 'Cancel account' | t }}</button></div>
        <div class="lp-tabs cc-tabs"><button type="button" *ngFor="let t of tabs" [class.on]="tab === t" (click)="tab = t">{{ t | t }}</button></div>

        <ng-container *ngIf="tab === 'Overview'">
          <div class="zk-card cc-cp" *ngIf="cp.open"><h2>{{ 'Change plan' | t }}</h2>
            <div class="zk-row"><select class="zk-in" [(ngModel)]="cp.plan" [attr.aria-label]="'Plan' | t"><option *ngFor="let p of plans" [value]="p.code" [disabled]="p.hosting === 'enterprise'" data-no-translate>{{ p.name }}</option></select>
              <span class="zk-note">{{ cpNote() }}</span><span class="zk-sp"></span>
              <button type="button" class="lp-btn" (click)="cp.open = false">{{ 'Cancel' | t }}</button>
              <button type="button" class="lp-btn primary" (click)="changePlan()" [disabled]="busy || cp.plan === c.plan.code">{{ 'Change plan' | t }}</button></div></div>
          <div class="zk-card cc-db" *ngIf="c.database"><b>{{ 'Own database' | t }}</b> <span data-no-translate>{{ c.database.name }}</span>
            <span class="zk-st" [ngClass]="c.database.state === 'ready' ? 'active' : (c.database.state === 'failed' ? 'suspended' : 'trial')">{{ dbState(c.database.state) }}</span>
            <small *ngIf="c.database.note">{{ c.database.note }}</small></div>
          <div class="zk-grid4">
            <div class="zk-card zk-num"><div class="k">{{ 'Companies' | t }}</div><div class="v">{{ c.usage.companies }}<ng-container *ngIf="c.limits.companies_cap"> / {{ c.limits.companies_cap }}</ng-container></div><small *ngIf="c.limits.extra_allowed">{{ '{0} included + {1} extra' | t:c.limits.companies_included:c.usage.extra_companies }}</small></div>
            <div class="zk-card zk-num"><div class="k">{{ 'Employees' | t }}</div><div class="v">{{ c.usage.employees }}<ng-container *ngIf="c.limits.employees"> / {{ c.limits.employees }}</ng-container></div></div>
            <div class="zk-card zk-num"><div class="k">{{ 'Users' | t }}</div><div class="v">{{ c.usage.users }}<ng-container *ngIf="c.limits.users"> / {{ c.limits.users }}</ng-container></div></div>
            <div class="zk-card zk-num"><div class="k">{{ 'Storage' | t }}</div><div class="v">{{ c.usage.storage_gb }}<ng-container *ngIf="c.limits.storage_gb"> / {{ c.limits.storage_gb }}</ng-container> GB</div></div>
          </div>
          <div class="zk-card"><h2>{{ 'Subscription' | t }}</h2><div class="lp-form">
            <label>{{ 'Plan' | t }}<select [(ngModel)]="ed.plan"><option *ngFor="let p of plans" [value]="p.code" data-no-translate>{{ p.name }}</option></select></label>
            <label *ngIf="c.status === 'trial'">{{ 'Trial ends' | t }}<input type="date" [(ngModel)]="ed.trial_ends"></label>
            <label>{{ 'Renews on' | t }}<input type="date" [(ngModel)]="ed.renews_on"></label>
            <label>{{ 'Grace period (days)' | t }}<input type="number" min="0" [(ngModel)]="ed.grace_days"></label>
            <label *ngIf="c.limits.extra_allowed">{{ 'Extra companies paid' | t }}<input type="number" min="0" [(ngModel)]="ed.extra_companies"></label>
            <label>{{ 'Employees (empty = plan)' | t }}<input type="number" min="0" [(ngModel)]="ed.max_employees"></label>
            <label>{{ 'Users (empty = plan)' | t }}<input type="number" min="0" [(ngModel)]="ed.max_users"></label>
            <label>{{ 'Storage GB (empty = plan)' | t }}<input type="number" min="0" [(ngModel)]="ed.storage_gb"></label>
            <label>{{ 'Only company e-mails' | t }}<input [(ngModel)]="ed.allowed_email_domain" placeholder="company.ae"></label>
            <label class="wide">{{ 'Notes (Adept only)' | t }}<textarea [(ngModel)]="ed.notes"></textarea></label></div>
            <div class="zk-row"><span class="zk-note">{{ 'Owner' | t }}: {{ c.owner_name || '' }} {{ c.owner_email }} · TRN {{ c.trn || '–' }} · {{ c.country }}</span><span class="zk-sp"></span>
              <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy">{{ 'Save' | t }}</button></div></div>
        </ng-container>

        <ng-container *ngIf="tab === 'Companies'">
          <div class="zk-card"><div class="zk-scroll"><table class="zk-table">
            <tr><th>{{ 'Company' | t }}</th><th>{{ 'Apps' | t }}</th><th>{{ 'Where' | t }}</th><th></th><th></th></tr>
            <tr *ngFor="let x of c.companies"><td>{{ x.name }}<small>{{ x.schema_name }}</small></td><td>{{ appsOf(x.apps) }}</td>
              <td>{{ x.where | t }}<small *ngIf="x.db_alias" data-no-translate>{{ x.db_label || x.db_alias }}</small>
                <button type="button" class="cc-link" *ngIf="!x.db_alias && c.plan.hosting === 'own' && !moving(x)" (click)="move(x, 'own')" [disabled]="busy">{{ 'Move to own database' | t }}</button>
                <button type="button" class="cc-link" *ngIf="x.db_alias && !moving(x)" (click)="move(x, 'shared')" [disabled]="busy">{{ 'Move to shared cloud' | t }}</button>
                <small class="cc-moving" *ngIf="moving(x) as m">{{ 'Moving' | t }}: {{ m.step | t }}</small></td>
              <td><span class="zk-st trial" *ngIf="x.extra">{{ 'extra' | t }}</span><span class="zk-st none" *ngIf="x.archived">{{ 'archived' | t }}</span></td>
              <td><button type="button" class="lp-btn" (click)="archive(x)" [disabled]="busy">{{ (x.archived ? 'Restore' : 'Archive') | t }}</button></td></tr>
          </table></div></div>
          <div class="zk-card" *ngIf="moves.length"><h2>{{ 'Moves' | t }}</h2><div class="zk-scroll"><table class="zk-table">
            <tr><th>{{ 'When' | t }}</th><th>{{ 'Company' | t }}</th><th>{{ 'From' | t }}</th><th>{{ 'To' | t }}</th><th>{{ 'Checked' | t }}</th><th>{{ 'Status' | t }}</th><th></th></tr>
            <ng-container *ngFor="let m of moves">
            <tr><td>{{ m.started_at || '' | date:'d MMM, HH:mm' }}</td><td>{{ m.company }}</td><td>{{ m.from | t }}<small *ngIf="m.source" data-no-translate>{{ m.source }}</small></td><td>{{ m.to | t }}<small *ngIf="m.target" data-no-translate>{{ m.target }}</small></td>
              <td><ng-container *ngIf="m.tables">{{ '{0} tables, {1} rows' | t:m.tables:(m.rows | number) }}</ng-container></td>
              <td><span class="zk-st" [ngClass]="moveClass(m.state)">{{ moveState(m) }}</span><small *ngIf="m.state === 'running'">{{ m.step | t }}</small>
                <small *ngIf="m.state === 'done' && m.old_copy">{{ 'Old copy kept until {0}' | t:m.keep_until }}</small><small class="cc-err" *ngIf="m.error">{{ m.error }}</small></td>
              <td><button type="button" class="cc-link" (click)="m.open = !m.open">{{ (m.open ? 'Hide log' : 'Log') | t }}</button>
                <button type="button" class="cc-link" *ngIf="m.can_back" (click)="back(m)" [disabled]="busy">{{ 'Move back' | t }}</button></td></tr>
            <tr *ngIf="m.open"><td colspan="7"><pre class="cc-log" data-no-translate>{{ m.log }}</pre></td></tr>
            </ng-container>
          </table></div>
          <p class="zk-note">{{ 'While a company moves it is closed for a minute or two (users see "being moved – try again shortly"). The data is copied, every table, row count and numbering is compared, then the company opens in the new place. The old copy is kept 7 days; Move back returns the company with its current data.' | t }}</p></div>
          <div class="zk-card"><h2>{{ 'Create a company for this customer' | t }}</h2><div class="lp-form">
            <label class="wide">{{ 'Company name' | t }}<input [(ngModel)]="nc.name" maxlength="100"></label>
            <label>{{ 'Industry' | t }}<select [(ngModel)]="nc.industry"><option *ngFor="let i of industries" [value]="i.code">{{ i.label | t }}</option></select></label>
            <label *ngIf="(c.databases?.length || 0) > 1">{{ 'Database' | t }}<select [(ngModel)]="nc.db"><option value="">{{ 'Default' | t }}</option><option *ngFor="let d of c.databases" [value]="d.key">{{ d.title }}</option></select></label>
            <div class="wide"><span class="cc-lbl">{{ 'Apps' | t }}</span><div class="lp-catpick"><label *ngFor="let k of paidApps" [class.on]="nc.apps.includes(k)"><input type="checkbox" [checked]="nc.apps.includes(k)" (change)="toggle(nc.apps, k)"> {{ title(k) | t }}</label></div></div></div>
            <div class="zk-row"><span class="zk-note" *ngIf="job">{{ jobText }}</span><span class="zk-sp"></span>
              <button type="button" class="lp-btn primary" (click)="makeCompany()" [disabled]="busy || !!job || !nc.name.trim() || !nc.apps.length">{{ 'Create company' | t }}</button></div></div>
          <div class="zk-card" *ngIf="unlinked.length"><h2>{{ 'Link an existing company' | t }}</h2>
            <div class="zk-row"><select class="zk-in" [(ngModel)]="linkId"><option [ngValue]="0">{{ 'Choose a company' | t }}</option><option *ngFor="let u of unlinked" [ngValue]="u.id">{{ u.name }} ({{ u.schema_name }})</option></select>
              <button type="button" class="lp-btn" (click)="link()" [disabled]="busy || !linkId">{{ 'Link' | t }}</button></div></div>
        </ng-container>

        <!-- v1.26.0: several own databases for a Premium account, duplicate a database -->
        <ng-container *ngIf="tab === 'Databases'">
          <z-cloud-databases [accountId]="c.id"></z-cloud-databases>
        </ng-container>

        <ng-container *ngIf="tab === 'Apps'">
          <div class="zk-card"><div class="zk-scroll"><table class="zk-table cc-apps">
            <tr><th>{{ 'App' | t }}</th><th>{{ 'Licensed' | t }}</th><th>{{ 'Trial' | t }}</th><th>{{ 'Companies (empty = all)' | t }}</th><th>{{ 'Users' | t }}</th><th>{{ 'Valid until' | t }}</th><th>{{ 'Price' | t }}</th><th></th></tr>
            <tr><td>{{ 'Settings + employee master' | t }}</td><td colspan="7"><span class="zk-st included">{{ 'Always' | t }}</span></td></tr>
            <tr><td>HR</td><td colspan="7"><span class="zk-st included">{{ 'Included – free with any app' | t }}</span></td></tr>
            <tr *ngFor="let a of appRows">
              <td>{{ title(a.app) | t }}<small>{{ usedText(a) }}</small></td>
              <td><input type="checkbox" [(ngModel)]="a.licensed" [attr.aria-label]="('Licensed' | t) + ' ' + title(a.app)"></td>
              <td><input type="checkbox" [(ngModel)]="a.trial" [disabled]="!a.licensed" [attr.aria-label]="'Trial' | t"></td>
              <td><input type="number" min="1" [(ngModel)]="a.companies" [disabled]="!a.licensed"></td>
              <td><input type="number" min="1" [(ngModel)]="a.users" [disabled]="!a.licensed"></td>
              <td><input type="date" [(ngModel)]="a.valid_until" [disabled]="!a.licensed"></td>
              <td><input type="number" min="0" [(ngModel)]="a.price" [disabled]="!a.licensed"></td>
              <td><button type="button" class="lp-btn" (click)="saveApp(a)" [disabled]="busy">{{ 'Save' | t }}</button></td></tr>
          </table></div></div>
        </ng-container>

        <ng-container *ngIf="tab === 'Invoices'">
          <div class="zk-card"><h2>{{ 'Add an invoice (from Odoo)' | t }}</h2><div class="lp-form">
            <label>{{ 'Invoice number' | t }}<input [(ngModel)]="inv.number"></label>
            <label>{{ 'Amount' | t }}<input type="number" min="0" [(ngModel)]="inv.amount"></label>
            <label>{{ 'Currency' | t }}<input [(ngModel)]="inv.currency" maxlength="3"></label>
            <label>{{ 'Period from' | t }}<input type="date" [(ngModel)]="inv.period_from"></label>
            <label>{{ 'Period to (new renewal date when paid)' | t }}<input type="date" [(ngModel)]="inv.period_to"></label>
            <label>{{ 'Odoo reference' | t }}<input [(ngModel)]="inv.odoo_ref"></label>
            <label class="wide cc-inline"><input type="checkbox" [(ngModel)]="inv.paid"> {{ 'Already paid' | t }}</label>
            <!-- v1.28.0 Odoo link -->
            <label class="wide cc-inline" *ngIf="c.odoo"><input type="checkbox" [(ngModel)]="inv.to_odoo"> {{ 'Make it in Odoo – posted, with the online payment link for the owner (empty invoice number = next ZEO number; Odoo adds its own)' | t }}</label></div>
            <p class="zk-note" *ngIf="!c.odoo">{{ 'Odoo is not linked: set ZEO_ODOO_URL, ZEO_ODOO_DB, ZEO_ODOO_LOGIN and ZEO_ODOO_API_KEY in .env to send invoices to Odoo and offer online payment.' | t }}</p>
            <div class="zk-row"><span class="zk-sp"></span><button type="button" class="lp-btn primary" (click)="addInvoice()" [disabled]="busy || (!inv.number.trim() && !inv.to_odoo)">{{ 'Add invoice' | t }}</button></div></div>
          <div class="zk-card"><div class="zk-scroll"><table class="zk-table">
            <tr><th>{{ 'Invoice' | t }}</th><th>{{ 'Date' | t }}</th><th>{{ 'Period' | t }}</th><th>{{ 'Amount' | t }}</th><th>{{ 'Status' | t }}</th><th></th></tr>
            <tr *ngFor="let i of c.invoices"><td>{{ i.number }}<small *ngIf="i.odoo_ref">{{ i.odoo_ref }}</small></td><td>{{ i.issued_on }}</td><td>{{ i.period_from || '' }} – {{ i.period_to || '' }}</td>
              <td>{{ i.amount | number:'1.2-2' }} {{ i.currency }}</td><td><span class="zk-st" [ngClass]="i.state">{{ (i.state === 'paid' ? 'Paid' : 'Unpaid') | t }}</span><small *ngIf="i.paid_on">{{ i.paid_on }}</small></td>
              <td class="cc-inv-act"><span class="zk-note" *ngIf="i.odoo_state">{{ 'Odoo' | t }}: {{ i.odoo_state }}</span>
                <a class="lp-btn" *ngIf="i.pay_url" [href]="i.pay_url" target="_blank" rel="noopener">{{ 'Payment page' | t }}</a>
                <button type="button" class="lp-btn" *ngIf="c.odoo && i.state === 'unpaid' && !i.in_odoo && !i.odoo_ref" (click)="odoo(i, 'push')" [disabled]="busy">{{ 'Send to Odoo' | t }}</button>
                <button type="button" class="lp-btn" *ngIf="c.odoo && i.state === 'unpaid' && (i.in_odoo || i.odoo_ref)" (click)="odoo(i, 'sync')" [disabled]="busy">{{ 'Check payment in Odoo' | t }}</button>
                <button type="button" class="lp-btn" *ngIf="i.state === 'unpaid'" (click)="paid(i)" [disabled]="busy">{{ 'Mark as paid' | t }}</button></td></tr>
            <tr *ngIf="!c.invoices.length"><td colspan="6" class="zk-note">{{ 'No invoices yet.' | t }}</td></tr>
          </table></div></div>
        </ng-container>

        <ng-container *ngIf="tab === 'History'">
          <div class="zk-card"><div class="zk-scroll"><table class="zk-table">
            <tr><th>{{ 'When' | t }}</th><th>{{ 'What' | t }}</th><th>{{ 'Who' | t }}</th></tr>
            <tr *ngFor="let h of c.history"><td>{{ h.at | date:'d MMM y, HH:mm' }}</td><td>{{ h.text }}</td><td>{{ h.by || '–' }}</td></tr>
          </table></div></div>
        </ng-container>
      </ng-container>

      <!-- ===== Enterprise requests and licences (v1.28.0) ===== -->
      <z-console-enterprise *ngIf="view === 'enterprise' && !denied"></z-console-enterprise>

      <!-- ===== databases (v1.24.0) ===== -->
      <ng-container *ngIf="view === 'databases' && !denied">
        <h1 class="cc-h1">{{ 'Databases' | t }}</h1>
        <p class="zk-note">{{ 'The main database holds the shared cloud (Standard and Advance companies) and the accounts, users and plans. Every Premium account gets its own database, and can add more or duplicate one (customer → Databases).' | t }}</p>
        <div class="zk-card"><div class="zk-scroll"><table class="zk-table">
          <tr><th>{{ 'Database' | t }}</th><th>{{ 'Customer' | t }}</th><th>{{ 'Server' | t }}</th><th>{{ 'Companies' | t }}</th><th>{{ 'Size' | t }}</th><th>{{ 'Status' | t }}</th></tr>
          <tr *ngIf="dbs.main"><td><b data-no-translate>{{ dbs.main.name }}</b><small>{{ 'Main database – shared cloud' | t }}</small></td><td>–</td><td>{{ '(main server)' | t }}</td><td>{{ dbs.main.companies }}</td><td>{{ dbs.main.size_mb | number:'1.0-0' }} MB</td><td><span class="zk-st active">{{ 'Ready' | t }}</span></td></tr>
          <tr *ngFor="let d of dbs.databases" class="click" (click)="d.account_id && go(d.account_id)"><td><b data-no-translate>{{ d.name }}</b><small data-no-translate>{{ d.key }}</small></td><td>{{ d.account }}</td>
            <td>{{ d.host === '(main server)' ? ('(main server)' | t) : d.host }}</td><td>{{ d.companies }}</td><td>{{ d.size_mb != null ? (d.size_mb | number:'1.0-0') + ' MB' : '–' }}</td>
            <td><span class="zk-st" [ngClass]="d.state === 'ready' ? 'active' : (d.state === 'failed' ? 'suspended' : 'trial')">{{ dbState(d.state) }}</span><small class="cc-err" *ngIf="d.note">{{ d.note }}</small></td></tr>
          <tr *ngIf="loaded && !dbs.databases?.length"><td colspan="6" class="zk-note">{{ 'No own databases yet – they are made when an account changes to Premium.' | t }}</td></tr>
        </table></div></div>
        <div class="zk-card zk-note">{{ 'Updates: run python manage.py cloud_migrate after copying a new version – it updates the main database, every own database and every company.' | t }}</div>
      </ng-container>

      <!-- ===== plans ===== -->
      <ng-container *ngIf="view === 'plans' && !denied">
        <h1 class="cc-h1">{{ 'Plans and prices' | t }}</h1>
        <p class="zk-note">{{ 'Defaults for new accounts; each account can be changed on its customer page. Empty = unlimited.' | t }}</p>
        <div class="zk-card"><div class="zk-scroll"><table class="zk-table cc-apps">
          <tr><th>{{ 'Plan' | t }}</th><th>{{ 'Included companies' | t }}</th><th>{{ 'Company cap' | t }}</th><th>{{ 'Extra companies' | t }}</th><th>{{ 'Employees' | t }}</th><th>{{ 'Users' | t }}</th><th>{{ 'Storage GB' | t }}</th><th>{{ 'Extra database / year' | t }}</th><th>{{ 'Price / year' | t }}</th><th>{{ 'Extra company' | t }}</th><th>{{ 'App / company' | t }}</th><th>{{ 'On sign-up' | t }}</th><th></th></tr>
          <tr *ngFor="let p of plans"><td><b data-no-translate>{{ p.name }}</b><small>{{ p.hosting_label | t }}{{ p.group_features ? ' · ' + ('group features' | t) : '' }}</small></td>
            <td><input type="number" min="1" [(ngModel)]="p.included_companies"></td><td><input type="number" min="1" [(ngModel)]="p.max_companies"></td>
            <td><input type="checkbox" [(ngModel)]="p.extra_companies"></td>
            <td><input type="number" min="0" [(ngModel)]="p.max_employees"></td><td><input type="number" min="0" [(ngModel)]="p.max_users"></td><td><input type="number" min="0" [(ngModel)]="p.storage_gb"></td>
            <td><input type="number" min="0" [(ngModel)]="p.database_price" [disabled]="p.hosting !== 'own'"></td>
            <td><input type="number" min="0" [(ngModel)]="p.price_year"></td><td><input type="number" min="0" [(ngModel)]="p.extra_company_price"></td><td><input type="number" min="0" [(ngModel)]="p.app_price"></td>
            <td><input type="checkbox" [(ngModel)]="p.active"></td><td><button type="button" class="lp-btn" (click)="savePlan(p)" [disabled]="busy">{{ 'Save' | t }}</button></td></tr>
        </table></div></div>
        <div class="zk-card zk-note">{{ 'Policies: trial 14 days · grace period 15 days, then read-only · data kept 90 days after cancellation · employees counted = active employees · employees using self service only are not users · HR is free with any app.' | t }}</div>
      </ng-container>

      <!-- ===== unlinked ===== -->
      <ng-container *ngIf="view === 'unlinked' && !denied">
        <h1 class="cc-h1">{{ 'Companies without an account' | t }}</h1>
        <p class="zk-note">{{ 'Companies made before ZEO Cloud or by an administrator. They have no limits until they are linked to a customer (customer page → Companies).' | t }}</p>
        <div class="zk-card"><table class="zk-table"><tr><th>{{ 'Company' | t }}</th><th>{{ 'Schema' | t }}</th></tr>
          <tr *ngFor="let u of unlinked"><td>{{ u.name }}</td><td>{{ u.schema_name }}</td></tr></table></div>
      </ng-container>
      <p class="cc-ver">ZEO · {{ 'Version' | t }} {{ version }}</p>
    </main>
  </div>
</div>`,
})
export class CloudConsoleComponent implements OnInit, OnDestroy {
  view = 'customers'; denied = false; msg = ''; bad = false; busy = false; loaded = false; version = APP_VERSION;
  list: any[] = []; counts: any = {}; plans: any[] = []; industries: any[] = []; unlinked: any[] = [];
  q = ''; fPlan = ''; fStatus = ''; fSoon = false;
  c: any = null; ed: any = {}; tab = 'Overview'; tabs = ['Overview', 'Companies', 'Databases', 'Apps', 'Invoices', 'History'];
  appRows: any[] = []; paidApps = PAID;
  nw: any = this.blank(); nc: any = { name: '', industry: 'OTH', apps: [], db: '' }; inv: any = this.blankInv(); linkId = 0;
  job = ''; jobText = ''; private poll: any = null; private sub: any;
  moves: any[] = []; dbs: any = {}; cp: any = { open: false, plan: '' }; private mpoll: any = null;   // v1.24.0

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(p => {
      const v = this.route.snapshot.data['view'] || 'customers';
      this.view = v; this.msg = '';
      this.common();
      if (v === 'customers') { this.loadList(); }
      if (v === 'customer') { this.loadOne(+(p.get('id') || 0)); }
      if (v === 'unlinked') { this.loadUnlinked(); }
      if (v === 'databases') { this.loadDbs(); }
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); if (this.poll) { clearInterval(this.poll); } if (this.mpoll) { clearInterval(this.mpoll); } }

  private blank(): any { return { name: '', owner_name: '', owner_email: '', trn: '', country: 'United Arab Emirates', plan: 'advance', start_mode: 'trial', start: '', max_employees: null, max_users: null, storage_gb: null, apps: [] as string[], company: '', industry: 'OTH' }; }
  private blankInv(): any { return { number: '', amount: null, currency: 'AED', period_from: '', period_to: '', odoo_ref: '', paid: false, to_odoo: false }; }

  async common(): Promise<void> {
    try {
      if (!this.plans.length) { const r: any = await firstValueFrom(this.http.get(`${API()}/plans/`)); this.plans = r.plans; this.planDefaults(); }
      if (!this.industries.length) { const r: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/cloud/api/signup/plans/`)); this.industries = r.industries || []; }
    } catch (e: any) { if (e?.status === 403) { this.denied = true; } }
  }
  async loadList(): Promise<void> {
    const ps = new URLSearchParams();
    if (this.q.trim()) { ps.set('q', this.q.trim()); } if (this.fPlan) { ps.set('plan', this.fPlan); } if (this.fStatus) { ps.set('status', this.fStatus); } if (this.fSoon) { ps.set('renewal', '30'); }
    try { const r: any = await firstValueFrom(this.http.get(`${API()}/customers/?${ps}`)); this.list = r.customers; this.counts = r.counts; this.loaded = true; }
    catch (e: any) { if (e?.status === 403) { this.denied = true; } else { this.say(err(e, T('The customers could not be loaded.')), true); } }
  }
  async loadOne(id: number): Promise<void> {
    try { this.show(await firstValueFrom(this.http.get(`${API()}/customers/${id}/`))); }
    catch (e: any) { if (e?.status === 403) { this.denied = true; } else { this.say(err(e, T('The customer could not be loaded.')), true); } }
    this.loadUnlinked();
    this.loadMoves();
  }
  // ---- v1.24.0 own databases and moves
  async loadDbs(): Promise<void> {
    try { this.dbs = await firstValueFrom(this.http.get(`${API()}/databases/`)); this.loaded = true; }
    catch (e: any) { if (e?.status === 403) { this.denied = true; } else { this.say(err(e, T('Not loaded.')), true); } }
  }
  async loadMoves(): Promise<void> {
    if (!this.c) { return; }
    try {
      const open = new Set(this.moves.filter(m => m.open).map(m => m.id));
      const r: any[] = await firstValueFrom(this.http.get<any[]>(`${API()}/customers/${this.c.id}/moves/`));
      r.forEach(m => m.open = open.has(m.id));
      const was = this.moves.some(m => m.state === 'running' || m.state === 'waiting');
      this.moves = r;
      const now = r.some(m => m.state === 'running' || m.state === 'waiting');
      if (now && !this.mpoll) { this.mpoll = setInterval(() => this.loadMoves(), 3000); }
      if (!now && this.mpoll) { clearInterval(this.mpoll); this.mpoll = null; }
      if (was && !now) { this.show(await firstValueFrom(this.http.get(`${API()}/customers/${this.c.id}/`))); }
    } catch { /* keep the list */ }
  }
  moving(x: any): any { return this.moves.find(m => m.company_id === x.id && (m.state === 'running' || m.state === 'waiting')) || null; }
  moveClass(s: string): string { return ({ done: 'active', running: 'trial', waiting: 'trial', failed: 'suspended', rolled_back: 'none' } as any)[s] || ''; }
  moveState(m: any): string { return T(({ done: 'Done', running: 'Running', waiting: 'Waiting', failed: 'Failed – nothing changed', rolled_back: 'Moved back' } as any)[m.state] || m.state); }
  dbState(s: string): string { return T(({ ready: 'Ready', creating: 'Creating', failed: 'Failed', retired: 'Retired' } as any)[s] || s); }
  async move(x: any, to: string): Promise<void> {
    const q = to === 'own' ? T('Move {0} to the own database? The company is closed for a minute or two while it moves.', x.name)
                           : T('Move {0} to the shared cloud? The company is closed for a minute or two while it moves.', x.name);
    if (!confirm(q)) { return; }
    this.busy = true;
    try { await firstValueFrom(this.http.post(`${API()}/customers/${this.c.id}/moves/`, { company: x.id, to })); this.say(T('Move started – {0}.', x.name), false); await this.loadMoves(); }
    catch (e) { this.say(err(e, T('The move could not start.')), true); }
    this.busy = false;
  }
  async back(m: any): Promise<void> {
    if (!confirm(T('Move {0} back to {1}, with its current data?', m.company, T(m.from) + (m.source ? ' ' + m.source : '')))) { return; }
    this.busy = true;
    try { await firstValueFrom(this.http.post(`${API()}/moves/${m.id}/`, { back: true })); this.say(T('Moving back – {0}.', m.company), false); await this.loadMoves(); }
    catch (e) { this.say(err(e, T('Not moved back.')), true); }
    this.busy = false;
  }
  cpNote(): string {
    const p = this.plans.find(x => x.code === this.cp.plan); if (!p || !this.c) { return ''; }
    const n = (this.c.companies || []).filter((x: any) => !x.archived).length;
    const own = (this.c.companies || []).filter((x: any) => x.db_alias).length;
    if (p.hosting === 'own' && own < n) { return T('Premium: an own database is made for {0} and its {1} companies move there, one after the other.', this.c.name, n - own); }
    if (p.hosting !== 'own' && own) { return T('{0} companies move from the own database to the shared cloud, one after the other.', own); }
    return T('No company moves.');
  }
  async changePlan(): Promise<void> {
    const p = this.plans.find(x => x.code === this.cp.plan);
    if (!confirm(T('Change {0} to {1}? {2}', this.c.name, p?.name || '', this.cpNote()))) { return; }
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(`${API()}/customers/${this.c.id}/change-plan/`, { plan: this.cp.plan }));
      this.show(r); this.cp.open = false;
      this.say(r.moving?.length ? T('Plan changed. {0} companies are moving – see Companies.', r.moving.length) : T('Plan changed.'), false);
      setTimeout(() => this.loadMoves(), 1500);
    } catch (e) { this.say(err(e, T('The plan was not changed.')), true); }
    this.busy = false;
  }
  async loadUnlinked(): Promise<void> {
    try { this.unlinked = await firstValueFrom(this.http.get<any[]>(`${API()}/unlinked/`)); } catch { this.unlinked = []; }
  }
  private show(c: any): void {
    this.c = c;
    this.ed = { plan: c.plan.code, trial_ends: c.trial_ends, renews_on: c.renews_on, grace_days: c.grace_days, extra_companies: c.extra_companies,
      max_employees: c.max_employees, max_users: c.max_users, storage_gb: c.storage_gb, allowed_email_domain: c.allowed_email_domain, notes: c.notes,
    };
    this.appRows = PAID.map(k => {
      const l = c.apps[k] || {}; const st = l.state || 'none';
      return { app: k, licensed: st !== 'none', trial: st === 'trial', companies: l.companies ?? null, users: l.users ?? null, valid_until: l.valid_until || '', price: null, used: l.used, state: st };
    });
  }
  summary(): string {
    const n = this.list.length; const c = this.counts || {};
    const parts = [T('{0} accounts', n)];
    for (const [k, l] of [['active', 'active'], ['trial', 'in trial'], ['grace', 'in grace period'], ['suspended', 'suspended']]) { if (c[k]) { parts.push(`${c[k]} ${T(l)}`); } }
    return parts.join(' · ');
  }
  statusText(c: any): string {
    if (c.status === 'trial') { return T('Trial · {0} days left', c.days_left ?? 0); }
    if (c.status === 'grace') { return T('Grace · {0} days left', c.days_left ?? 0); }
    return T(({ active: 'Active', suspended: 'Suspended · read-only', cancelled: 'Cancelled' } as any)[c.status] || c.status);
  }
  go(id: number): void { this.router.navigate(['/control/c', id]); }
  title(k: string): string { return TITLES[k] || k; }
  appsOf(keys: string[]): string { return (keys || []).map(k => T(TITLES[k] || k)).join(', '); }
  usedText(a: any): string { return a.licensed && a.companies ? T('{0} of {1} companies used', a.used ?? 0, a.companies) : ''; }
  toggle(arr: string[], k: string): void { const i = arr.indexOf(k); if (i >= 0) { arr.splice(i, 1); } else { arr.push(k); } }
  planDefaults(): void {
    const p = this.plans.find(x => x.code === this.nw.plan); if (!p) { return; }
    this.nw.max_employees = p.max_employees; this.nw.max_users = p.max_users; this.nw.storage_gb = p.storage_gb;
  }

  async create(): Promise<void> {
    this.busy = true;
    const p = this.plans.find(x => x.code === this.nw.plan) || {};
    const body: any = { ...this.nw };
    for (const k of ['max_employees', 'max_users', 'storage_gb']) { if (body[k] === p[k]) { body[k] = null; } }
    if (this.nw.company.trim()) { body.company = { name: this.nw.company.trim(), industry: this.nw.industry }; } else { delete body.company; }
    try {
      const r: any = await firstValueFrom(this.http.post(`${API()}/customers/`, body));
      this.nw = this.blank(); this.planDefaults();
      this.router.navigate(['/control/c', r.account.id]);
      this.say(r.job ? T('Account created. The first company is being created – it shows under Companies in about a minute.') : T('Account created.'), false);
    } catch (e) { this.say(err(e, T('The account could not be created.')), true); }
    this.busy = false;
  }
  async save(): Promise<void> {
    this.busy = true;
    try { this.show(await firstValueFrom(this.http.patch(`${API()}/customers/${this.c.id}/`, this.ed))); this.say(T('Saved.'), false); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  async act(action: string): Promise<void> {
    const sure: Record<string, string> = { suspend: 'Suspend this account? Its companies become read-only.', cancel: 'Cancel this account? Sign-in to its companies is closed; the data is kept 90 days.' };
    if (sure[action] && !confirm(T(sure[action]))) { return; }
    this.busy = true;
    try { this.show(await firstValueFrom(this.http.post(`${API()}/customers/${this.c.id}/action/`, { action }))); this.say(T('Done.'), false); }
    catch (e) { this.say(err(e, T('Not done.')), true); }
    this.busy = false;
  }
  async saveApp(a: any): Promise<void> {
    this.busy = true;
    try { this.show(await firstValueFrom(this.http.put(`${API()}/customers/${this.c.id}/apps/`, a))); this.say(T('{0} saved.', T(this.title(a.app))), false); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  async addInvoice(): Promise<void> {
    this.busy = true;
    try { this.show(await firstValueFrom(this.http.post(`${API()}/customers/${this.c.id}/invoices/`, this.inv))); this.inv = this.blankInv(); this.say(T('Invoice added.'), false); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  async paid(i: any): Promise<void> {
    this.busy = true;
    try { this.show(await firstValueFrom(this.http.post(`${API()}/invoices/${i.id}/paid/`, {}))); this.say(T('Invoice {0} marked as paid.', i.number), false); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  /** v1.28.0 – send the invoice to Odoo, or read its payment state there. */
  async odoo(i: any, action: 'push' | 'sync'): Promise<void> {
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(`${API()}/invoices/${i.id}/odoo/`, { action }));
      this.show(r);
      const now = (r.invoices || []).find((x: any) => x.id === i.id) || {};
      this.say(action === 'push' ? T('Invoice {0} is in Odoo as {1}.', i.number, now.odoo_ref || '') :
        (now.state === 'paid' ? T('Paid in Odoo – invoice {0} is paid.', i.number) : T('Not paid yet in Odoo ({0}).', now.odoo_state || '–')), false);
    } catch (e) { this.say(err(e, T('Odoo could not be reached.')), true); }
    this.busy = false;
  }
  async archive(x: any): Promise<void> {
    this.busy = true;
    try { this.show(await firstValueFrom(this.http.post(`${API()}/customers/${this.c.id}/companies/`, { company: x.id, archive: !x.archived }))); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  async link(): Promise<void> {
    this.busy = true;
    try { this.show(await firstValueFrom(this.http.post(`${API()}/customers/${this.c.id}/companies/`, { link: this.linkId }))); this.linkId = 0; this.loadUnlinked(); this.say(T('Company linked.'), false); }
    catch (e) { this.say(err(e, T('Not linked.')), true); }
    this.busy = false;
  }
  async makeCompany(): Promise<void> {
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(`${API()}/customers/${this.c.id}/companies/`, this.nc));
      this.job = r.job; this.jobText = T('Creating {0}…', this.nc.name);
      this.poll = setInterval(async () => {
        try {
          const s: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/cloud/api/jobs/${this.job}/`));
          this.jobText = T('Creating {0}: {1}', this.nc.name, T(s.step || ''));
          if (s.state !== 'running') {
            clearInterval(this.poll); this.poll = null; this.job = '';
            if (s.state === 'done') { this.say(T('{0} is ready.', this.nc.name), false); this.nc = { name: '', industry: 'OTH', apps: [], db: '' }; this.loadOne(this.c.id); }
            else { this.say(s.error || T('The company could not be created.'), true); }
          }
        } catch { /* keep trying */ }
      }, 2500);
    } catch (e) { this.say(err(e, T('The company could not be created.')), true); }
    this.busy = false;
  }
  async savePlan(p: any): Promise<void> {
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.put(`${API()}/plans/`, p)); this.plans = r.plans; this.say(T('{0} saved.', p.name), false); }
    catch (e) { this.say(err(e, T('Not saved.')), true); }
    this.busy = false;
  }
  private say(m: string, b: boolean): void { this.msg = m; this.bad = b; }
}

export const CONTROL_ROUTES: Routes = [
  { path: '', component: CloudConsoleComponent, data: { view: 'customers', title: 'Control console' } },
  { path: 'new', component: CloudConsoleComponent, data: { view: 'new', title: 'New customer' } },
  { path: 'c/:id', component: CloudConsoleComponent, data: { view: 'customer', title: 'Customer' } },
  { path: 'plans', component: CloudConsoleComponent, data: { view: 'plans', title: 'Plans and prices' } },
  { path: 'unlinked', component: CloudConsoleComponent, data: { view: 'unlinked', title: 'Companies without an account' } },
  { path: 'databases', component: CloudConsoleComponent, data: { view: 'databases', title: 'Databases' } },   // v1.24.0
  { path: 'enterprise', component: CloudConsoleComponent, data: { view: 'enterprise', title: 'Enterprise' } },   // v1.28.0
];
