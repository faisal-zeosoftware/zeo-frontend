import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { LpApi } from './lp-api';

/** Employees × skills: level dots, required level of the designation (red ring) and red gap cells. */
@Component({
  selector: 'app-skill-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./learning-plus.css'],
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>Skill Matrix</h1><p class="lp-desc">Current level of each skill against the level the designation requires (Role Skills). Red cells are gaps.</p></div>
    <div class="lp-tools">
      <select [(ngModel)]="department" (ngModelChange)="load()" aria-label="Department"><option [ngValue]="''">All departments</option><option *ngFor="let d of departments" [ngValue]="d.id">{{ d.dept_name }}</option></select>
      <select [(ngModel)]="designation" (ngModelChange)="load()" aria-label="Designation"><option [ngValue]="''">All designations</option><option *ngFor="let d of designations" [ngValue]="d.id">{{ d.desgntn_job_title }}</option></select>
      <label class="lp-muted" style="display:flex;gap:4px;align-items:center"><input type="checkbox" [(ngModel)]="onlyGaps" (ngModelChange)="load()"> Only gaps</label>
    </div>
  </div>
  <p class="lp-msg err" *ngIf="msg">{{ msg }}</p>
  <p class="lp-muted" *ngIf="loading">Loading…</p>
  <ng-container *ngIf="m && !loading">
    <div class="lp-tiles">
      <div class="lp-tile"><div class="k">Employees</div><div class="v">{{ m.rows.length }}</div></div>
      <div class="lp-tile"><div class="k">Skills</div><div class="v">{{ m.skills.length }}</div></div>
      <div class="lp-tile"><div class="k">Gaps</div><div class="v" style="color:#c62f45">{{ m.gaps }}</div></div>
    </div>
    <div class="lp-legend"><span *ngFor="let l of m.levels">{{ l.level }} = {{ l.label }}</span><span>· <span class="lp-dots"><i class="req"></i></span> required level</span></div>
    <p class="lp-muted" *ngIf="!m.skills.length">No skills yet - add Skills, Role Skills and course skills.</p>
    <div class="lp-card lp-scroll" *ngIf="m.skills.length" style="padding:0">
      <table class="lp-table lp-matrix">
        <thead><tr><th class="emp">Employee</th><th class="sk" *ngFor="let s of m.skills" [title]="s.category || ''">{{ s.name }}</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of m.rows">
            <td class="emp"><div style="font-weight:600;overflow-wrap:anywhere">{{ r.name }}</div><div class="lp-muted">{{ r.designation || '–' }}</div></td>
            <td class="cell" *ngFor="let s of m.skills" [class.gap]="cell(r, s).gap" [title]="tip(r, s)">
              <span class="lp-dots"><i *ngFor="let i of five" [class.on]="i <= cell(r, s).level" [class.req]="cell(r, s).required && i <= cell(r, s).required && i > cell(r, s).level"></i></span>
              <span class="lp-gapn" *ngIf="cell(r, s).gap">-{{ cell(r, s).gap }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </ng-container>
</div>`,
})
export class SkillMatrixComponent implements OnInit {
  m: any = null; departments: any[] = []; designations: any[] = []; department: any = ''; designation: any = ''; onlyGaps = false;
  loading = false; msg = ''; five = [1, 2, 3, 4, 5];
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  async ngOnInit(): Promise<void> {
    const list = (r: any) => (Array.isArray(r) ? r : r?.results || []);
    try { this.departments = list(await this.api.get('organisation/api/Department/')); } catch { this.departments = []; }
    try { this.designations = list(await this.api.get('organisation/api/Designation/')); } catch { this.designations = []; }
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true; this.msg = ''; this.cd.detectChanges();
    try { this.m = await this.api.get('learning/plus/api/skill-matrix/', { department: this.department, designation: this.designation, gaps: this.onlyGaps ? 'true' : '' }); }
    catch (e) { this.m = null; this.msg = LpApi.err(e, 'Could not load the skill matrix.'); }
    this.loading = false; this.cd.detectChanges();
  }

  cell(r: any, s: any): any { return r.cells[String(s.id)] || { level: 0, required: null, gap: 0 }; }

  tip(r: any, s: any): string {
    const c = this.cell(r, s);
    const lab = (n: number) => this.m.levels.find((l: any) => l.level === n)?.label || '–';
    return `${s.name}: ${c.level ? c.level + ' ' + lab(c.level) : 'none'}${c.required ? ' · required ' + c.required + ' ' + lab(c.required) : ''}${c.source ? ' · ' + c.source : ''}`;
  }
}
