import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrgKey, OrgSettings, OrgSettingsService } from './org-settings.service';

interface Row { key: OrgKey; title: string; text: string; link: string; on: boolean; label: string; mandatory: boolean; }

/** v1.12.0 – Organisation settings: switch the extra org fields on/off, rename them, make them required. */
@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['../leave-policy/leave-policy.css', './org-structure.css'],
  template: `
<div class="container os-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Organisation settings</h1>
          <p class="lp-desc">Choose which parts of the organisation structure your company uses. A field that is switched on appears everywhere Department does –
            the employee form, details, employee list, filters, reports and transfers. Switched off, it is hidden everywhere; data already entered is kept.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || !canChange">{{ busy ? 'Saving…' : 'Save settings' }}</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
      <p class="lp-muted" *ngIf="!canChange && loaded">You can see these settings; only HR administrators (company admin or form designer rights) can change them.</p>
      <div class="os-grid">
        <div class="os-card" *ngFor="let r of rows" [class.on]="r.on">
          <h3>{{ r.title }}
            <label class="os-switch"><input type="checkbox" [(ngModel)]="r.on" [disabled]="!canChange" [attr.aria-label]="'Use ' + r.title"><span class="tr"></span>{{ r.on ? 'On' : 'Off' }}</label>
          </h3>
          <p>{{ r.text }}</p>
          <div class="row2">
            <input type="text" [(ngModel)]="r.label" [disabled]="!canChange" maxlength="40" [placeholder]="defaults[r.key]" [attr.aria-label]="'Name shown for ' + r.title">
            <label class="inline" *ngIf="r.key !== 'employee_categories'"><input type="checkbox" [(ngModel)]="r.mandatory" [disabled]="!canChange || !r.on"> Required on the employee form</label>
          </div>
          <a *ngIf="r.link" [routerLink]="r.link">Set up {{ (r.label || defaults[r.key]).toLowerCase() }}s →</a>
        </div>
      </div>
      <p class="lp-muted" style="margin-top:14px">Name shown: leave empty for the standard name (for example rename “Section” to “Unit”).
        Departments, designations and the reporting manager are always on.</p>
    </div>
  </div>
</div>`,
})
export class OrgSettingsComponent implements OnInit {
  rows: Row[] = [];
  defaults: Record<string, string> = {
    locations: 'Location', divisions: 'Division', sections: 'Section', cost_centers: 'Cost centre', grades: 'Grade',
    job_positions: 'Job position', employment_types: 'Employment type', employee_categories: 'Category',
  };
  canChange = false; loaded = false; busy = false; msg = ''; err = false;

  private readonly META: { key: OrgKey; text: string; link: string }[] = [
    { key: 'locations', text: 'Work sites (office, yard, camp) apart from the legal branch.', link: '../locations' },
    { key: 'divisions', text: 'Groups of departments; the employee’s division follows the department.', link: '../divisions' },
    { key: 'sections', text: 'Units inside a department; only sections of the employee’s department can be chosen.', link: '../sections' },
    { key: 'cost_centers', text: 'Cost centre of the employee for payroll cost and expenses (shared with Expense management).', link: '../cost-centers' },
    { key: 'employee_categories', text: 'Employee categories (staff, labour …). On by default: leave policies use them. Off hides Category everywhere but keeps the data and leave-policy mapping.', link: '' },
    { key: 'grades', text: 'Pay grades with salary band and allowed designations.', link: '../grades' },
    { key: 'job_positions', text: 'Budgeted positions with headcount, filled and vacant, and a position hierarchy.', link: '../positions' },
    { key: 'employment_types', text: 'Full time, part time, contract … with probation days and gratuity, plus a contract end date.', link: '../employment-types' },
  ];

  constructor(private org: OrgSettingsService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.org.load(true).subscribe(s => this.fill(s)); }

  private fill(s: OrgSettings): void {
    this.canChange = !!s.can_change; this.loaded = true;
    this.rows = this.META.map(m => ({
      key: m.key, text: m.text, link: m.link, title: this.defaults[m.key] + (m.key === 'cost_centers' || m.key === 'employee_categories' ? '' : 's'),
      on: !!(s as any)['use_' + m.key], label: (s.labels || {})[m.key] && (s.labels || {})[m.key] !== this.defaults[m.key] ? s.labels[m.key] : '',
      mandatory: !!(s.mandatory || {})[m.key],
    }));
    this.rows.find(r => r.key === 'cost_centers')!.title = 'Cost centres';
    this.rows.find(r => r.key === 'employee_categories')!.title = 'Employee categories';
    this.cd.markForCheck();
  }

  async save(): Promise<void> {
    const body: any = { labels: {}, mandatory: {} };
    for (const r of this.rows) { body['use_' + r.key] = r.on; body.labels[r.key] = (r.label || '').trim(); body.mandatory[r.key] = r.on && r.mandatory; }
    this.busy = true; this.msg = '';
    try {
      const s = await firstValueFrom(this.org.save(body));
      this.fill(s); this.msg = 'Settings saved. Screens opened from now on show the fields that are on.'; this.err = false;
    } catch (e: any) {
      this.msg = e?.error?.detail || 'The settings could not be saved.'; this.err = true;
    }
    this.busy = false; this.cd.markForCheck();
  }
}
