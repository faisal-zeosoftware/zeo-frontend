// v1.62.10 (item 174)
/**
 * v1.62.10 (item 174) – one "Escalation" screen in the new design for the 6 kinds whose approval levels escalate (general
 * request, leave, loan, advance salary, air ticket, asset – route data `kind`, configs in ap62-kinds.ts). Before: 6 touched-up
 * screens with a create and an edit pop-up each (18 browser messages, page reloads; "Delete" on a row reset the rule).
 * Now: every approval level with its type, branches, approver, who it escalates to and after how long; "+ New escalation"
 * (type → level → escalate to, after days / hours / minutes), Edit and "Remove escalation" on each row, in the look of the
 * shared form with the errors next to the field. Same APIs as before: PUT <escalation API>/<level>/ with escalate_to and
 * escalate_after_days / _hours / _minutes; "Remove escalation" = POST <escalation API>/<level>/reset/. A level is never deleted
 * here (the list offers no bulk delete – the approval levels are edited on the Approval levels screen).
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZPortalDirective } from '../shared-ui/z-portal.directive';   // v1.67.8 (fixes) item 13
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zToast } from '../shared-ui/z-toast';
import { zConfirm } from '../shared-ui/z-confirm';
import { T, T62Base } from '../time62/t62';
import { Ap62Kind } from './ap62-kinds';
import { Ap62User, ap62After, ap62Kind, ap62TypeLabel, ap62UserId, ap62UserLabel, ap62Users } from './ap62';

@Component({
  selector: 'app-ap62-escalation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, ZPortalDirective, FormsModule, RouterModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css', './ap62.css'],
  template: `
<div class="container hr-page" [attr.data-t62]="'esc-' + k.key" data-ap62="escalation">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>{{ t(e.title) }}</h1>
          <p class="hr-head-d">{{ t(e.desc) }} {{ t('The approvers and levels themselves are set under Approval levels.') }}</p></div>
        <div class="hr-head-a hr-head-b">
          <a class="hr-tbtn" [routerLink]="'/main-sidebar/' + k.levelsRoute" data-ap62-levels-link>{{ t('Approval levels') }}</a>
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add || can.change" (click)="open(null)" data-z-new data-t62-new>+ New escalation</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list data-zl-own-import>
          <thead><tr><th *ngIf="k.type">{{ t(k.type.label) }}</th><th>Branches</th><th>Level</th><th>Approver</th><th>Escalate to</th><th>Escalate after</th><th class="hr-col-actions" *ngIf="can.change || can.delete">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td [attr.colspan]="cols" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td [attr.colspan]="cols" class="hr-empty">No approval level yet. Set the approval levels first.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-t62-row]="r.id" [attr.data-z-id]="r.id">
              <td *ngIf="k.type">{{ r._type }}</td>
              <td><span class="t62-chips"><span class="t62-chip grey" *ngFor="let b of r._branches">{{ b }}</span><span *ngIf="!r._branches.length">–</span></span></td>
              <td>{{ t('Level {0}', [r.level]) }}<span class="t62-cell-sub" *ngIf="r._role">{{ r._role }}</span></td>
              <td>{{ r._who }}</td>
              <td>{{ r._to || '–' }}</td>
              <td><span *ngIf="r._after">{{ r._after }}</span><span *ngIf="!r._after" class="ap62-muted">–</span></td>
              <td class="t62-actions" *ngIf="can.change || can.delete">
                <button type="button" class="z-row-btn" *ngIf="can.change" (click)="open(r)" title="Edit" aria-label="Edit" data-z-row-edit><mat-icon>edit</mat-icon></button>
                <button type="button" class="z-row-btn" *ngIf="can.delete && r._set" (click)="reset(r)" [attr.title]="t('Remove escalation')" [attr.aria-label]="t('Remove escalation')" data-ap62-reset><mat-icon>restart_alt</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="t62-dlg" zPortal *ngIf="f" data-t62-dialog data-zform data-ap62-dialog>
  <div class="t62-veil" (click)="close()"></div>
  <div class="t62-box narrow" role="dialog" aria-modal="true" (keydown.escape)="close()">
    <div class="t62-head">
      <div><h2 class="t62-title">{{ f.fixed ? t('Edit escalation') : t('New escalation') }}</h2>
        <p class="t62-sub">{{ t('If the level has not answered after this time, the request moves to the person you choose.') }}</p></div>
      <button type="button" class="t62-x" (click)="close()" aria-label="Close">×</button>
    </div>
    <div class="t62-dbody">
      <p class="t62-top" *ngIf="err['_']" role="alert" data-zf-error>{{ err['_'] }}</p>
      <section class="t62-sec"><h3>Approval level</h3>
        <div class="t62-fgrid">
          <p class="t62-f full" *ngIf="f.fixed"><span class="t62-l">{{ t('Level') }}</span><span data-ap62-fixed>{{ levelLabel(f.fixed) }}</span></p>
          <label class="t62-f full" *ngIf="!f.fixed && k.type" data-zf-field="type"><span class="t62-l">{{ t(k.type.label) }}</span>
            <select [(ngModel)]="f.type" (ngModelChange)="f.level = null" data-ap62-type>
              <option [ngValue]="null">{{ t('All') }}</option>
              <option *ngFor="let o of typeOptions" [ngValue]="o">{{ o }}</option></select></label>
          <label class="t62-f full" *ngIf="!f.fixed" data-zf-field="level"><span class="t62-l">Level <span class="t62-req">*</span></span>
            <select [(ngModel)]="f.level" (ngModelChange)="pick($event)" [class.bad]="err['level']" data-ap62-level>
              <option [ngValue]="null">–</option>
              <option *ngFor="let r of levelsFor(f.type)" [ngValue]="r.id">{{ levelLabel(r) }}</option></select>
            <small class="t62-err" *ngIf="err['level']" data-zf-field-error>{{ err['level'] }}</small></label>
        </div>
      </section>
      <section class="t62-sec"><h3>Escalation</h3>
        <div class="t62-fgrid">
          <label class="t62-f full" data-zf-field="escalate_to"><span class="t62-l">Escalate to <span class="t62-req">*</span></span>
            <select [(ngModel)]="f.to" [class.bad]="err['escalate_to']" data-ap62-escto>
              <option [ngValue]="null">–</option>
              <option *ngFor="let u of users" [ngValue]="u.id">{{ u.label }}</option></select>
            <small class="t62-err" *ngIf="err['escalate_to']" data-zf-field-error>{{ err['escalate_to'] }}</small></label>
        </div>
        <div class="t62-fgrid three" style="margin-top:12px" data-zf-field="after">
          <label class="t62-f ap62-n"><span class="t62-l">After days</span><input type="number" min="0" step="1" [(ngModel)]="f.d" [class.bad]="err['after']" data-ap62-d></label>
          <label class="t62-f ap62-n"><span class="t62-l">Hours</span><input type="number" min="0" max="23" step="1" [(ngModel)]="f.h" [class.bad]="err['after']" data-ap62-h></label>
          <label class="t62-f ap62-n"><span class="t62-l">Minutes</span><input type="number" min="0" max="59" step="1" [(ngModel)]="f.m" [class.bad]="err['after']" data-ap62-m></label>
        </div>
        <small class="t62-err" *ngIf="err['after']" data-zf-field-error>{{ err['after'] }}</small>
      </section>
    </div>
    <div class="t62-foot">
      <button type="button" class="t62-btn" (click)="close()" [disabled]="busy">Cancel</button>
      <span class="t62-grow"></span>
      <button type="button" class="t62-btn" *ngIf="!f.fixed" (click)="save(true)" [disabled]="busy" data-zf-another>Save and add another</button>
      <button type="button" class="t62-btn primary" (click)="save(false)" [disabled]="busy" data-zf-save>{{ busy ? t('Saving…') : t('Save') }}</button>
    </div>
  </div>
</div>`,
})
export class Ap62EscalationComponent extends T62Base {
  k: Ap62Kind = ap62Kind(inject(ActivatedRoute).snapshot.data['kind']);
  e = this.k.escalation!;
  model = this.e.model;
  endpoint = this.e.endpoint;
  users: Ap62User[] = [];
  branches: any[] = [];
  flows: any[] = [];
  typeOptions: string[] = [];
  f: any = null;
  err: Record<string, string> = {};
  busy = false;
  get cols(): number { return (this.k.type ? 6 : 5) + (this.can.change || this.can.delete ? 1 : 0); }

  override async load(): Promise<void> {
    const [users, names, branches, flows] = await Promise.all([
      this.list('/users/tenant-users/').catch(() => []), this.list('/tools/api/user-names/').catch(() => []),
      this.list('/organisation/api/Branch/').catch(() => []), this.list(this.k.endpoint).catch(() => [])]);
    this.users = ap62Users(users, names);
    this.branches = branches;
    this.flows = flows;
    await super.load();
    this.typeOptions = [...new Set(this.rows.map(r => r._type).filter((x: string) => x && x !== '–'))].sort();
  }

  /** the workflow of a level: by the level's id in the workflows' nested levels (leave answers the workflow id itself) */
  private flowOf(r: any): any {
    if (r.workflow) { const w = this.flows.find(x => x.id === r.workflow); if (w) { return w; } }
    return this.flows.find(w => (w.levels || []).some((l: any) => l.id === r.id)) || null;
  }

  override shape(rows: any[]): any[] {
    const k = this.k;
    return rows.map(r => {
      const w = this.flowOf(r);
      const type = r.request_type_name || r.asset_type_name || r.loan_type_name || (k.type && w ? w[k.type.field] : '') || (typeof r.request_type === 'string' ? r.request_type : '') || '';
      const bn = (w && Array.isArray(w.branch) ? w.branch : (Array.isArray(r.branch) ? r.branch : []))
        .map((b: any) => typeof b === 'number' ? (this.branches.find(x => x.id === b)?.branch_name || String(b)) : String(b));
      const at = w?.approval_type || '';
      const who = r.approver ? ap62UserLabel(this.users, r.approver, r.approver_name) : (at && at !== 'multi_approval' ? ap62TypeLabel(at) : (r.role === 'Reporting Manager' ? T('Reporting manager') : '–'));
      const to = r.escalate_to ? ap62UserLabel(this.users, r.escalate_to, r.escalate_to_name) : '';
      const after = ap62After(r.escalate_after_days, r.escalate_after_hours, r.escalate_after_minutes);
      const role = r.role && !['Reporting Manager', 'Auto Level', 'Auto Approval'].includes(r.role) ? r.role : '';
      return { ...r, _type: String(type || '–'), _branches: bn, _who: who, _to: to, _after: after, _role: role, _set: !!(to || after) };
    }).sort((a, b) => a._type.localeCompare(b._type) || a._branches.join().localeCompare(b._branches.join()) || (+a.level || 0) - (+b.level || 0));
  }

  levelsFor(type: string | null): any[] { return this.rows.filter(r => !type || r._type === type); }
  levelLabel(r: any): string {
    const bits = [this.k.type ? r._type : '', T('Level {0}', [r.level]), r._role, r._who].filter(x => x && x !== '–');
    const b = r._branches.length ? ` (${r._branches.join(', ')})` : '';
    return bits.join(' – ') + b;
  }

  open(r: any): void {
    this.err = {};
    this.f = r ? { fixed: r, level: r.id, type: null, to: ap62UserId(this.users, r.escalate_to), d: +r.escalate_after_days || 0, h: +r.escalate_after_hours || 0, m: +r.escalate_after_minutes || 0 }
      : { fixed: null, level: null, type: null, to: null, d: 0, h: 0, m: 0 };
  }
  pick(id: any): void {
    const r = this.rows.find(x => x.id === id);
    if (r && this.f && !this.f.fixed) { this.f.to = ap62UserId(this.users, r.escalate_to); this.f.d = +r.escalate_after_days || 0; this.f.h = +r.escalate_after_hours || 0; this.f.m = +r.escalate_after_minutes || 0; }
  }
  close(): void { if (!this.busy) { this.f = null; } }

  private check(): boolean {
    const f = this.f; const e: Record<string, string> = {};
    if (!f.level) { e['level'] = T('{0} is required.', [T('Level')]); }
    if (!f.to) { e['escalate_to'] = T('{0} is required.', [T('Escalate to')]); }
    const vals = [f.d, f.h, f.m];
    if (vals.some(x => x !== null && x !== undefined && x !== '' && (!Number.isInteger(Number(x)) || Number(x) < 0))) { e['after'] = T('Use whole numbers, 0 or more.'); }
    else if (!(Number(f.d) || Number(f.h) || Number(f.m))) { e['after'] = T('Give the time after which it escalates.'); }
    this.err = e;
    return !Object.keys(e).length;
  }

  async save(another: boolean): Promise<void> {
    if (this.busy || !this.check()) { return; }
    this.busy = true;
    const f = this.f;
    const body = { escalate_to: Number(f.to), escalate_after_days: Number(f.d) || 0, escalate_after_hours: Number(f.h) || 0, escalate_after_minutes: Number(f.m) || 0 };
    try {
      await firstValueFrom(this.http.put(this.url(`${this.endpoint}${f.level}/`), body));
      zToast(T('{0} saved.', [T('Escalation')]), 'ok');
      this.busy = false;
      if (another && !f.fixed) { this.open(null); } else { this.f = null; }
      await this.load();
    } catch (x: any) {
      this.busy = false;
      const d = x?.error; const out: Record<string, string> = {};
      const txt = (v: any): string => Array.isArray(v) ? v.join(' ') : String(v ?? '');
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        for (const [key, v] of Object.entries(d)) {
          const slot = key === 'escalate_to' ? 'escalate_to' : key.startsWith('escalate_after') ? 'after' : '_';
          out[slot] = (out[slot] ? out[slot] + ' ' : '') + txt(v);
        }
      }
      if (!Object.keys(out).length) { out['_'] = httpErrorText(x); }
      this.err = out;
    }
  }

  async reset(r: any): Promise<void> {
    if (!(await zConfirm(T('Remove the escalation of {0}?', [this.levelLabel(r)])))) { return; }
    try {
      await firstValueFrom(this.http.post(this.url(`${this.endpoint}${r.id}/reset/`), {}));
      zToast(T('Escalation removed.'), 'ok');
    } catch (x) { zToast(T('Not removed: {0}', [httpErrorText(x)]), 'err'); }
    await this.load();
  }
}
