// v1.62.6 (item 22)
/**
 * v1.62.6 (item 22) – "What decides the working days": the order roster > shift override > shift pattern > weekend calendar,
 * the weekend calendar of every level (employee > designation > category > department > branch – the most specific wins), the
 * shift pattern, the holiday calendar and the next 14 days with what decided each one. Used on the employee record (Time) and
 * on My schedule. API: /leave-policy/api/working-days/?employee=<id> (without: the user's own).
 */
import { ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { httpErrorText } from './z-http-error.interceptor';

@Component({
  selector: 'z-working-days',
  standalone: true,
  imports: [CommonModule],
  styles: [`:host { display: block; } .wd-order { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0 12px; font-size: 12.5px; }
    .wd-step { border: 1px solid #dfe1ea; border-radius: 14px; padding: 2px 10px; color: #5d6670; background: #fafafd; }
    .wd-step.on { border-color: #5b4ff5; background: #efedff; color: #3730a3; font-weight: 600; } .wd-arrow { color: #9aa1ad; }
    .wd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px 18px; margin-bottom: 12px; }
    .wd-box h3 { font-size: 12px; color: #6b7185; margin: 0 0 4px; font-weight: 600; } .wd-box p { margin: 0; font-size: 13px; }
    table.wd { width: 100%; border-collapse: collapse; font-size: 12.5px; } .wd th, .wd td { padding: 5px 6px; border-bottom: 1px solid #eef0f2; text-align: start; }
    .wd th { background: #f7f8fa; font-weight: 600; } .wd tr.win td { background: #f3f2ff; font-weight: 600; }
    .wd-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; margin-top: 10px; }
    .wd-day { border: 1px solid #e3e6ea; border-radius: 8px; padding: 4px 6px; font-size: 11.5px; min-height: 54px; background: #fff; }
    .wd-day.off { background: #f4f5f7; color: #6b7185; } .wd-day.hol { background: #fff4e0; } .wd-day b { display: block; font-size: 12px; }
    .wd-src { display: block; color: #6b7185; font-size: 10.5px; } .wd-warn { color: #9b2c24; font-size: 12.5px; margin: 6px 0; }
    .wd-muted { color: #6b7185; font-size: 12px; }`],
  template: `
<div *ngIf="!w && !msg"><span class="z-skel"></span></div>
<p class="wd-warn" *ngIf="msg">{{ msg }}</p>
<ng-container *ngIf="w">
  <div class="wd-order" data-wd-order>
    <ng-container *ngFor="let s of steps; let last = last"><span class="wd-step" [class.on]="w.decides === s.key" [attr.data-wd-step]="s.key">{{ s.label }}</span><span class="wd-arrow" *ngIf="!last">›</span></ng-container>
  </div>
  <p class="wd-warn" *ngIf="w.missing" data-wd-missing>No roster, shift pattern or weekend calendar – every day counts as a working day.</p>
  <div class="wd-grid">
    <div class="wd-box"><h3>Weekend calendar</h3>
      <p data-wd-weekend *ngIf="w.weekend.calendar"><span data-no-translate>{{ w.weekend.calendar }}</span> – <ng-container *ngFor="let n of w.weekend.days; let l = last"><span>{{ n }}</span><ng-container *ngIf="!l">, </ng-container></ng-container></p>
      <p *ngIf="!w.weekend.calendar">Not set</p>
      <p class="wd-muted" *ngIf="w.weekend.level" data-wd-decided><span>Decided by</span>: <span>{{ w.weekend.level_label }}</span>&ngsp;<span data-no-translate>{{ w.weekend.name }}</span></p>
      <p class="wd-muted" *ngFor="let u of w.weekend.upcoming"><span>From</span> {{ u.from | date:'dd/MM/yyyy' }}: <span data-no-translate>{{ u.calendar }}</span> – <ng-container *ngFor="let n of u.days; let l = last"><span>{{ n }}</span><ng-container *ngIf="!l">, </ng-container></ng-container></p></div>
    <div class="wd-box"><h3>Shift pattern</h3>
      <p *ngIf="w.schedule" data-no-translate>{{ w.schedule.pattern || w.schedule.name }}</p><p class="wd-muted" *ngIf="w.schedule"><span data-no-translate>{{ w.schedule.name }}</span><ng-container *ngIf="w.schedule.from"> · {{ w.schedule.from | date:'dd/MM/yyyy' }}</ng-container><ng-container *ngIf="w.schedule.to"> – {{ w.schedule.to | date:'dd/MM/yyyy' }}</ng-container></p>
      <p *ngIf="!w.schedule">None</p></div>
    <div class="wd-box"><h3>Holiday calendar</h3><p>{{ w.holiday_calendar || 'Not set' }}</p></div>
  </div>
  <table class="wd" data-wd-levels><tr><th>Weekend assigned by</th><th>Name</th><th>Weekend calendar</th><th>Days off</th></tr>
    <tr *ngFor="let l of w.weekend.levels" [class.win]="l.wins" [attr.data-wd-level]="l.level"><td><span>{{ l.label }}</span><ng-container *ngIf="l.wins"> ✓</ng-container></td><td data-no-translate>{{ l.name || '–' }}</td><td data-no-translate>{{ l.calendar || '–' }}</td><td><ng-container *ngFor="let n of l.days; let l = last"><span>{{ n }}</span><ng-container *ngIf="!l">, </ng-container></ng-container><ng-container *ngIf="!l.days.length">–</ng-container></td></tr></table>
  <p class="wd-muted">The most specific weekend wins: employee, then designation, category, department, branch.</p>
  <div class="wd-days" data-wd-days>
    <div class="wd-day" *ngFor="let d of w.days" [class.off]="!d.working" [class.hol]="d.holiday" [attr.data-wd-date]="d.date">
      <b><span>{{ d.weekday }}</span> {{ d.date | date:'dd/MM' }}</b><span>{{ d.working ? (d.shift || 'Working day') : (d.holiday && !d.off ? 'Public holiday' : 'Day off') }}</span>
      <span class="wd-src">{{ srcLabel(d.source) }}</span></div>
  </div>
</ng-container>`,
})
export class ZWorkingDaysComponent implements OnChanges, OnInit {
  @Input() employeeId: number | null = null;
  w: any = null; msg = '';
  steps = [{ key: 'roster', label: 'Roster' }, { key: 'override', label: 'Shift override' }, { key: 'pattern', label: 'Shift pattern' }, { key: 'weekend', label: 'Weekend calendar' }];
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private loaded: number | null | undefined = undefined;
  ngOnInit(): void { if (this.loaded === undefined) { this.ngOnChanges(); } }   // My schedule: no input bound, ngOnChanges never runs
  async ngOnChanges(): Promise<void> {
    if (this.loaded === this.employeeId) { return; }
    this.loaded = this.employeeId;
    this.w = null; this.msg = '';
    const q = this.employeeId ? `&employee=${this.employeeId}` : '';
    try { this.w = await firstValueFrom(this.http.get(`${this.rec.api}/leave-policy/api/working-days/?schema=${localStorage.getItem('selectedSchema') || ''}${q}`)); }
    catch (e) { this.msg = httpErrorText(e); }
    this.cd.markForCheck();
  }
  dayList(d: string[]): string { return (d || []).join(', '); }
  srcLabel(s: string): string { return ({ roster: 'Roster', override: 'Shift override', pattern: 'Shift pattern', weekend: 'Weekend calendar', none: 'Nothing set' } as any)[s] || s; }
}
