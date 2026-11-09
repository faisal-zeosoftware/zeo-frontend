// v1.67.6 (setup) item 10 – Settings › Permission groups in the new design (shared list, shared form, confirm window).
// Was a 2 800-line pop-up with hand-picked sections of every app. The rights of the ACTIVE apps only (item 7), per app and
// record type (view / add / change / delete + the special rights); saving goes through /organisation/api/Group/ (a shared
// standard group gets this company's own copy, as before).
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { zConfirm } from '../shared-ui/z-confirm';
import { zToast } from '../shared-ui/z-toast';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';

export const GROUP_NAME_FORM: ZFormConfig = {
  thing: 'permission group', endpoint: '/organisation/api/Group/',
  subtitle: 'A permission group gives its users the rights ticked in it. A user can be in several groups.',
  sections: [{ title: 'Permission group', fields: [{ key: 'name', label: 'Name', max: 120, required: true }] }],
  toBody: (v: any) => ({ name: v.name, permissions: v.permissions || [] }),
};

@Component({
  selector: 'app-permission-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ZListDirective, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './settings-apps.css'],
  styles: [`
    .pg-kind { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 12px; background: #eef0f2; color: #3c4450; }
    .pg-kind.copy { background: #fff4dc; color: #7a5200; } .pg-kind.own { background: #e3f4ea; color: #1d6b37; }
    .pg-ed { background: #fff; border: 1px solid #e3e6ea; border-radius: 12px; padding: 14px 16px; }
    .pg-top { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px; }
    .pg-top input[type=search] { flex: 1; min-width: 200px; padding: 8px 10px; border: 1px solid #cfd5dc; border-radius: 8px; font: inherit; }
    .pg-app { border: 1px solid #e3e6ea; border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
    .pg-app > header { display: flex; gap: 10px; align-items: center; padding: 10px 12px; background: #f6f7fb; cursor: pointer; }
    .pg-app > header b { flex: 1; } .pg-cnt { font-size: 12px; color: #5d6670; }
    table.pg-m { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.pg-m th, table.pg-m td { padding: 6px 10px; border-top: 1px solid #eef0f2; text-align: start; }
    table.pg-m th.c, table.pg-m td.c { text-align: center; width: 70px; }
    .pg-other { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; color: #3c4450; }
    .pg-other label { display: inline-flex; gap: 4px; align-items: center; }
    .pg-bar { position: sticky; bottom: 0; background: #fff; padding: 10px 0; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid #eef0f2; }
    @media (max-width: 700px) { table.pg-m th.c, table.pg-m td.c { width: 44px; padding: 6px 4px; } }`],
  template: `
<div class="container sa-wrap" data-permission-groups>
  <ng-container *ngIf="!ed">
    <div class="lp-head">
      <div>
        <h1 class="page-title">{{ 'Permission groups' | t }}</h1>
        <p class="lp-desc">{{ 'What the users of each group may see and do. Only the apps active in the company are shown. Standard groups are shared: changing one gives this company its own copy.' | t }}</p>
      </div>
      <button type="button" class="lp-btn primary" *ngIf="canAdd" (click)="add()" data-pg-new>{{ 'New permission group' | t }}</button>
    </div>
    <div class="lp-msg err" *ngIf="msg" role="alert">{{ msg }}</div>
    <p class="lp-muted" *ngIf="loading">{{ 'Loading…' | t }}</p>
    <div class="sa-dir-card" *ngIf="!loading">
      <table class="table" data-pg-list>
        <thead><tr><th>{{ 'Name' | t }}</th><th>{{ 'Kind' | t }}</th><th>{{ 'Users' | t }}</th><th>{{ 'Rights' | t }}</th><th>{{ 'Actions' | t }}</th></tr></thead>
        <tbody>
          <tr *ngFor="let g of rows" [attr.data-pg]="g.name">
            <td>{{ g.name }} <span class="pg-kind own" *ngIf="g.admin_all_branches">{{ 'Every branch' | t }}</span></td>
            <td><span class="pg-kind" [class.copy]="g.kind === 'copy'" [class.own]="g.kind === 'own'">{{ kindText(g.kind) | t }}</span></td>
            <td>{{ g.users }}</td><td>{{ g.rights }}</td>
            <td style="white-space:nowrap">
              <button type="button" class="lp-btn" *ngIf="canChange" (click)="open(g)" data-pg-edit>{{ 'Edit' | t }}</button>
              <button type="button" class="lp-btn" *ngIf="canAdd" (click)="duplicate(g)">{{ 'Duplicate' | t }}</button>
              <button type="button" class="lp-btn" *ngIf="canDelete" (click)="remove(g)" data-pg-delete>{{ (g.kind === 'copy' ? 'Back to standard' : 'Delete') | t }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="lp-muted" *ngIf="!rows.length">{{ 'No permission groups yet.' | t }}</p>
    </div>
  </ng-container>

  <ng-container *ngIf="ed">
    <div class="lp-head">
      <div>
        <h1 class="page-title">{{ ed.name }}</h1>
        <p class="lp-desc">{{ 'Tick what the users of this group may do. View lets them open the records, Add / Change / Delete lets them make, change or remove them.' | t }}</p>
      </div>
      <div style="display:flex;gap:8px">
        <button type="button" class="lp-btn" (click)="rename()" *ngIf="canChange">{{ 'Rename' | t }}</button>
        <button type="button" class="lp-btn" (click)="close()">{{ 'Back to the list' | t }}</button>
      </div>
    </div>
    <div class="lp-msg err" *ngIf="msg" role="alert">{{ msg }}</div>
    <div class="pg-ed" data-pg-editor>
      <div class="pg-top">
        <input type="search" [(ngModel)]="q" [placeholder]="'Search a record type or a right' | t" [attr.aria-label]="'Search' | t" data-pg-search>
        <span class="pg-cnt">{{ '{0} rights ticked' | t:[sel.size] }}</span>
      </div>
      <section class="pg-app" *ngFor="let a of apps" [attr.data-pg-app]="a.key">
        <header (click)="openApp[a.key] = !openApp[a.key]">
          <mat-icon aria-hidden="true">{{ openApp[a.key] ? 'expand_more' : 'chevron_right' }}</mat-icon>
          <b>{{ a.title | t }}</b>
          <span class="pg-cnt">{{ '{0} of {1}' | t:[ticked(a), a.count] }}</span>
          <button type="button" class="lp-btn" (click)="$event.stopPropagation(); all(a, true)" [disabled]="!canChange">{{ 'Tick all' | t }}</button>
          <button type="button" class="lp-btn" (click)="$event.stopPropagation(); all(a, false)" [disabled]="!canChange">{{ 'Untick all' | t }}</button>
        </header>
        <table class="pg-m" zPlain *ngIf="openApp[a.key] || q">
          <thead><tr><th>{{ 'Record type' | t }}</th><th class="c">{{ 'View' | t }}</th><th class="c">{{ 'Add' | t }}</th><th class="c">{{ 'Change' | t }}</th><th class="c">{{ 'Delete' | t }}</th></tr></thead>
          <tbody>
            <ng-container *ngFor="let m of shown(a)">
              <tr [attr.data-pg-model]="m.key">
                <td>{{ m.label | t }}</td>
                <td class="c" *ngFor="let v of verbs"><input type="checkbox" *ngIf="m.rights[v]" [checked]="sel.has(m.rights[v])" (change)="flip(m.rights[v])"
                  [disabled]="!canChange" [attr.aria-label]="(v | t) + ' – ' + (m.label | t)"></td>
              </tr>
              <tr *ngIf="m.other.length"><td colspan="5"><div class="pg-other">
                <label *ngFor="let o of m.other"><input type="checkbox" [checked]="sel.has(o.id)" (change)="flip(o.id)" [disabled]="!canChange">{{ o.label | t }}</label></div></td></tr>
            </ng-container>
          </tbody>
        </table>
      </section>
      <div class="pg-bar">
        <button type="button" class="lp-btn" (click)="close()">{{ 'Cancel' | t }}</button>
        <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || !canChange" data-pg-save>{{ 'Save the rights' | t }}</button>
      </div>
    </div>
  </ng-container>
</div>`,
})
export class PermissionGroupsComponent implements OnInit {
  rows: any[] = []; apps: any[] = []; loading = true; msg = ''; busy = false; q = '';
  canAdd = false; canChange = false; canDelete = false;
  ed: any = null; sel = new Set<number>(); keep: number[] = []; openApp: Record<string, boolean> = {};
  verbs = ['view', 'add', 'change', 'delete'];
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  private u(p: string): string {
    let s = ''; try { s = localStorage.getItem('selectedSchema') || ''; } catch { s = ''; }
    return `${environment.apiBaseUrl}${p}${p.includes('?') ? '&' : '?'}schema=${encodeURIComponent(s)}`;
  }
  kindText(k: string): string { return ({ standard: 'Standard', copy: "This company's copy", own: 'Made in this company' } as any)[k] || k; }
  async load(): Promise<void> {
    this.loading = true; this.msg = ''; this.cd.markForCheck();
    try {
      const r: any = await firstValueFrom(this.http.get(this.u('/zeo-apps/api/permission-groups/')));
      this.rows = r.rows || []; this.canAdd = !!r.can_add; this.canChange = !!r.can_change; this.canDelete = !!r.can_delete;
    } catch (e) { this.msg = httpErrorText(e); this.rows = []; }
    this.loading = false; this.cd.markForCheck();
  }
  async add(): Promise<void> { if (await openZForm(GROUP_NAME_FORM)) { await this.load(); } }
  async duplicate(g: any): Promise<void> {
    try {
      const full: any = await firstValueFrom(this.http.get(this.u(`/organisation/api/Group/${g.id}/`)));
      const perms = (full.permissions || []).map((p: any) => p.id ?? p);
      if (await openZForm({ ...GROUP_NAME_FORM, heading: 'Duplicate permission group', toBody: (v: any) => ({ name: v.name, permissions: perms }) } as any,
        undefined as any)) { zToast(i18nT('The copy was made with the same rights.')); await this.load(); }
    } catch (e) { this.msg = httpErrorText(e); this.cd.markForCheck(); }
  }
  async remove(g: any): Promise<void> {
    const q = g.kind === 'copy' ? i18nT('Remove this company\'s copy of "{0}"? Its users get the standard group again.', [g.name])
      : i18nT('Delete the permission group "{0}"? Its {1} user(s) lose the rights it gives.', [g.name, g.users]);
    if (!(await zConfirm(q))) { return; }
    try {
      const r: any = await firstValueFrom(this.http.delete(this.u(`/organisation/api/Group/${g.id}/`)));
      zToast((r && r.detail) || i18nT('Deleted.'));
      await this.load();
    } catch (e) { zToast(httpErrorText(e), 'err'); }
  }
  async open(g: any): Promise<void> {
    this.msg = ''; this.q = '';
    try {
      const [full, cat]: any = await Promise.all([firstValueFrom(this.http.get(this.u(`/organisation/api/Group/${g.id}/`))),
        firstValueFrom(this.http.get(this.u('/zeo-apps/api/permission-catalogue/')))]);
      this.apps = cat.apps || [];
      const shownIds = new Set<number>();
      for (const a of this.apps) { for (const m of a.models) { Object.values(m.rights).forEach((x: any) => shownIds.add(x)); m.other.forEach((o: any) => shownIds.add(o.id)); } }
      const ids: number[] = (full.permissions || []).map((p: any) => p.id ?? p);
      this.sel = new Set(ids.filter(i => shownIds.has(i)));
      this.keep = ids.filter(i => !shownIds.has(i));   // rights of apps that are off are kept as they are
      this.ed = { id: g.id, name: full.name || g.name };
      this.openApp = {}; if (this.apps.length) { this.openApp[this.apps[0].key] = true; }
    } catch (e) { this.msg = httpErrorText(e); }
    this.cd.markForCheck();
  }
  close(): void { this.ed = null; this.load(); }
  flip(id: number): void { if (this.sel.has(id)) { this.sel.delete(id); } else { this.sel.add(id); } }
  all(a: any, on: boolean): void {
    for (const m of a.models) { for (const id of [...Object.values(m.rights) as number[], ...m.other.map((o: any) => o.id)]) { if (on) { this.sel.add(id); } else { this.sel.delete(id); } } }
  }
  ticked(a: any): number {
    let n = 0;
    for (const m of a.models) { for (const id of [...Object.values(m.rights) as number[], ...m.other.map((o: any) => o.id)]) { if (this.sel.has(id)) { n++; } } }
    return n;
  }
  shown(a: any): any[] {
    const q = this.q.trim().toLowerCase();
    if (!q) { return a.models; }
    return a.models.filter((m: any) => i18nT(m.label).toLowerCase().includes(q) || m.label.toLowerCase().includes(q) || m.other.some((o: any) => o.label.toLowerCase().includes(q)));
  }
  async rename(): Promise<void> {
    if (await openZForm({ ...GROUP_NAME_FORM, toBody: (v: any) => ({ name: v.name }) } as any, { id: this.ed.id, name: this.ed.name })) {
      const full: any = await firstValueFrom(this.http.get(this.u(`/organisation/api/Group/${this.ed.id}/`)));
      this.ed.name = full.name; this.cd.markForCheck();
    }
  }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.cd.markForCheck();
    try {
      const r: any = await firstValueFrom(this.http.patch(this.u(`/organisation/api/Group/${this.ed.id}/`), { name: this.ed.name, permissions: [...this.sel, ...this.keep] }));
      zToast(r?.detail || i18nT('The rights are saved.'));
      if (r?.copied_from && r?.id) { this.ed.id = r.id; }
    } catch (e) { this.msg = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }
}

export const PERMISSION_GROUPS_ROUTES: Routes = [
  { path: 'user-grouping-master', component: PermissionGroupsComponent, data: { title: 'Permission groups' } },
];
