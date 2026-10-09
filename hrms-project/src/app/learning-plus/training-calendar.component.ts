import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { LpApi } from './lp-api';

/** Month view of training sessions (GET /learning/plus/api/calendar/?from&to). Phones get a list instead of the grid. */
@Component({
  selector: 'app-training-month',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./learning-plus.css'],
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>Training Calendar</h1><p class="lp-desc">Sessions this month. Highlighted: sessions you are nominated for.</p></div>
    <div class="lp-tools">
      <button type="button" class="lp-btn small" (click)="move(-1)" aria-label="Previous month">‹</button>
      <strong style="min-width:130px;text-align:center">{{ month | date:'MMMM yyyy' }}</strong>
      <button type="button" class="lp-btn small" (click)="move(1)" aria-label="Next month">›</button>
      <button type="button" class="lp-btn small" (click)="today()">Today</button>
    </div>
  </div>
  <p class="lp-msg err" *ngIf="msg">{{ msg }}</p>
  <div class="lp-cal">
    <div class="dow" *ngFor="let d of dows">{{ d }}</div>
    <div class="day" *ngFor="let c of cells" [class.out]="!c.inMonth" [class.today]="c.key === todayKey">
      <span class="num">{{ c.date.getDate() }}</span>
      <span class="lp-ev" *ngFor="let e of c.events" [style.background]="e.color" [class.mine]="e.my_status" [title]="title(e)" (click)="sel = e">{{ e.title }}</span>
    </div>
  </div>
  <div class="lp-cal-list lp-card">
    <p class="lp-muted" *ngIf="!events.length">No sessions this month.</p>
    <div class="lp-mod" *ngFor="let e of events" (click)="sel = e" style="cursor:pointer">
      <span class="lp-tag" [style.background]="e.color" style="color:#fff">{{ e.start_date | date:'dd MMM' }}</span>
      <span class="t">{{ e.title }}<div class="lp-muted">{{ e.venue || '' }} {{ e.my_status ? '· you: ' + e.my_status : '' }}</div></span>
    </div>
  </div>
  <div class="lp-card" *ngIf="sel" style="margin-top:12px">
    <h2>{{ sel.title }} <span class="lp-tag">{{ sel.status }}</span></h2>
    <div class="lp-muted">{{ sel.code }} · {{ sel.start_date | date:'dd/MM/yyyy' }}<span *ngIf="sel.end_date !== sel.start_date"> – {{ sel.end_date | date:'dd/MM/yyyy' }}</span>
      <span *ngIf="sel.start_time"> · {{ sel.start_time }}–{{ sel.end_time }}</span></div>
    <div class="lp-muted">Trainer: {{ sel.trainer || '–' }} · Venue: {{ sel.venue || '–' }} · Seats {{ sel.confirmed }}/{{ sel.seats }}<span *ngIf="sel.my_status"> · Your seat: {{ sel.my_status }}</span></div>
    <a *ngIf="sel.online_link" [href]="sel.online_link" target="_blank" rel="noopener">Join online</a>
  </div>
</div>`,
})
export class TrainingMonthComponent implements OnInit {
  month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  cells: { date: Date; key: string; inMonth: boolean; events: any[] }[] = [];
  events: any[] = []; sel: any = null; msg = ''; todayKey = this.key(new Date());
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  ngOnInit(): void { this.load(); }

  key(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  move(n: number): void { this.month = new Date(this.month.getFullYear(), this.month.getMonth() + n, 1); this.sel = null; this.load(); }
  today(): void { this.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1); this.load(); }
  title(e: any): string { return `${e.title} (${e.code})${e.venue ? ' - ' + e.venue : ''}`; }

  async load(): Promise<void> {
    const first = new Date(this.month);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const end = new Date(last); end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
    this.msg = '';
    try { this.events = (await this.api.get<any>('learning/plus/api/calendar/', { from: this.key(start), to: this.key(end) })).events; }
    catch (e) { this.events = []; this.msg = LpApi.err(e, 'Could not load the calendar.'); }
    this.cells = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = this.key(d);
      this.cells.push({ date: new Date(d), key: k, inMonth: d.getMonth() === first.getMonth(),
        events: this.events.filter(e => String(e.start_date) <= k && String(e.end_date) >= k) });
    }
    this.events = this.events.filter(e => String(e.end_date) >= this.key(first) && String(e.start_date) <= this.key(last));
    this.cd.detectChanges();
  }
}
