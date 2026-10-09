import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EssApiService, money } from './ess-api.service';

/** v1.13.0 – my approved / paid payslips, PDF download through the authenticated API, year-to-date totals. */
@Component({
  selector: 'app-ess-payslips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">My payslips</h1>
          <p class="es-desc">Payslips appear here once payroll approves them. Download the PDF for your records or a bank.</p>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <div class="es-tiles" *ngIf="d">
        <div class="es-tile"><div class="lbl">Gross {{ d.ytd?.year }} so far</div><div class="num" style="font-size:19px">{{ m(d.ytd?.gross) }}</div><div class="sub">{{ d.ytd?.payslips }} payslip(s)</div></div>
        <div class="es-tile t2"><div class="lbl">Deductions {{ d.ytd?.year }}</div><div class="num" style="font-size:19px">{{ m(d.ytd?.deductions) }}</div></div>
        <div class="es-tile t3"><div class="lbl">Net paid {{ d.ytd?.year }}</div><div class="num" style="font-size:19px">{{ m(d.ytd?.net) }}</div></div>
        <div class="es-tile t5"><div class="lbl">Next payslip</div><div class="num" style="font-size:17px">{{ d.next?.period }}</div><div class="sub">{{ d.next?.state === 'being prepared' ? 'Payroll is being prepared' : 'Not started yet' }}</div></div>
      </div>
      <div class="es-actions" style="margin-bottom:10px">
        <label class="es-label" style="margin:0;align-self:center">Year</label>
        <select class="es-input" style="max-width:120px" [(ngModel)]="year" (ngModelChange)="load()">
          <option *ngFor="let y of years" [ngValue]="y">{{ y }}</option>
        </select>
      </div>
      <div class="es-cols">
        <div class="es-rows">
          <div class="es-row click" *ngFor="let p of d?.payslips" [class.on]="sel?.id === p.id" (click)="open(p)">
            <div class="main"><div class="t">{{ p.period }}</div><div class="s">Gross {{ m(p.gross) }} · deductions {{ m(p.deductions) }} · {{ p.days_worked }}/{{ p.working_days }} days</div></div>
            <div class="r"><span class="es-money">{{ m(p.net) }}</span><button type="button" class="es-btn sm" (click)="pdf(p); $event.stopPropagation()">PDF</button></div>
          </div>
          <p class="es-muted" *ngIf="d && !d.payslips.length">No approved payslips yet.</p>
        </div>
        <div class="es-panel" *ngIf="sel">
          <div class="es-h">{{ sel.period }} <button type="button" class="es-btn sm" (click)="pdf(sel)">Download PDF</button></div>
          <table class="es-table" zPlain>
            <tr *ngFor="let l of sel.lines"><td>{{ l.name }}</td><td class="es-muted">{{ l.type }}</td><td style="text-align:right">{{ m(l.amount) }}</td></tr>
            <tr><td><b>Gross</b></td><td></td><td style="text-align:right"><b>{{ m(sel.gross) }}</b></td></tr>
            <tr><td><b>Deductions</b></td><td></td><td style="text-align:right"><b>{{ m(sel.deductions) }}</b></td></tr>
            <tr><td><b>Net pay</b></td><td></td><td style="text-align:right"><b>{{ m(sel.net) }}</b></td></tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class EssPayslipsComponent implements OnInit {
  d: any = null; sel: any = null; msg = ''; m = money;
  year = new Date().getFullYear(); years = [0, 1, 2, 3].map(i => new Date().getFullYear() - i);

  constructor(private api: EssApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try { this.d = await this.api.get('payslips/', { year: this.year }); this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load your payslips.'); }
    this.cd.detectChanges();
  }

  async open(p: any): Promise<void> {
    try { this.sel = await this.api.get(`payslips/${p.id}/`); } catch (e: any) { this.msg = EssApiService.error(e); }
    this.cd.detectChanges();
  }

  async pdf(p: any): Promise<void> {
    try { await this.api.download(`payslips/${p.id}/pdf/`, `payslip-${p.year}-${String(p.month).padStart(2, '0')}.pdf`); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The payslip PDF could not be downloaded.'); this.cd.detectChanges(); }
  }
}
