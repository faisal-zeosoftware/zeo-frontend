import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { flagsVisible } from '../../shared-ui/zeo-flags';   // v1.38.1
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { ALL_APPS, MenuApp, appForUrl } from '../../shared-ui/menu-config';
import { ZModuleMenuComponent } from '../../shared-ui/z-module-menu.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HrPermissionService } from '../hr-permission.service';

export interface ModuleMenuItem {
  path: string;
  label: string;
  icon: string;
  /** model used for the view_<model> permission check */
  model?: string;
  /** visible to every logged-in employee (ESS self-service pages) */
  selfService?: boolean;
  /** v1.38.1: only while this app is active in the company (Settings → Apps), e.g. 'people' */
  app?: string;
}

/** Sub-sidebar shared by Performance, Recruitment and Learning (same look as Project Options). */
@Component({
  selector: 'app-hr-module-options',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSidenavModule, ZModuleMenuComponent],
  templateUrl: './module-options.component.html',
  styleUrl: './module-options.component.css',
})
export class ModuleOptionsComponent implements OnInit {
  title = '';
  base = '';
  items: ModuleMenuItem[] = [];
  visible: Record<string, boolean> = {};

  isMobile: boolean = window.innerWidth <= 991.98;
  isMenuOpen: boolean = window.innerWidth > 991.98;

  /** v1.40.1: the app of the main menu when it is not this module's own app (the page was opened from that app's menu). */
  otherApp: MenuApp | null = null;

  private router = inject(Router);   // v1.40.1 (inject: subclasses keep their constructors)

  constructor(private route: ActivatedRoute, private perms: HrPermissionService) {
    this.router.events.subscribe(e => { if (e instanceof NavigationEnd) { this.whichApp(); } });
  }

  private whichApp(): void {
    const seg = (this.base || '').replace(/^.*\/main-sidebar\//, '').split('/')[0];
    const own = ALL_APPS.find(a => (a.parents || []).includes(seg) || (a.sections || []).some(s => s.items.some(i => i.link.startsWith(this.base + '/'))));
    const cur = appForUrl(this.router.url);
    this.otherApp = cur && own && cur.key !== own.key && (cur.sections || []).length ? cur : null;
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 991.98;
    if (wasMobile && !this.isMobile) this.isMenuOpen = true;
    if (!wasMobile && this.isMobile) this.isMenuOpen = false;
  }

  ngOnInit(): void {
    const d = this.route.snapshot.data;
    this.title = d['title'];
    this.base = d['base'];
    this.items = d['menu'] || [];
    this.whichApp();   // v1.40.1
    this.items.forEach(i => this.perms.canView(i.model, i.selfService).subscribe(v => (this.visible[i.path] = v && (!i.app || flagsVisible('app:' + i.app)))));
  }

  toggleSidebarMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeOnMobile(): void {
    if (this.isMobile) this.isMenuOpen = false;
  }
}
