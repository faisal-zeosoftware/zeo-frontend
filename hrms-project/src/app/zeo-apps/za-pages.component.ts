import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { ZPeriodBarComponent, ZPeriodPick } from '../shared-ui/z-period-bar.component';   // v1.22.0
import { Subscription, filter } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ZAppTitleComponent, ZModuleMenuComponent } from '../shared-ui/z-module-menu.component';
import { ZA_APPS, ZaApiService, ZaClient, appOf, base, day, when } from './za-api.service';

/** Frame of a kit app (CRM / Property / Maintenance): module menu (shared-ui/menu-config.ts) and the page.
 *  Until the app is activated every page goes to its activation step. v1.18.0 */
@Component({
  selector: 'app-za-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSidenavModule, ZModuleMenuComponent, ZAppTitleComponent],
  styleUrls: ['../project-options/project-options.component.css'],
  template: `
<div class="sub-sidebar clickOutside">
  <mat-sidenav-container class="sub-sidenav-container">
    <mat-sidenav class="sub-sidenav hide-scrollbar" [opened]="isMobile ? isMenuOpen : true" [mode]="isMobile ? 'over' : 'side'" (closedStart)="isMenuOpen = false">
      <div class="wrapper">
        <div class="sidebar-top">
          <span class="sub-sidebar-title" *ngIf="isMenuOpen"><z-app-title [fallback]="title"></z-app-title></span>
          <button type="button" class="btn-collapse" (click)="isMenuOpen = !isMenuOpen" aria-label="Toggle Navigation"><mat-icon>{{ isMenuOpen ? 'chevron_left' : 'menu' }}</mat-icon></button>
        </div>
        <nav class="sidebar hide-scrollbar" [class.menu-open]="isMenuOpen" [class.menu-close]="!isMenuOpen">
          <z-module-menu [open]="isMenuOpen" (picked)="closeOnMobile()"></z-module-menu>
        </nav>
      </div>
    </mat-sidenav>
    <main class="sub-content-area">
      <button type="button" class="mobile-submenu-fab" *ngIf="isMobile && !isMenuOpen" (click)="isMenuOpen = true" aria-label="Open submenu"><mat-icon>menu</mat-icon></button>
      <router-outlet></router-outlet>
    </main>
  </mat-sidenav-container>
</div>`,
})
export class ZaShellComponent implements OnDestroy {
  private sub: Subscription;
  title = '';
  constructor(private za: ZaApiService, private router: Router) {
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.check());
    this.check();
  }

  private async check(): Promise<void> {
    const app = appOf(this.router.url);
    this.title = ZA_APPS[app]?.title || '';
    if (this.router.url.includes('/activate')) return;
    try {
      const i = await this.za.for(app).info();
      if (i && i.activated === false) this.router.navigate([base(app), 'activate']);
    } catch { /* the page shows its own error */ }
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
  isMobile = window.innerWidth <= 991.98;
  isMenuOpen = window.innerWidth > 991.98;
  @HostListener('window:resize')
  onResize(): void {
    const was = this.isMobile;
    this.isMobile = window.innerWidth <= 991.98;
    if (was && !this.isMobile) this.isMenuOpen = true;
    if (!was && this.isMobile) this.isMenuOpen = false;
  }
  closeOnMobile(): void { if (this.isMobile) this.isMenuOpen = false; }
}

/** Activation: the industry comes from the company master; the manager is asked whether to change it for this app only. */
@Component({
  selector: 'app-za-activate',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title">{{ a && !a.can_activate && !a.activated ? a.title : 'Activate ' + (a?.title || '') }}</h1>
    <p class="ex-desc" *ngIf="!a || a.can_activate || a.activated">{{ a?.title }} fills its lists (stages, types, charges, checklists …) from an industry pack. What it adds is marked "to review" until a manager confirms it.</p>
  </div></div></div>
  <div class="com_list mt-4" *ngIf="a">
    <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
    <ng-container *ngIf="a.activated">
      <div class="hs-note ok">{{ a.title }} is active – industry <b>{{ a.industry_label }}</b>{{ a.activated_by ? ', activated by ' + a.activated_by : '' }}.</div>
      <button type="button" class="ex-btn primary" (click)="go(['home'])">Open {{ a.title }}</button>
    </ng-container>
    <div class="hs-note info" *ngIf="!a.activated && !a.can_activate">{{ a.title }} is not activated in this company yet. The {{ a.title }} manager or an administrator activates it and chooses its industry.</div>
    <ng-container *ngIf="!a.activated && a.can_activate">
      <div class="hs-card" style="max-width:860px">
        <h3>Industry for {{ a.title }}</h3>
        <p style="font-size:14px;margin:6px 0 4px">Company industry (company master): <b>{{ a.company_industry_label || 'not set' }}</b></p>
        <p style="font-size:14px;margin:0 0 12px">{{ a.title }} will use the <b>{{ label(a.suggested) }}</b> pack{{ a.suggested === 'general' ? ' – no industry-specific setup for this industry' : '' }}.</p>
        <ng-container *ngIf="!changing">
          <p style="font-size:15px;font-weight:600;margin:14px 0 10px">Do you want to change the industry for {{ a.title }}?</p>
          <div class="hs-acts">
            <button type="button" class="ex-btn primary" [disabled]="busy" (click)="activate(a.suggested)">No – use {{ label(a.suggested) }}</button>
            <button type="button" class="ex-btn" (click)="changing = true; pick = a.suggested">Yes, change it</button>
          </div>
        </ng-container>
      </div>
      <ng-container *ngIf="changing">
        <div class="hs-section">Choose the industry for {{ a.title }} only (the company master does not change)</div>
        <div class="za-grid2">
          <div class="za-pack" *ngFor="let p of a.packs" [class.on]="pick === p.code" (click)="pick = p.code" role="radio" [attr.aria-checked]="pick === p.code" tabindex="0" (keyup.enter)="pick = p.code">
            <b>{{ p.label }}{{ p.code === a.suggested ? ' · company industry' : '' }}</b><div class="hs-muted">{{ p.description }}</div>
            <ul><li *ngFor="let h of p.highlights">{{ h }}</li></ul></div>
        </div>
        <div class="hs-acts" style="margin-top:14px">
          <button type="button" class="ex-btn primary" [disabled]="busy || !pick" (click)="activate(pick)">Activate {{ a.title }} with {{ label(pick) }}</button>
          <button type="button" class="ex-btn" (click)="changing = false">Back</button>
        </div>
      </ng-container>
      <p class="hs-muted" style="margin-top:14px">Later you can add another pack in Setup › Industry pack; nothing you changed is overwritten.</p>
    </ng-container>
  </div>
</div></div>`,
})
export class ZaActivateComponent implements OnInit {
  app = '';
  api!: ZaClient;
  a: any = null;
  changing = false;
  pick = '';
  busy = false;
  msg = '';
  constructor(private za: ZaApiService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.app = appOf(this.router.url);
    this.api = this.za.for(this.app);
    try { this.a = await this.api.get('activate/'); } catch (e) { this.msg = ZaApiService.error(e); }
  }
  label(code: string): string { return this.a?.packs?.find((p: any) => p.code === code)?.label || 'General'; }
  go(p: any[]): void { this.router.navigate([base(this.app), ...p]); }
  async activate(code: string): Promise<void> {
    if (!confirm(`Activate ${this.a.title} with the ${this.label(code)} pack?`)) return;
    this.busy = true; this.msg = '';
    try {
      this.a = await this.api.post('activate/', { industry: code });
      this.api.clear();
      this.router.navigate([base(this.app), 'setup', 'pack']);
    } catch (e) { this.msg = ZaApiService.error(e); }
    this.busy = false;
  }
}

/** Home of a kit app: figures, charts and lists from the app's dashboard, and "my work". */
@Component({
  selector: 'app-za-home',
  standalone: true,
  imports: [CommonModule, ZPeriodBarComponent],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div><h1 class="page-title">{{ info?.title }}</h1>
    <p class="ex-desc">{{ info?.industry_label }} · <span *ngFor="let l of info?.links" class="za-link" [style.opacity]="l.working ? 1 : .55"
      [title]="l.what">{{ l.title }}: {{ l.working ? 'linked' : !l.installed ? 'not installed' : !l.activated ? 'not activated' : 'switched off' }}</span></p></div>
    <div class="ex-actions"><button type="button" class="ex-btn" *ngIf="info?.to_review && info?.can_setup" (click)="go(['setup', 'pack'])">{{ info.to_review }} pack item(s) to review</button></div>
  </div>
  <!-- v1.22.0: period presets and branch, like the HRMS dashboards; figures open their records for the same period -->
  <div style="margin-top:10px" *ngIf="app"><z-period-bar [name]="app" (changed)="period($event)"></z-period-bar></div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
    <div class="za-cards" *ngIf="dash">
      <div class="za-card" *ngFor="let c of dash.cards" [ngClass]="c.tone || ''" [class.link]="c.link" (click)="c.link && link(c.link)">
        <small>{{ c.label }}</small><b>{{ c.value }}</b><span *ngIf="c.hint">{{ c.hint }}</span></div>
    </div>
    <div class="za-grid2" *ngIf="dash">
      <div class="hs-card" *ngFor="let b of dash.bars"><h3>{{ b.title }}</h3>
        <div class="hs-hbar" *ngFor="let i of b.items"><span class="l" [title]="i.label">{{ i.label }}</span>
          <div style="background:#eef0f7;border-radius:4px;height:10px"><div [style.width.%]="pct(i.value, b.items)" style="background:#5b4fe0;height:10px;border-radius:4px"></div></div>
          <span class="n">{{ i.value }}</span></div></div>
      <div class="hs-card" *ngFor="let l of dash.lists"><h3>{{ l.title }}</h3>
        <div class="za-row" *ngFor="let r of l.rows" (click)="rec(l.kind, r.id)"><span>{{ r.title }}<div class="s">{{ r.sub }}</div></span><span class="bd">{{ badge(r.badge) }}</span></div>
        <p class="hs-empty" *ngIf="!l.rows.length">Nothing.</p></div>
      <div class="hs-card" *ngFor="let l of mine"><h3>{{ l.title }}</h3>
        <div class="za-row" *ngFor="let r of l.rows" (click)="rec(l.kind, r.id)"><span>{{ r.title }}<div class="s">{{ r.sub }}</div></span><span class="bd">{{ badge(r.badge) }}</span></div>
        <p class="hs-empty" *ngIf="!l.rows.length">Nothing.</p></div>
    </div>
  </div>
</div></div>`,
})
export class ZaHomeComponent implements OnInit {
  app = '';
  api!: ZaClient;
  info: any = null;
  dash: any = null;
  mine: any[] = [];
  msg = '';
  constructor(private za: ZaApiService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.app = appOf(this.router.url);
    this.api = this.za.for(this.app);
    try {
      this.info = await this.api.info(true);
      this.mine = await this.api.get('my/');
    } catch (e) { this.msg = ZaApiService.error(e); }
  }
  pick: ZPeriodPick | null = null;
  async period(p: ZPeriodPick): Promise<void> {
    this.pick = p;
    try { this.dash = await this.api.get('dashboard/', { from: p.from, to: p.to, branch: p.branch || '' }); } catch (e) { this.msg = ZaApiService.error(e); }
  }
  badge(b: any): string { return typeof b === 'string' && /^\d{4}-\d{2}-\d{2}/.test(b) ? (b.length > 10 ? when(b) : day(b)) : (b ?? ''); }
  pct(v: number, items: any[]): number { const m = Math.max(1, ...items.map(i => i.value)); return Math.round(100 * v / m); }
  go(p: any[]): void { this.router.navigate([base(this.app), ...p]); }
  rec(kind: string, id: number): void { if (id) this.router.navigate([base(this.app), 'r', kind, id]); else this.router.navigate([base(this.app), 'r', kind]); }
  link(l: string): void {
    // v1.22.0: the dashboard branch goes with the figure to its list
    const b = this.pick?.branch ? (l.includes('?') ? '&' : '?') + 'branch=' + this.pick.branch : '';
    this.router.navigateByUrl(base(this.app) + '/' + l + b);
  }
}

/** Setup of a kit app: industry pack and review, settings and wording, links with the other apps, roles. */
@Component({
  selector: 'app-za-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div><h1 class="page-title">{{ info?.title }} setup</h1>
    <p class="ex-desc">Industry {{ info?.industry_label }}{{ info?.industry_source === 'chosen' ? ' (chosen for this app)' : ' (company industry)' }}</p></div></div>
    <div class="hs-tabs2" style="margin-top:8px">
      <button type="button" *ngFor="let t of tabs" [class.on]="tab === t.k" (click)="setTab(t.k)">{{ t.l }}</button></div>
  </div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="msg">{{ msg }}</p><p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
    <ng-container *ngIf="tab === 'pack' && pack">
      <div class="hs-card" *ngIf="pack.to_review.length">
        <h3>To review ({{ pack.to_review.length }})</h3>
        <p class="hs-muted">These came from an industry pack. Confirm them, or switch off what you do not use. They can be changed in their lists.</p>
        <label class="za-check"><input type="checkbox" [checked]="sel.size === pack.to_review.length" (change)="all($any($event.target).checked)"> <b>All</b></label>
        <label class="za-check" *ngFor="let x of pack.to_review"><input type="checkbox" [checked]="sel.has(x.key + ':' + x.id)" (change)="tog(x)">
          <span class="hs-b">{{ x.label }}</span> {{ x.name }} <span class="hs-muted">{{ x.code }}</span></label>
        <div class="hs-acts" style="margin-top:8px"><button type="button" class="ex-btn primary" [disabled]="!sel.size" (click)="review('reviewed')">Confirm selected</button>
          <button type="button" class="ex-btn danger" [disabled]="!sel.size" (click)="review('off')">Switch selected off</button></div>
      </div>
      <div class="za-grid2">
        <div class="za-pack" *ngFor="let p of pack.packs" [class.on]="pack.installed.includes(p.code)">
          <b>{{ p.label }}</b> <span class="hs-b ok" *ngIf="p.code === pack.industry">Main industry pack</span><!-- v1.62.0 ui wording -->
          <span class="hs-b" *ngIf="pack.installed.includes(p.code) && p.code !== pack.industry">installed</span>
          <div class="hs-muted">{{ p.description }}</div><ul><li *ngFor="let h of p.highlights">{{ h }}</li></ul>
          <div class="hs-acts" style="margin-top:8px" *ngIf="pack.can_setup">
            <button type="button" class="ex-btn sm" *ngIf="!pack.installed.includes(p.code)" (click)="install(p.code, false)">Add this pack</button>
            <button type="button" class="ex-btn sm" *ngIf="p.code !== pack.industry" (click)="install(p.code, true)">Use as the main industry pack</button></div>
        </div>
      </div>
    </ng-container>
    <ng-container *ngIf="tab === 'settings' && info">
      <div class="hs-card" style="max-width:760px">
        <div class="ex-form">
          <label class="ck wide"><input type="checkbox" [(ngModel)]="s.require_review"> Pack items can be used only after a manager reviewed them</label>
          <ng-container *ngFor="let f of info.settings_meta">
            <label class="ck" *ngIf="f.type === 'bool'"><input type="checkbox" [(ngModel)]="s[f.name]"> {{ f.label }}</label>
            <label *ngIf="f.type === 'choice'">{{ f.label }}<select [(ngModel)]="s[f.name]"><option *ngFor="let c of f.choices" [value]="c.value">{{ c.label }}</option></select></label>
            <label *ngIf="f.type === 'json'">{{ f.label }}<input [ngModel]="(s[f.name] || []).join(', ')" (ngModelChange)="s[f.name] = nums($event)" placeholder="90, 60, 30, 7"></label>
            <label *ngIf="f.type === 'textarea'" class="wide">{{ f.label }}<textarea rows="3" [(ngModel)]="s[f.name]"></textarea></label>
            <label *ngIf="!['bool','choice','json','textarea'].includes(f.type)">{{ f.label }}<input [type]="f.type === 'int' || f.type === 'decimal' ? 'number' : 'text'" [(ngModel)]="s[f.name]" [step]="f.type === 'decimal' ? 'any' : null"></label>
          </ng-container>
          <label *ngIf="s.secret_set !== undefined">Provider API key (SMS / WhatsApp) <span class="hs-muted">{{ s.secret_set ? '· set – kept encrypted, enter again to change' : '· not set' }}</span>
            <input type="password" [(ngModel)]="s.secret" autocomplete="new-password" placeholder="Leave empty to keep"></label>   <!-- v1.40.0 -->
        </div>
        <h3 style="margin-top:16px">Wording</h3>
        <p class="hs-muted">Change what the screens call things, e.g. opportunity → Enquiry.</p>
        <div class="ex-form"><ng-container *ngFor="let t of termRows"><label>{{ t.k }}<input [(ngModel)]="t.v" placeholder="(standard)"></label></ng-container></div>
        <div class="hs-acts" style="margin-top:12px"><button type="button" class="ex-btn primary" [disabled]="!info.can_setup" (click)="saveSettings()">Save settings</button></div>
      </div>
    </ng-container>
    <ng-container *ngIf="tab === 'links' && info">
      <p class="hs-muted">{{ info.title }} works on its own. When another ZEO app below is installed and activated in this company, they work together; you can switch a link off here.</p>
      <div class="za-grid2">
        <div class="hs-card" *ngFor="let l of info.links"><h3>{{ l.title }}</h3>
          <p style="font-size:13px">{{ l.what }}</p>
          <p><span class="hs-b" [ngClass]="l.working ? 'ok' : 'wait'">{{ l.working ? 'Working' : !l.installed ? 'App not installed' : !l.activated ? 'App not activated' : 'Switched off' }}</span></p>
          <label class="ck" *ngIf="l.installed && info.can_setup"><input type="checkbox" [checked]="!l.off" (change)="link(l.app, $any($event.target).checked)"> Link on</label>
        </div>
      </div>
    </ng-container>
    <ng-container *ngIf="tab === 'roles' && info">
      <div class="hs-card" style="max-width:760px"><h3>Roles</h3>
        <p class="hs-muted">Give roles with the permission groups "{{ info.title }} – role" (Settings › Permission groups). Company administrators have every role.
          The groups are made with <code>python manage.py {{ cmd }} --roles</code>.</p>
        <table class="hs-table"><tr><th>Role</th><th>Permission code</th><th>You</th></tr>
          <tr *ngFor="let r of info.roles"><td>{{ r.label }}</td><td class="hs-code">{{ r.code }}</td><td>{{ info.rights[r.code] ? '✓' : '' }}</td></tr></table></div>
    </ng-container>
  </div>
</div></div>`,
})
export class ZaSetupComponent implements OnInit {
  app = '';
  api!: ZaClient;
  info: any = null;
  pack: any = null;
  tab = 'pack';
  tabs = [{ k: 'pack', l: 'Industry pack' }, { k: 'settings', l: 'Settings' }, { k: 'links', l: 'Links with other apps' }, { k: 'roles', l: 'Roles' }];
  s: any = {};
  termRows: { k: string; v: string }[] = [];
  sel = new Set<string>();
  msg = '';
  ok = '';
  constructor(private za: ZaApiService, private router: Router, private route: ActivatedRoute) {}

  get cmd(): string { return this.app.replace('-', '') + '_setup'; }

  async ngOnInit(): Promise<void> {
    this.app = appOf(this.router.url);
    this.api = this.za.for(this.app);
    this.tab = this.route.snapshot.paramMap.get('tab') || 'pack';
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.info = await this.api.info(true);
      this.s = { ...this.info.settings, require_review: this.info.require_review };
      const regs = await this.api.registers(true);
      const words = Array.from(new Set(regs.flatMap((r: any) => [r.label.toLowerCase(), r.plural.toLowerCase()])));
      this.termRows = words.map(k => ({ k, v: this.info.terms[k] || '' }));
      this.pack = await this.api.get('pack/');
      this.sel.clear();
    } catch (e) { this.msg = ZaApiService.error(e); }
  }

  setTab(t: string): void { this.tab = t; this.router.navigate([base(this.app), 'setup', t]); }
  all(on: boolean): void { this.sel = new Set(on ? this.pack.to_review.map((x: any) => x.key + ':' + x.id) : []); }
  tog(x: any): void { const k = x.key + ':' + x.id; this.sel.has(k) ? this.sel.delete(k) : this.sel.add(k); }
  nums(t: string): number[] { return t.split(/[ ,;]+/).map(x => parseInt(x, 10)).filter(x => !isNaN(x)); }

  async review(action: string): Promise<void> {
    const items = Array.from(this.sel).map(k => { const [key, id] = k.split(':'); return { key, id: Number(id) }; });
    try { const r = await this.api.post('pack/review/', { items, action }); this.ok = `${r.done} item(s) ${action === 'off' ? 'switched off' : 'confirmed'}.`; await this.load(); }
    catch (e) { this.msg = ZaApiService.error(e); }
  }

  async install(code: string, primary: boolean): Promise<void> {
    if (!confirm(primary ? 'Make this the industry of the app? Its items are added (nothing is overwritten).' : 'Add this pack? Its items are added as "to review".')) return;
    try { const r = await this.api.post('pack/', { code, primary }); this.ok = 'Added: ' + (Object.entries(r.added || {}).map(([k, v]) => `${v} ${k}`).join(', ') || 'nothing new'); this.api.clear(); await this.load(); }
    catch (e) { this.msg = ZaApiService.error(e); }
  }

  async saveSettings(): Promise<void> {
    this.msg = ''; this.ok = '';
    const terms: any = {};
    this.termRows.filter(t => t.v.trim()).forEach(t => terms[t.k] = t.v.trim());
    try { await this.api.patch('app/', { ...this.s, terms }); this.ok = 'Settings saved.'; this.api.clear(); await this.load(); }
    catch (e) { this.msg = ZaApiService.error(e); }
  }

  async link(app: string, on: boolean): Promise<void> {
    try { await this.api.post('links/', { app, on }); this.api.clear(); this.ok = `Link ${on ? 'on' : 'off'}.`; await this.load(); }
    catch (e) { this.msg = ZaApiService.error(e); }
  }
}
