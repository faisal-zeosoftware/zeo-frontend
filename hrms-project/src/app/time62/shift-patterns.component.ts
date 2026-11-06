// v1.62.10 (item 171)
/**
 * v1.62.10 (item 171) – Shift planner › Shift patterns in the new design. Before: a card grid with an old pop-up (16 browser
 * messages). Now: the list (name, type, how it repeats, the shifts it uses) with the shared list tools, "+ New shift pattern",
 * Edit / Delete on each row, and one editor in the look of the shared form: Weekly (a shift per day for each week of the cycle),
 * Monthly (day ranges per month of the cycle) or Rotating (N working days with their shifts, then M days off). Errors are
 * shown next to the cell / field. Saved as before: /calendars/api/shiftpattern/ {name, pattern_type, changes_every, pattern_config}.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZPortalDirective } from '../shared-ui/z-portal.directive';   // v1.67.5 (bugs) S1
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zToast } from '../shared-ui/z-toast';
import { SessionService } from '../login/session.service';
import { DAYS, T, T62Base } from './t62';

type Kind = 'weekly' | 'monthly' | 'rotating';
const DAY_NO = Array.from({ length: 31 }, (_, i) => i + 1);

@Component({
  selector: 'app-t62-shift-patterns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, MatIconModule, ZListDirective, ZPortalDirective],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  template: `
<div class="container hr-page" data-t62="patterns">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Shift patterns</h1>
          <p class="hr-head-d">How shifts repeat: a shift per weekday for each week of a cycle, day ranges per month, or a rotation of working days and days off. Give a pattern to employees under Employee shifts.</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="open(null)" data-z-new data-t62-new>+ New shift pattern</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list>
          <thead><tr><th>Name</th><th>Type</th><th>Repeats</th><th>Shifts</th><th class="hr-col-actions" *ngIf="can.change || can.delete">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td colspan="5" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td colspan="5" class="hr-empty">No shift pattern yet. Use + New shift pattern.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-t62-row]="r.id" [attr.data-z-id]="r.id">
              <td>{{ r.name }}</td>
              <td>{{ kindLabel(r.pattern_type) }}</td>
              <td>{{ repeats(r) }}</td>
              <td><span class="t62-chips"><span class="t62-chip" *ngFor="let s of shiftsOf(r)">{{ s }}</span></span></td>
              <td class="t62-actions" *ngIf="can.change || can.delete">
                <button type="button" class="z-row-btn" *ngIf="can.change" (click)="open(r)" title="Edit" aria-label="Edit" data-z-row-edit><mat-icon>edit</mat-icon></button>
                <button type="button" class="z-row-btn danger" *ngIf="can.delete" (click)="del(r, r.name)" title="Delete" aria-label="Delete" data-z-row-delete><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="t62-dlg" zPortal *ngIf="f" data-t62-dialog data-zform>
  <div class="t62-veil" (click)="close()"></div>
  <div class="t62-box" role="dialog" aria-modal="true" (keydown.escape)="close()">
    <div class="t62-head">
      <div><h2 class="t62-title">{{ f.id ? 'Edit shift pattern' : 'New shift pattern' }}</h2>
        <p class="t62-sub">Choose how the shifts repeat and the shift of each day.</p></div>
      <button type="button" class="t62-x" (click)="close()" aria-label="Close">×</button>
    </div>
    <div class="t62-dbody">
      <p class="t62-top" *ngIf="err['_']" role="alert" data-zf-error>{{ err['_'] }}</p>
      <section class="t62-sec"><h3>Shift pattern</h3>
        <div class="t62-fgrid">
          <label class="t62-f" data-zf-field="name"><span class="t62-l">Name <span class="t62-req">*</span></span>
            <input type="text" [(ngModel)]="f.name" maxlength="100" [class.bad]="err['name']" autocomplete="off">
            <small class="t62-err" *ngIf="err['name']" data-zf-field-error>{{ err['name'] }}</small></label>
          <div class="t62-f"><span class="t62-l">Type <span class="t62-req">*</span></span>
            <span class="t62-seg"><button type="button" *ngFor="let k of kinds" [class.on]="f.type === k" (click)="setType(k)" [attr.data-t62-kind]="k">{{ kindLabel(k) }}</button></span></div>
          <label class="t62-f" *ngIf="f.type === 'weekly'"><span class="t62-l">The cycle is</span>
            <select [(ngModel)]="f.every" (ngModelChange)="resize()"><option *ngFor="let n of [1,2,3,4,5,6]" [ngValue]="n">{{ n === 1 ? t('1 week') : t('{0} weeks', [n]) }}</option></select></label>
          <label class="t62-f" *ngIf="f.type === 'monthly'"><span class="t62-l">The cycle is</span>
            <select [(ngModel)]="f.every" (ngModelChange)="resize()"><option *ngFor="let n of [1,2,3,4,5,6,7,8,9,10,11,12]" [ngValue]="n">{{ n === 1 ? t('1 month') : t('{0} months', [n]) }}</option></select></label>
        </div>
      </section>

      <section class="t62-sec" *ngIf="f.type === 'weekly'"><h3>Shift of each day</h3>
        <div class="table-responsive"><table class="t62-tbl" zPlain>
          <thead><tr><th>Day</th><th *ngFor="let w of f.weeks; let i = index">{{ f.weeks.length > 1 ? t('Week {0}', [i + 1]) : t('Shift') }}</th></tr></thead>
          <tbody><tr *ngFor="let d of days; let di = index"><td>{{ d }}</td>
            <td *ngFor="let w of f.weeks; let wi = index"><select [(ngModel)]="w[di]" [class.bad]="bad && !w.some(has)" [attr.data-t62-cell]="wi + '-' + di">
              <option [ngValue]="null">{{ t('No shift (day off)') }}</option><option *ngFor="let s of shifts" [ngValue]="s.id">{{ s.name }}</option></select></td></tr></tbody>
        </table></div>
        <small class="t62-err" *ngIf="err['cells']" data-zf-field-error>{{ err['cells'] }}</small>
      </section>

      <section class="t62-sec" *ngIf="f.type === 'monthly'"><h3>Day ranges</h3>
        <div class="t62-card" *ngFor="let m of f.months; let mi = index">
          <div class="t62-card-head"><span>{{ f.months.length > 1 ? t('Month {0}', [mi + 1]) : t('Every month') }}</span>
            <button type="button" class="t62-btn small" (click)="addRange(mi)">+ Add a range</button></div>
          <table class="t62-tbl" zPlain><thead><tr><th>From day</th><th>To day</th><th>Shift</th><th></th></tr></thead>
            <tbody><tr *ngFor="let r of m; let ri = index">
              <td><select [(ngModel)]="r.from" [class.bad]="bad && !r.from"><option *ngFor="let n of dayNo" [ngValue]="n">{{ n }}</option></select></td>
              <td><select [(ngModel)]="r.to" [class.bad]="bad && !r.to"><option *ngFor="let n of dayNo" [ngValue]="n">{{ n }}</option><option ngValue="last_day">{{ t('Last day of the month') }}</option></select></td>
              <td><select [(ngModel)]="r.shift_id" [class.bad]="bad && !r.shift_id"><option [ngValue]="null">–</option><option *ngFor="let s of shifts" [ngValue]="s.id">{{ s.name }}</option></select></td>
              <td><button type="button" class="z-row-btn danger" *ngIf="m.length > 1" (click)="m.splice(ri, 1)" title="Remove" aria-label="Remove"><mat-icon>close</mat-icon></button></td></tr></tbody></table>
        </div>
        <small class="t62-err" *ngIf="err['cells']" data-zf-field-error>{{ err['cells'] }}</small>
      </section>

      <section class="t62-sec" *ngIf="f.type === 'rotating'"><h3>Rotation</h3>
        <div class="t62-fgrid">
          <label class="t62-f"><span class="t62-l">Working days in a row <span class="t62-req">*</span></span>
            <select [(ngModel)]="f.work" (ngModelChange)="resize()"><option *ngFor="let n of [1,2,3,4,5,6,7,8,9,10,11,12,13,14]" [ngValue]="n">{{ n }}</option></select></label>
          <label class="t62-f"><span class="t62-l">Then days off <span class="t62-req">*</span></span>
            <select [(ngModel)]="f.off"><option *ngFor="let n of [0,1,2,3,4,5,6,7]" [ngValue]="n">{{ n }}</option></select></label>
        </div>
        <table class="t62-tbl" zPlain style="margin-top:10px"><thead><tr><th>Working day</th><th>Shift</th></tr></thead>
          <tbody><tr *ngFor="let x of f.seq; let i = index; trackBy: idx"><td>{{ t('Day {0}', [i + 1]) }}</td>
            <td><select [(ngModel)]="f.seq[i]" [class.bad]="bad && !f.seq[i]"><option [ngValue]="null">–</option><option *ngFor="let s of shifts" [ngValue]="s.id">{{ s.name }}</option></select></td></tr></tbody></table>
        <small class="t62-err" *ngIf="err['cells']" data-zf-field-error>{{ err['cells'] }}</small>
      </section>
    </div>
    <div class="t62-foot">
      <button type="button" class="t62-btn" (click)="close()" [disabled]="busy">Cancel</button>
      <span class="t62-grow"></span>
      <button type="button" class="t62-btn" *ngIf="!f.id" (click)="save(true)" [disabled]="busy" data-zf-another>Save and add another</button>
      <button type="button" class="t62-btn primary" (click)="save(false)" [disabled]="busy" data-zf-save>{{ busy ? 'Saving…' : 'Save' }}</button>
    </div>
  </div>
</div>`,
})
export class T62ShiftPatternsComponent extends T62Base {
  model = 'shiftpattern';
  endpoint = '/calendars/api/shiftpattern/';
  kinds: Kind[] = ['weekly', 'monthly', 'rotating'];
  days = DAYS.map(d => T(d));
  dayNo = DAY_NO;
  shifts: any[] = [];
  f: any = null;
  err: Record<string, string> = {};
  bad = false; busy = false;
  idx = (i: number) => i;
  has = (x: any) => !!x;

  private session = inject(SessionService);

  override async load(): Promise<void> {
    try { this.shifts = await this.list('/calendars/api/shifts/'); } catch { this.shifts = []; }
    await super.load();
  }
  // v1.67.5 (bugs) S2: a steady order (by name) – the API gave the rows in storage order, so an edited pattern moved
  override shape(rows: any[]): any[] { return [...rows].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }) || (a.id - b.id)); }
  shiftName(id: any): string { return this.shifts.find(s => String(s.id) === String(id))?.name || ''; }
  kindLabel(k: string): string { return T(({ weekly: 'Weekly', monthly: 'Monthly', rotating: 'Rotating' } as any)[k] || k || '–'); }
  repeats(r: any): string {
    if (r.pattern_type === 'rotating') {
      const x = r.pattern_config?.rotating || {};
      return T('{0} days on, {1} off', [x.work_days ?? r.work_days ?? '–', x.off_days ?? r.off_days ?? 0]);
    }
    const n = +r.changes_every || 1;
    return r.pattern_type === 'monthly' ? (n === 1 ? T('Every month') : T('Every {0} months', [n])) : (n === 1 ? T('Every week') : T('Every {0} weeks', [n]));
  }
  shiftsOf(r: any): string[] {
    const c = r.pattern_config || {}; const ids = new Set<any>();
    (c.weeks || []).forEach((w: any) => (w.rules || []).forEach((x: any) => ids.add(x.shift_id)));
    (c.months || []).forEach((m: any) => (m.rules || []).forEach((x: any) => ids.add(x.shift_id)));
    (c.rotating?.shift_sequence || []).forEach((x: any) => ids.add(x));
    if (c.rotating?.shift_id) { ids.add(c.rotating.shift_id); }
    if (r.pattern_type === 'rotating' && !ids.size && r.rotating_shift) { ids.add(r.rotating_shift); }   // v1.67.5 (bugs) S2: saved in the rotation fields
    const names = [...ids].map(i => this.shiftName(i)).filter(Boolean);
    if (!names.length) { DAYS.forEach(d => { const v = r[d.toLowerCase() + '_shift']; if (v && !names.includes(v)) { names.push(v); } }); }
    return names;
  }

  open(r: any): void {
    this.err = {}; this.bad = false;
    const f: any = { id: r?.id || null, name: r?.name || '', type: (r?.pattern_type || 'weekly') as Kind, every: +(r?.changes_every || 1), weeks: [], months: [], work: 5, off: 2, seq: [] };
    const c = r?.pattern_config || {};
    if (f.type === 'weekly') {
      f.weeks = (c.weeks || []).sort((a: any, b: any) => a.sequence - b.sequence).map((w: any) => DAYS.map(d => (w.rules || []).find((x: any) => x.day === d)?.shift_id ?? null));
      // a pattern kept in the per-weekday fields (no pattern_config): its shifts shown, by name
      if (r && !f.weeks.length) { f.weeks = [DAYS.map(d => this.shifts.find(s => s.name === r[d.toLowerCase() + '_shift'])?.id ?? null)]; }
    } else if (f.type === 'monthly') {
      f.months = (c.months || []).sort((a: any, b: any) => a.sequence - b.sequence).map((m: any) => (m.rules || []).map((x: any) => ({ from: +x.from || 1, to: x.to === 'last_day' ? 'last_day' : +x.to, shift_id: x.shift_id ?? null })));
    } else {
      const x = c.rotating || {};
      f.work = +(x.work_days ?? r?.work_days ?? 1); f.off = +(x.off_days ?? r?.off_days ?? 0);
      // v1.67.5 (bugs) S2: a pattern kept in the rotation fields (one shift on every working day, no shift_sequence) opened with
      // empty days – saving it then failed or lost the shift; its shift is now filled in on each working day
      const one = x.shift_id ?? r?.rotating_shift ?? null;
      f.seq = x.shift_sequence ? [...x.shift_sequence] : (one ? Array.from({ length: f.work }, () => one) : []);
    }
    this.f = f; this.resize();
  }
  setType(k: Kind): void { this.f.type = k; this.f.every = 1; this.resize(); }
  resize(): void {
    const f = this.f; const n = +f.every || 1;
    while (f.weeks.length < n) { f.weeks.push(DAYS.map(() => null)); } f.weeks.length = f.type === 'weekly' ? n : f.weeks.length;
    while (f.months.length < n) { f.months.push([{ from: 1, to: 'last_day', shift_id: null }]); } f.months.length = f.type === 'monthly' ? n : f.months.length;
    const w = +f.work || 1; while (f.seq.length < w) { f.seq.push(null); } f.seq.length = w;
  }
  addRange(mi: number): void {
    const m = this.f.months[mi]; const last = m[m.length - 1];
    if (last && last.to === 'last_day') { last.to = Math.min(30, (+last.from || 1) + 13); }
    m.push({ from: last && last.to !== 'last_day' ? Math.min(31, +last.to + 1) : 1, to: 'last_day', shift_id: null });
  }
  close(): void { if (!this.busy) { this.f = null; } }

  private check(): boolean {
    const f = this.f; this.err = {}; this.bad = false;
    if (!String(f.name || '').trim()) { this.err['name'] = T('{0} is required.', [T('Name')]); }
    let ok = true;
    if (f.type === 'weekly') { ok = f.weeks.every((w: any[]) => w.some(x => !!x)); if (!ok) { this.err['cells'] = T('Choose the shift of at least one day of each week.'); } }
    if (f.type === 'monthly') {
      ok = f.months.every((m: any[]) => m.every(r => r.from && r.to && r.shift_id));
      if (!ok) { this.err['cells'] = T('Complete every day range.'); }
      else if (f.months.some((m: any[]) => m.some(r => r.to !== 'last_day' && +r.to < +r.from))) { ok = false; this.err['cells'] = T('A range ends before it starts.'); }
    }
    if (f.type === 'rotating') { ok = f.seq.length === +f.work && f.seq.every((x: any) => !!x); if (!ok) { this.err['cells'] = T('Choose the shift of every working day.'); } }
    this.bad = !ok;
    return !Object.keys(this.err).length;
  }
  body(): any {
    const f = this.f; let cfg: any = {};
    if (f.type === 'weekly') { cfg = { weeks: f.weeks.map((w: any[], i: number) => ({ sequence: i + 1, rules: DAYS.map((d, di) => ({ day: d, shift_id: Number(w[di]) })).filter(x => !!x.shift_id) })) }; }   // an empty day = no shift (day off)
    if (f.type === 'monthly') { cfg = { months: f.months.map((m: any[], i: number) => ({ sequence: i + 1, rules: m.map(r => ({ from: r.from, to: r.to, shift_id: Number(r.shift_id) })) })) }; }
    if (f.type === 'rotating') { cfg = { rotating: { work_days: Number(f.work), off_days: Number(f.off), shift_sequence: f.seq.map((x: any) => Number(x)) } }; }
    const me = this.session.getUserId();
    return { ...(me && !f.id ? { created_by: me } : {}), name: String(f.name).trim(), pattern_type: f.type, changes_every: f.type === 'rotating' ? 1 : Number(f.every), pattern_config: cfg };
  }
  async save(another: boolean): Promise<void> {
    if (this.busy || !this.check()) { return; }
    this.busy = true;
    const b = this.body();
    try {
      if (this.f.id) { await firstValueFrom(this.http.patch(this.url(`${this.endpoint}${this.f.id}/`), b)); }
      else { await firstValueFrom(this.http.post(this.url(this.endpoint), b)); }
      zToast(T('{0} saved.', [T('Shift pattern')]), 'ok');
      this.busy = false;
      if (another && !this.f.id) { this.open(null); } else { this.f = null; }
      await this.load();
    } catch (e: any) {
      this.busy = false;
      const d = e?.error;
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        for (const [k, v] of Object.entries(d)) {
          const m = Array.isArray(v) ? v.join(' ') : String(v);
          if (k === 'name') { this.err['name'] = m; } else if (['pattern_config', 'work_days', 'off_days', 'changes_every'].includes(k)) { this.err['cells'] = m; this.bad = true; } else { this.err['_'] = (this.err['_'] ? this.err['_'] + ' ' : '') + m; }
        }
      } else { this.err['_'] = httpErrorText(e); }
    }
  }
}
