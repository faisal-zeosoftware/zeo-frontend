// v1.62.0 print – a document printed with the company's design (any screen can link here: /main-sidebar/print-view/<doc type>/<id>)
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { PrintTemplatesApi } from './print-templates.service';

@Component({
  selector: 'app-print-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './print-templates.css'],
  template: `
<div class="container pt-view" data-no-help>
  <div class="pt-edhead">
    <button class="lp-btn" (click)="back()"><mat-icon class="z-mirror" aria-hidden="true">arrow_back</mat-icon>{{ 'Back' | t }}</button>
    <h1 class="page-title">{{ title | t }}</h1>
    <span class="pt-grow"></span>
    <a class="lp-btn primary" *ngIf="url" [href]="raw" [download]="file"><mat-icon aria-hidden="true">download</mat-icon>{{ 'Download PDF' | t }}</a>
  </div>
  <div class="lp-msg err" *ngIf="msg" role="alert">{{ msg }}</div>
  <p class="lp-muted" *ngIf="!url && !msg">{{ 'Making the PDF…' | t }}</p>
  <iframe *ngIf="url" class="pt-frame" [src]="url" [title]="title | t"></iframe>
</div>`,
})
export class PrintViewComponent implements OnInit, OnDestroy {
  url: SafeResourceUrl | null = null;
  raw = ''; file = 'document.pdf'; msg = ''; title = 'Document';

  constructor(private api: PrintTemplatesApi, private route: ActivatedRoute, private san: DomSanitizer, private cd: ChangeDetectorRef, private loc: Location) {}

  ngOnInit(): void {
    const dt = this.route.snapshot.paramMap.get('docType') || '', id = this.route.snapshot.paramMap.get('id') || '';
    this.title = ({ payslip: 'Payslip', final_settlement: 'Final settlement statement', salary_certificate: 'Salary certificate', experience_letter: 'Experience / employment letter',
                    noc: 'No objection certificate (NOC)', salary_transfer: 'Salary transfer letter', offer_letter: 'Offer letter', warning_letter: 'Warning letter',
                    loan_agreement: 'Loan agreement and schedule', expense_claim: 'Expense claim', leave_approval: 'Leave approval letter', asset_handover: 'Asset handover form' } as any)[dt] || 'Document';
    this.file = `${i18nT(this.title)} ${id}.pdf`;
    this.api.print(dt, id).subscribe({
      next: b => { this.raw = URL.createObjectURL(b); this.url = this.san.bypassSecurityTrustResourceUrl(this.raw); this.cd.markForCheck(); },
      error: async e => {
        let m = '';
        try { m = JSON.parse(await (e.error as Blob).text()).detail; } catch { m = ''; }
        this.msg = m || i18nT('The document could not be printed.'); this.cd.markForCheck();
      },
    });
  }

  ngOnDestroy(): void { if (this.raw) { URL.revokeObjectURL(this.raw); } }

  back(): void { this.loc.back(); }
}
