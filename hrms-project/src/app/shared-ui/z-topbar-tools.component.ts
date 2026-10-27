/**
 * v1.47.0 – top bar buttons: search (Ctrl+K), create (+) and help (shortcuts, the tour of this page, what's new).
 * The windows themselves are z-palette, z-tour and z-whats-new (placed once in the main layout).
 */
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { I18N_UI } from './i18n.service';
import { ZCommandService } from './z-command.service';

@Component({
  selector: 'z-topbar-tools',
  standalone: true,
  imports: [CommonModule, MatIconModule, ...I18N_UI],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="ztt">
    <button type="button" class="ztt-search" data-cmd="search" (click)="cmd.open('search')" [attr.aria-label]="'Search everything' | t" [title]="('Search everything' | t) + ' (Ctrl+K)'">
      <mat-icon aria-hidden="true">search</mat-icon><span class="ztt-l">{{ 'Search' | t }}</span><kbd class="ztt-k">Ctrl K</kbd></button>
    <button type="button" class="zr-todo-btn" data-cmd="quick" (click)="cmd.open('quick')" [attr.aria-label]="'Create' | t" [title]="('Create' | t) + ' (N)'">
      <mat-icon>add_circle_outline</mat-icon></button>
    <span class="ztt-help">
      <button type="button" class="zr-todo-btn" data-cmd="help" (click)="toggle($event)" [attr.aria-expanded]="open" aria-haspopup="menu" [attr.aria-label]="'Help' | t" [title]="'Help' | t">
        <mat-icon>help_outline</mat-icon><span class="ztt-dot" *ngIf="fresh" aria-hidden="true"></span></button>
      <div class="ztt-menu" role="menu" *ngIf="open" (click)="$event.stopPropagation()">
        <button type="button" role="menuitem" (click)="run('whatsnew')"><mat-icon>new_releases</mat-icon>{{ "What's new" | t }}<span class="ztt-new" *ngIf="fresh">{{ 'New' | t }}</span></button>
        <button type="button" role="menuitem" data-help="tour" (click)="run('tour', 'force')"><mat-icon>tour</mat-icon>{{ 'Take the tour of this page' | t }}</button>
        <button type="button" role="menuitem" (click)="run('keys')"><mat-icon>keyboard</mat-icon>{{ 'Keyboard shortcuts' | t }}<kbd>?</kbd></button>
        <button type="button" role="menuitem" (click)="run('search')"><mat-icon>search</mat-icon>{{ 'Search everything' | t }}<kbd>Ctrl K</kbd></button>
        <hr>
        <label class="ztt-chk"><input type="checkbox" [checked]="!toursOff" (change)="setTours($any($event.target).checked)"> {{ 'Show a tour the first time I open a page' | t }}</label>
      </div>
    </span>
  </div>`,
  styles: [`
  .ztt { display: flex; align-items: center; gap: 4px; }
  .ztt-search { display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 8px 0 10px; border: 1px solid #E3E5EE; border-radius: 9px; background: #F7F8FB;
                color: #6B7185; font: inherit; font-size: 13px; cursor: pointer; min-width: 190px; }
  .ztt-search:hover { border-color: #5B4FE0; color: #1B1640; }
  .ztt-search mat-icon { font-size: 19px; width: 19px; height: 19px; }
  .ztt-l { flex: 1; text-align: start; }
  .ztt-k { border: 1px solid #D5D8E3; border-radius: 5px; padding: 0 5px; font-size: 11px; background: #fff; color: #6B7185; }
  .ztt-help { position: relative; display: inline-flex; }
  .ztt-dot { position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; border-radius: 50%; background: #E0457B; border: 2px solid #fff; }
  .ztt-menu { position: absolute; top: calc(100% + 6px); inset-inline-end: 0; min-width: 290px; background: #fff; border: 1px solid #E3E5EE; border-radius: 12px;
              box-shadow: 0 12px 32px rgba(20, 18, 48, .16); padding: 6px; z-index: 1200; }
  .ztt-menu button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; background: none; border-radius: 8px; font: inherit; font-size: 13.5px;
                     color: #262A3D; cursor: pointer; text-align: start; }
  .ztt-menu button:hover, .ztt-menu button:focus-visible { background: #EEEDFD; }
  .ztt-menu button mat-icon { color: #5B4FE0; font-size: 19px; width: 19px; height: 19px; }
  .ztt-menu kbd { margin-inline-start: auto; border: 1px solid #D5D8E3; border-radius: 5px; padding: 0 5px; font-size: 11px; color: #6B7185; }
  .ztt-new { margin-inline-start: auto; background: #E0457B; color: #fff; border-radius: 10px; padding: 0 7px; font-size: 11px; }
  .ztt-menu hr { border: 0; border-top: 1px solid #EEF0F5; margin: 4px 0; }
  .ztt-chk { display: flex; gap: 8px; align-items: center; padding: 6px 10px; font-size: 12.5px; color: #3B4057; }
  @media (max-width: 900px) { .ztt-search { min-width: 0; padding: 0 8px; } .ztt-l, .ztt-k { display: none; } }
  `],
})
export class ZTopbarToolsComponent implements OnInit, OnDestroy {
  open = false; fresh = false; toursOff = false;
  private sub?: Subscription;
  constructor(public cmd: ZCommandService, private cd: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.sub = this.cmd.flags$.subscribe(f => {
      this.toursOff = !!(f && f['tours'] && f['tours'].off);
      this.fresh = !!(f && f['__whatsnew_fresh']);
      this.cd.markForCheck();
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  toggle(ev: Event): void { ev.stopPropagation(); this.open = !this.open; }
  @HostListener('document:click') outside(): void { if (this.open) { this.open = false; this.cd.markForCheck(); } }
  run(c: any, arg?: any): void { this.open = false; this.cmd.open(c, arg); }
  setTours(on: boolean): void { this.cmd.setFlag('tours', { off: !on }); }
}
