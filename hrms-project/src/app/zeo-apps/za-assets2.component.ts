import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ZaCameraComponent } from './za-assets.component';
import { ZaApiService, ZaClient, base, day, stClass, when } from './za-api.service';

/** v1.34.0 – Asset Management release 2 screens: maintenance calendar, field (mobile) screen with offline queue,
 *  Excel import and the helpdesk mailbox. */
const APP = 'zeo-assets';

/** Maintenance calendar: work orders by planned date and the coming plan dates, one month at a time. */
@Component({
  selector: 'app-za-maint-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head">
    <div><h1 class="page-title">Maintenance calendar</h1><p class="ex-desc">Work orders by planned date and the coming preventive plan dates.</p></div>
    <div class="ex-actions">
      <button type="button" class="ex-btn" (click)="move(-1)" aria-label="Previous month">‹</button>
      <b style="min-width:150px;text-align:center;align-self:center">{{ title }}</b>
      <button type="button" class="ex-btn" (click)="move(1)" aria-label="Next month">›</button>
      <button type="button" class="ex-btn" (click)="go(0)">Today</button>
    </div>
  </div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
    <div class="zas-legend"><span class="hs-b work">Work order</span><span class="hs-b wait">Planned (plan)</span><span class="hs-b bad">Late</span><span class="hs-b ok">Done / closed</span></div>
    <div class="zas-cal">
      <div class="h" *ngFor="let w of weekdays">{{ w }}</div>
      <div class="d" *ngFor="let c of cells" [class.out]="!c.inMonth" [class.today]="c.today">
        <div class="n">{{ c.n }}</div>
        <button type="button" class="it" *ngFor="let i of c.items.slice(0, 4)" [ngClass]="cls(i)" (click)="open(i)" [title]="i.title + ' – ' + i.asset + (i.who ? ' – ' + i.who : '')">{{ i.title }}</button>
        <span class="more" *ngIf="c.items.length > 4">+{{ c.items.length - 4 }} more</span>
      </div>
    </div>
  </div>
</div></div>`,
})
export class ZaMaintCalendarComponent implements OnInit {
  api!: ZaClient;
  month = new Date();
  cells: any[] = [];
  title = '';
  msg = '';
  weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  constructor(private za: ZaApiService, private router: Router) {}
  ngOnInit(): void { this.api = this.za.for(APP); this.go(0); }
  move(n: number): void { this.month = new Date(this.month.getFullYear(), this.month.getMonth() + n, 1); this.load(); }
  go(_: number): void { const t = new Date(); this.month = new Date(t.getFullYear(), t.getMonth(), 1); this.load(); }
  iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  async load(): Promise<void> {
    const first = new Date(this.month.getFullYear(), this.month.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const end = new Date(start); end.setDate(start.getDate() + 41);
    this.title = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    this.msg = '';
    let items: any[] = [];
    try { items = (await this.api.get('calendar/', { from: this.iso(start), to: this.iso(end) })).items; } catch (e) { this.msg = ZaApiService.error(e); }
    const todayIso = this.iso(new Date());
    this.cells = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = this.iso(d);
      return { n: d.getDate(), inMonth: d.getMonth() === first.getMonth(), today: k === todayIso, items: items.filter(x => x.date === k) };
    });
  }
  cls(i: any): string { return i.late ? 'bad' : i.kind === 'plan' ? 'wait' : ['done', 'closed'].includes(i.status) ? 'ok' : 'work'; }
  open(i: any): void { this.router.navigate([base(APP), 'r', i.kind === 'plan' ? 'plan' : 'work_order', i.id]); }
}

/** Field screen for phones: scan, my jobs, raise a ticket with photo and GPS, counts, quick register.
 *  Without a connection, tickets, quick registrations and GPS positions wait in this browser and are sent when online. */
interface Pending { id: string; kind: 'ticket' | 'asset'; data: any; photo?: string; photoName?: string; at: string; }
const QKEY = 'zeo-assets-field-queue';

@Component({
  selector: 'app-za-field',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZaCameraComponent],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="zas-field">
  <div class="zas-fhead"><b>Asset Management</b><span class="hs-b" [ngClass]="online ? 'ok' : 'bad'">{{ online ? 'Online' : 'Offline' }}</span></div>
  <p class="hs-note info" *ngIf="queue.length">{{ queue.length }} item(s) waiting to be sent{{ online ? '' : ' – they go when you are online again' }}.
    <button type="button" class="hs-rlink" *ngIf="online" (click)="sync()">Send now</button></p>
  <p class="hs-note" [ngClass]="msgCls" *ngIf="msg">{{ msg }}</p>

  <ng-container *ngIf="view === 'home'">
    <div class="zas-tiles">
      <button type="button" (click)="go(['scan'])"><span class="i">⌗</span>Scan an asset</button>
      <button type="button" (click)="startTicket()"><span class="i">!</span>Raise a ticket</button>
      <button type="button" (click)="view = 'jobs'"><span class="i">⚙</span>My work orders <em>{{ d?.work_orders?.length || 0 }}</em></button>
      <button type="button" (click)="view = 'counts'"><span class="i">✓</span>My counts <em>{{ d?.counts?.length || 0 }}</em></button>
      <button type="button" (click)="startAsset()" *ngIf="d?.rights?.ast_coordinator || d?.rights?.admin"><span class="i">+</span>Register an asset</button>
      <button type="button" (click)="view = 'mine'"><span class="i">☰</span>Assets with me <em>{{ d?.my_assets?.length || 0 }}</em></button>
    </div>
    <div class="hs-card" *ngIf="d?.tickets?.length"><h3>My tickets</h3>
      <div class="za-row" *ngFor="let t of d.tickets" (click)="rec('ticket', t.id)"><span>{{ t.number }} {{ t.subject }}</span><span class="bd">{{ t.status_label }}</span></div></div>
  </ng-container>

  <ng-container *ngIf="view === 'jobs'">
    <button type="button" class="ex-btn sm" (click)="view = 'home'">‹ Back</button>
    <div class="hs-card zas-job" *ngFor="let w of d?.work_orders || []" (click)="rec('work_order', w.id)">
      <b>{{ w.number }} {{ w.title }}</b><div class="hs-muted">{{ w.asset }}</div>
      <div><span class="hs-b" [ngClass]="cls(w.status)">{{ w.status_label }}</span> <span class="hs-muted">{{ w.priority }} · {{ dd(w.date) }}</span></div></div>
    <p class="hs-empty" *ngIf="!d?.work_orders?.length">No open work orders.</p>
  </ng-container>

  <ng-container *ngIf="view === 'counts'">
    <button type="button" class="ex-btn sm" (click)="view = 'home'">‹ Back</button>
    <div class="hs-card zas-job" *ngFor="let a of d?.counts || []" (click)="go(['audit', a.id, 'count'])"><b>{{ a.number }} {{ a.name }}</b><div class="hs-muted">{{ a.found }} of {{ a.expected }} counted</div></div>
    <p class="hs-empty" *ngIf="!d?.counts?.length">No count waiting for you.</p>
  </ng-container>

  <ng-container *ngIf="view === 'mine'">
    <button type="button" class="ex-btn sm" (click)="view = 'home'">‹ Back</button>
    <div class="hs-card zas-job" *ngFor="let a of d?.my_assets || []" (click)="rec('asset', a.id)"><b>{{ a.code }} {{ a.name }}</b><div class="hs-muted" *ngIf="a.due_back">Due back {{ dd(a.due_back) }}</div></div>
    <p class="hs-empty" *ngIf="!d?.my_assets?.length">No assets with you.</p>
  </ng-container>

  <ng-container *ngIf="view === 'ticket'">
    <button type="button" class="ex-btn sm" (click)="view = 'home'">‹ Back</button>
    <div class="hs-card zas-form">
      <h3>Raise a ticket</h3>
      <label>Asset (scan or type the code)<span class="zas-row"><input [(ngModel)]="t.code" placeholder="e.g. IT-0003"><button type="button" class="ex-btn sm" (click)="camera = !camera">Scan</button></span></label>
      <za-camera *ngIf="camera" (scanned)="t.code = clean($event); camera = false" (closed)="camera = false"></za-camera>
      <label>What is wrong *<input [(ngModel)]="t.subject"></label>
      <label>Kind<select [(ngModel)]="t.kind"><option value="breakdown">Breakdown</option><option value="complaint">Complaint</option><option value="incident">Incident (damage, loss, safety)</option><option value="request">Service request</option></select></label>
      <label>Priority<select [(ngModel)]="t.priority"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <label>Details<textarea rows="3" [(ngModel)]="t.description"></textarea></label>
      <label>Photo or video<input type="file" accept="image/*,video/*" capture="environment" (change)="photo($any($event.target).files)"></label>
      <label class="ck"><input type="checkbox" [(ngModel)]="useGps" (change)="gps()"> Add my location{{ t.latitude ? ' (' + t.latitude.toFixed(4) + ', ' + t.longitude.toFixed(4) + ')' : '' }}</label>
      <button type="button" class="ex-btn primary" [disabled]="busy || !t.subject" (click)="sendTicket()">{{ online ? 'Send' : 'Save – send when online' }}</button>
    </div>
  </ng-container>

  <ng-container *ngIf="view === 'asset'">
    <button type="button" class="ex-btn sm" (click)="view = 'home'">‹ Back</button>
    <div class="hs-card zas-form">
      <h3>Register an asset</h3>
      <label>Name *<input [(ngModel)]="a.name"></label>
      <label>Category *<select [(ngModel)]="a.category"><option [ngValue]="null">Choose…</option><option *ngFor="let c of cats" [ngValue]="c.id">{{ c.label }}</option></select></label>
      <label>Serial number<span class="zas-row"><input [(ngModel)]="a.serial_number"><button type="button" class="ex-btn sm" (click)="camera = !camera">Scan</button></span></label>
      <za-camera *ngIf="camera" (scanned)="a.serial_number = $event; camera = false" (closed)="camera = false"></za-camera>
      <label>Location<select [(ngModel)]="a.location"><option [ngValue]="null">–</option><option *ngFor="let l of locs" [ngValue]="l.id">{{ l.label }}</option></select></label>
      <label>Purchase date *<input type="date" [(ngModel)]="a.purchase_date"></label>
      <label>Cost<input type="number" [(ngModel)]="a.purchase_cost"></label>
      <label>Photo<input type="file" accept="image/*" capture="environment" (change)="photo($any($event.target).files)"></label>
      <button type="button" class="ex-btn primary" [disabled]="busy || !a.name || !a.category || !a.purchase_date" (click)="sendAsset()">{{ online ? 'Register' : 'Save – send when online' }}</button>
    </div>
  </ng-container>
</div>`,
})
export class ZaFieldComponent implements OnInit, OnDestroy {
  api!: ZaClient;
  d: any = null;
  view: 'home' | 'jobs' | 'counts' | 'mine' | 'ticket' | 'asset' = 'home';
  online = navigator.onLine;
  queue: Pending[] = [];
  msg = '';
  msgCls = 'ok';
  busy = false;
  camera = false;
  useGps = false;
  t: any = {};
  a: any = {};
  cats: any[] = [];
  locs: any[] = [];
  pic: { data: string; name: string } | null = null;
  cls = stClass; dd = day;
  private on = () => { this.online = true; this.sync(); };
  private off = () => { this.online = false; };
  constructor(private za: ZaApiService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    window.addEventListener('online', this.on);
    window.addEventListener('offline', this.off);
    this.queue = this.loadQ();
    await this.refresh();
    if (this.online && this.queue.length) this.sync();
  }
  ngOnDestroy(): void { window.removeEventListener('online', this.on); window.removeEventListener('offline', this.off); }
  async refresh(): Promise<void> {
    try {
      this.d = await this.api.get('field/');
      try { localStorage.setItem('zeo-assets-field', JSON.stringify(this.d)); } catch { /* storage full or off */ }
    } catch (e) {
      try { this.d = JSON.parse(localStorage.getItem('zeo-assets-field') || 'null'); } catch { this.d = null; }
      if (!this.d) this.say(ZaApiService.error(e), 'err');
    }
  }
  say(m: string, c = 'ok'): void { this.msg = m; this.msgCls = c; }
  go(p: any[]): void { this.router.navigate([base(APP), ...p]); }
  rec(kind: string, id: number): void { this.router.navigate([base(APP), 'r', kind, id]); }
  clean(code: string): string { const m = /ASSET:([^|]+)/i.exec(code); return (m ? m[1] : code).trim(); }

  startTicket(): void { this.t = { kind: 'breakdown', priority: 'normal' }; this.pic = null; this.useGps = false; this.view = 'ticket'; this.msg = ''; }
  async startAsset(): Promise<void> {
    this.a = { purchase_date: new Date().toISOString().slice(0, 10), location: null, category: null }; this.pic = null; this.view = 'asset'; this.msg = '';
    try { [this.cats, this.locs] = await Promise.all([this.api.options('categories'), this.api.options('locations')]); } catch { /* offline: lists from cache */ }
  }
  gps(): void {
    if (!this.useGps) { delete this.t.latitude; delete this.t.longitude; return; }
    if (!navigator.geolocation) { this.say('This device cannot give its location.', 'err'); return; }
    navigator.geolocation.getCurrentPosition(p => { this.t.latitude = p.coords.latitude; this.t.longitude = p.coords.longitude; },
      () => { this.useGps = false; this.say('Location not allowed – the ticket is sent without it.', 'info'); }, { enableHighAccuracy: true, timeout: 15000 });
  }
  photo(files: FileList | null): void {
    const f = files?.[0];
    if (!f) { this.pic = null; return; }
    if (f.size > 8 * 1024 * 1024) { this.say('The file is larger than 8 MB.', 'err'); return; }
    const r = new FileReader();
    r.onload = () => { this.pic = { data: String(r.result), name: f.name }; };
    r.readAsDataURL(f);
  }

  async sendTicket(): Promise<void> {
    const data: any = { subject: this.t.subject, kind: this.t.kind, priority: this.t.priority, description: this.t.description || '', source: 'mobile', code: this.t.code || '' };
    if (this.t.latitude) { data.latitude = this.t.latitude; data.longitude = this.t.longitude; }
    await this.submit({ id: String(Date.now()), kind: 'ticket', data, photo: this.pic?.data, photoName: this.pic?.name, at: new Date().toISOString() });
  }
  async sendAsset(): Promise<void> {
    await this.submit({ id: String(Date.now()), kind: 'asset', data: { ...this.a }, photo: this.pic?.data, photoName: this.pic?.name, at: new Date().toISOString() });
  }
  async submit(p: Pending): Promise<void> {
    this.busy = true;
    if (!this.online) { this.queue.push(p); this.saveQ(); this.say('Saved on this device – it is sent when you are online.', 'info'); this.view = 'home'; this.busy = false; return; }
    try { const r = await this.post(p); this.say(r); this.view = 'home'; await this.refresh(); }
    catch (e: any) {
      if (e?.status === 0) { this.queue.push(p); this.saveQ(); this.say('No connection – saved on this device.', 'info'); this.view = 'home'; }
      else this.say(ZaApiService.error(e), 'err');
    }
    this.busy = false;
  }
  /** Send one item; a scanned code is turned into the asset first. */
  async post(p: Pending): Promise<string> {
    const data = { ...p.data };
    const files: File[] = [];
    if (p.photo) { const b = await (await fetch(p.photo)).blob(); files.push(new File([b], p.photoName || 'photo.jpg', { type: b.type })); }
    if (p.kind === 'ticket') {
      if (data.code) {
        try { const s: any = await this.api.get('scan/', { code: data.code }); data.card = s.summary.id; } catch { data.description = `Asset code: ${data.code}\n` + data.description; }
      }
      delete data.code;
      const r: any = await this.api.post('r/ticket/', ZaApiService.form(data, files));
      return `Ticket ${r.number} sent.`;
    }
    const r: any = await this.api.post('r/asset/', ZaApiService.form(data, files));
    return `Asset ${r.code} registered.`;
  }
  async sync(): Promise<void> {
    if (!this.queue.length) return;
    const left: Pending[] = [];
    let sent = 0;
    for (const p of this.queue) {
      try { await this.post(p); sent++; } catch (e: any) { left.push(p); if (e?.status && e.status !== 0) this.say(`One item could not be sent: ${ZaApiService.error(e)}`, 'err'); }
    }
    this.queue = left; this.saveQ();
    if (sent) { this.say(`${sent} saved item(s) sent.`); this.refresh(); }
  }
  loadQ(): Pending[] { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch { return []; } }
  saveQ(): void { try { localStorage.setItem(QKEY, JSON.stringify(this.queue)); } catch { this.say('This device has no room to keep the item.', 'err'); } }
}

/** Excel import of assets and spare parts (template, check, import) and the helpdesk mailbox. */
@Component({
  selector: 'app-za-asset-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div><h1 class="page-title">Import and mailbox</h1>
    <p class="ex-desc">Bulk upload of assets and spare parts from Excel, and the mailbox that turns e-mails into helpdesk tickets.</p></div></div></div>
  <div class="com_list mt-4">
    <div class="za-grid2">
      <div class="hs-card">
        <h3>Excel import</h3>
        <div class="hs-tabs2" style="margin-bottom:12px"><button type="button" [class.on]="kind === 'assets'" (click)="kind = 'assets'; res = null">Assets</button>
          <button type="button" [class.on]="kind === 'parts'" (click)="kind = 'parts'; res = null">Spare parts with opening stock</button></div>
        <p class="hs-muted">{{ kind === 'assets' ? 'Category and location by code; the HR asset is made for each line, like the New asset form.' : 'Parts by code (existing codes are updated); opening quantity goes into the store code with its unit cost.' }}</p>
        <div class="hs-acts"><button type="button" class="ex-btn" (click)="template()">Download template</button>
          <label class="ex-btn" style="cursor:pointer">{{ file ? file.name : 'Choose file…' }}<input type="file" accept=".xlsx" hidden (change)="file = $any($event.target).files[0]; res = null"></label></div>
        <div class="hs-acts" style="margin-top:10px"><button type="button" class="ex-btn" [disabled]="!file || busy" (click)="run(true)">Check</button>
          <button type="button" class="ex-btn primary" [disabled]="!file || busy" (click)="run(false)">Import</button></div>
        <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
        <ng-container *ngIf="res">
          <p class="hs-note" [ngClass]="res.errors.length ? 'info' : 'ok'">{{ res.checked !== undefined ? res.checked + ' line(s) are fine' : res.imported + ' line(s) imported' }}{{ res.errors.length ? ', ' + res.errors.length + ' with errors' : '' }}.</p>
          <table class="hs-table" zPlain *ngIf="res.errors.length"><tr><th>Line</th><th>Error</th></tr><tr *ngFor="let e of res.errors"><td>{{ e.line }}</td><td>{{ e.error }}</td></tr></table>
        </ng-container>
      </div>
      <div class="hs-card" *ngIf="box">
        <h3>Helpdesk mailbox</h3>
        <p class="hs-muted">Server, user and "create tickets from e-mail" are in Setup › Settings. The password is kept on the server and never shown.</p>
        <dl class="hs-kv"><dt>Status</dt><dd>{{ box.enabled ? 'On' : 'Off' }}</dd><dt>Server</dt><dd>{{ box.host || '–' }}</dd><dt>User</dt><dd>{{ box.user || '–' }}</dd>
          <dt>Password</dt><dd>{{ box.password_set ? 'set' : 'not set' }}</dd></dl>
        <label style="display:block;margin-top:10px">New password<input type="password" [(ngModel)]="pw" autocomplete="new-password" class="zas-input"></label>
        <div class="hs-acts"><button type="button" class="ex-btn" [disabled]="!pw" (click)="savePw()">Save password</button>
          <button type="button" class="ex-btn primary" (click)="test()">Read the mailbox now</button></div>
        <p class="hs-note" [ngClass]="boxCls" *ngIf="boxMsg">{{ boxMsg }}</p>
      </div>
    </div>
  </div>
</div></div>`,
})
export class ZaAssetImportComponent implements OnInit {
  api!: ZaClient;
  kind: 'assets' | 'parts' = 'assets';
  file: File | null = null;
  res: any = null;
  busy = false;
  msg = '';
  box: any = null;
  pw = '';
  boxMsg = '';
  boxCls = 'ok';
  constructor(private za: ZaApiService) {}
  async ngOnInit(): Promise<void> { this.api = this.za.for(APP); try { this.box = await this.api.get('mailbox/'); } catch { this.box = null; } }
  template(): void { this.api.file(`import/${this.kind}/`, `asset-management-${this.kind}-template.xlsx`); }
  async run(dry: boolean): Promise<void> {
    if (!this.file) return;
    this.busy = true; this.msg = '';
    try { this.res = await this.api.post(`import/${this.kind}/`, ZaApiService.form({ dry_run: dry }, [this.file], 'file')); }
    catch (e) { this.msg = ZaApiService.error(e); }
    this.busy = false;
  }
  async savePw(): Promise<void> {
    try { this.box = { ...this.box, ...(await this.api.post('mailbox/', { password: this.pw })) }; this.pw = ''; this.boxMsg = 'Password saved.'; this.boxCls = 'ok'; }
    catch (e) { this.boxMsg = ZaApiService.error(e); this.boxCls = 'err'; }
  }
  async test(): Promise<void> {
    try { const r: any = await this.api.post('mailbox/', { test: true }); this.boxMsg = r.message; this.boxCls = 'ok'; }
    catch (e) { this.boxMsg = ZaApiService.error(e); this.boxCls = 'err'; }
  }
}
