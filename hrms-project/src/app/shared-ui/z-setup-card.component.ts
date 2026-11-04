import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from './i18n.service';
import { ZGetStartedComponent } from './z-get-started.component';
import { ZSetupGateNoticeComponent } from './z-setup-gate';

/** v1.56.0 – Home: the setup guide's progress before go-live, its open warnings after (company administrators only).
 *  v1.62.1 (user request 2 Nov): until the setup is finished the full "Get started with ZEO" checklist (z-get-started: header band,
 *  pending count, the 15 rows with what is missing and Complete Now) sits at the top of Home; once every step is done it becomes
 *  the small "Setup checklist" of open warnings, or disappears. Employees (not administrators) see the "still being set up" notice. */
@Component({
  selector: 'z-setup-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TPipe, ZGetStartedComponent, ZSetupGateNoticeComponent],
  styles: [`
  .zsc-home { margin: 0 0 18px; }
  .zsc { background: #fff; border: 1px solid #e3e6ea; border-inline-start: 4px solid #5b4fe0; border-radius: 12px; padding: 12px 16px; margin: 0 0 16px; }
  .zsc h2 { display: flex; align-items: center; gap: 8px; font-size: 15px; margin: 0 0 6px; } .zsc h2 a { margin-inline-start: auto; font-size: 13px; color: #5b4fe0; font-weight: 500; }
  .zsc ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; } .zsc li { display: flex; gap: 6px; align-items: center; font-size: 13px; }
  .zsc li mat-icon { color: #b8730f; font-size: 18px; width: 18px; height: 18px; } .zsc li a { color: #1f2433; }`],
  template: `
<!-- the setup is not finished: the Get started checklist -->
<div class="zsc-home" *ngIf="d && unfinished() && ov" data-setup-card data-setup-unfinished>
  <z-get-started [ov]="ov" [gate]="d.gate" [home]="true"></z-get-started>
</div>
<!-- finished: the open warnings of go-live -->
<section class="zsc" *ngIf="d && !unfinished() && d.live && d.items.length" data-setup-card>
  <h2><mat-icon>playlist_add_check</mat-icon>{{ 'Setup checklist' | t }}
    <a routerLink="/main-sidebar/settings/setup-guide">{{ 'Setup guide' | t }}</a></h2>
  <ul><li *ngFor="let i of d.items"><mat-icon>error_outline</mat-icon>
    <a [routerLink]="i.link || '/main-sidebar/settings/setup-guide'" [queryParams]="i.link ? null : { step: i.step }">{{ i.text }}</a></li></ul>
</section>
<!-- employees: the company is still being set up -->
<z-setup-gate-notice *ngIf="employee" mode="employee" data-setup-employee></z-setup-gate-notice>`,
})
export class ZSetupCardComponent implements OnInit {
  d: any = null; ov: any = null; employee = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private router: Router) {}

  /** shown in full until go-live and while transactions still wait for a step */
  unfinished(): boolean { return !!this.d && (!this.d.live || !!this.d.gate?.blocked); }

  async ngOnInit(): Promise<void> {
    const schema = localStorage.getItem('selectedSchema') || '';
    if (!schema) { return; }
    const api = `${environment.apiBaseUrl}/zeo-admin/api/setup-guide/`;
    try {
      const r: any = await firstValueFrom(this.http.get(`${api}home/?schema=${encodeURIComponent(schema)}`));
      if (r?.admin === false) { this.employee = true; }
      if (r && r.show) {
        this.d = r;
        if (this.unfinished()) {
          try { this.ov = await firstValueFrom(this.http.get(`${api}?schema=${encodeURIComponent(schema)}&full=1`)); } catch { this.ov = null; }
        }
      }
      if (r?.auto_open) { this.router.navigate(['/main-sidebar/settings/setup-guide']); }   // a new company: the guide opens by itself the first time
    } catch { this.d = null; }
    this.cd.markForCheck();
  }
}
