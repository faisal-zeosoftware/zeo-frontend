import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18N_UI } from '../shared-ui/i18n.service';

/**
 * v1.62.0 release checklist Part C §37 "Menu by rights": shown instead of a screen whose menu entry the user may not see
 * (menu-rights.guard.ts), e.g. a page opened by typing its address. Same look as "Page not found".
 */
@Component({
  selector: 'app-no-access',
  standalone: true,
  imports: [...I18N_UI, CommonModule, RouterModule, MatIconModule],
  template: `
<div class="nf-wrap" role="main">
  <div class="nf-card" data-no-access>
    <mat-icon class="nf-icon" aria-hidden="true">lock</mat-icon>
    <h1 class="nf-title">{{ 'No access' | t }}</h1>
    <p class="nf-text">{{ 'You do not have the right to open this page.' | t }} <b *ngIf="page">{{ page | t }}</b></p>
    <p class="nf-text">{{ 'Ask your administrator if you need it.' | t }}</p>
    <div class="nf-actions">
      <a class="nf-btn primary" routerLink="/main-sidebar/home">{{ 'Go to Home' | t }}</a>
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
    .nf-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }
    .nf-btn { display: inline-flex; align-items: center; min-height: 38px; padding: 0 16px; border-radius: 8px; border: 1px solid #c9cde0; background: #fff; color: #1f2433; font-size: 14px; cursor: pointer; text-decoration: none; }
    .nf-btn.primary { background: #5b4ff5; border-color: #5b4ff5; color: #fff; }
    .nf-btn:focus-visible { outline: 2px solid #5b4ff5; outline-offset: 2px; }
  `],
})
export class NoAccessComponent {   // v1.62.0
  page = '';
  constructor(private router: Router, private location: Location) {
    const st = this.router.getCurrentNavigation()?.extras?.state as { page?: string } | undefined;
    this.page = st?.page || (history.state && history.state.page) || '';
  }
  back(): void {
    if (window.history.length > 1) { this.location.back(); } else { this.router.navigateByUrl('/main-sidebar/home'); }
  }
}
