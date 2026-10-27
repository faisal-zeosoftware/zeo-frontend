// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';

const ICON: Record<string, string> = { message: 'mail_outline', mention: 'alternate_email', email: 'reply', assigned: 'assignment_ind',
  transfer: 'swap_horiz', activity: 'task_alt', approval: 'approval', reply: 'forum', reminder: 'alarm' };

/** v1.45.0 Inbox (Odoo Discuss): everything addressed to me across the apps – messages on records I follow, @mentions,
 *  e-mail replies, my activities, approvals waiting for me and transfer requests – with filters and mark read / done. */
@Component({
  selector: 'z-inbox',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zt zi">
    <header class="zt-h">
      <div><h2>Inbox</h2><p class="zr-muted">Messages on the records you follow, &#64;mentions, e-mail replies, your activities and the approvals waiting for you – from every app.</p></div>
      <span class="zr-grow"></span>
      <button type="button" class="zr-btn" (click)="markAll()" [disabled]="!counts.unread"><mat-icon>done_all</mat-icon>Mark all read</button>
    </header>
    <div class="zi-filters">
      <div class="zt-tabs" role="tablist" aria-label="What">
        <button type="button" role="tab" *ngFor="let t of tabs" [class.on]="kind === t.key" [attr.aria-selected]="kind === t.key" (click)="kind = t.key; load()">
          {{ t.label }}<span class="zi-n" *ngIf="n(t.key)">{{ n(t.key) }}</span></button>
      </div>
      <select class="zr-in zi-app" [value]="app" (change)="app = $any($event.target).value; load()" aria-label="App">
        <option value="">All apps</option><option *ngFor="let a of apps" [value]="a">{{ a }}</option></select>
      <label class="zi-chk"><input type="checkbox" [checked]="unread" (change)="unread = $any($event.target).checked; load()"> Unread only</label>
      <label class="zi-chk"><input type="checkbox" [checked]="showDone" (change)="showDone = $any($event.target).checked; load()"> Show done</label>
    </div>
    <p class="zr-muted" *ngIf="!loading && !rows.length">Nothing here. Messages, mentions and approvals for you appear in this list.</p>
    <article class="zt-item zi-item" *ngFor="let r of rows" [class.unread]="r.unread" [class.late]="r.when === 'overdue'" [class.done]="r.done">
      <span class="zt-ic"><mat-icon>{{ icon(r) }}</mat-icon></span>
      <div class="zt-body" (click)="open(r)" role="link" tabindex="0" (keydown.enter)="open(r)">
        <div class="zt-title"><b>{{ r.title }}</b><span class="zt-type">{{ r.kind_label }}</span><span class="zt-type zi-appt">{{ r.app }}</span></div>
        <div class="zr-muted">{{ r.from ? 'From ' + r.from + ' · ' : '' }}{{ r.record || '' }} · {{ r.source === 'activity' ? 'due ' + (r.due | date:'EEE dd MMM') : (r.at | date:'dd/MM/yyyy HH:mm') }}</div>
        <div class="zt-note" *ngIf="r.body">{{ r.body }}</div>
      </div>
      <div class="zt-do">
        <button type="button" class="zr-btn sm" *ngIf="r.page" (click)="open(r)"><mat-icon>open_in_new</mat-icon>Open</button>
        <button type="button" class="zr-btn sm" *ngIf="r.source === 'inbox'" (click)="mark(r, r.unread ? 'read' : 'unread')" [title]="r.unread ? 'Mark read' : 'Mark unread'">
          <mat-icon>{{ r.unread ? 'drafts' : 'mark_email_unread' }}</mat-icon></button>
        <button type="button" class="zr-btn sm primary" *ngIf="(r.source === 'inbox' && !r.done) || r.source === 'activity'" (click)="done(r)"><mat-icon>check</mat-icon>Done</button>
      </div>
    </article>
    <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
  </div>`,
})
export class ZInboxComponent implements OnInit {
  tabs = [{ key: '', label: 'All' }, { key: 'message', label: 'Messages' }, { key: 'mention', label: 'Mentions' }, { key: 'reply', label: 'Replies' }, { key: 'reminder', label: 'Reminders' }, { key: 'email', label: 'E-mail replies' },
    { key: 'activity', label: 'Activities' }, { key: 'approval', label: 'Approvals' }, { key: 'transfer', label: 'Requests' }];
  kind = ''; app = ''; unread = false; showDone = false;
  rows: any[] = []; apps: string[] = []; counts: any = {}; loading = false; error = '';
  constructor(private rec: ZRecordService, private router: Router, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  n(k: string): number { return k ? (this.counts[k] || 0) : (this.counts.unread || 0); }
  icon(r: any): string { return ICON[r.kind] || 'notifications'; }
  async load(): Promise<void> {
    this.loading = true; this.error = '';
    try {
      const r = await firstValueFrom(this.rec.inbox({ kind: this.kind, app: this.app, unread: this.unread ? '1' : '', done: this.showDone ? '1' : '' }));
      this.rows = r.rows; this.apps = r.apps; this.counts = r.counts;
      this.rec.inboxUnread$.next(r.unread_messages || 0);
    } catch (e: any) { this.error = e?.error?.detail || 'The inbox could not be loaded.'; }
    this.loading = false; this.cd.detectChanges();
  }
  async mark(r: any, action: string): Promise<void> {
    try { const x = await firstValueFrom(this.rec.inboxMark([r.id], action)); this.rec.inboxUnread$.next(x.unread_messages); } catch { /* kept */ }
    await this.load();
  }
  async markAll(): Promise<void> {
    try { const x = await firstValueFrom(this.rec.inboxMark('all', 'read')); this.rec.inboxUnread$.next(x.unread_messages); } catch { /* kept */ }
    await this.load();
  }
  async done(r: any): Promise<void> {
    try {
      if (r.source === 'activity') { await firstValueFrom(this.rec.patchActivity(r.id, { state: 'done' })); this.rec.refreshTodo(); }
      else { const x = await firstValueFrom(this.rec.inboxMark([r.id], 'done')); this.rec.inboxUnread$.next(x.unread_messages); }
    } catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
    await this.load();
  }
  async open(r: any): Promise<void> {
    if (r.source === 'inbox' && r.unread) { try { await firstValueFrom(this.rec.inboxMark([r.id], 'read')); } catch { /* kept */ } }
    if (r.page) { this.router.navigateByUrl(r.page); }
  }
}
