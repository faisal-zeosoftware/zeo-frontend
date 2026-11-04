// v1.62.10 (items 171, 174, 176)
/**
 * v1.62.10 – the base of the converted Attendance / Calendar screens (group "time"): the list is loaded with HttpClient (so
 * the shared list tools of z-list.directive.ts know its API: search, filters, export, bulk delete, used records → Make
 * inactive), the rights come from the user's permission groups (HrPermissionService), forms open with openZForm
 * (shared-ui/z-form.component.ts), a toast replaces the old success pop-ups, Delete on the row asks first and a record used
 * elsewhere is not deleted (the server's reason is shown).
 */
import { ChangeDetectorRef, Directive, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { HrPermissionService, ModelPerms } from '../hr-modules/hr-permission.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { i18nT } from '../shared-ui/i18n-core';
import { zToast } from '../shared-ui/z-toast';
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const T = (s: string, p?: any[]) => i18nT(s, p);
export function dmy(d: any): string {
  const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (d ? String(d) : '–');
}
export function empName(e: any): string {
  if (!e) { return ''; }
  const n = [e.emp_first_name, e.emp_last_name].filter(Boolean).join(' ') || e.emp_name || e.name || '';
  return e.emp_code ? (n ? `${n} (${e.emp_code})` : e.emp_code) : n;
}

@Directive()
export abstract class T62Base implements OnInit, OnDestroy {
  abstract model: string;          // permission model, e.g. 'weekend_calendar'
  abstract endpoint: string;       // list API, e.g. /calendars/api/weekend/
  rows: any[] = [];
  loading = true;
  failed = '';
  can: ModelPerms = { view: false, add: false, change: false, delete: false };
  ready = false;
  t = T;
  dmy = dmy;

  constructor(protected http: HttpClient, protected rec: ZRecordService, protected hp: HrPermissionService, protected cd: ChangeDetectorRef) {}

  url(path: string): string {
    const sch = encodeURIComponent(localStorage.getItem('selectedSchema') || '');
    return `${this.rec.api}${path}${path.includes('?') ? '&' : '?'}schema=${sch}`;
  }
  async get(path: string): Promise<any> { return firstValueFrom(this.http.get(this.url(path))); }
  async list(path: string): Promise<any[]> { const d = await this.get(path); return Array.isArray(d) ? d : (d?.results || []); }

  async ngOnInit(): Promise<void> {
    try { this.can = await firstValueFrom(this.hp.can(this.model)); } catch { /* no rights */ }
    this.ready = true;
    await this.load();
    this.afterInit();
  }
  ngOnDestroy(): void { /* */ }
  afterInit(): void { /* */ }

  async load(): Promise<void> {
    this.loading = true; this.failed = '';
    try { this.rows = this.shape(await this.list(this.endpoint)); }
    catch (e) { this.rows = []; this.failed = httpErrorText(e); }
    this.loading = false; this.cd.markForCheck(); this.cd.detectChanges();
  }
  /** the rows as the screen shows them (sorted, names …) */
  shape(rows: any[]): any[] { return rows; }

  /** Delete on the row: one question, the record's name in it; a record that is used is kept and the reason shown */
  async del(row: any, name: string, endpoint = this.endpoint, after?: () => any): Promise<void> {
    if (!(await zConfirm(T('Delete "{0}"?', [name])))) { return; }
    try {
      await firstValueFrom(this.http.delete(this.url(`${endpoint}${row.id}/`)));
      zToast(T('"{0}" deleted.', [name]), 'ok');
    } catch (e: any) {
      zToast(e?.status === 409 ? (e?.error?.detail || T('Used in transactions – not deleted.')) : T('Not deleted: {0}', [httpErrorText(e)]), 'err');
    }
    if (after) { await after(); } else { await this.load(); }
  }
}
