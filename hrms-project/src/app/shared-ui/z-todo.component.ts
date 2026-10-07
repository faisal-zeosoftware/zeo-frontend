import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { appForUrl } from './menu-config';

const ICON: Record<string, string> = { todo: 'task_alt', call: 'call', meeting: 'groups', email: 'mail', document: 'upload_file', approval: 'approval', follow_up: 'update' };

/** My To-do: activities planned on any record of any screen, by due date. */
@Component({
  selector: 'z-todo',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zt">
    <header class="zt-h">
      <div><h2>My To-do</h2><p class="zr-muted">Activities planned on records of every screen. Open one to go to its record.</p></div>
      <span class="zr-grow"></span>
      <div class="zt-tabs" role="tablist" aria-label="Which activities">
        <button type="button" role="tab" *ngFor="let t of tabs" [class.on]="scope === t.key" [attr.aria-selected]="scope === t.key" (click)="setScope(t.key)">{{ t.label }}</button>
      </div>
    </header>
    <div class="zt-stats" *ngIf="scope === 'mine'">
      <div class="zt-stat late"><b>{{ counts.overdue }}</b><span>Overdue</span></div>
      <div class="zt-stat today"><b>{{ counts.today }}</b><span>Due today</span></div>
      <div class="zt-stat"><b>{{ counts.planned }}</b><span>Planned</span></div>
    </div>
    <p class="zr-muted" *ngIf="!loading && !rows.length">{{ empty() }}</p>
    <section *ngFor="let g of groups" class="zt-group">
      <h3 [class]="'zt-gh ' + g.key">{{ g.label }} <span>{{ g.rows.length }}</span></h3>
      <article class="zt-item" *ngFor="let a of g.rows" [class.late]="a.when === 'overdue'">
        <span class="zt-ic"><mat-icon>{{ icon(a.activity_type) }}</mat-icon></span>
        <div class="zt-body">
          <div class="zt-title"><b>{{ a.summary }}</b><span class="zt-type">{{ a.type_label }}</span></div>
          <div class="zr-muted">{{ a.record_label || 'Record' }}{{ screen(a) ? ' · ' + screen(a) : '' }} · due {{ a.due_date | date:'EEE dd MMM yyyy' }}
            {{ scope === 'created' ? '· for ' + a.assigned_to_name : '· from ' + a.created_by }}{{ a.state === 'done' ? ' · done ' + (a.done_at | date:'dd MMM') : '' }}</div>
          <div class="zt-note" *ngIf="a.note">{{ a.note }}</div>
          <div class="zt-note" *ngIf="a.feedback"><b>Feedback:</b> {{ a.feedback }}</div>
          <div class="zr-row" *ngIf="doneFor === a.id">
            <input class="zr-in" [value]="feedback" (input)="feedback = $any($event.target).value" placeholder="Feedback (optional)" aria-label="Feedback">
            <button type="button" class="zr-btn primary" (click)="done(a)">Mark done</button></div>
        </div>
        <div class="zt-do">
          <button type="button" class="zr-btn sm" *ngIf="a.page" (click)="open(a)"><mat-icon>open_in_new</mat-icon>Open</button>
          <button type="button" class="zr-btn sm primary" *ngIf="a.state === 'open'" (click)="doneFor = doneFor === a.id ? null : a.id; feedback = ''"><mat-icon>check</mat-icon>Done</button>
        </div>
      </article>
    </section>
    <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
  </div>`,
})
export class ZTodoComponent implements OnInit {
  tabs = [{ key: 'mine', label: 'Assigned to me' }, { key: 'created', label: 'Planned by me' }, { key: 'done', label: 'Done' }];
  scope = 'mine';
  rows: any[] = [];
  groups: { key: string; label: string; rows: any[] }[] = [];
  counts = { overdue: 0, today: 0, planned: 0 };
  loading = true; error = ''; doneFor: number | null = null; feedback = '';

  constructor(private rec: ZRecordService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  setScope(s: string): void { this.scope = s; this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const r = this.scope === 'done' ? await firstValueFrom(this.rec.todo('mine', 'done')) : await firstValueFrom(this.rec.todo(this.scope, 'open'));
      this.rows = r.results || []; this.counts = r.counts || this.counts;
      this.rec.todoCounts$.next(this.counts);
      const by = (k: string) => this.rows.filter(a => a.when === k);
      this.groups = this.scope === 'done'
        ? [{ key: 'done', label: 'Done', rows: [...this.rows].sort((a, b) => (a.done_at < b.done_at ? 1 : -1)).slice(0, 200) }]
        : [{ key: 'overdue', label: 'Overdue', rows: by('overdue') }, { key: 'today', label: 'Today', rows: by('today') }, { key: 'planned', label: 'Planned', rows: by('planned') }].filter(g => g.rows.length);
    } catch (e: any) { this.error = e?.error?.detail || 'The To-do list could not be loaded.'; }
    this.loading = false; this.cd.detectChanges();
  }

  empty(): string { return this.scope === 'created' ? 'You have not planned activities for others.' : this.scope === 'done' ? 'Nothing done yet.' : 'Nothing to do. Activities planned for you on any record appear here.'; }
  icon(t: string): string { return ICON[t] || 'task_alt'; }
  screen(a: any): string { return a.page ? (appForUrl(a.page)?.label || '') : ''; }
  open(a: any): void { this.router.navigateByUrl(a.page); }
  async done(a: any): Promise<void> {
    try { await firstValueFrom(this.rec.patchActivity(a.id, { state: 'done', feedback: this.feedback })); this.doneFor = null; await this.load(); }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
  }
}
