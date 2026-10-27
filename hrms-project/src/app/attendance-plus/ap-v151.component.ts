/** v1.51.0 – Kiosk PINs: HR gives a kiosk PIN to staff without a ZEO login (for punching and the self-service kiosk) and
 *  unlocks a PIN after 5 wrong tries.  API: /attendance-plus/api/kiosk-pins/ */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ApApi } from './ap-api';

@Component({
  selector: 'app-ap-kiosk-pins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./attendance-plus.css'],
  template: `
<div class="ap-wrap">
  <div class="ap-head"><div><h1>Kiosk PINs</h1>
    <p class="ap-desc">Employees punch at a kiosk and open their payslips and leave there with their employee code (or Emirates ID) and a PIN. Employees with a ZEO login set it in My attendance; give one here to staff without a login. A PIN is locked for 15 minutes after 5 wrong tries – unlock it here.</p></div></div>
  <p class="ap-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="ap-card">
    <div class="ap-tools"><input class="ap-input" [(ngModel)]="q" (keyup.enter)="load()" placeholder="Code or name" aria-label="Search"><button type="button" class="ap-btn" (click)="load()">Search</button></div>
    <div class="ap-scroll"><table class="ap-table">
      <tr><th>Employee</th><th>ZEO login</th><th>PIN</th><th>New PIN (4–8 digits)</th><th></th></tr>
      <tr *ngFor="let r of rows" [attr.data-pin-emp]="r.code"><td>{{ r.name }} <span class="ap-muted">{{ r.code }}</span></td><td>{{ r.has_login ? 'yes' : 'no' }}</td>
        <td>{{ r.locked ? 'locked' : (r.has_pin ? 'set' : '–') }} <button type="button" class="ap-btn small" *ngIf="r.locked" (click)="unlock(r)">Unlock</button></td>
        <td><input class="ap-input" type="password" inputmode="numeric" maxlength="8" [(ngModel)]="r.pin" autocomplete="new-password" style="width:120px" [attr.aria-label]="'PIN ' + r.code"></td>
        <td><button type="button" class="ap-btn small" (click)="save(r)" [disabled]="!r.pin">Save</button></td></tr>
    </table></div>
  </div>
</div>`,
})
export class ApKioskPinsComponent implements OnInit {
  api: ApApi; rows: any[] = []; q = ''; msg = ''; err = false;
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new ApApi(http, rec); }
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> { try { this.rows = await this.api.get('kiosk-pins/', { q: this.q }); } catch (e) { this.say(ApApi.err(e), true); } this.cd.markForCheck(); }
  async save(r: any): Promise<void> {
    try { const x: any = await this.api.post('kiosk-pins/', { employee: r.id, pin: r.pin }); this.say(`${r.name}: ${x.detail}`); r.pin = ''; r.has_pin = true; r.locked = false; }
    catch (e) { this.say(ApApi.err(e), true); }
    this.cd.markForCheck();
  }
  async unlock(r: any): Promise<void> {
    try { await this.api.post('kiosk-pins/', { employee: r.id, unlock: true }); r.locked = false; this.say(`${r.name}: PIN unlocked.`); } catch (e) { this.say(ApApi.err(e), true); }
    this.cd.markForCheck();
  }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}
