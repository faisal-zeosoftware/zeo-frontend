/**
 * v1.62.10 (item 178) – Settings › Users & rights in the new design:
 *   Assign permissions  (settings/permission-assigned)  – which permission groups each sign-in has
 *   Branch permissions  (settings/branch-permissions)   – which branches each sign-in may see
 *   User details        (settings/user-details/:id/details)
 * Same endpoints, same rights as the old pages (add / change / delete / view _permission, _userbranchaccess, _customuser;
 * administrators everything) – only the look changed: one "+ New" button top right, Edit / Delete on each row (the shared
 * list adds search, filters, select all and bulk delete), the shared form instead of the old pop-ups, no page reloads.
 */
import { ChangeDetectorRef, Component, Directive, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { HrPermissionService, ModelPerms } from '../hr-modules/hr-permission.service';
import { EmployeeService } from '../employee-master/employee.service';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { USER_FORM } from '../shared-ui/z-forms';
import { TENANT_USERS } from '../shared-ui/z-forms-setup';
import { i18nT } from '../shared-ui/i18n-core';
import { zToast } from '../shared-ui/z-toast';
import { zConfirm } from '../shared-ui/z-confirm';
import { ZListDirective } from '../shared-ui/z-list.directive';   // the shared list (search, filters, select all, bulk delete)

const API = environment.apiBaseUrl;
const NONE: ModelPerms = { view: false, add: false, change: false, delete: false };

export const ASSIGN_PERMISSION_FORM: ZFormConfig = {
  thing: 'permission assignment', endpoint: '/organisation/api/permissions/', heading: undefined,
  subtitle: 'The permission groups of one sign-in. Its rights are everything its groups allow.',
  sections: [{ title: 'Assignment', fields: [
    { key: 'profile', label: 'User', type: 'select', search: true, required: true, matchKeys: ['username'], source: TENANT_USERS, full: true },
    { key: 'groups', label: 'Permission groups', type: 'multi', search: true, required: true, source: { endpoint: '/organisation/api/Group/', label: 'name' } }] }],
  toBody: v => ({ profile: v.profile, groups: v.groups || [] }),
};
export const BRANCH_PERMISSION_FORM: ZFormConfig = {
  thing: 'branch permission', endpoint: '/organisation/api/user-branch-access/',
  subtitle: 'The branches one sign-in may see and work in. Lists, reports and the branch filter show only these branches.',
  sections: [{ title: 'Branch access', fields: [
    { key: 'user', label: 'User', type: 'select', search: true, required: true, matchKeys: ['username'], source: TENANT_USERS, full: true },
    { key: 'branch', label: 'Branches', type: 'multi', required: true, source: { endpoint: '/organisation/api/Branch/', label: 'branch_name' } }] }],
  toBody: v => ({ user: v.user, branch: v.branch || [] }),
};

const STYLES = `
  .zr { padding: 18px 22px 28px; color: #1d2033; font-size: 13.5px; }
  .zr-head { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
  .zr-head h1 { margin: 0; font-size: 22px; font-weight: 600; color: #1b1640; }
  .zr-head p { margin: 4px 0 0; color: #6b7185; font-size: 13px; max-width: 760px; line-height: 1.45; }
  .zr-grow { flex: 1; }
  .zr-card { background: #fff; border: 1px solid #e6e8f0; border-radius: 12px; padding: 4px 0; overflow: auto; }
  .zr-card table { width: 100%; border-collapse: collapse; }
  .zr-card th { text-align: start; font-size: 12px; font-weight: 600; color: #6b7185; padding: 10px 14px; border-bottom: 1px solid #eceef5; white-space: nowrap; }
  .zr-card td { padding: 10px 14px; border-bottom: 1px solid #f1f2f7; vertical-align: top; }
  .zr-card tr:last-child td { border-bottom: 0; }
  .zr-card td.zr-acts { white-space: nowrap; text-align: end; width: 1%; }
  .zr-chip { display: inline-block; padding: 2px 9px; margin: 2px 4px 2px 0; border-radius: 12px; background: #eef0ff; color: #3f35a8; font-size: 12px; font-weight: 500; }
  .zr-chip.grey { background: #f1f2f6; color: #4a4f63; }
  .zr-muted { color: #6b7185; font-size: 12.5px; }
  .zr-empty { padding: 28px; text-align: center; color: #6b7185; }
  .zr-user b { font-weight: 600; }
  .zr-link { color: #4b3fbf; text-decoration: none; font-weight: 600; cursor: pointer; }
  .zr-link:hover { text-decoration: underline; }
  .zr-btn { height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #dfe1ea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; color: #1d2033; display: inline-flex; align-items: center; gap: 6px; }
  .zr-btn.primary { background: #5b4fe0; border-color: #5b4fe0; color: #fff; }
  .zr-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .zr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .zr-box { background: #fff; border: 1px solid #e6e8f0; border-radius: 12px; padding: 14px 16px; }
  .zr-box h3 { margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: #6b7185; }
  .zr-dl { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; margin: 0; }   /* label above its value (long Arabic labels) */
  .zr-dl dt { color: #6b7185; font-weight: 500; font-size: 12px; } .zr-dl dd { margin: 0 0 8px; font-weight: 500; overflow-wrap: break-word; }
  .zr-avatar { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; background: #eef0ff; color: #4b3fbf; font-size: 20px; font-weight: 700; flex: 0 0 auto; }
  .zr-pill { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; background: #e7f6ec; color: #1e7b3c; margin-inline-start: 6px; }
  .zr-pill.off { background: #fde2e4; color: #a12234; }
  .zr-pw { display: grid; gap: 10px; max-width: 420px; }
  .zr-pw label { display: flex; flex-direction: column; gap: 5px; font-weight: 600; font-size: 12.5px; color: #3b3f55; }
  .zr-pw input { height: 36px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; font-weight: 400; }
  .zr-err { color: #b3263a; font-size: 12px; font-weight: 500; }
`;

/** rows of a list answer ([…], {results}, {_list}) */
function rowsOf(d: any): any[] { return Array.isArray(d) ? d : (d?.results || d?._list || []); }
function schemaQ(): string { return 'schema=' + encodeURIComponent(localStorage.getItem('selectedSchema') || ''); }
function branchQ(ids: number[] | null | undefined): string { return ids && ids.length ? `&branch_id=[${ids.join(',')}]` : ''; }

@Directive()
abstract class ZRightsList implements OnInit, OnDestroy {
  rows: any[] = [];
  loading = true;
  perms: ModelPerms = NONE;
  names = new Map<string, string>();   // user name → employee name
  protected sub?: Subscription;
  abstract model: string;
  abstract endpoint: string;
  abstract form: ZFormConfig;
  t = (s: string, p?: any[]) => i18nT(s, p);

  constructor(protected http: HttpClient, protected rights: HrPermissionService, protected emp: EmployeeService, protected cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.rights.can(this.model).subscribe(p => { this.perms = p; this.cd.markForCheck(); });
    this.http.get<any>(`${API}/tools/api/user-names/?${schemaQ()}`).subscribe({ next: d => { for (const u of rowsOf(d)) { this.names.set(u.username, u.name); } this.cd.markForCheck(); }, error: () => {} });
    this.sub = combineLatest([this.emp.selectedSchema$, this.emp.selectedBranches$]).subscribe(([s, b]) => { if (s) { this.load(b as number[]); } });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  protected listUrl(branchIds: number[]): string { return `${API}${this.endpoint}?${schemaQ()}${branchQ(branchIds)}`; }
  load(branchIds?: number[]): void {
    const ids = branchIds ?? JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    this.loading = true;
    this.http.get<any>(this.listUrl(ids)).subscribe({
      next: d => { this.rows = rowsOf(d); this.loading = false; this.cd.markForCheck(); },
      error: () => { this.rows = []; this.loading = false; this.cd.markForCheck(); },
    });
  }
  nameOf(username: string): string { return this.names.get(username) || ''; }

  async add(): Promise<void> { if (await openZForm(this.form)) { this.load(); } }
  async edit(r: any): Promise<void> { if (await openZForm(this.form, { id: r.id })) { this.load(); } }
  async remove(r: any, label: string): Promise<void> {
    if (!(await zConfirm(this.t('Remove the {0} of {1}?', [this.t(this.form.thing), label]), { danger: true, ok: 'Delete' }))) { return; }
    try {
      await firstValueFrom(this.http.delete(`${API}${this.endpoint}${r.id}/?${schemaQ()}`));
      zToast(this.t('{0} deleted.', [this.t(this.form.thing).replace(/^./, c => c.toUpperCase())]), 'ok');
      this.load();
    } catch (e: any) {
      zToast(String(e?.error?.detail || this.t('Not deleted – try again.')), 'err');
    }
  }
}

@Component({
  selector: 'z-assign-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ZListDirective],
  styles: [STYLES],
  template: `
<div class="zr" data-z-assign-permissions>
  <div class="zr-head">
    <div><h1>{{ t('Assign permissions') }}</h1><p>{{ t('Which permission groups each sign-in has. A user\\'s rights are everything its groups allow; company administrators have every right.') }}</p></div>
    <span class="zr-grow"></span>
    <button type="button" class="z-new-btn" data-z-new *ngIf="perms.add" (click)="add()">{{ t('+ New {0}', ['permission assignment']) }}</button>
  </div>
  <div class="zr-card" *ngIf="perms.view || perms.add || perms.change; else noRight">
    <table>
      <thead><tr><th>{{ t('User') }}</th><th>{{ t('Employee') }}</th><th>{{ t('Permission groups') }}</th><th>{{ t('Administrator') }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let r of rows" [attr.data-zr-row]="r.user">
          <td class="zr-user"><a class="zr-link" [routerLink]="['/main-sidebar/settings/user-details', r.profile, 'details']">{{ r.user }}</a></td>
          <td>{{ nameOf(r.user) || '–' }}</td>
          <td><span class="zr-chip" *ngFor="let g of (r.groups || []).slice(0, 8)">{{ g.name }}</span><span class="zr-muted" *ngIf="(r.groups || []).length > 8" [title]="groupNames(r)">{{ t('+{0} more', [r.groups.length - 8]) }}</span><span class="zr-muted" *ngIf="!r.groups?.length">{{ t('No group') }}</span></td>
          <td>{{ t(r.is_superuser ? 'Yes' : 'No') }}</td>
          <td class="zr-acts">
            <button type="button" class="z-row-btn" *ngIf="perms.change" (click)="edit(r)" [title]="t('Edit')" [attr.aria-label]="t('Edit')"><mat-icon>edit</mat-icon></button>
            <button type="button" class="z-row-btn danger" *ngIf="perms.delete" (click)="remove(r, r.user)" [title]="t('Delete')" [attr.aria-label]="t('Delete')" data-z-row-delete><mat-icon>delete</mat-icon></button>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="zr-empty" *ngIf="!loading && !rows.length">{{ t('No permission groups assigned yet.') }}</p>
    <p class="zr-empty" *ngIf="loading">{{ t('Loading…') }}</p>
  </div>
  <ng-template #noRight><p class="zr-empty">{{ t('You do not have the right to see this page.') }}</p></ng-template>
</div>`,
})
export class ZAssignPermissionsComponent extends ZRightsList {
  model = 'permission';
  endpoint = '/organisation/api/permissions/';
  form = ASSIGN_PERMISSION_FORM;
  groupNames(r: any): string { return (r.groups || []).map((g: any) => g.name).join(', '); }
  constructor(http: HttpClient, rights: HrPermissionService, emp: EmployeeService, cd: ChangeDetectorRef) { super(http, rights, emp, cd); }
}

@Component({
  selector: 'z-branch-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ZListDirective],
  styles: [STYLES],
  template: `
<div class="zr" data-z-branch-permissions>
  <div class="zr-head">
    <div><h1>{{ t('Branch permissions') }}</h1><p>{{ t('Which branches each sign-in may see and work in. Users without a row here see every branch their rights allow.') }}</p></div>
    <span class="zr-grow"></span>
    <button type="button" class="z-new-btn" data-z-new *ngIf="perms.add" (click)="add()">{{ t('+ New {0}', ['branch permission']) }}</button>
  </div>
  <div class="zr-card" *ngIf="perms.view || perms.add || perms.change; else noRight">
    <table>
      <thead><tr><th>{{ t('User') }}</th><th>{{ t('Employee') }}</th><th>{{ t('Branches') }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let r of rows" [attr.data-zr-row]="r.user">
          <td class="zr-user"><b>{{ r.user }}</b></td>
          <td>{{ nameOf(r.user) || '–' }}</td>
          <td><span class="zr-chip grey" *ngFor="let b of r.branch">{{ branchName(b) }}</span></td>
          <td class="zr-acts">
            <button type="button" class="z-row-btn" *ngIf="perms.change" (click)="edit(r)" [title]="t('Edit')" [attr.aria-label]="t('Edit')"><mat-icon>edit</mat-icon></button>
            <button type="button" class="z-row-btn danger" *ngIf="perms.delete" (click)="remove(r, r.user)" [title]="t('Delete')" [attr.aria-label]="t('Delete')" data-z-row-delete><mat-icon>delete</mat-icon></button>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="zr-empty" *ngIf="!loading && !rows.length">{{ t('No branch permissions yet – every user sees the branches their rights allow.') }}</p>
    <p class="zr-empty" *ngIf="loading">{{ t('Loading…') }}</p>
  </div>
  <ng-template #noRight><p class="zr-empty">{{ t('You do not have the right to see this page.') }}</p></ng-template>
</div>`,
})
export class ZBranchPermissionsComponent extends ZRightsList {
  model = 'userbranchaccess';
  endpoint = '/organisation/api/user-branch-access/';
  form = BRANCH_PERMISSION_FORM;
  branches = new Map<number, string>();
  constructor(http: HttpClient, rights: HrPermissionService, emp: EmployeeService, cd: ChangeDetectorRef) { super(http, rights, emp, cd); }
  override ngOnInit(): void {
    super.ngOnInit();
    this.http.get<any>(`${API}/organisation/api/Branch/?${schemaQ()}`).subscribe({ next: d => { for (const b of rowsOf(d)) { this.branches.set(Number(b.id), b.branch_name); } this.cd.markForCheck(); }, error: () => {} });
  }
  protected override listUrl(): string { return `${API}${this.endpoint}?${schemaQ()}`; }   // as the old page: every row (it is per user)
  branchName(b: any): string { return typeof b === 'object' && b ? (b.branch_name || String(b.id)) : (this.branches.get(Number(b)) || String(b)); }
}

@Component({
  selector: 'z-user-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  styles: [STYLES],
  template: `
<div class="zr" data-z-user-details>
  <div class="zr-head" *ngIf="u">
    <div class="zr-avatar" aria-hidden="true">{{ initials }}</div>
    <div><h1>{{ name || u.username }}<span class="zr-pill" [class.off]="!u.is_active">{{ t(u.is_active ? 'Active' : 'Inactive') }}</span></h1>
      <p>{{ u.username }}<span *ngIf="u.email && u.email !== u.username"> · {{ u.email }}</span></p></div>
    <span class="zr-grow"></span>
    <button type="button" class="zr-btn" routerLink="/main-sidebar/settings/user-master"><mat-icon>arrow_back</mat-icon>{{ t('Users') }}</button>
    <button type="button" class="zr-btn" (click)="pwOpen = !pwOpen" data-zr-reset><mat-icon>lock_reset</mat-icon>{{ t('Reset password') }}</button>
    <button type="button" class="zr-btn primary" *ngIf="perms.change" (click)="edit()" data-zr-edit><mat-icon>edit</mat-icon>{{ t('Edit user') }}</button>
  </div>
  <p class="zr-empty" *ngIf="!u && !failed">{{ t('Loading…') }}</p>
  <p class="zr-empty" *ngIf="failed">{{ t('This user was not found.') }}</p>
  <section class="zr-box" *ngIf="u && pwOpen" style="margin-bottom:14px" data-zr-pw>
    <h3>{{ t('Reset password') }}</h3>
    <div class="zr-pw">
      <p class="zr-muted" style="margin:0">{{ t('A one-time code is sent to the e-mail address; with it a new password can be set.') }}</p>
      <label>{{ t('E-mail') }}<input type="email" [(ngModel)]="email" [disabled]="otpSent"></label>
      <button type="button" class="zr-btn primary" *ngIf="!otpSent" (click)="sendOtp()" [disabled]="busy || !email">{{ t('Send the code') }}</button>
      <ng-container *ngIf="otpSent && !otpOk">
        <label>{{ t('One-time code') }}<input type="text" [(ngModel)]="otp" autocomplete="one-time-code"></label>
        <button type="button" class="zr-btn primary" (click)="verifyOtp()" [disabled]="busy || !otp">{{ t('Check the code') }}</button>
      </ng-container>
      <ng-container *ngIf="otpOk">
        <label>{{ t('New password') }}<input type="password" [(ngModel)]="pw" autocomplete="new-password"></label>
        <button type="button" class="zr-btn primary" (click)="resetPw()" [disabled]="busy || !pw">{{ t('Set the new password') }}</button>
      </ng-container>
      <span class="zr-err" *ngIf="pwErr" role="alert">{{ pwErr }}</span>
    </div>
  </section>
  <div class="zr-grid" *ngIf="u">
    <section class="zr-box"><h3>{{ t('Sign-in') }}</h3>
      <dl class="zr-dl">
        <dt>{{ t('User name') }}</dt><dd>{{ u.username }}</dd>
        <dt>{{ t('E-mail') }}</dt><dd>{{ u.email || '–' }}</dd>
        <dt>{{ t('Last sign-in') }}</dt><dd>{{ u.last_login ? (u.last_login | date:'dd/MM/yyyy HH:mm') : t('Never') }}</dd>
        <dt>{{ t('Change the password at the next sign-in') }}</dt><dd>{{ t(u.must_change_password ? 'Yes' : 'No') }}</dd>
      </dl></section>
    <section class="zr-box"><h3>{{ t('Access') }}</h3>
      <dl class="zr-dl">
        <dt>{{ t('Company administrator (all rights)') }}</dt><dd>{{ t(u.is_superuser ? 'Yes' : 'No') }}</dd>
        <dt>{{ t('Self-service only (employee)') }}</dt><dd>{{ t(u.is_ess ? 'Yes' : 'No') }}</dd>
        <dt>{{ t('Staff') }}</dt><dd>{{ t(u.is_staff ? 'Yes' : 'No') }}</dd>
      </dl></section>
    <section class="zr-box"><h3>{{ t('Permission groups') }}</h3>
      <span class="zr-chip" *ngFor="let g of groups">{{ g }}</span>
      <p class="zr-muted" *ngIf="!groups.length" style="margin:0">{{ t('No group') }}</p>
      <p style="margin:10px 0 0"><a class="zr-link" routerLink="/main-sidebar/settings/permission-assigned">{{ t('Assign permissions') }}</a> ·
        <a class="zr-link" routerLink="/main-sidebar/settings/branch-permissions">{{ t('Branch permissions') }}</a></p></section>
    <section class="zr-box"><h3>{{ t('Companies') }}</h3>
      <span class="zr-chip grey" *ngFor="let c of companies">{{ c }}</span>
      <p class="zr-muted" *ngIf="!companies.length" style="margin:0">–</p></section>
  </div>
</div>`,
})
export class ZUserDetailsComponent implements OnInit {
  u: any = null;
  failed = false;
  name = '';
  perms: ModelPerms = NONE;
  pwOpen = false; email = ''; otp = ''; pw = ''; otpSent = false; otpOk = false; busy = false; pwErr = '';
  t = (s: string, p?: any[]) => i18nT(s, p);
  private id = 0;

  constructor(private http: HttpClient, private rights: HrPermissionService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.rights.can('customuser').subscribe(p => { this.perms = p; this.cd.markForCheck(); });
    this.route.paramMap.subscribe(pm => { this.id = Number(pm.get('id')) || 0; this.load(); });
  }
  load(): void {
    this.http.get<any>(`${API}/users/api/user/${this.id}/?${schemaQ()}`).subscribe({
      next: d => {
        this.u = d; this.email = d?.email || ''; this.failed = !d;
        this.http.get<any>(`${API}/tools/api/user-names/?${schemaQ()}`).subscribe({ next: n => { this.name = rowsOf(n).find((x: any) => x.id === d.id)?.name || ''; this.cd.markForCheck(); }, error: () => {} });
        this.cd.markForCheck();
      },
      error: () => { this.failed = true; this.cd.markForCheck(); },
    });
  }
  get initials(): string { const s = (this.name || this.u?.username || '?').trim(); return s.split(/\s+/).slice(0, 2).map((w: string) => w.charAt(0).toUpperCase()).join(''); }
  get groups(): string[] { const g = this.u?.user_groups; return Array.isArray(g) ? g.map((x: any) => typeof x === 'object' ? x?.name : x).filter(Boolean) : (g ? [String(g)] : []); }
  get companies(): string[] { return (this.u?.allocated_tenants || []).map((c: any) => c?.name || c?.schema_name).filter(Boolean); }

  async edit(): Promise<void> { if (await openZForm(USER_FORM, { id: this.id })) { this.load(); } }

  private post(path: string, body: any): Promise<any> { return firstValueFrom(this.http.post(`${API}${path}`, body)); }
  private errText(e: any, fallback: string): string { const d = e?.error; return String((d && (d.detail || d.error || d.message)) || this.t(fallback)); }
  async sendOtp(): Promise<void> {
    this.busy = true; this.pwErr = '';
    try { await this.post('/users/send-reset-otp/', { email: this.email }); this.otpSent = true; zToast(this.t('The code was sent to {0}.', [this.email]), 'ok'); }
    catch (e) { this.pwErr = this.errText(e, 'The code could not be sent.'); }
    this.busy = false; this.cd.markForCheck();
  }
  async verifyOtp(): Promise<void> {
    this.busy = true; this.pwErr = '';
    try { await this.post('/users/verify-reset-otp/', { email: this.email, otp: this.otp }); this.otpOk = true; }
    catch (e) { this.pwErr = this.errText(e, 'The code is not right.'); }
    this.busy = false; this.cd.markForCheck();
  }
  async resetPw(): Promise<void> {
    this.busy = true; this.pwErr = '';
    try {
      await this.post('/users/reset-password/', { email: this.email, new_password: this.pw, otp: this.otp });
      zToast(this.t('The new password is set.'), 'ok');
      this.pwOpen = false; this.otpSent = this.otpOk = false; this.otp = this.pw = '';
    } catch (e) { this.pwErr = this.errText(e, 'The password was not changed.'); }
    this.busy = false; this.cd.markForCheck();
  }
}
