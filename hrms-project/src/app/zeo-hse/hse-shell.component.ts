import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { HSE_BASE, HseApiService } from './hse-api.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ZAppTitleComponent, ZModuleMenuComponent } from '../shared-ui/z-module-menu.component';

/** HSE app frame (v1.16.0): the module menu from shared-ui/menu-config.ts ("HSE") and the page. */
@Component({
  selector: 'app-hse-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSidenavModule, ZModuleMenuComponent, ZAppTitleComponent],
  styleUrls: ['../project-options/project-options.component.css'],
  template: `
<div class="sub-sidebar clickOutside">
  <mat-sidenav-container class="sub-sidenav-container">
    <mat-sidenav class="sub-sidenav hide-scrollbar" [opened]="isMobile ? isMenuOpen : true" [mode]="isMobile ? 'over' : 'side'" (closedStart)="isMenuOpen = false">
      <div class="wrapper">
        <div class="sidebar-top">
          <span class="sub-sidebar-title" *ngIf="isMenuOpen"><z-app-title fallback="HSE"></z-app-title></span>
          <button type="button" class="btn-collapse" (click)="isMenuOpen = !isMenuOpen" aria-label="Toggle Navigation">
            <mat-icon>{{ isMenuOpen ? 'chevron_left' : 'menu' }}</mat-icon>
          </button>
        </div>
        <nav class="sidebar hide-scrollbar" [class.menu-open]="isMenuOpen" [class.menu-close]="!isMenuOpen">
          <z-module-menu [open]="isMenuOpen" (picked)="closeOnMobile()"></z-module-menu>
        </nav>
      </div>
    </mat-sidenav>
    <main class="sub-content-area">
      <button type="button" class="mobile-submenu-fab" *ngIf="isMobile && !isMenuOpen" (click)="isMenuOpen = true" aria-label="Open submenu">
        <mat-icon>menu</mat-icon>
      </button>
      <router-outlet></router-outlet>
    </main>
  </mat-sidenav-container>
</div>`,
})
export class HseShellComponent implements OnDestroy {
  private sub: Subscription;

  /** v1.17.0 – until HSE is activated every page goes to the activation step (industry from the company master, changeable). */
  constructor(private api: HseApiService, private router: Router) {
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.checkActive());
    this.checkActive();
  }

  private async checkActive(): Promise<void> {
    if (this.router.url.includes('/zeo-hse/activate')) return;
    try {
      const lk = await this.api.lookups();
      if (lk && lk.activated === false) this.router.navigate([HSE_BASE, 'activate']);
    } catch { /* the page shows its own error */ }
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  isMobile = window.innerWidth <= 991.98;
  isMenuOpen = window.innerWidth > 991.98;

  @HostListener('window:resize')
  onResize(): void {
    const was = this.isMobile;
    this.isMobile = window.innerWidth <= 991.98;
    if (was && !this.isMobile) this.isMenuOpen = true;
    if (!was && this.isMobile) this.isMenuOpen = false;
  }

  closeOnMobile(): void { if (this.isMobile) this.isMenuOpen = false; }
}
