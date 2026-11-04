// v1.67.0 (item 25a)
/**
 * v1.67.0 (item 25a) – Attendance › Ramadan hours. The Ramadan period of each year (the dates follow the moon sighting and the yearly
 * MOHRE announcement – HR enters them), the daily reduction (UAE private sector: 2 hours – Decree-Law 33/2021 Art. 17(4), Cabinet
 * Resolution 1/2022 Art. 15(2); sources shown) or Ramadan times per shift, and categories it does not apply to. On those days
 * attendance late / early / minimum hours / overtime use the Ramadan hours. API /attendance-plus/api/ramadan/ (AttendancePlus/v167.py).
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zToast } from '../shared-ui/z-toast';
import { T, dmy } from './t62';

@Component({
  selector: 'app-t62-ramadan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  styles: [`.rm-law { background: #f6f5ff; border-radius: 10px; padding: 10px 14px; font-size: 12.5px; color: #3b3f55; margin-bottom: 12px; }
    .rm-law ul { margin: 4px 0 0; padding-inline-start: 18px; } .rm-sec { margin-top: 16px; }
    .rm-sec h3 { font-size: 14px; font-weight: 600; margin: 0 0 6px; } .rm-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
    .rm-tbc { display: inline-block; background: #fff0d9; color: #a0610a; border-radius: 10px; padding: 1px 8px; font-size: 11.5px; font-weight: 600; }`],
  template: `
<div class="container hr-page" data-t62="ramadan">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Ramadan hours</h1>
          <p class="hr-head-d">Shorter working hours during Ramadan: on the days of the period, late arrival, early leaving, minimum hours and overtime are counted from the Ramadan hours.</p></div>
        <div class="hr-head-a hr-head-b"><button type="button" class="hr-tbtn primary" [disabled]="!v || busy" (click)="save(false)" data-rm-save>Save</button></div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="v">
      <div class="rm-law" data-rm-law>
        <ng-container *ngIf="v.verified"><b>{{ t(v.law) }}</b><ul><li *ngFor="let s of v.sources">{{ t(s) }}</li></ul></ng-container>
        <ng-container *ngIf="!v.verified"><span class="rm-tbc">To be confirmed</span> {{ t('The Ramadan hours of this country were not checked – set the reduction your adviser confirms.') }}</ng-container>
        <div style="margin-top:6px">{{ t('The dates of Ramadan follow the moon sighting and are announced every year – enter them for each year.') }}</div>
      </div>
      <div class="rm-row">
        <label class="hr-check" style="display:flex;gap:6px;align-items:center"><input type="checkbox" [(ngModel)]="v.enabled" data-rm-enabled> Use Ramadan hours</label>
        <label class="t62-f" style="width:220px"><span class="t62-l">Hours less a day</span>
          <input type="number" min="0" max="6" step="0.5" [(ngModel)]="v.reduce_hours" [class.bad]="err['reduce_hours']" data-rm-hours>
          <span class="t62-hint" *ngIf="v.law_default_hours !== null">{{ t('Law: {0} hours', [v.law_default_hours]) }}</span>
          <span class="t62-err" *ngIf="err['reduce_hours']">{{ err['reduce_hours'] }}</span></label>
      </div>

      <div class="rm-sec">
        <h3>Ramadan period of each year</h3>
        <table class="t62-tbl" style="max-width:760px" data-rm-periods>
          <thead><tr><th>Year</th><th>First day</th><th>Last day</th><th>Days</th><th>Note</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let p of v.periods; let i = index" [attr.data-rm-period]="i">
              <td><input type="number" [(ngModel)]="p.year" style="width:90px"></td>
              <td><input type="date" [(ngModel)]="p.from" [class.bad]="err['periods.' + i]"></td>
              <td><input type="date" [(ngModel)]="p.to" [class.bad]="err['periods.' + i]"></td>
              <td>{{ days(p) }}</td>
              <td><input [(ngModel)]="p.note" maxlength="120" placeholder="e.g. as announced by MOHRE"></td>
              <td><button type="button" class="t62-link" (click)="v.periods.splice(i, 1)">Remove</button></td>
            </tr>
            <tr *ngIf="!v.periods.length"><td colspan="6" class="hr-empty">No Ramadan period yet – nothing changes in attendance.</td></tr>
          </tbody>
        </table>
        <p class="t62-err" *ngFor="let e of periodErrors()">{{ e }}</p>
        <button type="button" class="t62-btn small" style="margin-top:8px" (click)="addYear()" data-rm-add>+ Add a year</button>
      </div>

      <div class="rm-sec">
        <h3>Ramadan times per shift (optional)</h3>
        <p class="t62-hint">{{ t('A shift with Ramadan times uses them; every other shift ends {0} hour(s) earlier.', [v.reduce_hours || 0]) }}</p>
        <table class="t62-tbl" style="max-width:760px" data-rm-shifts>
          <thead><tr><th>Shift</th><th>Normal hours</th><th>Ramadan start</th><th>Ramadan end</th></tr></thead>
          <tbody><tr *ngFor="let s of v.shifts" [attr.data-rm-shift]="s.id">
            <td>{{ s.name }}<span class="t62-cell-sub" *ngIf="s.code">{{ s.code }}</span></td><td>{{ s.start }}–{{ s.end }}</td>
            <td><input type="time" [(ngModel)]="times[s.id].start"></td><td><input type="time" [(ngModel)]="times[s.id].end"></td></tr></tbody>
        </table>
      </div>

      <div class="rm-sec">
        <h3>Not for these categories</h3>
        <span class="t62-chips"><label *ngFor="let c of cats" class="t62-chip" [class.grey]="!excluded.has(c.id)" style="cursor:pointer">
          <input type="checkbox" [checked]="excluded.has(c.id)" (change)="toggle(c.id)" style="height:auto;margin-inline-end:4px">{{ c.ctgry_title }}</label></span>
      </div>
      <div class="t62-foot" style="padding-inline:0">
        <span class="t62-grow"></span>
        <button type="button" class="t62-btn" [disabled]="busy" (click)="save(true)" data-rm-save-recalc>Save and recalculate the Ramadan days up to today</button>
        <button type="button" class="t62-btn primary" [disabled]="busy" (click)="save(false)">Save</button>
      </div>
    </div>
  </div>
</div>`,
})
export class T62RamadanComponent implements OnInit {
  v: any = null; failed = ''; busy = false; err: Record<string, string> = {};
  times: Record<number, { start: string; end: string }> = {};
  cats: any[] = []; excluded = new Set<number>();
  t = T; dmy = dmy;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  url(p: string): string { return `${this.rec.api}${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  async ngOnInit(): Promise<void> {
    try {
      this.take(await firstValueFrom(this.http.get(this.url('/attendance-plus/api/ramadan/'))));
      const c: any = await firstValueFrom(this.http.get(this.url('/organisation/api/Catogory/'))).catch(() => []);
      this.cats = Array.isArray(c) ? c : (c?.results || []);
    } catch (e) { this.failed = httpErrorText(e); }
    this.cd.markForCheck();
  }
  take(v: any): void {
    this.v = v; this.times = {};
    for (const s of v.shifts || []) { const x = v.shift_times?.[String(s.id)]; this.times[s.id] = { start: x?.start || '', end: x?.end || '' }; }
    this.excluded = new Set(v.exclude_category_ids || []);
  }
  days(p: any): string { if (!p.from || !p.to) { return '–'; } const n = Math.round((+new Date(p.to) - +new Date(p.from)) / 86400000) + 1; return n > 0 ? String(n) : '–'; }
  addYear(): void { const y = Math.max(new Date().getFullYear(), ...this.v.periods.map((p: any) => +p.year + 1)); this.v.periods.push({ year: y, from: '', to: '', note: '' }); }
  toggle(id: number): void { if (this.excluded.has(id)) { this.excluded.delete(id); } else { this.excluded.add(id); } }
  periodErrors(): string[] { return Object.entries(this.err).filter(([k]) => k.startsWith('periods')).map(([, m]) => m); }
  async save(recalc: boolean): Promise<void> {
    this.busy = true; this.err = {};
    const st: any = {};
    Object.entries(this.times).forEach(([k, t]) => { if (t.start || t.end) { st[k] = t; } });
    try {
      const res: any = await firstValueFrom(this.http.post(this.url('/attendance-plus/api/ramadan/'), {
        enabled: this.v.enabled, reduce_hours: this.v.reduce_hours, periods: this.v.periods, shift_times: st,
        exclude_category_ids: [...this.excluded], recalculate: recalc }));
      res.shifts = this.v.shifts; this.take(res);
      zToast(recalc ? T('Ramadan hours saved – {0} day(s) recalculated.', [res.recalculated || 0]) : T('Ramadan hours saved.'), 'ok');
    } catch (e: any) { this.err = e?.error?.errors || {}; zToast(e?.error?.detail || httpErrorText(e), 'err'); }
    this.busy = false; this.cd.markForCheck();
  }
}
