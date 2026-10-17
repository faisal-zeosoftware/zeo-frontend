import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, firstValueFrom } from 'rxjs';
import { I18N_UI, I18nService, i18nT } from '../shared-ui/i18n.service';
import { LanguagePackApi, LpFilter, LpImport, LpLanguage, LpSettings, LpTerm, LpTermPage } from './language-pack.service';

type Tab = 'languages' | 'translations';
type Show = '' | 'missing' | 'not_reviewed' | 'reviewed' | 'edited';
interface Row extends LpTerm { draft: string; saving: boolean; err: string; saved: boolean; }

/**
 * v1.15.0 – Settings → Languages (company admin; the Translations tab also for users with "Can change translation").
 * Languages: which languages the company uses and the company default. Translations: search the English text or the
 * translation, filter missing / not reviewed / module, edit inline, mark reviewed, export to Excel, import from Excel
 * (preview with counts before anything is saved). API: /language/api/settings/, terms/, terms/import/, terms/export/.
 */
@Component({
  selector: 'app-language-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './language-pack.css'],
  template: `
<div class="container lg-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">{{ 'Languages' | t }}</h1>
          <p class="lp-desc">{{ 'Every user works in their own language. Choose the languages your company uses and the default for new users; check and correct the translations of the screens, messages and reports.' | t }}</p>
        </div>
        <div class="lp-actions" *ngIf="tab === 'languages' && s">
          <button type="button" class="lp-btn primary" (click)="saveSettings()" [disabled]="busy || !dirty()">{{ (saving ? 'Saving…' : 'Save changes') | t }}</button>
        </div>
      </div>
      <div class="lp-tabs" role="tablist">
        <button type="button" role="tab" *ngIf="isAdmin" [class.on]="tab === 'languages'" [attr.aria-selected]="tab === 'languages'" (click)="go('languages')">{{ 'Languages' | t }}</button>
        <button type="button" role="tab" [class.on]="tab === 'translations'" [attr.aria-selected]="tab === 'translations'" (click)="go('translations')">{{ 'Translations' | t }}</button>
      </div>
    </div>

    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>

      <!-- ============ languages ============ -->
      <ng-container *ngIf="tab === 'languages'">
        <p class="lp-muted" *ngIf="!s && !msg">{{ 'Loading the languages…' | t }}</p>
        <ng-container *ngIf="s">
          <div class="lg-grid">
            <div class="lg-card" *ngFor="let l of s.languages" [class.on]="used[l.code]">
              <div class="lg-top">
                <div>
                  <h3 [attr.lang]="l.code" [attr.dir]="l.dir">{{ l.name }}</h3>
                  <small>{{ l.english_name }} · {{ l.code }} · {{ (l.dir === 'rtl' ? 'Right to left' : 'Left to right') | t }}</small>
                </div>
                <label class="lg-switch" *ngIf="!l.is_source">
                  <input type="checkbox" [(ngModel)]="used[l.code]" (ngModelChange)="usedChanged(l)" [attr.aria-label]="'Use {0} in this company' | t:l.english_name">
                  <span class="tr"></span>{{ (used[l.code] ? 'Used' : 'Not used') | t }}
                </label>
                <span class="lg-tag" *ngIf="l.is_source">{{ 'Source language' | t }}</span>
              </div>
              <ng-container *ngIf="!l.is_source">
                <div class="lg-bar" [attr.aria-label]="'{0}% translated' | t:pct(l)"><span [style.width.%]="pct(l)"></span></div>
                <p class="lg-facts">{{ '{0}% translated · {1} of {2} texts reviewed' | t:pct(l):l.terms_reviewed:l.terms_total }}
                  <a href="javascript:void(0)" (click)="openTranslations(l.code)">{{ 'Open translations' | t }}</a></p>
              </ng-container>
              <p class="lg-facts" *ngIf="l.is_source">{{ 'The texts as written in ZEO HRMS. Other languages translate them.' | t }}</p>
              <label class="lg-default">
                <input type="radio" name="lg-default" [value]="l.code" [(ngModel)]="defaultLang" [disabled]="!used[l.code]">
                {{ 'Company default' | t }}
              </label>
            </div>
          </div>
          <p class="lp-muted lg-note">{{ 'The default applies to users who did not choose a language themselves (top bar → language, or My profile). A language that is not used is not offered to anybody.' | t }}</p>
        </ng-container>
      </ng-container>

      <!-- ============ translations ============ -->
      <ng-container *ngIf="tab === 'translations'">
        <div class="lg-tools">
          <label>{{ 'Language' | t }}
            <select [(ngModel)]="f.lang" (ngModelChange)="reload(true)" [attr.aria-label]="'Language to translate into' | t">
              <option *ngFor="let l of targetLangs" [value]="l.code">{{ l.english_name }} – {{ l.name }}</option>
            </select>
          </label>
          <label class="lg-search">{{ 'Search' | t }}
            <input type="search" [(ngModel)]="search" (ngModelChange)="searchChanged()" [placeholder]="'English text or translation' | t" [attr.aria-label]="'Search the English text or the translation' | t">
          </label>
          <label>{{ 'Show' | t }}
            <select [(ngModel)]="show" (ngModelChange)="reload(true)">
              <option value="">{{ 'All texts' | t }}</option>
              <option value="missing">{{ 'Missing translation' | t }}</option>
              <option value="not_reviewed">{{ 'Translated, not reviewed' | t }}</option>
              <option value="reviewed">{{ 'Reviewed' | t }}</option>
              <option value="edited">{{ 'Changed on this screen' | t }}</option>
            </select>
          </label>
          <label>{{ 'Module' | t }}
            <select [(ngModel)]="module" (ngModelChange)="reload(true)">
              <option value="">{{ 'All modules' | t }}</option>
              <option *ngFor="let m of modules" [value]="m.module">{{ m.module || ('(none)' | t) }} ({{ m.count }})</option>
            </select>
          </label>
          <span class="lg-grow"></span>
          <button type="button" class="lp-btn" (click)="export()" [disabled]="!f.lang || exporting">{{ (exporting ? 'Exporting…' : 'Export to Excel') | t }}</button>
          <label class="lp-btn lg-file">{{ 'Import from Excel' | t }}
            <input type="file" accept=".xlsx,.csv" (change)="pickFile($event)" [disabled]="!f.lang || busy">
          </label>
        </div>

        <div class="lg-counts" *ngIf="page">
          <button type="button" [class.on]="show === ''" (click)="setShow('')">{{ 'All' | t }} <b>{{ page.counts.total }}</b></button>
          <button type="button" [class.on]="show === 'missing'" (click)="setShow('missing')">{{ 'Missing' | t }} <b>{{ page.counts.missing }}</b></button>
          <button type="button" [class.on]="show === 'not_reviewed'" (click)="setShow('not_reviewed')">{{ 'Not reviewed' | t }} <b>{{ page.counts.not_reviewed }}</b></button>
          <button type="button" [class.on]="show === 'reviewed'" (click)="setShow('reviewed')">{{ 'Reviewed' | t }} <b>{{ page.counts.reviewed }}</b></button>
          <span class="lg-grow"></span>
          <button type="button" class="lp-btn" *ngIf="reviewable().length" (click)="reviewPage()" [disabled]="busy">{{ 'Mark {0} on this page reviewed' | t:reviewable().length }}</button>
        </div>

        <p class="lp-muted" *ngIf="!targetLangs.length && loaded">{{ 'No language to translate into yet. Load the language packs on the server (manage.py load_language_packs).' | t }}</p>
        <p class="lp-muted" *ngIf="loading">{{ 'Loading the translations…' | t }}</p>

        <div class="lg-scroll" *ngIf="page && !loading">
          <table class="lg-table" zPlain data-no-translate>
            <thead><tr><th class="lg-src">{{ 'English' | t }}</th><th>{{ 'Translation' | t }}</th><th class="lg-rv">{{ 'Reviewed' | t }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of rows; trackBy: byId" [class.lg-missing]="!r.value">
                <td class="lg-src">
                  <div class="lg-text">{{ r.source }}</div>
                  <small class="lg-where" [title]="r.where.join('\\n')">{{ r.module || '–' }}<ng-container *ngIf="r.where.length"> · {{ r.where[0] }}</ng-container><ng-container *ngIf="r.where_count > 1"> {{ '+{0} more' | t:(r.where_count - 1) }}</ng-container></small>
                  <small class="lg-ph" *ngIf="r.placeholders.length">{{ 'Keep in the translation:' | t }} <code *ngFor="let p of r.placeholders">{{ '{' + p + '}' }}</code></small>
                </td>
                <td>
                  <textarea rows="2" [(ngModel)]="r.draft" [attr.lang]="r.lang" [attr.dir]="dirOf(r.lang)" (blur)="save(r)" (keydown.control.enter)="save(r)"
                            [attr.aria-label]="'Translation of: {0}' | t:r.source" [placeholder]="'Not translated yet – the English text is shown' | t"></textarea>
                  <small class="lg-state err" *ngIf="r.err">{{ r.err }}</small>
                  <small class="lg-state" *ngIf="r.saving">{{ 'Saving…' | t }}</small>
                  <small class="lg-state ok" *ngIf="r.saved && !r.saving && !r.err">{{ 'Saved' | t }}<ng-container *ngIf="r.updated_by"> · {{ r.updated_by }}</ng-container></small>
                </td>
                <td class="lg-rv">
                  <input type="checkbox" [checked]="r.is_reviewed" [disabled]="!r.value || r.saving" (change)="toggleReviewed(r, $any($event.target).checked)"
                         [attr.aria-label]="'Reviewed: {0}' | t:r.source" [title]="(r.value ? 'Mark as checked by your reviewer' : 'Translate the text first') | t">
                </td>
              </tr>
              <tr *ngIf="!rows.length"><td colspan="3" class="lp-muted">{{ 'No texts match. Change the search or the filter.' | t }}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="lg-pager" *ngIf="page && page.count">
          <span>{{ '{0}–{1} of {2}' | t:((page.page - 1) * page.page_size + 1):min(page.page * page.page_size, page.count):page.count }}</span>
          <button type="button" class="lp-btn" (click)="goPage(-1)" [disabled]="page.page <= 1 || loading" [attr.aria-label]="'Previous page' | t">‹</button>
          <button type="button" class="lp-btn" (click)="goPage(1)" [disabled]="page.page * page.page_size >= page.count || loading" [attr.aria-label]="'Next page' | t">›</button>
        </div>
      </ng-container>
    </div>
  </div>

  <!-- import preview -->
  <div class="lg-modal-back" *ngIf="preview" (click)="closeImport()">
    <div class="lg-modal" role="dialog" aria-modal="true" [attr.aria-label]="'Import translations' | t" (click)="$event.stopPropagation()">
      <h2>{{ 'Import translations' | t }} – {{ fileName }}</h2>
      <p class="lp-muted">{{ preview.dry_run ? ('Check the counts, then press Import. Nothing is saved yet.' | t) : preview.message }}</p>
      <div class="lg-sum">
        <div><b>{{ preview.new }}</b><span>{{ 'New' | t }}</span></div>
        <div><b>{{ preview.changed }}</b><span>{{ 'Changed' | t }}</span></div>
        <div><b>{{ preview.unchanged }}</b><span>{{ 'Unchanged' | t }}</span></div>
        <div><b>{{ preview.empty }}</b><span>{{ 'Without translation (skipped)' | t }}</span></div>
        <div [class.bad]="preview.errors.length"><b>{{ preview.errors.length }}</b><span>{{ 'With errors (skipped)' | t }}</span></div>
      </div>
      <ng-container *ngIf="preview.samples.length">
        <h3>{{ 'Examples' | t }}</h3>
        <table class="lg-ptable" zPlain data-no-translate>
          <thead><tr><th>{{ 'English' | t }}</th><th>{{ 'Now' | t }}</th><th>{{ 'After import' | t }}</th></tr></thead>
          <tbody><tr *ngFor="let x of preview.samples"><td>{{ x.english }}</td><td [attr.dir]="dirOf(preview.lang)">{{ x.old || '–' }}</td><td [attr.dir]="dirOf(preview.lang)">{{ x.new }}</td></tr></tbody>
        </table>
      </ng-container>
      <ng-container *ngIf="preview.errors.length">
        <h3>{{ 'Rows to fix' | t }}</h3>
        <table class="lg-ptable" zPlain data-no-translate>
          <thead><tr><th>{{ 'Row' | t }}</th><th>{{ 'English' | t }}</th><th>{{ 'What to fix' | t }}</th></tr></thead>
          <tbody><tr *ngFor="let e of preview.errors.slice(0, 50)"><td>{{ e.row }}</td><td>{{ e.english }}</td><td>{{ e.message }}</td></tr></tbody>
        </table>
      </ng-container>
      <div class="lg-mfoot">
        <button type="button" class="lp-btn" (click)="closeImport()">{{ (preview.dry_run ? 'Cancel' : 'Close') | t }}</button>
        <button type="button" class="lp-btn primary" *ngIf="preview.dry_run" (click)="applyImport()" [disabled]="busy || !(preview.new + preview.changed)">
          {{ (busy ? 'Importing…' : 'Import {0} translations') | t:(preview.new + preview.changed) }}</button>
      </div>
    </div>
  </div>
</div>`,
})
export class LanguageSettingsComponent implements OnInit, OnDestroy {
  tab: Tab = 'translations';
  isAdmin = false;
  s: LpSettings | null = null;
  used: Record<string, boolean> = {};
  defaultLang = 'en';
  private savedState = '';

  f: LpFilter = { lang: '', page: 1, page_size: 50 };
  search = '';
  show: Show = 'missing';
  module = '';
  modules: { module: string; count: number }[] = [];
  langs: { code: string; english_name: string; name: string; dir: string }[] = [];
  page: LpTermPage | null = null;
  rows: Row[] = [];
  preview: LpImport | null = null;
  fileName = '';
  private file: File | null = null;

  busy = false; saving = false; loading = false; loaded = false; exporting = false;
  msg = ''; err = false;
  private search$ = new Subject<void>();
  private subs: Subscription[] = [];

  constructor(private api: LanguagePackApi, private i18n: I18nService, private route: ActivatedRoute, private router: Router,
              private cd: ChangeDetectorRef) {}

  get targetLangs() { return this.langs.filter(l => l.code !== 'en'); }

  async ngOnInit(): Promise<void> {
    this.subs.push(this.search$.pipe(debounceTime(350)).subscribe(() => this.reload(true)));
    const wanted = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
    const lang = this.route.snapshot.queryParamMap.get('lang');
    // admin? (settings/ answers 403 for others – they only get the Translations tab)
    try {
      this.s = await firstValueFrom(this.api.settings());
      this.isAdmin = true;
      this.useSettings(this.s);
    } catch (e: any) {
      this.isAdmin = false;
      if (e?.status !== 403) { this.fail(e, 'The language settings could not be loaded. Refresh the page.'); }
    }
    if (!this.langs.length) {
      // translators: the languages the company offers
      this.langs = (this.i18n.languages$.value || []).map(l => ({ code: l.code, english_name: l.english_name, name: l.name, dir: l.dir }));
    }
    this.tab = wanted === 'translations' || !this.isAdmin ? 'translations' : (wanted || 'languages');
    this.f.lang = (lang && this.targetLangs.some(l => l.code === lang)) ? lang
      : (this.i18n.lang !== 'en' && this.targetLangs.some(l => l.code === this.i18n.lang) ? this.i18n.lang : this.targetLangs[0]?.code || '');
    this.loaded = true;
    if (this.tab === 'translations') { this.reload(true); }
    this.cd.markForCheck();
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  go(t: Tab): void {
    this.tab = t; this.msg = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: t === 'languages' ? null : t }, queryParamsHandling: 'merge', replaceUrl: true });
    if (t === 'translations' && !this.page) { this.reload(true); }
  }

  openTranslations(code: string): void { this.f.lang = code; this.show = 'missing'; this.go('translations'); this.reload(true); }

  // ------------------------------------------------------------------ languages
  private useSettings(s: LpSettings): void {
    this.s = s;
    this.used = {};
    for (const l of s.languages) { this.used[l.code] = l.in_company || l.is_source; }
    this.defaultLang = s.default_lang;
    // v1.28.1: the translations drop-down offers only active languages with a loaded pack
    // (no test / legacy locales without terms)
    this.langs = s.languages.filter(l => l.is_source || l.terms_total > 0)
      .map(l => ({ code: l.code, english_name: l.english_name, name: l.name, dir: l.dir }));
    this.savedState = this.state();
  }

  private state(): string { return JSON.stringify([this.activeList(), this.defaultLang]); }
  private activeList(): string[] { return (this.s?.languages || []).filter(l => this.used[l.code] || l.is_source).map(l => l.code); }
  dirty(): boolean { return !!this.s && this.state() !== this.savedState; }
  pct(l: LpLanguage): number { return l.terms_total ? Math.floor(100 * (l.terms_total - l.terms_missing) / l.terms_total) : 0; }

  usedChanged(l: LpLanguage): void { if (!this.used[l.code] && this.defaultLang === l.code) { this.defaultLang = 'en'; } }

  async saveSettings(): Promise<void> {
    this.busy = this.saving = true; this.msg = '';
    try {
      const s = await firstValueFrom(this.api.saveSettings({ active_langs: this.activeList(), default_lang: this.defaultLang }));
      this.useSettings(s);
      this.ok('Language settings saved. Users who did not choose a language see the company default from their next page.');
      this.i18n.ensure(true);   // the picker offers the new list
    } catch (e: any) { this.fail(e, 'The language settings could not be saved.'); }
    this.busy = this.saving = false;
    this.cd.markForCheck();
  }

  // ------------------------------------------------------------------ translations
  setShow(v: Show): void { this.show = v; this.reload(true); }
  searchChanged(): void { this.search$.next(); }

  private filter(): LpFilter {
    const f: LpFilter = { lang: this.f.lang, q: this.search.trim() || undefined, module: this.module || undefined, page: this.f.page, page_size: this.f.page_size };
    if (this.show === 'missing') { f.missing = '1'; }
    if (this.show === 'not_reviewed') { f.missing = '0'; f.reviewed = '0'; }
    if (this.show === 'reviewed') { f.reviewed = '1'; }
    if (this.show === 'edited') { f.edited = '1'; }
    return f;
  }

  async reload(first = false): Promise<void> {
    if (!this.f.lang) { return; }
    if (first) { this.f.page = 1; }
    this.loading = true; this.msg = '';
    try {
      const p = await firstValueFrom(this.api.terms(this.filter()));
      this.page = p;
      this.modules = p.modules;
      this.rows = p.results.map(r => ({ ...r, draft: r.value, saving: false, err: '', saved: false }));
    } catch (e: any) { this.fail(e, 'The translations could not be loaded.'); this.page = null; this.rows = []; }
    this.loading = false;
    this.cd.markForCheck();
  }

  goPage(d: number): void { this.f.page = Math.max(1, (this.f.page || 1) + d); this.reload(); }
  byId(_: number, r: Row): number { return r.id; }
  min(a: number, b: number): number { return Math.min(a, b); }
  dirOf(code: string): string { return this.langs.find(l => l.code === code)?.dir === 'rtl' ? 'rtl' : 'ltr'; }
  reviewable(): Row[] { return this.rows.filter(r => r.value && !r.is_reviewed); }

  async save(r: Row): Promise<void> {
    const v = (r.draft || '').trim();
    if (v === (r.value || '') || r.saving) { return; }
    r.saving = true; r.err = ''; r.saved = false;
    try {
      const n = await firstValueFrom(this.api.saveTerm(r.id, { value: v }));
      Object.assign(r, n, { draft: n.value, saved: true });
    } catch (e: any) {
      r.err = e?.error?.value?.[0] || e?.error?.detail || i18nT('Not saved. Try again.');
    }
    r.saving = false;
    this.cd.markForCheck();
  }

  async toggleReviewed(r: Row, on: boolean): Promise<void> {
    r.saving = true; r.err = '';
    try {
      const n = await firstValueFrom(this.api.saveTerm(r.id, { is_reviewed: on }));
      Object.assign(r, n, { draft: n.value, saved: true });
    } catch (e: any) { r.err = e?.error?.is_reviewed?.[0] || e?.error?.detail || i18nT('Not saved. Try again.'); }
    r.saving = false;
    this.cd.markForCheck();
  }

  async reviewPage(): Promise<void> {
    const ids = this.reviewable().map(r => r.id);
    if (!ids.length) { return; }
    this.busy = true;
    try {
      const res = await firstValueFrom(this.api.review(ids, true));
      this.ok(i18nT('{0} translations marked reviewed.', [res.updated]));
      await this.reload();
    } catch (e: any) { this.fail(e, 'The translations could not be marked reviewed.'); }
    this.busy = false;
    this.cd.markForCheck();
  }

  async export(): Promise<void> {
    this.exporting = true;
    try {
      const blob = await firstValueFrom(this.api.exportFile(this.filter()));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `zeo-translations-${this.f.lang}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e: any) { this.fail(e, 'The Excel file could not be made.'); }
    this.exporting = false;
    this.cd.markForCheck();
  }

  async pickFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) { return; }
    this.file = file; this.fileName = file.name;
    this.busy = true; this.msg = '';
    try { this.preview = await firstValueFrom(this.api.importFile(this.f.lang, file, true)); }
    catch (e: any) { this.fail(e, 'The file could not be checked.'); }
    this.busy = false;
    this.cd.markForCheck();
  }

  async applyImport(): Promise<void> {
    if (!this.file) { return; }
    this.busy = true;
    try {
      this.preview = await firstValueFrom(this.api.importFile(this.f.lang, this.file, false));
      this.ok(this.preview.message);
      await this.reload();
    } catch (e: any) { this.fail(e, 'The translations could not be imported.'); }
    this.busy = false;
    this.cd.markForCheck();
  }

  closeImport(): void { this.preview = null; this.file = null; }

  private ok(m: string): void { this.msg = i18nT(m); this.err = false; }

  private fail(e: any, fallback: string): void {
    const d = e?.error;
    const first = d && typeof d === 'object' ? (d.detail || Object.values(d).flat().find(x => typeof x === 'string')) : '';
    this.msg = (first as string) || i18nT(fallback);
    this.err = true;
  }
}
