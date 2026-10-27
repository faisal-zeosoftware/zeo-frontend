// v1.62.0 ui: dates dd/MM/yyyy
/**
 * v1.47.0 – "My team": the manager's one page. Who is in / late / on leave / not in yet today, every team member's next
 * leave, expiring documents, goals and last 1:1; approvals waiting for the manager, documents to renew, celebrations and
 * leave coming up; 1:1 notes (agenda, notes shared with the employee, a private note and action items).
 * API: chatter/api/my-team/ and one-on-ones/.
 */
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18N_UI, i18nT } from './i18n.service';
import { ZCommandService } from './z-command.service';

@Component({
  selector: 'z-my-team',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ...I18N_UI],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zt zmt">
    <header class="zt-h">
      <div><h2>{{ 'My team' | t }}</h2><p class="zr-muted">{{ 'Today, what waits for you and your 1:1s – for the people who report to you.' | t }}</p></div>
      <span class="zr-grow"></span>
      <label class="zmt-chk"><input type="checkbox" [checked]="indirect" (change)="indirect = $any($event.target).checked; load()"> {{ 'Include indirect reports' | t }}</label>
    </header>
    <p class="zr-err" *ngIf="error" role="alert">{{ error }}</p>
    <ng-container *ngIf="d">
      <div class="zmt-empty" *ngIf="!d.headcount"><mat-icon aria-hidden="true">groups</mat-icon>
        <p>{{ 'Nobody reports to you yet. When employees have you as their reporting manager (or "Reports to"), they show here.' | t }}</p></div>
      <ng-container *ngIf="d.headcount">
        <div class="zmt-counts" role="group" [attr.aria-label]="'Today' | t">
          <button type="button" *ngFor="let c of countKeys" [class.on]="state === c.key" [attr.data-state]="c.key" (click)="state = state === c.key ? '' : c.key"
                  [class]="'zmt-c ' + c.key + (state === c.key ? ' on' : '')">
            <b>{{ d.counts[c.key] || 0 }}</b><span>{{ c.label | t }}</span></button>
          <button type="button" class="zmt-c all" [class.on]="!state" (click)="state = ''"><b>{{ d.headcount }}</b><span>{{ 'Team' | t }}</span></button>
        </div>
        <div class="zmt-grid">
          <section class="zmt-members" [attr.aria-label]="'Team members' | t">
            <article class="zmt-m" *ngFor="let m of shown()" [attr.data-emp]="m.id">
              <div class="zmt-top">
                <img *ngIf="m.photo" [src]="m.photo" alt="" class="zmt-ph"><span *ngIf="!m.photo" class="zmt-ph zmt-ini" aria-hidden="true">{{ ini(m.name) }}</span>
                <div class="zmt-who"><a (click)="go(m.page)" role="link" tabindex="0" (keydown.enter)="go(m.page)"><b>{{ m.name }}</b></a>
                  <small>{{ m.designation || m.code }}</small></div>
                <span [class]="'zmt-st ' + m.state">{{ m.state_label | t }}</span>
              </div>
              <ul class="zmt-facts">
                <li *ngIf="m.celebration"><mat-icon aria-hidden="true">{{ m.celebration.kind === 'bday' ? 'cake' : 'workspace_premium' }}</mat-icon>
                  {{ (m.celebration.kind === 'bday' ? 'Birthday on {0}' : (m.celebration.years === 1 ? '1 year on {0}' : '{1} years on {0}')) | t:(m.celebration.date | date:'d MMM'):m.celebration.years }}</li>
                <li *ngIf="m.next_leave"><mat-icon aria-hidden="true">beach_access</mat-icon>{{ m.next_leave.type }} {{ m.next_leave.from | date:'d MMM' }} – {{ m.next_leave.to | date:'d MMM' }}
                  <em *ngIf="m.next_leave.status !== 'approved'">({{ m.next_leave.status | t }})</em></li>
                <li *ngFor="let doc of m.documents.slice(0, 2)" [class.bad]="doc.days < 0"><mat-icon aria-hidden="true">badge</mat-icon>
                  {{ doc.type }} {{ (doc.days < 0 ? 'expired {0} days ago' : 'expires in {0} days') | t:(doc.days < 0 ? -doc.days : doc.days) }}</li>
                <li *ngIf="m.goals"><mat-icon aria-hidden="true">flag</mat-icon>{{ '{0} goals · {1}% done' | t:m.goals.n:m.goals.progress }}
                  <em *ngIf="m.goals.at_risk" class="bad"> · {{ '{0} at risk' | t:m.goals.at_risk }}</em></li>
                <li><mat-icon aria-hidden="true">forum</mat-icon>{{ m.last_1on1 ? (('Last 1:1 {0}' | t:(m.last_1on1 | date:'d MMM'))) : ('No 1:1 yet' | t) }}
                  <em *ngIf="m.next_1on1"> · {{ 'next {0}' | t:(m.next_1on1 | date:'d MMM') }}</em></li>
              </ul>
              <div class="zmt-acts"><button type="button" class="zr-btn sm" data-oo (click)="openOO(m)"><mat-icon>forum</mat-icon>{{ '1:1' | t }}</button>
                <button type="button" class="zr-btn sm" (click)="go(m.page)"><mat-icon>person</mat-icon>{{ 'Profile' | t }}</button></div>
            </article>
            <p class="zr-muted" *ngIf="!shown().length">{{ 'Nobody in this group today.' | t }}</p>
          </section>
          <aside class="zmt-side">
            <section class="zmt-card" data-card="approvals"><h3><mat-icon aria-hidden="true">approval</mat-icon>{{ 'Waiting for your approval' | t }}<b>{{ d.approvals?.total || 0 }}</b></h3>
              <button type="button" class="zmt-row" *ngFor="let a of d.approvals?.by_module" (click)="go('/main-sidebar/inbox')">{{ a.label | t }}<b>{{ a.count }}</b></button>
              <p class="zr-muted" *ngIf="!d.approvals?.total">{{ 'Nothing to approve.' | t }}</p></section>
            <section class="zmt-card" data-card="documents"><h3><mat-icon aria-hidden="true">badge</mat-icon>{{ 'Documents to renew' | t }}<b>{{ d.documents.length }}</b></h3>
              <div class="zmt-row" *ngFor="let x of d.documents.slice(0, 8)" [class.bad]="x.days < 0"><span>{{ x.employee }} · {{ x.type }}</span><small>{{ x.expiry | date:'dd/MM/yyyy' }}</small></div>
              <p class="zr-muted" *ngIf="!d.documents.length">{{ 'No document expires in the next 60 days.' | t }}</p></section>
            <section class="zmt-card" data-card="celebrations"><h3><mat-icon aria-hidden="true">celebration</mat-icon>{{ 'Birthdays and anniversaries' | t }}</h3>
              <div class="zmt-row" *ngFor="let c of d.celebrations"><span>{{ c.employee }} · {{ (c.kind === 'bday' ? 'Birthday' : (c.years === 1 ? '1 year' : '{0} years')) | t:c.years }}</span><small>{{ c.date | date:'EEE d MMM' }}</small></div>
              <p class="zr-muted" *ngIf="!d.celebrations.length">{{ 'None in the next 30 days.' | t }}</p></section>
            <section class="zmt-card" data-card="leave"><h3><mat-icon aria-hidden="true">event_busy</mat-icon>{{ 'Leave in the next 14 days' | t }}</h3>
              <div class="zmt-row" *ngFor="let l of d.upcoming_leave"><span>{{ l.employee }} · {{ l.type }}</span><small>{{ l.from | date:'d MMM' }} – {{ l.to | date:'d MMM' }}</small></div>
              <p class="zr-muted" *ngIf="!d.upcoming_leave.length">{{ 'Nobody is planning leave.' | t }}</p></section>
          </aside>
        </div>
      </ng-container>
      <!-- v1.58.0 matrix reporting: people for whom I am the functional manager or the manager of an assignment -->
      <section class="zmt-dotted" *ngIf="d.dotted?.length" data-dotted>
        <h2>{{ 'Dotted line' | t }} <b>{{ d.dotted.length }}</b></h2>
        <p class="zr-muted">{{ 'People who report to you as functional manager or on an assignment – you approve where the approval chain has a functional manager level, and give input on their appraisal.' | t }}</p>
        <div class="zmt-members">
          <article class="zmt-m dotted" *ngFor="let m of d.dotted" [attr.data-dotted-emp]="m.id">
            <div class="zmt-top">
              <img *ngIf="m.photo" [src]="m.photo" alt="" class="zmt-ph"><span *ngIf="!m.photo" class="zmt-ph zmt-ini" aria-hidden="true">{{ ini(m.name) }}</span>
              <div class="zmt-who"><a (click)="go(m.page)" role="link" tabindex="0" (keydown.enter)="go(m.page)"><b>{{ m.name }}</b></a>
                <small>{{ m.designation }}{{ m.department ? ' · ' + m.department : '' }}</small></div>
            </div>
            <p class="zmt-rel">{{ m.relation }}</p>
          </article>
        </div>
      </section>
    </ng-container>
  </div>

  <!-- 1:1 panel -->
  <ng-container *ngIf="oo">
    <div class="zp-back" (click)="oo = null"></div>
    <aside class="zmt-oo" role="dialog" aria-modal="true" [attr.aria-label]="'1:1 with {0}' | t:oo.m.name">
      <header><h3>{{ '1:1 with {0}' | t:oo.m.name }}</h3><button type="button" class="zp-x" (click)="oo = null" [attr.aria-label]="'Close' | t"><mat-icon>close</mat-icon></button></header>
      <form class="zp-form" (ngSubmit)="saveOO()">
        <div class="zp-row"><label>{{ 'Date' | t }}<input type="date" name="d" [(ngModel)]="f.date" required></label>
          <label class="zp-chk"><input type="checkbox" name="s" [(ngModel)]="f.shared"> {{ 'Share agenda, notes and actions with the employee' | t }}</label></div>
        <label>{{ 'Agenda' | t }}<textarea name="a" rows="2" [(ngModel)]="f.agenda"></textarea></label>
        <label>{{ 'Notes' | t }}<textarea name="n" rows="3" [(ngModel)]="f.notes"></textarea></label>
        <label>{{ 'Private note (only you and HR)' | t }}<textarea name="p" rows="2" [(ngModel)]="f.private_note"></textarea></label>
        <div class="zmt-actions"><b>{{ 'Action items' | t }}</b>
          <div class="zmt-ai" *ngFor="let a of f.actions; let i = index"><input type="checkbox" [name]="'ad' + i" [(ngModel)]="a.done" [attr.aria-label]="'Done' | t">
            <input class="zr-in" [name]="'at' + i" [(ngModel)]="a.text"><button type="button" class="zp-x" (click)="f.actions.splice(i, 1)" [attr.aria-label]="'Remove' | t"><mat-icon>delete</mat-icon></button></div>
          <button type="button" class="zr-btn sm" (click)="f.actions.push({ text: '', done: false })"><mat-icon>add</mat-icon>{{ 'Add an action' | t }}</button></div>
        <p class="zp-err" *ngIf="ferr" role="alert">{{ ferr }}</p>
        <div class="zp-acts"><button type="button" class="zr-btn" *ngIf="f.id" (click)="newOO()">{{ 'New 1:1' | t }}</button><span class="zp-grow"></span>
          <button type="submit" class="zr-btn primary" [disabled]="saving">{{ (f.id ? 'Save' : 'Plan the 1:1') | t }}</button></div>
      </form>
      <h4>{{ 'Earlier 1:1s' | t }}</h4>
      <button type="button" class="zmt-hist" *ngFor="let o of oo.list" [class.on]="o.id === f.id" (click)="edit(o)">
        <b>{{ o.date | date:'dd/MM/yyyy' }}</b><span>{{ o.agenda || o.notes || ('No notes' | t) }}</span>
        <small *ngIf="o.open_actions">{{ '{0} open actions' | t:o.open_actions }}</small></button>
      <p class="zr-muted" *ngIf="!oo.list.length">{{ 'No 1:1 yet.' | t }}</p>
    </aside>
  </ng-container>`,
  styles: [`
  .zmt { max-width: 1280px !important; }
  .zmt-chk { display: flex; gap: 6px; align-items: center; font-size: 13px; color: #3B4057; }
  .zmt-empty { display: flex; gap: 12px; align-items: center; background: #fff; border: 1px dashed #D5D8E3; border-radius: 12px; padding: 18px; color: #3B4057; }
  .zmt-empty mat-icon { color: #5B4FE0; }
  .zmt-counts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .zmt-c { display: flex; align-items: baseline; gap: 8px; padding: 10px 16px; border: 1px solid #E3E5EE; border-radius: 12px; background: #fff; cursor: pointer; font: inherit; color: #3B4057; }
  .zmt-c b { font-size: 22px; font-weight: 600; color: #1B1640; font-variant-numeric: tabular-nums; }
  .zmt-c.on { border-color: #5B4FE0; box-shadow: inset 0 0 0 1px #5B4FE0; }
  .zmt-c.late b { color: #7A5200; } .zmt-c.out b { color: #3E3A99; } .zmt-c.missing b { color: #A32626; }
  .zmt-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
  .zmt-dotted { margin-top: 20px; } .zmt-dotted h2 { font-size: 16px; font-weight: 600; color: #1B1640; display: flex; gap: 8px; align-items: baseline; margin: 0 0 4px; }
  .zmt-dotted h2 b { font-size: 13px; color: #5B4FE0; } .zmt-m.dotted { border-style: dashed; } .zmt-rel { margin: 0; font-size: 12.5px; color: #3E3A99; }
  .zmt-members { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .zmt-m { background: #fff; border: 1px solid #E3E5EE; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .zmt-top { display: flex; gap: 10px; align-items: center; }
  .zmt-ph { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex: none; }
  .zmt-ini { display: grid; place-items: center; background: #EEEDFD; color: #3E3A99; font-weight: 600; font-size: 14px; }
  .zmt-who { flex: 1; min-width: 0; display: flex; flex-direction: column; } .zmt-who a { cursor: pointer; color: #1B1640; }
  .zmt-who b { font-weight: 600; } .zmt-who small { color: #6B7185; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .zmt-st { font-size: 11.5px; padding: 2px 8px; border-radius: 10px; background: #F0F1F6; color: #3B4057; white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
  .zmt-st.in { background: #E3F5E8; color: #0E6B23; } .zmt-st.late { background: #FFF2D6; color: #7A5200; }
  .zmt-st.out { background: #EEEDFD; color: #3E3A99; } .zmt-st.missing { background: #FBE7E7; color: #A32626; }
  .zmt-facts { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 12.5px; color: #3B4057; }
  .zmt-facts li { display: flex; gap: 6px; align-items: center; } .zmt-facts mat-icon { font-size: 16px; width: 16px; height: 16px; color: #8A8FA6; flex: none; }
  .zmt-facts .bad, .zmt-facts .bad mat-icon { color: #A32626; } .zmt-facts em { font-style: normal; color: #6B7185; }
  .zmt-acts { display: flex; gap: 6px; margin-top: auto; }
  .zmt-side { display: grid; gap: 12px; }
  .zmt-card { background: #fff; border: 1px solid #E3E5EE; border-radius: 12px; padding: 12px 14px; }
  .zmt-card h3 { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; font-size: 13.5px; font-weight: 600; color: #1B1640; }
  .zmt-card h3 mat-icon { font-size: 18px; width: 18px; height: 18px; color: #5B4FE0; } .zmt-card h3 b { margin-inline-start: auto; }
  .zmt-row { display: flex; justify-content: space-between; gap: 8px; width: 100%; padding: 5px 0; border: 0; border-top: 1px solid #F0F1F6; background: none; font: inherit; font-size: 12.5px; color: #262A3D; text-align: start; }
  button.zmt-row { cursor: pointer; } button.zmt-row:hover { color: #5B4FE0; }
  .zmt-row small { color: #6B7185; white-space: nowrap; } .zmt-row.bad span { color: #A32626; }
  .zmt-oo { position: fixed; top: 0; bottom: 0; inset-inline-end: 0; width: min(480px, 100vw); background: #fff; z-index: 1301; box-shadow: -12px 0 40px rgba(20, 18, 48, .2); overflow-y: auto; padding-bottom: 20px; }
  .zmt-oo header { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #E3E5EE; } .zmt-oo header h3 { margin: 0; font-size: 16px; flex: 1; color: #1B1640; }
  .zmt-oo h4 { margin: 8px 16px 6px; font-size: 13px; color: #3B4057; }
  .zmt-actions { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; } .zmt-ai { display: flex; gap: 6px; align-items: center; }
  .zmt-hist { display: flex; flex-direction: column; gap: 2px; width: calc(100% - 32px); margin: 0 16px 6px; padding: 8px 10px; border: 1px solid #E3E5EE; border-radius: 8px; background: #FAFAFE; text-align: start; cursor: pointer; font: inherit; font-size: 12.5px; color: #262A3D; }
  .zmt-hist.on { border-color: #5B4FE0; } .zmt-hist span { color: #3B4057; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .zmt-hist small { color: #7A5200; }
  @media (max-width: 1000px) { .zmt-grid { grid-template-columns: 1fr; } }
  `],
})
export class ZMyTeamComponent implements OnInit {
  d: any = null; error = ''; indirect = false; state = '';
  oo: { m: any; list: any[] } | null = null; f: any = {}; ferr = ''; saving = false;
  readonly countKeys = [{ key: 'in', label: 'In' }, { key: 'late', label: 'Late' }, { key: 'out', label: 'On leave' }, { key: 'missing', label: 'Not in yet' }];
  constructor(private cmd: ZCommandService, private router: Router, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    try { this.d = await this.cmd.get('my-team/', { indirect: this.indirect ? 1 : '' }); this.error = ''; }
    catch (e: any) { this.error = e?.error?.detail || i18nT('My team could not be loaded.'); }
    this.cd.markForCheck();
  }
  shown(): any[] { return (this.d?.members || []).filter((m: any) => !this.state || m.state === this.state); }
  ini(n: string): string { return (n || '?').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase(); }
  go(p: string): void { if (p) { this.router.navigateByUrl(p); } }

  async openOO(m: any): Promise<void> {
    this.oo = { m, list: [] }; this.newOO(); this.cd.markForCheck();
    try { this.oo.list = await this.cmd.get('one-on-ones/', { employee: m.id }); } catch { /* none */ }
    const next = this.oo.list.find(o => o.date >= this.today());
    if (next) { this.edit(next); }
    this.cd.markForCheck();
  }
  private today(): string { const t = new Date(); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  newOO(): void { this.ferr = ''; this.f = { date: this.today(), agenda: '', notes: '', private_note: '', shared: true, actions: [] }; }
  edit(o: any): void { this.ferr = ''; this.f = { ...o, actions: (o.actions || []).map((a: any) => ({ ...a })) }; }
  async saveOO(): Promise<void> {
    if (!this.oo) { return; }
    this.saving = true; this.ferr = '';
    const body = { employee: this.oo.m.id, date: this.f.date, agenda: this.f.agenda, notes: this.f.notes, private_note: this.f.private_note,
                   shared: this.f.shared, actions: (this.f.actions || []).filter((a: any) => (a.text || '').trim()) };
    try {
      const o = this.f.id ? await this.cmd.patch(`one-on-ones/${this.f.id}/`, body) : await this.cmd.post('one-on-ones/', body);
      this.oo.list = await this.cmd.get('one-on-ones/', { employee: this.oo.m.id });
      this.edit(o); this.load();
    } catch (e: any) { this.ferr = e?.error?.detail || i18nT('The 1:1 could not be saved.'); }
    this.saving = false; this.cd.markForCheck();
  }
}
