import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ZAppTitleComponent, ZModuleMenuComponent } from '../shared-ui/z-module-menu.component';

/** Projects app frame (v1.14.0): the module menu from shared-ui/menu-config.ts ("Projects") and the page. */
@Component({
  selector: 'app-zp-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSidenavModule, ZModuleMenuComponent, ZAppTitleComponent],
  styleUrls: ['../project-options/project-options.component.css'],
  template: `
<div class="sub-sidebar clickOutside">
  <mat-sidenav-container class="sub-sidenav-container">
    <mat-sidenav class="sub-sidenav hide-scrollbar" [opened]="isMobile ? isMenuOpen : true" [mode]="isMobile ? 'over' : 'side'" (closedStart)="isMenuOpen = false">
      <div class="wrapper">
        <div class="sidebar-top">
          <span class="sub-sidebar-title" *ngIf="isMenuOpen"><z-app-title fallback="Projects"></z-app-title></span>
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
export class ZpShellComponent {
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
