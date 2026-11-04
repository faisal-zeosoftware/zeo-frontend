import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZAD_STYLES } from './z-admin-pages.component';
import { httpErrorText } from './z-http-error.interceptor';
import { TPipe, i18nT } from './i18n.service';
import { ZGetStartedComponent, nextOpen, stepOk } from './z-get-started.component';
import { Subscription } from 'rxjs';

/**
 * v1.56.0 – Settings › Setup guide: a new company from the first screen to the first payroll in 14 steps and one optional
 * step. Each step opens with the defaults of the country pack, saves on Next and lists what is missing with a link to fix it.
 * API: /zeo-admin/api/setup-guide/ (steps), …/<step>/ (GET, POST {action, values}), …/matrix/ (category view),
 * …/template/<kind>/ (Excel download and upload).
 * v1.62.1 (user request 2 Nov – "a wizard like Zoho Books"): no ?step → the "Get started with ZEO" checklist (z-get-started) with
 * the required-setup card and the data workbook beside it; ?step=<key> → the step's form under a header with "‹ Get started",
 * "Step N of 15" and a strip of 15 segments to jump. The dark list of steps on the left is gone; every form, check and button
 * of the steps is as before.
 */
@Component({
  selector: 'z-setup-guide',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TPipe, ZGetStartedComponent],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES, `
  .zsg-note { display: block; color: #6b7280; font-size: 11.5px; } .zsg-unset { color: #b45309; }
  .zsg { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 18px; padding: 0 24px 24px; align-items: start; max-width: 1240px; }
  .zsg-main h1 { font-size: 22px; margin: 0 0 2px; } .zsg-sub { color: #5d6670; font-size: 12.5px; margin: 0 0 12px; }
  .zsg-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px 16px; }
  .zsg-f { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #5d6670; }
  .zsg-f.new > span::after { content: '•'; color: #5b4fe0; margin-inline-start: 4px; }
  .zsg-f input:not([type=checkbox]), .zsg-f select { padding: 8px 9px; border: 1px solid #cfd5dc; border-radius: 7px; font: inherit; font-size: 13.5px; color: #1f2433; background: #fff; min-height: 38px; }
  .zsg-f input[readonly] { background: #f4f5fa; color: #3c4450; } .zsg-f small { color: #7d8590; font-size: 11.5px; line-height: 1.35; }
  .zsg-f.chk { flex-direction: row; align-items: flex-start; gap: 8px; grid-column: 1 / -1; color: #1f2433; font-size: 13px; } .zsg-f.chk input { margin-top: 3px; }
  .zsg-aside .zad-card h3 { font-size: 13.5px; } .zsg-fills { margin: 0; padding-inline-start: 0; list-style: none; display: grid; gap: 6px; font-size: 12.5px; }
  .zsg-fills li { display: flex; gap: 6px; } .zsg-fills mat-icon { font-size: 17px; width: 17px; height: 17px; color: #2e9d6a; flex: none; }
  .zsg-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; font-size: 12.5px; }
  .zsg-checks li { display: flex; gap: 6px; align-items: flex-start; } .zsg-checks mat-icon { font-size: 17px; width: 17px; height: 17px; flex: none; }
  .zsg-checks .ok mat-icon { color: #2e9d6a; } .zsg-checks .block mat-icon { color: #c63c2f; } .zsg-checks .warn mat-icon { color: #b8730f; }
  .zsg-checks a { color: #5b4fe0; }
  .zsg-foot { display: flex; gap: 8px; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e3e6ea; flex-wrap: wrap; }
  .zsg-foot .grow { flex: 1; }
  .zsg-links { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12.5px; margin-top: 8px; } .zsg-links a { color: #5b4fe0; }
  .zsg-apps { display: flex; flex-wrap: wrap; gap: 6px; } .zsg-apps span { border: 1px solid #dcdfea; border-radius: 14px; padding: 3px 10px; font-size: 12.5px; color: #6b7185; }
  .zsg-apps span.on { background: #eeedfd; border-color: #b9b2f5; color: #1b1640; }
  .zsg-codes { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 4px 14px; }
  .zsg-codes label { display: flex; justify-content: space-between; gap: 8px; align-items: center; font-size: 12.5px; padding: 2px 0; }
  .zsg-codes input { width: 70px; padding: 4px 6px; border: 1px solid #cfd5dc; border-radius: 5px; text-transform: uppercase; font-family: ui-monospace, Menlo, monospace; }
  .zsg-prev { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f4f5fa; border-radius: 7px; padding: 8px 10px; font-size: 13px; }
  .zsg-mx input, .zsg-mx select { padding: 4px 6px; border: 1px solid #cfd5dc; border-radius: 5px; font: inherit; font-size: 12.5px; max-width: 150px; }
  .zsg-mx input[type=time] { width: 96px; } .zsg-mx td { white-space: nowrap; } .zsg-mx select { max-width: 140px; }
  .zsg.zsg-mxopen { grid-template-columns: minmax(0, 1fr); } .zsg.zsg-mxopen .zsg-aside { grid-column: 1; }
  .zsg-mod { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; }
  .zsg-mod label { border: 1px solid #e3e6ea; border-radius: 9px; padding: 9px 10px; display: flex; gap: 8px; align-items: flex-start; font-size: 13px; cursor: pointer; }
  .zsg-mod label.on { border-color: #b9b2f5; background: #f6f5ff; } .zsg-mod small { display: block; color: #6b7185; font-size: 11.5px; }
  .zsg-count { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px; }
  .zsg-count div { border: 1px solid #e3e6ea; border-radius: 9px; padding: 8px 10px; } .zsg-count b { display: block; font-size: 22px; color: #1b1640; } .zsg-count span { font-size: 12px; color: #5d6670; }
  .zsg-live li { padding: 8px 0; border-bottom: 1px solid #eef0f2; display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; } .zsg-live { list-style: none; padding: 0; margin: 0; }
  .zsg-live input { flex: 1 1 220px; padding: 5px 7px; border: 1px solid #cfd5dc; border-radius: 6px; font-size: 12.5px; }
  .zsg-gate { border-inline-start: 4px solid #b8730f; } .zsg-gate-row { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; }
  .zsg-gate-row mat-icon { flex: none; } .zsg-gate-row > div { min-width: 0; } .zsg-gate .zsg-f.chk { grid-column: auto; }
  .zsg-gate-row small { display: block; }
  .zsg-tpl { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 12.5px; }
  /* v1.62.1 Get started look: the landing, the step header with the 15-segment strip, lighter cards and buttons */
  .zgs-page { padding: 20px 24px 28px; max-width: 1240px; }
  .zgs-land { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 20px; align-items: start; }
  .zgs-side { display: grid; gap: 14px; }
  .zgs-sidecard { background: #fff; border: 1px solid #e4e6ee; border-radius: 12px; padding: 16px 18px; font-size: 13px; color: #3c4450; }
  .zgs-sidecard h3 { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin: 0 0 8px; color: #1f2433; }
  .zgs-sidecard h3 mat-icon { font-size: 19px; width: 19px; height: 19px; color: #5b4fe0; }
  .zgs-sidecard p { margin: 0 0 8px; line-height: 1.45; color: #5d6670; }
  .zgs-sec { display: inline-flex; align-items: center; gap: 4px; color: #4b3fc4; font-weight: 600; text-decoration: none; font-size: 13px; border-radius: 4px; }
  .zgs-sec:hover { text-decoration: underline; }
  .zgs-sec:focus-visible, .zgs-back:focus-visible, .zgs-dot:focus-visible, .zsg .zad-btn:focus-visible, .zgs-sidecard input:focus-visible { outline: 2px solid #5b4fe0; outline-offset: 2px; }
  .zgs-head { padding: 18px 24px 16px; max-width: 1240px; box-sizing: border-box; }
  .zgs-back { display: inline-flex; align-items: center; gap: 2px; color: #4b3fc4; font-size: 13px; font-weight: 600; text-decoration: none; margin-inline-start: -4px; border-radius: 4px; padding: 2px 4px 2px 0; }
  .zgs-back mat-icon { font-size: 20px; width: 20px; height: 20px; color: #4b3fc4 !important; }
  .zgs-sec mat-icon { color: #4b3fc4 !important; }
  .zgs-back:hover { text-decoration: underline; }
  .zgs-head-row { display: flex; align-items: flex-end; gap: 8px 16px; flex-wrap: wrap; margin: 8px 0 14px; }
  .zgs-head-row > div { flex: 1 1 320px; min-width: 0; }
  .zgs-kicker { margin: 0 0 2px; font-size: 12.5px; color: #5d6670; }
  .zgs-kicker b { color: #1f2433; font-weight: 600; }
  .zgs-head h1 { font-size: 22px; font-weight: 600; margin: 0; color: #1f2433; letter-spacing: -.005em; }
  .zgs-head h1 span { color: #5d6670; font-weight: 400; }
  .zgs-pill { font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 3px 10px; white-space: nowrap; }
  .zgs-pill.done { background: #e3f4ea; color: #1d6b37; } .zgs-pill.skipped { background: #eef0f3; color: #5d6670; } .zgs-pill.open { background: #fff1e0; color: #8a4b00; }
  .zgs-pill.req { background: #f0eefe; color: #4b3fc4; } .zgs-pill.skip { background: #f1f3f5; color: #5d6670; }
  .zgs-dots { display: flex; align-items: center; gap: 4px; }
  .zgs-dot { flex: 1 1 0; min-width: 10px; height: 22px; border: 0; padding: 0; background: none; cursor: pointer; display: flex; align-items: center; border-radius: 4px; }
  .zgs-dot.stage { margin-inline-start: 8px; }
  .zgs-dot i { display: block; width: 100%; height: 6px; border-radius: 999px; background: #e1e4ea; transition: height .12s, background .12s; }
  .zgs-dot.done i { background: #2e9d6a; } .zgs-dot.skipped i { background: #b9bfc9; }
  .zgs-dot.on i { background: #5b4fe0; height: 10px; box-shadow: 0 0 0 3px #e4e1fc; }
  .zgs-dot:hover i { height: 10px; }
  .zgs-dot-cap { display: flex; justify-content: space-between; font-size: 11.5px; color: #7d8590; margin-top: 6px; gap: 12px; }
  .zsg .zad-card { border-color: #e4e6ee; border-radius: 12px; padding: 16px 18px; }
  .zsg .zad-card h3 { font-weight: 600; }
  .zsg .zad-btn { border-radius: 8px; padding: 8px 14px; font-weight: 500; border-color: #d5d9e2; }
  .zsg .zad-btn.sm { padding: 4px 10px; } .zsg .zad-btn.primary { font-weight: 600; } .zsg .zad-btn.primary:hover:not(:disabled) { background: #4b3fc4; }
  .zsg-foot { border-top-color: #e4e6ee; padding-top: 14px; }
  .zsg-f input:not([type=checkbox]):focus, .zsg-f select:focus { outline: none; border-color: #5b4fe0; box-shadow: 0 0 0 3px #e4e1fc; }
  @media (max-width: 1100px) { .zgs-land, .zsg { grid-template-columns: minmax(0, 1fr); } .zsg-aside { grid-column: 1; } }
  /* the floating menu button of the phone layout sits over the top-left corner: start the page under it */
  @media (max-width: 760px) { .zgs-page { padding: 52px 16px 20px; } .zgs-head { padding: 52px 16px 12px; } .zsg, .zsg.zsg-mxopen { padding: 0 16px 16px; }
    .zgs-head h1 { font-size: 19px; } .zgs-dot.stage { margin-inline-start: 4px; } .zgs-dots { gap: 3px; } }`],
  template: `
<ng-template #gateCard>
    <!-- v1.62.1 (user request 2 Nov): a new company – HR transactions open after every step is completed (or skipped where it can be) -->
    <section class="zad-card zsg-gate" *ngIf="gate?.enforced" data-setup-gate>
      <div class="zsg-gate-row" *ngIf="gate.blocked"><mat-icon style="color:#b8730f">lock_clock</mat-icon>
        <div><b>{{ (gate.count === 1 ? 'HR transactions open after 1 more setup step.' : 'HR transactions open after {0} more setup steps.') | t:[gate.count] }}</b>
          <p class="zad-muted" style="margin:2px 0 0">{{ 'Still open' | t }}: <span data-gate-open>{{ gate.open.join(', ') }}</span></p>
          <small class="zad-muted">{{ 'Leave, attendance, payroll, loans, air tickets and requests wait until then. Masters, employees and users can be set up now.' | t }}</small></div></div>
      <div class="zsg-gate-row" *ngIf="!gate.blocked"><mat-icon class="zad-ok">lock_open</mat-icon>
        <div><b>{{ (gate.count ? 'HR transactions are allowed before the setup is finished.' : 'Every setup step is done – HR transactions are open.') | t }}</b></div></div>
      <label class="zsg-f chk" style="margin-top:8px" *ngIf="gate.admin && (gate.count || gate.allow)"><input type="checkbox" [ngModel]="gate.allow" (ngModelChange)="setAllow($event)" [disabled]="busy" data-gate-allow>
        <span><b>{{ 'Allow transactions before the setup is finished' | t }}</b><br>
          <small>{{ 'Leave, attendance, payroll and requests can then be saved although setup steps are still open.' | t }}</small></span></label>
    </section>
</ng-template>

<!-- v1.62.1 landing: Get started with ZEO -->
<div class="zgs-page" *ngIf="ov?.can_use && !key" data-setup-guide data-gs-landing>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status" data-msg>{{ msg }}</p>
  <div class="zgs-land">
    <z-get-started [ov]="ov" [gate]="gate"></z-get-started>
    <aside class="zgs-side">
      <ng-container *ngTemplateOutlet="gateCard"></ng-container>
      <section class="zgs-sidecard" *ngIf="ov?.live_at" data-gs-live><h3><mat-icon style="color:#2e9d6a">verified</mat-icon>{{ 'ZEO is live' | t }}</h3>
        <p>{{ 'ZEO is live since {0}.' | t:[ov.live_at.slice(0, 10)] }}</p></section>
      <section class="zgs-sidecard"><h3><mat-icon>table_view</mat-icon>{{ 'Have the data in Excel?' | t }}</h3>
        <p>{{ 'Branches, departments, employees, leave balances and salaries can be loaded in one go.' | t }}</p>
        <a class="zgs-sec" routerLink="/main-sidebar/settings/data-workbook" data-setup-workbook>{{ 'Load it with the data workbook' | t }}<mat-icon class="zgs-chev" style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon></a>   <!-- v1.62.0 workbook -->
      </section>
    </aside>
  </div>
</div>

<!-- v1.62.1 a step: header with the way back and the strip of 15 steps -->
<header class="zgs-head" *ngIf="st && key" data-gs-head>
  <a class="zgs-back" [routerLink]="[]" [queryParams]="{}" data-gs-back><mat-icon>chevron_left</mat-icon>{{ 'Get started' | t }}</a>
  <div class="zgs-head-row">
    <div><p class="zgs-kicker"><b data-gs-stepno>{{ 'Step {0} of {1}' | t:[st.no, ov?.total || 15] }}</b> · {{ st.stage }}</p>
      <h1 data-step-title>{{ st.name }} <span>– {{ st.title }}</span></h1></div>
    <span class="zgs-pill" [class.req]="!st.can_skip" [class.skip]="st.can_skip">{{ (st.can_skip ? 'Can skip' : 'Required') | t }}</span>
    <span class="zgs-pill" [class.done]="st.status === 'done'" [class.skipped]="st.status === 'skipped'" [class.open]="!st.status" data-gs-stepstate>
      {{ (st.status === 'done' ? 'Completed' : st.status === 'skipped' ? 'Skipped' : 'Pending') | t }}</span>
  </div>
  <nav class="zgs-dots" [attr.aria-label]="'Setup steps' | t" data-gs-dots>
    <button type="button" class="zgs-dot" *ngFor="let s of ov?.steps || []; let i = index" [class.on]="s.key === key" [class.done]="s.status === 'done'"
            [class.skipped]="s.status === 'skipped'" [class.stage]="i > 0 && s.stage !== ov.steps[i - 1].stage" (click)="go(s.key)" [attr.data-dot]="s.key"
            [attr.aria-current]="s.key === key ? 'step' : null" [title]="s.no + '. ' + s.name + ' – ' + stateText(s)"
            [attr.aria-label]="s.no + '. ' + s.name + ' – ' + stateText(s)"><i></i></button>
  </nav>
  <div class="zgs-dot-cap"><span>{{ '{0}/{1} completed' | t:[doneCount(), ov?.total || 15] }}</span>
    <span>{{ (pendingCount() === 1 ? '1 step pending' : '{0} steps pending') | t:[pendingCount()] }}</span></div>
</header>

<div class="zsg" [class.zsg-mxopen]="mx" *ngIf="key" data-setup-guide>
  <main class="zsg-main" *ngIf="st">
    <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status" data-msg>{{ msg }}</p>
    <p class="zad-warn" *ngIf="st.info_only">Payroll is not switched on: this step is shown for information.</p>

    <!-- 1: apps -->
    <section class="zad-card" *ngIf="st.apps?.length">
      <h3><mat-icon>apps</mat-icon>Apps</h3>
      <div class="zsg-apps"><span *ngFor="let a of st.apps" [class.on]="a.active">{{ a.title }}</span></div>
    </section>

    <!-- fields -->
    <section class="zad-card" *ngIf="st.fields?.length">
      <div class="zsg-fields">
        <ng-container *ngFor="let f of st.fields">
          <label class="zsg-f chk" *ngIf="f.type === 'check'" [class.new]="f.new"><input type="checkbox" [(ngModel)]="vals[f.key]" [attr.data-f]="f.key">
            <span><b>{{ f.label }}</b><br><small *ngIf="f.help">{{ f.help }}</small></span></label>
          <label class="zsg-f" *ngIf="f.type !== 'check'" [class.new]="f.new"><span>{{ f.label }}</span>
            <select *ngIf="f.type === 'select'" [(ngModel)]="vals[f.key]" [disabled]="f.readonly" [attr.data-f]="f.key">
              <option *ngFor="let o of f.options" [ngValue]="o.value">{{ o.label }}</option></select>
            <input *ngIf="f.type !== 'select'" [type]="f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'"
                   [(ngModel)]="vals[f.key]" [readonly]="f.readonly" [attr.data-f]="f.key">
            <small *ngIf="f.help">{{ f.help }}</small></label>
        </ng-container>
      </div>
      <div class="zsg-prev" *ngIf="st.preview?.length" data-preview>{{ 'Preview' | t }}: {{ st.preview.join('  ·  ') }}</div>
    </section>

    <!-- 4: codes -->
    <section class="zad-card" *ngIf="st.codes?.length">
      <h3><mat-icon>tag</mat-icon>Codes of the document types</h3>
      <ng-container *ngFor="let a of st.codes">
        <p class="zad-muted" style="margin:8px 0 4px"><b>{{ a.area }}</b></p>
        <div class="zsg-codes"><label *ngFor="let t of a.types">{{ t.label }}<input [(ngModel)]="codes[t.type]" maxlength="6" [attr.data-code]="t.type"></label></div>
      </ng-container>
    </section>

    <!-- 6: Eid -->
    <section class="zad-card" *ngIf="st.eid?.length">
      <h3><mat-icon>nights_stay</mat-icon>Moving holidays to confirm</h3>
      <table class="zad-t"><tr><th>Holiday</th><th>From</th><th>To</th><th></th></tr>
        <tr *ngFor="let h of st.eid" [attr.data-eid]="h.id"><td>{{ h.name }}</td><td><input type="date" [(ngModel)]="h.start"></td><td><input type="date" [(ngModel)]="h.end"></td>
          <td><span class="zad-pill" [class.ok]="h.confirmed">{{ (h.confirmed ? 'Confirmed' : 'To confirm') | t }}</span></td></tr></table>
    </section>

    <!-- 10: approvals -->
    <section class="zad-card" *ngIf="st.approvals?.length">
      <h3><mat-icon>approval</mat-icon>Approval chains</h3>
      <table class="zad-t"><tr><th>Requests</th><th>Level 1</th><th>Level 2</th><th>Level 3</th><th></th></tr>
        <!-- v1.62.1 (tester 30-10 items 188-190): the chain as set up (no "Reporting manager" stand-in), other chains counted -->
        <tr *ngFor="let r of st.approvals"><td>{{ r.cells[0] }}<small *ngIf="r.note" class="zsg-note">{{ r.note }}</small></td><td [class.zsg-unset]="!r.set">{{ r.cells[1] || '–' }}</td><td>{{ r.cells[2] }}</td><td>{{ r.cells[3] }}</td>
          <td><a [routerLink]="r.link">{{ (r.set ? 'Change' : 'Set up') | t }}</a></td></tr></table>
    </section>

    <!-- 11 / 12: counts -->
    <section class="zsg-count" *ngIf="st.counts">
      <div *ngFor="let c of countList()"><b>{{ c.v }}</b><span>{{ c.label | t }}</span></div>
    </section>

    <!-- 13: modules -->
    <section class="zad-card" *ngIf="st.modules?.length">
      <h3><mat-icon>extension</mat-icon>Modules to set up now</h3>
      <div class="zsg-mod"><label *ngFor="let m of st.modules" [class.on]="m.on" [attr.data-module]="m.key"><input type="checkbox" [(ngModel)]="m.on">
        <span>{{ m.title }}<small>{{ m.hint }}</small><small *ngIf="m.on"><a [routerLink]="m.link">{{ 'Open its setup' | t }}</a> · {{ '{0} records' | t:[m.records] }}</small></span></label></div>
    </section>

    <!-- tables -->
    <section class="zad-card" *ngFor="let tb of st.tables || []">
      <h3>{{ tb.title }}<span class="grow" style="flex:1"></span><a class="zad-btn sm" *ngIf="tb.add" [routerLink]="tb.add">{{ 'Add or change' | t }}</a></h3>
      <table class="zad-t"><tr><th *ngFor="let c of tb.columns">{{ c }}</th></tr>
        <tr *ngFor="let r of tb.rows"><td *ngFor="let c of r">{{ c }}</td></tr>
        <tr *ngIf="!tb.rows.length"><td [attr.colspan]="tb.columns.length" class="zad-muted">{{ 'None yet.' | t }}</td></tr></table>
    </section>

    <!-- category view (steps 6–9) -->
    <section class="zad-card" *ngIf="st.matrix">
      <h3><mat-icon>grid_on</mat-icon>Several categories<span style="flex:1"></span>
        <button type="button" class="zad-btn sm" (click)="toggleMatrix()" data-matrix-toggle>{{ (mx ? 'Hide the category view' : 'Category view') | t }}</button></h3>
      <p class="zad-muted" *ngIf="!mx">One row per category with the main setting of steps 6–9; most specific wins: employee › category › department › branch › company.</p>
      <ng-container *ngIf="mx">
        <div style="overflow-x:auto"><table class="zad-t zsg-mx" data-matrix>
          <tr><th>Category</th><th>Employees</th><th>Weekend</th><th>Hours</th><th>Roster</th><th>Leave policy</th><th>Pay structure</th><th></th></tr>
          <tr *ngFor="let r of mx.rows; let i = index" [attr.data-cat]="r.category">
            <td><b>{{ r.name }}</b></td><td>{{ r.employees }}</td>
            <td><select [(ngModel)]="r.weekend"><option [ngValue]="null">–</option><option *ngFor="let o of mx.options.weekend" [ngValue]="o.value">{{ o.label }}</option></select></td>
            <td><input type="time" [(ngModel)]="r.start"> – <input type="time" [(ngModel)]="r.end"></td>
            <td><select [(ngModel)]="r.roster"><option [ngValue]="null">–</option><option *ngFor="let o of mx.options.roster" [ngValue]="o.value">{{ o.label }}</option></select></td>
            <td><select [(ngModel)]="r.leave"><option [ngValue]="null">–</option><option *ngFor="let o of mx.options.leave" [ngValue]="o.value">{{ o.label }}</option></select></td>
            <td><select [(ngModel)]="r.pay"><option [ngValue]="null">–</option><option *ngFor="let o of mx.options.pay" [ngValue]="o.value">{{ o.label }}</option></select></td>
            <td style="white-space:nowrap"><button type="button" class="zad-btn sm" (click)="copyRow(i)" [title]="'Copy this row to the next category' | t">{{ 'Copy row' | t }}</button>
              <button type="button" class="zad-btn sm" (click)="applyAll(i)" [title]="'Apply this row to every category' | t">{{ 'Apply all' | t }}</button></td></tr>
        </table></div>
        <p class="zad-muted" *ngIf="mx.exceptions?.length"><b>{{ 'Exceptions' | t }}:</b> {{ mx.exceptions.join(' · ') }}</p>
        <div class="zad-act"><button type="button" class="zad-btn primary" (click)="saveMatrix()" [disabled]="busy" data-matrix-save>{{ 'Save the category view' | t }}</button>
          <a class="zad-btn" [href]="tplUrl('matrix')" (click)="download($event, 'matrix')">{{ 'Download template' | t }}</a>
          <label class="zad-btn">{{ 'Upload' | t }}<input type="file" accept=".xlsx" hidden (change)="upload($event, 'matrix')"></label></div>
      </ng-container>
    </section>

    <!-- 15: go live -->
    <ng-container *ngIf="st.key === 'golive'">
      <section class="zad-card" data-blocking>
        <h3><mat-icon [class.zad-ok]="!st.blocking.length" [class.zad-bad]="st.blocking.length">{{ st.blocking.length ? 'block' : 'task_alt' }}</mat-icon>
          {{ st.blocking.length ? ('{0} items block go-live' | t:[st.blocking.length]) : ('Blocking items: none' | t) }}</h3>
        <ul class="zsg-live"><li *ngFor="let c of st.blocking"><mat-icon class="zad-bad">error</mat-icon><span style="flex:1">{{ 'Step {0}' | t:[c.step_no] }} · {{ c.text }}</span>
          <a *ngIf="c.link" [routerLink]="c.link">{{ 'Fix' | t }}</a> <a (click)="go(c.step)" style="cursor:pointer;color:#5b4fe0">{{ 'Open the step' | t }}</a></li></ul>
      </section>
      <section class="zad-card" *ngIf="st.warnings.length" data-warnings>
        <h3><mat-icon style="color:#b8730f">warning</mat-icon>{{ 'Warnings – accept with a note or fix later' | t }}</h3>
        <ul class="zsg-live"><li *ngFor="let c of st.warnings"><span style="flex:1 1 300px">{{ 'Step {0}' | t:[c.step_no] }} · {{ c.text }}</span>
          <input [(ngModel)]="notes[c.key + '@' + c.step]" [placeholder]="'Note (e.g. fix later)' | t" [attr.data-note]="c.key + '@' + c.step"></li></ul>
      </section>
      <section class="zad-card"><h3><mat-icon>receipt_long</mat-icon>Trial payroll</h3>
        <p *ngIf="st.trial">{{ st.trial.name }} – {{ st.trial.status | titlecase }}. <a routerLink="/main-sidebar/zeo-ai/payroll-auditor">{{ 'Check it with the AI payroll auditor' | t }}</a></p>
        <p class="zad-muted" *ngIf="!st.trial">Run the payroll of the first month (status Processed) and check the payslips and the bank file before paying.</p></section>
      <section class="zad-card"><h3><mat-icon>info</mat-icon>Good to know</h3><ul style="margin:0;padding-inline-start:18px;font-size:12.5px"><li *ngFor="let x of st.info">{{ x }}</li></ul></section>
      <p class="zad-msg" *ngIf="st.live_at">{{ 'ZEO is live since {0}.' | t:[st.live_at.slice(0, 10)] }}</p>
    </ng-container>

    <!-- actions, templates, links -->
    <section class="zad-card" *ngIf="st.actions?.length || st.template">
      <div class="zad-act" *ngFor="let a of st.actions || []"><button type="button" class="zad-btn" (click)="act(a.key)" [disabled]="busy" [attr.data-act]="a.key">{{ a.label }}</button>
        <span class="zad-muted">{{ a.help }}</span></div>
      <div class="zsg-tpl" *ngIf="st.template" style="margin-top:8px"><mat-icon>table_view</mat-icon>
        <a class="zad-btn sm" [href]="tplUrl(st.template)" (click)="download($event, st.template)" data-tpl-download>{{ 'Download template' | t }}</a>
        <label class="zad-btn sm">{{ 'Upload' | t }}<input type="file" accept=".xlsx" hidden (change)="upload($event, st.template)" data-tpl-upload></label>
        <span class="zad-muted">{{ 'The template comes filled with the current setup. Bad rows are never saved – they are listed.' | t }}</span></div>
      <table class="zad-t" *ngIf="tplErrors.length" style="margin-top:8px"><tr><th>Row</th><th>Problem</th></tr><tr *ngFor="let e of tplErrors"><td>{{ e.row }}</td><td class="zad-bad">{{ e.error }}</td></tr></table>
    </section>
    <div class="zsg-links" *ngIf="st.links?.length"><span class="zad-muted">{{ 'Full screens:' | t }}</span><a *ngFor="let l of st.links" [routerLink]="l.link">{{ l.label }}</a></div>

    <div class="zsg-foot">
      <button type="button" class="zad-btn" (click)="back()" [disabled]="st.no === 1">Back</button>
      <span class="grow"></span>
      <button type="button" class="zad-btn" *ngIf="st.can_skip" (click)="skip()" [disabled]="busy" data-skip>Skip for now</button>
      <button type="button" class="zad-btn" *ngIf="st.key !== 'golive'" (click)="save('save')" [disabled]="busy" data-save>Save</button>
      <button type="button" class="zad-btn primary" *ngIf="st.key !== 'golive'" (click)="save('next')" [disabled]="busy" data-next>Save and continue</button>
      <button type="button" class="zad-btn primary" *ngIf="st.key === 'golive'" (click)="goLive()" [disabled]="busy || st.blocking.length" data-go-live>Start using ZEO</button>
    </div>
  </main>

  <aside class="zsg-aside" *ngIf="st">
    <ng-container *ngTemplateOutlet="gateCard"></ng-container>
    <section class="zad-card" *ngIf="st.fills?.length"><h3><mat-icon style="color:#2e9d6a">auto_awesome</mat-icon>ZEO fills in</h3>
      <ul class="zsg-fills"><li *ngFor="let f of st.fills"><mat-icon>check_circle</mat-icon>{{ f }}</li></ul></section>
    <section class="zad-card" data-checks><h3><mat-icon style="color:#b8730f">rule</mat-icon>Checked before Next</h3>
      <ul class="zsg-checks">
        <li *ngFor="let c of failing()" [class]="c.level" [attr.data-check]="c.key">
          <mat-icon>{{ c.level === 'block' ? 'error' : 'warning' }}</mat-icon>
          <span>{{ c.text }} <a *ngIf="c.link" [routerLink]="c.link">{{ 'Fix' | t }}</a></span></li>
        <li class="ok" *ngIf="passed()"><mat-icon>check_circle</mat-icon><span>{{ (failing().length ? (passed() === 1 ? '1 other check passed' : '{0} other checks passed') : (passed() === 1 ? 'The check passed' : 'All {0} checks passed')) | t:[passed()] }}</span></li>
        <li *ngIf="!(st.checks || []).length" class="ok"><mat-icon>check_circle</mat-icon><span>{{ 'Nothing blocks this step.' | t }}</span></li>
      </ul></section>
  </aside>
</div>
<p class="zad-msg err" *ngIf="!ov?.can_use && msg" style="margin:20px 24px" data-msg>{{ msg }}</p>`,
})
export class ZSetupGuideComponent implements OnInit, OnDestroy {
  ov: any = null; st: any = null; key = ''; vals: Record<string, any> = {}; codes: Record<string, string> = {};   // v1.62.1 key '' = the Get started landing
  notes: Record<string, string> = {}; mx: any = null; msg = ''; err = false; busy = false; tplErrors: any[] = [];
  gate: any = null;   // v1.62.1 required setup before HR transactions
  private sub?: Subscription;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private route: ActivatedRoute, private router: Router) {}

  private url(path = ''): string {
    return `${environment.apiBaseUrl}/zeo-admin/api/setup-guide/${path}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.ov = await firstValueFrom(this.http.get<any>(this.url() + '&full=1'));
      if (!this.ov.can_use) { this.say(i18nT('Only the company administrator can use the setup guide.'), true); return; }
      firstValueFrom(this.http.post(this.url(), { action: 'opened' })).catch(() => undefined);
    } catch (e) { this.say(httpErrorText(e), true); return; }
    this.loadGate();
    // v1.62.1: ?step=<key> → that step; no ?step → the Get started landing (the back link, the browser's Back and the strip use the URL)
    this.sub = this.route.queryParamMap.subscribe(q => {
      const want = q.get('step') || '';
      if (want) { if (want !== this.key || !this.st) { this.open(want); } }
      else { this.landing(); }
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  /** v1.62.1 the Get started list with fresh counts and the first blocking item of every step */
  async landing(): Promise<void> {
    const had = !!this.key;
    this.key = ''; this.st = null; this.mx = null; this.tplErrors = [];
    if (had && typeof window !== 'undefined') { window.scrollTo?.({ top: 0 }); }
    this.cd.markForCheck();
    await this.refreshCounts();
  }
  /** opens a step through the URL (a new history entry, so the browser's Back returns) */
  go(key: string): void { this.router.navigate([], { relativeTo: this.route, queryParams: key ? { step: key } : {} }); }
  home(message = ''): void { this.go(''); if (message) { setTimeout(() => this.say(message), 0); } }
  stateText(s: any): string { return i18nT(s.status === 'done' ? 'Completed' : s.status === 'skipped' ? 'Skipped' : 'Pending'); }
  doneCount(): number { return (this.ov?.steps || []).filter((s: any) => s.status === 'done').length; }
  pendingCount(): number { return (this.ov?.steps || []).filter((s: any) => s.status !== 'done').length; }
  /** after Save and continue / Skip: the next step not completed yet; none after this one → back to the landing */
  private async onward(): Promise<void> {
    const i = (this.ov?.steps || []).findIndex((s: any) => s.key === this.key);
    const nxt = nextOpen(this.ov?.steps || [], i);
    if (nxt) { this.go(nxt.key); setTimeout(() => this.say(i18nT('Saved.')), 0); }
    else { this.home(i18nT((this.ov?.steps || []).every((s: any) => stepOk(s)) ? 'Every step is completed or skipped.' : 'Saved.')); }
  }

  // ---------------------------------------------------------------- v1.62.1 required setup before HR transactions
  private gateUrl(): string { return `${environment.apiBaseUrl}/zeo-admin/api/setup-gate/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  async loadGate(): Promise<void> {
    try { this.gate = await firstValueFrom(this.http.get<any>(this.gateUrl())); } catch { this.gate = null; }
    this.cd.markForCheck();
  }
  async setAllow(on: boolean): Promise<void> {
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.post(this.gateUrl(), { allow: !!on })); this.gate = r; this.say(r.message_saved || i18nT('Saved.')); }
    catch (e) { this.say(httpErrorText(e), true); await this.loadGate(); }
    this.busy = false; this.cd.markForCheck();
  }

  say(t: string, err = false): void { this.msg = t; this.err = err; this.cd.markForCheck(); }
  failing(): any[] { return (this.st?.checks || []).filter((c: any) => !c.ok).sort((a: any, b: any) => (a.level === 'block' ? 0 : 1) - (b.level === 'block' ? 0 : 1)); }
  passed(): number { return (this.st?.checks || []).filter((c: any) => c.ok).length; }

  async open(key: string): Promise<void> {
    this.busy = true; this.mx = null; this.tplErrors = [];
    try {
      this.st = await firstValueFrom(this.http.get<any>(this.url(key + '/')));
      this.key = key; this.fill(); this.msg = '';
      if (typeof window !== 'undefined') { window.scrollTo?.({ top: 0 }); }
    } catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }

  fill(): void {
    this.vals = {};
    for (const f of this.st.fields || []) { this.vals[f.key] = f.value; }
    this.codes = {};
    for (const a of this.st.codes || []) { for (const t of a.types) { this.codes[t.type] = t.code; } }
  }

  values(): any {
    const v: any = {};
    for (const f of this.st.fields || []) { if (!f.readonly) { v[f.key] = this.vals[f.key]; } }
    if (this.st.codes) { v.codes = this.codes; }
    if (this.st.modules) { v.modules = this.st.modules.filter((m: any) => m.on).map((m: any) => m.key); }
    if (this.st.eid) { v.eid = this.st.eid; }
    return v;
  }

  countList(): { label: string; v: number }[] {
    const L: Record<string, string> = { employees: 'Employees', no_category: 'Without category', no_manager: 'Without manager', no_iban: 'Without IBAN',
      employees_with_login: 'With a login', without_login: 'Without a login', without_email: 'Without e-mail', invites_pending: 'Links waiting' };
    return Object.keys(this.st.counts || {}).map(k => ({ label: L[k] || k, v: this.st.counts[k] }));
  }

  private async post(action: string, extra: any = {}): Promise<any> {
    this.busy = true; this.msg = '';
    try {
      const r: any = await firstValueFrom(this.http.post(this.url(this.key + '/'), { action, values: { ...this.values(), ...extra } }));
      this.st = r.step; this.ov = { ...this.ov, ...r.overview, steps: (r.overview?.steps || []).map((s: any) => {
        const o = this.ov?.steps?.find((x: any) => x.key === s.key) || {};
        return { ...s, open: o.open, first: o.first, warnings: o.warnings };   // full counts come with refreshCounts()
      }) };
      this.fill(); this.say(r.message || i18nT('Saved.'));
      this.loadGate();   // v1.62.1 a step marked done or skipped may open HR transactions
      return r;
    } catch (e) { this.say(httpErrorText(e), true); return null; }
    finally { this.busy = false; this.cd.markForCheck(); }
  }

  async save(action: 'save' | 'next'): Promise<void> {
    const r = await this.post(action);
    this.refreshCounts();
    if (r && action === 'next') { await this.onward(); }
  }

  async skip(): Promise<void> {
    const r = await this.post('skip');
    this.refreshCounts();
    if (r) { await this.onward(); }
  }

  async act(key: string): Promise<void> { await this.post(key); this.refreshCounts(); }

  async goLive(): Promise<void> {
    const r = await this.post('go_live', { accept: this.notes });
    if (r) { this.refreshCounts(); }
  }

  back(): void {
    const i = this.ov.steps.findIndex((s: any) => s.key === this.key);
    if (i > 0) { this.go(this.ov.steps[i - 1].key); }
  }

  async refreshCounts(): Promise<void> {
    try { this.ov = await firstValueFrom(this.http.get<any>(this.url() + '&full=1')); this.cd.markForCheck(); } catch { /* the list keeps the old counts */ }
  }

  // ---------------------------------------------------------------- category view
  async toggleMatrix(): Promise<void> {
    if (this.mx) { this.mx = null; return; }
    try { this.mx = await firstValueFrom(this.http.get<any>(this.url('matrix/'))); } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  copyRow(i: number): void {
    const r = this.mx.rows[i], n = this.mx.rows[i + 1];
    if (n) { Object.assign(n, { weekend: r.weekend, start: r.start, end: r.end, roster: r.roster, leave: r.leave, pay: r.pay }); }
  }
  applyAll(i: number): void {
    const r = this.mx.rows[i];
    for (const n of this.mx.rows) { if (n !== r) { Object.assign(n, { weekend: r.weekend, start: r.start, end: r.end, roster: r.roster, leave: r.leave, pay: r.pay }); } }
  }
  async saveMatrix(): Promise<void> {
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(this.url('matrix/'), { rows: this.mx.rows }));
      this.mx = r; this.say(i18nT('{0} settings changed.', [r.changed]));
      this.st = await firstValueFrom(this.http.get<any>(this.url(this.key + '/'))); this.fill();
    } catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }

  // ---------------------------------------------------------------- Excel templates
  tplUrl(kind: string): string { return this.url(`template/${kind}/`); }
  async download(ev: Event, kind: string): Promise<void> {
    ev.preventDefault();
    try {
      const b = await firstValueFrom(this.http.get(this.tplUrl(kind), { responseType: 'blob' }));
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `zeo-setup-${kind}.xlsx`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) { this.say(httpErrorText(e), true); }
  }
  async upload(ev: Event, kind: string): Promise<void> {
    const inp = ev.target as HTMLInputElement; const f = inp.files?.[0]; if (!f) { return; }
    const fd = new FormData(); fd.append('file', f);
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(this.tplUrl(kind), fd));
      this.tplErrors = r.errors || [];
      this.say(i18nT('{0} rows saved, {1} rows with problems.', [r.saved, this.tplErrors.length]), !!this.tplErrors.length);
      const keep = this.tplErrors;
      if (kind === 'matrix' && this.mx) { this.mx = await firstValueFrom(this.http.get<any>(this.url('matrix/'))); }
      this.st = await firstValueFrom(this.http.get<any>(this.url(this.key + '/'))); this.fill(); this.tplErrors = keep;
    } catch (e) { this.say(httpErrorText(e), true); }
    inp.value = ''; this.busy = false; this.cd.markForCheck();
  }
}
