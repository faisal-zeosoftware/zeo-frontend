import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';

/** v1.28.0 – console → Enterprise: requests from the sign-up page and from owners (Enterprise is always through Adept),
 * signed licence files (.zeolic) for clients' own servers. */
const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);
const API = () => `${environment.apiBaseUrl}/licence/api/console`;

@Component({
  selector: 'z-console-enterprise',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './cloud.css', './console.css'],
  template: `
  <div class="zk-head"><h1>{{ 'Enterprise' | t }}</h1></div>
  <p class="zk-note">{{ 'Enterprise runs on the client\\'s own servers. Clients ask for it here (sign-up page or Settings → Subscription); Adept answers and issues a signed licence file for the installation ID shown in the client\\'s Settings → Licence.' | t }}</p>
  <div class="lp-msg" [class.err]="bad" *ngIf="msg" role="status">{{ msg }}</div>
  <div class="lp-msg err" *ngIf="keys && !keys.can_sign" role="alert">{{ 'Licences cannot be signed on this server:' | t }} {{ keys.problem }}</div>

  <div class="zk-card" id="issue">
    <h2>{{ 'Issue a licence file' | t }}</h2>
    <div class="lp-form">
      <label>{{ 'Client' | t }}<input [(ngModel)]="f.client"></label>
      <label>{{ 'Installation ID' | t }}<input [(ngModel)]="f.installation_id" placeholder="ZEO-…"></label>
      <label>{{ 'Valid from' | t }}<input type="date" [(ngModel)]="f.valid_from"></label>
      <label>{{ 'Valid until' | t }}<input type="date" [(ngModel)]="f.valid_until"></label>
      <label>{{ 'Companies (empty = no limit)' | t }}<input type="number" min="1" [(ngModel)]="f.limits.companies"></label>
      <label>{{ 'Employees (empty = no limit)' | t }}<input type="number" min="1" [(ngModel)]="f.limits.employees"></label>
      <label>{{ 'Users (empty = no limit)' | t }}<input type="number" min="1" [(ngModel)]="f.limits.users"></label>
      <label>{{ 'Request' | t }}<select [(ngModel)]="f.request_id"><option [ngValue]="null">–</option><option *ngFor="let r of requests" [ngValue]="r.id">{{ r.company }} ({{ r.created_at | date:'d MMM y' }})</option></select></label>
      <div class="wide"><span class="zk-note">{{ 'Apps' | t }}</span><div class="cc-apps">
        <label class="cc-inline" *ngFor="let a of apps"><input type="checkbox" [(ngModel)]="f.appsOn[a]" [disabled]="a === 'hrms'"> {{ appName(a) }}</label></div></div>
      <label class="wide cc-inline"><input type="checkbox" [(ngModel)]="f.group"> {{ 'Group features (group dashboard, reports, approvals, copy settings, transfers)' | t }}</label>
      <label class="wide">{{ 'Note (Adept only)' | t }}<input [(ngModel)]="f.note"></label>
    </div>
    <div class="zk-row"><span class="zk-sp"></span><button type="button" class="lp-btn primary" (click)="issue()" [disabled]="busy || !keys?.can_sign">{{ 'Issue and download' | t }}</button></div>
  </div>

  <div class="zk-card"><h2>{{ 'Licences issued' | t }}</h2><div class="zk-scroll"><table class="zk-table">
    <tr><th>{{ 'Client' | t }}</th><th>{{ 'Installation' | t }}</th><th>{{ 'Valid' | t }}</th><th>{{ 'Limits' | t }}</th><th>{{ 'Apps' | t }}</th><th>{{ 'Issued' | t }}</th><th></th></tr>
    <tr *ngFor="let x of licences"><td>{{ x.client }}<small>{{ x.licence_id }}</small></td><td><code class="cc-id">{{ x.installation_id }}</code></td>
      <td class="cc-nw">{{ x.valid_from }}<small>– {{ x.valid_until }}</small></td><td>{{ limitsText(x.limits) }}</td><td>{{ appsText(x.apps) }}{{ x.features.includes('group') ? ' · ' + ('group' | t) : '' }}</td>
      <td>{{ x.issued_at | date:'d MMM y' }}<small>{{ x.issued_by }}</small></td>
      <td><button type="button" class="lp-btn" (click)="download(x)">{{ 'Download' | t }}</button> <button type="button" class="lp-btn" (click)="renew(x)">{{ 'Renew' | t }}</button></td></tr>
    <tr *ngIf="!licences.length"><td colspan="7" class="zk-note">{{ 'No licences yet.' | t }}</td></tr>
  </table></div></div>

  <div class="zk-card"><h2>{{ 'Enterprise requests' | t }}</h2><div class="zk-scroll"><table class="zk-table">
    <tr><th>{{ 'Date' | t }}</th><th>{{ 'Company' | t }}</th><th>{{ 'Contact' | t }}</th><th>{{ 'Size' | t }}</th><th>{{ 'Message' | t }}</th><th>{{ 'Status' | t }}</th><th></th></tr>
    <tr *ngFor="let r of requests"><td>{{ r.created_at | date:'d MMM y' }}</td><td>{{ r.company }}<small *ngIf="r.account">{{ 'ZEO Cloud' | t }}: {{ r.account }}</small><small>{{ r.country }}</small></td>
      <td>{{ r.name }}<small><a [href]="'mailto:' + r.email">{{ r.email }}</a> {{ r.phone }}</small></td>
      <td>{{ r.employees || '–' }} {{ 'employees' | t }}<small>{{ r.companies || '–' }} {{ 'companies' | t }}</small></td>
      <td class="cc-msg">{{ r.message }}</td>
      <td><select [(ngModel)]="r.state" (ngModelChange)="saveReq(r)"><option value="new">{{ 'New' | t }}</option><option value="contacted">{{ 'Contacted' | t }}</option><option value="licensed">{{ 'Licence issued' | t }}</option><option value="closed">{{ 'Closed' | t }}</option></select></td>
      <td><button type="button" class="lp-btn" (click)="fromRequest(r)">{{ 'Issue licence' | t }}</button></td></tr>
    <tr *ngIf="!requests.length"><td colspan="7" class="zk-note">{{ 'No requests yet.' | t }}</td></tr>
  </table></div></div>`,
})
export class ZConsoleEnterpriseComponent implements OnInit {
  keys: any = null; apps: string[] = []; licences: any[] = []; requests: any[] = [];
  f: any = this.blank(); busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  private blank(): any {
    const d = new Date(); const ymd = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    const until = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate() - 1);
    return { client: '', installation_id: '', valid_from: ymd(d), valid_until: ymd(until), limits: { companies: null, employees: null, users: null },
             appsOn: { hrms: true, payroll: true }, group: true, note: '', request_id: null };
  }
  load(): void {
    this.http.get<any>(`${API()}/licences/`).subscribe({ next: r => { this.keys = r; this.apps = r.apps || []; this.licences = r.licences || []; this.cd.markForCheck(); } });
    this.http.get<any>(`${API()}/requests/`).subscribe({ next: r => { this.requests = r.requests || []; this.cd.markForCheck(); } });
  }
  appName(a: string): string { return ({ hrms: 'HR', payroll: 'Payroll', projects: 'Projects', crm: 'CRM', property: 'Property', maintenance: 'Maintenance', hse: 'HSE' } as any)[a] || a; }
  appsText(a: string[]): string { return (a || []).map(x => this.appName(x)).join(', '); }
  limitsText(l: any): string {
    const p = ['companies', 'employees', 'users'].filter(k => l?.[k]).map(k => `${l[k]} ${T(k)}`);
    return p.join(' · ') || T('no limit');
  }
  say(m: string, bad: boolean): void { this.msg = m; this.bad = bad; this.cd.markForCheck(); }
  issue(): void {
    const body = { ...this.f, apps: Object.keys(this.f.appsOn).filter(k => this.f.appsOn[k]), features: this.f.group ? ['group'] : [],
                   limits: Object.fromEntries(Object.entries(this.f.limits).filter(([, v]) => v !== null && v !== '').map(([k, v]) => [k, String(v)])) };
    this.busy = true;
    this.http.post<any>(`${API()}/licences/`, body).subscribe({
      next: x => { this.busy = false; this.say(T('Licence {0} issued for {1} – the file is downloaded.', x.licence_id, x.client), false); this.download(x); this.f = this.blank(); this.load(); },
      error: e => { this.busy = false; this.say(e?.error?.detail || T('The licence could not be issued.'), true); },
    });
  }
  download(x: any): void {
    this.http.get(`${API()}/licences/${x.id}/download/`, { responseType: 'blob' }).subscribe(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b);
      a.download = `${(x.client || 'client').replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/ /g, '_')}_${x.valid_until}.zeolic`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });
  }
  renew(x: any): void {
    const until = new Date(x.valid_until); until.setFullYear(until.getFullYear() + 1);
    const from = new Date(x.valid_until); from.setDate(from.getDate() + 1);
    const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.f = { client: x.client, installation_id: x.installation_id, valid_from: ymd(from), valid_until: ymd(until),
               limits: { companies: x.limits?.companies ?? null, employees: x.limits?.employees ?? null, users: x.limits?.users ?? null },
               appsOn: Object.fromEntries((x.apps || []).map((a: string) => [a, true])), group: (x.features || []).includes('group'), note: '', request_id: x.request_id };
    document.getElementById('issue')?.scrollIntoView({ behavior: 'smooth' });
  }
  fromRequest(r: any): void {
    this.f = { ...this.blank(), client: r.company, request_id: r.id, limits: { companies: r.companies || null, employees: r.employees || null, users: null } };
    document.getElementById('issue')?.scrollIntoView({ behavior: 'smooth' });
  }
  saveReq(r: any): void {
    this.http.patch<any>(`${API()}/requests/${r.id}/`, { state: r.state }).subscribe({ error: () => this.say(T('Not saved.'), true) });
  }
}
