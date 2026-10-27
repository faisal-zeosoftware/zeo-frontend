// v1.62.0 print – preview of a print template with a chosen record (pages as images) and the PDF
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime } from 'rxjs';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { PrintTemplatesApi, PtPreview, PtTemplate } from './print-templates.service';

@Component({
  selector: 'app-pt-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './print-templates.css'],
  template: `
<div class="lp-modal-back" (click)="closed.emit()">
  <div class="lp-modal pt-prev" role="dialog" aria-modal="true" [attr.aria-label]="('Preview' | t) + ' ' + template.name" (click)="$event.stopPropagation()">
    <header>
      <h2>{{ 'Preview' | t }} – {{ template.name | t }}</h2>
      <span class="pt-grow"></span>
      <button class="lp-btn" (click)="pdf()" [disabled]="busy"><mat-icon aria-hidden="true">picture_as_pdf</mat-icon>{{ 'Open the PDF' | t }}</button>
      <button class="lp-x" (click)="closed.emit()" [attr.aria-label]="'Close' | t">×</button>
    </header>
    <div class="pt-prevbar">
      <label>{{ 'Show with' | t }}
        <select [(ngModel)]="recordId" (ngModelChange)="run()" [attr.aria-label]="'Record' | t">
          <option [ngValue]="null">{{ 'Sample data' | t }}</option>
          <option *ngFor="let r of records" [ngValue]="r.id">{{ r.label }}</option>
        </select>
      </label>
      <input type="search" [placeholder]="'Find an employee or number…' | t" (input)="search$.next($any($event.target).value)" [attr.aria-label]="'Find a record' | t">
      <span class="lp-muted" *ngIf="result?.page_count">{{ result?.page_count }} {{ (result?.page_count === 1 ? 'page' : 'pages') | t }}</span>
    </div>
    <div class="pt-pages" aria-live="polite">
      <p class="lp-muted" *ngIf="busy">{{ 'Making the preview…' | t }}</p>
      <div class="lp-msg err" *ngIf="result && !result.ok">{{ result.error }}<span *ngIf="result.line"> ({{ 'line' | t }} {{ result.line }})</span></div>
      <img *ngFor="let p of result?.pages; let i = index" [src]="'data:image/png;base64,' + p" [alt]="('Page' | t) + ' ' + (i + 1)">
    </div>
  </div>
</div>`,
})
export class PtPreviewDialogComponent implements OnInit {
  @Input() template!: PtTemplate;
  @Output() closed = new EventEmitter<void>();
  records: { id: number; label: string }[] = [];
  recordId: number | null = null;
  result: PtPreview | null = null;
  busy = false;
  search$ = new Subject<string>();

  constructor(private api: PrintTemplatesApi, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadRecords('');
    this.search$.pipe(debounceTime(350)).subscribe(q => this.loadRecords(q));
    this.run();
  }

  loadRecords(q: string): void {
    this.api.records(this.template.doc_type, q).subscribe({ next: r => { this.records = r; this.cd.markForCheck(); }, error: () => {} });
  }

  body(): any { return { template_id: this.template.id, record_id: this.recordId, width: 820 }; }

  run(): void {
    this.busy = true;
    this.api.preview(this.body()).subscribe({
      next: r => { this.result = r; this.busy = false; this.cd.markForCheck(); },
      error: e => { this.result = { ok: false, error: e?.error?.detail || i18nT('The preview could not be made.') }; this.busy = false; this.cd.markForCheck(); },
    });
  }

  pdf(): void {
    this.api.previewPdf(this.body()).subscribe({
      next: b => { if (b.type !== 'application/pdf') { return; } window.open(URL.createObjectURL(b), '_blank'); },
    });
  }
}
