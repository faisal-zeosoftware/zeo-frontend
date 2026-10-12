import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HSE_BASE, HseApiService, csv, day, num, today } from './hse-api.service';

/** v1.17.0 pages that use the other ZEO apps: muster list (attendance), handovers (transfers and resignations)
 *  and HSE costs (cost centres and projects). Each page explains itself when its app is not linked. */
@Component({
  selector: 'app-hse-links',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">{{ title[page] }}</h1><p class="ex-desc">{{ desc[page] }}</p></div>
        <div class="ex-actions hs-noprint" *ngIf="page === 'muster'">
          <select class="ex-btn" [(ngModel)]="site" (ngModelChange)="load()" aria-label="Site"><option value="">All sites</option>
            <option *ngFor="let s of lk.sites" [value]="s.id">{{ s.name }}</option></select>
          <button type="button" class="ex-btn" (click)="load()">Refresh</button>
          <button type="button" class="ex-btn primary" (click)="print()" [disabled]="!data?.people?.length">Print roll call</button>
        </div>
        <div class="ex-actions hs-noprint" *ngIf="page === 'costs'">
          <input type="date" class="ex-btn" style="padding:0 8px" [(ngModel)]="from" (change)="load()" aria-label="From">
          <input type="date" class="ex-btn" style="padding:0 8px" [(ngModel)]="to" (change)="load()" aria-label="To">
          <button type="button" class="ex-btn" (click)="exportCosts()" [disabled]="!data?.rows?.length">Export</button>
        </div>
        <div class="ex-actions hs-noprint" *ngIf="page === 'handovers'">
          <select class="ex-btn" [(ngModel)]="hstatus" (ngModelChange)="load()" aria-label="Show"><option value="open">To reassign</option><option value="all">All</option></select>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="hs-note err" *ngIf="msg">{{ msg }}</p><p class="hs-note ok" *ngIf="ok">{{ ok }}</p>

      <!-- muster -->
      <ng-container *ngIf="page === 'muster' && data">
        <div class="ex-tiles">
          <div class="ex-tile"><div class="lbl">On site now</div><div class="num">{{ data.count }}</div><div class="amt">{{ data.site || 'all sites' }} · {{ data.at }}</div></div>
          <div class="ex-tile t3"><div class="lbl">Accounted for</div><div class="num">{{ accounted() }} / {{ data.count }}</div><div class="amt">tick people at the assembly point</div></div>
          <div class="ex-tile t2"><div class="lbl">Missing</div><div class="num" [style.color]="data.count - accounted() ? '#b42318' : null">{{ data.count - accounted() }}</div><div class="amt">not yet ticked</div></div>
        </div>
        <p class="hs-muted" *ngIf="site && !data.branch_filtered">This site has no branch – everyone in attendance is listed. Set the branch in Setup › Sites.</p>
        <div class="hs-scroll"><table class="hs-table hs-muster">
          <tr><th class="chk">✓</th><th>Name</th><th>Department</th><th>Branch</th><th>In since</th><th>Phone</th><th>Working under permit</th></tr>
          <tr *ngFor="let p of data.people" [style.background]="here[p.id] ? '#ecfdf3' : null">
            <td class="chk"><input type="checkbox" [(ngModel)]="here[p.id]" [attr.aria-label]="'Accounted for: ' + p.name"></td>
            <td><b>{{ p.name }}</b><div class="hs-muted">{{ p.code }}</div></td><td>{{ p.department }}</td><td>{{ p.branch }}</td><td>{{ p.since }}</td>
            <td>{{ p.phone }}</td><td>{{ p.permits.join(', ') }}</td></tr>
        </table></div>
        <p class="hs-empty" *ngIf="!data.people.length">No one is punched in{{ data.site ? ' at ' + data.site : '' }} right now.</p>
        <p class="hs-muted" style="margin-top:8px">{{ data.note }}</p>
      </ng-container>

      <!-- handovers -->
      <ng-container *ngIf="page === 'handovers' && data">
        <p class="hs-note info" *ngIf="!data.on">Handovers start when HSE is linked with HR Actions (transfers) or resignations – see Setup › Links with other apps.</p>
        <div class="hs-card" *ngFor="let h of data.results" style="margin-bottom:12px">
          <h3>{{ h.employee.name }} <span class="hs-muted">{{ h.employee.code }}</span>
            <span class="hs-b" [ngClass]="h.status === 'open' ? 'wait' : 'ok'" style="margin-left:6px">{{ h.status_label }}</span></h3>
          <div class="hs-muted">{{ h.reason_label }} · {{ h.detail }} · effective {{ d(h.effective_date) }}</div>
          <div class="hs-ev" *ngFor="let it of h.items"><div class="t"><b>{{ it.label }}</b>: {{ it.count }}</div><div class="m">{{ it.records.join(', ') }}</div></div>
          <p *ngIf="h.status !== 'open'" style="white-space:pre-wrap;font-size:13px;margin:8px 0 0">{{ h.note }}<span class="hs-muted"> – {{ h.done_by }}</span></p>
          <div class="ex-form" *ngIf="h.status === 'open'" style="margin-top:10px">
            <label>Hand over to<select [(ngModel)]="pick[h.id]"><option [ngValue]="null">– choose –</option>
              <option *ngFor="let e of lk.employees" [ngValue]="e.id" [disabled]="e.id === h.employee.id">{{ e.name }} ({{ e.code }})</option></select></label>
            <label>Note<input [(ngModel)]="note[h.id]"></label>
            <div class="wide hs-acts"><button type="button" class="ex-btn primary" (click)="reassign(h)" [disabled]="!pick[h.id]">Reassign all</button>
              <button type="button" class="ex-btn" (click)="nothing(h)">Close without reassigning</button></div>
          </div>
        </div>
        <p class="hs-empty" *ngIf="!data.results.length">{{ hstatus === 'open' ? 'Nothing to reassign.' : 'No handovers yet.' }}</p>
      </ng-container>

      <!-- costs -->
      <ng-container *ngIf="page === 'costs' && data">
        <div class="ex-tiles">
          <div class="ex-tile"><div class="lbl">Net HSE cost</div><div class="num" style="font-size:22px">{{ n(data.total, 0) }}</div><div class="amt">{{ d(data.from) }} – {{ d(data.to) }}</div></div>
          <div class="ex-tile t3"><div class="lbl">Incidents</div><div class="num">{{ sum('incidents') }}</div><div class="amt">estimated loss {{ n(sum('estimated_loss'), 0) }}</div></div>
          <div class="ex-tile t2"><div class="lbl">Claims</div><div class="num">{{ sum('claims') }}</div><div class="amt">paid {{ n(sum('claims_paid'), 0) }} · recovered {{ n(sum('claims_recovered'), 0) }}</div></div>
        </div>
        <div class="hs-scroll"><table class="hs-table">
          <tr><th>Site</th><th *ngIf="data.by_cost_centre">Cost centre</th><th *ngIf="data.by_project">Project</th><th class="r">Incidents</th><th class="r">Estimated loss</th>
            <th class="r">Claims</th><th class="r">Paid</th><th class="r">Recovered</th><th class="r">Net cost</th></tr>
          <tr *ngFor="let r of data.rows"><td><b>{{ r.site }}</b></td><td *ngIf="data.by_cost_centre">{{ r.cost_center || '–' }}</td><td *ngIf="data.by_project">{{ r.project || '–' }}</td>
            <td class="r">{{ r.incidents }}</td><td class="r">{{ n(r.estimated_loss, 0) }}</td><td class="r">{{ r.claims }}</td><td class="r">{{ n(r.claims_paid, 0) }}</td>
            <td class="r">{{ n(r.claims_recovered, 0) }}</td><td class="r"><b>{{ n(r.net_cost, 0) }}</b></td></tr>
        </table></div>
        <p class="hs-empty" *ngIf="!data.rows.length">No incident losses or claims in this period.</p>
        <p class="hs-muted" style="margin-top:8px">Net cost = estimated incident loss + claim payments − recoveries. Cost centres come from the Expenses app and projects from the Projects app when they are linked.</p>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class HseLinksComponent implements OnInit, OnDestroy {
  page = 'muster';
  title: Record<string, string> = { muster: 'Muster list', handovers: 'HSE handovers', costs: 'HSE costs' };
  desc: Record<string, string> = {
    muster: 'Who punched in and has not punched out – for a drill or an emergency head count. Contractors and visitors come from the gate register.',
    handovers: 'People who moved branch or are leaving still own HSE work. Reassign it in one step.',
    costs: 'Incident losses and claim costs by site, cost centre and project.',
  };
  lk: any = { sites: [], employees: [] };
  data: any = null;
  site = '';
  hstatus = 'open';
  from = new Date().getFullYear() + '-01-01';
  to = today();
  here: Record<number, boolean> = {};
  pick: Record<number, number | null> = {};
  note: Record<number, string> = {};
  msg = '';
  ok = '';
  d = day;
  n = num;
  private sub?: Subscription;

  constructor(private api: HseApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async pm => {
      this.page = pm.get('page') || 'muster';
      if (!this.title[this.page]) { this.router.navigate([HSE_BASE, 'home']); return; }
      try { this.lk = await this.api.lookups(); } catch (e) { this.msg = HseApiService.error(e); }
      await this.load();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  async load(): Promise<void> {
    this.msg = ''; this.data = null;
    try {
      if (this.page === 'muster') { this.data = await this.api.get('links/muster/', { site: this.site }); this.here = {}; }
      else if (this.page === 'handovers') {
        this.data = await this.api.get('links/handovers/', { status: this.hstatus });
        (this.data.results || []).forEach((h: any) => { if (this.pick[h.id] === undefined) this.pick[h.id] = null; });
      }
      else this.data = await this.api.get('links/costs/', { from: this.from, to: this.to });
    } catch (e) { this.msg = HseApiService.error(e); }
  }

  accounted(): number { return (this.data?.people || []).filter((p: any) => this.here[p.id]).length; }
  sum(k: string): number { return (this.data?.rows || []).reduce((t: number, r: any) => t + (Number(r[k]) || 0), 0); }
  print(): void { window.print(); }

  async reassign(h: any): Promise<void> {
    this.msg = ''; this.ok = '';
    try { await this.api.post(`links/handovers/${h.id}/`, { to_employee: this.pick[h.id], note: this.note[h.id] || '' }); this.ok = `HSE work of ${h.employee.name} reassigned.`; await this.load(); }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  async nothing(h: any): Promise<void> {
    if (!confirm(`Close the handover of ${h.employee.name} without reassigning? The records keep their current owner.`)) return;
    try { await this.api.post(`links/handovers/${h.id}/`, { nothing: true, note: this.note[h.id] || '' }); this.ok = 'Closed.'; await this.load(); }
    catch (e) { this.msg = HseApiService.error(e); }
  }

  exportCosts(): void {
    csv('hse-costs.csv', [{ key: 'site', label: 'Site' }, { key: 'cost_center', label: 'Cost centre' }, { key: 'project', label: 'Project' },
      { key: 'incidents', label: 'Incidents' }, { key: 'estimated_loss', label: 'Estimated loss' }, { key: 'claims', label: 'Claims' },
      { key: 'claims_paid', label: 'Paid' }, { key: 'claims_recovered', label: 'Recovered' }, { key: 'net_cost', label: 'Net cost' }], this.data?.rows || []);
  }
}
