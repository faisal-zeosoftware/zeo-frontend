/**
 * v1.12.0 Shift planner – Shift master. One form for the shift (name, start, end, break – calendars.Shift) and its rules
 * (code, colour, active, grace in / out, minimum / maximum / half-day hours, night shift, overtime start, shift and
 * night allowances, branches – ShiftPlanner.ShiftRule). Bulk upload with preview and a CSV template.
 * API: shift-master/, shift-master/<id>/, upload/shifts/, template/shifts/, meta/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpApiService, SpMeta } from './sp-api.service';
import { COUNTRY_PACK_UI } from '../shared-ui/country-pack.service';   // v1.14.0

const EMPTY = { name: '', code: '', start_time: '09:00', end_time: '18:00', break_minutes: 60, colour: '#5b4ff5', active: true, grace_in_minutes: 0,
  grace_out_minutes: 0, min_hours: null, max_hours: null, half_day_hours: null, night_auto: true, night_shift: false, ot_after_minutes: 0,
  shift_allowance: 0, night_allowance: 0, branch_ids: [] as number[], notes: '', segments: [] as any[], skills: [] as any[] };

import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.16.0 list tools on this list

@Component({
  selector: 'app-sp-shift-master',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../leave-policy/leave-policy.css', './shift-planner.css'],
  template: `
<div class="container sp-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Shift master</h1>
          <p class="lp-desc">Shifts with their times and rules. Attendance uses the grace minutes and hours, payroll the shift and night allowances, rosters the code and colour.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn" (click)="template()">Upload template</button>
          <label class="lp-btn" style="cursor:pointer" *ngIf="meta?.rights?.add_shift">Upload shifts<input type="file" accept=".csv,.xlsx" (change)="upload($event)" hidden></label>
          <button type="button" class="lp-btn primary" *ngIf="meta?.rights?.add_shift && !form" (click)="edit(null)">+ New shift</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status" style="white-space:pre-line">{{ msg }}</div>

      <div class="lp-scroll" *ngIf="uploadRows.length" style="margin-bottom:14px">
        <table class="lp-mini" zPlain><thead><tr><th>Row</th><th>Shift</th><th>Action</th><th>Result</th></tr></thead>
          <tbody><tr *ngFor="let u of uploadRows"><td>{{ u.row }}</td><td>{{ u.name }}</td><td>{{ u.action === 'add' ? 'New' : 'Update' }}</td>
            <td [class.lp-bad]="!u.ok" [class.lp-ok]="u.ok">{{ u.ok ? 'OK' : u.errors.join(' ') }}</td></tr></tbody></table>
        <div class="lp-foot"><button type="button" class="lp-btn" (click)="uploadRows = []">Cancel</button>
          <button type="button" class="lp-btn primary" [disabled]="uploadErrors > 0" (click)="commitUpload()">Save {{ uploadRows.length }} shift(s)</button></div>
      </div>

      <div class="sp-panel" *ngIf="form">
        <h2>{{ form.id ? 'Edit shift' : 'New shift' }}</h2>
        <div class="lp-form">
          <label>Name<input [(ngModel)]="form.name" maxlength="50" placeholder="e.g. Morning 07:00–15:00"><span class="sp-err" *ngIf="err['name']">{{ err['name'] }}</span></label>
          <label>Code<input [(ngModel)]="form.code" maxlength="20" placeholder="e.g. MOR"><span class="sp-err" *ngIf="err['code']">{{ err['code'] }}</span></label>
          <label>Start time<input type="time" [(ngModel)]="form.start_time"><span class="sp-err" *ngIf="err['start_time']">{{ err['start_time'] }}</span></label>
          <label>End time<input type="time" [(ngModel)]="form.end_time"><span class="sp-err" *ngIf="err['end_time']">{{ err['end_time'] }}</span>
            <small class="lp-muted" style="font-weight:400" *ngIf="crosses()">Ends the next day (night shift).</small></label>
          <label>Break (minutes)<input type="number" min="0" [(ngModel)]="form.break_minutes"><span class="sp-err" *ngIf="err['break_minutes']">{{ err['break_minutes'] }}</span></label>
          <label>Colour<input type="color" [(ngModel)]="form.colour" style="padding:2px"><span class="sp-err" *ngIf="err['colour']">{{ err['colour'] }}</span></label>
          <label>Late check-in allowed (min)<input type="number" min="0" [(ngModel)]="form.grace_in_minutes"><span class="sp-err" *ngIf="err['grace_in_minutes']">{{ err['grace_in_minutes'] }}</span></label>
          <label>Early check-out allowed (min)<input type="number" min="0" [(ngModel)]="form.grace_out_minutes"><span class="sp-err" *ngIf="err['grace_out_minutes']">{{ err['grace_out_minutes'] }}</span></label>
          <label>Hours for a full day<input type="number" min="0" max="24" step="0.25" [(ngModel)]="form.min_hours"><span class="sp-err" *ngIf="err['min_hours']">{{ err['min_hours'] }}</span></label>
          <label>Most hours counted in a day<input type="number" min="0" max="24" step="0.25" [(ngModel)]="form.max_hours"><span class="sp-err" *ngIf="err['max_hours']">{{ err['max_hours'] }}</span></label>
          <label>Hours for a half day<input type="number" min="0" max="24" step="0.25" [(ngModel)]="form.half_day_hours"><span class="sp-err" *ngIf="err['half_day_hours']">{{ err['half_day_hours'] }}</span></label>
          <label>Overtime starts after (min past shift end)<input type="number" min="0" [(ngModel)]="form.ot_after_minutes"><span class="sp-err" *ngIf="err['ot_after_minutes']">{{ err['ot_after_minutes'] }}</span></label>
          <label>{{ 'Shift allowance per day (AED)' | zc }}<input type="number" min="0" step="0.01" [(ngModel)]="form.shift_allowance"><span class="sp-err" *ngIf="err['shift_allowance']">{{ err['shift_allowance'] }}</span></label>
          <label>{{ 'Night allowance per night (AED)' | zc }}<input type="number" min="0" step="0.01" [(ngModel)]="form.night_allowance"><span class="sp-err" *ngIf="err['night_allowance']">{{ err['night_allowance'] }}</span></label>
          <label>Night shift
            <select [(ngModel)]="nightMode"><option value="auto">Automatic (from the times)</option><option value="yes">Yes</option><option value="no">No</option></select></label>
          <label>Active<select [(ngModel)]="form.active"><option [ngValue]="true">Yes – can be planned</option><option [ngValue]="false">No – hidden from new plans</option></select></label>
          <div class="wide"><span class="lp-muted" style="font-size:12px;font-weight:600">Branches (none = all branches)</span>
            <div class="lp-catpick" style="margin-top:4px"><label *ngFor="let b of meta?.branches" [class.on]="form.branch_ids.includes(b.id)">
              <input type="checkbox" [checked]="form.branch_ids.includes(b.id)" (change)="toggleBranch(b.id)"> {{ b.branch_name }}</label></div>
            <span class="sp-err" *ngIf="err['branch_ids']">{{ err['branch_ids'] }}</span></div>
          <label class="wide">Notes<input [(ngModel)]="form.notes" maxlength="255"></label>
          <div class="wide" data-split>   <!-- v1.61.0 split shift -->
            <span class="lp-muted" style="font-size:12px;font-weight:600">Split shift – parts of the day (empty = one block from start to end)</span>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:4px" *ngFor="let p of form.segments; let i = index">
              <span class="lp-muted">Part {{ i + 1 }}</span><input type="time" [(ngModel)]="p.start" [attr.aria-label]="'Part ' + (i + 1) + ' start'" style="width:120px">
              <span>–</span><input type="time" [(ngModel)]="p.end" [attr.aria-label]="'Part ' + (i + 1) + ' end'" style="width:120px">
              <button type="button" class="lp-btn" (click)="form.segments.splice(i, 1)" aria-label="Remove the part">×</button></div>
            <button type="button" class="lp-btn" style="margin-top:6px" (click)="addPart()" data-add-part>+ Part</button>
            <small class="lp-muted" style="display:block;margin-top:4px">E.g. 07:00–11:00 and 16:00–20:00. The time between the parts is not working time; coming back late after it is late, leaving early before it is early. Start and end follow the first and the last part.</small>
            <span class="sp-err" *ngIf="err['segments']">{{ err['segments'] }}</span></div>
          <div class="wide" data-skills-needed>   <!-- v1.61.0 skills-based scheduling -->
            <span class="lp-muted" style="font-size:12px;font-weight:600">Skills needed on this shift (from Learning › Skills)</span>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:4px" *ngFor="let k of form.skills; let i = index">
              <select [(ngModel)]="k.skill" aria-label="Skill" style="min-width:200px"><option [ngValue]="null">Choose…</option><option *ngFor="let s of meta?.skills || []" [ngValue]="s.id">{{ s.name }}</option></select>
              <span class="lp-muted">level at least</span><select [(ngModel)]="k.level" aria-label="Level"><option *ngFor="let l of [1,2,3,4,5]" [ngValue]="l">{{ l }}</option></select>
              <span class="lp-muted">people</span><input type="number" min="1" max="50" [(ngModel)]="k.count" aria-label="People" style="width:70px">
              <button type="button" class="lp-btn" (click)="form.skills.splice(i, 1)" aria-label="Remove the skill">×</button></div>
            <button type="button" class="lp-btn" style="margin-top:6px" (click)="form.skills.push({ skill: null, level: 2, count: 1 })" [disabled]="!(meta?.skills?.length)" data-add-skill>+ Skill</button>
            <small class="lp-muted" style="display:block;margin-top:4px" *ngIf="!(meta?.skills?.length)">No skills yet – add them in Learning › Skills.</small>
            <span class="sp-err" *ngIf="err['skills']">{{ err['skills'] }}</span></div>
        </div>
        <div class="lp-foot"><button type="button" class="lp-btn" (click)="form = null">Cancel</button>
          <button type="button" class="lp-btn primary" [disabled]="busy" (click)="save()">Save shift</button></div>
      </div>

      <div class="lp-scroll">
        <table class="lp-mini">
          <thead><tr><th>Shift</th><th>Time</th><th>Break</th><th>Hours</th><th>Grace in / out</th><th>Full / half day</th><th>OT after</th><th>Allowances</th><th>Branches</th><th>Active</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let s of rows">
              <td><span class="sp-swatch" [style.background]="s.colour"></span><b>{{ s.name }}</b><span class="lp-muted" style="margin-left:6px">{{ s.code }}</span></td>
              <td>{{ s.start_time ? s.start_time + '–' + s.end_time : 'Day off' }}<span class="lp-muted" *ngIf="s.night_shift"> · night</span>
                <div class="lp-muted" *ngIf="s.segments?.length" data-split-row>split: {{ partsText(s) }}</div>
                <div class="lp-muted" *ngIf="s.skills?.length">skills: {{ skillsText(s) }}</div></td>
              <td>{{ s.break_minutes }} min</td><td>{{ s.hours }}</td>
              <td>{{ s.grace_in_minutes }} / {{ s.grace_out_minutes }} min</td>
              <td>{{ s.min_hours ?? '–' }} / {{ s.half_day_hours ?? '–' }} h</td><td>{{ s.ot_after_minutes }} min</td>
              <td>{{ s.shift_allowance }} / {{ s.night_allowance }}</td>
              <td>{{ s.branches?.length ? s.branches.join(', ') : 'All' }}</td>
              <td>{{ s.active ? 'Yes' : 'No' }}</td>
              <td class="sp-row-actions">
                <button type="button" class="lp-btn" *ngIf="meta?.rights?.change_shift" (click)="edit(s)">Edit</button>
                <button type="button" class="lp-btn danger" *ngIf="meta?.rights?.delete_shift && !s.in_use" (click)="remove(s)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`,
})
export class SpShiftMasterComponent implements OnInit {
  meta: SpMeta | null = null;
  rows: any[] = [];
  form: any = null; err: Record<string, string> = {}; nightMode: 'auto' | 'yes' | 'no' = 'auto';
  uploadRows: any[] = []; uploadErrors = 0; uploadFile: File | null = null;
  msg = ''; msgErr = false; busy = false;

  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try { this.meta = await this.api.meta(); } catch (e) { this.say(SpApiService.error(e), true); }
    await this.load();
  }
  say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.markForCheck(); }
  async load(): Promise<void> { try { this.rows = await this.api.get('shift-master/'); } catch (e) { this.say(SpApiService.error(e), true); } this.cd.markForCheck(); }
  crosses(): boolean { return !!(this.form?.start_time && this.form?.end_time && this.form.end_time <= this.form.start_time); }
  toggleBranch(id: number): void { const i = this.form.branch_ids.indexOf(id); i >= 0 ? this.form.branch_ids.splice(i, 1) : this.form.branch_ids.push(id); }
  partsText(s: any): string { return (s.segments || []).map((p: any) => `${p.start}–${p.end}`).join(' + '); }
  skillsText(s: any): string {
    return (s.skills || []).map((k: any) => `${(this.meta?.skills || []).find(x => x.id === k.skill)?.name || k.skill} ≥${k.level} ×${k.count}`).join(', ');
  }
  addPart(): void {
    if (!this.form.segments.length && this.form.start_time && this.form.end_time) { this.form.segments.push({ start: this.form.start_time, end: '' }, { start: '', end: this.form.end_time }); return; }
    this.form.segments.push({ start: '', end: '' });
  }
  edit(s: any): void {
    this.form = s ? { ...EMPTY, ...s, branch_ids: [...(s.branch_ids || [])], segments: (s.segments || []).map((p: any) => ({ ...p })), skills: (s.skills || []).map((k: any) => ({ ...k })) }
      : { ...EMPTY, branch_ids: [], segments: [], skills: [] };
    this.nightMode = !s || s.night_auto ? 'auto' : (s.night_shift ? 'yes' : 'no');
    this.err = {};
  }
  async save(): Promise<void> {
    const b: any = { ...this.form };
    b.night_auto = this.nightMode === 'auto';
    if (!b.night_auto) b.night_shift = this.nightMode === 'yes'; else delete b.night_shift;
    ['id', 'hours', 'cross_midnight', 'branches', 'in_use', 'has_rules', 'split_gap_minutes'].forEach(k => delete b[k]);
    b.segments = (b.segments || []).filter((p: any) => p.start || p.end);
    b.skills = (b.skills || []).filter((k: any) => k.skill);
    this.busy = true;
    try {
      if (this.form.id) await this.api.patch(`shift-master/${this.form.id}/`, b); else await this.api.post('shift-master/', b);
      this.form = null; this.say('Shift saved.');
      await this.load();
    } catch (e) { this.err = SpApiService.fieldErrors(e); this.say(SpApiService.error(e), true); }
    this.busy = false;
  }
  async remove(s: any): Promise<void> {
    if (!confirm(`Delete the shift “${s.name}”?`)) return;
    try { await this.api.delete(`shift-master/${s.id}/`); this.say('Shift deleted.'); await this.load(); } catch (e) { this.say(SpApiService.error(e), true); }
  }
  template(): void { this.api.download('template/shifts/', {}, 'shift_upload_template.csv'); }
  async upload(ev: Event): Promise<void> {
    const f = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!f) return;
    try {
      const r: any = await this.api.upload('upload/shifts/', f);
      this.uploadRows = r.rows; this.uploadErrors = r.errors; this.uploadFile = f;
      this.say(r.errors ? `${r.errors} row(s) have errors – fix the file and upload it again.` : `${r.valid} shift(s) are ready. Check them and press Save.`, !!r.errors);
    } catch (e) { this.say(SpApiService.error(e), true); }
  }
  async commitUpload(): Promise<void> {
    if (!this.uploadFile) return;
    try { const r: any = await this.api.upload('upload/shifts/', this.uploadFile, { commit: 1 }); this.uploadRows = []; this.say(`${r.saved} shift(s) saved.`); await this.load(); }
    catch (e) { this.say(SpApiService.error(e), true); }
  }
}
