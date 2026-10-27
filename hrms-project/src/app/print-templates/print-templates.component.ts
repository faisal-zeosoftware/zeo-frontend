// v1.62.0 print – Settings › Print templates: a gallery of designs per document, the company branding and the defaults
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { LANG_LABEL, PrintTemplatesApi, PtBranding, PtDocType, PtMeta, PtTemplate } from './print-templates.service';
import { PtPreviewDialogComponent } from './print-preview-dialog.component';

/**
 * Settings › Print templates (company administrators and the right "Design the printed documents"):
 *  - Designs: every printed document (payslip, final settlement, HR letters …) with at least three sample designs and the
 *    company's own copies; Preview with a record, Set as default (all branches or one branch, any language or one), Make a copy,
 *    Edit, Rename, Delete own copies; samples are read only and can be reset.
 *  - Branding: logo, colours, fonts, letterhead texts, stamp and signature – used by every design.
 *  - Defaults: which design each document uses.
 * Route: /main-sidebar/settings/print-templates (PRINT_TEMPLATES_ROUTES in the settings children).
 */
@Component({
  selector: 'app-print-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, PtPreviewDialogComponent, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './print-templates.css'],
  template: `
<div class="container pt-wrap" data-no-help>
  <div class="lp-head">
    <div>
      <h1 class="page-title">{{ 'Print templates' | t }}</h1>
      <p class="lp-desc">{{ 'Choose how the payslip and every other printed document looks. Each document has ready-made designs; set one as the default, or make a copy and change it – blocks, colours, fonts or the full HTML.' | t }}</p>
    </div>
  </div>
  <div class="lp-tabs" role="tablist">
    <button role="tab" [class.on]="tab === 'designs'" [attr.aria-selected]="tab === 'designs'" (click)="setTab('designs')">{{ 'Designs' | t }}</button>
    <button role="tab" [class.on]="tab === 'branding'" [attr.aria-selected]="tab === 'branding'" (click)="setTab('branding')">{{ 'Branding' | t }}</button>
    <button role="tab" [class.on]="tab === 'defaults'" [attr.aria-selected]="tab === 'defaults'" (click)="setTab('defaults')">{{ 'Defaults' | t }}</button>
  </div>
  <div class="pt-body">
    <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
    <div class="lp-msg err" *ngIf="meta && !meta.engine" role="alert">{{ 'The PDF engine (WeasyPrint) is not installed on this server – the old PDFs are printed until it is installed.' | t }}</div>
    <p class="lp-muted" *ngIf="!meta && !msg">{{ 'Loading…' | t }}</p>

    <!-- ===================================================== designs -->
    <div class="pt-designs" *ngIf="meta && tab === 'designs'">
      <nav class="pt-types" [attr.aria-label]="'Documents' | t">
        <button *ngFor="let d of meta.doc_types" class="pt-type" [class.on]="d.key === docType" (click)="pick(d.key)" [attr.aria-current]="d.key === docType ? 'true' : null">
          <mat-icon aria-hidden="true">{{ d.icon }}</mat-icon>
          <span><b>{{ d.label | t }}</b><small>{{ d.default ? (('Default' | t) + ': ' + (d.default.name | t)) : ('Old layout (no default yet)' | t) }}</small></span>
          <em class="pt-count">{{ d.samples + d.own }}</em>
        </button>
      </nav>
      <section class="pt-gallery" [attr.aria-label]="current?.label">
        <header class="pt-ghead">
          <div>
            <h2>{{ current?.label | t }} <span class="pt-ar">{{ current?.label_ar }}</span></h2>
            <p>{{ 'Samples of ZEO are read only – make a copy to change one. The default is used for every print of this document.' | t }}</p>
          </div>
        </header>
        <p class="lp-muted" *ngIf="loading">{{ 'Loading the designs…' | t }}</p>
        <div class="pt-grid">
          <article class="pt-card" *ngFor="let t of templates" [class.def]="isDefault(t)" [attr.data-tid]="t.id">
            <button class="pt-thumb" (click)="preview(t)" [attr.aria-label]="('Preview' | t) + ' ' + t.name">
              <img *ngIf="thumbs[t.id]" [src]="thumbs[t.id]" [alt]="t.name">
              <span class="pt-spin" *ngIf="!thumbs[t.id]">{{ 'Drawing…' | t }}</span>
              <span class="pt-flag" *ngIf="isDefault(t)"><mat-icon aria-hidden="true">check_circle</mat-icon>{{ 'Default' | t }}</span>
            </button>
            <div class="pt-info">
              <div class="pt-name">
                <b *ngIf="renaming !== t.id">{{ t.name | t }}</b>
                <input *ngIf="renaming === t.id" [(ngModel)]="newName" (keydown.enter)="rename(t)" (keydown.escape)="renaming = 0" [attr.aria-label]="'Name' | t" maxlength="120">
              </div>
              <div class="pt-tags">
                <span class="lp-badge" [class.own]="!t.is_sample">{{ (t.is_sample ? 'Sample' : 'Your copy') | t }}</span>
                <span class="lp-chip">{{ langLabel(t.language) | t }}</span>
                <span class="lp-chip" *ngIf="t.mode === 'html'">HTML</span>
                <span class="lp-chip" *ngFor="let d of extraDefaults(t)">{{ defaultLabel(d) }}</span>
              </div>
              <p class="pt-desc">{{ t.description | t }}</p>
              <div class="pt-acts">
                <button class="lp-btn" (click)="preview(t)"><mat-icon aria-hidden="true">visibility</mat-icon>{{ 'Preview' | t }}</button>
                <button class="lp-btn primary" *ngIf="!isDefault(t)" (click)="askDefault(t)"><mat-icon aria-hidden="true">star</mat-icon>{{ 'Set as default' | t }}</button>
                <button class="lp-btn" *ngIf="isDefault(t)" (click)="askDefault(t)"><mat-icon aria-hidden="true">tune</mat-icon>{{ 'Default for…' | t }}</button>
                <button class="lp-btn" (click)="copy(t)"><mat-icon aria-hidden="true">content_copy</mat-icon>{{ 'Make a copy' | t }}</button>
                <a class="lp-btn" *ngIf="!t.is_sample" [routerLink]="['/main-sidebar/settings/print-templates', t.id]"><mat-icon aria-hidden="true">edit</mat-icon>{{ 'Edit' | t }}</a>
                <a class="lp-btn" *ngIf="t.is_sample" [routerLink]="['/main-sidebar/settings/print-templates', t.id]"><mat-icon aria-hidden="true">code</mat-icon>{{ 'View' | t }}</a>
                <button class="lp-btn" *ngIf="!t.is_sample && renaming !== t.id" (click)="startRename(t)">{{ 'Rename' | t }}</button>
                <button class="lp-btn" *ngIf="renaming === t.id" (click)="rename(t)">{{ 'Save name' | t }}</button>
                <button class="lp-btn danger" *ngIf="!t.is_sample" (click)="remove(t)">{{ 'Delete' | t }}</button>
                <button class="lp-btn" *ngIf="t.is_sample" (click)="reset(t)" [title]="'Back to the design of ZEO' | t">{{ 'Reset' | t }}</button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- ===================================================== branding -->
    <form class="pt-brand" *ngIf="meta && tab === 'branding' && brand" (ngSubmit)="saveBrand()">
      <div class="pt-bcol">
        <h2>{{ 'Logo' | t }}</h2>
        <div class="pt-radio">
          <label><input type="radio" name="ls" value="auto" [(ngModel)]="brand.logo_source"> {{ 'Branch logo, else the company logo' | t }}</label>
          <label><input type="radio" name="ls" value="company" [(ngModel)]="brand.logo_source"> {{ 'Company logo' | t }}</label>
          <label><input type="radio" name="ls" value="own" [(ngModel)]="brand.logo_source" [disabled]="!brand.logo"> {{ 'The logo uploaded here' | t }}</label>
        </div>
        <div class="pt-files">
          <div class="pt-file" *ngFor="let k of fileKinds">
            <span class="pt-fimg"><img *ngIf="files[k]" [src]="files[k]" [alt]="k"><mat-icon *ngIf="!files[k]" aria-hidden="true">image</mat-icon></span>
            <span><b>{{ fileLabel(k) | t }}</b><small>{{ 'PNG or JPEG, 2 MB at most' | t }}</small></span>
            <label class="lp-btn">{{ 'Upload' | t }}<input type="file" accept="image/png,image/jpeg" (change)="upload(k, $event)" hidden></label>
            <button type="button" class="lp-btn danger" *ngIf="hasFile(k)" (click)="removeFile(k)">{{ 'Remove' | t }}</button>
          </div>
        </div>
        <p class="lp-muted">{{ 'Without a stamp or signature here, the ones of Organisation settings are used.' | t }}</p>
        <div class="lp-form">
          <label>{{ 'Logo position' | t }}
            <select name="lp" [(ngModel)]="brand.logo_position"><option value="left">{{ 'Left' | t }}</option><option value="center">{{ 'Centre' | t }}</option><option value="right">{{ 'Right' | t }}</option></select></label>
          <label>{{ 'Main colour' | t }}<input type="color" name="pc" [(ngModel)]="brand.primary_color"></label>
          <label>{{ 'Accent colour' | t }}<input type="color" name="ac" [(ngModel)]="brand.accent_color"></label>
          <label>{{ 'Text colour' | t }}<input type="color" name="tc" [(ngModel)]="brand.text_color"></label>
          <label>{{ 'Font' | t }}<select name="f" [(ngModel)]="brand.font"><option *ngFor="let f of meta.fonts" [value]="f.key">{{ f.label }}</option></select></label>
          <label>{{ 'Arabic font' | t }}<select name="fa" [(ngModel)]="brand.font_arabic"><option *ngFor="let f of arabicFonts()" [value]="f.key">{{ f.label }}</option></select></label>
        </div>
      </div>
      <div class="pt-bcol">
        <h2>{{ 'Letterhead' | t }}</h2>
        <div class="lp-form one">
          <label>{{ 'Header line(s) under the company name' | t }}<textarea name="ht" [(ngModel)]="brand.header_text" rows="2"></textarea></label>
          <label>{{ 'Footer of every page' | t }}<textarea name="ft" [(ngModel)]="brand.footer_text" rows="2" [placeholder]="'Empty = company name and address' | t"></textarea></label>
          <label>{{ 'Address' | t }}<input name="ad" [(ngModel)]="brand.address" [placeholder]="'Empty = the address of the branch' | t"></label>
          <label>TRN<input name="trn" [(ngModel)]="brand.trn" [placeholder]="'Empty = the TRN of Organisation settings' | t"></label>
        </div>
        <div class="pt-checks">
          <label><input type="checkbox" name="ss" [(ngModel)]="brand.show_stamp"> {{ 'Show the company stamp' | t }}</label>
          <label><input type="checkbox" name="sg" [(ngModel)]="brand.show_signature"> {{ 'Show the authorised signature' | t }}</label>
          <label><input type="checkbox" name="sw" [(ngModel)]="brand.show_watermark"> {{ 'Watermark' | t }} <input class="pt-wm" name="wt" [(ngModel)]="brand.watermark_text" [disabled]="!brand.show_watermark" [attr.aria-label]="'Watermark text' | t"></label>
        </div>
        <div class="lp-foot"><button class="lp-btn primary" type="submit" [disabled]="busy">{{ 'Save branding' | t }}</button></div>
      </div>
    </form>

    <!-- ===================================================== defaults -->
    <div class="pt-defs" *ngIf="meta && tab === 'defaults'">
      <p class="lp-muted">{{ 'A default for one branch or one language comes before the default for all. Without a default the document prints with the old layout.' | t }}</p>
      <div class="lp-scroll">
        <table class="lp-lines">
          <thead><tr><th>{{ 'Document' | t }}</th><th>{{ 'Branch' | t }}</th><th>{{ 'Language' | t }}</th><th>{{ 'Design' | t }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let d of defaults">
              <td class="name">{{ docLabel(d.doc_type) | t }}</td><td>{{ branchName(d.branch_id) }}</td><td>{{ (d.language ? langLabel(d.language) : 'Any') | t }}</td>
              <td>{{ d.template | t }}</td>
              <td><button class="lp-btn danger" (click)="removeDefault(d)">{{ 'Remove' | t }}</button></td>
            </tr>
            <tr *ngIf="!defaults.length"><td colspan="5" class="lp-muted">{{ 'No defaults yet.' | t }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- set as default -->
  <div class="lp-modal-back" *ngIf="defFor" (click)="defFor = null">
    <div class="lp-modal pt-small" role="dialog" aria-modal="true" [attr.aria-label]="'Set as default' | t" (click)="$event.stopPropagation()">
      <header><h2>{{ 'Set as default' | t }} – {{ defFor.name | t }}</h2></header>
      <div class="pt-mbody">
        <div class="lp-form one">
          <label>{{ 'Branch' | t }}<select [(ngModel)]="defBranch"><option [ngValue]="null">{{ 'All branches' | t }}</option><option *ngFor="let b of meta?.branches" [ngValue]="b.id">{{ b.name }}</option></select></label>
          <label>{{ 'Language of the document' | t }}<select [(ngModel)]="defLang"><option value="">{{ 'Any language' | t }}</option><option value="en">{{ 'English' | t }}</option><option value="ar">{{ 'Arabic' | t }}</option></select></label>
        </div>
      </div>
      <div class="lp-foot pt-mfoot"><button class="lp-btn" (click)="defFor = null">{{ 'Cancel' | t }}</button><button class="lp-btn primary" (click)="setDefault()">{{ 'Set as default' | t }}</button></div>
    </div>
  </div>

  <app-pt-preview *ngIf="previewing" [template]="previewing" (closed)="previewing = null"></app-pt-preview>
</div>`,
})
export class PrintTemplatesComponent implements OnInit, OnDestroy {
  meta: PtMeta | null = null;
  tab: 'designs' | 'branding' | 'defaults' = 'designs';
  docType = 'payslip';
  templates: PtTemplate[] = [];
  thumbs: Record<number, SafeUrl> = {};
  private urls: string[] = [];
  loading = false;
  msg = ''; err = false; busy = false;
  renaming = 0; newName = '';
  defFor: PtTemplate | null = null; defBranch: number | null = null; defLang = '';
  previewing: PtTemplate | null = null;
  brand: PtBranding | null = null;
  files: Record<string, SafeUrl | null> = {};
  fileKinds = ['logo', 'stamp', 'signature'];
  defaults: any[] = [];

  constructor(private api: PrintTemplatesApi, private cd: ChangeDetectorRef, private san: DomSanitizer, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.docType = q.get('doc') || 'payslip';
    this.tab = (q.get('tab') as any) || 'designs';
    this.api.meta().subscribe({
      next: m => { this.meta = m; if (!m.doc_types.some(d => d.key === this.docType)) { this.docType = 'payslip'; } this.setTab(this.tab); },
      error: e => this.fail(e),
    });
  }

  ngOnDestroy(): void { this.urls.forEach(u => URL.revokeObjectURL(u)); }

  get current(): PtDocType | undefined { return this.meta?.doc_types.find(d => d.key === this.docType); }

  setTab(t: 'designs' | 'branding' | 'defaults'): void {
    this.tab = t; this.msg = '';
    if (t === 'designs') { this.load(); }
    if (t === 'branding') { this.loadBrand(); }
    if (t === 'defaults') { this.api.defaults().subscribe({ next: d => { this.defaults = d; this.cd.markForCheck(); }, error: e => this.fail(e) }); }
    this.router.navigate([], { queryParams: { tab: t === 'designs' ? null : t, doc: t === 'designs' && this.docType !== 'payslip' ? this.docType : null }, replaceUrl: true });
  }

  pick(k: string): void { this.docType = k; this.msg = ''; this.setTab('designs'); }

  load(): void {
    this.loading = true;
    this.api.list(this.docType).subscribe({
      next: ts => { this.templates = ts; this.loading = false; ts.forEach(t => this.loadThumb(t)); this.cd.markForCheck(); },
      error: e => { this.loading = false; this.fail(e); },
    });
  }

  loadThumb(t: PtTemplate): void {
    this.api.thumb(t.id, t.version + '-' + (this.brand?.updated_at || '')).subscribe({
      next: b => { const u = URL.createObjectURL(b); this.urls.push(u); this.thumbs[t.id] = this.san.bypassSecurityTrustUrl(u); this.cd.markForCheck(); },
    });
  }

  isDefault(t: PtTemplate): boolean { return t.defaults.some(d => d.branch_id === null && d.language === ''); }
  extraDefaults(t: PtTemplate) { return t.defaults.filter(d => !(d.branch_id === null && d.language === '')); }
  defaultLabel(d: { branch_id: number | null; language: string }): string {
    return i18nT('Default') + ': ' + [d.branch_id ? this.branchName(d.branch_id) : '', d.language ? i18nT(this.langLabel(d.language)) : ''].filter(x => x).join(' · ');
  }
  langLabel(l: string): string { return LANG_LABEL[l] || l; }
  branchName(id: number | null): string { return id ? (this.meta?.branches.find(b => b.id === id)?.name || '#' + id) : i18nT('All branches'); }
  docLabel(k: string): string { return this.meta?.doc_types.find(d => d.key === k)?.label || k; }

  preview(t: PtTemplate): void { this.previewing = t; }

  askDefault(t: PtTemplate): void { this.defFor = t; this.defBranch = null; this.defLang = ''; }

  setDefault(): void {
    const t = this.defFor!;
    this.api.setDefault({ template_id: t.id, doc_type: t.doc_type, branch_id: this.defBranch, language: this.defLang }).subscribe({
      next: () => { this.defFor = null; this.ok(i18nT('"{0}" is now the default.', [i18nT(t.name)])); this.refreshMeta(); this.load(); },
      error: e => this.fail(e),
    });
  }

  copy(t: PtTemplate): void {
    this.api.copy(t.id).subscribe({
      next: c => { this.ok(i18nT('Copy made – change it in the editor.')); this.router.navigate(['/main-sidebar/settings/print-templates', c.id]); },
      error: e => this.fail(e),
    });
  }

  startRename(t: PtTemplate): void { this.renaming = t.id; this.newName = t.name; }

  rename(t: PtTemplate): void {
    const n = (this.newName || '').trim();
    if (!n) { return; }
    this.api.save(t.id, { name: n, note: 'Renamed' } as any).subscribe({ next: () => { this.renaming = 0; this.load(); this.refreshMeta(); }, error: e => this.fail(e) });
  }

  remove(t: PtTemplate): void {
    if (!confirm(i18nT('Delete "{0}"? Documents that use it as the default go back to the old layout.', [t.name]))) { return; }
    this.api.remove(t.id).subscribe({ next: () => { this.ok(i18nT('Deleted.')); this.load(); this.refreshMeta(); }, error: e => this.fail(e) });
  }

  reset(t: PtTemplate): void {
    if (!confirm(i18nT('Bring this sample back to the design of ZEO?'))) { return; }
    this.api.reset(t.id).subscribe({ next: () => { this.ok(i18nT('The sample is back to the design of ZEO.')); this.load(); }, error: e => this.fail(e) });
  }

  refreshMeta(): void { this.api.meta().subscribe(m => { this.meta = m; this.cd.markForCheck(); }); }

  // ---------------------------------------------------------------- branding
  loadBrand(): void {
    this.api.branding().subscribe({
      next: b => { this.brand = b; this.fileKinds.forEach(k => this.loadFile(k)); this.cd.markForCheck(); },
      error: e => this.fail(e),
    });
  }

  arabicFonts() { return (this.meta?.fonts || []).filter(f => f.arabic); }
  hasFile(k: string): boolean { return !!(this.brand as any)?.[k]; }
  fileLabel(k: string): string { return ({ logo: 'Logo', stamp: 'Company stamp', signature: 'Authorised signature' } as any)[k]; }

  loadFile(k: string): void {
    this.files[k] = null;
    if (!this.hasFile(k)) { return; }
    this.api.brandImage(k, this.brand?.updated_at || '').subscribe({
      next: b => { const u = URL.createObjectURL(b); this.urls.push(u); this.files[k] = this.san.bypassSecurityTrustUrl(u); this.cd.markForCheck(); },
    });
  }

  upload(k: string, ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) { return; }
    this.api.upload(k, f).subscribe({ next: b => { this.brand = b; this.loadFile(k); this.ok(i18nT('Uploaded.')); }, error: e => this.fail(e) });
  }

  removeFile(k: string): void {
    this.api.removeFile(k).subscribe({ next: b => { this.brand = b; this.files[k] = null; this.cd.markForCheck(); }, error: e => this.fail(e) });
  }

  saveBrand(): void {
    if (!this.brand) { return; }
    this.busy = true;
    const { logo, stamp, signature, updated_at, ...body } = this.brand;
    this.api.saveBranding(body).subscribe({
      next: b => { this.brand = b; this.busy = false; this.thumbs = {}; this.ok(i18nT('Branding saved – every design uses it.')); },
      error: e => { this.busy = false; this.fail(e); },
    });
  }

  // ---------------------------------------------------------------- defaults
  removeDefault(d: any): void {
    this.api.removeDefault(d.id).subscribe({ next: () => { this.defaults = this.defaults.filter(x => x.id !== d.id); this.refreshMeta(); this.cd.markForCheck(); }, error: e => this.fail(e) });
  }

  private ok(m: string): void { this.msg = m; this.err = false; this.cd.markForCheck(); }
  private fail(e: any): void { this.msg = e?.error?.detail || e?.message || i18nT('Something went wrong.'); this.err = true; this.cd.markForCheck(); }
}
