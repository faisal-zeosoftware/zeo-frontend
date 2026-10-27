import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ZaApiService, ZaClient, base, day, when } from './za-api.service';
import { TPipe } from '../shared-ui/i18n.service';   // v1.58.0

/** v1.48.0 ZEO HR operations – the screens that are not plain registers: the document expiry hub, the employee's exit
 *  interview, and the employee's notices and decisions (show-cause reply, appeal). Signing a handover uses zp-sign. */
const APP = 'zeo-hr';

const BUCKETS = [{ key: 'expired', label: 'Expired' }, { key: 'd30', label: 'In 30 days' }, { key: 'd60', label: '31–60 days' }, { key: 'd90', label: '61–90 days' }];

// ---------------------------------------------------------------- document expiry hub
@Component({
  selector: 'zh-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title">Document expiry hub</h1>
    <p class="ex-desc">Every passport, visa, ID, labour card, contract and insurance of the employees you may see that has expired or expires in the next {{ days }} days – with its renewal.</p></div>
    <div class="ex-actions">
      <select [(ngModel)]="days" (ngModelChange)="load()" aria-label="Look ahead"><option [ngValue]="30">30 days</option><option [ngValue]="60">60 days</option><option [ngValue]="90">90 days</option><option [ngValue]="180">180 days</option></select>
      <button type="button" class="ex-btn primary" *ngIf="d?.can_renew" [disabled]="!picked().length || busy" (click)="renew()">Start renewal ({{ picked().length }})</button>
    </div></div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
    <div class="zh-buckets" *ngIf="d" role="group" aria-label="Expiry">
      <button type="button" *ngFor="let b of buckets" [class.on]="bucket === b.key" [attr.data-bucket]="b.key" [ngClass]="'zh-b ' + b.key" (click)="bucket = bucket === b.key ? '' : b.key">
        <b>{{ d.counts[b.key] }}</b><span>{{ b.label }}</span></button>
      <button type="button" class="zh-b ren" [class.on]="bucket === 'ren'" (click)="bucket = bucket === 'ren' ? '' : 'ren'"><b>{{ d.counts.in_renewal }}</b><span>In renewal</span></button>
      <button type="button" class="zh-b none" [class.on]="bucket === 'none'" (click)="bucket = bucket === 'none' ? '' : 'none'"><b>{{ d.counts.no_renewal }}</b><span>No renewal yet (60 days)</span></button>
    </div>
    <div class="zh-filters" *ngIf="d">
      <input type="search" [(ngModel)]="q" placeholder="Employee, code, document, number…" aria-label="Search">
      <select [(ngModel)]="type" aria-label="Document"><option value="">All documents</option><option *ngFor="let t of d.types" [value]="t">{{ t }}</option></select>
      <label class="ck" *ngIf="d.can_renew"><input type="checkbox" [checked]="allPicked()" (change)="pickAll($any($event.target).checked)"> Select all shown</label>
    </div>
    <div class="hs-scroll" *ngIf="d"><table class="hs-table zh-t" zPlain>
      <tr><th *ngIf="d.can_renew"></th><th>Employee</th><th>Document</th><th>Number</th><th>Expiry</th><th class="r">Days</th><th>Renewal</th></tr>
      <tr *ngFor="let r of shown()" [class.bad]="r.days < 0" [attr.data-emp]="r.employee_id" [attr.data-type]="r.type">
        <td *ngIf="d.can_renew"><input type="checkbox" *ngIf="!r.renewal" [(ngModel)]="sel[key(r)]" [attr.aria-label]="'Select ' + r.employee + ' ' + r.type"></td>
        <td><a class="za-a" (click)="emp(r)">{{ r.employee }}</a><small class="hs-muted"> {{ r.code }} · {{ r.department }}</small></td>
        <td>{{ r.type }}</td><td>{{ r.number }}</td><td>{{ dd(r.expiry) }}</td>
        <td class="r"><span class="hs-b" [ngClass]="r.days < 0 ? 'bad' : r.days <= 30 ? 'wait' : ''">{{ r.days < 0 ? (-r.days) + ' days ago' : r.days + ' days' }}</span></td>
        <td><a *ngIf="r.renewal" class="za-a" (click)="open(r.renewal.id)">{{ r.renewal.number }} · {{ r.renewal.status_label }}{{ r.renewal.pro ? ' · ' + r.renewal.pro : '' }}</a>
          <span *ngIf="r.renewal?.assigned_to" class="hs-muted"> – {{ r.renewal.assigned_to }}</span>
          <button type="button" class="ex-btn sm" *ngIf="!r.renewal && d.can_renew" (click)="renew([r])">Renew</button></td>
      </tr></table></div>
    <p class="hs-empty" *ngIf="d && !shown().length">Nothing here – no document of this group expires in the period.</p>
  </div>
</div></div>`,
  styles: [`.zh-buckets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .zh-b { display: flex; flex-direction: column; align-items: flex-start; min-width: 120px; padding: 10px 14px; border: 1px solid #e3e5ee; border-radius: 12px; background: #fff; cursor: pointer; font: inherit; }
    .zh-b b { font-size: 22px; font-weight: 600; color: #1b1640; } .zh-b span { font-size: 12.5px; color: #6b7185; }
    .zh-b.expired b { color: #a32626; } .zh-b.d30 b { color: #7a5200; } .zh-b.on { border-color: #5b4fe0; box-shadow: inset 0 0 0 1px #5b4fe0; }
    .zh-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
    .zh-filters input[type=search] { min-width: 260px; } .zh-t tr.bad td { background: #fff7f7; } .za-a { cursor: pointer; color: #3e3a99; }`],
})
export class ZhHubComponent implements OnInit {
  api!: ZaClient; d: any = null; err = ''; ok = ''; busy = false; days = 90; bucket = ''; q = ''; type = '';
  sel: Record<string, boolean> = {}; buckets = BUCKETS; dd = day;
  constructor(private za: ZaApiService, private router: Router, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> { this.api = this.za.for(APP); await this.load(); }
  async load(): Promise<void> {
    try { this.d = await this.api.get('hub/', { days: this.days }); this.err = ''; } catch (e) { this.err = ZaApiService.error(e); }
    this.cd.markForCheck();
  }
  key(r: any): string { return `${r.employee_id}|${r.type}`; }
  shown(): any[] {
    const q = this.q.trim().toLowerCase();
    return (this.d?.rows || []).filter((r: any) =>
      (!this.bucket || (this.bucket === 'ren' ? !!r.renewal : this.bucket === 'none' ? !r.renewal && r.days <= 60 : r.bucket === this.bucket))
      && (!this.type || r.type === this.type)
      && (!q || `${r.employee} ${r.code} ${r.type} ${r.number} ${r.department}`.toLowerCase().includes(q)));
  }
  picked(): any[] { return (this.d?.rows || []).filter((r: any) => !r.renewal && this.sel[this.key(r)]); }
  allPicked(): boolean { const s = this.shown().filter(r => !r.renewal); return !!s.length && s.every(r => this.sel[this.key(r)]); }
  pickAll(on: boolean): void { this.shown().filter(r => !r.renewal).forEach(r => this.sel[this.key(r)] = on); }
  async renew(rows?: any[]): Promise<void> {
    const list = rows || this.picked();
    if (!list.length) { return; }
    this.busy = true; this.err = ''; this.ok = '';
    try {
      const r = await this.api.post('hub/', { rows: list.map(x => ({ employee_id: x.employee_id, type: x.type, number: x.number, expiry: x.expiry, source: x.source, _id: x._id })) });
      this.ok = `${r.created} renewal(s) started – the PRO and the employees were told.`; this.sel = {};
      await this.load();
    } catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false; this.cd.markForCheck();
  }
  open(id: number): void { this.router.navigate([base(APP), 'r', 'renewal', id]); }
  emp(r: any): void { this.router.navigate(['/main-sidebar/sub-sidebar/employee-details', r.employee_id, 'details']); }
}

// ---------------------------------------------------------------- the employee answers the exit interview
@Component({
  selector: 'zh-exit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title">Exit interview</h1>
    <p class="ex-desc" *ngIf="d">{{ d.employee }} · {{ d.number }}{{ d.last_working_date ? ' · last working day ' + dd(d.last_working_date) : '' }}</p></div></div></div>
  <div class="com_list mt-4" *ngIf="d">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <p class="hs-note ok" *ngIf="done">Thank you. Your answers were sent to HR – they are read by HR only. We wish you all the best.</p>
    <p class="hs-note info" *ngIf="!d.can_answer && !done">This exit interview is {{ d.status_label | lowercase }}.</p>
    <form class="zh-q" *ngIf="d.can_answer && !done" (ngSubmit)="send()">
      <p class="hs-muted">Before you leave, please tell us honestly about your time with us. It takes about five minutes.</p>
      <fieldset *ngFor="let q of d.questions; let i = index" [attr.data-q]="i">
        <legend>{{ i + 1 }}. {{ q.text }}<span *ngIf="q.required"> *</span></legend>
        <div *ngIf="q.type === 'rating'" class="zh-scale" role="radiogroup">
          <label *ngFor="let n of [1,2,3,4,5]" [class.on]="a[i] === n"><input type="radio" [name]="'q' + i" [value]="n" [(ngModel)]="a[i]">{{ n }}</label>
          <small class="hs-muted">1 = very poor · 5 = excellent</small></div>
        <div *ngIf="q.type === 'nps'" class="zh-scale nps" role="radiogroup">
          <label *ngFor="let n of [0,1,2,3,4,5,6,7,8,9,10]" [class.on]="a[i] === n"><input type="radio" [name]="'q' + i" [value]="n" [(ngModel)]="a[i]">{{ n }}</label></div>
        <div *ngIf="q.type === 'yesno'" class="zh-scale" role="radiogroup">
          <label [class.on]="a[i] === true"><input type="radio" [name]="'q' + i" [value]="true" [(ngModel)]="a[i]">Yes</label>
          <label [class.on]="a[i] === false"><input type="radio" [name]="'q' + i" [value]="false" [(ngModel)]="a[i]">No</label></div>
        <select *ngIf="q.type === 'choice'" [name]="'q' + i" [(ngModel)]="a[i]"><option [ngValue]="''">Choose…</option>
          <option *ngFor="let o of (q.options || '').split('|')" [ngValue]="o">{{ o }}</option></select>
        <textarea *ngIf="q.type === 'text' || !q.type" [name]="'q' + i" rows="3" [(ngModel)]="a[i]"></textarea>
      </fieldset>
      <div class="hs-acts"><button type="submit" class="ex-btn primary" [disabled]="busy">{{ busy ? 'Sending…' : 'Send my answers' }}</button></div>
    </form>
  </div>
</div></div>`,
  styles: [`.zh-q { display: flex; flex-direction: column; gap: 14px; max-width: 760px; }
    .zh-q fieldset { border: 1px solid #e3e5ee; border-radius: 10px; padding: 10px 14px; background: #fff; }
    .zh-q legend { font-size: 14px; font-weight: 600; color: #1b1640; padding: 0 4px; }
    .zh-q textarea, .zh-q select { width: 100%; }
    .zh-scale { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .zh-scale label { display: inline-flex; align-items: center; justify-content: center; min-width: 38px; height: 34px; padding: 0 10px; border: 1px solid #dcdfea; border-radius: 8px; cursor: pointer; }
    .zh-scale label input { position: absolute; opacity: 0; width: 1px; height: 1px; }
    .zh-scale label.on { background: #5b4fe0; color: #fff; border-color: #5b4fe0; }
    .zh-scale label:focus-within { outline: 2px solid #5b4fe0; outline-offset: 2px; }`],
})
export class ZhExitComponent implements OnInit {
  api!: ZaClient; d: any = null; a: any[] = []; err = ''; busy = false; done = false; id = 0; dd = day;
  constructor(private za: ZaApiService, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP); this.id = Number(this.route.snapshot.paramMap.get('id'));
    try { this.d = await this.api.get(`exit/${this.id}/`); this.a = (this.d.questions || []).map((q: any, i: number) => this.d.answers?.[i] ?? (q.type === 'choice' ? '' : null)); }
    catch (e) { this.err = ZaApiService.error(e); }
    this.cd.markForCheck();
  }
  async send(): Promise<void> {
    this.busy = true; this.err = '';
    try { await this.api.post(`exit/${this.id}/`, { answers: this.a }); this.done = true; }
    catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false; this.cd.markForCheck();
  }
}

// ---------------------------------------------------------------- the employee's notices and decisions
@Component({
  selector: 'zh-my-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title">Notices and decisions</h1>
    <p class="ex-desc">Show-cause notices, hearings and decisions sent to you by HR. Reply in writing before the date given; you may appeal a decision.</p></div></div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="err">{{ err }}</p>
    <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
    <p class="hs-empty" *ngIf="loaded && !rows.length">Nothing here.</p>
    <div class="hs-card zh-case" *ngFor="let c of rows" [attr.data-case]="c.id">
      <h3>{{ c.number }} – {{ c.title }} <span class="hs-b" [ngClass]="c.status === 'show_cause' ? 'wait' : c.status === 'decided' || c.status === 'closed' ? 'ok' : ''">{{ c.status_label }}</span></h3>
      <ng-container *ngIf="c.show_cause"><h4>Show-cause notice <small class="hs-muted">sent {{ dd(c.sent) }}, reply by {{ dd(c.response_due) }}</small></h4>
        <pre class="zh-text">{{ c.show_cause }}</pre></ng-container>
      <p *ngIf="c.hearing_at"><b>Hearing:</b> {{ w(c.hearing_at) }} {{ c.hearing_place }}</p>
      <div *ngIf="c.response"><h4>Your reply</h4><pre class="zh-text">{{ c.response }}</pre></div>
      <form *ngIf="c.can_reply" (ngSubmit)="send(c, 'reply')"><label>Your reply<textarea name="r" rows="5" [(ngModel)]="text[c.id]"></textarea></label>
        <div class="hs-acts"><button type="submit" class="ex-btn primary" [disabled]="busy || !(text[c.id] || '').trim()">Send my reply</button></div></form>
      <div *ngIf="c.decision"><h4>Decision <small class="hs-muted">{{ dd(c.decision_date) }}</small></h4><p><b>{{ c.decision }}</b></p><pre class="zh-text" *ngIf="c.decision_notes">{{ c.decision_notes }}</pre>
        <p *ngIf="c.appeal_outcome"><b>Appeal:</b> {{ c.appeal_outcome }}</p></div>
      <form *ngIf="c.can_appeal" (ngSubmit)="send(c, 'appeal')"><label>Appeal (optional)<textarea name="a" rows="4" [(ngModel)]="text[c.id]"></textarea></label>
        <div class="hs-acts"><button type="submit" class="ex-btn" [disabled]="busy || !(text[c.id] || '').trim()">Send my appeal</button></div></form>
    </div>
  </div>
</div></div>`,
  styles: [`.zh-case { margin-bottom: 12px; } .zh-case h4 { font-size: 13.5px; margin: 10px 0 4px; }
    .zh-text { white-space: pre-wrap; font: inherit; font-size: 13.5px; background: #f7f8fb; padding: 12px; border-radius: 8px; margin: 0; }
    .zh-case textarea { width: 100%; }`],
})
export class ZhMyCasesComponent implements OnInit {
  api!: ZaClient; rows: any[] = []; text: Record<number, string> = {}; err = ''; ok = ''; busy = false; loaded = false; dd = day; w = when;
  constructor(private za: ZaApiService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    try { this.rows = await this.api.get('my-cases/'); } catch (e) { this.err = ZaApiService.error(e); }
    this.loaded = true; this.cd.markForCheck();
  }
  async send(c: any, what: 'reply' | 'appeal'): Promise<void> {
    this.busy = true; this.err = ''; this.ok = '';
    try { this.rows = await this.api.post('my-cases/', { id: c.id, [what]: this.text[c.id] }); this.ok = what === 'reply' ? 'Your reply was sent to HR.' : 'Your appeal was sent to HR.'; this.text[c.id] = ''; }
    catch (e) { this.err = ZaApiService.error(e); }
    this.busy = false; this.cd.markForCheck();
  }
}

// ---------------------------------------------------------------- v1.58.0 assignments and matrix report
@Component({
  selector: 'zh-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, TPipe],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section" data-assignments-report>
  <div class="header_section"><div class="ex-head"><div>
    <h1 class="page-title">Assignments and matrix</h1>
    <p class="ex-desc">Who works where besides the main job, the share of their time, full-time equivalents by department and the dotted-line managers.</p></div>
    <div class="ex-actions">
      <button type="button" class="ex-btn" (click)="go('assignment')">Assignments</button>
      <button type="button" class="ex-btn" (click)="go('matrix')">Functional managers</button>
      <button type="button" class="ex-btn primary" (click)="add()">New assignment</button>
    </div></div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="err" role="alert">{{ err }}</p>
    <div class="zh-buckets" *ngIf="d">
      <div class="zh-b"><b>{{ d.totals.assignments }}</b><span>Active assignments</span></div>
      <div class="zh-b"><b>{{ d.totals.planned }}</b><span>Planned</span></div>
      <div class="zh-b d30"><b>{{ d.totals.ending }}</b><span>{{ 'Ending in {0} days' | t:[d.days] }}</span></div>
      <div class="zh-b"><b>{{ d.totals.functional_managers }}</b><span>Functional managers</span></div>
    </div>

    <h3 class="zh-h" *ngIf="d">Who works where</h3>
    <div class="hs-scroll" *ngIf="d?.matrix?.length"><table class="hs-table" zPlain data-matrix>
      <tr><th>Employee</th><th>Main job</th><th class="zh-share">Share of time</th><th>Assignments</th></tr>
      <tr *ngFor="let r of d.matrix" [attr.data-emp]="r.employee_id">
        <td><b>{{ r.name }}</b><small class="hs-muted"> {{ r.code }}</small></td>
        <td>{{ r.department || '–' }}<small class="hs-muted"> {{ r.branch }}</small></td>
        <td class="zh-share"><div class="zh-bar" [attr.aria-label]="'Main job ' + r.main_share + '%'">
          <span class="main" [style.width.%]="+r.main_share" [title]="'Main job ' + r.main_share + '%'"></span>
          <span *ngFor="let a of r.assignments; let i = index" class="asg" [ngClass]="'c' + (i % 4)" [style.width.%]="a.status === 'active' ? +a.percent : 0" [title]="a.where + ' ' + a.percent + '%'"></span>
        </div><small class="hs-muted">{{ '{0}% main job' | t:[r.main_share] }}</small></td>
        <td><div *ngFor="let a of r.assignments; let i = index" class="zh-asg"><span class="dot" [ngClass]="'c' + (i % 4)"></span>
          <a class="za-a" (click)="open(a.id)">{{ a.number }}</a> {{ a.kind }} – {{ a.where }}, <b>{{ a.percent }}%</b>
          <small class="hs-muted"> · {{ dd(a.start) }}{{ a.end ? ' – ' + dd(a.end) : '' }}{{ a.manager ? ' · ' + a.manager : '' }}</small>
          <span class="hs-b" *ngIf="a.status !== 'active'">{{ a.status_label }}</span></div></td>
      </tr></table></div>
    <p class="hs-empty" *ngIf="d && !d.matrix.length">No one works on an assignment now. Use New assignment for a secondment, a second role, a project or an acting role.</p>

    <div class="zh-two" *ngIf="d">
      <section>
        <h3 class="zh-h">Full-time equivalents by department</h3>
        <table class="hs-table" zPlain data-fte>
          <tr><th>Department</th><th class="r">Employees (home)</th><th class="r">Seconded out</th><th class="r">Working here on assignment</th><th class="r">FTE</th></tr>
          <tr *ngFor="let f of d.fte"><td>{{ f.department }}</td><td class="r">{{ f.home }}</td><td class="r">{{ f.seconded_out || '' }}</td><td class="r">{{ f.seconded_in || '' }}</td><td class="r"><b>{{ f.fte }}</b></td></tr>
        </table>
        <p class="hs-muted zh-note">The main job counts with its share of time; an assignment counts in its department with its share.</p>
      </section>
      <section>
        <h3 class="zh-h">{{ 'Ending in the next {0} days' | t:[d.days] }}</h3>
        <table class="hs-table" zPlain *ngIf="d.ending.length" data-ending>
          <tr><th>Assignment</th><th>Employee</th><th>Ends</th></tr>
          <tr *ngFor="let e of d.ending"><td><a class="za-a" (click)="open(e.id)">{{ e.number }}</a> {{ e.kind }}</td><td>{{ e.employee }}</td>
            <td><span class="hs-b" [ngClass]="e.days <= 7 ? 'bad' : 'wait'">{{ dd(e.end) }} ({{ '{0} days' | t:[e.days] }})</span></td></tr>
        </table>
        <p class="hs-empty" *ngIf="!d.ending.length">No assignment ends in this period.</p>
        <h3 class="zh-h">Functional (dotted-line) managers</h3>
        <table class="hs-table" zPlain *ngIf="d.functional.length" data-functional>
          <tr><th>Employee</th><th>Functional manager</th><th>For</th><th class="r">Appraisal weight</th></tr>
          <tr *ngFor="let f of d.functional"><td>{{ f.employee }}</td><td>{{ f.manager }}</td><td>{{ f.area || '–' }}</td><td class="r">{{ f.weight }}%</td></tr>
        </table>
        <p class="hs-empty" *ngIf="!d.functional.length">No functional managers set.</p>
      </section>
    </div>
  </div>
</div></div>`,
  styles: [`.zh-buckets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .zh-b { display: flex; flex-direction: column; min-width: 140px; padding: 10px 14px; border: 1px solid #e3e5ee; border-radius: 12px; background: #fff; }
    .zh-b b { font-size: 22px; font-weight: 600; color: #1b1640; } .zh-b span { font-size: 12.5px; color: #6b7185; } .zh-b.d30 b { color: #7a5200; }
    .zh-h { font-size: 15px; font-weight: 600; color: #1b1640; margin: 18px 0 8px; }
    .zh-share { width: 220px; } .zh-bar { display: flex; height: 10px; border-radius: 6px; overflow: hidden; background: #eef0f6; margin: 3px 0; }
    .zh-bar span { display: block; height: 100%; } .zh-bar .main { background: #5b4fe0; }
    .c0 { background: #2e9d6a; } .c1 { background: #d68a1a; } .c2 { background: #3a8fd6; } .c3 { background: #c4479a; }
    .zh-asg { padding: 2px 0; } .zh-asg .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-inline-end: 4px; }
    .zh-two { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 24px; } .zh-note { font-size: 12px; margin-top: 6px; }
    .za-a { cursor: pointer; color: #3e3a99; } .r { text-align: end; }
    @media (max-width: 900px) { .zh-two { grid-template-columns: minmax(0, 1fr); } .zh-share { width: 140px; } }`],
})
export class ZhAssignmentsComponent implements OnInit {
  api!: ZaClient; d: any = null; err = ''; dd = day;
  constructor(private za: ZaApiService, private router: Router, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    try { this.d = await this.api.get('assignments-report/', { days: 30 }); } catch (e) { this.err = ZaApiService.error(e); }
    this.cd.markForCheck();
  }
  open(id: number): void { this.router.navigate([base(APP), 'r', 'assignment', id]); }
  go(kind: string): void { this.router.navigate([base(APP), 'r', kind]); }
  add(): void { this.router.navigate([base(APP), 'r', 'assignment'], { queryParams: { new: 1 } }); }
}
