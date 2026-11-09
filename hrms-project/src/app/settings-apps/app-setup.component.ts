// v1.67.6 (setup) item 5 – Settings › Apps › <app> › Setup: the required setup of Projects, CRM, Property, Maintenance,
// Asset Management, People and HSE (HR and Payroll keep the setup guide). Until it is complete the app's transactions wait
// (409 setup_required) – the administrator can allow them earlier, as in HR.
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI } from '../shared-ui/i18n.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zConfirm } from '../shared-ui/z-confirm';

@Component({
  selector: 'app-app-setup',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './settings-apps.css'],
  styles: [`
    .as-list { display: flex; flex-direction: column; gap: 10px; }
    .as-step { display: flex; gap: 12px; align-items: flex-start; background: #fff; border: 1px solid #e3e6ea; border-radius: 12px; padding: 12px 14px; }
    .as-no { width: 30px; height: 30px; border-radius: 50%; background: #eef0f2; color: #3c4450; display: flex; align-items: center; justify-content: center; font-weight: 600; flex: none; }
    .as-step.done .as-no { background: #e3f4ea; color: #1d6b37; } .as-step.skipped .as-no { background: #fff4dc; color: #7a5200; }
    .as-body { flex: 1; } .as-body b { display: block; color: #1f2433; } .as-body small { color: #5d6670; }
    /* v1.67.8 (fixes) item 8 */
    .as-body .as-note { display: block; margin-top: 6px; padding: 8px 10px; border-radius: 8px; background: #eef3fb; color: #1f4f8a; }
    .as-miss { margin-top: 8px; padding: 8px 12px; border-radius: 8px; background: #fff6e5; color: #6b4a00; font-size: 12.5px; }
    .as-miss b { color: #6b4a00 !important; font-size: 12.5px; } .as-miss ul { margin: 4px 0 0; padding-inline-start: 18px; } .as-miss li { margin: 2px 0; }
    .as-st { font-size: 12px; padding: 2px 8px; border-radius: 10px; background: #eef0f2; } .as-st.done { background: #e3f4ea; color: #1d6b37; }
    .as-st.skipped { background: #fff4dc; color: #7a5200; } .as-st.open { background: #fde8e6; color: #9b2c24; }
    .as-acts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .as-bar { height: 8px; background: #eef0f2; border-radius: 4px; overflow: hidden; margin: 6px 0 14px; } .as-bar span { display: block; height: 100%; background: #5b4fe0; }
    .as-allow { display: flex; gap: 10px; align-items: center; background: #fff; border: 1px dashed #cfd5dc; border-radius: 12px; padding: 12px 14px; margin-top: 14px; }`],
  template: `
<div class="container sa-wrap" data-app-setup-page *ngIf="d">
  <div class="lp-head">
    <div>
      <h1 class="page-title">{{ 'Setup of {0}' | t:[d.title] }}</h1>
      <p class="lp-desc">{{ 'Finish these steps before the app is used for transactions. Steps marked "automatic" tick themselves when the data is there.' | t }}</p>
    </div>
    <a class="lp-btn" routerLink="/main-sidebar/settings/apps">{{ 'Back to Apps' | t }}</a>
  </div>
  <div class="lp-msg err" *ngIf="msg" role="alert">{{ msg }}</div>
  <div class="sa-core" *ngIf="!d.enforced" data-setup-complete><mat-icon aria-hidden="true">check_circle</mat-icon>
    <span>{{ 'This app is not waiting for its setup: it was in use already, or the setup is complete. The steps below stay as a checklist.' | t }}</span></div>
  <div class="sa-core" *ngIf="d.enforced && d.blocked" data-setup-blocked><mat-icon aria-hidden="true">pending_actions</mat-icon>
    <span>{{ 'Transactions of {0} wait until these steps are done: {1}.' | t:[d.title, d.open.join(', ')] }}</span></div>
  <div class="sa-core" *ngIf="d.enforced && !d.blocked && d.allow"><mat-icon aria-hidden="true">lock_open</mat-icon>
    <span>{{ 'Transactions are allowed before the setup is finished (switched on by an administrator).' | t }}</span></div>
  <div class="as-bar" [attr.aria-label]="done() + ' / ' + d.steps.length"><span [style.width.%]="100 * done() / d.steps.length"></span></div>
  <div class="as-list">
    <div class="as-step" *ngFor="let s of d.steps; let i = index" [class.done]="s.status === 'done'" [class.skipped]="s.status === 'skipped'" [attr.data-step]="s.key">
      <div class="as-no">{{ s.status === 'done' ? '✓' : i + 1 }}</div>
      <div class="as-body">
        <b>{{ s.title | t }} <span class="as-st" [ngClass]="s.status">{{ statusText(s.status) | t }}</span> <small *ngIf="s.auto">· {{ 'automatic' | t }}</small></b>
        <small>{{ s.hint | t }}</small>
        <!-- v1.67.8 (fixes) item 8: why the Accounts step was skipped, or the accounts that are missing (texts in the user's language) -->
        <small class="as-note" *ngIf="s.note" data-step-note>{{ s.note }}</small>
        <div class="as-miss" *ngIf="s.missing?.length" data-step-missing>
          <b>{{ 'Missing ({0})' | t:s.missing.length }}</b>
          <ul><li *ngFor="let m of s.missing">{{ m }}</li></ul>
        </div>
        <div class="as-acts" *ngIf="d.can_manage">
          <a class="lp-btn" *ngIf="s.link" [routerLink]="s.link">{{ 'Open (button)' | t }}<!-- v1.67.9 (screens): the action word, not the state --></a>
          <button type="button" class="lp-btn" *ngIf="s.status !== 'done' && !s.auto" (click)="mark(s, 'done')" [disabled]="busy" data-step-done>{{ 'Mark as done' | t }}</button>
          <button type="button" class="lp-btn" *ngIf="s.status === 'open' && s.can_skip" (click)="mark(s, 'skipped')" [disabled]="busy" data-step-skip>{{ 'Skip' | t }}</button>
          <button type="button" class="lp-btn" *ngIf="(s.status === 'skipped' && !s.note) || (s.status === 'done' && !s.auto)" (click)="mark(s, 'open')" [disabled]="busy">{{ 'Open again' | t }}</button>
        </div>
      </div>
    </div>
  </div>
  <div class="as-allow" *ngIf="d.can_manage && d.enforced">
    <span style="flex:1">{{ 'Allow transactions before the setup is finished' | t }}</span>
    <button type="button" class="lp-btn" [class.primary]="!d.allow" (click)="allow(!d.allow)" [disabled]="busy" data-setup-allow>{{ (d.allow ? 'Wait for the setup again' : 'Allow now') | t }}</button>
  </div>
</div>
<p class="lp-muted container" *ngIf="!d && !msg">{{ 'Loading…' | t }}</p>
<div class="lp-msg err container" *ngIf="!d && msg">{{ msg }}</div>`,
})
export class AppSetupComponent implements OnInit {
  d: any = null; msg = ''; busy = false; key = '';
  constructor(private http: HttpClient, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}
  private u(): string { let s = ''; try { s = localStorage.getItem('selectedSchema') || ''; } catch { s = ''; } return `${environment.apiBaseUrl}/zeo-apps/api/apps/${this.key}/setup/?schema=${encodeURIComponent(s)}`; }
  ngOnInit(): void { this.route.paramMap.subscribe(p => { this.key = p.get('app') || ''; this.load(); }); }
  done(): number { return (this.d?.steps || []).filter((s: any) => s.status === 'done' || s.status === 'skipped').length; }
  statusText(s: string): string { return ({ done: 'Done', skipped: 'Skipped', open: 'To do' } as any)[s] || s; }
  async load(): Promise<void> { this.msg = ''; try { this.d = await firstValueFrom(this.http.get(this.u())); } catch (e) { this.msg = httpErrorText(e); } this.cd.markForCheck(); }
  async mark(s: any, status: string): Promise<void> {
    this.busy = true;
    try { this.d = await firstValueFrom(this.http.post(this.u(), { step: s.key, status })); } catch (e) { this.msg = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }
  async allow(on: boolean): Promise<void> {
    if (on && !(await zConfirm('Allow transactions of this app before its setup is finished?'))) { return; }
    this.busy = true;
    try { this.d = await firstValueFrom(this.http.post(this.u(), { allow: on })); } catch (e) { this.msg = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }
}

export const APP_SETUP_ROUTES: Routes = [
  { path: 'app-setup/:app', component: AppSetupComponent, data: { title: 'App setup' } },
];
