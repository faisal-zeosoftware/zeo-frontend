import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from '../login/authentication.service';
import { SchemaCreationComponent } from '../schema-creation/schema-creation.component';
import { environment } from '../../environments/environment';
import { APP_VERSION } from '../shared-ui/version';
import { i18nT } from '../shared-ui/i18n-core';

interface MyCompany {
  id: number; name: string; schema_name: string; country: string; city: string; industry: string;
  state_label: string; logo: string; apps: string[]; neutralized?: boolean; copy_of?: string;
  account?: number | null; extra?: boolean; where?: string; read_only?: boolean; moving?: boolean;   // v1.23.0 ZEO Cloud (moving: v1.24.0)
}

/** v1.23.0 ZEO Cloud account of the companies in the list */
interface CloudAcc {
  id: number; name: string; role: 'owner' | 'member'; plan: string; plan_code: string; status: string; read_only: boolean;
  days_left: number | null; group_features: boolean; can_create: boolean; next_is_extra: boolean; create_note: string;
}
interface MakeJob {
  acc: CloudAcc; name: string; industry: string; apps: { key: string; title: string; ok: boolean; on: boolean; note: string }[];
  state: 'ask' | 'running' | 'done' | 'failed'; error: string; job: string; schema: string; stepNo: number; companyId: number | null;
}

interface DupJob {
  source: MyCompany; name: string; neutralize: boolean; state: 'ask' | 'running' | 'done' | 'failed';
  error: string; job: string; schema: string; stepNo: number; companyId: number | null;
}

/**
 * v1.22.2 – the companies of the signed-in user as a list (like the Odoo database list): one click opens a company.
 * Replaces the "Select company" drop-down. Data: GET /users/api/my-companies/ (only the user's own companies).
 * Opening a company stores the same keys as before (selectedSchema, selectedSchemaId, selectedSchemaStateLabel).
 */
@Component({
  selector: 'app-schema-selection',
  templateUrl: './schema-selection.component.html',
  styleUrl: './schema-selection.component.css'
})
export class SchemaSelectionComponent implements OnInit, OnDestroy {
  companies: MyCompany[] = [];
  me: { id: number; username: string; email: string; name: string } | null = null;
  canCreate = false;
  loading = true;
  error = '';
  query = '';
  opening = '';
  last = '';
  version = APP_VERSION;
  // v1.22.3 – duplicate a company
  dup: DupJob | null = null;
  fresh = '';
  dupSteps = ['Copying the data', 'Registering the company', 'Giving access to the users', 'Finishing'];
  private poll: any = null;
  // v1.23.0 ZEO Cloud
  accounts: CloudAcc[] = [];
  notices: { id: number; text: string }[] = [];
  platformAdmin = false;
  mk: MakeJob | null = null;
  mkSteps = ['Creating the company', 'Setting up the apps', 'Giving access', 'Finishing'];
  industries: { code: string; label: string }[] = [];

  constructor(private http: HttpClient, private authService: AuthenticationService, private dialog: MatDialog) {}

  ngOnInit(): void {
    try { this.last = localStorage.getItem('zeo:lastCompany') || ''; } catch { this.last = ''; }
    this.load();
  }

  load(quiet = false): void {
    this.loading = !quiet; this.error = '';
    this.http.get<any>(`${environment.apiBaseUrl}/users/api/my-companies/`).subscribe({
      next: r => {
        this.me = r.user || null;
        this.canCreate = !!r.can_create;
        this.accounts = r.accounts || [];
        this.notices = r.notices || [];
        this.platformAdmin = !!r.platform_admin;
        const list: MyCompany[] = r.companies || [];
        // the company opened last comes first; the others by name
        this.companies = [...list.filter(c => c.schema_name === this.last), ...list.filter(c => c.schema_name !== this.last)];
        this.loading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.loading = false;
        this.error = e.status === 401 ? i18nT('Your session has ended. Sign in again.') : i18nT('The companies could not be loaded. Try again.');
      },
    });
  }

  shown(): MyCompany[] {
    const q = this.query.trim().toLowerCase();
    if (!q) { return this.companies; }
    return this.companies.filter(c => [c.name, c.country, c.city, c.industry, ...(c.apps || [])].join(' ').toLowerCase().includes(q));
  }

  meta(c: MyCompany): string {
    return [c.industry ? i18nT(c.industry) : '', [c.city, c.country].filter(Boolean).join(', ')].filter(Boolean).join(' – ');
  }

  initials(name: string): string {
    const words = String(name || '?').replace(/\b(LLC|L\.L\.C|FZE|FZCO|FZ-LLC|Co|Ltd|LLP)\b\.?/gi, '').trim().split(/\s+/).filter(Boolean);
    return ((words[0]?.[0] || '?') + (words[1]?.[0] || '')).toUpperCase();
  }

  tint(name: string): number {
    let h = 0;
    for (const ch of String(name || '')) { h = (h * 31 + ch.charCodeAt(0)) >>> 0; }
    return h % 4;
  }

  open(c: MyCompany): void {
    if (this.opening) { return; }
    this.opening = c.schema_name;
    try {
      localStorage.setItem('selectedSchema', c.schema_name);
      localStorage.setItem('selectedSchemaId', String(c.id));
      localStorage.setItem('selectedSchemaStateLabel', c.state_label || '');
      localStorage.setItem('zeo:lastCompany', c.schema_name);
    } catch { /* storage blocked */ }
    // a full load, so every service starts with the chosen company (as before)
    window.location.href = '/main-sidebar/dashboard-contents';
  }

  logout(): void {
    const done = () => {
      try { localStorage.removeItem('token'); localStorage.removeItem('auth_token'); } catch { /* storage blocked */ }
      window.location.href = '/login';
    };
    this.authService.logout().subscribe({ next: done, error: done });
  }

  // ---- v1.22.3 duplicate (like Odoo's "Duplicate database") ----
  askDuplicate(c: MyCompany): void {
    if (this.opening || this.dup) { return; }
    this.dup = { source: c, name: i18nT('{0} (copy)', [c.name]), neutralize: true, state: 'ask', error: '', job: '', schema: '',
      stepNo: 1, companyId: null };
  }

  runDuplicate(): void {
    const d = this.dup;
    if (!d || d.state !== 'ask') { return; }
    const name = d.name.trim();
    if (name.length < 2) { d.error = i18nT('Type a name of at least 2 letters.'); return; }
    if (this.companies.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) {
      d.error = i18nT('A company with this name already exists.'); return;
    }
    d.error = ''; d.name = name; d.state = 'running'; d.stepNo = 1;
    this.http.post<any>(`${environment.apiBaseUrl}/users/api/my-companies/${d.source.id}/duplicate/`, { name, neutralize: d.neutralize })
      .subscribe({
        next: r => { d.job = r.job; d.schema = r.schema; this.watch(d); },
        error: (e: HttpErrorResponse) => { d.state = 'ask'; d.error = i18nT((e.error && (e.error.detail || e.error.error)) || 'The copy could not be started. Try again.'); },
      });
  }

  private watch(d: DupJob): void {
    this.stopPoll();
    this.poll = setInterval(() => {
      this.http.get<any>(`${environment.apiBaseUrl}/users/api/my-companies/duplicate/${d.job}/`).subscribe({
        next: r => {
          d.stepNo = r.step_no || d.stepNo;
          if (r.state === 'done') {
            this.stopPoll(); d.state = 'done'; d.companyId = r.company_id; this.fresh = d.schema; this.load(true);
          } else if (r.state === 'failed') {
            this.stopPoll(); d.state = 'failed'; d.error = r.error || i18nT('Unknown error.');
          }
        },
        error: () => { /* keep trying while the server works */ },
      });
    }, 1500);
  }

  private stopPoll(): void { if (this.poll) { clearInterval(this.poll); this.poll = null; } }

  closeDuplicate(): void {
    if (this.dup?.state === 'running') { return; }
    this.dup = null;
  }

  openNew(): void {
    const d = this.dup;
    if (!d || !d.companyId) { return; }
    const c = this.companies.find(x => x.id === d.companyId) ||
      { id: d.companyId, name: d.name, schema_name: d.schema, state_label: '' } as MyCompany;
    this.dup = null;
    this.open(c);
  }

  ngOnDestroy(): void { this.stopPoll(); }

  // ---- v1.23.0 ZEO Cloud: grouped by account, create a company in an account ----
  groups(): { acc: CloudAcc | null; list: MyCompany[] }[] {
    const shown = this.shown();
    const out: { acc: CloudAcc | null; list: MyCompany[] }[] = this.accounts.map(a => ({ acc: a, list: shown.filter(c => c.account === a.id) }));
    const rest = shown.filter(c => !c.account || !this.accounts.some(a => a.id === c.account));
    if (rest.length || !out.length) { out.push({ acc: null, list: rest }); }
    return out.filter(g => g.list.length || (g.acc && g.acc.role === 'owner' && !this.query.trim()));
  }

  trackG(_: number, g: { acc: CloudAcc | null }): any { return g.acc ? g.acc.id : 'other'; }
  trackC(_: number, c: MyCompany): string { return c.schema_name; }

  ownsAcc(c: MyCompany): boolean { return !!c.account && this.accounts.some(a => a.id === c.account && a.role === 'owner'); }

  statusLabel(a: CloudAcc): string {
    if (a.status === 'trial') { return i18nT('Trial – {0} days left', [a.days_left ?? 0]); }
    return i18nT(({ grace: 'Grace period', suspended: 'Read-only', cancelled: 'Cancelled' } as any)[a.status] || a.status);
  }

  seenNotices(): void {
    this.notices = [];
    this.http.post(`${environment.apiBaseUrl}/cloud/api/notices/seen/`, {}).subscribe({ error: () => undefined });
  }

  askCreate(a: CloudAcc): void {
    const titles: Record<string, string> = { payroll: 'Payroll', projects: 'Projects', crm: 'CRM', property: 'Property', maintenance: 'Maintenance', hse: 'HSE' };
    this.mk = { acc: a, name: '', industry: 'OTH', apps: [], state: 'ask', error: '', job: '', schema: '', stepNo: 1, companyId: null };
    if (!this.industries.length) {
      this.http.get<any>(`${environment.apiBaseUrl}/cloud/api/signup/plans/`).subscribe({ next: r => this.industries = r.industries || [] });
    }
    this.http.get<any>(`${environment.apiBaseUrl}/cloud/api/accounts/${a.id}/subscription/`).subscribe({
      next: r => {
        if (!this.mk) { return; }
        this.mk.apps = Object.keys(titles).map(k => {
          const l = r.apps?.[k] || { state: 'none' };
          const full = l.companies && (l.used ?? 0) >= l.companies;
          const ok = (l.state === 'licensed' || l.state === 'trial') && !full;
          const note = l.state === 'none' ? 'not in plan' : l.state === 'expired' ? 'licence ended' : full ? 'all places used' : l.state === 'trial' ? 'trial' : '';
          return { key: k, title: titles[k], ok, on: false, note };
        });
      },
      error: (e: HttpErrorResponse) => { if (this.mk) { this.mk.error = e.error?.detail || i18nT('The plan could not be loaded.'); } },
    });
  }

  picked(): boolean { return !!this.mk?.apps.some(a => a.on); }

  runCreate(): void {
    const m = this.mk;
    if (!m || m.state !== 'ask') { return; }
    const name = m.name.trim();
    if (this.companies.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) { m.error = i18nT('A company with this name already exists.'); return; }
    m.error = ''; m.state = 'running'; m.stepNo = 1;
    this.http.post<any>(`${environment.apiBaseUrl}/cloud/api/accounts/${m.acc.id}/companies/`,
      { name, industry: m.industry, apps: m.apps.filter(a => a.on).map(a => a.key) }).subscribe({
      next: r => { m.job = r.job; m.schema = r.schema; this.watchMake(m); },
      error: (e: HttpErrorResponse) => { m.state = 'ask'; m.error = i18nT(e.error?.detail || 'The company could not be created. Try again.'); },
    });
  }

  private watchMake(m: MakeJob): void {
    this.stopPoll();
    this.poll = setInterval(() => {
      this.http.get<any>(`${environment.apiBaseUrl}/cloud/api/jobs/${m.job}/`).subscribe({
        next: r => {
          m.stepNo = r.step_no || m.stepNo;
          if (r.state === 'done') { this.stopPoll(); m.state = 'done'; m.companyId = r.company_id; this.fresh = m.schema; this.load(true); }
          else if (r.state === 'failed') { this.stopPoll(); m.state = 'failed'; m.error = r.error || i18nT('Unknown error.'); }
        },
        error: () => { /* keep trying */ },
      });
    }, 2000);
  }

  openMade(): void {
    const m = this.mk;
    if (!m || !m.companyId) { return; }
    const c = this.companies.find(x => x.id === m.companyId) || { id: m.companyId, name: m.name, schema_name: m.schema, state_label: '' } as MyCompany;
    this.mk = null;
    this.open(c);
  }

  openPopuss(): void {
    const ref = this.dialog.open(SchemaCreationComponent, { width: '80%', height: '700px' });
    ref.afterClosed().subscribe(() => this.load());
  }
}
