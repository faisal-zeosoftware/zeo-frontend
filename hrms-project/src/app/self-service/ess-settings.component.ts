// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EssApiService } from './ess-api.service';
import { COUNTRY_PACK_UI } from '../shared-ui/country-pack.service';   // v1.14.0

/**
 * v1.13.0 – Self-service settings (HR):
 *  - field policy: per profile field "self" / "request" / "hr" / "hidden";
 *  - HR letter templates with placeholders (English / Arabic, per branch);
 *  - complaint categories: SLA days, grievance officers, escalation.
 */
@Component({
  selector: 'app-ess-settings',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">Self-service settings</h1>
          <p class="es-desc">Choose what employees may change themselves, what needs HR approval and what only HR keeps. Edit the HR letter templates and the complaint rules.</p>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="es-tabs">
        <button type="button" class="es-tab" [class.on]="tab === 'fields'" (click)="tab = 'fields'">Profile fields</button>
        <button type="button" class="es-tab" [class.on]="tab === 'templates'" (click)="tab = 'templates'; loadTemplates()">Letter templates</button>
        <button type="button" class="es-tab" [class.on]="tab === 'complaints'" (click)="tab = 'complaints'; loadComplaints()">Complaints</button>
      </div>
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>

      <ng-container *ngIf="tab === 'fields'">
        <p class="es-muted">
          <span class="es-tag self">self</span> the employee changes it directly ·
          <span class="es-tag request">request</span> the employee asks, HR approves ·
          <span class="es-tag hr">hr</span> shown read-only ·
          <span class="es-tag hidden">hidden</span> not shown. Fields with a lock can only be "hr" or "hidden".
        </p>
        <div *ngFor="let g of grouped" class="es-panel">
          <div class="es-h">{{ g.label | zc }}</div>
          <div class="es-scroll">
            <table class="es-table" zPlain>
              <tr *ngFor="let r of g.rows">
                <td style="width:45%">{{ r.label | zc }} <span *ngIf="r.locked" title="Kept by HR">🔒</span></td>
                <td>
                  <select class="es-input" style="max-width:220px" [(ngModel)]="r.policy" (ngModelChange)="dirty = true">
                    <option value="self" [disabled]="r.locked">self – employee changes it</option>
                    <option value="request" [disabled]="r.locked">request – HR approves</option>
                    <option value="hr">hr – read-only</option>
                    <option value="hidden">hidden</option>
                  </select>
                </td>
                <td class="es-muted" style="white-space:nowrap">default: {{ r.default }}</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="es-actions" style="margin-top:12px">
          <button type="button" class="es-btn primary" [disabled]="!dirty || busy" (click)="savePolicies()">Save field settings</button>
        </div>
      </ng-container>

      <ng-container *ngIf="tab === 'templates'">
        <div class="es-cols">
          <div class="es-rows">
            <div class="es-row click" *ngFor="let t of templates" [class.on]="tpl?.id === t.id" (click)="tpl = clone(t); vers = null">
              <div class="main"><div class="t">{{ t.letter_label }} · {{ t.language === 'ar' ? 'Arabic' : 'English' }}</div><div class="s">{{ t.title }}<span *ngIf="t.branch_id"> · branch {{ t.branch_id }}</span></div></div>
              <div class="r"><span class="es-tag" [ngClass]="t.is_active ? 'approved' : 'withdrawn'">{{ t.is_active ? 'active' : 'off' }}</span></div>
            </div>
          </div>
          <div class="es-panel" *ngIf="tpl">
            <div class="es-h">{{ tpl.letter_label }} ({{ tpl.language === 'ar' ? 'Arabic' : 'English' }})<span class="es-muted" *ngIf="tpl.version" data-tpl-version> · version {{ tpl.version }}</span></div>
            <div class="es-form">
              <div class="wide"><label>Title</label><input [(ngModel)]="tpl.title" [attr.dir]="tpl.language === 'ar' ? 'rtl' : null"></div>
              <div class="wide"><label>Text</label><textarea rows="12" [(ngModel)]="tpl.body" [attr.dir]="tpl.language === 'ar' ? 'rtl' : null"></textarea>
                <div class="hint">Placeholders: <span *ngFor="let p of placeholders"><code>{{ '{' + p.key + '}' }}</code> {{ p.label }}; </span></div></div>
              <div><label>Signed by (name)</label><input [(ngModel)]="tpl.signatory_name"></div>
              <div><label>Signed by (title)</label><input [(ngModel)]="tpl.signatory_title"></div>
              <div class="wide"><label>Footer (optional)</label><input [(ngModel)]="tpl.footer"></div>
              <div><label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" [(ngModel)]="tpl.is_active"> Active</label></div>
            </div>
            <div class="es-form" style="margin-top:6px"><div class="wide"><label>What changed (kept with the version)</label><input [(ngModel)]="tpl.change_note" maxlength="300" placeholder="e.g. New signatory" data-change-note></div></div>
            <div class="es-actions" style="margin-top:10px"><button type="button" class="es-btn primary" [disabled]="busy" (click)="saveTemplate()">Save template</button>
              <button type="button" class="es-btn" (click)="loadVersions()" data-tpl-history>Versions</button></div>
            <div *ngIf="vers" style="margin-top:12px" data-tpl-versions>   <!-- v1.61.0 -->
              <div class="es-h">Versions</div>
              <p class="es-muted">Every saved wording is kept. A letter records the version it was issued with, so you can always see the text an employee received.</p>
              <div class="es-row" *ngFor="let v of vers" [attr.data-ver]="v.version">
                <div class="main"><div class="t">Version {{ v.version }}<span *ngIf="v.current"> · current</span></div>
                  <div class="s">{{ v.saved_at | date:'dd/MM/yyyy HH:mm' }}{{ v.saved_by ? ' · ' + v.saved_by : '' }}{{ v.note ? ' · ' + v.note : '' }} · {{ v.letters }} letter(s) issued</div></div>
                <div class="r"><button type="button" class="es-btn" (click)="seeVer = (seeVer?.id === v.id ? null : v)">Text</button>
                  <button type="button" class="es-btn" *ngIf="!v.current" (click)="restore(v)" [disabled]="busy" data-restore>Restore</button></div>
              </div>
              <pre *ngIf="seeVer" style="white-space:pre-wrap;background:#f6f7fb;border:1px solid #e3e6ea;border-radius:8px;padding:10px;font:inherit;font-size:12.5px" [attr.dir]="tpl.language === 'ar' ? 'rtl' : null" data-ver-text><b>{{ seeVer.title }}</b>

{{ seeVer.body }}</pre>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="tab === 'complaints'">
        <p class="es-muted">Users who hold the right "Can handle employee complaints" are grievance officers. Assign officers per category (optional – otherwise all officers of the branch see the case). The employee's own manager is never assigned automatically.</p>
        <div class="es-scroll">
          <table class="es-table" zPlain>
            <tr><th>Category</th><th>Acknowledge within (days)</th><th>Resolve within (days)</th><th>Officers</th><th>Escalate to</th></tr>
            <tr *ngFor="let c of cats">
              <td>{{ c.label }}</td>
              <td><input type="number" min="1" class="es-input" style="max-width:90px" [(ngModel)]="c.acknowledge_days"></td>
              <td><input type="number" min="1" class="es-input" style="max-width:90px" [(ngModel)]="c.sla_days"></td>
              <td><select multiple class="es-input" style="min-width:180px" [(ngModel)]="c.officer_user_ids"><option *ngFor="let h of handlers" [ngValue]="h.id">{{ h.name }}</option></select></td>
              <td><select multiple class="es-input" style="min-width:180px" [(ngModel)]="c.escalate_to_user_ids"><option *ngFor="let h of handlers" [ngValue]="h.id">{{ h.name }}</option></select></td>
            </tr>
          </table>
        </div>
        <div class="es-actions" style="margin-top:12px"><button type="button" class="es-btn primary" [disabled]="busy" (click)="saveComplaints()">Save complaint settings</button></div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class EssSettingsComponent implements OnInit {
  tab = 'fields'; rows: any[] = []; templates: any[] = []; tpl: any = null; placeholders: any[] = []; cats: any[] = []; handlers: any[] = [];
  vers: any[] | null = null; seeVer: any = null;   // v1.61.0 template versions
  dirty = false; busy = false; msg = ''; ok = '';

  constructor(private api: EssApiService, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    const t = this.route.snapshot.queryParamMap.get('tab');
    if (t) this.tab = t;
    try { this.placeholders = (await this.api.meta()).placeholders || []; } catch { this.placeholders = []; }
    await this.loadPolicies();
    if (this.tab === 'templates') this.loadTemplates();
    if (this.tab === 'complaints') this.loadComplaints();
  }

  clone(x: any): any { return JSON.parse(JSON.stringify(x)); }

  /** v1.13.0: grouped once per load – a new array on every change detection re-created ~100 selects and their
   *  tables each cycle (and the list tools re-styled every new table), which froze the page. */
  grouped: { label: string; rows: any[] }[] = [];

  groups(): { label: string; rows: any[] }[] {
    const out: { label: string; rows: any[] }[] = [];
    this.rows.forEach(r => {
      let g = out.find(x => x.label === r.group_label);
      if (!g) { g = { label: r.group_label, rows: [] }; out.push(g); }
      g.rows.push(r);
    });
    return out;
  }

  async loadPolicies(): Promise<void> {
    try { this.rows = await this.api.get('settings/policies/'); this.grouped = this.groups(); this.dirty = false; this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load the field settings.'); }
    this.cd.detectChanges();
  }

  async savePolicies(): Promise<void> {
    this.busy = true;
    try {
      const r: any = await this.api.put('settings/policies/', this.rows.map(x => ({ group: x.group, field: x.field, policy: x.policy })));
      this.rows = r.rows; this.grouped = this.groups(); this.dirty = false; this.ok = 'Field settings saved – they apply at once.'; this.msg = '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'The settings could not be saved.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async loadTemplates(): Promise<void> {
    try { this.templates = await this.api.get('letter-templates/'); this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load the letter templates.'); }
    this.cd.detectChanges();
  }

  async saveTemplate(): Promise<void> {
    this.busy = true;
    try {
      const r: any = await this.api.put(`letter-templates/${this.tpl.id}/`, this.tpl);
      this.ok = `Template "${r.title}" saved (version ${r.version}).`; this.msg = ''; this.tpl = r; await this.loadTemplates();
      if (this.vers) { await this.loadVersions(); }
    } catch (e: any) { this.msg = EssApiService.error(e, 'The template could not be saved.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async loadVersions(): Promise<void> {
    try { const r: any = await this.api.get(`letter-templates/${this.tpl.id}/versions/`); this.vers = r.versions; this.tpl.version = r.template.version; this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Could not load the versions.'); }
    this.cd.detectChanges();
  }

  async restore(v: any): Promise<void> {
    if (!confirm(`Use the wording of version ${v.version} again? It becomes a new version; the letters already issued keep theirs.`)) { return; }
    this.busy = true;
    try {
      const r: any = await this.api.post(`letter-templates/${this.tpl.id}/versions/`, { restore: v.id });
      this.vers = r.versions; this.tpl = { ...r.template }; this.seeVer = null; this.ok = `Version ${v.version} restored as version ${r.template.version}.`; this.msg = '';
      await this.loadTemplates();
    } catch (e: any) { this.msg = EssApiService.error(e, 'The version could not be restored.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async loadComplaints(): Promise<void> {
    try { const r: any = await this.api.get('complaints/settings/'); this.cats = r.categories || []; this.handlers = r.handlers || []; this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'Only grievance officers with HR rights can change the complaint settings.'); }
    this.cd.detectChanges();
  }

  async saveComplaints(): Promise<void> {
    this.busy = true;
    try { const r: any = await this.api.put('complaints/settings/', { categories: this.cats }); this.cats = r.categories; this.ok = 'Complaint settings saved.'; this.msg = ''; }
    catch (e: any) { this.msg = EssApiService.error(e, 'The complaint settings could not be saved.'); }
    this.busy = false; this.cd.detectChanges();
  }
}
