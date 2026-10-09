import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { OrgSettingsService } from './org-settings.service';

/** One node of the tree (recursive). */
@Component({
  selector: 'app-org-tree',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./org-structure.css'],
  template: `
<ul class="os-tree" [class.root]="root">
  <li class="os-node" *ngFor="let n of nodes">
    <div class="box">
      <button type="button" class="tg" *ngIf="n.children?.length" (click)="open[n.id] = !isOpen(n)" [attr.aria-label]="isOpen(n) ? 'Collapse' : 'Expand'">{{ isOpen(n) ? '−' : '+' }}</button>
      <b>{{ n.name }}</b>
      <small *ngIf="n.code">{{ n.code }}</small>
      <small *ngIf="n.designation || n.department">{{ n.designation }}{{ n.designation && n.department ? ' · ' : '' }}{{ n.department }}</small>
      <small *ngIf="n.grade">Grade {{ n.grade }}</small>
      <span *ngIf="n.budget !== undefined" class="os-tag" [ngClass]="n.filled >= n.budget ? 'ok' : 'warn'">{{ n.filled }} / {{ n.budget }} filled</span>
      <span class="holders" *ngIf="n.holders?.length">{{ names(n.holders) }}</span>
    </div>
    <app-org-tree *ngIf="n.children?.length && isOpen(n)" [nodes]="n.children" [depth]="depth + 1"></app-org-tree>
  </li>
</ul>`,
})
export class OrgTreeComponent {
  @Input() nodes: any[] = [];
  @Input() depth = 0;
  open: Record<string, boolean> = {};
  get root(): boolean { return this.depth === 0; }
  isOpen(n: any): boolean { return this.open[n.id] ?? this.depth < 2; }
  names(h: any[]): string { return h.map(x => x.name).join(', '); }
}

/**
 * v1.12.0 – Reporting hierarchy: the position tree (job positions → reports to) and the reporting-manager tree,
 * loops in either chain, and employees without a (valid) reporting manager.
 * API: GET org-structure/api/hierarchy/?mode=positions|managers&root= · GET hierarchy/no-manager/
 */
@Component({
  selector: 'app-org-hierarchy',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective, OrgTreeComponent],
  styleUrls: ['../leave-policy/leave-policy.css', './org-structure.css'],
  template: `
<div class="container os-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Reporting hierarchy</h1>
          <p class="lp-desc">Who reports to whom – by reporting manager, or by job position when positions are used. Loops (A reports to B, B reports to A) are listed so you can fix them; the employee form refuses new ones.</p>
        </div>
      </div>
      <div class="lp-tabs">
        <button type="button" [class.on]="tab === 'managers'" (click)="go('managers')">By reporting manager</button>
        <button type="button" *ngIf="positionsOn" [class.on]="tab === 'positions'" (click)="go('positions')">By {{ posLabel.toLowerCase() }}</button>
        <button type="button" [class.on]="tab === 'none'" (click)="go('none')">Without a manager <span class="lp-badge" *ngIf="none.length">{{ none.length }}</span></button>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg err" *ngIf="msg" role="alert">{{ msg }}</div>
      <div class="lp-msg err" *ngIf="cycles.length" role="alert">
        Loops found – each line reports round in a circle: <ul class="ha-done"><li *ngFor="let c of cycles">{{ c.join(' → ') }} → {{ c[0] }}</li></ul>
      </div>
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <ng-container *ngIf="!loading && tab !== 'none'">
        <p class="lp-muted" *ngIf="!tree.length">Nothing to show yet{{ tab === 'positions' ? ' – add job positions with “Reports to”.' : '.' }}</p>
        <app-org-tree [nodes]="tree"></app-org-tree>
      </ng-container>
      <ng-container *ngIf="!loading && tab === 'none'">
        <p class="lp-muted" *ngIf="!none.length">Every active employee has a valid reporting manager.</p>
        <table class="table" *ngIf="none.length">
          <thead><tr><th>Employee</th><th>Branch</th><th>Department</th><th>Designation</th><th>Problem</th></tr></thead>
          <tbody><tr *ngFor="let r of none"><td data-label="Employee">{{ r.employee }}</td><td data-label="Branch">{{ r.branch }}</td>
            <td data-label="Department">{{ r.department }}</td><td data-label="Designation">{{ r.designation }}</td><td data-label="Problem">{{ r.problem }}</td></tr></tbody>
        </table>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class OrgHierarchyComponent implements OnInit {
  tab: 'managers' | 'positions' | 'none' = 'managers';
  tree: any[] = []; cycles: string[][] = []; none: any[] = [];
  loading = false; msg = ''; positionsOn = false; posLabel = 'Job position';

  constructor(private http: HttpClient, private org: OrgSettingsService, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.org.api}${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }

  ngOnInit(): void {
    this.org.load().subscribe(s => {
      this.positionsOn = this.org.isOn('job_positions', s); this.posLabel = this.org.label('job_positions', s);
      if (this.positionsOn) { this.tab = 'positions'; }
      this.go(this.tab);
      this.loadNone();
    });
  }

  async go(t: 'managers' | 'positions' | 'none'): Promise<void> {
    this.tab = t; this.msg = '';
    if (t === 'none') { this.cd.markForCheck(); return; }
    this.loading = true; this.cd.markForCheck();
    try {
      const d = await firstValueFrom(this.http.get<any>(this.url('hierarchy/', `&mode=${t}`)));
      this.tree = d?.tree || []; this.cycles = d?.cycles || [];
    } catch (e: any) { this.tree = []; this.cycles = []; this.msg = e?.error?.detail || 'The hierarchy could not be loaded.'; }
    this.loading = false; this.cd.markForCheck();
  }

  private async loadNone(): Promise<void> {
    try { this.none = (await firstValueFrom(this.http.get<any>(this.url('hierarchy/no-manager/'))))?.rows || []; } catch { this.none = []; }
    this.cd.markForCheck();
  }
}
