import { AfterViewInit, Directive, NgZone, OnDestroy, Optional, Self } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { DirEmp, ZListService } from './z-list.service';
import { orgKeys } from './z-org-keys';

/**
 * Adds "Pick by Branch / Department / Designation / Category" to every multi-select
 * dropdown that lists employees (assign shift, policy, calendar, allocation, members ...).
 * It only ticks options in the dropdown, so each screen saves exactly as before.
 */
type Org = string;   // v1.12.0: branch, department, designation, category + the org fields switched on (z-org-keys.ts)

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
}

@Directive({ selector: 'mat-select[multiple]', standalone: true })
export class ZOrgPickDirective implements AfterViewInit, OnDestroy {
  private dir: DirEmp[] = [];
  private subs: Subscription[] = [];

  constructor(@Optional() @Self() private sel: MatSelect, private z: ZListService, private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (!this.sel) { return; }
    this.subs.push(this.z.directory().subscribe(d => { this.dir = d || []; }));
    this.subs.push(this.sel.openedChange.subscribe(open => { if (open) { setTimeout(() => this.decorate(), 0); } }));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  /** Employee behind each option (by id value, code or name); null when the list is not employees. */
  private matchOptions(): (DirEmp | null)[] | null {
    const opts = this.sel.options?.toArray() || [];
    if (opts.length < 2 || !this.dir.length) { return null; }
    const byId = new Map(this.dir.map(e => [e.id, e]));
    const byCode = new Map(this.dir.map(e => [e.code.toLowerCase(), e]));
    const byName = new Map(this.dir.map(e => [e.name.toLowerCase(), e]));
    const texts = opts.map(o => (o.viewValue || '').trim().toLowerCase());
    const res = opts.map((o, i) => {
      const t = texts[i];
      const code = t.match(/emp[-_ ]?\d+|[a-z]{2,4}-?\d{3,}/i);
      if (code && byCode.has(code[0].toLowerCase())) { return byCode.get(code[0].toLowerCase())!; }
      const name = t.replace(/\(.*?\)/g, '').replace(/[-–|].*$/, '').trim();
      if (byName.has(name)) { return byName.get(name)!; }
      for (const [n, e] of byName) { if (n.length > 4 && t.includes(n)) { return e; } }
      const v = Number(o.value);
      const e = byId.get(v);
      return e && t && (t.includes(e.name.split(' ')[0].toLowerCase()) || t.includes(e.code.toLowerCase())) ? e : null;
    });
    const hits = res.filter(Boolean).length;
    return hits >= Math.max(2, opts.length * 0.6) ? res : null;
  }

  private decorate(): void {
    const panel = (this.sel as any).panel?.nativeElement as HTMLElement | undefined;
    if (!panel || panel.querySelector('.zo-bar')) { return; }
    const emps = this.matchOptions();
    if (!emps) { return; }
    const present = emps.filter(Boolean) as DirEmp[];
    const values = (k: Org) => Array.from(new Set(present.map(e => (e as any)[k]).filter(Boolean))).sort();
    const bar = document.createElement('div');
    bar.className = 'zo-bar';
    bar.innerHTML = `<div class="zo-h">Pick employees by</div><div class="zo-grid">${orgKeys().map(o => `
      <label><span>${o.label}</span><select data-k="${o.key}"><option value="">Any</option>${values(o.key).map(v => `<option>${esc(v)}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="zo-act"><span class="zo-n"></span><button type="button" data-add>Add matching</button><button type="button" data-only>Only matching</button><button type="button" data-none>Clear</button></div>`;
    panel.insertBefore(bar, panel.firstChild);
    const crit = () => {
      const c: Partial<Record<Org, string>> = {};
      bar.querySelectorAll('select').forEach(s => { const v = (s as HTMLSelectElement).value; if (v) { c[(s as HTMLSelectElement).dataset['k'] as Org] = v; } });
      return c;
    };
    const fits = (e: DirEmp | null, c: Partial<Record<Org, string>>) => !!e && Object.entries(c).every(([k, v]) => (e as any)[k] === v);
    const count = () => {
      const c = crit();
      const n = emps.filter(e => fits(e, c)).length;
      (bar.querySelector('.zo-n') as HTMLElement).textContent = Object.keys(c).length ? `${n} match` : `${present.length} employees`;
    };
    count();
    bar.addEventListener('mousedown', e => e.stopPropagation());
    bar.addEventListener('keydown', e => e.stopPropagation());
    bar.addEventListener('change', count);
    bar.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (!b) { return; }
      const c = crit();
      const opts = this.sel.options.toArray();
      this.zone.run(() => {
        opts.forEach((o, i) => {
          if (o.disabled) { return; }
          const m = fits(emps[i], c);
          if (b.hasAttribute('data-none')) { if (o.selected) { o.deselect(); } return; }
          if (m && !o.selected) { o.select(); }
          if (b.hasAttribute('data-only') && !m && o.selected) { o.deselect(); }
        });
      });
    });
  }
}
