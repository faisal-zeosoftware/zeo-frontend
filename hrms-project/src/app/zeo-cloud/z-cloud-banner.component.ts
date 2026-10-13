import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CloudStatus, ZeoCloudService } from '../shared-ui/zeo-cloud.service';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';

/** v1.23.0 – the ZEO Cloud status in the top bar: trial days, renewal reminder (owner), grace period, read-only. The full message is the tooltip; the owner's chip opens Settings → Subscription. */
@Component({
  selector: 'z-cloud-banner',
  standalone: true,
  imports: [CommonModule, RouterModule, ...I18N_UI],
  template: `
<ng-container *ngIf="st?.banner as b">
  <a class="zcb" *ngIf="st?.owner" [ngClass]="'zcb-' + b.kind" routerLink="/main-sidebar/settings/subscription" [title]="b.text" [attr.aria-label]="b.text">
    <span class="zcb-dot" aria-hidden="true"></span><span class="zcb-t">{{ short(b.kind) }}</span></a>
  <span class="zcb" *ngIf="!st?.owner" [ngClass]="'zcb-' + b.kind" [title]="b.text + ' ' + ('Contact the account owner.' | t)" role="status" [attr.aria-label]="b.text">
    <span class="zcb-dot" aria-hidden="true"></span><span class="zcb-t">{{ short(b.kind) }}</span></span>
</ng-container>`,
  styles: [`
:host { display: inline-flex; }
.zcb { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px; border-radius: 16px; font-size: 12.5px; font-weight: 500; white-space: nowrap; text-decoration: none; }
.zcb-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex: none; }
.zcb-trial, .zcb-renewal { background: #e9eef6; color: #2f4a73; }
.zcb-grace { background: #fff4dd; color: #7a5000; }
.zcb-readonly, .zcb-cancelled { background: #fdeceb; color: #b3261e; }
@media (max-width: 640px) { .zcb-t { display: none; } .zcb { padding: 0 10px; } }
`],
})
export class ZCloudBannerComponent implements OnInit, OnDestroy {
  st: CloudStatus | null = null;
  private sub?: Subscription;
  constructor(private cloud: ZeoCloudService) {}
  ngOnInit(): void {
    this.sub = this.cloud.status$.subscribe(s => this.st = s);
    this.cloud.load();
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  /** The short text in the top bar; the full sentence is the tooltip (and the screen-reader label). */
  short(kind: string): string {
    const st = this.st; const n = st?.days_left ?? 0;
    if (kind === 'trial') { return i18nT('Trial – {0} days left', [n]); }
    if (kind === 'renewal') { return i18nT('Renewal in {0} days', [n]); }
    if (kind === 'grace') { return i18nT('Grace period – {0} days left', [n]); }
    if (kind === 'readonly') { return i18nT('Read-only'); }
    return i18nT('Cancelled');
  }
}
