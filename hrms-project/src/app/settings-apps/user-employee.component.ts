// v1.67.6 (setup) item 9 – a login and its employee, from either side (Users, Employee directory, the employee page).
// One login – one employee: link an existing one, make the other one, or unlink. Rights and branches are checked on the server.
import { ApplicationRef, ChangeDetectorRef, Component, EnvironmentInjector, Input, OnInit, createComponent } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { zConfirm } from '../shared-ui/z-confirm';
import { zToast } from '../shared-ui/z-toast';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { appOn } from '../shared-ui/zeo-flags';

@Component({
  selector: 'z-user-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styles: [`
    .ue-veil { position: fixed; inset: 0; background: rgba(20, 18, 40, .45); z-index: 1300; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .ue-box { background: #fff; border-radius: 14px; width: 100%; max-width: 520px; max-height: 92dvh; overflow: auto; padding: 18px 20px; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
    .ue-box h2 { font-size: 18px; margin: 0 0 4px; color: #1b1640; } .ue-sub { color: #5d6670; font-size: 13px; margin: 0 0 12px; }
    .ue-card { border: 1px solid #e3e6ea; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; display: flex; gap: 10px; align-items: center; }
    .ue-card b { display: block; color: #1f2433; } .ue-card small { color: #5d6670; } .ue-grow { flex: 1; }
    .ue-f { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #3c4450; margin-bottom: 10px; }
    .ue-f input, .ue-f select { padding: 8px 10px; border: 1px solid #cfd5dc; border-radius: 8px; font: inherit; }
    .ue-tabs { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
    .ue-tabs button { border: 1px solid #cfd5dc; background: #fff; border-radius: 18px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
    .ue-tabs button.on { background: #5b4fe0; color: #fff; border-color: #5b4fe0; }
    .ue-act { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    .ue-btn { border: 1px solid #cfd5dc; background: #fff; border-radius: 8px; padding: 7px 14px; cursor: pointer; font-size: 13px; }
    .ue-btn.p { background: #5b4fe0; border-color: #5b4fe0; color: #fff; } .ue-btn.d { color: #9b2c24; border-color: #e6b8b3; } .ue-btn:disabled { opacity: .55; }
    .ue-err { background: #fde8e6; color: #9b2c24; padding: 8px 10px; border-radius: 8px; font-size: 13px; margin-bottom: 10px; }`],
  template: `
<div class="ue-veil" (click)="close()" data-user-employee>
  <div class="ue-box" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
    <ng-container *ngIf="d">
      <h2>{{ (userId ? 'Employee of this login' : 'Login of this employee') | t }}</h2>
      <p class="ue-sub">{{ 'One login belongs to one employee. The employee signs in with it; self service, approvals and their own records follow the link.' | t }}</p>
      <div class="ue-err" *ngIf="err" role="alert" data-ue-err>{{ err }}</div>
      <div class="ue-card">
        <div class="ue-grow"><small>{{ (userId ? 'Login' : 'Employee') | t }}</small><b>{{ userId ? d.user.username : (d.employee.code + ' · ' + d.employee.name) }}</b>
          <small>{{ userId ? d.user.email : d.employee.branch }}</small></div>
      </div>
      <div class="ue-card" *ngIf="linked; else none" data-ue-linked>
        <div class="ue-grow"><small>{{ (userId ? 'Employee' : 'Login') | t }}</small><b>{{ userId ? (linked.code + ' · ' + linked.name) : linked.username }}</b>
          <small>{{ userId ? linked.branch : linked.email }}</small></div>
        <button type="button" class="ue-btn d" *ngIf="d.can_link" (click)="unlink()" [disabled]="busy" data-ue-unlink>{{ 'Unlink' | t }}</button>
      </div>
      <ng-template #none>
        <div class="ue-tabs">
          <button type="button" [class.on]="mode === 'link'" (click)="mode = 'link'" *ngIf="d.can_link">{{ (userId ? 'Link an employee' : 'Link a login') | t }}</button>
          <button type="button" [class.on]="mode === 'new'" (click)="mode = 'new'" *ngIf="d.can_create">{{ (userId ? 'Make an employee' : 'Make a login') | t }}</button>
        </div>
        <ng-container *ngIf="mode === 'link'">
          <label class="ue-f">{{ (userId ? 'Employees without a login' : 'Logins without an employee') | t }}
            <select [(ngModel)]="pick" data-ue-pick><option [ngValue]="null">–</option>
              <option *ngFor="let x of (userId ? d.free_employees : d.free_users)" [ngValue]="x.id">{{ userId ? (x.code + ' · ' + x.name + (x.branch ? ' · ' + x.branch : '')) : (x.username + (x.email ? ' · ' + x.email : '')) }}</option>
            </select></label>
          <div class="ue-act"><button type="button" class="ue-btn" (click)="close()">{{ 'Cancel' | t }}</button>
            <button type="button" class="ue-btn p" (click)="link()" [disabled]="busy || !pick" data-ue-link>{{ 'Link' | t }}</button></div>
        </ng-container>
        <ng-container *ngIf="mode === 'new' && userId">
          <label class="ue-f">{{ 'First name' | t }}<input [(ngModel)]="nf.emp_first_name" data-ue-first></label>
          <label class="ue-f">{{ 'Last name' | t }}<input [(ngModel)]="nf.emp_last_name"></label>
          <label class="ue-f">{{ 'Branch' | t }}<select [(ngModel)]="nf.emp_branch_id" data-ue-branch><option [ngValue]="null">–</option><option *ngFor="let b of branches" [ngValue]="b.id">{{ b.branch_name }}</option></select></label>
          <label class="ue-f">{{ 'Employee code' | t }}<input [(ngModel)]="nf.emp_code" [placeholder]="'Empty = the next number' | t"></label>
          <div class="ue-act"><button type="button" class="ue-btn" (click)="close()">{{ 'Cancel' | t }}</button>
            <button type="button" class="ue-btn p" (click)="makeEmployee()" [disabled]="busy || !nf.emp_first_name || !nf.emp_branch_id" data-ue-make>{{ 'Make the employee' | t }}</button></div>
        </ng-container>
        <ng-container *ngIf="mode === 'new' && !userId">
          <label class="ue-f">{{ 'How the employee gets the password' | t }}
            <select [(ngModel)]="method" data-ue-method>
              <option value="auto">{{ 'Automatic: e-mail link, else a code on the mobile, else a printed slip' | t }}</option>
              <option value="link">{{ 'E-mail a set-password link' | t }}</option>
              <option value="slip">{{ 'Printed activation slip' | t }}</option>
              <option value="generate">{{ 'Generate a password (shown once)' | t }}</option>
            </select></label>
          <p class="ue-sub" *ngIf="shown">{{ shown }}</p>
          <div class="ue-act"><button type="button" class="ue-btn" (click)="close()">{{ 'Cancel' | t }}</button>
            <button type="button" class="ue-btn p" (click)="makeUser()" [disabled]="busy" data-ue-make>{{ 'Make the login' | t }}</button></div>
        </ng-container>
      </ng-template>
      <div class="ue-act" *ngIf="linked"><button type="button" class="ue-btn" (click)="close()">{{ 'Close' | t }}</button></div>
    </ng-container>
    <p class="ue-sub" *ngIf="!d && !err">{{ 'Loading…' | t }}</p>
    <div class="ue-err" *ngIf="!d && err">{{ err }}</div>
  </div>
</div>`,
})
export class ZUserEmployeeComponent implements OnInit {
  @Input() userId: number | null = null;
  @Input() employeeId: number | null = null;
  done: (changed: boolean) => void = () => {};
  d: any = null; err = ''; busy = false; mode: 'link' | 'new' = 'link'; pick: any = null; method = 'auto'; shown = '';
  nf: any = { emp_first_name: '', emp_last_name: '', emp_branch_id: null, emp_code: '' }; branches: any[] = []; changed = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  get linked(): any { return this.d ? (this.userId ? this.d.employee : this.d.user) : null; }
  private u(p: string): string { let s = ''; try { s = localStorage.getItem('selectedSchema') || ''; } catch { s = ''; } return `${environment.apiBaseUrl}${p}${p.includes('?') ? '&' : '?'}schema=${encodeURIComponent(s)}`; }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> {
    try {
      this.d = await firstValueFrom(this.http.get(this.u(`/zeo-apps/api/user-employee/?${this.userId ? 'user=' + this.userId : 'employee=' + this.employeeId}`)));
      if (!this.d.can_link && this.d.can_create) { this.mode = 'new'; }
      if (this.userId) {
        const b: any = await firstValueFrom(this.http.get(this.u('/organisation/api/Branch/')));
        this.branches = Array.isArray(b) ? b : (b.results || []);
        if (this.branches.length === 1) { this.nf.emp_branch_id = this.branches[0].id; }   // item 11
        const parts = String(this.d.user?.name || '').split(' ');
        if (!this.nf.emp_first_name && this.d.user?.name !== this.d.user?.username) { this.nf.emp_first_name = parts[0] || ''; this.nf.emp_last_name = parts.slice(1).join(' '); }
      }
    } catch (e) { this.err = httpErrorText(e); }
    this.cd.markForCheck();
  }
  private async post(body: any, ok: string): Promise<any> {
    this.busy = true; this.err = '';
    try { const r: any = await firstValueFrom(this.http.post(this.u('/zeo-apps/api/user-employee/'), body)); zToast(r?.detail || i18nT(ok)); this.changed = true; await this.load(); return r; }
    catch (e) { this.err = httpErrorText(e); return null; } finally { this.busy = false; this.cd.markForCheck(); }
  }
  link(): Promise<any> { return this.post(this.userId ? { action: 'link', user_id: this.userId, employee_id: this.pick } : { action: 'link', user_id: this.pick, employee_id: this.employeeId }, 'Linked.'); }
  async unlink(): Promise<void> {
    const eid = this.userId ? this.d.employee?.id : this.employeeId;
    if (!(await zConfirm(i18nT('Unlink the login and the employee? The employee record and the login both stay.')))) { return; }
    await this.post({ action: 'unlink', employee_id: eid }, 'Unlinked.');
  }
  makeEmployee(): Promise<any> { return this.post({ action: 'create_employee', user_id: this.userId, ...this.nf }, 'Employee made.'); }
  async makeUser(): Promise<void> {
    const r = await this.post({ action: 'create_user', employee_id: this.employeeId, method: this.method }, 'Login made.');
    if (r?.password) { this.shown = i18nT('Password (shown once): {0}', [r.password]); this.cd.markForCheck(); }
  }
  close(): void { this.done(this.changed); }
}

/** Open the window; resolves true when something was linked / made. */
export function openUserEmployee(app: ApplicationRef, env: EnvironmentInjector, ids: { userId?: number; employeeId?: number }): Promise<boolean> {
  return new Promise(resolve => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ref = createComponent(ZUserEmployeeComponent, { environmentInjector: env, hostElement: host });
    ref.instance.userId = ids.userId || null; ref.instance.employeeId = ids.employeeId || null;
    ref.instance.done = (ch: boolean) => { app.detachView(ref.hostView); ref.destroy(); host.remove(); resolve(ch); };
    app.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
  });
}
export { appOn };
