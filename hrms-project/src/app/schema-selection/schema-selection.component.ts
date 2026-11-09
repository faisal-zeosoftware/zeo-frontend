import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from '../login/authentication.service';
import { SchemaCreationComponent } from '../schema-creation/schema-creation.component';
import { environment } from '../../environments/environment';
import { APP_VERSION } from '../shared-ui/version';
import { i18nT } from '../shared-ui/i18n-core';
import { zConfirm } from '../shared-ui/z-confirm';   // v1.67.1 (companies)

interface MyCompany {
  id: number; name: string; schema_name: string; country: string; city: string; industry: string;
  state_label: string; logo: string; apps: string[]; neutralized?: boolean; copy_of?: string;
  account?: number | null; extra?: boolean; where?: string; read_only?: boolean; moving?: boolean;   // v1.23.0 ZEO Cloud (moving: v1.24.0)
  // v1.67.1 (companies): inactive companies are listed only for their owner / administrators; can_manage = may make
  // inactive / active and delete
  state?: 'active' | 'inactive'; can_manage?: boolean; inactive_by?: string; inactive_at?: string; inactive_db?: boolean;
}

/** v1.23.0 ZEO Cloud account of the companies in the list */
interface CloudAcc {
  id: number; name: string; role: 'owner' | 'member'; plan: string; plan_code: string; status: string; read_only: boolean;
  days_left: number | null; group_features: boolean; can_create: boolean; next_is_extra: boolean; create_note: string;
  databases?: { key: string; label: string; default: boolean }[];   // v1.26.0 Premium: own databases to create the company in
}
/** v1.26.0 invitation of this login to another company */
interface Invite { id: number; company: string; account: string; invited_by: string; is_superuser: boolean; busy?: boolean; error?: string; }
interface MakeJob {
  acc: CloudAcc; name: string; industry: string; apps: { key: string; title: string; ok: boolean; on: boolean; note: string }[];
  state: 'ask' | 'running' | 'done' | 'failed'; error: string; job: string; schema: string; stepNo: number; companyId: number | null;
  db: string; st?: any;   // v1.62.1 job status for <z-job-progress>
}

interface DupJob {
  source: MyCompany; name: string; neutralize: boolean; state: 'ask' | 'running' | 'done' | 'failed';
  error: string; job: string; schema: string; stepNo: number; companyId: number | null; st?: any;   // v1.62.1
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
  groupKeys: Record<string, boolean> = {};   // v1.27.0 group views this person may open
  platformAdmin = false;
  mk: MakeJob | null = null;
  mkSteps = ['Creating the company', 'Setting up the apps', 'Giving access', 'Finishing'];
  industries: { code: string; label: string }[] = [];
  invites: Invite[] = [];   // v1.26.0
  invitedMsg = '';
  // v1.67.1 (companies) make inactive / active, delete
  busyLife = '';
  lifeMsg = '';
  lifeErr = '';

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
        this.http.get<any>(`${environment.apiBaseUrl}/group/api/`).subscribe({   // v1.27.0
          next: g => { this.groupKeys = {}; (g.groups || []).filter((x: any) => x.features).forEach((x: any) => this.groupKeys[x.key] = true); },
          error: () => { this.groupKeys = {}; } });
        this.notices = (r.notices || []).filter((n: any, i: number, a: any[]) => a.findIndex(x => x.text === n.text) === i);   // v1.26.0: the same notice once
        this.invites = r.invites || [];
        this.platformAdmin = !!r.platform_admin;
        const list: MyCompany[] = r.companies || [];
        // the company opened last comes first; the others by name
        this.companies = [...list.filter(c => c.schema_name === this.last), ...list.filter(c => c.schema_name !== this.last)];
        this.loading = false;
        // v1.62.1: "open this company next time" – straight into the last company (the top-bar menu still switches)
        if (this.autoOpen && this.last && !new URLSearchParams(location.search).has('choose')) {
          const c = this.companies.find(x => x.schema_name === this.last && !x.moving && x.state !== 'inactive');   // v1.67.1 (companies)
          if (c) { this.open(c); }
        }
      },
      error: (e: HttpErrorResponse) => {
        this.loading = false;
        this.error = e.status === 401 ? i18nT('Your session has ended. Sign in again.') : i18nT('The companies could not be loaded. Try again.');
      },
    });
  }

  // ---- v1.62.1 favourites (star), recent, open next time, ⋯ menu ----
  menuFor = '';
  get favs(): string[] { try { return JSON.parse(localStorage.getItem('zeo:favCompanies') || '[]'); } catch { return []; } }
  isFav(c: MyCompany): boolean { return this.favs.includes(c.schema_name); }
  toggleFav(c: MyCompany, ev: Event): void {
    ev.stopPropagation();
    const f = this.favs; const i = f.indexOf(c.schema_name);
    if (i >= 0) { f.splice(i, 1); } else { f.push(c.schema_name); }
    try { localStorage.setItem('zeo:favCompanies', JSON.stringify(f)); } catch { /* storage blocked */ }
  }
  get autoOpen(): boolean { try { return localStorage.getItem('zeo:autoOpenCompany') === '1'; } catch { return false; } }
  setAutoOpen(on: boolean): void { try { on ? localStorage.setItem('zeo:autoOpenCompany', '1') : localStorage.removeItem('zeo:autoOpenCompany'); } catch { /* */ } }
  /** favourites and the recently opened companies, shown on top (with more than 3 companies, no search) */
  quick(): MyCompany[] {
    if (this.query.trim() || this.companies.length <= 3) { return []; }
    let recent: string[] = [];
    try { recent = JSON.parse(localStorage.getItem('zeoRecentCompanies') || '[]'); } catch { recent = []; }
    const keys = [...this.favs, ...(this.last ? [this.last] : []), ...recent].filter((k, i, a) => a.indexOf(k) === i);
    return keys.map(k => this.companies.find(c => c.schema_name === k)).filter(Boolean).slice(0, 6) as MyCompany[];
  }

  shown(): MyCompany[] {
    const q = this.query.trim().toLowerCase();
    if (!q) { return this.companies; }
    return this.companies.filter(c => [c.name, c.country, c.city, c.industry, ...(c.apps || [])].join(' ').toLowerCase().includes(q));
  }

  meta(c: MyCompany): string {
    // v1.67.9 (screens) item 19: the country in the reader's language (Arabic showed "United Arab Emirates"); Arabic comma
    const ar = /^ar/.test(localStorage.getItem('zeoLang') || '');
    return [c.industry ? i18nT(c.industry) : '', [c.city, c.country ? i18nT(c.country) : ''].filter(Boolean).join(ar ? '، ' : ', ')].filter(Boolean).join(' – ');
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

  open(c: MyCompany, to = ''): void {   // v1.62.1 to: the page to open (the new company's setup guide)
    if (this.opening) { return; }
    this.opening = c.schema_name;
    try {
      localStorage.setItem('selectedSchema', c.schema_name);
      localStorage.setItem('selectedSchemaId', String(c.id));
      localStorage.setItem('selectedSchemaStateLabel', c.state_label || '');
      localStorage.setItem('zeo:lastCompany', c.schema_name);
      const r = JSON.parse(localStorage.getItem('zeoRecentCompanies') || '[]');   // v1.62.1 recent (shared with the top-bar menu)
      localStorage.setItem('zeoRecentCompanies', JSON.stringify([c.schema_name, ...r.filter((x: string) => x !== c.schema_name)].slice(0, 8)));
    } catch { /* storage blocked */ }
    // a full load, so every service starts with the chosen company (as before)
    window.location.href = to || '/main-sidebar/dashboard-contents';
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
          d.st = r;   // v1.62.1
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
    const db = (a.databases || []).find(d => d.default)?.key || '';
    this.mk = { acc: a, name: '', industry: 'OTH', apps: [], state: 'ask', error: '', job: '', schema: '', stepNo: 1, companyId: null, db };
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
      { name, industry: m.industry, apps: m.apps.filter(a => a.on).map(a => a.key), db: m.db || undefined }).subscribe({
      next: r => { m.job = r.job; m.schema = r.schema; this.watchMake(m); },
      error: (e: HttpErrorResponse) => { m.state = 'ask'; m.error = i18nT(e.error?.detail || 'The company could not be created. Try again.'); },
    });
  }

  private watchMake(m: MakeJob): void {
    this.stopPoll();
    this.poll = setInterval(() => {
      this.http.get<any>(`${environment.apiBaseUrl}/cloud/api/jobs/${m.job}/`).subscribe({
        next: r => {
          m.st = r;   // v1.62.1
          m.stepNo = r.step_no || m.stepNo;
          if (r.state === 'done') { this.stopPoll(); m.state = 'done'; m.companyId = r.company_id; this.fresh = m.schema; this.load(true); }
          else if (r.state === 'failed') { this.stopPoll(); m.state = 'failed'; m.error = r.error || i18nT('Unknown error.'); }
        },
        error: () => { /* keep trying */ },
      });
    }, 2000);
  }

  openMade(to = ''): void {
    const m = this.mk;
    if (!m || !m.companyId) { return; }
    const c = this.companies.find(x => x.id === m.companyId) || { id: m.companyId, name: m.name, schema_name: m.schema, state_label: '' } as MyCompany;
    this.mk = null;
    this.open(c, to);
  }

  /** v1.26.0: accept or decline an invitation – on accept the company is added to this login and shows in the list. */
  answerInvite(i: Invite, action: 'accept' | 'decline'): void {
    i.busy = true; i.error = '';
    this.http.post<any>(`${environment.apiBaseUrl}/users/api/invites/${i.id}/`, { action }).subscribe({
      next: r => {
        this.invites = this.invites.filter(x => x !== i);
        if (action === 'accept') { this.invitedMsg = r.detail || i18nT('{0} was added to your companies.', [i.company]); this.fresh = r.schema_name || ''; this.load(true); }
      },
      error: (e: HttpErrorResponse) => { i.busy = false; i.error = e.error?.detail || i18nT('Not done. Try again.'); },
    });
  }

  // ---- v1.67.1 (companies) Make inactive / Make active / Delete company ----
  private lifeUrl(c: MyCompany, what = 'life'): string { return `${environment.apiBaseUrl}/cloud/api/companies/${c.id}/${what}/`; }

  async makeInactive(c: MyCompany): Promise<void> {
    this.lifeMsg = ''; this.lifeErr = '';
    const ok = await zConfirm(i18nT('Nobody can sign in to {0} or use it while it is inactive, and it is hidden from its users. Nothing is deleted – you can make it active again here at any time.', [c.name]),
      { title: i18nT('Make {0} inactive?', [c.name]), ok: 'Make inactive', danger: true });
    if (!ok) { return; }
    this.http.post<any>(this.lifeUrl(c), { action: 'inactive' }).subscribe({
      next: () => { this.lifeMsg = i18nT('{0} is inactive.', [c.name]); if (this.last === c.schema_name) { this.last = ''; } this.load(true); },
      error: (e: HttpErrorResponse) => { this.lifeErr = i18nT(e.error?.detail || 'Not done. Try again.'); },
    });
  }

  async makeActive(c: MyCompany): Promise<void> {
    this.lifeMsg = ''; this.lifeErr = '';
    const ok = await zConfirm(i18nT('Its users can sign in to {0} again.', [c.name]), { title: i18nT('Make {0} active?', [c.name]), ok: 'Make active' });
    if (!ok) { return; }
    this.http.post<any>(this.lifeUrl(c), { action: 'active' }).subscribe({
      next: () => { this.lifeMsg = i18nT('{0} is active again.', [c.name]); this.load(true); },
      error: (e: HttpErrorResponse) => { this.lifeErr = i18nT(e.error?.detail || 'Not done. Try again.'); },
    });
  }

  deleteCompany(c: MyCompany): void {
    this.lifeMsg = ''; this.lifeErr = '';
    this.http.get<any>(this.lifeUrl(c) + '?counts=1').subscribe({
      next: async r => {
        const items = (r.counts || []).map((x: any) => ({ label: x.label, count: x.count }));
        const ok = await zConfirm(i18nT('{0} is deleted with everything in it. A backup is made first and downloaded to this computer; the server keeps a copy too.', [c.name]), {
          title: i18nT('Delete {0}?', [c.name]), ok: 'Delete company', danger: true, items, typed: c.name,
          typedLabel: i18nT('Type the company name "{0}" to confirm', [c.name]),
          note: i18nT('Every user loses access to it at once (their logins stay). The name is free again straight away. Only the ZEO server administrator can bring it back within {0} days.', [r.keep_days || 30]),
        });
        if (!ok) { return; }
        this.busyLife = 'Making the backup and deleting the company…';
        this.http.post<any>(this.lifeUrl(c, 'delete'), { confirm: c.name }).subscribe({
          next: d => {
            this.busyLife = '';
            this.lifeMsg = d.detail || i18nT('{0} was deleted.', [c.name]);
            if (this.last === c.schema_name) { this.last = ''; try { localStorage.removeItem('zeo:lastCompany'); } catch { /* */ } }
            this.download(d.download, d.file_name);
            this.load(true);
          },
          error: (e: HttpErrorResponse) => { this.busyLife = ''; this.lifeErr = i18nT(e.error?.detail || 'The company could not be deleted. Nothing was changed.'); },
        });
      },
      error: (e: HttpErrorResponse) => { this.lifeErr = i18nT(e.error?.detail || 'Not done. Try again.'); },
    });
  }

  /** v1.67.1 (companies): the backup of a deleted company / database goes to the browser at once (the server keeps a copy). */
  download(url: string, name: string): void {
    if (!url) { return; }
    this.http.get(`${environment.apiBaseUrl}${url}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name || 'zeo-backup.zip'; a.setAttribute('data-backup-download', '');
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      },
      error: () => { this.lifeErr = i18nT('The backup could not be downloaded. The server keeps its copy – ask your ZEO administrator.'); },
    });
  }

  dbLabel(m: MakeJob): string { return (m.acc.databases || []).find(d => d.key === m.db)?.label || ''; }

  openPopuss(): void {
    const ref = this.dialog.open(SchemaCreationComponent, { width: '80%', height: '700px' });
    ref.afterClosed().subscribe(() => this.load());
  }
}
