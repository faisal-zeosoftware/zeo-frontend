import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from './i18n.service';

/** v1.56.0 – Home: the setup guide's progress before go-live, its open warnings after (company administrators only). */
@Component({
  selector: 'z-setup-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TPipe],
  styles: [`
  .zsc { background: #fff; border: 1px solid #e3e6ea; border-inline-start: 4px solid #5b4fe0; border-radius: 12px; padding: 12px 16px; margin: 0 0 16px; }
  .zsc h2 { display: flex; align-items: center; gap: 8px; font-size: 15px; margin: 0 0 6px; } .zsc h2 a { margin-inline-start: auto; font-size: 13px; color: #5b4fe0; font-weight: 500; }
  .zsc-bar { height: 6px; background: #eeedfd; border-radius: 3px; overflow: hidden; margin: 4px 0 8px; } .zsc-bar i { display: block; height: 100%; background: #5b4fe0; }
  .zsc ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; } .zsc li { display: flex; gap: 6px; align-items: center; font-size: 13px; }
  .zsc li mat-icon { color: #b8730f; font-size: 18px; width: 18px; height: 18px; } .zsc li a { color: #1f2433; }`],
  template: `
<section class="zsc" *ngIf="d && (!d.live || d.items.length)" data-setup-card>
  <h2><mat-icon>playlist_add_check</mat-icon>{{ d.live ? ('Setup checklist' | t) : ('Setup progress' | t) }}
    <a routerLink="/main-sidebar/settings/setup-guide">{{ (d.live ? 'Setup guide' : 'Continue the setup') | t }}</a></h2>
  <ng-container *ngIf="!d.live"><div class="zsc-bar"><i [style.width.%]="d.done / d.total * 100"></i></div>
    <p style="margin:0;font-size:13px">{{ '{0} of {1} complete' | t:[d.done, d.total] }}</p></ng-container>
  <ul *ngIf="d.live"><li *ngFor="let i of d.items"><mat-icon>error_outline</mat-icon>
    <a [routerLink]="i.link || '/main-sidebar/settings/setup-guide'" [queryParams]="i.link ? null : { step: i.step }">{{ i.text }}</a></li></ul>
</section>`,
})
export class ZSetupCardComponent implements OnInit {
  d: any = null;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private router: Router) {}
  async ngOnInit(): Promise<void> {
    const schema = localStorage.getItem('selectedSchema') || '';
    if (!schema) { return; }
    try {
      const r: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/zeo-admin/api/setup-guide/home/?schema=${encodeURIComponent(schema)}`));
      if (r && r.show) { this.d = r; }
      if (r?.auto_open) { this.router.navigate(['/main-sidebar/settings/setup-guide']); }   // a new company: the guide opens by itself the first time
    } catch { this.d = null; }
    this.cd.markForCheck();
  }
}
