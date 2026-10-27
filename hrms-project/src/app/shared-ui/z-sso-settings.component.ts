import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZAD_STYLES } from './z-admin-pages.component';
import { httpErrorText } from './z-http-error.interceptor';
import { TPipe, ZDatePipe, i18nT } from './i18n.service';

/**
 * v1.54.0 – Settings › Single sign-on: the company's users sign in with Microsoft Entra ID (Office 365), Google Workspace,
 * another OpenID Connect provider or SAML 2.0 (ADFS, Okta, OneLogin …). API: /users/sso/providers/.
 */
@Component({
  selector: 'z-sso-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES, `
  .zso-list { display: grid; gap: 10px; }
  .zso-row { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; border: 1px solid #e3e6ea; border-radius: 8px; padding: 10px 12px; }
  .zso-row b { font-size: 14px; } .zso-grow { flex: 1; }
  .zso-copy { display: flex; gap: 6px; align-items: center; } .zso-copy code { font-size: 12px; background: #f4f5f7; padding: 3px 7px; border-radius: 5px; word-break: break-all; }
  .zso-steps { margin: 6px 0 0; padding-left: 18px; color: #3c4450; font-size: 12.5px; line-height: 1.6; }
  .zad textarea { min-height: 90px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11.5px; }
  .zso-cos { display: flex; flex-wrap: wrap; gap: 4px 16px; }`],
  template: `
<div class="zad" data-sso-settings>
  <h2>Single sign-on</h2>
  <p class="zad-muted">Your users sign in with the account of your company – Microsoft (Office 365), Google Workspace or your own identity provider.
    ZEO never sees their password, and the provider asks for its own second step.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>

  <section class="zad-card" *ngIf="!form">
    <h3><mat-icon>key</mat-icon>Sign-ins</h3>
    <p class="zad-muted" *ngIf="!rows.length && loaded">No sign-in is set up. Users sign in with their e-mail and password.</p>
    <div class="zso-list">
      <div class="zso-row" *ngFor="let p of rows" [attr.data-provider]="p.id">
        <b>{{ p.name }}</b><span class="zad-pill">{{ p.kind_label }}</span>
        <span class="zad-pill" [class.ok]="p.enabled">{{ p.enabled ? 'On' : 'Off' }}</span>
        <span class="zad-pill warn" *ngIf="p.enforce">Password switched off</span>
        <span class="zad-muted">{{ p.domains.join(', ') }}</span>
        <span class="zso-grow"></span>
        <span class="zad-muted" *ngIf="p.last_used">{{ 'Last used {0}' | t:[(p.last_used | zdate:'datetime')] }}</span>
        <span class="zad-pill ok" *ngIf="p.scim_on">{{ 'SCIM on · {0} users' | t:[p.scim_users] }}</span>
        <span class="zad-pill" *ngIf="p.kind === 'ldap' && p.ldap_sync">Nightly sync</span>
        <button type="button" class="zad-btn sm" *ngIf="p.can_edit" (click)="test(p)" [disabled]="busy" data-sso-test>Test</button>
        <button type="button" class="zad-btn sm" *ngIf="p.can_edit && p.kind === 'ldap'" (click)="sync(p)" [disabled]="busy" data-sso-sync>Synchronise now</button>
        <button type="button" class="zad-btn sm" *ngIf="p.can_edit" (click)="edit(p)">Change</button>
        <button type="button" class="zad-btn sm danger" *ngIf="p.can_edit" (click)="remove(p)">Delete</button>
        <div class="zad-bad" style="flex-basis:100%" *ngIf="p.last_error">{{ 'Last problem: {0}' | t:[p.last_error] }}</div>
        <div class="zad-muted" style="flex-basis:100%" *ngIf="p.kind === 'ldap' && p.last_sync">{{ 'Last sync {0}: {1} users seen, {2} new, {3} switched off.' | t:[(p.last_sync | zdate:'datetime'), p.sync_report?.seen || 0, p.sync_report?.created || 0, (p.sync_report?.disabled || 0) + (p.sync_report?.missing_off || 0)] }}</div>
        <div class="zad-muted" style="flex-basis:100%" *ngIf="result[p.id]" data-sso-result>{{ result[p.id] }}</div>
      </div>
    </div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="add()" data-sso-add>Add a sign-in</button></div>
  </section>

  <section class="zad-card" *ngIf="form" data-sso-form>
    <h3><mat-icon>key</mat-icon>{{ form.id ? 'Change the sign-in' : 'Add a sign-in' }}</h3>
    <div class="zad-grid">
      <label>Provider<select [(ngModel)]="form.kind" (ngModelChange)="kindChanged()" data-sso-kind>
        <option *ngFor="let k of kinds" [value]="k.key">{{ k.label }}</option></select></label>
      <label>Button text<input [(ngModel)]="form.name" data-sso-name></label>
      <label>E-mail domains (comma between)<input [(ngModel)]="domains" placeholder="company.ae" data-sso-domains></label>
    </div>
    <div class="zad-f" style="margin:4px 0 8px">Companies whose users sign in with it
      <div class="zso-cos"><label class="zad-chk" *ngFor="let c of companies"><input type="checkbox" [checked]="form.schemas.includes(c.schema)" (change)="toggleCo(c.schema)"> {{ c.name }}</label></div>
      <span class="zad-muted">A user who also belongs to a company that is not ticked keeps signing in with the password.</span></div>

    <ng-container *ngIf="form.kind !== 'saml' && form.kind !== 'ldap'">
      <div class="zso-copy"><span class="zad-muted">Redirect address to give the provider:</span><code data-sso-redirect>{{ redirect }}</code>
        <button type="button" class="zad-btn sm" (click)="copy(redirect)">Copy</button></div>
      <ol class="zso-steps" *ngIf="form.kind === 'microsoft'">
        <li>Microsoft Entra admin centre → App registrations → New registration; type “Web”, the redirect address above.</li>
        <li>Copy the Application (client) ID and the Directory (tenant) ID; Certificates and secrets → New client secret.</li>
      </ol>
      <ol class="zso-steps" *ngIf="form.kind === 'google'">
        <li>Google Cloud console → APIs and services → Credentials → OAuth client ID, type “Web application”, the redirect address above.</li>
        <li>OAuth consent screen: “Internal”, so only accounts of your Google Workspace can sign in.</li>
      </ol>
      <div class="zad-grid">
        <label *ngIf="form.kind === 'microsoft'">Directory (tenant) ID<input [(ngModel)]="form.tenant" placeholder="00000000-0000-0000-0000-000000000000" data-sso-tenant></label>
        <label *ngIf="form.kind === 'oidc'">Discovery address<input [(ngModel)]="form.discovery_url" placeholder="https://…/.well-known/openid-configuration" data-sso-discovery></label>
        <label>Application (client) ID<input [(ngModel)]="form.client_id" data-sso-client></label>
        <label>Client secret<input type="password" [(ngModel)]="form.client_secret" [placeholder]="form.secret_set ? ('Saved – type to replace' | t) : ''" autocomplete="new-password" data-sso-secret></label>
      </div>
    </ng-container>

    <ng-container *ngIf="form.kind === 'ldap'">
      <p class="zad-muted">The users of the domains type their Windows (domain) password in ZEO; ZEO checks it with your domain controller over LDAPS.
        The service account only reads the directory. The server running ZEO must reach the domain controller (port 636).</p>
      <div class="zad-grid">
        <label>Domain controller(s)<input [(ngModel)]="form.ldap_url" placeholder="ldaps://dc1.company.local:636" data-sso-ldap-url></label>
        <label>Base DN of the users<input [(ngModel)]="form.ldap_base_dn" placeholder="DC=company,DC=local" data-sso-ldap-base></label>
        <label>Service account<input [(ngModel)]="form.ldap_bind_dn" placeholder="zeo-svc@company.local" data-sso-ldap-bind></label>
        <label>Service account password<input type="password" [(ngModel)]="form.ldap_bind_password" [placeholder]="form.bind_password_set ? ('Saved – type to replace' | t) : ''" autocomplete="new-password" data-sso-ldap-pw></label>
        <label>User filter (empty = by e-mail or UPN)<input [(ngModel)]="form.ldap_user_filter" placeholder="(&(objectClass=user)(mail={email}))"></label>
      </div>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="form.ldap_start_tls"> StartTLS (for ldap:// on port 389)</label>
      <label class="zad-f" style="margin-top:6px">CA certificate of the domain controller (PEM, only for a private certificate authority){{ form.ca_set ? ' – ' + ('saved; paste to replace' | t) : '' }}
        <textarea [(ngModel)]="form.ldap_ca_cert" style="min-height:60px"></textarea></label>
      <p class="zad-warn" *ngIf="(form.ldap_url || '').toLowerCase().startsWith('ldap://') && !form.ldap_start_tls">With ldap:// and no StartTLS, passwords travel unencrypted on the network. Use ldaps:// in production.</p>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="form.ldap_sync" data-sso-ldap-sync> Every night: new users (when logins are made), directory groups and disabled accounts</label>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="form.ldap_deactivate_missing"> Switch off a ZEO login of these domains that is no longer in the directory</label>
    </ng-container>

    <ng-container *ngIf="form.kind === 'saml'">
      <div class="zso-copy" *ngIf="form.id"><span class="zad-muted">Reply (ACS) address:</span><code>{{ form.acs_url }}</code><button type="button" class="zad-btn sm" (click)="copy(form.acs_url)">Copy</button></div>
      <div class="zso-copy" *ngIf="form.id"><span class="zad-muted">Entity ID and metadata:</span><code>{{ form.entity_id }}</code><button type="button" class="zad-btn sm" (click)="copy(form.entity_id)">Copy</button></div>
      <p class="zad-muted" *ngIf="!form.id">Save first – then the reply (ACS) address and the entity ID for your identity provider are shown here.</p>
      <div class="zad-grid">
        <label>Identity provider entity ID (issuer)<input [(ngModel)]="form.idp_entity_id" placeholder="http://adfs.company.ae/adfs/services/trust"></label>
        <label>Sign-in (SSO) address<input [(ngModel)]="form.idp_sso_url" placeholder="https://adfs.company.ae/adfs/ls/" data-sso-idp-url></label>
        <label>E-mail attribute (empty = NameID)<input [(ngModel)]="form.email_attribute" placeholder="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"></label>
      </div>
      <label class="zad-f">Signing certificate of the identity provider (PEM or Base64){{ form.cert_set ? ' – ' + ('saved; paste to replace' | t) : '' }}
        <textarea [(ngModel)]="form.idp_cert" data-sso-cert></textarea></label>
    </ng-container>

    <div class="zad-f" style="margin-top:10px">Directory groups → ZEO permission groups
      <span class="zad-muted">Members of the directory group (Active Directory, Entra ID or Okta group sent by SCIM) get the ZEO permission group; removed from the group, they lose it.</span>
      <div class="zso-copy" *ngFor="let m of maps; let i = index" [attr.data-sso-map]="i">
        <input [(ngModel)]="m.name" placeholder="HR Team" style="width:200px" [attr.aria-label]="'Directory group' | t"> →
        <select [(ngModel)]="m.group" [attr.aria-label]="'ZEO permission group' | t"><option [ngValue]="null">–</option><option *ngFor="let g of groups" [ngValue]="g.id">{{ g.name }}</option></select>
        <button type="button" class="zad-btn sm" (click)="maps.splice(i, 1)">Remove</button></div>
      <div><button type="button" class="zad-btn sm" (click)="maps.push({ name: '', group: null })" data-sso-map-add>Add a group</button></div>
    </div>
    <div class="zad-f" style="margin-top:10px" *ngIf="form.id">User provisioning (SCIM 2.0)
      <span class="zad-muted">For Microsoft Entra ID (Enterprise application → Provisioning), Okta and others: they create, change and switch off the ZEO logins themselves.</span>
      <div class="zso-copy"><span class="zad-muted">Tenant URL:</span><code>{{ form.scim_url }}</code><button type="button" class="zad-btn sm" (click)="copy(form.scim_url)">Copy</button></div>
      <div class="zso-copy" *ngIf="token"><span class="zad-muted">Secret token (shown once):</span><code data-sso-scim-token>{{ token }}</code><button type="button" class="zad-btn sm" (click)="copy(token)">Copy</button></div>
      <div class="zad-act" style="margin-top:2px">
        <button type="button" class="zad-btn sm" (click)="scim('scim_token')" data-sso-scim-on>{{ form.scim_on ? 'Make a new token' : 'Switch on SCIM and make a token' }}</button>
        <span class="zad-muted" *ngIf="form.scim_on && !token">{{ 'On – token ending in …{0}' | t:[form.scim_token_hint] }}</span>
        <button type="button" class="zad-btn sm danger" *ngIf="form.scim_on" (click)="scim('scim_off')">Switch off SCIM</button></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="form.enabled"> On</label>
      <label class="zad-chk"><input type="checkbox" [(ngModel)]="form.create_users" data-sso-create> An employee whose company e-mail matches and who has no login gets a self-service login at the first sign-in</label>
      <label class="zad-chk" *ngIf="form.kind !== 'ldap'"><input type="checkbox" [(ngModel)]="form.enforce" data-sso-enforce> Switch off the password for these users (only this sign-in) – server administrators keep their password</label>
      <label class="zad-chk" *ngIf="form.kind === 'ldap'"><input type="checkbox" [(ngModel)]="form.enforce"> Only the domain password – no ZEO password even when the domain controller cannot be reached</label>
    </div>
    <div class="zad-act">
      <button type="button" class="zad-btn primary" (click)="save()" [disabled]="busy" data-sso-save>Save</button>
      <button type="button" class="zad-btn" (click)="form = null; msg = ''">Cancel</button>
    </div>
  </section>
</div>`,
})
export class ZSsoSettingsComponent implements OnInit {
  rows: any[] = []; companies: { schema: string; name: string }[] = []; kinds: { key: string; label: string }[] = [];
  redirect = ''; form: any = null; domains = ''; msg = ''; err = false; busy = false; loaded = false;
  groups: { id: number; name: string }[] = []; maps: { name: string; group: number | null }[] = []; token = ''; result: Record<number, string> = {};

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  private url(path = ''): string {
    return `${environment.apiBaseUrl}/users/sso/providers/${path}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
  }

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    try {
      const r: any = await firstValueFrom(this.http.get(this.url()));
      this.rows = r.providers || []; this.companies = r.companies || []; this.kinds = r.kinds || []; this.redirect = r.redirect_uri; this.groups = r.groups || [];
    } catch (e) { this.say(httpErrorText(e), true); }
    this.loaded = true; this.cd.markForCheck();
  }

  say(t: string, err = false): void { this.msg = t; this.err = err; this.cd.markForCheck(); }

  add(): void {
    const cur = localStorage.getItem('selectedSchema') || '';
    this.form = { kind: 'microsoft', name: 'Sign in with Microsoft', enabled: true, enforce: false, create_users: false,
      schemas: this.companies.some(c => c.schema === cur) ? [cur] : [], tenant: '', client_id: '', client_secret: '', discovery_url: '' };
    this.domains = ''; this.msg = ''; this.maps = []; this.token = '';
  }

  edit(p: any): void {
    this.form = { ...p, schemas: [...p.schemas], client_secret: '', idp_cert: '', ldap_bind_password: '', ldap_ca_cert: '' };
    this.domains = p.domains.join(', '); this.msg = ''; this.token = '';
    this.maps = Object.entries(p.group_map || {}).map(([name, group]) => ({ name, group: group as number }));
  }

  kindChanged(): void {
    const names: Record<string, string> = { microsoft: 'Sign in with Microsoft', google: 'Sign in with Google', oidc: 'Company sign-in', saml: 'Company sign-in', ldap: 'Company domain password' };
    if (!this.form.name || Object.values(names).includes(this.form.name)) { this.form.name = names[this.form.kind]; }
  }

  toggleCo(s: string): void {
    const i = this.form.schemas.indexOf(s);
    if (i >= 0) { this.form.schemas.splice(i, 1); } else { this.form.schemas.push(s); }
  }

  copy(t: string): void { try { navigator.clipboard.writeText(t); this.say(i18nT('Copied.')); } catch { /* no clipboard */ } }

  async save(): Promise<void> {
    const body = { ...this.form, domains: this.domains.split(/[,\s;]+/).filter(Boolean),
      group_map: Object.fromEntries(this.maps.filter(m => m.name.trim() && m.group).map(m => [m.name.trim(), m.group])) };
    for (const k of ['client_secret', 'idp_cert', 'ldap_bind_password', 'ldap_ca_cert']) { if (!body[k]) { delete body[k]; } }
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(this.url(), body));
      const isNew = !this.form.id;
      await this.load();
      if (isNew && r.kind === 'saml') { this.edit(r); this.say(i18nT('Saved. Give your identity provider the reply (ACS) address and the entity ID below.')); }
      else { this.form = null; this.say(i18nT('Saved.')); }
    } catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }

  private act(id: number, body: any): Promise<any> { return firstValueFrom(this.http.post(this.url(`${id}/`), body)); }

  async test(p: any): Promise<void> {
    const email = p.kind === 'ldap' ? (prompt(i18nT('Also look up a user? Type an e-mail (or leave empty).')) || '') : '';
    this.busy = true;
    try {
      const r = await this.act(p.id, { action: 'test', email });
      let t = r.message || i18nT('It works.');
      if (r.user === null) { t += ' ' + i18nT('{0} was not found in the directory.', [email]); }
      if (r.user) { t += ' ' + i18nT('{0}: groups {1}; ZEO groups {2}{3}', [r.user.email, r.user.groups.join(', ') || '–', r.user.zeo_groups.map((g: number) => this.groups.find(x => x.id === g)?.name || g).join(', ') || '–', r.user.disabled ? ' – ' + i18nT('disabled') : '']); }
      this.result[p.id] = t;
    } catch (e) { this.result[p.id] = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }

  async sync(p: any): Promise<void> {
    this.busy = true;
    try { await this.act(p.id, { action: 'sync' }); await this.load(); this.say(i18nT('Synchronised.')); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }

  async scim(action: string): Promise<void> {
    if (action === 'scim_token' && this.form.scim_on && !confirm(i18nT('Make a new token? The old one stops working.'))) { return; }
    try {
      const r = await this.act(this.form.id, { action });
      this.token = r.token || '';
      this.form.scim_on = action === 'scim_token';
      if (r.token) { this.form.scim_token_hint = r.token.slice(-6); this.say(r.note || i18nT('Copy the token now – it is not shown again.')); }
      await this.load();
    } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }

  async remove(p: any): Promise<void> {
    if (!confirm(i18nT('Delete this sign-in? Its users sign in with their password again.'))) { return; }
    try { await firstValueFrom(this.http.delete(this.url(`${p.id}/`))); await this.load(); this.say(i18nT('Deleted.')); }
    catch (e) { this.say(httpErrorText(e), true); }
  }
}
