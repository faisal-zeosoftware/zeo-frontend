// v1.62.11 (item 227): new screen – Payroll › Bank file layouts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe, I18nService } from '../shared-ui/i18n.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { zConfirm } from '../shared-ui/z-confirm';
import { errText } from './pay162';

/**
 * v1.62.11 (item 227) – Payroll › Bank file layouts.
 * The Central Bank (CBUAE) WPS SIF is the base; a bank / exchange house with its own published layout (checked against its spec or
 * sample – "Verified", with the sources) gets its own file, every other one the CBUAE SIF ("Own layout to be confirmed – send us the
 * bank's spec or a sample file"). KSA branches: the Mudad / HRSD wages file (to be confirmed).
 * Set-ups: which bank pays which branches (none = company default). Make a file: run + set-up → preview (lines, checks) → download.
 * Payroll › WPS file is unchanged (same CBUAE SIF).
 * API: payroll-plus/api/bank-files/ (profiles/, preview/, download/)
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/bank-files/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
export const BF_CSS = `
.bf-wrap{padding:0 0 40px}
.bf-body{padding:0 24px}
.bf-card{background:#fff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.08);padding:14px 16px;margin:0 0 16px;min-width:0}
.bf-card h2{font-size:16px;font-weight:650;margin:0 0 4px;color:#1b1640}.bf-card p{text-align:start}.bf-card>p{margin:0 0 10px;color:#6b7185;font-size:12.5px}
.bf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.bf-chip{display:inline-block;padding:1px 9px;border-radius:10px;font-size:11.5px;white-space:nowrap;background:#eceef3;color:#555d70}
.bf-chip.ok{background:#e3f6ec;color:#1f7a4d}.bf-chip.tbc{background:#fff0d9;color:#a0610a}.bf-chip.bad{background:#fde2e4;color:#b3263a}
.bf-src{display:block;font-size:11.5px;color:#4b3fbf;word-break:break-word}
.bf-muted{color:#6b7185;font-size:12.5px}
.bf-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:6px 0 12px}
.bf-bar label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185;min-width:0}
.bf-bar select,.bf-bar input{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;background:#fff;min-width:0;max-width:100%}
.bf-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:1px solid #dfe1ea;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#2b2f42;cursor:pointer;white-space:nowrap}
.bf-btn.primary{background:#5b4ff5;border-color:#5b4ff5;color:#fff}.bf-btn:disabled{opacity:.5;cursor:default}
.bf-msg{border-radius:8px;padding:8px 12px;font-size:13px;margin:0 24px 12px;background:#ecfdf3;color:#1f7a4d}.bf-msg.err{background:#fff5f5;color:#b42318}
.bf-note{border-radius:8px;padding:8px 12px;font-size:12.5px;margin:8px 0;background:#fff8eb;color:#7a4b06}
.bf-warn{margin:6px 0;padding:0 0 0 18px;font-size:12.5px;color:#b42318}
.bf-sum{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;margin:8px 0}.bf-sum b{color:#1b1640}
.bf-pre{background:#f7f7fb;border:1px solid #eceef5;border-radius:8px;padding:10px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;overflow:auto;max-height:340px;white-space:pre;direction:ltr;text-align:left}
.bf-checks{list-style:none;margin:6px 0;padding:0;font-size:12.5px}.bf-checks li{padding:2px 0}.bf-checks .y{color:#1f7a4d}.bf-checks .n{color:#b42318}
.bf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(330px,100%),1fr));gap:12px}
.bf-lay{border:1px solid #eceef5;border-radius:10px;padding:10px 12px;min-width:0}.bf-lay h3{font-size:14px;margin:0 0 4px}
.bf-lay ol{margin:4px 0 6px;padding-inline-start:20px;font-size:12px;color:#2b2f42}.bf-lay dl{margin:0;font-size:12px}.bf-lay dt{color:#6b7185;margin-top:4px}.bf-lay dd{margin:0}
.bf-table{width:100%;border-collapse:collapse;font-size:13px}.bf-table th,.bf-table td{padding:6px 8px;border-bottom:1px solid #eceef5;text-align:start;vertical-align:top}
.bf-wide{overflow:auto}
.bf-just input{width:100%;min-width:180px;height:30px;border:1px solid #dcdfea;border-radius:7px;padding:0 8px}
@media (max-width:640px){.bf-body{padding:0 16px}.bf-msg{margin:0 16px 12px}}
`;

@Component({
  selector: 'app-bank-files',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css'],
  styles: [BF_CSS],
  template: `
<div class="container hr-page bf-wrap" data-bank-files>
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>{{ 'Bank file layouts' | t }}</h1>
          <p class="hr-head-d">{{ 'The salary file for each bank or exchange house. The Central Bank (CBUAE) WPS SIF is the base; a bank with its own published layout gets its own file once the layout has been checked against the bank’s spec or a sample file. KSA branches: the Mudad wage protection file.' | t }}</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="d?.can_set" (click)="edit(null)" data-z-new data-bf-new>{{ '+ New bank file set-up' | t }}</button>
        </div>
      </div>
    </div>
    <div class="bf-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
    <div class="bf-body" *ngIf="d">

      <!-- set-ups -->
      <div class="bf-card" data-bf-profiles>
        <h2>{{ 'Bank file set-ups' | t }}</h2>
        <p>{{ 'Which bank or exchange house pays which branches. A set-up without branches is the company default: it pays every branch that has no set-up of its own. Without any set-up the file is the Central Bank WPS SIF.' | t }}</p>
        <div class="table-responsive">
          <table class="table hr-table" data-bf-profile-list>
            <thead><tr><th>{{ 'Name' | t }}</th><th>{{ 'Payment method' | t }}</th><th>{{ 'Bank / exchange house' | t }}</th><th>{{ 'Layout' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'Branches' | t }}</th><th>{{ 'Employer reference' | t }}</th><th>{{ 'Status' | t }}</th><th class="hr-col-actions">{{ 'Actions' | t }}</th></tr></thead>
            <tbody>
              <tr *ngIf="!d.profiles.length"><td colspan="9" class="hr-empty">{{ 'No set-up yet – the file is the Central Bank WPS SIF. Use + New bank file set-up.' | t }}</td></tr>
              <tr *ngFor="let p of d.profiles" [attr.data-bf-profile]="p.id" [attr.data-z-id]="p.id">
                <td><b>{{ p.name }}</b></td><td>{{ p.method_name }}</td><td>{{ p.agent_name | t }}</td><td>{{ p.layout_name | t }}</td>
                <td><span class="bf-chip" [class.ok]="p.state === 'verified'" [class.tbc]="p.state !== 'verified'">{{ p.state_text | t }}</span></td>
                <td>{{ p.branch_names.length ? p.branch_names.join(', ') : ('Company default (all other branches)' | t) }}</td>
                <td>{{ p.employer_reference || '–' }}</td>
                <td>{{ (p.active ? 'Active' : 'Inactive') | t }}</td>
                <td class="t62-actions">
                  <button type="button" class="t62-link" *ngIf="p.method === 'wps'" (click)="useProfile(p)" data-bf-use>{{ 'Make file' | t }}</button>
                  <button type="button" class="z-row-btn" *ngIf="d.can_set" (click)="edit(p)" [title]="'Edit' | t" data-z-row-edit><mat-icon>edit</mat-icon></button>
                  <button type="button" class="z-row-btn danger" *ngIf="d.can_set" (click)="del(p)" [title]="'Delete' | t" data-z-row-delete><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- make a file -->
      <div class="bf-card" data-bf-make>
        <h2>{{ 'Make a file' | t }}</h2>
        <p>{{ 'Choose the payroll run and the set-up, look at the file and its checks, then download it. Payroll › WPS file keeps making the Central Bank SIF as before.' | t }}</p>
        <div class="bf-bar">
          <label>{{ 'Payroll run' | t }}
            <select [(ngModel)]="runId" (change)="pv = null" data-bf-run>
              <option [ngValue]="null">–</option>
              <option *ngFor="let r of d.runs" [ngValue]="r.id">{{ r.name }} · {{ r.month < 10 ? '0' + r.month : r.month }}/{{ r.year }} · {{ r.status | t }} ({{ r.payslips }})</option>
            </select></label>
          <label>{{ 'Set-up' | t }}
            <select [(ngModel)]="profileId" (change)="pv = null" data-bf-profile-pick>
              <option [ngValue]="null">{{ 'Central Bank WPS SIF (no set-up)' | t }}</option>
              <option *ngFor="let p of activeProfiles()" [ngValue]="p.id">{{ p.name }} – {{ p.agent_name | t }}</option>
            </select></label>
          <button type="button" class="bf-btn primary" (click)="preview()" [disabled]="busy || !runId" data-bf-preview>{{ 'Preview' | t }}</button>
          <button type="button" class="bf-btn" (click)="download()" [disabled]="busy || !runId || !d.can_file" data-bf-download>{{ 'Download file' | t }}</button>   <!-- not "Download": the shared list hides a page's own Export / Download buttons -->
        </div>
        <div *ngIf="pv" data-bf-result>
          <div class="bf-sum">
            <span>{{ 'Layout' | t }}: <b>{{ pv.layout_name | t }}</b></span>
            <span><span class="bf-chip" [class.ok]="pv.state === 'verified'" [class.tbc]="pv.state !== 'verified'" data-bf-state>{{ (pv.state === 'verified' ? 'Verified' : 'To be confirmed') | t }}</span></span>
            <span>{{ 'File name' | t }}: <b data-bf-filename>{{ pv.file_name }}</b></span>
            <span>{{ 'Employees' | t }}: <b>{{ pv.summary?.employees }}</b></span>
            <span>{{ 'Total' | t }}: <b>{{ pv.summary?.total }} {{ pv.summary?.currency }}</b></span>
            <span *ngIf="pv.summary?.employer_id">{{ 'Employer ID' | t }}: <b>{{ pv.summary.employer_id }}</b></span>
            <span *ngIf="pv.summary?.salary_month">{{ 'Salary month' | t }}: <b>{{ pv.summary.salary_month }}</b></span>
          </div>
          <div class="bf-note" *ngIf="pv.note" data-bf-note>{{ pv.note | t }}</div>
          <ul class="bf-warn" *ngIf="pv.warnings?.length" data-bf-warnings><li *ngFor="let w of pv.warnings">{{ w | t }}</li></ul>
          <div *ngIf="pv.changed?.length" class="bf-wide" data-bf-justify>
            <p class="bf-muted" style="margin:8px 0 4px">{{ 'Pay changed from the previous payslip – justification for ADIB (MOHRE registered):' | t }}</p>
            <table class="bf-table bf-just" zPlain>
              <thead><tr><th>{{ 'Employee' | t }}</th><th>{{ 'Before' | t }}</th><th>{{ 'Now' | t }}</th><th>{{ 'Justification' | t }}</th></tr></thead>
              <tbody><tr *ngFor="let c of pv.changed"><td>{{ c.name }} <small class="bf-muted">{{ c.emp_code }}</small></td><td>{{ c.before }}</td><td>{{ c.now }}</td>
                <td><input [(ngModel)]="just[c.emp_code]" maxlength="120" [attr.data-bf-just]="c.emp_code"></td></tr></tbody>
            </table>
            <button type="button" class="bf-btn" style="margin-top:6px" (click)="preview()" [disabled]="busy">{{ 'Preview again' | t }}</button>
          </div>
          <h3 style="font-size:14px;margin:12px 0 2px">{{ 'Checks against the layout' | t }}</h3>
          <ul class="bf-checks" data-bf-checks><li *ngFor="let c of pv.checks" [class.y]="c.ok" [class.n]="!c.ok">{{ c.ok ? '✓' : '✗' }} {{ c.check | t }}</li></ul>
          <h3 style="font-size:14px;margin:12px 0 4px">{{ 'File' | t }} <small class="bf-muted">({{ pv.lines }} {{ 'lines' | t }}{{ pv.lines > pv.preview_lines.length ? ' – ' + pv.preview_lines.length + ' shown' : '' }})</small></h3>
          <div class="bf-pre" data-bf-lines>{{ pv.preview_lines.join('\\n') }}</div>
          <div *ngIf="pv.skipped?.length" class="bf-wide" style="margin-top:10px" data-bf-skipped>
            <p class="bf-muted" style="margin:0 0 4px">{{ 'Not in the file' | t }} ({{ pv.skipped.length }})</p>
            <table class="bf-table" zPlain><tbody><tr *ngFor="let s of pv.skipped"><td>{{ s.emp_code }}</td><td>{{ s.reason | t }}</td></tr></tbody></table>
          </div>
        </div>
      </div>

      <!-- banks and exchange houses -->
      <div class="bf-card" data-bf-agents>
        <div class="bf-head"><div><h2>{{ 'Banks and exchange houses' | t }}</h2>
          <p class="bf-muted" style="margin:0 0 8px">{{ 'Verified = checked against the bank’s own published spec or sample (sources below, read on {0}). Every other bank gets the Central Bank WPS SIF until its own layout is confirmed – send us the bank’s spec or a sample file.' | t:[dmy(d.checked)] }}</p></div>
          <label class="bf-muted">{{ 'Show' | t }}
            <select [(ngModel)]="agentFilter" data-bf-agent-filter style="height:30px;border:1px solid #dcdfea;border-radius:7px;margin-inline-start:6px">
              <option value="">{{ 'All' | t }}</option><option value="verified">{{ 'Verified' | t }}</option><option value="to_confirm">{{ 'To be confirmed' | t }}</option>
            </select></label></div>
        <div class="table-responsive">
          <table class="table hr-table" data-bf-agent-list>
            <thead><tr><th>{{ 'Bank / exchange house' | t }}</th><th>{{ 'Type' | t }}</th><th>{{ 'Layout used' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'Sources' | t }}</th><th>{{ 'Notes' | t }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let a of shownAgents()" [attr.data-bf-agent]="a.code" [attr.data-z-id]="a.code">
                <td><b>{{ a.name | t }}</b></td><td>{{ kind(a.kind) | t }}</td><td>{{ a.layout_name | t }}</td>
                <td><span class="bf-chip" [class.ok]="a.state === 'verified'" [class.tbc]="a.state !== 'verified'">{{ a.state_text | t }}</span></td>
                <td><a class="bf-src" *ngFor="let s of a.sources" [href]="s.url" target="_blank" rel="noopener">{{ s.title }}</a><span *ngIf="!a.sources.length" class="bf-muted">{{ 'Nothing published found' | t }}</span></td>
                <td><small>{{ a.note | t }}</small><small class="bf-muted" *ngIf="a.fallback"><br>{{ a.fallback | t }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="bf-note" data-bf-all-agents>{{ d.all_agents.text | t }}
          <a class="bf-src" *ngFor="let s of d.all_agents.sources" [href]="s.url" target="_blank" rel="noopener">{{ s.title }}</a></div>
      </div>

      <!-- layouts -->
      <div class="bf-card" data-bf-layouts>
        <h2>{{ 'Layouts' | t }}</h2>
        <p>{{ 'Fields in file order, separators, file name, header and trailer of each layout, with its sources and open points.' | t }}</p>
        <div class="bf-grid">
          <div class="bf-lay" *ngFor="let l of d.layouts" [attr.data-bf-layout]="l.code">
            <h3>{{ l.name | t }} <span class="bf-chip" [class.ok]="l.state === 'verified'" [class.tbc]="l.state !== 'verified'">{{ (l.state === 'verified' ? 'Verified' : 'To be confirmed') | t }}</span></h3>
            <div class="bf-muted">{{ l.summary | t }}</div>
            <div *ngFor="let r of l.records"><b style="font-size:12.5px">{{ r.type | t }}</b> <small class="bf-muted">– {{ r.per | t }}</small>
              <ol><li *ngFor="let f of r.fields">{{ f | t }}</li></ol></div>
            <dl>
              <dt>{{ 'Format' | t }}</dt><dd>{{ l.format | t }} · {{ 'separator' | t }} {{ l.separator }} · {{ l.line_end }}</dd>
              <dt>{{ 'File name' | t }}</dt><dd>{{ l.file_name | t }}</dd>
              <dt>{{ 'Header / trailer' | t }}</dt><dd>{{ l.header | t }} / {{ l.trailer | t }}</dd>
              <dt>{{ 'Sources' | t }}</dt><dd><a class="bf-src" *ngFor="let s of l.sources" [href]="s.url" target="_blank" rel="noopener">{{ s.title }}</a></dd>
              <ng-container *ngIf="l.open?.length"><dt>{{ 'Open points' | t }}</dt><dd><ul style="margin:0;padding-inline-start:18px"><li *ngFor="let o of l.open">{{ o | t }}</li></ul></dd></ng-container>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class BankFilesComponent implements OnInit {
  d: any = null; pv: any = null;
  runId: number | null = null; profileId: number | null = null;
  just: Record<string, string> = {};
  agentFilter = ''; busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private i18n: I18nService) {}
  ngOnInit(): void { this.load(); }
  t(s: string, a?: any[]): string { return this.i18n.t(s, a || null); }
  async load(): Promise<void> {
    try {
      this.d = await firstValueFrom(this.http.get<any>(API, { params: { schema: schema() } }));
      if (this.runId === null) { const r = (this.d.runs || []).find((x: any) => x.status === 'paid' || x.status === 'approved') || (this.d.runs || [])[0]; this.runId = r ? r.id : null; }
    } catch (e) { this.msg = errText(e, 'The bank files could not be loaded.'); this.bad = true; }
    this.cd.detectChanges();
  }
  activeProfiles(): any[] { return (this.d?.profiles || []).filter((p: any) => p.active && p.method === 'wps'); }
  shownAgents(): any[] { return (this.d?.agents || []).filter((a: any) => !this.agentFilter || a.state === this.agentFilter); }
  kind(k: string): string { return ({ bank: 'Bank', exchange: 'Exchange house', platform: 'Government platform', standard: 'Standard' } as any)[k] || k; }
  dmy(v: any): string { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : (v || ''); }
  useProfile(p: any): void { this.profileId = p.id; this.pv = null; this.preview(); }

  form(): ZFormConfig {
    const agents = (this.d?.agents || []).map((a: any) => ({ value: a.code, label: `${this.t(a.name)} – ${this.t(a.state_text)}`, raw: a }));
    const lay = (v: any) => (v?.method && v.method !== 'wps') ? '' : ((this.d?.agents || []).find((a: any) => a.code === v?.agent) || {}).layout;
    return {
      thing: 'bank file set-up', endpoint: '/payroll-plus/api/bank-files/profiles/',
      subtitle: this.t('The bank or exchange house the company pays these branches through.'),
      sections: [
        { title: 'Bank file', fields: [
          { key: 'name', label: 'Name', required: true, placeholder: 'e.g. ENBD salary account – Dubai' },
          { key: 'method', label: 'Payment method', type: 'select', required: true, options: (this.d?.methods || []).map((m: any) => ({ value: m.code, label: m.name })) },   // v1.62.11 (item 227) scope addition
          { key: 'agent', label: 'Bank / exchange house', type: 'select', options: agents, search: true, showIf: v => !v.method || v.method === 'wps' || v.method === 'bank_transfer',
            hint: 'Verified banks get their own layout; the others the Central Bank WPS SIF.' },
          { key: 'layout', label: 'File layout', type: 'select', options: [{ value: '', label: this.t('The bank’s layout / the default of the method') }, ...(this.d?.payment_layouts || []).map((l: any) => ({ value: l.code, label: l.name + (l.builtin ? '' : ' ★'), raw: l }))],
            optFilter: (raw: any, v: any) => !raw || raw.method === (['wps', 'bank_transfer', 'cheque', 'cash'].includes(v.method || 'wps') ? (v.method || 'wps') : 'other'),
            hint: 'Your own layouts (★) are designed in Payroll › File layouts.' },
          { key: 'branch_ids', label: 'Branches', type: 'multi', options: (this.d?.branches || []).map((b: any) => ({ value: b.id, label: b.name })),
            hint: 'None = company default (every branch without a set-up of its own).', full: true },
          { key: 'employer_reference', label: 'Employer reference', max: 35, hint: 'SCR field 10 (optional; Mashreq: "NONE" when empty).', showIf: v => lay(v) !== 'mudad_wages' && lay(v) !== 'cbd_xlsx' },
          { key: 'account', label: 'Establishment bank account (IBAN)', max: 34, showIf: v => lay(v) === 'mudad_wages' },
          { key: 'active', label: 'Active', type: 'check' },
        ] },
        { title: 'Layout options', fields: [
          { key: 'evp', label: 'EVP lines (variable pay broken down)', type: 'check', showIf: v => lay(v) === 'sif_evp', hint: 'Only when the bank asks for them.' },
          { key: 'mohre_columns', label: 'Registered with MOHRE (justification and resident columns)', type: 'check', showIf: v => lay(v) === 'adib_mohre' },
          { key: 'resident_default', label: 'Resident column', type: 'select', options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }], showIf: v => lay(v) === 'adib_mohre' },
          { key: 'non_residents', label: 'Employees not resident in the UAE (employee codes, comma separated)', showIf: v => lay(v) === 'adib_mohre', full: true },
          { key: 'dest_bank', label: 'Establishment bank (SARIE bank ID)', max: 4, placeholder: 'e.g. RJHI', showIf: v => lay(v) === 'mudad_wages' },
          { key: 'estb_id', label: 'Establishment ID', max: 10, showIf: v => lay(v) === 'mudad_wages' },
          { key: 'mol_estb_id', label: 'MoL establishment ID', max: 15, placeholder: 'e.g. 1-123456', showIf: v => lay(v) === 'mudad_wages' },
        ] },
      ],
      initial: { active: true, mohre_columns: true, resident_default: 'Yes', branch_ids: [], method: 'wps', layout: '' },
      fromRecord: (r: any) => ({ ...r, layout: r.layout_choice || '', non_residents: (r.non_residents || []).join(', ') }),
      toBody: (v: any) => ({ ...v, branch_ids: v.branch_ids || [], active: v.active !== false }),
    };
  }
  async edit(p: any): Promise<void> { if (await openZForm(this.form(), p ? { ...p } : undefined)) { await this.load(); } }
  async del(p: any): Promise<void> {
    if (!(await zConfirm(this.t('Delete the set-up "{0}"? Its branches then use the company default or the Central Bank WPS SIF.', [p.name]), { danger: true, ok: this.t('Delete') }))) { return; }
    try {
      await firstValueFrom(this.http.delete(`${API}profiles/${p.id}/`, { params: { schema: schema() } }));
      if (this.profileId === p.id) { this.profileId = null; this.pv = null; }
      this.msg = this.t('Deleted.'); this.bad = false; await this.load();
    } catch (e) { this.msg = errText(e); this.bad = true; this.cd.detectChanges(); }
  }
  private body(): any { return { run: this.runId, profile: this.profileId, agent: this.profileId ? undefined : 'cbuae', justifications: this.just }; }
  async preview(): Promise<void> {
    if (!this.runId) { return; }
    this.busy = true; this.msg = '';
    try { this.pv = await firstValueFrom(this.http.post<any>(API + 'preview/', this.body(), { params: { schema: schema() } })); this.bad = false; }
    catch (e) { this.pv = null; this.msg = errText(e, 'The file could not be made.'); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async download(): Promise<void> {
    if (!this.runId) { return; }
    this.busy = true; this.msg = '';
    try {
      const r: any = await firstValueFrom(this.http.post<any>(API + 'download/', this.body(), { params: { schema: schema() } }));
      const bin = atob(r.content_b64); const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) { buf[i] = bin.charCodeAt(i); }
      const blob = new Blob([buf], { type: r.mime });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = r.file_name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      this.pv = r; this.bad = false; this.msg = this.t('{0} downloaded.', [r.file_name]);
    } catch (e) { this.msg = errText(e, 'The file could not be made.'); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}
