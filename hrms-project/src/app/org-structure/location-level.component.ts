import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from '../shared-ui/i18n.service';
import { FLOW_CSS } from '../zeo-flow/flow.service';
import { ZLocationService } from '../shared-ui/z-location.service';
import { OrgSettingsService } from './org-settings.service';

/**
 * v1.30.0 – Location level: three pages of HR › Organisation.
 *   Location level (settings) – switch location-level control on, choose the record types, see the numbers.
 *   Location access           – which locations a user may work in.
 *   Location numbering        – document-number series per location and document type.
 * API: org-structure/api/location-control/ · location-access/ · location-numbering/
 */
const API = `${environment.apiBaseUrl}/org-structure/api/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
const CSS = FLOW_CSS + `
.ll-wrap{padding:18px 22px 40px}
.ll-top{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:14px}
.ll-top h1{margin:0;font-size:22px;font-weight:700;color:#1b1640}.ll-top p{margin:4px 0 0;color:#6b7185;font-size:13px;max-width:760px}
.ll-switches{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr))}
.ll-sw{border:1px solid #e3e5ef;border-radius:12px;padding:12px 14px;background:#fff;display:flex;flex-direction:column;gap:6px}
.ll-sw.on{border-color:#b9b2ff;box-shadow:0 0 0 3px rgba(91,79,245,.07)}
.ll-sw h3{margin:0;font-size:14px;font-weight:700;color:#1b1640;display:flex;align-items:center;gap:8px}
.ll-sw p{margin:0;font-size:12.5px;color:#6b7185;line-height:1.45}
.ll-stats{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}
.ll-stat{border:1px solid #e3e5ef;border-radius:10px;padding:8px 14px;background:#fafafd;min-width:120px}
.ll-stat b{display:block;font-size:20px;color:#1b1640}.ll-stat span{font-size:12px;color:#6b7185}
.ll-models{display:grid;gap:6px 14px;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr))}
.ll-models label{display:flex;align-items:center;gap:8px;font-size:13px;color:#2b2f42;padding:4px 0}
.ll-models label small{color:#9aa0b4}
.ll-module{grid-column:1/-1;font-size:11.5px;font-weight:700;color:#6b7185;text-transform:uppercase;letter-spacing:.03em;margin-top:8px}
.ll-form{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));align-items:end}
.ll-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185}
.ll-form input,.ll-form select{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0}
.ll-msg{border-radius:8px;padding:8px 12px;font-size:13px;margin:0 0 12px;background:#ecfdf3;color:#1f7a4d}.ll-msg.err{background:#fff5f5;color:#b42318}
.ll-locs{display:flex;flex-wrap:wrap;gap:6px}
.ll-locs label{display:inline-flex;align-items:center;gap:5px;border:1px solid #e3e5ef;border-radius:999px;padding:3px 10px;font-size:12.5px;background:#fff;cursor:pointer}
.ll-locs label.on{border-color:#5b4fe0;background:#efedff;color:#4338ca}
.ll-search{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;width:min(320px,100%)}
.ll-wide{overflow:auto}
`;

function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail; }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}

// ---------------------------------------------------------------- settings
@Component({
  selector: 'app-location-control',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styleUrls: ['./org-structure.css'],
  styles: [CSS],
  template: `
<div class="ll-wrap">
  <div class="ll-top">
    <div>
      <h1>{{ 'Location level' | t }}</h1>
      <p>{{ 'Switched on, a location is a level under the branch: the header gets a location switcher, users can be limited to locations, every transaction is tagged with its location and document numbers can run per location. Switched off (the default), locations are a plain master of the employee form.' | t }}</p>
    </div>
    <div class="lp-actions"><button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || !d.can_change">{{ busy ? ('Saving…' | t) : ('Save' | t) }}</button></div>
  </div>
  <div class="ll-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
  <p class="lp-muted" *ngIf="d && !d.can_change">{{ 'Only HR administrators can change these settings.' | t }}</p>
  <p class="lp-muted" *ngIf="d && !d.use_locations && !d.location_control">{{ 'Locations are switched off in Organisation settings – switching location-level control on turns them on.' | t }}</p>

  <div class="ll-switches" *ngIf="d">
    <div class="ll-sw" [class.on]="d.location_control">
      <h3>{{ 'Location-level control' | t }}
        <label class="os-switch"><input type="checkbox" [(ngModel)]="d.location_control" [disabled]="!d.can_change"><span class="tr"></span>{{ d.location_control ? ('On' | t) : ('Off' | t) }}</label></h3>
      <p>{{ 'Every active location must belong to one branch. The header shows the locations of the selected branches; new records are tagged with the working location.' | t }}</p>
      <p *ngIf="d.stats.without_branch" style="color:#b42318">{{ '{0} active location(s) have no branch yet – set it on the Locations page first.' | t:d.stats.without_branch }}</p>
    </div>
    <div class="ll-sw" [class.on]="d.location_restrict">
      <h3>{{ 'Restrict users by location' | t }}
        <label class="os-switch"><input type="checkbox" [(ngModel)]="d.location_restrict" [disabled]="!d.can_change || !d.location_control"><span class="tr"></span>{{ d.location_restrict ? ('On' | t) : ('Off' | t) }}</label></h3>
      <p>{{ 'A user with locations in Location access (or an own location on the employee record) sees and changes only the records and employees of those locations. Company administrators and users without a location are not limited.' | t }}</p>
      <a routerLink="../location-access">{{ 'Location access' | t }} →</a>
    </div>
    <div class="ll-sw" [class.on]="d.location_numbering">
      <h3>{{ 'Document numbers per location' | t }}
        <label class="os-switch"><input type="checkbox" [(ngModel)]="d.location_numbering" [disabled]="!d.can_change || !d.location_control"><span class="tr"></span>{{ d.location_numbering ? ('On' | t) : ('Off' | t) }}</label></h3>
      <p>{{ 'When the working location has a series for the document type, the number comes from it; otherwise from the branch series as before.' | t }}</p>
      <a routerLink="../location-numbering">{{ 'Location numbering' | t }} →</a>
    </div>
    <div class="ll-sw" [class.on]="d.location_required">
      <h3>{{ 'Location required on new records' | t }}
        <label class="os-switch"><input type="checkbox" [(ngModel)]="d.location_required" [disabled]="!d.can_change || !d.location_control"><span class="tr"></span>{{ d.location_required ? ('On' | t) : ('Off' | t) }}</label></h3>
      <p>{{ 'A new transaction is refused when no working location is chosen and the user has none of their own.' | t }}</p>
    </div>
  </div>

  <div class="ll-stats" *ngIf="d">
    <div class="ll-stat"><b>{{ d.stats.locations }}</b><span>{{ 'active locations' | t }}</span></div>
    <div class="ll-stat"><b>{{ d.stats.users_restricted }}</b><span>{{ 'users limited to locations' | t }}</span></div>
    <div class="ll-stat"><b>{{ d.stats.series }}</b><span>{{ 'location number series' | t }}</span></div>
    <div class="ll-stat"><b>{{ d.stats.tagged }}</b><span>{{ 'records tagged with a location' | t }}</span></div>
    <a class="ll-stat" routerLink="../locations" style="text-decoration:none"><b>→</b><span>{{ 'Locations' | t }}</span></a>
  </div>

  <div class="fw-card" *ngIf="d">
    <h2>{{ 'Record types with a location' | t }}
      <span class="lp-muted" style="font-weight:400;font-size:12.5px;margin-left:8px">{{ onCount() }} / {{ d.models.length }}</span>
      <span style="float:right;font-size:12.5px"><a class="fw-link" (click)="setAll(true)">{{ 'All' | t }}</a> · <a class="fw-link" (click)="setAll(false)">{{ 'None' | t }}</a> · <a class="fw-link" (click)="setDefault()">{{ 'Standard set' | t }}</a></span>
    </h2>
    <p class="lp-muted" style="margin:0 0 8px">{{ 'Ticked record types are tagged with the working location when they are created, filtered by the switcher and limited for restricted users. Masters are never limited.' | t }}</p>
    <div class="ll-models">
      <ng-container *ngFor="let m of d.models; let i = index">
        <div class="ll-module" *ngIf="i === 0 || d.models[i-1].module !== m.module">{{ moduleName(m.module) }}</div>
        <label><input type="checkbox" [(ngModel)]="m.on" [disabled]="!d.can_change"> {{ m.label }} <small>{{ m.app }}</small></label>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class LocationControlComponent implements OnInit {
  d: any = null; busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private zloc: ZLocationService, private org: OrgSettingsService) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(API + 'location-control/', { params: { schema: schema() } })); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  onCount(): number { return (this.d?.models || []).filter((m: any) => m.on).length; }
  setAll(v: boolean): void { for (const m of this.d.models) { m.on = v; } }
  setDefault(): void { for (const m of this.d.models) { m.on = m.default; } }
  moduleName(k: string): string { return ({ hrms: 'HR', payroll: 'Payroll', projects: 'Projects', crm: 'CRM', property: 'Property', maintenance: 'Maintenance', hse: 'HSE' } as any)[k] || k; }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    const models = this.d.models.filter((m: any) => m.on).map((m: any) => m.key);
    const allOn = models.length === this.d.models.length;
    const body = { location_control: this.d.location_control, location_restrict: this.d.location_restrict, location_numbering: this.d.location_numbering,
                   location_required: this.d.location_required, models: allOn ? [] : models };
    try {
      this.d = await firstValueFrom(this.http.put<any>(API + 'location-control/', body, { params: { schema: schema() } }));
      this.msg = 'Saved.'; this.zloc.load(schema(), true).subscribe(); this.org.load(true).subscribe();
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}

// ---------------------------------------------------------------- user access
@Component({
  selector: 'app-location-access',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="ll-wrap">
  <div class="ll-top">
    <div>
      <h1>{{ 'Location access' | t }}</h1>
      <p>{{ 'The locations a user may work in. Empty = every location of the user’s branches. A user with none here but with a location on their employee record is limited to that one. Applies when “Restrict users by location” is on.' | t }}</p>
    </div>
    <input class="ll-search" [(ngModel)]="q" [placeholder]="'Search user' | t">
  </div>
  <div class="ll-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
  <div class="fw-card ll-wide" *ngIf="d">
    <table class="fw-table" zPlain>
      <thead><tr><th>{{ 'User' | t }}</th><th>{{ 'Employee' | t }}</th><th>{{ 'Own location' | t }}</th><th>{{ 'Locations' | t }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let u of rows()">
          <td><b>{{ u.username }}</b><br><small class="lp-muted">{{ u.email }}</small> <span class="fw-chip" *ngIf="u.is_superuser">{{ 'admin' | t }}</span></td>
          <td>{{ u.employee || '–' }}</td>
          <td>{{ u.own_location || '–' }}</td>
          <td>
            <ng-container *ngIf="edit !== u.user_id">{{ u.locations || ('All (not limited)' | t) }}</ng-container>
            <div class="ll-locs" *ngIf="edit === u.user_id">
              <label *ngFor="let l of d.locations" [class.on]="sel.includes(l.id)"><input type="checkbox" [checked]="sel.includes(l.id)" (change)="toggle(l.id)" style="display:none">{{ l.name }}</label>
            </div>
          </td>
          <td style="white-space:nowrap">
            <ng-container *ngIf="d.can_change && !u.is_superuser">
              <a class="fw-link" *ngIf="edit !== u.user_id" (click)="start(u)">{{ 'Change' | t }}</a>
              <ng-container *ngIf="edit === u.user_id">
                <button type="button" class="lp-btn primary" (click)="save(u)" [disabled]="busy">{{ 'Save' | t }}</button>
                <button type="button" class="lp-btn" (click)="edit = null">{{ 'Cancel' | t }}</button>
              </ng-container>
            </ng-container>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
})
export class LocationAccessComponent implements OnInit {
  d: any = null; q = ''; edit: number | null = null; sel: number[] = []; busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(API + 'location-access/', { params: { schema: schema() } })); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  rows(): any[] {
    const q = this.q.trim().toLowerCase();
    return (this.d?.users || []).filter((u: any) => !q || (u.username + ' ' + u.email + ' ' + u.employee).toLowerCase().includes(q));
  }
  start(u: any): void { this.edit = u.user_id; this.sel = u.location_ids.slice(); }
  toggle(id: number): void { const i = this.sel.indexOf(id); if (i > -1) { this.sel.splice(i, 1); } else { this.sel.push(id); } }
  async save(u: any): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    try {
      await firstValueFrom(this.http.put<any>(API + 'location-access/', { user_id: u.user_id, location_ids: this.sel }, { params: { schema: schema() } }));
      u.location_ids = this.sel.slice();
      u.locations = this.d.locations.filter((l: any) => this.sel.includes(l.id)).map((l: any) => l.name).join(', ');
      this.edit = null; this.msg = 'Saved.';
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}

// ---------------------------------------------------------------- numbering
@Component({
  selector: 'app-location-numbering',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="ll-wrap">
  <div class="ll-top">
    <div>
      <h1>{{ 'Location numbering' | t }}</h1>
      <p>{{ 'A document-number series per location and document type. A record made in the working location takes the next number of its series; when the location has none, the branch series (Settings › Document numbering) is used. Prefixes must differ between locations and branches.' | t }}</p>
    </div>
  </div>
  <div class="ll-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
  <p class="lp-muted" *ngIf="d && !d.numbering_on">{{ 'Document numbers per location are switched off on the Location level page – series can be prepared, but numbers come from the branch until it is on.' | t }}</p>

  <div class="fw-card" *ngIf="d?.can_change">
    <h2>{{ (f.id ? 'Change series' : 'New series') | t }}</h2>
    <div class="ll-form">
      <label>{{ 'Location' | t }}<select [(ngModel)]="f.location" [disabled]="!!f.id"><option [ngValue]="null">–</option><option *ngFor="let l of d.locations" [ngValue]="l.id">{{ l.name }}</option></select></label>
      <label>{{ 'Document type' | t }}<select [(ngModel)]="f.type" [disabled]="!!f.id"><option [ngValue]="null">–</option><option *ngFor="let t of d.types" [ngValue]="t.value">{{ t.label }}</option></select></label>
      <label>{{ 'Prefix' | t }}<input [(ngModel)]="f.prefix" maxlength="50" placeholder="e.g. DXB-SA-LV"></label>
      <label>{{ 'Suffix' | t }}<input [(ngModel)]="f.suffix" maxlength="50"></label>
      <label>{{ 'Total length' | t }}<input type="number" [(ngModel)]="f.total_length" min="4" max="40"></label>
      <label>{{ 'Valid from' | t }}<input type="date" [(ngModel)]="f.start_date"></label>
      <label>{{ 'Valid until' | t }}<input type="date" [(ngModel)]="f.end_date"></label>
      <div style="display:flex;gap:6px">
        <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || !f.location || !f.type || !f.prefix">{{ 'Save' | t }}</button>
        <button type="button" class="lp-btn" (click)="reset()" *ngIf="f.id">{{ 'Cancel' | t }}</button>
      </div>
    </div>
  </div>

  <div class="fw-card ll-wide" *ngIf="d">
    <table class="fw-table" zPlain>
      <thead><tr><th>{{ 'Location' | t }}</th><th>{{ 'Document type' | t }}</th><th>{{ 'Prefix' | t }}</th><th>{{ 'Length' | t }}</th><th>{{ 'Last number' | t }}</th><th>{{ 'Next' | t }}</th><th>{{ 'Valid' | t }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let r of d.rows">
          <td>{{ r.location_name }}</td><td>{{ r.type_label }}</td><td>{{ r.prefix }}{{ r.suffix }}</td><td>{{ r.total_length }}</td>
          <td>{{ r.current_number }}</td><td><code>{{ r.preview }}</code></td>
          <td>{{ r.start_date || '' }}{{ r.start_date || r.end_date ? ' – ' : '' }}{{ r.end_date || '' }}</td>
          <td style="white-space:nowrap" *ngIf="d.can_change"><a class="fw-link" (click)="pick(r)">{{ 'Change' | t }}</a> · <a class="fw-link" (click)="del(r)">{{ 'Delete' | t }}</a></td>
        </tr>
        <tr *ngIf="!d.rows.length"><td colspan="8" class="lp-muted">{{ 'No location series yet – numbers come from the branch series.' | t }}</td></tr>
      </tbody>
    </table>
  </div>
</div>`,
})
export class LocationNumberingComponent implements OnInit {
  d: any = null; busy = false; msg = ''; bad = false;
  f: any = this.blank();
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  blank(): any { return { id: null, location: null, type: null, prefix: '', suffix: '', total_length: 12, start_date: null, end_date: null }; }
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(API + 'location-numbering/', { params: { schema: schema() } })); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  reset(): void { this.f = this.blank(); }
  pick(r: any): void { this.f = { id: r.id, location: r.location, type: r.type, prefix: r.prefix, suffix: r.suffix || '', total_length: r.total_length, start_date: r.start_date, end_date: r.end_date }; }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    const body = { ...this.f, start_date: this.f.start_date || null, end_date: this.f.end_date || null };
    try {
      if (this.f.id) { await firstValueFrom(this.http.patch(API + `location-numbering/${this.f.id}/`, body, { params: { schema: schema() } })); }
      else { await firstValueFrom(this.http.post(API + 'location-numbering/', body, { params: { schema: schema() } })); }
      this.msg = 'Saved.'; this.reset(); await this.load();
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async del(r: any): Promise<void> {
    if (!confirm('Delete this series? Numbers already given stay on their records.')) { return; }
    try { await firstValueFrom(this.http.delete(API + `location-numbering/${r.id}/`, { params: { schema: schema() } })); await this.load(); }
    catch (e) { this.msg = err(e); this.bad = true; this.cd.detectChanges(); }
  }
}
