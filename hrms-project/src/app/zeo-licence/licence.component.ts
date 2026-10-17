import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TPipe, ZDatePipe, i18nT } from '../shared-ui/i18n.service';

/** v1.28.0 – Settings → Licence (Enterprise server, server administrators): installation ID, the licence, limits and
 * usage, upload of the .zeolic file from Adept, how to renew. */
const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);

@Component({
  selector: 'z-licence',
  standalone: true,
  imports: [CommonModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zl2">
    <div class="zl2-head"><h1>{{ 'Licence' | t }}</h1>
      <span class="zl2-st" *ngIf="st" [ngClass]="st.status">{{ statusText(st.status) }}</span></div>
    <div class="zl2-err" *ngIf="error" role="alert">{{ error }}</div>
    <ng-container *ngIf="st">
      <p class="zl2-msg" *ngIf="st.message" [class.bad]="st.read_only">{{ st.message }}</p>
      <div class="zl2-grid">
        <section class="zl2-card">
          <h2>{{ 'This installation' | t }}</h2>
          <div class="zl2-id"><code>{{ st.installation_id }}</code>
            <button type="button" class="zl2-btn" (click)="copy(st.installation_id)">{{ copied ? ('Copied' | t) : ('Copy' | t) }}</button></div>
          <p class="zl2-muted">{{ 'Adept writes this ID into the licence file – a file is valid on this server only.' | t }}</p>
          <dl *ngIf="st.licence as l">
            <dt>{{ 'Client' | t }}</dt><dd>{{ l.client }}</dd>
            <dt>{{ 'Licence' | t }}</dt><dd>{{ l.licence_id }}</dd>
            <dt>{{ 'Valid' | t }}</dt><dd>{{ l.valid_from | zdate }} – {{ l.valid_until | zdate }}<span class="zl2-muted" *ngIf="st.days_left !== null"> · {{ st.days_left >= 0 ? ('{0} days left' | t:st.days_left) : ('ended {0} days ago' | t:(-st.days_left)) }}</span></dd>
            <dt>{{ 'Apps' | t }}</dt><dd>{{ appsText(l.apps) }}</dd>
            <dt>{{ 'Group features' | t }}</dt><dd>{{ (l.features || []).includes('group') ? ('Yes' | t) : ('No' | t) }}</dd>
          </dl>
          <p class="zl2-muted" *ngIf="!st.licence">{{ 'No licence file yet.' | t }}<span *ngIf="st.problem"> {{ st.problem }}</span></p>
        </section>
        <section class="zl2-card">
          <h2>{{ 'Limits and usage' | t }}</h2>
          <table>
            <tr *ngFor="let k of ['companies', 'employees', 'users']">
              <th>{{ label(k) }}</th>
              <td class="n">{{ st.usage?.[k] ?? '–' }}<span class="zl2-muted"> / {{ st.limits?.[k] ?? ('no limit' | t) }}</span></td>
              <td class="bar"><span [style.width.%]="pct(k)" [class.full]="pct(k) >= 95"></span></td>
            </tr>
          </table>
          <p class="zl2-muted">{{ 'Employees: active employees of every company. Users: logins other than self service.' | t }}</p>
        </section>
      </div>
      <section class="zl2-card">
        <h2>{{ 'Upload the licence file' | t }}</h2>
        <p class="zl2-muted">{{ 'The .zeolic file from Adept. Its signature is checked – a changed file is refused. A new file replaces the old one (renewal, more employees, more apps).' | t }}</p>
        <label class="zl2-drop">
          <input type="file" accept=".zeolic,.txt" (change)="pick($event)">
          <span>{{ file ? file.name : ('Choose the .zeolic file' | t) }}</span>
        </label>
        <div class="zl2-act"><button type="button" class="zl2-btn pri" (click)="upload()" [disabled]="!file || busy">{{ busy ? ('Checking…' | t) : ('Upload' | t) }}</button></div>
        <div class="zl2-ok" *ngIf="ok" role="status">{{ ok }}</div>
      </section>
      <section class="zl2-card">
        <h2>{{ 'Renewal or changes' | t }}</h2>
        <p>{{ 'Enterprise licences come from Adept. Send the installation ID and what you need (renewal date, employees, companies, apps) to' | t }}
          <a [href]="mailto()">{{ st.adept_email }}</a>.</p>
        <p class="zl2-muted">{{ 'After the end date everything works for {0} more days; then ZEO is read-only (view, export, print) until the new file is uploaded. Nothing is deleted.' | t:st.grace_days }}</p>
      </section>
      <section class="zl2-card" *ngIf="st.files?.length">
        <h2>{{ 'Uploaded files' | t }}</h2>
        <table><tr><th>{{ 'Uploaded' | t }}</th><th>{{ 'Client' | t }}</th><th>{{ 'Licence' | t }}</th><th>{{ 'Valid until' | t }}</th><th>{{ 'By' | t }}</th></tr>
          <tr *ngFor="let f of st.files"><td>{{ f.uploaded_at | zdate:'datetime' }}</td><td>{{ f.client }}</td><td>{{ f.licence_id }}</td><td>{{ f.valid_until | zdate }}</td><td>{{ f.by }}</td></tr></table>
      </section>
    </ng-container>
  </div>`,
  styles: [`
.zl2{max-width:1100px;margin:0 auto;padding:24px 28px 60px;font:14px/1.45 Roboto,system-ui,sans-serif;color:#1f2433}
.zl2-head{display:flex;align-items:center;gap:12px}.zl2-head h1{font-size:22px;font-weight:600;margin:0}
.zl2-st{border-radius:999px;padding:3px 12px;font-size:12.5px;font-weight:600;background:#e7f6ef;color:#14603f}
.zl2-st.expiring,.zl2-st.evaluation{background:#fff4dc;color:#7a5200}.zl2-st.grace{background:#fff4dc;color:#7a5200}
.zl2-st.expired,.zl2-st.missing,.zl2-st.not_yet{background:#fdeceb;color:#8c1d18}.zl2-st.off{background:#eeecf6;color:#4a4766}
.zl2-msg{background:#fff8e6;border-radius:8px;padding:10px 14px;margin:14px 0 0}.zl2-msg.bad{background:#fdeceb;color:#8c1d18}
.zl2-err{background:#fdeceb;color:#8c1d18;border-radius:8px;padding:9px 12px;margin:12px 0}.zl2-ok{background:#e7f6ef;color:#14603f;border-radius:8px;padding:9px 12px;margin:10px 0 0}
.zl2-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px;margin-top:16px}
.zl2-card{background:#fff;border:1px solid #e6e4f0;border-radius:12px;padding:16px 20px;margin-top:16px}.zl2-grid .zl2-card{margin-top:0}
.zl2-card h2{font-size:15px;font-weight:600;margin:0 0 10px}
.zl2-id{display:flex;gap:10px;align-items:center}.zl2-id code{font-size:16px;background:#f4f3fb;border-radius:8px;padding:6px 12px;color:#2d238f;letter-spacing:.3px}
.zl2-muted{color:#6b7185;font-size:12.5px}
.zl2 dl{display:grid;grid-template-columns:130px 1fr;gap:6px 12px;margin:12px 0 0}.zl2 dt{color:#6b7185}.zl2 dd{margin:0}
.zl2 table{width:100%;border-collapse:collapse}.zl2 th,.zl2 td{text-align:left;padding:7px 6px;border-bottom:1px solid #f0eef7;font-size:13px}.zl2 th{font-weight:500;color:#4a4766}
.zl2 td.n{white-space:nowrap}.zl2 td.bar{width:40%}.zl2 td.bar span{display:block;height:8px;border-radius:4px;background:#5b4fe0;min-width:2px}.zl2 td.bar span.full{background:#d64550}
.zl2-drop{display:flex;align-items:center;gap:10px;border:1.5px dashed #cfcbe6;border-radius:10px;padding:16px;cursor:pointer;background:#fafafe}
.zl2-drop input{max-width:240px}
.zl2-act{display:flex;justify-content:flex-end;margin-top:10px}
.zl2-btn{border:1px solid #cfcbe6;background:#fff;color:#2d2a4a;border-radius:8px;padding:6px 14px;font:inherit;font-weight:500;cursor:pointer}
.zl2-btn.pri{background:#5b4fe0;border-color:#5b4fe0;color:#fff}.zl2-btn:disabled{opacity:.55;cursor:default}
.zl2-btn:focus-visible{outline:2px solid #5b4fe0;outline-offset:2px}
@media (max-width:700px){.zl2{padding:16px}.zl2-grid{grid-template-columns:1fr}}
`],
})
export class LicenceComponent implements OnInit {
  st: any = null; error = ''; ok = ''; busy = false; file: File | null = null; copied = false;
  private api = `${environment.apiBaseUrl}/licence/api`;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.http.get<any>(`${this.api}/`).subscribe({
      next: r => { this.st = r; this.cd.markForCheck(); },
      error: e => { this.error = e?.error?.detail || T('The licence could not be loaded.'); this.cd.markForCheck(); },
    });
  }
  statusText(s: string): string {
    return T(({ valid: 'Valid', expiring: 'Ends soon', grace: 'Ended – grace period', expired: 'Ended – read-only', evaluation: 'Evaluation',
                missing: 'No licence – read-only', not_yet: 'Starts later', off: 'Not an Enterprise installation' } as any)[s] || s);
  }
  label(k: string): string { return T(({ companies: 'Companies', employees: 'Employees', users: 'Users' } as any)[k]); }
  pct(k: string): number { const l = this.st?.limits?.[k]; const u = this.st?.usage?.[k] || 0; return l ? Math.min(100, Math.round(100 * u / l)) : 0; }
  appsText(a: string[]): string {
    const names: any = { hrms: 'HR', payroll: 'Payroll', projects: 'Projects', crm: 'CRM', property: 'Property', maintenance: 'Maintenance', hse: 'HSE' };
    return (a || []).map(x => names[x] || x).join(', ') || T('HR and Settings');
  }
  copy(v: string): void { try { navigator.clipboard.writeText(v); this.copied = true; setTimeout(() => { this.copied = false; this.cd.markForCheck(); }, 2000); } catch { /* no clipboard */ } }
  mailto(): string {
    const s = encodeURIComponent(T('ZEO Enterprise licence – {0}', this.st?.installation_id || ''));
    return `mailto:${this.st?.adept_email || ''}?subject=${s}`;
  }
  pick(ev: any): void { this.file = ev?.target?.files?.[0] || null; this.ok = ''; this.error = ''; }
  upload(): void {
    if (!this.file) { return; }
    const fd = new FormData(); fd.append('file', this.file);
    this.busy = true; this.error = ''; this.ok = '';
    this.http.post<any>(`${this.api}/upload/`, fd).subscribe({
      next: r => { this.busy = false; this.ok = r.detail; this.file = null; this.load(); },
      error: e => { this.busy = false; this.error = e?.error?.detail || T('The file could not be checked.'); this.cd.markForCheck(); },
    });
  }
}
