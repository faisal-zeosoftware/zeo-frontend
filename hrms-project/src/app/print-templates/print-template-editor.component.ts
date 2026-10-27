// v1.62.0 print – the print template editor: blocks and style (block editor) or the full HTML / CSS, with a live preview and versions
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { LANG_LABEL, PrintTemplatesApi, PtMeta, PtPlaceholder, PtPreview, PtSettings, PtTemplate, PtVersion } from './print-templates.service';

@Component({
  selector: 'app-print-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './print-templates.css'],
  template: `
<div class="container pt-ed" data-no-help *ngIf="t">
  <div class="pt-edhead">
    <a class="lp-btn" [routerLink]="['/main-sidebar/settings/print-templates']" [queryParams]="{ doc: t.doc_type }"><mat-icon class="z-mirror" aria-hidden="true">arrow_back</mat-icon>{{ 'Print templates' | t }}</a>
    <div class="pt-edtitle">
      <input *ngIf="!t.is_sample" [(ngModel)]="t.name" (ngModelChange)="dirty = true" [attr.aria-label]="'Name' | t" maxlength="120">
      <h1 *ngIf="t.is_sample">{{ t.name | t }}</h1>
      <small>{{ docLabel() | t }} · {{ 'Version' | t }} {{ t.version }} · {{ (t.mode === 'html' ? 'HTML / CSS' : 'Block editor') | t }}</small>
    </div>
    <span class="pt-grow"></span>
    <button class="lp-btn" (click)="showVersions()" *ngIf="!t.is_sample"><mat-icon aria-hidden="true">history</mat-icon>{{ 'Versions' | t }}</button>
    <button class="lp-btn" (click)="openPdf()"><mat-icon aria-hidden="true">picture_as_pdf</mat-icon>PDF</button>
    <button class="lp-btn primary" *ngIf="t.is_sample" (click)="copy()"><mat-icon aria-hidden="true">content_copy</mat-icon>{{ 'Make a copy to edit' | t }}</button>
    <button class="lp-btn primary" *ngIf="!t.is_sample" (click)="save()" [disabled]="busy || !dirty"><mat-icon aria-hidden="true">save</mat-icon>{{ 'Save' | t }}</button>
  </div>
  <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
  <div class="lp-msg pt-ro" *ngIf="t.is_sample" role="note">{{ 'This is a sample of ZEO – it is read only. Make a copy to change it; you can try changes here and see them in the preview.' | t }}</div>

  <div class="pt-split">
    <section class="pt-left">
      <div class="lp-tabs pt-etabs" role="tablist">
        <button role="tab" [class.on]="pane === 'blocks'" (click)="pane = 'blocks'" [disabled]="t.mode === 'html'">{{ 'Blocks' | t }}</button>
        <button role="tab" [class.on]="pane === 'style'" (click)="pane = 'style'">{{ 'Style and page' | t }}</button>
        <button role="tab" [class.on]="pane === 'html'" (click)="openHtml()">{{ 'HTML / CSS' | t }}</button>
      </div>

      <!-- blocks -->
      <div class="pt-pane" *ngIf="pane === 'blocks' && t.mode !== 'html'">
        <p class="lp-muted">{{ 'Tick the blocks to print and put them in order.' | t }}</p>
        <ul class="pt-blocks">
          <li *ngFor="let b of s.blocks; let i = index; let last = last" [class.off]="!b.on">
            <label><input type="checkbox" [(ngModel)]="b.on" (ngModelChange)="changed()"> {{ blockLabel(b.key) | t }}</label>
            <span class="pt-grow"></span>
            <button class="pt-mv" (click)="move(i, -1)" [disabled]="i === 0" [attr.aria-label]="('Move up' | t) + ' ' + blockLabel(b.key)"><mat-icon aria-hidden="true">arrow_upward</mat-icon></button>
            <button class="pt-mv" (click)="move(i, 1)" [disabled]="last" [attr.aria-label]="('Move down' | t) + ' ' + blockLabel(b.key)"><mat-icon aria-hidden="true">arrow_downward</mat-icon></button>
          </li>
        </ul>
      </div>

      <!-- style -->
      <div class="pt-pane" *ngIf="pane === 'style'">
        <div class="lp-form two">
          <label *ngIf="t.mode !== 'html'">{{ 'Look' | t }}<select [(ngModel)]="s.look" (ngModelChange)="changed()"><option *ngFor="let l of meta?.looks" [value]="l.key">{{ l.name | t }}</option></select></label>
          <label *ngIf="t.mode !== 'html'">{{ 'Header' | t }}<select [(ngModel)]="s.header" (ngModelChange)="changed()"><option *ngFor="let h of meta?.headers" [value]="h.key">{{ h.label | t }}</option></select></label>
          <label>{{ 'Language' | t }}<select [(ngModel)]="t.language" (ngModelChange)="changed()"><option value="en">{{ 'English' | t }}</option><option value="ar">{{ 'Arabic (right to left)' | t }}</option><option value="bi">{{ 'English + Arabic' | t }}</option></select></label>
          <label>{{ 'Logo position' | t }}<select [(ngModel)]="s.logo_position" (ngModelChange)="changed()"><option value="">{{ 'As in Branding' | t }}</option><option value="left">{{ 'Left' | t }}</option><option value="center">{{ 'Centre' | t }}</option><option value="right">{{ 'Right' | t }}</option></select></label>
          <label>{{ 'Main colour' | t }}<span class="pt-color"><input type="color" [ngModel]="s.primary || '#1f3a5f'" (ngModelChange)="s.primary = $event; changed()"><button class="lp-btn" *ngIf="s.primary" (click)="s.primary = ''; changed()">{{ 'As in Branding' | t }}</button></span></label>
          <label>{{ 'Accent colour' | t }}<span class="pt-color"><input type="color" [ngModel]="s.accent || '#c8a24a'" (ngModelChange)="s.accent = $event; changed()"><button class="lp-btn" *ngIf="s.accent" (click)="s.accent = ''; changed()">{{ 'As in Branding' | t }}</button></span></label>
          <label>{{ 'Font' | t }}<select [(ngModel)]="s.font" (ngModelChange)="changed()"><option *ngFor="let f of meta?.fonts" [value]="f.key">{{ f.label }}</option></select></label>
          <label>{{ 'Heading font' | t }}<select [(ngModel)]="s.heading_font" (ngModelChange)="changed()"><option *ngFor="let f of meta?.fonts" [value]="f.key">{{ f.label }}</option></select></label>
          <label>{{ 'Text size (pt)' | t }}<input type="number" min="6.5" max="13" step="0.5" [(ngModel)]="s.font_size" (ngModelChange)="changed()"></label>
          <label>{{ 'Paper' | t }}<select [(ngModel)]="s.paper" (ngModelChange)="changed()"><option value="A4">A4</option><option value="Letter">Letter</option></select></label>
          <label>{{ 'Orientation' | t }}<select [(ngModel)]="s.orientation" (ngModelChange)="changed()"><option value="portrait">{{ 'Portrait' | t }}</option><option value="landscape">{{ 'Landscape' | t }}</option></select></label>
        </div>
        <fieldset class="pt-margins" *ngIf="s.margins">
          <legend>{{ 'Margins (mm)' | t }}</legend>
          <label>{{ 'Top' | t }}<input type="number" min="0" max="60" [(ngModel)]="s.margins.top" (ngModelChange)="changed()"></label>
          <label>{{ 'Right' | t }}<input type="number" min="0" max="60" [(ngModel)]="s.margins.right" (ngModelChange)="changed()"></label>
          <label>{{ 'Bottom' | t }}<input type="number" min="0" max="60" [(ngModel)]="s.margins.bottom" (ngModelChange)="changed()"></label>
          <label>{{ 'Left' | t }}<input type="number" min="0" max="60" [(ngModel)]="s.margins.left" (ngModelChange)="changed()"></label>
        </fieldset>
      </div>

      <!-- html / css -->
      <div class="pt-pane pt-code" *ngIf="pane === 'html'">
        <div class="pt-modebar" *ngIf="t.mode !== 'html'">
          <p>{{ 'The HTML below is made from the blocks. Switch to HTML / CSS to change it freely – the block editor then no longer applies to this template.' | t }}</p>
          <button class="lp-btn primary" (click)="toHtml()">{{ 'Switch to HTML / CSS' | t }}</button>
        </div>
        <div class="pt-modebar" *ngIf="t.mode === 'html'">
          <p>{{ djHelp }}</p>
          <button class="lp-btn" (click)="toBlocks()">{{ 'Back to the block editor' | t }}</button>
        </div>
        <div class="pt-codetabs">
          <button [class.on]="codeTab === 'html'" (click)="codeTab = 'html'">HTML</button>
          <button [class.on]="codeTab === 'css'" (click)="codeTab = 'css'">CSS</button>
        </div>
        <textarea #htmlBox *ngIf="codeTab === 'html'" class="pt-src" spellcheck="false" [(ngModel)]="t.html" (ngModelChange)="changed()" [readonly]="t.mode !== 'html'" [attr.aria-label]="'HTML of the template' | t"></textarea>
        <textarea *ngIf="codeTab === 'css'" class="pt-src" spellcheck="false" [(ngModel)]="t.css" (ngModelChange)="changed()" [readonly]="t.mode !== 'html'" [attr.aria-label]="'CSS of the template' | t"></textarea>
        <div class="pt-ph">
          <div class="pt-phhead"><b>{{ 'Placeholders' | t }}</b><input type="search" [(ngModel)]="phq" [placeholder]="'Find…' | t" [attr.aria-label]="'Find a placeholder' | t"></div>
          <ul>
            <li *ngFor="let p of placeholders()">
              <button (click)="insert(p)" [disabled]="t.mode !== 'html' || codeTab !== 'html'" [title]="p.snippet"><code>{{ p.loop ? p.path + ' (list)' : p.path }}</code><small>{{ p.loop ? p.fields?.join(', ') : p.example }}</small></button>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="pt-right" [attr.aria-label]="'Preview' | t">
      <div class="pt-prevbar">
        <label>{{ 'Preview with' | t }}
          <select [(ngModel)]="recordId" (ngModelChange)="refresh()"><option [ngValue]="null">{{ 'Sample data' | t }}</option><option *ngFor="let r of records" [ngValue]="r.id">{{ r.label }}</option></select>
        </label>
        <span class="lp-muted" *ngIf="busyPrev">{{ 'Updating…' | t }}</span>
        <span class="lp-muted" *ngIf="!busyPrev && result?.page_count">{{ result?.page_count }} {{ (result?.page_count === 1 ? 'page' : 'pages') | t }}</span>
      </div>
      <div class="lp-msg err pt-tplerr" *ngIf="result && !result.ok" role="alert">{{ result.error }}<span *ngIf="result.line"> – {{ 'line' | t }} {{ result.line }}</span></div>
      <div class="pt-pages"><img *ngFor="let p of result?.pages; let i = index" [src]="'data:image/png;base64,' + p" [alt]="('Page' | t) + ' ' + (i + 1)"></div>
    </section>
  </div>

  <div class="lp-modal-back" *ngIf="versions" (click)="versions = null">
    <div class="lp-modal pt-small" role="dialog" aria-modal="true" [attr.aria-label]="'Versions' | t" (click)="$event.stopPropagation()">
      <header><h2>{{ 'Versions' | t }}</h2><span class="pt-grow"></span><button class="lp-x" (click)="versions = null" [attr.aria-label]="'Close' | t">×</button></header>
      <div class="pt-mbody">
        <table class="lp-lines">
          <thead><tr><th>#</th><th>{{ 'Saved' | t }}</th><th>{{ 'By' | t }}</th><th>{{ 'Note' | t }}</th><th></th></tr></thead>
          <tbody><tr *ngFor="let v of versions">
            <td>{{ v.version }}</td><td>{{ v.saved_at | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ v.saved_by }}</td><td>{{ v.note }} <span class="lp-chip" *ngIf="v.mode === 'html'">HTML</span></td>
            <td><span class="lp-badge" *ngIf="v.current">{{ 'Current' | t }}</span><button class="lp-btn" *ngIf="!v.current" (click)="restore(v)">{{ 'Restore' | t }}</button></td>
          </tr></tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<p class="lp-muted pt-loading" *ngIf="!t">{{ msg || ('Loading…' | t) }}</p>`,
})
export class PrintTemplateEditorComponent implements OnInit, OnDestroy {
  @ViewChild('htmlBox') htmlBox?: ElementRef<HTMLTextAreaElement>;
  t: PtTemplate | null = null;
  s: PtSettings = {};
  meta: PtMeta | null = null;
  pane: 'blocks' | 'style' | 'html' = 'blocks';
  codeTab: 'html' | 'css' = 'html';
  dirty = false; busy = false; busyPrev = false;
  msg = ''; err = false;
  result: PtPreview | null = null;
  records: { id: number; label: string }[] = [];
  recordId: number | null = null;
  versions: PtVersion[] | null = null;
  phq = '';
  get djHelp(): string { return i18nT('Django template language: placeholders in double braces, if and for tags and the filters. The load and include tags cannot be used.'); }
  private change$ = new Subject<void>();
  private subs: Subscription[] = [];
  private seq = 0;

  constructor(private api: PrintTemplatesApi, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.meta().subscribe(m => { this.meta = m; this.cd.markForCheck(); });
    this.subs.push(this.change$.pipe(debounceTime(700)).subscribe(() => this.refresh()));
    this.subs.push(this.route.paramMap.subscribe(p => this.load(Number(p.get('id')))));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  load(id: number): void {
    this.api.get(id).subscribe({
      next: t => {
        this.t = t; this.s = JSON.parse(JSON.stringify(t.settings || {}));
        if (!this.s.margins) { this.s.margins = { top: 12, right: 14, bottom: 20, left: 14 }; }
        this.pane = t.mode === 'html' ? 'html' : 'blocks'; this.dirty = false;
        this.api.records(t.doc_type).subscribe(r => { this.records = r; this.cd.markForCheck(); });
        this.refresh();
      },
      error: e => this.fail(e),
    });
  }

  docLabel(): string { return this.meta?.doc_types.find(d => d.key === this.t?.doc_type)?.label || this.t?.doc_type || ''; }
  blockLabel(k: string): string { return this.t?.blocks?.find(b => b.key === k)?.label || k; }
  langLabel(l: string): string { return LANG_LABEL[l] || l; }

  changed(): void { this.dirty = true; this.change$.next(); }

  move(i: number, d: number): void {
    const b = this.s.blocks!; const j = i + d;
    [b[i], b[j]] = [b[j], b[i]];
    this.changed();
  }

  body(): any {
    const t = this.t!;
    return { template_id: t.id, settings: this.s, mode: t.mode, html: t.html, css: t.css, language: t.language, record_id: this.recordId, width: 760 };
  }

  refresh(): void {
    if (!this.t) { return; }
    const n = ++this.seq;
    this.busyPrev = true;
    this.api.preview(this.body()).subscribe({
      next: r => { if (n !== this.seq) { return; } this.result = r; this.busyPrev = false; this.cd.markForCheck(); },
      error: e => { if (n !== this.seq) { return; } this.result = { ok: false, error: e?.error?.detail || i18nT('The preview could not be made.') }; this.busyPrev = false; this.cd.markForCheck(); },
    });
  }

  openHtml(): void {
    this.pane = 'html';
    if (this.t && this.t.mode !== 'html') {   // the HTML made from the current blocks
      this.api.get(this.t.id).subscribe(x => {
        if (!this.dirty && this.t) { this.t.html = x.html; this.t.css = x.css; this.cd.markForCheck(); }
      });
    }
  }

  toHtml(): void {
    if (!this.t) { return; }
    if (this.dirty && !this.t.is_sample) { this.msg = i18nT('Save the block changes first – the HTML is made from the saved blocks.'); this.err = true; return; }
    this.t.mode = 'html'; this.changed();
  }

  toBlocks(): void {
    if (!this.t || !confirm(i18nT('Go back to the block editor? Your HTML / CSS changes are kept in the versions but no longer used.'))) { return; }
    this.t.mode = 'blocks'; this.pane = 'blocks'; this.changed();
  }

  placeholders(): PtPlaceholder[] {
    const q = this.phq.trim().toLowerCase();
    return (this.t?.placeholders || []).filter(p => !q || p.path.toLowerCase().includes(q));
  }

  insert(p: PtPlaceholder): void {
    const box = this.htmlBox?.nativeElement;
    if (!box || !this.t) { return; }
    const a = box.selectionStart ?? this.t.html!.length, b = box.selectionEnd ?? a;
    this.t.html = this.t.html!.slice(0, a) + p.snippet + this.t.html!.slice(b);
    this.changed();
    setTimeout(() => { box.focus(); box.selectionStart = box.selectionEnd = a + p.snippet.length; });
  }

  save(): void {
    const t = this.t!;
    this.busy = true;
    this.api.save(t.id, { name: t.name, settings: this.s, mode: t.mode, html: t.mode === 'html' ? t.html : '', css: t.mode === 'html' ? t.css : '', language: t.language } as any).subscribe({
      next: x => { this.t = x; this.s = JSON.parse(JSON.stringify(x.settings || {})); this.dirty = false; this.busy = false; this.ok(i18nT('Saved as version {0}.', [x.version])); this.refresh(); },
      error: e => { this.busy = false; this.fail(e); },
    });
  }

  copy(): void {
    this.api.copy(this.t!.id).subscribe({ next: c => this.router.navigate(['/main-sidebar/settings/print-templates', c.id]), error: e => this.fail(e) });
  }

  showVersions(): void { this.api.versions(this.t!.id).subscribe({ next: v => { this.versions = v; this.cd.markForCheck(); }, error: e => this.fail(e) }); }

  restore(v: PtVersion): void {
    this.api.restore(this.t!.id, v.version).subscribe({
      next: x => { this.versions = null; this.load(x.id); this.ok(i18nT('Version {0} restored.', [v.version])); },
      error: e => this.fail(e),
    });
  }

  openPdf(): void {
    this.api.previewPdf(this.body()).subscribe({ next: b => { if (b.type === 'application/pdf') { window.open(URL.createObjectURL(b), '_blank'); } } });
  }

  private ok(m: string): void { this.msg = m; this.err = false; this.cd.markForCheck(); }
  private fail(e: any): void { this.msg = e?.error?.detail || e?.message || i18nT('Something went wrong.'); this.err = true; this.cd.markForCheck(); }
}
