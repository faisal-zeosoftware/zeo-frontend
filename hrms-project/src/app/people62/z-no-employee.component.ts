/**
 * v1.62.0 people – one explanation for the personal pages (My profile, My leave, My attendance, My learning) when the login is not
 * linked to an employee record (an administrator or an HR user without a file): what it means and where to link it, instead of an
 * empty page or a red "404".
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TPipe } from '../shared-ui/i18n.service';

@Component({
  selector: 'z-no-employee',
  standalone: true,
  imports: [CommonModule, RouterModule, TPipe],
  template: `
  <div class="zne" role="status">
    <span class="material-icons zne-i" aria-hidden="true">person_off</span>
    <div>
      <h2>{{ 'Your login is not linked to an employee record' | t }}</h2>
      <p>{{ (what || 'This page shows your own data – leave, attendance, payslips, profile.') | t }} {{ 'It needs an employee record linked to your login.' | t }}</p>
      <p>{{ 'An administrator links it in Settings › Users (choose the user, then the employee). For the company’s data use the HR screens.' | t }}</p>
      <div class="zne-a"><a routerLink="/main-sidebar/settings/user-master">{{ 'Open Users' | t }}</a><a routerLink="/main-sidebar/home">{{ 'Back to Home' | t }}</a></div>
    </div>
  </div>`,
  styles: [`.zne{display:flex;gap:16px;align-items:flex-start;background:#fff;border:1px solid #e3e7ef;border-radius:12px;padding:20px 22px;margin:16px 0;max-width:820px}
  .zne-i{font-size:34px;color:#7c6cf0}.zne h2{font-size:17px;margin:0 0 6px;font-weight:600;color:#1f2433}.zne p{margin:0 0 6px;color:#5d6670;font-size:13px}
  .zne-a{display:flex;gap:10px;margin-top:10px}.zne-a a{border:1px solid #cbd5e1;border-radius:8px;padding:6px 12px;color:#1f2433;text-decoration:none;font-size:13px}`],
})
export class ZNoEmployeeComponent {
  @Input() what = '';
}
