import { ChangeDetectorRef, Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CountryPackService } from '../shared-ui/country-pack.service';
import { CpApplyResult, CpSettings, CountrySettingsApi } from './country-settings.service';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface LabelRow { key: string; title: string; value: string; def: string; }
interface FeatureRow { key: string; title: string; help: string; on: boolean; def: boolean; }

/**
 * v1.14.0 – Settings → Country settings (company admin): the company country and its country pack, every caption
 * (editable, back to the pack's caption with one click), every country feature (on / off), the labour-law rule set
 * in force and "Apply country defaults". API: /country-pack/api/settings/ and apply-defaults/.
 */
@Component({
  selector: 'app-country-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['../leave-policy/leave-policy.css', '../org-structure/org-structure.css', './country-settings.css'],
  template: `
<div class="container os-wrap cp-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Country settings</h1>
          <p class="lp-desc">The company country decides the captions, fields and rules that are specific to a country – for example
            Emirates ID, labour card, WPS and gratuity for the UAE. Change a caption or switch a feature here when your company needs something different.</p>
        </div>
        <div class="lp-actions" *ngIf="s">
          <button type="button" class="lp-btn" (click)="applyDefaults()" [disabled]="busy">{{ applying ? 'Applying…' : 'Apply country defaults' }}</button>
          <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || !dirty()">{{ saving ? 'Saving…' : 'Save changes' }}</button>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
      <p class="lp-muted" *ngIf="!s && !msg">Loading the country settings…</p>

      <ng-container *ngIf="s">
        <!-- country, pack, currency, rule set -->
        <div class="os-facts">
          <div><span>Company country</span><b>{{ s.country.name || 'Not set' }}</b>
            <small>Change it in Settings → Company.</small></div>
          <div><span>Country pack in use</span><b>{{ packName(s.pack) }}</b>
            <small *ngIf="s.pack_override">Chosen here instead of the pack of the company country ({{ packName(s.auto_pack) }}).</small>
            <small *ngIf="!s.pack_override">Follows the company country.</small></div>
          <div><span>Currency</span><b>{{ s.resolved.currency.code }}</b>
            <small>{{ s.resolved.currency.decimals }} decimals. From the company record.</small></div>
          <div><span>Labour-law rule set</span><b>{{ s.resolved.rules.rule_set_name || 'None' }}</b>
            <small>Weekend: {{ weekend() }}.
              <a routerLink="/main-sidebar/org-structure/country-policies">Open Organisation → Country policies</a></small></div>
        </div>

        <div class="cp-row">
          <label class="cp-pack">Pack
            <select [(ngModel)]="pack" aria-label="Country pack">
              <option value="">From the company country ({{ packName(s.auto_pack) }})</option>
              <option *ngFor="let p of s.packs" [value]="p.code">{{ p.code }} – {{ p.name }}</option>
            </select>
          </label>
          <p class="lp-muted" *ngIf="pack !== (s.pack_override || '')">Save to switch the pack. Captions and features below then show the new pack’s defaults; your own changes are kept.</p>
        </div>

        <!-- features -->
        <div class="os-sec">Features</div>
        <p class="lp-muted cp-note">Switched off, the fields and reports of that feature are hidden for everyone in the company. Data already entered is kept.</p>
        <div class="os-grid">
          <div class="os-card" *ngFor="let f of features" [class.on]="f.on">
            <h3>{{ f.title }}
              <label class="os-switch"><input type="checkbox" [(ngModel)]="f.on" [attr.aria-label]="'Use ' + f.title"><span class="tr"></span>{{ f.on ? 'On' : 'Off' }}</label>
            </h3>
            <p>{{ f.help }}</p>
            <div class="cp-def" *ngIf="f.on !== f.def">
              <span class="os-tag warn">Changed – the pack default is {{ f.def ? 'on' : 'off' }}</span>
              <button type="button" class="cp-link" (click)="f.on = f.def">Back to default</button>
            </div>
          </div>
        </div>

        <!-- captions -->
        <div class="os-sec">Captions</div>
        <p class="lp-muted cp-note">The words shown on screens, forms and reports. Leave a caption as it is to use the pack’s caption.</p>
        <div class="lp-scroll">
          <table class="lp-lines cp-labels">
            <thead><tr><th>What IT names</th><th>Caption shown</th><th>Pack caption</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let l of labels">
                <td class="name">{{ l.title }}<small>{{ l.key }}</small></td>
                <td><input type="text" [(ngModel)]="l.value" maxlength="60" [placeholder]="l.def" [attr.aria-label]="'Caption for ' + l.title"></td>
                <td class="cp-defcol">{{ l.def || '–' }}</td>
                <td>
                  <span class="os-tag warn" *ngIf="changed(l)">Changed</span>
                  <button type="button" class="cp-link" *ngIf="changed(l)" (click)="l.value = l.def">Reset to pack default</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- apply defaults result -->
        <ng-container *ngIf="result">
          <div class="os-sec">Country defaults</div>
          <p class="lp-muted">{{ result.message }}</p>
          <ul class="cp-result">
            <li *ngFor="let a of result.added"><span class="os-tag ok">Added</span> <b>{{ a.kind }}</b> {{ a.name }} <small>{{ a.detail }}</small></li>
            <li *ngFor="let a of result.kept"><span class="os-tag">Kept</span> <b>{{ a.kind }}</b> {{ a.name }} <small>{{ a.detail }}</small></li>
          </ul>
        </ng-container>
        <p class="lp-muted cp-note">“Apply country defaults” adds the pack’s document types and the country rule set, adds leave types only when the company has none,
          and sets the weekend of the rule set on the default weekend calendar if it was never changed. Nothing you set up is changed or removed; you can run it again.</p>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class CountrySettingsComponent implements OnInit {
  s: CpSettings | null = null;
  pack = '';
  labels: LabelRow[] = [];
  features: FeatureRow[] = [];
  result: CpApplyResult | null = null;
  busy = false; saving = false; applying = false; msg = ''; err = false;
  private saved = '';

  constructor(private api: CountrySettingsApi, private cd: ChangeDetectorRef, @Optional() private cp: CountryPackService | null) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try {
      this.fill(await firstValueFrom(this.api.settings()));
    } catch (e: any) {
      this.fail(e, 'The country settings could not be loaded.');
    }
    this.cd.markForCheck();
  }

  private fill(s: CpSettings): void {
    this.s = s;
    this.pack = s.pack_override || '';
    this.labels = s.label_titles.map(t => ({ key: t.key, title: t.title, def: s.defaults.labels[t.key] || '', value: s.resolved.labels[t.key] || '' }));
    this.features = s.feature_titles.map(t => ({ key: t.key, title: t.title, help: t.help || '', def: !!s.defaults.features[t.key], on: !!s.resolved.features[t.key] }));
    this.saved = this.snapshot();
  }

  private snapshot(): string {
    return JSON.stringify([this.pack, this.labels.map(l => l.value.trim()), this.features.map(f => f.on)]);
  }

  dirty(): boolean { return !!this.s && this.snapshot() !== this.saved; }

  changed(l: LabelRow): boolean { return (l.value || '').trim() !== '' && l.value.trim() !== l.def; }

  packName(code: string): string {
    const p = this.s?.packs.find(x => x.code === code);
    return p ? `${p.name} (${p.code})` : code;
  }

  weekend(): string {
    const d = this.s?.resolved.rules.weekend_days || [];
    return d.length ? d.map(i => DAYS[i] || i).join(' and ') : 'not set';
  }

  async save(): Promise<void> {
    if (!this.s) { return; }
    const label_overrides: Record<string, string> = {};
    for (const l of this.labels) { if (this.changed(l)) { label_overrides[l.key] = l.value.trim(); } }
    const feature_overrides: Record<string, boolean> = {};
    for (const f of this.features) { if (f.on !== f.def) { feature_overrides[f.key] = f.on; } }
    this.busy = this.saving = true; this.msg = '';
    try {
      this.fill(await firstValueFrom(this.api.save({ pack_override: this.pack || null, label_overrides, feature_overrides })));
      this.msg = 'Country settings saved. Screens opened from now on use them.'; this.err = false;
      (this.cp as any)?.reload?.();
    } catch (e: any) {
      this.fail(e, 'The country settings could not be saved.');
    }
    this.busy = this.saving = false; this.cd.markForCheck();
  }

  async applyDefaults(): Promise<void> {
    // v1.26.0: unsaved changes (e.g. a new pack) are saved first, so the defaults of the pack on screen are applied
    if (this.dirty()) {
      await this.save();
      if (this.err) { return; }
    }
    this.busy = this.applying = true; this.msg = '';
    try {
      this.result = await firstValueFrom(this.api.applyDefaults(this.pack || null));
      this.msg = this.result.message; this.err = false;
      this.fill(await firstValueFrom(this.api.settings()));
      (this.cp as any)?.reload?.();
    } catch (e: any) {
      this.fail(e, 'The country defaults could not be applied.');
    }
    this.busy = this.applying = false; this.cd.markForCheck();
  }

  private fail(e: any, text: string): void {
    this.err = true;
    this.msg = e?.status === 403 ? 'Only the company administrator can see or change the country settings.'
      : (e?.error?.detail || text);
  }
}
