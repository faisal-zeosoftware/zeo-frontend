import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { FieldHelpService } from '../shared-ui/field-help.service';
import { I18N_UI, i18nLang } from '../shared-ui/i18n.service';

/**
 * v1.16.0 – Settings → Field help.
 * Everyone: switch the help panel on or off for their own login.
 * Company admins (or users with the right to change translations): see how many fields have specific help and edit
 * any help text per language (what it is, format, example, rules, UAE note). Edits are kept per company and win over
 * the generated catalogue; empty texts go back to the catalogue text.
 */
@Component({
  selector: 'app-field-help-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  template: `
<div class="container fh">
  <div class="comapny_section">
    <div class="header_section"><h1 class="page-title">Field help</h1>
      <p class="fh-muted">Every field shows a small “?” when you point at it or put the cursor in it. Click the “?” (or press F1) and a help panel
        shows what the field means, its format, an example, its rules and UAE notes. Press Esc to close the panel.</p></div>

    <section class="fh-card">
      <label class="fh-switch"><input type="checkbox" [checked]="on" (change)="toggle($any($event.target).checked)" data-no-help>
        <span>Show field help for my login</span></label>
      <p class="fh-muted">{{ on ? 'Field help is on.' : 'Field help is off. Tick the box to turn it on again.' }}</p>
    </section>

    <section class="fh-card" *ngIf="admin">
      <div class="fh-stats" *ngIf="stats">
        <span><b>{{ stats.fields }}</b> fields in the app</span>
        <span><b>{{ stats.specific_pct }}%</b> with specific help</span>
        <span><b>{{ stats.generic_only }}</b> with the help of their field type</span>
        <span><b>{{ count }}</b> rows shown</span>
      </div>
      <div class="fh-bar" data-no-help>
        <input class="fh-in" [(ngModel)]="q" (keyup.enter)="load(1)" placeholder="Search a field, label or screen" aria-label="Search field help">
        <select class="fh-in" [(ngModel)]="lang" (change)="load(1)" aria-label="Language">
          <option value="en">English</option><option value="ar">العربية (Arabic)</option></select>
        <label class="fh-chk"><input type="checkbox" [(ngModel)]="onlyGeneric" (change)="load(1)"> Only fields with generic help</label>
        <label class="fh-chk"><input type="checkbox" [(ngModel)]="onlyEdited" (change)="load(1)"> Only edited</label>
        <button type="button" class="zr-btn primary" (click)="load(1)">Search</button>
      </div>
      <p class="zr-err" *ngIf="error" role="alert">{{ error }}</p>
      <table class="fh-table" zPlain>
        <thead><tr><th>Field</th><th>Help ({{ lang === 'ar' ? 'Arabic' : 'English' }})</th><th>Screens</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td><b>{{ r.label }}</b><div class="fh-muted">{{ r.key }}{{ r.kb ? ' · ' + r.kb : '' }}{{ r.edited ? ' · edited' : '' }}</div></td>
            <td [attr.dir]="lang === 'ar' ? 'rtl' : 'ltr'">{{ r.text.w }}<div class="fh-muted" *ngIf="r.text.x">{{ r.text.x }}</div></td>
            <td class="fh-muted">{{ (r.screens || []).join(', ') }}</td>
            <td><button type="button" class="zr-btn sm" (click)="edit(r)">Edit</button></td>
          </tr>
          <tr *ngIf="!rows.length"><td colspan="4" class="fh-muted">No field help matches the search.</td></tr>
        </tbody>
      </table>
      <div class="fh-pager" *ngIf="count > 50">
        <button type="button" class="zr-btn sm" [disabled]="page <= 1" (click)="load(page - 1)">Previous</button>
        <span>Page {{ page }} of {{ pages() }}</span>
        <button type="button" class="zr-btn sm" [disabled]="page >= pages()" (click)="load(page + 1)">Next</button>
      </div>
    </section>
  </div>

  <div class="fh-modal" *ngIf="cur" (click)="$event.target === $event.currentTarget && (cur = null)" data-no-help>
    <div class="fh-dlg" role="dialog" aria-modal="true" aria-labelledby="fh-t">
      <h3 id="fh-t">Help for “{{ cur.label }}” ({{ lang === 'ar' ? 'Arabic' : 'English' }})</h3>
      <p class="fh-muted">Leave a box empty to use the generated text. The English text is shown below each box for reference.</p>
      <div class="fh-grid" [attr.dir]="lang === 'ar' ? 'rtl' : 'ltr'">
        <label *ngFor="let p of parts">{{ p.label }}
          <textarea class="fh-in" rows="2" [(ngModel)]="draft[p.key]" [placeholder]="cur.text[p.key] || ''"></textarea>
          <small class="fh-muted" dir="ltr" *ngIf="lang !== 'en'">{{ cur.en[p.key] }}</small></label>
      </div>
      <p class="zr-err" *ngIf="saveError" role="alert">{{ saveError }}</p>
      <div class="fh-actions">
        <button type="button" class="zr-btn" (click)="reset()">Use the generated text</button>
        <span style="flex:1"></span>
        <button type="button" class="zr-btn" (click)="cur = null">Cancel</button>
        <button type="button" class="zr-btn primary" [disabled]="busy" (click)="save()">Save help</button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.fh-card{background:#fff;border:1px solid #e3e6ef;border-radius:10px;padding:14px 16px;margin:12px 0}
.fh-muted{color:#6b7185;font-size:12.5px;margin:4px 0}
.fh-switch{display:flex;gap:8px;align-items:center;font-weight:600}
.fh-stats{display:flex;flex-wrap:wrap;gap:18px;margin-bottom:10px}
.fh-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
.fh-in{border:1px solid #cfd4e2;border-radius:6px;padding:6px 8px;min-width:0;width:100%}
.fh-bar .fh-in{width:auto;flex:1 1 220px}
.fh-chk{display:flex;gap:6px;align-items:center;font-size:13px}
.fh-table{width:100%;border-collapse:collapse;font-size:13px}
.fh-table th,.fh-table td{border-bottom:1px solid #eef0f5;padding:6px;text-align:start;vertical-align:top}
.fh-pager{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:8px}
.fh-modal{position:fixed;inset:0;background:rgba(15,20,35,.35);z-index:1050;display:flex;align-items:center;justify-content:center;padding:16px}
.fh-dlg{background:#fff;border-radius:12px;max-width:640px;width:100%;padding:16px;max-height:90vh;overflow:auto}
.fh-grid{display:grid;gap:10px}
.fh-grid label{display:grid;gap:4px;font-weight:600;font-size:13px}
.fh-actions{display:flex;gap:8px;margin-top:12px;align-items:center}
@media (max-width:640px){.fh-table td:nth-child(3),.fh-table th:nth-child(3){display:none}}
`],
})
export class FieldHelpSettingsComponent implements OnInit {
  on = true; admin = false; stats: any = null;
  rows: any[] = []; count = 0; page = 1; q = ''; lang = 'en'; onlyGeneric = false; onlyEdited = false;
  error = ''; saveError = ''; busy = false;
  cur: any = null; draft: Record<string, string> = {};
  parts = [{ key: 'w', label: 'What it is' }, { key: 'f', label: 'Format' }, { key: 'x', label: 'Example' }, { key: 'r', label: 'Rules' }, { key: 'u', label: 'UAE / country note' }];

  constructor(private http: HttpClient, private help: FieldHelpService, private cd: ChangeDetectorRef) {}

  private url(q = ''): string { return `${environment.apiBaseUrl}/tools/api/field-help/?schema=${localStorage.getItem('selectedSchema') || ''}${q}`; }

  ngOnInit(): void {
    this.on = this.help.enabled;
    this.lang = i18nLang() === 'ar' ? 'ar' : 'en';
    this.load(1);
  }

  toggle(v: boolean): void { this.help.setEnabled(v); this.on = v; }
  pages(): number { return Math.max(1, Math.ceil(this.count / 50)); }

  async load(page: number): Promise<void> {
    this.error = '';
    try {
      const r: any = await firstValueFrom(this.http.get(this.url(`&admin=1&lang=${this.lang}&page=${page}&q=${encodeURIComponent(this.q)}${this.onlyGeneric ? '&generic=1' : ''}${this.onlyEdited ? '&edited=1' : ''}`)));
      this.admin = true; this.rows = r.results || []; this.count = r.count || 0; this.page = r.page || page; this.stats = r.stats;
    } catch (e: any) {
      this.admin = false;
      if (e?.status !== 403) { this.error = e?.error?.detail || 'Field help could not be loaded. Check the connection and try again.'; }
    }
    this.cd.detectChanges();
  }

  edit(r: any): void {
    this.cur = r; this.saveError = '';
    this.draft = {};
    for (const p of this.parts) { this.draft[p.key] = r.edited ? (r.text[p.key] || '') : ''; }
  }
  reset(): void { for (const p of this.parts) { this.draft[p.key] = ''; } }

  async save(): Promise<void> {
    this.busy = true; this.saveError = '';
    try {
      const body: any = { key: this.cur.key, lang: this.lang };
      for (const p of this.parts) { body[p.key] = (this.draft[p.key] || '').trim(); }
      const res: any = await firstValueFrom(this.http.patch(this.url(), body));
      Object.assign(this.cur, { text: res.text, edited: res.edited });
      this.help.refresh();
      this.cur = null;
    } catch (e: any) {
      const d = e?.error; this.saveError = d?.detail || (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : '') || 'Not saved.';
    }
    this.busy = false;
    this.cd.detectChanges();
  }
}

/** Routes – the lead adds them under the settings area (see INTEGRATION.txt). */
export const FIELD_HELP_ROUTES: Routes = [
  { path: '', component: FieldHelpSettingsComponent },
];

/** v1.16.0 – the per-user switch on its own (used on the self-service profile next to the language picker). */
@Component({
  selector: 'z-field-help-toggle',
  standalone: true,
  imports: [CommonModule, ...I18N_UI],
  template: `<label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:500" data-no-help>
    <input type="checkbox" [checked]="help.enabled" (change)="help.setEnabled($any($event.target).checked)">
    <span>{{ 'Show help next to the field I am filling in' | t }}</span></label>`,
})
export class ZFieldHelpToggleComponent {
  constructor(public help: FieldHelpService) {}
}
