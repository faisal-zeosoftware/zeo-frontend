import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ZaActionComponent } from './za-register.component';
import { ZaApiService, ZaClient, base, day, stClass, when } from './za-api.service';
import { blobError, openPdf } from './za-asset-side.component';

/** v1.33.0 – Asset Management screens that are more than a register: scan, labels, counting, floor plans,
 *  and the asset panels shown on the record page (label, HR history, depreciation, journal, count progress). */

const APP = 'zeo-assets';

/** Camera scanning with html5-qrcode (loaded only when the camera is opened). Reads QR codes and barcodes. */
@Component({
  selector: 'za-camera',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="zas-cam">
  <div [id]="boxId" class="zas-cam-box"></div>
  <p class="hs-note err" *ngIf="err">{{ err }}</p>
  <div class="hs-acts"><button type="button" class="ex-btn" (click)="stop(); closed.emit()">Close camera</button></div>
</div>`,
})
export class ZaCameraComponent implements OnInit, OnDestroy {
  @Output() scanned = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();
  boxId = 'zas-cam-' + Math.random().toString(36).slice(2, 8);
  err = '';
  private cam: any = null;
  private last = '';
  private lastAt = 0;

  async ngOnInit(): Promise<void> {
    try {
      const m: any = await import('html5-qrcode');
      this.cam = new m.Html5Qrcode(this.boxId);
      await this.cam.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text: string) => {
        const now = Date.now();
        if (text === this.last && now - this.lastAt < 2500) return;   // the same label held in front of the camera
        this.last = text; this.lastAt = now;
        this.scanned.emit(text);
      }, () => { /* no code in this frame */ });
    } catch (e: any) {
      this.err = 'The camera could not be opened. Allow the camera for this site, or type / scan the code with a USB scanner. ' + (e?.message || e || '');
    }
  }
  async stop(): Promise<void> { try { if (this.cam?.isScanning) await this.cam.stop(); } catch { /* already stopped */ } }
  ngOnDestroy(): void { this.stop(); }
}

/** Scan an asset label (camera, USB scanner or typed code) and act on the asset at once. */
@Component({
  selector: 'app-za-asset-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZaCameraComponent, ZaActionComponent],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div><h1 class="page-title">Scan an asset</h1>
    <p class="ex-desc">Point the camera at the QR code or barcode, use a USB / Bluetooth scanner, or type the asset code, serial number or RFID tag.</p></div></div></div>
  <div class="com_list mt-4">
    <div class="hs-card zas-scanbar">
      <input #code type="search" [(ngModel)]="q" (keyup.enter)="find()" placeholder="Scan or type a code…" aria-label="Asset code" autofocus>
      <button type="button" class="ex-btn primary" (click)="find()" [disabled]="busy || !q.trim()">Find</button>
      <button type="button" class="ex-btn" (click)="camera = !camera">{{ camera ? 'Hide camera' : 'Use camera' }}</button>
    </div>
    <za-camera *ngIf="camera" (scanned)="q = $event; find()" (closed)="camera = false"></za-camera>
    <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
    <p class="hs-note ok" *ngIf="ok">{{ ok }}</p>
    <div class="hs-card" *ngIf="rec">
      <div class="zas-hit">
        <div><span class="hs-code">{{ rec.code }}</span> <b>{{ rec.name }}</b>
          <span class="hs-b" [ngClass]="cls(rec.status)" style="margin-left:6px">{{ rec.status_label }}</span>
          <div class="hs-muted">{{ rec.category_label }} · {{ rec.serial_number || 'no serial' }}</div></div>
        <button type="button" class="ex-btn" (click)="open()">Open asset</button>
      </div>
      <dl class="hs-kv">
        <dt>With</dt><dd>{{ rec.holder || 'In store / not assigned' }}</dd>
        <dt>Location</dt><dd>{{ rec.place || '–' }}</dd>
        <dt>Condition</dt><dd>{{ rec.condition_label }}</dd>
        <dt>Due back</dt><dd>{{ dd(rec.due_back) || '–' }}</dd>
      </dl>
      <div class="hs-acts" style="margin-top:12px">
        <button type="button" *ngFor="let a of rec.actions" class="ex-btn" [class.primary]="a.style === 'primary'" [class.danger]="a.style === 'danger'" (click)="action = a">{{ a.label }}</button>
      </div>
    </div>
    <div class="hs-card" *ngIf="recent.length"><h3>Scanned in this session</h3>
      <div class="za-row" *ngFor="let r of recent" (click)="q = r.code; find()"><span><span class="hs-code">{{ r.code }}</span> {{ r.name }}<div class="s">{{ r.place }}</div></span><span class="bd">{{ r.status_label }}</span></div>
    </div>
  </div>
</div></div>
<za-action *ngIf="action" [act]="action" [api]="api" kind="asset" [rec]="rec" (closed)="action = null" (done)="acted($event)"></za-action>`,
})
export class ZaAssetScanComponent implements OnInit {
  @ViewChild('code') codeEl?: ElementRef<HTMLInputElement>;
  api!: ZaClient;
  q = '';
  rec: any = null;
  recent: any[] = [];
  camera = false;
  busy = false;
  msg = '';
  ok = '';
  action: any = null;
  cls = stClass; dd = day;
  constructor(private za: ZaApiService, private router: Router) {}
  ngOnInit(): void { this.api = this.za.for(APP); }

  async find(): Promise<void> {
    const q = this.q.trim();
    if (!q) return;
    this.busy = true; this.msg = ''; this.ok = '';
    try {
      const r: any = await this.api.get('scan/', { code: q });
      this.rec = r.record;
      this.recent = [{ code: r.summary.code, name: r.summary.name, place: r.summary.location, status_label: r.summary.status_label },
                     ...this.recent.filter(x => x.code !== r.summary.code)].slice(0, 10);
      this.q = '';
    } catch (e) { this.msg = ZaApiService.error(e); this.rec = null; }
    this.busy = false;
    setTimeout(() => this.codeEl?.nativeElement.focus(), 0);
  }
  acted(r: any): void { this.action = null; this.rec = r; this.ok = r?.result?.message || 'Done.'; }
  open(): void { this.router.navigate([base(APP), 'r', 'asset', this.rec.id]); }
}

/** Print QR / barcode labels: by asset, by location or by category; the PDF fits A4 label sheets. */
@Component({
  selector: 'app-za-asset-labels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section">
  <div class="header_section"><div class="ex-head"><div><h1 class="page-title">Print labels</h1>
    <p class="ex-desc">QR code (works with the HR asset scanner too), Code 128 barcode, asset code and name. Choose what to print and the label size.</p></div></div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
    <div class="hs-card" style="max-width:900px">
      <div class="hs-tabs2" style="margin-bottom:12px">
        <button type="button" [class.on]="by === 'assets'" (click)="by = 'assets'">Chosen assets</button>
        <button type="button" [class.on]="by === 'location'" (click)="by = 'location'">A location</button>
        <button type="button" [class.on]="by === 'category'" (click)="by = 'category'">A category</button>
      </div>
      <ng-container *ngIf="by === 'assets'">
        <input type="search" [(ngModel)]="q" (ngModelChange)="search()" placeholder="Search assets by code, name or serial…" class="zas-input">
        <div class="zas-pick">
          <label class="ck" *ngFor="let a of found"><input type="checkbox" [checked]="chosen.has(a.id)" (change)="toggle(a)"> {{ a.label }}</label>
          <p class="hs-empty" *ngIf="!found.length">No assets match.</p>
        </div>
        <p class="hs-muted">{{ chosen.size }} chosen <button type="button" class="hs-rlink" *ngIf="chosen.size" (click)="chosen.clear()">clear</button></p>
      </ng-container>
      <select *ngIf="by === 'location'" [(ngModel)]="loc" class="zas-input" aria-label="Location"><option [ngValue]="null">Choose the location…</option>
        <option *ngFor="let l of locations" [ngValue]="l.id">{{ l.label }}</option></select>
      <select *ngIf="by === 'category'" [(ngModel)]="cat" class="zas-input" aria-label="Category"><option [ngValue]="null">Choose the category…</option>
        <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.label }}</option></select>
      <div class="hs-section">Label size</div>
      <div class="hs-tabs2"><button type="button" *ngFor="let s of sizes" [class.on]="size === s.k" (click)="size = s.k">{{ s.l }}</button></div>
      <div class="hs-acts" style="margin-top:16px"><button type="button" class="ex-btn primary" [disabled]="busy" (click)="print()">{{ busy ? 'Preparing…' : 'Print labels (PDF)' }}</button></div>
    </div>
  </div>
</div></div>`,
})
export class ZaAssetLabelsComponent implements OnInit {
  api!: ZaClient;
  by: 'assets' | 'location' | 'category' = 'assets';
  q = '';
  found: any[] = [];
  chosen = new Map<number, string>();
  locations: any[] = [];
  categories: any[] = [];
  loc: number | null = null;
  cat: number | null = null;
  size = 'medium';
  sizes = [{ k: 'small', l: 'Small 50 × 25 mm' }, { k: 'medium', l: 'Medium 70 × 35 mm' }, { k: 'large', l: 'Large 100 × 50 mm' }];
  busy = false;
  msg = '';
  private t: any;
  constructor(private za: ZaApiService, private route: ActivatedRoute) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    const qp = this.route.snapshot.queryParamMap;
    try {
      const [info, locs, cats] = await Promise.all([this.api.info(), this.api.options('locations'), this.api.options('categories')]);
      this.size = info?.settings?.label_size || 'medium';
      this.locations = locs; this.categories = cats;
      if (qp.get('ids')) {
        const ids = qp.get('ids')!.split(',').map(Number).filter(Boolean);
        const rows: any[] = await this.api.get('options/assets/', { ids: ids.join(',') });
        rows.forEach(r => this.chosen.set(r.id, r.label));
        this.found = rows;
      } else { this.search(); }
      if (qp.get('location')) { this.by = 'location'; this.loc = Number(qp.get('location')); }
    } catch (e) { this.msg = ZaApiService.error(e); }
  }
  search(): void {
    clearTimeout(this.t);
    this.t = setTimeout(async () => { try { this.found = await this.api.get('options/assets/', { q: this.q, limit: 60 }); } catch (e) { this.msg = ZaApiService.error(e); } }, 250);
  }
  toggle(a: any): void { this.chosen.has(a.id) ? this.chosen.delete(a.id) : this.chosen.set(a.id, a.label); }
  async print(): Promise<void> {
    this.msg = '';
    const q: any = { size: this.size };
    if (this.by === 'assets') { if (!this.chosen.size) { this.msg = 'Choose at least one asset.'; return; } q.ids = [...this.chosen.keys()].join(','); }
    if (this.by === 'location') { if (!this.loc) { this.msg = 'Choose the location.'; return; } q.location = this.loc; }
    if (this.by === 'category') { if (!this.cat) { this.msg = 'Choose the category.'; return; } q.category = this.cat; }
    this.busy = true;
    try { await openPdf(this.za, 'labels/', q); } catch (e) { this.msg = await blobError(e); }
    this.busy = false;
  }
}

/** Counting screen of an asset count: scan each asset where it is; the list shows what is still missing. */
@Component({
  selector: 'app-za-audit-count',
  standalone: true,
  imports: [CommonModule, FormsModule, ZaCameraComponent],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section" *ngIf="d">
  <div class="header_section"><div class="ex-head">
    <div><h1 class="page-title"><button type="button" class="ex-btn sm" (click)="back()" aria-label="Back">‹</button>
      Count <span class="hs-code">{{ d.audit.number }}</span> {{ d.audit.name }}
      <span class="hs-b" [ngClass]="cls(d.audit.status)" style="margin-left:6px">{{ d.audit.status_label }}</span></h1>
      <p class="ex-desc">{{ d.audit.location || 'Whole branch' }}{{ d.audit.due_date ? ' · count by ' + dd(d.audit.due_date) : '' }}{{ d.audit.blind ? ' · blind count' : '' }}</p></div>
    <div class="ex-actions"><button type="button" class="ex-btn primary" *ngIf="d.audit.can_count" (click)="finish()">Finish counting</button></div>
  </div></div>
  <div class="com_list mt-4">
    <div class="za-cards">
      <div class="za-card"><small>Expected</small><b>{{ d.audit.expected }}</b></div>
      <div class="za-card ok"><small>Found</small><b>{{ d.audit.found }}</b><span>{{ pct() }}%</span></div>
      <div class="za-card" [class.bad]="d.audit.misplaced"><small>In another place</small><b>{{ d.audit.misplaced }}</b></div>
      <div class="za-card" [class.bad]="d.audit.damaged"><small>Damaged</small><b>{{ d.audit.damaged }}</b></div>
      <div class="za-card"><small>Not on the list</small><b>{{ d.audit.unexpected }}</b></div>
      <div class="za-card" [class.bad]="d.audit.missing"><small>Missing</small><b>{{ d.audit.missing }}</b></div>
    </div>
    <div class="hs-card zas-scanbar" *ngIf="d.audit.can_count">
      <select [(ngModel)]="where" aria-label="Where I am counting"><option [ngValue]="null">Where are you? (optional)</option>
        <option *ngFor="let l of d.locations" [ngValue]="l.id">{{ l.label }}</option></select>
      <select [(ngModel)]="cond" aria-label="Condition"><option value="">Condition: as recorded</option><option *ngFor="let c of d.conditions" [value]="c.value">{{ c.label }}</option></select>
      <input #code type="search" [(ngModel)]="q" (keyup.enter)="scan()" placeholder="Scan or type the asset code…" aria-label="Asset code" autofocus>
      <button type="button" class="ex-btn primary" (click)="scan()" [disabled]="busy || !q.trim()">Count</button>
      <button type="button" class="ex-btn" (click)="camera = !camera">{{ camera ? 'Hide camera' : 'Camera' }}</button>
    </div>
    <za-camera *ngIf="camera" (scanned)="q = $event; scan()" (closed)="camera = false"></za-camera>
    <p class="hs-note" [ngClass]="msgCls" *ngIf="msg">{{ msg }}</p>
    <div class="hs-card">
      <div class="hs-tabs2" style="margin-bottom:10px">
        <button type="button" *ngFor="let t of tabs" [class.on]="tab === t.k" (click)="tab = t.k">{{ t.l }} ({{ count(t.k) }})</button>
      </div>
      <div class="hs-scroll"><table class="hs-table" zPlain>
        <tr><th>Asset</th><th>Expected place</th><th>With</th><th>Result</th><th>Found in</th><th>Counted</th><th *ngIf="d.audit.can_count"></th></tr>
        <tr *ngFor="let l of shown()">
          <td><span class="hs-code">{{ l.code }}</span> {{ l.name }}</td><td>{{ l.expected_location || '–' }}</td><td>{{ l.holder }}{{ l.self_confirmed ? ' ✓' : '' }}</td>
          <td><span class="hs-b" [ngClass]="cls(l.result)">{{ l.result_label }}</span></td><td>{{ l.found_location }}</td><td>{{ w(l.counted_at) }}</td>
          <td *ngIf="d.audit.can_count" style="white-space:nowrap">
            <button type="button" class="hs-rlink" *ngIf="l.result !== 'found'" (click)="mark(l, 'found')">Found</button>
            <button type="button" class="hs-rlink" *ngIf="l.result !== 'missing' && l.result !== 'unexpected'" (click)="mark(l, 'missing')">Missing</button>
          </td></tr>
      </table></div>
      <p class="hs-empty" *ngIf="!shown().length">Nothing here.</p>
    </div>
  </div>
</div>
<p class="hs-note err" *ngIf="!d && msg" style="margin:20px">{{ msg }}</p></div>`,
})
export class ZaAuditCountComponent implements OnInit {
  @ViewChild('code') codeEl?: ElementRef<HTMLInputElement>;
  api!: ZaClient;
  id = 0;
  d: any = null;
  q = '';
  where: number | null = null;
  cond = '';
  camera = false;
  busy = false;
  msg = '';
  msgCls = 'ok';
  tab = 'pending';
  tabs = [{ k: 'pending', l: 'To count' }, { k: 'done', l: 'Counted' }, { k: 'issues', l: 'Exceptions' }, { k: 'all', l: 'All' }];
  cls = stClass; dd = day; w = when;
  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.api = this.za.for(APP);
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    try { this.d = await this.api.get(`audit/${this.id}/scan/`); if (this.d.audit.blind) this.tab = 'done'; } catch (e) { this.msg = ZaApiService.error(e); this.msgCls = 'err'; }
  }
  pct(): number { return this.d.audit.expected ? Math.round(100 * this.d.audit.found / this.d.audit.expected) : 0; }
  match(l: any, k: string): boolean {
    if (k === 'pending') return l.result === 'pending';
    if (k === 'done') return l.result !== 'pending';
    if (k === 'issues') return ['missing', 'misplaced', 'damaged', 'unexpected'].includes(l.result);
    return true;
  }
  count(k: string): number { return (this.d?.lines || []).filter((l: any) => this.match(l, k)).length; }
  shown(): any[] { return (this.d?.lines || []).filter((l: any) => this.match(l, this.tab)); }
  async post(body: any): Promise<void> {
    this.busy = true;
    try {
      const r: any = await this.api.post(`audit/${this.id}/scan/`, body);
      this.d = r; this.msg = r.message; this.msgCls = ['missing', 'misplaced', 'damaged', 'unexpected'].includes(r.line?.result) ? 'info' : 'ok';
      try { navigator.vibrate?.(60); } catch { /* no vibration */ }
    } catch (e) { this.msg = ZaApiService.error(e); this.msgCls = 'err'; }
    this.busy = false;
    setTimeout(() => this.codeEl?.nativeElement.focus(), 0);
  }
  async scan(): Promise<void> {
    const code = this.q.trim();
    if (!code) return;
    this.q = '';
    await this.post({ code, location: this.where, condition: this.cond });
  }
  mark(l: any, result: string): void { this.post({ line: l.id, result, location: result === 'found' ? this.where : null }); }
  async finish(): Promise<void> {
    if (!confirm('Finish counting? Assets not counted yet will be marked missing.')) return;
    try { await this.api.post(`r/audit/${this.id}/do/submit/`, {}); this.back(); } catch (e) { this.msg = ZaApiService.error(e); this.msgCls = 'err'; }
  }
  back(): void { this.router.navigate([base(APP), 'r', 'audit', this.id]); }
}

/** Floor plan of a location: assets as pins; managers drag an asset from the list onto the plan (or click the asset, then the plan). */
@Component({
  selector: 'app-za-floor-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section" *ngIf="d">
  <div class="header_section"><div class="ex-head">
    <div><h1 class="page-title"><button type="button" class="ex-btn sm" (click)="up()" aria-label="Back">‹</button> Floor plan · {{ d.location.path }}</h1>
      <p class="ex-desc">{{ d.cards.length }} asset(s) here and in the places inside. {{ d.can_edit ? 'Choose an asset on the right, then click on the plan to place it.' : '' }}</p></div>
    <div class="ex-actions">
      <label class="ex-btn" *ngIf="d.can_edit" style="cursor:pointer">{{ d.image ? 'Replace plan…' : 'Upload plan…' }}<input type="file" accept="image/png,image/jpeg" hidden (change)="upload($any($event.target).files)"></label>
    </div>
  </div></div>
  <div class="com_list mt-4">
    <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
    <div class="hs-split">
      <div class="hs-card zas-plan-wrap">
        <div *ngIf="img" class="zas-plan" (click)="place($event)" [class.placing]="picked">
          <img [src]="img" alt="Floor plan" draggable="false">
          <button type="button" class="zas-pin" *ngFor="let c of placed()" [style.left.%]="c.x" [style.top.%]="c.y" [ngClass]="cls(c.status)"
                  [class.sel]="picked?.id === c.id" (click)="$event.stopPropagation(); pick(c)" [title]="c.code + ' ' + c.name + (c.holder ? ' – ' + c.holder : '')">
            <span>{{ c.code }}</span></button>
        </div>
        <p class="hs-empty" *ngIf="!img">No floor plan yet.{{ d.can_edit ? ' Upload a PNG or JPG drawing of this place.' : '' }}</p>
      </div>
      <div class="hs-side">
        <div class="hs-card" *ngIf="picked"><h3>{{ picked.code }} {{ picked.name }}</h3>
          <div class="hs-muted">{{ picked.status_label }} · {{ picked.holder || picked.location }}</div>
          <div class="hs-acts" style="margin-top:8px"><button type="button" class="ex-btn sm" (click)="openRec(picked.id)">Open</button>
            <button type="button" class="ex-btn sm" *ngIf="d.can_edit && picked.x !== null" (click)="remove(picked)">Take off the plan</button>
            <button type="button" class="ex-btn sm" (click)="picked = null">Done</button></div>
          <p class="hs-muted" *ngIf="d.can_edit">Click on the plan to put it there.</p></div>
        <div class="hs-card" *ngIf="d.children.length"><h3>Places inside</h3>
          <div class="za-row" *ngFor="let ch of d.children" (click)="go(ch.id)"><span>{{ ch.label }}</span><span class="bd">{{ ch.has_plan ? 'plan' : '' }}</span></div></div>
        <div class="hs-card"><h3>Not on the plan ({{ unplaced().length }})</h3>
          <input type="search" [(ngModel)]="f" placeholder="Filter…" class="zas-input">
          <div class="za-row" *ngFor="let c of unplaced()" (click)="pick(c)" [style.background]="picked?.id === c.id ? '#eef0ff' : null">
            <span><span class="hs-code">{{ c.code }}</span> {{ c.name }}<div class="s">{{ c.location }}</div></span><span class="bd">{{ c.status_label }}</span></div>
          <p class="hs-empty" *ngIf="!unplaced().length">Every asset is placed.</p></div>
      </div>
    </div>
  </div>
</div></div>`,
})
export class ZaFloorPlanComponent implements OnInit, OnDestroy {
  api!: ZaClient;
  id = 0;
  d: any = null;
  img = '';
  picked: any = null;
  f = '';
  msg = '';
  cls = stClass;
  private sub: any;
  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    this.api = this.za.for(APP);
    this.sub = this.route.paramMap.subscribe(pm => { this.id = Number(pm.get('id')); this.load(); });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); if (this.img) URL.revokeObjectURL(this.img); }
  async load(): Promise<void> {
    this.msg = '';
    try { this.d = await this.api.get(`floorplan/${this.id}/`); await this.loadImage(); } catch (e) { this.msg = ZaApiService.error(e); }
  }
  async loadImage(): Promise<void> {
    if (this.img) { URL.revokeObjectURL(this.img); this.img = ''; }
    if (!this.d?.image) return;
    const blob = await this.api.blob(`floorplan/${this.id}/image/`);
    this.img = URL.createObjectURL(blob);
  }
  placed(): any[] { return this.d.cards.filter((c: any) => c.x !== null && c.here); }
  unplaced(): any[] {
    const f = this.f.toLowerCase();
    return this.d.cards.filter((c: any) => !(c.x !== null && c.here) && (!f || (c.code + ' ' + c.name).toLowerCase().includes(f)));
  }
  pick(c: any): void { this.picked = this.picked?.id === c.id ? null : c; }
  async place(ev: MouseEvent): Promise<void> {
    if (!this.picked || !this.d.can_edit) return;
    const box = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.round(10000 * (ev.clientX - box.left) / box.width) / 100;
    const y = Math.round(10000 * (ev.clientY - box.top) / box.height) / 100;
    try { this.d = await this.api.post(`floorplan/${this.id}/`, { card: this.picked.id, x, y }); this.picked = null; } catch (e) { this.msg = ZaApiService.error(e); }
  }
  async remove(c: any): Promise<void> {
    try { this.d = await this.api.post(`floorplan/${this.id}/`, { card: c.id, remove: true }); this.picked = null; } catch (e) { this.msg = ZaApiService.error(e); }
  }
  async upload(files: FileList | null): Promise<void> {
    if (!files?.length) return;
    try { this.d = await this.api.post(`floorplan/${this.id}/`, ZaApiService.form({}, [files[0]], 'image')); await this.loadImage(); } catch (e) { this.msg = ZaApiService.error(e); }
  }
  go(id: number): void { this.router.navigate([base(APP), 'floor-plan', id]); }
  up(): void { this.d.parent ? this.go(this.d.parent) : this.router.navigate([base(APP), 'r', 'location', this.id]); }
  openRec(id: number): void { this.router.navigate([base(APP), 'r', 'asset', id]); }
}

