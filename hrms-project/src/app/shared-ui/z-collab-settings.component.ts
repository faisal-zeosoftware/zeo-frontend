// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';

const COLOURS = ['grey', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

/** v1.45.0 Settings › Messages and tags: the mailbox that receives e-mail replies to the messages sent from records,
 *  and the company's colour tags (rename, colour, delete). */
@Component({
  selector: 'z-collab-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zt zcs">
    <header class="zt-h"><div><h2>Messages and tags</h2>
      <p class="zr-muted">Messages sent from a record go to its followers by e-mail with the company e-mail settings. With a reply mailbox, their e-mail replies come back onto the record.</p></div></header>

    <section class="zcs-card" *ngIf="ms">
      <h3><mat-icon>move_to_inbox</mat-icon>Reply mailbox</h3>
      <label class="zi-chk"><input type="checkbox" [(ngModel)]="ms.enabled"> Put e-mail replies back on the records</label>
      <div class="zcs-grid">
        <label>Reply address (Reply-To of the messages)<input class="zr-in" [(ngModel)]="ms.reply_to" placeholder="zeo-replies@company.ae"></label>
        <label>IMAP server<input class="zr-in" [(ngModel)]="ms.imap_host" placeholder="imap.company.ae"></label>
        <label>Port<input class="zr-in" type="number" [(ngModel)]="ms.imap_port"></label>
        <label class="zi-chk"><input type="checkbox" [(ngModel)]="ms.imap_ssl"> SSL</label>
        <label>User<input class="zr-in" [(ngModel)]="ms.imap_user" autocomplete="off"></label>
        <label>Password<input class="zr-in" type="password" [(ngModel)]="pw" [placeholder]="ms.password_set ? 'Saved – type to change' : ''" autocomplete="new-password"></label>
        <label>Folder<input class="zr-in" [(ngModel)]="ms.folder"></label>
      </div>
      <p class="zr-muted">Checked every 5 minutes. Last check: {{ ms.last_check ? (ms.last_check | date:'dd/MM/yyyy HH:mm') : 'never' }}{{ ms.replies_received ? ' · ' + ms.replies_received + ' replies received' : '' }}
        <span class="zr-err-t" *ngIf="ms.last_error"> · {{ ms.last_error }}</span></p>
      <p class="zr-muted">The password is kept encrypted. Links in the e-mails use the ZEO_APP_URL of the server (.env).</p>
      <div class="zr-row"><span class="zr-grow"></span>
        <button type="button" class="zr-btn" [disabled]="busy || !ms.enabled" (click)="check()">Check now</button>
        <button type="button" class="zr-btn primary" [disabled]="busy" (click)="save()">Save</button></div>
      <p class="zr-ok-t" *ngIf="ok">{{ ok }}</p>
    </section>
    <p class="zr-muted" *ngIf="!ms && !error">Only administrators set the reply mailbox.</p>

    <section class="zcs-card">
      <h3><mat-icon>sell</mat-icon>Tags</h3>
      <p class="zr-muted">Tags are put on records from the record footer or on many rows with the list's Action menu; they are a column of the lists (filter and group by).</p>
      <div class="zr-row"><input class="zr-in" [(ngModel)]="newTag" placeholder="New tag" (keydown.enter)="addTag()"><button type="button" class="zr-btn" (click)="addTag()" [disabled]="!newTag.trim()">Add</button></div>
      <table class="hs-table zcs-tags" zPlain>
        <tr><th>Tag</th><th>Colour</th><th>Records</th><th></th></tr>
        <tr *ngFor="let t of tags">
          <td><input class="zr-in" [value]="t.name" (change)="rename(t, $any($event.target).value)"></td>
          <td><span class="zcs-col"><button type="button" *ngFor="let c of colours" [class]="'zcs-sw c-' + c" [class.on]="t.color === c" (click)="recolour(t, c)" [attr.aria-label]="c"></button></span></td>
          <td>{{ t.count }}</td>
          <td><button type="button" class="zr-ic" (click)="remove(t)" aria-label="Delete tag"><mat-icon>delete_outline</mat-icon></button></td>
        </tr>
      </table>
      <p class="zr-muted" *ngIf="!tags.length">No tags yet.</p>
    </section>
    <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
  </div>`,
})
export class ZCollabSettingsComponent implements OnInit {
  ms: any = null; pw = ''; busy = false; ok = ''; error = '';
  tags: any[] = []; newTag = ''; colours = COLOURS;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(p: string): string { return `${this.rec.api}/chatter/api/${p}?schema=${localStorage.getItem('selectedSchema') || ''}`; }
  async ngOnInit(): Promise<void> {
    try { this.ms = await firstValueFrom(this.http.get<any>(this.url('mail-settings/'))); } catch { this.ms = null; }
    await this.loadTags();
  }
  async loadTags(): Promise<void> { try { this.tags = await firstValueFrom(this.rec.tags()); } catch { this.tags = []; } this.cd.detectChanges(); }
  async save(): Promise<void> {
    this.busy = true; this.ok = ''; this.error = '';
    try { this.ms = await firstValueFrom(this.http.put<any>(this.url('mail-settings/'), { ...this.ms, imap_password: this.pw || undefined })); this.pw = ''; this.ok = 'Saved.'; }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async check(): Promise<void> {
    this.busy = true; this.ok = ''; this.error = '';
    try { const r = await firstValueFrom(this.http.post<any>(this.url('mail-settings/check/'), {})); this.ms = { ...this.ms, ...r }; this.ok = r.last_error ? '' : `Mailbox read: ${r.received === 'off' ? 0 : r.received} new replies.`; }
    catch (e: any) { this.error = e?.error?.detail || 'The mailbox could not be read.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async addTag(): Promise<void> {
    if (!this.newTag.trim()) { return; }
    try { await firstValueFrom(this.rec.addTagDef(this.newTag.trim())); this.newTag = ''; } catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
    await this.loadTags();
  }
  async rename(t: any, name: string): Promise<void> { try { await firstValueFrom(this.rec.saveTagDef(t.id, { name })); } catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; } await this.loadTags(); }
  async recolour(t: any, color: string): Promise<void> { try { await firstValueFrom(this.rec.saveTagDef(t.id, { color })); } catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; } await this.loadTags(); }
  async remove(t: any): Promise<void> {
    if (!confirm(`Delete the tag "${t.name}"? It comes off ${t.count} records.`)) { return; }
    try { await firstValueFrom(this.rec.deleteTagDef(t.id)); } catch (e: any) { this.error = e?.error?.detail || 'Not deleted.'; }
    await this.loadTags();
  }
}
