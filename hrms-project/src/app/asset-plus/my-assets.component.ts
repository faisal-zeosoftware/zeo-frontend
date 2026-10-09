import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AssetApiService, EVENT_ICON, STATUS_CLASS, STATUS_LABEL, money, today } from './asset-api.service';

type Dlg = '' | 'ack' | 'damage' | 'loss' | 'return' | 'transfer' | 'history';

/** Self-service (v1.12.0): my assets, confirm receipt, report damage / loss, ask for a return or hand to a colleague, history and deductions. */
@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">My assets</h1>
        <p class="ex-desc">Company assets in your care. Confirm what you received, tell HR about damage or loss straight away, and ask for a return or a hand-over to a colleague.</p></div></div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <ng-container *ngIf="d">
        <div class="ap-note" *ngIf="d.pending_ack">Please confirm that you received {{ d.pending_ack }} asset(s).</div>
        <div class="ap-cards">
          <div class="ap-card" *ngFor="let a of d.assets">
            <div class="t">{{ a.name }} <span class="ap-code">{{ a.code }}</span></div>
            <div class="s">{{ a.type }} · SN {{ a.serial_number }}<span *ngIf="a.model"> · {{ a.model }}</span></div>
            <div class="s">Since {{ a.assigned_date | date:'dd MMM yyyy' }}<span *ngIf="a.expected_return_date"> · back by {{ a.expected_return_date | date:'dd MMM yyyy' }}</span>
              <span *ngIf="a.custodian_of"> · custodian at {{ a.custodian_of }}</span></div>
            <div class="s" *ngIf="a.accessories">With: {{ a.accessories }}</div>
            <div style="margin-top:6px"><span class="ex-tag" [ngClass]="cls(a.ack_status)">{{ a.ack_status === 'pending' ? 'Receipt not confirmed' : lbl(a.ack_status) }}</span>
              <span class="ex-flag warn" *ngIf="a.return_requested">Return requested</span><span class="ex-flag warn" *ngIf="a.transfer_pending">Transfer waiting</span></div>
            <div class="acts">
              <button type="button" class="ex-btn sm primary" *ngIf="a.ack_status === 'pending'" (click)="openDlg('ack', a)">Confirm receipt</button>
              <button type="button" class="ex-btn sm" *ngIf="a.allocation_id && !a.return_requested" (click)="openDlg('return', a)">Return</button>
              <button type="button" class="ex-btn sm" *ngIf="a.allocation_id && !a.transfer_pending" (click)="openDlg('transfer', a)">Hand to a colleague</button>
              <button type="button" class="ex-btn sm" *ngIf="a.allocation_id" (click)="openDlg('damage', a)">Report damage</button>
              <button type="button" class="ex-btn sm danger" *ngIf="a.allocation_id" (click)="openDlg('loss', a)">Lost / stolen</button>
              <button type="button" class="ex-btn sm" (click)="openDlg('history', a)">History</button>
            </div>
          </div>
        </div>
        <p class="ex-muted" *ngIf="!d.assets.length">You have no company assets.</p>

        <div class="ex-grid2" style="margin-top:18px">
          <div class="ex-panel"><div class="ex-h">My requests</div>
            <div class="ex-rows">
              <div class="ex-row" *ngFor="let t of reqs"><div class="main"><div class="t">{{ t.number }} · {{ t.asset }}</div><div class="s">{{ t.what }}</div></div>
                <div class="r"><span class="ex-tag" [ngClass]="cls(t.status)">{{ t.status_label }}</span>
                  <div *ngIf="t.cancel"><button type="button" class="ex-link" (click)="cancel(t)">Cancel</button></div></div></div>
              <p class="ex-muted" *ngIf="!reqs.length">No requests.</p></div></div>
          <div class="ex-panel"><div class="ex-h">Salary deductions for assets</div>
            <div class="ex-rows">
              <div class="ex-row" *ngFor="let r of d.recoveries"><div class="main"><div class="t">{{ r.month | date:'MMM yyyy' }}</div></div>
                <div class="r"><div class="money">{{ m(r.amount) }}</div><span class="ex-tag" [ngClass]="cls(r.status)">{{ r.status_label }}</span></div></div>
              <p class="ex-muted" *ngIf="!d.recoveries.length">None.</p></div>
            <div class="ex-h" style="margin-top:14px">Returned before</div>
            <div class="ex-rows"><div class="ex-row" *ngFor="let p of d.past"><div class="main"><div class="t">{{ p.name }}</div>
              <div class="s">{{ p.assigned_date | date:'dd MMM yyyy' }} → {{ p.returned_date | date:'dd MMM yyyy' }}</div></div></div>
              <p class="ex-muted" *ngIf="!d.past.length">None.</p></div></div>
        </div>
      </ng-container>
    </div>
  </div>
</div>

<div class="ex-back" *ngIf="dlg" (click)="dlg = ''">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
    <header><h2>{{ titles[dlg] }} – {{ cur?.name }}</h2><button type="button" (click)="dlg = ''" aria-label="Close">×</button></header>
    <div class="body">
      <p class="ex-msg err" *ngIf="err">{{ err }}</p>
      <div class="ex-form" *ngIf="dlg === 'ack'">
        <label class="ck wide"><input type="checkbox" [(ngModel)]="x.ok" name="ok"> I received it in good condition with: {{ cur?.accessories || 'no accessories listed' }}</label>
        <label class="wide" *ngIf="!x.ok">What is different? *<textarea [(ngModel)]="x.notes" name="n" placeholder="e.g. scratch on the lid, charger missing"></textarea></label>
      </div>
      <div class="ex-form" *ngIf="dlg === 'return'">
        <label>When can you hand it in?<input type="date" [(ngModel)]="x.preferred_date" name="pd" [min]="todayStr"></label>
        <label class="wide">Note<textarea [(ngModel)]="x.note" name="n" placeholder="Why are you returning it?"></textarea></label>
        <p class="wide ex-muted">HR checks the asset and accessories when you hand it in.</p>
      </div>
      <div class="ex-form" *ngIf="dlg === 'transfer'">
        <label class="wide">Colleague *<select [(ngModel)]="x.to_employee_id" name="e"><option [ngValue]="null">Choose…</option>
          <option *ngFor="let e of colleagues" [ngValue]="e.id">{{ e.name }}</option></select></label>
        <label>Date<input type="date" [(ngModel)]="x.transfer_date" name="d" [min]="todayStr"></label>
        <label class="wide">Reason *<textarea [(ngModel)]="x.reason" name="r"></textarea></label>
        <p class="wide ex-muted">HR approves the hand-over; until then the asset stays with you.</p>
      </div>
      <div class="ex-form" *ngIf="dlg === 'damage'">
        <label>When<input type="date" [(ngModel)]="x.damage_date" name="d" [max]="todayStr"></label>
        <label>How bad<select [(ngModel)]="x.severity" name="s"><option value="minor">Minor – still works</option><option value="major">Major – hardly works</option>
          <option value="total">Beyond repair</option></select></label>
        <label class="wide">What happened *<textarea [(ngModel)]="x.description" name="ds"></textarea></label>
        <label class="wide">Photos<input type="file" accept="image/*" multiple (change)="photos = pickMany($event)" aria-label="Photos"></label>
      </div>
      <div class="ex-form" *ngIf="dlg === 'loss'">
        <label>Lost or stolen<select [(ngModel)]="x.kind" name="k"><option value="lost">Lost</option><option value="stolen">Stolen</option></select></label>
        <label>When<input type="date" [(ngModel)]="x.loss_date" name="d" [max]="todayStr"></label>
        <label class="wide">Where<input [(ngModel)]="x.place" name="p"></label>
        <label>Police report no.<input [(ngModel)]="x.police_report_no" name="pr" placeholder="If you reported it to the police"></label>
        <label>Police report<input type="file" accept="image/*,application/pdf" (change)="police = pickOne($event)" aria-label="Police report"></label>
        <label class="wide">What happened *<textarea [(ngModel)]="x.description" name="ds"></textarea></label>
      </div>
      <div *ngIf="dlg === 'history'">
        <div class="ap-ev" *ngFor="let e of hist"><mat-icon>{{ icon(e.event) }}</mat-icon>
          <div class="txt">{{ e.summary }}<div class="meta">{{ e.at | date:'dd MMM yyyy, HH:mm' }} · {{ e.user }}</div></div></div>
        <p class="ex-muted" *ngIf="!hist.length">No history.</p>
      </div>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="dlg = ''">{{ dlg === 'history' ? 'Close' : 'Cancel' }}</button>
      <button type="button" class="ex-btn primary" *ngIf="dlg !== 'history'" [disabled]="busy" (click)="submit()">{{ okText[dlg] }}</button>
    </footer>
  </div>
</div>`,
})
export class MyAssetsComponent implements OnInit {
  d: any = null;
  reqs: any[] = [];
  colleagues: any[] = [];
  hist: any[] = [];
  dlg: Dlg = '';
  cur: any = null;
  x: any = {};
  photos: File[] = [];
  police: File | null = null;
  loading = true; busy = false;
  msg = ''; msgErr = false; err = '';
  todayStr = today();
  titles: Record<string, string> = { ack: 'Confirm receipt', return: 'Return', transfer: 'Hand to a colleague', damage: 'Report damage', loss: 'Report lost / stolen', history: 'History' };
  okText: Record<string, string> = { ack: 'Confirm', return: 'Ask to return', transfer: 'Send for approval', damage: 'Report', loss: 'Report' };

  constructor(private api: AssetApiService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    try {
      this.d = await this.api.get('my/');
      this.reqs = [
        ...this.d.returns.map((r: any) => ({ ...r, what: `Return${r.preferred_date ? ' on ' + r.preferred_date : ''}`, cancel: r.status === 'requested', path: 'returns' })),
        ...this.d.transfers.map((t: any) => ({ ...t, what: `${t.from} → ${t.to}`, cancel: t.status === 'pending', path: 'transfers' })),
        ...this.d.damages.map((x: any) => ({ ...x, what: `Damage: ${x.description}${+x.recovery_amount ? ' · recover ' + money(x.recovery_amount) : ''}` })),
        ...this.d.losses.map((x: any) => ({ ...x, what: `${x.kind_label}: ${x.description}` })),
      ];
    } catch (e: any) {
      this.msg = AssetApiService.error(e, 'Your assets could not be loaded.');
      this.msgErr = true;
    }
    this.loading = false;
    this.cd.markForCheck();
  }

  async openDlg(k: Dlg, a: any): Promise<void> {
    this.cur = a; this.err = ''; this.photos = []; this.police = null;
    const d = today();
    this.x = ({ ack: { ok: true, notes: '' }, return: { preferred_date: d, note: '' }, transfer: { to_employee_id: null, transfer_date: d, reason: '' },
      damage: { damage_date: d, severity: 'minor', description: '' }, loss: { kind: 'lost', loss_date: d, place: '', police_report_no: '', description: '' } } as any)[k] || {};
    this.dlg = k;
    if (k === 'transfer' && !this.colleagues.length) {
      try { this.colleagues = (await this.api.lookups()).employees || []; } catch { /* */ }
    }
    if (k === 'history') {
      try { this.hist = await this.api.get(`assets/${a.asset_id}/history/`); } catch { this.hist = []; }
    }
    this.cd.markForCheck();
  }

  async submit(): Promise<void> {
    this.err = '';
    const a = this.cur;
    this.busy = true;
    try {
      let ok = 'Sent.';
      if (this.dlg === 'ack') {
        if (!this.x.ok && !this.x.notes) { this.err = 'Describe what is different, or tick the box.'; this.busy = false; return; }
        await this.api.post(`allocations/${a.allocation_id}/acknowledge/`, { accept: true, notes: this.x.ok ? '' : this.x.notes });
        ok = 'Thank you – receipt confirmed.';
      } else if (this.dlg === 'return') {
        await this.api.post('returns/', { asset: a.asset_id, ...this.x }); ok = 'Return requested. HR will contact you.';
      } else if (this.dlg === 'transfer') {
        await this.api.post(`assets/${a.asset_id}/transfer/`, { to_type: 'employee', ...this.x }); ok = 'Hand-over sent to HR for approval.';
      } else if (this.dlg === 'damage') {
        await this.api.post(`assets/${a.asset_id}/damage/`, AssetApiService.form(this.x, { photos: this.photos })); ok = 'Damage reported to HR.';
      } else if (this.dlg === 'loss') {
        await this.api.post(`assets/${a.asset_id}/loss/`, AssetApiService.form(this.x, { police_report_file: this.police })); ok = 'Loss reported to HR.';
      }
      this.dlg = '';
      this.msg = ok; this.msgErr = false;
      await this.load();
    } catch (e: any) {
      this.err = AssetApiService.error(e, 'It could not be sent.');
    }
    this.busy = false;
    this.cd.markForCheck();
  }

  async cancel(t: any): Promise<void> {
    if (!confirm(`Cancel ${t.number}?`)) return;
    try { await this.api.post(`${t.path}/${t.id}/cancel/`, {}); this.msg = 'Cancelled.'; this.msgErr = false; await this.load(); }
    catch (e: any) { this.msg = AssetApiService.error(e); this.msgErr = true; this.cd.markForCheck(); }
  }

  pickMany(ev: Event): File[] { return Array.from((ev.target as HTMLInputElement).files || []); }
  pickOne(ev: Event): File | null { return (ev.target as HTMLInputElement).files?.[0] || null; }
  m(v: any): string { return money(v); }
  lbl(s: string): string { return STATUS_LABEL[s] || s; }
  cls(s: string): string { return STATUS_CLASS[s] || ''; }
  icon(e: string): string { return EVENT_ICON[e] || 'history'; }
}
