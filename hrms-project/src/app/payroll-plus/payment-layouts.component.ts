// v1.62.11 (item 227, follow-up 03/11/2026): new screen – Payroll › File layouts (designable payment file templates)
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe, I18nService } from '../shared-ui/i18n.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { zConfirm } from '../shared-ui/z-confirm';
import { zToast } from '../shared-ui/z-toast';
import { errText } from './pay162';
import { BF_CSS } from './bank-files.component';

/**
 * v1.62.11 (item 227) – Payroll › File layouts: every payment output (WPS SIF and the banks' WPS layouts, KSA wages file, bulk transfer,
 * cheque list, cash sheet, lists of the own methods) is a template. Built-in layouts are read-only ("Make a copy"); the company's own
 * are designed here: method, file type (delimited / fixed width / CSV / Excel / PDF list), file name rule with placeholders, header,
 * detail (one per employee) and trailer records, each an ordered list of fields from the catalogue with their format.
 * "Preview with this run" and "Check against a sample" (the bank's sample file compared with the layout).
 * API: payroll-plus/api/payment-layouts/ (<code>/, preview/, check-sample/)
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/payment-layouts/`;
const schema = () => localStorage.getItem('selectedSchema') || '';

@Component({
  selector: 'app-payment-layouts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TPipe, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css'],
  styles: [BF_CSS + `
.pl-gen{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));margin:8px 0 12px}
.pl-gen label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185;min-width:0}
.pl-gen input,.pl-gen select,.pl-f input,.pl-f select{height:32px;border:1px solid #dcdfea;border-radius:7px;padding:0 8px;font-size:12.5px;background:#fff;min-width:0;max-width:100%}
.pl-rec{border:1px solid #e3e5ee;border-radius:10px;padding:10px;margin:0 0 10px;background:#fbfbfe}
.pl-rec-h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px}
.pl-f td{padding:3px 4px;vertical-align:middle}.pl-f input.w{width:56px}.pl-f input.m{width:110px}.pl-f select.s{max-width:210px}
.pl-x{border:0;background:none;color:#b42318;cursor:pointer;font-size:16px}.pl-mv{border:0;background:none;cursor:pointer;color:#555d70}
.pl-ro{opacity:.85;pointer-events:none}`],
  template: `
<div class="container hr-page bf-wrap" data-payment-layouts>
  <div class="comapny_section">
    <div class="header_section"><div class="hr-head">
      <div class="hr-head-t"><h1>{{ 'File layouts' | t }}</h1>
        <p class="hr-head-d">{{ 'The layout of every payment file: WPS SIF and the banks’ own WPS layouts, the KSA wages file, bulk bank transfer, cheque list, cash sheet and the lists of your own methods. Built-in layouts are read-only – make a copy to change one; choose the layout of each paying account in Bank file layouts.' | t }}</p></div>
      <div class="hr-head-a hr-head-b">
        <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="d?.can_set" (click)="newLayout()" data-z-new data-pl-new>{{ '+ New file layout' | t }}</button>
        <a class="hr-tbtn" routerLink="/main-sidebar/salary-options/run-payments">{{ 'Payments' | t }}</a>
      </div></div></div>
    <div class="bf-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
    <div class="bf-body" *ngIf="d">
      <div class="bf-card" data-pl-list-card>
        <div class="table-responsive"><table class="table hr-table" data-pl-list>
          <thead><tr><th>{{ 'Name' | t }}</th><th>{{ 'Payment method' | t }}</th><th>{{ 'File type' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'Records' | t }}</th><th class="hr-col-actions">{{ 'Actions' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of d.layouts" [attr.data-pl-row]="l.code" [attr.data-z-id]="l.code">
              <td><b>{{ l.name_t }}</b> <small class="bf-muted" *ngIf="!l.builtin">★ {{ 'own' | t }}</small></td><td>{{ l.method_name }}</td><td>{{ ftName(l.file_type) }}</td>
              <td><span class="bf-chip" [class.ok]="l.state === 'verified'" [class.tbc]="l.state === 'to_confirm'">{{ l.state_text }}</span></td><td>{{ l.records_n }}</td>
              <td class="t62-actions">
                <button type="button" class="t62-link" (click)="open(l)" data-pl-open>{{ (l.builtin ? 'View' : 'Design') | t }}</button>
                <button type="button" class="t62-link" *ngIf="d.can_set" (click)="copy(l)" data-pl-copy>{{ 'Make a copy' | t }}</button>
                <button type="button" class="z-row-btn danger" *ngIf="d.can_set && !l.builtin" (click)="del(l)" data-z-row-delete><mat-icon>delete</mat-icon></button></td></tr>
          </tbody></table></div>
      </div>

      <div class="bf-card" *ngIf="L" data-pl-designer>
        <div class="bf-head"><h2>{{ (L.builtin ? 'Built-in layout (read-only)' : L.code ? 'Design the layout' : 'New file layout') | t }} – {{ L.name }}</h2>
          <span><button type="button" class="bf-btn primary" *ngIf="!L.builtin && d.can_set" (click)="save()" [disabled]="busy" data-pl-save>{{ 'Save' | t }}</button>
            <button type="button" class="bf-btn" *ngIf="L.builtin && d.can_set" (click)="copy(L)" data-pl-copy2>{{ 'Make a copy' | t }}</button>
            <button type="button" class="bf-btn" (click)="L = null; pv = null; cmp = null">{{ 'Close' | t }}</button></span></div>
        <div [class.pl-ro]="L.builtin">
          <div class="pl-gen">
            <label>{{ 'Name' | t }}<input [(ngModel)]="L.name" maxlength="80" data-pl-name></label>
            <label>{{ 'Payment method' | t }}<select [(ngModel)]="L.method" data-pl-method><option *ngFor="let m of d.methods" [ngValue]="m.code">{{ m.name }}</option></select></label>
            <label *ngIf="L.method === 'wps'">{{ 'Data' | t }}<select [(ngModel)]="L.source" data-pl-source>
              <option value="wps">{{ 'WPS data (person ID, routing code, IBAN)' | t }}</option><option value="ksa">{{ 'KSA wages data' | t }}</option><option value="payments">{{ 'Payment lines' | t }}</option></select></label>
            <label>{{ 'File type' | t }}<select [(ngModel)]="L.file_type" data-pl-type><option *ngFor="let f of d.file_types" [ngValue]="f.code">{{ f.name }}</option></select></label>
            <label *ngIf="L.file_type === 'delimited'">{{ 'Separator' | t }}<select [(ngModel)]="L.separator" data-pl-sep>
              <option value=",">,</option><option value=";">;</option><option value="|">|</option><option [ngValue]="'\\t'">TAB</option></select></label>
            <label *ngIf="['delimited','fixed','csv'].includes(L.file_type)">{{ 'Line end' | t }}<select [(ngModel)]="L.line_end"><option value="CRLF">CRLF</option><option value="LF">LF</option></select></label>
            <label style="grid-column:span 2">{{ 'File name rule' | t }}<input [(ngModel)]="L.file_name" maxlength="120" data-pl-filename>
              <small class="bf-muted">{{ d.placeholders.join('  ') }}</small></label>
            <label *ngIf="L.file_type === 'pdf'" style="grid-column:span 2">{{ 'Title' | t }}<input [(ngModel)]="L.title" maxlength="120"></label>
            <label *ngIf="L.file_type === 'xlsx'">{{ 'Sheet name' | t }}<input [(ngModel)]="L.sheet" maxlength="31"></label>
          </div>
          <div class="pl-rec" *ngFor="let r of L.records; let ri = index" [attr.data-pl-rec]="ri">
            <div class="pl-rec-h">
              <select [(ngModel)]="r.kind" data-pl-kind><option *ngFor="let k of d.kinds" [ngValue]="k.code">{{ k.name }}</option></select>
              <input [(ngModel)]="r.name" maxlength="40" style="width:120px;height:30px;border:1px solid #dcdfea;border-radius:7px;padding:0 8px" [placeholder]="'Record name' | t">
              <label class="bf-muted" *ngIf="r.kind === 'detail'"><input type="checkbox" [checked]="r.when === 'variable'" (change)="r.when = $any($event.target).checked ? 'variable' : 'always'"> {{ 'only employees with variable pay' | t }}</label>
              <span style="flex:1"></span>
              <button type="button" class="pl-mv" (click)="move(L.records, ri, -1)">▲</button><button type="button" class="pl-mv" (click)="move(L.records, ri, 1)">▼</button>
              <button type="button" class="pl-x" (click)="L.records.splice(ri, 1)" [title]="'Remove' | t">×</button>
            </div>
            <div class="bf-wide"><table class="pl-f" zPlain>
              <thead><tr class="bf-muted" style="font-size:11px"><th>#</th><th>{{ 'Field' | t }}</th><th>{{ 'Label' | t }}</th><th>{{ 'Constant' | t }}</th><th>{{ 'Date' | t }}</th><th>{{ 'Decimals' | t }}</th>
                <th>{{ 'Decimal sep.' | t }}</th><th>{{ '1,000s' | t }}</th><th>{{ 'Blank if 0' | t }}</th><th>{{ 'Width' | t }}</th><th>{{ 'Pad' | t }}</th><th>{{ 'Align' | t }}</th><th>{{ 'Upper' | t }}</th><th>{{ 'Max' | t }}</th><th></th></tr></thead>
              <tbody><tr *ngFor="let f of r.fields; let fi = index" [attr.data-pl-field]="ri + '-' + fi">
                <td class="bf-muted">{{ fi + 1 }}</td>
                <td><select class="s" [(ngModel)]="f.source" (change)="f.label = catLabel(f.source)"><option *ngFor="let c of catFor(r.kind)" [ngValue]="c.key">{{ c.label }}</option></select></td>
                <td><input class="m" [(ngModel)]="f.label" maxlength="60"></td>
                <td><input class="m" [(ngModel)]="f.value" *ngIf="f.source === 'const'" maxlength="120" data-pl-const></td>
                <td><input class="w" [ngModel]="fm(f).date" (ngModelChange)="setFm(f, 'date', $event)" *ngIf="isDate(f)" placeholder="%Y-%m-%d"></td>
                <td><input class="w" type="number" min="0" max="6" [ngModel]="fm(f).decimals" (ngModelChange)="setFm(f, 'decimals', $event)" *ngIf="isNum(f)"></td>
                <td><select [ngModel]="fm(f).dec_sep || '.'" (ngModelChange)="setFm(f, 'dec_sep', $event)" *ngIf="isNum(f)"><option value=".">.</option><option value=",">,</option></select></td>
                <td><input type="checkbox" [checked]="fm(f).thousands" (change)="setFm(f, 'thousands', $any($event.target).checked)" *ngIf="isNum(f)"></td>
                <td><input type="checkbox" [checked]="fm(f).blank_zero" (change)="setFm(f, 'blank_zero', $any($event.target).checked)"></td>
                <td><input class="w" type="number" min="0" max="400" [ngModel]="fm(f).width" (ngModelChange)="setFm(f, 'width', $event)" [attr.data-pl-width]="ri + '-' + fi"></td>
                <td><input class="w" [ngModel]="fm(f).pad" (ngModelChange)="setFm(f, 'pad', $event)" maxlength="1" style="width:34px"></td>
                <td><select [ngModel]="fm(f).align || ''" (ngModelChange)="setFm(f, 'align', $event)"><option value="">–</option><option value="left">{{ 'left' | t }}</option><option value="right">{{ 'right' | t }}</option></select></td>
                <td><input type="checkbox" [checked]="fm(f).upper" (change)="setFm(f, 'upper', $any($event.target).checked)"></td>
                <td><input class="w" type="number" min="0" max="400" [ngModel]="fm(f).max" (ngModelChange)="setFm(f, 'max', $event)"></td>
                <td style="white-space:nowrap"><button type="button" class="pl-mv" (click)="move(r.fields, fi, -1)">▲</button><button type="button" class="pl-mv" (click)="move(r.fields, fi, 1)">▼</button>
                  <button type="button" class="pl-x" (click)="r.fields.splice(fi, 1)">×</button></td></tr></tbody></table></div>
            <button type="button" class="bf-btn" style="height:28px;margin-top:6px" (click)="addField(r)" data-pl-add-field>{{ '+ Field' | t }}</button>
          </div>
          <button type="button" class="bf-btn" (click)="L.records.push({ kind: 'header', name: 'Header', when: 'always', fields: [{ source: 'const', label: 'Record type', value: 'H' }] })" data-pl-add-rec>{{ '+ Record' | t }}</button>
        </div>

        <h3 style="font-size:14px;margin:16px 0 4px">{{ 'Preview with this run' | t }}</h3>
        <div class="bf-bar"><label>{{ 'Payroll run' | t }}<select [(ngModel)]="runId" data-pl-run><option *ngFor="let r of runs" [ngValue]="r.id">{{ r.name }} · {{ r.month < 10 ? '0' + r.month : r.month }}/{{ r.year }}</option></select></label>
          <button type="button" class="bf-btn primary" (click)="preview()" [disabled]="busy || !runId" data-pl-preview>{{ 'Preview' | t }}</button></div>
        <div *ngIf="pv" data-pl-result>
          <div class="bf-sum"><span>{{ 'File name' | t }}: <b data-pl-pv-name>{{ pv.file_name }}</b></span><span>{{ 'Lines' | t }}: <b>{{ pv.lines }}</b></span>
            <span>{{ 'Employees' | t }}: <b>{{ pv.summary?.employees }}</b></span><span>{{ 'Total' | t }}: <b>{{ pv.summary?.total }} {{ pv.summary?.currency }}</b></span></div>
          <div class="bf-note" *ngIf="pv.note">{{ pv.note }}</div>
          <ul class="bf-checks" data-pl-checks><li *ngFor="let c of pv.checks" [class.y]="c.ok" [class.n]="!c.ok">{{ c.ok ? '✓' : '✗' }} {{ c.check }}</li></ul>
          <div class="bf-pre" data-pl-lines>{{ pv.preview_lines.join('\\n') }}</div>
        </div>

        <h3 style="font-size:14px;margin:16px 0 4px">{{ 'Check against a sample' | t }}</h3>
        <p class="bf-muted" style="margin:0 0 6px">{{ 'Upload the bank’s sample file: ZEO compares its records, the number of fields of each record, the widths (fixed width), the separator and the line ends with this layout.' | t }}</p>
        <div class="bf-bar"><input type="file" (change)="sample($any($event.target).files?.[0])" data-pl-sample [disabled]="busy"></div>
        <div *ngIf="cmp" data-pl-compare>
          <div class="bf-note" [style.background]="cmp.ok ? '#ecfdf3' : null" [style.color]="cmp.ok ? '#1f7a4d' : null">{{ cmp.file }}: {{ cmp.ok ? ('The sample matches the layout' | t) : ('Differences found' | t) }} · {{ cmp.records }} {{ 'records' | t }}</div>
          <ul class="bf-warn" *ngIf="cmp.differences?.length" data-pl-diffs><li *ngFor="let x of cmp.differences">{{ x }}</li></ul>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class PaymentLayoutsComponent implements OnInit {
  d: any = null; L: any = null; pv: any = null; cmp: any = null; runs: any[] = []; runId: number | null = null; busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private i18n: I18nService) {}
  t(s: string, a?: any[]): string { return this.i18n.t(s, a || null); }
  ngOnInit(): void { this.load(); this.loadRuns(); }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(API, { params: { schema: schema() } })); this.bad = false; }
    catch (e) { this.msg = errText(e, 'The file layouts could not be loaded.'); this.bad = true; }
    this.cd.detectChanges();
  }
  async loadRuns(): Promise<void> {
    try { const b: any = await firstValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/payroll-plus/api/bank-files/`, { params: { schema: schema() } }));
      this.runs = b.runs || []; const r = this.runs.find(x => x.status === 'paid' || x.status === 'approved') || this.runs[0]; this.runId = r ? r.id : null; } catch { this.runs = []; }
    this.cd.detectChanges();
  }
  ftName(c: string): string { return ((this.d?.file_types || []).find((f: any) => f.code === c) || {}).name || c; }
  catFor(kind: string): any[] { return (this.d?.catalogue || []).filter((c: any) => kind === 'detail' || c.level !== 'detail'); }
  catLabel(k: string): string { return ((this.d?.catalogue || []).find((c: any) => c.key === k) || {}).label || k; }
  catType(k: string): string { return ((this.d?.catalogue || []).find((c: any) => c.key === k) || {}).type || 'text'; }
  isNum(f: any): boolean { return ['amount', 'int', 'number'].includes(this.catType(f.source)); }
  isDate(f: any): boolean { return ['date', 'datetime'].includes(this.catType(f.source)); }
  fm(f: any): any { return f.format || {}; }
  setFm(f: any, k: string, v: any): void { f.format = { ...(f.format || {}) }; if (v === '' || v === null || v === false || v === undefined) { delete f.format[k]; } else { f.format[k] = v; } }
  move(arr: any[], i: number, d: number): void { const j = i + d; if (j < 0 || j >= arr.length) { return; } [arr[i], arr[j]] = [arr[j], arr[i]]; }
  addField(r: any): void { r.fields.push({ source: r.kind === 'detail' ? 'emp_code' : 'const', label: r.kind === 'detail' ? this.catLabel('emp_code') : 'Text', value: r.kind === 'detail' ? undefined : '' }); }
  open(l: any): void { this.L = JSON.parse(JSON.stringify(l)); this.pv = null; this.cmp = null; this.cd.detectChanges(); setTimeout(() => document.querySelector('[data-pl-designer]')?.scrollIntoView({ block: 'start' }), 50); }
  newLayout(): void {
    this.open({ name: this.t('New layout'), method: 'bank_transfer', source: 'payments', file_type: 'delimited', separator: ',', line_end: 'CRLF', file_name: 'PAY_{company_code}_{yyyymm}.txt',
      records: [{ kind: 'detail', name: 'Detail', when: 'always', fields: [{ source: 'emp_code', label: this.catLabel('emp_code') }, { source: 'name', label: this.catLabel('name') },
        { source: 'iban', label: 'IBAN' }, { source: 'amount', label: this.catLabel('amount'), format: { decimals: 2 } }] }] });
  }
  async copy(l: any): Promise<void> {
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post<any>(API, { copy_of: l.code, name: (l.name_t || l.name) + ' – ' + this.t('copy') }, { params: { schema: schema() } }));
      zToast(this.t('Copy made – you can now change it.'), 'ok'); await this.load(); this.open(r);
    } catch (e) { this.msg = errText(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  private body(): any { const x = { ...this.L }; ['builtin', 'state', 'state_text', 'sources', 'method_name', 'name_t', 'records_n'].forEach(k => delete x[k]); return x; }
  async save(): Promise<void> {
    this.busy = true; this.msg = '';
    try {
      const r: any = this.L.code
        ? await firstValueFrom(this.http.patch<any>(`${API}${this.L.code}/`, { layout: this.body() }, { params: { schema: schema() } }))
        : await firstValueFrom(this.http.post<any>(API, { layout: this.body() }, { params: { schema: schema() } }));
      zToast(this.t('File layout saved.'), 'ok'); this.L = JSON.parse(JSON.stringify(r)); await this.load(); this.bad = false;
    } catch (e: any) { this.msg = errText(e) + (e?.error?.errors ? ' – ' + Object.values(e.error.errors).join(' ') : ''); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async del(l: any): Promise<void> {
    if (!(await zConfirm(this.t('Delete the file layout "{0}"?', [l.name_t || l.name]), { danger: true, ok: this.t('Delete') }))) { return; }
    try { await firstValueFrom(this.http.delete(`${API}${l.code}/`, { params: { schema: schema() } })); if (this.L?.code === l.code) { this.L = null; } await this.load(); }
    catch (e) { this.msg = errText(e); this.bad = true; this.cd.detectChanges(); }
  }
  async preview(): Promise<void> {
    this.busy = true; this.msg = '';
    try { this.pv = await firstValueFrom(this.http.post<any>(API + 'preview/', { run: this.runId, layout: this.L.builtin ? this.L.code : this.body() }, { params: { schema: schema() } })); this.bad = false; }
    catch (e: any) { this.pv = null; this.msg = errText(e) + (e?.error?.errors ? ' – ' + Object.values(e.error.errors).join(' ') : ''); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async sample(f: File | undefined): Promise<void> {
    if (!f) { return; }
    this.busy = true; this.msg = '';
    const fd = new FormData(); fd.append('file', f);
    if (this.L.builtin) { fd.append('layout', this.L.code); } else { fd.append('layout_json', JSON.stringify(this.body())); }
    try { this.cmp = await firstValueFrom(this.http.post<any>(API + 'check-sample/', fd, { params: { schema: schema() } })); this.bad = false; }
    catch (e) { this.cmp = null; this.msg = errText(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}
