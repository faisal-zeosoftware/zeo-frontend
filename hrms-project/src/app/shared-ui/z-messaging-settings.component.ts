import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { httpErrorText } from './z-http-error.interceptor';
import { TPipe, ZDatePipe } from './i18n.service';   // v1.53.1 Arabic

/** v1.51.0 Settings › WhatsApp, SMS and push: the company's own WhatsApp / SMS gateway (optional – the customer brings the
 *  account; the token is kept encrypted) and the company's own Firebase project for push notifications to the ZEO app. */
@Component({
  selector: 'z-messaging-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styles: [`.zms { padding: 16px 20px; max-width: 1100px; } .zms-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    .zms-card h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; margin: 0 0 10px; }
    .zms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px 14px; margin: 10px 0; }
    .zms-grid label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #5d6670; }
    .zms input, .zms select, .zms textarea { padding: 6px 8px; border: 1px solid #cfd5dc; border-radius: 6px; font: inherit; font-size: 13px; }
    .zms-ev { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 6px 0 10px; font-size: 13px; } .zms-ev label { display: flex; gap: 6px; align-items: center; }
    .zms-act { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .zms-btn { border: 1px solid #cfd5dc; background: #fff; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
    .zms-btn.primary { background: #5b4fe0; border-color: #5b4fe0; color: #fff; } .zms-muted { color: #5d6670; font-size: 12.5px; }
    .zms-msg { padding: 8px 12px; border-radius: 8px; background: #e3f4ea; color: #1d6b37; margin-bottom: 10px; } .zms-msg.err { background: #fde8e6; color: #9b2c24; }
    table.zms-t { width: 100%; border-collapse: collapse; font-size: 12.5px; } .zms-t td, .zms-t th { padding: 5px 6px; border-bottom: 1px solid #eef0f2; text-align: left; }
    .zms-ok { color: #1d6b37; } .zms-bad { color: #9b2c24; }`],
  template: `
<div class="zms">
  <h2 style="margin:0 0 4px">WhatsApp, SMS and push</h2>
  <p class="zms-muted">Optional. Approvals waiting, decisions, payslips and HR answers can also reach employees by WhatsApp or SMS through your own provider account, and push notifications can use your own Firebase project. Nothing is sent until you switch it on.</p>
  <p class="zms-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>

  <section class="zms-card" *ngIf="m">
    <h3><mat-icon>chat</mat-icon>WhatsApp / SMS</h3>
    <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" [(ngModel)]="m.enabled" data-msg-on> Send messages by WhatsApp / SMS</label>
    <div class="zms-grid">
      <label>Provider<select [(ngModel)]="m.provider" data-provider><option *ngFor="let p of m.providers" [value]="p.value">{{ p.label }}</option></select></label>
      <label>Channel<select [(ngModel)]="m.channel"><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option></select></label>
      <label *ngIf="m.provider !== 'http'">{{ m.provider === 'twilio' ? 'Account SID' : 'Phone number ID' }}<input [(ngModel)]="m.account_id" autocomplete="off"></label>
      <label *ngIf="m.provider === 'http'">Gateway URL (POST JSON: to, text, channel, sender)<input [(ngModel)]="m.url" placeholder="https://sms.provider.com/send" data-url></label>
      <label>{{ m.provider === 'whatsapp_cloud' ? 'Business number (shown only)' : 'From (number or sender name)' }}<input [(ngModel)]="m.sender" placeholder="+9714…"></label>
      <label>{{ m.provider === 'twilio' ? 'Auth token' : m.provider === 'whatsapp_cloud' ? 'Access token' : 'API key (Bearer)' }}{{ m.has_secret ? ' – saved ••••' + m.secret_last4 : '' }}
        <input type="password" [(ngModel)]="secret" autocomplete="new-password" [placeholder]="m.has_secret ? 'leave empty to keep' : ''" data-secret></label>
      <label *ngIf="m.provider === 'whatsapp_cloud'">Template name (approved by Meta)<input [(ngModel)]="m.template" placeholder="empty = plain text"></label>
      <label *ngIf="m.provider === 'whatsapp_cloud'">Template language<input [(ngModel)]="m.template_lang" placeholder="en / ar"></label>
      <label>Country code for local numbers<input [(ngModel)]="m.country_code" placeholder="971"></label>
    </div>
    <div class="zms-muted">Send for:</div>
    <div class="zms-ev"><label *ngFor="let e of m.all_events"><input type="checkbox" [checked]="m.events.includes(e.value)" (change)="toggle(m.events, e.value)"> {{ e.label }}</label></div>
    <div class="zms-act"><button type="button" class="zms-btn primary" (click)="saveMsg()" [disabled]="busy" data-msg-save>Save</button>
      <input [(ngModel)]="testTo" placeholder="Mobile number for a test" aria-label="Test number" style="width:200px">
      <button type="button" class="zms-btn" (click)="testMsg()" [disabled]="busy || !testTo">Send a test</button>
      <span class="zms-muted" *ngIf="m.last_test_at">{{ 'Last test {0}: {1}' | t:[(m.last_test_at | zdate:'datetime'), m.last_test_result] }}</span></div>
    <p class="zms-muted">The employee's first mobile number is used. Business-initiated WhatsApp messages need an approved template with one body parameter (Cloud API) or an approved sender (Twilio).</p>
    <details *ngIf="log.length"><summary class="zms-muted">Last messages ({{ log.length }})</summary>
      <table class="zms-t"><tr><th>When</th><th>To</th><th>Kind</th><th>Text</th><th>Result</th></tr>
        <tr *ngFor="let l of log"><td>{{ l.at | date:'d MMM, HH:mm' }}</td><td>{{ l.to }}</td><td>{{ l.kind }}</td><td>{{ l.text }}</td>
          <td [class.zms-ok]="l.status === 'sent'" [class.zms-bad]="l.status === 'failed'">{{ l.status }} {{ l.result }}</td></tr></table></details>
  </section>

  <section class="zms-card" *ngIf="p">
    <h3><mat-icon>notifications_active</mat-icon>Mobile push (ZEO app)</h3>
    <p class="zms-muted">{{ p.configured ? (p.own_project ? ('Your Firebase project {0} sends the notifications.' | t:[p.project_id]) : ("The server's Firebase project sends the notifications." | t)) : ('Push is not set up: add your Firebase service-account file, or ask the server administrator to set ZEO_FCM_CREDENTIALS.' | t) }}
      {{ '{0} phone(s) signed in, {1} with notifications allowed.' | t:[p.devices, p.devices_with_token] }}</p>
    <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" [(ngModel)]="p.enabled"> Send push notifications</label>
    <div class="zms-ev"><label *ngFor="let e of p.all_events"><input type="checkbox" [checked]="!p.events.length || p.events.includes(e.value)" (change)="togglePush(e.value)"> {{ e.label }}</label></div>
    <div class="zms-grid"><label style="grid-column:1/-1">Firebase service-account file (Project settings → Service accounts → Generate new private key){{ p.own_project ? ' – saved for ' + p.client_email : '' }}
      <input type="file" accept="application/json,.json" (change)="pickKey($event)" data-push-key></label></div>
    <div class="zms-act"><button type="button" class="zms-btn primary" (click)="savePush()" [disabled]="busy" data-push-save>Save</button>
      <button type="button" class="zms-btn" *ngIf="p.own_project" (click)="clearKey()">Remove our project</button>
      <button type="button" class="zms-btn" (click)="testPush()" [disabled]="busy">Send a test to my phone</button>
      <span class="zms-muted" *ngIf="p.last_test_at">{{ 'Last test {0}: {1}' | t:[(p.last_test_at | zdate:'datetime'), p.last_test_result] }}</span></div>
    <details *ngIf="p.recent?.length"><summary class="zms-muted">Last notifications</summary>
      <table class="zms-t"><tr><th>When</th><th>Kind</th><th>Title</th><th>Phones</th><th>Result</th></tr>
        <tr *ngFor="let r of p.recent"><td>{{ r.at | date:'d MMM, HH:mm' }}</td><td>{{ r.kind }}</td><td>{{ r.title }}</td><td>{{ r.sent }}/{{ r.devices }}</td><td>{{ r.result }}</td></tr></table></details>
  </section>
</div>`,
})
export class ZMessagingSettingsComponent implements OnInit {
  m: any = null; p: any = null; log: any[] = []; secret = ''; testTo = ''; keyJson = ''; msg = ''; err = false; busy = false;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(p: string): string { return `${this.rec.api}/chatter/api/${p}?schema=${localStorage.getItem('selectedSchema') || ''}`; }
  async ngOnInit(): Promise<void> {
    try { this.m = await firstValueFrom(this.http.get<any>(this.url('messaging/'))); } catch (e) { this.say(httpErrorText(e), true); }
    try { this.p = await firstValueFrom(this.http.get<any>(this.url('push-settings/'))); } catch { this.p = null; }
    try { this.log = await firstValueFrom(this.http.get<any[]>(this.url('messaging/log/'))); } catch { this.log = []; }
    this.cd.markForCheck();
  }
  toggle(list: string[], v: string): void { const i = list.indexOf(v); if (i >= 0) { list.splice(i, 1); } else { list.push(v); } }
  togglePush(v: string): void { if (!this.p.events.length) { this.p.events = this.p.all_events.map((e: any) => e.value); } this.toggle(this.p.events, v); }
  async saveMsg(): Promise<void> {
    this.busy = true;
    try { this.m = await firstValueFrom(this.http.put<any>(this.url('messaging/'), { ...this.m, secret: this.secret || undefined })); this.secret = ''; this.say('Saved.'); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async testMsg(): Promise<void> {
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.post<any>(this.url('messaging/test/'), { to: this.testTo })); this.say(`Test to ${r.to}: ${r.status} ${r.result}`, r.status !== 'sent');
      this.m = await firstValueFrom(this.http.get<any>(this.url('messaging/'))); this.log = await firstValueFrom(this.http.get<any[]>(this.url('messaging/log/'))); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  pickKey(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) { return; }
    const rd = new FileReader(); rd.onload = () => { this.keyJson = String(rd.result || ''); }; rd.readAsText(f);
  }
  async savePush(): Promise<void> {
    this.busy = true;
    try { this.p = await firstValueFrom(this.http.put<any>(this.url('push-settings/'), { enabled: this.p.enabled, events: this.p.events, key_json: this.keyJson || undefined })); this.keyJson = ''; this.say('Saved.'); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async clearKey(): Promise<void> {
    if (!confirm('Remove your Firebase project? The server\'s project (if any) is used again.')) { return; }
    try { this.p = await firstValueFrom(this.http.put<any>(this.url('push-settings/'), { clear_key: true })); } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  async testPush(): Promise<void> {
    this.busy = true;
    try { const r: any = await firstValueFrom(this.http.post<any>(this.url('push-settings/test/'), {})); this.say(`Test push: ${r.result} (${r.sent} of ${r.devices} phones).`, !r.sent);
      this.p = await firstValueFrom(this.http.get<any>(this.url('push-settings/'))); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}
