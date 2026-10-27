import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ZRecordService } from './z-record.service';
import { TPipe, i18nT } from './i18n.service';
import { ZAD_STYLES, ZAdminBase, downloadBlob } from './z-admin-pages.component';

/**
 * v1.62.0 workbook – Settings › Data workbook (company administrators; also in Settings › Administration and the setup guide).
 * Upload a client data workbook (the ZEO_Client_Data_Template format) → Check (a trial that is rolled back – every row is tried,
 * nothing is saved) → Load in the background with live progress → summary and error report. History of every check / load.
 * API: /tools/api/workbooks/ (DataTools/workbook_views.py) – the same steps for scripts and AI assistants.
 */
const API = '/tools/api/workbooks/';

@Component({
  selector: 'z-data-workbook',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TPipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [ZAD_STYLES + `
  .zwb { max-width: 1240px; }
  .zwb-top { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
  .zwb-top h2 { display: flex; align-items: center; gap: 8px; } .zwb-top h2 mat-icon { color: #5b4fe0; }
  .zwb mat-icon { color: #5b4fe0; } .zwb .zad-btn mat-icon { color: inherit; } .zwb .zad-btn.primary mat-icon { color: #fff; }
  .zwb .zwb-res mat-icon { color: inherit; } .zwb .zwb-file .name mat-icon { color: #5d6670; }
  .zwb-top p { margin: 2px 0 0; max-width: 760px; }
  .zwb-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
  .zwb-step { background: #fff; border: 1px solid #e3e6ea; border-radius: 12px; padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start; }
  .zwb-step b { display: block; font-size: 14px; color: #1b1640; } .zwb-step span { font-size: 12.5px; color: #5d6670; line-height: 1.4; }
  .zwb-step .n { flex: none; width: 28px; height: 28px; border-radius: 50%; background: #eeedfd; color: #5b4fe0; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .zwb-step.on { border-color: #5b4fe0; box-shadow: 0 0 0 1px #5b4fe0 inset; } .zwb-step.done .n { background: #2e9a57; color: #fff; }
  .zwb-drop { border: 2px dashed #c9cdf5; border-radius: 12px; background: #fafaff; padding: 22px; text-align: center; cursor: pointer; transition: background .15s; }
  .zwb-drop:hover, .zwb-drop.over { background: #eeedfd; border-color: #5b4fe0; }
  .zwb-drop mat-icon { font-size: 34px; width: 34px; height: 34px; color: #5b4fe0; } .zwb-drop b { display: block; margin: 4px 0; font-size: 14.5px; color: #1b1640; }
  .zwb-file { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
  .zwb-file .name { font-size: 15px; font-weight: 600; color: #1b1640; display: flex; align-items: center; gap: 6px; }
  .zwb-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; margin: 12px 0; }
  .zwb-kpis div { border: 1px solid #e3e6ea; border-radius: 10px; padding: 9px 12px; background: #fff; }
  .zwb-kpis b { display: block; font-size: 21px; color: #1b1640; } .zwb-kpis span { font-size: 12px; color: #5d6670; }
  .zwb-kpis .ok b { color: #1d6b37; } .zwb-kpis .bad b { color: #9b2c24; } .zwb-kpis .skip b { color: #5b4fe0; }
  .zwb-bar { height: 10px; background: #eef0f2; border-radius: 6px; overflow: hidden; margin: 8px 0 6px; }
  .zwb-bar i { display: block; height: 100%; background: linear-gradient(90deg, #5b4fe0, #8b7ff0); border-radius: 6px; transition: width .6s; }
  .zwb-live { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: #3c4450; }
  .zwb-res { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 10px; margin: 0 0 12px; font-size: 13.5px; line-height: 1.45; }
  .zwb-res.ok { background: #e3f4ea; color: #1d6b37; } .zwb-res.bad { background: #fff4dc; color: #6b4800; } .zwb-res.err { background: #fde8e6; color: #9b2c24; }
  .zwb-res mat-icon { flex: none; }
  table.zad-t tr.f td { background: #fff8f7; } .zwb-sheet-bad { color: #9b2c24; font-weight: 600; } .zwb-n { text-align: end; font-variant-numeric: tabular-nums; }
  .zwb-fix { color: #1d6b37; font-size: 12px; margin-top: 2px; } .zwb-col { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11.5px; background: #f1f2f5; padding: 1px 5px; border-radius: 4px; }
  .zwb-filter { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
  .zwb-grid2 { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 14px; } @media (max-width: 980px) { .zwb-grid2 { grid-template-columns: 1fr; } }
  .zwb-opt label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #5d6670; margin-bottom: 10px; }
  .zwb-big { padding: 9px 16px; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; } .zwb-big mat-icon { font-size: 19px; width: 19px; height: 19px; }
  .zwb-mand { font-size: 10.5px; padding: 0 6px; border-radius: 8px; background: #fff4dc; color: #7a5200; margin-inline-start: 6px; }
  .zwb-scroll { max-height: 460px; overflow: auto; border: 1px solid #eef0f2; border-radius: 8px; }
  .zwb-scroll table.zad-t th { position: sticky; top: 0; background: #fafbfc; z-index: 1; }`],
  template: `
<div class="zad zwb" data-workbook>
  <div class="zwb-top">
    <div>
      <h2><mat-icon>upload_file</mat-icon>Data workbook</h2>
      <p class="zad-muted">Load a company's data from one Excel workbook – company details, branches, departments, designations, categories, employees, salaries, bank details, documents, leave opening balances and history. Check it first (nothing is saved), then load it in the background.</p>
    </div>
    <div class="zad-act" style="margin-top:0">
      <button type="button" class="zad-btn zwb-big" (click)="template()" [disabled]="busy" data-wb-template><mat-icon>download</mat-icon>Download the template</button>
      <button type="button" class="zad-btn primary zwb-big" (click)="pick.click()" [disabled]="busy || running" data-wb-upload-btn><mat-icon>upload</mat-icon>Upload a workbook</button>
      <input #pick type="file" accept=".xlsx,.xlsm" hidden (change)="upload($any($event.target).files?.[0]); pick.value = ''" data-wb-file>
    </div>
  </div>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>

  <div class="zwb-steps" aria-label="Steps">
    <div class="zwb-step" [class.on]="!cur" [class.done]="!!cur"><span class="n">1</span><div><b>Upload</b><span>The workbook in the template format (Index, one sheet per screen).</span></div></div>
    <div class="zwb-step" [class.on]="cur && !checkedClean && !loaded" [class.done]="checkedClean || loaded"><span class="n">2</span><div><b>Check</b><span>Every row is tried in a trial that is undone – reasons and fixes per row.</span></div></div>
    <div class="zwb-step" [class.on]="checkedClean && !loaded" [class.done]="loaded"><span class="n">3</span><div><b>Load</b><span>Runs in the background; a second load skips what is already there.</span></div></div>
  </div>

  <section class="zad-card" *ngIf="!cur">
    <div class="zwb-drop" (click)="pick.click()" (dragover)="$event.preventDefault(); over = true" (dragleave)="over = false" (drop)="drop($event)" [class.over]="over" data-wb-drop>
      <mat-icon>cloud_upload</mat-icon><b>Drop the workbook here, or click to choose it</b>
      <span class="zad-muted">.xlsx up to 30 MB · start from the template: it explains every column and the order of the sheets</span>
    </div>
  </section>

  <ng-container *ngIf="cur">
    <section class="zad-card" data-wb-current>
      <div class="zwb-file">
        <span class="name"><mat-icon>description</mat-icon>{{ cur.file_name }}</span>
        <span class="zad-muted">{{ cur.rows | number }} rows in {{ cur.sheets.length }} sheets · uploaded {{ cur.uploaded_at | date:'d MMM y, HH:mm' }} by {{ cur.uploaded_by }}</span>
        <span style="flex:1"></span>
        <button type="button" class="zad-btn sm" (click)="reset()" [disabled]="running">Another workbook</button>
      </div>

      <div class="zwb-grid2" style="margin-top:12px">
        <div>
          <ng-container *ngIf="run">
            <div *ngIf="running" data-wb-progress>
              <div class="zwb-live"><b>{{ run.kind === 'load' ? 'Loading' : 'Checking' }}…</b>
                <span *ngIf="run.progress.sheet">Sheet: <b>{{ run.progress.sheet }}</b></span>
                <span *ngIf="run.progress.month">Month: <b>{{ run.progress.month }}</b></span>
                <span>{{ (run.progress.done || 0) | number }} of {{ (run.progress.total || 0) | number }} rows</span>
                <span *ngIf="run.progress.failed" class="zad-bad">{{ run.progress.failed | number }} failed</span>
                <span *ngIf="run.progress.eta_s">about {{ eta(run.progress.eta_s) }} left</span></div>
              <div class="zwb-bar" role="progressbar" [attr.aria-valuenow]="run.progress.percent" aria-valuemin="0" aria-valuemax="100"><i [style.width.%]="run.progress.percent || 1"></i></div>
              <p class="zad-muted">{{ run.kind === 'load' ? 'You may close this page – the load goes on, and this page shows it again when you come back.' : 'Nothing is saved during a check. E-mails are not sent.' }}
                <span *ngIf="run.runner"> · runs in: {{ run.runner }}</span></p>
            </div>
            <div *ngIf="!running" class="zwb-res" [class.ok]="clean(run)" [class.bad]="!clean(run) && run.state === 'done'" [class.err]="run.state !== 'done'" data-wb-result>
              <mat-icon>{{ clean(run) ? 'task_alt' : (run.state === 'done' ? 'rule' : 'error') }}</mat-icon>
              <div><b>{{ run.kind_text }} · {{ run.state_text }}</b> – {{ run.finished_at | date:'d MMM, HH:mm' }}<br>{{ run.message }}</div>
            </div>
            <div class="zwb-kpis">
              <div class="ok"><b>{{ (run.totals?.ok ?? run.progress.ok ?? 0) | number }}</b><span>{{ run.kind === 'load' ? 'rows loaded' : 'rows would load' }}</span></div>
              <div class="skip"><b>{{ (run.totals?.skipped ?? run.progress.skipped ?? 0) | number }}</b><span>already there (skipped)</span></div>
              <div [class.bad]="(run.totals?.failed ?? run.progress.failed)"><b>{{ (run.totals?.failed ?? run.progress.failed ?? 0) | number }}</b><span>{{ run.kind === 'load' ? 'failed' : 'would fail' }}</span></div>
              <div [class.bad]="run.totals?.problems"><b>{{ (run.totals?.problems || 0) | number }}</b><span>problems of sheets / columns</span></div>
              <div><b>{{ (run.totals?.examples || 0) | number }}</b><span>example rows ignored</span></div>
            </div>
          </ng-container>
          <p class="zad-muted" *ngIf="!run">Not checked yet. Press <b>Check</b>: every row is tried and the reasons of the rows that would fail are listed – nothing is saved.</p>

          <table class="zad-t" data-wb-sheets>
            <tr><th>Sheet</th><th>How</th><th class="zwb-n">Rows</th><th>Months</th><th class="zwb-n">OK</th><th class="zwb-n">Skipped</th><th class="zwb-n">Failed</th></tr>
            <tr *ngFor="let s of cur.sheets" [class.f]="st(s.sheet)?.failed || st(s.sheet)?.problems || !s.found" [attr.data-wb-sheet]="s.sheet">
              <td><b [class.zwb-sheet-bad]="st(s.sheet)?.failed || !s.found">{{ s.sheet }}</b><span class="zwb-mand" *ngIf="s.mandatory">go-live</span>
                <div class="zad-muted" *ngIf="!s.found">not in the workbook</div></td>
              <td class="zad-muted">{{ s.how }}{{ s.phase === 'monthly' ? ' · monthly' : '' }}</td>
              <td class="zwb-n">{{ s.rows | number }}<span class="zad-muted" *ngIf="s.examples"> (+{{ s.examples }} ex.)</span></td>
              <td class="zad-muted">{{ s.months?.length ? s.months[0] + (s.months.length > 1 ? ' – ' + s.months[s.months.length - 1] : '') : '' }}</td>
              <td class="zwb-n zad-ok">{{ st(s.sheet)?.ok ?? '' }}</td><td class="zwb-n">{{ st(s.sheet)?.skipped ?? '' }}</td>
              <td class="zwb-n" [class.zad-bad]="st(s.sheet)?.failed">{{ st(s.sheet) ? st(s.sheet).failed + (st(s.sheet).problems ? ' + ' + st(s.sheet).problems : '') : '' }}</td></tr>
          </table>
        </div>
        <div class="zwb-opt">
          <section class="zad-card" style="margin:0">
            <h3><mat-icon>play_circle</mat-icon>Run</h3>
            <div class="zad-act" style="flex-direction:column;align-items:stretch">
              <button type="button" class="zad-btn zwb-big" (click)="go('check')" [disabled]="busy || running" data-wb-check><mat-icon>fact_check</mat-icon>Check</button>
              <button type="button" class="zad-btn primary zwb-big" (click)="go('load')" [disabled]="busy || running" data-wb-load><mat-icon>publish</mat-icon>{{ loadedBefore ? 'Load again (resume)' : 'Load' }}</button>
              <button type="button" class="zad-btn danger zwb-big" *ngIf="running" (click)="stop()" [disabled]="busy || run?.stop_requested" data-wb-stop><mat-icon>stop_circle</mat-icon>{{ run?.stop_requested ? 'Stopping…' : 'Stop' }}</button>
              <button type="button" class="zad-btn zwb-big" *ngIf="run && !running && run.error_count" (click)="report()" [disabled]="busy" data-wb-report><mat-icon>file_download</mat-icon>Error report (Excel)</button>
            </div>
            <details style="margin-top:10px" [open]="months.length > 0 && loadedBefore">
              <summary class="zad-muted">Options</summary>
              <label style="margin-top:8px">Load the months from (resume)
                <select [(ngModel)]="fromMonth" data-wb-from><option value="">The whole workbook</option><option *ngFor="let m of months" [value]="m">{{ m }}</option></select></label>
              <label>Only these sheets (empty = all)
                <select multiple size="5" [(ngModel)]="only" data-wb-only><option *ngFor="let s of cur.sheets" [value]="s.sheet">{{ s.sheet }}</option></select></label>
              <label class="zad-chk" style="flex-direction:row"><input type="checkbox" [(ngModel)]="quick"> Quick check (values only, no trial – seconds)</label>
            </details>
            <p class="zad-muted" style="margin:10px 0 0">A load that stops (server restart, Stop) can simply be started again: rows already loaded are skipped.</p>
          </section>
        </div>
      </div>
    </section>

    <section class="zad-card" *ngIf="run?.errors?.length" data-wb-errors>
      <h3><mat-icon>report</mat-icon>{{ run.kind === 'load' ? 'Rows that failed' : 'Rows that would fail' }} ({{ run.error_count | number }})</h3>
      <div class="zwb-filter">
        <select [(ngModel)]="sheetFilter" aria-label="Sheet"><option value="">Every sheet</option><option *ngFor="let s of errSheets()" [value]="s">{{ s }}</option></select>
        <span class="zad-muted" *ngIf="run.error_count > run.errors.length">The first {{ run.errors.length }} are shown – the error report has all of them.</span>
      </div>
      <div class="zwb-scroll">
        <table class="zad-t">
          <tr><th>Sheet</th><th>Row</th><th>Column</th><th>Value</th><th>Reason and fix</th></tr>
          <tr *ngFor="let e of filtered()" [attr.data-wb-err]="e.sheet + ':' + e.row">
            <td><b>{{ e.sheet }}</b></td><td>{{ e.row > 1 ? e.row : (e.row === 1 ? 'titles' : '') }}</td>
            <td><span class="zwb-col" *ngIf="e.letter">{{ e.letter }}</span> {{ e.column }}</td><td>{{ e.value }}</td>
            <td>{{ e.error }}<div class="zwb-fix" *ngIf="e.fix">→ {{ e.fix }}</div></td></tr>
        </table>
      </div>
    </section>
  </ng-container>

  <section class="zad-card" data-wb-history>
    <h3><mat-icon>history</mat-icon>History</h3>
    <table class="zad-t" *ngIf="hist.length; else noH">
      <tr><th>When</th><th>Workbook</th><th>What</th><th>By</th><th>Result</th><th></th></tr>
      <tr *ngFor="let h of hist">
        <td>{{ h.created_at | date:'d MMM y, HH:mm' }}</td><td><a href="" (click)="$event.preventDefault(); open(h.upload)">{{ h.file_name }}</a></td>
        <td>{{ h.kind_text }}<span class="zad-muted" *ngIf="h.options?.from_month"> from {{ h.options.from_month }}</span></td><td>{{ h.by }}</td>
        <td><span class="zad-pill" [class.ok]="h.state === 'done' && !h.totals?.failed" [class.warn]="h.state === 'done' && h.totals?.failed" [class.bad]="h.state === 'failed' || h.state === 'interrupted'">{{ h.state_text }}</span>
          <span class="zad-muted" *ngIf="h.totals?.ok !== undefined"> {{ h.totals.ok | number }} ok · {{ h.totals.skipped | number }} skipped · {{ h.totals.failed | number }} failed</span>
          <span class="zad-muted" *ngIf="h.state === 'running'"> {{ h.progress?.percent }} %</span></td>
        <td><button type="button" class="zad-btn sm" *ngIf="h.error_count" (click)="report(h)">Error report</button></td></tr>
    </table>
    <ng-template #noH><p class="zad-muted">No workbook was checked or loaded in this company yet.</p></ng-template>
  </section>
</div>`,
})
export class ZDataWorkbookComponent extends ZAdminBase implements OnInit, OnDestroy {
  cur: any = null; run: any = null; hist: any[] = []; over = false; fromMonth = ''; only: string[] = []; quick = false; sheetFilter = '';
  private timer: any = null;
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  reset(): void { clearTimeout(this.timer); this.cur = null; this.run = null; this.msg = ''; this.cd.markForCheck(); }
  get running(): boolean { return !!this.run && ['queued', 'running'].includes(this.run.state); }
  get months(): string[] { const s = new Set<string>(); for (const x of this.cur?.sheets || []) { for (const m of x.months || []) { s.add(m); } } return [...s].sort(); }
  get loadedBefore(): boolean { return !!this.cur?.runs?.some((r: any) => r.kind === 'load'); }
  get loaded(): boolean { return !!this.cur?.runs?.some((r: any) => r.kind === 'load' && r.state === 'done' && !r.totals?.failed); }
  get checkedClean(): boolean { return !!this.cur?.runs?.some((r: any) => r.kind !== 'load' && r.state === 'done' && !r.totals?.failed && !r.totals?.problems); }
  async ngOnInit(): Promise<void> {
    await this.history();
    const live = this.hist.find(h => ['queued', 'running'].includes(h.state));   // a load still running: show it again
    const last = live || this.hist[0];
    if (last) { await this.open(last.upload, false); }
  }
  ngOnDestroy(): void { clearTimeout(this.timer); }
  clean(r: any): boolean { return r?.state === 'done' && !r.totals?.failed && !r.totals?.problems; }
  st(sheet: string): any { return (this.run?.sheets || []).find((s: any) => s.sheet === sheet); }
  errSheets(): string[] { return [...new Set<string>((this.run?.errors || []).map((e: any) => e.sheet))]; }
  filtered(): any[] { return (this.run?.errors || []).filter((e: any) => !this.sheetFilter || e.sheet === this.sheetFilter); }
  eta(s: number): string { return s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`; }
  async history(): Promise<void> { try { const r: any = await this.get(API); this.hist = r.history || []; } catch (e) { /* shown by open() */ } this.cd.markForCheck(); }
  async open(id: number, scroll = true): Promise<void> {
    await this.act(async () => { this.cur = await this.get(`${API}${id}/`); this.run = this.cur.run; this.sheetFilter = ''; });
    this.poll();
    if (scroll) { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }
  drop(ev: DragEvent): void { ev.preventDefault(); this.over = false; const f = ev.dataTransfer?.files?.[0]; if (f) { this.upload(f); } }
  async upload(f: File | undefined): Promise<void> {
    if (!f) { return; }
    const fd = new FormData(); fd.append('file', f, f.name);
    const ok = await this.act(async () => { this.cur = await this.post(API, fd); this.run = null; this.fromMonth = ''; this.only = []; },
      i18nT('Uploaded. Press Check – nothing is saved while checking.'));
    if (ok) { await this.history(); }
  }
  async go(kind: 'check' | 'load'): Promise<void> {
    if (!this.cur) { return; }
    if (kind === 'load' && !this.checkedClean && !confirm(i18nT('This workbook has not been checked clean. Load it anyway? Rows that fail are listed and can be loaded again after correcting them.'))) { return; }
    const body: any = { only: this.only };
    if (kind === 'load' && this.fromMonth) { body.from_month = this.fromMonth; }
    if (kind === 'check') { body.quick = this.quick; }
    const ok = await this.act(async () => { this.run = await this.post(`${API}${this.cur.id}/${kind}/`, body); });
    if (ok) { this.msg = ''; this.poll(); await this.history(); }
  }
  async stop(): Promise<void> { await this.act(async () => { this.run = await this.post(`${API}${this.cur.id}/stop/`); }, i18nT('Stopping after the current row …')); }
  private poll(): void {
    clearTimeout(this.timer);
    if (!this.running) { return; }
    this.timer = setTimeout(async () => {
      try {
        const u: any = await this.get(`${API}${this.cur.id}/`);
        const wasRunning = this.running;
        this.cur = u; this.run = u.run;
        if (wasRunning && !this.running) { await this.history(); }
      } catch { /* keep polling */ }
      this.cd.markForCheck(); this.poll();
    }, 2000);
  }
  async template(): Promise<void> { await this.act(() => downloadBlob(this.http, this.u(`${API}template/`), 'ZEO_Client_Data_Template_1.62.0.xlsx')); }
  async report(h?: any): Promise<void> {
    const up = h ? h.upload : this.cur.id; const rid = h ? h.id : this.run?.id;
    await this.act(() => downloadBlob(this.http, this.u(`${API}${up}/errors/?run=${rid}`), 'errors.xlsx'));
  }
}
