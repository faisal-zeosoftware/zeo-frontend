/**
 * v1.47.0 – the company wall: birthdays, work anniversaries and new joiners of the user's branches and the announcements
 * for the user – with reactions and wishes / comments (the colleague gets a bell notice). The full page is /main-sidebar/wall;
 * [compact] is the strip on the home page (today and the next days, the newest announcements).
 * API: chatter/api/wall/, wall/react/, wall/comment/.
 */
import { ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18N_UI, i18nT } from './i18n.service';
import { ZCommandService } from './z-command.service';

const KIND_ICON: Record<string, string> = { bday: 'cake', anniv: 'workspace_premium', join: 'waving_hand', ann: 'campaign' };

@Component({
  selector: 'z-wall',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ...I18N_UI],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div [class]="compact ? 'zw zw-compact' : 'zt zw'">
    <header class="zt-h" *ngIf="!compact">
      <div><h2>{{ 'Company wall' | t }}</h2><p class="zr-muted">{{ 'Birthdays, work anniversaries, new joiners and announcements. React or write a wish.' | t }}</p></div>
      <span class="zr-grow"></span>
      <div class="zt-tabs" role="tablist" [attr.aria-label]="'Show' | t">
        <button type="button" role="tab" *ngFor="let k of kinds" [class.on]="kind === k.key" [attr.aria-selected]="kind === k.key" (click)="kind = k.key">{{ k.label | t }}</button></div>
    </header>
    <div class="zw-ch" *ngIf="compact && items.length"><h2><mat-icon aria-hidden="true">celebration</mat-icon>{{ 'At the company' | t }}</h2>
      <button type="button" class="zr-link" (click)="router.navigateByUrl('/main-sidebar/wall')">{{ 'Open the wall' | t }}</button></div>
    <p class="zr-err" *ngIf="error" role="alert">{{ error }}</p>
    <div class="zw-list">
      <article *ngFor="let it of shown()" [class]="'zw-item ' + it.kind + (it.today ? ' today' : '')" [attr.data-item]="it.item">
        <div class="zw-top">
          <img *ngIf="it.photo" [src]="it.photo" alt="" class="zw-ph"><span *ngIf="!it.photo" class="zw-ph zw-ic" aria-hidden="true"><mat-icon>{{ icon(it) }}</mat-icon></span>
          <div class="zw-who"><b>{{ title(it) }}</b>
            <small>{{ when(it) }}<ng-container *ngIf="it.designation"> · {{ it.designation }}</ng-container><ng-container *ngIf="it.author"> · {{ it.author }}</ng-container></small></div>
          <mat-icon class="zw-k" aria-hidden="true">{{ icon(it) }}</mat-icon>
        </div>
        <p class="zw-msg" *ngIf="it.message && !compact">{{ it.message }}</p>
        <p class="zw-msg" *ngIf="it.message && compact">{{ it.message.length > 140 ? it.message.slice(0, 140) + '…' : it.message }}</p>
        <div class="zw-react">
          <button type="button" *ngFor="let e of reacted(it)" class="zw-r" [class.mine]="it.reactions[e].mine" (click)="react(it, e)"
                  [title]="it.reactions[e].users.join(', ')" [attr.aria-label]="e + ' ' + it.reactions[e].n">{{ e }} <b>{{ it.reactions[e].n }}</b></button>
          <span class="zw-pick">
            <button type="button" class="zw-add" (click)="picker = picker === it.item ? '' : it.item" [attr.aria-label]="'Add a reaction' | t"><mat-icon>add_reaction</mat-icon></button>
            <span class="zw-emojis" *ngIf="picker === it.item"><button type="button" *ngFor="let e of emojis" (click)="react(it, e); picker = ''">{{ e }}</button></span>
          </span>
          <button type="button" class="zr-link zw-cbtn" *ngIf="it.comments_allowed !== false" (click)="open[it.item] = !open[it.item]">
            {{ (it.comments.length ? '{0} comments' : (it.kind === 'ann' ? 'Comment' : 'Write a wish')) | t:it.comments.length }}</button>
        </div>
        <div class="zw-comments" *ngIf="open[it.item]">
          <div class="zw-c" *ngFor="let c of it.comments"><b>{{ c.author }}</b> {{ c.body }}<small>{{ c.at | date:'d MMM, HH:mm' }}</small>
            <button type="button" class="zw-del" *ngIf="c.mine" (click)="delComment(it, c)" [attr.aria-label]="'Delete' | t"><mat-icon>close</mat-icon></button></div>
          <form class="zw-cf" (ngSubmit)="comment(it)"><input class="zr-in" [name]="'c' + it.item" [(ngModel)]="draft[it.item]" maxlength="2000"
            [placeholder]="(it.kind === 'ann' ? 'Write a comment…' : 'Write a wish…') | t" [attr.aria-label]="'Comment' | t">
            <button type="submit" class="zr-btn sm primary">{{ 'Send' | t }}</button></form>
        </div>
      </article>
    </div>
    <p class="zr-muted" *ngIf="loaded && !shown().length && !compact">{{ 'Nothing on the wall yet.' | t }}</p>
  </div>`,
  styles: [`
  .zw-compact { margin: 0 0 16px; background: #fff; border: 1px solid #E3E5EE; border-radius: 12px; padding: 10px 14px 12px; }
  .zw-ch { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .zw-ch h2 { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 13.5px; font-weight: 600; color: #1B1640; }
  .zw-ch h2 mat-icon { font-size: 18px; width: 18px; height: 18px; color: #E0457B; }
  .zw-list { display: grid; gap: 10px; }
  .zw-compact .zw-list { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .zw-item { background: #fff; border: 1px solid #E3E5EE; border-radius: 12px; padding: 12px 14px; }
  .zw-compact .zw-item { background: #FAFAFE; padding: 10px 12px; }
  .zw-item.today.bday, .zw-item.today.anniv { border-color: #F2B8CB; background: #FFF7FA; }
  .zw-top { display: flex; gap: 10px; align-items: center; }
  .zw-ph { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex: none; }
  .zw-ic { display: grid; place-items: center; background: #EEEDFD; color: #5B4FE0; } .zw-ic mat-icon { font-size: 20px; width: 20px; height: 20px; }
  .zw-who { flex: 1; min-width: 0; display: flex; flex-direction: column; } .zw-who b { font-weight: 600; color: #1B1640; }
  .zw-who small { color: #6B7185; font-size: 12px; }
  .zw-k { color: #E0457B; } .zw-item.ann .zw-k { color: #5B4FE0; } .zw-item.join .zw-k { color: #0E6B23; }
  .zw-msg { margin: 8px 0 0; color: #3B4057; white-space: pre-line; line-height: 1.45; }
  .zw-react { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; }
  .zw-r { border: 1px solid #E3E5EE; background: #fff; border-radius: 14px; padding: 1px 8px; cursor: pointer; font-size: 13px; }
  .zw-r.mine { border-color: #5B4FE0; background: #EEEDFD; } .zw-r b { font-weight: 500; font-size: 12px; color: #3B4057; }
  .zw-pick { position: relative; display: inline-flex; }
  .zw-add { border: 0; background: none; color: #8A8FA6; cursor: pointer; display: flex; padding: 2px; border-radius: 6px; } .zw-add:hover { color: #5B4FE0; background: #F4F5FA; }
  .zw-add mat-icon { font-size: 19px; width: 19px; height: 19px; }
  .zw-emojis { position: absolute; bottom: calc(100% + 4px); inset-inline-start: 0; display: flex; gap: 2px; background: #fff; border: 1px solid #E3E5EE; border-radius: 20px; padding: 3px 6px; box-shadow: 0 6px 18px rgba(20, 18, 48, .14); z-index: 5; }
  .zw-emojis button { border: 0; background: none; font-size: 18px; cursor: pointer; padding: 2px 4px; border-radius: 8px; } .zw-emojis button:hover { background: #F4F5FA; }
  .zw-cbtn { margin-inline-start: auto; font-size: 12.5px; }
  .zw-comments { margin-top: 8px; border-top: 1px solid #F0F1F6; padding-top: 8px; display: grid; gap: 6px; }
  .zw-c { font-size: 13px; color: #262A3D; display: flex; flex-wrap: wrap; gap: 4px 6px; align-items: baseline; } .zw-c b { font-weight: 600; }
  .zw-c small { color: #8A8FA6; font-size: 11px; }
  .zw-del { border: 0; background: none; color: #8A8FA6; cursor: pointer; padding: 0; display: flex; } .zw-del mat-icon { font-size: 14px; width: 14px; height: 14px; }
  .zw-cf { display: flex; gap: 6px; }
  `],
})
export class ZWallComponent implements OnInit {
  @Input() compact = false;
  items: any[] = []; emojis: string[] = []; error = ''; loaded = false; kind = '';
  picker = ''; open: Record<string, boolean> = {}; draft: Record<string, string> = {};
  readonly kinds = [{ key: '', label: 'All' }, { key: 'cel', label: 'Celebrations' }, { key: 'join', label: 'New joiners' }, { key: 'ann', label: 'Announcements' }];
  constructor(private cmd: ZCommandService, public router: Router, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    try { const r: any = await this.cmd.get('wall/'); this.items = r.items || []; this.emojis = r.emojis || []; this.error = ''; }
    catch (e: any) { this.error = this.compact ? '' : (e?.error?.detail || i18nT('The wall could not be loaded.')); }
    this.loaded = true; this.cd.markForCheck();
  }
  shown(): any[] {
    let r = this.items;
    if (this.compact) { return r.filter(i => i.kind !== 'ann').slice(0, 4).concat(r.filter(i => i.kind === 'ann').slice(0, 2)); }
    if (this.kind === 'cel') { r = r.filter(i => i.kind === 'bday' || i.kind === 'anniv'); }
    else if (this.kind) { r = r.filter(i => i.kind === this.kind); }
    return r;
  }
  icon(it: any): string { return KIND_ICON[it.kind] || 'campaign'; }
  title(it: any): string {
    if (it.kind === 'bday') { return i18nT(it.today ? 'Happy birthday, {0}!' : 'Birthday of {0}', [it.employee]); }
    if (it.kind === 'anniv') { return i18nT(it.years === 1 ? '{0} – 1 year with us' : '{0} – {1} years with us', [it.employee, it.years]); }
    if (it.kind === 'join') { return i18nT('Welcome {0}', [it.employee]); }
    return it.title;
  }
  when(it: any): string {
    const d = new Date(it.date + 'T00:00:00'); const t = new Date(); t.setHours(0, 0, 0, 0);
    const days = Math.round((d.getTime() - t.getTime()) / 86400000);
    if (days === 0) { return i18nT('Today'); }
    if (days === 1) { return i18nT('Tomorrow'); }
    if (days === -1) { return i18nT('Yesterday'); }
    const s = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    return it.kind === 'join' ? i18nT('Joined {0}', [s]) : s;
  }
  reacted(it: any): string[] { return Object.keys(it.reactions || {}).filter(e => it.reactions[e].n > 0); }
  async react(it: any, e: string): Promise<void> {
    try { const r: any = await this.cmd.post('wall/react/', { item: it.item, emoji: e }); it.reactions = r.items?.[0]?.reactions || {}; }
    catch (x: any) { this.error = x?.error?.detail || i18nT('Not saved.'); }
    this.cd.markForCheck();
  }
  async comment(it: any): Promise<void> {
    const body = (this.draft[it.item] || '').trim();
    if (!body) { return; }
    try { const c = await this.cmd.post('wall/comment/', { item: it.item, body }); it.comments = [...it.comments, c]; this.draft[it.item] = ''; }
    catch (x: any) { this.error = x?.error?.detail || i18nT('Not saved.'); }
    this.cd.markForCheck();
  }
  async delComment(it: any, c: any): Promise<void> {
    try { await this.cmd.del(`wall/comment/${c.id}/`); it.comments = it.comments.filter((x: any) => x.id !== c.id); } catch { /* kept */ }
    this.cd.markForCheck();
  }
}

/** v1.47.0 – an employee's own 1:1s (the ones the manager shared): agenda, notes and the action items to tick. */
@Component({
  selector: 'z-my-one-on-ones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ...I18N_UI],
  template: `
  <div class="zt">
    <header class="zt-h"><div><h2>{{ 'My 1:1s' | t }}</h2><p class="zr-muted">{{ 'The 1:1 meetings your manager shared with you.' | t }}</p></div></header>
    <p class="zr-muted" *ngIf="loaded && !rows.length">{{ 'No 1:1 has been shared with you yet.' | t }}</p>
    <article class="zt-item" *ngFor="let o of rows" style="display:block">
      <div class="zt-title"><b>{{ o.date | date:'EEEE d MMM yyyy' }}</b><span class="zt-type">{{ o.manager }}</span></div>
      <p *ngIf="o.agenda"><b>{{ 'Agenda' | t }}:</b> {{ o.agenda }}</p>
      <p *ngIf="o.notes" style="white-space:pre-line">{{ o.notes }}</p>
      <div *ngFor="let a of o.actions; let i = index"><label><input type="checkbox" [checked]="a.done" (change)="tick(o, i, $any($event.target).checked)"> {{ a.text }}</label></div>
    </article>
  </div>`,
})
export class ZMyOneOnOnesComponent implements OnInit {
  rows: any[] = []; loaded = false;
  constructor(private cmd: ZCommandService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    try { this.rows = await this.cmd.get('one-on-ones/', { mine: 1 }); } catch { this.rows = []; }
    this.loaded = true; this.cd.markForCheck();
  }
  async tick(o: any, i: number, done: boolean): Promise<void> {
    const actions = o.actions.map((a: any, j: number) => ({ ...a, done: j === i ? done : a.done }));
    try { const r = await this.cmd.patch(`one-on-ones/${o.id}/`, { actions }); o.actions = r.actions; } catch { /* kept */ }
    this.cd.markForCheck();
  }
}
