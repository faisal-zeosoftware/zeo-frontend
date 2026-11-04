// v1.62.11 (item 95)
/**
 * v1.62.11 (item 95) – Settings › Out of office rules: the company's choice whether an approver's approved leave sets out of
 * office automatically (off by default), who gets the approvals, which leave counts and whether the approvals still waiting go
 * back to the approver when they are back (on by default). Stored in the company options (/zeo-admin/api/out-of-office/settings/).
 */
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ZRecordService } from './z-record.service';
import { TPipe } from './i18n.service';
import { ZAD_STYLES, ZAdminBase } from './z-admin-pages.component';

@Component({
  selector: 'z-ooo-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TPipe],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES, `.zoo-opt { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; border: 1px solid #e3e6ea; border-radius: 8px; margin: 6px 0; cursor: pointer; font-size: 13px; }
    .zoo-opt.on { border-color: #5b4fe0; background: #f5f4ff; } .zoo-opt small { display: block; color: #5d6670; font-size: 12px; margin-top: 2px; }
    .zoo-sec { margin-top: 14px; } .zoo-sec > b { display: block; font-size: 13px; margin-bottom: 4px; }
    .zoo-types { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 4px 12px; margin: 6px 0 0 26px; }
    .zoo-sw { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; } .zoo-sw input { margin-top: 3px; width: 18px; height: 18px; }
    .zoo-sw small { display: block; color: #5d6670; font-size: 12.5px; } .zoo-err { color: #9b2c24; font-size: 12px; margin-inline-start: 26px; }`],
  template: `
<div class="zad" data-ooo-settings>
  <h2>Out of office rules</h2>
  <p class="zad-muted">What happens to the approvals of someone who is away. Each approver can still set out of office themself under Settings › My sign-in and out of office.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card" *ngIf="s" data-ooo-card>
    <h3><mat-icon>event_busy</mat-icon>Out of office automatically when an approver's leave is approved</h3>
    <label class="zoo-sw"><input type="checkbox" [(ngModel)]="s.on" [disabled]="!s.can_edit" data-ooo-on>
      <span><b>{{ s.on ? ('On' | t) : ('Off' | t) }}</b>
        <small>{{ (s.on ? 'When the last level approves the leave of someone who approves requests, out of office is set for the leave days by itself.' : 'Nothing happens by itself: an approver marks out of office themself before the leave.') | t }}</small></span></label>

    <div class="zoo-sec" [style.opacity]="s.on ? 1 : .55">
      <b>Who gets the approvals</b>
      <span class="zad-muted">The approver's own colleagues for a type ("My stand-ins") and the stand-in of a workflow level always come first.</span>
      <label class="zoo-opt" *ngFor="let o of toOpts" [class.on]="s.to === o.v"><input type="radio" name="zoo-to" [value]="o.v" [(ngModel)]="s.to" [disabled]="!s.can_edit || !s.on" [attr.data-ooo-to]="o.v">
        <span>{{ o.l | t }}<small>{{ o.h | t }}</small></span></label>
    </div>

    <div class="zoo-sec" [style.opacity]="s.on ? 1 : .55">
      <b>Which leave counts</b>
      <label class="zoo-opt" *ngFor="let o of typeOpts" [class.on]="s.types === o.v"><input type="radio" name="zoo-types" [value]="o.v" [(ngModel)]="s.types" [disabled]="!s.can_edit || !s.on" [attr.data-ooo-types]="o.v">
        <span>{{ o.l | t }}<small *ngIf="o.h">{{ o.h | t }}</small></span></label>
      <div class="zoo-types" *ngIf="s.types === 'some'" data-ooo-type-list>
        <label class="zad-chk" *ngFor="let t of s.leave_types"><input type="checkbox" [checked]="s.type_ids.includes(t.id)" (change)="tick(t.id)" [disabled]="!s.can_edit"> {{ t.name }}</label>
      </div>
      <div class="zoo-err" *ngIf="typeErr" data-zf-field-error>{{ typeErr }}</div>
    </div>

    <div class="zoo-sec">
      <label class="zoo-sw"><input type="checkbox" [(ngModel)]="s.give_back" [disabled]="!s.can_edit" data-ooo-give-back>
        <span><b>Give the waiting approvals back when the approver is back</b>
          <small>The day after the last day of the leave (or at once when the approver says they are back, or the leave is cancelled or cut short) every approval still waiting goes back to the approver. Decisions the colleague made stay. For out of office set by hand this is the default of the tick on the form.</small></span></label>
    </div>
    <div class="zad-act" *ngIf="s.can_edit"><button type="button" class="zad-btn primary" (click)="save()" [disabled]="busy" data-ooo-settings-save>Save</button></div>
    <p class="zad-muted" *ngIf="!s.can_edit">Only a company administrator or HR (leave policies) can change these rules.</p>
  </section>
  <section class="zad-card">
    <h3><mat-icon>shield</mat-icon>Other safety nets</h3>
    <p class="zad-muted">A request nobody answers in time moves on by the escalation of its workflow level, and HR can give every workflow level a stand-in for when its approver is away.</p>
    <div class="zad-act"><a class="zad-btn" routerLink="/main-sidebar/leave-options/leave-escalation">Leave escalation</a>
      <a class="zad-btn" routerLink="/main-sidebar/leave-options/leave-approval-level">Leave approval levels</a>
      <a class="zad-btn" routerLink="/main-sidebar/settings/my-account">My out of office</a></div>
  </section>
</div>`,
})
export class ZOooSettingsComponent extends ZAdminBase implements OnInit {
  s: any = null; typeErr = '';
  toOpts = [
    { v: 'named', l: 'The colleague named on the leave request', h: 'Else the approver\'s own manager, else the next approval level or HR.' },
    { v: 'manager', l: 'The approver\'s own manager', h: 'Else the next approval level or HR. The leave request does not ask for a colleague.' },
    { v: 'hr', l: 'The next approval level or HR', h: 'Branch HR, else company HR, else a company administrator.' },
  ];
  typeOpts = [
    { v: 'full_days', l: 'Full-day leave only', h: 'Not half days and not short leave in hours.' },
    { v: 'all', l: 'Every leave', h: '' },
    { v: 'some', l: 'Only the leave types I choose', h: '' },
  ];
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> {
    try { this.s = await this.get('/zeo-admin/api/out-of-office/settings/'); this.s.type_ids = this.s.type_ids || []; } catch (e) { this.say(String((e as any)?.error?.detail || 'Could not load.'), true); }
    this.cd.markForCheck();
  }
  tick(id: number): void { const a: number[] = this.s.type_ids; const i = a.indexOf(id); if (i >= 0) { a.splice(i, 1); } else { a.push(id); } this.typeErr = ''; }
  async save(): Promise<void> {
    this.typeErr = '';
    if (this.s.on && this.s.types === 'some' && !this.s.type_ids.length) { this.typeErr = 'Choose at least one leave type.'; this.cd.markForCheck(); return; }
    const b = { on: this.s.on, to: this.s.to, types: this.s.types, type_ids: this.s.type_ids, give_back: this.s.give_back };
    await this.act(async () => { const r = await this.put('/zeo-admin/api/out-of-office/settings/', b); Object.assign(this.s, r); }, 'Saved.');
  }
}
