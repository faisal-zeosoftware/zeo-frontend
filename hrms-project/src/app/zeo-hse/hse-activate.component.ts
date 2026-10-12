import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HSE_BASE, HseApiService } from './hse-api.service';

/** v1.17.0 – HSE activation. The industry is pre-set from the company master; the HSE manager confirms it or changes it
 *  for HSE only. Until HSE is activated the other HSE pages are closed. */
@Component({
  selector: 'app-hse-activate',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['../expense/expense.css', './hse.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">{{ a && !a.can_activate && !a.activated ? 'HSE' : 'Activate HSE' }}</h1>
        <p class="ex-desc" *ngIf="!a || a.can_activate || a.activated">HSE fills its permit types, checklists, hazards and approval rules from an industry pack. Everything it adds is marked "to review" before use.</p></div></div>
    </div>
    <div class="com_list mt-4" *ngIf="a">
      <p class="hs-note err" *ngIf="msg">{{ msg }}</p>

      <ng-container *ngIf="a.activated">
        <div class="hs-note ok">HSE is active – industry <b>{{ a.industry_label }}</b>{{ a.activated_by ? ', activated by ' + a.activated_by : '' }}.</div>
        <button type="button" class="ex-btn primary" (click)="go(['home'])">Open HSE</button>
      </ng-container>

      <ng-container *ngIf="!a.activated && !a.can_activate">
        <div class="hs-note info">HSE is not activated in this company yet. Your HSE manager or an administrator activates it and chooses its industry.</div>
      </ng-container>

      <ng-container *ngIf="!a.activated && a.can_activate">
        <div class="hs-card" style="max-width:860px">
          <h3>Industry for HSE</h3>
          <p style="font-size:14px;margin:6px 0 4px">Company industry (company master): <b>{{ a.company_industry_label || 'not set' }}</b></p>
          <p style="font-size:14px;margin:0 0 12px">HSE will use the <b>{{ label(a.suggested) }}</b> pack{{ a.suggested === 'general' ? ' – there is no HSE pack for this industry' : '' }}.</p>
          <ng-container *ngIf="!changing">
            <p style="font-size:15px;font-weight:600;margin:14px 0 10px">Do you want to change the industry for HSE?</p>
            <div class="hs-acts">
              <button type="button" class="ex-btn primary" [disabled]="busy" (click)="activate(a.suggested)">No – use {{ label(a.suggested) }}</button>
              <button type="button" class="ex-btn" (click)="changing = true; pick = a.suggested">Yes, change it</button>
            </div>
          </ng-container>
        </div>

        <ng-container *ngIf="changing">
          <div class="hs-section">Choose the industry for HSE only (the company master does not change)</div>
          <div class="hs-board">
            <div class="pc" *ngFor="let p of a.packs" (click)="pick = p.code" [style.border-left-color]="pick === p.code ? '#5b4fe0' : '#cbd5e1'"
                 [style.box-shadow]="pick === p.code ? '0 0 0 3px rgba(91,79,224,.18)' : null" role="radio" [attr.aria-checked]="pick === p.code" tabindex="0" (keyup.enter)="pick = p.code">
              <b>{{ p.label }}{{ p.code === a.suggested ? ' · company industry' : '' }}</b><span class="hs-muted">{{ p.description }}</span>
              <div class="hs-muted" style="margin-top:6px">Permits: {{ p.permit_types.join(', ') || '–' }}</div>
              <div class="hs-muted">{{ p.forms }} forms · {{ p.hazards }} hazards · {{ p.kpis }} KPIs</div>
            </div>
          </div>
          <div class="hs-acts" style="margin-top:14px">
            <button type="button" class="ex-btn primary" [disabled]="busy || !pick" (click)="activate(pick)">Activate HSE with {{ label(pick) }}</button>
            <button type="button" class="ex-btn" (click)="changing = false">Back</button>
          </div>
        </ng-container>
        <p class="hs-muted" style="margin-top:14px">Later you can add more packs in Setup › Industry pack; nothing you change is ever overwritten.</p>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class HseActivateComponent implements OnInit {
  a: any = null;
  changing = false;
  pick = '';
  busy = false;
  msg = '';

  constructor(private api: HseApiService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    try { this.a = await this.api.get('activate/'); } catch (e) { this.msg = HseApiService.error(e); }
  }

  label(code: string): string { return this.a?.packs?.find((p: any) => p.code === code)?.label || 'General'; }
  go(p: any[]): void { this.router.navigate([HSE_BASE, ...p]); }

  async activate(code: string): Promise<void> {
    if (!confirm(`Activate HSE with the ${this.label(code)} pack?`)) return;
    this.busy = true; this.msg = '';
    try {
      this.a = await this.api.post('activate/', { industry: code });
      this.api.clear();
      this.router.navigate([HSE_BASE, 'setup', 'pack']);
    } catch (e) { this.msg = HseApiService.error(e); }
    this.busy = false;
  }
}
