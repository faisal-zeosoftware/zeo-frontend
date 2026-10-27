/**
 * v1.47.0 – "What's new": the release notes of this version, shown once on the first visit after an update
 * (chatter/api/whats-new remembers the version each user has seen); opened again from Help → What's new.
 */
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { I18N_UI } from './i18n.service';
import { ZCommandService } from './z-command.service';
import { APP_VERSION as ZEO_VERSION } from './version';

export function newer(a: string, b: string): boolean {
  const p = (v: string) => (v || '0').split('.').map(x => parseInt(x, 10) || 0);
  const x = p(a), y = p(b);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) { return (x[i] || 0) > (y[i] || 0); } }
  return false;
}

@Component({
  selector: 'z-whats-new',
  standalone: true,
  imports: [CommonModule, MatIconModule, ...I18N_UI],
  encapsulation: ViewEncapsulation.None,
  template: `
  <ng-container *ngIf="show">
    <div class="zwn-back" (click)="close()"></div>
    <div class="zwn" role="dialog" aria-modal="true" aria-labelledby="zwn-h">
      <header>
        <div class="zwn-badge"><mat-icon aria-hidden="true">new_releases</mat-icon></div>
        <div><h2 id="zwn-h">{{ "What's new in ZEO {0}" | t:rel.version }}</h2><p>{{ rel.title | t }}</p></div>
        <button type="button" class="zwn-x" (click)="close()" [attr.aria-label]="'Close' | t"><mat-icon>close</mat-icon></button>
      </header>
      <ul class="zwn-list">
        <li *ngFor="let it of rel.items"><mat-icon aria-hidden="true">{{ it.icon }}</mat-icon><div><b>{{ it.title | t }}</b><span>{{ it.text | t }}</span></div></li>
      </ul>
      <details class="zwn-old" *ngIf="older.length"><summary>{{ 'Earlier releases' | t }}</summary>
        <section *ngFor="let r of older"><h3>{{ r.version }} – {{ r.title | t }}</h3>
          <ul><li *ngFor="let it of r.items"><b>{{ it.title | t }}</b> – {{ it.text | t }}</li></ul></section>
      </details>
      <footer>
        <button type="button" class="zr-btn" (click)="tour()"><mat-icon>tour</mat-icon>{{ 'Take the tour' | t }}</button>
        <button type="button" class="zr-btn primary" (click)="close()">{{ 'Got it' | t }}</button>
      </footer>
    </div>
  </ng-container>`,
  styles: [`
  .zwn-back { position: fixed; inset: 0; background: rgba(20, 18, 48, .38); z-index: 1310; }
  .zwn { position: fixed; top: 8vh; left: 50%; transform: translateX(-50%); width: min(600px, calc(100vw - 32px)); max-height: 82vh; overflow-y: auto;
         background: #fff; border-radius: 16px; box-shadow: 0 24px 64px rgba(20, 18, 48, .28); z-index: 1311; color: #262A3D; }
  .zwn header { display: flex; gap: 14px; align-items: center; padding: 20px 20px 8px; }
  .zwn header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1B1640; } .zwn header p { margin: 2px 0 0; color: #6B7185; }
  .zwn-badge { width: 44px; height: 44px; border-radius: 12px; background: #EEEDFD; display: grid; place-items: center; color: #5B4FE0; flex: none; }
  .zwn-x { margin-inline-start: auto; align-self: flex-start; border: 0; background: none; cursor: pointer; color: #6B7185; padding: 4px; border-radius: 6px; display: flex; }
  .zwn-list { list-style: none; margin: 0; padding: 8px 20px; display: grid; gap: 4px; }
  .zwn-list li { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F0F1F6; }
  .zwn-list li:last-child { border-bottom: 0; }
  .zwn-list mat-icon { color: #5B4FE0; flex: none; }
  .zwn-list b { display: block; font-weight: 600; color: #1B1640; } .zwn-list span { color: #3B4057; font-size: 13.5px; line-height: 1.45; }
  .zwn-old { margin: 0 20px 8px; color: #3B4057; font-size: 13px; } .zwn-old summary { cursor: pointer; color: #5B4FE0; padding: 6px 0; }
  .zwn-old h3 { font-size: 13.5px; margin: 10px 0 4px; color: #1B1640; } .zwn-old ul { margin: 0; padding-inline-start: 18px; }
  .zwn footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px 18px; }
  `],
})
export class ZWhatsNewComponent implements OnInit, OnDestroy {
  show = false; rel: any = null; older: any[] = [];
  private data: any = null;
  private sub?: Subscription;
  private seen = '';
  constructor(private cmd: ZCommandService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.cmd.cmd$.subscribe(c => { if (c.cmd === 'whatsnew') { this.open(true); } });
    setTimeout(() => this.open(false), 2500);   // after the first page has settled
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  async open(forced: boolean): Promise<void> {
    if (!this.router.url.startsWith('/main-sidebar/')) { return; }
    try { this.data = this.data || await this.cmd.get('whats-new/'); } catch { return; }
    const rels: any[] = this.data.releases || [];
    const cur = rels.find(r => r.version === ZEO_VERSION) || rels[0];
    if (!cur) { return; }
    this.seen = this.data.seen || '';
    const fresh = newer(cur.version, this.seen);
    if (fresh) { this.cmd.flags$.next({ ...(this.cmd.flags$.value || {}), __whatsnew_fresh: true }); }
    if (!forced && !fresh) { return; }
    if (!forced && document.querySelector('[aria-modal="true"]')) { return; }   // another window is open – the Help dot stays
    this.rel = cur; this.older = rels.filter(r => r !== cur && newer(r.version, '0')).slice(0, 3);
    this.show = true; this.cd.markForCheck();
  }

  async close(): Promise<void> {
    this.show = false;
    if (this.rel && newer(this.rel.version, this.seen)) {
      this.seen = this.rel.version; if (this.data) { this.data.seen = this.rel.version; }
      try { await this.cmd.post('whats-new/', { seen: this.rel.version }); } catch { /* shown again next time */ }
    }
    const f = { ...(this.cmd.flags$.value || {}) }; delete f['__whatsnew_fresh']; this.cmd.flags$.next(f);
    this.cd.markForCheck();
  }
  tour(): void { this.close(); this.cmd.open('tour', 'force'); }
}
