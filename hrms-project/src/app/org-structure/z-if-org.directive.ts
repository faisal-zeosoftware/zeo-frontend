import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrgKey, OrgSettingsService } from './org-settings.service';

/**
 * v1.12.0 – shows its content only while an organisation setting is on:
 *   <div *zIfOrg="'employee_categories'">…Category…</div>      (Category is on by default)
 *   <th *zIfOrg="'sections'">Section</th>
 * Waits for the settings; until then a default-on setting (employee categories) shows and the others stay hidden.
 */
@Directive({ selector: '[zIfOrg]', standalone: true })
export class ZIfOrgDirective implements OnInit, OnDestroy {
  @Input('zIfOrg') key!: OrgKey;
  private shown: boolean | null = null;
  private sub?: Subscription;

  constructor(private tpl: TemplateRef<any>, private vcr: ViewContainerRef, private org: OrgSettingsService) {}

  ngOnInit(): void {
    this.sub = this.org.settings$.subscribe(s => this.render(this.org.isOn(this.key, s)));
    this.org.load().subscribe();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private render(on: boolean): void {
    if (on === this.shown) { return; }
    this.shown = on;
    this.vcr.clear();
    if (on) { this.vcr.createEmbeddedView(this.tpl); }
  }
}
