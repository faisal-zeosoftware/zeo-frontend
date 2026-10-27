import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { httpErrorText } from './z-http-error.interceptor';
import { TPipe, i18nT } from './i18n.service';

/** v1.56.0 – /set-password?t=… : the employee chooses their own password from the e-mail link (no login needed). */
@Component({
  selector: 'z-set-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [`
  .zsp { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f4f5fa; padding: 16px; }
  .zsp-box { background: #fff; border-radius: 14px; border: 1px solid #e3e6ea; padding: 26px 24px; width: 100%; max-width: 400px; }
  .zsp h1 { font-size: 20px; margin: 0 0 4px; color: #1b1640; } .zsp p { color: #5d6670; font-size: 13.5px; margin: 0 0 14px; }
  .zsp label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: #5d6670; margin-bottom: 12px; }
  .zsp input { padding: 10px; border: 1px solid #cfd5dc; border-radius: 8px; font: inherit; font-size: 14px; }
  .zsp button { width: 100%; padding: 11px; border: 0; border-radius: 8px; background: #5b4fe0; color: #fff; font-size: 14px; cursor: pointer; }
  .zsp button:disabled { opacity: .6; } .zsp-err { color: #9b2c24; font-size: 13px; margin: 0 0 10px; } .zsp-ok { color: #1d6b37; }
  .zsp a { color: #5b4fe0; }`],
  template: `
<div class="zsp" data-set-password><div class="zsp-box">
  <h1>Choose your password</h1>
  <p *ngIf="who">{{ 'Your user name is {0}.' | t:[who] }}</p>
  <p class="zsp-err" *ngIf="err" role="alert">{{ err }}</p>
  <ng-container *ngIf="who && !done">
    <label>{{ 'New password' | t }}<input type="password" [(ngModel)]="pw" autocomplete="new-password" data-pw></label>
    <label>{{ 'The same password again' | t }}<input type="password" [(ngModel)]="pw2" autocomplete="new-password" data-pw2></label>
    <button type="button" (click)="save()" [disabled]="busy || !pw" data-save>{{ 'Save the password' | t }}</button>
  </ng-container>
  <p class="zsp-ok" *ngIf="done" data-done>{{ 'Your password is saved.' | t }} <a routerLink="/login">{{ 'Sign in' | t }}</a></p>
</div></div>`,
})
export class ZSetPasswordComponent implements OnInit {
  t = ''; who = ''; pw = ''; pw2 = ''; err = ''; busy = false; done = false;
  constructor(private http: HttpClient, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}
  private url(): string { return `${environment.apiBaseUrl}/users/sign-in-link/`; }
  async ngOnInit(): Promise<void> {
    this.t = this.route.snapshot.queryParamMap.get('t') || '';
    try { const r: any = await firstValueFrom(this.http.get(this.url(), { params: { t: this.t } })); this.who = r.username; }
    catch (e) { this.err = httpErrorText(e); }
    this.cd.markForCheck();
  }
  async save(): Promise<void> {
    if (this.pw !== this.pw2) { this.err = i18nT('The two passwords are not the same.'); return; }
    this.busy = true; this.err = '';
    try { await firstValueFrom(this.http.post(this.url(), { t: this.t, password: this.pw, confirm: this.pw2 })); this.done = true; }
    catch (e) { this.err = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }
}
