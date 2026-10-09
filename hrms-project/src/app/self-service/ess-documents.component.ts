import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ESS_BASE, EssApiService } from './ess-api.service';

/** v1.13.0 – my documents with expiry badges and authenticated download; a new copy goes to HR as a change request. */
@Component({
  selector: 'app-ess-documents',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">My documents</h1>
          <p class="es-desc">Your passport, visa, Emirates ID and other documents kept by HR, and the letters HR issued to you.</p>
        </div>
        <div class="es-actions">
          <button type="button" class="es-btn" *ngIf="policy === 'self' || policy === 'request'" (click)="router.navigate([base + '/profile'], { queryParams: { group: 'documents' } })">Add a document</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <div class="es-h">Documents</div>
      <div class="es-rows">
        <div class="es-row" *ngFor="let d of docs">
          <div class="main">
            <div class="t">{{ d.type }} · {{ d.number }}</div>
            <div class="s">Issued {{ d.issued | date:'dd MMM yyyy' }} · expires {{ d.expiry | date:'dd MMM yyyy' }}<span *ngIf="d.pending_request"> · a new copy is waiting for HR</span></div>
          </div>
          <div class="r">
            <span class="es-tag" [ngClass]="d.badge.state">{{ d.badge.label }}</span>
            <button type="button" class="es-btn sm" *ngIf="d.has_file" (click)="download(d)">Download</button>
            <button type="button" class="es-btn sm" *ngIf="(policy === 'request' || policy === 'self') && !d.pending_request" (click)="pick(d)">Upload a new copy</button>
          </div>
        </div>
        <p class="es-muted" *ngIf="!docs.length && !loading">HR has not recorded any document for you yet.</p>
      </div>
      <div class="es-h" style="margin-top:20px">Letters from HR</div>
      <div class="es-rows">
        <div class="es-row" *ngFor="let l of letters">
          <div class="main"><div class="t">{{ l.letter_label }}</div><div class="s">{{ l.reference_no }} · {{ l.decided_at | date:'dd MMM yyyy' }}</div></div>
          <div class="r"><button type="button" class="es-btn sm" (click)="letter(l)">Download PDF</button></div>
        </div>
        <p class="es-muted" *ngIf="!letters.length && !loading">No letters yet. <button type="button" class="es-link" (click)="router.navigate([base + '/letters'])">Request a letter</button></p>
      </div>
    </div>
  </div>
</div>

<div class="es-backdrop" *ngIf="upload" (click)="upload = null">
  <div class="es-modal" (click)="$event.stopPropagation()">
    <h3>Upload a new copy – {{ upload.type }}</h3>
    <p class="es-muted">HR checks the new copy and the new dates before they replace the current document.</p>
    <p class="es-msg err" *ngIf="uerr">{{ uerr }}</p>
    <div class="es-form">
      <div><label>New number (if changed)</label><input class="es-input" [value]="upload.number" (input)="upload.newNumber = $any($event.target).value"></div>
      <div><label>Issue date</label><input type="date" class="es-input" (input)="upload.issued = $any($event.target).value"></div>
      <div><label>Expiry date</label><input type="date" class="es-input" (input)="upload.expiry = $any($event.target).value"></div>
      <div class="wide"><label>File</label><input type="file" class="es-input" (change)="upload.file = $any($event.target).files?.[0] || null"></div>
      <div class="wide"><label>Note for HR (optional)</label><input class="es-input" (input)="upload.reason = $any($event.target).value" placeholder="e.g. Passport renewed in Dubai"></div>
    </div>
    <div class="foot">
      <button type="button" class="es-btn" (click)="upload = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="busy" (click)="send()">Send to HR</button>
    </div>
  </div>
</div>`,
})
export class EssDocumentsComponent implements OnInit {
  docs: any[] = []; letters: any[] = []; policy = 'request'; loading = false; busy = false; msg = ''; ok = ''; uerr = '';
  upload: any = null; base = ESS_BASE;

  constructor(private api: EssApiService, public router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try { const r: any = await this.api.get('documents/'); this.docs = r.documents || []; this.letters = r.letters || []; this.policy = r.policy; this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load your documents.'); }
    this.loading = false; this.cd.detectChanges();
  }

  pick(d: any): void { this.uerr = ''; this.upload = { ...d, file: null, newNumber: '', issued: '', expiry: '', reason: '' }; }

  async send(): Promise<void> {
    const u = this.upload;
    if (!u.file) { this.uerr = 'Choose the file of the new copy.'; return; }
    const data: any = {};
    if (u.newNumber && u.newNumber !== u.number) data.emp_doc_number = u.newNumber;
    if (u.issued) data.emp_doc_issued_date = u.issued;
    if (u.expiry) data.emp_doc_expiry_date = u.expiry;
    const fd = new FormData();
    fd.append('group', 'documents'); fd.append('action', 'update'); fd.append('record_id', String(u.id));
    fd.append('data', JSON.stringify(data)); fd.append('reason', u.reason || 'New copy');
    fd.append('files', u.file, u.file.name);
    this.busy = true;
    try { const r: any = await this.api.post('profile/change/', fd); this.ok = r.message || 'Sent to HR.'; this.upload = null; await this.load(); }
    catch (e: any) { this.uerr = EssApiService.error(e, 'The new copy could not be sent.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async download(d: any): Promise<void> {
    try { await this.api.download(`documents/${d.id}/file/`, `${d.type}-${d.number}`, true); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The file could not be downloaded.'); this.cd.detectChanges(); }
  }

  async letter(l: any): Promise<void> {
    try { await this.api.download(`letters/${l.id}/pdf/`, `${l.reference_no}.pdf`); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The letter could not be downloaded.'); this.cd.detectChanges(); }
  }
}
