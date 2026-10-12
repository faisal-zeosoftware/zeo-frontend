import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18N_UI } from '../shared-ui/i18n.service';
import { AuthenticationService } from '../login/authentication.service';

/**
 * v1.15.1 – "Page not found" for every address the app does not know (top level and under /main-sidebar/).
 * Replaces the old catch-all that sent bad addresses to /main-content, a route that does not exist (blank page).
 * Logged in → link to the dashboard; logged out → link to the login page.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [...I18N_UI, CommonModule, RouterModule, MatIconModule],
  template: `
<div class="nf-wrap" role="main">
  <div class="nf-card">
    <mat-icon class="nf-icon" aria-hidden="true">travel_explore</mat-icon>
    <h1 class="nf-title">{{ 'Page not found' | t }}</h1>
    <p class="nf-text">{{ 'There is no page at this address. It may be mistyped, or the page has moved.' | t }}</p>
    <p class="nf-url" *ngIf="url"><code>{{ url }}</code></p>
    <div class="nf-actions">
      <a *ngIf="loggedIn" class="nf-btn primary" [routerLink]="home">{{ 'Go to the dashboard' | t }}</a>
      <a *ngIf="!loggedIn" class="nf-btn primary" routerLink="/login">{{ 'Go to the login page' | t }}</a>
      <button type="button" class="nf-btn" (click)="back()">{{ 'Go back' | t }}</button>
    </div>
  </div>
</div>`,
  styles: [`
    .nf-wrap { min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; box-sizing: border-box; }
    .nf-card { max-width: 520px; width: 100%; text-align: center; background: #fff; border: 1px solid #e3e6ef; border-radius: 12px; padding: 32px 24px; box-shadow: 0 2px 10px rgba(20, 30, 60, .06); }
    .nf-icon { font-size: 48px; width: 48px; height: 48px; color: #5b4ff5; }
    .nf-title { font-size: 22px; font-weight: 600; margin: 12px 0 8px; color: #1f2433; }
    .nf-text { color: #4a5068; margin: 0 0 8px; line-height: 1.5; }
    .nf-url code { display: inline-block; max-width: 100%; overflow-wrap: anywhere; background: #f3f4f8; color: #4a5068; padding: 4px 8px; border-radius: 6px; font-size: 13px; }
    .nf-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }
    .nf-btn { display: inline-flex; align-items: center; min-height: 38px; padding: 0 16px; border-radius: 8px; border: 1px solid #c9cde0; background: #fff; color: #1f2433; font-size: 14px; cursor: pointer; text-decoration: none; }
    .nf-btn.primary { background: #5b4ff5; border-color: #5b4ff5; color: #fff; }
    .nf-btn:focus-visible { outline: 2px solid #5b4ff5; outline-offset: 2px; }
  `],
})
export class NotFoundComponent implements OnInit {
  loggedIn = false;
  url = '';
  /** the Dashboard of the main menu (every logged-in user may open it) */
  home = '/main-sidebar/dashboard-contents';

  constructor(private auth: AuthenticationService, private router: Router, private location: Location) {}

  ngOnInit(): void {
    try { this.loggedIn = this.auth.isLoggedIn(); } catch { this.loggedIn = false; }
    this.url = this.router.url || '';
  }

  back(): void {
    if (window.history.length > 1) { this.location.back(); } else { this.router.navigateByUrl(this.loggedIn ? this.home : '/login'); }
  }
}
