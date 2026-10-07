import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
}

/** Sub-sidebar shared by Performance, Recruitment and Learning (same look as Project Options). */
@Component({
  selector: 'app-hr-module-options',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSidenavModule],
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

  constructor(private route: ActivatedRoute, private perms: HrPermissionService) {}

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
    this.items.forEach(i => this.perms.canView(i.model, i.selfService).subscribe(v => (this.visible[i.path] = v)));
  }

  toggleSidebarMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeOnMobile(): void {
    if (this.isMobile) this.isMenuOpen = false;
  }
}
