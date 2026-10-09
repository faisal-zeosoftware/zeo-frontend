import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ZRecordPanelComponent } from '../shared-ui/z-record-panel.component';
import { recordUrl } from '../shared-ui/z-nav';

/**
 * v1.8.1 – the root record behind a report row or a dashboard figure:
 * its fields, its lines, the employee, a way to open it on its own screen, and its notes, files and history.
 */
@Component({
  selector: 'app-z-record-view',
  standalone: true,
  imports: [CommonModule, RouterModule, ZRecordPanelComponent],
  styleUrls: ['./z-report.component.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="zq-head">
        <div>
          <button type="button" class="zw-back" (click)="back()">‹ Back</button>
          <p class="zw-kind" *ngIf="data">{{ data.kind }}</p>
          <h1 class="page-title">{{ data?.title || 'Record' }}</h1>
          <p class="zq-desc" *ngIf="data?.employee">Employee: <a [routerLink]="data.employee.page">{{ data.employee.name }}</a></p>
        </div>
        <div class="zq-side" *ngIf="data">
          <a class="zq-mail" *ngIf="data.screen" [routerLink]="data.screen.route" [queryParams]="data.screen.find ? { zq: data.screen.find } : {}"
             [title]="'Open ' + data.screen.name + (data.screen.find ? ' with ' + data.screen.find + ' searched' : '')">Open in {{ data.screen.name }}</a>
          <a class="zq-mail" *ngIf="data.page" [routerLink]="data.page">Open full page</a>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <p class="zq-msg" *ngIf="loading">Opening the record…</p>
      <p class="zq-msg zq-err" *ngIf="error">{{ error }}</p>
      <ng-container *ngIf="data && !loading">
        <dl class="zw-grid">
          <div *ngFor="let f of shown">
            <dt>{{ f.label }}</dt>
            <dd>
              <a *ngIf="f.link?.m" [routerLink]="url(f.link)">{{ f.value }}</a>
              <a *ngIf="f.link?.file" [href]="file(f.link.file)" target="_blank" rel="noopener">{{ f.value }}</a>
              <span *ngIf="!f.link">{{ f.value === '' ? '–' : f.value }}</span>
            </dd>
          </div>
        </dl>
        <button type="button" class="zw-more" *ngIf="empty.length" (click)="all = !all">{{ all ? 'Hide empty fields' : 'Show ' + empty.length + ' empty fields' }}</button>

        <section class="zw-child" *ngFor="let c of data.children">
          <h2>{{ c.title }} <small>{{ c.rows.length }}{{ c.rows.length === 50 ? '+' : '' }}</small></h2>
          <table zPlain class="zw-table">
            <thead><tr><th *ngFor="let h of c.columns">{{ h }}</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of c.rows" (click)="go(r.m, r.id)" tabindex="0" (keydown.enter)="go(r.m, r.id)">
                <td *ngFor="let x of r.cells; let i = index" [attr.data-label]="c.columns[i]">{{ x.value === '' ? '–' : x.value }}</td>
                <td class="zq-open"><span aria-hidden="true">›</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="zw-panel" *ngIf="data.endpoint">
          <z-record-panel [endpoint]="data.endpoint" [id]="'' + data.id" mode="page" [screenName]="data.kind"></z-record-panel>
        </section>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class ZRecordViewComponent implements OnInit, OnDestroy {
  data: any = null;
  loading = false;
  error = '';
  all = false;
  private sub?: Subscription;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient, private rec: ZRecordService,
              private loc: Location, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(p => this.load(p.get('label') || '', p.get('id') || ''));
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  get shown(): any[] { return (this.data?.fields || []).filter((f: any) => this.all || f.value !== ''); }
  get empty(): any[] { return (this.data?.fields || []).filter((f: any) => f.value === ''); }

  private async load(label: string, id: string): Promise<void> {
    this.loading = true; this.error = ''; this.data = null; this.all = false; this.cd.detectChanges();
    const s = localStorage.getItem('selectedSchema') || '';
    try {
      this.data = await firstValueFrom(this.http.get<any>(`${this.rec.api}/dashboard/api/record/${encodeURIComponent(label)}/${encodeURIComponent(id)}/?schema=${encodeURIComponent(s)}`));
    } catch (e: any) {
      this.error = e?.error?.detail || 'The record could not be opened.';
    }
    this.loading = false; this.cd.detectChanges();
  }

  url(l: any): string { return recordUrl(l.m, l.id); }
  file(u: string): string { return /^https?:/.test(u) ? u : this.rec.api + u; }
  go(m: string, id: any): void { this.router.navigateByUrl(recordUrl(m, id)); }
  back(): void { history.length > 1 ? this.loc.back() : this.router.navigateByUrl('/main-sidebar/report-options/r/employees'); }
}
