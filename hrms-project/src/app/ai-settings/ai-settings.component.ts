import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AiProvider, AiSettings, AiSettingsApi, AiSettingsPatch, AiTestResult } from './ai-settings.service';

/**
 * v1.16.0 – Settings → AI settings (company administrator).
 * Default: the built-in, free AI (nothing leaves the server) for Ask ZEO and documents. Optional: an external AI provider
 * (Anthropic / OpenAI-compatible / Azure OpenAI) with its own address, model and key, switched on per feature, with a
 * monthly call limit. External is only possible when the server administrator allows it (ZEO_AI_EXTERNAL=true in .env).
 * The API key is never sent back to the browser: only its last 4 characters are shown.
 */
@Component({
  selector: 'app-ai-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', '../org-structure/org-structure.css', './ai-settings.css'],
  template: `
<div class="container os-wrap ai-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">AI settings</h1>
          <p class="lp-desc">Ask ZEO and the document reader use the built-in AI by default: it is free and your data stays on this server.
            You can connect an external AI provider instead, for one or both features.</p>
        </div>
        <div class="lp-actions" *ngIf="s">
          <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || !dirty()">{{ saving ? 'Saving…' : 'Save changes' }}</button>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
      <p class="lp-muted" *ngIf="!s && !msg">Loading the AI settings…</p>

      <ng-container *ngIf="s">
        <div class="os-facts">
          <div><span>Ask ZEO uses</span><b>{{ s.effective.ask === 'external' ? 'External AI' : 'Built-in AI (free)' }}</b>
            <small>{{ s.effective.ask === 'external' ? 'Questions and the report rows needed to answer are sent to the provider.' : 'Answers come from the company’s reports on this server.' }}</small></div>
          <div><span>Documents use</span><b>{{ s.effective.documents === 'external' ? 'External AI' : 'Built-in reader (free)' }}</b>
            <small>Reads document type, number and dates; you confirm before anything is filled.</small></div>
          <div><span>Text recognition (OCR)</span><b>{{ s.ocr_available ? 'Available on the server' : 'Not installed' }}</b>
            <small>{{ s.ocr_available ? 'Photos and scanned PDFs can be read.' : 'Only PDFs with text can be read. Ask the server administrator to install tesseract-ocr.' }}</small></div>
          <div><span>External calls this month</span><b>{{ s.used_this_month }} of {{ s.monthly_limit }}</b>
            <small>When the limit is reached, the built-in AI answers until the next month.</small></div>
        </div>

        <div class="os-sec">Which AI to use</div>
        <div class="ai-modes" role="radiogroup" aria-label="Which AI to use">
          <label class="ai-mode" [class.on]="f.mode === 'builtin'">
            <input type="radio" name="ai-mode" value="builtin" [(ngModel)]="f.mode">
            <span><b>Built-in (free, data stays on the server)</b>
              <small>Ask ZEO answers from your company’s reports; documents are read on the server. No outside service, no cost.</small></span>
          </label>
          <label class="ai-mode" [class.on]="f.mode === 'external'" [class.off]="!s.server_external_allowed">
            <input type="radio" name="ai-mode" value="external" [(ngModel)]="f.mode" [disabled]="!s.server_external_allowed">
            <span><b>External AI</b>
              <small *ngIf="s.server_external_allowed">Connect your own account with an AI provider (Anthropic, OpenAI or a compatible service, Azure OpenAI). The provider may charge for each call.</small>
              <small *ngIf="!s.server_external_allowed"><span class="os-tag warn">Unavailable</span> Switched off by the server administrator. External AI can only be used when the server allows it (setting ZEO_AI_EXTERNAL on the server).</small></span>
          </label>
        </div>

        <ng-container *ngIf="f.mode === 'external' || (s.mode === 'external')">
          <div class="ai-notice" role="note">
            <b>What is sent outside when external AI is on</b>
            <ul>
              <li *ngIf="f.use_ask">{{ s.data_sent.ask }}</li>
              <li *ngIf="f.use_documents">{{ s.data_sent.documents }}</li>
              <li *ngIf="f.use_tickets">{{ s.data_sent.tickets }}</li>
              <li *ngIf="!f.use_ask && !f.use_documents && !f.use_tickets">Nothing – the features below are switched off, so the built-in AI is used.</li>
            </ul>
            <p>{{ s.data_sent.general }} Every external call is logged (who, when, feature and size – never the content). If the provider cannot be reached, the built-in AI answers instead.</p>
          </div>

          <div class="os-sec">External AI connection</div>
          <div class="lp-form">
            <label>Provider
              <select [(ngModel)]="f.provider" (ngModelChange)="tested = null" aria-label="Provider" [disabled]="!s.server_external_allowed">
                <option *ngFor="let p of s.providers" [value]="p.code">{{ p.label }}</option>
              </select>
            </label>
            <label class="wide">API address
              <input type="url" [(ngModel)]="f.api_url" (ngModelChange)="tested = null" maxlength="500" [placeholder]="prov()?.default_url || 'https://<resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-10-21'" [disabled]="!s.server_external_allowed">
              <small class="ai-hint">{{ f.provider === 'azure' ? 'The full address of your Azure OpenAI deployment (chat completions).' : 'Leave empty to use the provider’s standard address shown in grey.' }}</small>
            </label>
            <label>Model
              <input type="text" [(ngModel)]="f.model" (ngModelChange)="tested = null" maxlength="120" [placeholder]="prov()?.default_model || 'set by the deployment'" [disabled]="!s.server_external_allowed">
              <small class="ai-hint">Leave empty for {{ prov()?.default_model || 'the deployment’s model' }}.</small>
            </label>
            <label>API key
              <input type="password" autocomplete="new-password" [(ngModel)]="f.api_key" (ngModelChange)="tested = null" maxlength="500"
                     [placeholder]="s.key_set && !f.clear_key ? 'Saved key ending in ' + s.key_last4 + ' – type to replace' : 'Paste the API key'" [disabled]="!s.server_external_allowed">
              <small class="ai-hint" *ngIf="s.key_set && !s.key_unreadable && !f.clear_key">Saved, encrypted. Shown only as ••••{{ s.key_last4 }}.
                <button type="button" class="cp-link" (click)="f.clear_key = true; f.api_key = ''">Remove the saved key</button></small>
              <small class="ai-hint err" *ngIf="s.key_unreadable">The saved key cannot be read any more (the server’s encryption key changed). Paste the key again.</small>
              <small class="ai-hint" *ngIf="f.clear_key">The saved key will be removed when you save. <button type="button" class="cp-link" (click)="f.clear_key = false">Keep IT</button></small>
            </label>
            <label>Monthly limit (external calls)
              <input type="number" min="1" max="1000000" step="1" [(ngModel)]="f.monthly_limit" aria-label="Monthly limit of external calls">
              <small class="ai-hint">For the whole company. One Ask ZEO question can need several calls.</small>
            </label>
          </div>
          <div class="ai-test">
            <button type="button" class="lp-btn" (click)="test()" [disabled]="busy || !s.server_external_allowed">{{ testing ? 'Testing…' : 'Test connection' }}</button>
            <span class="os-tag" *ngIf="tested" [class.ok]="tested.ok" [class.bad]="!tested.ok" role="status">{{ tested.ok ? 'Connected' : 'Not connected' }}</span>
            <span class="lp-muted" *ngIf="tested">{{ tested.message }}</span>
            <span class="lp-muted" *ngIf="!tested">Sends one short test message with the values above (also before you save).</span>
          </div>

          <div class="os-sec">Use the external AI for</div>
          <div class="os-grid">
            <div class="os-card" [class.on]="f.use_ask">
              <h3>Ask ZEO
                <label class="os-switch"><input type="checkbox" [(ngModel)]="f.use_ask" aria-label="Use the external AI for Ask ZEO"><span class="tr"></span>{{ f.use_ask ? 'On' : 'Off' }}</label>
              </h3>
              <p>Questions in plain language, with follow-up questions. Off: Ask ZEO keeps answering with the built-in AI.</p>
            </div>
            <div class="os-card" [class.on]="f.use_documents">
              <h3>Documents
                <label class="os-switch"><input type="checkbox" [(ngModel)]="f.use_documents" aria-label="Use the external AI for documents"><span class="tr"></span>{{ f.use_documents ? 'On' : 'Off' }}</label>
              </h3>
              <p>“Fill from document” on employee documents. The text of the document is sent, not the file. Off: the built-in reader is used.</p>
            </div>
            <div class="os-card" [class.on]="f.use_tickets" data-use-tickets>
              <h3>HR tickets
                <label class="os-switch"><input type="checkbox" [(ngModel)]="f.use_tickets" aria-label="Use the external AI for HR tickets"><span class="tr"></span>{{ f.use_tickets ? 'On' : 'Off' }}</label>
              </h3>
              <p>Suggests the category and priority of new HR tickets from the subject and the question. Off: the built-in rules (category keywords) suggest them.</p>
            </div>
          </div>
          <label class="ai-ack" *ngIf="f.mode === 'external' && s.mode !== 'external'">
            <input type="checkbox" [(ngModel)]="ack"> I have read what is sent to the external provider and my company allows it.
          </label>
        </ng-container>

        <ng-container *ngIf="s.recent_calls.length">
          <div class="os-sec">Recent external calls</div>
          <p class="lp-muted ai-note">Only who, when and how much – never the questions, answers or documents.</p>
          <div class="lp-scroll">
            <table class="lp-lines">
              <thead><tr><th>When</th><th>User</th><th>Feature</th><th>Result</th><th>Sent</th><th>Received</th><th>Time</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of s.recent_calls">
                  <td>{{ c.at | date: 'dd MMM yyyy HH:mm' }}</td>
                  <td>{{ c.user || '–' }}</td>
                  <td>{{ c.feature_label }}</td>
                  <td><span class="os-tag" [class.ok]="c.ok" [class.bad]="!c.ok">{{ c.ok ? 'OK' : c.result }}</span><small *ngIf="!c.sent" class="ai-hint"> not sent</small></td>
                  <td>{{ kb(c.request_bytes) }}</td>
                  <td>{{ kb(c.response_bytes) }}</td>
                  <td>{{ c.duration_ms ? (c.duration_ms / 1000 | number: '1.1-1') + ' s' : '–' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
        <p class="lp-muted ai-note" *ngIf="s.updated_by">Last changed by {{ s.updated_by }} on {{ s.updated_at | date: 'dd MMM yyyy HH:mm' }}.</p>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class AiSettingsComponent implements OnInit {
  s: AiSettings | null = null;
  f = { mode: 'builtin', provider: 'anthropic', api_url: '', model: '', api_key: '', clear_key: false, use_ask: true, use_documents: false, use_tickets: false, monthly_limit: 500 };
  tested: AiTestResult | null = null;
  ack = false;
  busy = false; saving = false; testing = false; msg = ''; err = false;
  private saved = '';

  constructor(private api: AiSettingsApi, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try {
      this.fill(await firstValueFrom(this.api.settings()));
    } catch (e: any) {
      this.fail(e, 'The AI settings could not be loaded.');
    }
    this.cd.markForCheck();
  }

  private fill(s: AiSettings): void {
    this.s = s;
    this.f = { mode: s.mode, provider: s.provider, api_url: s.api_url, model: s.model, api_key: '', clear_key: false,
      use_ask: s.use_ask, use_documents: s.use_documents, use_tickets: !!s.use_tickets, monthly_limit: s.monthly_limit };
    this.saved = this.snapshot();
    this.ack = false;
  }

  private snapshot(): string { return JSON.stringify(this.f); }

  dirty(): boolean { return !!this.s && this.snapshot() !== this.saved; }

  prov(): AiProvider | undefined { return this.s?.providers.find(p => p.code === this.f.provider); }

  kb(n: number): string { return !n ? '–' : n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`; }

  async save(): Promise<void> {
    if (!this.s) { return; }
    if (this.f.mode === 'external' && this.s.mode !== 'external' && !this.ack) {
      this.err = true; this.msg = 'Tick “I have read what is sent to the external provider…” to switch external AI on.'; return;
    }
    const n = Number(this.f.monthly_limit);
    if (!Number.isInteger(n) || n < 1 || n > 1000000) {
      this.err = true; this.msg = 'Enter a monthly limit between 1 and 1,000,000 calls.'; return;
    }
    const body: AiSettingsPatch = { use_ask: this.f.use_ask, use_documents: this.f.use_documents, use_tickets: this.f.use_tickets, monthly_limit: n };
    // a server without external AI keeps a company's earlier "external" choice unused – only "built-in" can be chosen
    if (this.f.mode === 'builtin' || this.s.server_external_allowed) { body.mode = this.f.mode; }
    if (this.s.server_external_allowed) {
      body.provider = this.f.provider; body.api_url = this.f.api_url.trim(); body.model = this.f.model.trim();
    }
    if (this.f.api_key.trim()) { body.api_key = this.f.api_key.trim(); }
    if (this.f.clear_key) { body.clear_key = true; }
    this.busy = this.saving = true; this.msg = '';
    try {
      this.fill(await firstValueFrom(this.api.save(body)));
      this.err = false;
      this.msg = this.s!.effective.ask === 'external' || this.s!.effective.documents === 'external'
        ? 'AI settings saved. The external AI is used for the features switched on.'
        : 'AI settings saved. The built-in AI is used.';
    } catch (e: any) {
      this.fail(e, 'The AI settings could not be saved.');
    }
    this.busy = this.saving = false; this.cd.markForCheck();
  }

  async test(): Promise<void> {
    this.busy = this.testing = true; this.tested = null;
    try {
      this.tested = await firstValueFrom(this.api.test({ provider: this.f.provider, api_url: this.f.api_url.trim(), model: this.f.model.trim(),
        ...(this.f.api_key.trim() ? { api_key: this.f.api_key.trim() } : {}) }));
      if (this.s) { this.s.recent_calls = (await firstValueFrom(this.api.settings())).recent_calls; }
    } catch (e: any) {
      this.tested = { ok: false, message: e?.status === 403 ? 'Only the company administrator can test the connection.' : (e?.error?.message || e?.error?.detail || 'The test could not be run.') };
    }
    this.busy = this.testing = false; this.cd.markForCheck();
  }

  private fail(e: any, text: string): void {
    this.err = true;
    this.msg = e?.status === 403 ? 'Only the company administrator can see or change the AI settings.' : (e?.error?.detail || text);
  }
}
