import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EssApiService } from './ess-api.service';

const NEXT_LABEL: Record<string, string> = {
  acknowledged: 'Acknowledge', investigating: 'Start investigation', resolved: 'Mark resolved', closed: 'Close case',
};

/**
 * v1.13.0 – complaints / grievances.
 *  employee (route data handler=false): raise a complaint (optionally anonymous), follow it, reply, give feedback;
 *  grievance officer (handler=true): cases of their branches, status flow with SLA, messages, internal notes, assignment.
 */
@Component({
  selector: 'app-ess-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">{{ handler ? 'Complaints to handle' : 'My complaints' }}</h1>
          <p class="es-desc" *ngIf="!handler">Complaints are confidential: only the grievance officers see them – never your manager unless HR assigns them. You can also complain anonymously.</p>
          <p class="es-desc" *ngIf="handler">Cases of your branches. Acknowledge quickly, investigate, then resolve with an outcome. Overdue cases are escalated.</p>
        </div>
        <div class="es-actions">
          <button type="button" class="es-btn primary" *ngIf="!handler" (click)="openNew()">Raise a complaint</button>
          <button type="button" class="es-btn" *ngIf="handler" (click)="escalate()">Run escalation check</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <div class="es-panel" *ngIf="token" style="margin-bottom:14px">
        <div class="es-h">Your anonymous complaint token</div>
        <p class="es-muted">Copy it now and keep it safe. It is the only way to follow your anonymous complaint – it is not shown again and HR cannot see who you are.</p>
        <div class="es-token">{{ token }}</div>
        <div class="es-actions" style="margin-top:8px"><button type="button" class="es-btn sm" (click)="copy(token)">Copy token</button><button type="button" class="es-btn sm" (click)="token = ''">I have saved it</button></div>
      </div>

      <div class="es-tabs" *ngIf="handler">
        <button type="button" class="es-tab" *ngFor="let t of handlerTabs" [class.on]="tab === t.key" (click)="tab = t.key; load()">{{ t.label }}</button>
      </div>
      <div class="es-cols">
        <div>
          <div class="es-rows">
            <div class="es-row click" *ngFor="let c of rows" [class.on]="sel?.id === c.id" (click)="open(c)">
              <div class="main">
                <div class="t">{{ c.number }} · {{ c.subject }}</div>
                <div class="s">{{ c.category_label }}<span *ngIf="handler"> · {{ c.employee }}</span> · {{ c.created_at | date:'dd MMM yyyy' }} · due {{ c.due_date | date:'dd MMM' }}</div>
              </div>
              <div class="r">
                <span class="es-tag overdue" *ngIf="c.overdue">overdue</span>
                <span class="es-tag" *ngIf="c.escalated">escalated</span>
                <span class="es-tag" [ngClass]="c.status">{{ c.status }}</span>
              </div>
            </div>
            <p class="es-muted" *ngIf="!loading && !rows.length">{{ handler ? 'No cases here.' : 'You have no named complaints.' }}</p>
          </div>
          <div class="es-panel" style="margin-top:16px" *ngIf="!handler">
            <div class="es-h">Follow an anonymous complaint</div>
            <div class="es-form"><div class="wide"><label>Token</label><input [(ngModel)]="trackToken" placeholder="Paste the token you saved"></div></div>
            <div class="es-actions" style="margin-top:8px"><button type="button" class="es-btn" (click)="track()">Open</button></div>
          </div>
        </div>

        <div class="es-panel" *ngIf="sel">
          <div class="es-h">{{ sel.number }} · {{ sel.subject }} <span class="es-tag" [ngClass]="sel.status">{{ sel.status }}</span></div>
          <p class="es-muted" style="margin:0">{{ sel.category_label }}<span *ngIf="handler"> · {{ sel.employee }}</span><span *ngIf="sel.anonymous && !(handler && sel.employee === 'Anonymous')"> · anonymous</span><span *ngIf="sel.confidential"> · confidential</span>
            · due {{ sel.due_date | date:'dd MMM yyyy' }}<span *ngIf="sel.overdue" style="color:#b42318"> (overdue)</span></p>
          <p style="font-size:13px;white-space:pre-line;margin-top:8px">{{ sel.description }}</p>
          <p class="es-muted" *ngIf="sel.against">Concerns: {{ sel.against }}</p>
          <p class="es-msg" *ngIf="sel.outcome"><b>Outcome:</b> {{ sel.outcome }}</p>

          <div class="es-thread">
            <div *ngFor="let m of sel.messages" class="es-bubble" [class.me]="m.from_employee !== handler && !m.event" [class.internal]="m.internal" [class.event]="!!m.event">
              <div class="who" *ngIf="!m.event">{{ m.author }}<span *ngIf="m.internal"> · internal note</span> · {{ m.created_at | date:'dd MMM, HH:mm' }}</div>
              {{ m.text }}
              <div *ngIf="m.attachment"><button type="button" class="es-link" (click)="file(m)">{{ m.attachment }}</button></div>
            </div>
          </div>

          <ng-container *ngIf="sel.status !== 'closed'">
            <textarea class="es-input" rows="2" [(ngModel)]="reply" placeholder="Write a message"></textarea>
            <div class="es-actions" style="margin-top:6px;align-items:center">
              <input type="file" (change)="replyFile = $any($event.target).files?.[0] || null">
              <label *ngIf="handler" style="font-size:12px;display:flex;gap:4px;align-items:center"><input type="checkbox" [(ngModel)]="internal"> Internal note (not shown to the employee)</label>
              <button type="button" class="es-btn sm primary" [disabled]="busy" (click)="send()">Send</button>
            </div>
          </ng-container>

          <div *ngIf="handler && sel.next_steps.length" style="margin-top:14px">
            <div class="es-label">Next step</div>
            <textarea class="es-input" rows="2" [(ngModel)]="outcome" *ngIf="needsOutcome()" placeholder="Outcome (required to resolve or close)"></textarea>
            <div class="es-actions" style="margin-top:6px">
              <button type="button" class="es-btn sm" *ngFor="let s of sel.next_steps" [disabled]="busy" (click)="status(s)">{{ nextLabel(s) }}</button>
            </div>
          </div>
          <div *ngIf="handler" style="margin-top:14px">
            <div class="es-label">Assigned officers</div>
            <p class="es-muted" style="margin:0 0 6px">{{ assignedNames() || 'Not assigned – every grievance officer of the branch sees it.' }}</p>
            <div class="es-actions">
              <select class="es-input" style="max-width:260px" [(ngModel)]="assignTo">
                <option [ngValue]="null">Add an officer…</option>
                <option *ngFor="let h of handlers" [ngValue]="h.id">{{ h.name }}</option>
              </select>
              <button type="button" class="es-btn sm" (click)="assign()">Assign</button>
            </div>
          </div>
          <div *ngIf="!handler && (sel.status === 'resolved' || sel.status === 'closed')" style="margin-top:14px">
            <div class="es-label">How was your complaint handled?</div>
            <div class="es-stars"><button type="button" *ngFor="let n of [1,2,3,4,5]" [class.on]="(rating || sel.feedback_rating || 0) >= n" (click)="rating = n">★</button></div>
            <textarea class="es-input" rows="2" [(ngModel)]="feedbackText" placeholder="Optional comment"></textarea>
            <button type="button" class="es-btn sm" style="margin-top:6px" (click)="feedback()">Send feedback</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="es-backdrop" *ngIf="f" (click)="f = null">
  <div class="es-modal" (click)="$event.stopPropagation()">
    <h3>Raise a complaint</h3>
    <p class="es-muted">Describe what happened. Grievance officers will acknowledge it within a few working days.</p>
    <p class="es-msg err" *ngIf="ferr">{{ ferr }}</p>
    <div class="es-form">
      <div><label>Category</label><select [(ngModel)]="f.category"><option *ngFor="let c of cats" [ngValue]="c.value">{{ c.label }}</option></select></div>
      <div><label>Date it happened (optional)</label><input type="date" [(ngModel)]="f.incident_date"></div>
      <div class="wide"><label>Subject</label><input [(ngModel)]="f.subject" maxlength="200"></div>
      <div class="wide"><label>What happened</label><textarea [(ngModel)]="f.description" rows="5"></textarea></div>
      <div class="wide"><label>Person or area concerned (optional)</label><input [(ngModel)]="f.against"></div>
      <div class="wide"><label>Attachments (optional)</label><input type="file" multiple (change)="files = $any($event.target).files"></div>
      <div class="wide"><label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" [(ngModel)]="f.anonymous"> Submit anonymously – HR will not see who I am (you get a token to follow the case)</label></div>
    </div>
    <div class="foot">
      <button type="button" class="es-btn" (click)="f = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="busy" (click)="submit()">Submit complaint</button>
    </div>
  </div>
</div>`,
})
export class EssComplaintsComponent implements OnInit {
  handler = false; rows: any[] = []; sel: any = null; cats: any[] = []; handlers: any[] = [];
  loading = false; busy = false; msg = ''; ok = ''; ferr = '';
  f: any = null; files: FileList | null = null; token = ''; trackToken = ''; tracking = '';
  reply = ''; replyFile: File | null = null; internal = false; outcome = ''; assignTo: number | null = null;
  rating = 0; feedbackText = ''; tab = 'open';
  handlerTabs = [{ key: 'open', label: 'Open' }, { key: 'resolved', label: 'Resolved' }, { key: 'closed', label: 'Closed' }, { key: '', label: 'All' }];

  constructor(private api: EssApiService, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.handler = !!this.route.snapshot.data['handler'];
    try { this.cats = (await this.api.meta()).complaint_categories || []; } catch { this.cats = []; }
    if (this.handler) {
      try { this.handlers = (await this.api.get('complaints/settings/')).handlers || []; } catch { this.handlers = []; }
    }
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      if (this.handler) {
        const all: any[] = await this.api.get('complaints/', this.tab && this.tab !== 'open' ? { status: this.tab } : {});
        this.rows = this.tab === 'open' ? all.filter(c => !['resolved', 'closed'].includes(c.status)) : all;
      } else {
        this.rows = await this.api.get('complaints/mine/');
      }
      if (this.sel && !this.tracking) this.sel = this.rows.find(r => r.id === this.sel.id) || this.sel;
      this.msg = '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'Could not load the complaints.'); }
    this.loading = false; this.cd.detectChanges();
  }

  nextLabel(s: string): string { return NEXT_LABEL[s] || s; }
  needsOutcome(): boolean { return (this.sel?.next_steps || []).some((s: string) => s === 'resolved' || s === 'closed'); }
  assignedNames(): string { return (this.sel?.assigned || []).map((a: any) => a.name).join(', '); }
  copy(t: string): void { navigator.clipboard?.writeText(t); this.ok = 'Token copied.'; }

  openNew(): void { this.ferr = ''; this.files = null; this.f = { category: this.cats[0]?.value || 'other', subject: '', description: '', against: '', incident_date: '', anonymous: false }; }

  async submit(): Promise<void> {
    this.busy = true; this.ferr = '';
    const fd = new FormData();
    Object.entries(this.f).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v)); });
    Array.from(this.files || []).forEach(file => fd.append('files', file, file.name));
    try {
      const r: any = await this.api.post('complaints/mine/', fd);
      this.f = null;
      if (r.token) { this.token = r.token; this.ok = `Anonymous complaint ${r.number} submitted.`; this.tracking = r.token; this.sel = r; }
      else { this.ok = `Complaint ${r.number} submitted. You will be notified about every step.`; this.sel = r; }
      await this.load();
    } catch (e: any) { this.ferr = EssApiService.error(e, 'The complaint could not be submitted.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async open(c: any): Promise<void> {
    this.tracking = '';
    try { this.sel = await this.api.get(`complaints/${c.id}/`); this.outcome = this.sel.outcome || ''; this.rating = 0; }
    catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }

  async track(): Promise<void> {
    if (!this.trackToken.trim()) { this.msg = 'Paste the token you got when you submitted the complaint.'; return; }
    try { this.sel = await this.api.post('complaints/track/', { token: this.trackToken.trim() }); this.tracking = this.trackToken.trim(); this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'No complaint matches this token.'); }
    this.cd.detectChanges();
  }

  async send(): Promise<void> {
    if (!this.reply.trim() && !this.replyFile) return;
    this.busy = true;
    const fd = new FormData();
    fd.append('text', this.reply);
    if (this.replyFile) fd.append('attachment', this.replyFile, this.replyFile.name);
    try {
      if (this.tracking) { fd.append('token', this.tracking); this.sel = await this.api.post('complaints/track/', fd); }
      else { if (this.internal) fd.append('internal', 'true'); this.sel = await this.api.post(`complaints/${this.sel.id}/messages/`, fd); }
      this.reply = ''; this.replyFile = null; this.internal = false; this.msg = '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'The message could not be sent.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async status(s: string): Promise<void> {
    this.busy = true;
    try { this.sel = await this.api.post(`complaints/${this.sel.id}/status/`, { status: s, outcome: this.outcome }); this.ok = `Case is now ${s}.`; this.msg = ''; await this.load(); }
    catch (e: any) { this.msg = EssApiService.error(e); }
    this.busy = false; this.cd.detectChanges();
  }

  async assign(): Promise<void> {
    if (!this.assignTo) return;
    const ids = Array.from(new Set([...(this.sel.assigned || []).map((a: any) => a.id), this.assignTo]));
    try { this.sel = await this.api.post(`complaints/${this.sel.id}/assign/`, { user_ids: ids }); this.assignTo = null; this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }

  async feedback(): Promise<void> {
    if (!this.rating) { this.msg = 'Choose 1 to 5 stars.'; return; }
    try {
      this.sel = this.tracking
        ? await this.api.post('complaints/track/', { token: this.tracking, feedback_rating: this.rating, feedback_text: this.feedbackText })
        : await this.api.post(`complaints/${this.sel.id}/feedback/`, { feedback_rating: this.rating, feedback_text: this.feedbackText });
      this.ok = 'Thank you for your feedback.'; this.msg = '';
    } catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }

  async escalate(): Promise<void> {
    try { const r: any = await this.api.post('complaints/escalate/', {}); this.ok = `${r.escalated} case(s) escalated.`; await this.load(); }
    catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }

  async file(m: any): Promise<void> {
    if (this.tracking) { this.msg = 'Attachments of anonymous cases can be opened by the grievance officers.'; return; }
    try { await this.api.download(`complaints/${this.sel.id}/messages/${m.id}/file/`, m.attachment, true); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The file could not be opened.'); this.cd.detectChanges(); }
  }
}
