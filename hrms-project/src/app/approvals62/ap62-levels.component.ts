// v1.62.10 (item 174)
/**
 * v1.62.10 (item 174) – one "Approval levels" screen in the new design for the 10 kinds of request (general, document,
 * late in / early out, resignation, leave, payroll, loan, advance salary, air ticket, asset – route data `kind`, configs in
 * ap62-kinds.ts). Before: 10 old / touched-up screens, each with its own create and edit pop-up (bootstrap rows, 7–18
 * browser messages, page reloads). Now: the list (type, branches, approval, the levels with their approvers by name and
 * escalation) with the shared list tools, "+ New approval workflow", Edit / Delete on each row, and one editor in the look of
 * the shared form: applies to (type, branches; leave: compensatory), approval (No approval / Reporting manager / Approval
 * levels) and the levels (role, approver, and – where the kind has it – escalate to and after how long). Errors next to the
 * field, Save / Save and add another, a toast instead of the pop-up. Same APIs and bodies as the old pop-ups (PUT on edit).
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zToast } from '../shared-ui/z-toast';
import { T, T62Base } from '../time62/t62';
import { AP62_TYPES, Ap62Kind } from './ap62-kinds';
import { Ap62User, ap62After, ap62BranchIds, ap62Kind, ap62TypeLabel, ap62UserId, ap62UserLabel, ap62Users } from './ap62';

interface Lv { role: string; approver: number | null; escalate_to: number | null; d: number; h: number; m: number; standin?: number | null; }   // v1.62.11 (item 95) standin

@Component({
  selector: 'app-ap62-levels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css', './ap62.css'],
  template: `
<div class="container hr-page" [attr.data-t62]="'ap-' + k.key" data-ap62="levels">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>{{ t(k.title) }}</h1>
          <p class="hr-head-d">{{ t(k.desc) }}</p></div>
        <div class="hr-head-a hr-head-b">
          <a class="hr-tbtn" *ngIf="k.escalation" [routerLink]="'/main-sidebar/' + k.escalation.route" data-ap62-esc-link>{{ t('Escalation') }}</a>
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="open(null)" data-z-new data-t62-new>+ New approval workflow</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list data-zl-own-import>
          <thead><tr><th *ngIf="k.type">{{ t(k.type.label) }}</th><th>Branches</th><th>Approval</th><th>Levels</th><th class="hr-col-actions" *ngIf="can.change || can.delete">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td [attr.colspan]="cols" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td [attr.colspan]="cols" class="hr-empty">No approval workflow yet. Use + New approval workflow.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-t62-row]="r.id" [attr.data-z-id]="r.id">
              <td *ngIf="k.type">{{ r._type }}<span class="t62-cell-sub" *ngIf="r._comp">{{ t('Compensatory leave') }}</span></td>
              <td><span class="t62-chips"><span class="t62-chip grey" *ngFor="let b of r._branches">{{ b }}</span><span *ngIf="!r._branches.length">–</span></span></td>
              <td><span class="t62-chip" [class.grey]="r.approval_type === 'no_approval'">{{ r._approval }}</span></td>
              <td>
                <div class="ap62-lv" *ngFor="let l of r._levels" data-no-translate>
                  <b>{{ l.no }}</b> <span *ngIf="l.role">{{ l.role }}</span><span *ngIf="l.role && l.who"> – </span><span>{{ l.who }}</span>
                  <span class="ap62-standin" *ngIf="l.standin" data-ap62-standin-shown> · {{ t('stand-in {0}', [l.standin]) }}</span>
                  <span class="t62-cell-sub" *ngIf="l.esc">{{ l.esc }}</span>
                </div>
                <span *ngIf="!r._levels.length">–</span>
              </td>
              <td class="t62-actions" *ngIf="can.change || can.delete">
                <button type="button" class="z-row-btn" *ngIf="can.change" (click)="open(r)" title="Edit" aria-label="Edit" data-z-row-edit><mat-icon>edit</mat-icon></button>
                <button type="button" class="z-row-btn danger" *ngIf="can.delete" (click)="del(r, r._name)" title="Delete" aria-label="Delete" data-z-row-delete><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="t62-dlg" *ngIf="f" data-t62-dialog data-zform data-ap62-dialog>
  <div class="t62-veil" (click)="close()"></div>
  <div class="t62-box" role="dialog" aria-modal="true" (keydown.escape)="close()">
    <div class="t62-head">
      <div><h2 class="t62-title">{{ f.id ? t('Edit approval workflow') : t('New approval workflow') }}</h2>
        <p class="t62-sub">{{ t('Who approves {0}, for which branches.', [t(k.where)]) }}</p></div>
      <button type="button" class="t62-x" (click)="close()" aria-label="Close">×</button>
    </div>
    <div class="t62-dbody">
      <p class="t62-top" *ngIf="err['_']" role="alert" data-zf-error>{{ err['_'] }}</p>
      <section class="t62-sec"><h3>Applies to</h3>
        <div class="t62-fgrid">
          <label class="t62-f full" *ngIf="k.comp"><span class="ap62-check"><input type="checkbox" [(ngModel)]="f.comp" data-ap62-comp> {{ t('For compensatory leave (work on a day off)') }}</span>
            <small class="t62-hint" *ngIf="f.comp">{{ t('No leave type is chosen: the company\\'s compensatory leave type is used.') }}</small></label>
          <label class="t62-f" *ngIf="k.type && !(k.comp && f.comp)" data-zf-field="type"><span class="t62-l">{{ t(k.type.label) }} <span class="t62-req">*</span></span>
            <select [(ngModel)]="f.type" [class.bad]="err['type']" data-ap62-type>
              <option [ngValue]="null">–</option>
              <option *ngFor="let o of types" [ngValue]="o.id">{{ o.label }}</option></select>
            <small class="t62-err" *ngIf="err['type']" data-zf-field-error>{{ err['type'] }}</small></label>
          <div class="t62-f full" data-zf-field="branch"><span class="t62-l">Branches <span class="t62-req">*</span></span>
            <div class="ap62-box" [class.bad]="err['branch']">
              <label class="ap62-opt" *ngFor="let b of branches"><input type="checkbox" [checked]="f.branch.includes(b.id)" (change)="tick(b.id)" [attr.data-ap62-branch]="b.id"> {{ b.branch_name }}</label>
              <span class="t62-hint" *ngIf="!branches.length">{{ t('No branch.') }}</span>
            </div>
            <small class="t62-err" *ngIf="err['branch']" data-zf-field-error>{{ err['branch'] }}</small></div>
        </div>
      </section>

      <section class="t62-sec"><h3>Approval</h3>
        <div class="t62-f" data-zf-field="approval_type"><span class="t62-l">Who approves <span class="t62-req">*</span></span>
          <span class="t62-seg" [class.bad]="err['approval_type']"><button type="button" *ngFor="let a of approvalTypes" [class.on]="f.approval_type === a.value" (click)="setType(a.value)" [attr.data-ap62-approval]="a.value">{{ t(a.label) }}</button></span>
          <small class="t62-hint" *ngIf="hintOf(f.approval_type)">{{ hintOf(f.approval_type) }}</small>
          <small class="t62-err" *ngIf="err['approval_type']" data-zf-field-error>{{ err['approval_type'] }}</small></div>
      </section>

      <section class="t62-sec" *ngIf="f.approval_type === 'multi_approval'" data-zf-field="levels"><h3>Levels</h3>
        <p class="t62-hint">{{ t('Level 1 approves first; the request moves to the next level when the level before has approved.') }}</p>
        <div class="t62-card ap62-card" *ngFor="let l of f.levels; let i = index" [attr.data-ap62-level]="i + 1">
          <div class="t62-card-head"><span>{{ t('Level {0}', [i + 1]) }}</span>
            <span>
              <button type="button" class="z-row-btn" *ngIf="i > 0" (click)="move(i, -1)" [attr.title]="t('Move up')" [attr.aria-label]="t('Move up')"><mat-icon>arrow_upward</mat-icon></button>
              <button type="button" class="z-row-btn danger" *ngIf="f.levels.length > 1" (click)="f.levels.splice(i, 1)" [attr.title]="t('Remove')" [attr.aria-label]="t('Remove')" data-ap62-remove><mat-icon>close</mat-icon></button>
            </span></div>
          <div class="t62-fgrid">
            <label class="t62-f" *ngIf="k.role"><span class="t62-l">Role <span class="t62-req" *ngIf="k.roleRequired">*</span></span>
              <input type="text" [(ngModel)]="l.role" maxlength="100" [class.bad]="err['role' + i]" [attr.placeholder]="t('e.g. HR manager')" autocomplete="off" data-ap62-role>
              <small class="t62-err" *ngIf="err['role' + i]" data-zf-field-error>{{ err['role' + i] }}</small></label>
            <label class="t62-f"><span class="t62-l">Approver <span class="t62-req">*</span></span>
              <select [(ngModel)]="l.approver" [class.bad]="err['approver' + i]" data-ap62-approver>
                <option [ngValue]="null">–</option>
                <option *ngFor="let u of users" [ngValue]="u.id">{{ u.label }}</option></select>
              <small class="t62-err" *ngIf="err['approver' + i]" data-zf-field-error>{{ err['approver' + i] }}</small></label>
            <!-- v1.62.11 (item 95): who approves this level while its approver is out of office -->
            <label class="t62-f"><span class="t62-l">{{ t('Stand-in when the approver is away') }}</span>
              <select [(ngModel)]="l.standin" [class.bad]="err['standin' + i]" data-ap62-standin>
                <option [ngValue]="null">{{ t('None – the approver\'s own choice') }}</option>
                <option *ngFor="let u of users" [ngValue]="u.id">{{ u.label }}</option></select>
              <small class="t62-err" *ngIf="err['standin' + i]" data-zf-field-error>{{ err['standin' + i] }}</small></label>
          </div>
          <div class="ap62-esc" *ngIf="k.esc">
            <label class="t62-f"><span class="t62-l">Escalate to</span>
              <select [(ngModel)]="l.escalate_to" data-ap62-escto>
                <option [ngValue]="null">{{ t('No escalation') }}</option>
                <option *ngFor="let u of users" [ngValue]="u.id">{{ u.label }}</option></select></label>
            <label class="t62-f ap62-n"><span class="t62-l">After days</span><input type="number" min="0" step="1" [(ngModel)]="l.d" [disabled]="!l.escalate_to" [class.bad]="err['after' + i]"></label>
            <label class="t62-f ap62-n"><span class="t62-l">Hours</span><input type="number" min="0" max="23" step="1" [(ngModel)]="l.h" [disabled]="!l.escalate_to" [class.bad]="err['after' + i]"></label>
            <label class="t62-f ap62-n"><span class="t62-l">Minutes</span><input type="number" min="0" max="59" step="1" [(ngModel)]="l.m" [disabled]="!l.escalate_to" [class.bad]="err['after' + i]"></label>
          </div>
          <small class="t62-err" *ngIf="err['after' + i]" data-zf-field-error>{{ err['after' + i] }}</small>
        </div>
        <button type="button" class="t62-btn small" (click)="addLevel()" style="margin-top:10px" data-ap62-add>+ Add a level</button>
        <small class="t62-err" *ngIf="err['levels']" data-zf-field-error style="display:block;margin-top:6px">{{ err['levels'] }}</small>
      </section>
    </div>
    <div class="t62-foot">
      <button type="button" class="t62-btn" (click)="close()" [disabled]="busy">Cancel</button>
      <span class="t62-grow"></span>
      <button type="button" class="t62-btn" *ngIf="!f.id" (click)="save(true)" [disabled]="busy" data-zf-another>Save and add another</button>
      <button type="button" class="t62-btn primary" (click)="save(false)" [disabled]="busy" data-zf-save>{{ busy ? t('Saving…') : t('Save') }}</button>
    </div>
  </div>
</div>`,
})
export class Ap62LevelsComponent extends T62Base {
  k: Ap62Kind = ap62Kind(inject(ActivatedRoute).snapshot.data['kind']);
  model = this.k.model;
  endpoint = this.k.endpoint;
  approvalTypes = AP62_TYPES;
  users: Ap62User[] = [];
  branches: any[] = [];
  types: { id: number; label: string; name: string }[] = [];
  f: any = null;
  err: Record<string, string> = {};
  busy = false;
  standins: Record<string, { id: number; name: string }> = {};   // v1.62.11 (item 95) "<workflow id>:<level>" → stand-in
  get cols(): number { return (this.k.type ? 4 : 3) + (this.can.change || this.can.delete ? 1 : 0); }

  override async load(): Promise<void> {
    const k = this.k;
    const [users, names, branches, types] = await Promise.all([
      this.list(k.users).catch(() => []), this.list('/tools/api/user-names/').catch(() => []),
      this.list('/organisation/api/Branch/').catch(() => []), k.type ? this.list(k.type.endpoint).catch(() => []) : Promise.resolve([])]);
    this.users = ap62Users(users, names);
    try {   // v1.62.11 (item 95)
      const si: any = await firstValueFrom(this.http.get(this.url(`/zeo-admin/api/stand-ins/levels/?kind=${this.k.key}`)));
      this.standins = {}; (si || []).forEach((x: any) => { this.standins[`${x.workflow_id}:${x.level_no}`] = { id: x.delegate_id, name: x.delegate }; });
    } catch { this.standins = {}; }
    this.branches = branches.filter((b: any) => b && b.id).sort((a: any, b: any) => String(a.branch_name).localeCompare(String(b.branch_name)));
    this.types = k.type ? types.filter((x: any) => x && x.id).map((x: any) => ({ id: Number(x.id), name: k.type!.name(x), label: (k.type!.option || k.type!.name)(x) }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label)) : [];
    await super.load();
  }

  override shape(rows: any[]): any[] {
    const k = this.k;
    return rows.map(r => {
      const levels = (r.levels || []).slice().sort((a: any, b: any) => (+a.level || 0) - (+b.level || 0));
      const multi = r.approval_type === 'multi_approval';
      const comp = !!k.comp && levels.some((l: any) => l.is_compensatory);
      const branches = Array.isArray(r.branch) ? r.branch.map((b: any) => typeof b === 'number' ? (this.branches.find(x => x.id === b)?.branch_name || String(b)) : String(b)) : (r.branch ? [String(r.branch)] : []);
      const type = k.type ? String(r[k.type.field] ?? '') : '';
      const typeName = k.type && /^\d+$/.test(type) ? (this.types.find(x => x.id === Number(type))?.name || type) : type;
      return {
        ...r, _branches: branches, _type: typeName || '–', _comp: comp, _approval: ap62TypeLabel(r.approval_type),
        _name: [typeName, branches.join(', ')].filter(Boolean).join(' – ') || ap62TypeLabel(r.approval_type),
        _levels: multi ? levels.map((l: any, i: number) => {
          const who = l.approver ? ap62UserLabel(this.users, l.approver, l.approver_name) : '';
          const to = l.escalate_to ? ap62UserLabel(this.users, l.escalate_to, l.escalate_to_name) : '';
          const after = ap62After(l.escalate_after_days, l.escalate_after_hours, l.escalate_after_minutes);
          const sid = this.standins[`${r.id}:${+l.level || i + 1}`];   // v1.62.11 (item 95)
          return { no: `${i + 1}.`, role: k.role ? (l.role || '') : '', who, standin: sid ? ap62UserLabel(this.users, sid.id, sid.name) : '', esc: to ? (after ? T('Escalates to {0} after {1}', [to, after]) : T('Escalates to {0}', [to])) : '' };
        }) : [],
      };
    }).sort((a, b) => String(a._name).localeCompare(String(b._name)));
  }

  hintOf(v: string): string { const h = AP62_TYPES.find(x => x.value === v)?.hint; return h ? T(h) : ''; }
  private emptyLevel(): Lv { return { role: '', approver: null, escalate_to: null, d: 0, h: 0, m: 0, standin: null }; }

  open(r: any): void {
    const k = this.k; this.err = {};
    const f: any = { id: r?.id || null, type: null, comp: false, branch: [], approval_type: r?.approval_type || '', levels: [] };
    if (r) {
      if (k.type) {
        const v = k.type.idField && r[k.type.idField] ? r[k.type.idField] : r[k.type.field];
        f.type = /^\d+$/.test(String(v ?? '')) ? Number(v) : (this.types.find(x => x.name === v)?.id ?? null);
      }
      f.comp = !!k.comp && (r.levels || []).some((l: any) => l.is_compensatory);
      f.branch = ap62BranchIds(this.branches, r);
      if (r.approval_type === 'multi_approval') {
        f.levels = (r.levels || []).slice().sort((a: any, b: any) => (+a.level || 0) - (+b.level || 0)).map((l: any, i: number) => ({
          standin: this.standins[`${r.id}:${+l.level || i + 1}`]?.id ?? null,   // v1.62.11 (item 95)
          role: l.role || '', approver: ap62UserId(this.users, l.approver), escalate_to: ap62UserId(this.users, l.escalate_to),
          d: +l.escalate_after_days || 0, h: +l.escalate_after_hours || 0, m: +l.escalate_after_minutes || 0 }));
      }
    } else if (this.branches.length === 1) { f.branch = [this.branches[0].id]; }
    if (!f.levels.length) { f.levels = [this.emptyLevel()]; }
    this.f = f;
  }
  tick(id: number): void { const b: number[] = this.f.branch; const i = b.indexOf(id); if (i >= 0) { b.splice(i, 1); } else { b.push(id); } }
  setType(v: string): void { this.f.approval_type = v; delete this.err['approval_type']; if (!this.f.levels.length) { this.f.levels = [this.emptyLevel()]; } }
  addLevel(): void { this.f.levels.push(this.emptyLevel()); }
  move(i: number, d: number): void { const L = this.f.levels; const j = i + d; if (j < 0 || j >= L.length) { return; } [L[i], L[j]] = [L[j], L[i]]; }
  close(): void { if (!this.busy) { this.f = null; } }

  private check(): boolean {
    const f = this.f; const k = this.k; const e: Record<string, string> = {};
    const req = (s: string) => T('{0} is required.', [T(s)]);
    if (k.type && !(k.comp && f.comp) && !f.type) { e['type'] = req(k.type.label); }
    if (!f.branch.length) { e['branch'] = T('Choose at least one branch.'); }
    if (!f.approval_type) { e['approval_type'] = T('Choose who approves.'); }
    if (f.approval_type === 'multi_approval') {
      if (!f.levels.length) { e['levels'] = T('Add at least one level.'); }
      f.levels.forEach((l: Lv, i: number) => {
        if (!l.approver) { e['approver' + i] = req('Approver'); }
        if (l.standin && l.standin === l.approver) { e['standin' + i] = T('Choose someone other than the approver.'); }   // v1.62.11 (item 95)
        if (k.role && k.roleRequired && !String(l.role || '').trim()) { e['role' + i] = req('Role'); }
        if (k.esc && l.escalate_to) {
          const bad = [l.d, l.h, l.m].some(x => x !== null && x !== undefined && (x as any) !== '' && (!Number.isInteger(Number(x)) || Number(x) < 0));
          if (bad) { e['after' + i] = T('Use whole numbers, 0 or more.'); }
          else if (!(Number(l.d) || Number(l.h) || Number(l.m))) { e['after' + i] = T('Give the time after which it escalates.'); }
        }
      });
    }
    this.err = e;
    return !Object.keys(e).length;
  }

  /** the body the old pop-ups sent: type id, branch ids, approval type, the levels numbered 1..n (multi approval only) */
  body(): any {
    const f = this.f; const k = this.k;
    const multi = f.approval_type === 'multi_approval';
    const levels = multi ? f.levels.map((l: Lv, i: number) => {
      const x: any = { level: i + 1, approver: Number(l.approver) };
      if (k.role) { x.role = String(l.role || '').trim(); }
      if (k.esc) {
        x.escalate_to = l.escalate_to ? Number(l.escalate_to) : null;
        x.escalate_after_days = l.escalate_to ? (Number(l.d) || 0) : 0;
        x.escalate_after_hours = l.escalate_to ? (Number(l.h) || 0) : 0;
        x.escalate_after_minutes = l.escalate_to ? (Number(l.m) || 0) : 0;
      }
      return x;
    }) : [];
    const b: any = { approval_type: f.approval_type, branch: f.branch.map(Number), levels };
    if (k.type && !(k.comp && f.comp)) { b[k.type.field] = Number(f.type); }
    if (k.comp) { b.is_compensatory = !!f.comp; }
    return b;
  }

  async save(another: boolean): Promise<void> {
    if (this.busy || !this.check()) { return; }
    this.busy = true;
    const b = this.body();
    try {
      let saved: any;
      if (this.f.id) { saved = await firstValueFrom(this.http.put(this.url(`${this.endpoint}${this.f.id}/`), b)); }
      else { saved = await firstValueFrom(this.http.post(this.url(this.endpoint), b)); }
      const wfId = this.f.id || saved?.id;   // v1.62.11 (item 95): the levels' stand-ins (kept beside the workflow)
      if (wfId) {
        const levels = this.f.approval_type === 'multi_approval' ? this.f.levels.map((l: Lv, i: number) => ({ level_no: i + 1, delegate_id: l.standin || null })) : [];
        try { await firstValueFrom(this.http.put(this.url('/zeo-admin/api/stand-ins/levels/'), { kind: this.k.key, workflow_id: wfId, levels })); } catch { zToast(T('The stand-ins could not be saved.'), 'err'); }
      }
      zToast(T('{0} saved.', [T('Approval workflow')]), 'ok');
      this.busy = false;
      if (another && !this.f.id) { this.open(null); } else { this.f = null; }
      await this.load();
    } catch (e: any) {
      this.busy = false;
      this.serverErrors(e);
    }
  }

  private serverErrors(e: any): void {
    const d = e?.error; const k = this.k; const out: Record<string, string> = {};
    const txt = (v: any): string => Array.isArray(v) ? v.map(txt).filter(Boolean).join(' ') : v && typeof v === 'object' ? Object.values(v).map(txt).filter(Boolean).join(' ') : String(v ?? '');
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      for (const [key, v] of Object.entries(d)) {
        if (key === 'levels' && Array.isArray(v) && v.some(x => x && typeof x === 'object' && !Array.isArray(x))) {
          (v as any[]).forEach((x, i) => { if (x && typeof x === 'object') { for (const [fk, fv] of Object.entries(x)) {
            const slot = fk === 'approver' ? 'approver' + i : fk === 'role' ? 'role' + i : fk.startsWith('escalate') ? 'after' + i : 'levels';
            out[slot] = (out[slot] ? out[slot] + ' ' : '') + txt(fv); } } });
          continue;
        }
        const slot = key === 'branch' ? 'branch' : key === 'approval_type' ? 'approval_type' : key === 'levels' ? 'levels' : (k.type && key === k.type.field) ? 'type' : '_';
        const m = txt(v);
        if (m) { out[slot] = (out[slot] ? out[slot] + ' ' : '') + m; }
      }
      if (out['levels'] && this.f.approval_type !== 'multi_approval') { out['_'] = (out['_'] ? out['_'] + ' ' : '') + out['levels']; delete out['levels']; }
      if (out['type'] && this.k.comp && this.f.comp) { out['_'] = (out['_'] ? out['_'] + ' ' : '') + out['type']; delete out['type']; }
    } else { out['_'] = Array.isArray(d) ? txt(d) : httpErrorText(e); }
    if (!Object.keys(out).length) { out['_'] = httpErrorText(e); }
    this.err = out;
  }
}
