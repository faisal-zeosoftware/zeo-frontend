/**
 * v1.39.0 – Form layout designer: drag and drop the fields of any form (standard fields and the designer's extra fields),
 * set their width, hide optional ones and add section titles – saved per screen for the whole company (Chatter FormLayout).
 *
 * It works on the rendered form, so every screen gets it without changing the screen: a "field block" is the smallest element
 * that holds one labelled control (a bootstrap `.col-*`, a `mat-form-field`, a kit `za-field`, a designer `.zf`). Blocks are
 * keyed by the control's name (`name:leave_type`), else by the label text (`label:Start date`); the designer's extra fields are
 * `extra:<field name>`. The saved layout is re-applied whenever the form is (re)rendered.
 */
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { i18nT } from './i18n-core';

export interface LayoutBlock { key: string; width: string; hidden: boolean; }
export interface FormLayout { blocks: LayoutBlock[]; sections: { before: string; title: string }[]; }

const BLOCK = '[class*="col-"], [data-zfa-cols], [class*="zfa-w-"], mat-form-field, za-field, z-field-input, .zf, .form-group, .zr-field, .er-f, .ex-form > label, .hs-form > label, .zp-form > label, label:has(> input, > select, > textarea)';
const CONTROL = 'input:not([type=hidden]):not([hidden]), select, textarea, mat-select, mat-checkbox, mat-radio-group, z-field-input, [contenteditable]';
const WIDTHS: { k: string; l: string }[] = [{ k: '', l: 'Auto' }, { k: 'quarter', l: '¼' }, { k: 'third', l: '⅓' }, { k: 'half', l: '½' }, { k: 'full', l: 'Full' }];
const COL_CLASS = /\bcol(-(sm|md|lg|xl|xxl))?-\d+\b/g;

interface Live { box: HTMLElement; screen: string; layout: FormLayout | null; applying: boolean; designing: boolean; obs?: MutationObserver; }

@Injectable({ providedIn: 'root' })
export class ZFormArrangerService {
  private cache = new Map<string, Promise<{ layout: FormLayout | null; can_design: boolean }>>();
  private live: Live[] = [];

  constructor(private http: HttpClient, private zone: NgZone) {}

  private get api(): string { return environment.apiBaseUrl; }
  private get schema(): string { return localStorage.getItem('selectedSchema') || ''; }

  load(screen: string, fresh = false): Promise<{ layout: FormLayout | null; can_design: boolean }> {
    if (fresh || !this.cache.has(screen)) {
      this.cache.set(screen, firstValueFrom(this.http.get<any>(`${this.api}/chatter/api/layout/`, { params: { schema: this.schema, screen } }))
        .then(r => ({ layout: r?.layout && Array.isArray(r.layout.blocks) ? r.layout : null, can_design: !!r?.can_design }))
        .catch(() => ({ layout: null, can_design: false })));
    }
    return this.cache.get(screen)!;
  }

  async save(screen: string, layout: FormLayout): Promise<void> {
    await firstValueFrom(this.http.put(`${this.api}/chatter/api/layout/`, { screen, data: layout }, { params: { schema: this.schema } }));
    this.cache.set(screen, Promise.resolve({ layout, can_design: true }));
  }

  async reset(screen: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/chatter/api/layout/`, { params: { schema: this.schema, screen } }));
    this.cache.set(screen, Promise.resolve({ layout: null, can_design: true }));
  }

  // ------------------------------------------------------------------ blocks
  /** The form containers of a box: parents that hold at least two field blocks. */
  containers(box: HTMLElement): HTMLElement[] {
    const seen = new Set<HTMLElement>();
    for (const b of this.blocksIn(box)) { if (b.parentElement) { seen.add(b.parentElement); } }
    return Array.from(seen).filter(c => this.blocksOf(c).length >= 2);
  }

  /** The real controls of an element (never the width select of a design handle). */
  private ctls(el: HTMLElement): HTMLElement[] {
    return Array.from(el.querySelectorAll<HTMLElement>(CONTROL)).filter(c => !c.closest('.zfa-handle, .zfa-bar'));
  }
  private ctlOf(el: HTMLElement): HTMLElement | undefined { return this.ctls(el)[0]; }

  private blocksIn(box: HTMLElement): HTMLElement[] {
    const out: HTMLElement[] = [];
    this.ctls(box).forEach(ctl => {
      if (ctl.closest('z-record-panel .zr-chatter, .zl-bar, .zl-modal, .zd-modal, .zfa-bar, thead, .mat-mdc-select-panel')) { return; }
      const b = this.blockOf(ctl, box);
      if (b && !out.includes(b)) { out.push(b); }
    });
    return out;
  }

  /** The smallest ancestor of a control that is a field block (holds the label too), inside the box. */
  private blockOf(ctl: HTMLElement, box: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = ctl;
    while (el && el !== box) {
      if (el.matches('.zf') && el.parentElement?.tagName === 'Z-FIELD-INPUT') { el = el.parentElement; continue; }   // the designer field's host is the block
      if (el.matches(BLOCK) && this.ctls(el).length <= 2) { return el; }
      el = el.parentElement;
    }
    // no recognised wrapper: the control's parent when it also holds a label
    const p = ctl.parentElement;
    return p && p !== box && p.querySelector('label') ? p : null;
  }

  blocksOf(container: HTMLElement): HTMLElement[] {
    return Array.from(container.children).filter(c => c instanceof HTMLElement && (c.matches(BLOCK) || c.classList.contains('zfa-extra')) && !!this.ctlOf(c)) as HTMLElement[];
  }

  /** Text of a block's label; for a <label> that wraps its control, only the label's own text (not the options). */
  private labelText(b: HTMLElement, raw = false): string {
    let lab = b.matches('label') ? b : b.querySelector<HTMLElement>('label, .zf-label, mat-label');
    if (lab && lab.closest('.zfa-handle')) { lab = null; }
    if (!lab || !(lab.textContent || '').trim()) { lab = b.querySelector<HTMLElement>('mat-checkbox, mat-radio-group, .ck, .form-check') || lab; }
    if (!lab) { return ''; }
    let own = ''; lab.childNodes.forEach(n => { if (n.nodeType === 3) { own += n.textContent; } else if ((n as HTMLElement).matches && !(n as HTMLElement).matches(CONTROL + ', .zfa-handle')) { own += (n as HTMLElement).textContent; } });
    const t = (own.trim() ? own : lab.textContent || '').replace(/\s+/g, ' ').trim();
    return raw ? t : t.replace(/\*/g, '').trim();
  }

  keyOf(b: HTMLElement): string {
    const x = b.getAttribute('data-zfa-key'); if (x) { return x; }
    const ex = b.getAttribute('data-field') || (b.querySelector('z-field-input') as HTMLElement | null)?.getAttribute('data-field');
    if (b.classList.contains('zf') || b.closest('z-record-panel')) { if (ex) { return 'extra:' + ex; } }
    if (b.tagName === 'ZA-FIELD' && ex) { return 'name:' + ex; }
    const ctl = this.ctlOf(b);
    const name = ctl?.getAttribute('name') || ctl?.getAttribute('formcontrolname') || ctl?.getAttribute('ng-reflect-name') || ctl?.id;
    if (name && !/^mat-|^cdk-|^\d/.test(name)) { return 'name:' + name; }
    const lab = this.labelText(b);
    if (lab) { return 'label:' + lab.slice(0, 60); }
    return '';
  }

  labelOf(b: HTMLElement): string {
    return this.labelText(b) || this.keyOf(b).replace(/^[a-z]+:/, '').replace(/_/g, ' ');
  }

  private required(b: HTMLElement): boolean {
    return !!b.querySelector('[required], .required-star, .zf-req') || /\*\s*$/.test(this.labelText(b, true));
  }

  // ------------------------------------------------------------------ apply
  /** Apply the saved layout of a screen to a form box (called by the record injector when a form appears, and after changes). */
  async apply(box: HTMLElement, screen: string): Promise<void> {
    let L = this.live.find(x => x.box === box);
    if (!L) { L = { box, screen, layout: null, applying: false, designing: false }; this.live.push(L); this.watch(L); }
    const r = await this.load(screen);
    L.layout = r.layout;
    if (!L.layout || L.designing) { return; }
    this.applyNow(L);
  }

  private applyNow(L: Live): void {
    if (!L.layout || L.applying || !L.box.isConnected) { return; }
    L.applying = true;
    try {
      const containers = this.containers(L.box);
      if (!containers.length) { return; }
      const main = containers.reduce((a, b) => this.blocksOf(b).length >= this.blocksOf(a).length ? b : a);
      this.remember(main);
      // extra fields of the record panel can be placed among the standard ones
      const panel = L.box.querySelector('z-record-panel') as HTMLElement | null;
      const extras = panel ? Array.from(panel.querySelectorAll<HTMLElement>('.zr-grid > z-field-input, .zr-grid > .zf')) : [];
      const all = new Map<string, HTMLElement>();
      for (const c of containers) { for (const b of this.blocksOf(c)) { const k = this.keyOf(b); if (k && !all.has(k)) { all.set(k, b); } } }
      for (const e of extras) { const k = 'extra:' + (e.getAttribute('data-field') || ''); if (k !== 'extra:' && !all.has(k)) { all.set(k, e); } }
      const order = L.layout.blocks;
      const keys = order.map(b => b.key);
      // move blocks that are in the layout into the main container, in order; the rest keep their place after them
      let anchor: Node | null = null;
      for (const spec of order) {
        const b = all.get(spec.key); if (!b) { continue; }
        const fromPanel = spec.key.startsWith('extra:');
        if (fromPanel) { b.classList.add('zfa-extra'); b.setAttribute('data-zfa-key', spec.key); }
        if (b.parentElement !== main || (anchor ? b.previousElementSibling !== anchor : main.firstElementChild !== b)) {
          if (anchor) { (anchor as HTMLElement).after(b); } else { main.prepend(b); }
        }
        anchor = b;
        this.width(b, spec.width);
        this.target(b).classList.toggle('zfa-hidden', !!spec.hidden && !this.required(b));
      }
      // section titles
      main.querySelectorAll('.zfa-section').forEach(s => s.remove());
      for (const s of L.layout.sections || []) {
        const b = all.get(s.before); if (!b || !s.title) { continue; }
        const h = document.createElement('div'); h.className = 'zfa-section'; h.textContent = i18nT(s.title); b.before(h);
      }
      // blocks not in the layout keep their width
      for (const [k, b] of all) { if (!keys.includes(k)) { this.target(b).classList.remove('zfa-hidden'); } }
      main.classList.add('zfa-main');
    } finally { L.applying = false; }
  }

  /** Stamp the built order on the main container's children once, so "Reset to default" can put them back. */
  private remember(main: HTMLElement): void {
    if (main.hasAttribute('data-zfa-built')) { return; }
    main.setAttribute('data-zfa-built', '1');
    Array.from(main.children).forEach((c, i) => c.setAttribute('data-zfa-orig', String(i)));
  }
  private restore(main: HTMLElement): void {
    const kids = Array.from(main.children).filter(c => c.hasAttribute('data-zfa-orig')).sort((a, b) => +a.getAttribute('data-zfa-orig')! - +b.getAttribute('data-zfa-orig')!);
    for (const k of kids) { main.appendChild(k); }
    main.classList.remove('zfa-main');
  }

  private width(block: HTMLElement, w: string): void {
    const b = this.target(block);
    const wasWide = b.getAttribute('data-zfa-wide') ?? (b.classList.contains('wide') ? '1' : '0');
    b.setAttribute('data-zfa-wide', wasWide);
    b.classList.remove('zfa-w-quarter', 'zfa-w-third', 'zfa-w-half', 'zfa-w-full');
    const prev = b.getAttribute('data-zfa-cols');
    if (prev === null && /\bcol-/.test(b.className)) { b.setAttribute('data-zfa-cols', (b.className.match(COL_CLASS) || []).join(' ')); }
    if (w) {
      b.className = b.className.replace(COL_CLASS, '').replace(/\s+/g, ' ').trim();
      b.classList.add('zfa-w-' + w);
      b.classList.toggle('wide', w === 'full');
    } else {
      if (prev) { prev.split(' ').forEach(c => c && b.classList.add(c)); }
      b.classList.toggle('wide', wasWide === '1');
    }
  }

  /** Re-apply when the form re-renders (Angular re-creates the blocks). */
  private watch(L: Live): void {
    this.zone.runOutsideAngular(() => {
      let t: any;
      L.obs = new MutationObserver(muts => {
        if (L.applying || L.designing) { return; }
        if (!L.box.isConnected) { L.obs?.disconnect(); this.live = this.live.filter(x => x !== L); return; }
        if (muts.some(m => m.addedNodes.length)) { clearTimeout(t); t = setTimeout(() => this.applyNow(L), 120); }
      });
      L.obs.observe(L.box, { childList: true, subtree: true });
    });
  }

  // ------------------------------------------------------------------ design mode
  /** Open the layout designer on a form box: handles on every block, drag to move, width and hide, sections, save / reset. */
  async design(box: HTMLElement, screen: string): Promise<void> {
    let L = this.live.find(x => x.box === box);
    if (!L) { L = { box, screen, layout: null, applying: false, designing: false }; this.live.push(L); this.watch(L); }
    if (L.designing) { return; }
    const r = await this.load(screen, true);
    L.layout = r.layout; L.designing = true;
    const containers = this.containers(box);
    if (!containers.length) { L.designing = false; alert(i18nT('No fields to arrange on this form.')); return; }
    const main = containers.reduce((a, b) => this.blocksOf(b).length >= this.blocksOf(a).length ? b : a);
    this.remember(main);
    if (L.layout) { this.applyNow(L); }
    main.classList.add('zfa-main', 'zfa-design');
    // bring the panel's extra fields in as draggable blocks (at the end, unless the layout placed them)
    const panel = box.querySelector('z-record-panel') as HTMLElement | null;
    const extras = panel ? Array.from(panel.querySelectorAll<HTMLElement>('.zr-grid > z-field-input, .zr-grid > .zf')) : [];
    for (const e of extras) {
      const k = 'extra:' + (e.getAttribute('data-field') || '');
      if (k === 'extra:' || e.parentElement === main) { continue; }
      e.classList.add('zfa-extra'); e.setAttribute('data-zfa-key', k); e.setAttribute('data-zfa-home', '1'); main.appendChild(e);
    }
    const state = { sections: (L.layout?.sections || []).map(s => ({ ...s })) };
    const current = (): LayoutBlock[] => this.blocksOf(main).map(b => ({ key: this.keyOf(b), width: this.widthOf(b), hidden: this.target(b).classList.contains('zfa-hidden') })).filter(b => b.key);
    const decorate = () => {
      main.querySelectorAll('.zfa-handle').forEach(h => h.remove());
      for (const b of this.blocksOf(main)) {
        this.target(b).setAttribute('draggable', 'true');
        const h = document.createElement('div'); h.className = 'zfa-handle';
        const req = this.required(b);
        h.innerHTML = `<span class="zfa-grip" title="${i18nT('Drag to move')}">⋮⋮</span><span class="zfa-name">${this.labelOf(b)}${req ? ' *' : ''}</span>`
          + `<select class="zfa-w" title="${i18nT('Width')}">${WIDTHS.map(w => `<option value="${w.k}" ${this.widthOf(b) === w.k ? 'selected' : ''}>${w.l}</option>`).join('')}</select>`
          + (req ? '' : `<button type="button" class="zfa-eye" title="${i18nT('Hide / show')}">${this.target(b).classList.contains('zfa-hidden') ? '🙈' : '👁'}</button>`)
          + `<button type="button" class="zfa-sec" title="${i18nT('Section title above')}">¶</button>`;
        h.querySelector('.zfa-w')!.addEventListener('change', ev => this.width(b, (ev.target as HTMLSelectElement).value));
        h.querySelector('.zfa-eye')?.addEventListener('click', () => { this.target(b).classList.toggle('zfa-hidden'); decorate(); });
        h.querySelector('.zfa-sec')!.addEventListener('click', () => {
          const k = this.keyOf(b); const ex = state.sections.find(s => s.before === k);
          const t = prompt(i18nT('Section title (empty removes it)'), ex?.title || '');
          if (t === null) { return; }
          state.sections = state.sections.filter(s => s.before !== k);
          if (t.trim()) { state.sections.push({ before: k, title: t.trim() }); }
          sections();
        });
        this.target(b).prepend(h);
      }
    };
    const sections = () => {
      main.querySelectorAll('.zfa-section').forEach(s => s.remove());
      for (const s of state.sections) {
        const b = this.blocksOf(main).find(x => this.keyOf(x) === s.before); if (!b) { continue; }
        const h = document.createElement('div'); h.className = 'zfa-section'; h.textContent = s.title; b.before(h);
      }
    };
    // drag and drop
    let dragging: HTMLElement | null = null;
    const onStart = (ev: DragEvent) => { const b = (ev.target as HTMLElement).closest('.zfa-main > *') as HTMLElement; if (!b || !this.blocksOf(main).includes(b)) { return; } dragging = b; this.target(b).classList.add('zfa-dragging'); ev.dataTransfer?.setData('text/plain', this.keyOf(b)); ev.dataTransfer!.effectAllowed = 'move'; };
    const onOver = (ev: DragEvent) => {
      if (!dragging) { return; } ev.preventDefault();
      const over = (ev.target as HTMLElement).closest('.zfa-main > *') as HTMLElement | null;
      if (!over || over === dragging || !this.blocksOf(main).includes(over)) { return; }
      const r = over.getBoundingClientRect();
      const before = (ev.clientX - r.left) / r.width < 0.5 && (r.width < main.clientWidth * 0.9 || (ev.clientY - r.top) / r.height < 0.5);
      if (before) { over.before(dragging); } else { over.after(dragging); }
    };
    const onEnd = () => { if (dragging) { this.target(dragging).classList.remove('zfa-dragging'); } dragging = null; sections(); };
    main.addEventListener('dragstart', onStart); main.addEventListener('dragover', onOver); main.addEventListener('drop', ev => ev.preventDefault()); main.addEventListener('dragend', onEnd);
    // toolbar
    const bar = document.createElement('div'); bar.className = 'zfa-bar';
    bar.innerHTML = `<b>${i18nT('Arrange fields')}</b><span>${i18nT('Drag a field to move it; set its width, hide optional fields, add section titles. Saved for the whole company.')}</span>`
      + `<span class="zfa-grow"></span><button type="button" class="zfa-btn zfa-reset">${i18nT('Reset to default')}</button><button type="button" class="zfa-btn">${i18nT('Cancel')}</button><button type="button" class="zfa-btn primary">${i18nT('Save layout')}</button>`;
    main.before(bar);
    const finish = async (mode: 'save' | 'cancel' | 'reset') => {
      try {
        if (mode === 'save') { await this.save(screen, { blocks: current(), sections: state.sections.filter(s => current().some(b => b.key === s.before)) }); }
        if (mode === 'reset') { await this.reset(screen); }
      } catch (e: any) { alert(e?.error?.detail || i18nT('The layout could not be saved.')); return; }
      main.removeEventListener('dragstart', onStart); main.removeEventListener('dragover', onOver); main.removeEventListener('dragend', onEnd);
      main.querySelectorAll('.zfa-handle, .zfa-section').forEach(h => h.remove());
      main.querySelectorAll<HTMLElement>('[draggable]').forEach(b => b.removeAttribute('draggable'));
      main.classList.remove('zfa-design'); bar.remove();
      // extra fields go back to the panel unless the layout keeps them
      const keep = new Set((mode === 'save' ? current() : (L!.layout?.blocks || [])).map(b => b.key));
      for (const e of Array.from(main.querySelectorAll<HTMLElement>('[data-zfa-home]'))) {
        if (mode === 'reset' || !keep.has(e.getAttribute('data-zfa-key') || '')) { panel?.querySelector('.zr-grid')?.appendChild(e); e.classList.remove('zfa-extra', 'zfa-hidden'); this.width(e, ''); }
      }
      L!.designing = false;
      const r2 = await this.load(screen);
      L!.layout = r2.layout;
      if (mode === 'reset' || (mode === 'cancel' && !L!.layout)) { for (const b of this.blocksOf(main)) { this.width(b, ''); this.target(b).classList.remove('zfa-hidden'); } this.restore(main); }
      if (L!.layout) { this.applyNow(L!); }
    };
    bar.querySelector('.zfa-reset')!.addEventListener('click', () => { if (confirm(i18nT('Put the form back as built?'))) { finish('reset'); } });
    bar.querySelectorAll('.zfa-btn')[1].addEventListener('click', () => finish('cancel'));
    bar.querySelector('.zfa-btn.primary')!.addEventListener('click', () => finish('save'));
    decorate(); sections();
  }

  /** The element that carries the width class and the handle (a kit za-field is display: contents – its first child is the grid item). */
  private target(b: HTMLElement): HTMLElement { return b.tagName === 'ZA-FIELD' && b.firstElementChild ? b.firstElementChild as HTMLElement : b; }

  private widthOf(b: HTMLElement): string {
    const m = this.target(b).className.match(/zfa-w-(quarter|third|half|full)/);
    return m ? m[1] : '';
  }
}
