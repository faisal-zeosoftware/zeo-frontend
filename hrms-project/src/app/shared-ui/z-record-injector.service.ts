import { ApplicationRef, ComponentRef, EnvironmentInjector, Injectable, NgZone, createComponent } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ZRecordService, RecordCtx } from './z-record.service';
import { ZRecordPanelComponent } from './z-record-panel.component';
import { appForUrl } from './menu-config';

/** Form containers the screens use: Angular Material dialogs, the screens' own pop-ups and the HR module dialogs. */
const CONTAINERS = 'mat-dialog-container, .modal-content, .hr-modal-box, .modal-dialog-custom';
const FOOTERS = '.modal-footer, .modal-footer-custom, mat-dialog-actions, [mat-dialog-actions], .mat-mdc-dialog-actions, .hr-modal-foot, .dialog-actions, .form-actions, .button-group, .btn-group-footer';
const SKIP = '.zl-modal, .zd-modal, z-record-panel, .cdk-overlay-pane .mat-mdc-select-panel, .swal2-container, [data-zr-off]';

interface Mounted { ref: ComponentRef<ZRecordPanelComponent>; host: HTMLElement; box: HTMLElement; }

/**
 * Puts the record panel (extra fields, notes, activities, files, history) inside every form on every screen:
 * pop-up create / edit forms, Material dialogs and detail pages whose address ends in a record id.
 * The panel finds its record from the row the user clicked or the record the screen loaded / saved.
 */
@Injectable({ providedIn: 'root' })
export class ZRecordInjector {
  private mounted: Mounted[] = [];
  private obs?: MutationObserver;
  private queued = new Set<HTMLElement>();
  private timer: any;
  private pageTimer: any;

  constructor(private rec: ZRecordService, private appRef: ApplicationRef, private env: EnvironmentInjector,
              private zone: NgZone, private router: Router) {}

  start(): void {
    if (this.obs) { return; }
    this.zone.runOutsideAngular(() => {
      this.obs = new MutationObserver(muts => {
        for (const m of muts) {
          m.addedNodes.forEach(n => {
            if (!(n instanceof HTMLElement)) { return; }
            if (n.matches?.(CONTAINERS)) { this.queued.add(n); }
            n.querySelectorAll?.(CONTAINERS).forEach(e => this.queued.add(e as HTMLElement));
          });
          if (m.removedNodes.length) { this.cleanup(); }
        }
        if (this.queued.size) { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 350); }
      });
      this.obs.observe(document.body, { childList: true, subtree: true });
    });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      clearTimeout(this.pageTimer);
      this.pageTimer = setTimeout(() => this.page(), 1800);
    });
  }

  private flush(): void {
    const list = [...this.queued]; this.queued.clear();
    for (const box of list) { this.tryForm(box, 0); }
  }

  /** A pop-up / dialog appeared: mount the panel when it is a record form. */
  private tryForm(box: HTMLElement, attempt: number): void {
    if (!box.isConnected || box.closest(SKIP) || box.querySelector('z-record-panel') || this.mounted.some(m => m.box === box)) { return; }
    // an outer container already has a panel (nested modal-content inside mat-dialog)
    if (this.mounted.some(m => m.box.contains(box) || box.contains(m.box))) { return; }
    const inputs = Array.from(box.querySelectorAll('input, select, textarea, mat-select'))
      .filter(i => !(i as HTMLInputElement).type || !['file', 'hidden', 'search', 'checkbox'].includes((i as HTMLInputElement).type));
    const ctx = this.rec.latest(6000);
    const looksLikeForm = inputs.length >= 2 || !!box.querySelector('form');
    const isConfirm = /are you sure|confirm|delete\b/i.test((box.textContent || '').slice(0, 300)) && inputs.length < 2;
    if (isConfirm || /bulk|upload|import/i.test((box.querySelector('h1,h2,h3,h4,h5,.modal-title')?.textContent || ''))) { return; }
    if (!looksLikeForm && !(ctx && ctx.id && ctx.source !== 'create')) {
      // content may still be loading
      if (attempt < 3) { setTimeout(() => this.tryForm(box, attempt + 1), 600); }
      return;
    }
    let endpoint = ctx?.endpoint || null;
    let id = ctx && ctx.source !== 'create' ? ctx.id : null;
    if (!ctx) { endpoint = this.rec.screenEndpoint(); id = null; }
    if (!endpoint) { return; }
    this.mount(box, endpoint, id, 'form');
  }

  /** A page whose address ends in a record id (e.g. employee details): panel at the end of the page. */
  private page(): void {
    // …/employee-details/12 or …/employee-details/12/details
    const m = /\/(\d+)(\/[a-z-]+)?\/?$/i.exec(location.pathname);
    if (!m) { return; }
    const ctx: RecordCtx | null = this.rec.forId(m[1]);
    if (!ctx) { return; }
    const outlet = document.querySelector('.sub-content-area router-outlet, main router-outlet, router-outlet');
    let host = outlet?.nextElementSibling as HTMLElement | null;
    // the deepest routed component that holds the page
    const deep = Array.from(document.querySelectorAll('router-outlet')).pop()?.nextElementSibling as HTMLElement | null;
    host = deep || host;
    if (!host || host.querySelector('z-record-panel') || this.mounted.some(x => x.box === host)) { return; }
    this.mount(host, ctx.endpoint, ctx.id, 'page', true);
  }

  private mount(box: HTMLElement, endpoint: string, id: string | null, mode: 'form' | 'page', append = false): void {
    this.zone.run(() => {
      const host = document.createElement('z-record-panel');
      host.className = 'zr-host';
      host.setAttribute('data-record', `${endpoint}#${id ?? 'new'}`);
      const footer = append ? null : this.footerOf(box);
      if (footer && footer.parentElement) { footer.parentElement.insertBefore(host, footer); }
      else {
        const body = append ? box : (box.querySelector('.modal-body, .modal-body-custom, mat-dialog-content, .mat-mdc-dialog-content, .hr-modal-body, form') as HTMLElement | null) || box;
        body.appendChild(host);
      }
      const ref = createComponent(ZRecordPanelComponent, { environmentInjector: this.env, hostElement: host });
      ref.setInput('endpoint', endpoint);
      ref.setInput('id', id);
      ref.setInput('mode', mode);
      ref.setInput('host', box);
      ref.setInput('screenName', appForUrl(location.pathname)?.label ? `${appForUrl(location.pathname)!.label} · ${this.title(box)}` : this.title(box));
      this.appRef.attachView(ref.hostView);
      ref.changeDetectorRef.detectChanges();
      this.mounted.push({ ref, host, box });
    });
  }

  private footerOf(box: HTMLElement): HTMLElement | null {
    const all = Array.from(box.querySelectorAll(FOOTERS)) as HTMLElement[];
    if (all.length) { return all[all.length - 1]; }
    // last row of buttons that holds a Save / Submit / Update button
    const btns = Array.from(box.querySelectorAll('button')) as HTMLElement[];
    const save = btns.reverse().find(b => /^(save|submit|update|create|apply|send|confirm|add)\b/i.test((b.textContent || '').trim()));
    if (save) {
      let row: HTMLElement | null = save.parentElement;
      while (row && row !== box && row.parentElement !== box && row.querySelectorAll('input,select,textarea').length) { row = row.parentElement; }
      return row && row !== box ? row : save.parentElement;
    }
    return null;
  }

  private title(box: HTMLElement): string {
    const h = box.querySelector('h1, h2, h3, h4, .modal-title, [mat-dialog-title]');
    return (h?.textContent || document.title || '').trim().slice(0, 80);
  }

  private cleanup(): void {
    for (const m of [...this.mounted]) {
      if (!m.box.isConnected || !m.host.isConnected) {
        this.appRef.detachView(m.ref.hostView);
        m.ref.destroy();
        m.host.remove();
        this.mounted = this.mounted.filter(x => x !== m);
      }
    }
  }
}
