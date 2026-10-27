/**
 * v1.51.0 – Self service → Ask HR: the HR helpdesk for the employee. Open a question in a category (payslip, leave,
 * documents …), follow HR's answers, reply, rate the solution or reopen it. Complaints keep their confidential form and
 * letters their own request – the category sends the employee there.  API: /zeo-hr/api/my-tickets/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EssApiService } from './ess-api.service';

@Component({
  selector: 'app-ess-hr-help',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  styles: [`.hh-grid { display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); gap: 16px; align-items: start; }
    @media (max-width: 860px) { .hh-grid { grid-template-columns: 1fr; } }
    .hh-cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin: 8px 0 14px; }
    .hh-cats button { text-align: left; border: 1px solid #dfe3e8; background: #fff; border-radius: 10px; padding: 10px 12px; cursor: pointer; }
    .hh-cats button.on { border-color: #5b4fe0; box-shadow: 0 0 0 2px #e4e1fb; } .hh-cats small { display: block; color: #5d6670; font-size: 11.5px; margin-top: 2px; }
    .hh-msg { border-radius: 10px; padding: 8px 12px; margin: 6px 0; font-size: 13.5px; white-space: pre-wrap; max-width: 92%; }
    .hh-msg.hr { background: #f1f0fd; } .hh-msg.me { background: #eef7f1; margin-left: auto; } .hh-msg small { display: block; color: #5d6670; font-size: 11px; margin-bottom: 2px; }
    .hh-stars button { border: 0; background: none; font-size: 24px; cursor: pointer; color: #c9ccd8; padding: 0 2px; } .hh-stars button.on { color: #e0a100; }
    .hh-due { font-size: 12px; color: #5d6670; }`],
  template: `
<div class="container"><div class="comapny_section"><div class="header_section">
  <div class="es-head"><div><h1 class="page-title">Ask HR</h1>
    <p class="es-desc">Questions about your payslip, leave, documents, insurance or a policy. HR answers within the time shown; you can reply, and rate the answer when it is solved.</p></div>
    <button type="button" class="es-btn primary" (click)="openNew()" data-new-ticket>New question</button></div>
</div>
<div class="com_list mt-4">
  <p class="es-msg err" *ngIf="err">{{ err }}</p><p class="es-msg ok" *ngIf="ok">{{ ok }}</p>
  <div class="es-panel" *ngIf="f" style="margin-bottom:16px">
    <div class="es-h">What is it about?</div>
    <div class="hh-cats"><button type="button" *ngFor="let c of cats" [class.on]="f.category === c.id" (click)="pick(c)" [attr.data-cat]="c.name">
      <b>{{ c.name }}</b><small>{{ c.redirect === 'complaint' ? 'Confidential – opens the complaint form' : c.redirect === 'letter' ? 'Opens the letter request' : (c.description || '') }}</small>
      <small *ngIf="!c.redirect">Answer within {{ c.response_hours }} h</small></button></div>
    <div class="es-form" *ngIf="f.category">
      <div class="wide"><label>Subject</label><input [(ngModel)]="f.subject" maxlength="150" data-subject></div>
      <div class="wide"><label>Your question</label><textarea [(ngModel)]="f.description" rows="4" data-question></textarea></div>
    </div>
    <div class="foot" style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
      <button type="button" class="es-btn" (click)="f = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="busy || !f.category" (click)="send()" data-send>Send to HR</button></div>
  </div>
  <div class="hh-grid">
    <div class="es-rows">
      <div class="es-row click" *ngFor="let t of tickets" [class.on]="sel?.id === t.id" (click)="sel = t" [attr.data-ticket]="t.number">
        <div class="main"><div class="t">{{ t.subject }}</div><div class="s">{{ t.number }} · {{ t.category }} · {{ t.created_at | date:'d MMM' }}</div></div>
        <div class="r"><span class="es-tag" [ngClass]="t.status">{{ t.status_label }}</span></div></div>
      <p class="es-muted" *ngIf="loaded && !tickets.length">No question yet.</p>
    </div>
    <div class="es-panel" *ngIf="sel">
      <div class="es-h">{{ sel.subject }} <span class="es-tag" [ngClass]="sel.status">{{ sel.status_label }}</span></div>
      <div class="hh-due">{{ sel.number }} · {{ sel.category }}{{ sel.assigned_to ? ' · with ' + sel.assigned_to : '' }}{{ sel.status !== 'resolved' && sel.status !== 'closed' ? ' · solution due ' + (sel.resolve_due | date:'d MMM, HH:mm') : '' }}</div>
      <div class="hh-msg me"><small>You · {{ sel.created_at | date:'d MMM, HH:mm' }}</small>{{ sel.description }}</div>
      <div class="hh-msg" *ngFor="let m of sel.messages" [class.me]="m.from_employee" [class.hr]="!m.from_employee">
        <small>{{ m.from_employee ? 'You' : (m.by || 'HR') }}{{ m.kind === 'resolved' ? ' – solution' : '' }} · {{ m.at | date:'d MMM, HH:mm' }}</small>{{ m.text }}</div>
      <ng-container *ngIf="sel.can_reply">
        <textarea [(ngModel)]="reply" rows="3" style="width:100%;margin-top:8px" placeholder="Write to HR" aria-label="Reply" data-reply></textarea>
        <div style="text-align:right"><button type="button" class="es-btn primary" (click)="act('reply')" [disabled]="busy || !reply.trim()">Send</button></div></ng-container>
      <div *ngIf="sel.can_rate" style="margin-top:10px" data-rate>
        <b>Was your question solved?</b>
        <div class="hh-stars"><button type="button" *ngFor="let n of [1,2,3,4,5]" [class.on]="n <= stars" (click)="stars = n" [attr.aria-label]="n + ' stars'">★</button></div>
        <input [(ngModel)]="comment" placeholder="A comment (optional)" style="width:100%" aria-label="Comment">
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
          <button type="button" class="es-btn" *ngIf="sel.can_reopen" (click)="act('reopen')">Not solved – reopen</button>
          <button type="button" class="es-btn primary" [disabled]="!stars" (click)="act('rate')">Rate and close</button></div></div>
      <div *ngIf="sel.rating" class="hh-due" style="margin-top:8px">You rated {{ sel.rating }} / 5.</div>
    </div>
  </div>
</div></div></div>`,
})
export class EssHrHelpComponent implements OnInit {
  tickets: any[] = []; cats: any[] = []; sel: any = null; f: any = null; reply = ''; stars = 0; comment = '';
  loaded = false; busy = false; err = ''; ok = '';
  constructor(private api: EssApiService, private router: Router, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(keep?: number): Promise<void> {
    try {
      const r: any = await this.api.get('/zeo-hr/api/my-tickets/'); this.tickets = r.tickets; this.cats = r.categories;
      this.sel = this.tickets.find(t => t.id === (keep || this.sel?.id)) || this.tickets[0] || null;
    } catch (e: any) { this.err = EssApiService.error(e, 'The HR helpdesk could not be loaded.'); }
    this.loaded = true; this.cd.detectChanges();
  }
  openNew(): void { this.f = { category: null, subject: '', description: '' }; this.ok = ''; this.err = ''; }
  pick(c: any): void {
    if (c.redirect === 'complaint') { this.router.navigate(['/main-sidebar/self-service/complaints']); return; }
    if (c.redirect === 'letter') { this.router.navigate(['/main-sidebar/self-service/letters']); return; }
    this.f.category = c.id; if (!this.f.subject) { this.f.subject = c.name; }
  }
  async send(): Promise<void> {
    this.busy = true; this.err = '';
    try { const t: any = await this.api.post('/zeo-hr/api/my-tickets/', this.f); this.ok = `Sent to HR as ${t.number}.`; this.f = null; await this.load(t.id); }
    catch (e: any) { this.err = EssApiService.error(e, 'Could not send.'); }
    this.busy = false; this.cd.detectChanges();
  }
  async act(action: string): Promise<void> {
    const body: any = { id: this.sel.id, action };
    if (action === 'reply') { body.text = this.reply; }
    if (action === 'rate') { body.rating = this.stars; body.comment = this.comment; }
    if (action === 'reopen') { body.text = this.comment || 'Not solved.'; }
    this.busy = true; this.err = '';
    try { await this.api.post('/zeo-hr/api/my-tickets/', body); this.reply = ''; this.stars = 0; this.comment = ''; await this.load(this.sel.id); }
    catch (e: any) { this.err = EssApiService.error(e, 'Could not send.'); }
    this.busy = false; this.cd.detectChanges();
  }
}
