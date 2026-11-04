/**
 * v1.62.0 people – Organisation overview: the menu entry "Organisation" opens the structure (branches → departments with their
 * head count, the manager most of the department reports to and the main designations) instead of the settings switches;
 * Settings stays the next item of the side menu.
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { TPipe } from '../shared-ui/i18n.service';

@Component({
  selector: 'app-org-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TPipe],
  template: `
  <div class="oo">
    <div class="zp-cardhead">
      <h1>{{ 'Organisation' | t }}</h1>
      <p>{{ 'Branches and their departments with the number of active employees. Change the structure in Settings, the departments in People › Setup, and who reports to whom on the organisation chart.' | t }}</p>
    </div>
    <div class="oo-tiles" *ngIf="d">
      <div><span>{{ 'Branches' | t }}</span><b>{{ d.branches.length }}</b></div>
      <div><span>{{ 'Departments' | t }}</span><b>{{ d.departments }}</b></div>
      <div><span>{{ 'Active employees' | t }}</span><b>{{ d.total }}</b></div>
      <div class="lnk"><a routerLink="/main-sidebar/org-chart">{{ 'Open the organisation chart' | t }} ›</a><a routerLink="/main-sidebar/org-structure/settings">{{ 'Organisation settings' | t }} ›</a></div>
    </div>
    <p class="mut" *ngIf="loading">{{ 'Loading…' | t }}</p>
    <p class="mut err" *ngIf="err">{{ err }}</p>
    <div class="oo-grid" *ngIf="d">
      <section class="oo-br" *ngFor="let b of d.branches">
        <header><h2>{{ b.name }}</h2><span class="hc">{{ b.headcount }} {{ 'employees' | t }}</span></header>
        <table>
          <thead><tr><th>{{ 'Department' | t }}</th><th class="num">{{ 'Head count' | t }}</th><th>{{ 'Reports to' | t }}</th><th>{{ 'Main designations' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let x of b.departments"><td><b>{{ x.name }}</b></td><td class="num">{{ x.headcount }}</td><td>{{ x.manager || '–' }}</td><td class="mut">{{ x.designations }}</td></tr>
            <tr *ngIf="!b.departments.length"><td colspan="4" class="mut">{{ 'No active employee in this branch.' | t }}</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>`,
  styles: [`.oo{padding:16px 20px;color:#1f2433;font-size:13px}.mut{color:#6b7185}.err{color:#b91c1c}
  .oo-tiles{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}.oo-tiles>div{background:#fff;border:1px solid #e9eaf2;border-radius:10px;padding:12px 16px;min-width:150px}
  .oo-tiles span{display:block;font-size:11px;text-transform:uppercase;color:#6b7185;letter-spacing:.03em}.oo-tiles b{font-size:22px}
  .oo-tiles .lnk{display:flex;flex-direction:column;justify-content:center;gap:6px}.oo-tiles a{color:#4f46e5;text-decoration:none}
  .oo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:14px}
  .oo-br{background:#fff;border:1px solid #e9eaf2;border-radius:12px;overflow:hidden}.oo-br header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #eef0f5}
  .oo-br h2{font-size:16px;margin:0;font-weight:600}.hc{background:#eef2ff;color:#4338ca;border-radius:999px;padding:2px 10px;font-weight:600;font-size:12px}
  table{width:100%;border-collapse:collapse}th,td{padding:8px 16px;border-bottom:1px solid #f1f2f6;text-align:start;vertical-align:top}th{font-size:12px;color:#6b7185;font-weight:600;background:#fafbfd}.num{text-align:end}`],
})
export class OrgOverviewComponent implements OnInit {
  d: any = null; loading = true; err = '';
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    try {
      this.d = await firstValueFrom(this.http.get(`${this.rec.api}/hr-actions/api/org-overview/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`));
    } catch (e: any) { this.err = e?.error?.detail || 'The organisation could not be loaded.'; }
    this.loading = false; this.cd.detectChanges();
  }
}
