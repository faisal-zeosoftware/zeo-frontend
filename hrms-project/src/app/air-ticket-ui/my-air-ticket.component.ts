// v1.62.0 air ticket – My air ticket (employee self service): the employee's entitlement, what is left, the next eligible date,
// how the policy works and their requests, in plain words. Read only; a new request is made on the employee portal.
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AtUiService } from './at-ui.service';

@Component({
  selector: 'app-my-air-ticket',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./at.css'],
  styles: [`
    .mat-ent { border: 1px solid #e3e5ef; border-radius: 12px; padding: 16px 18px; background: #fff; margin-bottom: 16px; }
    .mat-ent .top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 12px; }
    .mat-ent .t { font-weight: 700; font-size: 15px; color: #1b1640; }
    .mat-ent .s { font-size: 12.5px; color: #6b7185; margin-top: 2px; }
    .mat-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; margin-top: 4px; }
    @media (max-width: 900px) { .mat-cols { grid-template-columns: minmax(0, 1fr); } }
    h2.mat-h { font-size: 15px; font-weight: 700; color: #1b1640; margin: 6px 0 10px; }
  `],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="at-head">
        <div>
          <h1 class="page-title">My air ticket</h1>
          <p class="at-desc">Your home leave ticket: what you are entitled to, what is left, when you can travel next and your requests.</p>
        </div>
        <div class="at-actions" *ngIf="d?.allocations?.length">
          <button type="button" class="at-btn primary" (click)="request()">Request a ticket</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="at-msg err" *ngIf="msg">{{ msg }}</p>
      <p class="at-muted" *ngIf="loading">Loading…</p>
      <div class="at-empty" *ngIf="!loading && !msg && !d?.employee"><b>Your login is not linked to an employee record.</b>Ask HR to link it.</div>
      <div class="at-empty" *ngIf="!loading && !msg && d?.employee && !d.allocations.length">
        <b>You have no air ticket entitlement yet.</b>HR adds it when you are eligible under the company's air ticket policy.</div>

      <div class="mat-ent" *ngFor="let a of d?.allocations || []" [attr.data-alloc]="a.id">
        <div class="top">
          <div><div class="t">{{ a.policy }}</div>
            <div class="s" data-no-translate>{{ at.ticketType(a.allowance_type) }} · {{ at.money(a.amount) }} {{ at.everyYears(a.frequency_years) }}</div></div>
          <span class="at-st" [ngClass]="at.allocClass(a.state)" data-no-translate>{{ at.allocStatus(a.state) }}</span>
        </div>
        <div class="at-tiles">
          <div class="at-tile"><div class="lbl">Entitled</div><div class="num" data-no-translate>{{ at.money(a.amount) }}</div><div class="sub" data-no-translate>{{ at.everyYears(a.frequency_years) }}</div></div>
          <div class="at-tile t3"><div class="lbl">Remaining</div><div class="num" data-no-translate>{{ at.money(a.remaining) }}</div><div class="sub" data-no-translate>{{ at.t('used {0}', [at.money(a.used)]) }}</div></div>
          <div class="at-tile t2"><div class="lbl">Next eligible</div><div class="num" data-no-translate>{{ a.eligible_now ? at.t('Now') : at.dmy(a.next_eligible) }}</div>
            <div class="sub" data-no-translate>{{ a.eligible_now ? at.t('you can request your ticket') : at.t('you can request from this date') }}</div></div>
          <div class="at-tile t4"><div class="lbl">Use it by</div><div class="num" data-no-translate>{{ a.expiry ? at.dmy(a.expiry) : '–' }}</div><div class="sub">expiry of this entitlement</div></div>
        </div>
        <div class="mat-cols" *ngIf="policy(a.policy_id) as p">
          <div>
            <div class="at-h">How it works</div>
            <ul class="at-rules" style="margin-top:8px" data-no-translate>
              <li *ngFor="let r of p.rules"><span class="at-dots"><i class="on"></i></span><span>{{ at.ruleText(r) }}</span></li>
              <li><span class="at-dots"><i class="on"></i></span><span>{{ at.travelClass(p.travel_class) }} · {{ at.probation(p.allowed_in_probation) }}</span></li>
            </ul>
          </div>
          <div>
            <div class="at-h">Applies to</div>
            <div class="at-chips" style="margin-top:8px" data-no-translate><span class="at-chip" *ngFor="let c of at.appliesTo(p); let f = first" [class.who]="f">{{ c }}</span></div>
          </div>
        </div>
      </div>

      <ng-container *ngIf="d?.employee">
        <h2 class="mat-h">My requests</h2>
        <table class="table at-table" zPlain *ngIf="d.requests.length">
          <thead><tr><th>Request</th><th>Ticket or cash · route</th><th class="nw">Travel dates</th><th class="num">Amount</th><th>Status</th><th>Approval</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of d.requests" [attr.data-req]="r.id">
              <td class="nw"><span class="at-code">{{ r.number || '–' }}</span><span class="at-sub">{{ at.dmy(r.request_date) }}</span></td>
              <td class="at-who"><b data-translate>{{ at.requestType(r.type) }}</b>  <small data-translate>{{ at.route(r) }}</small></td>
              <td class="nw">{{ r.departure ? at.dmy(r.departure) : '–' }}<span class="at-sub" *ngIf="r.return" data-translate>{{ at.t('back {0}', [at.dmy(r.return)]) }}</span></td>
              <td class="num">{{ at.money(r.amount) }}</td>
              <td><span class="at-st" [ngClass]="at.reqClass(r.status)" data-translate>{{ at.reqStatus(r) }}</span></td>
              <td><div class="at-prog"><span class="at-dots" *ngIf="at.dots(r).length"><i *ngFor="let x of at.dots(r)" [class.on]="x"></i></span><span data-translate>{{ at.progressMain(r) }}</span></div><span class="at-prog-sub" *ngIf="at.progressWho(r)" data-translate>{{ at.progressWho(r) }}</span></td>
            </tr>
          </tbody>
        </table>
        <p class="at-muted" *ngIf="!d.requests.length">You have not requested an air ticket yet.</p>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class MyAirTicketComponent implements OnInit {
  d: any = null;
  loading = true;
  msg = '';

  constructor(public at: AtUiService, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try { this.d = await this.at.get('mine'); }
    catch (e) { this.msg = this.at.err(e, this.at.t('Your air ticket could not be loaded.')); }
    this.loading = false;
    this.cd.markForCheck();
  }

  policy(id: number): any { return (this.d?.policies || []).find((p: any) => p.id === id); }
  request(): void { this.router.navigate(['/employee-dashboard'], { queryParams: { tab: 'airticketRequest' } }); }
}
