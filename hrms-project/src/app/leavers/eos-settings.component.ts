// v1.62.11 (EOS settings): new screen – Payroll › Setup › End of service settings (the company's rules of the final settlement)
/**
 * Every option is off by default (today's rules); a saved (submitted or later) settlement never changes, a draft takes the rules when it
 * is calculated again. API: payroll-plus/api/eos-settings/ (GET, PUT – payroll setup right).
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { TPipe, ZDatePipe, i18nT } from '../shared-ui/i18n.service';
import { LV_STYLES } from './leavers.styles';

interface Opt { v: string; label: string; hint: string; }

@Component({
  selector: 'app-eos-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe, ZDatePipe],
  styles: [LV_STYLES + `
.lv .es-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:16px;margin-top:16px;align-items:start}
.lv .es-card .ch{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line)}
.lv .es-card .ch .material-icons{color:var(--acc);font-size:20px}
.lv .es-card .cb{padding:6px 18px 16px}
.lv .es-q{padding:12px 0;border-bottom:1px solid #f0f1f5}
.lv .es-q:last-child{border-bottom:0}
.lv .es-q > b{display:block;color:var(--ink);font-size:13px;margin-bottom:8px}
.lv .es-q > p{margin:-4px 0 8px;color:var(--mut);font-size:12px;line-height:1.45}
.lv .seg{display:flex;flex-wrap:wrap;gap:8px}
.lv .seg label{flex:1 1 180px;display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:9px 11px;cursor:pointer;background:#fff}
.lv .seg label.on{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc) inset;background:#fbfbff}
.lv .seg input{margin-top:2px;accent-color:var(--acc)}
.lv .seg span{display:flex;flex-direction:column;gap:2px;font-size:13px;font-weight:600;color:var(--ink)}
.lv .seg small{font-weight:400;color:var(--mut);font-size:11.5px;line-height:1.35}
.lv .seg .dflt{font-size:10.5px;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.3px}
.lv .es-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
.lv .es-row .fl{min-width:150px}
.lv .chips{display:flex;flex-wrap:wrap;gap:6px}
.lv .chips label{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:5px 11px;font-size:12.5px;cursor:pointer;background:#fff}
.lv .chips label.on{border-color:var(--acc);background:var(--acc2);color:var(--acc);font-weight:600}
.lv .chips input{accent-color:var(--acc)}
.lv .chips .cat{color:var(--mut);font-weight:400;font-size:11px}
.lv .es-bar{position:sticky;bottom:0;z-index:5;display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:16px;padding:12px 18px;background:#fff;
  border:1px solid var(--line);border-radius:14px;box-shadow:0 -4px 16px rgba(27,22,64,.06);flex-wrap:wrap}
.lv .es-bar .sp{flex:1;color:var(--mut);font-size:12px}
.lv .es-note{margin-top:16px;padding:12px 16px;border-radius:12px;background:var(--infobg);color:var(--info);font-size:12.5px;line-height:1.5;display:flex;gap:10px}
@media (max-width:640px){.lv{padding:14px 16px 30px}.lv .lv-head{flex-direction:column}}
`],
  template: `
<div class="lv" *ngIf="d" data-eos-settings>
  <div class="card lv-head">
    <div>
      <h1>{{ 'End of service settings' | t }}</h1>
      <p>{{ 'How the final settlement counts service, prices the gratuity, the leave salary and the final salary, and pays the air ticket. Every option starts at today’s rule.' | t }}</p>
    </div>
    <a class="lv-btn" routerLink="/main-sidebar/sub-sidebar/leavers"><span class="material-icons">how_to_reg</span>{{ 'Leavers' | t }}</a>
  </div>
  <p class="msg" *ngIf="msg" [class.err]="bad" role="status">{{ msg }}</p>
  <div class="es-note"><span class="material-icons" style="font-size:18px">info</span>
    <div>{{ 'Saved settlements (submitted or later) never change. A draft takes these rules when HR calculates it again or saves an entry on it.' | t }}</div></div>

  <div class="es-grid">
    <!-- gratuity and service -->
    <div class="card es-card">
      <div class="ch"><span class="material-icons">workspace_premium</span><h2>{{ 'Gratuity and service' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><b>{{ 'Daily basic wage for the gratuity' | t }}</b>
          <div class="seg"><label *ngFor="let o of gratuityDaily" [class.on]="s.gratuity_daily === o.v">
            <input type="radio" name="gd" [attr.data-opt]="o.v" [value]="o.v" [(ngModel)]="s.gratuity_daily" [disabled]="!d.can_edit">
            <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults.gratuity_daily === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        <div class="es-q"><b>{{ 'Service days' | t }}</b>
          <div class="seg"><label *ngFor="let o of serviceDays" [class.on]="s.service_days === o.v">
            <input type="radio" name="sd" [value]="o.v" [(ngModel)]="s.service_days" [disabled]="!d.can_edit">
            <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults.service_days === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        <div class="es-q"><b>{{ 'Leave types counted as unpaid' | t }}</b>
          <p>{{ 'Days of these leave types are taken off the service (UAE Labour Law Art. 51). None chosen = the leave types of type “unpaid”.' | t }}</p>
          <div class="chips"><label *ngFor="let t of d.leave_types" [class.on]="has(s.unpaid_leave_types, t.id)">
            <input type="checkbox" [checked]="has(s.unpaid_leave_types, t.id)" (change)="toggle('unpaid_leave_types', t.id)" [disabled]="!d.can_edit">{{ t.name }}<span class="cat" *ngIf="t.branch">· {{ t.branch }}</span>
            <span class="cat" *ngIf="t.type === 'unpaid'">· {{ 'unpaid' | t }}</span></label></div></div>
      </div>
    </div>

    <!-- leave salary -->
    <div class="card es-card">
      <div class="ch"><span class="material-icons">beach_access</span><h2>{{ 'Leave salary' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><b>{{ 'Based on' | t }}</b>
          <div class="seg"><label *ngFor="let o of leaveBase" [class.on]="s.leave_base === o.v">
            <input type="radio" name="lb" [value]="o.v" [(ngModel)]="s.leave_base" [disabled]="!d.can_edit">
            <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults.leave_base === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        <div class="es-q"><b>{{ 'Daily rate' | t }}</b>
          <div class="seg"><label *ngFor="let o of leaveDaily" [class.on]="s.leave_daily === o.v">
            <input type="radio" name="ld" [value]="o.v" [(ngModel)]="s.leave_daily" [disabled]="!d.can_edit">
            <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults.leave_daily === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        <div class="es-q" *ngIf="s.leave_daily === 'contract'">
          <div class="es-row"><label class="fl">{{ 'Contract leave days (company)' | t }}<input class="f num" type="number" min="1" max="366" [(ngModel)]="s.contract_leave_days" name="cld" [disabled]="!d.can_edit" style="width:140px"></label>
            <span class="mut" style="font-size:12px;flex:1 1 220px">{{ 'An employee’s annual leave policy gives his own days; HR can change them on the draft settlement.' | t }}</span></div></div>
      </div>
    </div>

    <!-- final salary -->
    <div class="card es-card">
      <div class="ch"><span class="material-icons">payments</span><h2>{{ 'Final salary' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><b>{{ 'Payroll month starts on day' | t }}</b>
          <p>{{ '1 = calendar months; 25 = from the 25th to the 24th of the next month. A complete payroll month is always paid in full.' | t }}</p>
          <div class="es-row"><label class="fl">{{ 'Day' | t }}<input class="f num" type="number" min="1" max="28" [(ngModel)]="s.cycle_start_day" name="csd" [disabled]="!d.can_edit" style="width:110px"></label>
            <span class="mut" style="font-size:12px" *ngIf="+s.cycle_start_day > 1">{{ 'Payroll month: day {0} to day {1} of the next month' | t:s.cycle_start_day:(+s.cycle_start_day - 1) }}</span></div></div>
        <div class="es-q"><b>{{ 'Part month' | t }}</b>
          <div class="seg"><label *ngFor="let o of salaryDaily" [class.on]="s.salary_daily === o.v">
            <input type="radio" name="sdl" [value]="o.v" [(ngModel)]="s.salary_daily" [disabled]="!d.can_edit">
            <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults.salary_daily === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        <div class="es-q"><b>{{ 'Leave out of the final salary' | t }}</b>
          <p>{{ 'Salary components not paid in the final salary (for example a WIFI allowance). They are shown with their amounts on the case and the print.' | t }}</p>
          <div class="chips" data-eos-exclude><label *ngFor="let c of d.components" [class.on]="has(s.salary_exclude, c.key)" [attr.title]="c.branches?.join(', ')">
            <input type="checkbox" [checked]="has(s.salary_exclude, c.key)" (change)="toggle('salary_exclude', c.key)" [disabled]="!d.can_edit || c.category === 'basic'">{{ c.name }}
            <span class="cat" *ngIf="c.code">· {{ c.code }}</span></label></div></div>
      </div>
    </div>

    <!-- air ticket, print, accounting -->
    <div class="card es-card">
      <div class="ch"><span class="material-icons">flight</span><h2>{{ 'Air ticket, print and accounting' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><b>{{ 'Air ticket' | t }}</b>
          <div class="seg"><label *ngFor="let o of airTicket" [class.on]="s.air_ticket === o.v">
            <input type="radio" name="at" [value]="o.v" [(ngModel)]="s.air_ticket" [disabled]="!d.can_edit">
            <span>{{ o.label | t }}<small>{{ o.hint | t }}</small><em class="dflt" *ngIf="d.defaults.air_ticket === o.v">{{ 'Default' | t }}</em></span></label></div></div>
        <div class="es-q"><b>{{ 'Emirates ID on the statement' | t }}</b>
          <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" [(ngModel)]="s.show_full_emirates_id" name="feid" [disabled]="!d.can_edit">
            {{ 'Show the full number (masked by default: only the last 4 digits)' | t }}</label></div>
        <div class="es-q"><b>{{ 'Journal for settlements' | t }}</b>
          <div class="es-row"><label class="fl">{{ 'Journal code' | t }}<input class="f" [(ngModel)]="s.journal_code" name="jc" maxlength="20" [placeholder]="d.global_journal || 'SAL'" [disabled]="!d.can_edit" style="width:160px"></label>
            <span class="mut" style="font-size:12px;flex:1 1 220px">{{ 'Empty = the journal of Accounting › Settings ({0}).' | t:(d.global_journal || '–') }}</span></div></div>
      </div>
    </div>
  </div>

  <div class="es-bar" *ngIf="d.can_edit">
    <span class="sp" *ngIf="d.settings.updated_at">{{ 'Last changed by {0}, {1}' | t:(d.settings.updated_by || '–'):(d.settings.updated_at | zdate:'datetime') }}</span>
    <button type="button" class="lv-btn" (click)="defaults()" [disabled]="busy">{{ 'Back to the defaults' | t }}</button>
    <button type="button" class="lv-btn primary" (click)="save()" [disabled]="busy" data-eos-save><span class="material-icons">save</span>{{ 'Save' | t }}</button>
  </div>
  <p class="mut" *ngIf="!d.can_edit" style="margin-top:12px">{{ 'You can see these settings; payroll setup rights are needed to change them.' | t }}</p>
</div>
<div class="lv" *ngIf="!d && msg"><p class="msg err">{{ msg }}</p></div>`,
})
export class EosSettingsComponent implements OnInit {
  d: any = null; s: any = {}; msg = ''; bad = false; busy = false;
  gratuityDaily: Opt[] = [{ v: 'basic_30', label: 'Basic ÷ 30', hint: 'A month counts as 30 days' }, { v: 'basic_365', label: 'Basic × 12 ÷ 365', hint: 'The yearly basic over 365 days' }];
  serviceDays: Opt[] = [{ v: 'both', label: 'Joining day and last day both counted', hint: 'Last working day − joining date + 1' },
    { v: 'difference', label: 'Last working day − joining date', hint: 'The difference between the two dates' }];
  leaveBase: Opt[] = [{ v: 'basic', label: 'Basic salary', hint: 'The basic of the salary structure' }, { v: 'gross', label: 'Gross salary', hint: 'Basic + the fixed allowances' }];
  leaveDaily: Opt[] = [{ v: 'd30', label: 'Monthly ÷ 30', hint: 'As today' }, { v: 'contract', label: 'Monthly ÷ contract leave days', hint: 'For example 22 or 26 – the payroll leave provision' },
    { v: 'd365', label: 'Monthly × 12 ÷ 365', hint: 'Calendar-day rate' }];
  salaryDaily: Opt[] = [{ v: 'd30', label: 'Days ÷ 30', hint: 'At most 30 days in a month' }, { v: 'cycle', label: 'Days ÷ days of that month', hint: 'Calendar-day basis' }];
  airTicket: Opt[] = [{ v: 'policy', label: 'From the air ticket policy', hint: 'Allocations and the ticket earned; an amount HR enters is added' },
    { v: 'hr', label: 'Entered by HR', hint: 'HR enters the amount, sector, class and travellers; the policy amount is shown, not paid' }];
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(): string { return `${this.rec.api}/payroll-plus/api/eos-settings/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  private err(e: any): string {
    const x = e?.error;
    if (x && typeof x === 'object' && typeof x.detail === 'string') { return x.detail + (x.errors ? ' ' + Object.values(x.errors).filter(v => typeof v === 'string').join(' ') : ''); }
    return httpErrorText(e) || i18nT('It could not be done.');
  }
  async ngOnInit(): Promise<void> {
    try { this.set(await firstValueFrom(this.http.get<any>(this.url()))); }
    catch (e: any) { this.msg = this.err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  private set(d: any): void {
    this.d = d;
    this.s = JSON.parse(JSON.stringify(d.settings || {}));
    this.s.salary_exclude = this.s.salary_exclude || []; this.s.unpaid_leave_types = this.s.unpaid_leave_types || [];
  }
  has(list: any[], v: any): boolean { return (list || []).some(x => String(x) === String(v)); }
  toggle(k: 'salary_exclude' | 'unpaid_leave_types', v: any): void {
    const l: any[] = this.s[k] || [];
    this.s[k] = this.has(l, v) ? l.filter(x => String(x) !== String(v)) : [...l, v];
  }
  defaults(): void { this.s = { ...this.s, ...JSON.parse(JSON.stringify(this.d.defaults || {})) }; this.msg = i18nT('Defaults set – save to keep them.'); this.bad = false; }
  async save(): Promise<void> {
    this.busy = true; this.msg = '';
    const keys = Object.keys(this.d.defaults || {});
    const body: any = {};
    keys.forEach(k => body[k] = this.s[k]);
    try { this.set(await firstValueFrom(this.http.put<any>(this.url(), body))); this.msg = i18nT('Saved. Drafts take the new rules when they are calculated again.'); this.bad = false; }
    catch (e: any) { this.msg = this.err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}
