import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HSE_BASE, HseApiService, csv, day, stClass, when } from './hse-api.service';
import { HseIncidentFormComponent } from './hse-home.component';
import { HseActionViewComponent, HseNewActionComponent } from './hse-actions.component';

/** Incidents and near misses: register, classification, investigation (root cause), actions and approved closure. */
@Component({
  selector: 'app-hse-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule, HseIncidentFormComponent, HseNewActionComponent, HseActionViewComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <p class="hs-note err" *ngIf="msg" style="margin:16px">{{ msg }}</p>
    <!-- list -->
    <ng-container *ngIf="!id">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title">Incidents</h1><p class="ex-desc">Injuries, damage, environmental releases and near misses – from the first report to verified closure.</p></div>
          <div class="ex-actions"><button type="button" class="ex-btn" (click)="export()" [disabled]="!rows.length">Export CSV</button>
            <button type="button" class="ex-btn primary" (click)="reporting = true">+ Report incident</button></div>
        </div>
        <div class="hs-filters">
          <input type="search" [(ngModel)]="q" (ngModelChange)="soon()" placeholder="Search number or title…" aria-label="Search">
          <select [(ngModel)]="status" (ngModelChange)="load()" aria-label="Status"><option value="open">Open</option><option value="">All</option>
            <option *ngFor="let s of lk.incident_status" [value]="s.value">{{ s.label }}</option></select>
          <select [(ngModel)]="site" (ngModelChange)="load()" aria-label="Site"><option value="">All {{ lk.terms?.site ? lk.terms.site.toLowerCase() + 's' : 'sites' }}</option>
            <option *ngFor="let s of lk.sites" [value]="s.id">{{ s.name }}</option></select>
          <label class="ck"><input type="checkbox" [(ngModel)]="hipo" (ngModelChange)="load()"> High potential only</label>
        </div>
      </div>
      <div class="com_list mt-4">
        <div class="hs-scroll"><table class="hs-table zl-hse">
          <tr><th>Incident</th><th>Category</th><th>When</th><th>Site</th><th>Branch</th><th>Severity A / P</th><th>Treatment</th><th>Status</th></tr>
          <tr class="click" *ngFor="let i of rows" (click)="open(i.id)">
            <td><span class="hs-code">{{ i.number }}</span> <span class="hs-b hipo" *ngIf="i.high_potential">HiPo</span><div style="font-weight:600;color:#1b1640">{{ i.title }}</div>
              <div class="hs-muted">{{ i.reported_by?.name }}</div></td>
            <td>{{ i.category_name || 'Not classified' }}</td><td>{{ w(i.occurred_at) }}</td><td>{{ i.site_name }}</td><td>{{ i.branch_name }}</td>
            <td>{{ i.actual_severity }} / {{ i.potential_severity }}</td><td>{{ i.treatment_label }}</td>
            <td><span class="hs-b" [ngClass]="cls(i.status)">{{ i.status_label }}</span></td></tr>
        </table></div>
        <p class="hs-empty" *ngIf="!rows.length">No incidents.</p>
      </div>
    </ng-container>

    <!-- record -->
    <ng-container *ngIf="id && i">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button>
            <span class="hs-code">{{ i.number }}</span> {{ i.title }}
            <span class="hs-b" [ngClass]="cls(i.status)" style="margin-left:6px">{{ i.status_label }}</span>
            <span class="hs-b hipo" *ngIf="i.high_potential" style="margin-left:4px">High potential</span></h1>
            <p class="ex-desc">{{ i.category_name || 'Not classified yet' }} · {{ w(i.occurred_at) }} · {{ i.site_name }}{{ i.area_name ? ' / ' + i.area_name : '' }} · reported by {{ i.reported_by?.name }}</p></div>
          <div class="ex-actions">
            <button type="button" class="ex-btn" *ngIf="i.can?.actions" (click)="raising = true">+ Action</button>
            <button type="button" class="ex-btn primary" *ngIf="i.can?.close" (click)="close()">Request closure</button>
            <button type="button" class="ex-btn primary" *ngIf="i.can?.decide" (click)="decide(true)">Approve closure</button>
            <button type="button" class="ex-btn danger" *ngIf="i.can?.decide" (click)="decide(false)">Refuse closure</button>
          </div>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
        <p class="hs-note" *ngIf="i.close_problems?.length && i.status !== 'closed'">Before closure: {{ i.close_problems.join(' · ') }}</p>
        <div class="hs-steps" *ngIf="i.steps?.length"><div class="s" *ngFor="let s of i.steps" [class.done]="s.status === 'approved'" [class.bad]="s.status === 'rejected'">
          {{ s.label }}<div *ngIf="s.by" style="font-weight:400">{{ s.by }} · {{ w(s.at) }}</div></div></div>
        <div class="hs-split">
          <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
            <div class="hs-card"><h3>What happened</h3>
              <p style="white-space:pre-wrap;font-size:13.5px;margin:0 0 10px">{{ i.description }}</p>
              <dl class="hs-kv">
                <dt>Exact place</dt><dd>{{ i.location || '–' }}</dd>
                <dt>Immediate actions</dt><dd style="white-space:pre-wrap">{{ i.immediate_actions || '–' }}</dd>
                <dt>Witnesses</dt><dd>{{ i.witnesses || '–' }}</dd>
                <dt>Treatment</dt><dd>{{ i.treatment_label }}</dd>
                <dt>Injured</dt><dd>{{ i.restricted && !i.injured_employee && !i.injured_name ? '(restricted)' : (i.injured_employee?.name || i.injured_name || '–') }}</dd>
                <dt>Body part</dt><dd>{{ i.body_part || (i.restricted ? '(restricted)' : '–') }}</dd>
                <dt>Permit</dt><dd>{{ i.permit_number || '–' }}</dd>
                <dt>Risk assessment</dt><dd>{{ i.risk_number || '–' }}</dd>
              </dl>
            </div>

            <div class="hs-card" *ngIf="i.can?.classify">
              <h3>Classification</h3>
              <div class="ex-form">
                <label>Category<select [(ngModel)]="c.category"><option [ngValue]="null">–</option><option *ngFor="let x of lk.categories" [ngValue]="x.id">{{ x.name }}</option></select></label>
                <label>Treatment<select [(ngModel)]="c.treatment"><option *ngFor="let x of lk.treatments" [value]="x.value">{{ x.label }}</option></select></label>
                <label>Actual severity<select [(ngModel)]="c.actual_severity"><option *ngFor="let s of [1,2,3,4,5]" [ngValue]="s">{{ s }} – {{ lk.matrix?.severity?.[s-1] }}</option></select></label>
                <label>Potential severity<select [(ngModel)]="c.potential_severity"><option *ngFor="let s of [1,2,3,4,5]" [ngValue]="s">{{ s }} – {{ lk.matrix?.severity?.[s-1] }}</option></select></label>
                <label>Investigator<select [(ngModel)]="c.investigator"><option [ngValue]="null">–</option><option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
                <label>Lost days<input type="number" min="0" [(ngModel)]="c.lost_days"></label>
                <label class="ck"><input type="checkbox" [(ngModel)]="c.reportable"> Reportable to the authority</label>
                <label *ngIf="c.reportable">Report due<input type="date" [(ngModel)]="c.report_due"></label>
                <label *ngIf="c.reportable">Authority reference<input [(ngModel)]="c.authority_ref"></label>
              </div>
              <div class="hs-acts" style="margin-top:10px"><button type="button" class="ex-btn primary sm" (click)="classify()">Save classification</button>
                <span class="hs-muted">Potential 4–5 = high potential: investigated even without injury.</span></div>
            </div>

            <div class="hs-card" *ngIf="i.investigation_required || i.root_cause?.whys?.length || i.findings">
              <h3>Investigation and root cause</h3>
              <ng-container *ngIf="i.can?.investigate; else rcView">
                <div style="display:flex;flex-direction:column;gap:6px">
                  <div *ngFor="let w of rc.whys; let k = index; trackBy: byIdx" style="display:flex;gap:6px;align-items:center">
                    <b style="width:52px;font-size:12px;color:#6b7185">Why {{ k + 1 }}</b>
                    <input [(ngModel)]="rc.whys[k]" style="flex:1;height:32px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;font:inherit">
                    <button type="button" class="ex-btn sm" (click)="rc.whys.splice(k, 1)">×</button></div>
                  <button type="button" class="ex-btn sm" style="align-self:flex-start" (click)="rc.whys.push('')" *ngIf="rc.whys.length < 7">+ Why</button>
                </div>
                <div class="ex-form" style="margin-top:10px">
                  <label class="wide">Immediate causes<textarea [(ngModel)]="rc.immediate" rows="2"></textarea></label>
                  <label class="wide">Underlying / system causes<textarea [(ngModel)]="rc.underlying" rows="2"></textarea></label>
                  <label class="wide">Findings<textarea [(ngModel)]="inv.findings" rows="3"></textarea></label>
                  <label class="wide">Lessons learned<textarea [(ngModel)]="inv.lessons_learned" rows="2"></textarea></label>
                  <label class="wide" *ngIf="i.status === 'closed'">Reason for the correction (logged) *<input [(ngModel)]="inv.correction_reason"></label>
                </div>
                <div class="hs-acts" style="margin-top:10px"><button type="button" class="ex-btn primary sm" (click)="saveInv()">Save investigation</button></div>
              </ng-container>
              <ng-template #rcView>
                <ol style="font-size:13px"><li *ngFor="let w of i.root_cause?.whys">{{ w }}</li></ol>
                <p class="hs-muted">Underlying: {{ i.root_cause?.underlying || '–' }}</p><p style="font-size:13px;white-space:pre-wrap">{{ i.findings }}</p>
              </ng-template>
            </div>

            <div class="hs-card"><h3>Corrective actions <button type="button" class="hs-rlink" *ngIf="i.can?.actions" (click)="raising = true">+ Add</button></h3>
              <table class="hs-table" zPlain *ngIf="i.actions_list?.length"><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr>
                <tr class="click" *ngFor="let a of i.actions_list" (click)="actionId = a.id"><td><span class="hs-code">{{ a.number }}</span> {{ a.title }}</td><td>{{ a.owner?.name }}</td>
                  <td [style.color]="a.overdue ? '#b42318' : null">{{ d(a.due_date) }}</td><td><span class="hs-b" [ngClass]="cls(a.status)">{{ a.status_label }}</span></td></tr></table>
              <p class="hs-empty" *ngIf="!i.actions_list?.length">No actions yet.</p>
            </div>
          </div>
          <div class="hs-side">
            <div class="hs-card"><h3>Severity</h3><div class="hs-kv3">
              <div><small>Actual</small><b>{{ i.actual_severity }}</b></div><div><small>Potential</small><b>{{ i.potential_severity }}</b></div>
              <div><small>Lost days</small><b>{{ i.lost_days }}</b></div></div>
              <p class="hs-muted" *ngIf="i.reportable" style="margin-top:8px">Reportable · ref {{ i.authority_ref || 'pending' }} · due {{ d(i.report_due) }}</p></div>
            <!-- v1.17.0 links with the other ZEO apps -->
            <div class="hs-card" *ngIf="linked()"><h3>Linked in ZEO</h3>
              <dl class="hs-kv">
                <ng-container *ngIf="i.links.project"><dt>Project</dt><dd>{{ i.links.project }}<span class="hs-muted" *ngIf="i.links.project_issue"> · logged as a project issue</span></dd></ng-container>
                <ng-container *ngIf="i.links.on.assets"><dt>Equipment</dt><dd>{{ i.links.asset ? (i.links.asset.label || i.links.asset.name) : '–' }}
                  <div *ngIf="i.links.asset_damage" class="hs-muted">Asset damage {{ i.links.asset_damage.number }} · {{ i.links.asset_damage.status }}</div></dd></ng-container>
                <ng-container *ngIf="i.links.on.leave && lk.rights?.staff"><dt>Lost days</dt><dd>{{ i.lost_days }} {{ i.links.lost_days_from_leave ? '(from leave)' : '(typed)' }}
                  <div class="hs-muted" *ngFor="let l of i.links.leave">{{ l.number || ('#' + l.id) }} · {{ l.type }} · {{ d(l.from) }}–{{ d(l.to) }} · {{ l.days }} d</div></dd></ng-container>
                <ng-container *ngIf="i.links.alert"><dt>Safety alert</dt><dd>{{ i.links.alert.title }}<div class="hs-muted">{{ d(i.links.alert.published) }} · read by {{ i.links.alert.read_by }}{{ i.links.alert.branches.length ? ' · ' + i.links.alert.branches.join(', ') : ' · all branches' }}</div></dd></ng-container>
              </dl>
              <div class="hs-acts" *ngIf="lk.rights?.staff" style="margin-top:8px;flex-wrap:wrap">
                <button type="button" class="ex-btn sm" *ngIf="i.links.on.leave && i.injured_employee && i.status !== 'closed'" (click)="linkLeave()">Look for injury leave</button>
                <button type="button" class="ex-btn sm" *ngIf="i.links.on.assets && i.links.asset_plus && i.links.asset && !i.links.asset_damage" (click)="dmg = { severity: 'minor', repair_cost: i.estimated_loss || 0, note: '' }">Report asset damage</button>
                <button type="button" class="ex-btn sm" *ngIf="i.links.on.alerts && !i.links.alert" (click)="alert = { title: 'Safety alert: ' + i.title, message: i.lessons_learned || i.findings || '' }">Publish safety alert</button>
              </div>
              <div class="hs-linkbox" *ngIf="dmg"><h4>Asset damage (Asset Plus approves it)</h4>
                <div class="ex-form"><label>Severity<select [(ngModel)]="dmg.severity"><option value="minor">Minor</option><option value="major">Major</option><option value="total">Beyond repair</option></select></label>
                  <label>Repair cost<input type="number" min="0" [(ngModel)]="dmg.repair_cost"></label><label class="wide">Note<input [(ngModel)]="dmg.note"></label></div>
                <div class="hs-acts"><button type="button" class="ex-btn sm primary" (click)="damage()">Create</button><button type="button" class="ex-btn sm" (click)="dmg = null">Cancel</button></div></div>
              <div class="hs-linkbox" *ngIf="alert"><h4>Safety alert – company announcement{{ i.site_name ? ' for the branch of ' + i.site_name : '' }}</h4>
                <div class="ex-form"><label class="wide">Title<input [(ngModel)]="alert.title"></label>
                  <label class="wide">Message (no names or health details)<textarea [(ngModel)]="alert.message" rows="4"></textarea></label></div>
                <div class="hs-acts"><button type="button" class="ex-btn sm primary" (click)="publish()">Publish</button><button type="button" class="ex-btn sm" (click)="alert = null">Cancel</button></div></div>
            </div>
            <div class="hs-card" *ngIf="i.claims?.length"><h3>Claims</h3>
              <div class="hs-ev" *ngFor="let c of i.claims"><div class="t"><a href="javascript:void(0)" (click)="go(['r', 'claims', c.id])">{{ c.number }}</a></div><div class="m">{{ c.status }}</div></div></div>
            <div class="hs-card"><h3>Files</h3>
              <div class="hs-files"><button type="button" class="hs-file" *ngFor="let f of i.files" (click)="api.download(f.id, f.name)">📎 {{ f.name }}</button></div>
              <label class="ex-btn sm" style="margin-top:6px;cursor:pointer">Attach…<input type="file" multiple hidden (change)="attach($any($event.target).files)"></label></div>
            <div class="hs-card"><h3>History</h3><div class="hs-ev" *ngFor="let h of i.history"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div></div>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</div>
<hse-incident-form *ngIf="reporting" (closed)="reporting = false" (saved)="reporting = false; open($event.id)"></hse-incident-form>
<hse-new-action *ngIf="raising" source="incident" [sourceId]="id" [ref]="i?.number" (closed)="raising = false" (saved)="raising = false; reload()"></hse-new-action>
<hse-action-view *ngIf="actionId" [id]="actionId" [staff]="!!lk.rights?.staff" (closed)="actionId = null; reload()"></hse-action-view>`,
})
export class HseIncidentsComponent implements OnInit, OnDestroy {
  lk: any = { rights: {}, sites: [], categories: [], treatments: [], employees: [] };
  rows: any[] = [];
  id: number | null = null;
  i: any = null;
  q = '';
  status = 'open';
  site = '';
  hipo = false;
  c: any = {};
  rc: any = { whys: [] };
  inv: any = {};
  reporting = false;
  raising = false;
  actionId: number | null = null;
  dmg: any = null;
  alert: any = null;
  msg = '';
  ok = '';
  w = when;
  d = day;
  cls = stClass;
  private sub?: Subscription;
  private timer: any;

  constructor(public api: HseApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async pm => {
      this.id = pm.get('id') ? Number(pm.get('id')) : null;
      this.msg = ''; this.ok = '';
      try { this.lk = await this.api.lookups(); } catch (e) { this.msg = HseApiService.error(e); }
      const qp = this.route.snapshot.queryParamMap;
      if (qp.get('status') !== null) this.status = qp.get('status') || '';
      if (this.id) await this.reload(); else await this.load();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  byIdx(i: number): number { return i; }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }

  async load(): Promise<void> {
    try { this.rows = (await this.api.get('incidents/', { q: this.q, status: this.status, site: this.site, hipo: this.hipo ? 1 : '', limit: 1000 })).results; }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  async reload(): Promise<void> {
    try { this.set(await this.api.get(`incidents/${this.id}/`)); } catch (e) { this.msg = HseApiService.error(e); }
  }

  set(i: any): void {
    this.i = i;
    this.c = { category: i.category, treatment: i.treatment || 'none', actual_severity: i.actual_severity, potential_severity: i.potential_severity,
               investigator: i.investigator?.id || null, lost_days: i.lost_days, reportable: i.reportable, report_due: i.report_due, authority_ref: i.authority_ref };
    this.rc = { method: '5whys', whys: [...(i.root_cause?.whys || [])], immediate: i.root_cause?.immediate || '', underlying: i.root_cause?.underlying || '' };
    if (!this.rc.whys.length) this.rc.whys = [''];
    this.inv = { findings: i.findings, lessons_learned: i.lessons_learned, correction_reason: '' };
  }

  open(id: number): void { this.router.navigate([HSE_BASE, 'incidents', id]); }
  back(): void { this.router.navigate([HSE_BASE, 'incidents']); }
  go(p: any[]): void { this.router.navigate([HSE_BASE, ...p]); }

  private async call(fn: () => Promise<any>, done: string): Promise<void> {
    this.msg = ''; this.ok = '';
    try { this.set(await fn()); this.ok = done; } catch (e) { this.msg = HseApiService.error(e); }
  }

  classify(): Promise<void> { return this.call(() => this.api.post(`incidents/${this.id}/classify/`, this.c), 'Classification saved.'); }

  saveInv(): Promise<void> {
    const rc = { ...this.rc, whys: this.rc.whys.filter((x: string) => x.trim()) };
    return this.call(() => this.api.patch(`incidents/${this.id}/`, { ...this.inv, root_cause: rc }), 'Investigation saved.');
  }

  close(): Promise<void> { return this.call(() => this.api.post(`incidents/${this.id}/close/`), 'Closure sent for approval.'); }

  // v1.17.0 links
  linked(): boolean { const l = this.i?.links; return !!l && (l.on.assets || l.on.leave || l.on.alerts || !!l.project); }
  linkLeave(): Promise<void> { return this.call(() => this.api.post(`incidents/${this.id}/link-leave/`), 'Injury leave linked – lost days updated.'); }
  damage(): Promise<void> { return this.call(() => this.api.post(`incidents/${this.id}/asset-damage/`, this.dmg), 'Asset damage record created in Asset Plus.').then(() => { if (this.i?.links?.asset_damage) this.dmg = null; }); }
  publish(): Promise<void> { return this.call(() => this.api.post(`incidents/${this.id}/safety-alert/`, this.alert), 'Safety alert published.').then(() => { if (this.i?.links?.alert) this.alert = null; }); }

  decide(ok: boolean): Promise<void> {
    const note = ok ? '' : (prompt('Reason for refusing the closure') || '');
    if (!ok && !note) return Promise.resolve();
    return this.call(() => this.api.post(`incidents/${this.id}/${ok ? 'approve' : 'reject'}/`, { note }), ok ? 'Approved.' : 'Closure refused.');
  }

  async attach(fl: FileList | null): Promise<void> {
    if (!fl?.length) return;
    try { await this.api.postQ('files/', { model: 'incident', id: this.id }, HseApiService.form({}, Array.from(fl))); await this.reload(); this.ok = 'File attached.'; }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  export(): void {
    csv('incidents.csv', [{ key: 'number', label: 'Incident' }, { key: 'title', label: 'Title' }, { key: 'category_name', label: 'Category' },
      { key: 'occurred_at', label: 'Occurred' }, { key: 'site_name', label: 'Site' }, { key: 'actual_severity', label: 'Actual severity' },
      { key: 'potential_severity', label: 'Potential severity' }, { key: 'treatment_label', label: 'Treatment' }, { key: 'status_label', label: 'Status' }], this.rows);
  }
}
